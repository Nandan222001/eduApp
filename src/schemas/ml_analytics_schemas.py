from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class TraditionalAnalyticsSummary(BaseModel):
    total_students: int
    active_students: int
    overall_average_percentage: float
    overall_attendance_percentage: float
    total_exams_conducted: int


class MLMonitoringSummary(BaseModel):
    total_ml_models: int
    overall_model_health: float
    models_needing_retraining: int
    models_with_alerts: int
    total_predictions_period: int


class MLModelSummary(BaseModel):
    id: int
    name: str
    status: str
    is_active: bool
    algorithm: str


class UnifiedDashboardResponse(BaseModel):
    institution_id: int
    traditional_analytics: Optional[TraditionalAnalyticsSummary] = None
    ml_monitoring: Optional[MLMonitoringSummary] = None
    ml_models_summary: List[MLModelSummary]
    generated_at: str


class LatestPrediction(BaseModel):
    predicted_value: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None
    model_name: str
    predicted_at: str


class PredictionTrend(BaseModel):
    trend: str
    direction: Optional[str] = None
    slope: float
    first_value: Optional[float] = None
    last_value: Optional[float] = None
    change: Optional[float] = None
    change_percentage: Optional[float] = None


class PredictionHistoryItem(BaseModel):
    predicted_value: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None
    predicted_at: str
    model_name: Optional[str] = None


class StudentMLInsightsResponse(BaseModel):
    student_id: int
    has_predictions: bool
    message: Optional[str] = None
    latest_prediction: Optional[LatestPrediction] = None
    prediction_trend: Optional[PredictionTrend] = None
    total_predictions: Optional[int] = None
    prediction_history: Optional[List[PredictionHistoryItem]] = None
    feature_contributions: Optional[Dict[str, Any]] = None
    generated_at: Optional[str] = None


class UsageStatistics(BaseModel):
    total_predictions: int
    unique_students: int
    avg_predictions_per_day: float
    period_days: int


class ModelPerformanceAnalyticsResponse(BaseModel):
    model_id: int
    model_name: str
    model_algorithm: str
    model_status: str
    monitoring_report: Dict[str, Any]
    prediction_timeline: Dict[str, Any]
    feature_importance_trends: Dict[str, Any]
    usage_statistics: UsageStatistics
    generated_at: str


class PredictionAccuracyAnalysisRequest(BaseModel):
    actual_results: Dict[int, float] = Field(
        ...,
        description="Mapping of student_id to actual performance value"
    )
    days: int = Field(
        default=30,
        ge=1,
        le=180,
        description="Number of days to analyze"
    )


class AccuracyMetrics(BaseModel):
    mae: float
    rmse: float
    mean_absolute_percentage_error: float
    confidence_coverage_percentage: float


class MatchedPrediction(BaseModel):
    student_id: int
    predicted: float
    actual: float
    error: float
    percentage_error: float


class PredictionAccuracyAnalysisResponse(BaseModel):
    model_id: int
    analysis_available: bool
    message: Optional[str] = None
    accuracy_metrics: Optional[AccuracyMetrics] = None
    sample_size: Optional[int] = None
    predictions_analyzed: Optional[List[MatchedPrediction]] = None
    generated_at: Optional[str] = None


class ModelRetrainingRecommendation(BaseModel):
    model_id: int
    model_name: str
    reasons: List[str]


class MonitoringCheckResult(BaseModel):
    model_id: int
    model_name: str
    health_score: Optional[float] = None
    retraining_recommended: Optional[bool] = None
    error: Optional[str] = None


class MonitoringScheduleResponse(BaseModel):
    institution_id: int
    total_models_checked: int
    models_needing_retraining: List[ModelRetrainingRecommendation]
    check_results: List[MonitoringCheckResult]
    checked_at: str
