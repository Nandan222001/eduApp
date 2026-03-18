from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.models.user import User
from src.models.notification import NotificationGroup
from src.schemas.notification import (
    NotificationResponse,
    NotificationUpdate,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    BulkNotificationRequest,
    NotificationStats,
    NotificationPreviewRequest,
    NotificationPreviewResponse,
    NotificationAnalyticsRequest,
    NotificationAnalyticsResponse,
    NotificationEngagementCreate,
    NotificationEngagementResponse,
    DigestNotificationRequest,
    NotificationGroupSummary,
    SmartGroupingSettings,
    DeviceRegistrationRequest,
    DeviceRegistrationResponse,
    NotificationDeviceRegistrationRequest,
    NotificationDeviceResponse,
    NotificationDeviceUpdateRequest
)
from src.services.notification_service import NotificationService
from src.dependencies.auth import get_current_user
from src.tasks.notification_tasks import (
    send_notification,
    send_bulk_notifications,
    send_digest_notifications
)

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    status: Optional[str] = None,
    channel: Optional[str] = None,
    group: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user notifications with optional filtering"""
    service = NotificationService(db)
    notifications = service.get_notifications(
        user_id=current_user.id,
        status=status,
        channel=channel,
        group=group,
        skip=skip,
        limit=limit
    )
    return notifications


@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification statistics for current user"""
    service = NotificationService(db)
    return service.get_notification_stats(current_user.id)


@router.get("/groups/summary", response_model=List[NotificationGroupSummary])
def get_group_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification summary grouped by notification groups"""
    service = NotificationService(db)
    return service.get_group_summary(current_user.id)


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific notification by ID"""
    service = NotificationService(db)
    notification = service.get_notification_by_id(notification_id, current_user.id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return notification


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id, current_user.id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return notification


@router.post("/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    service = NotificationService(db)
    count = service.mark_all_as_read(current_user.id)
    return {"message": f"Marked {count} notifications as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    service = NotificationService(db)
    success = service.delete_notification(notification_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"message": "Notification deleted successfully"}


@router.get("/preferences/me", response_model=NotificationPreferenceResponse)
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification preferences for current user"""
    service = NotificationService(db)
    return service.get_or_create_preferences(current_user.id)


@router.put("/preferences/me", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    preference_update: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification preferences for current user"""
    service = NotificationService(db)
    return service.update_preferences(current_user.id, preference_update)


@router.post("/preferences/quiet-hours")
def configure_quiet_hours(
    enabled: bool,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    days: Optional[List[int]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configure quiet hours for notifications"""
    service = NotificationService(db)
    preference = service.get_or_create_preferences(current_user.id)
    
    preference.quiet_hours_enabled = enabled
    if start_time:
        preference.quiet_hours_start = start_time
    if end_time:
        preference.quiet_hours_end = end_time
    if days is not None:
        preference.quiet_hours_days = days
    
    db.commit()
    db.refresh(preference)
    
    return {
        "message": "Quiet hours configured successfully",
        "quiet_hours_enabled": preference.quiet_hours_enabled,
        "start": preference.quiet_hours_start,
        "end": preference.quiet_hours_end,
        "days": preference.quiet_hours_days
    }


@router.post("/preferences/digest-mode")
def configure_digest_mode(
    digest_mode: str,
    channels: Optional[List[str]] = None,
    delivery_time: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configure digest mode for batching notifications"""
    service = NotificationService(db)
    preference = service.get_or_create_preferences(current_user.id)
    
    preference.digest_mode = digest_mode
    if channels:
        preference.digest_channels = channels
    if delivery_time:
        preference.digest_delivery_time = delivery_time
    
    db.commit()
    db.refresh(preference)
    
    return {
        "message": "Digest mode configured successfully",
        "digest_mode": preference.digest_mode,
        "channels": preference.digest_channels,
        "delivery_time": preference.digest_delivery_time
    }


@router.post("/preferences/smart-grouping")
def configure_smart_grouping(
    settings: SmartGroupingSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configure smart notification grouping"""
    service = NotificationService(db)
    preference = service.get_or_create_preferences(current_user.id)
    
    preference.enable_smart_grouping = settings.enable_smart_grouping
    preference.grouping_window_minutes = settings.grouping_window_minutes
    
    db.commit()
    db.refresh(preference)
    
    return {
        "message": "Smart grouping configured successfully",
        "enable_smart_grouping": preference.enable_smart_grouping,
        "grouping_window_minutes": preference.grouping_window_minutes
    }


@router.post("/preferences/dnd")
def toggle_do_not_disturb(
    enabled: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle Do Not Disturb mode"""
    service = NotificationService(db)
    preference = service.get_or_create_preferences(current_user.id)
    
    preference.dnd_enabled = enabled
    db.commit()
    db.refresh(preference)
    
    return {
        "message": f"Do Not Disturb {'enabled' if enabled else 'disabled'}",
        "dnd_enabled": preference.dnd_enabled
    }


@router.post("/preview", response_model=NotificationPreviewResponse)
def preview_notification(
    preview_request: NotificationPreviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Preview how a notification would be sent with current preferences"""
    service = NotificationService(db)
    return service.preview_notification(current_user.id, preview_request)


@router.post("/engagement", response_model=NotificationEngagementResponse)
def record_notification_engagement(
    engagement: NotificationEngagementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record user engagement with a notification"""
    service = NotificationService(db)
    return service.record_engagement(engagement, current_user.id)


@router.post("/analytics", response_model=NotificationAnalyticsResponse)
def get_notification_analytics(
    request: NotificationAnalyticsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification analytics and metrics"""
    service = NotificationService(db)
    return service.get_analytics(current_user.institution_id, request)


@router.post("/bulk")
def send_bulk_notification(
    request: BulkNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send bulk notifications to multiple users"""
    task = send_bulk_notifications.delay(
        institution_id=current_user.institution_id,
        user_ids=request.user_ids,
        title=request.title,
        message=request.message,
        notification_type=request.notification_type,
        notification_group=request.notification_group.value,
        channel=request.channel.value,
        priority=request.priority.value,
        data=request.data
    )
    
    return {
        "message": "Bulk notifications queued for processing",
        "task_id": task.id,
        "user_count": len(request.user_ids)
    }


@router.post("/digest/send")
def trigger_digest_send(
    request: DigestNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger sending of digest notifications"""
    task = send_digest_notifications.delay(
        institution_id=current_user.institution_id,
        digest_type=request.digest_type.value,
        force_send=request.force_send
    )
    
    return {
        "message": "Digest notifications triggered",
        "task_id": task.id,
        "digest_type": request.digest_type.value
    }


@router.get("/test/quiet-hours")
def test_quiet_hours(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test if currently in quiet hours"""
    service = NotificationService(db)
    is_quiet = service.check_quiet_hours(current_user.id)
    
    return {
        "in_quiet_hours": is_quiet,
        "user_id": current_user.id
    }


@router.post("/register-device", response_model=DeviceRegistrationResponse)
def register_device(
    device_data: DeviceRegistrationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a device for push notifications"""
    service = NotificationService(db)
    device = service.register_device(
        user_id=current_user.id,
        token=device_data.token,
        device_type=device_data.deviceType,
        device_id=device_data.deviceId,
        topics=device_data.topics
    )
    
    return DeviceRegistrationResponse(
        id=device.id,
        token=device.token,
        deviceType=device.device_type,
        deviceId=device.device_id,
        topics=device.topics or [],
        isActive=device.is_active,
        createdAt=device.created_at,
        updatedAt=device.updated_at
    )


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    service = NotificationService(db)
    count = service.get_unread_count(current_user.id)
    
    return {"unread": count}


@router.post("/register-device", response_model=NotificationDeviceResponse)
def register_notification_device(
    device_data: NotificationDeviceRegistrationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a device for push notifications"""
    service = NotificationService(db)
    device = service.register_notification_device(
        user_id=current_user.id,
        role=current_user.role.name if current_user.role else "user",
        device_token=device_data.device_token,
        device_type=device_data.device_type,
        platform=device_data.platform,
        device_info=device_data.device_info,
        app_version=device_data.app_version
    )
    
    return device


@router.get("/devices", response_model=List[NotificationDeviceResponse])
def get_user_notification_devices(
    active_only: bool = Query(True, description="Filter to active devices only"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all registered devices for the current user"""
    service = NotificationService(db)
    devices = service.get_user_devices(current_user.id, active_only=active_only)
    
    return devices


@router.get("/devices/{device_id}", response_model=NotificationDeviceResponse)
def get_notification_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific device by ID"""
    service = NotificationService(db)
    device = service.get_device_by_id(device_id, current_user.id)
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return device


@router.patch("/devices/{device_id}", response_model=NotificationDeviceResponse)
def update_notification_device(
    device_id: int,
    device_update: NotificationDeviceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a device's information"""
    service = NotificationService(db)
    device = service.update_device(
        device_id=device_id,
        user_id=current_user.id,
        device_info=device_update.device_info,
        app_version=device_update.app_version,
        is_active=device_update.is_active
    )
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return device


@router.delete("/devices/{device_id}")
def revoke_notification_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke (deactivate) a device"""
    service = NotificationService(db)
    success = service.revoke_device(device_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return {"message": "Device revoked successfully"}


@router.post("/devices/revoke-by-token")
def revoke_device_by_token(
    device_token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a device by its token"""
    service = NotificationService(db)
    success = service.revoke_device_by_token(device_token, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return {"message": "Device revoked successfully"}


@router.post("/devices/logout")
def logout_all_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate all devices for the current user (logout from all devices)"""
    service = NotificationService(db)
    count = service.deactivate_user_devices(current_user.id)
    
    return {
        "message": "All devices deactivated successfully",
        "devices_deactivated": count
    }
