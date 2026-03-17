from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.database import Base


class MobileAuthEvent(Base):
    __tablename__ = "mobile_auth_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey('user_devices.id', ondelete='SET NULL'), nullable=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    auth_method = Column(String(50), nullable=False)
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(255), nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    location = Column(String(255), nullable=True)
    device_info = Column(JSONB, nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index('idx_mobile_auth_user_created', 'user_id', 'created_at'),
        Index('idx_mobile_auth_event_type', 'event_type'),
        Index('idx_mobile_auth_success', 'success'),
    )


class BiometricSession(Base):
    __tablename__ = "biometric_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey('user_devices.id', ondelete='CASCADE'), nullable=False, index=True)
    session_token = Column(String(255), nullable=False, unique=True, index=True)
    biometric_type = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_verified = Column(DateTime, default=datetime.utcnow, nullable=False)
    verification_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_biometric_session_token', 'session_token'),
        Index('idx_biometric_session_active', 'is_active'),
        Index('idx_biometric_session_expires', 'expires_at'),
    )


class SensitiveOperationLog(Base):
    __tablename__ = "sensitive_operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey('user_devices.id', ondelete='SET NULL'), nullable=True, index=True)
    operation_type = Column(String(100), nullable=False, index=True)
    operation_details = Column(Text, nullable=True)
    required_reauth = Column(Boolean, default=True, nullable=False)
    reauth_method = Column(String(50), nullable=True)
    reauth_success = Column(Boolean, nullable=True)
    ip_address = Column(String(45), nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index('idx_sensitive_op_user_created', 'user_id', 'created_at'),
        Index('idx_sensitive_op_type', 'operation_type'),
        Index('idx_sensitive_op_reauth', 'required_reauth'),
    )


class PinAttempt(Base):
    __tablename__ = "pin_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey('user_devices.id', ondelete='SET NULL'), nullable=True, index=True)
    success = Column(Boolean, nullable=False)
    attempt_count = Column(Integer, default=1, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_pin_attempt_user', 'user_id'),
        Index('idx_pin_attempt_created', 'created_at'),
        Index('idx_pin_attempt_locked', 'locked_until'),
    )
