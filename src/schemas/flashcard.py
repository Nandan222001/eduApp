from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class FlashcardDeckVisibility(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    INSTITUTION = "institution"


class SpacedRepetitionLevel(str, Enum):
    NEW = "new"
    LEARNING = "learning"
    REVIEWING = "reviewing"
    MASTERED = "mastered"


# Flashcard Schemas
class FlashcardBase(BaseModel):
    front_content: str
    back_content: str
    front_image_url: Optional[str] = None
    back_image_url: Optional[str] = None
    hint: Optional[str] = None
    tags: Optional[str] = None
    order_index: int = 0


class FlashcardCreate(FlashcardBase):
    deck_id: int


class FlashcardUpdate(BaseModel):
    front_content: Optional[str] = None
    back_content: Optional[str] = None
    front_image_url: Optional[str] = None
    back_image_url: Optional[str] = None
    hint: Optional[str] = None
    tags: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class FlashcardResponse(FlashcardBase):
    id: int
    deck_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Flashcard Deck Schemas
class FlashcardDeckBase(BaseModel):
    title: str
    description: Optional[str] = None
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    thumbnail_url: Optional[str] = None
    visibility: FlashcardDeckVisibility = FlashcardDeckVisibility.PRIVATE
    tags: Optional[str] = None


class FlashcardDeckCreate(FlashcardDeckBase):
    institution_id: int
    creator_id: int


class FlashcardDeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    thumbnail_url: Optional[str] = None
    visibility: Optional[FlashcardDeckVisibility] = None
    tags: Optional[str] = None
    is_active: Optional[bool] = None


class FlashcardDeckResponse(FlashcardDeckBase):
    id: int
    institution_id: int
    creator_id: int
    total_cards: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    flashcards: Optional[List[FlashcardResponse]] = []

    class Config:
        from_attributes = True


# Deck Share Schemas
class FlashcardDeckShareCreate(BaseModel):
    deck_id: int
    shared_with_user_id: Optional[int] = None
    shared_with_grade_id: Optional[int] = None
    shared_with_section_id: Optional[int] = None
    can_edit: bool = False


class FlashcardDeckShareResponse(BaseModel):
    id: int
    deck_id: int
    shared_with_user_id: Optional[int] = None
    shared_with_grade_id: Optional[int] = None
    shared_with_section_id: Optional[int] = None
    can_edit: bool
    shared_at: datetime

    class Config:
        from_attributes = True


# Study Progress Schemas
class FlashcardStudyProgressResponse(BaseModel):
    id: int
    deck_id: int
    user_id: int
    cards_studied: int
    cards_mastered: int
    total_study_time_minutes: int
    last_studied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Study Session Schemas
class FlashcardStudySessionUpdate(BaseModel):
    repetition_level: SpacedRepetitionLevel
    ease_factor: float = 2.5
    interval_days: int = 0
    repetitions: int = 0
    is_correct: bool


class FlashcardStudySessionResponse(BaseModel):
    id: int
    flashcard_id: int
    user_id: int
    repetition_level: SpacedRepetitionLevel
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: Optional[datetime] = None
    last_reviewed_at: Optional[datetime] = None
    correct_count: int
    incorrect_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Bulk Create Schema
class FlashcardDeckBulkCreate(BaseModel):
    deck: FlashcardDeckCreate
    flashcards: List[FlashcardBase]


# Statistics Schema
class FlashcardDeckStats(BaseModel):
    total_cards: int
    cards_studied: int
    cards_mastered: int
    study_time_minutes: int
    average_accuracy: float
    cards_due_today: int
