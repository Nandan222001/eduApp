"""Integration tests for the `profile` router (src/api/v1/profile.py).

Small, current-user-focused profile router: `GET/PUT /profile/me` for the
logged-in user's own profile, and `GET/PUT /profile/{user_id}` for viewing/
editing a specific user (self or superuser only). `GET` responses return a
hand-built dict (not a raw ORM object -- no unvalidated-leak concern since
every field is explicitly whitelisted), so there's no `response_model`
drift to check there (bug class 3 doesn't apply: nothing is silently
leaking hashed_password or similar). `PUT` responses use `UserResponse`,
which was checked field-by-field against `src/models/user.py`'s `User` --
no drift found.

Bug found and fixed while writing this coverage:

1. **Self-service privilege escalation via `role_id`/`is_active` (a
   field-level authorization gap, bug class 12 adjacent)** --
   `UserUpdate` (src/schemas/user.py) is the same general-purpose schema
   admin-facing user management uses, so it carries `role_id` and
   `is_active`. Both `PUT /profile/me` and `PUT /profile/{user_id}` (when
   editing yourself) forwarded the entire `UserUpdate` object straight to
   `UserProfileService.update_user_profile`, which does an unconditional
   `setattr` for every field the caller set. This meant **any
   authenticated user could PUT their own `role_id` to another role's id
   (e.g. an admin role) and self-escalate privileges**, or flip their own
   `is_active` flag, purely through the "edit my own profile" endpoint --
   no separate admin/role-management endpoint involved at all. Fixed by
   stripping `role_id`/`is_active` from the update before it reaches the
   service whenever the caller is editing their own profile and isn't
   already a superuser (a superuser keeps full field access, since they
   can already grant themselves any role through legitimate admin
   endpoints). Other fields (name, email, phone, username, password)
   remain freely self-editable, as intended.
"""
import uuid

import pytest

from src.utils.security import get_password_hash


@pytest.fixture
def other_user(db_session, institution, teacher_role):
    """A second user in the SAME institution, for same-institution
    cross-user 403 checks on /profile/{user_id}."""
    from src.models.user import User
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheruser{suffix}",
        email=f"otheruser{suffix}@testschool.com",
        first_name="Other",
        last_name="User",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=teacher_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def superuser(db_session, institution, admin_role):
    from src.models.user import User
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"super{suffix}",
        email=f"super{suffix}@testschool.com",
        first_name="Super",
        last_name="User",
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
def superuser_headers(client, superuser) -> dict:
    response = client.post(
        "/api/v1/auth/login", json={"email": superuser.email, "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ===========================================================================
# GET /profile/me
# ===========================================================================
class TestGetMyProfile:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/profile/me")
        assert response.status_code == 403

    def test_get_my_profile(self, client, auth_headers, admin_user):
        response = client.get("/api/v1/profile/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == admin_user.id
        assert body["email"] == admin_user.email
        assert body["institution"]["id"] == admin_user.institution_id
        assert body["role"]["slug"] == "admin"
        # Never leaks the password hash.
        assert "hashed_password" not in body
        assert "password" not in body

    def test_get_my_profile_includes_teacher_subprofile(self, client, teacher_user, teacher, institution, teacher_role, db_session):
        response = client.post(
            "/api/v1/auth/login", json={"email": teacher_user.email, "password": "password123"}
        )
        headers = {"Authorization": f"Bearer {response.json()['access_token']}"}

        response = client.get("/api/v1/profile/me", headers=headers)
        assert response.status_code == 200
        body = response.json()
        assert body["teacher_profile"]["id"] == teacher.id
        assert "student_profile" not in body

    def test_get_my_profile_includes_student_subprofile(self, client, student_user, student, db_session):
        response = client.post(
            "/api/v1/auth/login", json={"email": student_user.email, "password": "password123"}
        )
        headers = {"Authorization": f"Bearer {response.json()['access_token']}"}

        response = client.get("/api/v1/profile/me", headers=headers)
        assert response.status_code == 200
        body = response.json()
        assert body["student_profile"]["id"] == student.id
        assert "teacher_profile" not in body


# ===========================================================================
# PUT /profile/me
# ===========================================================================
class TestUpdateMyProfile:
    def test_requires_auth(self, client):
        response = client.put("/api/v1/profile/me", json={"first_name": "X"})
        assert response.status_code == 403

    def test_update_own_name(self, client, auth_headers, admin_user):
        response = client.put(
            "/api/v1/profile/me",
            json={"first_name": "Updated", "last_name": "Name"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["first_name"] == "Updated"
        assert body["last_name"] == "Name"

    def test_update_own_email_duplicate_rejected(self, client, auth_headers, admin_user, other_user):
        response = client.put(
            "/api/v1/profile/me",
            json={"email": other_user.email},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_update_own_username_duplicate_rejected(self, client, auth_headers, admin_user, other_user):
        response = client.put(
            "/api/v1/profile/me",
            json={"username": other_user.username},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_update_own_password(self, client, auth_headers, admin_user):
        response = client.put(
            "/api/v1/profile/me",
            json={"password": "newpassword456"},
            headers=auth_headers,
        )
        assert response.status_code == 200

        # New password works, old one no longer does.
        login_new = client.post(
            "/api/v1/auth/login",
            json={"email": admin_user.email, "password": "newpassword456"},
        )
        assert login_new.status_code == 200

        login_old = client.post(
            "/api/v1/auth/login",
            json={"email": admin_user.email, "password": "password123"},
        )
        assert login_old.status_code == 401

    def test_update_own_password_too_short(self, client, auth_headers):
        response = client.put(
            "/api/v1/profile/me",
            json={"password": "short"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_cannot_self_escalate_role_id(self, client, auth_headers, admin_user, teacher_role, db_session):
        """Regression test: a non-superuser must not be able to change their
        own role_id via self-service profile update."""
        response = client.put(
            "/api/v1/profile/me",
            json={"role_id": teacher_role.id, "first_name": "StillAdmin"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        # role_id was silently dropped, not applied -- but the rest of the
        # update (first_name) still went through.
        assert body["role_id"] == admin_user.role_id
        assert body["role_id"] != teacher_role.id
        assert body["first_name"] == "StillAdmin"

        db_session.refresh(admin_user)
        assert admin_user.role_id != teacher_role.id

    def test_cannot_self_deactivate_via_is_active(self, client, auth_headers, admin_user, db_session):
        response = client.put(
            "/api/v1/profile/me",
            json={"is_active": False},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is True

        db_session.refresh(admin_user)
        assert admin_user.is_active is True


# ===========================================================================
# GET /profile/{user_id}
# ===========================================================================
class TestGetUserProfile:
    def test_requires_auth(self, client, admin_user):
        response = client.get(f"/api/v1/profile/{admin_user.id}")
        assert response.status_code == 403

    def test_get_own_profile_by_id(self, client, auth_headers, admin_user):
        response = client.get(f"/api/v1/profile/{admin_user.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == admin_user.id

    def test_get_other_user_profile_403(self, client, auth_headers, other_user):
        response = client.get(f"/api/v1/profile/{other_user.id}", headers=auth_headers)
        assert response.status_code == 403

    def test_superuser_can_get_other_user_profile(self, client, superuser_headers, other_user):
        response = client.get(f"/api/v1/profile/{other_user.id}", headers=superuser_headers)
        assert response.status_code == 200
        assert response.json()["id"] == other_user.id

    def test_get_profile_404_for_nonexistent_user(self, client, superuser_headers):
        response = client.get("/api/v1/profile/99999999", headers=superuser_headers)
        assert response.status_code == 404


# ===========================================================================
# PUT /profile/{user_id}
# ===========================================================================
class TestUpdateUserProfile:
    def test_update_other_user_403(self, client, auth_headers, other_user):
        response = client.put(
            f"/api/v1/profile/{other_user.id}",
            json={"first_name": "Hijacked"},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_superuser_can_update_other_user(self, client, superuser_headers, other_user):
        response = client.put(
            f"/api/v1/profile/{other_user.id}",
            json={"first_name": "AdminEdited"},
            headers=superuser_headers,
        )
        assert response.status_code == 200
        assert response.json()["first_name"] == "AdminEdited"

    def test_superuser_can_change_other_users_role(self, client, superuser_headers, other_user, admin_role, db_session):
        """A superuser legitimately changing someone else's role_id must
        still work -- the self-escalation guard only applies to self-edits
        by non-superusers."""
        response = client.put(
            f"/api/v1/profile/{other_user.id}",
            json={"role_id": admin_role.id},
            headers=superuser_headers,
        )
        assert response.status_code == 200
        assert response.json()["role_id"] == admin_role.id

    def test_update_profile_404_for_nonexistent_user(self, client, superuser_headers):
        response = client.put(
            "/api/v1/profile/99999999", json={"first_name": "X"}, headers=superuser_headers
        )
        assert response.status_code == 404

    def test_self_edit_via_user_id_path_cannot_self_escalate(self, client, auth_headers, admin_user, teacher_role, db_session):
        """Same regression as PUT /me, but via the /{user_id} path when
        user_id == self."""
        response = client.put(
            f"/api/v1/profile/{admin_user.id}",
            json={"role_id": teacher_role.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["role_id"] != teacher_role.id

        db_session.refresh(admin_user)
        assert admin_user.role_id != teacher_role.id
