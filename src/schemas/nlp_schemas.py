from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from src.models.previous_year_papers import (
    QuestionType,
    DifficultyLevel,
    BloomTaxonomyLevel,
    Board
)


class QuestionSimilarityRequest(BaseModel):
    question_id: int
    top_k: int = Field(10, ge=1, le=50)
    min_similarity: float = Field(0.7, ge=0.0, le=1.0)
    same_subject_only: bool = True


class SimilarQuestionResponse(BaseModel):
    question_id: int
    question_text: str
    similarity_score: float
    difficulty_level: str
    bloom_taxonomy_level: str
    question_type: str
    marks: Optional[float]


class ClusteringRequest(BaseModel):
    grade_id: int
    subject_id: int
    min_cluster_size: int = Field(5, ge=2, le=50)
    min_samples: int = Field(3, ge=1, le=20)


class ClusteringResponse(BaseModel):
    status: str
    total_questions: int
    clusters_created: int
    noise_points: int
    cluster_ids: List[int]


class ClusterMemberInfo(BaseModel):
    question_id: int
    question_text: str
    similarity_score: Optional[float]
    distance_to_centroid: Optional[float]
    difficulty_level: str
    bloom_taxonomy_level: str


class ClusterInfoResponse(BaseModel):
    cluster_id: int
    cluster_label: Optional[str]
    cluster_size: int
    representative_question_id: Optional[int]
    avg_difficulty: Optional[str]
    dominant_bloom_level: Optional[str]
    members: List[ClusterMemberInfo]


class ClusterSummaryResponse(BaseModel):
    id: int
    cluster_id: int
    cluster_label: Optional[str]
    cluster_size: int
    representative_question_id: Optional[int]
    avg_difficulty: Optional[str]
    dominant_bloom_level: Optional[str]


class VariationGenerationRequest(BaseModel):
    question_id: int
    variation_types: List[str] = Field(
        ...,
        description="Types: paraphrase, difficulty_easy, difficulty_hard, bloom_adjusted"
    )


class VariationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    original_question_id: int
    variation_text: str
    variation_type: str
    question_type: QuestionType
    difficulty_level: DifficultyLevel
    bloom_taxonomy_level: BloomTaxonomyLevel
    similarity_score: Optional[float]
    generation_method: str
    is_verified: bool
    is_active: bool
    created_at: datetime


class BloomClassificationRequest(BaseModel):
    question_text: str


class BloomClassificationResponse(BaseModel):
    predicted_level: str
    confidence: float
    keyword_scores: Dict[str, int]
    complexity_score: float
    explanation: str


class BatchBloomClassificationRequest(BaseModel):
    question_ids: List[int]
    auto_update: bool = False


class BloomUpdateResponse(BaseModel):
    question_id: int
    old_level: Optional[str]
    new_level: str
    confidence: Optional[float]
    explanation: Optional[str]
    status: str


class BlueprintAnalysisRequest(BaseModel):
    board: Board
    grade_id: int
    subject_id: int
    year_start: Optional[int] = None
    year_end: Optional[int] = None


class BlueprintAnalysisResponse(BaseModel):
    status: str
    papers_analyzed: int
    questions_analyzed: int
    year_range: str
    avg_total_marks: int
    avg_duration_minutes: int
    difficulty_distribution: Dict[str, float]
    bloom_taxonomy_distribution: Dict[str, float]
    question_type_distribution: Dict[str, float]
    chapter_weightage: Dict[str, Any]


class BlueprintCreateRequest(BaseModel):
    blueprint_name: str = Field(..., max_length=255)
    description: Optional[str] = None
    board: Board
    grade_id: int
    subject_id: int
    total_marks: int = Field(..., ge=1, le=1000)
    duration_minutes: int = Field(..., ge=1, le=600)
    difficulty_distribution: Dict[str, float]
    bloom_taxonomy_distribution: Dict[str, float]
    question_type_distribution: Dict[str, float]
    chapter_weightage: Optional[Dict[str, Any]] = None


class BlueprintCreateFromAnalysisRequest(BaseModel):
    blueprint_name: str = Field(..., max_length=255)
    description: Optional[str] = None
    board: Board
    grade_id: int
    subject_id: int
    year_start: Optional[int] = None
    year_end: Optional[int] = None


class BlueprintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    blueprint_name: str
    description: Optional[str]
    board: Board
    grade_id: int
    subject_id: int
    total_marks: int
    duration_minutes: int
    difficulty_distribution: str
    bloom_taxonomy_distribution: str
    question_type_distribution: str
    chapter_weightage: Optional[str]
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime


class BlueprintUpdateRequest(BaseModel):
    blueprint_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    total_marks: Optional[int] = Field(None, ge=1, le=1000)
    duration_minutes: Optional[int] = Field(None, ge=1, le=600)
    difficulty_distribution: Optional[Dict[str, float]] = None
    bloom_taxonomy_distribution: Optional[Dict[str, float]] = None
    question_type_distribution: Optional[Dict[str, float]] = None
    chapter_weightage: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class QuestionSuggestion(BaseModel):
    question_id: int
    question_text: str
    marks: Optional[float]
    question_type: str
    topic_id: Optional[int]
    chapter_id: Optional[int]


class SuggestionGroup(BaseModel):
    difficulty_level: str
    bloom_level: str
    target_marks: int
    suggested_questions: List[QuestionSuggestion]


class BlueprintSuggestionsResponse(BaseModel):
    status: str
    blueprint_id: int
    blueprint_name: str
    total_marks: int
    duration_minutes: int
    suggestions: List[SuggestionGroup]
    total_suggestion_groups: int


class EmbeddingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    question_id: int
    embedding_model: str
    embedding_dimension: int
    created_at: datetime
    updated_at: datetime


class BatchEmbeddingRequest(BaseModel):
    question_ids: List[int]
    batch_size: int = Field(32, ge=1, le=100)
