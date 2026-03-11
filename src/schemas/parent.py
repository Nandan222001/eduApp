from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class ChildBasicInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    admission_number: Optional[str] = None
    photo_url: Optional[str] = None
    section_name: Optional[str] = None
    grade_name: Optional[str] = None


class AttendanceStats(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    attendance_percentage: float


class ChildOverviewResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    admission_number: Optional[str] = None
    photo_url: Optional[str] = None
    section_name: Optional[str] = None
    grade_name: Optional[str] = None
    attendance_percentage: float
    current_rank: Optional[int] = None
    average_score: Optional[float] = None
    total_students: Optional[int] = None
    attendance_status: Optional[str] = None


class TodayAttendanceResponse(BaseModel):
    date: date
    status: Optional[str] = None
    is_absent: bool = False
    is_present: bool = False
    is_late: bool = False
    is_half_day: bool = False
    alert_sent: bool = False
    remarks: Optional[str] = None


class RecentGradeResponse(BaseModel):
    subject_name: str
    exam_name: str
    exam_type: str
    marks_obtained: float
    total_marks: float
    percentage: float
    grade: Optional[str] = None
    exam_date: date
    rank: Optional[int] = None


class PendingAssignmentResponse(BaseModel):
    id: int
    title: str
    subject_name: str
    due_date: datetime
    days_remaining: int
    description: Optional[str] = None
    max_marks: float
    is_overdue: bool = False


class SubjectPerformance(BaseModel):
    subject_name: str
    average_score: float
    total_assignments: int
    completed_assignments: int
    pending_assignments: int
    attendance_percentage: float


class WeeklyProgressResponse(BaseModel):
    week_start: date
    week_end: date
    attendance_days: int
    present_days: int
    assignments_completed: int
    assignments_pending: int
    average_score: Optional[float] = None
    subject_performance: List[SubjectPerformance] = []


class TermPerformance(BaseModel):
    term_name: str
    subject_name: str
    average_marks: float
    total_marks: float
    percentage: float
    grade: Optional[str] = None


class PerformanceComparisonResponse(BaseModel):
    current_term: str
    previous_term: str
    current_term_data: List[TermPerformance]
    previous_term_data: List[TermPerformance]
    improvement_subjects: List[str] = []
    declined_subjects: List[str] = []
    overall_improvement: float = 0.0


class GoalProgress(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    goal_type: str
    target_value: float
    current_value: float
    progress_percentage: float
    status: str
    start_date: date
    end_date: date
    days_remaining: int


class TeacherMessage(BaseModel):
    id: int
    teacher_name: str
    subject: Optional[str] = None
    content: str
    created_at: datetime
    is_read: bool


class ParentDashboardResponse(BaseModel):
    parent_info: Dict[str, Any]
    children: List[ChildBasicInfo]
    selected_child: Optional[ChildOverviewResponse] = None
    today_attendance: Optional[TodayAttendanceResponse] = None
    attendance_stats: Optional[AttendanceStats] = None
    recent_grades: List[RecentGradeResponse] = []
    pending_assignments: List[PendingAssignmentResponse] = []
    weekly_progress: Optional[WeeklyProgressResponse] = None
    goals: List[GoalProgress] = []
    teacher_messages: List[TeacherMessage] = []
    performance_comparison: Optional[PerformanceComparisonResponse] = None
