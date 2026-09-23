import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User


@pytest.fixture
def super_admin_user(db_session: Session, institution: Institution, admin_role: Role) -> User:
    user = User(
        username="superadmin",
        email="superadmin@testschool.com",
        first_name="Super",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def super_admin_headers(client: TestClient, super_admin_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": super_admin_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
class TestSuperAdminReportsAPI:
    """Integration tests for /api/v1/super-admin/reports/*, the real,
    mounted router (src/api/v1/super_admin_reports.py) backed by
    src/models/super_admin_reports.py and
    src/services/super_admin_report_service.py (all written this
    session, see TESTING_PROGRESS.md's "super_admin_reports" router
    fix). Every endpoint requires require_super_admin
    (current_user.is_superuser), so a dedicated super_admin_headers
    fixture is used throughout instead of the regular auth_headers
    fixture. Endpoints whose real implementation is a Celery-task stub
    (schedule_report_task, execute_report_now, execute_policy,
    process_archival_job, restore_archived_data -- all literal `pass`
    in the service) are exercised for their HTTP-level behavior only,
    not for any actual background processing."""

    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get(
            "/api/v1/super-admin/reports/builder/available-aggregations", headers=auth_headers
        )
        assert response.status_code == 403

    def test_static_reference_endpoints(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/reports/builder/available-aggregations", headers=super_admin_headers
        )
        assert response.status_code == 200
        assert any(a["name"] == "count" for a in response.json()["aggregations"])

        response = client.get(
            "/api/v1/super-admin/reports/compliance/available-reports", headers=super_admin_headers
        )
        assert response.status_code == 200
        assert any(r["type"] == "gdpr_data_access" for r in response.json()["report_types"])

        response = client.get(
            "/api/v1/super-admin/reports/executive-dashboard/templates", headers=super_admin_headers
        )
        assert response.status_code == 200
        assert any(t["id"] == "quarterly_board_meeting" for t in response.json()["templates"])

    def test_available_fields_for_entity(self, client: TestClient, super_admin_headers: dict):
        response = client.get(
            "/api/v1/super-admin/reports/builder/available-fields",
            headers=super_admin_headers,
            params={"entity_type": "institutions"},
        )
        assert response.status_code == 200
        data = response.json()
        field_names = {f["field_name"] for f in data["fields"]}
        assert "id" in field_names
        assert "name" in field_names

    def test_execute_and_validate_report(
        self, client: TestClient, super_admin_headers: dict, institution: Institution
    ):
        report_request = {
            "report_name": "Institutions Overview",
            "entity_type": "institutions",
            "selected_fields": [
                {"field_name": "id", "data_type": "integer"},
                {"field_name": "name", "data_type": "string"},
            ],
            "filters": [
                {"field_name": "is_active", "operator": "equals", "value": True}
            ],
            "limit": 50,
            "include_totals": False,
        }

        response = client.post(
            "/api/v1/super-admin/reports/builder/validate", headers=super_admin_headers, json=report_request
        )
        assert response.status_code == 200
        assert response.json()["valid"] is True

        response = client.post(
            "/api/v1/super-admin/reports/builder/execute", headers=super_admin_headers, json=report_request
        )
        assert response.status_code == 200
        data = response.json()
        assert data["entity_type"] == "institutions"
        assert data["row_count"] >= 1
        assert any(row["name"] == institution.name for row in data["data"])

    def test_scheduled_report_crud(self, client: TestClient, super_admin_headers: dict):
        payload = {
            "report_name": "Weekly Institution Snapshot",
            "report_config": {
                "report_name": "Institution Snapshot",
                "entity_type": "institutions",
                "selected_fields": [{"field_name": "id", "data_type": "integer"}],
            },
            "schedule": {"frequency": "daily", "time_of_day": "08:00"},
            "email_recipients": [{"email": "ops@testschool.com", "name": "Ops"}],
        }

        response = client.post(
            "/api/v1/super-admin/reports/scheduled", headers=super_admin_headers, json=payload
        )
        assert response.status_code == 201
        data = response.json()
        assert data["report_name"] == "Weekly Institution Snapshot"
        assert data["next_run_at"] is not None
        report_id = data["id"]

        response = client.get("/api/v1/super-admin/reports/scheduled", headers=super_admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

        response = client.get(f"/api/v1/super-admin/reports/scheduled/{report_id}", headers=super_admin_headers)
        assert response.status_code == 200

        response = client.put(
            f"/api/v1/super-admin/reports/scheduled/{report_id}",
            headers=super_admin_headers,
            json={"is_active": False},
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False

        response = client.post(
            f"/api/v1/super-admin/reports/scheduled/{report_id}/execute", headers=super_admin_headers
        )
        assert response.status_code == 200

        response = client.delete(
            f"/api/v1/super-admin/reports/scheduled/{report_id}", headers=super_admin_headers
        )
        assert response.status_code == 200

        response = client.get(f"/api/v1/super-admin/reports/scheduled/{report_id}", headers=super_admin_headers)
        assert response.status_code == 404

    def test_data_retention_policy_crud(self, client: TestClient, super_admin_headers: dict):
        response = client.post(
            "/api/v1/super-admin/reports/data-retention/policies",
            headers=super_admin_headers,
            json={
                "policy_name": "Archive old audit logs",
                "entity_type": "audit_logs",
                "retention_days": 365,
                "action": "archive",
            },
        )
        assert response.status_code == 201
        policy = response.json()
        assert policy["action"] == "archive"
        policy_id = policy["id"]

        response = client.get(
            f"/api/v1/super-admin/reports/data-retention/policies/{policy_id}", headers=super_admin_headers
        )
        assert response.status_code == 200

        response = client.put(
            f"/api/v1/super-admin/reports/data-retention/policies/{policy_id}",
            headers=super_admin_headers,
            json={"retention_days": 730},
        )
        assert response.status_code == 200
        assert response.json()["retention_days"] == 730

        response = client.post(
            f"/api/v1/super-admin/reports/data-retention/policies/{policy_id}/execute",
            headers=super_admin_headers,
            params={"dry_run": True},
        )
        assert response.status_code == 200
        assert response.json()["dry_run"] is True

        response = client.delete(
            f"/api/v1/super-admin/reports/data-retention/policies/{policy_id}", headers=super_admin_headers
        )
        assert response.status_code == 200

    def test_archival_job_create_list_get(self, client: TestClient, super_admin_headers: dict):
        response = client.post(
            "/api/v1/super-admin/reports/archival/jobs",
            headers=super_admin_headers,
            json={
                "job_name": "Archive 2024 attendance",
                "entity_type": "attendances",
                "date_to": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            },
        )
        assert response.status_code == 201
        job = response.json()
        assert job["status"] == "pending"
        job_id = job["id"]

        response = client.get("/api/v1/super-admin/reports/archival/jobs", headers=super_admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

        response = client.get(f"/api/v1/super-admin/reports/archival/jobs/{job_id}", headers=super_admin_headers)
        assert response.status_code == 200
        assert response.json()["job_name"] == "Archive 2024 attendance"

        response = client.get(
            "/api/v1/super-admin/reports/archival/storage-stats", headers=super_admin_headers
        )
        assert response.status_code == 200
