from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


class TrainingScheduleConfig(BaseModel):
    enabled: bool = Field(default=False, description="Enable scheduled training")
    frequency_days: int = Field(default=7, ge=1, le=365, description="Training frequency in days")
    model_name: str = Field(default="performance_predictor", description="Model name")
    prediction_type: str = Field(default="overall_percentage", description="Type of prediction")
    algorithm: str = Field(default="random_forest", description="Algorithm to use")
    hyperparameters: Optional[Dict[str, Any]] = Field(None, description="Model hyperparameters")
    auto_promote: bool = Field(default=True, description="Automatically promote better models")
    promotion_threshold: float = Field(default=0.02, ge=0.0, le=1.0, description="R² improvement threshold for promotion")
    ab_test_enabled: bool = Field(default=False, description="Enable A/B testing")
    ab_test_traffic_split: float = Field(default=0.2, ge=0.0, le=1.0, description="Traffic split for challenger model")


class UpdateTrainingScheduleRequest(BaseModel):
    config: TrainingScheduleConfig


class ManualTrainingRequest(BaseModel):
    model_name: str = Field(..., description="Name of the model")
    prediction_type: str = Field(default="overall_percentage", description="Type of prediction")
    algorithm: str = Field(default="random_forest", description="Algorithm to use")
    hyperparameters: Optional[Dict[str, Any]] = Field(None, description="Model hyperparameters")
    target_column: str = Field(default="exam_percentage", description="Target column to predict")
    start_date: Optional[date] = Field(None, description="Start date for training data")
    end_date: Optional[date] = Field(None, description="End date for training data")
    test_size: float = Field(default=0.2, ge=0.1, le=0.5, description="Test set size")
    val_size: float = Field(default=0.1, ge=0.0, le=0.3, description="Validation set size")
    cv_folds: int = Field(default=5, ge=2, le=10, description="Cross-validation folds")
    random_state: int = Field(default=42, description="Random state for reproducibility")
    auto_promote: bool = Field(default=True, description="Automatically promote if better")
    promotion_threshold: float = Field(default=0.02, ge=0.0, le=1.0, description="R² improvement threshold")
    notify_admins: bool = Field(default=True, description="Send notification to admins")


class ManualTrainingResponse(BaseModel):
    task_id: str = Field(..., description="Celery task ID")
    message: str = Field(..., description="Status message")
    status: str = Field(..., description="Task status")


class TrainingHistoryItem(BaseModel):
    version_id: int
    version: str
    training_date: datetime
    training_samples: int
    test_metrics: Dict[str, float]
    validation_metrics: Dict[str, float]
    cross_validation_scores: Dict[str, Any]
    is_deployed: bool
    deployed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TrainingHistoryResponse(BaseModel):
    model_id: int
    model_name: str
    history: List[TrainingHistoryItem]
    total_count: int


class ModelVersionDetail(BaseModel):
    version_id: int
    version: str
    model_path: str
    training_date: datetime
    training_samples: int
    training_metrics: Dict[str, float]
    validation_metrics: Dict[str, float]
    test_metrics: Dict[str, float]
    cross_validation_scores: Dict[str, Any]
    feature_importance: Dict[str, float]
    is_deployed: bool
    deployed_at: Optional[datetime]
    deployed_by: Optional[int]
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class ModelComparisonRequest(BaseModel):
    champion_version_id: int = Field(..., description="Champion version ID")
    challenger_version_id: int = Field(..., description="Challenger version ID")


class ModelComparisonResponse(BaseModel):
    comparison: Dict[str, Any]
    improvement: Dict[str, float]
    recommendation: str
    promote_challenger: bool


class PromoteModelRequest(BaseModel):
    model_version_id: int = Field(..., description="Model version ID to promote")


class PromoteModelResponse(BaseModel):
    promoted_version: str
    model_id: int
    previous_champion: Optional[str]
    promoted_at: str
    test_r2_score: float
    message: str


class ABTestConfig(BaseModel):
    model_id: int = Field(..., description="Model ID")
    enabled: bool = Field(..., description="Enable A/B testing")
    traffic_split: float = Field(default=0.2, ge=0.0, le=1.0, description="Traffic split for challenger")


class ABTestStatus(BaseModel):
    model_id: int
    champion: Optional[Dict[str, Any]]
    challenger: Optional[Dict[str, Any]]
    ab_test_enabled: bool
    traffic_split: float


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]]
    error: Optional[str]


class TrainingMetricsSummary(BaseModel):
    total_models: int
    total_versions: int
    active_models: int
    recent_trainings: int
    average_r2_score: float
    best_r2_score: float


class InstitutionMLSettings(BaseModel):
    ml_training: TrainingScheduleConfig
    
    class Config:
        from_attributes = True
