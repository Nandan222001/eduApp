from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index, Float
from sqlalchemy.orm import relationship
from src.database import Base


class NotificationChannel(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"
    BATCHED = "batched"


class AudienceType(str, Enum):
    ALL = "all"
    INSTITUTION = "institution"
    GRADE = "grade"
    SECTION = "section"
    ROLE = "role"
    CUSTOM = "custom"


class DigestMode(str, Enum):
    DISABLED = "disabled"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"


class NotificationGroup(str, Enum):
    ACADEMIC = "academic"
    ADMINISTRATIVE = "administrative"
    SOCIAL = "social"
    SYSTEM = "system"
    ANNOUNCEMENTS = "announcements"
    ASSIGNMENTS = "assignments"
    GRADES = "grades"
    ATTENDANCE = "attendance"
    FEES = "fees"
    EVENTS = "events"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    notification_group = Column(String(50), default=NotificationGroup.SYSTEM.value, nullable=False)
    priority = Column(String(20), default=NotificationPriority.MEDIUM.value, nullable=False)
    channel = Column(String(20), nullable=False)
    status = Column(String(20), default=NotificationStatus.PENDING.value, nullable=False)
    data = Column(JSON, nullable=True)
    read_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    digest_batch_id = Column(String(100), nullable=True)
    grouped_with_id = Column(Integer, ForeignKey('notifications.id', ondelete='SET NULL'), nullable=True)
    group_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    user = relationship("User")
    grouped_with = relationship("Notification", remote_side=[id], foreign_keys=[grouped_with_id])

    __table_args__ = (
        Index('idx_notification_user_status', 'user_id', 'status'),
        Index('idx_notification_user_created', 'user_id', 'created_at'),
        Index('idx_notification_institution', 'institution_id'),
        Index('idx_notification_status', 'status'),
        Index('idx_notification_channel', 'channel'),
        Index('idx_notification_group', 'notification_group'),
        Index('idx_notification_digest_batch', 'digest_batch_id'),
    )


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    
    # Channel preferences
    email_enabled = Column(Boolean, default=True, nullable=False)
    sms_enabled = Column(Boolean, default=False, nullable=False)
    push_enabled = Column(Boolean, default=True, nullable=False)
    in_app_enabled = Column(Boolean, default=True, nullable=False)
    
    # Granular type preferences by channel (JSON structure)
    email_types = Column(JSON, nullable=True)
    sms_types = Column(JSON, nullable=True)
    push_types = Column(JSON, nullable=True)
    in_app_types = Column(JSON, nullable=True)
    
    # Notification groups preferences
    group_preferences = Column(JSON, nullable=True)
    
    # Priority level filters
    minimum_priority = Column(String(20), default=NotificationPriority.LOW.value, nullable=False)
    
    # Quiet hours scheduling
    quiet_hours_enabled = Column(Boolean, default=False, nullable=False)
    quiet_hours_start = Column(String(5), nullable=True)
    quiet_hours_end = Column(String(5), nullable=True)
    quiet_hours_days = Column(JSON, nullable=True)  # List of day indices (0=Monday, 6=Sunday)
    
    # Digest mode preferences
    digest_mode = Column(String(20), default=DigestMode.DISABLED.value, nullable=False)
    digest_channels = Column(JSON, nullable=True)  # Channels to apply digest mode to
    digest_delivery_time = Column(String(5), nullable=True)  # Time to send digest (HH:MM)
    
    # Smart grouping preferences
    enable_smart_grouping = Column(Boolean, default=True, nullable=False)
    grouping_window_minutes = Column(Integer, default=60, nullable=False)
    
    # Do Not Disturb
    dnd_enabled = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey('notifications.id', ondelete='CASCADE'), nullable=False, index=True)
    channel = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    attempt_count = Column(Integer, default=1, nullable=False)
    delivered_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    provider_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    notification = relationship("Notification")

    __table_args__ = (
        Index('idx_delivery_notification', 'notification_id'),
        Index('idx_delivery_channel_status', 'channel', 'status'),
        Index('idx_delivery_created', 'created_at'),
    )


class NotificationEngagement(Base):
    __tablename__ = "notification_engagements"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey('notifications.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # opened, clicked, dismissed, acted
    action_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    notification = relationship("Notification")
    user = relationship("User")

    __table_args__ = (
        Index('idx_engagement_notification', 'notification_id'),
        Index('idx_engagement_user', 'user_id'),
        Index('idx_engagement_action', 'action'),
        Index('idx_engagement_created', 'created_at'),
    )


class NotificationAnalytics(Base):
    __tablename__ = "notification_analytics"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    notification_type = Column(String(50), nullable=False)
    notification_group = Column(String(50), nullable=False)
    channel = Column(String(20), nullable=False)
    priority = Column(String(20), nullable=False)
    
    # Metrics
    total_sent = Column(Integer, default=0, nullable=False)
    total_delivered = Column(Integer, default=0, nullable=False)
    total_failed = Column(Integer, default=0, nullable=False)
    total_read = Column(Integer, default=0, nullable=False)
    total_clicked = Column(Integer, default=0, nullable=False)
    
    # Rates
    delivery_rate = Column(Float, default=0.0, nullable=False)
    read_rate = Column(Float, default=0.0, nullable=False)
    click_rate = Column(Float, default=0.0, nullable=False)
    
    # Timing
    avg_read_time_seconds = Column(Integer, nullable=True)
    avg_delivery_time_seconds = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_analytics_institution_date', 'institution_id', 'date'),
        Index('idx_analytics_type', 'notification_type'),
        Index('idx_analytics_group', 'notification_group'),
        Index('idx_analytics_channel', 'channel'),
    )


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    audience_type = Column(String(20), nullable=False)
    audience_filter = Column(JSON, nullable=True)
    priority = Column(String(20), default=NotificationPriority.MEDIUM.value, nullable=False)
    channels = Column(JSON, nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime, nullable=True)
    attachments = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index('idx_announcement_institution', 'institution_id'),
        Index('idx_announcement_published', 'is_published', 'published_at'),
        Index('idx_announcement_scheduled', 'scheduled_at'),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipient_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    parent_id = Column(Integer, ForeignKey('messages.id', ondelete='CASCADE'), nullable=True)
    subject = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    is_deleted_by_sender = Column(Boolean, default=False, nullable=False)
    is_deleted_by_recipient = Column(Boolean, default=False, nullable=False)
    attachments = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    parent = relationship("Message", remote_side=[id], foreign_keys=[parent_id])

    __table_args__ = (
        Index('idx_message_sender', 'sender_id', 'created_at'),
        Index('idx_message_recipient', 'recipient_id', 'is_read', 'created_at'),
        Index('idx_message_institution', 'institution_id'),
    )


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    notification_type = Column(String(50), nullable=False)
    channel = Column(String(20), nullable=False)
    subject_template = Column(String(255), nullable=True)
    body_template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_template_institution_type', 'institution_id', 'notification_type'),
        Index('idx_template_type_channel', 'notification_type', 'channel'),
    )


class NotificationPushDevice(Base):
    __tablename__ = "notification_push_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(String(500), nullable=False, unique=True)
    device_type = Column(String(20), nullable=False)
    device_id = Column(String(255), nullable=False)
    topics = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")

    __table_args__ = (
        Index('idx_notification_push_device_user', 'user_id'),
        Index('idx_notification_push_device_token', 'token'),
        Index('idx_notification_push_device_active', 'is_active'),
    )


class NotificationDevice(Base):
    __tablename__ = "notification_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    device_token = Column(String(500), nullable=False, index=True)
    device_type = Column(String(20), nullable=False)
    platform = Column(String(20), nullable=False)
    device_info = Column(JSON, nullable=True)
    app_version = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="notification_devices")

    __table_args__ = (
        Index('idx_notification_device_user', 'user_id'),
        Index('idx_notification_device_token', 'device_token'),
        Index('idx_notification_device_active', 'is_active'),
        Index('idx_notification_device_user_active', 'user_id', 'is_active'),
    )
