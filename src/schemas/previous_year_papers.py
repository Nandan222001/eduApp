from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from src.models.previous_year_papers import QuestionType, DifficultyLevel, BloomTaxonomyLevel, Board


class PreviousYearPaperBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    board: Board
    year: int = Field(..., ge=1900, le=2100)
    exam_month: Optional[str] = Field(None, max_length=50)
    grade_id: int
    subject_id: int
    total_marks: Optional[int] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=0)
    tags: Optional[str] = None


class PreviousYearPaperCreate(PreviousYearPaperBase):
    institution_id: int
    uploaded_by: Optional[int] = None


class PreviousYearPaperUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    board: Optional[Board] = None
    year: Optional[int] = Field(None, ge=1900, le=2100)
    exam_month: Optional[str] = Field(None, max_length=50)
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    total_marks: Optional[int] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=0)
    tags: Optional[str] = None
    is_active: Optional[bool] = None


class PreviousYearPaperResponse(PreviousYearPaperBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    pdf_file_name: Optional[str] = None
    pdf_file_size: Optional[int] = None
    pdf_file_url: Optional[str] = None
    ocr_processed: bool
    ocr_processed_at: Optional[datetime] = None
    view_count: int
    download_count: int
    is_active: bool
    uploaded_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class PreviousYearPaperWithOCR(PreviousYearPaperResponse):
    ocr_text: Optional[str] = None


class PreviousYearPaperWithQuestions(PreviousYearPaperResponse):
    questions_count: int = 0


class PDFUploadResponse(BaseModel):
    file_name: str
    file_size: int
    file_url: str
    s3_key: str


class QuestionBankBase(BaseModel):
    question_text: str
    question_type: QuestionType
    grade_id: int
    subject_id: int
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    difficulty_level: DifficultyLevel
    bloom_taxonomy_level: BloomTaxonomyLevel
    marks: Optional[float] = Field(None, ge=0)
    estimated_time_minutes: Optional[int] = Field(None, ge=0)
    answer_text: Optional[str] = None
    explanation: Optional[str] = None
    hints: Optional[str] = None
    options: Optional[str] = None
    correct_option: Optional[str] = Field(None, max_length=10)
    tags: Optional[str] = None
    keywords: Optional[str] = None


class QuestionBankCreate(QuestionBankBase):
    institution_id: int
    paper_id: Optional[int] = None
    created_by: Optional[int] = None


class QuestionBankUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    difficulty_level: Optional[DifficultyLevel] = None
    bloom_taxonomy_level: Optional[BloomTaxonomyLevel] = None
    marks: Optional[float] = Field(None, ge=0)
    estimated_time_minutes: Optional[int] = Field(None, ge=0)
    answer_text: Optional[str] = None
    explanation: Optional[str] = None
    hints: Optional[str] = None
    options: Optional[str] = None
    correct_option: Optional[str] = Field(None, max_length=10)
    tags: Optional[str] = None
    keywords: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class QuestionBankResponse(QuestionBankBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    paper_id: Optional[int] = None
    image_url: Optional[str] = None
    usage_count: int
    is_active: bool
    is_verified: bool
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class QuestionBankWithPaper(QuestionBankResponse):
    paper_title: Optional[str] = None
    paper_year: Optional[int] = None


class QuestionVerifyRequest(BaseModel):
    is_verified: bool
    verified_by: int


class PaperStatistics(BaseModel):
    total_papers: int
    papers_by_board: dict
    papers_by_year: dict
    papers_by_grade: dict
    papers_by_subject: dict
    ocr_processed_count: int
    ocr_pending_count: int


class QuestionStatistics(BaseModel):
    total_questions: int
    questions_by_type: dict
    questions_by_difficulty: dict
    questions_by_bloom_level: dict
    verified_count: int
    unverified_count: int
    questions_by_chapter: dict


class FacetCounts(BaseModel):
    boards: dict
    years: List[int]
    grades: dict
    subjects: dict
    question_types: dict
    difficulty_levels: dict
    bloom_levels: dict


class SearchFilters(BaseModel):
    board: Optional[Board] = None
    year: Optional[int] = None
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    question_type: Optional[QuestionType] = None
    difficulty_level: Optional[DifficultyLevel] = None
    bloom_taxonomy_level: Optional[BloomTaxonomyLevel] = None
    is_verified: Optional[bool] = None
    search_text: Optional[str] = None


class OCRProcessRequest(BaseModel):
    paper_id: int
    ocr_text: str


class TopicPredictionBase(BaseModel):
    board: Board
    grade_id: int
    subject_id: int
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    topic_name: str = Field(..., max_length=200)


class TopicPredictionResponse(TopicPredictionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    frequency_count: int
    appearance_years: Optional[str] = None
    total_marks: float
    avg_marks_per_appearance: float
    years_since_last_appearance: int
    last_appeared_year: Optional[int] = None
    cyclical_pattern_score: float
    trend_score: float
    weightage_score: float
    probability_score: float
    prediction_rank: Optional[int] = None
    is_due: bool
    confidence_level: Optional[str] = None
    analysis_metadata: Optional[str] = None
    analysis_year_start: Optional[int] = None
    analysis_year_end: Optional[int] = None
    analyzed_at: datetime
    created_at: datetime
    updated_at: datetime


class TopicPredictionRankingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    topic_name: str
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    frequency_count: int
    total_marks: float
    years_since_last_appearance: int
    last_appeared_year: Optional[int] = None
    probability_score: float
    prediction_rank: Optional[int] = None
    is_due: bool
    confidence_level: Optional[str] = None


class AnalysisRequest(BaseModel):
    board: Board
    grade_id: int
    subject_id: int
    year_start: Optional[int] = Field(None, description="Start year for analysis (defaults to 10 years ago)")
    year_end: Optional[int] = Field(None, description="End year for analysis (defaults to current year)")


class AnalysisResponse(BaseModel):
    total_topics_analyzed: int
    year_range: str
    predictions_generated: int
    cache_key: Optional[str] = None
    analyzed_at: datetime


class QuestionBookmarkCreate(BaseModel):
    question_id: int
    notes: Optional[str] = None
    tags: Optional[str] = None


class QuestionBookmarkUpdate(BaseModel):
    notes: Optional[str] = None
    tags: Optional[str] = None


class QuestionBookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    question_id: int
    institution_id: int
    notes: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class QuestionTagSuggestion(BaseModel):
    question_id: int
    suggested_tags: List[str]
    suggested_chapter: Optional[str] = None
    suggested_topic: Optional[str] = None
    suggested_difficulty: Optional[str] = None
    suggested_bloom_level: Optional[str] = None
    confidence_score: float
