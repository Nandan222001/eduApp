from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index,
    JSON, Text
)
from sqlalchemy.orm import relationship
from src.database import Base


class TrainingStatus(str, PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TrainingJobType(str, PyEnum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"


class MLTrainingJob(Base):
    __tablename__ = "ml_training_jobs"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)

    model_id = Column(Integer, ForeignKey('ml_models.id', ondelete='SET NULL'), nullable=True, index=True)
    model_version_id = Column(Integer, ForeignKey('ml_model_versions.id', ondelete='SET NULL'), nullable=True, index=True)

    model_name = Column(String(255), nullable=False)
    algorithm = Column(String(100), nullable=False)
    prediction_type = Column(String(100), nullable=False)
    hyperparameters = Column(JSON, nullable=True)
    training_config = Column(JSON, nullable=True)

    job_type = Column(String(20), default=TrainingJobType.MANUAL.value, nullable=False, index=True)
    status = Column(String(20), default=TrainingStatus.PENDING.value, nullable=False, index=True)
    celery_task_id = Column(String(255), nullable=True, index=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    training_samples = Column(Integer, nullable=True)
    test_r2_score = Column(Float, nullable=True)
    validation_r2_score = Column(Float, nullable=True)

    auto_promoted = Column(Boolean, default=False, nullable=False)
    promotion_threshold = Column(Float, default=0.02, nullable=False)

    triggered_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    error_message = Column(Text, nullable=True)
    error_traceback = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    triggered_by_user = relationship("User", foreign_keys=[triggered_by])
    promotion_logs = relationship("ModelPromotionLog", back_populates="training_job")

    __table_args__ = (
        Index('idx_ml_training_job_institution_status', 'institution_id', 'status'),
    )


class ModelPromotionLog(Base):
    __tablename__ = "model_promotion_logs"

    id = Column(Integer, primary_key=True, index=True)
    training_job_id = Column(Integer, ForeignKey('ml_training_jobs.id', ondelete='SET NULL'), nullable=True, index=True)
    model_id = Column(Integer, ForeignKey('ml_models.id', ondelete='CASCADE'), nullable=False, index=True)

    previous_version_id = Column(Integer, ForeignKey('ml_model_versions.id', ondelete='SET NULL'), nullable=True)
    new_version_id = Column(Integer, ForeignKey('ml_model_versions.id', ondelete='SET NULL'), nullable=True)

    previous_r2_score = Column(Float, nullable=True)
    new_r2_score = Column(Float, nullable=True)
    improvement = Column(Float, nullable=True)

    promotion_type = Column(String(20), default="automatic", nullable=False)
    reason = Column(Text, nullable=True)
    promoted_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    model = relationship("MLModel")
    training_job = relationship("MLTrainingJob", back_populates="promotion_logs")
    promoted_by_user = relationship("User", foreign_keys=[promoted_by])
