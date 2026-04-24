import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from src.database import get_db
from src.dependencies.auth import get_current_user, require_role
from src.models.user import User
from src.models.role import Role
from src.utils.security import get_password_hash

router = APIRouter()

_ADMIN_ROLES = ["institution_admin", "admin", "super_admin", "superadmin"]
_ALLOWED_ROLES = ["institution_admin", "admin", "super_admin", "superadmin"]


def _user_to_admin(user: User) -> dict:
    return {
        "id": user.id,
        "user_id": user.id,
        "institution_id": user.institution_id,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "email": user.email,
        "phone": user.phone,
        "role": user.role.slug if user.role else "admin",
        "department": None,
        "designation": None,
        "is_active": user.is_active,
        "photo_url": None,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


@router.get("/")
def list_administrators(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    role: Optional[str] = None,
    current_user: User = Depends(require_role(_ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    institution_id = current_user.institution_id

    query = (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .filter(
            User.institution_id == institution_id,
            Role.slug.in_(_ADMIN_ROLES),
        )
        .options(joinedload(User.role))
    )

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                User.first_name.ilike(term),
                User.last_name.ilike(term),
                User.email.ilike(term),
            )
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if role:
        query = query.filter(Role.slug == role)

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    return {
        "items": [_user_to_admin(u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{admin_id}")
def get_administrator(
    admin_id: int,
    current_user: User = Depends(require_role(_ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .filter(
            User.id == admin_id,
            User.institution_id == current_user.institution_id,
            Role.slug.in_(_ADMIN_ROLES),
        )
        .options(joinedload(User.role))
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrator not found")
    return _user_to_admin(user)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_administrator(
    data: dict,
    current_user: User = Depends(require_role(_ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    institution_id = current_user.institution_id

    role_slug = data.get("role", "institution_admin")
    if role_slug not in _ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    role = db.query(Role).filter(
        Role.slug == role_slug,
        or_(Role.institution_id == institution_id, Role.is_system_role == True),
    ).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{role_slug}' not found")

    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")

    existing = db.query(User).filter(
        User.email == email,
        User.institution_id == institution_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered in this institution")

    # Derive a unique username from email local part
    base_username = email.split("@")[0]
    username = base_username
    suffix = 1
    while db.query(User).filter(User.username == username, User.institution_id == institution_id).first():
        username = f"{base_username}{suffix}"
        suffix += 1

    user = User(
        institution_id=institution_id,
        role_id=role.id,
        email=email,
        username=username,
        hashed_password=get_password_hash(secrets.token_urlsafe(16)),
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        phone=data.get("phone"),
        is_active=data.get("is_active", True),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(user, attribute_names=["role"])
    return _user_to_admin(user)


@router.put("/{admin_id}")
def update_administrator(
    admin_id: int,
    data: dict,
    current_user: User = Depends(require_role(_ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .filter(
            User.id == admin_id,
            User.institution_id == current_user.institution_id,
            Role.slug.in_(_ADMIN_ROLES),
        )
        .options(joinedload(User.role))
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrator not found")

    for field in ("first_name", "last_name", "email", "phone", "is_active"):
        if field in data:
            setattr(user, field, data[field])

    if "role" in data:
        new_role_slug = data["role"]
        if new_role_slug not in _ADMIN_ROLES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        new_role = db.query(Role).filter(
            Role.slug == new_role_slug,
            or_(Role.institution_id == current_user.institution_id, Role.is_system_role == True),
        ).first()
        if not new_role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{new_role_slug}' not found")
        user.role_id = new_role.id

    db.commit()
    db.refresh(user)
    db.refresh(user, attribute_names=["role"])
    return _user_to_admin(user)


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_administrator(
    admin_id: int,
    current_user: User = Depends(require_role(_ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    if admin_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")

    user = (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .filter(
            User.id == admin_id,
            User.institution_id == current_user.institution_id,
            Role.slug.in_(_ADMIN_ROLES),
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrator not found")

    db.delete(user)
    db.commit()


@router.post("/{admin_id}/photo")
def upload_administrator_photo(
    admin_id: int,
    photo: UploadFile = File(...),
    current_user: User = Depends(require_role(_ALLOWED_ROLES)),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .filter(
            User.id == admin_id,
            User.institution_id == current_user.institution_id,
            Role.slug.in_(_ADMIN_ROLES),
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrator not found")

    return {"photo_url": None}
