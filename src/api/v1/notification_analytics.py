from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from src.database import get_db
from src.models.user import User
from src.services.notification_analytics_service import NotificationAnalyticsService
from src.dependencies.auth import get_current_user

router = APIRouter()


@router.get("/delivery-metrics")
def get_delivery_metrics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    channel: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification delivery metrics"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_delivery_metrics(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date,
        channel=channel
    )


@router.get("/engagement-metrics")
def get_engagement_metrics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification engagement metrics"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_engagement_metrics(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/channel-breakdown")
def get_channel_breakdown(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get metrics broken down by notification channel"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_channel_breakdown(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/priority-breakdown")
def get_priority_breakdown(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get metrics broken down by notification priority"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_priority_breakdown(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/group-breakdown")
def get_group_breakdown(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get metrics broken down by notification group"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_group_breakdown(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/timing-metrics")
def get_timing_metrics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get timing metrics (delivery time, read time)"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_timing_metrics(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/timeline")
def get_timeline_data(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    granularity: str = Query("day", regex="^(hour|day)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get time-series data for notifications"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_timeline_data(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date,
        granularity=granularity
    )


@router.get("/top-types")
def get_top_notification_types(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most sent notification types"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_top_notification_types(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )


@router.get("/user-engagement")
def get_user_engagement_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get engagement summary for current user"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_user_engagement_summary(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/provider-stats")
def get_delivery_provider_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics per delivery provider/channel"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    return service.get_delivery_provider_stats(
        institution_id=current_user.institution_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/dashboard")
def get_analytics_dashboard(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics dashboard data"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    service = NotificationAnalyticsService(db)
    
    return {
        "delivery_metrics": service.get_delivery_metrics(
            current_user.institution_id, start_date, end_date
        ),
        "engagement_metrics": service.get_engagement_metrics(
            current_user.institution_id, start_date, end_date
        ),
        "channel_breakdown": service.get_channel_breakdown(
            current_user.institution_id, start_date, end_date
        ),
        "priority_breakdown": service.get_priority_breakdown(
            current_user.institution_id, start_date, end_date
        ),
        "group_breakdown": service.get_group_breakdown(
            current_user.institution_id, start_date, end_date
        ),
        "timing_metrics": service.get_timing_metrics(
            current_user.institution_id, start_date, end_date
        ),
        "top_types": service.get_top_notification_types(
            current_user.institution_id, start_date, end_date, limit=5
        ),
        "timeline": service.get_timeline_data(
            current_user.institution_id, start_date, end_date, granularity="day"
        )
    }
