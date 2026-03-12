from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
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
    images = Column(ARRAY(String), nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    
    status = Column(SQLEnum(DoubtStatus), default=DoubtStatus.UNANSWERED, nullable=False, index=True)
    view_count = Column(Integer, default=0, nullable=False)
    answer_count = Column(Integer, default=0, nullable=False)
    upvote_count = Column(Integer, default=0, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    accepted_answer_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User", foreign_keys=[user_id])
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    
    answers = relationship("DoubtAnswer", back_populates="doubt", cascade="all, delete-orphan")
    votes = relationship("DoubtVote", back_populates="doubt", cascade="all, delete-orphan")
    bookmarks = relationship("DoubtBookmark", back_populates="doubt", cascade="all, delete-orphan")
    comments = relationship("DoubtComment", back_populates="doubt", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_doubt_post_institution', 'institution_id'),
        Index('idx_doubt_post_user', 'user_id'),
        Index('idx_doubt_post_subject', 'subject_id'),
        Index('idx_doubt_post_chapter', 'chapter_id'),
        Index('idx_doubt_post_status', 'status'),
        Index('idx_doubt_post_created', 'created_at'),
        Index('idx_doubt_post_tags', 'tags', postgresql_using='gin'),
    )


class DoubtAnswer(Base):
    __tablename__ = "doubt_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    doubt_id = Column(Integer, ForeignKey('doubt_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    images = Column(ARRAY(String), nullable=True)
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
