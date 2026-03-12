from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from src.dependencies.database import get_db
from src.services.ml_analytics_integration_service import MLAnalyticsIntegrationService
from src.schemas.ml_analytics_schemas import (
    UnifiedDashboardResponse,
    StudentMLInsightsResponse,
    ModelPerformanceAnalyticsResponse,
    PredictionAccuracyAnalysisRequest,
    PredictionAccuracyAnalysisResponse,
    MonitoringScheduleResponse
)

router = APIRouter(prefix="/ml-analytics", tags=["ML Analytics Integration"])


@router.get("/institutions/{institution_id}/unified-dashboard", response_model=UnifiedDashboardResponse)
async def get_unified_dashboard(
    institution_id: int,
    days: int = Query(default=7, ge=1, le=90, description="Number of days to analyze"),
    db: Session = Depends(get_db)
) -> UnifiedDashboardResponse:
    """
    Get unified dashboard combining traditional analytics with ML model monitoring.
    
    Provides a comprehensive view of:
    - Student performance metrics
    - ML model health and status
    - Prediction statistics
    - System-wide analytics
    """
    try:
        integration_service = MLAnalyticsIntegrationService(db)
        result = integration_service.get_unified_institution_dashboard(
            institution_id=institution_id,
            days=days
        )
        return UnifiedDashboardResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get unified dashboard: {str(e)}"
        )


@router.get("/students/{student_id}/ml-insights", response_model=StudentMLInsightsResponse)
async def get_student_ml_insights(
    institution_id: int,
    student_id: int,
    days: int = Query(default=30, ge=1, le=180, description="Number of days to analyze"),
    db: Session = Depends(get_db)
) -> StudentMLInsightsResponse:
    """
    Get ML insights for a specific student including:
    - Recent predictions
    - Prediction trends over time
    - Feature contributions
    - Confidence intervals
    """
    try:
        integration_service = MLAnalyticsIntegrationService(db)
        result = integration_service.get_student_ml_insights(
            institution_id=institution_id,
            student_id=student_id,
            days=days
        )
        return StudentMLInsightsResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get student ML insights: {str(e)}"
        )


@router.get("/models/{model_id}/performance-analytics", response_model=ModelPerformanceAnalyticsResponse)
async def get_model_performance_analytics(
    model_id: int,
    days: int = Query(default=30, ge=1, le=180, description="Number of days to analyze"),
    db: Session = Depends(get_db)
) -> ModelPerformanceAnalyticsResponse:
    """
    Get detailed performance analytics for a specific ML model:
    - Comprehensive monitoring report
    - Prediction timeline
    - Feature importance trends
    - Usage statistics
    """
    try:
        integration_service = MLAnalyticsIntegrationService(db)
        result = integration_service.get_model_performance_analytics(
            model_id=model_id,
            days=days
        )
        return ModelPerformanceAnalyticsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get model performance analytics: {str(e)}"
        )


@router.post("/models/{model_id}/accuracy-analysis", response_model=PredictionAccuracyAnalysisResponse)
async def analyze_prediction_accuracy(
    model_id: int,
    request: PredictionAccuracyAnalysisRequest,
    db: Session = Depends(get_db)
) -> PredictionAccuracyAnalysisResponse:
    """
    Analyze prediction accuracy by comparing predictions with actual results.
    
    Requires actual results to be provided for comparison.
    """
    try:
        integration_service = MLAnalyticsIntegrationService(db)
        result = integration_service.get_prediction_accuracy_analysis(
            model_id=model_id,
            actual_results=request.actual_results,
            days=request.days
        )
        return PredictionAccuracyAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze prediction accuracy: {str(e)}"
        )


@router.post("/institutions/{institution_id}/schedule-monitoring", response_model=MonitoringScheduleResponse)
async def schedule_monitoring_checks(
    institution_id: int,
    db: Session = Depends(get_db)
) -> MonitoringScheduleResponse:
    """
    Schedule routine monitoring checks for all active models in an institution.
    
    Returns a summary of model health and recommendations for retraining.
    """
    try:
        integration_service = MLAnalyticsIntegrationService(db)
        result = integration_service.schedule_monitoring_checks(
            institution_id=institution_id
        )
        return MonitoringScheduleResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule monitoring checks: {str(e)}"
        )
