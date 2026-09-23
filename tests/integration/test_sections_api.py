"""Integration tests for the `sections` router (src/api/v1/sections.py).

Bug fixed as part of this pass: `create_section` checked that the
caller's `institution_id` matched the payload's `institution_id`, but
never verified the payload's `grade_id` actually belongs to that
institution -- so a user could create a Section under their own
institution that points at another institution's Grade (a cross-tenant
FK reference, corrupting that grade's `sections` relationship). Fixed by
looking up the Grade scoped to `current_user.institution_id` first and
404ing if it isn't found there.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.academic import AcademicYear, Grade, Section
from src.utils.security import get_password_hash


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


@pytest.fixture
def other_academic_year(db_session, other_institution) -> AcademicYear:
    year = AcademicYear(
        institution_id=other_institution.id,
        name="Other 2023-2024",
        start_date="2023-04-01",
        end_date="2024-03-31",
        is_active=True,
        is_current=True,
    )
    db_session.add(year)
    db_session.commit()
    db_session.refresh(year)
    return year


@pytest.fixture
def other_grade(db_session, other_institution, other_academic_year) -> Grade:
    grade = Grade(
        institution_id=other_institution.id,
        academic_year_id=other_academic_year.id,
        name="Other Grade 10",
        display_order=10,
    )
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)
    return grade


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------
class TestCreateSection:
    def test_create_happy_path(self, client, auth_headers, institution, grade):
        response = client.post(
            "/api/v1/sections/",
            json={
                "institution_id": institution.id,
                "grade_id": grade.id,
                "name": "Section B",
                "capacity": 35,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Section B"
        assert data["grade_id"] == grade.id

    def test_create_duplicate_name_in_grade_returns_400(self, client, auth_headers, institution, grade, section):
        response = client.post(
            "/api/v1/sections/",
            json={
                "institution_id": institution.id,
                "grade_id": grade.id,
                "name": section.name,
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_cross_institution_forbidden(self, client, auth_headers, other_institution, other_grade):
        response = client.post(
            "/api/v1/sections/",
            json={
                "institution_id": other_institution.id,
                "grade_id": other_grade.id,
                "name": "Section X",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_with_other_institutions_grade_not_found(self, client, auth_headers, institution, other_grade):
        """Regression test: institution_id belongs to the caller, but
        grade_id references another institution's Grade entirely.
        """
        response = client.post(
            "/api/v1/sections/",
            json={
                "institution_id": institution.id,
                "grade_id": other_grade.id,
                "name": "Section X",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_create_grade_does_not_exist(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/sections/",
            json={
                "institution_id": institution.id,
                "grade_id": 999999,
                "name": "Section X",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_create_missing_required_field_returns_422(self, client, auth_headers, institution, grade):
        response = client.post(
            "/api/v1/sections/",
            json={"institution_id": institution.id, "grade_id": grade.id},
            headers=auth_headers,
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------
class TestListSections:
    def test_list_default(self, client, auth_headers, section):
        response = client.get("/api/v1/sections/", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert section.id in ids

    def test_list_only_returns_own_institution(self, client, auth_headers, other_institution, other_grade, db_session):
        other_section = Section(institution_id=other_institution.id, grade_id=other_grade.id, name="Other Section")
        db_session.add(other_section)
        db_session.commit()

        response = client.get("/api/v1/sections/", headers=auth_headers)
        ids = [item["id"] for item in response.json()["items"]]
        assert other_section.id not in ids

    def test_list_filter_by_grade(self, client, auth_headers, institution, academic_year, grade, section, db_session):
        second_grade = Grade(institution_id=institution.id, academic_year_id=academic_year.id, name="Grade 11")
        db_session.add(second_grade)
        db_session.commit()
        db_session.refresh(second_grade)
        second_section = Section(institution_id=institution.id, grade_id=second_grade.id, name="Section A")
        db_session.add(second_section)
        db_session.commit()

        response = client.get(f"/api/v1/sections/?grade_id={grade.id}", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert section.id in ids
        assert second_section.id not in ids

    def test_list_filter_is_active(self, client, auth_headers, institution, grade, db_session):
        inactive = Section(institution_id=institution.id, grade_id=grade.id, name="Inactive Section", is_active=False)
        db_session.add(inactive)
        db_session.commit()

        response = client.get("/api/v1/sections/?is_active=false", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert inactive.id in ids


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------
class TestGetSection:
    def test_get_happy_path(self, client, auth_headers, section):
        response = client.get(f"/api/v1/sections/{section.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == section.id

    def test_get_not_found(self, client, auth_headers):
        response = client.get("/api/v1/sections/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_forbidden(self, client, other_admin_headers, section):
        response = client.get(f"/api/v1/sections/{section.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------
class TestUpdateSection:
    def test_update_happy_path(self, client, auth_headers, section):
        response = client.put(
            f"/api/v1/sections/{section.id}",
            json={"name": "Section A Renamed", "capacity": 50},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Section A Renamed"
        assert data["capacity"] == 50

    def test_update_not_found(self, client, auth_headers):
        response = client.put("/api/v1/sections/999999", json={"name": "Nope"}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_cross_institution_forbidden(self, client, other_admin_headers, section):
        response = client.put(f"/api/v1/sections/{section.id}", json={"name": "Hijacked"}, headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------
class TestDeleteSection:
    def test_delete_happy_path(self, client, auth_headers, section):
        response = client.delete(f"/api/v1/sections/{section.id}", headers=auth_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/sections/{section.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/sections/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_forbidden(self, client, other_admin_headers, section):
        response = client.delete(f"/api/v1/sections/{section.id}", headers=other_admin_headers)
        assert response.status_code == 403
