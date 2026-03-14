from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal


class LearningStyleProfile(BaseModel):
    visual_score: float = Field(..., ge=0, le=1)
    auditory_score: float = Field(..., ge=0, le=1)
    reading_writing_score: float = Field(..., ge=0, le=1)
    kinesthetic_score: float = Field(..., ge=0, le=1)
    dominant_style: str
    confidence_level: Optional[float] = None

    class Config:
        from_attributes = True


class DifficultyRecommendation(BaseModel):
    mastery_score: float
    recommended_difficulty: str
    difficulty_range: List[str]
    confidence: float
    reasoning: str

    class Config:
        from_attributes = True


class MaterialRecommendation(BaseModel):
    material_id: int
    title: str
    material_type: str
    score: float
    reasons: List[str]
    explanation: str
    sources: List[str]
    effectiveness_score: Optional[float] = None
    style_match_score: Optional[float] = None
    difficulty_match_score: Optional[float] = None

    class Config:
        from_attributes = True


class ExternalContentItem(BaseModel):
    source: str
    title: str
    url: str
    type: str
    subject: str
    topic: str
    description: str
    estimated_duration_minutes: Optional[int] = None
    difficulty: Optional[str] = None
    language: str = "en"

    class Config:
        from_attributes = True


class ExternalContentRecommendation(BaseModel):
    weak_area_id: int
    topic: str
    subject: str
    content: Dict[str, List[ExternalContentItem]]

    class Config:
        from_attributes = True


class StudyPathChapterItem(BaseModel):
    chapter_id: int
    chapter_name: str
    sequence: int
    mastery_score: float
    is_weak: bool
    priority_score: float
    topics: List[Dict[str, Any]]
    estimated_hours: float

    class Config:
        from_attributes = True


class StudyPath(BaseModel):
    subject_id: int
    student_id: int
    path: List[StudyPathChapterItem]
    total_chapters: int
    total_estimated_hours: float
    generated_at: str

    class Config:
        from_attributes = True


class WeakAreaSummary(BaseModel):
    id: int
    subject: str
    chapter: Optional[str]
    topic: Optional[str]
    weakness_score: float
    average_score: float
    difficulty_recommendation: Optional[DifficultyRecommendation] = None

    class Config:
        from_attributes = True


class ComprehensiveRecommendationResponse(BaseModel):
    student_id: int
    generated_at: str
    learning_style_profile: LearningStyleProfile
    summary: Dict[str, int]
    recommended_materials: List[MaterialRecommendation]
    external_content: List[ExternalContentRecommendation]
    study_paths: List[StudyPath]
    weak_areas_summary: List[WeakAreaSummary]

    class Config:
        from_attributes = True


class TopicRecommendationRequest(BaseModel):
    topic_id: int
    include_external: bool = True

    class Config:
        from_attributes = True


class ContentEffectivenessResponse(BaseModel):
    material_id: int
    total_accesses: int
    unique_students: int
    avg_improvement: float
    effectiveness_score: float
    engagement_score: float
    performance_correlation: float

    class Config:
        from_attributes = True


class SimilarStudentsResponse(BaseModel):
    student_id: int
    similar_students: List[Dict[str, Any]]
    total_found: int

    class Config:
        from_attributes = True


class StudentLearningPreferenceCreate(BaseModel):
    visual_score: Decimal = Field(default=Decimal("0.25"))
    auditory_score: Decimal = Field(default=Decimal("0.25"))
    reading_writing_score: Decimal = Field(default=Decimal("0.25"))
    kinesthetic_score: Decimal = Field(default=Decimal("0.25"))
    dominant_style: Optional[str] = None

    class Config:
        from_attributes = True


class StudentLearningPreferenceUpdate(BaseModel):
    visual_score: Optional[Decimal] = None
    auditory_score: Optional[Decimal] = None
    reading_writing_score: Optional[Decimal] = None
    kinesthetic_score: Optional[Decimal] = None
    dominant_style: Optional[str] = None
    video_preference_weight: Optional[Decimal] = None
    audio_preference_weight: Optional[Decimal] = None
    text_preference_weight: Optional[Decimal] = None
    interactive_preference_weight: Optional[Decimal] = None

    class Config:
        from_attributes = True


class StudentLearningPreferenceResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    visual_score: Decimal
    auditory_score: Decimal
    reading_writing_score: Decimal
    kinesthetic_score: Decimal
    dominant_style: Optional[str]
    confidence_level: Optional[Decimal]
    total_materials_accessed: int
    last_updated_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExternalContentCreate(BaseModel):
    source: str
    external_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    url: str
    content_type: Optional[str] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    difficulty_level: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    language: str = "en"

    class Config:
        from_attributes = True


class ExternalContentResponse(BaseModel):
    id: int
    institution_id: int
    source: str
    external_id: Optional[str]
    title: str
    description: Optional[str]
    url: str
    content_type: Optional[str]
    subject_id: Optional[int]
    chapter_id: Optional[int]
    topic_id: Optional[int]
    difficulty_level: Optional[str]
    estimated_duration_minutes: Optional[int]
    language: str
    view_count: int
    recommendation_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecommendationFilters(BaseModel):
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    difficulty_level: Optional[str] = None
    material_type: Optional[str] = None
    learning_style: Optional[str] = None
    include_external: bool = True
    limit: int = Field(default=20, ge=1, le=100)

    class Config:
        from_attributes = True
