from typing import List, Optional
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from src.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.attendance import Attendance, AttendanceStatus
from src.models.examination import Exam, ExamResult
from src.models.assignment import Assignment, AssignmentStatus, Submission, SubmissionStatus
from src.models.notification import Announcement
from src.dependencies.auth import get_current_user
from src.schemas.institution_admin import (
    InstitutionOverview,
    TodayAttendanceSummary,
    RecentExamResult,
    UpcomingEvent,
    PendingTask,
    PerformanceTrend,
    QuickStatistic,
    DashboardResponse
)

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
async def get_institution_admin_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    institution_id = current_user.institution_id
    
    # Get institutional overview with counts
    student_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.is_active == True
    ).scalar() or 0
    
    teacher_count = db.query(func.count(Teacher.id)).filter(
        Teacher.institution_id == institution_id,
        Teacher.is_active == True
    ).scalar() or 0
    
    overview = InstitutionOverview(
        student_count=student_count,
        teacher_count=teacher_count,
        total_users=student_count + teacher_count
    )
    
    # Get today's attendance summary
    today = date.today()
    total_students_today = db.query(func.count(func.distinct(Attendance.student_id))).filter(
        Attendance.institution_id == institution_id,
        Attendance.date == today
    ).scalar() or 0
    
    present_students = db.query(func.count(func.distinct(Attendance.student_id))).filter(
        Attendance.institution_id == institution_id,
        Attendance.date == today,
        Attendance.status == AttendanceStatus.PRESENT
    ).scalar() or 0
    
    absent_students = db.query(func.count(func.distinct(Attendance.student_id))).filter(
        Attendance.institution_id == institution_id,
        Attendance.date == today,
        Attendance.status == AttendanceStatus.ABSENT
    ).scalar() or 0
    
    late_students = db.query(func.count(func.distinct(Attendance.student_id))).filter(
        Attendance.institution_id == institution_id,
        Attendance.date == today,
        Attendance.status == AttendanceStatus.LATE
    ).scalar() or 0
    
    attendance_percentage = (present_students / total_students_today * 100) if total_students_today > 0 else 0
    
    attendance_summary = TodayAttendanceSummary(
        date=today,
        total_students=total_students_today,
        present=present_students,
        absent=absent_students,
        late=late_students,
        percentage=round(attendance_percentage, 2)
    )
    
    # Get recent exam results (last 5 published exams)
    recent_exams = db.query(Exam).filter(
        Exam.institution_id == institution_id,
        Exam.is_published == True
    ).order_by(Exam.end_date.desc()).limit(5).all()
    
    exam_results_list = []
    for exam in recent_exams:
        total_students = db.query(func.count(ExamResult.id)).filter(
            ExamResult.exam_id == exam.id
        ).scalar() or 0
        
        passed_students = db.query(func.count(ExamResult.id)).filter(
            ExamResult.exam_id == exam.id,
            ExamResult.is_pass == True
        ).scalar() or 0
        
        avg_percentage = db.query(func.avg(ExamResult.percentage)).filter(
            ExamResult.exam_id == exam.id
        ).scalar() or 0
        
        exam_results_list.append(RecentExamResult(
            exam_id=exam.id,
            exam_name=exam.name,
            exam_type=exam.exam_type.value,
            date=exam.end_date,
            total_students=total_students,
            passed_students=passed_students,
            average_percentage=round(float(avg_percentage), 2)
        ))
    
    # Get upcoming events (exams scheduled in next 30 days)
    upcoming_events_list = []
    future_exams = db.query(Exam).filter(
        Exam.institution_id == institution_id,
        Exam.start_date >= date.today(),
        Exam.start_date <= date.today() + timedelta(days=30),
        Exam.status != 'cancelled'
    ).order_by(Exam.start_date).limit(10).all()
    
    for exam in future_exams:
        upcoming_events_list.append(UpcomingEvent(
            id=exam.id,
            title=exam.name,
            event_type='exam',
            date=exam.start_date,
            description=exam.description or ''
        ))
    
    # Get pending tasks for institution admin
    pending_tasks_list = []
    
    # Pending grading tasks
    ungraded_count = db.query(func.count(Submission.id)).filter(
        Submission.institution_id == institution_id,
        Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.LATE_SUBMITTED])
    ).scalar() or 0
    
    if ungraded_count > 0:
        pending_tasks_list.append(PendingTask(
            id=f"grading-{datetime.now().timestamp()}",
            task_type='grading',
            title='Pending Assignment Grading',
            description=f'{ungraded_count} assignment(s) need to be graded',
            count=ungraded_count,
            priority='medium',
            due_date=None
        ))
    
    # Attendance marking pending (sections without today's attendance)
    sections_without_attendance = db.query(func.count(func.distinct(Student.section_id))).filter(
        Student.institution_id == institution_id,
        Student.is_active == True,
        ~Student.id.in_(
            db.query(Attendance.student_id).filter(
                Attendance.date == today
            )
        )
    ).scalar() or 0
    
    if sections_without_attendance > 0:
        pending_tasks_list.append(PendingTask(
            id=f"attendance-{datetime.now().timestamp()}",
            task_type='attendance',
            title='Attendance Marking Pending',
            description=f'{sections_without_attendance} section(s) need attendance marked for today',
            count=sections_without_attendance,
            priority='high',
            due_date=today
        ))
    
    # Unpublished exams
    unpublished_exams = db.query(func.count(Exam.id)).filter(
        Exam.institution_id == institution_id,
        Exam.status == 'completed',
        Exam.is_published == False
    ).scalar() or 0
    
    if unpublished_exams > 0:
        pending_tasks_list.append(PendingTask(
            id=f"exam-results-{datetime.now().timestamp()}",
            task_type='exam_results',
            title='Exam Results to Publish',
            description=f'{unpublished_exams} exam result(s) ready to be published',
            count=unpublished_exams,
            priority='medium',
            due_date=None
        ))
    
    # Get performance trends (monthly for last 6 months)
    performance_trends = []
    for i in range(5, -1, -1):
        month_date = date.today() - timedelta(days=30 * i)
        month_start = month_date.replace(day=1)
        
        if i == 0:
            month_end = date.today()
        else:
            next_month = month_start + timedelta(days=32)
            month_end = next_month.replace(day=1) - timedelta(days=1)
        
        # Get average exam performance for the month
        avg_performance = db.query(func.avg(ExamResult.percentage)).filter(
            ExamResult.institution_id == institution_id,
            ExamResult.generated_at >= month_start,
            ExamResult.generated_at <= month_end
        ).scalar()
        
        # Get attendance percentage for the month
        total_attendance_records = db.query(func.count(Attendance.id)).filter(
            Attendance.institution_id == institution_id,
            Attendance.date >= month_start,
            Attendance.date <= month_end
        ).scalar() or 0
        
        present_records = db.query(func.count(Attendance.id)).filter(
            Attendance.institution_id == institution_id,
            Attendance.date >= month_start,
            Attendance.date <= month_end,
            Attendance.status == AttendanceStatus.PRESENT
        ).scalar() or 0
        
        avg_attendance = (present_records / total_attendance_records * 100) if total_attendance_records > 0 else 0
        
        performance_trends.append(PerformanceTrend(
            month=month_start.strftime('%B %Y'),
            average_score=round(float(avg_performance), 2) if avg_performance else 0,
            attendance_rate=round(avg_attendance, 2),
            student_count=student_count
        ))
    
    # Get quick statistics
    active_assignments = db.query(func.count(Assignment.id)).filter(
        Assignment.institution_id == institution_id,
        Assignment.status == AssignmentStatus.PUBLISHED,
        Assignment.is_active == True
    ).scalar() or 0
    
    total_exams = db.query(func.count(Exam.id)).filter(
        Exam.institution_id == institution_id
    ).scalar() or 0
    
    pending_announcements = db.query(func.count(Announcement.id)).filter(
        Announcement.institution_id == institution_id,
        Announcement.is_published == False
    ).scalar() or 0
    
    avg_attendance_all = db.query(func.avg(
        func.cast(Attendance.status == AttendanceStatus.PRESENT, db.dialect.type_descriptor(db.Integer))
    )).filter(
        Attendance.institution_id == institution_id,
        Attendance.date >= date.today() - timedelta(days=30)
    ).scalar() or 0
    
    quick_stats = [
        QuickStatistic(
            label='Active Assignments',
            value=str(active_assignments),
            trend=None,
            icon='assignment'
        ),
        QuickStatistic(
            label='Total Exams',
            value=str(total_exams),
            trend=None,
            icon='school'
        ),
        QuickStatistic(
            label='Avg Attendance (30d)',
            value=f'{round(float(avg_attendance_all) * 100, 1)}%',
            trend=None,
            icon='people'
        ),
        QuickStatistic(
            label='Pending Announcements',
            value=str(pending_announcements),
            trend=None,
            icon='notifications'
        )
    ]
    
    return DashboardResponse(
        overview=overview,
        attendance_summary=attendance_summary,
        recent_exam_results=exam_results_list,
        upcoming_events=upcoming_events_list,
        pending_tasks=pending_tasks_list,
        performance_trends=performance_trends,
        quick_statistics=quick_stats
    )
