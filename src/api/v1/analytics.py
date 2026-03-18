from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
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


class TrackEventsBatchRequest(BaseModel):
    events: List[dict]


class TrackPerformanceBatchRequest(BaseModel):
    metrics: List[dict]


@router.post("/track", status_code=202)
async def track_events_batch(
    request_data: TrackEventsBatchRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Track multiple analytics events from mobile app."""
    repo = AnalyticsRepository(db)
    
    processed_events = []
    for event_data in request_data.events:
        try:
            event = AnalyticsEventCreate(
                event_name=event_data.get("event_name"),
                event_category=event_data.get("event_category"),
                event_properties=event_data.get("event_properties", {}),
                user_id=event_data.get("user_id"),
                session_id=event_data.get("session_id"),
                user_agent=event_data.get("user_agent") or request.headers.get("user-agent"),
                ip_address=event_data.get("ip_address") or (request.client.host if request.client else None),
                timestamp=event_data.get("timestamp"),
            )
            await repo.create_event(event)
            processed_events.append(event_data.get("event_name"))
        except Exception as e:
            print(f"Error processing event: {e}")
            continue
    
    return {
        "status": "accepted",
        "processed_count": len(processed_events),
        "total_count": len(request_data.events),
    }


@router.post("/performance", status_code=202)
async def track_performance_batch(
    request_data: TrackPerformanceBatchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Track multiple performance metrics from mobile app."""
    repo = AnalyticsRepository(db)
    
    processed_metrics = []
    for metric_data in request_data.metrics:
        try:
            metric = PerformanceMetricCreate(
                metric_name=metric_data.get("metric_name"),
                metric_type=metric_data.get("metric_type"),
                value=metric_data.get("value"),
                unit=metric_data.get("unit"),
                metadata=metric_data.get("metadata", {}),
                timestamp=metric_data.get("timestamp"),
            )
            await repo.create_performance_metric(metric)
            processed_metrics.append(metric_data.get("metric_name"))
        except Exception as e:
            print(f"Error processing metric: {e}")
            continue
    
    return {
        "status": "accepted",
        "processed_count": len(processed_metrics),
        "total_count": len(request_data.metrics),
    }
