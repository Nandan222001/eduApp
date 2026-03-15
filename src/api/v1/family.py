from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, distinct
from datetime import datetime, date, timedelta
from decimal import Decimal
from src.database import get_db
from src.models.user import User
from src.models.family import (
    FamilyGroup, FamilyGroupMember, FamilyCalendarEvent, SiblingComparison,
    FamilyNotificationBatch, FamilyNotificationItem, SharedExpense, ExpenseSplit
)
from src.models.student import Student, Parent, StudentParent
from src.models.assignment import Assignment, Submission
from src.models.examination import Exam, ExamResult, ExamSchedule
from src.models.attendance import Attendance, AttendanceSummary
from src.models.conferences import ConferenceBooking
from src.models.academic import Section, Grade
from src.dependencies.auth import get_current_user
from src.schemas.family import (
    FamilyGroupCreate, FamilyGroupResponse, FamilyGroupMemberCreate,
    FamilyDashboardResponse, ChildOverview, FamilyCalendarEventCreate,
    FamilyCalendarEventResponse, FamilyCalendarResponse,
    PerformanceComparisonResponse, AttendanceComparisonResponse,
    BehaviorComparisonResponse, FamilyNotificationBatchResponse,
    SharedExpenseCreate, SharedExpenseResponse, BulkPaymentRequest,
    BulkPaymentResponse, BulkDownloadRequest, BulkDownloadResponse,
    BulkRSVPRequest, BulkRSVPResponse, ChildDataToggleRequest,
    ChildDataToggleResponse, SiblingComparisonMetric
)

router = APIRouter()


def get_parent_from_user(db: Session, user_id: int, institution_id: int) -> Optional[Parent]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    return db.query(Parent).filter(
        Parent.user_id == user_id,
        Parent.institution_id == institution_id
    ).first()


def get_or_create_family_group(db: Session, parent_id: int, institution_id: int) -> FamilyGroup:
    family_group = db.query(FamilyGroup).filter(
        FamilyGroup.parent_id == parent_id,
        FamilyGroup.institution_id == institution_id,
        FamilyGroup.is_active == True
    ).first()
    
    if not family_group:
        family_group = FamilyGroup(
            institution_id=institution_id,
            parent_id=parent_id,
            name="My Family"
        )
        db.add(family_group)
        db.commit()
        db.refresh(family_group)
        
        students = db.query(Student).join(StudentParent).filter(
            StudentParent.parent_id == parent_id,
            Student.is_active == True
        ).all()
        
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']
        for idx, student in enumerate(students):
            member = FamilyGroupMember(
                family_group_id=family_group.id,
                student_id=student.id,
                display_color=colors[idx % len(colors)]
            )
            db.add(member)
        db.commit()
    
    return family_group


@router.get("/dashboard", response_model=FamilyDashboardResponse)
async def get_family_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user.id, current_user.institution_id)
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent profile not found"
        )
    
    family_group = get_or_create_family_group(db, parent.id, current_user.institution_id)
    
    members = db.query(FamilyGroupMember).filter(
        FamilyGroupMember.family_group_id == family_group.id
    ).all()
    
    children = []
    total_pending_assignments = 0
    total_upcoming_exams = 0
    outstanding_fees = Decimal('0.00')
    
    for member in members:
        student = db.query(Student).filter(Student.id == member.student_id).first()
        if not student:
            continue
        
        section = db.query(Section).filter(Section.id == student.section_id).first()
        grade = db.query(Grade).filter(Grade.id == section.grade_id).first() if section else None
        
        attendance_summary = db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == student.id,
            AttendanceSummary.year == datetime.utcnow().year,
            AttendanceSummary.month == datetime.utcnow().month
        ).first()
        
        pending_assignments = db.query(func.count(Assignment.id)).join(Submission).filter(
            Submission.student_id == student.id,
            Assignment.due_date >= datetime.utcnow(),
            Submission.status.in_(['not_submitted', 'submitted'])
        ).scalar() or 0
        
        upcoming_exams = db.query(func.count(distinct(Exam.id))).join(ExamSchedule).filter(
            ExamSchedule.section_id == student.section_id,
            ExamSchedule.exam_date >= date.today(),
            ExamSchedule.exam_date <= date.today() + timedelta(days=30)
        ).scalar() or 0
        
        exam_results = db.query(func.avg(ExamResult.percentage)).filter(
            ExamResult.student_id == student.id
        ).scalar()
        
        total_pending_assignments += pending_assignments
        total_upcoming_exams += upcoming_exams
        
        children.append(ChildOverview(
            student_id=student.id,
            student_name=f"{student.first_name} {student.last_name}",
            grade=grade.name if grade else "N/A",
            section=section.name if section else None,
            display_color=member.display_color,
            attendance_percentage=attendance_summary.attendance_percentage if attendance_summary else None,
            average_grade=exam_results,
            pending_assignments=pending_assignments,
            upcoming_exams=upcoming_exams
        ))
    
    upcoming_events_count = db.query(func.count(FamilyCalendarEvent.id)).filter(
        FamilyCalendarEvent.family_group_id == family_group.id,
        FamilyCalendarEvent.start_date >= datetime.utcnow(),
        FamilyCalendarEvent.start_date <= datetime.utcnow() + timedelta(days=7)
    ).scalar() or 0
    
    unread_notifications = db.query(func.count(FamilyNotificationBatch.id)).filter(
        FamilyNotificationBatch.family_group_id == family_group.id,
        FamilyNotificationBatch.is_read == False
    ).scalar() or 0
    
    recent_updates = []
    recent_batches = db.query(FamilyNotificationBatch).filter(
        FamilyNotificationBatch.family_group_id == family_group.id
    ).order_by(FamilyNotificationBatch.created_at.desc()).limit(5).all()
    
    for batch in recent_batches:
        recent_updates.append({
            'date': batch.batch_date.isoformat(),
            'count': batch.notification_count,
            'summary': batch.summary
        })
    
    return FamilyDashboardResponse(
        family_group=FamilyGroupResponse.model_validate(family_group),
        children=children,
        upcoming_events_count=upcoming_events_count,
        total_pending_assignments=total_pending_assignments,
        total_upcoming_exams=total_upcoming_exams,
        unread_notifications=unread_notifications,
        outstanding_fees=outstanding_fees,
        recent_updates=recent_updates
    )


@router.post("/groups", response_model=FamilyGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_family_group(
    group_data: FamilyGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != group_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this institution"
        )
    
    family_group = FamilyGroup(**group_data.model_dump())
    db.add(family_group)
    db.commit()
    db.refresh(family_group)
    return family_group


@router.post("/groups/{group_id}/members", status_code=status.HTTP_201_CREATED)
async def add_family_member(
    group_id: int,
    member_data: FamilyGroupMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    family_group = db.query(FamilyGroup).filter(
        FamilyGroup.id == group_id,
        FamilyGroup.institution_id == current_user.institution_id
    ).first()
    
    if not family_group:
        raise HTTPException(status_code=404, detail="Family group not found")
    
    member = FamilyGroupMember(
        family_group_id=group_id,
        **member_data.model_dump()
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.get("/calendar", response_model=FamilyCalendarResponse)
async def get_family_calendar(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    student_ids: Optional[List[int]] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user.id, current_user.institution_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    family_group = get_or_create_family_group(db, parent.id, current_user.institution_id)
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    query = db.query(FamilyCalendarEvent).filter(
        FamilyCalendarEvent.family_group_id == family_group.id,
        FamilyCalendarEvent.start_date >= start_date,
        FamilyCalendarEvent.start_date < end_date
    )
    
    if student_ids:
        query = query.filter(FamilyCalendarEvent.student_id.in_(student_ids))
    
    events = query.order_by(FamilyCalendarEvent.start_date).all()
    
    members = db.query(FamilyGroupMember).filter(
        FamilyGroupMember.family_group_id == family_group.id
    ).all()
    children_colors = {m.student_id: m.display_color for m in members}
    
    event_responses = []
    for event in events:
        student = db.query(Student).filter(Student.id == event.student_id).first()
        event_data = {
            **event.__dict__,
            'student_name': f"{student.first_name} {student.last_name}" if student else None,
            'student_color': children_colors.get(event.student_id)
        }
        event_data.pop('_sa_instance_state', None)
        event_responses.append(FamilyCalendarEventResponse(**event_data))
    
    return FamilyCalendarResponse(
        month=month,
        year=year,
        events=event_responses,
        children_colors=children_colors
    )


@router.post("/calendar/events", response_model=FamilyCalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    event_data: FamilyCalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = FamilyCalendarEvent(**event_data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/comparisons/performance", response_model=PerformanceComparisonResponse)
async def get_performance_comparison(
    period: str = Query("current_term", regex="^(current_term|last_month|last_quarter)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user.id, current_user.institution_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    family_group = get_or_create_family_group(db, parent.id, current_user.institution_id)
    
    members = db.query(FamilyGroupMember).filter(
        FamilyGroupMember.family_group_id == family_group.id
    ).all()
    
    students_data = []
    total_percentage = Decimal('0.00')
    count = 0
    
    for member in members:
        student = db.query(Student).filter(Student.id == member.student_id).first()
        if not student:
            continue
        
        avg_percentage = db.query(func.avg(ExamResult.percentage)).filter(
            ExamResult.student_id == student.id
        ).scalar()
        
        if avg_percentage:
            students_data.append(SiblingComparisonMetric(
                student_id=student.id,
                student_name=f"{student.first_name} {student.last_name}",
                value=avg_percentage,
                rank=None,
                trend="stable"
            ))
            total_percentage += avg_percentage
            count += 1
    
    students_data.sort(key=lambda x: x.value, reverse=True)
    for idx, student_data in enumerate(students_data, 1):
        student_data.rank = idx
    
    insights = []
    if students_data:
        top_performer = students_data[0]
        insights.append(f"{top_performer.student_name} is performing well with {top_performer.value:.1f}%")
    
    return PerformanceComparisonResponse(
        metric_type="performance",
        period=period,
        students=students_data,
        average=total_percentage / count if count > 0 else None,
        insights=insights
    )


@router.get("/comparisons/attendance", response_model=AttendanceComparisonResponse)
async def get_attendance_comparison(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user.id, current_user.institution_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    family_group = get_or_create_family_group(db, parent.id, current_user.institution_id)
    
    members = db.query(FamilyGroupMember).filter(
        FamilyGroupMember.family_group_id == family_group.id
    ).all()
    
    students_data = []
    total_attendance = Decimal('0.00')
    count = 0
    
    for member in members:
        student = db.query(Student).filter(Student.id == member.student_id).first()
        if not student:
            continue
        
        total_days = db.query(func.count(Attendance.id)).filter(
            Attendance.student_id == student.id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        ).scalar() or 0
        
        present_days = db.query(func.count(Attendance.id)).filter(
            Attendance.student_id == student.id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.status == 'present'
        ).scalar() or 0
        
        percentage = (present_days / total_days * 100) if total_days > 0 else 0
        
        students_data.append({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'total_days': total_days,
            'present_days': present_days,
            'attendance_percentage': percentage,
            'color': member.display_color
        })
        
        total_attendance += Decimal(str(percentage))
        count += 1
    
    return AttendanceComparisonResponse(
        students=students_data,
        period_start=start_date,
        period_end=end_date,
        family_average=total_attendance / count if count > 0 else Decimal('0.00')
    )


@router.get("/comparisons/behavior", response_model=BehaviorComparisonResponse)
async def get_behavior_comparison(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user.id, current_user.institution_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    family_group = get_or_create_family_group(db, parent.id, current_user.institution_id)
    
    members = db.query(FamilyGroupMember).filter(
        FamilyGroupMember.family_group_id == family_group.id
    ).all()
    
    students_data = []
    
    for member in members:
        student = db.query(Student).filter(Student.id == member.student_id).first()
        if not student:
            continue
        
        on_time_submissions = db.query(func.count(Submission.id)).filter(
            Submission.student_id == student.id,
            Submission.submitted_at >= start_date,
            Submission.submitted_at <= end_date,
            Submission.is_late == False
        ).scalar() or 0
        
        total_submissions = db.query(func.count(Submission.id)).filter(
            Submission.student_id == student.id,
            Submission.submitted_at >= start_date,
            Submission.submitted_at <= end_date
        ).scalar() or 0
        
        students_data.append({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'on_time_submissions': on_time_submissions,
            'total_submissions': total_submissions,
            'punctuality_rate': (on_time_submissions / total_submissions * 100) if total_submissions > 0 else 0,
            'color': member.display_color
        })
    
    return BehaviorComparisonResponse(
        students=students_data,
        period_start=start_date,
        period_end=end_date,
        metrics=['punctuality_rate', 'on_time_submissions']
    )


@router.get("/notifications", response_model=List[FamilyNotificationBatchResponse])
async def get_family_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user.id, current_user.institution_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    family_group = get_or_create_family_group(db, parent.id, current_user.institution_id)
    
    query = db.query(FamilyNotificationBatch).filter(
        FamilyNotificationBatch.family_group_id == family_group.id
    )
    
    if unread_only:
        query = query.filter(FamilyNotificationBatch.is_read == False)
    
    batches = query.order_by(FamilyNotificationBatch.created_at.desc()).offset(skip).limit(limit).all()
    
    responses = []
    for batch in batches:
        items = db.query(FamilyNotificationItem).filter(
            FamilyNotificationItem.batch_id == batch.id
        ).all()
        
        item_responses = []
        for item in items:
            student = db.query(Student).filter(Student.id == item.student_id).first()
            item_data = {
                **item.__dict__,
                'student_name': f"{student.first_name} {student.last_name}" if student else None
            }
            item_data.pop('_sa_instance_state', None)
            item_responses.append(FamilyNotificationItemResponse(**item_data))
        
        batch_data = {**batch.__dict__, 'items': item_responses}
        batch_data.pop('_sa_instance_state', None)
        responses.append(FamilyNotificationBatchResponse(**batch_data))
    
    return responses


@router.patch("/notifications/{batch_id}/read")
async def mark_notification_read(
    batch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    batch = db.query(FamilyNotificationBatch).filter(
        FamilyNotificationBatch.id == batch_id
    ).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Notification batch not found")
    
    batch.is_read = True
    batch.read_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "message": "Notification marked as read"}


@router.get("/expenses", response_model=List[SharedExpenseResponse])
async def get_shared_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    unpaid_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user.id, current_user.institution_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    
    family_group = get_or_create_family_group(db, parent.id, current_user.institution_id)
    
    query = db.query(SharedExpense).filter(
        SharedExpense.family_group_id == family_group.id
    )
    
    if unpaid_only:
        query = query.filter(SharedExpense.is_paid == False)
    
    expenses = query.order_by(SharedExpense.due_date.desc().nullslast()).offset(skip).limit(limit).all()
    
    responses = []
    for expense in expenses:
        splits = db.query(ExpenseSplit).filter(
            ExpenseSplit.expense_id == expense.id
        ).all()
        
        split_responses = []
        for split in splits:
            student = db.query(Student).filter(Student.id == split.student_id).first()
            split_data = {
                **split.__dict__,
                'student_name': f"{student.first_name} {student.last_name}" if student else None
            }
            split_data.pop('_sa_instance_state', None)
            split_responses.append(ExpenseSplitResponse(**split_data))
        
        expense_data = {**expense.__dict__, 'splits': split_responses}
        expense_data.pop('_sa_instance_state', None)
        responses.append(SharedExpenseResponse(**expense_data))
    
    return responses


@router.post("/expenses", response_model=SharedExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_shared_expense(
    expense_data: SharedExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != expense_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this institution"
        )
    
    expense = SharedExpense(
        institution_id=expense_data.institution_id,
        family_group_id=expense_data.family_group_id,
        expense_type=expense_data.expense_type,
        title=expense_data.title,
        description=expense_data.description,
        total_amount=expense_data.total_amount,
        split_type=expense_data.split_type,
        due_date=expense_data.due_date
    )
    db.add(expense)
    db.flush()
    
    if expense_data.split_type == "equal":
        amount_per_student = expense_data.total_amount / len(expense_data.student_ids)
        for student_id in expense_data.student_ids:
            split = ExpenseSplit(
                expense_id=expense.id,
                student_id=student_id,
                amount=amount_per_student
            )
            db.add(split)
    elif expense_data.split_type == "custom" and expense_data.custom_splits:
        for student_id, amount in expense_data.custom_splits.items():
            split = ExpenseSplit(
                expense_id=expense.id,
                student_id=int(student_id),
                amount=amount
            )
            db.add(split)
    
    db.commit()
    db.refresh(expense)
    
    splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense.id).all()
    split_responses = []
    for split in splits:
        student = db.query(Student).filter(Student.id == split.student_id).first()
        split_data = {
            **split.__dict__,
            'student_name': f"{student.first_name} {student.last_name}" if student else None
        }
        split_data.pop('_sa_instance_state', None)
        split_responses.append(split_data)
    
    expense_data = {**expense.__dict__, 'splits': split_responses}
    expense_data.pop('_sa_instance_state', None)
    
    return SharedExpenseResponse(**expense_data)


@router.post("/bulk/pay-fees", response_model=BulkPaymentResponse)
async def bulk_pay_fees(
    payment_data: BulkPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_amount = Decimal('0.00')
    paid_expenses = 0
    failed_expenses = []
    receipt_urls = []
    
    for expense_id in payment_data.expense_ids:
        expense = db.query(SharedExpense).filter(
            SharedExpense.id == expense_id,
            SharedExpense.institution_id == current_user.institution_id
        ).first()
        
        if not expense:
            failed_expenses.append(expense_id)
            continue
        
        if expense.is_paid:
            continue
        
        expense.is_paid = True
        expense.paid_at = datetime.utcnow()
        expense.payment_method = payment_data.payment_method
        expense.transaction_id = payment_data.transaction_id
        
        splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense_id).all()
        for split in splits:
            split.is_paid = True
            split.paid_at = datetime.utcnow()
        
        total_amount += expense.total_amount
        paid_expenses += 1
        
        if expense.receipt_url:
            receipt_urls.append(expense.receipt_url)
    
    db.commit()
    
    return BulkPaymentResponse(
        total_amount=total_amount,
        paid_expenses=paid_expenses,
        failed_expenses=failed_expenses,
        receipt_urls=receipt_urls
    )


@router.post("/bulk/download-report-cards", response_model=BulkDownloadResponse)
async def bulk_download_report_cards(
    download_data: BulkDownloadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_count = 0
    
    for student_id in download_data.student_ids:
        student = db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == current_user.institution_id
        ).first()
        
        if student:
            file_count += 1
    
    download_url = f"/downloads/report-cards/{datetime.utcnow().timestamp()}.zip"
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    return BulkDownloadResponse(
        download_url=download_url,
        file_count=file_count,
        expires_at=expires_at
    )


@router.post("/bulk/rsvp-events", response_model=BulkRSVPResponse)
async def bulk_rsvp_events(
    rsvp_data: BulkRSVPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated_count = 0
    failed_events = []
    confirmations = []
    
    for event_id in rsvp_data.event_ids:
        for student_id in rsvp_data.student_ids:
            event = db.query(FamilyCalendarEvent).filter(
                FamilyCalendarEvent.id == event_id
            ).first()
            
            if not event:
                if event_id not in failed_events:
                    failed_events.append(event_id)
                continue
            
            confirmations.append({
                'event_id': event_id,
                'student_id': student_id,
                'status': rsvp_data.rsvp_status,
                'confirmed_at': datetime.utcnow().isoformat()
            })
            updated_count += 1
    
    return BulkRSVPResponse(
        updated_count=updated_count,
        failed_events=failed_events,
        confirmations=confirmations
    )


@router.post("/toggle-children", response_model=ChildDataToggleResponse)
async def toggle_child_data(
    toggle_data: ChildDataToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data_summary = {}
    
    for student_id in toggle_data.student_ids:
        student = db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == current_user.institution_id
        ).first()
        
        if not student:
            continue
        
        pending_assignments = db.query(func.count(Assignment.id)).join(Submission).filter(
            Submission.student_id == student_id,
            Assignment.due_date >= datetime.utcnow(),
            Submission.status.in_(['not_submitted', 'submitted'])
        ).scalar() or 0
        
        upcoming_exams = db.query(func.count(distinct(Exam.id))).join(ExamSchedule).filter(
            ExamSchedule.section_id == student.section_id,
            ExamSchedule.exam_date >= date.today()
        ).scalar() or 0
        
        data_summary[student_id] = {
            'name': f"{student.first_name} {student.last_name}",
            'pending_assignments': pending_assignments,
            'upcoming_exams': upcoming_exams
        }
    
    return ChildDataToggleResponse(
        active_students=toggle_data.student_ids,
        data_summary=data_summary
    )
