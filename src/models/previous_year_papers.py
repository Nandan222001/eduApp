from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, Enum, Float
from sqlalchemy.orm import relationship
from src.database import Base


class QuestionType(str, PyEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    NUMERICAL = "numerical"
    MATCH_THE_FOLLOWING = "match_the_following"
    ASSERTION_REASONING = "assertion_reasoning"


class DifficultyLevel(str, PyEnum):
    VERY_EASY = "very_easy"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"


class BloomTaxonomyLevel(str, PyEnum):
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"


class Board(str, PyEnum):
    CBSE = "cbse"
    ICSE = "icse"
    STATE_BOARD = "state_board"
    IB = "ib"
    CAMBRIDGE = "cambridge"
    OTHER = "other"


class PreviousYearPaper(Base):
    __tablename__ = "previous_year_papers"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    board = Column(Enum(Board), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    exam_month = Column(String(50), nullable=True)
    
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    
    total_marks = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    pdf_file_name = Column(String(255), nullable=True)
    pdf_file_size = Column(Integer, nullable=True)
    pdf_file_url = Column(String(500), nullable=True)
    pdf_s3_key = Column(String(500), nullable=True)
    
    ocr_text = Column(Text, nullable=True)
    ocr_processed = Column(Boolean, default=False, nullable=False, index=True)
    ocr_processed_at = Column(DateTime, nullable=True)
    
    tags = Column(Text, nullable=True)
    
    view_count = Column(Integer, default=0, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="previous_year_papers")
    grade = relationship("Grade", back_populates="previous_year_papers")
    subject = relationship("Subject", back_populates="previous_year_papers")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    questions = relationship("QuestionBank", back_populates="paper", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_pyp_institution', 'institution_id'),
        Index('idx_pyp_board', 'board'),
        Index('idx_pyp_year', 'year'),
        Index('idx_pyp_grade', 'grade_id'),
        Index('idx_pyp_subject', 'subject_id'),
        Index('idx_pyp_board_year', 'board', 'year'),
        Index('idx_pyp_grade_subject', 'grade_id', 'subject_id'),
        Index('idx_pyp_ocr_processed', 'ocr_processed'),
        Index('idx_pyp_active', 'is_active'),
        Index('idx_pyp_created', 'created_at'),
    )


class QuestionBank(Base):
    __tablename__ = "questions_bank"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey('previous_year_papers.id', ondelete='CASCADE'), nullable=True, index=True)
    
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False, index=True)
    
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    
    difficulty_level = Column(Enum(DifficultyLevel), nullable=False, index=True)
    bloom_taxonomy_level = Column(Enum(BloomTaxonomyLevel), nullable=False, index=True)
    
    marks = Column(Float, nullable=True)
    estimated_time_minutes = Column(Integer, nullable=True)
    
    answer_text = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    hints = Column(Text, nullable=True)
    
    options = Column(Text, nullable=True)
    correct_option = Column(String(10), nullable=True)
    
    image_url = Column(String(500), nullable=True)
    image_s3_key = Column(String(500), nullable=True)
    
    tags = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True)
    
    usage_count = Column(Integer, default=0, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    verified_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="questions_bank")
    paper = relationship("PreviousYearPaper", back_populates="questions")
    grade = relationship("Grade", back_populates="questions_bank")
    subject = relationship("Subject", back_populates="questions_bank")
    chapter = relationship("Chapter", back_populates="questions_bank")
    topic = relationship("Topic", back_populates="questions_bank")
    creator = relationship("User", foreign_keys=[created_by])
    verifier = relationship("User", foreign_keys=[verified_by])
    
    __table_args__ = (
        Index('idx_qb_institution', 'institution_id'),
        Index('idx_qb_paper', 'paper_id'),
        Index('idx_qb_grade', 'grade_id'),
        Index('idx_qb_subject', 'subject_id'),
        Index('idx_qb_chapter', 'chapter_id'),
        Index('idx_qb_topic', 'topic_id'),
        Index('idx_qb_question_type', 'question_type'),
        Index('idx_qb_difficulty', 'difficulty_level'),
        Index('idx_qb_bloom', 'bloom_taxonomy_level'),
        Index('idx_qb_grade_subject', 'grade_id', 'subject_id'),
        Index('idx_qb_chapter_topic', 'chapter_id', 'topic_id'),
        Index('idx_qb_active', 'is_active'),
        Index('idx_qb_verified', 'is_verified'),
        Index('idx_qb_created', 'created_at'),
    )
