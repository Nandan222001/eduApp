from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user


class PermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    async def __call__(
        self,
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

        for required_permission in self.required_permissions:
            if required_permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {required_permission}",
                )

        return current_user


class AnyPermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    async def __call__(
        self,
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

        for required_permission in self.required_permissions:
            if required_permission in user_permissions:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires one of: {', '.join(self.required_permissions)}",
        )


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        if current_user.role and current_user.role.slug in self.allowed_roles:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires one of roles: {', '.join(self.allowed_roles)}",
        )


class InstitutionAccessChecker:
    def __init__(self, institution_id_param: str = "institution_id"):
        self.institution_id_param = institution_id_param

    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        return current_user


def require_permissions(permissions: List[str]) -> PermissionChecker:
    return PermissionChecker(permissions)


def require_any_permission(permissions: List[str]) -> AnyPermissionChecker:
    return AnyPermissionChecker(permissions)


def require_role(roles: List[str]) -> RoleChecker:
    return RoleChecker(roles)


def require_institution_access(
    institution_id_param: str = "institution_id",
) -> InstitutionAccessChecker:
    return InstitutionAccessChecker(institution_id_param)
