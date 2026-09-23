import pytest
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from src.services.attendance_service import AttendanceService
from src.models.attendance import Attendance, AttendanceStatus
from src.models.student import Student
from src.models.academic import Subject, Section
from src.schemas.attendance import AttendanceCreate, BulkAttendanceCreate


@pytest.mark.unit
class TestAttendanceService:
    """Test attendance service business logic."""

    @pytest.fixture
    def attendance_service(self, db_session: Session):
        """Create attendance service instance."""
        return AttendanceService(db_session)

    def test_create_attendance(
        self,
        attendance_service: AttendanceService,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test creating attendance record."""
        attendance_data = AttendanceCreate(
            institution_id=institution.id,
            student_id=student.id,
            subject_id=subject.id,
            section_id=section.id,
            date=date.today(),
            status="present",
        )

        attendance = attendance_service.create_attendance(attendance_data)

        assert attendance is not None
        assert attendance.student_id == student.id
        assert attendance.status == AttendanceStatus.PRESENT

    def test_bulk_mark_attendance(
        self,
        attendance_service: AttendanceService,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
        admin_user,
    ):
        """Test bulk attendance marking."""
        bulk_data = BulkAttendanceCreate(
            section_id=section.id,
            subject_id=subject.id,
            date=date.today(),
            attendances=[
                {"student_id": student.id, "status": "present"}
            ],
        )

        result = attendance_service.bulk_mark_attendance(
            institution_id=institution.id,
            data=bulk_data,
            marked_by_id=admin_user.id,
        )

        assert result["total"] == 1
        assert result["success"] == 1

    def test_calculate_attendance_percentage(
        self,
        attendance_service: AttendanceService,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test attendance percentage calculation."""
        for i in range(10):
            attendance = Attendance(
                institution_id=institution.id,
                student_id=student.id,
                subject_id=subject.id,
                section_id=section.id,
                date=date.today() - timedelta(days=i),
                status=AttendanceStatus.PRESENT if i < 8 else AttendanceStatus.ABSENT,
            )
            db_session.add(attendance)
        db_session.commit()

        stats = attendance_service.get_student_attendance_stats(
            student_id=student.id,
            start_date=date.today() - timedelta(days=9),
            end_date=date.today(),
        )

        assert stats["attendance_percentage"] == 80.0

    def test_get_defaulters(
        self,
        attendance_service: AttendanceService,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test getting attendance defaulters."""
        for i in range(10):
            attendance = Attendance(
                institution_id=institution.id,
                student_id=student.id,
                subject_id=subject.id,
                section_id=section.id,
                date=date.today() - timedelta(days=i),
                status=AttendanceStatus.ABSENT if i < 7 else AttendanceStatus.PRESENT,
            )
            db_session.add(attendance)
        db_session.commit()

        defaulters = attendance_service.get_defaulters(
            institution_id=institution.id,
            start_date=date.today() - timedelta(days=9),
            end_date=date.today(),
            threshold_percentage=75.0,
        )

        assert len(defaulters) > 0
        assert defaulters[0].student_id == student.id
