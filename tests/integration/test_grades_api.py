"""Integration tests for the `grades` router (src/api/v1/grades.py).

Two real bugs fixed as part of this pass (see commit message for full
detail):

1. **Unreachable route**: `PUT /grades/bulk-order` was declared *after*
   `PUT /grades/{grade_id}` in the file, and `{grade_id}` had no `:int`
   type converter. Starlette matches routes by registration order using
   whatever converter is declared (plain `{grade_id}` accepts any
   non-empty string segment), so a request to `PUT /grades/bulk-order`
   was being captured by the `{grade_id}` route first and always 422'd
   trying to parse "bulk-order" as an int -- `update_grade_order` was
   permanently unreachable. Fixed by adding explicit `:int` converters to
   `{grade_id}` on the get/update/delete routes, so a non-numeric literal
   path falls through to the next matching route regardless of
   declaration order.
2. **Cross-tenant FK reference**: `create_grade` checked that the
   caller's `institution_id` matched the payload's `institution_id`, but
   never verified the payload's `academic_year_id` actually belongs to
   that institution. Fixed by looking up the AcademicYear scoped to
   `current_user.institution_id` first and 404ing if it isn't found
   there.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.academic import AcademicYear, Grade
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


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------
class TestCreateGrade:
    def test_create_happy_path(self, client, auth_headers, institution, academic_year):
        response = client.post(
            "/api/v1/grades/",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "name": "Grade 11",
                "display_order": 11,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Grade 11"
        assert data["academic_year_id"] == academic_year.id

    def test_create_duplicate_name_in_year_returns_400(self, client, auth_headers, institution, academic_year, grade):
        response = client.post(
            "/api/v1/grades/",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "name": grade.name,
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_cross_institution_forbidden(self, client, auth_headers, other_institution, other_academic_year):
        response = client.post(
            "/api/v1/grades/",
            json={
                "institution_id": other_institution.id,
                "academic_year_id": other_academic_year.id,
                "name": "Grade 12",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_with_other_institutions_academic_year_not_found(
        self, client, auth_headers, institution, other_academic_year
    ):
        response = client.post(
            "/api/v1/grades/",
            json={
                "institution_id": institution.id,
                "academic_year_id": other_academic_year.id,
                "name": "Grade 12",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_create_academic_year_does_not_exist(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/grades/",
            json={
                "institution_id": institution.id,
                "academic_year_id": 999999,
                "name": "Grade 12",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------
class TestListGrades:
    def test_list_default(self, client, auth_headers, grade):
        response = client.get("/api/v1/grades/", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert grade.id in ids

    def test_list_only_returns_own_institution(self, client, auth_headers, other_institution, other_academic_year, db_session):
        other_grade = Grade(institution_id=other_institution.id, academic_year_id=other_academic_year.id, name="Other Grade")
        db_session.add(other_grade)
        db_session.commit()

        response = client.get("/api/v1/grades/", headers=auth_headers)
        ids = [item["id"] for item in response.json()["items"]]
        assert other_grade.id not in ids

    def test_list_filter_by_academic_year(self, client, auth_headers, institution, academic_year, grade, db_session):
        second_year = AcademicYear(institution_id=institution.id, name="2024-2025", start_date="2024-04-01", end_date="2025-03-31")
        db_session.add(second_year)
        db_session.commit()
        db_session.refresh(second_year)
        second_grade = Grade(institution_id=institution.id, academic_year_id=second_year.id, name="Grade 1")
        db_session.add(second_grade)
        db_session.commit()

        response = client.get(f"/api/v1/grades/?academic_year_id={academic_year.id}", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert grade.id in ids
        assert second_grade.id not in ids

    def test_list_filter_is_active(self, client, auth_headers, institution, academic_year, db_session):
        inactive = Grade(institution_id=institution.id, academic_year_id=academic_year.id, name="Inactive Grade", is_active=False)
        db_session.add(inactive)
        db_session.commit()

        response = client.get("/api/v1/grades/?is_active=false", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert inactive.id in ids


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------
class TestGetGrade:
    def test_get_happy_path(self, client, auth_headers, grade):
        response = client.get(f"/api/v1/grades/{grade.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == grade.id

    def test_get_not_found(self, client, auth_headers):
        response = client.get("/api/v1/grades/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_forbidden(self, client, other_admin_headers, grade):
        response = client.get(f"/api/v1/grades/{grade.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------
class TestUpdateGrade:
    def test_update_happy_path(self, client, auth_headers, grade):
        response = client.put(
            f"/api/v1/grades/{grade.id}",
            json={"name": "Grade 10 Renamed", "display_order": 99},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Grade 10 Renamed"
        assert data["display_order"] == 99

    def test_update_not_found(self, client, auth_headers):
        response = client.put("/api/v1/grades/999999", json={"name": "Nope"}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_cross_institution_forbidden(self, client, other_admin_headers, grade):
        response = client.put(f"/api/v1/grades/{grade.id}", json={"name": "Hijacked"}, headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------
class TestDeleteGrade:
    def test_delete_happy_path(self, client, auth_headers, grade):
        response = client.delete(f"/api/v1/grades/{grade.id}", headers=auth_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/grades/{grade.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/grades/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_forbidden(self, client, other_admin_headers, grade):
        response = client.delete(f"/api/v1/grades/{grade.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# bulk-order
# ---------------------------------------------------------------------------
class TestBulkOrderGrades:
    def test_bulk_order_happy_path_reaches_the_handler(self, client, auth_headers, institution, academic_year, grade, db_session):
        """Regression test for the route-ordering bug: before the fix, this
        request was swallowed by `PUT /{grade_id}` and returned 422
        ("bulk-order" is not a valid int) instead of reaching
        `update_grade_order`.
        """
        second_grade = Grade(institution_id=institution.id, academic_year_id=academic_year.id, name="Grade 12", display_order=1)
        db_session.add(second_grade)
        db_session.commit()
        db_session.refresh(second_grade)

        response = client.put(
            "/api/v1/grades/bulk-order",
            json={"grades": [
                {"id": grade.id, "display_order": 5},
                {"id": second_grade.id, "display_order": 6},
            ]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == {"message": "Order updated successfully"}

        db_session.refresh(grade)
        db_session.refresh(second_grade)
        assert grade.display_order == 5
        assert second_grade.display_order == 6

    def test_bulk_order_ignores_ids_from_other_institutions(self, client, auth_headers, other_institution, other_academic_year, db_session):
        other_grade = Grade(institution_id=other_institution.id, academic_year_id=other_academic_year.id, name="Other Grade", display_order=1)
        db_session.add(other_grade)
        db_session.commit()
        db_session.refresh(other_grade)

        response = client.put(
            "/api/v1/grades/bulk-order",
            json={"grades": [{"id": other_grade.id, "display_order": 42}]},
            headers=auth_headers,
        )
        assert response.status_code == 200

        db_session.refresh(other_grade)
        assert other_grade.display_order == 1

    def test_bulk_order_requires_auth(self, client):
        response = client.put("/api/v1/grades/bulk-order", json={"grades": []})
        assert response.status_code == 403
