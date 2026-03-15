from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class EssayPromptBase(BaseModel):
    prompt_text: str
    prompt_type: str
    word_limit: Optional[int] = None
    associated_scholarships: Optional[List[str]] = None
    guidelines: Optional[str] = None
    tips: Optional[List[str]] = None


class EssayPromptCreate(EssayPromptBase):
    institution_id: int
    created_by: Optional[int] = None


class EssayPromptUpdate(BaseModel):
    prompt_text: Optional[str] = None
    prompt_type: Optional[str] = None
    word_limit: Optional[int] = None
    associated_scholarships: Optional[List[str]] = None
    guidelines: Optional[str] = None
    tips: Optional[List[str]] = None
    is_active: Optional[bool] = None


class EssayPromptResponse(EssayPromptBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_by: Optional[int] = None
    sample_essay_ids: Optional[List[int]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudentEssayBase(BaseModel):
    prompt_id: int
    title: Optional[str] = None
    essay_draft: str


class StudentEssayCreate(StudentEssayBase):
    student_id: int
    institution_id: int


class StudentEssayUpdate(BaseModel):
    title: Optional[str] = None
    essay_draft: Optional[str] = None
    status: Optional[str] = None


class StudentEssayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    prompt_id: int
    title: Optional[str] = None
    essay_draft: str
    revision_history: Optional[List[Dict[str, Any]]] = None
    word_count: int
    status: str
    finalized_version: Optional[str] = None
    finalized_at: Optional[datetime] = None
    counselor_feedback: Optional[List[Dict[str, Any]]] = None
    counselor_approved: bool
    counselor_approved_by: Optional[int] = None
    counselor_approved_at: Optional[datetime] = None
    submitted_to_scholarships: Optional[List[str]] = None
    submission_dates: Optional[Dict[str, str]] = None
    grammar_check_results: Optional[Dict[str, Any]] = None
    grammar_check_status: str
    grammar_check_score: Optional[float] = None
    clarity_score: Optional[float] = None
    ai_suggestions: Optional[List[Dict[str, Any]]] = None
    ai_analyzed_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EssayPeerReviewBase(BaseModel):
    content_score: Optional[int] = Field(None, ge=1, le=5)
    clarity_score: Optional[int] = Field(None, ge=1, le=5)
    grammar_score: Optional[int] = Field(None, ge=1, le=5)
    authenticity_score: Optional[int] = Field(None, ge=1, le=5)
    content_feedback: Optional[str] = None
    clarity_feedback: Optional[str] = None
    grammar_feedback: Optional[str] = None
    authenticity_feedback: Optional[str] = None
    general_comments: Optional[str] = None
    strengths: Optional[List[str]] = None
    areas_for_improvement: Optional[List[str]] = None


class EssayPeerReviewCreate(EssayPeerReviewBase):
    essay_id: int
    reviewer_student_id: int
    institution_id: int
    is_anonymous: bool = True


class EssayPeerReviewUpdate(EssayPeerReviewBase):
    status: Optional[str] = None
    is_helpful: Optional[bool] = None


class EssayPeerReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    essay_id: int
    reviewer_student_id: int
    status: str
    content_score: Optional[int] = None
    clarity_score: Optional[int] = None
    grammar_score: Optional[int] = None
    authenticity_score: Optional[int] = None
    overall_score: Optional[float] = None
    content_feedback: Optional[str] = None
    clarity_feedback: Optional[str] = None
    grammar_feedback: Optional[str] = None
    authenticity_feedback: Optional[str] = None
    general_comments: Optional[str] = None
    strengths: Optional[List[str]] = None
    areas_for_improvement: Optional[List[str]] = None
    is_anonymous: bool
    is_helpful: Optional[bool] = None
    helpful_votes: int
    assigned_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    time_spent_minutes: Optional[int] = None
    is_flagged: bool
    created_at: datetime
    updated_at: datetime


class EssayTemplateBase(BaseModel):
    title: str = Field(..., max_length=500)
    prompt_type: str
    essay_text: str
    word_count: int
    year_submitted: Optional[int] = None
    scholarship_name: Optional[str] = None
    success_outcome: Optional[str] = None
    annotated_version: Optional[str] = None
    key_strengths: Optional[List[str]] = None
    techniques_used: Optional[List[str]] = None


class EssayTemplateCreate(EssayTemplateBase):
    institution_id: int
    uploaded_by: Optional[int] = None
    is_anonymized: bool = True


class EssayTemplateUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    essay_text: Optional[str] = None
    annotated_version: Optional[str] = None
    key_strengths: Optional[List[str]] = None
    techniques_used: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class EssayTemplateResponse(EssayTemplateBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    is_anonymized: bool
    is_featured: bool
    view_count: int
    helpful_count: int
    uploaded_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ReviewRubricBase(BaseModel):
    name: str = Field(..., max_length=255)
    prompt_type: Optional[str] = None
    content_criteria: Dict[str, Any]
    clarity_criteria: Dict[str, Any]
    grammar_criteria: Dict[str, Any]
    authenticity_criteria: Dict[str, Any]
    scoring_scale: int = 5
    weight_content: float = 0.35
    weight_clarity: float = 0.25
    weight_grammar: float = 0.20
    weight_authenticity: float = 0.20
    instructions_for_reviewers: Optional[str] = None


class ReviewRubricCreate(ReviewRubricBase):
    institution_id: int
    is_default: bool = False


class ReviewRubricUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    content_criteria: Optional[Dict[str, Any]] = None
    clarity_criteria: Optional[Dict[str, Any]] = None
    grammar_criteria: Optional[Dict[str, Any]] = None
    authenticity_criteria: Optional[Dict[str, Any]] = None
    scoring_scale: Optional[int] = None
    weight_content: Optional[float] = None
    weight_clarity: Optional[float] = None
    weight_grammar: Optional[float] = None
    weight_authenticity: Optional[float] = None
    instructions_for_reviewers: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class ReviewRubricResponse(ReviewRubricBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    is_default: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EssayAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    essay_id: int
    revision_number: int
    word_count: int
    avg_peer_review_score: Optional[float] = None
    num_peer_reviews: int
    grammar_score: Optional[float] = None
    clarity_score: Optional[float] = None
    content_quality_score: Optional[float] = None
    authenticity_score: Optional[float] = None
    readability_score: Optional[float] = None
    sentiment_score: Optional[float] = None
    improvement_from_previous: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class PeerReviewAssignmentRequest(BaseModel):
    essay_id: int
    num_reviewers: int = Field(default=3, ge=1, le=10)
    preferred_reviewers: Optional[List[int]] = None


class CounselorFeedbackRequest(BaseModel):
    essay_id: int
    feedback: str
    rating: Optional[int] = Field(None, ge=1, le=10)
    approved: bool = False


class GrammarCheckRequest(BaseModel):
    essay_id: int
    check_type: str = "full"


class FinalizeEssayRequest(BaseModel):
    essay_id: int
    finalized_version: Optional[str] = None


class EssayImprovementReport(BaseModel):
    essay_id: int
    student_id: int
    total_revisions: int
    improvement_timeline: List[Dict[str, Any]]
    current_scores: Dict[str, float]
    peer_review_summary: Dict[str, Any]
    counselor_feedback_summary: Optional[Dict[str, Any]] = None
    recommended_actions: List[str]
