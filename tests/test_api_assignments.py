import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import Subject, Section, Grade
from src.models.assignment import Assignment, AssignmentStatus


@pytest.mark.integration
class TestAssignmentAPI:
    """Integration tests for assignment API."""

    def test_create_assignment(
        self,
        client: TestClient,
        auth_headers: dict,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test creating an assignment."""
        response = client.post(
            "/api/v1/assignments/",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Math Homework 1",
                "description": "Complete exercises 1-10",
                "grade_id": grade.id,
                "section_id": section.id,
                "subject_id": subject.id,
                "teacher_id": teacher.id,
                "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
                "total_marks": 100,
                "instructions": "Solve all problems",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Math Homework 1"
        assert data["total_marks"] == 100

    def test_list_assignments(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test listing assignments."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        response = client.get(
            "/api/v1/assignments/",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0

    def test_get_assignment(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test getting a specific assignment."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/{assignment.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == assignment.id
        assert data["title"] == "Test Assignment"

    def test_update_assignment(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test updating an assignment."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        response = client.put(
            f"/api/v1/assignments/{assignment.id}",
            headers=auth_headers,
            json={
                "title": "Updated Assignment",
                "total_marks": 150,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Assignment"
        assert data["total_marks"] == 150

    def test_delete_assignment(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test deleting an assignment."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        response = client.delete(
            f"/api/v1/assignments/{assignment.id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

    def test_get_assignment_statistics(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test getting assignment statistics."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        response = client.get(
            f"/api/v1/assignments/{assignment.id}/statistics",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_students" in data or "submitted_count" in data

    def test_unauthorized_access(
        self,
        client: TestClient,
    ):
        """Test unauthorized access to assignment endpoints."""
        response = client.get("/api/v1/assignments/")
        assert response.status_code == 401
