from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.user_settings import UserSettings, UserDevice, AccountDeletionRequest
from src.dependencies.auth import get_current_user
from src.schemas.settings import (
    NotificationPreferences,
    ThemeSettings,
    PrivacySettings,
    UserSettingsResponse,
    UserSettingsUpdate,
    PasswordChangeRequest,
    ConnectedDevice as ConnectedDeviceSchema,
    AccountDeletionRequestCreate,
    AccountDeletionRequestResponse,
)
from src.schemas.user import UserResponse
from passlib.context import CryptContext
from datetime import datetime, timedelta
import secrets
import json

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_or_create_settings(db: Session, user_id: int) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        default_notification_prefs = NotificationPreferences().dict()
        settings = UserSettings(
            user_id=user_id,
            notification_preferences=default_notification_prefs
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/settings", response_model=UserSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    
    return UserSettingsResponse(
        notifications=NotificationPreferences(**settings.notification_preferences) if settings.notification_preferences else NotificationPreferences(),
        theme=ThemeSettings(
            mode=settings.theme_mode,
            primary_color=settings.primary_color,
            font_size=settings.font_size,
            compact_mode=settings.compact_mode
        ),
        privacy=PrivacySettings(
            profile_public=settings.profile_public,
            show_in_leaderboard=settings.show_in_leaderboard,
            show_email=settings.show_email,
            show_phone=settings.show_phone,
            allow_messages=settings.allow_messages,
            show_online_status=settings.show_online_status
        ),
        language=settings.language,
        timezone=settings.timezone
    )


@router.put("/settings", response_model=UserSettingsResponse)
async def update_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    
    if settings_update.notifications:
        settings.notification_preferences = settings_update.notifications.dict()
    
    if settings_update.theme:
        settings.theme_mode = settings_update.theme.mode
        settings.primary_color = settings_update.theme.primary_color
        settings.font_size = settings_update.theme.font_size
        settings.compact_mode = settings_update.theme.compact_mode
    
    if settings_update.privacy:
        settings.profile_public = settings_update.privacy.profile_public
        settings.show_in_leaderboard = settings_update.privacy.show_in_leaderboard
        settings.show_email = settings_update.privacy.show_email
        settings.show_phone = settings_update.privacy.show_phone
        settings.allow_messages = settings_update.privacy.allow_messages
        settings.show_online_status = settings_update.privacy.show_online_status
    
    if settings_update.language:
        settings.language = settings_update.language
    
    if settings_update.timezone:
        settings.timezone = settings_update.timezone
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    
    return await get_settings(current_user=current_user, db=db)


@router.get("/settings/notifications", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    return NotificationPreferences(**settings.notification_preferences) if settings.notification_preferences else NotificationPreferences()


@router.put("/settings/notifications", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    settings.notification_preferences = preferences.dict()
    settings.updated_at = datetime.utcnow()
    db.commit()
    return preferences


@router.get("/settings/theme", response_model=ThemeSettings)
async def get_theme_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    return ThemeSettings(
        mode=settings.theme_mode,
        primary_color=settings.primary_color,
        font_size=settings.font_size,
        compact_mode=settings.compact_mode
    )


@router.put("/settings/theme", response_model=ThemeSettings)
async def update_theme_settings(
    theme: ThemeSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    settings.theme_mode = theme.mode
    settings.primary_color = theme.primary_color
    settings.font_size = theme.font_size
    settings.compact_mode = theme.compact_mode
    settings.updated_at = datetime.utcnow()
    db.commit()
    return theme


@router.get("/settings/privacy", response_model=PrivacySettings)
async def get_privacy_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    return PrivacySettings(
        profile_public=settings.profile_public,
        show_in_leaderboard=settings.show_in_leaderboard,
        show_email=settings.show_email,
        show_phone=settings.show_phone,
        allow_messages=settings.allow_messages,
        show_online_status=settings.show_online_status
    )


@router.put("/settings/privacy", response_model=PrivacySettings)
async def update_privacy_settings(
    privacy: PrivacySettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_or_create_settings(db, current_user.id)
    settings.profile_public = privacy.profile_public
    settings.show_in_leaderboard = privacy.show_in_leaderboard
    settings.show_email = privacy.show_email
    settings.show_phone = privacy.show_phone
    settings.allow_messages = privacy.allow_messages
    settings.show_online_status = privacy.show_online_status
    settings.updated_at = datetime.utcnow()
    db.commit()
    return privacy


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and GIF are allowed."
        )
    
    # In production, upload to S3 or similar storage
    # For now, we'll just return a placeholder URL
    avatar_url = f"/uploads/avatars/{current_user.id}/{file.filename}"
    
    # Update user avatar
    user = db.query(User).filter(User.id == current_user.id).first()
    # Assuming User model has an avatar field - if not, add it to the model
    # user.avatar = avatar_url
    # db.commit()
    
    return {"avatarUrl": avatar_url}


@router.delete("/profile/avatar")
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    # user.avatar = None
    # db.commit()
    return {"message": "Avatar deleted successfully"}


@router.post("/profile/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify current password
    if not pwd_context.verify(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Verify new passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Update password
    user = db.query(User).filter(User.id == current_user.id).first()
    user.hashed_password = pwd_context.hash(password_data.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/settings/devices", response_model=list[ConnectedDeviceSchema])
async def get_connected_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    devices = db.query(UserDevice).filter(UserDevice.user_id == current_user.id).all()
    return [
        ConnectedDeviceSchema(
            id=str(device.id),
            device_name=device.device_name,
            device_type=device.device_type,
            browser=device.browser,
            os=device.os,
            ip_address=device.ip_address,
            location=device.location,
            last_active=device.last_active,
            is_current=device.is_current
        )
        for device in devices
    ]


@router.post("/settings/devices/{device_id}/logout")
async def logout_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(UserDevice).filter(
        UserDevice.id == int(device_id),
        UserDevice.user_id == current_user.id
    ).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    if device.is_current:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot logout current device"
        )
    
    db.delete(device)
    db.commit()
    
    return {"message": "Device logged out successfully"}


@router.post("/settings/devices/logout-all")
async def logout_all_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(UserDevice).filter(
        UserDevice.user_id == current_user.id,
        UserDevice.is_current == False
    ).delete()
    db.commit()
    
    return {"message": "All other devices logged out successfully"}


@router.post("/settings/delete-account", response_model=AccountDeletionRequestResponse)
async def request_account_deletion(
    deletion_request: AccountDeletionRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify password
    if not pwd_context.verify(deletion_request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password"
        )
    
    # Check for existing pending request
    existing_request = db.query(AccountDeletionRequest).filter(
        AccountDeletionRequest.user_id == current_user.id,
        AccountDeletionRequest.status == 'pending'
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending deletion request"
        )
    
    # Create deletion request
    confirmation_token = secrets.token_urlsafe(32)
    scheduled_date = datetime.utcnow() + timedelta(days=30)
    
    new_request = AccountDeletionRequest(
        user_id=current_user.id,
        reason=deletion_request.reason,
        feedback=deletion_request.feedback,
        status='pending',
        scheduled_date=scheduled_date,
        confirmation_token=confirmation_token
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    # TODO: Send confirmation email
    
    return AccountDeletionRequestResponse(
        message="Account deletion request submitted. Please check your email to confirm.",
        request_id=str(new_request.id)
    )


@router.post("/settings/cancel-deletion")
async def cancel_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(AccountDeletionRequest).filter(
        AccountDeletionRequest.user_id == current_user.id,
        AccountDeletionRequest.status == 'pending'
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending deletion request found"
        )
    
    request.status = 'cancelled'
    request.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Account deletion request cancelled successfully"}
