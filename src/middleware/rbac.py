from typing import List, Callable
from functools import wraps
from fastapi import HTTPException, status

from src.utils.context import get_request_context
from src.models.user import User


def require_permissions(permissions: List[str]) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            context = get_request_context()
            if not context:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                )

            if context.is_superuser:
                return await func(*args, **kwargs)

            user_permissions = set(context.permissions)
            required_permissions = set(permissions)

            if not required_permissions.issubset(user_permissions):
                missing = required_permissions - user_permissions
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permissions: {', '.join(missing)}",
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def require_any_permission(permissions: List[str]) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            context = get_request_context()
            if not context:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                )

            if context.is_superuser:
                return await func(*args, **kwargs)

            user_permissions = set(context.permissions)
            required_permissions = set(permissions)

            if not user_permissions.intersection(required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of: {', '.join(required_permissions)}",
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def require_institution_access(func: Callable) -> Callable:
    @wraps(func)
    async def wrapper(*args, **kwargs):
        context = get_request_context()
        if not context:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )

        if context.is_superuser:
            return await func(*args, **kwargs)

        target_institution_id = kwargs.get("institution_id")
        if target_institution_id and target_institution_id != context.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this institution",
            )

        return await func(*args, **kwargs)

    return wrapper


def check_permission(user: User, permission: str) -> bool:
    if user.is_superuser:
        return True

    if not user.role or not user.role.permissions:
        return False

    return any(f"{p.resource}:{p.action}" == permission for p in user.role.permissions)


def check_any_permission(user: User, permissions: List[str]) -> bool:
    if user.is_superuser:
        return True

    if not user.role or not user.role.permissions:
        return False

    user_permissions = {f"{p.resource}:{p.action}" for p in user.role.permissions}
    return any(perm in user_permissions for perm in permissions)


def check_all_permissions(user: User, permissions: List[str]) -> bool:
    if user.is_superuser:
        return True

    if not user.role or not user.role.permissions:
        return False

    user_permissions = {f"{p.resource}:{p.action}" for p in user.role.permissions}
    return all(perm in user_permissions for perm in permissions)
