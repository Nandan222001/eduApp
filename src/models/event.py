from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from src.database import Base


class EventType(str, Enum):
    ACADEMIC = "academic"
    SPORTS = "sports"
    CULTURAL = "cultural"
    MEETING = "meeting"
    WORKSHOP = "workshop"
    EXHIBITION = "exhibition"
    SOCIAL = "social"
    EXCURSION = "excursion"
    OTHER = "other"


class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CONFIRMED = "confirmed"
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
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=False, index=True)
    location = Column(String(500), nullable=True)
    venue = Column(String(255), nullable=True)
    organizer = Column(String(255), nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    max_participants = Column(Integer, nullable=True)
    registration_required = Column(Boolean, default=False, nullable=False)
    registration_deadline = Column(DateTime, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    allow_guests = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default=EventStatus.DRAFT.value, nullable=False, index=True)
    banner_image_url = Column(String(500), nullable=True)
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
        Index('idx_event_start_date', 'start_date'),
        Index('idx_event_status', 'status'),
    )


class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    status = Column(String(20), default=RSVPStatus.PENDING.value, nullable=False, index=True)
    number_of_guests = Column(Integer, default=0, nullable=False)
    remarks = Column(Text, nullable=True)
    response_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    event = relationship("Event", back_populates="rsvps")
    user = relationship("User")

    __table_args__ = (
        Index('idx_event_rsvp_event', 'event_id'),
        Index('idx_event_rsvp_user', 'user_id'),
        Index('idx_event_rsvp_status', 'status'),
    )


class EventPhoto(Base):
    __tablename__ = "event_photos"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    event = relationship("Event", back_populates="photos")
    uploader = relationship("User")

    __table_args__ = (
        Index('idx_event_photo_event', 'event_id'),
        Index('idx_event_photo_uploader', 'uploaded_by'),
    )
