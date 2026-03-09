from typing import List, Optional
from sqlalchemy.orm import Session

from src.models import User, Role, Permission


def has_permission(user: User, permission_slug: str) -> bool:
    if user.is_superuser:
        return True
    
    if not user.role:
        return False
    
    return any(p.slug == permission_slug for p in user.role.permissions)


def has_any_permission(user: User, permission_slugs: List[str]) -> bool:
    if user.is_superuser:
        return True
    
    if not user.role:
        return False
    
    user_permissions = {p.slug for p in user.role.permissions}
    return any(slug in user_permissions for slug in permission_slugs)


def has_all_permissions(user: User, permission_slugs: List[str]) -> bool:
    if user.is_superuser:
        return True
    
    if not user.role:
        return False
    
    user_permissions = {p.slug for p in user.role.permissions}
    return all(slug in user_permissions for slug in permission_slugs)


def get_user_permissions(user: User) -> List[str]:
    if not user.role:
        return []
    
    return [p.slug for p in user.role.permissions]


def can_access_resource(
    user: User,
    resource: str,
    action: str
) -> bool:
    permission_slug = f"{resource}.{action}"
    return has_permission(user, permission_slug)


def get_role_permissions(db: Session, role_id: int) -> List[Permission]:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return []
    return role.permissions


def verify_institution_access(
    user: User,
    target_institution_id: int
) -> bool:
    if user.is_superuser:
        return True
    return user.institution_id == target_institution_id
