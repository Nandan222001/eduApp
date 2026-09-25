from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal

from src.schemas.study_planner import WeakAreaResponse, _read_metadata_json


class ChapterPerformanceBase(BaseModel):
    average_score: Decimal
    total_attempts: int
    successful_attempts: int
    failed_attempts: int
    success_rate: Decimal
    time_spent_minutes: int = 0
    proficiency_level: Optional[str] = None
    trend: Optional[str] = None
    improvement_rate: Optional[Decimal] = None
    difficulty_rating: Optional[Decimal] = None
    mastery_score: Decimal


class ChapterPerformanceResponse(ChapterPerformanceBase):
    id: int
    institution_id: int
    student_id: int
    subject_id: int
    chapter_id: int
    last_practiced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class QuestionRecommendationBase(BaseModel):
    recommendation_score: Decimal
    relevance_score: Decimal
    difficulty_match_score: Decimal
    weakness_alignment_score: Decimal
    spaced_repetition_score: Decimal
    priority_rank: Optional[int] = None
    next_review_date: Optional[date] = None
    repetition_number: int = 0
    ease_factor: Decimal = Decimal('2.5')
    interval_days: int = 0


class QuestionRecommendationResponse(QuestionRecommendationBase):
    id: int
    institution_id: int
    student_id: int
    question_id: int
    last_reviewed_at: Optional[datetime] = None
    last_performance: Optional[Decimal] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    # `metadata` collides with the class-level `MetaData` registry every
    # SQLAlchemy declarative model inherits from `Base` -- see the detailed
    # comment on `_read_metadata_json` in `src.schemas.study_planner`. That
    # shadowing meant `GET /weakness-detection/question-recommendations`
    # and the `PUT .../{id}` update both raised
    # `pydantic_core.ValidationError` ("Input should be a valid dictionary")
    # on every single call, and `POST /weakness-detection/analyze` failed
    # the same way whenever it generated at least one recommendation.
    _fix_metadata = model_validator(mode="before")(_read_metadata_json)

    class Config:
        from_attributes = True


class QuestionRecommendationUpdate(BaseModel):
    performance_score: Decimal = Field(..., ge=0, le=100)


class FocusAreaBase(BaseModel):
    focus_type: str
    urgency_score: Decimal
    importance_score: Decimal
    impact_score: Decimal
    combined_priority: Decimal
    current_performance: Optional[Decimal] = None
    target_performance: Optional[Decimal] = None
    performance_gap: Optional[Decimal] = None
    recommended_hours: Decimal
    estimated_improvement: Optional[Decimal] = None
    confidence_level: Optional[str] = None
    reasoning: Optional[str] = None
    ai_insights: Optional[Dict[str, Any]] = None
    status: str = 'active'


class FocusAreaResponse(FocusAreaBase):
    id: int
    institution_id: int
    student_id: int
    subject_id: int
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FocusAreaUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class PersonalizedInsightBase(BaseModel):
    insight_type: str
    category: str
    title: str
    description: str
    severity: str
    priority: int
    is_actionable: bool = True
    actionable_items: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None
    supporting_data: Optional[Dict[str, Any]] = None
    affected_subjects: Optional[List[str]] = None
    affected_chapters: Optional[List[Dict[str, Any]]] = None
    ai_generated: bool = False
    confidence_score: Optional[Decimal] = None


class PersonalizedInsightResponse(PersonalizedInsightBase):
    id: int
    institution_id: int
    student_id: int
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PersonalizedInsightUpdate(BaseModel):
    is_acknowledged: Optional[bool] = None
    acknowledged_at: Optional[datetime] = None
    is_resolved: Optional[bool] = None
    resolved_at: Optional[datetime] = None


class AnalysisRequest(BaseModel):
    student_id: int
    target_exam_date: Optional[date] = None
    generate_recommendations: bool = True
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None


class ImprovementArea(BaseModel):
    chapter: str
    subject: str
    mastery_score: float
    trend: str


class TopPriority(BaseModel):
    area: str
    priority_score: float
    recommended_hours: float
    type: str


class AnalysisSummary(BaseModel):
    total_chapters_analyzed: int
    weak_chapters_count: int
    weak_areas_count: int
    focus_areas_count: int
    critical_focus_areas: int
    question_recommendations_count: int
    personalized_insights_count: int
    average_mastery_score: float
    improvement_areas: List[ImprovementArea]
    top_priorities: List[TopPriority]


class ComprehensiveAnalysisResponse(BaseModel):
    summary: AnalysisSummary
    chapter_performances: List[ChapterPerformanceResponse]
    # Was `List[Any]` -- holding raw `WeakArea` ORM objects straight from
    # the engine's query, unlike every sibling field here, which properly
    # wraps its ORM objects in `.model_validate(...)`. Pydantic-core's
    # serializer (what FastAPI's `response_model` actually uses to build
    # the JSON body, not `fastapi.encoders.jsonable_encoder`) has no idea
    # how to serialize an arbitrary SQLAlchemy model and raised
    # `PydanticSerializationError: Unable to serialize unknown type` on
    # every single call to `POST /weakness-detection/analyze` that found
    # at least one weak area -- the endpoint's single most common,
    # meaningful case.
    weak_areas: List[WeakAreaResponse]
    focus_areas: List[FocusAreaResponse]
    question_recommendations: List[QuestionRecommendationResponse]
    personalized_insights: List[PersonalizedInsightResponse]


class RecommendationListRequest(BaseModel):
    student_id: int
    limit: int = 20
    include_completed: bool = False
    due_only: bool = False


class FocusAreaListRequest(BaseModel):
    student_id: int
    status: Optional[str] = None
    focus_type: Optional[str] = None
    limit: int = 50


class InsightListRequest(BaseModel):
    student_id: int
    category: Optional[str] = None
    severity: Optional[str] = None
    is_resolved: Optional[bool] = None
    limit: int = 50


class StudyPlanRecommendation(BaseModel):
    daily_hours: float
    study_duration_days: int
    focus_areas: List[Dict[str, Any]]
    estimated_improvement: float
    confidence_level: str


class SpacedRepetitionSchedule(BaseModel):
    question_id: int
    current_interval: int
    next_review_date: date
    ease_factor: float
    repetition_number: int
    estimated_retention: float
