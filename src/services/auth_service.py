from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.models.user import User
from src.models.password_reset_token import PasswordResetToken
from src.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from src.utils.session import SessionManager
from src.utils.rbac import get_user_permissions
from src.config import settings


class AuthService:
    def __init__(self, db: Session, session_manager: SessionManager):
        self.db = db
        self.session_manager = session_manager

    async def authenticate_user(
        self, email: str, password: str, institution_id: Optional[int] = None
    ) -> Optional[User]:
        query = self.db.query(User).filter(User.email == email)
        if institution_id:
            query = query.filter(User.institution_id == institution_id)

        user = query.first()

        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user

    async def login(
        self, email: str, password: str, institution_id: Optional[int] = None
    ) -> Dict[str, Any]:
        user = await self.authenticate_user(email, password, institution_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        if not user.institution.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Institution is inactive",
            )

        token_data = {
            "sub": user.id,
            "institution_id": user.institution_id,
            "role_id": user.role_id,
            "email": user.email,
        }

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        permissions = get_user_permissions(user)
        session_data = {
            "user_id": user.id,
            "institution_id": user.institution_id,
            "role_id": user.role_id,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "permissions": permissions,
            "created_at": datetime.utcnow().isoformat(),
        }

        await self.session_manager.create_session(user.id, session_data, access_token)
        await self.session_manager.store_refresh_token(user.id, refresh_token)

        user.last_login = datetime.utcnow()
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "institution_id": user.institution_id,
                "role_id": user.role_id,
                "is_superuser": user.is_superuser,
                "permissions": permissions,
            },
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        payload = decode_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user_id: int = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        is_valid = await self.session_manager.verify_refresh_token(user_id, refresh_token)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked or expired",
            )

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        token_data = {
            "sub": user.id,
            "institution_id": user.institution_id,
            "role_id": user.role_id,
            "email": user.email,
        }

        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        permissions = get_user_permissions(user)
        session_data = {
            "user_id": user.id,
            "institution_id": user.institution_id,
            "role_id": user.role_id,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "permissions": permissions,
            "created_at": datetime.utcnow().isoformat(),
        }

        await self.session_manager.create_session(user.id, session_data, new_access_token)
        await self.session_manager.revoke_refresh_token(user.id, refresh_token)
        await self.session_manager.store_refresh_token(user.id, new_refresh_token)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    async def logout(self, user_id: int, access_token: str, refresh_token: Optional[str] = None) -> None:
        await self.session_manager.delete_session(user_id, access_token)

        if refresh_token:
            await self.session_manager.revoke_refresh_token(user_id, refresh_token)

    async def logout_all_sessions(self, user_id: int) -> None:
        await self.session_manager.delete_all_user_sessions(user_id)
        await self.session_manager.revoke_all_refresh_tokens(user_id)

    async def create_password_reset_token(self, email: str) -> Optional[str]:
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            return None

        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(
            minutes=settings.reset_password_token_expire_minutes
        )

        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.is_used == False,
        ).update({"is_used": True})

        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
        self.db.add(reset_token)
        self.db.commit()

        return token

    async def reset_password(self, token: str, new_password: str) -> bool:
        reset_token = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token == token,
                PasswordResetToken.is_used == False,
                PasswordResetToken.expires_at > datetime.utcnow(),
            )
            .first()
        )

        if not reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        user = self.db.query(User).filter(User.id == reset_token.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.hashed_password = get_password_hash(new_password)
        reset_token.is_used = True

        await self.logout_all_sessions(user.id)

        self.db.commit()

        return True

    async def change_password(
        self, user_id: int, current_password: str, new_password: str
    ) -> bool:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        user.hashed_password = get_password_hash(new_password)

        await self.logout_all_sessions(user.id)

        self.db.commit()

        return True
