from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime

from src.dependencies.database import get_db
from src.ml.model_monitoring import ModelMonitoringService, MonitoringDashboardService
from src.schemas.ml_monitoring_schemas import (
    PredictionDriftResponse,
    FeatureDriftResponse,
    PerformanceDegradationResponse,
    ConfidenceTrendsResponse,
    ComprehensiveMonitoringReportResponse,
    AutoRetrainingResponse,
    MonitoringOverviewResponse,
    PredictionTimelineResponse,
    FeatureImportanceTrendsResponse,
    TriggerRetrainingRequest
)

router = APIRouter(prefix="/ml-monitoring", tags=["ML Model Monitoring"])


@router.get("/models/{model_id}/drift/predictions", response_model=PredictionDriftResponse)
async def check_prediction_drift(
    model_id: int,
    recent_days: int = Query(default=7, ge=1, le=90, description="Number of recent days to analyze"),
    use_baseline: bool = Query(default=True, description="Use historical baseline for comparison"),
    db: Session = Depends(get_db)
) -> PredictionDriftResponse:
    """
    Detect drift in prediction distributions by comparing recent predictions
    to training distribution or historical baseline.
    """
    try:
        monitoring_service = ModelMonitoringService(db)
        result = monitoring_service.detect_prediction_drift(
            model_id=model_id,
            recent_days=recent_days,
            use_baseline=use_baseline
        )
        return PredictionDriftResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect prediction drift: {str(e)}"
        )


@router.get("/models/{model_id}/drift/features", response_model=FeatureDriftResponse)
async def check_feature_drift(
    model_id: int,
    recent_days: int = Query(default=7, ge=1, le=90, description="Number of recent days to analyze"),
    db: Session = Depends(get_db)
) -> FeatureDriftResponse:
    """
    Monitor drift in input feature distributions by comparing recent features
    to baseline distributions.
    """
    try:
        monitoring_service = ModelMonitoringService(db)
        result = monitoring_service.detect_feature_drift(
            model_id=model_id,
            recent_days=recent_days
        )
        return FeatureDriftResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect feature drift: {str(e)}"
        )


@router.get("/models/{model_id}/performance/degradation", response_model=PerformanceDegradationResponse)
async def check_performance_degradation(
    model_id: int,
    recent_days: int = Query(default=7, ge=1, le=90, description="Number of recent days to analyze"),
    db: Session = Depends(get_db)
) -> PerformanceDegradationResponse:
    """
    Monitor model performance degradation by comparing recent performance
    to baseline metrics.
    
    Note: Actual values can be provided for more accurate performance monitoring.
    """
    try:
        monitoring_service = ModelMonitoringService(db)
        result = monitoring_service.monitor_performance_degradation(
            model_id=model_id,
            recent_days=recent_days,
            actual_values=None
        )
        return PerformanceDegradationResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check performance degradation: {str(e)}"
        )


@router.get("/models/{model_id}/confidence/trends", response_model=ConfidenceTrendsResponse)
async def analyze_confidence_trends(
    model_id: int,
    days: int = Query(default=30, ge=7, le=180, description="Number of days to analyze"),
    db: Session = Depends(get_db)
) -> ConfidenceTrendsResponse:
    """
    Analyze trends in prediction confidence over time to identify
    potential model uncertainty issues.
    """
    try:
        monitoring_service = ModelMonitoringService(db)
        result = monitoring_service.analyze_confidence_trends(
            model_id=model_id,
            days=days
        )
        return ConfidenceTrendsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze confidence trends: {str(e)}"
        )


@router.get("/models/{model_id}/report/comprehensive", response_model=ComprehensiveMonitoringReportResponse)
async def get_comprehensive_monitoring_report(
    model_id: int,
    recent_days: int = Query(default=7, ge=1, le=90, description="Number of recent days to analyze"),
    db: Session = Depends(get_db)
) -> ComprehensiveMonitoringReportResponse:
    """
    Generate a comprehensive monitoring report combining all metrics:
    - Prediction drift detection
    - Feature drift monitoring
    - Performance degradation
    - Confidence trend analysis
    - Retraining recommendations
    """
    try:
        monitoring_service = ModelMonitoringService(db)
        result = monitoring_service.comprehensive_monitoring_report(
            model_id=model_id,
            recent_days=recent_days,
            actual_values=None
        )
        return ComprehensiveMonitoringReportResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate comprehensive report: {str(e)}"
        )


@router.post("/models/{model_id}/retraining/trigger", response_model=AutoRetrainingResponse)
async def trigger_automatic_retraining(
    model_id: int,
    request: TriggerRetrainingRequest,
    db: Session = Depends(get_db)
) -> AutoRetrainingResponse:
    """
    Trigger automatic model retraining when performance drops below threshold.
    
    This endpoint will:
    1. Train a new model version with current data
    2. Optionally auto-promote if it performs better than the current champion
    """
    try:
        monitoring_service = ModelMonitoringService(db)
        result = monitoring_service.trigger_automatic_retraining(
            model_id=model_id,
            deployed_by=request.deployed_by,
            auto_promote=request.auto_promote
        )
        return AutoRetrainingResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger automatic retraining: {str(e)}"
        )


@router.get("/institutions/{institution_id}/overview", response_model=MonitoringOverviewResponse)
async def get_institution_monitoring_overview(
    institution_id: int,
    days: int = Query(default=7, ge=1, le=90, description="Number of days to analyze"),
    db: Session = Depends(get_db)
) -> MonitoringOverviewResponse:
    """
    Get monitoring overview for all models in an institution.
    
    Provides a high-level dashboard view of model health across
    all active models.
    """
    try:
        dashboard_service = MonitoringDashboardService(db)
        result = dashboard_service.get_model_monitoring_overview(
            institution_id=institution_id,
            days=days
        )
        return MonitoringOverviewResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get monitoring overview: {str(e)}"
        )


@router.get("/models/{model_id}/timeline/predictions", response_model=PredictionTimelineResponse)
async def get_prediction_timeline(
    model_id: int,
    days: int = Query(default=30, ge=7, le=180, description="Number of days to include"),
    db: Session = Depends(get_db)
) -> PredictionTimelineResponse:
    """
    Get prediction timeline for visualization showing daily prediction
    statistics and trends over time.
    """
    try:
        dashboard_service = MonitoringDashboardService(db)
        result = dashboard_service.get_model_prediction_timeline(
            model_id=model_id,
            days=days
        )
        return PredictionTimelineResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get prediction timeline: {str(e)}"
        )


@router.get("/models/{model_id}/features/importance-trends", response_model=FeatureImportanceTrendsResponse)
async def get_feature_importance_trends(
    model_id: int,
    db: Session = Depends(get_db)
) -> FeatureImportanceTrendsResponse:
    """
    Get feature importance trends across model versions to understand
    how feature contributions change over time.
    """
    try:
        dashboard_service = MonitoringDashboardService(db)
        result = dashboard_service.get_feature_importance_trends(
            model_id=model_id
        )
        return FeatureImportanceTrendsResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feature importance trends: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring service"""
    return {
        "status": "healthy",
        "service": "ml-monitoring",
        "timestamp": datetime.utcnow().isoformat()
    }
