from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class ModelType(str, Enum):
    REGRESSION = "regression"
    CLASSIFICATION = "classification"
    TIME_SERIES = "time_series"


class ModelStatus(str, Enum):
    TRAINING = "training"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    FAILED = "failed"


class PredictionType(str, Enum):
    EXAM_PERFORMANCE = "exam_performance"
    OVERALL_PERCENTAGE = "overall_percentage"
    SUBJECT_SCORE = "subject_score"
    PASS_FAIL = "pass_fail"


class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    model_type = Column(SQLEnum(ModelType), nullable=False, index=True)
    prediction_type = Column(SQLEnum(PredictionType), nullable=False, index=True)
    algorithm = Column(String(100), nullable=False)
    hyperparameters = Column(JSON, nullable=True)
    feature_names = Column(JSON, nullable=False)
    target_column = Column(String(100), nullable=False)
    status = Column(SQLEnum(ModelStatus), default=ModelStatus.TRAINING, nullable=False, index=True)
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    versions = relationship("MLModelVersion", back_populates="model", cascade="all, delete-orphan")
    predictions = relationship("PerformancePrediction", back_populates="model", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_ml_model_institution', 'institution_id'),
        Index('idx_ml_model_type', 'model_type'),
        Index('idx_ml_model_prediction_type', 'prediction_type'),
        Index('idx_ml_model_status', 'status'),
        Index('idx_ml_model_active', 'is_active'),
    )


class MLModelVersion(Base):
    __tablename__ = "ml_model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey('ml_models.id', ondelete='CASCADE'), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    model_path = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=True)
    scaler_path = Column(String(500), nullable=True)
    scaler_s3_key = Column(String(500), nullable=True)
    training_metrics = Column(JSON, nullable=True)
    validation_metrics = Column(JSON, nullable=True)
    test_metrics = Column(JSON, nullable=True)
    cross_validation_scores = Column(JSON, nullable=True)
    feature_importance = Column(JSON, nullable=True)
    training_samples = Column(Integer, nullable=False)
    training_date = Column(DateTime, nullable=False)
    is_deployed = Column(Boolean, default=False, nullable=False, index=True)
    deployed_at = Column(DateTime, nullable=True)
    deployed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    model = relationship("MLModel", back_populates="versions")
    deployer = relationship("User")
    
    __table_args__ = (
        Index('idx_model_version_model', 'model_id'),
        Index('idx_model_version_deployed', 'is_deployed'),
    )


class PerformancePrediction(Base):
    __tablename__ = "performance_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    model_id = Column(Integer, ForeignKey('ml_models.id', ondelete='CASCADE'), nullable=False, index=True)
    model_version_id = Column(Integer, ForeignKey('ml_model_versions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    predicted_value = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=True)
    confidence_upper = Column(Float, nullable=True)
    confidence_level = Column(Float, nullable=True)
    input_features = Column(JSON, nullable=False)
    feature_contributions = Column(JSON, nullable=True)
    prediction_context = Column(JSON, nullable=True)
    is_scenario = Column(Boolean, default=False, nullable=False, index=True)
    predicted_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    model = relationship("MLModel", back_populates="predictions")
    model_version = relationship("MLModelVersion")
    student = relationship("Student")
    scenarios = relationship("PredictionScenario", back_populates="base_prediction", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_prediction_institution', 'institution_id'),
        Index('idx_prediction_model', 'model_id'),
        Index('idx_prediction_model_version', 'model_version_id'),
        Index('idx_prediction_student', 'student_id'),
        Index('idx_prediction_scenario', 'is_scenario'),
        Index('idx_prediction_date', 'predicted_at'),
    )


class PredictionScenario(Base):
    __tablename__ = "prediction_scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    base_prediction_id = Column(Integer, ForeignKey('performance_predictions.id', ondelete='CASCADE'), nullable=False, index=True)
    scenario_name = Column(String(200), nullable=False)
    scenario_description = Column(Text, nullable=True)
    modified_features = Column(JSON, nullable=False)
    predicted_value = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=True)
    confidence_upper = Column(Float, nullable=True)
    value_change = Column(Float, nullable=False)
    percentage_change = Column(Float, nullable=False)
    recommendations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    base_prediction = relationship("PerformancePrediction", back_populates="scenarios")
    
    __table_args__ = (
        Index('idx_scenario_base_prediction', 'base_prediction_id'),
    )
