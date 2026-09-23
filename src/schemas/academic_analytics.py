"""Schemas for academic performance analytics (student/class/institution metrics,
exam analytics, YoY comparisons, performance trends and comparisons).

This is a distinct feature from `src.schemas.analytics`, which covers event
tracking (AnalyticsEvent/PerformanceMetric/UserSession/FeatureUsage). Do not
merge the two files - they back unrelated models/services.
"""
from datetime import date as date_type
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class DateRangeType(str, Enum):
    CUSTOM = "custom"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class MetricType(str, Enum):
    STUDENT = "student"
    CLASS = "class"
    INSTITUTION = "institution"
    EXAM = "exam"


class AnalyticsQueryParams(BaseModel):
    date_range_type: DateRangeType = DateRangeType.MONTHLY
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None


class StudentMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: int
    student_name: str
    total_exams: int
    exams_appeared: int
    exams_passed: int
    average_percentage: float
    average_grade_point: Optional[float] = None
    rank_in_class: Optional[int] = None
    rank_in_grade: Optional[int] = None
    attendance_percentage: float
    total_attendance_days: int
    present_days: int
    total_assignments: int
    assignments_submitted: int
    assignments_graded: int
    average_assignment_score: Optional[float] = None
    total_gamification_points: int
    badges_earned: int
    study_streak_days: int


class ClassMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


class InstitutionMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_students: int
    active_students: int
    total_teachers: int
    total_classes: int
    overall_average_percentage: float
    overall_pass_percentage: float
    total_exams_conducted: int
    overall_attendance_percentage: float
    total_assignments_created: int
    assignment_submission_rate: float


class SubjectPerformance(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)

    metric_name: str
    current_year_value: float
    previous_year_value: Optional[float] = None
    change_percentage: Optional[float] = None
    trend: str


class StudentPerformanceComparison(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_metrics: StudentMetrics
    class_average: Dict[str, float]
    grade_average: Dict[str, float]
    percentile_in_class: Optional[float] = None
    percentile_in_grade: Optional[float] = None
    strength_subjects: List[str] = []
    weak_subjects: List[str] = []


class StudentPerformanceTrend(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Field literally named `date` needs the aliased `date_type` import above,
    # not the bare `date` name - see src/schemas/community_service.py etc.
    date: date_type
    average_percentage: float
    attendance_percentage: float
    assignment_score: Optional[float] = None
