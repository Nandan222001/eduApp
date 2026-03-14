from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class HealthMetrics(BaseModel):
    payment_health_score: float
    user_activity_score: float
    support_ticket_score: float
    feature_adoption_score: float
    data_quality_score: float


class RiskFactorItem(BaseModel):
    factor: str
    severity: str
    description: str
    impact_score: float


class RecommendedAction(BaseModel):
    action: str
    priority: str
    category: str
    description: str
    expected_impact: str


class InstitutionHealthScoreResponse(BaseModel):
    id: int
    institution_id: int
    institution_name: str
    overall_health_score: float
    payment_health_score: float
    user_activity_score: float
    support_ticket_score: float
    feature_adoption_score: float
    data_quality_score: float
    churn_risk_score: float
    churn_probability: float
    risk_level: str
    health_trend: str
    previous_score: Optional[float]
    score_change_percentage: Optional[float]
    risk_factors: List[RiskFactorItem]
    recommended_actions: List[RecommendedAction]
    last_calculated_at: datetime
    
    class Config:
        from_attributes = True


class HealthAlertResponse(BaseModel):
    id: int
    institution_id: int
    alert_type: str
    severity: str
    title: str
    description: str
    metric_name: Optional[str]
    threshold_value: Optional[float]
    current_value: Optional[float]
    is_resolved: bool
    resolved_at: Optional[datetime]
    notification_sent: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class HealthHistoryResponse(BaseModel):
    recorded_at: datetime
    overall_health_score: float
    payment_health_score: float
    user_activity_score: float
    support_ticket_score: float
    feature_adoption_score: float
    data_quality_score: float
    churn_risk_score: float
    risk_level: str
    
    class Config:
        from_attributes = True


class InstitutionHealthDashboard(BaseModel):
    health_score: InstitutionHealthScoreResponse
    active_alerts: List[HealthAlertResponse]
    health_history: List[HealthHistoryResponse]
    metrics_breakdown: Dict[str, Any]


class HealthScoreListItem(BaseModel):
    institution_id: int
    institution_name: str
    overall_health_score: float
    churn_risk_score: float
    risk_level: str
    health_trend: str
    active_alerts_count: int
    last_calculated_at: datetime


class HealthScoreListResponse(BaseModel):
    items: List[HealthScoreListItem]
    total: int
    critical_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


class ChurnPredictionResponse(BaseModel):
    institution_id: int
    institution_name: str
    churn_probability: float
    risk_level: str
    confidence_score: float
    key_factors: List[Dict[str, Any]]
    predicted_churn_date: Optional[datetime]
    recommended_interventions: List[RecommendedAction]


class AlertResolveRequest(BaseModel):
    action_taken: str


class AlertCreateRequest(BaseModel):
    institution_id: int
    alert_type: str
    severity: str
    title: str
    description: str
    metric_name: Optional[str] = None
    threshold_value: Optional[float] = None
    current_value: Optional[float] = None


class HealthTrendAnalysis(BaseModel):
    institution_id: int
    institution_name: str
    trend_direction: str
    trend_strength: float
    score_change_7d: float
    score_change_30d: float
    score_change_90d: float
    predicted_score_30d: float
    confidence: float


class ModelPerformanceMetrics(BaseModel):
    model_version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    feature_importances: Dict[str, float]
    training_date: datetime


class RetrainModelRequest(BaseModel):
    hyperparameters: Optional[Dict[str, Any]] = None
    validation_split: float = Field(default=0.2, ge=0.1, le=0.4)
