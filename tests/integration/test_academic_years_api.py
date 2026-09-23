"""Integration tests for the `academic_years` router (src/api/v1/academic_years.py).

Covers full CRUD for AcademicYear: create (incl. duplicate-name and
start/end date validation, and the "only one is_current year per
institution" invariant), list (with is_active/is_current filters and
pagination), get, update, and delete -- plus cross-institution 403s on
every id-based endpoint.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.academic import AcademicYear
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# A second institution + admin, for cross-institution 403/404 checks.
# ---------------------------------------------------------------------------
@pytest.fixture
def other_institution(db_session) -> Institution:
    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        phone="+1987654321",
        address="456 Other Street, Other City, Other State, Other Country",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def other_admin_role(db_session) -> Role:
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheradmin{suffix}",
        email=f"otheradmin{suffix}@otherschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_admin_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_admin_headers(client, other_admin_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_admin_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------
class TestCreateAcademicYear:
    def test_create_happy_path(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/academic-years/",
            json={
                "institution_id": institution.id,
                "name": "2024-2025",
                "start_date": "2024-04-01",
                "end_date": "2025-03-31",
                "is_active": True,
                "is_current": True,
                "description": "New session",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "2024-2025"
        assert data["institution_id"] == institution.id
        assert data["is_current"] is True
        assert "id" in data
        assert "created_at" in data

    def test_create_duplicate_name_returns_400(self, client, auth_headers, institution, academic_year):
        response = client.post(
            "/api/v1/academic-years/",
            json={
                "institution_id": institution.id,
                "name": academic_year.name,
                "start_date": "2024-04-01",
                "end_date": "2025-03-31",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_invalid_date_range_returns_400(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/academic-years/",
            json={
                "institution_id": institution.id,
                "name": "Backwards Year",
                "start_date": "2025-03-31",
                "end_date": "2024-04-01",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "End date must be after start date" in response.json()["detail"]

    def test_create_cross_institution_forbidden(self, client, auth_headers, other_institution):
        response = client.post(
            "/api/v1/academic-years/",
            json={
                "institution_id": other_institution.id,
                "name": "2024-2025",
                "start_date": "2024-04-01",
                "end_date": "2025-03-31",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_is_current_unsets_previous_current_year(
        self, client, auth_headers, institution, academic_year, db_session
    ):
        assert academic_year.is_current is True

        response = client.post(
            "/api/v1/academic-years/",
            json={
                "institution_id": institution.id,
                "name": "2025-2026",
                "start_date": "2025-04-01",
                "end_date": "2026-03-31",
                "is_current": True,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201

        db_session.refresh(academic_year)
        assert academic_year.is_current is False

    def test_create_missing_required_field_returns_422(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/academic-years/",
            json={"institution_id": institution.id, "name": "No Dates"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_requires_auth(self, client, institution):
        response = client.post(
            "/api/v1/academic-years/",
            json={
                "institution_id": institution.id,
                "name": "2024-2025",
                "start_date": "2024-04-01",
                "end_date": "2025-03-31",
            },
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------
class TestListAcademicYears:
    def test_list_default(self, client, auth_headers, academic_year):
        response = client.get("/api/v1/academic-years/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["id"] == academic_year.id for item in data["items"])
        assert data["skip"] == 0
        assert data["limit"] == 100

    def test_list_only_returns_own_institution(
        self, client, auth_headers, academic_year, other_admin_headers, other_institution, db_session
    ):
        other_year = AcademicYear(
            institution_id=other_institution.id,
            name="Other 2024",
            start_date="2024-04-01",
            end_date="2025-03-31",
            is_active=True,
            is_current=True,
        )
        db_session.add(other_year)
        db_session.commit()

        response = client.get("/api/v1/academic-years/", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert other_year.id not in ids

    def test_list_filter_is_active(self, client, auth_headers, institution, db_session):
        inactive_year = AcademicYear(
            institution_id=institution.id,
            name="Inactive Year",
            start_date="2020-04-01",
            end_date="2021-03-31",
            is_active=False,
            is_current=False,
        )
        db_session.add(inactive_year)
        db_session.commit()

        response = client.get("/api/v1/academic-years/?is_active=false", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert inactive_year.id in ids

    def test_list_filter_is_current(self, client, auth_headers, academic_year):
        response = client.get("/api/v1/academic-years/?is_current=true", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(item["is_current"] is True for item in data["items"])
        assert any(item["id"] == academic_year.id for item in data["items"])

    def test_list_pagination(self, client, auth_headers, institution, db_session):
        for i in range(3):
            db_session.add(AcademicYear(
                institution_id=institution.id,
                name=f"Pag Year {i}",
                start_date="2020-04-01",
                end_date="2021-03-31",
            ))
        db_session.commit()

        response = client.get("/api/v1/academic-years/?skip=0&limit=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] >= 3


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------
class TestGetAcademicYear:
    def test_get_happy_path(self, client, auth_headers, academic_year):
        response = client.get(f"/api/v1/academic-years/{academic_year.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == academic_year.id

    def test_get_not_found(self, client, auth_headers):
        response = client.get("/api/v1/academic-years/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_forbidden(self, client, other_admin_headers, academic_year):
        response = client.get(f"/api/v1/academic-years/{academic_year.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------
class TestUpdateAcademicYear:
    def test_update_happy_path(self, client, auth_headers, academic_year):
        response = client.put(
            f"/api/v1/academic-years/{academic_year.id}",
            json={"name": "2023-2024 Renamed", "description": "Updated"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "2023-2024 Renamed"
        assert data["description"] == "Updated"

    def test_update_not_found(self, client, auth_headers):
        response = client.put(
            "/api/v1/academic-years/999999",
            json={"name": "Nope"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_update_cross_institution_forbidden(self, client, other_admin_headers, academic_year):
        response = client.put(
            f"/api/v1/academic-years/{academic_year.id}",
            json={"name": "Hijacked"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403

    def test_update_invalid_date_range_returns_400(self, client, auth_headers, academic_year):
        response = client.put(
            f"/api/v1/academic-years/{academic_year.id}",
            json={"start_date": "2030-01-01", "end_date": "2020-01-01"},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_update_is_current_unsets_other_year(self, client, auth_headers, institution, academic_year, db_session):
        second_year = AcademicYear(
            institution_id=institution.id,
            name="2025-2026",
            start_date="2025-04-01",
            end_date="2026-03-31",
            is_active=True,
            is_current=False,
        )
        db_session.add(second_year)
        db_session.commit()
        db_session.refresh(second_year)

        response = client.put(
            f"/api/v1/academic-years/{second_year.id}",
            json={"is_current": True},
            headers=auth_headers,
        )
        assert response.status_code == 200

        db_session.refresh(academic_year)
        assert academic_year.is_current is False


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------
class TestDeleteAcademicYear:
    def test_delete_happy_path(self, client, auth_headers, institution, db_session):
        year = AcademicYear(
            institution_id=institution.id,
            name="To Delete",
            start_date="2019-04-01",
            end_date="2020-03-31",
        )
        db_session.add(year)
        db_session.commit()
        db_session.refresh(year)

        response = client.delete(f"/api/v1/academic-years/{year.id}", headers=auth_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/academic-years/{year.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/academic-years/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_forbidden(self, client, other_admin_headers, academic_year):
        response = client.delete(f"/api/v1/academic-years/{academic_year.id}", headers=other_admin_headers)
        assert response.status_code == 403
