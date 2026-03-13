from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DoubtEmbeddingBase(BaseModel):
    embedding_model: str
    embedding_dimension: int


class DoubtEmbeddingResponse(DoubtEmbeddingBase):
    id: int
    doubt_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class SimilarDoubtBase(BaseModel):
    similarity_score: float
    semantic_similarity: Optional[float] = None
    keyword_similarity: Optional[float] = None


class SimilarDoubtResponse(SimilarDoubtBase):
    id: int
    doubt_id: int
    similar_doubt_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class SimilarDoubtDetail(BaseModel):
    doubt_id: int
    similarity_score: float
    title: str
    description: str
    status: str
    answer_count: int
    top_answers: Optional[List[Dict[str, Any]]] = []


class DoubtSuggestedAnswerBase(BaseModel):
    source_type: str
    source_id: Optional[int] = None
    suggested_content: str
    confidence_score: float
    relevance_score: Optional[float] = None


class DoubtSuggestedAnswerResponse(DoubtSuggestedAnswerBase):
    id: int
    doubt_id: int
    source_metadata: Optional[Dict[str, Any]] = None
    is_helpful: Optional[bool] = None
    helpful_votes: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class DoubtSuggestionVote(BaseModel):
    is_helpful: bool


class DoubtTaggingRequest(BaseModel):
    doubt_id: int


class DoubtTaggingResponse(BaseModel):
    success: bool
    auto_tags: List[str]
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[str] = None
    difficulty: Optional[str] = None


class TagSuggestionsResponse(BaseModel):
    doubt_id: int
    suggested_tags: List[str]


class PriorityCalculationResponse(BaseModel):
    success: bool
    priority: str
    priority_score: float
    urgency_score: float
    difficulty_score: float


class DoubtPriorityDetail(BaseModel):
    id: int
    title: str
    status: str
    priority: Optional[str] = None
    priority_score: float
    urgency_score: float
    difficulty_score: float
    created_at: datetime
    assigned_teacher_id: Optional[int] = None


class TeacherAssignmentRequest(BaseModel):
    auto_assign: bool = True


class TeacherAssignmentResponse(BaseModel):
    success: bool
    assigned_teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    assignment_score: Optional[float] = None
    auto_assigned: bool
    message: Optional[str] = None


class TeacherReassignmentRequest(BaseModel):
    new_teacher_id: int


class TeacherReassignmentResponse(BaseModel):
    success: bool
    old_teacher_id: Optional[int] = None
    new_teacher_id: int


class TeacherDoubtStatsBase(BaseModel):
    total_assigned: int
    total_answered: int
    total_accepted: int
    active_doubts: int
    avg_response_time_minutes: Optional[float] = None
    avg_rating: Optional[float] = None
    expertise_score: float
    workload_score: float
    availability_score: float


class TeacherDoubtStatsResponse(TeacherDoubtStatsBase):
    id: int
    teacher_id: int
    subject_id: Optional[int] = None
    last_assigned_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TeacherWorkloadResponse(BaseModel):
    teacher_id: int
    total_stats: Dict[str, Any]
    subject_breakdown: List[Dict[str, Any]]


class SemanticSearchRequest(BaseModel):
    query_text: str
    subject_id: Optional[int] = None
    top_k: int = Field(10, ge=1, le=50)
    similarity_threshold: float = Field(0.6, ge=0.0, le=1.0)


class SemanticSearchResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    count: int


class DoubtProcessingRequest(BaseModel):
    enable_auto_assignment: bool = True


class DoubtProcessingResponse(BaseModel):
    success: bool
    doubt_id: int
    processing_steps: Dict[str, Any]
    message: str


class DoubtIntelligenceSummary(BaseModel):
    success: bool
    doubt: Dict[str, Any]
    tagging: Dict[str, Any]
    similar_doubts: List[Dict[str, Any]]
    answer_suggestions: List[Dict[str, Any]]
    teacher_assignment: Optional[Dict[str, Any]] = None


class BatchProcessingResponse(BaseModel):
    successful: int
    failed: int
    total_processed: int


class IntelligenceAnalyticsResponse(BaseModel):
    total_doubts: int
    intelligence_coverage: Dict[str, Dict[str, Any]]
    priority_distribution: List[Dict[str, Any]]


class DoubtReprocessRequest(BaseModel):
    steps: Optional[List[str]] = None


class DoubtBase(BaseModel):
    title: str
    description: str
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[str] = None
    tags: Optional[List[str]] = []
    is_anonymous: bool = False


class DoubtCreate(DoubtBase):
    pass


class DoubtUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class DoubtResponse(DoubtBase):
    id: int
    user_id: int
    institution_id: int
    auto_generated_tags: Optional[List[str]] = []
    status: str
    priority: Optional[str] = None
    difficulty: Optional[str] = None
    priority_score: float
    urgency_score: float
    difficulty_score: float
    view_count: int
    answer_count: int
    upvote_count: int
    assigned_teacher_id: Optional[int] = None
    auto_assigned: bool
    assignment_score: Optional[float] = None
    has_suggested_answers: bool
    suggestion_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
