from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Text, JSON, Index
from sqlalchemy.orm import relationship
from src.database import Base


class EventType(str, Enum):
    ACADEMIC = "academic"
    SPORTS = "sports"
    CULTURAL = "cultural"
    MEETING = "meeting"
    WORKSHOP = "workshop"
    EXHIBITION = "exhibition"
    OTHER = "other"


class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RSVPStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    TENTATIVE = "tentative"


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    location = Column(String(255), nullable=True)
    capacity = Column(Integer, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    requires_rsvp = Column(Boolean, default=False, nullable=False)
    rsvp_deadline = Column(DateTime, nullable=True)
    status = Column(String(20), default=EventStatus.DRAFT.value, nullable=False, index=True)
    image_url = Column(String(500), nullable=True)
    attachments = Column(JSON, nullable=True)
    target_audience = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    creator = relationship("User", foreign_keys=[created_by])
    rsvps = relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")
    photos = relationship("EventPhoto", back_populates="event", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_event_institution', 'institution_id'),
        Index('idx_event_created_by', 'created_by'),
        Index('idx_event_type', 'event_type'),
        Index('idx_event_date', 'event_date'),
        Index('idx_event_status', 'status'),
    )


class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    status = Column(String(20), default=RSVPStatus.PENDING.value, nullable=False, index=True)
    guests_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    checked_in = Column(Boolean, default=False, nullable=False)
    checked_in_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    event = relationship("Event", back_populates="rsvps")
    user = relationship("User")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_event_rsvp_event', 'event_id'),
        Index('idx_event_rsvp_user', 'user_id'),
        Index('idx_event_rsvp_student', 'student_id'),
        Index('idx_event_rsvp_status', 'status'),
    )


class EventPhoto(Base):
    __tablename__ = "event_photos"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    photo_url = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False)
    caption = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    event = relationship("Event", back_populates="photos")
    uploader = relationship("User")
    
    __table_args__ = (
        Index('idx_event_photo_event', 'event_id'),
        Index('idx_event_photo_uploader', 'uploaded_by'),
    )
