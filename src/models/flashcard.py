from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from src.database import Base


class FlashcardDeckVisibility(str, enum.Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    INSTITUTION = "institution"


class SpacedRepetitionLevel(str, enum.Enum):
    NEW = "new"
    LEARNING = "learning"
    REVIEWING = "reviewing"
    MASTERED = "mastered"


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    front_content = Column(Text, nullable=False)
    back_content = Column(Text, nullable=False)
    front_image_url = Column(String(500), nullable=True)
    back_image_url = Column(String(500), nullable=True)
    hint = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    deck = relationship("FlashcardDeck", back_populates="flashcards")
    study_sessions = relationship("FlashcardStudySession", back_populates="flashcard", cascade="all, delete-orphan")


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    grade_id = Column(Integer, ForeignKey("grades.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    chapter_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    visibility = Column(SQLEnum(FlashcardDeckVisibility), default=FlashcardDeckVisibility.PRIVATE)
    tags = Column(String(500), nullable=True)
    total_cards = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    flashcards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")
    shared_with = relationship("FlashcardDeckShare", back_populates="deck", cascade="all, delete-orphan")
    study_progress = relationship("FlashcardStudyProgress", back_populates="deck", cascade="all, delete-orphan")


class FlashcardDeckShare(Base):
    __tablename__ = "flashcard_deck_shares"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    shared_with_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    shared_with_grade_id = Column(Integer, ForeignKey("grades.id", ondelete="CASCADE"), nullable=True)
    shared_with_section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)
    can_edit = Column(Boolean, default=False)
    shared_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    deck = relationship("FlashcardDeck", back_populates="shared_with")


class FlashcardStudyProgress(Base):
    __tablename__ = "flashcard_study_progress"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    cards_studied = Column(Integer, default=0)
    cards_mastered = Column(Integer, default=0)
    total_study_time_minutes = Column(Integer, default=0)
    last_studied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    deck = relationship("FlashcardDeck", back_populates="study_progress")


class FlashcardStudySession(Base):
    __tablename__ = "flashcard_study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    repetition_level = Column(SQLEnum(SpacedRepetitionLevel), default=SpacedRepetitionLevel.NEW)
    ease_factor = Column(Float, default=2.5)  # For SM-2 algorithm
    interval_days = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review_date = Column(DateTime, nullable=True)
    last_reviewed_at = Column(DateTime, nullable=True)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    flashcard = relationship("Flashcard", back_populates="study_sessions")
