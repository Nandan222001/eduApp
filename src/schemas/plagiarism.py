from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from src.models.plagiarism import (
    PlagiarismCheckStatus, ComparisonScope, ContentType, ReviewDecision
)


class MatchSegmentBase(BaseModel):
    source_start: int
    source_end: int
    source_text: str
    match_start: int
    match_end: int
    match_text: str
    segment_similarity: float
    segment_length: int
    is_code_segment: bool = False
    code_analysis: Optional[Dict[str, Any]] = None
    is_citation: bool = False
    citation_context: Optional[str] = None


class MatchSegmentCreate(MatchSegmentBase):
    pass


class MatchSegmentResponse(MatchSegmentBase):
    id: int
    result_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PlagiarismCheckCreate(BaseModel):
    assignment_id: int
    submission_id: Optional[int] = None
    content_type: ContentType = ContentType.TEXT
    comparison_scope: ComparisonScope = ComparisonScope.WITHIN_BATCH
    enable_cross_institution: bool = False
    anonymize_cross_institution: bool = True
    check_settings: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {
            "min_similarity_threshold": 0.7,
            "min_segment_length": 50,
            "enable_citation_detection": True,
            "enable_code_analysis": True,
            "ignore_common_phrases": True,
            "max_comparisons": 1000
        }
    )


class PlagiarismCheckUpdate(BaseModel):
    status: Optional[PlagiarismCheckStatus] = None
    error_message: Optional[str] = None
    total_comparisons: Optional[int] = None
    matches_found: Optional[int] = None
    processing_time_seconds: Optional[float] = None


class PlagiarismCheckResponse(BaseModel):
    id: int
    institution_id: int
    assignment_id: int
    submission_id: Optional[int] = None
    content_type: ContentType
    comparison_scope: ComparisonScope
    enable_cross_institution: bool
    anonymize_cross_institution: bool
    status: PlagiarismCheckStatus
    error_message: Optional[str] = None
    total_comparisons: int
    matches_found: int
    processing_time_seconds: Optional[float] = None
    check_settings: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlagiarismResultCreate(BaseModel):
    check_id: int
    submission_id: int
    matched_submission_id: Optional[int] = None
    similarity_score: float
    text_similarity: Optional[float] = None
    code_similarity: Optional[float] = None
    matched_segments_count: int = 0
    matched_text_percentage: float = 0.0
    is_external_source: bool = False
    external_source_info: Optional[Dict[str, Any]] = None
    is_cross_institution: bool = False
    anonymized_match_info: Optional[Dict[str, Any]] = None
    has_citations: bool = False
    citation_info: Optional[Dict[str, Any]] = None
    is_false_positive: bool = False
    false_positive_reason: Optional[str] = None


class PlagiarismResultUpdate(BaseModel):
    review_status: Optional[str] = None
    review_decision: Optional[ReviewDecision] = None
    review_notes: Optional[str] = None
    is_false_positive: Optional[bool] = None
    false_positive_reason: Optional[str] = None


class PlagiarismResultResponse(BaseModel):
    id: int
    check_id: int
    submission_id: int
    matched_submission_id: Optional[int] = None
    similarity_score: float
    text_similarity: Optional[float] = None
    code_similarity: Optional[float] = None
    matched_segments_count: int
    matched_text_percentage: float
    is_external_source: bool
    external_source_info: Optional[Dict[str, Any]] = None
    is_cross_institution: bool
    anonymized_match_info: Optional[Dict[str, Any]] = None
    has_citations: bool
    citation_info: Optional[Dict[str, Any]] = None
    is_false_positive: bool
    false_positive_reason: Optional[str] = None
    review_status: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    review_decision: Optional[ReviewDecision] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlagiarismResultDetailResponse(PlagiarismResultResponse):
    matched_segments: List[MatchSegmentResponse] = []
    submission_info: Optional[Dict[str, Any]] = None
    matched_submission_info: Optional[Dict[str, Any]] = None


class ReviewSubmission(BaseModel):
    review_decision: ReviewDecision
    review_notes: Optional[str] = None
    is_false_positive: bool = False
    false_positive_reason: Optional[str] = None


class SimilarityVisualizationResponse(BaseModel):
    submission_id: int
    matched_submission_id: Optional[int] = None
    similarity_score: float
    total_segments: int
    matched_segments: List[MatchSegmentResponse]
    content_comparison: Dict[str, Any]


class ComparisonPair(BaseModel):
    submission_id_1: int
    submission_id_2: int
    student_name_1: str
    student_name_2: str
    similarity_score: float
    matched_segments: int


class PlagiarismReportResponse(BaseModel):
    assignment_id: int
    assignment_title: str
    total_submissions: int
    submissions_checked: int
    high_similarity_count: int
    medium_similarity_count: int
    low_similarity_count: int
    flagged_pairs: List[ComparisonPair]
    average_similarity: float
    max_similarity: float
    processing_time_seconds: float
    check_completed_at: datetime


class CodeASTFingerprintCreate(BaseModel):
    submission_id: int
    file_id: Optional[int] = None
    language: str
    structure_hash: str
    variable_pattern_hash: str
    function_pattern_hash: str
    ast_features: Dict[str, Any]
    total_nodes: int
    total_functions: int
    total_variables: int
    complexity_score: float


class CodeASTFingerprintResponse(BaseModel):
    id: int
    submission_id: int
    file_id: Optional[int] = None
    language: str
    structure_hash: str
    variable_pattern_hash: str
    function_pattern_hash: str
    ast_features: Dict[str, Any]
    total_nodes: int
    total_functions: int
    total_variables: int
    complexity_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class CitationPatternCreate(BaseModel):
    submission_id: int
    citation_type: str
    citation_text: str
    start_position: int
    end_position: int
    reference_info: Optional[Dict[str, Any]] = None
    is_valid: bool = True
    validation_notes: Optional[str] = None


class CitationPatternResponse(BaseModel):
    id: int
    submission_id: int
    citation_type: str
    citation_text: str
    start_position: int
    end_position: int
    reference_info: Optional[Dict[str, Any]] = None
    is_valid: bool
    validation_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PrivacyConsentCreate(BaseModel):
    institution_id: int
    allow_cross_institution_comparison: bool = False
    allow_anonymized_sharing: bool = True
    data_retention_days: int = 365
    privacy_settings: Optional[Dict[str, Any]] = None


class PrivacyConsentUpdate(BaseModel):
    allow_cross_institution_comparison: Optional[bool] = None
    allow_anonymized_sharing: Optional[bool] = None
    data_retention_days: Optional[int] = None
    privacy_settings: Optional[Dict[str, Any]] = None


class PrivacyConsentResponse(BaseModel):
    id: int
    institution_id: int
    allow_cross_institution_comparison: bool
    allow_anonymized_sharing: bool
    data_retention_days: int
    consent_given_by: Optional[int] = None
    consent_given_at: Optional[datetime] = None
    privacy_settings: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
