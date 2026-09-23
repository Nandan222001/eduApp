"""Integration tests for the `grade_configurations` router
(src/api/v1/grade_configurations.py).

A small institution-scoped CRUD for the percentage-range -> letter-grade
mapping used elsewhere in exam grading (e.g. 90-100 -> "A+", grade_point 4.0).
No role restriction exists on this router (consistent with sibling
institution-scoped config routers such as terms.py/academic_years.py in this
codebase, which also have none) -- only institution ownership is enforced.
"""
import uuid
from decimal import Decimal

import pytest

from src.models.institution import Institution
from src.models.examination import GradeConfiguration
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
def other_admin_role(db_session):
    from src.models.role import Role
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role):
    from src.models.user import User
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
    response = client.post("/api/v1/auth/login", json={"email": other_admin_user.email, "password": "password123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def grade_config(db_session, admin_user) -> GradeConfiguration:
    config = GradeConfiguration(
        institution_id=admin_user.institution_id,
        name="A Grade",
        grade="A",
        min_percentage=Decimal("90.00"),
        max_percentage=Decimal("100.00"),
        grade_point=Decimal("4.00"),
        is_passing=True,
        is_active=True,
    )
    db_session.add(config)
    db_session.commit()
    db_session.refresh(config)
    return config


# ===========================================================================
# POST /
# ===========================================================================
class TestCreateGradeConfiguration:
    def test_create_success(self, client, auth_headers, admin_user):
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "name": "B Grade",
                "grade": "B",
                "min_percentage": "75.00",
                "max_percentage": "89.99",
                "grade_point": "3.00",
                "is_passing": True,
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["name"] == "B Grade"
        assert data["grade"] == "B"
        assert float(data["min_percentage"]) == 75.00
        assert data["is_active"] is True
        assert "id" in data

    def test_create_requires_auth(self, client, admin_user):
        response = client.post(
            "/api/v1/grade-configurations/",
            json={
                "institution_id": admin_user.institution_id,
                "name": "B Grade",
                "grade": "B",
                "min_percentage": "75.00",
                "max_percentage": "89.99",
                "grade_point": "3.00",
            },
        )
        assert response.status_code == 403

    def test_create_cross_institution_403(self, client, auth_headers, other_institution):
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "name": "B Grade",
                "grade": "B",
                "min_percentage": "75.00",
                "max_percentage": "89.99",
                "grade_point": "3.00",
            },
        )
        assert response.status_code == 403

    def test_create_overlapping_range_400(self, client, auth_headers, admin_user, grade_config):
        # grade_config already covers 90.00-100.00
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "name": "A+ Grade",
                "grade": "A+",
                "min_percentage": "95.00",
                "max_percentage": "100.00",
                "grade_point": "4.50",
            },
        )
        assert response.status_code == 400
        assert "overlap" in response.json()["detail"].lower()

    def test_create_non_overlapping_range_succeeds(self, client, auth_headers, admin_user, grade_config):
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "name": "B Grade",
                "grade": "B",
                "min_percentage": "75.00",
                "max_percentage": "89.99",
                "grade_point": "3.00",
            },
        )
        assert response.status_code == 201

    def test_create_overlap_ignores_inactive_configs(self, client, auth_headers, admin_user, db_session, grade_config):
        grade_config.is_active = False
        db_session.commit()

        # Same range as the now-inactive config -- must be allowed since
        # is_active == False configs are excluded from the overlap check.
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "name": "A Grade v2",
                "grade": "A",
                "min_percentage": "90.00",
                "max_percentage": "100.00",
                "grade_point": "4.00",
            },
        )
        assert response.status_code == 201

    def test_create_max_less_than_min_422(self, client, auth_headers, admin_user):
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "name": "Bad Grade",
                "grade": "Z",
                "min_percentage": "50.00",
                "max_percentage": "10.00",
                "grade_point": "1.00",
            },
        )
        assert response.status_code == 422

    def test_create_missing_required_field_422(self, client, auth_headers, admin_user):
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={"institution_id": admin_user.institution_id, "name": "No Grade"},
        )
        assert response.status_code == 422

    def test_create_percentage_out_of_bounds_422(self, client, auth_headers, admin_user):
        response = client.post(
            "/api/v1/grade-configurations/",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "name": "Bad Grade",
                "grade": "Z",
                "min_percentage": "-5.00",
                "max_percentage": "10.00",
                "grade_point": "1.00",
            },
        )
        assert response.status_code == 422


# ===========================================================================
# GET /
# ===========================================================================
class TestListGradeConfigurations:
    def test_list_success(self, client, auth_headers, grade_config):
        response = client.get("/api/v1/grade-configurations/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["id"] == grade_config.id for item in data["items"])

    def test_list_only_own_institution(self, client, other_admin_headers, grade_config):
        response = client.get("/api/v1/grade-configurations/", headers=other_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(item["id"] != grade_config.id for item in data["items"])
        assert data["total"] == 0

    def test_list_filter_is_active(self, client, auth_headers, admin_user, db_session, grade_config):
        inactive = GradeConfiguration(
            institution_id=admin_user.institution_id,
            name="Inactive Grade",
            grade="F",
            min_percentage=Decimal("0.00"),
            max_percentage=Decimal("34.99"),
            grade_point=Decimal("0.00"),
            is_passing=False,
            is_active=False,
        )
        db_session.add(inactive)
        db_session.commit()

        response = client.get("/api/v1/grade-configurations/", headers=auth_headers, params={"is_active": False})
        assert response.status_code == 200
        data = response.json()
        assert all(item["is_active"] is False for item in data["items"])
        assert any(item["grade"] == "F" for item in data["items"])

    def test_list_ordered_by_min_percentage_desc(self, client, auth_headers, admin_user, db_session, grade_config):
        low = GradeConfiguration(
            institution_id=admin_user.institution_id,
            name="Low Grade",
            grade="F",
            min_percentage=Decimal("0.00"),
            max_percentage=Decimal("34.99"),
            grade_point=Decimal("0.00"),
            is_active=True,
        )
        db_session.add(low)
        db_session.commit()

        response = client.get("/api/v1/grade-configurations/", headers=auth_headers)
        data = response.json()["items"]
        percentages = [float(item["min_percentage"]) for item in data]
        assert percentages == sorted(percentages, reverse=True)

    def test_list_requires_auth(self, client):
        response = client.get("/api/v1/grade-configurations/")
        assert response.status_code == 403


# ===========================================================================
# GET /{config_id}
# ===========================================================================
class TestGetGradeConfiguration:
    def test_get_success(self, client, auth_headers, grade_config):
        response = client.get(f"/api/v1/grade-configurations/{grade_config.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == grade_config.id

    def test_get_not_found_404(self, client, auth_headers):
        response = client.get("/api/v1/grade-configurations/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_403(self, client, other_admin_headers, grade_config):
        response = client.get(f"/api/v1/grade-configurations/{grade_config.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ===========================================================================
# PUT /{config_id}
# ===========================================================================
class TestUpdateGradeConfiguration:
    def test_update_success(self, client, auth_headers, grade_config):
        response = client.put(
            f"/api/v1/grade-configurations/{grade_config.id}",
            headers=auth_headers,
            json={"name": "A Grade Updated", "grade_point": "4.25"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["name"] == "A Grade Updated"
        assert float(data["grade_point"]) == 4.25
        # Untouched fields must be preserved.
        assert data["grade"] == "A"

    def test_update_deactivate(self, client, auth_headers, grade_config):
        response = client.put(
            f"/api/v1/grade-configurations/{grade_config.id}", headers=auth_headers, json={"is_active": False}
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    def test_update_not_found_404(self, client, auth_headers):
        response = client.put("/api/v1/grade-configurations/999999", headers=auth_headers, json={"name": "X"})
        assert response.status_code == 404

    def test_update_cross_institution_403(self, client, other_admin_headers, grade_config):
        response = client.put(
            f"/api/v1/grade-configurations/{grade_config.id}", headers=other_admin_headers, json={"name": "Hacked"}
        )
        assert response.status_code == 403

    def test_update_invalid_percentage_422(self, client, auth_headers, grade_config):
        response = client.put(
            f"/api/v1/grade-configurations/{grade_config.id}",
            headers=auth_headers,
            json={"min_percentage": "150.00"},
        )
        assert response.status_code == 422


# ===========================================================================
# DELETE /{config_id}
# ===========================================================================
class TestDeleteGradeConfiguration:
    def test_delete_success(self, client, auth_headers, grade_config, db_session):
        response = client.delete(f"/api/v1/grade-configurations/{grade_config.id}", headers=auth_headers)
        assert response.status_code == 204
        assert db_session.query(GradeConfiguration).filter(GradeConfiguration.id == grade_config.id).first() is None

    def test_delete_not_found_404(self, client, auth_headers):
        response = client.delete("/api/v1/grade-configurations/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_403(self, client, other_admin_headers, grade_config, db_session):
        response = client.delete(f"/api/v1/grade-configurations/{grade_config.id}", headers=other_admin_headers)
        assert response.status_code == 403
        assert db_session.query(GradeConfiguration).filter(GradeConfiguration.id == grade_config.id).first() is not None
