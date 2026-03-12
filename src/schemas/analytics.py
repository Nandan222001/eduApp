from datetime import datetime
from typing import Optional, Any, Dict, List
from uuid import UUID
from pydantic import BaseModel, Field


class AnalyticsEventCreate(BaseModel):
    event_name: str = Field(..., max_length=255)
    event_type: str = Field(..., max_length=50)
    user_id: Optional[UUID] = None
    session_id: Optional[str] = None
    institution_id: Optional[UUID] = None
    properties: Optional[Dict[str, Any]] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    referrer: Optional[str] = None
    url: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None


class AnalyticsEventResponse(BaseModel):
    id: UUID
    event_name: str
    event_type: str
    user_id: Optional[UUID]
    session_id: Optional[str]
    properties: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class PerformanceMetricCreate(BaseModel):
    metric_name: str = Field(..., max_length=100)
    metric_value: float
    user_id: Optional[UUID] = None
    session_id: Optional[str] = None
    url: Optional[str] = None
    rating: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PerformanceMetricResponse(BaseModel):
    id: UUID
    metric_name: str
    metric_value: float
    rating: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserSessionCreate(BaseModel):
    session_id: str
    user_id: Optional[UUID] = None
    institution_id: Optional[UUID] = None
    landing_page: Optional[str] = None
    referrer: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None


class UserSessionUpdate(BaseModel):
    last_seen: Optional[datetime] = None
    page_views: Optional[int] = None
    events_count: Optional[int] = None
    exit_page: Optional[str] = None


class UserSessionResponse(BaseModel):
    id: UUID
    session_id: str
    user_id: Optional[UUID]
    first_seen: datetime
    last_seen: datetime
    page_views: int
    events_count: int
    landing_page: Optional[str]
    device_type: Optional[str]

    class Config:
        from_attributes = True


class FeatureUsageCreate(BaseModel):
    feature_name: str
    user_id: Optional[UUID] = None
    institution_id: Optional[UUID] = None
    properties: Optional[Dict[str, Any]] = None


class FeatureUsageResponse(BaseModel):
    id: UUID
    feature_name: str
    user_id: Optional[UUID]
    usage_count: int
    first_used_at: datetime
    last_used_at: datetime

    class Config:
        from_attributes = True


class BatchAnalyticsRequest(BaseModel):
    events: List[AnalyticsEventCreate] = Field(default_factory=list)
    performance_metrics: List[PerformanceMetricCreate] = Field(default_factory=list)


class AnalyticsDashboardStats(BaseModel):
    total_users: int
    active_users_today: int
    active_users_week: int
    active_users_month: int
    total_sessions: int
    avg_session_duration: float
    total_page_views: int
    avg_pages_per_session: float


class FeatureAdoptionStats(BaseModel):
    feature_name: str
    total_users: int
    total_usage: int
    unique_users_today: int
    unique_users_week: int
    unique_users_month: int
    adoption_rate: float


class UserFlowNode(BaseModel):
    page: str
    count: int
    drop_off_rate: float


class UserFlowAnalysis(BaseModel):
    nodes: List[UserFlowNode]
    total_sessions: int


class RetentionCohort(BaseModel):
    cohort_date: str
    users_count: int
    retention_day_1: float
    retention_day_7: float
    retention_day_14: float
    retention_day_30: float


class TopEventStats(BaseModel):
    event_name: str
    event_type: str
    count: int
    unique_users: int


class PerformanceStats(BaseModel):
    metric_name: str
    avg_value: float
    p50_value: float
    p75_value: float
    p95_value: float
    good_count: int
    needs_improvement_count: int
    poor_count: int
