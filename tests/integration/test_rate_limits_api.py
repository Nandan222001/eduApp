import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.rate_limit import RateLimitViolation


@pytest.fixture
def super_admin_user(db_session: Session, institution: Institution, admin_role: Role) -> User:
    user = User(
        username="ratelimit_superadmin",
        email="ratelimit_superadmin@testschool.com",
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


@pytest.fixture
def violation(db_session: Session) -> RateLimitViolation:
    v = RateLimitViolation(
        user_id=999,
        role_slug="student",
        path="/api/v1/assignments",
        method="GET",
        ip_address="127.0.0.1",
        limit_hit="100/minute",
    )
    db_session.add(v)
    db_session.commit()
    db_session.refresh(v)
    return v


@pytest.mark.integration
class TestRateLimitsAPI:
    """Integration tests for /api/v1/rate-limits/*, one of the routers
    that existed but was never registered anywhere until TESTING_PROGRESS.md's
    twenty-third pass. Most endpoints require require_super_admin, so a
    dedicated super_admin_headers fixture is used throughout, matching
    test_super_admin_reports_api.py's pattern. Violations are inserted
    directly via a fixture since there's no create-violation endpoint --
    real violations are recorded by the rate-limiting middleware itself
    when an actual limit is hit, not through this reporting router."""

    def test_non_super_admin_forbidden(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/rate-limits/dashboard", headers=auth_headers)
        assert response.status_code == 403

    def test_dashboard(self, client: TestClient, super_admin_headers: dict, violation: RateLimitViolation):
        response = client.get("/api/v1/rate-limits/dashboard", headers=super_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_violations_today"] >= 1
        assert len(data["recent_violations"]) >= 1
        assert "super_admin" in data["rate_limit_config"]

    def test_list_violations_with_filters(
        self, client: TestClient, super_admin_headers: dict, violation: RateLimitViolation
    ):
        response = client.get(
            "/api/v1/rate-limits/violations",
            headers=super_admin_headers,
            params={"role_slug": "student"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(v["id"] == violation.id for v in data["violations"])

    def test_violations_by_role_and_endpoint_and_top_violators(
        self, client: TestClient, super_admin_headers: dict, violation: RateLimitViolation
    ):
        response = client.get("/api/v1/rate-limits/violations/by-role", headers=super_admin_headers)
        assert response.status_code == 200
        assert any(r["role"] == "student" for r in response.json())

        response = client.get("/api/v1/rate-limits/violations/by-endpoint", headers=super_admin_headers)
        assert response.status_code == 200
        assert any("/api/v1/assignments" in e["endpoint"] for e in response.json())

        response = client.get("/api/v1/rate-limits/violations/top-violators", headers=super_admin_headers)
        assert response.status_code == 200
        assert any(v["user_id"] == 999 for v in response.json())

    def test_cleanup_old_violations(self, client: TestClient, super_admin_headers: dict, db_session: Session):
        old_violation = RateLimitViolation(
            user_id=1000,
            role_slug="teacher",
            path="/api/v1/exams",
            method="GET",
            ip_address="127.0.0.1",
            limit_hit="200/minute",
            created_at=datetime.utcnow() - timedelta(days=200),
        )
        db_session.add(old_violation)
        db_session.commit()

        response = client.delete(
            "/api/v1/rate-limits/violations/cleanup",
            headers=super_admin_headers,
            params={"days": 90},
        )
        assert response.status_code == 200
        assert response.json()["deleted_count"] >= 1

    def test_config_and_my_usage(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/rate-limits/config", headers=auth_headers)
        assert response.status_code == 200
        assert "your_limit" in response.json()
        assert "all_limits" in response.json()

        response = client.get("/api/v1/rate-limits/my-usage", headers=auth_headers)
        assert response.status_code == 200
        assert "rate_limit" in response.json()
