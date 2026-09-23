from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from src.models.live_events import LiveEventType, LiveEventStatus, RestrictedAccessType, StreamPlatform


class LiveEventBase(BaseModel):
    event_name: str = Field(..., max_length=255)
    event_type: str
    description: Optional[str] = None
    scheduled_start_time: datetime
    scheduled_end_time: Optional[datetime] = None
    stream_platform: str = StreamPlatform.YOUTUBE.value
    chat_enabled: bool = True
    chat_moderated: bool = True
    restricted_access: str = RestrictedAccessType.PUBLIC.value
    allowed_grade_ids: Optional[List[int]] = None
    allowed_section_ids: Optional[List[int]] = None
    monetization_enabled: bool = False
    ticket_price: Optional[int] = None
    ticket_currency: str = "INR"
    auto_record: bool = True
    recording_retention_days: Optional[int] = 90
    thumbnail_url: Optional[str] = None
    tags: Optional[List[str]] = None


class LiveEventCreate(LiveEventBase):
    institution_id: int


class LiveEventUpdate(BaseModel):
    event_name: Optional[str] = Field(None, max_length=255)
    event_type: Optional[str] = None
    description: Optional[str] = None
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None
    status: Optional[str] = None
    stream_url: Optional[str] = None
    stream_embed_url: Optional[str] = None
    recording_url: Optional[str] = None
    chat_enabled: Optional[bool] = None
    chat_moderated: Optional[bool] = None
    restricted_access: Optional[str] = None
    allowed_grade_ids: Optional[List[int]] = None
    allowed_section_ids: Optional[List[int]] = None
    monetization_enabled: Optional[bool] = None
    ticket_price: Optional[int] = None
    thumbnail_url: Optional[str] = None
    tags: Optional[List[str]] = None


class LiveEventResponse(LiveEventBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_by: int
    status: str
    stream_url: Optional[str] = None
    stream_embed_url: Optional[str] = None
    recording_url: Optional[str] = None
    viewer_count: int
    peak_viewer_count: int
    total_views: int
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    external_stream_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LiveEventWithDetails(LiveEventResponse):
    current_viewer_count: int = 0
    total_messages: int = 0
    tickets_sold: int = 0
    revenue: int = 0


class StreamKeyResponse(BaseModel):
    stream_key: str
    stream_url: str
    rtmp_url: Optional[str] = None
    instructions: str


class EventViewerBase(BaseModel):
    device_type: Optional[str] = None
    browser: Optional[str] = None
    location: Optional[str] = None


class EventViewerCreate(EventViewerBase):
    live_event_id: int
    student_id: Optional[int] = None


class EventViewerUpdate(BaseModel):
    left_at: Optional[datetime] = None
    watch_duration: Optional[int] = None
    is_currently_watching: Optional[bool] = None
    messages_sent: Optional[int] = None
    reactions_count: Optional[int] = None


class EventViewerResponse(EventViewerBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    live_event_id: int
    user_id: int
    student_id: Optional[int] = None
    joined_at: datetime
    left_at: Optional[datetime] = None
    watch_duration: int
    is_currently_watching: bool
    messages_sent: int
    reactions_count: int
    created_at: datetime
    updated_at: datetime


class EventViewerWithUser(EventViewerResponse):
    user_name: str
    user_email: Optional[str] = None


class EventChatMessageBase(BaseModel):
    message: str = Field(..., max_length=1000)
    message_type: str = "text"
    parent_message_id: Optional[int] = None


class EventChatMessageCreate(EventChatMessageBase):
    live_event_id: int


class EventChatMessageUpdate(BaseModel):
    is_deleted: Optional[bool] = None
    is_flagged: Optional[bool] = None
    moderation_reason: Optional[str] = None


class EventChatMessageResponse(EventChatMessageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    live_event_id: int
    user_id: int
    is_deleted: bool
    is_flagged: bool
    moderated_by: Optional[int] = None
    moderated_at: Optional[datetime] = None
    moderation_reason: Optional[str] = None
    reactions: Optional[Dict[str, int]] = None
    created_at: datetime
    updated_at: datetime


class EventChatMessageWithUser(EventChatMessageResponse):
    user_name: str
    user_email: Optional[str] = None


class EventTicketBase(BaseModel):
    pass


class EventTicketCreate(BaseModel):
    live_event_id: int


class EventTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    live_event_id: int
    user_id: int
    ticket_code: str
    amount_paid: int
    currency: str
    payment_id: Optional[str] = None
    payment_status: str
    payment_gateway: Optional[str] = None
    is_redeemed: bool
    redeemed_at: Optional[datetime] = None
    is_refunded: bool
    refunded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ChatModerationRuleBase(BaseModel):
    rule_type: str = Field(..., max_length=50)
    rule_value: str
    action: str = "flag"
    severity: str = "medium"


class ChatModerationRuleCreate(ChatModerationRuleBase):
    institution_id: int


class ChatModerationRuleUpdate(BaseModel):
    rule_value: Optional[str] = None
    action: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None


class ChatModerationRuleResponse(ChatModerationRuleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ViewerAnalytics(BaseModel):
    total_viewers: int
    current_viewers: int
    peak_viewers: int
    average_watch_duration: float
    total_watch_time: int
    viewer_demographics: Dict[str, Any]
    viewer_engagement: Dict[str, Any]


class StreamAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime
    viewer_count: int
    chat_messages_count: int
    average_bitrate: Optional[int] = None
    buffering_events: int


class EventAnalytics(BaseModel):
    live_event_id: int
    event_name: str
    status: str
    viewer_analytics: ViewerAnalytics
    chat_analytics: Dict[str, Any]
    revenue_analytics: Optional[Dict[str, Any]] = None
    stream_quality: List[StreamAnalyticsResponse]


class AccessPermissionCheck(BaseModel):
    has_access: bool
    reason: Optional[str] = None
    requires_ticket: bool
    ticket_price: Optional[int] = None


class RecordingUploadRequest(BaseModel):
    recording_url: str
    recording_s3_key: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[int] = None


class RecordingArchiveRequest(BaseModel):
    archive_location: Optional[str] = None
    notes: Optional[str] = None
