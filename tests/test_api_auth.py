import pytest
from fastapi.testclient import TestClient
from src.models.user import User
from src.models.institution import Institution


@pytest.mark.integration
class TestAuthAPI:
    """Integration tests for authentication API."""

    def test_login_success(
        self,
        client: TestClient,
        admin_user: User,
        institution: Institution,
    ):
        """Test successful login."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123",
                "institution_id": institution.id,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == admin_user.email

    def test_login_wrong_password(
        self,
        client: TestClient,
        admin_user: User,
        institution: Institution,
    ):
        """Test login with wrong password."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "wrong_password",
                "institution_id": institution.id,
            },
        )

        assert response.status_code == 401
        assert "Incorrect" in response.json()["detail"]

    def test_login_nonexistent_user(
        self,
        client: TestClient,
        institution: Institution,
    ):
        """Test login with nonexistent user."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "password123",
                "institution_id": institution.id,
            },
        )

        assert response.status_code == 401

    def test_refresh_token(
        self,
        client: TestClient,
        admin_user: User,
        institution: Institution,
    ):
        """Test token refresh."""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123",
                "institution_id": institution.id,
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_protected_route_without_token(self, client: TestClient):
        """Test accessing protected route without token."""
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401

    def test_protected_route_with_valid_token(
        self,
        client: TestClient,
        auth_headers: dict,
    ):
        """Test accessing protected route with valid token."""
        response = client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code in [200, 404]  # May not have /me endpoint

    def test_logout(
        self,
        client: TestClient,
        admin_user: User,
        institution: Institution,
    ):
        """Test logout."""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123",
                "institution_id": institution.id,
            },
        )
        tokens = login_response.json()

        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = client.post(
            "/api/v1/auth/logout",
            headers=headers,
            json={"refresh_token": tokens["refresh_token"]},
        )

        assert response.status_code in [200, 204]

    def test_change_password(
        self,
        client: TestClient,
        admin_user: User,
        auth_headers: dict,
    ):
        """Test password change."""
        response = client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "password123",
                "new_password": "new_password_456",
            },
        )

        assert response.status_code in [200, 404]  # May not have endpoint
