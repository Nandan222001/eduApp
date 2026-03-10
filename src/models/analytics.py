from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Index,
    Numeric,
    Date,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


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


class AnalyticsCache(Base):
    __tablename__ = "analytics_cache"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(
        Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    cache_key = Column(String(500), nullable=False, unique=True, index=True)
    cache_type = Column(String(100), nullable=False, index=True)
    data = Column(Text, nullable=False)
    metadata = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    institution = relationship("Institution")

    __table_args__ = (
        Index("idx_analytics_cache_institution", "institution_id"),
        Index("idx_analytics_cache_key", "cache_key"),
        Index("idx_analytics_cache_type", "cache_type"),
        Index("idx_analytics_cache_expires", "expires_at"),
    )


class StudentPerformanceMetrics(Base):
    __tablename__ = "student_performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(
        Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id = Column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    academic_year_id = Column(
        Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True
    )
    grade_id = Column(
        Integer, ForeignKey("grades.id", ondelete="CASCADE"), nullable=False, index=True
    )
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)

    total_exams = Column(Integer, nullable=False, default=0)
    exams_appeared = Column(Integer, nullable=False, default=0)
    exams_passed = Column(Integer, nullable=False, default=0)
    average_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)
    average_grade_point = Column(Numeric(3, 2), nullable=True)

    attendance_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)
    total_attendance_days = Column(Integer, nullable=False, default=0)
    present_days = Column(Integer, nullable=False, default=0)

    total_assignments = Column(Integer, nullable=False, default=0)
    assignments_submitted = Column(Integer, nullable=False, default=0)
    assignments_graded = Column(Integer, nullable=False, default=0)
    average_assignment_score = Column(Numeric(5, 2), nullable=True)

    rank_in_class = Column(Integer, nullable=True)
    rank_in_grade = Column(Integer, nullable=True)

    total_gamification_points = Column(Integer, nullable=False, default=0)
    badges_earned = Column(Integer, nullable=False, default=0)
    study_streak_days = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    institution = relationship("Institution")
    student = relationship("Student")
    academic_year = relationship("AcademicYear")
    grade = relationship("Grade")

    __table_args__ = (
        Index("idx_student_metrics_institution", "institution_id"),
        Index("idx_student_metrics_student", "student_id"),
        Index("idx_student_metrics_academic_year", "academic_year_id"),
        Index("idx_student_metrics_grade", "grade_id"),
        Index("idx_student_metrics_period", "period_start", "period_end"),
        Index("idx_student_metrics_rank_class", "rank_in_class"),
        Index("idx_student_metrics_rank_grade", "rank_in_grade"),
    )


class ClassPerformanceMetrics(Base):
    __tablename__ = "class_performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(
        Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    section_id = Column(
        Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    academic_year_id = Column(
        Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True
    )
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)

    total_students = Column(Integer, nullable=False, default=0)
    active_students = Column(Integer, nullable=False, default=0)

    average_exam_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)
    highest_exam_percentage = Column(Numeric(5, 2), nullable=True)
    lowest_exam_percentage = Column(Numeric(5, 2), nullable=True)
    median_exam_percentage = Column(Numeric(5, 2), nullable=True)
    pass_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)

    average_attendance_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)
    highest_attendance_percentage = Column(Numeric(5, 2), nullable=True)
    lowest_attendance_percentage = Column(Numeric(5, 2), nullable=True)

    average_assignment_score = Column(Numeric(5, 2), nullable=True)
    assignment_submission_rate = Column(Numeric(5, 2), nullable=False, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    institution = relationship("Institution")
    section = relationship("Section")
    academic_year = relationship("AcademicYear")

    __table_args__ = (
        Index("idx_class_metrics_institution", "institution_id"),
        Index("idx_class_metrics_section", "section_id"),
        Index("idx_class_metrics_academic_year", "academic_year_id"),
        Index("idx_class_metrics_period", "period_start", "period_end"),
    )


class InstitutionPerformanceMetrics(Base):
    __tablename__ = "institution_performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(
        Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    academic_year_id = Column(
        Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True
    )
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)

    total_students = Column(Integer, nullable=False, default=0)
    active_students = Column(Integer, nullable=False, default=0)
    total_teachers = Column(Integer, nullable=False, default=0)
    total_classes = Column(Integer, nullable=False, default=0)

    overall_average_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)
    overall_pass_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)
    overall_attendance_percentage = Column(Numeric(5, 2), nullable=False, default=0.0)

    total_exams_conducted = Column(Integer, nullable=False, default=0)
    total_assignments_created = Column(Integer, nullable=False, default=0)
    assignment_submission_rate = Column(Numeric(5, 2), nullable=False, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    institution = relationship("Institution")
    academic_year = relationship("AcademicYear")

    __table_args__ = (
        Index("idx_institution_metrics_institution", "institution_id"),
        Index("idx_institution_metrics_academic_year", "academic_year_id"),
        Index("idx_institution_metrics_period", "period_start", "period_end"),
    )


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(
        Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_type = Column(SQLEnum(ReportType), nullable=False, index=True)
    report_title = Column(String(255), nullable=False)
    report_description = Column(Text, nullable=True)

    generated_by_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    parameters = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    file_url = Column(String(500), nullable=True)
    s3_key = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)

    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING, nullable=False, index=True)
    error_message = Column(Text, nullable=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    institution = relationship("Institution")
    generated_by = relationship("User")

    __table_args__ = (
        Index("idx_generated_report_institution", "institution_id"),
        Index("idx_generated_report_type", "report_type"),
        Index("idx_generated_report_status", "status"),
        Index("idx_generated_report_generated_by", "generated_by_id"),
        Index("idx_generated_report_created", "created_at"),
    )
