from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from src.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='SET NULL'), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(Integer, nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_audit_log_institution_user', 'institution_id', 'user_id'),
        Index('idx_audit_log_table_record', 'table_name', 'record_id'),
        Index('idx_audit_log_action', 'action'),
        Index('idx_audit_log_created', 'created_at'),
    )


class ImpersonationLog(Base):
    __tablename__ = "impersonation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    super_admin_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    impersonated_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='SET NULL'), nullable=True, index=True)
    reason = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ended_at = Column(DateTime, nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    actions_performed = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    __table_args__ = (
        Index('idx_impersonation_super_admin', 'super_admin_id'),
        Index('idx_impersonation_user', 'impersonated_user_id'),
        Index('idx_impersonation_active', 'is_active'),
        Index('idx_impersonation_started', 'started_at'),
    )


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='SET NULL'), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    activity_type = Column(String(100), nullable=False, index=True)
    activity_category = Column(String(50), nullable=False, index=True)
    endpoint = Column(String(255), nullable=True)
    method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    request_data = Column(JSONB, nullable=True)
    response_data = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_activity_institution_user', 'institution_id', 'user_id'),
        Index('idx_activity_type', 'activity_type'),
        Index('idx_activity_category', 'activity_category'),
        Index('idx_activity_created', 'created_at'),
        Index('idx_activity_status', 'status_code'),
    )


class SessionReplay(Base):
    __tablename__ = "session_replays"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='SET NULL'), nullable=True, index=True)
    events = Column(JSONB, nullable=False)
    metadata = Column(JSONB, nullable=True)
    started_at = Column(DateTime, nullable=False, index=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    page_count = Column(Integer, default=0)
    interaction_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_session_replay_session', 'session_id'),
        Index('idx_session_replay_user', 'user_id'),
        Index('idx_session_replay_started', 'started_at'),
    )
