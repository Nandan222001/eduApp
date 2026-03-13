from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


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


class LearningPathCreate(BaseModel):
    student_id: int
    grade_id: int
    subject_id: Optional[int] = None
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    target_date: Optional[date] = None


class LearningPathUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[LearningPathStatus] = None


class TopicSequenceBase(BaseModel):
    topic_id: int
    sequence_order: int
    prerequisite_topic_ids: Optional[List[int]] = None
    difficulty_level: DifficultyLevel
    estimated_duration_minutes: Optional[int] = None


class TopicSequenceResponse(TopicSequenceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    learning_path_id: int
    mastery_level: MasteryLevel
    mastery_score: float
    actual_duration_minutes: Optional[int] = None
    adaptive_difficulty_boost: float
    is_unlocked: bool
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_reviewed_at: Optional[datetime] = None
    next_review_date: Optional[date] = None
    review_count: int
    created_at: datetime
    updated_at: datetime


class TopicPerformanceDataCreate(BaseModel):
    topic_sequence_id: int
    quiz_score: Optional[float] = None
    assignment_score: Optional[float] = None
    practice_accuracy: Optional[float] = None
    time_spent_minutes: int = 0
    attempts_count: int = 0
    correct_answers: int = 0
    total_questions: int = 0
    struggle_indicators: Optional[Dict[str, Any]] = None
    performance_trend: Optional[str] = None
    ai_confidence_score: Optional[float] = None


class TopicPerformanceDataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    topic_sequence_id: int
    student_id: int
    quiz_score: Optional[float] = None
    assignment_score: Optional[float] = None
    practice_accuracy: Optional[float] = None
    time_spent_minutes: int
    attempts_count: int
    correct_answers: int
    total_questions: int
    struggle_indicators: Optional[Dict[str, Any]] = None
    performance_trend: Optional[str] = None
    ai_confidence_score: Optional[float] = None
    recorded_at: datetime
    created_at: datetime


class LearningMilestoneCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    milestone_order: int
    required_topic_ids: List[int]
    target_date: Optional[date] = None
    completion_criteria: Optional[Dict[str, Any]] = None
    reward_points: int = 0


class LearningMilestoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    learning_path_id: int
    title: str
    description: Optional[str] = None
    milestone_order: int
    required_topic_ids: List[int]
    status: MilestoneStatus
    target_date: Optional[date] = None
    completion_criteria: Optional[Dict[str, Any]] = None
    reward_points: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class LearningPathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    grade_id: int
    subject_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: LearningPathStatus
    current_difficulty: DifficultyLevel
    learning_velocity: float
    adaptation_score: float
    completion_percentage: float
    estimated_completion_date: Optional[date] = None
    personalization_metadata: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LearningPathDetailResponse(LearningPathResponse):
    milestones: List[LearningMilestoneResponse] = []
    topic_sequences: List[TopicSequenceResponse] = []


class SpacedRepetitionScheduleCreate(BaseModel):
    topic_id: int
    learning_path_id: Optional[int] = None


class SpacedRepetitionScheduleUpdate(BaseModel):
    review_quality: int = Field(..., ge=0, le=5)
    time_spent_minutes: Optional[int] = None
    score: Optional[float] = None
    difficulty_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class SpacedRepetitionScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    student_id: int
    topic_id: int
    learning_path_id: Optional[int] = None
    easiness_factor: float
    repetition_number: int
    interval_days: int
    last_review_date: Optional[date] = None
    next_review_date: date
    review_quality: Optional[int] = None
    priority: ReviewPriority
    is_due: bool
    consecutive_correct: int
    total_reviews: int
    average_quality: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class ReviewHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    schedule_id: int
    student_id: int
    review_date: date
    review_quality: int
    time_spent_minutes: Optional[int] = None
    score: Optional[float] = None
    difficulty_rating: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime


class LearningVelocityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    learning_path_id: int
    student_id: int
    period_start: date
    period_end: date
    topics_completed: int
    total_time_minutes: int
    average_mastery_score: Optional[float] = None
    velocity_score: float
    efficiency_rating: Optional[float] = None
    consistency_score: Optional[float] = None
    recommended_pace_adjustment: float
    metrics: Optional[Dict[str, Any]] = None
    created_at: datetime


class DifficultyProgressionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    student_id: int
    topic_id: int
    learning_path_id: Optional[int] = None
    current_difficulty: DifficultyLevel
    previous_difficulty: Optional[DifficultyLevel] = None
    recommended_difficulty: DifficultyLevel
    performance_score: float
    adaptation_reason: Optional[str] = None
    confidence_interval: Optional[Dict[str, Any]] = None
    adjusted_at: datetime
    created_at: datetime


class PrerequisiteRelationshipCreate(BaseModel):
    topic_id: int
    prerequisite_topic_id: int
    strength: float = Field(default=1.0, ge=0.0, le=1.0)
    is_hard_prerequisite: bool = True
    minimum_mastery_required: float = Field(default=0.7, ge=0.0, le=1.0)


class PrerequisiteRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    topic_id: int
    prerequisite_topic_id: int
    strength: float
    is_hard_prerequisite: bool
    minimum_mastery_required: float
    created_at: datetime
    updated_at: datetime


class SequenceGenerationRequest(BaseModel):
    student_id: int
    grade_id: int
    subject_id: Optional[int] = None
    topic_ids: List[int]
    target_date: Optional[date] = None
    include_ai_predictions: bool = True


class VisualizationDataResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    milestones: List[Dict[str, Any]]
    progress_summary: Dict[str, Any]


class MasteryUpdateRequest(BaseModel):
    topic_sequence_id: int
    performance_score: float = Field(..., ge=0.0, le=1.0)
    time_spent_minutes: int
    correct_answers: int
    total_questions: int


class AdaptiveDifficultyRequest(BaseModel):
    student_id: int
    topic_id: int
    recent_performance_scores: List[float]
    time_pressure_factor: Optional[float] = Field(default=1.0, ge=0.5, le=2.0)


class LearningPathProgressResponse(BaseModel):
    learning_path_id: int
    completion_percentage: float
    topics_completed: int
    topics_total: int
    current_streak: int
    estimated_days_remaining: Optional[int] = None
    next_review_topics: List[Dict[str, Any]]
    upcoming_milestones: List[Dict[str, Any]]
    velocity_trend: str
    recommendations: List[str]
