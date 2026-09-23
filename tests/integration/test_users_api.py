"""Integration tests for the `users` router (src/api/v1/users.py).

Covers user CRUD (institution-admin-scoped, permission-gated via
`require_permissions`), the current-user's own `/me/profile` read/update,
and cross-tenant authorization.

Bugs found and fixed while writing this coverage (see `src/api/v1/users.py`
for the full comments at each call site):

1. **Cross-tenant authorization gap (role escalation across institutions)**:
   `create_user` and `update_user` accepted `role_id` with no check that the
   role even exists, let alone that it belongs to the target institution.
   `Role.institution_id` scopes a *custom* role to one institution (a system
   role like the seeded "admin"/"teacher"/"student" roles has
   `institution_id=None` and is legitimately shared across all
   institutions), but nothing validated this. An institution-A admin who
   knew or guessed another institution's custom role id could assign that
   role -- and whatever permissions it carries -- to a user in institution
   A, crossing the exact tenant boundary the `verify_institution_access`
   check right above it was meant to enforce. A nonexistent `role_id` also
   fell straight through to the DB's FK constraint as an unhandled
   `IntegrityError` -> 500 instead of a clean 400. Fixed both endpoints to
   validate the role exists and is either a shared system role or scoped to
   the same institution as the user being created/updated, returning 400
   otherwise.
2. `create_user` never checked that `user_data.institution_id` refers to a
   real institution -- a superuser posting a bogus institution id fell
   through to the FK constraint on `users.institution_id` as an unhandled
   `IntegrityError` -> 500 instead of a clean 404. Fixed to check first.

Everything else in this router checked out: `get_user`/`update_user`/
`delete_user` all correctly scope by `db_user.institution_id` via
`verify_institution_access` (not just the *requesting* user's own id), and
`list_users` correctly filters to the caller's own institution unless the
caller is a superuser. `/me/profile` (both GET and PUT) come after
`/{user_id}` in the router's declaration order, but this is *not* an
instance of the route-shadowing bug class: `/{user_id}` is a single path
segment and `/me/profile` is two, so Starlette's routing never confuses
them regardless of declared order (confirmed both work as expected).
"""
import uuid

import pytest

from src.models.role import Role
from src.models.user import User
from src.utils.security import get_password_hash


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution

    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other Users School {suffix}",
        slug=f"other-users-school-{suffix}",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def other_admin_role(db_session, other_institution) -> Role:
    """Another institution's own admin role (institution-scoped, unlike the
    shared system `admin_role` fixture)."""
    role = Role(
        name="Other Admin",
        slug="other-admin",
        institution_id=other_institution.id,
        is_system_role=False,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_institution_admin(db_session, other_institution, other_admin_role) -> User:
    """An admin user belonging to `other_institution`, with the *same*
    users:* permissions as tests/conftest.py's `admin_role` (needed because
    `other_admin_role` is a fresh institution-scoped role, not the shared
    system `admin_role`)."""
    from src.models.permission import Permission

    for resource, action in [
        ("users", "create"),
        ("users", "read"),
        ("users", "update"),
        ("users", "delete"),
    ]:
        perm = (
            db_session.query(Permission)
            .filter(Permission.resource == resource, Permission.action == action)
            .first()
        )
        if perm not in other_admin_role.permissions:
            other_admin_role.permissions.append(perm)
    db_session.commit()

    user = User(
        username="other_inst_admin",
        email="other_inst_admin@otherschool.com",
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
def other_institution_headers(client, other_institution_admin) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_institution_admin.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def super_admin_user(db_session, institution, admin_role) -> User:
    user = User(
        username="users_superadmin",
        email="users_superadmin@testschool.com",
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


def _user_payload(institution_id: int, role_id: int, **overrides) -> dict:
    suffix = uuid.uuid4().hex[:10]
    payload = {
        "email": f"newuser-{suffix}@testschool.com",
        "username": f"newuser{suffix}",
        "first_name": "New",
        "last_name": "User",
        "phone": "+19998887777",
        "is_active": True,
        "is_superuser": False,
        "institution_id": institution_id,
        "role_id": role_id,
        "password": "password123",
    }
    payload.update(overrides)
    return payload


@pytest.mark.integration
class TestCreateUser:
    def test_create_user_happy_path(self, client, auth_headers, institution, teacher_role):
        payload = _user_payload(institution.id, teacher_role.id)
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["email"] == payload["email"]
        assert data["username"] == payload["username"]
        assert data["institution_id"] == institution.id
        assert data["role_id"] == teacher_role.id
        assert "hashed_password" not in data
        assert "password" not in data

    def test_create_user_forbidden_wrong_institution(
        self, client, auth_headers, other_institution, teacher_role
    ):
        payload = _user_payload(other_institution.id, teacher_role.id)
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 403

    def test_create_user_superuser_can_target_any_institution(
        self, client, super_admin_headers, other_institution, teacher_role
    ):
        payload = _user_payload(other_institution.id, teacher_role.id)
        response = client.post("/api/v1/users/", json=payload, headers=super_admin_headers)
        assert response.status_code == 201

    def test_create_user_nonexistent_institution(self, client, super_admin_headers, teacher_role):
        payload = _user_payload(999999, teacher_role.id)
        response = client.post("/api/v1/users/", json=payload, headers=super_admin_headers)
        assert response.status_code == 404

    def test_create_user_duplicate_email_same_institution(
        self, client, auth_headers, institution, teacher_role, admin_user
    ):
        payload = _user_payload(institution.id, teacher_role.id, email=admin_user.email)
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()

    def test_create_user_duplicate_username_same_institution(
        self, client, auth_headers, institution, teacher_role, admin_user
    ):
        payload = _user_payload(institution.id, teacher_role.id, username=admin_user.username)
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 400
        assert "username" in response.json()["detail"].lower()

    def test_create_user_same_email_different_institution_allowed(
        self, client, super_admin_headers, other_institution, teacher_role, admin_user
    ):
        """Email/username uniqueness is scoped per-institution (matching the
        idx_user_institution_email/username unique indexes)."""
        payload = _user_payload(other_institution.id, teacher_role.id, email=admin_user.email)
        response = client.post("/api/v1/users/", json=payload, headers=super_admin_headers)
        assert response.status_code == 201

    def test_create_user_nonexistent_role(self, client, auth_headers, institution):
        payload = _user_payload(institution.id, 999999)
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 400
        assert "role" in response.json()["detail"].lower()

    def test_create_user_foreign_institution_role_rejected(
        self, client, auth_headers, institution, other_admin_role
    ):
        """Regression test for the cross-tenant role-escalation gap: a role
        scoped to a different institution must not be assignable here."""
        payload = _user_payload(institution.id, other_admin_role.id)
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 400
        assert "role" in response.json()["detail"].lower()

    def test_create_user_system_role_allowed_across_institutions(
        self, client, auth_headers, institution, teacher_role
    ):
        """A system role (institution_id=None, e.g. the seeded
        admin/teacher/student roles) is legitimately shared -- not a
        cross-tenant violation."""
        assert teacher_role.institution_id is None
        payload = _user_payload(institution.id, teacher_role.id)
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 201

    def test_create_user_missing_permission_forbidden(
        self, client, institution, teacher_role, teacher_user
    ):
        login = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "password123"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        payload = _user_payload(institution.id, teacher_role.id)
        response = client.post("/api/v1/users/", json=payload, headers=headers)
        assert response.status_code == 403

    def test_create_user_requires_auth(self, client, institution, teacher_role):
        payload = _user_payload(institution.id, teacher_role.id)
        response = client.post("/api/v1/users/", json=payload)
        assert response.status_code in (401, 403)

    def test_create_user_validation_error_short_password(
        self, client, auth_headers, institution, teacher_role
    ):
        payload = _user_payload(institution.id, teacher_role.id, password="short")
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 422

    def test_create_user_validation_error_bad_email(
        self, client, auth_headers, institution, teacher_role
    ):
        payload = _user_payload(institution.id, teacher_role.id, email="not-an-email")
        response = client.post("/api/v1/users/", json=payload, headers=auth_headers)
        assert response.status_code == 422


@pytest.mark.integration
class TestGetUser:
    def test_get_user_happy_path(self, client, auth_headers, admin_user, teacher_user):
        response = client.get(f"/api/v1/users/{teacher_user.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == teacher_user.id

    def test_get_user_not_found(self, client, auth_headers):
        response = client.get("/api/v1/users/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_user_cross_institution_forbidden(
        self, client, auth_headers, other_institution_admin
    ):
        response = client.get(f"/api/v1/users/{other_institution_admin.id}", headers=auth_headers)
        assert response.status_code == 403

    def test_get_user_superuser_can_access_any_institution(
        self, client, super_admin_headers, other_institution_admin
    ):
        response = client.get(
            f"/api/v1/users/{other_institution_admin.id}", headers=super_admin_headers
        )
        assert response.status_code == 200

    def test_get_user_missing_permission_forbidden(self, client, teacher_user, admin_user):
        login = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "password123"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        response = client.get(f"/api/v1/users/{admin_user.id}", headers=headers)
        assert response.status_code == 403

    def test_get_user_requires_auth(self, client, admin_user):
        response = client.get(f"/api/v1/users/{admin_user.id}")
        assert response.status_code in (401, 403)


@pytest.mark.integration
class TestListUsers:
    def test_list_users_scoped_to_own_institution(
        self, client, auth_headers, admin_user, other_institution_admin
    ):
        response = client.get("/api/v1/users/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        ids = {u["id"] for u in data}
        assert admin_user.id in ids
        assert other_institution_admin.id not in ids

    def test_list_users_superuser_sees_all_institutions(
        self, client, super_admin_headers, admin_user, other_institution_admin
    ):
        response = client.get("/api/v1/users/", headers=super_admin_headers)
        assert response.status_code == 200
        ids = {u["id"] for u in response.json()}
        assert admin_user.id in ids
        assert other_institution_admin.id in ids

    def test_list_users_pagination(self, client, auth_headers, admin_user, teacher_user):
        response = client.get("/api/v1/users/", params={"skip": 0, "limit": 1}, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) <= 1

    def test_list_users_requires_auth(self, client):
        response = client.get("/api/v1/users/")
        assert response.status_code in (401, 403)


@pytest.mark.integration
class TestUpdateUser:
    def test_update_user_happy_path(self, client, auth_headers, teacher_user):
        response = client.put(
            f"/api/v1/users/{teacher_user.id}",
            json={"first_name": "Updated"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["first_name"] == "Updated"

    def test_update_user_not_found(self, client, auth_headers):
        response = client.put(
            "/api/v1/users/999999", json={"first_name": "X"}, headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_user_cross_institution_forbidden(
        self, client, auth_headers, other_institution_admin
    ):
        response = client.put(
            f"/api/v1/users/{other_institution_admin.id}",
            json={"first_name": "Hostile"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_update_user_superuser_can_update_any_institution(
        self, client, super_admin_headers, other_institution_admin
    ):
        response = client.put(
            f"/api/v1/users/{other_institution_admin.id}",
            json={"first_name": "SuperUpdated"},
            headers=super_admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["first_name"] == "SuperUpdated"

    def test_update_user_password_is_hashed(self, client, db_session, auth_headers, teacher_user):
        response = client.put(
            f"/api/v1/users/{teacher_user.id}",
            json={"password": "newpassword456"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        db_session.refresh(teacher_user)
        assert teacher_user.hashed_password != "newpassword456"
        from src.utils.security import verify_password

        assert verify_password("newpassword456", teacher_user.hashed_password)

    def test_update_user_nonexistent_role_rejected(self, client, auth_headers, teacher_user):
        response = client.put(
            f"/api/v1/users/{teacher_user.id}",
            json={"role_id": 999999},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "role" in response.json()["detail"].lower()

    def test_update_user_foreign_institution_role_rejected(
        self, client, auth_headers, teacher_user, other_admin_role
    ):
        """Regression test for the cross-tenant role-escalation gap on
        update_user."""
        response = client.put(
            f"/api/v1/users/{teacher_user.id}",
            json={"role_id": other_admin_role.id},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "role" in response.json()["detail"].lower()

    def test_update_user_same_institution_role_allowed(
        self, client, db_session, auth_headers, institution, teacher_user
    ):
        own_role = Role(
            name="Own Custom Role",
            slug="own-custom-role",
            institution_id=institution.id,
            is_system_role=False,
        )
        db_session.add(own_role)
        db_session.commit()
        db_session.refresh(own_role)

        response = client.put(
            f"/api/v1/users/{teacher_user.id}",
            json={"role_id": own_role.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["role_id"] == own_role.id

    def test_update_user_missing_permission_forbidden(self, client, teacher_user, student_user):
        login = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "password123"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        response = client.put(
            f"/api/v1/users/{student_user.id}", json={"first_name": "X"}, headers=headers
        )
        assert response.status_code == 403

    def test_update_user_requires_auth(self, client, teacher_user):
        response = client.put(f"/api/v1/users/{teacher_user.id}", json={"first_name": "X"})
        assert response.status_code in (401, 403)

    def test_update_user_validation_error(self, client, auth_headers, teacher_user):
        response = client.put(
            f"/api/v1/users/{teacher_user.id}",
            json={"email": "not-an-email"},
            headers=auth_headers,
        )
        assert response.status_code == 422


@pytest.mark.integration
class TestDeleteUser:
    def test_delete_user_happy_path(self, client, auth_headers, teacher_user):
        response = client.delete(f"/api/v1/users/{teacher_user.id}", headers=auth_headers)
        assert response.status_code == 204

        follow_up = client.get(f"/api/v1/users/{teacher_user.id}", headers=auth_headers)
        assert follow_up.status_code == 404

    def test_delete_user_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/users/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_user_cross_institution_forbidden(
        self, client, auth_headers, other_institution_admin
    ):
        response = client.delete(f"/api/v1/users/{other_institution_admin.id}", headers=auth_headers)
        assert response.status_code == 403

    def test_delete_own_account_rejected(self, client, auth_headers, admin_user):
        response = client.delete(f"/api/v1/users/{admin_user.id}", headers=auth_headers)
        assert response.status_code == 400
        assert "own account" in response.json()["detail"].lower()

    def test_delete_user_missing_permission_forbidden(self, client, teacher_user, student_user):
        login = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "password123"},
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        response = client.delete(f"/api/v1/users/{student_user.id}", headers=headers)
        assert response.status_code == 403

    def test_delete_user_requires_auth(self, client, teacher_user):
        response = client.delete(f"/api/v1/users/{teacher_user.id}")
        assert response.status_code in (401, 403)


@pytest.mark.integration
class TestMyProfile:
    def test_get_my_profile(self, client, auth_headers, admin_user):
        response = client.get("/api/v1/users/me/profile", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == admin_user.id
        assert response.json()["email"] == admin_user.email

    def test_get_my_profile_requires_auth(self, client):
        response = client.get("/api/v1/users/me/profile")
        assert response.status_code in (401, 403)

    def test_update_my_profile(self, client, auth_headers, admin_user):
        response = client.put(
            "/api/v1/users/me/profile",
            json={"first_name": "SelfUpdated", "phone": "+15551234567"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "SelfUpdated"
        assert data["phone"] == "+15551234567"

    def test_update_my_profile_cannot_escalate_privileges(
        self, client, auth_headers, admin_user, super_admin_user
    ):
        """UserUpdate accepts is_superuser/role_id/is_active, but
        update_my_profile explicitly excludes them from what a user can
        change about themselves."""
        response = client.put(
            "/api/v1/users/me/profile",
            json={
                "is_superuser": True,
                "role_id": super_admin_user.role_id,
                "is_active": False,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_superuser"] is False
        assert data["is_active"] is True

    def test_update_my_profile_password(self, client, db_session, auth_headers, admin_user):
        response = client.put(
            "/api/v1/users/me/profile",
            json={"password": "brandnewpassword1"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        db_session.refresh(admin_user)
        from src.utils.security import verify_password

        assert verify_password("brandnewpassword1", admin_user.hashed_password)

    def test_update_my_profile_requires_auth(self, client):
        response = client.put("/api/v1/users/me/profile", json={"first_name": "X"})
        assert response.status_code in (401, 403)
