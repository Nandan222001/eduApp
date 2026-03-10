from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


class TrainModelRequest(BaseModel):
    institution_id: int = Field(..., description="Institution ID")
    model_name: str = Field(..., description="Name of the model")
    algorithm: str = Field(default='random_forest', description="Algorithm to use")
    hyperparameters: Optional[Dict[str, Any]] = Field(None, description="Model hyperparameters")
    target_column: str = Field(default='exam_percentage', description="Target column to predict")
    prediction_type: str = Field(default='overall_percentage', description="Type of prediction")
    start_date: Optional[date] = Field(None, description="Start date for training data")
    end_date: Optional[date] = Field(None, description="End date for training data")
    test_size: float = Field(default=0.2, ge=0.1, le=0.5, description="Test set size")
    cv_folds: int = Field(default=5, ge=2, le=10, description="Cross-validation folds")
    random_state: int = Field(default=42, description="Random state for reproducibility")


class TrainModelResponse(BaseModel):
    model_id: int
    version: str
    training_metrics: Dict[str, Any]
    test_metrics: Dict[str, Any]
    cross_validation_scores: Dict[str, Any]
    feature_importance: Dict[str, float]
    training_samples: int
    message: str


class PredictPerformanceRequest(BaseModel):
    model_id: int = Field(..., description="Model ID to use for prediction")
    student_id: int = Field(..., description="Student ID")
    input_features: Dict[str, float] = Field(..., description="Input features for prediction")
    confidence_level: float = Field(default=0.95, ge=0.8, le=0.99, description="Confidence level")
    calculate_contributions: bool = Field(default=True, description="Calculate feature contributions")


class PredictPerformanceResponse(BaseModel):
    prediction_id: int
    student_id: int
    predicted_value: float
    confidence_lower: float
    confidence_upper: float
    confidence_level: float
    feature_contributions: Optional[Dict[str, Any]]
    predicted_at: datetime
    
    class Config:
        from_attributes = True


class WhatIfScenario(BaseModel):
    name: str = Field(..., description="Scenario name")
    description: Optional[str] = Field(None, description="Scenario description")
    modified_features: Dict[str, float] = Field(..., description="Features to modify")


class WhatIfAnalysisRequest(BaseModel):
    base_prediction_id: int = Field(..., description="Base prediction ID")
    scenarios: List[WhatIfScenario] = Field(..., description="List of scenarios to analyze")


class ScenarioResult(BaseModel):
    scenario_id: int
    scenario_name: str
    scenario_description: Optional[str]
    predicted_value: float
    confidence_lower: float
    confidence_upper: float
    value_change: float
    percentage_change: float
    recommendations: List[Dict[str, str]]
    
    class Config:
        from_attributes = True


class WhatIfAnalysisResponse(BaseModel):
    base_prediction: PredictPerformanceResponse
    scenarios: List[ScenarioResult]
    total_scenarios: int


class ModelMetricsResponse(BaseModel):
    version: str
    training_metrics: Dict[str, Any]
    test_metrics: Dict[str, Any]
    cross_validation_scores: Dict[str, Any]
    feature_importance: Dict[str, float]
    training_samples: int
    training_date: str


class ModelListItem(BaseModel):
    id: int
    name: str
    algorithm: str
    model_type: str
    prediction_type: str
    status: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ListModelsResponse(BaseModel):
    models: List[ModelListItem]
    total_count: int


class PredictionHistoryItem(BaseModel):
    id: int
    predicted_value: float
    confidence_lower: float
    confidence_upper: float
    predicted_at: datetime
    
    class Config:
        from_attributes = True


class PredictionHistoryResponse(BaseModel):
    student_id: int
    predictions: List[PredictionHistoryItem]
    total_count: int


class BatchPredictionRequest(BaseModel):
    model_id: int = Field(..., description="Model ID to use for prediction")
    student_ids: List[int] = Field(..., description="List of student IDs")
    confidence_level: float = Field(default=0.95, ge=0.8, le=0.99, description="Confidence level")


class BatchPredictionResult(BaseModel):
    student_id: int
    predicted_value: float
    confidence_lower: float
    confidence_upper: float


class BatchPredictionResponse(BaseModel):
    predictions: List[BatchPredictionResult]
    total_count: int
