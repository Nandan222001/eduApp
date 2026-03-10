from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class DateRangeType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class GroupByType(str, Enum):
    STUDENT = "student"
    CLASS = "class"
    SUBJECT = "subject"
    GRADE = "grade"
    EXAM = "exam"
    MONTH = "month"


class MetricType(str, Enum):
    EXAM_PERFORMANCE = "exam_performance"
    ATTENDANCE = "attendance"
    ASSIGNMENT = "assignment"
    OVERALL = "overall"


class ReportType(str, Enum):
    STUDENT_PERFORMANCE = "student_performance"
    CLASS_PERFORMANCE = "class_performance"
    INSTITUTION_PERFORMANCE = "institution_performance"
    ATTENDANCE_SUMMARY = "attendance_summary"
    ASSIGNMENT_SUMMARY = "assignment_summary"
    EXAM_ANALYSIS = "exam_analysis"
    YOY_COMPARISON = "yoy_comparison"
    SUBJECT_ANALYSIS = "subject_analysis"


class ReportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalyticsQueryParams(BaseModel):
    date_range_type: DateRangeType = DateRangeType.MONTHLY
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    group_by: Optional[GroupByType] = None
    metric_types: Optional[List[MetricType]] = None
    student_ids: Optional[List[int]] = None
    section_ids: Optional[List[int]] = None
    grade_ids: Optional[List[int]] = None
    subject_ids: Optional[List[int]] = None
    academic_year_id: Optional[int] = None


class StudentMetrics(BaseModel):
    student_id: int
    student_name: str
    total_exams: int
    exams_appeared: int
    exams_passed: int
    average_percentage: float
    average_grade_point: Optional[float] = None
    attendance_percentage: float
    total_attendance_days: int
    present_days: int
    total_assignments: int
    assignments_submitted: int
    assignments_graded: int
    average_assignment_score: Optional[float] = None
    rank_in_class: Optional[int] = None
    rank_in_grade: Optional[int] = None
    total_gamification_points: int = 0
    badges_earned: int = 0
    study_streak_days: int = 0

    class Config:
        from_attributes = True


class ClassMetrics(BaseModel):
    section_id: int
    section_name: str
    grade_name: str
    total_students: int
    active_students: int
    average_exam_percentage: float
    highest_exam_percentage: Optional[float] = None
    lowest_exam_percentage: Optional[float] = None
    median_exam_percentage: Optional[float] = None
    pass_percentage: float
    average_attendance_percentage: float
    highest_attendance_percentage: Optional[float] = None
    lowest_attendance_percentage: Optional[float] = None
    average_assignment_score: Optional[float] = None
    assignment_submission_rate: float

    class Config:
        from_attributes = True


class InstitutionMetrics(BaseModel):
    total_students: int
    active_students: int
    total_teachers: int
    total_classes: int
    overall_average_percentage: float
    overall_pass_percentage: float
    overall_attendance_percentage: float
    total_exams_conducted: int
    total_assignments_created: int
    assignment_submission_rate: float

    class Config:
        from_attributes = True


class SubjectPerformance(BaseModel):
    subject_id: int
    subject_name: str
    average_marks: float
    highest_marks: float
    lowest_marks: float
    pass_percentage: float
    total_students: int
    students_passed: int
    students_failed: int


class ExamAnalytics(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: str
    total_students: int
    students_appeared: int
    students_passed: int
    pass_percentage: float
    average_marks: float
    highest_marks: float
    lowest_marks: float
    median_marks: Optional[float] = None
    standard_deviation: Optional[float] = None
    subjects: List[SubjectPerformance] = []


class YoYComparison(BaseModel):
    metric_name: str
    current_year_value: float
    previous_year_value: Optional[float] = None
    change_percentage: Optional[float] = None
    trend: str


class StudentPerformanceComparison(BaseModel):
    student_metrics: StudentMetrics
    class_average: Dict[str, float]
    grade_average: Dict[str, float]
    percentile_in_class: Optional[float] = None
    percentile_in_grade: Optional[float] = None
    strength_subjects: List[str] = []
    weak_subjects: List[str] = []


class AnalyticsResponse(BaseModel):
    period_start: date
    period_end: date
    group_by: Optional[str] = None
    metrics: List[Dict[str, Any]]
    summary: Dict[str, Any]
    generated_at: datetime


class ReportGenerationRequest(BaseModel):
    report_type: ReportType
    report_title: str
    report_description: Optional[str] = None
    parameters: AnalyticsQueryParams
    format: str = Field(default="pdf", pattern="^(pdf|csv)$")
    include_charts: bool = True


class ReportResponse(BaseModel):
    id: int
    institution_id: int
    report_type: str
    report_title: str
    report_description: Optional[str] = None
    status: str
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentPerformanceTrend(BaseModel):
    date: date
    average_percentage: float
    attendance_percentage: float
    assignment_score: Optional[float] = None


class AnalyticsDashboard(BaseModel):
    institution_metrics: InstitutionMetrics
    recent_exams: List[ExamAnalytics]
    top_performing_classes: List[ClassMetrics]
    top_performing_students: List[StudentMetrics]
    attendance_trends: List[Dict[str, Any]]
    assignment_trends: List[Dict[str, Any]]
    yoy_comparisons: List[YoYComparison]
