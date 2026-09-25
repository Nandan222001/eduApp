"""Integration tests for the `college_planning` router
(src/api/v1/college_planning.py).

College visit logs and college application tracking (with a checklist,
decision recording, upcoming-deadline lookups, per-student statistics, and
sharing a student's plan with a counselor). Every endpoint already had a
real `Depends(get_current_user)`.

Two bugs found and fixed while writing this coverage:

1. **Route-shadowing (bug class 7)**: `GET /applications/{application_id}`
   was declared before `GET /applications/deadlines/{student_id}` and `GET
   /applications/statistics/{student_id}`. Since Starlette matches routes by
   declaration order and both paths have the same `/applications/<segment>`
   shape, a request to `/applications/deadlines/5` matched the earlier,
   more general route first with `application_id="deadlines"`, then 422'd
   trying to coerce that to `int` -- both endpoints were permanently
   unreachable. Fixed with the `{application_id:int}` Starlette
   type-converter on the GET/PUT/DELETE application routes (the same fix
   this codebase already uses in `attendance.py`/`doubts.py`), which is
   robust to any future reordering rather than depending on declaration
   order.
2. **Model/schema drift (bug class 11)**:
   `college_planning_service.py::_create_decision_notification` and
   `::share_with_counselor` constructed `Notification(..., type=...,
   is_read=...)`. `Notification` has no `type` or `is_read` columns --
   the real columns are `notification_type` and `status`/`read_at` -- and
   `channel` is a required column with no default that was never supplied
   at all. Every `POST /applications/{id}/decision` call and every `POST
   /collaboration/share` call raised `TypeError` on the invalid
   constructor kwargs. Fixed to use the real columns, matching
   `notification_service.py::create_notification`'s established pattern.
   Fixing that surfaced a second, previously-masked bug in the same
   method: `_create_decision_notification` passed
   `user_id=application.student_id` -- a `students.id` value -- into
   `Notification.user_id`, which is a foreign key to `users.id`. Once the
   `TypeError` above stopped short-circuiting the call, this raised a
   foreign-key `IntegrityError` on every decision recorded. Fixed to use
   `application.student.user_id` (the student's actual linked User
   account), skipping the notification entirely if the student has no
   linked User account rather than violating the FK constraint.
"""
import uuid
from datetime import date, timedelta

import pytest


BASE = "/api/v1/college-planning"


@pytest.fixture
def college_student(db_session, institution, student_user, section, academic_year):
    from src.models.student import Student
    from datetime import datetime

    s = Student(
        institution_id=institution.id,
        user_id=student_user.id,
        admission_number="ADM-COLLEGE-1",
        first_name=student_user.first_name,
        last_name=student_user.last_name,
        email=student_user.email,
        section_id=section.id,
        date_of_birth=datetime(2007, 3, 20).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Female",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def visit(client, auth_headers, college_student, institution):
    response = client.post(
        f"{BASE}/visits",
        json={
            "student_id": college_student.id,
            "institution_id": institution.id,
            "college_name": "State University",
            "visit_date": str(date.today()),
            "visit_type": "campus_tour",
            "rating": 8,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def application(client, auth_headers, college_student, institution):
    response = client.post(
        f"{BASE}/applications",
        json={
            "student_id": college_student.id,
            "institution_id": institution.id,
            "college_name": "State University",
            "application_type": "regular_decision",
            "deadline": str(date.today() + timedelta(days=10)),
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    return response.json()


class TestCollegeVisitCRUD:
    def test_create_requires_auth(self, client, college_student, institution):
        response = client.post(
            f"{BASE}/visits",
            json={
                "student_id": college_student.id,
                "institution_id": institution.id,
                "college_name": "State University",
                "visit_date": str(date.today()),
                "visit_type": "campus_tour",
            },
        )
        assert response.status_code == 403

    def test_create_visit(self, client, auth_headers, college_student, institution):
        response = client.post(
            f"{BASE}/visits",
            json={
                "student_id": college_student.id,
                "institution_id": institution.id,
                "college_name": "Tech Institute",
                "visit_date": str(date.today()),
                "visit_type": "info_session",
                "rating": 9,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["college_name"] == "Tech Institute"

    def test_list_visits(self, client, auth_headers, visit, college_student):
        response = client.get(
            f"{BASE}/visits", params={"student_id": college_student.id}, headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_visit(self, client, auth_headers, visit):
        response = client.get(f"{BASE}/visits/{visit['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == visit["id"]

    def test_get_visit_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/visits/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_visit(self, client, auth_headers, visit):
        response = client.put(
            f"{BASE}/visits/{visit['id']}", json={"rating": 10}, headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["rating"] == 10

    def test_delete_visit(self, client, auth_headers, visit, college_student):
        response = client.delete(f"{BASE}/visits/{visit['id']}", headers=auth_headers)
        assert response.status_code == 204

        list_resp = client.get(
            f"{BASE}/visits", params={"student_id": college_student.id}, headers=auth_headers
        )
        assert list_resp.json() == []

    def test_delete_visit_not_found(self, client, auth_headers):
        response = client.delete(f"{BASE}/visits/999999", headers=auth_headers)
        assert response.status_code == 404


class TestCollegeApplicationCRUD:
    def test_create_requires_auth(self, client, college_student, institution):
        response = client.post(
            f"{BASE}/applications",
            json={
                "student_id": college_student.id,
                "institution_id": institution.id,
                "college_name": "State University",
                "application_type": "regular_decision",
                "deadline": str(date.today() + timedelta(days=10)),
            },
        )
        assert response.status_code == 403

    def test_create_application(self, client, auth_headers, college_student, institution):
        response = client.post(
            f"{BASE}/applications",
            json={
                "student_id": college_student.id,
                "institution_id": institution.id,
                "college_name": "Ivy College",
                "application_type": "early_decision",
                "deadline": str(date.today() + timedelta(days=5)),
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["application_status"] == "not_started"

    def test_list_applications(self, client, auth_headers, application, college_student):
        response = client.get(
            f"{BASE}/applications", params={"student_id": college_student.id}, headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_application(self, client, auth_headers, application):
        response = client.get(f"{BASE}/applications/{application['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == application["id"]

    def test_get_application_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/applications/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_application(self, client, auth_headers, application):
        response = client.put(
            f"{BASE}/applications/{application['id']}",
            json={"application_status": "in_progress"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["application_status"] == "in_progress"

    def test_delete_application(self, client, auth_headers, application, college_student):
        response = client.delete(f"{BASE}/applications/{application['id']}", headers=auth_headers)
        assert response.status_code == 204

        list_resp = client.get(
            f"{BASE}/applications", params={"student_id": college_student.id}, headers=auth_headers
        )
        assert list_resp.json() == []

    def test_update_checklist_sets_in_progress(self, client, auth_headers, application):
        response = client.patch(
            f"{BASE}/applications/{application['id']}/checklist",
            json={"common_app_essay": True, "transcript_requested": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["common_app_essay"] is True
        assert body["application_status"] == "in_progress"

    def test_update_checklist_not_found(self, client, auth_headers):
        response = client.patch(
            f"{BASE}/applications/999999/checklist",
            json={"common_app_essay": True},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestRecordDecision:
    def test_record_decision_creates_notification(
        self, client, auth_headers, application, admin_user, db_session
    ):
        """Regression test for the Notification model/schema drift bug:
        this previously raised TypeError on `type=`/`is_read=` kwargs that
        don't exist on the Notification model."""
        from src.models.notification import Notification

        response = client.post(
            f"{BASE}/applications/{application['id']}/decision",
            json={
                "application_id": application["id"],
                "decision_outcome": "accepted",
                "financial_aid_offered": "5000.00",
                "scholarship_amount": "2000.00",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["decision_outcome"] == "accepted"
        assert body["application_status"] == "decision_received"
        assert float(body["financial_aid_offered"]) == 5000.00

        notification = (
            db_session.query(Notification)
            .filter(Notification.notification_type == "college_decision")
            .first()
        )
        assert notification is not None
        assert notification.channel == "in_app"
        assert notification.priority == "high"
        assert "accepted" in notification.message.lower() or "congratulations" in notification.message.lower()

    def test_record_decision_not_found(self, client, auth_headers):
        response = client.post(
            f"{BASE}/applications/999999/decision",
            json={"application_id": 999999, "decision_outcome": "rejected"},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestDeadlinesAndStatistics:
    def test_upcoming_deadlines_not_shadowed_by_application_id_route(
        self, client, auth_headers, application, college_student
    ):
        """Regression test for the route-shadowing bug: this endpoint used
        to be swallowed by GET /applications/{application_id} and always
        422 with 'deadlines' failing int coercion."""
        response = client.get(
            f"{BASE}/applications/deadlines/{college_student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == application["id"]

    def test_upcoming_deadlines_requires_auth(self, client, college_student):
        response = client.get(f"{BASE}/applications/deadlines/{college_student.id}")
        assert response.status_code == 403

    def test_statistics_not_shadowed_by_application_id_route(
        self, client, auth_headers, application, college_student
    ):
        """Regression test for the same route-shadowing bug on the
        statistics endpoint."""
        response = client.get(
            f"{BASE}/applications/statistics/{college_student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["total_applications"] == 1
        assert body["by_status"]["not_started"] == 1

    def test_statistics_requires_auth(self, client, college_student):
        response = client.get(f"{BASE}/applications/statistics/{college_student.id}")
        assert response.status_code == 403


class TestCollaborationShare:
    def test_share_requires_auth(self, client, college_student, admin_user):
        response = client.post(
            f"{BASE}/collaboration/share",
            json={
                "student_id": college_student.id,
                "counselor_user_id": admin_user.id,
                "message": "Please review",
            },
        )
        assert response.status_code == 403

    def test_share_with_counselor_creates_notification(
        self, client, auth_headers, college_student, admin_user, application, db_session
    ):
        """Regression test for the same Notification drift bug as the
        decision-recording endpoint."""
        from src.models.notification import Notification

        response = client.post(
            f"{BASE}/collaboration/share",
            json={
                "student_id": college_student.id,
                "counselor_user_id": admin_user.id,
                "message": "Please review this application",
                "application_id": application["id"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert "notification_id" in body

        notification = db_session.query(Notification).filter(
            Notification.id == body["notification_id"]
        ).first()
        assert notification is not None
        assert notification.notification_type == "counselor_collaboration"
        assert notification.channel == "in_app"
        assert notification.user_id == admin_user.id
