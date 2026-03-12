import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.student import Student
from src.models.academic import Subject, Section
from src.models.attendance import Attendance, AttendanceStatus


@pytest.mark.integration
class TestAttendanceAPI:
    """Integration tests for attendance API."""

    def test_create_attendance(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test creating attendance record."""
        response = client.post(
            "/api/v1/attendance/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "subject_id": subject.id,
                "section_id": section.id,
                "date": str(date.today()),
                "status": "present",
                "period": 1,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["student_id"] == student.id
        assert data["status"] == "present"

    def test_bulk_mark_attendance(
        self,
        client: TestClient,
        auth_headers: dict,
        student: Student,
        subject: Subject,
        section: Section,
    ):
        """Test bulk attendance marking."""
        response = client.post(
            "/api/v1/attendance/bulk",
            headers=auth_headers,
            json={
                "section_id": section.id,
                "subject_id": subject.id,
                "date": str(date.today()),
                "period": 1,
                "attendance_records": [
                    {
                        "student_id": student.id,
                        "status": "present",
                    }
                ],
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["total_marked"] > 0

    def test_get_attendance_list(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test getting attendance list."""
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

        response = client.get(
            "/api/v1/attendance/",
            headers=auth_headers,
            params={
                "section_id": section.id,
                "start_date": str(date.today()),
                "end_date": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0

    def test_get_student_attendance_stats(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test getting student attendance statistics."""
        for i in range(5):
            attendance = Attendance(
                institution_id=institution.id,
                student_id=student.id,
                subject_id=subject.id,
                section_id=section.id,
                date=date.today(),
                status=AttendanceStatus.PRESENT if i < 4 else AttendanceStatus.ABSENT,
                period=i + 1,
            )
            db_session.add(attendance)
        db_session.commit()

        response = client.get(
            f"/api/v1/attendance/reports/student/{student.id}/stats",
            headers=auth_headers,
            params={
                "start_date": str(date.today()),
                "end_date": str(date.today()),
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "attendance_percentage" in data or "total_classes" in data

    def test_get_defaulters(
        self,
        client: TestClient,
        auth_headers: dict,
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
                date=date.today(),
                status=AttendanceStatus.ABSENT if i < 6 else AttendanceStatus.PRESENT,
                period=i + 1,
            )
            db_session.add(attendance)
        db_session.commit()

        response = client.get(
            "/api/v1/attendance/reports/defaulters",
            headers=auth_headers,
            params={
                "start_date": str(date.today()),
                "end_date": str(date.today()),
                "threshold_percentage": 75.0,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_update_attendance(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test updating attendance record."""
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

        response = client.put(
            f"/api/v1/attendance/{attendance.id}",
            headers=auth_headers,
            json={
                "status": "absent",
                "remarks": "Updated status",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "absent"

    def test_delete_attendance(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        student: Student,
        subject: Subject,
        section: Section,
        institution,
    ):
        """Test deleting attendance record."""
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

        response = client.delete(
            f"/api/v1/attendance/{attendance.id}",
            headers=auth_headers,
        )

        assert response.status_code == 204
