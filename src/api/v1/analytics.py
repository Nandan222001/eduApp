from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.repositories.analytics_repository import AnalyticsRepository
from src.schemas.analytics import (
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    PerformanceMetricCreate,
    PerformanceMetricResponse,
    UserSessionCreate,
    UserSessionUpdate,
    UserSessionResponse,
    FeatureUsageCreate,
    FeatureUsageResponse,
    BatchAnalyticsRequest,
    AnalyticsDashboardStats,
    FeatureAdoptionStats,
    UserFlowAnalysis,
    RetentionCohort,
    TopEventStats,
    PerformanceStats,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/events", response_model=AnalyticsEventResponse, status_code=201)
async def track_event(
    event: AnalyticsEventCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Track an analytics event."""
    if not event.user_agent:
        event.user_agent = request.headers.get("user-agent")
    if not event.ip_address:
        event.ip_address = request.client.host if request.client else None
    
    repo = AnalyticsRepository(db)
    return await repo.create_event(event)


@router.post("/performance", response_model=PerformanceMetricResponse, status_code=201)
async def track_performance_metric(
    metric: PerformanceMetricCreate,
    db: AsyncSession = Depends(get_db),
):
    """Track a performance metric."""
    repo = AnalyticsRepository(db)
    return await repo.create_performance_metric(metric)


@router.post("/sessions", response_model=UserSessionResponse, status_code=201)
async def create_or_update_session(
    session: UserSessionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create or update a user session."""
    repo = AnalyticsRepository(db)
    return await repo.create_or_update_session(session)


@router.patch("/sessions/{session_id}", response_model=UserSessionResponse)
async def update_session(
    session_id: str,
    update_data: UserSessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a user session."""
    repo = AnalyticsRepository(db)
    return await repo.update_session(session_id, update_data)


@router.post("/features", response_model=FeatureUsageResponse, status_code=201)
async def track_feature_usage(
    feature: FeatureUsageCreate,
    db: AsyncSession = Depends(get_db),
):
    """Track feature usage."""
    repo = AnalyticsRepository(db)
    return await repo.track_feature_usage(feature)


@router.post("/batch", status_code=202)
async def track_batch_analytics(
    batch: BatchAnalyticsRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Track multiple analytics events and metrics in a batch."""
    repo = AnalyticsRepository(db)
    
    # Process events
    for event in batch.events:
        if not event.user_agent:
            event.user_agent = request.headers.get("user-agent")
        if not event.ip_address:
            event.ip_address = request.client.host if request.client else None
        await repo.create_event(event)
    
    # Process performance metrics
    for metric in batch.performance_metrics:
        await repo.create_performance_metric(metric)
    
    return {
        "status": "accepted",
        "events_count": len(batch.events),
        "metrics_count": len(batch.performance_metrics),
    }


@router.get("/dashboard", response_model=AnalyticsDashboardStats)
async def get_dashboard_stats(
    institution_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics."""
    repo = AnalyticsRepository(db)
    stats = await repo.get_dashboard_stats(institution_id)
    return AnalyticsDashboardStats(**stats)


@router.get("/features/adoption", response_model=List[FeatureAdoptionStats])
async def get_feature_adoption(
    institution_id: Optional[UUID] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Get feature adoption statistics."""
    repo = AnalyticsRepository(db)
    stats = await repo.get_feature_adoption_stats(institution_id, limit)
    return [FeatureAdoptionStats(**stat) for stat in stats]


@router.get("/user-flow", response_model=UserFlowAnalysis)
async def get_user_flow(
    institution_id: Optional[UUID] = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """Get user flow analysis."""
    repo = AnalyticsRepository(db)
    return await repo.get_user_flow_analysis(institution_id, limit)


@router.get("/retention/cohorts", response_model=List[RetentionCohort])
async def get_retention_cohorts(
    institution_id: Optional[UUID] = None,
    cohort_days: int = 30,
    db: AsyncSession = Depends(get_db),
):
    """Get user retention by cohort."""
    repo = AnalyticsRepository(db)
    cohorts = await repo.get_retention_cohorts(institution_id, cohort_days)
    return [RetentionCohort(**cohort) for cohort in cohorts]


@router.get("/events/top", response_model=List[TopEventStats])
async def get_top_events(
    institution_id: Optional[UUID] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Get top analytics events."""
    repo = AnalyticsRepository(db)
    events = await repo.get_top_events(institution_id, limit)
    return [TopEventStats(**event) for event in events]


@router.get("/performance/stats", response_model=List[PerformanceStats])
async def get_performance_stats(
    metric_name: Optional[str] = None,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
):
    """Get performance statistics."""
    repo = AnalyticsRepository(db)
    stats = await repo.get_performance_stats(metric_name, days)
    return [PerformanceStats(**stat) for stat in stats]
