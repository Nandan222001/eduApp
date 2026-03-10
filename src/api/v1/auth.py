from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from redis.asyncio import Redis

from src.database import get_db
from src.redis_client import get_redis
from src.schemas.auth import (
    LoginRequest,
    Token,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    MessageResponse,
)
from src.services.auth_service import AuthService
from src.utils.session import SessionManager
from src.dependencies.auth import get_current_user, security
from src.models.user import User

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    session_manager = SessionManager(redis)
    auth_service = AuthService(db, session_manager)

    result = await auth_service.login(
        email=login_data.email,
        password=login_data.password,
        institution_id=login_data.institution_id,
    )

    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": result["token_type"],
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    session_manager = SessionManager(redis)
    auth_service = AuthService(db, session_manager)

    result = await auth_service.refresh_access_token(refresh_data.refresh_token)

    return result


@router.post("/logout", response_model=MessageResponse)
async def logout(
    refresh_token: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    session_manager = SessionManager(redis)
    auth_service = AuthService(db, session_manager)

    access_token = credentials.credentials
    await auth_service.logout(current_user.id, access_token, refresh_token)

    return {"message": "Successfully logged out"}


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    session_manager = SessionManager(redis)
    auth_service = AuthService(db, session_manager)

    await auth_service.logout_all_sessions(current_user.id)

    return {"message": "Successfully logged out from all sessions"}


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    session_manager = SessionManager(redis)
    auth_service = AuthService(db, session_manager)

    token = await auth_service.create_password_reset_token(forgot_data.email)

    return {
        "message": "If the email exists, a password reset link has been sent"
    }


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    session_manager = SessionManager(redis)
    auth_service = AuthService(db, session_manager)

    await auth_service.reset_password(reset_data.token, reset_data.new_password)

    return {"message": "Password has been reset successfully"}


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    session_manager = SessionManager(redis)
    auth_service = AuthService(db, session_manager)

    await auth_service.change_password(
        current_user.id,
        password_data.current_password,
        password_data.new_password,
    )

    return {"message": "Password has been changed successfully"}


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> dict:
    permissions = []
    if current_user.role and current_user.role.permissions:
        permissions = [f"{p.resource}:{p.action}" for p in current_user.role.permissions]

    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "institution_id": current_user.institution_id,
        "role_id": current_user.role_id,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "email_verified": current_user.email_verified,
        "last_login": current_user.last_login,
        "permissions": permissions,
        "role": {
            "id": current_user.role.id,
            "name": current_user.role.name,
            "slug": current_user.role.slug,
        } if current_user.role else None,
        "institution": {
            "id": current_user.institution.id,
            "name": current_user.institution.name,
            "slug": current_user.institution.slug,
        } if current_user.institution else None,
    }
