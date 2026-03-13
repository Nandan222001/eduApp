import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.services.auth_service import AuthService
from src.models.user import User
from src.models.password_reset_token import PasswordResetToken
from src.utils.security import verify_password, get_password_hash


@pytest.mark.unit
class TestAuthService:
    """Unit tests for AuthService"""

    @pytest.mark.asyncio
    async def test_authenticate_user_success(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful user authentication"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="password123"
        )
        
        assert user is not None
        assert user.id == admin_user.id
        assert user.email == admin_user.email

    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test authentication with wrong password"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="wrongpassword"
        )
        
        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_user_not_found(
        self, db_session: Session, mock_session_manager
    ):
        """Test authentication with non-existent user"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email="nonexistent@example.com",
            password="password123"
        )
        
        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_user_with_institution_filter(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test authentication with institution ID filter"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="password123",
            institution_id=admin_user.institution_id
        )
        
        assert user is not None
        assert user.institution_id == admin_user.institution_id

    @pytest.mark.asyncio
    async def test_login_success(
        self, db_session: Session, admin_user: User, mock_session_manager, institution
    ):
        """Test successful login"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        result = await auth_service.login(
            email=admin_user.email,
            password="password123"
        )
        
        assert "access_token" in result
        assert "refresh_token" in result
        assert result["token_type"] == "bearer"
        assert "user" in result
        assert result["user"]["email"] == admin_user.email
        
        mock_session_manager.create_session.assert_called_once()
        mock_session_manager.store_refresh_token.assert_called_once()

    @pytest.mark.asyncio
    async def test_login_inactive_user(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test login with inactive user"""
        admin_user.is_active = False
        db_session.commit()
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login(
                email=admin_user.email,
                password="password123"
            )
        
        assert exc_info.value.status_code == 403
        assert "inactive" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_login_inactive_institution(
        self, db_session: Session, admin_user: User, institution, mock_session_manager
    ):
        """Test login with inactive institution"""
        institution.is_active = False
        db_session.commit()
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login(
                email=admin_user.email,
                password="password123"
            )
        
        assert exc_info.value.status_code == 403
        assert "institution" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_login_wrong_credentials(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test login with wrong credentials"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login(
                email=admin_user.email,
                password="wrongpassword"
            )
        
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_access_token_success(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful token refresh"""
        from src.utils.security import create_refresh_token
        
        refresh_token = create_refresh_token({
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
        })
        
        mock_session_manager.verify_refresh_token.return_value = True
        
        auth_service = AuthService(db_session, mock_session_manager)
        result = await auth_service.refresh_access_token(refresh_token)
        
        assert "access_token" in result
        assert "refresh_token" in result
        assert result["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_refresh_access_token_invalid(
        self, db_session: Session, mock_session_manager
    ):
        """Test token refresh with invalid token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh_access_token("invalid_token")
        
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_access_token_revoked(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test token refresh with revoked token"""
        from src.utils.security import create_refresh_token
        
        refresh_token = create_refresh_token({
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
        })
        
        mock_session_manager.verify_refresh_token.return_value = False
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh_access_token(refresh_token)
        
        assert exc_info.value.status_code == 401
        assert "revoked" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_logout(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test logout"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.logout(
            user_id=admin_user.id,
            access_token="test_token",
            refresh_token="test_refresh"
        )
        
        mock_session_manager.delete_session.assert_called_once_with(
            admin_user.id, "test_token"
        )
        mock_session_manager.revoke_refresh_token.assert_called_once_with(
            admin_user.id, "test_refresh"
        )

    @pytest.mark.asyncio
    async def test_logout_without_refresh_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test logout without refresh token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.logout(
            user_id=admin_user.id,
            access_token="test_token"
        )
        
        mock_session_manager.delete_session.assert_called_once()
        mock_session_manager.revoke_refresh_token.assert_not_called()

    @pytest.mark.asyncio
    async def test_logout_all_sessions(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test logout from all sessions"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.logout_all_sessions(admin_user.id)
        
        mock_session_manager.delete_all_user_sessions.assert_called_once_with(
            admin_user.id
        )
        mock_session_manager.revoke_all_refresh_tokens.assert_called_once_with(
            admin_user.id
        )

    @pytest.mark.asyncio
    async def test_create_password_reset_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test creating password reset token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        
        assert token is not None
        assert len(token) > 0
        
        reset_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).first()
        
        assert reset_token is not None
        assert reset_token.token == token

    @pytest.mark.asyncio
    async def test_create_password_reset_token_nonexistent_user(
        self, db_session: Session, mock_session_manager
    ):
        """Test creating reset token for nonexistent user"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token("nonexistent@example.com")
        
        assert token is None

    @pytest.mark.asyncio
    async def test_create_password_reset_token_invalidates_old_tokens(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that creating new token invalidates old ones"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token1 = await auth_service.create_password_reset_token(admin_user.email)
        token2 = await auth_service.create_password_reset_token(admin_user.email)
        
        old_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.token == token1
        ).first()
        
        assert old_token.is_used is True

    @pytest.mark.asyncio
    async def test_reset_password_success(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful password reset"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        new_password = "newpassword123"
        
        result = await auth_service.reset_password(token, new_password)
        
        assert result is True
        
        db_session.refresh(admin_user)
        assert verify_password(new_password, admin_user.hashed_password)
        
        mock_session_manager.delete_all_user_sessions.assert_called_once()
        mock_session_manager.revoke_all_refresh_tokens.assert_called_once()

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(
        self, db_session: Session, mock_session_manager
    ):
        """Test password reset with invalid token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.reset_password("invalid_token", "newpassword")
        
        assert exc_info.value.status_code == 400
        assert "invalid" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_reset_password_expired_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test password reset with expired token"""
        reset_token = PasswordResetToken(
            user_id=admin_user.id,
            token="expired_token",
            expires_at=datetime.utcnow() - timedelta(minutes=10),
            is_used=False
        )
        db_session.add(reset_token)
        db_session.commit()
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.reset_password("expired_token", "newpassword")
        
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_change_password_success(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful password change"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        new_password = "newpassword123"
        result = await auth_service.change_password(
            user_id=admin_user.id,
            current_password="password123",
            new_password=new_password
        )
        
        assert result is True
        
        db_session.refresh(admin_user)
        assert verify_password(new_password, admin_user.hashed_password)

    @pytest.mark.asyncio
    async def test_change_password_wrong_current_password(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test password change with wrong current password"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.change_password(
                user_id=admin_user.id,
                current_password="wrongpassword",
                new_password="newpassword123"
            )
        
        assert exc_info.value.status_code == 400
        assert "incorrect" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_change_password_user_not_found(
        self, db_session: Session, mock_session_manager
    ):
        """Test password change for nonexistent user"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.change_password(
                user_id=99999,
                current_password="password123",
                new_password="newpassword123"
            )
        
        assert exc_info.value.status_code == 404
