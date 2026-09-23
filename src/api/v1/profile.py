from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.user import UserUpdate, UserResponse
from src.services.user_profile_service import UserProfileService

router = APIRouter()


def _strip_privileged_fields(profile_data: UserUpdate) -> UserUpdate:
    """Drop role_id/is_active from a self-service profile update.

    Only fields the caller actually set are dropped (not forced to None),
    so unrelated fields on the same request are unaffected and the ORM
    layer's `setattr` loop never sees an explicit None for these two.
    """
    remaining = profile_data.model_dump(exclude_unset=True, exclude={"role_id", "is_active"})
    return UserUpdate(**remaining)


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UserProfileService(db)
    profile = service.get_user_profile(current_user.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return profile


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # UserUpdate is the same general-purpose schema admin-facing user
    # management uses, so it carries `role_id`/`is_active` -- fields a
    # self-service "edit my own profile" endpoint must never honor.
    # Forwarding it unfiltered let any authenticated user PUT their own
    # `role_id` to e.g. an admin role's id and self-escalate privileges (or
    # reactivate/deactivate their own account) via this endpoint.
    profile_data = _strip_privileged_fields(profile_data)
    service = UserProfileService(db)
    updated_user = service.update_user_profile(current_user.id, profile_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return updated_user


@router.get("/{user_id}")
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this profile"
        )
    
    service = UserProfileService(db)
    profile = service.get_user_profile(user_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return profile


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_profile(
    user_id: int,
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )

    # Same self-escalation gap as PUT /me: a non-superuser editing their own
    # profile through this path (current_user.id == user_id) must not be
    # able to change their own role/active status either. A superuser
    # (editing themselves or anyone else) keeps full field access, since
    # they're already authorized to change roles.
    if current_user.id == user_id and not current_user.is_superuser:
        profile_data = _strip_privileged_fields(profile_data)

    service = UserProfileService(db)
    updated_user = service.update_user_profile(user_id, profile_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return updated_user
