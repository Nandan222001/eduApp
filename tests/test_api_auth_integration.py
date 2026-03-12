import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.institution import Institution


@pytest.mark.integration
class TestAuthAPIIntegration:
    """Integration tests for Auth API endpoints"""

    def test_login_success(
        self, client: TestClient, admin_user: User, institution: Institution
    ):
        """Test successful login via API"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123",
                "institution_id": institution.id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(
        self, client: TestClient, admin_user: User
    ):
        """Test login with wrong password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401

    def test_login_nonexistent_user(
        self, client: TestClient
    ):
        """Test login with nonexistent user"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 401

    def test_login_inactive_user(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test login with inactive user"""
        admin_user.is_active = False
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        assert response.status_code == 403

    def test_refresh_token_success(
        self, client: TestClient, admin_user: User
    ):
        """Test token refresh"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        refresh_token = login_response.json()["refresh_token"]
        
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_token_invalid(
        self, client: TestClient
    ):
        """Test refresh with invalid token"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )
        
        assert response.status_code == 401

    def test_logout_success(
        self, client: TestClient, admin_user: User, auth_headers: dict
    ):
        """Test logout"""
        response = client.post(
            "/api/v1/auth/logout",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_logout_without_auth(
        self, client: TestClient
    ):
        """Test logout without authentication"""
        response = client.post("/api/v1/auth/logout")
        
        assert response.status_code in [401, 403]

    def test_forgot_password_success(
        self, client: TestClient, admin_user: User
    ):
        """Test forgot password request"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": admin_user.email}
        )
        
        assert response.status_code == 200

    def test_forgot_password_nonexistent_user(
        self, client: TestClient
    ):
        """Test forgot password for nonexistent user"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        
        assert response.status_code == 200

    def test_full_auth_flow(
        self, client: TestClient, admin_user: User
    ):
        """Test complete authentication flow"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        assert login_response.status_code == 200
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        profile_response = client.get(
            "/api/v1/profile/me",
            headers=headers
        )
        assert profile_response.status_code in [200, 404]
        
        refresh_response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert refresh_response.status_code == 200
        
        logout_response = client.post(
            "/api/v1/auth/logout",
            headers=headers
        )
        assert logout_response.status_code == 200
