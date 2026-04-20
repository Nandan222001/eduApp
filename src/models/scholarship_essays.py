from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class PromptType(str, Enum):
    PERSONAL_STATEMENT = "personal_statement"
    WHY_MAJOR = "why_major"
    COMMUNITY_SERVICE = "community_service"
    LEADERSHIP = "leadership"
    DIVERSITY = "diversity"
    ADVERSITY_OVERCOME = "adversity_overcome"


class EssayStatus(str, Enum):
    DRAFT = "draft"
    PEER_REVIEW = "peer_review"
    COUNSELOR_REVIEW = "counselor_review"
    FINALIZED = "finalized"
    SUBMITTED = "submitted"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DECLINED = "declined"


class GrammarCheckStatus(str, Enum):
    NOT_CHECKED = "not_checked"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class EssayPrompt(Base):
    __tablename__ = "essay_prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    prompt_text = Column(Text, nullable=False)
    prompt_type = Column(SQLEnum(PromptType), nullable=False, index=True)
    word_limit = Column(Integer, nullable=True)
    associated_scholarships = Column(JSON, nullable=True)
    
    guidelines = Column(Text, nullable=True)
    tips = Column(JSON, nullable=True)
    sample_essay_ids = Column(JSON, nullable=True)
    
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    creator = relationship("User")
    student_essays = relationship("StudentEssay", back_populates="prompt", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_essay_prompt_institution', 'institution_id'),
        Index('idx_essay_prompt_type', 'prompt_type'),
        Index('idx_essay_prompt_active', 'is_active'),
    )


class StudentEssay(Base):
    __tablename__ = "student_essays"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    prompt_id = Column(Integer, ForeignKey('essay_prompts.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(500), nullable=True)
    essay_draft = Column(Text, nullable=False)
    revision_history = Column(JSON, nullable=True)
    word_count = Column(Integer, nullable=False, default=0)
    
    status = Column(SQLEnum(EssayStatus), default=EssayStatus.DRAFT, nullable=False, index=True)
    finalized_version = Column(Text, nullable=True)
    finalized_at = Column(DateTime, nullable=True)
    
    counselor_feedback = Column(JSON, nullable=True)
    counselor_approved = Column(Boolean, default=False, nullable=False)
    counselor_approved_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    counselor_approved_at = Column(DateTime, nullable=True)
    
    submitted_to_scholarships = Column(JSON, nullable=True)
    submission_dates = Column(JSON, nullable=True)
    
    grammar_check_results = Column(JSON, nullable=True)
    grammar_check_status = Column(SQLEnum(GrammarCheckStatus), default=GrammarCheckStatus.NOT_CHECKED, nullable=False)
    grammar_check_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    
    ai_suggestions = Column(JSON, nullable=True)
    ai_analyzed_at = Column(DateTime, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    prompt = relationship("EssayPrompt", back_populates="student_essays")
    counselor = relationship("User", foreign_keys=[counselor_approved_by])
    peer_reviews = relationship("EssayPeerReview", foreign_keys="EssayPeerReview.essay_id", back_populates="essay", cascade="all, delete-orphan")
    analytics = relationship("EssayAnalytics", back_populates="essay", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_student_essay_institution', 'institution_id'),
        Index('idx_student_essay_student', 'student_id'),
        Index('idx_student_essay_prompt', 'prompt_id'),
        Index('idx_student_essay_status', 'status'),
        Index('idx_student_essay_active', 'is_active'),
    )


class EssayPeerReview(Base):
    __tablename__ = "essay_peer_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    essay_id = Column(Integer, ForeignKey('student_essays.id', ondelete='CASCADE'), nullable=False, index=True)
    reviewer_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False, index=True)
    
    content_score = Column(Integer, nullable=True)
    clarity_score = Column(Integer, nullable=True)
    grammar_score = Column(Integer, nullable=True)
    authenticity_score = Column(Integer, nullable=True)
    overall_score = Column(Float, nullable=True)
    
    content_feedback = Column(Text, nullable=True)
    clarity_feedback = Column(Text, nullable=True)
    grammar_feedback = Column(Text, nullable=True)
    authenticity_feedback = Column(Text, nullable=True)
    general_comments = Column(Text, nullable=True)
    
    strengths = Column(JSON, nullable=True)
    areas_for_improvement = Column(JSON, nullable=True)
    
    is_anonymous = Column(Boolean, default=True, nullable=False)
    is_helpful = Column(Boolean, nullable=True)
    helpful_votes = Column(Integer, default=0, nullable=False)
    
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    time_spent_minutes = Column(Integer, nullable=True)
    
    is_flagged = Column(Boolean, default=False, nullable=False)
    flagged_reason = Column(Text, nullable=True)
    moderated_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    essay = relationship("StudentEssay", foreign_keys=[essay_id], back_populates="peer_reviews")
    reviewer_student = relationship("Student", foreign_keys=[reviewer_student_id], lazy="select")
    moderator = relationship("User", foreign_keys=[moderated_by])
    
    __table_args__ = (
        UniqueConstraint('essay_id', 'reviewer_student_id', name='uq_essay_reviewer'),
        Index('idx_essay_peer_review_institution', 'institution_id'),
        Index('idx_essay_peer_review_essay', 'essay_id'),
        Index('idx_essay_peer_review_reviewer', 'reviewer_student_id'),
        Index('idx_essay_peer_review_status', 'status'),
    )


class EssayTemplate(Base):
    __tablename__ = "essay_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(500), nullable=False)
    prompt_type = Column(SQLEnum(PromptType), nullable=False, index=True)
    essay_text = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=False)
    
    year_submitted = Column(Integer, nullable=True)
    scholarship_name = Column(String(255), nullable=True)
    success_outcome = Column(String(255), nullable=True)
    
    annotated_version = Column(Text, nullable=True)
    key_strengths = Column(JSON, nullable=True)
    techniques_used = Column(JSON, nullable=True)
    
    is_anonymized = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    helpful_count = Column(Integer, default=0, nullable=False)
    
    uploaded_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    uploader = relationship("User")
    
    __table_args__ = (
        Index('idx_essay_template_institution', 'institution_id'),
        Index('idx_essay_template_type', 'prompt_type'),
        Index('idx_essay_template_featured', 'is_featured'),
        Index('idx_essay_template_active', 'is_active'),
    )


class EssayAnalytics(Base):
    __tablename__ = "essay_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    essay_id = Column(Integer, ForeignKey('student_essays.id', ondelete='CASCADE'), nullable=False, index=True)
    
    revision_number = Column(Integer, nullable=False)
    word_count = Column(Integer, nullable=False)
    
    avg_peer_review_score = Column(Float, nullable=True)
    num_peer_reviews = Column(Integer, default=0, nullable=False)
    
    grammar_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    content_quality_score = Column(Float, nullable=True)
    authenticity_score = Column(Float, nullable=True)
    
    readability_score = Column(Float, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    
    improvement_from_previous = Column(Float, nullable=True)
    
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    essay = relationship("StudentEssay", back_populates="analytics")
    
    __table_args__ = (
        Index('idx_essay_analytics_institution', 'institution_id'),
        Index('idx_essay_analytics_essay', 'essay_id'),
        Index('idx_essay_analytics_revision', 'revision_number'),
    )


class ReviewRubric(Base):
    __tablename__ = "review_rubrics"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    prompt_type = Column(SQLEnum(PromptType), nullable=True, index=True)
    
    content_criteria = Column(JSON, nullable=False)
    clarity_criteria = Column(JSON, nullable=False)
    grammar_criteria = Column(JSON, nullable=False)
    authenticity_criteria = Column(JSON, nullable=False)
    
    scoring_scale = Column(Integer, default=5, nullable=False)
    weight_content = Column(Float, default=0.35, nullable=False)
    weight_clarity = Column(Float, default=0.25, nullable=False)
    weight_grammar = Column(Float, default=0.20, nullable=False)
    weight_authenticity = Column(Float, default=0.20, nullable=False)
    
    instructions_for_reviewers = Column(Text, nullable=True)
    
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_review_rubric_institution', 'institution_id'),
        Index('idx_review_rubric_type', 'prompt_type'),
        Index('idx_review_rubric_default', 'is_default'),
        Index('idx_review_rubric_active', 'is_active'),
    )
