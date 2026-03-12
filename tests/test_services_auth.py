import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.services.auth_service import AuthService
from src.models.user import User
from src.models.institution import Institution
from src.utils.security import get_password_hash, decode_token


@pytest.mark.unit
class TestAuthService:
    """Test authentication service."""

    @pytest.fixture
    def auth_service(self, db_session: Session, mock_redis):
        """Create auth service instance."""
        session_manager = AsyncMock()
        session_manager.create_session = AsyncMock()
        session_manager.store_refresh_token = AsyncMock()
        session_manager.delete_session = AsyncMock()
        session_manager.revoke_refresh_token = AsyncMock()
        session_manager.verify_refresh_token = AsyncMock(return_value=True)
        return AuthService(db_session, session_manager)

    async def test_authenticate_user_success(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test successful user authentication."""
        user = await auth_service.authenticate_user(
            admin_user.email, "password123", admin_user.institution_id
        )

        assert user is not None
        assert user.id == admin_user.id
        assert user.email == admin_user.email

    async def test_authenticate_user_wrong_password(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test authentication with wrong password."""
        user = await auth_service.authenticate_user(
            admin_user.email, "wrong_password", admin_user.institution_id
        )

        assert user is None

    async def test_authenticate_user_nonexistent(
        self, auth_service: AuthService, institution: Institution
    ):
        """Test authentication with nonexistent user."""
        user = await auth_service.authenticate_user(
            "nonexistent@test.com", "password123", institution.id
        )

        assert user is None

    async def test_login_success(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test successful login."""
        result = await auth_service.login(
            admin_user.email, "password123", admin_user.institution_id
        )

        assert "access_token" in result
        assert "refresh_token" in result
        assert "token_type" in result
        assert result["token_type"] == "bearer"
        assert "user" in result
        assert result["user"]["id"] == admin_user.id
        assert result["user"]["email"] == admin_user.email

    async def test_login_wrong_password(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test login with wrong password."""
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login(
                admin_user.email, "wrong_password", admin_user.institution_id
            )

        assert exc_info.value.status_code == 401
        assert "Incorrect email or password" in str(exc_info.value.detail)

    async def test_login_inactive_user(
        self, auth_service: AuthService, db_session: Session, admin_user: User
    ):
        """Test login with inactive user."""
        admin_user.is_active = False
        db_session.commit()

        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login(
                admin_user.email, "password123", admin_user.institution_id
            )

        assert exc_info.value.status_code == 403
        assert "inactive" in str(exc_info.value.detail).lower()

    async def test_refresh_access_token_success(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test successful token refresh."""
        login_result = await auth_service.login(
            admin_user.email, "password123", admin_user.institution_id
        )
        refresh_token = login_result["refresh_token"]

        result = await auth_service.refresh_access_token(refresh_token)

        assert "access_token" in result
        assert "refresh_token" in result
        assert "token_type" in result

    async def test_change_password_success(
        self, auth_service: AuthService, db_session: Session, admin_user: User
    ):
        """Test successful password change."""
        new_password = "new_password_123"
        
        result = await auth_service.change_password(
            admin_user.id, "password123", new_password
        )

        assert result is True
        
        db_session.refresh(admin_user)
        from src.utils.security import verify_password
        assert verify_password(new_password, admin_user.hashed_password)

    async def test_change_password_wrong_current(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test password change with wrong current password."""
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.change_password(
                admin_user.id, "wrong_password", "new_password_123"
            )

        assert exc_info.value.status_code == 400
        assert "incorrect" in str(exc_info.value.detail).lower()

    async def test_logout(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test logout."""
        login_result = await auth_service.login(
            admin_user.email, "password123", admin_user.institution_id
        )
        access_token = login_result["access_token"]
        refresh_token = login_result["refresh_token"]

        await auth_service.logout(admin_user.id, access_token, refresh_token)

        auth_service.session_manager.delete_session.assert_called_once()
        auth_service.session_manager.revoke_refresh_token.assert_called_once()

    async def test_create_password_reset_token(
        self, auth_service: AuthService, admin_user: User
    ):
        """Test password reset token creation."""
        token = await auth_service.create_password_reset_token(admin_user.email)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    async def test_create_password_reset_token_nonexistent_user(
        self, auth_service: AuthService
    ):
        """Test password reset token for nonexistent user."""
        token = await auth_service.create_password_reset_token("nonexistent@test.com")

        assert token is None
