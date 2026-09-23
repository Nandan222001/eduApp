import pytest
from src.models.user import User
from src.models.institution import Institution
from src.models.role import Role
from src.utils.security import get_password_hash


@pytest.fixture
def superuser_auth_headers(client, db_session, institution: Institution, admin_role: Role) -> dict:
    """POST /users/ and GET /users/{id} require the users:create/users:read
    permissions; a superuser bypasses permission checks entirely (see
    PermissionChecker in src/dependencies/rbac.py), so use one here rather
    than wiring up real Permission rows for a 3-test file."""
    user = User(
        username="superuser",
        email="superuser@testschool.com",
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

    response = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_user(client, superuser_auth_headers, institution: Institution, admin_role: Role):
    response = client.post(
        "/api/v1/users/",
        headers=superuser_auth_headers,
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpassword123",
            "institution_id": institution.id,
            "role_id": admin_role.id,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data


def test_get_user(client, superuser_auth_headers, institution: Institution, admin_role: Role):
    create_response = client.post(
        "/api/v1/users/",
        headers=superuser_auth_headers,
        json={
            "email": "test2@example.com",
            "username": "testuser2",
            "password": "testpassword123",
            "institution_id": institution.id,
            "role_id": admin_role.id,
        },
    )
    user_id = create_response.json()["id"]

    response = client.get(f"/api/v1/users/{user_id}", headers=superuser_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "test2@example.com"


def test_get_nonexistent_user(client, superuser_auth_headers):
    response = client.get("/api/v1/users/9999", headers=superuser_auth_headers)
    assert response.status_code == 404
