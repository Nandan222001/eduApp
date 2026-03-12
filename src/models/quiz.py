from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from src.database import Base


class QuizType(str, enum.Enum):
    PRACTICE = "practice"
    GRADED = "graded"
    COMPETITIVE = "competitive"


class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"


class QuizStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class QuizAttemptStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    grade_id = Column(Integer, ForeignKey("grades.id", ondelete="SET NULL"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    chapter_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    quiz_type = Column(SQLEnum(QuizType), default=QuizType.PRACTICE)
    status = Column(SQLEnum(QuizStatus), default=QuizStatus.DRAFT)
    time_limit_minutes = Column(Integer, nullable=True)
    passing_percentage = Column(Float, nullable=True)
    total_marks = Column(Float, default=0)
    shuffle_questions = Column(Boolean, default=False)
    shuffle_options = Column(Boolean, default=False)
    show_correct_answers = Column(Boolean, default=True)
    enable_leaderboard = Column(Boolean, default=False)
    allow_retake = Column(Boolean, default=True)
    max_attempts = Column(Integer, nullable=True)
    available_from = Column(DateTime, nullable=True)
    available_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    question_text = Column(Text, nullable=False)
    question_image_url = Column(String(500), nullable=True)
    explanation = Column(Text, nullable=True)
    marks = Column(Float, default=1.0)
    order_index = Column(Integer, default=0)
    options = Column(JSON, nullable=True)  # For MCQ and True/False
    correct_answer = Column(Text, nullable=True)  # For fill-blank and short answer
    correct_answers = Column(JSON, nullable=True)  # Array for multiple correct answers
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    responses = relationship("QuizResponse", back_populates="question", cascade="all, delete-orphan")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    attempt_number = Column(Integer, default=1)
    status = Column(SQLEnum(QuizAttemptStatus), default=QuizAttemptStatus.IN_PROGRESS)
    score = Column(Float, default=0)
    percentage = Column(Float, default=0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    incorrect_answers = Column(Integer, default=0)
    unanswered = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    responses = relationship("QuizResponse", back_populates="attempt", cascade="all, delete-orphan")


class QuizResponse(Base):
    __tablename__ = "quiz_responses"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    user_answer = Column(Text, nullable=True)
    user_answers = Column(JSON, nullable=True)  # For multiple selections
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, default=0)
    time_taken_seconds = Column(Integer, default=0)
    answered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="responses")
    question = relationship("QuizQuestion", back_populates="responses")


class QuizLeaderboard(Base):
    __tablename__ = "quiz_leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    best_score = Column(Float, default=0)
    best_percentage = Column(Float, default=0)
    best_time_seconds = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class QuizAnalytics(Base):
    __tablename__ = "quiz_analytics"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    total_attempts = Column(Integer, default=0)
    completed_attempts = Column(Integer, default=0)
    average_score = Column(Float, default=0)
    average_percentage = Column(Float, default=0)
    average_time_seconds = Column(Integer, default=0)
    highest_score = Column(Float, default=0)
    lowest_score = Column(Float, default=0)
    pass_rate = Column(Float, default=0)
    question_difficulty = Column(JSON, nullable=True)  # Question-wise difficulty analysis
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
