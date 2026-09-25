"""Integration tests for the `institutions` router (src/api/v1/institutions.py).

Institution management is a platform-level operation: creation, listing, and
deletion require a superuser (`Depends(get_current_superuser)`), while
reading/updating a single institution is available to that institution's own
admin (checked via `current_user.institution_id == institution_id`, plus a
role check on update) as well as any superuser.

This router is a foundational dependency of nearly every other tested
router in this codebase -- an `Institution` row (and a working
`InstitutionService`) underpins virtually every other fixture.

Bugs found and fixed while writing this coverage (see
`src/models/institution.py`, `src/services/institution_service.py` for the
full comments):

1. `Institution` (the ORM model) was missing the `description` and
   `max_users` columns entirely, even though `src/schemas/institution.py`'s
   `InstitutionBase`/`InstitutionCreate`/`InstitutionUpdate` all declare
   them, and `src/api/v1/super_admin.py`, `src/services/
   institution_health_service.py`, and `src/utils/tenant.py` all read
   `institution.description`/`institution.max_users` as if they existed.
   `InstitutionService.create_institution`'s
   `Institution(**institution_data.model_dump())` raised `TypeError:
   'description' is an invalid keyword argument for Institution` on
   literally every call -- `POST /institutions` was completely broken.
   Fixed by adding both columns to the model (and ALTERing the already-
   created test-DB table to match, matching this session's established
   MySQL DATETIME-precision-style environment fixups).
2. `create_institution`'s duplicate check used
   `or_(Institution.slug == ..., Institution.domain == institution_data.domain)`
   unconditionally. When `domain` is omitted (a common case -- it's
   optional), SQLAlchemy translates `Institution.domain == None` to
   `domain IS NULL`, which matches *any* other existing domain-less
   institution, and the follow-up `existing.domain ==
   institution_data.domain` (`None == None`) then reported a spurious
   "Institution with this domain already exists" 400 even when there was
   no real domain in play at all. Confirmed this broke institution
   creation as soon as a second domain-less institution was attempted.
   Fixed by only including the domain clause when a domain was actually
   supplied.
3. Neither `create_institution` nor `update_institution` checked `name`
   for uniqueness even though `Institution.name` is `unique=True` at the
   DB level -- a duplicate name fell through to an unhandled
   `IntegrityError` -> 500 instead of a clean 400. Fixed both to check
   explicitly, the same way `slug`/`domain` already were.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures: institution creation/listing/deletion require a superuser,
# which tests/conftest.py's standard `auth_headers` (admin role, not a
# superuser) doesn't provide.
# ---------------------------------------------------------------------------
@pytest.fixture
def super_admin_user(db_session, institution, admin_role) -> User:
    user = User(
        username="inst_superadmin",
        email="inst_superadmin@testschool.com",
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
def super_admin_headers(client, super_admin_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": super_admin_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_institution(db_session) -> Institution:
    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


def _institution_payload(**overrides) -> dict:
    suffix = uuid.uuid4().hex[:12]
    payload = {
        "name": f"New School {suffix}",
        "slug": f"new-school-{suffix}",
        "domain": f"new-school-{suffix}.edu",
        "description": "A brand new school",
        "is_active": True,
        "max_users": 500,
        "settings": None,
    }
    payload.update(overrides)
    return payload


@pytest.mark.integration
class TestCreateInstitution:
    def test_create_institution_as_superuser(self, client, super_admin_headers):
        payload = _institution_payload()
        response = client.post("/api/v1/institutions/", json=payload, headers=super_admin_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["slug"] == payload["slug"]
        assert data["domain"] == payload["domain"]
        assert data["description"] == payload["description"]
        assert data["max_users"] == payload["max_users"]
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    def test_create_institution_without_domain(self, client, super_admin_headers):
        """Regression test for the None-domain false-positive-conflict bug."""
        payload1 = _institution_payload(domain=None)
        payload2 = _institution_payload(domain=None)

        r1 = client.post("/api/v1/institutions/", json=payload1, headers=super_admin_headers)
        assert r1.status_code == 201, r1.text
        assert r1.json()["domain"] is None

        r2 = client.post("/api/v1/institutions/", json=payload2, headers=super_admin_headers)
        assert r2.status_code == 201, r2.text
        assert r2.json()["domain"] is None

    def test_create_institution_forbidden_for_non_superuser(self, client, auth_headers):
        payload = _institution_payload()
        response = client.post("/api/v1/institutions/", json=payload, headers=auth_headers)
        assert response.status_code == 403

    def test_create_institution_requires_auth(self, client):
        payload = _institution_payload()
        response = client.post("/api/v1/institutions/", json=payload)
        assert response.status_code in (401, 403)

    def test_create_institution_duplicate_slug(self, client, super_admin_headers, institution):
        payload = _institution_payload(slug=institution.slug)
        response = client.post("/api/v1/institutions/", json=payload, headers=super_admin_headers)
        assert response.status_code == 400
        assert "slug" in response.json()["detail"].lower()

    def test_create_institution_duplicate_domain(self, client, super_admin_headers):
        first = _institution_payload()
        r1 = client.post("/api/v1/institutions/", json=first, headers=super_admin_headers)
        assert r1.status_code == 201

        second = _institution_payload(domain=first["domain"])
        r2 = client.post("/api/v1/institutions/", json=second, headers=super_admin_headers)
        assert r2.status_code == 400
        assert "domain" in r2.json()["detail"].lower()

    def test_create_institution_duplicate_name(self, client, super_admin_headers, institution):
        payload = _institution_payload(name=institution.name)
        response = client.post("/api/v1/institutions/", json=payload, headers=super_admin_headers)
        assert response.status_code == 400
        assert "name" in response.json()["detail"].lower()

    def test_create_institution_missing_required_field(self, client, super_admin_headers):
        payload = _institution_payload()
        del payload["slug"]
        response = client.post("/api/v1/institutions/", json=payload, headers=super_admin_headers)
        assert response.status_code == 422


@pytest.mark.integration
class TestListInstitutions:
    def test_list_institutions_as_superuser(self, client, super_admin_headers, institution):
        response = client.get("/api/v1/institutions/", headers=super_admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
        assert any(item["id"] == institution.id for item in data["items"])

    def test_list_institutions_forbidden_for_non_superuser(self, client, auth_headers):
        response = client.get("/api/v1/institutions/", headers=auth_headers)
        assert response.status_code == 403

    def test_list_institutions_search(self, client, super_admin_headers, institution):
        search_term = institution.name.split(" ")[-1]
        response = client.get(
            "/api/v1/institutions/", params={"search": search_term}, headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert any(item["id"] == institution.id for item in data["items"])

    def test_list_institutions_filter_is_active(self, client, super_admin_headers, institution):
        response = client.get(
            "/api/v1/institutions/", params={"is_active": True}, headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert all(item["is_active"] is True for item in data["items"])

    def test_list_institutions_pagination(self, client, super_admin_headers, institution):
        response = client.get(
            "/api/v1/institutions/", params={"skip": 0, "limit": 1}, headers=super_admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 1
        assert data["limit"] == 1


@pytest.mark.integration
class TestGetInstitution:
    def test_get_own_institution(self, client, auth_headers, institution):
        response = client.get(f"/api/v1/institutions/{institution.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == institution.id

    def test_get_institution_as_superuser_any_institution(
        self, client, super_admin_headers, other_institution
    ):
        response = client.get(f"/api/v1/institutions/{other_institution.id}", headers=super_admin_headers)
        assert response.status_code == 200
        assert response.json()["id"] == other_institution.id

    def test_get_other_institution_forbidden(self, client, auth_headers, other_institution):
        response = client.get(f"/api/v1/institutions/{other_institution.id}", headers=auth_headers)
        assert response.status_code == 403

    def test_get_institution_not_found(self, client, super_admin_headers):
        response = client.get("/api/v1/institutions/999999", headers=super_admin_headers)
        assert response.status_code == 404

    def test_get_institution_requires_auth(self, client, institution):
        response = client.get(f"/api/v1/institutions/{institution.id}")
        assert response.status_code in (401, 403)


@pytest.mark.integration
class TestGetInstitutionStats:
    def test_get_own_institution_stats(self, client, auth_headers, institution, admin_user):
        response = client.get(f"/api/v1/institutions/{institution.id}/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert data["total_users"] >= 1
        assert "active_users" in data
        assert "total_teachers" in data
        assert "total_students" in data

    def test_get_other_institution_stats_forbidden(self, client, auth_headers, other_institution):
        response = client.get(f"/api/v1/institutions/{other_institution.id}/stats", headers=auth_headers)
        assert response.status_code == 403

    def test_get_institution_stats_not_found(self, client, super_admin_headers):
        response = client.get("/api/v1/institutions/999999/stats", headers=super_admin_headers)
        assert response.status_code == 404

    def test_get_institution_stats_as_superuser(self, client, super_admin_headers, other_institution):
        response = client.get(
            f"/api/v1/institutions/{other_institution.id}/stats", headers=super_admin_headers
        )
        assert response.status_code == 200


@pytest.mark.integration
class TestUpdateInstitution:
    def test_admin_can_update_own_institution(self, client, auth_headers, institution):
        response = client.put(
            f"/api/v1/institutions/{institution.id}",
            json={"description": "Updated description"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["description"] == "Updated description"

    def test_superuser_can_update_any_institution(
        self, client, super_admin_headers, other_institution
    ):
        response = client.put(
            f"/api/v1/institutions/{other_institution.id}",
            json={"name": "Renamed by superuser"},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Renamed by superuser"

    def test_update_other_institution_forbidden(self, client, auth_headers, other_institution):
        response = client.put(
            f"/api/v1/institutions/{other_institution.id}",
            json={"description": "Hostile update"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_update_institution_wrong_role_forbidden(
        self, client, db_session, institution, teacher_role
    ):
        teacher = User(
            username="teacher_updater",
            email="teacher_updater@testschool.com",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=teacher_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(teacher)
        db_session.commit()
        db_session.refresh(teacher)

        login = client.post(
            "/api/v1/auth/login",
            json={"email": teacher.email, "password": "password123"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = client.put(
            f"/api/v1/institutions/{institution.id}",
            json={"description": "Teacher trying to update"},
            headers=headers,
        )
        assert response.status_code == 403

    def test_update_institution_not_found(self, client, super_admin_headers):
        response = client.put(
            "/api/v1/institutions/999999",
            json={"description": "Nope"},
            headers=super_admin_headers,
        )
        assert response.status_code == 404

    def test_update_institution_duplicate_domain(
        self, client, super_admin_headers, institution, other_institution
    ):
        # Give `institution` a domain first.
        r = client.put(
            f"/api/v1/institutions/{institution.id}",
            json={"domain": "taken-domain.edu"},
            headers=super_admin_headers,
        )
        assert r.status_code == 200

        response = client.put(
            f"/api/v1/institutions/{other_institution.id}",
            json={"domain": "taken-domain.edu"},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_update_institution_duplicate_name(
        self, client, super_admin_headers, institution, other_institution
    ):
        response = client.put(
            f"/api/v1/institutions/{other_institution.id}",
            json={"name": institution.name},
            headers=super_admin_headers,
        )
        assert response.status_code == 400

    def test_update_institution_requires_auth(self, client, institution):
        response = client.put(
            f"/api/v1/institutions/{institution.id}", json={"description": "x"}
        )
        assert response.status_code in (401, 403)


@pytest.mark.integration
class TestDeleteInstitution:
    def test_delete_institution_as_superuser(self, client, super_admin_headers, other_institution):
        response = client.delete(
            f"/api/v1/institutions/{other_institution.id}", headers=super_admin_headers
        )
        assert response.status_code == 204

        follow_up = client.get(
            f"/api/v1/institutions/{other_institution.id}", headers=super_admin_headers
        )
        assert follow_up.status_code == 404

    def test_delete_institution_forbidden_for_non_superuser(
        self, client, auth_headers, other_institution
    ):
        response = client.delete(
            f"/api/v1/institutions/{other_institution.id}", headers=auth_headers
        )
        assert response.status_code == 403

    def test_delete_institution_not_found(self, client, super_admin_headers):
        response = client.delete("/api/v1/institutions/999999", headers=super_admin_headers)
        assert response.status_code == 404

    def test_delete_institution_requires_auth(self, client, other_institution):
        response = client.delete(f"/api/v1/institutions/{other_institution.id}")
        assert response.status_code in (401, 403)
