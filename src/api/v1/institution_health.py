from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from src.database import get_db
from src.dependencies.auth import get_current_user, require_super_admin
from src.models.user import User
from src.models.institution import Institution
from src.models.institution_health import (
    InstitutionHealthScore,
    InstitutionHealthAlert,
    InstitutionHealthHistory
)
from src.schemas.institution_health import (
    InstitutionHealthScoreResponse,
    HealthAlertResponse,
    HealthHistoryResponse,
    InstitutionHealthDashboard,
    HealthScoreListItem,
    HealthScoreListResponse,
    ChurnPredictionResponse,
    AlertResolveRequest,
    AlertCreateRequest,
    HealthTrendAnalysis,
    ModelPerformanceMetrics,
    RetrainModelRequest,
    RiskFactorItem,
    RecommendedAction
)
from src.services.institution_health_service import InstitutionHealthService
from datetime import datetime, timedelta

router = APIRouter(prefix="/institution-health", tags=["Institution Health"])


@router.get("/dashboard", response_model=HealthScoreListResponse)
async def get_health_dashboard(
    risk_level: Optional[str] = Query(None),
    min_churn_prob: Optional[float] = Query(None, ge=0, le=1),
    sort_by: str = Query("churn_risk_score", regex="^(churn_risk_score|overall_health_score|last_calculated_at)$"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> HealthScoreListResponse:
    """Get health scores dashboard for all institutions."""
    service = InstitutionHealthService(db)
    
    health_scores = service.get_all_health_scores(
        risk_level=risk_level,
        min_churn_prob=min_churn_prob,
        sort_by=sort_by,
        limit=200
    )
    
    items = []
    for hs in health_scores:
        institution = db.query(Institution).filter(
            Institution.id == hs.institution_id
        ).first()
        
        active_alerts_count = db.query(func.count(InstitutionHealthAlert.id)).filter(
            and_(
                InstitutionHealthAlert.health_score_id == hs.id,
                InstitutionHealthAlert.is_resolved == False
            )
        ).scalar() or 0
        
        items.append(HealthScoreListItem(
            institution_id=hs.institution_id,
            institution_name=institution.name if institution else "Unknown",
            overall_health_score=hs.overall_health_score,
            churn_risk_score=hs.churn_risk_score,
            risk_level=hs.risk_level,
            health_trend=hs.health_trend,
            active_alerts_count=active_alerts_count,
            last_calculated_at=hs.last_calculated_at
        ))
    
    total = len(items)
    critical_count = len([i for i in items if i.risk_level == "critical"])
    high_risk_count = len([i for i in items if i.risk_level == "high"])
    medium_risk_count = len([i for i in items if i.risk_level == "medium"])
    low_risk_count = len([i for i in items if i.risk_level == "low"])
    
    return HealthScoreListResponse(
        items=items,
        total=total,
        critical_count=critical_count,
        high_risk_count=high_risk_count,
        medium_risk_count=medium_risk_count,
        low_risk_count=low_risk_count
    )


@router.get("/institutions/{institution_id}", response_model=InstitutionHealthDashboard)
async def get_institution_health(
    institution_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> InstitutionHealthDashboard:
    """Get detailed health information for a specific institution."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    health_score = db.query(InstitutionHealthScore).filter(
        InstitutionHealthScore.institution_id == institution_id
    ).first()
    
    if not health_score:
        service = InstitutionHealthService(db)
        health_score = service.calculate_health_score(institution_id)
    
    risk_factors = [
        RiskFactorItem(**rf) for rf in (health_score.risk_factors or [])
    ]
    
    recommended_actions = [
        RecommendedAction(**ra) for ra in (health_score.recommended_actions or [])
    ]
    
    health_response = InstitutionHealthScoreResponse(
        id=health_score.id,
        institution_id=health_score.institution_id,
        institution_name=institution.name,
        overall_health_score=health_score.overall_health_score,
        payment_health_score=health_score.payment_health_score,
        user_activity_score=health_score.user_activity_score,
        support_ticket_score=health_score.support_ticket_score,
        feature_adoption_score=health_score.feature_adoption_score,
        data_quality_score=health_score.data_quality_score,
        churn_risk_score=health_score.churn_risk_score,
        churn_probability=health_score.churn_probability,
        risk_level=health_score.risk_level,
        health_trend=health_score.health_trend,
        previous_score=health_score.previous_score,
        score_change_percentage=health_score.score_change_percentage,
        risk_factors=risk_factors,
        recommended_actions=recommended_actions,
        last_calculated_at=health_score.last_calculated_at
    )
    
    active_alerts = db.query(InstitutionHealthAlert).filter(
        and_(
            InstitutionHealthAlert.institution_id == institution_id,
            InstitutionHealthAlert.is_resolved == False
        )
    ).order_by(desc(InstitutionHealthAlert.created_at)).all()
    
    alert_responses = [
        HealthAlertResponse(
            id=alert.id,
            institution_id=alert.institution_id,
            alert_type=alert.alert_type,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            metric_name=alert.metric_name,
            threshold_value=alert.threshold_value,
            current_value=alert.current_value,
            is_resolved=alert.is_resolved,
            resolved_at=alert.resolved_at,
            notification_sent=alert.notification_sent,
            created_at=alert.created_at
        )
        for alert in active_alerts
    ]
    
    history = db.query(InstitutionHealthHistory).filter(
        InstitutionHealthHistory.institution_id == institution_id
    ).order_by(desc(InstitutionHealthHistory.recorded_at)).limit(30).all()
    
    history_responses = [
        HealthHistoryResponse(
            recorded_at=h.recorded_at,
            overall_health_score=h.overall_health_score,
            payment_health_score=h.payment_health_score,
            user_activity_score=h.user_activity_score,
            support_ticket_score=h.support_ticket_score,
            feature_adoption_score=h.feature_adoption_score,
            data_quality_score=h.data_quality_score,
            churn_risk_score=h.churn_risk_score,
            risk_level=h.risk_level
        )
        for h in reversed(history)
    ]
    
    return InstitutionHealthDashboard(
        health_score=health_response,
        active_alerts=alert_responses,
        health_history=history_responses,
        metrics_breakdown=health_score.metrics_data or {}
    )


@router.post("/institutions/{institution_id}/calculate", response_model=InstitutionHealthScoreResponse)
async def calculate_health_score(
    institution_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> InstitutionHealthScoreResponse:
    """Manually trigger health score calculation for an institution."""
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    service = InstitutionHealthService(db)
    health_score = service.calculate_health_score(institution_id)
    
    risk_factors = [
        RiskFactorItem(**rf) for rf in (health_score.risk_factors or [])
    ]
    
    recommended_actions = [
        RecommendedAction(**ra) for ra in (health_score.recommended_actions or [])
    ]
    
    return InstitutionHealthScoreResponse(
        id=health_score.id,
        institution_id=health_score.institution_id,
        institution_name=institution.name,
        overall_health_score=health_score.overall_health_score,
        payment_health_score=health_score.payment_health_score,
        user_activity_score=health_score.user_activity_score,
        support_ticket_score=health_score.support_ticket_score,
        feature_adoption_score=health_score.feature_adoption_score,
        data_quality_score=health_score.data_quality_score,
        churn_risk_score=health_score.churn_risk_score,
        churn_probability=health_score.churn_probability,
        risk_level=health_score.risk_level,
        health_trend=health_score.health_trend,
        previous_score=health_score.previous_score,
        score_change_percentage=health_score.score_change_percentage,
        risk_factors=risk_factors,
        recommended_actions=recommended_actions,
        last_calculated_at=health_score.last_calculated_at
    )


@router.post("/calculate-all")
async def calculate_all_health_scores(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Calculate health scores for all active institutions."""
    institutions = db.query(Institution).filter(
        Institution.is_active == True
    ).all()
    
    service = InstitutionHealthService(db)
    results = []
    
    for institution in institutions:
        try:
            health_score = service.calculate_health_score(institution.id)
            results.append({
                "institution_id": institution.id,
                "institution_name": institution.name,
                "status": "success",
                "health_score": health_score.overall_health_score,
                "risk_level": health_score.risk_level
            })
        except Exception as e:
            results.append({
                "institution_id": institution.id,
                "institution_name": institution.name,
                "status": "error",
                "error": str(e)
            })
    
    return {
        "total_institutions": len(institutions),
        "calculated": len([r for r in results if r["status"] == "success"]),
        "failed": len([r for r in results if r["status"] == "error"]),
        "results": results
    }


@router.get("/alerts", response_model=List[HealthAlertResponse])
async def get_all_alerts(
    is_resolved: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> List[HealthAlertResponse]:
    """Get all health alerts across institutions."""
    query = db.query(InstitutionHealthAlert)
    
    if is_resolved is not None:
        query = query.filter(InstitutionHealthAlert.is_resolved == is_resolved)
    
    if severity:
        query = query.filter(InstitutionHealthAlert.severity == severity)
    
    alerts = query.order_by(desc(InstitutionHealthAlert.created_at)).limit(limit).all()
    
    return [
        HealthAlertResponse(
            id=alert.id,
            institution_id=alert.institution_id,
            alert_type=alert.alert_type,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            metric_name=alert.metric_name,
            threshold_value=alert.threshold_value,
            current_value=alert.current_value,
            is_resolved=alert.is_resolved,
            resolved_at=alert.resolved_at,
            notification_sent=alert.notification_sent,
            created_at=alert.created_at
        )
        for alert in alerts
    ]


@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    resolve_data: AlertResolveRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Resolve a health alert."""
    alert = db.query(InstitutionHealthAlert).filter(
        InstitutionHealthAlert.id == alert_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = current_user.id
    alert.action_taken = resolve_data.action_taken
    
    db.commit()
    
    return {"message": "Alert resolved successfully", "alert_id": alert_id}


@router.post("/alerts", status_code=status.HTTP_201_CREATED)
async def create_manual_alert(
    alert_data: AlertCreateRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Manually create a health alert for an institution."""
    institution = db.query(Institution).filter(
        Institution.id == alert_data.institution_id
    ).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    health_score = db.query(InstitutionHealthScore).filter(
        InstitutionHealthScore.institution_id == alert_data.institution_id
    ).first()
    
    alert = InstitutionHealthAlert(
        health_score_id=health_score.id if health_score else None,
        institution_id=alert_data.institution_id,
        alert_type=alert_data.alert_type,
        severity=alert_data.severity,
        title=alert_data.title,
        description=alert_data.description,
        metric_name=alert_data.metric_name,
        threshold_value=alert_data.threshold_value,
        current_value=alert_data.current_value,
        is_resolved=False,
        notification_sent=False
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {
        "message": "Alert created successfully",
        "alert_id": alert.id
    }


@router.get("/churn-predictions", response_model=List[ChurnPredictionResponse])
async def get_churn_predictions(
    min_probability: float = Query(0.5, ge=0, le=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> List[ChurnPredictionResponse]:
    """Get churn predictions for institutions at risk."""
    health_scores = db.query(InstitutionHealthScore).filter(
        InstitutionHealthScore.churn_probability >= min_probability
    ).order_by(desc(InstitutionHealthScore.churn_probability)).limit(limit).all()
    
    predictions = []
    for hs in health_scores:
        institution = db.query(Institution).filter(
            Institution.id == hs.institution_id
        ).first()
        
        if not institution:
            continue
        
        key_factors = []
        if hs.metrics_data:
            payment_metrics = hs.metrics_data.get("payment", {})
            activity_metrics = hs.metrics_data.get("activity", {})
            
            if payment_metrics.get("failed_payments_90d", 0) > 0:
                key_factors.append({
                    "factor": "Failed Payments",
                    "value": payment_metrics["failed_payments_90d"],
                    "impact": "high"
                })
            
            if activity_metrics.get("mau_ratio", 0) < 30:
                key_factors.append({
                    "factor": "Low MAU Ratio",
                    "value": activity_metrics.get("mau_ratio", 0),
                    "impact": "high"
                })
        
        recommended_actions = [
            RecommendedAction(**ra) for ra in (hs.recommended_actions or [])
        ]
        
        predictions.append(ChurnPredictionResponse(
            institution_id=hs.institution_id,
            institution_name=institution.name,
            churn_probability=hs.churn_probability,
            risk_level=hs.risk_level,
            confidence_score=0.85,
            key_factors=key_factors,
            predicted_churn_date=None,
            recommended_interventions=recommended_actions
        ))
    
    return predictions


@router.get("/trends/{institution_id}", response_model=HealthTrendAnalysis)
async def get_health_trend(
    institution_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> HealthTrendAnalysis:
    """Get health trend analysis for an institution."""
    institution = db.query(Institution).filter(
        Institution.id == institution_id
    ).first()
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    today = datetime.utcnow()
    seven_days_ago = today - timedelta(days=7)
    thirty_days_ago = today - timedelta(days=30)
    ninety_days_ago = today - timedelta(days=90)
    
    current_score = db.query(InstitutionHealthScore).filter(
        InstitutionHealthScore.institution_id == institution_id
    ).first()
    
    if not current_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No health score available for this institution"
        )
    
    score_7d_ago = db.query(InstitutionHealthHistory).filter(
        and_(
            InstitutionHealthHistory.institution_id == institution_id,
            InstitutionHealthHistory.recorded_at <= seven_days_ago
        )
    ).order_by(desc(InstitutionHealthHistory.recorded_at)).first()
    
    score_30d_ago = db.query(InstitutionHealthHistory).filter(
        and_(
            InstitutionHealthHistory.institution_id == institution_id,
            InstitutionHealthHistory.recorded_at <= thirty_days_ago
        )
    ).order_by(desc(InstitutionHealthHistory.recorded_at)).first()
    
    score_90d_ago = db.query(InstitutionHealthHistory).filter(
        and_(
            InstitutionHealthHistory.institution_id == institution_id,
            InstitutionHealthHistory.recorded_at <= ninety_days_ago
        )
    ).order_by(desc(InstitutionHealthHistory.recorded_at)).first()
    
    change_7d = current_score.overall_health_score - (score_7d_ago.overall_health_score if score_7d_ago else current_score.overall_health_score)
    change_30d = current_score.overall_health_score - (score_30d_ago.overall_health_score if score_30d_ago else current_score.overall_health_score)
    change_90d = current_score.overall_health_score - (score_90d_ago.overall_health_score if score_90d_ago else current_score.overall_health_score)
    
    if change_30d > 5:
        trend_direction = "improving"
        trend_strength = min(abs(change_30d) / 10, 1.0)
    elif change_30d < -5:
        trend_direction = "declining"
        trend_strength = min(abs(change_30d) / 10, 1.0)
    else:
        trend_direction = "stable"
        trend_strength = 0.0
    
    predicted_score_30d = current_score.overall_health_score + (change_30d * 0.5)
    predicted_score_30d = max(0, min(100, predicted_score_30d))
    
    return HealthTrendAnalysis(
        institution_id=institution_id,
        institution_name=institution.name,
        trend_direction=trend_direction,
        trend_strength=trend_strength,
        score_change_7d=round(change_7d, 2),
        score_change_30d=round(change_30d, 2),
        score_change_90d=round(change_90d, 2),
        predicted_score_30d=round(predicted_score_30d, 2),
        confidence=0.75
    )


@router.post("/ml-model/train")
async def train_churn_model(
    request: RetrainModelRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Train or retrain the churn prediction ML model."""
    service = InstitutionHealthService(db)
    
    result = service.train_churn_prediction_model(
        validation_split=request.validation_split,
        hyperparameters=request.hyperparameters
    )
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return {
        "message": "Model trained successfully",
        "metrics": result
    }


@router.get("/ml-model/performance", response_model=ModelPerformanceMetrics)
async def get_model_performance(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ModelPerformanceMetrics:
    """Get performance metrics of the active ML model."""
    from src.models.institution_health import ChurnPredictionModel
    
    active_model = db.query(ChurnPredictionModel).filter(
        ChurnPredictionModel.is_active == True
    ).order_by(desc(ChurnPredictionModel.created_at)).first()
    
    if not active_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active ML model found"
        )
    
    return ModelPerformanceMetrics(
        model_version=active_model.model_version,
        accuracy=active_model.accuracy or 0.0,
        precision=active_model.precision or 0.0,
        recall=active_model.recall or 0.0,
        f1_score=active_model.f1_score or 0.0,
        feature_importances=active_model.feature_importances or {},
        training_date=active_model.trained_at
    )
