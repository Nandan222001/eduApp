from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from src.database import Base


class InstitutionHealthScore(Base):
    __tablename__ = "institution_health_scores"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    overall_health_score = Column(Float, nullable=False)
    payment_health_score = Column(Float, nullable=False)
    user_activity_score = Column(Float, nullable=False)
    support_ticket_score = Column(Float, nullable=False)
    feature_adoption_score = Column(Float, nullable=False)
    data_quality_score = Column(Float, nullable=False)
    churn_risk_score = Column(Float, nullable=False)
    churn_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False, index=True)
    health_trend = Column(String(20), nullable=False, default="stable")
    previous_score = Column(Float, nullable=True)
    score_change_percentage = Column(Float, nullable=True)

    metrics_data = Column(JSON, nullable=True)
    risk_factors = Column(JSON, nullable=True)
    recommended_actions = Column(JSON, nullable=True)

    last_calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    alerts = relationship("InstitutionHealthAlert", back_populates="health_score", cascade="all, delete-orphan")
    history_entries = relationship("InstitutionHealthHistory", back_populates="health_score", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_inst_health_score_risk_level', 'risk_level'),
        Index('idx_inst_health_score_churn_risk', 'churn_risk_score'),
    )


class InstitutionHealthAlert(Base):
    __tablename__ = "institution_health_alerts"

    id = Column(Integer, primary_key=True, index=True)
    health_score_id = Column(Integer, ForeignKey('institution_health_scores.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)

    alert_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    metric_name = Column(String(50), nullable=True)
    threshold_value = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)

    is_resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    action_taken = Column(Text, nullable=True)
    notification_sent = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    health_score = relationship("InstitutionHealthScore", back_populates="alerts")
    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_inst_health_alert_institution', 'institution_id'),
        Index('idx_inst_health_alert_unresolved', 'institution_id', 'alert_type', 'is_resolved'),
    )


class ChurnPredictionModel(Base):
    __tablename__ = "churn_prediction_models"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False, unique=True, index=True)
    model_type = Column(String(50), nullable=False)
    model_path = Column(String(500), nullable=False)
    scaler_path = Column(String(500), nullable=True)

    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    feature_importances = Column(JSON, nullable=True)
    feature_names = Column(JSON, nullable=True)
    training_metrics = Column(JSON, nullable=True)
    hyperparameters = Column(JSON, nullable=True)

    is_active = Column(Boolean, default=False, nullable=False, index=True)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_churn_model_active', 'is_active'),
    )


class InstitutionHealthHistory(Base):
    __tablename__ = "institution_health_history"

    id = Column(Integer, primary_key=True, index=True)
    health_score_id = Column(Integer, ForeignKey('institution_health_scores.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)

    overall_health_score = Column(Float, nullable=False)
    payment_health_score = Column(Float, nullable=False)
    user_activity_score = Column(Float, nullable=False)
    support_ticket_score = Column(Float, nullable=False)
    feature_adoption_score = Column(Float, nullable=False)
    data_quality_score = Column(Float, nullable=False)
    churn_risk_score = Column(Float, nullable=False)
    churn_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    metrics_snapshot = Column(JSON, nullable=True)

    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    health_score = relationship("InstitutionHealthScore", back_populates="history_entries")
    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_inst_health_history_institution_recorded', 'institution_id', 'recorded_at'),
    )
