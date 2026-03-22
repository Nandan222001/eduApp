from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Float, Index, CHAR
from src.database import Base
import uuid


class AnalyticsEvent(Base):
    """Model for storing analytics events."""
    
    __tablename__ = "analytics_events"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_name = Column(String(255), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # page_view, click, conversion, etc.
    user_id = Column(CHAR(36), nullable=True, index=True)
    session_id = Column(String(255), nullable=True, index=True)
    institution_id = Column(CHAR(36), nullable=True, index=True)
    
    # Event properties
    properties = Column(JSON, nullable=True)
    
    # User context
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(50), nullable=True)
    referrer = Column(String(500), nullable=True)
    url = Column(String(1000), nullable=True)
    
    # Geo data
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('ix_analytics_events_user_created', 'user_id', 'created_at'),
        Index('ix_analytics_events_institution_created', 'institution_id', 'created_at'),
        Index('ix_analytics_events_event_created', 'event_name', 'created_at'),
    )


class PerformanceMetric(Base):
    """Model for storing performance metrics."""
    
    __tablename__ = "performance_metrics"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    
    # Context
    user_id = Column(CHAR(36), nullable=True, index=True)
    session_id = Column(String(255), nullable=True, index=True)
    url = Column(String(1000), nullable=True)
    
    # Web Vitals specifics
    rating = Column(String(20), nullable=True)  # good, needs-improvement, poor
    
    # Additional data
    metadata_json = Column('metadata', JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('ix_performance_metrics_metric_created', 'metric_name', 'created_at'),
        Index('ix_performance_metrics_user_created', 'user_id', 'created_at'),
    )


class UserSession(Base):
    """Model for tracking user sessions."""
    
    __tablename__ = "user_sessions"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(CHAR(36), nullable=True, index=True)
    institution_id = Column(CHAR(36), nullable=True, index=True)
    
    # Session details
    first_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    page_views = Column(Integer, default=0)
    events_count = Column(Integer, default=0)
    
    # Entry/Exit
    landing_page = Column(String(1000), nullable=True)
    exit_page = Column(String(1000), nullable=True)
    referrer = Column(String(500), nullable=True)
    
    # Device info
    device_type = Column(String(50), nullable=True)  # desktop, mobile, tablet
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    
    # Geo
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('ix_user_sessions_user_created', 'user_id', 'created_at'),
        Index('ix_user_sessions_first_seen', 'first_seen'),
    )


class FeatureUsage(Base):
    """Model for tracking feature usage and adoption."""
    
    __tablename__ = "feature_usage"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_name = Column(String(255), nullable=False, index=True)
    user_id = Column(CHAR(36), nullable=True, index=True)
    institution_id = Column(CHAR(36), nullable=True, index=True)
    
    # Usage details
    usage_count = Column(Integer, default=1)
    first_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Feature properties
    properties = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('ix_feature_usage_feature_user', 'feature_name', 'user_id'),
        Index('ix_feature_usage_institution_created', 'institution_id', 'created_at'),
    )


class UserRetention(Base):
    """Model for tracking user retention metrics."""
    
    __tablename__ = "user_retention"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), nullable=False, index=True)
    institution_id = Column(CHAR(36), nullable=True, index=True)
    
    cohort_date = Column(DateTime, nullable=False, index=True)  # First activity date
    activity_date = Column(DateTime, nullable=False, index=True)  # This activity date
    days_since_cohort = Column(Integer, nullable=False)
    
    # Activity metrics
    sessions_count = Column(Integer, default=0)
    events_count = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('ix_user_retention_user_activity', 'user_id', 'activity_date'),
        Index('ix_user_retention_cohort_days', 'cohort_date', 'days_since_cohort'),
    )
