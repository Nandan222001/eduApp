from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Float, JSON, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    ELEMENTARY = "elementary"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class MasteryLevel(str, Enum):
    NOT_STARTED = "not_started"
    LEARNING = "learning"
    PRACTICING = "practicing"
    MASTERED = "mastered"
    NEEDS_REVIEW = "needs_review"


class LearningPathStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    ABANDONED = "abandoned"


class MilestoneStatus(str, Enum):
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ReviewPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(Date, nullable=True)
    status = Column(SQLEnum(LearningPathStatus), default=LearningPathStatus.ACTIVE, nullable=False, index=True)
    current_difficulty = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.BEGINNER, nullable=False)
    learning_velocity = Column(Float, default=1.0, nullable=False)
    adaptation_score = Column(Float, default=0.0, nullable=False)
    completion_percentage = Column(Float, default=0.0, nullable=False)
    estimated_completion_date = Column(Date, nullable=True)
    personalization_metadata = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    grade = relationship("Grade")
    subject = relationship("Subject")
    milestones = relationship("LearningMilestone", back_populates="learning_path", cascade="all, delete-orphan")
    topic_sequences = relationship("TopicSequence", back_populates="learning_path", cascade="all, delete-orphan")
    velocity_records = relationship("LearningVelocityRecord", back_populates="learning_path", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_learning_path_institution', 'institution_id'),
        Index('idx_learning_path_student', 'student_id'),
        Index('idx_learning_path_grade', 'grade_id'),
        Index('idx_learning_path_subject', 'subject_id'),
        Index('idx_learning_path_status', 'status'),
        Index('idx_learning_path_active', 'is_active'),
    )


class TopicSequence(Base):
    __tablename__ = "topic_sequences"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    learning_path_id = Column(Integer, ForeignKey('learning_paths.id', ondelete='CASCADE'), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, index=True)
    sequence_order = Column(Integer, nullable=False)
    prerequisite_topic_ids = Column(JSON, nullable=True)
    difficulty_level = Column(SQLEnum(DifficultyLevel), nullable=False)
    mastery_level = Column(SQLEnum(MasteryLevel), default=MasteryLevel.NOT_STARTED, nullable=False)
    mastery_score = Column(Float, default=0.0, nullable=False)
    estimated_duration_minutes = Column(Integer, nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)
    adaptive_difficulty_boost = Column(Float, default=0.0, nullable=False)
    is_unlocked = Column(Boolean, default=False, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_reviewed_at = Column(DateTime, nullable=True)
    next_review_date = Column(Date, nullable=True)
    review_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    learning_path = relationship("LearningPath", back_populates="topic_sequences")
    topic = relationship("Topic")
    performance_data = relationship("TopicPerformanceData", back_populates="topic_sequence", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('learning_path_id', 'topic_id', name='uq_learning_path_topic'),
        Index('idx_topic_sequence_institution', 'institution_id'),
        Index('idx_topic_sequence_learning_path', 'learning_path_id'),
        Index('idx_topic_sequence_topic', 'topic_id'),
        Index('idx_topic_sequence_order', 'sequence_order'),
        Index('idx_topic_sequence_mastery', 'mastery_level'),
        Index('idx_topic_sequence_unlocked', 'is_unlocked'),
    )


class TopicPerformanceData(Base):
    __tablename__ = "topic_performance_data"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    topic_sequence_id = Column(Integer, ForeignKey('topic_sequences.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    quiz_score = Column(Float, nullable=True)
    assignment_score = Column(Float, nullable=True)
    practice_accuracy = Column(Float, nullable=True)
    time_spent_minutes = Column(Integer, default=0, nullable=False)
    attempts_count = Column(Integer, default=0, nullable=False)
    correct_answers = Column(Integer, default=0, nullable=False)
    total_questions = Column(Integer, default=0, nullable=False)
    struggle_indicators = Column(JSON, nullable=True)
    performance_trend = Column(String(20), nullable=True)
    ai_confidence_score = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    topic_sequence = relationship("TopicSequence", back_populates="performance_data")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_topic_performance_institution', 'institution_id'),
        Index('idx_topic_performance_sequence', 'topic_sequence_id'),
        Index('idx_topic_performance_student', 'student_id'),
        Index('idx_topic_performance_date', 'recorded_at'),
    )


class LearningMilestone(Base):
    __tablename__ = "learning_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    learning_path_id = Column(Integer, ForeignKey('learning_paths.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    milestone_order = Column(Integer, nullable=False)
    required_topic_ids = Column(JSON, nullable=False)
    status = Column(SQLEnum(MilestoneStatus), default=MilestoneStatus.LOCKED, nullable=False, index=True)
    target_date = Column(Date, nullable=True)
    completion_criteria = Column(JSON, nullable=True)
    reward_points = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    learning_path = relationship("LearningPath", back_populates="milestones")
    
    __table_args__ = (
        Index('idx_milestone_institution', 'institution_id'),
        Index('idx_milestone_learning_path', 'learning_path_id'),
        Index('idx_milestone_order', 'milestone_order'),
        Index('idx_milestone_status', 'status'),
    )


class SpacedRepetitionSchedule(Base):
    __tablename__ = "spaced_repetition_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, index=True)
    learning_path_id = Column(Integer, ForeignKey('learning_paths.id', ondelete='CASCADE'), nullable=True, index=True)
    easiness_factor = Column(Float, default=2.5, nullable=False)
    repetition_number = Column(Integer, default=0, nullable=False)
    interval_days = Column(Integer, default=1, nullable=False)
    last_review_date = Column(Date, nullable=True, index=True)
    next_review_date = Column(Date, nullable=False, index=True)
    review_quality = Column(Integer, nullable=True)
    priority = Column(SQLEnum(ReviewPriority), default=ReviewPriority.MEDIUM, nullable=False, index=True)
    is_due = Column(Boolean, default=False, nullable=False, index=True)
    consecutive_correct = Column(Integer, default=0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    average_quality = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    topic = relationship("Topic")
    learning_path = relationship("LearningPath")
    review_history = relationship("ReviewHistory", back_populates="schedule", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'topic_id', 'learning_path_id', name='uq_student_topic_path_schedule'),
        Index('idx_spaced_rep_institution', 'institution_id'),
        Index('idx_spaced_rep_student', 'student_id'),
        Index('idx_spaced_rep_topic', 'topic_id'),
        Index('idx_spaced_rep_learning_path', 'learning_path_id'),
        Index('idx_spaced_rep_next_review', 'next_review_date'),
        Index('idx_spaced_rep_last_review', 'last_review_date'),
        Index('idx_spaced_rep_priority', 'priority'),
        Index('idx_spaced_rep_due', 'is_due'),
    )


class ReviewHistory(Base):
    __tablename__ = "review_history"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey('spaced_repetition_schedules.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    review_date = Column(Date, nullable=False, index=True)
    review_quality = Column(Integer, nullable=False)
    time_spent_minutes = Column(Integer, nullable=True)
    score = Column(Float, nullable=True)
    difficulty_rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    schedule = relationship("SpacedRepetitionSchedule", back_populates="review_history")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_review_history_institution', 'institution_id'),
        Index('idx_review_history_schedule', 'schedule_id'),
        Index('idx_review_history_student', 'student_id'),
        Index('idx_review_history_date', 'review_date'),
    )


class LearningVelocityRecord(Base):
    __tablename__ = "learning_velocity_records"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    learning_path_id = Column(Integer, ForeignKey('learning_paths.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    topics_completed = Column(Integer, default=0, nullable=False)
    total_time_minutes = Column(Integer, default=0, nullable=False)
    average_mastery_score = Column(Float, nullable=True)
    velocity_score = Column(Float, nullable=False)
    efficiency_rating = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)
    recommended_pace_adjustment = Column(Float, default=1.0, nullable=False)
    metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    learning_path = relationship("LearningPath", back_populates="velocity_records")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_velocity_record_institution', 'institution_id'),
        Index('idx_velocity_record_learning_path', 'learning_path_id'),
        Index('idx_velocity_record_student', 'student_id'),
        Index('idx_velocity_record_period', 'period_start', 'period_end'),
    )


class DifficultyProgression(Base):
    __tablename__ = "difficulty_progressions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, index=True)
    learning_path_id = Column(Integer, ForeignKey('learning_paths.id', ondelete='CASCADE'), nullable=True, index=True)
    current_difficulty = Column(SQLEnum(DifficultyLevel), nullable=False)
    previous_difficulty = Column(SQLEnum(DifficultyLevel), nullable=True)
    recommended_difficulty = Column(SQLEnum(DifficultyLevel), nullable=False)
    performance_score = Column(Float, nullable=False)
    adaptation_reason = Column(String(200), nullable=True)
    confidence_interval = Column(JSON, nullable=True)
    adjusted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    topic = relationship("Topic")
    learning_path = relationship("LearningPath")
    
    __table_args__ = (
        Index('idx_difficulty_progression_institution', 'institution_id'),
        Index('idx_difficulty_progression_student', 'student_id'),
        Index('idx_difficulty_progression_topic', 'topic_id'),
        Index('idx_difficulty_progression_learning_path', 'learning_path_id'),
        Index('idx_difficulty_progression_adjusted', 'adjusted_at'),
    )


class PrerequisiteRelationship(Base):
    __tablename__ = "prerequisite_relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, index=True)
    prerequisite_topic_id = Column(Integer, ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, index=True)
    strength = Column(Float, default=1.0, nullable=False)
    is_hard_prerequisite = Column(Boolean, default=True, nullable=False)
    minimum_mastery_required = Column(Float, default=0.7, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    topic = relationship("Topic", foreign_keys=[topic_id])
    prerequisite_topic = relationship("Topic", foreign_keys=[prerequisite_topic_id])
    
    __table_args__ = (
        UniqueConstraint('topic_id', 'prerequisite_topic_id', name='uq_topic_prerequisite'),
        Index('idx_prerequisite_institution', 'institution_id'),
        Index('idx_prerequisite_topic', 'topic_id'),
        Index('idx_prerequisite_topic_prereq', 'prerequisite_topic_id'),
    )
