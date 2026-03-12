from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from src.models.notification import (
    NotificationChannel,
    NotificationPriority,
    NotificationStatus,
    AudienceType,
    DigestMode,
    NotificationGroup
)


class NotificationBase(BaseModel):
    title: str = Field(..., max_length=255)
    message: str
    notification_type: str = Field(..., max_length=50)
    notification_group: NotificationGroup = NotificationGroup.SYSTEM
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channel: NotificationChannel
    data: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    id: int
    institution_id: int
    user_id: int
    status: NotificationStatus
    read_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    digest_batch_id: Optional[str] = None
    grouped_with_id: Optional[int] = None
    group_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferenceBase(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True
    in_app_enabled: bool = True
    email_types: Optional[Dict[str, bool]] = None
    sms_types: Optional[Dict[str, bool]] = None
    push_types: Optional[Dict[str, bool]] = None
    in_app_types: Optional[Dict[str, bool]] = None
    group_preferences: Optional[Dict[str, bool]] = None
    minimum_priority: NotificationPriority = NotificationPriority.LOW
    quiet_hours_enabled: bool = False
    quiet_hours_start: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    quiet_hours_end: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    quiet_hours_days: Optional[List[int]] = None
    digest_mode: DigestMode = DigestMode.DISABLED
    digest_channels: Optional[List[NotificationChannel]] = None
    digest_delivery_time: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    enable_smart_grouping: bool = True
    grouping_window_minutes: int = Field(default=60, ge=1, le=1440)
    dnd_enabled: bool = False


class NotificationPreferenceCreate(NotificationPreferenceBase):
    pass


class NotificationPreferenceUpdate(NotificationPreferenceBase):
    pass


class NotificationPreferenceResponse(NotificationPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationPreviewRequest(BaseModel):
    title: str = Field(..., max_length=255)
    message: str
    notification_type: str = Field(..., max_length=50)
    channel: NotificationChannel
    priority: NotificationPriority = NotificationPriority.MEDIUM
    data: Optional[Dict[str, Any]] = None
    use_template: bool = False
    template_id: Optional[int] = None
    template_variables: Optional[Dict[str, Any]] = None


class NotificationPreviewResponse(BaseModel):
    rendered_subject: str
    rendered_body: str
    channel: NotificationChannel
    priority: NotificationPriority
    estimated_delivery_time: str
    would_be_sent: bool
    blocked_reason: Optional[str] = None


class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str
    audience_type: AudienceType
    audience_filter: Optional[Dict[str, Any]] = None
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channels: List[NotificationChannel]
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    attachments: Optional[List[Dict[str, str]]] = None


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    audience_type: Optional[AudienceType] = None
    audience_filter: Optional[Dict[str, Any]] = None
    priority: Optional[NotificationPriority] = None
    channels: Optional[List[NotificationChannel]] = None
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    attachments: Optional[List[Dict[str, str]]] = None


class AnnouncementPublish(BaseModel):
    is_published: bool = True


class AnnouncementResponse(AnnouncementBase):
    id: int
    institution_id: int
    created_by: int
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageBase(BaseModel):
    subject: Optional[str] = Field(None, max_length=255)
    content: str
    attachments: Optional[List[Dict[str, str]]] = None


class MessageCreate(MessageBase):
    recipient_id: int
    parent_id: Optional[int] = None


class MessageResponse(MessageBase):
    id: int
    institution_id: int
    sender_id: int
    recipient_id: int
    parent_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    is_deleted_by_sender: bool
    is_deleted_by_recipient: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageMarkRead(BaseModel):
    is_read: bool = True


class NotificationTemplateBase(BaseModel):
    name: str = Field(..., max_length=100)
    notification_type: str = Field(..., max_length=50)
    channel: NotificationChannel
    subject_template: Optional[str] = Field(None, max_length=255)
    body_template: str
    variables: Optional[List[str]] = None
    is_active: bool = True


class NotificationTemplateCreate(NotificationTemplateBase):
    pass


class NotificationTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    subject_template: Optional[str] = Field(None, max_length=255)
    body_template: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None


class NotificationTemplateResponse(NotificationTemplateBase):
    id: int
    institution_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BulkNotificationRequest(BaseModel):
    user_ids: List[int]
    title: str = Field(..., max_length=255)
    message: str
    notification_type: str = Field(..., max_length=50)
    notification_group: NotificationGroup = NotificationGroup.SYSTEM
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channel: NotificationChannel
    data: Optional[Dict[str, Any]] = None


class NotificationStats(BaseModel):
    total: int
    unread: int
    by_channel: Dict[str, int]
    by_priority: Dict[str, int]
    by_group: Dict[str, int]


class NotificationAnalyticsRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    notification_type: Optional[str] = None
    notification_group: Optional[NotificationGroup] = None
    channel: Optional[NotificationChannel] = None
    priority: Optional[NotificationPriority] = None


class NotificationAnalyticsResponse(BaseModel):
    total_sent: int
    total_delivered: int
    total_failed: int
    total_read: int
    total_clicked: int
    delivery_rate: float
    read_rate: float
    click_rate: float
    avg_read_time_seconds: Optional[int]
    avg_delivery_time_seconds: Optional[int]
    by_channel: Dict[str, Dict[str, Any]]
    by_priority: Dict[str, Dict[str, Any]]
    by_group: Dict[str, Dict[str, Any]]
    by_type: Dict[str, Dict[str, Any]]
    timeline: List[Dict[str, Any]]


class NotificationEngagementCreate(BaseModel):
    notification_id: int
    action: str = Field(..., max_length=50)
    action_data: Optional[Dict[str, Any]] = None


class NotificationEngagementResponse(BaseModel):
    id: int
    notification_id: int
    user_id: int
    action: str
    action_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class DigestNotificationRequest(BaseModel):
    digest_type: DigestMode
    force_send: bool = False


class NotificationGroupSummary(BaseModel):
    group: NotificationGroup
    count: int
    latest_notification: Optional[NotificationResponse]
    unread_count: int


class SmartGroupingSettings(BaseModel):
    enable_smart_grouping: bool
    grouping_window_minutes: int = Field(ge=1, le=1440)
    group_by_type: bool = True
    group_by_sender: bool = True


class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
