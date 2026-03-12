import pytest
from datetime import datetime, date
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.attendance import Attendance, AttendanceStatus
from src.models.assignment import Assignment, AssignmentStatus
from src.utils.security import get_password_hash


@pytest.mark.unit
class TestModels:
    """Test database models."""

    def test_user_model(self, db_session: Session, institution, admin_role):
        """Test User model creation and relationships."""
        user = User(
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            hashed_password=get_password_hash("password"),
            institution_id=institution.id,
            role_id=admin_role.id,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        assert user.id is not None
        assert user.institution.id == institution.id
        assert user.role.id == admin_role.id

    def test_student_model(
        self, db_session: Session, institution, section, academic_year
    ):
        """Test Student model creation."""
        student = Student(
            institution_id=institution.id,
            admission_number="ADM001",
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            section_id=section.id,
            academic_year_id=academic_year.id,
            date_of_birth=date(2008, 1, 1),
            date_of_admission=date(2020, 4, 1),
            gender="Male",
            is_active=True,
        )
        db_session.add(student)
        db_session.commit()

        assert student.id is not None
        assert student.section.id == section.id

    def test_attendance_model(
        self, db_session: Session, institution, student, subject, section
    ):
        """Test Attendance model creation."""
        attendance = Attendance(
            institution_id=institution.id,
            student_id=student.id,
            subject_id=subject.id,
            section_id=section.id,
            date=date.today(),
            status=AttendanceStatus.PRESENT,
            period=1,
        )
        db_session.add(attendance)
        db_session.commit()

        assert attendance.id is not None
        assert attendance.status == AttendanceStatus.PRESENT

    def test_assignment_model(
        self, db_session: Session, institution, grade, section, subject, teacher
    ):
        """Test Assignment model creation."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test description",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now(),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        assert assignment.id is not None
        assert assignment.title == "Test Assignment"

    def test_model_timestamps(self, db_session: Session, institution, admin_role):
        """Test that models have timestamps."""
        user = User(
            username="timestamp_test",
            email="timestamp@example.com",
            first_name="Test",
            last_name="User",
            hashed_password=get_password_hash("password"),
            institution_id=institution.id,
            role_id=admin_role.id,
        )
        db_session.add(user)
        db_session.commit()

        assert hasattr(user, "created_at")
        assert hasattr(user, "updated_at")
        assert user.created_at is not None
