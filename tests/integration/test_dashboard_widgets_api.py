import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.academic import Grade, Section, Subject
from src.models.assignment import Assignment, AssignmentStatus
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.user import User


@pytest.fixture
def student_headers(client: TestClient, student: Student) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student.user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def teacher_headers(client: TestClient, teacher: Teacher) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher.user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
class TestDashboardWidgetsAPI:
    """Integration tests for /api/v1/dashboard/widgets/*, a real router
    (src/api/v1/dashboard_widgets.py) backed by
    src/services/dashboard_widget_service.py -- confirmed to have real,
    previously-broken frontend consumers (frontend/src/api/
    dashboardWidgets.ts, used by 11 page/component files) that was never
    registered in src/api/v1/__init__.py at all until this pass (see
    TESTING_PROGRESS.md's twenty-third pass)."""

    def test_create_get_list_update_delete_widget(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/dashboard/widgets",
            headers=auth_headers,
            json={"widget_type": "quick_stats", "title": "My Stats", "position": 0},
        )
        assert response.status_code == 201
        widget_id = response.json()["id"]

        response = client.get(f"/api/v1/dashboard/widgets/{widget_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "My Stats"

        response = client.get("/api/v1/dashboard/widgets", headers=auth_headers)
        assert response.status_code == 200
        assert any(w["id"] == widget_id for w in response.json())

        response = client.put(
            f"/api/v1/dashboard/widgets/{widget_id}",
            headers=auth_headers,
            json={"title": "Updated Stats", "is_visible": False},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Stats"
        assert response.json()["is_visible"] is False

        response = client.delete(f"/api/v1/dashboard/widgets/{widget_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/dashboard/widgets/{widget_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_get_nonexistent_widget(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/dashboard/widgets/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_widget_positions(self, client: TestClient, auth_headers: dict):
        w1 = client.post(
            "/api/v1/dashboard/widgets",
            headers=auth_headers,
            json={"widget_type": "quick_stats", "title": "A", "position": 0},
        ).json()
        w2 = client.post(
            "/api/v1/dashboard/widgets",
            headers=auth_headers,
            json={"widget_type": "badges", "title": "B", "position": 1},
        ).json()

        response = client.post(
            "/api/v1/dashboard/widgets/positions",
            headers=auth_headers,
            json={"updates": [{"widget_id": w1["id"], "position": 5}, {"widget_id": w2["id"], "position": 6}]},
        )
        assert response.status_code == 200

        response = client.get(f"/api/v1/dashboard/widgets/{w1['id']}", headers=auth_headers)
        assert response.json()["position"] == 5

    def test_initialize_default_widgets_for_teacher(self, client: TestClient, teacher_headers: dict):
        # admin_user's role ("admin") has no entry in the router's
        # student/teacher/parent preset map, so this specifically needs a
        # real teacher user to get a non-empty default widget set.
        response = client.post("/api/v1/dashboard/widgets/initialize", headers=teacher_headers)
        assert response.status_code == 200
        widgets = response.json()
        assert len(widgets) > 0

        # Calling again with existing widgets returns those instead of duplicating.
        response = client.post("/api/v1/dashboard/widgets/initialize", headers=teacher_headers)
        assert len(response.json()) == len(widgets)

    def test_reset_to_defaults(self, client: TestClient, teacher_headers: dict):
        client.post("/api/v1/dashboard/widgets/initialize", headers=teacher_headers)
        response = client.post("/api/v1/dashboard/widgets/reset", headers=teacher_headers)
        assert response.status_code == 200
        assert len(response.json()) > 0

    def test_get_role_presets(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/dashboard/presets", headers=auth_headers)
        assert response.status_code == 200

    def test_widget_data_quick_stats_for_student(
        self, client: TestClient, student_headers: dict, student: Student
    ):
        # This exercises DashboardWidgetService._get_quick_stats's student
        # branch, which previously did `Assignment.grade_id ==
        # user.student_profile.grade_id` -- Student has no grade_id column
        # at all (only section_id), so this raised AttributeError on every
        # real request. Fixed to go through student_profile.section.grade_id.
        widget = client.post(
            "/api/v1/dashboard/widgets",
            headers=student_headers,
            json={"widget_type": "quick_stats", "title": "Stats", "position": 0},
        ).json()

        response = client.get(f"/api/v1/dashboard/widgets/{widget['id']}/data", headers=student_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["widget_type"] == "quick_stats"
        assert "stats" in data["data"]

    def test_widget_data_upcoming_deadlines_for_student(
        self,
        client: TestClient,
        student_headers: dict,
        student: Student,
        db_session: Session,
        institution: Institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        assignment = Assignment(
            institution_id=institution.id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Homework 1",
            description="Do the homework",
            due_date=datetime.utcnow() + timedelta(days=1),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()

        widget = client.post(
            "/api/v1/dashboard/widgets",
            headers=student_headers,
            json={"widget_type": "upcoming_deadlines", "title": "Deadlines", "position": 0},
        ).json()

        response = client.get(f"/api/v1/dashboard/widgets/{widget['id']}/data", headers=student_headers)
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["total_count"] == 1
        assert data["deadlines"][0]["title"] == "Homework 1"

    def test_widget_data_pending_grading_for_teacher_and_attendance_alerts(
        self, client: TestClient, auth_headers: dict
    ):
        # These exercise the teacher branches of _get_pending_grading and
        # _get_attendance_alerts, which previously read a nonexistent
        # Student.grade_id / student.grade relationship.
        widget = client.post(
            "/api/v1/dashboard/widgets",
            headers=auth_headers,
            json={"widget_type": "pending_grading", "title": "Grading", "position": 0},
        ).json()
        response = client.get(f"/api/v1/dashboard/widgets/{widget['id']}/data", headers=auth_headers)
        assert response.status_code == 200

        widget2 = client.post(
            "/api/v1/dashboard/widgets",
            headers=auth_headers,
            json={"widget_type": "attendance_alerts", "title": "Alerts", "position": 1},
        ).json()
        response = client.get(f"/api/v1/dashboard/widgets/{widget2['id']}/data", headers=auth_headers)
        assert response.status_code == 200
