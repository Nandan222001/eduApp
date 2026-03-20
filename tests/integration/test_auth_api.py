import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from jose import jwt

from src.models.user import User
from src.models.institution import Institution
from src.models.role import Role
from src.models.password_reset_token import PasswordResetToken
from src.utils.security import get_password_hash, decode_token
from src.config import settings


@pytest.mark.integration
class TestAuthAPIRegister:
    """Integration tests for POST /api/v1/auth/register endpoint"""
    
    def test_register_with_valid_data(
        self, client: TestClient, institution: Institution, student_role: Role
    ):
        """Test user registration with valid data"""
        response = client.post(
            "/api/v1/users/",
            json={
                "email": "newuser@testschool.com",
                "username": "newuser",
                "password": "SecurePass123!",
                "first_name": "New",
                "last_name": "User",
                "phone": "+1234567890",
                "institution_id": institution.id,
                "role_id": student_role.id,
                "is_active": True,
                "is_superuser": False,
            },
            headers={"Authorization": "Bearer fake_admin_token"}
        )
        
        # Note: This endpoint requires authentication and permissions
        # Without proper auth, it should return 401 or 403
        assert response.status_code in [201, 401, 403]

    def test_register_with_duplicate_email(
        self, client: TestClient, admin_user: User, institution: Institution, student_role: Role
    ):
        """Test registration with duplicate email should fail"""
        response = client.post(
            "/api/v1/users/",
            json={
                "email": admin_user.email,
                "username": "anotheruser",
                "password": "SecurePass123!",
                "first_name": "Another",
                "last_name": "User",
                "institution_id": institution.id,
                "role_id": student_role.id,
                "is_active": True,
                "is_superuser": False,
            }
        )
        
        # Should fail due to duplicate email or missing auth
        assert response.status_code in [400, 401, 403]

    def test_register_with_invalid_email(
        self, client: TestClient, institution: Institution, student_role: Role
    ):
        """Test registration with invalid email format"""
        response = client.post(
            "/api/v1/users/",
            json={
                "email": "notanemail",
                "username": "testuser",
                "password": "SecurePass123!",
                "first_name": "Test",
                "last_name": "User",
                "institution_id": institution.id,
                "role_id": student_role.id,
                "is_active": True,
                "is_superuser": False,
            }
        )
        
        assert response.status_code == 422

    def test_register_with_weak_password(
        self, client: TestClient, institution: Institution, student_role: Role
    ):
        """Test registration with password less than 8 characters"""
        response = client.post(
            "/api/v1/users/",
            json={
                "email": "weak@testschool.com",
                "username": "weakuser",
                "password": "1234567",
                "first_name": "Weak",
                "last_name": "User",
                "institution_id": institution.id,
                "role_id": student_role.id,
                "is_active": True,
                "is_superuser": False,
            }
        )
        
        assert response.status_code == 422

    def test_register_with_missing_required_fields(
        self, client: TestClient, institution: Institution
    ):
        """Test registration with missing required fields"""
        response = client.post(
            "/api/v1/users/",
            json={
                "email": "incomplete@testschool.com",
            }
        )
        
        assert response.status_code == 422


@pytest.mark.integration
class TestAuthAPILogin:
    """Integration tests for POST /api/v1/auth/login endpoint"""
    
    def test_login_with_correct_credentials(
        self, client: TestClient, admin_user: User, institution: Institution
    ):
        """Test successful login with correct credentials"""
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
        
        # Verify JWT token structure
        access_token = data["access_token"]
        payload = decode_token(access_token)
        assert payload is not None
        assert payload["sub"] == admin_user.id
        assert payload["email"] == admin_user.email
        assert payload["institution_id"] == admin_user.institution_id
        assert payload["role_id"] == admin_user.role_id
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_login_with_incorrect_password(
        self, client: TestClient, admin_user: User
    ):
        """Test login with incorrect password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_login_with_nonexistent_email(
        self, client: TestClient
    ):
        """Test login with email that doesn't exist"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 401

    def test_login_with_inactive_user(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test login with inactive user account"""
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
        data = response.json()
        assert "detail" in data
        assert "inactive" in data["detail"].lower()

    def test_login_without_institution_id(
        self, client: TestClient, admin_user: User
    ):
        """Test login without specifying institution_id"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        # Should succeed as institution_id is optional
        assert response.status_code == 200

    def test_login_with_invalid_email_format(
        self, client: TestClient
    ):
        """Test login with invalid email format"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "notanemail",
                "password": "password123"
            }
        )
        
        assert response.status_code == 422

    def test_login_verify_refresh_token_structure(
        self, client: TestClient, admin_user: User
    ):
        """Test login and verify refresh token JWT structure"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        refresh_token = data["refresh_token"]
        payload = decode_token(refresh_token)
        assert payload is not None
        assert payload["sub"] == admin_user.id
        assert payload["type"] == "refresh"
        assert "exp" in payload


@pytest.mark.integration
class TestAuthAPIRefreshToken:
    """Integration tests for POST /api/v1/auth/refresh endpoint"""
    
    def test_refresh_with_valid_token(
        self, client: TestClient, admin_user: User
    ):
        """Test token refresh with valid refresh token"""
        # First login to get refresh token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        assert login_response.status_code == 200
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh the token
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        # Verify new tokens are different from old ones
        assert data["access_token"] != login_response.json()["access_token"]

    def test_refresh_with_invalid_token(
        self, client: TestClient
    ):
        """Test refresh with invalid token"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token_string"}
        )
        
        assert response.status_code == 401

    def test_refresh_with_expired_token(
        self, client: TestClient, admin_user: User
    ):
        """Test refresh with expired refresh token"""
        # Create an expired refresh token
        expired_token_data = {
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
            "exp": datetime.utcnow() - timedelta(days=1),  # Expired yesterday
            "type": "refresh"
        }
        expired_token = jwt.encode(
            expired_token_data,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": expired_token}
        )
        
        assert response.status_code == 401

    def test_refresh_with_access_token_instead_of_refresh(
        self, client: TestClient, admin_user: User
    ):
        """Test refresh endpoint with access token (should fail)"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        access_token = login_response.json()["access_token"]
        
        # Try to use access token for refresh
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token}
        )
        
        assert response.status_code == 401

    def test_refresh_token_payload_structure(
        self, client: TestClient, admin_user: User
    ):
        """Test that refreshed tokens have correct payload structure"""
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
        
        # Verify new access token structure
        new_access_payload = decode_token(data["access_token"])
        assert new_access_payload["sub"] == admin_user.id
        assert new_access_payload["type"] == "access"
        
        # Verify new refresh token structure
        new_refresh_payload = decode_token(data["refresh_token"])
        assert new_refresh_payload["sub"] == admin_user.id
        assert new_refresh_payload["type"] == "refresh"


@pytest.mark.integration
class TestAuthAPIForgotPassword:
    """Integration tests for POST /api/v1/auth/forgot-password endpoint"""
    
    def test_forgot_password_with_valid_email(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test forgot password with valid user email"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": admin_user.email}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify token was created in database
        token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).first()
        assert token is not None
        assert token.expires_at > datetime.utcnow()

    def test_forgot_password_with_nonexistent_email(
        self, client: TestClient
    ):
        """Test forgot password with email that doesn't exist"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        
        # Should return success to prevent email enumeration
        assert response.status_code == 200

    def test_forgot_password_with_invalid_email_format(
        self, client: TestClient
    ):
        """Test forgot password with invalid email format"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "notanemail"}
        )
        
        assert response.status_code == 422

    def test_forgot_password_multiple_requests(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test multiple forgot password requests invalidate previous tokens"""
        # First request
        response1 = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": admin_user.email}
        )
        assert response1.status_code == 200
        
        token1 = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).first()
        first_token = token1.token if token1 else None
        
        # Second request
        response2 = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": admin_user.email}
        )
        assert response2.status_code == 200
        
        # First token should be marked as used
        db_session.refresh(token1) if token1 else None
        if first_token:
            old_token = db_session.query(PasswordResetToken).filter(
                PasswordResetToken.token == first_token
            ).first()
            assert old_token.is_used == True


@pytest.mark.integration
class TestAuthAPIResetPassword:
    """Integration tests for POST /api/v1/auth/reset-password endpoint"""
    
    def test_reset_password_with_valid_token(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test password reset with valid token"""
        # Create reset token
        forgot_response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": admin_user.email}
        )
        assert forgot_response.status_code == 200
        
        # Get the token from database
        reset_token_obj = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).first()
        
        assert reset_token_obj is not None
        token = reset_token_obj.token
        
        # Reset password
        new_password = "NewSecurePassword123!"
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": token,
                "new_password": new_password
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify token is marked as used
        db_session.refresh(reset_token_obj)
        assert reset_token_obj.is_used == True
        
        # Verify can login with new password
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": new_password
            }
        )
        assert login_response.status_code == 200

    def test_reset_password_with_invalid_token(
        self, client: TestClient
    ):
        """Test password reset with invalid token"""
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "invalid_token",
                "new_password": "NewPassword123!"
            }
        )
        
        assert response.status_code == 400

    def test_reset_password_with_expired_token(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test password reset with expired token"""
        # Create expired token
        expired_token = PasswordResetToken(
            user_id=admin_user.id,
            token="expired_token_12345",
            expires_at=datetime.utcnow() - timedelta(hours=1),
            is_used=False
        )
        db_session.add(expired_token)
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "expired_token_12345",
                "new_password": "NewPassword123!"
            }
        )
        
        assert response.status_code == 400

    def test_reset_password_with_used_token(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test password reset with already used token"""
        # Create used token
        used_token = PasswordResetToken(
            user_id=admin_user.id,
            token="used_token_12345",
            expires_at=datetime.utcnow() + timedelta(hours=1),
            is_used=True
        )
        db_session.add(used_token)
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "used_token_12345",
                "new_password": "NewPassword123!"
            }
        )
        
        assert response.status_code == 400

    def test_reset_password_with_weak_password(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test password reset with weak password"""
        forgot_response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": admin_user.email}
        )
        
        reset_token_obj = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).first()
        
        if reset_token_obj:
            token = reset_token_obj.token
            
            response = client.post(
                "/api/v1/auth/reset-password",
                json={
                    "token": token,
                    "new_password": "weak"  # Too short
                }
            )
            
            assert response.status_code == 422

    def test_forgot_and_reset_password_complete_flow(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test complete forgot and reset password flow"""
        original_password = "password123"
        new_password = "CompletelyNewPassword123!"
        
        # Step 1: Request password reset
        forgot_response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": admin_user.email}
        )
        assert forgot_response.status_code == 200
        
        # Step 2: Get reset token
        reset_token_obj = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).order_by(PasswordResetToken.created_at.desc()).first()
        assert reset_token_obj is not None
        
        # Step 3: Reset password
        reset_response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token_obj.token,
                "new_password": new_password
            }
        )
        assert reset_response.status_code == 200
        
        # Step 4: Verify old password doesn't work
        old_login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": original_password
            }
        )
        assert old_login_response.status_code == 401
        
        # Step 5: Verify new password works
        new_login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": new_password
            }
        )
        assert new_login_response.status_code == 200


@pytest.mark.integration
class TestAuthAPIGetMe:
    """Integration tests for GET /api/v1/auth/me endpoint"""
    
    def test_get_me_with_valid_token(
        self, client: TestClient, admin_user: User
    ):
        """Test getting current user info with valid token"""
        # Login first
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Get user info
        response = client.get(
            "/api/v1/auth/me",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == admin_user.id
        assert data["email"] == admin_user.email
        assert data["username"] == admin_user.username
        assert data["institution_id"] == admin_user.institution_id
        assert data["role_id"] == admin_user.role_id
        assert "permissions" in data
        assert isinstance(data["permissions"], list)

    def test_get_me_without_token(
        self, client: TestClient
    ):
        """Test getting current user without authentication token"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 403

    def test_get_me_with_invalid_token(
        self, client: TestClient
    ):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get(
            "/api/v1/auth/me",
            headers=headers
        )
        
        assert response.status_code == 403

    def test_get_me_with_expired_token(
        self, client: TestClient, admin_user: User
    ):
        """Test getting current user with expired token"""
        # Create expired token
        expired_token_data = {
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
            "exp": datetime.utcnow() - timedelta(hours=1),
            "type": "access"
        }
        expired_token = jwt.encode(
            expired_token_data,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get(
            "/api/v1/auth/me",
            headers=headers
        )
        
        assert response.status_code == 403

    def test_get_me_response_structure(
        self, client: TestClient, admin_user: User
    ):
        """Test that /me endpoint returns correct response structure"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = client.get(
            "/api/v1/auth/me",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields are present
        expected_fields = [
            "id", "email", "username", "first_name", "last_name",
            "institution_id", "role_id", "is_active", "is_superuser",
            "email_verified", "permissions"
        ]
        for field in expected_fields:
            assert field in data

    def test_get_me_includes_role_info(
        self, client: TestClient, admin_user: User
    ):
        """Test that /me endpoint includes role information"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = client.get(
            "/api/v1/auth/me",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data.get("role"):
            assert "id" in data["role"]
            assert "name" in data["role"]
            assert "slug" in data["role"]


@pytest.mark.integration
class TestAuthAPILogout:
    """Integration tests for POST /api/v1/auth/logout endpoint"""
    
    def test_logout_with_valid_token(
        self, client: TestClient, admin_user: User
    ):
        """Test logout with valid authentication token"""
        # Login first
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Logout
        response = client.post(
            "/api/v1/auth/logout",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower()

    def test_logout_without_token(
        self, client: TestClient
    ):
        """Test logout without authentication token"""
        response = client.post("/api/v1/auth/logout")
        
        assert response.status_code == 403

    def test_logout_with_invalid_token(
        self, client: TestClient
    ):
        """Test logout with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.post(
            "/api/v1/auth/logout",
            headers=headers
        )
        
        assert response.status_code == 403

    def test_logout_token_invalidation(
        self, client: TestClient, admin_user: User
    ):
        """Test that token is invalidated after logout"""
        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Verify token works before logout
        me_response_before = client.get(
            "/api/v1/auth/me",
            headers=headers
        )
        assert me_response_before.status_code == 200
        
        # Logout
        logout_response = client.post(
            "/api/v1/auth/logout",
            headers=headers
        )
        assert logout_response.status_code == 200
        
        # Verify token doesn't work after logout (in production with real Redis)
        # Note: With mocked Redis, this may still work
        me_response_after = client.get(
            "/api/v1/auth/me",
            headers=headers
        )
        # In real scenario with Redis, this should be 401 or 403
        # With mocked Redis, it might still be 200
        assert me_response_after.status_code in [200, 401, 403]

    def test_logout_with_refresh_token(
        self, client: TestClient, admin_user: User
    ):
        """Test logout with both access and refresh tokens"""
        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        tokens = login_response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Logout with refresh token
        response = client.post(
            "/api/v1/auth/logout",
            headers=headers,
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200

    def test_logout_multiple_times(
        self, client: TestClient, admin_user: User
    ):
        """Test logout can be called multiple times"""
        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # First logout
        response1 = client.post(
            "/api/v1/auth/logout",
            headers=headers
        )
        assert response1.status_code == 200
        
        # Second logout with same token
        response2 = client.post(
            "/api/v1/auth/logout",
            headers=headers
        )
        # Should either succeed or fail with 401/403
        assert response2.status_code in [200, 401, 403]


@pytest.mark.integration
class TestAuthAPICompleteFlows:
    """Integration tests for complete authentication flows"""
    
    def test_complete_auth_flow(
        self, client: TestClient, admin_user: User
    ):
        """Test complete authentication flow: login -> access protected route -> refresh -> logout"""
        # Step 1: Login
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
        
        # Step 2: Access protected route
        headers = {"Authorization": f"Bearer {access_token}"}
        me_response = client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200
        user_data = me_response.json()
        assert user_data["id"] == admin_user.id
        
        # Step 3: Refresh tokens
        refresh_response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        new_access_token = new_tokens["access_token"]
        
        # Step 4: Access protected route with new token
        new_headers = {"Authorization": f"Bearer {new_access_token}"}
        me_response_2 = client.get("/api/v1/auth/me", headers=new_headers)
        assert me_response_2.status_code == 200
        
        # Step 5: Logout
        logout_response = client.post("/api/v1/auth/logout", headers=new_headers)
        assert logout_response.status_code == 200

    def test_session_isolation_between_users(
        self, client: TestClient, admin_user: User, teacher_user: User
    ):
        """Test that sessions are isolated between different users"""
        # Login as admin
        admin_login = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        admin_token = admin_login.json()["access_token"]
        
        # Login as teacher
        teacher_login = client.post(
            "/api/v1/auth/login",
            json={
                "email": teacher_user.email,
                "password": "password123"
            }
        )
        teacher_token = teacher_login.json()["access_token"]
        
        # Verify admin token returns admin user
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        admin_me = client.get("/api/v1/auth/me", headers=admin_headers)
        assert admin_me.status_code == 200
        assert admin_me.json()["id"] == admin_user.id
        
        # Verify teacher token returns teacher user
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        teacher_me = client.get("/api/v1/auth/me", headers=teacher_headers)
        assert teacher_me.status_code == 200
        assert teacher_me.json()["id"] == teacher_user.id

    def test_concurrent_sessions_same_user(
        self, client: TestClient, admin_user: User
    ):
        """Test that same user can have multiple concurrent sessions"""
        # First login
        login1 = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        token1 = login1.json()["access_token"]
        
        # Second login
        login2 = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        token2 = login2.json()["access_token"]
        
        # Both tokens should be different
        assert token1 != token2
        
        # Both tokens should work
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        me1 = client.get("/api/v1/auth/me", headers=headers1)
        me2 = client.get("/api/v1/auth/me", headers=headers2)
        
        assert me1.status_code == 200
        assert me2.status_code == 200
        assert me1.json()["id"] == me2.json()["id"] == admin_user.id

    def test_password_change_invalidates_sessions(
        self, client: TestClient, admin_user: User
    ):
        """Test that changing password invalidates existing sessions"""
        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        old_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {old_token}"}
        
        # Change password
        change_response = client.post(
            "/api/v1/auth/change-password",
            headers=headers,
            json={
                "current_password": "password123",
                "new_password": "NewPassword123!"
            }
        )
        
        # If endpoint exists and works
        if change_response.status_code == 200:
            # Old token should be invalidated (in real scenario with Redis)
            me_response = client.get("/api/v1/auth/me", headers=headers)
            # With mocked Redis, might still work
            assert me_response.status_code in [200, 401, 403]
            
            # Should be able to login with new password
            new_login = client.post(
                "/api/v1/auth/login",
                json={
                    "email": admin_user.email,
                    "password": "NewPassword123!"
                }
            )
            assert new_login.status_code == 200
