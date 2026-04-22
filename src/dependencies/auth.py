import logging
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.permission import Permission
from src.utils.security import decode_token
from src.utils.context import RequestContext, set_request_context
from src.redis_client import get_redis
from src.utils.session import SessionManager
from redis.asyncio import Redis

security = HTTPBearer()


logger = logging.getLogger(__name__)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    redis: Optional[Redis] = Depends(get_redis),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        logger.warning("AUTH FAIL: decode_token returned None or wrong type. token_prefix=%s", token[:20] if token else "EMPTY")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: int = int(payload.get("sub"))
    if user_id is None:
        logger.warning("AUTH FAIL: user_id (sub) missing from payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session_manager = SessionManager(redis)
    session_data = await session_manager.get_session(user_id, token)

    if session_data is None:
        logger.warning("AUTH FAIL: session not found. user_id=%s redis_available=%s", user_id, redis is not None)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Handle degraded mode when Redis is unavailable
    if isinstance(session_data, dict) and session_data.get("degraded"):
        # In degraded mode, trust the JWT alone
        pass

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    permissions = []
    if user.role and user.role.permissions:
        permissions = [f"{p.resource}:{p.action}" for p in user.role.permissions]

    context = RequestContext(
        user_id=user.id,
        institution_id=user.institution_id,
        role_id=user.role_id,
        email=user.email,
        is_superuser=user.is_superuser,
        permissions=permissions,
    )
    set_request_context(context)

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


def require_permissions(required_permissions: List[str]):
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        user_permissions = []
        if current_user.role and current_user.role.permissions:
            user_permissions = [
                f"{p.resource}:{p.action}" for p in current_user.role.permissions
            ]

        for required_permission in required_permissions:
            if required_permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {required_permission}",
                )

        return current_user

    return permission_checker


def require_role(allowed_roles: List[str]):
    async def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        if current_user.role and current_user.role.slug in allowed_roles:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient role permissions",
        )

    return role_checker


def require_roles(current_user: User, allowed_roles: List[str]) -> User:
    if current_user.is_superuser:
        return current_user
    if current_user.role and current_user.role.slug in allowed_roles:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient role permissions",
    )


async def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db),
    redis: Optional[Redis] = Depends(get_redis),
) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "")
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        return None

    user_id: int = int(payload.get("sub"))
    if user_id is None:
        return None

    session_manager = SessionManager(redis)
    session_data = await session_manager.get_session(user_id, token)

    if session_data is None:
        return None

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user:
        permissions = []
        if user.role and user.role.permissions:
            permissions = [f"{p.resource}:{p.action}" for p in user.role.permissions]

        context = RequestContext(
            user_id=user.id,
            institution_id=user.institution_id,
            role_id=user.role_id,
            email=user.email,
            is_superuser=user.is_superuser,
            permissions=permissions,
        )
        set_request_context(context)

    return user


async def get_current_user_ws(
    token: str,
    db: Session
) -> Optional[User]:
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        return None

    user_id: int = int(payload.get("sub"))
    if user_id is None:
        return None

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    return user


async def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to require super admin privileges."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required",
        )
    return current_user
