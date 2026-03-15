from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class StepType(str, Enum):
    WELCOME_VIDEO = "welcome_video"
    DOCUMENT_UPLOAD = "document_upload"
    PROFILE_COMPLETION = "profile_completion"
    QUIZ = "quiz"
    AGREEMENT_SIGNATURE = "agreement_signature"
    TOUR = "tour"


class UserRole(str, Enum):
    STUDENT = "student"
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"


class OnboardingFlow(Base):
    __tablename__ = "onboarding_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    role_specific = Column(SQLEnum(UserRole), nullable=True, index=True)
    grade_level = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_default = Column(Boolean, default=False, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    creator = relationship("User")
    steps = relationship("OnboardingStep", back_populates="flow", cascade="all, delete-orphan", order_by="OnboardingStep.step_order")
    progress_records = relationship("OnboardingProgress", back_populates="flow", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_onboarding_flow_institution', 'institution_id'),
        Index('idx_onboarding_flow_role', 'role_specific'),
        Index('idx_onboarding_flow_active', 'is_active'),
        Index('idx_onboarding_flow_default', 'is_default'),
    )


class OnboardingStep(Base):
    __tablename__ = "onboarding_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, ForeignKey('onboarding_flows.id', ondelete='CASCADE'), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)
    step_type = Column(SQLEnum(StepType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    step_content = Column(JSON, nullable=True)
    is_required = Column(Boolean, default=True, nullable=False)
    conditional_logic = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    flow = relationship("OnboardingFlow", back_populates="steps")
    progress_records = relationship("OnboardingStepProgress", back_populates="step", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('flow_id', 'step_order', name='uq_flow_step_order'),
        Index('idx_onboarding_step_flow', 'flow_id'),
        Index('idx_onboarding_step_type', 'step_type'),
        Index('idx_onboarding_step_order', 'step_order'),
    )


class OnboardingProgress(Base):
    __tablename__ = "onboarding_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    flow_id = Column(Integer, ForeignKey('onboarding_flows.id', ondelete='CASCADE'), nullable=False, index=True)
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    current_step_order = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user = relationship("User")
    flow = relationship("OnboardingFlow", back_populates="progress_records")
    step_progress = relationship("OnboardingStepProgress", back_populates="progress", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'flow_id', name='uq_user_flow'),
        Index('idx_onboarding_progress_user', 'user_id'),
        Index('idx_onboarding_progress_flow', 'flow_id'),
        Index('idx_onboarding_progress_completed', 'is_completed'),
    )


class OnboardingStepProgress(Base):
    __tablename__ = "onboarding_step_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    progress_id = Column(Integer, ForeignKey('onboarding_progress.id', ondelete='CASCADE'), nullable=False, index=True)
    step_id = Column(Integer, ForeignKey('onboarding_steps.id', ondelete='CASCADE'), nullable=False, index=True)
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    is_skipped = Column(Boolean, default=False, nullable=False)
    response_data = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    progress = relationship("OnboardingProgress", back_populates="step_progress")
    step = relationship("OnboardingStep", back_populates="progress_records")
    
    __table_args__ = (
        UniqueConstraint('progress_id', 'step_id', name='uq_progress_step'),
        Index('idx_step_progress_progress', 'progress_id'),
        Index('idx_step_progress_step', 'step_id'),
        Index('idx_step_progress_completed', 'is_completed'),
    )


class OnboardingDocument(Base):
    __tablename__ = "onboarding_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    step_progress_id = Column(Integer, ForeignKey('onboarding_step_progress.id', ondelete='CASCADE'), nullable=True, index=True)
    document_type = Column(String(100), nullable=False)
    document_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    verified_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User", foreign_keys=[user_id])
    verifier = relationship("User", foreign_keys=[verified_by])
    step_progress = relationship("OnboardingStepProgress")
    
    __table_args__ = (
        Index('idx_onboarding_document_institution', 'institution_id'),
        Index('idx_onboarding_document_user', 'user_id'),
        Index('idx_onboarding_document_step', 'step_progress_id'),
        Index('idx_onboarding_document_verified', 'is_verified'),
    )


class OnboardingSignature(Base):
    __tablename__ = "onboarding_signatures"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    step_progress_id = Column(Integer, ForeignKey('onboarding_step_progress.id', ondelete='CASCADE'), nullable=True, index=True)
    agreement_type = Column(String(100), nullable=False)
    agreement_text = Column(Text, nullable=False)
    signature_data = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    signed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    step_progress = relationship("OnboardingStepProgress")
    
    __table_args__ = (
        Index('idx_onboarding_signature_institution', 'institution_id'),
        Index('idx_onboarding_signature_user', 'user_id'),
        Index('idx_onboarding_signature_step', 'step_progress_id'),
        Index('idx_onboarding_signature_type', 'agreement_type'),
    )
