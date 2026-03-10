from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.user import UserCreate, UserResponse, UserUpdate
from src.models.user import User
from src.dependencies.auth import get_current_user, get_current_superuser
from src.dependencies.rbac import require_permissions, require_role
from src.utils.security import get_password_hash
from src.utils.rbac import verify_institution_access

router = APIRouter()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions(["users:create"]))],
)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if not verify_institution_access(current_user, user_data.institution_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create user for this institution",
        )

    existing_user = (
        db.query(User)
        .filter(
            User.email == user_data.email,
            User.institution_id == user_data.institution_id,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in this institution",
        )

    existing_username = (
        db.query(User)
        .filter(
            User.username == user_data.username,
            User.institution_id == user_data.institution_id,
        )
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken in this institution",
        )

    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        institution_id=user_data.institution_id,
        role_id=user_data.role_id,
        is_active=user_data.is_active,
        is_superuser=user_data.is_superuser,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_permissions(["users:read"]))],
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not verify_institution_access(current_user, db_user.institution_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access users from this institution",
        )

    return db_user


@router.get(
    "/",
    response_model=List[UserResponse],
    dependencies=[Depends(require_permissions(["users:read"]))],
)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[User]:
    query = db.query(User)

    if not current_user.is_superuser:
        query = query.filter(User.institution_id == current_user.institution_id)

    users = query.offset(skip).limit(limit).all()
    return users


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_permissions(["users:update"]))],
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not verify_institution_access(current_user, db_user.institution_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update users from this institution",
        )

    update_data = user_data.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permissions(["users:delete"]))],
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not verify_institution_access(current_user, db_user.institution_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete users from this institution",
        )

    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    db.delete(db_user)
    db.commit()


@router.get(
    "/me/profile",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


@router.put(
    "/me/profile",
    response_model=UserResponse,
)
def update_my_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    update_data = user_data.model_dump(exclude_unset=True, exclude={"role_id", "is_active", "is_superuser"})

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user
