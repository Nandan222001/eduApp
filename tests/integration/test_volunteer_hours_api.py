import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.academic import AcademicYear
from src.models.student import Parent
from src.models.teacher import Teacher
from src.models.user import User


@pytest.fixture
def parent_headers(client: TestClient, parent_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": parent_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def teacher_headers(client: TestClient, teacher_user: User, teacher: Teacher) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def parent_of(db_session: Session, parent_user: User) -> Parent:
    return db_session.query(Parent).filter(Parent.user_id == parent_user.id).first()


def _make_log_payload(academic_year_id: int, **overrides) -> dict:
    payload = {
        "academic_year_id": academic_year_id,
        "activity_name": "Library Sorting",
        "activity_type": "classroom_help",
        "date": "2023-09-10",
        "hours_logged": "3.50",
        "description": "Helped sort library books",
        "location": "Main Library",
    }
    payload.update(overrides)
    return payload


@pytest.mark.integration
class TestVolunteerHoursAPI:
    """Integration tests for /api/v1/volunteer-hours/*, the real, mounted
    router (src/api/v1/volunteer_hours.py) backed by
    src/models/volunteer_hours.py and src/schemas/volunteer_hours.py.
    Logging/updating/deleting hour logs requires a Parent profile
    (get_parent_from_user), so a dedicated parent_headers fixture (backed
    by the existing parent_user conftest fixture) is used for those
    endpoints; verification requires a Teacher profile, so a
    teacher_headers fixture is used there. There are no external network
    calls in this router (no payment gateway / third-party API), so
    every endpoint below is exercised end-to-end."""

    def test_create_and_get_log(
        self,
        client: TestClient,
        parent_headers: dict,
        academic_year: AcademicYear,
        parent_of: Parent,
    ):
        response = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["activity_name"] == "Library Sorting"
        assert data["verification_status"] == "pending"
        assert float(data["hours_logged"]) == 3.5
        assert data["parent_name"] == f"{parent_of.first_name} {parent_of.last_name}"
        log_id = data["id"]

        response = client.get(f"/api/v1/volunteer-hours/logs/{log_id}", headers=parent_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["location"] == "Main Library"
        assert data["parent_name"] == f"{parent_of.first_name} {parent_of.last_name}"

    def test_get_nonexistent_log(self, client: TestClient, parent_headers: dict):
        response = client.get("/api/v1/volunteer-hours/logs/999999", headers=parent_headers)
        assert response.status_code == 404

    def test_list_logs_with_filters(
        self, client: TestClient, parent_headers: dict, academic_year: AcademicYear
    ):
        client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id, activity_name="Bake Sale", activity_type="fundraising"),
        )
        client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id, activity_name="Field Trip Help", activity_type="field_trip_chaperone"),
        )

        response = client.get(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            params={"academic_year_id": academic_year.id, "activity_type": "fundraising"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(log["activity_type"] == "fundraising" for log in data)

        response = client.get(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            params={"academic_year_id": academic_year.id, "verification_status": "pending"},
        )
        assert response.status_code == 200
        assert all(log["verification_status"] == "pending" for log in response.json())

    def test_update_pending_log(
        self, client: TestClient, parent_headers: dict, academic_year: AcademicYear
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]

        response = client.put(
            f"/api/v1/volunteer-hours/logs/{log_id}",
            headers=parent_headers,
            json={"hours_logged": "5.00", "location": "Gym"},
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["hours_logged"]) == 5.0
        assert data["location"] == "Gym"

    def test_delete_pending_log(
        self, client: TestClient, parent_headers: dict, academic_year: AcademicYear
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]

        response = client.delete(f"/api/v1/volunteer-hours/logs/{log_id}", headers=parent_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/volunteer-hours/logs/{log_id}", headers=parent_headers)
        assert response.status_code == 404

    def test_non_teacher_cannot_verify(
        self, client: TestClient, parent_headers: dict, academic_year: AcademicYear
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]

        response = client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=parent_headers,
            json={"verification_status": "approved"},
        )
        assert response.status_code == 403

    def test_verify_workflow_updates_summary_and_locks_edits(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]

        response = client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved", "verification_notes": "Confirmed with librarian"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["verification_status"] == "approved"
        assert data["verifier_name"] is not None

        # Once verified, the parent can no longer update or delete it.
        response = client.put(
            f"/api/v1/volunteer-hours/logs/{log_id}",
            headers=parent_headers,
            json={"hours_logged": "1.00"},
        )
        assert response.status_code == 400

        response = client.delete(f"/api/v1/volunteer-hours/logs/{log_id}", headers=parent_headers)
        assert response.status_code == 400

        # Summary should now reflect the approved hours.
        response = client.get(
            "/api/v1/volunteer-hours/summary",
            headers=parent_headers,
            params={"academic_year_id": academic_year.id},
        )
        assert response.status_code == 200
        summaries = response.json()
        assert len(summaries) == 1
        assert float(summaries[0]["approved_hours"]) == 3.5

    def test_bulk_verify(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
    ):
        ids = []
        for name in ("Event A", "Event B"):
            create = client.post(
                "/api/v1/volunteer-hours/logs",
                headers=parent_headers,
                json=_make_log_payload(academic_year.id, activity_name=name, activity_type="event_support"),
            )
            ids.append(create.json()["id"])

        response = client.post(
            "/api/v1/volunteer-hours/logs/verify-bulk",
            headers=teacher_headers,
            json={"log_ids": ids, "verification_status": "approved"},
        )
        assert response.status_code == 200
        assert response.json()["updated_count"] == 2

    def test_parent_hours_report(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
        parent_of: Parent,
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]
        client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved"},
        )

        response = client.get(
            f"/api/v1/volunteer-hours/reports/parent/{parent_of.id}",
            headers=parent_headers,
            params={"academic_year_id": academic_year.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["parent_name"] == f"{parent_of.first_name} {parent_of.last_name}"
        assert float(data["approved_hours"]) == 3.5
        assert len(data["activity_breakdown"]) == 1
        assert data["activity_breakdown"][0]["activity_type"] == "classroom_help"
        assert len(data["monthly_breakdown"]) == 1
        assert len(data["recent_logs"]) == 1

    def test_leaderboard_after_verification(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
        parent_of: Parent,
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]
        client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved"},
        )

        response = client.get(
            "/api/v1/volunteer-hours/leaderboard",
            headers=parent_headers,
            params={"academic_year_id": academic_year.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["scope"] == "school-wide"
        assert data["total_entries"] == 1
        assert data["entries"][0]["parent_id"] == parent_of.id
        assert data["entries"][0]["rank"] == 1
        assert data["user_entry"] is not None
        assert data["user_entry"]["parent_id"] == parent_of.id

    def test_school_wide_report(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]
        client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved"},
        )

        response = client.get(
            "/api/v1/volunteer-hours/reports/school-wide",
            headers=teacher_headers,
            params={"academic_year_id": academic_year.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_parents"] >= 1
        assert data["active_parents"] >= 1
        assert float(data["approved_hours"]) == 3.5
        assert len(data["grade_breakdown"]) >= 0

    def test_badge_lifecycle(
        self,
        client: TestClient,
        auth_headers: dict,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
        parent_of: Parent,
        institution,
    ):
        badge = client.post(
            "/api/v1/volunteer-hours/badges",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "name": "Bronze Volunteer",
                "badge_tier": "bronze",
                "hours_required": "1.00",
            },
        )
        assert badge.status_code == 201
        assert badge.json()["name"] == "Bronze Volunteer"

        response = client.get("/api/v1/volunteer-hours/badges", headers=auth_headers)
        assert response.status_code == 200
        assert any(b["name"] == "Bronze Volunteer" for b in response.json())

        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]
        client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved"},
        )

        response = client.get(
            f"/api/v1/volunteer-hours/badges/parent/{parent_of.id}",
            headers=parent_headers,
            params={"academic_year_id": academic_year.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["badge_name"] == "Bronze Volunteer"
        assert data[0]["badge_tier"] == "bronze"

    def test_certificate_generation_and_tax_export(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
        parent_of: Parent,
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]
        client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved"},
        )

        response = client.post(
            "/api/v1/volunteer-hours/certificates/generate",
            headers=teacher_headers,
            json={
                "parent_id": parent_of.id,
                "academic_year_id": academic_year.id,
                "is_tax_deductible": True,
                "tax_year": 2023,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["parent_name"] == f"{parent_of.first_name} {parent_of.last_name}"
        assert float(data["total_hours"]) == 3.5
        assert data["certificate_number"].startswith("VC-")

        # A second certificate for the same parent/year is rejected.
        dup = client.post(
            "/api/v1/volunteer-hours/certificates/generate",
            headers=teacher_headers,
            json={"parent_id": parent_of.id, "academic_year_id": academic_year.id},
        )
        assert dup.status_code == 400

        response = client.get("/api/v1/volunteer-hours/certificates", headers=teacher_headers)
        assert response.status_code == 200
        assert any(c["parent_id"] == parent_of.id for c in response.json())

        response = client.get(
            "/api/v1/volunteer-hours/export/tax-deduction",
            headers=teacher_headers,
            params={"tax_year": 2023},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["parent_id"] == parent_of.id
        assert float(data[0]["estimated_value"]) == 3.5 * 25.0
        assert len(data[0]["activities"]) == 1

    def test_csv_export(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]
        client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved"},
        )

        response = client.post(
            "/api/v1/volunteer-hours/export",
            headers=teacher_headers,
            json={"academic_year_id": academic_year.id, "format": "csv"},
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        body = response.text
        assert "Library Sorting" in body
        assert "Parent Name" in body

    def test_statistics(
        self,
        client: TestClient,
        parent_headers: dict,
        teacher_headers: dict,
        academic_year: AcademicYear,
    ):
        create = client.post(
            "/api/v1/volunteer-hours/logs",
            headers=parent_headers,
            json=_make_log_payload(academic_year.id),
        )
        log_id = create.json()["id"]
        client.post(
            f"/api/v1/volunteer-hours/logs/{log_id}/verify",
            headers=teacher_headers,
            json={"verification_status": "approved"},
        )

        response = client.get(
            "/api/v1/volunteer-hours/statistics",
            headers=teacher_headers,
            params={"academic_year_id": academic_year.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_logs"] == 1
        assert float(data["approved_hours"]) == 3.5
        assert data["unique_parents"] == 1
        assert data["most_common_activity"] == "classroom_help"
        assert "bronze" in data["badge_distribution"]
