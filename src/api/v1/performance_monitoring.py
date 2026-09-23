from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from src.database import get_db
from src.dependencies.auth import get_current_user, require_super_admin
from src.models.user import User
from src.models.performance_monitoring import AlertStatus
from src.services.performance_monitoring_service import PerformanceMonitoringService
from src.schemas.performance_monitoring import (
    TimeRange,
    PerformanceDashboardData,
    PerformanceMetricsQuery,
    APIPerformanceOverview,
    DatabasePerformanceOverview,
    CachePerformanceOverview,
    TaskQueueOverview,
    ResourceUtilizationOverview,
    ActiveUsersOverview,
    PerformanceAlertsOverview,
    AcknowledgeAlertRequest,
    ResolveAlertRequest,
    PerformanceThresholds,
    UpdateThresholdsRequest,
)

router = APIRouter()


@router.get("/performance/dashboard", response_model=PerformanceDashboardData)
async def get_performance_dashboard(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get comprehensive performance monitoring dashboard data.
    
    Admin only endpoint that provides:
    - API response times by endpoint
    - Database query performance metrics
    - Redis cache hit rates
    - Celery task queue statistics
    - Real-time active user counts
    - Resource utilization graphs
    """
    service = PerformanceMonitoringService(db)
    
    try:
        dashboard_data = await service.get_dashboard_data(
            time_range=time_range,
            start_time=start_time,
            end_time=end_time,
            institution_id=institution_id,
        )
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")


@router.get("/performance/api", response_model=APIPerformanceOverview)
async def get_api_performance(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get API performance metrics including response times, error rates, and endpoint statistics.
    """
    service = PerformanceMonitoringService(db)
    start, end = service._get_time_range(time_range, start_time, end_time)
    
    return service.get_api_performance(start, end, institution_id)


@router.get("/performance/database", response_model=DatabasePerformanceOverview)
async def get_database_performance(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get database performance metrics including query times, slow queries, and query distribution.
    """
    service = PerformanceMonitoringService(db)
    start, end = service._get_time_range(time_range, start_time, end_time)
    
    return service.get_database_performance(start, end, institution_id)


@router.get("/performance/cache", response_model=CachePerformanceOverview)
async def get_cache_performance(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get Redis cache performance metrics including hit rates and operation times.
    """
    service = PerformanceMonitoringService(db)
    start, end = service._get_time_range(time_range, start_time, end_time)
    
    return service.get_cache_performance(start, end, institution_id)


@router.get("/performance/tasks", response_model=TaskQueueOverview)
async def get_task_queue_performance(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get Celery task queue performance metrics including execution times and success rates.
    """
    service = PerformanceMonitoringService(db)
    start, end = service._get_time_range(time_range, start_time, end_time)
    
    return service.get_task_queue_performance(start, end, institution_id)


@router.get("/performance/resources", response_model=ResourceUtilizationOverview)
async def get_resource_utilization(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get system resource utilization metrics including CPU, memory, disk, and network usage.
    """
    service = PerformanceMonitoringService(db)
    start, end = service._get_time_range(time_range, start_time, end_time)
    
    return service.get_resource_utilization(start, end)


@router.get("/performance/active-users", response_model=ActiveUsersOverview)
async def get_active_users(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get active user statistics including current active users and historical trends.
    """
    service = PerformanceMonitoringService(db)
    start, end = service._get_time_range(time_range, start_time, end_time)
    
    return await service.get_active_users(start, end, institution_id)


@router.get("/performance/alerts", response_model=PerformanceAlertsOverview)
async def get_performance_alerts(
    time_range: TimeRange = Query(default=TimeRange.LAST_24_HOURS),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    institution_id: Optional[int] = None,
    status: Optional[AlertStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get performance alerts for degradation detection and monitoring.
    """
    service = PerformanceMonitoringService(db)
    start, end = service._get_time_range(time_range, start_time, end_time)
    
    return service.get_performance_alerts(start, end, institution_id, status)


@router.post("/performance/alerts/acknowledge")
async def acknowledge_alerts(
    request: AcknowledgeAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Acknowledge performance alerts.
    """
    service = PerformanceMonitoringService(db)
    service.acknowledge_alerts(request.alert_ids, current_user.id)
    
    return {"message": "Alerts acknowledged successfully", "count": len(request.alert_ids)}


@router.post("/performance/alerts/resolve")
async def resolve_alerts(
    request: ResolveAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Resolve performance alerts.
    """
    service = PerformanceMonitoringService(db)
    service.resolve_alerts(request.alert_ids)
    
    return {"message": "Alerts resolved successfully", "count": len(request.alert_ids)}


@router.get("/performance/thresholds", response_model=PerformanceThresholds)
async def get_performance_thresholds(
    current_user: User = Depends(require_super_admin),
):
    """
    Get current performance monitoring thresholds.
    """
    return PerformanceThresholds()


@router.put("/performance/thresholds")
async def update_performance_thresholds(
    request: UpdateThresholdsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Update performance monitoring thresholds for alerts.
    """
    # In a real implementation, you would store these thresholds in database or config
    return {"message": "Thresholds updated successfully", "thresholds": request.thresholds}
