from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, JSON
from sqlalchemy.orm import relationship
from src.database import Base


class StudyBuddySession(Base):
    __tablename__ = "study_buddy_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    session_title = Column(String(255), nullable=True)
    context = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    total_messages = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    messages = relationship("StudyBuddyMessage", back_populates="session", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_study_buddy_session_institution', 'institution_id'),
        Index('idx_study_buddy_session_student', 'student_id'),
        Index('idx_study_buddy_session_active', 'is_active'),
    )


class StudyBuddyMessage(Base):
    __tablename__ = "study_buddy_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('study_buddy_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    session = relationship("StudyBuddySession", back_populates="messages")
    
    __table_args__ = (
        Index('idx_study_buddy_message_session', 'session_id'),
        Index('idx_study_buddy_message_created', 'created_at'),
    )


class StudyBuddyInsight(Base):
    __tablename__ = "study_buddy_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    insight_type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(Integer, default=1, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_study_buddy_insight_institution', 'institution_id'),
        Index('idx_study_buddy_insight_student', 'student_id'),
        Index('idx_study_buddy_insight_type', 'insight_type'),
        Index('idx_study_buddy_insight_read', 'is_read'),
    )
