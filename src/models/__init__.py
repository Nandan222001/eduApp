from src.models.institution import Institution
from src.models.user import User
from src.models.role import Role
from src.models.permission import Permission
from src.models.user_settings import UserSettings, UserDevice, AccountDeletionRequest
from src.models.subscription import Subscription
from src.models.audit_log import AuditLog
from src.models.password_reset_token import PasswordResetToken

from src.models.academic import (
    AcademicYear, Grade, Section, Subject, GradeSubject, Chapter, Topic, DayOfWeek,
)

from src.models.teacher import Teacher, TeacherSubject
from src.models.student import Student, Parent, StudentParent

from src.models.attendance import (
    Attendance, AttendanceCorrection, AttendanceSummary, AttendanceStatus, CorrectionStatus,
)

from src.models.assignment import (
    Assignment, AssignmentFile, Submission, SubmissionFile, AssignmentStatus, SubmissionStatus,
)

from src.models.examination import (
    Exam, ExamSubject, ExamSchedule, ExamMarks, ExamResult,
    GradeConfiguration, ExamPerformanceAnalytics, ExamType, ExamStatus,
)

from src.models.notification import Notification, Message
from src.models.study_material import StudyMaterial
from src.models.analytics import AnalyticsEvent
from src.models.search import SearchHistory
from src.models.feedback import Feedback

from src.models.previous_year_papers import PreviousYearPaper, QuestionBank
from src.models.plagiarism import PlagiarismCheck, PlagiarismPrivacyConsent
from src.models.homework_scanner import HomeworkScan

# Register all remaining models so SQLAlchemy can resolve string relationships
import src.models.branding
import src.models.career
import src.models.carpools
import src.models.community_service
import src.models.conferences
import src.models.content_marketplace
import src.models.dashboard_widget
import src.models.document_vault
import src.models.doubt
import src.models.elections
import src.models.entrepreneurship
import src.models.event
import src.models.family
import src.models.fee
import src.models.finance_education
import src.models.flashcard
import src.models.gamification
import src.models.goal
import src.models.learning_path
import src.models.library
import src.models.live_events
import src.models.mistake_analysis
import src.models.ml_prediction
import src.models.mobile_auth
import src.models.olympics
import src.models.onboarding
import src.models.parent_education
import src.models.parent_roi
import src.models.peer_recognition
import src.models.peer_tutoring
import src.models.performance_monitoring
import src.models.push_device
import src.models.quiz
import src.models.rate_limit
import src.models.research
import src.models.reverse_classroom
import src.models.scholarship_essays
import src.models.school_admin
import src.models.student_employment
import src.models.study_buddy
import src.models.study_group
import src.models.study_planner
import src.models.subject_rpg
import src.models.timetable
import src.models.transport
import src.models.volunteer_hours
import src.models.wellbeing

__all__ = [
    "Institution", "User", "Role", "Permission",
    "UserSettings", "UserDevice", "AccountDeletionRequest",
    "Subscription", "AuditLog", "PasswordResetToken",
    "AcademicYear", "Grade", "Section", "Subject", "GradeSubject",
    "Chapter", "Topic", "DayOfWeek",
    "Teacher", "TeacherSubject",
    "Student", "Parent", "StudentParent",
    "Attendance", "AttendanceCorrection", "AttendanceSummary",
    "AttendanceStatus", "CorrectionStatus",
    "Assignment", "AssignmentFile", "Submission", "SubmissionFile",
    "AssignmentStatus", "SubmissionStatus",
    "Exam", "ExamSubject", "ExamSchedule", "ExamMarks", "ExamResult",
    "GradeConfiguration", "ExamPerformanceAnalytics", "ExamType", "ExamStatus",
    "Notification", "Message", "StudyMaterial", "AnalyticsEvent",
    "SearchHistory", "Feedback",
    "PreviousYearPaper", "QuestionBank",
    "PlagiarismCheck", "PlagiarismPrivacyConsent",
    "HomeworkScan",
]
