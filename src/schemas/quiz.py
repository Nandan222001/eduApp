from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class QuizType(str, Enum):
    PRACTICE = "practice"
    GRADED = "graded"
    COMPETITIVE = "competitive"


class QuestionType(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"


class QuizStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class QuizAttemptStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


# Quiz Question Schemas
class QuestionOption(BaseModel):
    id: str
    text: str
    is_correct: bool


class QuizQuestionBase(BaseModel):
    question_type: QuestionType
    question_text: str
    question_image_url: Optional[str] = None
    explanation: Optional[str] = None
    marks: float = 1.0
    order_index: int = 0
    options: Optional[List[QuestionOption]] = None
    correct_answer: Optional[str] = None
    correct_answers: Optional[List[str]] = None


class QuizQuestionCreate(QuizQuestionBase):
    quiz_id: int


class QuizQuestionUpdate(BaseModel):
    question_type: Optional[QuestionType] = None
    question_text: Optional[str] = None
    question_image_url: Optional[str] = None
    explanation: Optional[str] = None
    marks: Optional[float] = None
    order_index: Optional[int] = None
    options: Optional[List[QuestionOption]] = None
    correct_answer: Optional[str] = None
    correct_answers: Optional[List[str]] = None
    is_active: Optional[bool] = None


class QuizQuestionResponse(QuizQuestionBase):
    id: int
    quiz_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuizQuestionStudentResponse(BaseModel):
    """Question response without correct answers for students"""
    id: int
    quiz_id: int
    question_type: QuestionType
    question_text: str
    question_image_url: Optional[str] = None
    marks: float
    order_index: int
    options: Optional[List[Dict[str, Any]]] = None  # Without is_correct field

    class Config:
        from_attributes = True


# Quiz Schemas
class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    grade_id: Optional[int] = None
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    quiz_type: QuizType = QuizType.PRACTICE
    time_limit_minutes: Optional[int] = None
    passing_percentage: Optional[float] = None
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_correct_answers: bool = True
    enable_leaderboard: bool = False
    allow_retake: bool = True
    max_attempts: Optional[int] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None


class QuizCreate(QuizBase):
    institution_id: int
    creator_id: int


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    grade_id: Optional[int] = None
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    quiz_type: Optional[QuizType] = None
    status: Optional[QuizStatus] = None
    time_limit_minutes: Optional[int] = None
    passing_percentage: Optional[float] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    enable_leaderboard: Optional[bool] = None
    allow_retake: Optional[bool] = None
    max_attempts: Optional[int] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    is_active: Optional[bool] = None


class QuizResponse(QuizBase):
    id: int
    institution_id: int
    creator_id: int
    status: QuizStatus
    total_marks: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    questions: Optional[List[QuizQuestionResponse]] = []

    class Config:
        from_attributes = True


class QuizStudentResponse(BaseModel):
    """Quiz response for students (without answers)"""
    id: int
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    quiz_type: QuizType
    time_limit_minutes: Optional[int] = None
    passing_percentage: Optional[float] = None
    total_marks: float
    shuffle_questions: bool
    shuffle_options: bool
    enable_leaderboard: bool
    allow_retake: bool
    max_attempts: Optional[int] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    questions: Optional[List[QuizQuestionStudentResponse]] = []

    class Config:
        from_attributes = True


# Quiz Attempt Schemas
class QuizAttemptCreate(BaseModel):
    quiz_id: int
    user_id: int


class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    attempt_number: int
    status: QuizAttemptStatus
    score: float
    percentage: float
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    unanswered: int
    time_taken_seconds: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Quiz Response Schemas
class QuizResponseCreate(BaseModel):
    attempt_id: int
    question_id: int
    user_answer: Optional[str] = None
    user_answers: Optional[List[str]] = None


class QuizResponseUpdate(BaseModel):
    user_answer: Optional[str] = None
    user_answers: Optional[List[str]] = None


class QuizResponseResponse(BaseModel):
    id: int
    attempt_id: int
    question_id: int
    user_answer: Optional[str] = None
    user_answers: Optional[List[str]] = None
    is_correct: Optional[bool] = None
    marks_awarded: float
    time_taken_seconds: int
    answered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Leaderboard Schemas
class QuizLeaderboardEntry(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    user_name: Optional[str] = None
    best_score: float
    best_percentage: float
    best_time_seconds: int
    total_attempts: int
    rank: Optional[int] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# Analytics Schemas
class QuizAnalyticsResponse(BaseModel):
    quiz_id: int
    total_attempts: int
    completed_attempts: int
    average_score: float
    average_percentage: float
    average_time_seconds: int
    highest_score: float
    lowest_score: float
    pass_rate: float
    question_difficulty: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class QuestionAnalytics(BaseModel):
    question_id: int
    question_text: str
    total_attempts: int
    correct_attempts: int
    incorrect_attempts: int
    accuracy_rate: float
    average_time_seconds: int


class QuizDetailedAnalytics(BaseModel):
    quiz_analytics: QuizAnalyticsResponse
    question_analytics: List[QuestionAnalytics]
    score_distribution: Dict[str, int]
    time_distribution: Dict[str, int]


# Submit Quiz Schema
class QuizSubmission(BaseModel):
    attempt_id: int
    responses: List[QuizResponseCreate]
    time_taken_seconds: int


# Bulk Create Schema
class QuizBulkCreate(BaseModel):
    quiz: QuizCreate
    questions: List[QuizQuestionBase]
