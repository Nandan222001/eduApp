from datetime import datetime, date
from enum import Enum
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from src.database import Base


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


class NewspaperEdition(Base):
    __tablename__ = "newspaper_editions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    editor_in_chief_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)

    edition_number = Column(Integer, nullable=False)
    publication_date = Column(Date, nullable=False)
    theme = Column(String(255), nullable=True)
    editorial_board = Column(JSON, nullable=True)
    publication_status = Column(String(20), default=PublicationStatus.DRAFT.value, nullable=False, index=True)
    cover_image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    total_pages = Column(Integer, nullable=True)
    pdf_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    editor_in_chief = relationship("Student", foreign_keys=[editor_in_chief_student_id])
    articles = relationship("Article", back_populates="edition")

    __table_args__ = (
        Index('idx_newspaper_edition_institution_number', 'institution_id', 'edition_number'),
        Index('idx_newspaper_edition_institution_status', 'institution_id', 'publication_status'),
    )


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    edition_id = Column(Integer, ForeignKey('newspaper_editions.id', ondelete='SET NULL'), nullable=True, index=True)
    author_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)

    title = Column(String(500), nullable=False)
    article_type = Column(String(20), nullable=False, index=True)
    content_html = Column(Text, nullable=False)
    images = Column(JSON, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    excerpt = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    featured = Column(Boolean, default=False, nullable=False, index=True)
    slug = Column(String(550), nullable=True, index=True)
    word_count = Column(Integer, nullable=True)

    submission_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    review_status = Column(String(30), default=ReviewStatus.PENDING.value, nullable=False, index=True)
    editor_notes = Column(Text, nullable=True)
    publish_date = Column(DateTime, nullable=True, index=True)
    view_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    edition = relationship("NewspaperEdition", back_populates="articles")
    author = relationship("Student", foreign_keys=[author_student_id])
    reviews = relationship("ArticleReview", back_populates="article", cascade="all, delete-orphan")
    analytics = relationship("ArticleAnalytics", back_populates="article", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_article_institution_review_status', 'institution_id', 'review_status'),
        Index('idx_article_institution_type', 'institution_id', 'article_type'),
    )


class ArticleReview(Base):
    __tablename__ = "article_reviews"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id', ondelete='CASCADE'), nullable=False, index=True)
    reviewer_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    reviewer_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    review_type = Column(String(50), nullable=False)
    comments = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)
    approved = Column(Boolean, nullable=True)

    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    article = relationship("Article", back_populates="reviews")
    reviewer_student = relationship("Student", foreign_keys=[reviewer_student_id])
    reviewer_user = relationship("User", foreign_keys=[reviewer_user_id])

    __table_args__ = (
        Index('idx_article_review_article', 'article_id', 'reviewed_at'),
    )


class JournalismMember(Base):
    __tablename__ = "journalism_members"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    role = Column(String(20), nullable=False, index=True)
    position_title = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    specialization = Column(String(255), nullable=True)
    join_date = Column(Date, default=date.today, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student", foreign_keys=[student_id])

    __table_args__ = (
        Index('idx_journalism_member_institution_role', 'institution_id', 'role'),
        Index('idx_journalism_member_institution_active', 'institution_id', 'is_active'),
    )


class ArticleAnalytics(Base):
    __tablename__ = "article_analytics"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)

    view_date = Column(Date, default=date.today, nullable=False, index=True)
    view_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    time_spent_seconds = Column(Integer, nullable=True)
    engagement_score = Column(Integer, nullable=True)
    device_type = Column(String(50), nullable=True)
    referrer_source = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    article = relationship("Article", back_populates="analytics")
    user = relationship("User", foreign_keys=[user_id])
    student = relationship("Student", foreign_keys=[student_id])

    __table_args__ = (
        Index('idx_article_analytics_article_date', 'article_id', 'view_date'),
    )
