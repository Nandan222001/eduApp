from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Index, JSON,
    Numeric, Text, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from src.database import Base


# These four enums mirror src/schemas/learning_styles.py's Pydantic enums
# (same names, same string values). This is the codebase's established split
# for this router class of model -- schemas own the API-facing enum, models
# own an identical SQLAlchemy-facing copy for the Column type (see
# src/models/study_material.py's MaterialType / src/models/college_planning.py's
# ApplicationStatus for the same pattern) -- rather than the model importing
# from the schemas module.
class ContentDeliveryFormat(str, Enum):
    VIDEO = "video"
    TEXT = "text"
    AUDIO = "audio"
    INTERACTIVE = "interactive"
    HANDS_ON = "hands_on"
    MIXED = "mixed"


class ProcessingStyle(str, Enum):
    SEQUENTIAL = "sequential"
    GLOBAL = "global"
    BALANCED = "balanced"


class SocialPreference(str, Enum):
    SOLITARY = "solitary"
    SOCIAL = "social"
    MIXED = "mixed"


class AssessmentStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"


class LearningStyleProfile(Base):
    __tablename__ = "learning_style_profiles"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    visual_score = Column(Numeric(5, 4), default=0.25, nullable=False)
    auditory_score = Column(Numeric(5, 4), default=0.25, nullable=False)
    kinesthetic_score = Column(Numeric(5, 4), default=0.25, nullable=False)
    reading_writing_score = Column(Numeric(5, 4), default=0.25, nullable=False)

    social_vs_solitary = Column(SQLEnum(SocialPreference), default=SocialPreference.MIXED, nullable=False)
    social_score = Column(Numeric(5, 4), default=0.50, nullable=False)
    sequential_vs_global = Column(SQLEnum(ProcessingStyle), default=ProcessingStyle.BALANCED, nullable=False)
    sequential_score = Column(Numeric(5, 4), default=0.50, nullable=False)

    cognitive_strengths = Column(JSON, nullable=True)

    # `dominant_style`/`secondary_style` are set by LearningStylesService's VARK
    # scoring path; `primary_style`/`preferences`/`completed_at` are set by the
    # separate quiz-scoring path in src/api/v1/learning_styles.py
    # (submit_student_assessment) that writes to this same table directly.
    # Both code paths are kept, matching what's actually in the router/service.
    dominant_style = Column(String(50), nullable=True)
    secondary_style = Column(String(50), nullable=True)
    primary_style = Column(String(50), nullable=True)
    preferences = Column(JSON, nullable=True)

    confidence_level = Column(Numeric(5, 4), nullable=True)
    assessment_results = Column(JSON, nullable=True)
    last_assessment_date = Column(DateTime, nullable=True)
    total_assessments = Column(Integer, default=0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    assessments = relationship("LearningStyleAssessment", back_populates="profile", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_learning_style_profile_institution', 'institution_id'),
    )


class LearningStyleAssessment(Base):
    __tablename__ = "learning_style_assessments"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey('learning_style_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    assessment_type = Column(String(50), default="vark", nullable=False)
    questions = Column(JSON, nullable=False)
    responses = Column(JSON, nullable=True)
    status = Column(SQLEnum(AssessmentStatus), default=AssessmentStatus.PENDING, nullable=False, index=True)

    visual_score = Column(Numeric(5, 4), nullable=True)
    auditory_score = Column(Numeric(5, 4), nullable=True)
    kinesthetic_score = Column(Numeric(5, 4), nullable=True)
    reading_writing_score = Column(Numeric(5, 4), nullable=True)
    social_score = Column(Numeric(5, 4), nullable=True)
    sequential_score = Column(Numeric(5, 4), nullable=True)

    cognitive_analysis = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    profile = relationship("LearningStyleProfile", back_populates="assessments")

    __table_args__ = (
        Index('idx_learning_style_assessment_student', 'student_id', 'created_at'),
    )


class ContentTag(Base):
    __tablename__ = "content_tags"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)

    content_type = Column(String(50), nullable=False)
    content_id = Column(Integer, nullable=False)

    visual_suitability = Column(Numeric(5, 4), default=0.50, nullable=False)
    auditory_suitability = Column(Numeric(5, 4), default=0.50, nullable=False)
    kinesthetic_suitability = Column(Numeric(5, 4), default=0.50, nullable=False)
    reading_writing_suitability = Column(Numeric(5, 4), default=0.50, nullable=False)

    delivery_format = Column(SQLEnum(ContentDeliveryFormat), nullable=False)
    difficulty_level = Column(String(20), nullable=True)

    supports_social_learning = Column(Boolean, default=False, nullable=False)
    supports_solitary_learning = Column(Boolean, default=True, nullable=False)
    sequential_flow = Column(Boolean, default=False, nullable=False)
    holistic_approach = Column(Boolean, default=False, nullable=False)

    # `metadata` is reserved on Declarative models for SQLAlchemy's own MetaData
    # object, so the attribute is `metadata_json` while the DB/API-facing column
    # name stays `metadata` (same pattern as src/models/merchandise.py and
    # src/models/subscription.py).
    metadata_json = Column('metadata', JSON, nullable=True)

    tagged_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    auto_tagged = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    tagger = relationship("User")

    __table_args__ = (
        Index('idx_content_tag_content', 'content_type', 'content_id', unique=True),
    )


class AdaptiveContentRecommendation(Base):
    __tablename__ = "adaptive_content_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey('learning_style_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    content_type = Column(String(50), nullable=False)
    content_id = Column(Integer, nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)

    recommended_format = Column(SQLEnum(ContentDeliveryFormat), nullable=False)
    learning_style_match_score = Column(Numeric(5, 4), nullable=False)
    difficulty_match_score = Column(Numeric(5, 4), nullable=False)
    performance_based_score = Column(Numeric(5, 4), nullable=False)
    collaborative_filter_score = Column(Numeric(5, 4), nullable=False)
    overall_score = Column(Numeric(5, 4), nullable=False)
    rank = Column(Integer, nullable=True)
    reasoning = Column(JSON, nullable=True)

    was_viewed = Column(Boolean, default=False, nullable=False)
    was_engaged = Column(Boolean, default=False, nullable=False)
    engagement_score = Column(Numeric(5, 4), nullable=True)
    effectiveness_score = Column(Numeric(5, 4), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    profile = relationship("LearningStyleProfile")

    __table_args__ = (
        Index('idx_adaptive_recommendation_student', 'student_id', 'institution_id', 'created_at'),
    )


class PersonalizedContentFeed(Base):
    __tablename__ = "personalized_content_feeds"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    content_type = Column(String(50), nullable=False)
    content_id = Column(Integer, nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    position = Column(Integer, nullable=False)

    learning_style_score = Column(Numeric(5, 4), nullable=False)
    collaborative_score = Column(Numeric(5, 4), nullable=False)
    performance_score = Column(Numeric(5, 4), nullable=False)
    recency_score = Column(Numeric(5, 4), nullable=False)
    final_score = Column(Numeric(5, 4), nullable=False)

    algorithm_version = Column(String(20), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    was_clicked = Column(Boolean, default=False, nullable=False)
    clicked_at = Column(DateTime, nullable=True)
    time_spent_seconds = Column(Integer, nullable=True)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_personalized_feed_student', 'student_id', 'institution_id', 'position'),
        Index('idx_personalized_feed_expires', 'expires_at'),
    )


class AdaptiveLearningSession(Base):
    __tablename__ = "adaptive_learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    content_type = Column(String(50), nullable=False)
    content_id = Column(Integer, nullable=False)

    initial_difficulty = Column(String(20), nullable=True)
    current_difficulty = Column(String(20), nullable=True)
    initial_format = Column(SQLEnum(ContentDeliveryFormat), nullable=False)
    current_format = Column(SQLEnum(ContentDeliveryFormat), nullable=False)

    performance_data = Column(JSON, nullable=True)
    engagement_data = Column(JSON, nullable=True)
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    interaction_count = Column(Integer, default=0, nullable=False)
    difficulty_adjustments = Column(JSON, nullable=True)
    format_adjustments = Column(JSON, nullable=True)
    success_rate = Column(Numeric(5, 4), nullable=True)
    engagement_rate = Column(Numeric(5, 4), nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_adaptive_session_student', 'student_id', 'institution_id', 'started_at'),
    )


class LearningStyleEffectiveness(Base):
    __tablename__ = "learning_style_effectiveness"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    content_type = Column(String(50), nullable=False)
    content_id = Column(Integer, nullable=False)
    delivery_format = Column(SQLEnum(ContentDeliveryFormat), nullable=False)

    time_spent_seconds = Column(Integer, nullable=False)
    completion_rate = Column(Numeric(5, 4), nullable=True)
    pre_assessment_score = Column(Numeric(6, 2), nullable=True)
    post_assessment_score = Column(Numeric(6, 2), nullable=True)
    improvement = Column(Numeric(6, 2), nullable=True)
    engagement_score = Column(Numeric(5, 4), nullable=False)
    satisfaction_rating = Column(Integer, nullable=True)
    would_recommend = Column(Boolean, nullable=True)
    feedback = Column(Text, nullable=True)
    learning_style_at_time = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_learning_style_effectiveness_student', 'student_id', 'institution_id', 'created_at'),
    )
