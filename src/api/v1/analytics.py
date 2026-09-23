from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
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
def track_event(
    event: AnalyticsEventCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Track an analytics event."""
    if not event.user_agent:
        event.user_agent = request.headers.get("user-agent")
    if not event.ip_address:
        event.ip_address = request.client.host if request.client else None

    repo = AnalyticsRepository(db)
    return repo.create_event(event)


@router.post("/performance", response_model=PerformanceMetricResponse, status_code=201)
def track_performance_metric(
    metric: PerformanceMetricCreate,
    db: Session = Depends(get_db),
):
    """Track a performance metric."""
    repo = AnalyticsRepository(db)
    return repo.create_performance_metric(metric)


@router.post("/sessions", response_model=UserSessionResponse, status_code=201)
def create_or_update_session(
    session: UserSessionCreate,
    db: Session = Depends(get_db),
):
    """Create or update a user session."""
    repo = AnalyticsRepository(db)
    return repo.create_or_update_session(session)


@router.patch("/sessions/{session_id}", response_model=UserSessionResponse)
def update_session(
    session_id: str,
    update_data: UserSessionUpdate,
    db: Session = Depends(get_db),
):
    """Update a user session."""
    repo = AnalyticsRepository(db)
    updated = repo.update_session(session_id, update_data)
    if not updated:
        # The repository returns None for an unknown session_id, but
        # response_model=UserSessionResponse has no Optional/None case --
        # FastAPI raised an unhandled ResponseValidationError (500) trying
        # to serialize None against a schema with required fields, instead
        # of a clean 404.
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@router.post("/features", response_model=FeatureUsageResponse, status_code=201)
def track_feature_usage(
    feature: FeatureUsageCreate,
    db: Session = Depends(get_db),
):
    """Track feature usage."""
    repo = AnalyticsRepository(db)
    return repo.track_feature_usage(feature)


@router.post("/batch", status_code=202)
def track_batch_analytics(
    batch: BatchAnalyticsRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Track multiple analytics events and metrics in a batch."""
    repo = AnalyticsRepository(db)

    # Process events
    for event in batch.events:
        if not event.user_agent:
            event.user_agent = request.headers.get("user-agent")
        if not event.ip_address:
            event.ip_address = request.client.host if request.client else None
        repo.create_event(event)

    # Process performance metrics
    for metric in batch.performance_metrics:
        repo.create_performance_metric(metric)

    return {
        "status": "accepted",
        "events_count": len(batch.events),
        "metrics_count": len(batch.performance_metrics),
    }


@router.get("/dashboard", response_model=AnalyticsDashboardStats)
def get_dashboard_stats(
    institution_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    """Get dashboard statistics."""
    repo = AnalyticsRepository(db)
    stats = repo.get_dashboard_stats(institution_id)
    return AnalyticsDashboardStats(**stats)


@router.get("/features/adoption", response_model=List[FeatureAdoptionStats])
def get_feature_adoption(
    institution_id: Optional[UUID] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Get feature adoption statistics."""
    repo = AnalyticsRepository(db)
    stats = repo.get_feature_adoption_stats(institution_id, limit)
    return [FeatureAdoptionStats(**stat) for stat in stats]


@router.get("/user-flow", response_model=UserFlowAnalysis)
def get_user_flow(
    institution_id: Optional[UUID] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get user flow analysis."""
    repo = AnalyticsRepository(db)
    return repo.get_user_flow_analysis(institution_id, limit)


@router.get("/retention/cohorts", response_model=List[RetentionCohort])
def get_retention_cohorts(
    institution_id: Optional[UUID] = None,
    cohort_days: int = 30,
    db: Session = Depends(get_db),
):
    """Get user retention by cohort."""
    repo = AnalyticsRepository(db)
    cohorts = repo.get_retention_cohorts(institution_id, cohort_days)
    return [RetentionCohort(**cohort) for cohort in cohorts]


@router.get("/events/top", response_model=List[TopEventStats])
def get_top_events(
    institution_id: Optional[UUID] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Get top analytics events."""
    repo = AnalyticsRepository(db)
    events = repo.get_top_events(institution_id, limit)
    return [TopEventStats(**event) for event in events]


@router.get("/performance/stats", response_model=List[PerformanceStats])
def get_performance_stats(
    metric_name: Optional[str] = None,
    days: int = 7,
    db: Session = Depends(get_db),
):
    """Get performance statistics."""
    repo = AnalyticsRepository(db)
    stats = repo.get_performance_stats(metric_name, days)
    return [PerformanceStats(**stat) for stat in stats]


class TrackEventsBatchRequest(BaseModel):
    events: List[dict]


class TrackPerformanceBatchRequest(BaseModel):
    metrics: List[dict]


@router.post("/track", status_code=202)
def track_events_batch(
    request_data: TrackEventsBatchRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Track multiple analytics events from mobile app."""
    repo = AnalyticsRepository(db)

    processed_events = []
    for event_data in request_data.events:
        try:
            event = AnalyticsEventCreate(
                event_name=event_data.get("event_name"),
                # AnalyticsEventCreate's required field is `event_type`, and
                # its free-form JSON payload field is `properties` -- not
                # `event_category`/`event_properties` as this mobile payload
                # names them. Passing the mobile names straight through used
                # to leave `event_type` (required, no default) unset on
                # every single item, so every mobile event batch always
                # raised a ValidationError here (silently swallowed by the
                # `except Exception: continue` below) and never persisted
                # anything, always reporting `processed_count: 0`.
                event_type=event_data.get("event_type") or event_data.get("event_category"),
                properties=event_data.get("properties") or event_data.get("event_properties", {}),
                user_id=event_data.get("user_id"),
                session_id=event_data.get("session_id"),
                institution_id=event_data.get("institution_id"),
                user_agent=event_data.get("user_agent") or request.headers.get("user-agent"),
                ip_address=event_data.get("ip_address") or (request.client.host if request.client else None),
            )
            repo.create_event(event)
            processed_events.append(event_data.get("event_name"))
        except Exception as e:
            print(f"Error processing event: {e}")
            continue

    return {
        "status": "accepted",
        "processed_count": len(processed_events),
        "total_count": len(request_data.events),
    }


@router.post("/performance/batch", status_code=202)
def track_performance_batch(
    request_data: TrackPerformanceBatchRequest,
    db: Session = Depends(get_db),
):
    """Track multiple performance metrics from mobile app.

    NOTE: this used to be registered at `POST /performance` -- the exact
    same path+method as `track_performance_metric` above. FastAPI/Starlette
    routes purely by path+method in registration order, with no fallback to
    a later handler when the matched one's body fails validation, so this
    entire endpoint was permanently unreachable: every request landed on
    `track_performance_metric` (and 422'd there, since its body shape is
    `PerformanceMetricCreate`, not `{"metrics": [...]}`). Moved to its own
    path, mirroring how the equivalent mobile events-batch endpoint already
    has its own distinct `/track` path rather than colliding with `/events`.
    """
    repo = AnalyticsRepository(db)

    processed_metrics = []
    for metric_data in request_data.metrics:
        try:
            metric = PerformanceMetricCreate(
                metric_name=metric_data.get("metric_name"),
                # PerformanceMetricCreate's required field is `metric_value`,
                # not `value` -- same shape of bug as the events batch above:
                # every item used to fail required-field validation and
                # `processed_count` was always 0.
                metric_value=metric_data.get("metric_value", metric_data.get("value")),
                user_id=metric_data.get("user_id"),
                session_id=metric_data.get("session_id"),
                url=metric_data.get("url"),
                rating=metric_data.get("rating"),
                metadata=metric_data.get("metadata", {}),
            )
            repo.create_performance_metric(metric)
            processed_metrics.append(metric_data.get("metric_name"))
        except Exception as e:
            print(f"Error processing metric: {e}")
            continue

    return {
        "status": "accepted",
        "processed_count": len(processed_metrics),
        "total_count": len(request_data.metrics),
    }
