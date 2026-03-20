import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock, call
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.services.auth_service import AuthService
from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.password_reset_token import PasswordResetToken
from src.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    create_refresh_token,
    decode_token
)
from src.utils.session import SessionManager


@pytest.mark.unit
class TestRegisterUser:
    """Test register_user functionality (simulated)"""
    
    @pytest.mark.asyncio
    async def test_register_user_with_valid_data(
        self, db_session: Session, institution: Institution, student_role: Role, mock_session_manager
    ):
        """Test user registration with valid data"""
        user_data = {
            "username": "newuser",
            "email": "newuser@testschool.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User",
            "institution_id": institution.id,
            "role_id": student_role.id,
        }
        
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            institution_id=user_data["institution_id"],
            role_id=user_data["role_id"],
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.username == user_data["username"]
        assert user.email == user_data["email"]
        assert verify_password(user_data["password"], user.hashed_password)
        assert user.is_active is True
        assert user.is_superuser is False

    @pytest.mark.asyncio
    async def test_register_user_duplicate_email(
        self, db_session: Session, admin_user: User, institution: Institution, student_role: Role
    ):
        """Test registration fails with duplicate email"""
        from sqlalchemy.exc import IntegrityError
        
        user_data = {
            "username": "differentuser",
            "email": admin_user.email,  # Duplicate email
            "password": "SecurePass123!",
            "first_name": "Different",
            "last_name": "User",
            "institution_id": institution.id,
            "role_id": student_role.id,
        }
        
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            institution_id=user_data["institution_id"],
            role_id=user_data["role_id"],
            is_active=True,
        )
        
        db_session.add(user)
        
        with pytest.raises(IntegrityError):
            db_session.commit()

    @pytest.mark.asyncio
    async def test_register_user_duplicate_username(
        self, db_session: Session, admin_user: User, institution: Institution, student_role: Role
    ):
        """Test registration fails with duplicate username"""
        from sqlalchemy.exc import IntegrityError
        
        user_data = {
            "username": admin_user.username,  # Duplicate username
            "email": "different@testschool.com",
            "password": "SecurePass123!",
            "first_name": "Different",
            "last_name": "User",
            "institution_id": institution.id,
            "role_id": student_role.id,
        }
        
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            institution_id=user_data["institution_id"],
            role_id=user_data["role_id"],
            is_active=True,
        )
        
        db_session.add(user)
        
        with pytest.raises(IntegrityError):
            db_session.commit()

    @pytest.mark.asyncio
    async def test_password_hashing_verification(
        self, db_session: Session, institution: Institution, student_role: Role
    ):
        """Test that passwords are properly hashed and can be verified"""
        plain_password = "MySecurePassword123!"
        
        user = User(
            username="testuser",
            email="testuser@testschool.com",
            hashed_password=get_password_hash(plain_password),
            first_name="Test",
            last_name="User",
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Verify password matches
        assert verify_password(plain_password, user.hashed_password)
        
        # Verify wrong password doesn't match
        assert not verify_password("WrongPassword", user.hashed_password)
        
        # Verify hash is different from plain password
        assert user.hashed_password != plain_password
        
        # Verify hash is not empty
        assert len(user.hashed_password) > 0


@pytest.mark.unit
class TestAuthenticateUser:
    """Test authenticate_user functionality"""
    
    @pytest.mark.asyncio
    async def test_authenticate_user_with_correct_credentials(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful authentication with correct credentials"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="password123"
        )
        
        assert user is not None
        assert user.id == admin_user.id
        assert user.email == admin_user.email

    @pytest.mark.asyncio
    async def test_authenticate_user_with_incorrect_password(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test authentication fails with incorrect password"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="wrongpassword"
        )
        
        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_user_with_nonexistent_email(
        self, db_session: Session, mock_session_manager
    ):
        """Test authentication fails with non-existent email"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email="nonexistent@example.com",
            password="password123"
        )
        
        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_inactive_user(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that inactive users can still authenticate (login will handle the check)"""
        admin_user.is_active = False
        db_session.commit()
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        # authenticate_user doesn't check is_active, login does
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="password123"
        )
        
        assert user is not None
        assert user.is_active is False

    @pytest.mark.asyncio
    async def test_authenticate_user_with_institution_filter(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test authentication with correct institution ID"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="password123",
            institution_id=admin_user.institution_id
        )
        
        assert user is not None
        assert user.institution_id == admin_user.institution_id

    @pytest.mark.asyncio
    async def test_authenticate_user_with_wrong_institution(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test authentication fails with wrong institution ID"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password="password123",
            institution_id=99999  # Non-existent institution
        )
        
        assert user is None


@pytest.mark.unit
class TestLogin:
    """Test login functionality"""
    
    @pytest.mark.asyncio
    async def test_login_success(
        self, db_session: Session, admin_user: User, mock_session_manager, institution
    ):
        """Test successful login returns tokens and user data"""
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
        assert result["user"]["id"] == admin_user.id
        
        mock_session_manager.create_session.assert_called_once()
        mock_session_manager.store_refresh_token.assert_called_once()

    @pytest.mark.asyncio
    async def test_login_updates_last_login_timestamp(
        self, db_session: Session, admin_user: User, mock_session_manager, institution
    ):
        """Test that login updates the last_login timestamp"""
        original_last_login = admin_user.last_login
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.login(
            email=admin_user.email,
            password="password123"
        )
        
        db_session.refresh(admin_user)
        assert admin_user.last_login is not None
        assert admin_user.last_login != original_last_login

    @pytest.mark.asyncio
    async def test_login_with_inactive_user(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test login fails with inactive user"""
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
    async def test_login_with_inactive_institution(
        self, db_session: Session, admin_user: User, institution, mock_session_manager
    ):
        """Test login fails when institution is inactive"""
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
    async def test_login_with_incorrect_credentials(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test login fails with incorrect password"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login(
                email=admin_user.email,
                password="wrongpassword"
            )
        
        assert exc_info.value.status_code == 401
        assert "incorrect" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_login_with_nonexistent_user(
        self, db_session: Session, mock_session_manager
    ):
        """Test login fails with non-existent user"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.login(
                email="nonexistent@example.com",
                password="password123"
            )
        
        assert exc_info.value.status_code == 401


@pytest.mark.unit
class TestTokenOperations:
    """Test token creation and verification"""
    
    def test_create_access_token_with_valid_data(self, admin_user: User):
        """Test creating access token with valid data"""
        token_data = {
            "sub": admin_user.id,
            "email": admin_user.email,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
        }
        
        token = create_access_token(token_data)
        
        assert token is not None
        assert len(token) > 0
        
        # Decode and verify
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == admin_user.id
        assert payload["email"] == admin_user.email
        assert payload["type"] == "access"

    def test_create_access_token_with_custom_expiry(self, admin_user: User):
        """Test creating access token with custom expiration"""
        token_data = {
            "sub": admin_user.id,
            "email": admin_user.email,
        }
        
        expires_delta = timedelta(minutes=5)
        token = create_access_token(token_data, expires_delta)
        
        assert token is not None
        
        payload = decode_token(token)
        assert payload is not None
        
        # Verify expiration is set
        assert "exp" in payload
        exp_time = datetime.fromtimestamp(payload["exp"])
        now = datetime.utcnow()
        time_diff = (exp_time - now).total_seconds()
        
        # Should be approximately 5 minutes (300 seconds), with some tolerance
        assert 290 < time_diff < 310

    def test_create_refresh_token(self, admin_user: User):
        """Test creating refresh token"""
        token_data = {
            "sub": admin_user.id,
            "email": admin_user.email,
        }
        
        token = create_refresh_token(token_data)
        
        assert token is not None
        
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == admin_user.id
        assert payload["type"] == "refresh"

    def test_verify_valid_token(self, admin_user: User):
        """Test verifying a valid token"""
        token_data = {
            "sub": admin_user.id,
            "email": admin_user.email,
        }
        
        token = create_access_token(token_data)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["sub"] == admin_user.id
        assert payload["email"] == admin_user.email

    def test_verify_expired_token(self, admin_user: User):
        """Test verifying an expired token"""
        token_data = {
            "sub": admin_user.id,
            "email": admin_user.email,
        }
        
        # Create token that expires immediately
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(token_data, expires_delta)
        
        payload = decode_token(token)
        
        # Expired token returns None
        assert payload is None

    def test_verify_invalid_token(self):
        """Test verifying an invalid token"""
        invalid_token = "invalid.token.string"
        
        payload = decode_token(invalid_token)
        
        assert payload is None

    def test_verify_malformed_token(self):
        """Test verifying a malformed token"""
        malformed_token = "not-a-jwt-token"
        
        payload = decode_token(malformed_token)
        
        assert payload is None


@pytest.mark.unit
class TestRefreshToken:
    """Test refresh token functionality"""
    
    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful token refresh"""
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
        
        # Verify new tokens are different
        assert result["access_token"] != refresh_token
        assert result["refresh_token"] != refresh_token

    @pytest.mark.asyncio
    async def test_refresh_token_invalid_token(
        self, db_session: Session, mock_session_manager
    ):
        """Test refresh with invalid token format"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh_access_token("invalid_token")
        
        assert exc_info.value.status_code == 401
        assert "invalid" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_refresh_token_with_access_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test refresh fails when using an access token instead of refresh token"""
        access_token = create_access_token({
            "sub": admin_user.id,
            "email": admin_user.email,
        })
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh_access_token(access_token)
        
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token_revoked(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test refresh fails with revoked token"""
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
    async def test_refresh_token_inactive_user(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test refresh fails when user becomes inactive"""
        refresh_token = create_refresh_token({
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
        })
        
        mock_session_manager.verify_refresh_token.return_value = True
        
        admin_user.is_active = False
        db_session.commit()
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh_access_token(refresh_token)
        
        assert exc_info.value.status_code == 401
        assert "inactive" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_refresh_token_nonexistent_user(
        self, db_session: Session, mock_session_manager
    ):
        """Test refresh fails for deleted user"""
        refresh_token = create_refresh_token({
            "sub": 99999,  # Non-existent user ID
            "email": "deleted@example.com",
        })
        
        mock_session_manager.verify_refresh_token.return_value = True
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.refresh_access_token(refresh_token)
        
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token_revokes_old_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that refresh revokes the old refresh token"""
        refresh_token = create_refresh_token({
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
        })
        
        mock_session_manager.verify_refresh_token.return_value = True
        
        auth_service = AuthService(db_session, mock_session_manager)
        await auth_service.refresh_access_token(refresh_token)
        
        # Verify old token is revoked
        mock_session_manager.revoke_refresh_token.assert_called_once_with(
            admin_user.id, refresh_token
        )


@pytest.mark.unit
class TestForgotPassword:
    """Test forgot password functionality"""
    
    @pytest.mark.asyncio
    async def test_forgot_password_creates_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test forgot password creates a reset token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        
        assert token is not None
        assert len(token) > 0
        
        # Verify token is stored in database
        reset_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).first()
        
        assert reset_token is not None
        assert reset_token.token == token

    @pytest.mark.asyncio
    async def test_forgot_password_token_has_expiration(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that reset token has proper expiration"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        
        reset_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        assert reset_token.expires_at is not None
        assert reset_token.expires_at > datetime.utcnow()

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_email(
        self, db_session: Session, mock_session_manager
    ):
        """Test forgot password with non-existent email returns None"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token("nonexistent@example.com")
        
        assert token is None

    @pytest.mark.asyncio
    async def test_forgot_password_invalidates_old_tokens(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that creating new token invalidates previous ones"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token1 = await auth_service.create_password_reset_token(admin_user.email)
        token2 = await auth_service.create_password_reset_token(admin_user.email)
        
        old_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.token == token1
        ).first()
        
        assert old_token.is_used is True
        
        new_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.token == token2
        ).first()
        
        assert new_token.is_used is False

    @pytest.mark.asyncio
    async def test_forgot_password_multiple_tokens(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that only the latest token is valid"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        tokens = []
        for _ in range(3):
            token = await auth_service.create_password_reset_token(admin_user.email)
            tokens.append(token)
        
        # Only the last token should be unused
        for token in tokens[:-1]:
            reset_token = db_session.query(PasswordResetToken).filter(
                PasswordResetToken.token == token
            ).first()
            assert reset_token.is_used is True
        
        latest_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.token == tokens[-1]
        ).first()
        assert latest_token.is_used is False


@pytest.mark.unit
class TestResetPassword:
    """Test reset password functionality"""
    
    @pytest.mark.asyncio
    async def test_reset_password_success(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful password reset"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        new_password = "NewSecurePassword123!"
        
        result = await auth_service.reset_password(token, new_password)
        
        assert result is True
        
        db_session.refresh(admin_user)
        assert verify_password(new_password, admin_user.hashed_password)

    @pytest.mark.asyncio
    async def test_reset_password_marks_token_used(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that password reset marks token as used"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        
        await auth_service.reset_password(token, "NewPassword123!")
        
        reset_token = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        assert reset_token.is_used is True

    @pytest.mark.asyncio
    async def test_reset_password_logs_out_all_sessions(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that password reset logs out all sessions"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        
        await auth_service.reset_password(token, "NewPassword123!")
        
        mock_session_manager.delete_all_user_sessions.assert_called_once_with(admin_user.id)
        mock_session_manager.revoke_all_refresh_tokens.assert_called_once_with(admin_user.id)

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(
        self, db_session: Session, mock_session_manager
    ):
        """Test password reset with invalid token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.reset_password("invalid_token", "NewPassword123!")
        
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
            await auth_service.reset_password("expired_token", "NewPassword123!")
        
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_reset_password_used_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test password reset with already used token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        token = await auth_service.create_password_reset_token(admin_user.email)
        
        # Use the token once
        await auth_service.reset_password(token, "NewPassword123!")
        
        # Try to use it again
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.reset_password(token, "AnotherPassword123!")
        
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_reset_password_nonexistent_user(
        self, db_session: Session, mock_session_manager
    ):
        """Test password reset fails for non-existent user"""
        # Create a reset token for a user that will be deleted
        from src.models.user import User
        temp_user = User(
            username="temp",
            email="temp@test.com",
            hashed_password=get_password_hash("temp"),
            institution_id=1,
            role_id=1,
        )
        db_session.add(temp_user)
        db_session.commit()
        
        reset_token = PasswordResetToken(
            user_id=temp_user.id,
            token="test_token",
            expires_at=datetime.utcnow() + timedelta(hours=1),
            is_used=False
        )
        db_session.add(reset_token)
        db_session.commit()
        
        # Delete the user
        db_session.delete(temp_user)
        db_session.commit()
        
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.reset_password("test_token", "NewPassword123!")
        
        assert exc_info.value.status_code == 404 or exc_info.value.status_code == 400


@pytest.mark.unit
class TestChangePassword:
    """Test change password functionality"""
    
    @pytest.mark.asyncio
    async def test_change_password_success(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test successful password change"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        new_password = "NewSecurePassword123!"
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
        """Test password change fails with wrong current password"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.change_password(
                user_id=admin_user.id,
                current_password="wrongpassword",
                new_password="NewPassword123!"
            )
        
        assert exc_info.value.status_code == 400
        assert "incorrect" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_change_password_user_not_found(
        self, db_session: Session, mock_session_manager
    ):
        """Test password change fails for non-existent user"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.change_password(
                user_id=99999,
                current_password="password123",
                new_password="NewPassword123!"
            )
        
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_change_password_logs_out_all_sessions(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test that password change logs out all sessions"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.change_password(
            user_id=admin_user.id,
            current_password="password123",
            new_password="NewPassword123!"
        )
        
        mock_session_manager.delete_all_user_sessions.assert_called_once_with(admin_user.id)
        mock_session_manager.revoke_all_refresh_tokens.assert_called_once_with(admin_user.id)


@pytest.mark.unit
class TestLogout:
    """Test logout functionality"""
    
    @pytest.mark.asyncio
    async def test_logout_with_refresh_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test logout with both access and refresh tokens"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.logout(
            user_id=admin_user.id,
            access_token="test_access_token",
            refresh_token="test_refresh_token"
        )
        
        mock_session_manager.delete_session.assert_called_once_with(
            admin_user.id, "test_access_token"
        )
        mock_session_manager.revoke_refresh_token.assert_called_once_with(
            admin_user.id, "test_refresh_token"
        )

    @pytest.mark.asyncio
    async def test_logout_without_refresh_token(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test logout with only access token"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.logout(
            user_id=admin_user.id,
            access_token="test_access_token"
        )
        
        mock_session_manager.delete_session.assert_called_once_with(
            admin_user.id, "test_access_token"
        )
        mock_session_manager.revoke_refresh_token.assert_not_called()

    @pytest.mark.asyncio
    async def test_logout_all_sessions(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test logout from all sessions"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        await auth_service.logout_all_sessions(admin_user.id)
        
        mock_session_manager.delete_all_user_sessions.assert_called_once_with(admin_user.id)
        mock_session_manager.revoke_all_refresh_tokens.assert_called_once_with(admin_user.id)


@pytest.mark.unit
class TestPasswordSecurity:
    """Test password hashing and verification security"""
    
    def test_password_hash_is_different_each_time(self):
        """Test that same password produces different hashes"""
        password = "TestPassword123!"
        
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_password_hash_is_not_reversible(self):
        """Test that password hash cannot be reversed"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        # Hash should not contain the original password
        assert password not in hashed
        
        # Hash should be significantly different in length
        assert len(hashed) > len(password)

    def test_verify_password_with_wrong_password(self):
        """Test that verification fails with wrong password"""
        password = "CorrectPassword123!"
        wrong_password = "WrongPassword123!"
        hashed = get_password_hash(password)
        
        assert not verify_password(wrong_password, hashed)

    def test_verify_password_case_sensitive(self):
        """Test that password verification is case-sensitive"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert not verify_password("testpassword123!", hashed)
        assert not verify_password("TESTPASSWORD123!", hashed)


@pytest.mark.unit
class TestTokenSecurity:
    """Test token security measures"""
    
    def test_tokens_are_unique(self, admin_user: User):
        """Test that generated tokens are unique"""
        token_data = {"sub": admin_user.id, "email": admin_user.email}
        
        tokens = [create_access_token(token_data) for _ in range(5)]
        
        # All tokens should be different (due to different exp times)
        assert len(set(tokens)) == len(tokens)

    def test_token_contains_type_claim(self, admin_user: User):
        """Test that tokens contain type claim"""
        access_token = create_access_token({"sub": admin_user.id})
        refresh_token = create_refresh_token({"sub": admin_user.id})
        
        access_payload = decode_token(access_token)
        refresh_payload = decode_token(refresh_token)
        
        assert access_payload["type"] == "access"
        assert refresh_payload["type"] == "refresh"

    def test_token_contains_expiration(self, admin_user: User):
        """Test that tokens contain expiration claim"""
        token = create_access_token({"sub": admin_user.id})
        payload = decode_token(token)
        
        assert "exp" in payload
        assert payload["exp"] > datetime.utcnow().timestamp()


@pytest.mark.unit
class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    @pytest.mark.asyncio
    async def test_authenticate_with_empty_email(
        self, db_session: Session, mock_session_manager
    ):
        """Test authentication with empty email"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email="",
            password="password123"
        )
        
        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_with_empty_password(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test authentication with empty password"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        user = await auth_service.authenticate_user(
            email=admin_user.email,
            password=""
        )
        
        assert user is None

    @pytest.mark.asyncio
    async def test_login_includes_user_permissions(
        self, db_session: Session, admin_user: User, mock_session_manager, institution
    ):
        """Test that login response includes user permissions"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        result = await auth_service.login(
            email=admin_user.email,
            password="password123"
        )
        
        assert "user" in result
        assert "permissions" in result["user"]

    @pytest.mark.asyncio
    async def test_multiple_simultaneous_password_reset_requests(
        self, db_session: Session, admin_user: User, mock_session_manager
    ):
        """Test handling multiple password reset requests"""
        auth_service = AuthService(db_session, mock_session_manager)
        
        # Create multiple reset tokens
        tokens = []
        for _ in range(3):
            token = await auth_service.create_password_reset_token(admin_user.email)
            tokens.append(token)
        
        # Only the last token should be valid
        valid_tokens = db_session.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == admin_user.id,
            PasswordResetToken.is_used == False
        ).all()
        
        assert len(valid_tokens) == 1
        assert valid_tokens[0].token == tokens[-1]

    def test_token_payload_preserves_data_types(self, admin_user: User):
        """Test that token payload preserves different data types"""
        token_data = {
            "sub": admin_user.id,  # int
            "email": admin_user.email,  # str
            "is_superuser": admin_user.is_superuser,  # bool
            "institution_id": admin_user.institution_id,  # int
        }
        
        token = create_access_token(token_data)
        payload = decode_token(token)
        
        assert isinstance(payload["sub"], int)
        assert isinstance(payload["email"], str)
        assert isinstance(payload["is_superuser"], bool)
        assert isinstance(payload["institution_id"], int)
