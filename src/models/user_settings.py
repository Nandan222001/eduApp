from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from src.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    notification_preferences = Column(JSON, nullable=True)
    theme_mode = Column(String(20), default='auto', nullable=False)
    primary_color = Column(String(7), nullable=True)
    font_size = Column(String(20), default='medium', nullable=False)
    compact_mode = Column(Boolean, default=False, nullable=False)
    profile_public = Column(Boolean, default=True, nullable=False)
    show_in_leaderboard = Column(Boolean, default=True, nullable=False)
    show_email = Column(Boolean, default=False, nullable=False)
    show_phone = Column(Boolean, default=False, nullable=False)
    allow_messages = Column(Boolean, default=True, nullable=False)
    show_online_status = Column(Boolean, default=True, nullable=False)
    language = Column(String(10), default='en', nullable=False)
    timezone = Column(String(50), default='UTC', nullable=False)
    biometric_enabled = Column(Boolean, default=False, nullable=False)
    pin_enabled = Column(Boolean, default=False, nullable=False)
    pin_hash = Column(String(255), nullable=True)
    session_timeout_minutes = Column(Integer, default=30, nullable=False)
    auto_lock_minutes = Column(Integer, default=5, nullable=False)
    require_biometric_for_sensitive = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="settings")


class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    device_type = Column(String(50), nullable=False)
    device_fingerprint = Column(String(255), nullable=True, index=True)
    device_model = Column(String(100), nullable=True)
    os_version = Column(String(50), nullable=True)
    app_version = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=False)
    location = Column(String(255), nullable=True)
    last_active = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)
    is_trusted = Column(Boolean, default=False, nullable=False)
    biometric_enabled = Column(Boolean, default=False, nullable=False)
    biometric_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="devices")

    __table_args__ = (
        Index('idx_user_device_user', 'user_id'),
        Index('idx_user_device_last_active', 'last_active'),
        Index('idx_user_device_fingerprint', 'device_fingerprint'),
    )


class AccountDeletionRequest(Base):
    __tablename__ = "account_deletion_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    reason = Column(String(50), nullable=False)
    feedback = Column(Text, nullable=True)
    status = Column(String(20), default='pending', nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    confirmation_token = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="deletion_requests")

    __table_args__ = (
        Index('idx_deletion_request_user', 'user_id'),
        Index('idx_deletion_request_status', 'status'),
        Index('idx_deletion_request_scheduled', 'scheduled_date'),
    )
