from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum, Float, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class DoubtStatus(str, Enum):
    UNANSWERED = "unanswered"
    ANSWERED = "answered"
    RESOLVED = "resolved"
    CLOSED = "closed"


class VoteType(str, Enum):
    UPVOTE = "upvote"
    DOWNVOTE = "downvote"


class DoubtPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DoubtDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class DoubtPost(Base):
    __tablename__ = "doubt_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(String(200), nullable=True, index=True)
    
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    images = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)
    auto_generated_tags = Column(JSON, nullable=True)
    
    status = Column(SQLEnum(DoubtStatus), default=DoubtStatus.UNANSWERED, nullable=False, index=True)
    priority = Column(SQLEnum(DoubtPriority), default=DoubtPriority.MEDIUM, nullable=False, index=True)
    difficulty = Column(SQLEnum(DoubtDifficulty), nullable=True, index=True)
    priority_score = Column(Float, default=0.0, nullable=False, index=True)
    urgency_score = Column(Float, default=0.0, nullable=False)
    difficulty_score = Column(Float, default=0.0, nullable=False)
    
    view_count = Column(Integer, default=0, nullable=False)
    answer_count = Column(Integer, default=0, nullable=False)
    upvote_count = Column(Integer, default=0, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    accepted_answer_id = Column(Integer, nullable=True)
    
    assigned_teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    auto_assigned = Column(Boolean, default=False, nullable=False)
    assignment_score = Column(Float, nullable=True)
    
    has_suggested_answers = Column(Boolean, default=False, nullable=False)
    suggestion_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User", foreign_keys=[user_id])
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    assigned_teacher = relationship("Teacher", foreign_keys=[assigned_teacher_id])
    
    answers = relationship("DoubtAnswer", back_populates="doubt", cascade="all, delete-orphan")
    votes = relationship("DoubtVote", back_populates="doubt", cascade="all, delete-orphan")
    bookmarks = relationship("DoubtBookmark", back_populates="doubt", cascade="all, delete-orphan")
    comments = relationship("DoubtComment", back_populates="doubt", cascade="all, delete-orphan")
    embeddings = relationship("DoubtEmbedding", back_populates="doubt", uselist=False, cascade="all, delete-orphan")
    suggested_answers = relationship("DoubtSuggestedAnswer", back_populates="doubt", cascade="all, delete-orphan")
    similar_doubts = relationship("SimilarDoubt", foreign_keys="SimilarDoubt.doubt_id", back_populates="doubt", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_doubt_post_institution', 'institution_id'),
        Index('idx_doubt_post_user', 'user_id'),
        Index('idx_doubt_post_subject', 'subject_id'),
        Index('idx_doubt_post_chapter', 'chapter_id'),
        Index('idx_doubt_post_status', 'status'),
        Index('idx_doubt_post_priority', 'priority'),
        Index('idx_doubt_post_priority_score', 'priority_score'),
        Index('idx_doubt_post_assigned_teacher', 'assigned_teacher_id'),
        Index('idx_doubt_post_created', 'created_at'),
        Index('idx_doubt_post_tags', 'tags'),
        Index('idx_doubt_post_auto_tags', 'auto_generated_tags'),
    )


class DoubtAnswer(Base):
    __tablename__ = "doubt_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    images = Column(JSON, nullable=True)
    upvote_count = Column(Integer, default=0, nullable=False)
    downvote_count = Column(Integer, default=0, nullable=False)
    is_accepted = Column(Boolean, default=False, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    doubt = relationship("DoubtPost", back_populates="answers")
    user = relationship("User", foreign_keys=[user_id])
    
    votes = relationship("AnswerVote", back_populates="answer", cascade="all, delete-orphan")
    comments = relationship("DoubtComment", back_populates="answer", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_doubt_answer_institution', 'institution_id'),
        Index('idx_doubt_answer_doubt', 'doubt_id'),
        Index('idx_doubt_answer_user', 'user_id'),
        Index('idx_doubt_answer_accepted', 'is_accepted'),
        Index('idx_doubt_answer_created', 'created_at'),
    )


class DoubtVote(Base):
    __tablename__ = "doubt_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    vote_type = Column(SQLEnum(VoteType), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    doubt = relationship("DoubtPost", back_populates="votes")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('doubt_id', 'user_id', name='uq_doubt_user_vote'),
        Index('idx_doubt_vote_institution', 'institution_id'),
        Index('idx_doubt_vote_doubt', 'doubt_id'),
        Index('idx_doubt_vote_user', 'user_id'),
    )


class AnswerVote(Base):
    __tablename__ = "answer_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    answer_id = Column(Integer, ForeignKey('doubt_answers.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    vote_type = Column(SQLEnum(VoteType), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    answer = relationship("DoubtAnswer", back_populates="votes")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('answer_id', 'user_id', name='uq_answer_user_vote'),
        Index('idx_answer_vote_institution', 'institution_id'),
        Index('idx_answer_vote_answer', 'answer_id'),
        Index('idx_answer_vote_user', 'user_id'),
    )


class DoubtBookmark(Base):
    __tablename__ = "doubt_bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    doubt = relationship("DoubtPost", back_populates="bookmarks")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('doubt_id', 'user_id', name='uq_doubt_user_bookmark'),
        Index('idx_doubt_bookmark_institution', 'institution_id'),
        Index('idx_doubt_bookmark_doubt', 'doubt_id'),
        Index('idx_doubt_bookmark_user', 'user_id'),
    )


class DoubtComment(Base):
    __tablename__ = "doubt_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=True, index=True)
    answer_id = Column(Integer, ForeignKey('doubt_answers.id', ondelete='CASCADE'), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    doubt = relationship("DoubtPost", back_populates="comments")
    answer = relationship("DoubtAnswer", back_populates="comments")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_doubt_comment_institution', 'institution_id'),
        Index('idx_doubt_comment_doubt', 'doubt_id'),
        Index('idx_doubt_comment_answer', 'answer_id'),
        Index('idx_doubt_comment_user', 'user_id'),
    )


class DoubtEmbedding(Base):
    __tablename__ = "doubt_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    
    embedding_model = Column(String(100), nullable=False, default='all-MiniLM-L6-v2')
    embedding_vector = Column(Text, nullable=False)
    embedding_dimension = Column(Integer, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    doubt = relationship("DoubtPost", back_populates="embeddings")
    
    __table_args__ = (
        Index('idx_doubt_embedding_doubt', 'doubt_id'),
        Index('idx_doubt_embedding_model', 'embedding_model'),
    )


class SimilarDoubt(Base):
    __tablename__ = "similar_doubts"
    
    id = Column(Integer, primary_key=True, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    similar_doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    similarity_score = Column(Float, nullable=False, index=True)
    semantic_similarity = Column(Float, nullable=True)
    keyword_similarity = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    doubt = relationship("DoubtPost", foreign_keys=[doubt_id], back_populates="similar_doubts")
    similar_doubt = relationship("DoubtPost", foreign_keys=[similar_doubt_id])
    
    __table_args__ = (
        UniqueConstraint('doubt_id', 'similar_doubt_id', name='uq_doubt_similar_doubt'),
        Index('idx_similar_doubt_doubt', 'doubt_id'),
        Index('idx_similar_doubt_similar', 'similar_doubt_id'),
        Index('idx_similar_doubt_institution', 'institution_id'),
        Index('idx_similar_doubt_score', 'similarity_score'),
    )


class DoubtSuggestedAnswer(Base):
    __tablename__ = "doubt_suggested_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    source_type = Column(String(50), nullable=False)
    source_id = Column(Integer, nullable=True)
    
    suggested_content = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False, index=True)
    relevance_score = Column(Float, nullable=True)
    
    source_metadata = Column(Text, nullable=True)
    is_helpful = Column(Boolean, nullable=True)
    helpful_votes = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    doubt = relationship("DoubtPost", back_populates="suggested_answers")
    
    __table_args__ = (
        Index('idx_doubt_suggestion_doubt', 'doubt_id'),
        Index('idx_doubt_suggestion_institution', 'institution_id'),
        Index('idx_doubt_suggestion_source_type', 'source_type'),
        Index('idx_doubt_suggestion_confidence', 'confidence_score'),
    )


class TeacherDoubtStats(Base):
    __tablename__ = "teacher_doubt_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True, index=True)
    
    total_assigned = Column(Integer, default=0, nullable=False)
    total_answered = Column(Integer, default=0, nullable=False)
    total_accepted = Column(Integer, default=0, nullable=False)
    
    active_doubts = Column(Integer, default=0, nullable=False)
    avg_response_time_minutes = Column(Float, nullable=True)
    avg_rating = Column(Float, nullable=True)
    
    expertise_score = Column(Float, default=0.0, nullable=False, index=True)
    workload_score = Column(Float, default=0.0, nullable=False, index=True)
    availability_score = Column(Float, default=1.0, nullable=False)
    
    last_assigned_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    teacher = relationship("Teacher")
    institution = relationship("Institution")
    subject = relationship("Subject")
    
    __table_args__ = (
        UniqueConstraint('teacher_id', 'subject_id', name='uq_teacher_subject_stats'),
        Index('idx_teacher_doubt_stats_teacher', 'teacher_id'),
        Index('idx_teacher_doubt_stats_institution', 'institution_id'),
        Index('idx_teacher_doubt_stats_subject', 'subject_id'),
        Index('idx_teacher_doubt_stats_expertise', 'expertise_score'),
        Index('idx_teacher_doubt_stats_workload', 'workload_score'),
    )
