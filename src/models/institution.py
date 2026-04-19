# ---------------- CLEAN MINIMAL MODELS INIT ----------------
# This version removes all modules that depend on missing models
# (like Period / timetable / ML / plagiarism etc.)

# from src.models.institution import Institution
from src.models.user import User
from src.models.user_settings import UserSettings, UserDevice, AccountDeletionRequest
from src.models.role import Role
from src.models.permission import Permission
from src.models.subscription import Subscription
from src.models.audit_log import AuditLog
from src.models.password_reset_token import PasswordResetToken

# Academic core
from src.models.academic import (
    AcademicYear,
    Grade,
    Section,
    Subject,
    GradeSubject,
    Chapter,
    Topic,
    DayOfWeek,
)

# Core people
from src.models.teacher import Teacher, TeacherSubject
from src.models.student import Student, Parent, StudentParent

# Attendance
from src.models.attendance import (
    Attendance,
    AttendanceCorrection,
    AttendanceSummary,
    AttendanceStatus,
    CorrectionStatus,
)

# Assignments
from src.models.assignment import (
    Assignment,
    AssignmentFile,
    Submission,
    SubmissionFile,
    AssignmentStatus,
    SubmissionStatus,
)

# Exams
from src.models.examination import (
    Exam,
    ExamSubject,
    ExamSchedule,
    ExamMarks,
    ExamResult,
    GradeConfiguration,
    ExamPerformanceAnalytics,
    ExamType,
    ExamStatus,
)

# Basic utilities
from src.models.notification import Notification, Message
from src.models.study_material import StudyMaterial
from src.models.analytics import AnalyticsEvent
from src.models.search import SearchHistory
from src.models.feedback import Feedback


# ---------------- EXPORTED MODELS ----------------
__all__ = [
    "Institution",
    "User",
    "UserSettings",
    "UserDevice",
    "AccountDeletionRequest",
    "Role",
    "Permission",
    "Subscription",
    "AuditLog",
    "PasswordResetToken",

    "AcademicYear",
    "Grade",
    "Section",
    "Subject",
    "GradeSubject",
    "Chapter",
    "Topic",
    "DayOfWeek",

    "Teacher",
    "TeacherSubject",

    "Student",
    "Parent",
    "StudentParent",

    "Attendance",
    "AttendanceCorrection",
    "AttendanceSummary",
    "AttendanceStatus",
    "CorrectionStatus",

    "Assignment",
    "AssignmentFile",
    "Submission",
    "SubmissionFile",
    "AssignmentStatus",
    "SubmissionStatus",

    "Exam",
    "ExamSubject",
    "ExamSchedule",
    "ExamMarks",
    "ExamResult",
    "ExamType",
    "ExamStatus",

    "Notification",
    "Message",
    "StudyMaterial",
    "AnalyticsEvent",
    "SearchHistory",
    "Feedback",
]

# ...existing code...
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from src.database import Base

if TYPE_CHECKING:
    # type-checker-only imports to avoid circular import at runtime
    from src.models.user import User  # noqa: F401
    from src.models.role import Role  # noqa: F401
    from src.models.period import Period  # noqa: F401


class Institution(Base):
    __tablename__ = "institutions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=True, unique=True)
    domain = Column(String(255), nullable=True, unique=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Use string class names to avoid import-time circular imports
    users = relationship(
        "User",
        back_populates="institution",
        cascade="all, delete-orphan",
        lazy="select",
    )
    periods = relationship(
        "Period",
        back_populates="institution",
        cascade="all, delete-orphan",
        lazy="select",
    )
    roles = relationship(
        "Role",
        back_populates="institution",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Institution id={self.id} name={self.name!r}>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "domain": self.domain,
            "address": self.address,
            "phone": self.phone,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
# ...existing code...