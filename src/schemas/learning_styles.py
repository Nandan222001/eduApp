from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum


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


class LearningStyleProfileBase(BaseModel):
    visual_score: Decimal = Field(default=Decimal("0.25"), ge=0, le=1)
    auditory_score: Decimal = Field(default=Decimal("0.25"), ge=0, le=1)
    kinesthetic_score: Decimal = Field(default=Decimal("0.25"), ge=0, le=1)
    reading_writing_score: Decimal = Field(default=Decimal("0.25"), ge=0, le=1)
    social_vs_solitary: SocialPreference = SocialPreference.MIXED
    social_score: Decimal = Field(default=Decimal("0.50"), ge=0, le=1)
    sequential_vs_global: ProcessingStyle = ProcessingStyle.BALANCED
    sequential_score: Decimal = Field(default=Decimal("0.50"), ge=0, le=1)
    cognitive_strengths: Optional[Dict[str, Any]] = None


class LearningStyleProfileCreate(LearningStyleProfileBase):
    student_id: int


class LearningStyleProfileUpdate(BaseModel):
    visual_score: Optional[Decimal] = Field(None, ge=0, le=1)
    auditory_score: Optional[Decimal] = Field(None, ge=0, le=1)
    kinesthetic_score: Optional[Decimal] = Field(None, ge=0, le=1)
    reading_writing_score: Optional[Decimal] = Field(None, ge=0, le=1)
    social_vs_solitary: Optional[SocialPreference] = None
    social_score: Optional[Decimal] = Field(None, ge=0, le=1)
    sequential_vs_global: Optional[ProcessingStyle] = None
    sequential_score: Optional[Decimal] = Field(None, ge=0, le=1)
    cognitive_strengths: Optional[Dict[str, Any]] = None


class LearningStyleProfileResponse(LearningStyleProfileBase):
    id: int
    institution_id: int
    student_id: int
    dominant_style: Optional[str]
    secondary_style: Optional[str]
    confidence_level: Optional[Decimal]
    assessment_results: Optional[Dict[str, Any]]
    last_assessment_date: Optional[datetime]
    total_assessments: int
    is_verified: bool
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AssessmentQuestionCreate(BaseModel):
    question_text: str
    question_type: str
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[str] = None
    style_weights: Dict[str, Decimal]


class LearningStyleAssessmentCreate(BaseModel):
    student_id: int
    assessment_type: str = "vark"
    questions: List[Dict[str, Any]]


class AssessmentResponseSubmit(BaseModel):
    assessment_id: int
    responses: List[Dict[str, Any]]


class LearningStyleAssessmentResponse(BaseModel):
    id: int
    institution_id: int
    profile_id: int
    student_id: int
    assessment_type: str
    questions: List[Dict[str, Any]]
    responses: Optional[List[Dict[str, Any]]]
    status: AssessmentStatus
    visual_score: Optional[Decimal]
    auditory_score: Optional[Decimal]
    kinesthetic_score: Optional[Decimal]
    reading_writing_score: Optional[Decimal]
    social_score: Optional[Decimal]
    sequential_score: Optional[Decimal]
    cognitive_analysis: Optional[Dict[str, Any]]
    recommendations: Optional[Dict[str, Any]]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    time_taken_seconds: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContentTagCreate(BaseModel):
    content_type: str
    content_id: int
    visual_suitability: Decimal = Field(default=Decimal("0.50"), ge=0, le=1)
    auditory_suitability: Decimal = Field(default=Decimal("0.50"), ge=0, le=1)
    kinesthetic_suitability: Decimal = Field(default=Decimal("0.50"), ge=0, le=1)
    reading_writing_suitability: Decimal = Field(default=Decimal("0.50"), ge=0, le=1)
    delivery_format: ContentDeliveryFormat
    difficulty_level: Optional[str] = None
    supports_social_learning: bool = False
    supports_solitary_learning: bool = True
    sequential_flow: bool = False
    holistic_approach: bool = False
    metadata: Optional[Dict[str, Any]] = None
    auto_tagged: bool = False


class ContentTagUpdate(BaseModel):
    visual_suitability: Optional[Decimal] = Field(None, ge=0, le=1)
    auditory_suitability: Optional[Decimal] = Field(None, ge=0, le=1)
    kinesthetic_suitability: Optional[Decimal] = Field(None, ge=0, le=1)
    reading_writing_suitability: Optional[Decimal] = Field(None, ge=0, le=1)
    delivery_format: Optional[ContentDeliveryFormat] = None
    difficulty_level: Optional[str] = None
    supports_social_learning: Optional[bool] = None
    supports_solitary_learning: Optional[bool] = None
    sequential_flow: Optional[bool] = None
    holistic_approach: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class ContentTagResponse(BaseModel):
    id: int
    institution_id: int
    content_type: str
    content_id: int
    visual_suitability: Decimal
    auditory_suitability: Decimal
    kinesthetic_suitability: Decimal
    reading_writing_suitability: Decimal
    delivery_format: ContentDeliveryFormat
    difficulty_level: Optional[str]
    supports_social_learning: bool
    supports_solitary_learning: bool
    sequential_flow: bool
    holistic_approach: bool
    # The ORM attribute is `metadata_json` (SQLAlchemy reserves `metadata` on
    # Declarative models for the MetaData object), but the API keeps `metadata`
    # as the JSON key -- same pattern as src/schemas/merchandise.py.
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias='metadata_json', serialization_alias='metadata')
    auto_tagged: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdaptiveContentRecommendationResponse(BaseModel):
    id: int
    institution_id: int
    profile_id: int
    student_id: int
    content_type: str
    content_id: int
    subject_id: Optional[int]
    chapter_id: Optional[int]
    topic_id: Optional[int]
    recommended_format: ContentDeliveryFormat
    learning_style_match_score: Decimal
    difficulty_match_score: Decimal
    performance_based_score: Decimal
    collaborative_filter_score: Decimal
    overall_score: Decimal
    rank: Optional[int]
    reasoning: Optional[Dict[str, Any]]
    was_viewed: bool
    was_engaged: bool
    engagement_score: Optional[Decimal]
    effectiveness_score: Optional[Decimal]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PersonalizedContentFeedResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    content_type: str
    content_id: int
    subject_id: Optional[int]
    position: int
    learning_style_score: Decimal
    collaborative_score: Decimal
    performance_score: Decimal
    recency_score: Decimal
    final_score: Decimal
    algorithm_version: str
    generated_at: datetime
    was_clicked: bool
    clicked_at: Optional[datetime]
    time_spent_seconds: Optional[int]
    
    class Config:
        from_attributes = True


class GenerateRecommendationsRequest(BaseModel):
    student_id: int
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    limit: int = Field(default=10, ge=1, le=50)


class GenerateFeedRequest(BaseModel):
    student_id: int
    subject_id: Optional[int] = None
    limit: int = Field(default=20, ge=1, le=100)


class AdaptiveLearningSessionCreate(BaseModel):
    student_id: int
    content_type: str
    content_id: int
    initial_format: ContentDeliveryFormat
    initial_difficulty: Optional[str] = "medium"


class AdaptiveLearningSessionResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    content_type: str
    content_id: int
    initial_difficulty: Optional[str]
    current_difficulty: Optional[str]
    initial_format: ContentDeliveryFormat
    current_format: ContentDeliveryFormat
    performance_data: Optional[Dict[str, Any]]
    engagement_data: Optional[Dict[str, Any]]
    time_spent_seconds: int
    interaction_count: int
    difficulty_adjustments: Optional[List[Dict[str, Any]]]
    format_adjustments: Optional[List[Dict[str, Any]]]
    success_rate: Optional[Decimal]
    engagement_rate: Optional[Decimal]
    started_at: datetime
    last_activity_at: datetime
    ended_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PerformanceMetricsUpdate(BaseModel):
    success_rate: float = Field(ge=0, le=1)
    questions_attempted: Optional[int] = None
    questions_correct: Optional[int] = None
    average_time_per_question: Optional[float] = None


class EngagementMetricsUpdate(BaseModel):
    engagement_rate: float = Field(ge=0, le=1)
    time_spent_seconds: int = Field(ge=0)
    interaction_count: int = Field(ge=0)
    pause_count: Optional[int] = None
    replay_count: Optional[int] = None


class LearningStyleEffectivenessCreate(BaseModel):
    student_id: int
    content_type: str
    content_id: int
    delivery_format: ContentDeliveryFormat
    time_spent_seconds: int
    completion_rate: Optional[Decimal] = Field(None, ge=0, le=1)
    pre_assessment_score: Optional[Decimal] = Field(None, ge=0, le=100)
    post_assessment_score: Optional[Decimal] = Field(None, ge=0, le=100)
    improvement: Optional[Decimal] = None
    engagement_score: Decimal = Field(ge=0, le=1)
    satisfaction_rating: Optional[int] = Field(None, ge=1, le=5)
    would_recommend: Optional[bool] = None
    feedback: Optional[str] = None


class LearningStyleEffectivenessResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    content_type: str
    content_id: int
    delivery_format: ContentDeliveryFormat
    time_spent_seconds: int
    completion_rate: Optional[Decimal]
    pre_assessment_score: Optional[Decimal]
    post_assessment_score: Optional[Decimal]
    improvement: Optional[Decimal]
    engagement_score: Decimal
    satisfaction_rating: Optional[int]
    would_recommend: Optional[bool]
    feedback: Optional[str]
    learning_style_at_time: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class EffectivenessAnalyticsResponse(BaseModel):
    total_records: int
    by_format: Dict[str, Any]
    by_learning_style: Dict[str, Any]
    overall_metrics: Dict[str, Any]
    recommendations: List[str]


class StudentPerformanceTrendResponse(BaseModel):
    average_success_rate: float
    average_engagement_rate: float
    total_sessions: int
    total_time_spent: int
    trend: str
    difficulty_distribution: Dict[str, int]
