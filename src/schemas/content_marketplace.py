from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, validator
from src.models.content_marketplace import (
    ContentType, ContentStatus, ModerationStatus, PlagiarismStatus, TransactionType
)


class StudentContentBase(BaseModel):
    content_type: ContentType
    subject: str
    topic: str
    grade_level: str
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=20)
    preview_content: Optional[str] = None
    price_credits: int = Field(default=0, ge=0)
    tags: Optional[List[str]] = None
    thumbnail_url: Optional[str] = None


class StudentContentCreate(StudentContentBase):
    full_content_url: Optional[str] = None
    s3_key: Optional[str] = None
    
    @validator('price_credits')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('Price must be non-negative')
        return v


class StudentContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, min_length=20)
    preview_content: Optional[str] = None
    full_content_url: Optional[str] = None
    s3_key: Optional[str] = None
    price_credits: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    thumbnail_url: Optional[str] = None
    status: Optional[ContentStatus] = None


class StudentContentResponse(StudentContentBase):
    id: int
    institution_id: int
    creator_student_id: int
    full_content_url: Optional[str] = None
    s3_key: Optional[str] = None
    sales_count: int
    revenue_earned: int
    views_count: int
    downloads_count: int
    rating: float
    rating_count: int
    reviews_count: int
    status: ContentStatus
    moderation_status: ModerationStatus
    plagiarism_status: PlagiarismStatus
    plagiarism_score: Optional[float] = None
    is_featured: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class StudentContentDetailResponse(StudentContentResponse):
    creator_name: Optional[str] = None
    is_purchased: Optional[bool] = False
    can_download: Optional[bool] = False


class ContentReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None


class ContentReviewCreate(ContentReviewBase):
    content_id: int


class ContentReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review_text: Optional[str] = None


class ContentReviewResponse(ContentReviewBase):
    id: int
    institution_id: int
    content_id: int
    reviewer_student_id: int
    reviewer_name: Optional[str] = None
    is_helpful: bool
    helpful_count: int
    is_verified_purchase: bool
    is_flagged: bool
    flag_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContentPurchaseCreate(BaseModel):
    content_id: int


class ContentPurchaseResponse(BaseModel):
    id: int
    institution_id: int
    content_id: int
    buyer_student_id: int
    credits_paid: int
    transaction_id: Optional[str] = None
    is_refunded: bool
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ModerationReviewBase(BaseModel):
    moderation_status: ModerationStatus
    quality_score: Optional[int] = Field(None, ge=1, le=10)
    accuracy_score: Optional[int] = Field(None, ge=1, le=10)
    feedback: Optional[str] = None
    revision_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class ModerationReviewCreate(ModerationReviewBase):
    content_id: int


class ModerationReviewResponse(ModerationReviewBase):
    id: int
    institution_id: int
    content_id: int
    reviewer_teacher_id: int
    reviewer_name: Optional[str] = None
    quality_checks: Optional[Dict[str, Any]] = None
    reviewed_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class PlagiarismCheckResponse(BaseModel):
    id: int
    institution_id: int
    content_id: int
    plagiarism_status: PlagiarismStatus
    similarity_score: Optional[float] = None
    sources_found: int
    matched_contents: Optional[List[Dict[str, Any]]] = None
    external_sources: Optional[List[Dict[str, Any]]] = None
    check_details: Optional[Dict[str, Any]] = None
    checked_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class StudentCreditsBalanceResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    total_credits: int
    earned_credits: int
    purchased_credits: int
    spent_credits: int
    total_earnings: int
    pending_earnings: int
    withdrawn_earnings: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CreditTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    student_balance_id: int
    transaction_type: TransactionType
    amount: int
    balance_after: int
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    # The ORM attribute is `metadata_json` (SQLAlchemy reserves `metadata` on
    # Declarative models), matching src/schemas/merchandise.py's pattern.
    # Without this alias, `from_attributes` read the class-level
    # `sqlalchemy.MetaData` object off `metadata_json`'s sibling `metadata`
    # attribute (inherited from every Declarative model) instead of the
    # actual JSON column -- which isn't a dict, so response validation
    # raised on every transaction returned by GET /credits/transactions.
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias='metadata_json', serialization_alias='metadata')
    created_at: datetime


class ContentSearchFilters(BaseModel):
    content_type: Optional[ContentType] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    min_rating: Optional[float] = None
    max_price: Optional[int] = None
    is_free: Optional[bool] = None
    tags: Optional[List[str]] = None
    search_query: Optional[str] = None
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|rating|price_credits|sales_count|views_count)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")


class CreatorAnalyticsResponse(BaseModel):
    total_contents: int
    published_contents: int
    pending_review_contents: int
    total_sales: int
    total_revenue: int
    total_views: int
    total_downloads: int
    average_rating: float
    top_selling_contents: List[Dict[str, Any]]
    recent_sales: List[Dict[str, Any]]
    revenue_by_content_type: Dict[str, int]
    sales_trend: List[Dict[str, Any]]


class ModerationQueueFilters(BaseModel):
    status: Optional[ModerationStatus] = None
    content_type: Optional[ContentType] = None
    subject: Optional[str] = None
    plagiarism_status: Optional[PlagiarismStatus] = None
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|plagiarism_score)$")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$")


class ContentSubmitForReview(BaseModel):
    pass


class ContentFlagRequest(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)


class ReviewHelpfulRequest(BaseModel):
    is_helpful: bool
