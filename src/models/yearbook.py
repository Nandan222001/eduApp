from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Boolean,
    Column,
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
    READY_FOR_PRINT = "ready_for_print"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class YearbookSection(str, Enum):
    COVER = "cover"
    DEDICATION = "dedication"
    ADMINISTRATION = "administration"
    FACULTY = "faculty"
    SENIORS = "seniors"
    JUNIORS = "juniors"
    SOPHOMORES = "sophomores"
    FRESHMEN = "freshmen"
    CLUBS = "clubs"
    SPORTS = "sports"
    ACADEMICS = "academics"
    EVENTS = "events"
    CANDIDS = "candids"
    ADS = "ads"
    BACK_COVER = "back_cover"


class YearbookEdition(Base):
    __tablename__ = "yearbook_editions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    academic_year = Column(String(20), nullable=False)
    theme = Column(String(255), nullable=True)
    cover_design_url = Column(String(500), nullable=True)
    dedication_text = Column(Text, nullable=True)
    editor_students = Column(JSON, nullable=True)
    publication_status = Column(String(20), default=PublicationStatus.DRAFT.value, nullable=False, index=True)
    digital_flip_book_url = Column(String(500), nullable=True)
    pdf_url = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    print_order_count = Column(Integer, default=0, nullable=False)
    published_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    creator = relationship("User", foreign_keys=[created_by])
    pages = relationship("YearbookPage", back_populates="edition", cascade="all, delete-orphan")
    signatures = relationship("YearbookSignature", back_populates="edition", cascade="all, delete-orphan")
    photo_submissions = relationship("YearbookPhotoSubmission", back_populates="edition", cascade="all, delete-orphan")
    quote_submissions = relationship("YearbookQuoteSubmission", back_populates="edition", cascade="all, delete-orphan")
    memory_submissions = relationship("YearbookMemorySubmission", back_populates="edition", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_yearbook_edition_institution_year', 'institution_id', 'academic_year'),
        Index('idx_yearbook_edition_institution_status', 'institution_id', 'publication_status'),
    )


class YearbookPage(Base):
    __tablename__ = "yearbook_pages"

    id = Column(Integer, primary_key=True, index=True)
    edition_id = Column(Integer, ForeignKey('yearbook_editions.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    page_number = Column(Integer, nullable=False)
    section = Column(String(50), nullable=False, index=True)
    layout_template = Column(String(100), nullable=True)
    photos = Column(JSON, nullable=True)
    text_content = Column(JSON, nullable=True)
    background_color = Column(String(20), nullable=True)
    background_image_url = Column(String(500), nullable=True)
    is_double_page = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    edition = relationship("YearbookEdition", back_populates="pages")
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index('idx_yearbook_page_edition_number', 'edition_id', 'page_number'),
        Index('idx_yearbook_page_edition_section', 'edition_id', 'section'),
    )


class YearbookSignature(Base):
    __tablename__ = "yearbook_signatures"

    id = Column(Integer, primary_key=True, index=True)
    edition_id = Column(Integer, ForeignKey('yearbook_editions.id', ondelete='CASCADE'), nullable=False, index=True)
    from_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    to_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    message = Column(Text, nullable=False)
    stickers = Column(JSON, nullable=True)
    emojis = Column(JSON, nullable=True)
    page_location = Column(Integer, nullable=True)
    font_style = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    edition = relationship("YearbookEdition", back_populates="signatures")
    from_student = relationship("Student", foreign_keys=[from_student_id])
    to_student = relationship("Student", foreign_keys=[to_student_id])

    __table_args__ = (
        Index('idx_yearbook_signature_edition_to_student', 'edition_id', 'to_student_id'),
        Index('idx_yearbook_signature_edition_from_student', 'edition_id', 'from_student_id'),
    )


class YearbookPhotoSubmission(Base):
    __tablename__ = "yearbook_photo_submissions"

    id = Column(Integer, primary_key=True, index=True)
    edition_id = Column(Integer, ForeignKey('yearbook_editions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    page_id = Column(Integer, ForeignKey('yearbook_pages.id', ondelete='SET NULL'), nullable=True, index=True)
    reviewed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    photo_url = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False)
    caption = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    suggested_section = Column(String(50), nullable=True)
    status = Column(String(20), default=SubmissionStatus.PENDING.value, nullable=False, index=True)
    review_notes = Column(Text, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    edition = relationship("YearbookEdition", back_populates="photo_submissions")
    student = relationship("Student", foreign_keys=[student_id])
    page = relationship("YearbookPage")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    __table_args__ = (
        Index('idx_yearbook_photo_submission_edition_status', 'edition_id', 'status'),
    )


class YearbookQuoteSubmission(Base):
    __tablename__ = "yearbook_quote_submissions"

    id = Column(Integer, primary_key=True, index=True)
    edition_id = Column(Integer, ForeignKey('yearbook_editions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    page_id = Column(Integer, ForeignKey('yearbook_pages.id', ondelete='SET NULL'), nullable=True, index=True)
    reviewed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    quote_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    status = Column(String(20), default=SubmissionStatus.PENDING.value, nullable=False, index=True)
    review_notes = Column(Text, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    edition = relationship("YearbookEdition", back_populates="quote_submissions")
    student = relationship("Student", foreign_keys=[student_id])
    page = relationship("YearbookPage")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    __table_args__ = (
        Index('idx_yearbook_quote_submission_edition_status', 'edition_id', 'status'),
    )


class YearbookMemorySubmission(Base):
    __tablename__ = "yearbook_memory_submissions"

    id = Column(Integer, primary_key=True, index=True)
    edition_id = Column(Integer, ForeignKey('yearbook_editions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    page_id = Column(Integer, ForeignKey('yearbook_pages.id', ondelete='SET NULL'), nullable=True, index=True)
    reviewed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    associated_event = Column(String(255), nullable=True)
    tags = Column(JSON, nullable=True)
    status = Column(String(20), default=SubmissionStatus.PENDING.value, nullable=False, index=True)
    review_notes = Column(Text, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    edition = relationship("YearbookEdition", back_populates="memory_submissions")
    student = relationship("Student", foreign_keys=[student_id])
    page = relationship("YearbookPage")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    __table_args__ = (
        Index('idx_yearbook_memory_submission_edition_status', 'edition_id', 'status'),
    )
