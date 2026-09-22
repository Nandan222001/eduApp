from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract, case
from datetime import datetime, date
from decimal import Decimal
import io
import csv

from src.database import get_db
from src.models.user import User
from src.models.student import Parent, Student, StudentParent
from src.models.teacher import Teacher
from src.models.academic import AcademicYear, Grade, Section
from src.models.volunteer_hours import (
    VolunteerHourLog,
    VolunteerHourSummary,
    VolunteerBadge,
    ParentVolunteerBadge,
    VolunteerLeaderboard,
    VolunteerCertificate,
    ActivityType,
    VerificationStatus,
    BadgeTier,
)
from src.dependencies.auth import get_current_user
from src.schemas.volunteer_hours import (
    VolunteerHourLogCreate,
    VolunteerHourLogUpdate,
    VolunteerHourLogResponse,
    VerificationRequest,
    BulkVerificationRequest,
    VolunteerHourSummaryResponse,
    ParentHoursReport,
    GradeHoursReport,
    SchoolWideReport,
    VolunteerBadgeCreate,
    VolunteerBadgeUpdate,
    VolunteerBadgeResponse,
    ParentVolunteerBadgeResponse,
    LeaderboardResponse,
    LeaderboardEntryResponse,
    CertificateGenerationRequest,
    BulkCertificateRequest,
    VolunteerCertificateResponse,
    TaxDeductionExport,
    ExportRequest,
    StatisticsResponse,
    ActivityTypeBreakdown,
    HoursByMonth,
)

router = APIRouter()


def get_parent_from_user(db: Session, user: User) -> Parent:
    parent = db.query(Parent).filter(
        Parent.user_id == user.id,
        Parent.institution_id == user.institution_id,
        Parent.is_active == True
    ).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent profile not found"
        )
    
    return parent


def update_hour_summary(db: Session, parent_id: int, academic_year_id: int, institution_id: int):
    summary = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.parent_id == parent_id,
        VolunteerHourSummary.academic_year_id == academic_year_id
    ).first()
    
    if not summary:
        summary = VolunteerHourSummary(
            institution_id=institution_id,
            parent_id=parent_id,
            academic_year_id=academic_year_id
        )
        db.add(summary)
    
    logs = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.parent_id == parent_id,
        VolunteerHourLog.academic_year_id == academic_year_id
    ).all()
    
    summary.total_hours = sum(log.hours_logged for log in logs)
    summary.approved_hours = sum(log.hours_logged for log in logs if log.verification_status == VerificationStatus.APPROVED)
    summary.pending_hours = sum(log.hours_logged for log in logs if log.verification_status == VerificationStatus.PENDING)
    summary.rejected_hours = sum(log.hours_logged for log in logs if log.verification_status == VerificationStatus.REJECTED)
    
    summary.classroom_help_hours = sum(log.hours_logged for log in logs if log.activity_type == ActivityType.CLASSROOM_HELP and log.verification_status == VerificationStatus.APPROVED)
    summary.event_support_hours = sum(log.hours_logged for log in logs if log.activity_type == ActivityType.EVENT_SUPPORT and log.verification_status == VerificationStatus.APPROVED)
    summary.fundraising_hours = sum(log.hours_logged for log in logs if log.activity_type == ActivityType.FUNDRAISING and log.verification_status == VerificationStatus.APPROVED)
    summary.field_trip_hours = sum(log.hours_logged for log in logs if log.activity_type == ActivityType.FIELD_TRIP_CHAPERONE and log.verification_status == VerificationStatus.APPROVED)
    summary.committee_work_hours = sum(log.hours_logged for log in logs if log.activity_type == ActivityType.COMMITTEE_WORK and log.verification_status == VerificationStatus.APPROVED)
    
    if logs:
        summary.last_activity_date = max(log.date for log in logs)
    
    db.commit()
    return summary


def check_and_award_badges(db: Session, parent_id: int, academic_year_id: int, institution_id: int):
    summary = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.parent_id == parent_id,
        VolunteerHourSummary.academic_year_id == academic_year_id
    ).first()
    
    if not summary:
        return
    
    eligible_badges = db.query(VolunteerBadge).filter(
        VolunteerBadge.institution_id == institution_id,
        VolunteerBadge.is_active == True,
        VolunteerBadge.hours_required <= summary.approved_hours
    ).all()
    
    for badge in eligible_badges:
        existing = db.query(ParentVolunteerBadge).filter(
            ParentVolunteerBadge.parent_id == parent_id,
            ParentVolunteerBadge.badge_id == badge.id,
            ParentVolunteerBadge.academic_year_id == academic_year_id
        ).first()
        
        if not existing:
            new_badge = ParentVolunteerBadge(
                institution_id=institution_id,
                parent_id=parent_id,
                badge_id=badge.id,
                academic_year_id=academic_year_id,
                hours_at_earning=summary.approved_hours
            )
            db.add(new_badge)
    
    db.commit()


def update_leaderboard(db: Session, academic_year_id: int, institution_id: int):
    summaries = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.academic_year_id == academic_year_id,
        VolunteerHourSummary.institution_id == institution_id
    ).order_by(VolunteerHourSummary.approved_hours.desc()).all()
    
    for idx, summary in enumerate(summaries, 1):
        leaderboard_entry = db.query(VolunteerLeaderboard).filter(
            VolunteerLeaderboard.parent_id == summary.parent_id,
            VolunteerLeaderboard.academic_year_id == academic_year_id
        ).first()
        
        if not leaderboard_entry:
            parent = db.query(Parent).filter(Parent.id == summary.parent_id).first()
            if not parent:
                continue
            
            student_parent = db.query(StudentParent).filter(
                StudentParent.parent_id == parent.id
            ).first()
            
            grade_id = None
            if student_parent:
                student = db.query(Student).filter(Student.id == student_parent.student_id).first()
                if student and student.section:
                    grade_id = student.section.grade_id
            
            leaderboard_entry = VolunteerLeaderboard(
                institution_id=institution_id,
                academic_year_id=academic_year_id,
                parent_id=summary.parent_id,
                grade_id=grade_id,
                rank=idx,
                total_hours=summary.approved_hours
            )
            db.add(leaderboard_entry)
        else:
            leaderboard_entry.previous_rank = leaderboard_entry.rank
            leaderboard_entry.rank = idx
            leaderboard_entry.total_hours = summary.approved_hours
            leaderboard_entry.rank_change = (leaderboard_entry.previous_rank or idx) - idx
        
        summary.current_rank = idx
    
    total_parents = len(summaries)
    for summary in summaries:
        leaderboard_entry = db.query(VolunteerLeaderboard).filter(
            VolunteerLeaderboard.parent_id == summary.parent_id,
            VolunteerLeaderboard.academic_year_id == academic_year_id
        ).first()
        if leaderboard_entry and total_parents > 0:
            leaderboard_entry.percentile = Decimal((total_parents - leaderboard_entry.rank + 1) / total_parents * 100)
    
    db.commit()


@router.post("/logs", response_model=VolunteerHourLogResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer_hour_log(
    log_data: VolunteerHourLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user)
    
    new_log = VolunteerHourLog(
        institution_id=current_user.institution_id,
        parent_id=parent.id,
        **log_data.model_dump()
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    update_hour_summary(db, parent.id, log_data.academic_year_id, current_user.institution_id)
    
    response = VolunteerHourLogResponse.model_validate(new_log)
    response.parent_name = f"{parent.first_name} {parent.last_name}"
    
    return response


@router.get("/logs", response_model=List[VolunteerHourLogResponse])
async def get_volunteer_hour_logs(
    academic_year_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    activity_type: Optional[ActivityType] = None,
    verification_status: Optional[VerificationStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.institution_id == current_user.institution_id
    )
    
    if parent_id:
        query = query.filter(VolunteerHourLog.parent_id == parent_id)
    else:
        parent = db.query(Parent).filter(
            Parent.user_id == current_user.id,
            Parent.institution_id == current_user.institution_id
        ).first()
        if parent:
            query = query.filter(VolunteerHourLog.parent_id == parent.id)
    
    if academic_year_id:
        query = query.filter(VolunteerHourLog.academic_year_id == academic_year_id)
    
    if activity_type:
        query = query.filter(VolunteerHourLog.activity_type == activity_type)
    
    if verification_status:
        query = query.filter(VolunteerHourLog.verification_status == verification_status)
    
    if start_date:
        query = query.filter(VolunteerHourLog.date >= start_date)
    
    if end_date:
        query = query.filter(VolunteerHourLog.date <= end_date)
    
    logs = query.order_by(VolunteerHourLog.date.desc()).offset(skip).limit(limit).all()
    
    results = []
    for log in logs:
        response = VolunteerHourLogResponse.model_validate(log)
        parent = db.query(Parent).filter(Parent.id == log.parent_id).first()
        if parent:
            response.parent_name = f"{parent.first_name} {parent.last_name}"
        
        if log.supervisor_teacher_id:
            supervisor = db.query(Teacher).filter(Teacher.id == log.supervisor_teacher_id).first()
            if supervisor:
                response.supervisor_name = f"{supervisor.first_name} {supervisor.last_name}"
        
        if log.verified_by:
            verifier = db.query(Teacher).filter(Teacher.id == log.verified_by).first()
            if verifier:
                response.verifier_name = f"{verifier.first_name} {verifier.last_name}"
        
        results.append(response)
    
    return results


@router.get("/logs/{log_id}", response_model=VolunteerHourLogResponse)
async def get_volunteer_hour_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.id == log_id,
        VolunteerHourLog.institution_id == current_user.institution_id
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer hour log not found"
        )
    
    response = VolunteerHourLogResponse.model_validate(log)
    parent = db.query(Parent).filter(Parent.id == log.parent_id).first()
    if parent:
        response.parent_name = f"{parent.first_name} {parent.last_name}"
    
    return response


@router.put("/logs/{log_id}", response_model=VolunteerHourLogResponse)
async def update_volunteer_hour_log(
    log_id: int,
    log_update: VolunteerHourLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user)
    
    log = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.id == log_id,
        VolunteerHourLog.parent_id == parent.id,
        VolunteerHourLog.institution_id == current_user.institution_id
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer hour log not found"
        )
    
    if log.verification_status != VerificationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update log that has been verified"
        )
    
    update_data = log_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)
    
    db.commit()
    db.refresh(log)
    
    update_hour_summary(db, parent.id, log.academic_year_id, current_user.institution_id)
    
    return VolunteerHourLogResponse.model_validate(log)


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_volunteer_hour_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = get_parent_from_user(db, current_user)
    
    log = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.id == log_id,
        VolunteerHourLog.parent_id == parent.id,
        VolunteerHourLog.institution_id == current_user.institution_id
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer hour log not found"
        )
    
    if log.verification_status != VerificationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete log that has been verified"
        )
    
    academic_year_id = log.academic_year_id
    db.delete(log)
    db.commit()
    
    update_hour_summary(db, parent.id, academic_year_id, current_user.institution_id)


@router.post("/logs/{log_id}/verify", response_model=VolunteerHourLogResponse)
async def verify_volunteer_hour_log(
    log_id: int,
    verification: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    teacher = db.query(Teacher).filter(
        Teacher.user_id == current_user.id,
        Teacher.institution_id == current_user.institution_id
    ).first()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can verify volunteer hours"
        )
    
    log = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.id == log_id,
        VolunteerHourLog.institution_id == current_user.institution_id
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer hour log not found"
        )
    
    log.verification_status = verification.verification_status
    log.verification_notes = verification.verification_notes
    log.verified_at = datetime.utcnow()
    log.verified_by = teacher.id
    
    db.commit()
    db.refresh(log)
    
    update_hour_summary(db, log.parent_id, log.academic_year_id, current_user.institution_id)
    check_and_award_badges(db, log.parent_id, log.academic_year_id, current_user.institution_id)
    update_leaderboard(db, log.academic_year_id, current_user.institution_id)

    response = VolunteerHourLogResponse.model_validate(log)
    parent = db.query(Parent).filter(Parent.id == log.parent_id).first()
    if parent:
        response.parent_name = f"{parent.first_name} {parent.last_name}"
    response.verifier_name = f"{teacher.first_name} {teacher.last_name}"
    if log.supervisor_teacher_id:
        supervisor = db.query(Teacher).filter(Teacher.id == log.supervisor_teacher_id).first()
        if supervisor:
            response.supervisor_name = f"{supervisor.first_name} {supervisor.last_name}"

    return response


@router.post("/logs/verify-bulk", status_code=status.HTTP_200_OK)
async def bulk_verify_logs(
    verification: BulkVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    teacher = db.query(Teacher).filter(
        Teacher.user_id == current_user.id,
        Teacher.institution_id == current_user.institution_id
    ).first()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can verify volunteer hours"
        )
    
    logs = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.id.in_(verification.log_ids),
        VolunteerHourLog.institution_id == current_user.institution_id
    ).all()
    
    updated_count = 0
    parent_years = set()
    
    for log in logs:
        log.verification_status = verification.verification_status
        log.verification_notes = verification.verification_notes
        log.verified_at = datetime.utcnow()
        log.verified_by = teacher.id
        parent_years.add((log.parent_id, log.academic_year_id))
        updated_count += 1
    
    db.commit()
    
    for parent_id, academic_year_id in parent_years:
        update_hour_summary(db, parent_id, academic_year_id, current_user.institution_id)
        check_and_award_badges(db, parent_id, academic_year_id, current_user.institution_id)
    
    if parent_years:
        academic_year_ids = set(ay for _, ay in parent_years)
        for academic_year_id in academic_year_ids:
            update_leaderboard(db, academic_year_id, current_user.institution_id)
    
    return {"updated_count": updated_count, "message": f"Successfully verified {updated_count} logs"}


@router.get("/summary", response_model=List[VolunteerHourSummaryResponse])
async def get_volunteer_hour_summaries(
    academic_year_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.institution_id == current_user.institution_id
    )
    
    if parent_id:
        query = query.filter(VolunteerHourSummary.parent_id == parent_id)
    else:
        parent = db.query(Parent).filter(
            Parent.user_id == current_user.id,
            Parent.institution_id == current_user.institution_id
        ).first()
        if parent:
            query = query.filter(VolunteerHourSummary.parent_id == parent.id)
    
    if academic_year_id:
        query = query.filter(VolunteerHourSummary.academic_year_id == academic_year_id)
    
    summaries = query.all()
    
    results = []
    for summary in summaries:
        response = VolunteerHourSummaryResponse.model_validate(summary)
        parent = db.query(Parent).filter(Parent.id == summary.parent_id).first()
        if parent:
            response.parent_name = f"{parent.first_name} {parent.last_name}"
        
        academic_year = db.query(AcademicYear).filter(AcademicYear.id == summary.academic_year_id).first()
        if academic_year:
            response.academic_year_name = academic_year.name
        
        results.append(response)
    
    return results


@router.get("/reports/parent/{parent_id}", response_model=ParentHoursReport)
async def get_parent_hours_report(
    parent_id: int,
    academic_year_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent = db.query(Parent).filter(
        Parent.id == parent_id,
        Parent.institution_id == current_user.institution_id
    ).first()
    
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found"
        )
    
    summary = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.parent_id == parent_id,
        VolunteerHourSummary.academic_year_id == academic_year_id
    ).first()
    
    if not summary:
        summary = update_hour_summary(db, parent_id, academic_year_id, current_user.institution_id)
    
    logs = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.parent_id == parent_id,
        VolunteerHourLog.academic_year_id == academic_year_id,
        VolunteerHourLog.verification_status == VerificationStatus.APPROVED
    ).all()
    
    activity_breakdown = []
    for activity_type in ActivityType:
        hours = sum(log.hours_logged for log in logs if log.activity_type == activity_type)
        if hours > 0:
            percentage = (hours / summary.approved_hours * 100) if summary.approved_hours > 0 else 0
            activity_breakdown.append(ActivityTypeBreakdown(
                activity_type=activity_type.value,
                hours=hours,
                percentage=Decimal(percentage)
            ))
    
    monthly_data = db.query(
        extract('month', VolunteerHourLog.date).label('month'),
        extract('year', VolunteerHourLog.date).label('year'),
        func.sum(VolunteerHourLog.hours_logged).label('hours'),
        func.count(VolunteerHourLog.id).label('log_count')
    ).filter(
        VolunteerHourLog.parent_id == parent_id,
        VolunteerHourLog.academic_year_id == academic_year_id,
        VolunteerHourLog.verification_status == VerificationStatus.APPROVED
    ).group_by('month', 'year').all()
    
    monthly_breakdown = [
        HoursByMonth(
            month=int(row.month),
            year=int(row.year),
            hours=Decimal(row.hours),
            log_count=row.log_count
        )
        for row in monthly_data
    ]
    
    total_parents = db.query(func.count(VolunteerHourSummary.id)).filter(
        VolunteerHourSummary.academic_year_id == academic_year_id,
        VolunteerHourSummary.institution_id == current_user.institution_id
    ).scalar()
    
    percentile = None
    if summary.current_rank and total_parents > 0:
        percentile = Decimal((total_parents - summary.current_rank + 1) / total_parents * 100)
    
    badges = db.query(VolunteerBadge).join(ParentVolunteerBadge).filter(
        ParentVolunteerBadge.parent_id == parent_id,
        ParentVolunteerBadge.academic_year_id == academic_year_id
    ).all()
    
    badges_earned = [badge.name for badge in badges]
    
    recent_logs_data = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.parent_id == parent_id,
        VolunteerHourLog.academic_year_id == academic_year_id
    ).order_by(VolunteerHourLog.date.desc()).limit(10).all()
    
    recent_logs = [VolunteerHourLogResponse.model_validate(log) for log in recent_logs_data]
    
    academic_year = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
    
    return ParentHoursReport(
        parent_id=parent.id,
        parent_name=f"{parent.first_name} {parent.last_name}",
        academic_year_id=academic_year_id,
        academic_year_name=academic_year.name if academic_year else "",
        total_hours=summary.total_hours,
        approved_hours=summary.approved_hours,
        pending_hours=summary.pending_hours,
        rejected_hours=summary.rejected_hours,
        activity_breakdown=activity_breakdown,
        monthly_breakdown=monthly_breakdown,
        current_rank=summary.current_rank,
        total_parents=total_parents or 0,
        percentile=percentile,
        badges_earned=badges_earned,
        recent_logs=recent_logs
    )


@router.get("/reports/grade/{grade_id}", response_model=GradeHoursReport)
async def get_grade_hours_report(
    grade_id: int,
    academic_year_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    grade = db.query(Grade).filter(
        Grade.id == grade_id,
        Grade.institution_id == current_user.institution_id
    ).first()
    
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )
    
    students_in_grade = db.query(Student.id).join(Section).filter(
        Section.grade_id == grade_id,
        Student.institution_id == current_user.institution_id
    ).subquery()
    
    parent_ids_in_grade = db.query(StudentParent.parent_id).filter(
        StudentParent.student_id.in_(students_in_grade)
    ).distinct().subquery()
    
    summaries = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.parent_id.in_(parent_ids_in_grade),
        VolunteerHourSummary.academic_year_id == academic_year_id
    ).all()
    
    total_parents = len(summaries)
    total_hours = sum(s.approved_hours for s in summaries)
    average_hours = total_hours / total_parents if total_parents > 0 else 0
    
    top_contributors = []
    for summary in sorted(summaries, key=lambda s: s.approved_hours, reverse=True)[:10]:
        parent = db.query(Parent).filter(Parent.id == summary.parent_id).first()
        if parent:
            top_contributors.append({
                "parent_id": parent.id,
                "parent_name": f"{parent.first_name} {parent.last_name}",
                "hours": float(summary.approved_hours),
                "rank": summary.current_rank
            })
    
    all_logs = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.parent_id.in_(parent_ids_in_grade),
        VolunteerHourLog.academic_year_id == academic_year_id,
        VolunteerHourLog.verification_status == VerificationStatus.APPROVED
    ).all()
    
    activity_breakdown = []
    for activity_type in ActivityType:
        hours = sum(log.hours_logged for log in all_logs if log.activity_type == activity_type)
        if hours > 0:
            percentage = (hours / total_hours * 100) if total_hours > 0 else 0
            activity_breakdown.append(ActivityTypeBreakdown(
                activity_type=activity_type.value,
                hours=hours,
                percentage=Decimal(percentage)
            ))
    
    academic_year = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
    
    return GradeHoursReport(
        grade_id=grade.id,
        grade_name=grade.name,
        academic_year_id=academic_year_id,
        academic_year_name=academic_year.name if academic_year else "",
        total_parents=total_parents,
        total_hours=total_hours,
        average_hours_per_parent=Decimal(average_hours),
        top_contributors=top_contributors,
        activity_breakdown=activity_breakdown
    )


@router.get("/reports/school-wide", response_model=SchoolWideReport)
async def get_school_wide_report(
    academic_year_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    summaries = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.academic_year_id == academic_year_id,
        VolunteerHourSummary.institution_id == current_user.institution_id
    ).all()
    
    total_parents = len(summaries)
    active_parents = len([s for s in summaries if s.approved_hours > 0])
    total_hours = sum(s.total_hours for s in summaries)
    approved_hours = sum(s.approved_hours for s in summaries)
    pending_hours = sum(s.pending_hours for s in summaries)
    average_hours = approved_hours / active_parents if active_parents > 0 else 0
    
    all_logs = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.academic_year_id == academic_year_id,
        VolunteerHourLog.institution_id == current_user.institution_id,
        VolunteerHourLog.verification_status == VerificationStatus.APPROVED
    ).all()
    
    activity_breakdown = []
    for activity_type in ActivityType:
        hours = sum(log.hours_logged for log in all_logs if log.activity_type == activity_type)
        if hours > 0:
            percentage = (hours / approved_hours * 100) if approved_hours > 0 else 0
            activity_breakdown.append(ActivityTypeBreakdown(
                activity_type=activity_type.value,
                hours=hours,
                percentage=Decimal(percentage)
            ))
    
    monthly_data = db.query(
        extract('month', VolunteerHourLog.date).label('month'),
        extract('year', VolunteerHourLog.date).label('year'),
        func.sum(VolunteerHourLog.hours_logged).label('hours'),
        func.count(VolunteerHourLog.id).label('log_count')
    ).filter(
        VolunteerHourLog.academic_year_id == academic_year_id,
        VolunteerHourLog.institution_id == current_user.institution_id,
        VolunteerHourLog.verification_status == VerificationStatus.APPROVED
    ).group_by('month', 'year').all()
    
    monthly_trends = [
        HoursByMonth(
            month=int(row.month),
            year=int(row.year),
            hours=Decimal(row.hours),
            log_count=row.log_count
        )
        for row in monthly_data
    ]
    
    top_contributors = []
    for summary in sorted(summaries, key=lambda s: s.approved_hours, reverse=True)[:20]:
        parent = db.query(Parent).filter(Parent.id == summary.parent_id).first()
        if parent:
            top_contributors.append({
                "parent_id": parent.id,
                "parent_name": f"{parent.first_name} {parent.last_name}",
                "hours": float(summary.approved_hours),
                "rank": summary.current_rank
            })
    
    grades = db.query(Grade).filter(
        Grade.academic_year_id == academic_year_id,
        Grade.institution_id == current_user.institution_id
    ).all()
    
    grade_breakdown = []
    for grade in grades:
        students_in_grade = db.query(Student.id).join(Section).filter(
            Section.grade_id == grade.id
        ).subquery()
        
        parent_ids = db.query(StudentParent.parent_id).filter(
            StudentParent.student_id.in_(students_in_grade)
        ).distinct().subquery()
        
        grade_summaries = db.query(VolunteerHourSummary).filter(
            VolunteerHourSummary.parent_id.in_(parent_ids),
            VolunteerHourSummary.academic_year_id == academic_year_id
        ).all()
        
        grade_total_hours = sum(s.approved_hours for s in grade_summaries)
        grade_total_parents = len(grade_summaries)
        grade_avg = grade_total_hours / grade_total_parents if grade_total_parents > 0 else 0
        
        grade_logs = db.query(VolunteerHourLog).filter(
            VolunteerHourLog.parent_id.in_(parent_ids),
            VolunteerHourLog.academic_year_id == academic_year_id,
            VolunteerHourLog.verification_status == VerificationStatus.APPROVED
        ).all()
        
        grade_activity_breakdown = []
        for activity_type in ActivityType:
            hours = sum(log.hours_logged for log in grade_logs if log.activity_type == activity_type)
            if hours > 0:
                percentage = (hours / grade_total_hours * 100) if grade_total_hours > 0 else 0
                grade_activity_breakdown.append(ActivityTypeBreakdown(
                    activity_type=activity_type.value,
                    hours=hours,
                    percentage=Decimal(percentage)
                ))
        
        top_in_grade = []
        for summary in sorted(grade_summaries, key=lambda s: s.approved_hours, reverse=True)[:5]:
            parent = db.query(Parent).filter(Parent.id == summary.parent_id).first()
            if parent:
                top_in_grade.append({
                    "parent_id": parent.id,
                    "parent_name": f"{parent.first_name} {parent.last_name}",
                    "hours": float(summary.approved_hours),
                    "rank": summary.current_rank
                })
        
        grade_breakdown.append(GradeHoursReport(
            grade_id=grade.id,
            grade_name=grade.name,
            academic_year_id=academic_year_id,
            academic_year_name=grade.academic_year.name,
            total_parents=grade_total_parents,
            total_hours=grade_total_hours,
            average_hours_per_parent=Decimal(grade_avg),
            top_contributors=top_in_grade,
            activity_breakdown=grade_activity_breakdown
        ))
    
    academic_year = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
    
    return SchoolWideReport(
        institution_id=current_user.institution_id,
        academic_year_id=academic_year_id,
        academic_year_name=academic_year.name if academic_year else "",
        total_parents=total_parents,
        active_parents=active_parents,
        total_hours=total_hours,
        approved_hours=approved_hours,
        pending_hours=pending_hours,
        average_hours_per_parent=Decimal(average_hours),
        activity_breakdown=activity_breakdown,
        grade_breakdown=grade_breakdown,
        monthly_trends=monthly_trends,
        top_contributors=top_contributors
    )


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_volunteer_leaderboard(
    academic_year_id: int,
    grade_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VolunteerLeaderboard).filter(
        VolunteerLeaderboard.academic_year_id == academic_year_id,
        VolunteerLeaderboard.institution_id == current_user.institution_id
    )
    
    scope = "school-wide"
    grade_name = None
    
    if grade_id:
        query = query.filter(VolunteerLeaderboard.grade_id == grade_id)
        scope = "grade"
        grade = db.query(Grade).filter(Grade.id == grade_id).first()
        if grade:
            grade_name = grade.name
    
    entries = query.order_by(VolunteerLeaderboard.rank).limit(limit).all()
    
    results = []
    for entry in entries:
        parent = db.query(Parent).filter(Parent.id == entry.parent_id).first()
        if not parent:
            continue
        
        badges_count = db.query(func.count(ParentVolunteerBadge.id)).filter(
            ParentVolunteerBadge.parent_id == entry.parent_id,
            ParentVolunteerBadge.academic_year_id == academic_year_id
        ).scalar()
        
        last_log = db.query(VolunteerHourLog).filter(
            VolunteerHourLog.parent_id == entry.parent_id,
            VolunteerHourLog.academic_year_id == academic_year_id
        ).order_by(VolunteerHourLog.date.desc()).first()
        
        recent_activity = None
        if last_log:
            recent_activity = f"{last_log.activity_name} ({last_log.date.strftime('%Y-%m-%d')})"
        
        results.append(LeaderboardEntryResponse(
            rank=entry.rank,
            parent_id=entry.parent_id,
            parent_name=f"{parent.first_name} {parent.last_name}",
            total_hours=entry.total_hours,
            previous_rank=entry.previous_rank,
            rank_change=entry.rank_change,
            percentile=entry.percentile,
            badges_count=badges_count or 0,
            recent_activity=recent_activity
        ))
    
    user_entry = None
    parent = db.query(Parent).filter(
        Parent.user_id == current_user.id,
        Parent.institution_id == current_user.institution_id
    ).first()
    
    if parent:
        user_leaderboard = db.query(VolunteerLeaderboard).filter(
            VolunteerLeaderboard.parent_id == parent.id,
            VolunteerLeaderboard.academic_year_id == academic_year_id
        ).first()
        
        if user_leaderboard:
            badges_count = db.query(func.count(ParentVolunteerBadge.id)).filter(
                ParentVolunteerBadge.parent_id == parent.id,
                ParentVolunteerBadge.academic_year_id == academic_year_id
            ).scalar()
            
            user_entry = LeaderboardEntryResponse(
                rank=user_leaderboard.rank,
                parent_id=parent.id,
                parent_name=f"{parent.first_name} {parent.last_name}",
                total_hours=user_leaderboard.total_hours,
                previous_rank=user_leaderboard.previous_rank,
                rank_change=user_leaderboard.rank_change,
                percentile=user_leaderboard.percentile,
                badges_count=badges_count or 0,
                recent_activity=None
            )
    
    academic_year = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first()
    
    return LeaderboardResponse(
        academic_year_id=academic_year_id,
        academic_year_name=academic_year.name if academic_year else "",
        scope=scope,
        grade_id=grade_id,
        grade_name=grade_name,
        total_entries=len(entries),
        entries=results,
        user_entry=user_entry
    )


@router.post("/badges", response_model=VolunteerBadgeResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer_badge(
    badge_data: VolunteerBadgeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_badge = VolunteerBadge(**badge_data.model_dump())
    db.add(new_badge)
    db.commit()
    db.refresh(new_badge)
    
    return VolunteerBadgeResponse.model_validate(new_badge)


@router.get("/badges", response_model=List[VolunteerBadgeResponse])
async def get_volunteer_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    badges = db.query(VolunteerBadge).filter(
        VolunteerBadge.institution_id == current_user.institution_id,
        VolunteerBadge.is_active == True
    ).order_by(VolunteerBadge.hours_required).all()
    
    return [VolunteerBadgeResponse.model_validate(badge) for badge in badges]


@router.get("/badges/parent/{parent_id}", response_model=List[ParentVolunteerBadgeResponse])
async def get_parent_badges(
    parent_id: int,
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ParentVolunteerBadge).filter(
        ParentVolunteerBadge.parent_id == parent_id,
        ParentVolunteerBadge.institution_id == current_user.institution_id
    )
    
    if academic_year_id:
        query = query.filter(ParentVolunteerBadge.academic_year_id == academic_year_id)
    
    parent_badges = query.order_by(ParentVolunteerBadge.earned_at.desc()).all()
    
    results = []
    for pb in parent_badges:
        response = ParentVolunteerBadgeResponse.model_validate(pb)
        badge = db.query(VolunteerBadge).filter(VolunteerBadge.id == pb.badge_id).first()
        if badge:
            response.badge_name = badge.name
            response.badge_tier = badge.badge_tier.value
            response.badge_icon_url = badge.icon_url
        results.append(response)
    
    return results


@router.post("/certificates/generate", response_model=VolunteerCertificateResponse, status_code=status.HTTP_201_CREATED)
async def generate_certificate(
    cert_data: CertificateGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(VolunteerCertificate).filter(
        VolunteerCertificate.parent_id == cert_data.parent_id,
        VolunteerCertificate.academic_year_id == cert_data.academic_year_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate already exists for this parent and academic year"
        )
    
    summary = db.query(VolunteerHourSummary).filter(
        VolunteerHourSummary.parent_id == cert_data.parent_id,
        VolunteerHourSummary.academic_year_id == cert_data.academic_year_id
    ).first()
    
    if not summary or summary.approved_hours == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No approved hours found for certificate generation"
        )
    
    parent = db.query(Parent).filter(Parent.id == cert_data.parent_id).first()
    academic_year = db.query(AcademicYear).filter(AcademicYear.id == cert_data.academic_year_id).first()
    
    cert_number = f"VC-{current_user.institution_id}-{academic_year.id}-{parent.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    new_certificate = VolunteerCertificate(
        institution_id=current_user.institution_id,
        parent_id=cert_data.parent_id,
        academic_year_id=cert_data.academic_year_id,
        certificate_number=cert_number,
        total_hours=summary.approved_hours,
        issue_date=date.today(),
        signed_by=cert_data.signed_by,
        is_tax_deductible=cert_data.is_tax_deductible,
        tax_year=cert_data.tax_year,
        notes=cert_data.notes
    )
    
    db.add(new_certificate)
    db.commit()
    db.refresh(new_certificate)
    
    response = VolunteerCertificateResponse.model_validate(new_certificate)
    response.parent_name = f"{parent.first_name} {parent.last_name}"
    response.academic_year_name = academic_year.name
    
    if new_certificate.signed_by:
        signer = db.query(Teacher).filter(Teacher.id == new_certificate.signed_by).first()
        if signer:
            response.signer_name = f"{signer.first_name} {signer.last_name}"
    
    return response


@router.get("/certificates", response_model=List[VolunteerCertificateResponse])
async def get_certificates(
    parent_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VolunteerCertificate).filter(
        VolunteerCertificate.institution_id == current_user.institution_id
    )
    
    if parent_id:
        query = query.filter(VolunteerCertificate.parent_id == parent_id)
    
    if academic_year_id:
        query = query.filter(VolunteerCertificate.academic_year_id == academic_year_id)
    
    certificates = query.order_by(VolunteerCertificate.issue_date.desc()).all()
    
    results = []
    for cert in certificates:
        response = VolunteerCertificateResponse.model_validate(cert)
        parent = db.query(Parent).filter(Parent.id == cert.parent_id).first()
        if parent:
            response.parent_name = f"{parent.first_name} {parent.last_name}"
        
        academic_year = db.query(AcademicYear).filter(AcademicYear.id == cert.academic_year_id).first()
        if academic_year:
            response.academic_year_name = academic_year.name
        
        if cert.signed_by:
            signer = db.query(Teacher).filter(Teacher.id == cert.signed_by).first()
            if signer:
                response.signer_name = f"{signer.first_name} {signer.last_name}"
        
        results.append(response)
    
    return results


@router.get("/export/tax-deduction", response_model=List[TaxDeductionExport])
async def export_tax_deduction_data(
    tax_year: int,
    parent_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VolunteerCertificate).filter(
        VolunteerCertificate.institution_id == current_user.institution_id,
        VolunteerCertificate.is_tax_deductible == True,
        VolunteerCertificate.tax_year == tax_year
    )
    
    if parent_id:
        query = query.filter(VolunteerCertificate.parent_id == parent_id)
    
    certificates = query.all()
    
    hourly_rate = Decimal("25.00")
    
    results = []
    for cert in certificates:
        parent = db.query(Parent).filter(Parent.id == cert.parent_id).first()
        if not parent:
            continue
        
        logs = db.query(VolunteerHourLog).filter(
            VolunteerHourLog.parent_id == cert.parent_id,
            VolunteerHourLog.academic_year_id == cert.academic_year_id,
            VolunteerHourLog.verification_status == VerificationStatus.APPROVED
        ).all()
        
        activities = []
        for log in logs:
            activities.append({
                "activity_name": log.activity_name,
                "activity_type": log.activity_type.value,
                "date": log.date.isoformat(),
                "hours": float(log.hours_logged),
                "location": log.location
            })
        
        estimated_value = cert.total_hours * hourly_rate
        
        results.append(TaxDeductionExport(
            parent_id=parent.id,
            parent_name=f"{parent.first_name} {parent.last_name}",
            parent_email=parent.email,
            tax_year=tax_year,
            total_hours=cert.total_hours,
            estimated_value=estimated_value,
            certificate_number=cert.certificate_number,
            activities=activities
        ))
    
    return results


@router.post("/export")
async def export_volunteer_hours(
    export_request: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.institution_id == current_user.institution_id,
        VolunteerHourLog.academic_year_id == export_request.academic_year_id
    )
    
    if export_request.parent_id:
        query = query.filter(VolunteerHourLog.parent_id == export_request.parent_id)
    
    if export_request.grade_id:
        students_in_grade = db.query(Student.id).join(Section).filter(
            Section.grade_id == export_request.grade_id
        ).subquery()
        
        parent_ids = db.query(StudentParent.parent_id).filter(
            StudentParent.student_id.in_(students_in_grade)
        ).distinct().subquery()
        
        query = query.filter(VolunteerHourLog.parent_id.in_(parent_ids))
    
    if export_request.start_date:
        query = query.filter(VolunteerHourLog.date >= export_request.start_date)
    
    if export_request.end_date:
        query = query.filter(VolunteerHourLog.date <= export_request.end_date)
    
    if not export_request.include_pending:
        query = query.filter(VolunteerHourLog.verification_status == VerificationStatus.APPROVED)
    
    logs = query.order_by(VolunteerHourLog.date).all()
    
    if export_request.format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Parent Name", "Activity Name", "Activity Type", "Date", 
            "Hours", "Location", "Verification Status", "Supervisor", "Notes"
        ])
        
        for log in logs:
            parent = db.query(Parent).filter(Parent.id == log.parent_id).first()
            parent_name = f"{parent.first_name} {parent.last_name}" if parent else ""
            
            supervisor_name = ""
            if log.supervisor_teacher_id:
                supervisor = db.query(Teacher).filter(Teacher.id == log.supervisor_teacher_id).first()
                if supervisor:
                    supervisor_name = f"{supervisor.first_name} {supervisor.last_name}"
            
            writer.writerow([
                parent_name,
                log.activity_name,
                log.activity_type.value,
                log.date.isoformat(),
                float(log.hours_logged),
                log.location or "",
                log.verification_status.value,
                supervisor_name,
                log.description or ""
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=volunteer_hours_export.csv"}
        )
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Only CSV format is currently supported"
    )


@router.get("/statistics", response_model=StatisticsResponse)
async def get_volunteer_statistics(
    academic_year_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = db.query(VolunteerHourLog).filter(
        VolunteerHourLog.academic_year_id == academic_year_id,
        VolunteerHourLog.institution_id == current_user.institution_id
    ).all()
    
    total_logs = len(logs)
    total_hours = sum(log.hours_logged for log in logs)
    approved_hours = sum(log.hours_logged for log in logs if log.verification_status == VerificationStatus.APPROVED)
    pending_hours = sum(log.hours_logged for log in logs if log.verification_status == VerificationStatus.PENDING)
    rejected_hours = sum(log.hours_logged for log in logs if log.verification_status == VerificationStatus.REJECTED)
    
    unique_parents = len(set(log.parent_id for log in logs))
    average_hours_per_parent = approved_hours / unique_parents if unique_parents > 0 else 0
    
    activity_counts = {}
    for log in logs:
        if log.verification_status == VerificationStatus.APPROVED:
            activity_counts[log.activity_type.value] = activity_counts.get(log.activity_type.value, 0) + 1
    
    most_common_activity = max(activity_counts, key=activity_counts.get) if activity_counts else "None"
    
    verified_logs = len([log for log in logs if log.verification_status in [VerificationStatus.APPROVED, VerificationStatus.REJECTED]])
    verification_rate = Decimal(verified_logs / total_logs * 100) if total_logs > 0 else Decimal(0)
    
    badge_distribution = {}
    for tier in BadgeTier:
        count = db.query(func.count(ParentVolunteerBadge.id)).join(VolunteerBadge).filter(
            ParentVolunteerBadge.academic_year_id == academic_year_id,
            ParentVolunteerBadge.institution_id == current_user.institution_id,
            VolunteerBadge.badge_tier == tier
        ).scalar()
        badge_distribution[tier.value] = count or 0
    
    return StatisticsResponse(
        total_logs=total_logs,
        total_hours=total_hours,
        approved_hours=approved_hours,
        pending_hours=pending_hours,
        rejected_hours=rejected_hours,
        unique_parents=unique_parents,
        average_hours_per_parent=Decimal(average_hours_per_parent),
        most_common_activity=most_common_activity,
        verification_rate=verification_rate,
        badge_distribution=badge_distribution
    )
