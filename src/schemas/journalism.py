from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


class PublicationStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ArticleType(str, Enum):
    NEWS = "news"
    OPINION = "opinion"
    FEATURE = "feature"
    SPORTS = "sports"
    ARTS = "arts"
    HUMOR = "humor"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    PEER_REVIEW = "peer_review"
    EDITOR_REVIEW = "editor_review"
    FACULTY_REVIEW = "faculty_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVISION_REQUESTED = "revision_requested"


class JournalismRole(str, Enum):
    WRITER = "writer"
    EDITOR = "editor"
    PHOTOGRAPHER = "photographer"
    DESIGNER = "designer"


# Newspaper Edition Schemas
class NewspaperEditionBase(BaseModel):
    edition_number: int
    publication_date: date
    theme: Optional[str] = None
    editor_in_chief_student_id: Optional[int] = None
    editorial_board: Optional[List[Dict[str, Any]]] = None
    publication_status: PublicationStatus = PublicationStatus.DRAFT
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    total_pages: Optional[int] = None
    pdf_url: Optional[str] = None


class NewspaperEditionCreate(NewspaperEditionBase):
    institution_id: int


class NewspaperEditionUpdate(BaseModel):
    edition_number: Optional[int] = None
    publication_date: Optional[date] = None
    theme: Optional[str] = None
    editor_in_chief_student_id: Optional[int] = None
    editorial_board: Optional[List[Dict[str, Any]]] = None
    publication_status: Optional[PublicationStatus] = None
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    total_pages: Optional[int] = None
    pdf_url: Optional[str] = None


class NewspaperEditionResponse(NewspaperEditionBase):
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NewspaperEditionDetailResponse(NewspaperEditionResponse):
    article_count: Optional[int] = None
    editor_name: Optional[str] = None


# Article Schemas
class ArticleBase(BaseModel):
    title: str = Field(..., max_length=500)
    article_type: ArticleType
    content_html: str
    images: Optional[List[str]] = None
    category: Optional[str] = None
    excerpt: Optional[str] = None
    tags: Optional[List[str]] = None
    featured: bool = False


class ArticleCreate(ArticleBase):
    institution_id: int
    edition_id: Optional[int] = None
    author_student_id: Optional[int] = None
    slug: Optional[str] = None


class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    article_type: Optional[ArticleType] = None
    content_html: Optional[str] = None
    images: Optional[List[str]] = None
    category: Optional[str] = None
    excerpt: Optional[str] = None
    tags: Optional[List[str]] = None
    featured: Optional[bool] = None
    edition_id: Optional[int] = None
    slug: Optional[str] = None


class ArticleResponse(ArticleBase):
    id: int
    institution_id: int
    edition_id: Optional[int] = None
    author_student_id: Optional[int] = None
    word_count: Optional[int] = None
    submission_date: datetime
    review_status: ReviewStatus
    editor_notes: Optional[str] = None
    publish_date: Optional[datetime] = None
    slug: Optional[str] = None
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArticleDetailResponse(ArticleResponse):
    author_name: Optional[str] = None
    edition_number: Optional[int] = None
    review_count: Optional[int] = None


class ArticleSubmitRequest(BaseModel):
    article_id: int


class ArticlePublishRequest(BaseModel):
    article_id: int
    publish_date: Optional[datetime] = None


# Article Review Schemas
class ArticleReviewBase(BaseModel):
    review_type: str
    comments: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    approved: Optional[bool] = None


class ArticleReviewCreate(ArticleReviewBase):
    article_id: int
    reviewer_student_id: Optional[int] = None
    reviewer_user_id: Optional[int] = None


class ArticleReviewResponse(ArticleReviewBase):
    id: int
    article_id: int
    reviewer_student_id: Optional[int] = None
    reviewer_user_id: Optional[int] = None
    reviewed_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ArticleReviewDetailResponse(ArticleReviewResponse):
    reviewer_name: Optional[str] = None


# Journalism Member Schemas
class JournalismMemberBase(BaseModel):
    role: JournalismRole
    position_title: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    specialization: Optional[str] = None
    join_date: date = Field(default_factory=date.today)
    is_active: bool = True


class JournalismMemberCreate(JournalismMemberBase):
    institution_id: int
    student_id: int


class JournalismMemberUpdate(BaseModel):
    role: Optional[JournalismRole] = None
    position_title: Optional[str] = None
    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    specialization: Optional[str] = None
    is_active: Optional[bool] = None


class JournalismMemberResponse(JournalismMemberBase):
    id: int
    institution_id: int
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JournalismMemberDetailResponse(JournalismMemberResponse):
    student_name: Optional[str] = None
    article_count: Optional[int] = None


# Article Analytics Schemas
class ArticleAnalyticsBase(BaseModel):
    time_spent_seconds: Optional[int] = None
    engagement_score: Optional[int] = None
    device_type: Optional[str] = None
    referrer_source: Optional[str] = None


class ArticleAnalyticsCreate(ArticleAnalyticsBase):
    article_id: int
    user_id: Optional[int] = None
    student_id: Optional[int] = None
    view_date: date = Field(default_factory=date.today)
    ip_address: Optional[str] = None


class ArticleAnalyticsResponse(ArticleAnalyticsBase):
    id: int
    article_id: int
    user_id: Optional[int] = None
    student_id: Optional[int] = None
    view_date: date
    view_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Analytics Summary Schemas
class ArticleAnalyticsSummary(BaseModel):
    article_id: int
    article_title: str
    total_views: int
    unique_viewers: int
    avg_time_spent: Optional[float] = None
    avg_engagement_score: Optional[float] = None


class EditionAnalyticsSummary(BaseModel):
    edition_id: int
    edition_number: int
    total_articles: int
    total_views: int
    unique_viewers: int
    top_articles: List[ArticleAnalyticsSummary]


class JournalismMemberStats(BaseModel):
    member_id: int
    student_name: str
    role: str
    articles_written: int
    total_views: int
    avg_rating: Optional[float] = None


class WorkflowStatusUpdate(BaseModel):
    article_id: int
    review_status: ReviewStatus
    editor_notes: Optional[str] = None
