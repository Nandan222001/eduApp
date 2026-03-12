from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class StatisticsResponse(BaseModel):
    mean: float
    std: float
    min: float
    max: float
    median: float
    sample_size: int


class PredictionDriftResponse(BaseModel):
    drift_detected: bool
    drift_score: Optional[float] = None
    ks_statistic: Optional[float] = None
    ks_p_value: Optional[float] = None
    js_divergence: Optional[float] = None
    psi_score: Optional[float] = None
    severity: Optional[str] = None
    recent_stats: Optional[StatisticsResponse] = None
    baseline_stats: Optional[StatisticsResponse] = None
    reason: Optional[str] = None
    recent_sample_size: Optional[int] = None
    baseline_sample_size: Optional[int] = None
    checked_at: str


class FeatureDriftScore(BaseModel):
    drift_score: float
    ks_statistic: float
    ks_p_value: float
    psi_score: float
    recent_mean: float
    baseline_mean: float
    mean_shift: float
    recent_std: float
    baseline_std: float


class FeatureDriftResponse(BaseModel):
    drift_detected: bool
    overall_drift_score: Optional[float] = None
    drifted_features: Optional[List[str]] = None
    feature_drift_scores: Optional[Dict[str, FeatureDriftScore]] = None
    num_features_checked: Optional[int] = None
    num_drifted_features: Optional[int] = None
    severity: Optional[str] = None
    reason: Optional[str] = None
    recent_sample_size: Optional[int] = None
    baseline_sample_size: Optional[int] = None
    checked_at: str


class PerformanceChange(BaseModel):
    baseline_value: float
    current_value: float
    change: float
    change_percentage: float
    threshold_exceeded: bool


class PerformanceDegradationResponse(BaseModel):
    degradation_detected: bool
    baseline_metrics: Optional[Dict[str, Any]] = None
    current_metrics: Optional[Dict[str, Any]] = None
    performance_changes: Optional[Dict[str, PerformanceChange]] = None
    average_confidence_width: Optional[float] = None
    recent_sample_size: Optional[int] = None
    with_actual_values: Optional[bool] = None
    severity: Optional[str] = None
    reason: Optional[str] = None
    sample_size: Optional[int] = None
    checked_at: str


class ConfidenceStats(BaseModel):
    mean_width: float
    std_width: float
    min_width: float
    max_width: float
    median_width: float


class ConfidenceTrendsResponse(BaseModel):
    trend_detected: bool
    confidence_drop_detected: Optional[bool] = None
    trend_direction: Optional[str] = None
    trend_slope: Optional[float] = None
    trend_strength: Optional[float] = None
    confidence_change_percentage: Optional[float] = None
    recent_avg_width: Optional[float] = None
    baseline_avg_width: Optional[float] = None
    overall_stats: Optional[ConfidenceStats] = None
    daily_averages: Optional[Dict[str, float]] = None
    sample_size: Optional[int] = None
    days_analyzed: Optional[int] = None
    reason: Optional[str] = None
    checked_at: str


class AlertsSummary(BaseModel):
    total_alerts: int
    critical_alerts: int
    warning_alerts: int
    recent_alerts: List[Dict[str, Any]]


class ComprehensiveMonitoringReportResponse(BaseModel):
    model_id: int
    model_name: str
    model_status: str
    report_generated_at: str
    monitoring_period_days: int
    model_health_score: float
    health_status: str
    prediction_drift: Dict[str, Any]
    feature_drift: Dict[str, Any]
    performance_monitoring: Dict[str, Any]
    confidence_trends: Dict[str, Any]
    alerts_summary: AlertsSummary
    retraining_recommended: bool
    retraining_reasons: List[str]


class TriggerRetrainingRequest(BaseModel):
    deployed_by: Optional[int] = Field(None, description="User ID of the deployer")
    auto_promote: bool = Field(default=True, description="Automatically promote if better")


class AutoRetrainingResponse(BaseModel):
    retraining_status: str
    training_result: Optional[Dict[str, Any]] = None
    promotion_result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    message: Optional[str] = None
    triggered_at: str


class ModelHealthSummary(BaseModel):
    model_id: int
    model_name: str
    health_score: float
    health_status: str
    retraining_recommended: Optional[bool] = None
    has_critical_alerts: Optional[bool] = None
    last_checked: Optional[str] = None
    error: Optional[str] = None


class MonitoringOverviewResponse(BaseModel):
    institution_id: int
    total_models: int
    overall_health_score: float
    models_needing_retraining: int
    models_with_critical_alerts: int
    model_summaries: List[ModelHealthSummary]
    generated_at: str


class DailyPredictionStats(BaseModel):
    date: str
    count: int
    mean_prediction: float
    std_prediction: float
    min_prediction: float
    max_prediction: float
    mean_confidence_width: Optional[float] = None


class PredictionTimelineResponse(BaseModel):
    model_id: int
    days_analyzed: int
    total_predictions: int
    timeline: List[DailyPredictionStats]


class VersionImportance(BaseModel):
    version: str
    training_date: str
    feature_importance: Dict[str, float]
    is_deployed: bool


class FeatureImportanceTrendsResponse(BaseModel):
    model_id: int
    versions_analyzed: int
    version_importances: List[VersionImportance]
