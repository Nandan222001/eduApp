from datetime import datetime, time
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Text, Index, JSON
from sqlalchemy.orm import relationship
from src.database import Base


class LocationType(str, Enum):
    IN_PERSON = "in_person"
    VIRTUAL = "virtual"
    HYBRID = "hybrid"


class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class BookingStatus(str, Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class ConferenceType(str, Enum):
    ACADEMIC = "academic"
    BEHAVIORAL = "behavioral"
    GENERAL = "general"
    URGENT = "urgent"


class ConferenceSlot(Base):
    __tablename__ = "conference_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    
    date = Column(Date, nullable=False, index=True)
    time_slot = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    
    location = Column(String(20), nullable=False, index=True)
    physical_location = Column(String(255), nullable=True)
    
    max_bookings = Column(Integer, default=1, nullable=False)
    current_bookings = Column(Integer, default=0, nullable=False)
    
    availability_status = Column(String(20), default=AvailabilityStatus.AVAILABLE.value, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    teacher = relationship("Teacher")
    bookings = relationship("ConferenceBooking", back_populates="slot", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_conference_slot_institution', 'institution_id'),
        Index('idx_conference_slot_teacher', 'teacher_id'),
        Index('idx_conference_slot_date', 'date'),
        Index('idx_conference_slot_status', 'availability_status'),
        Index('idx_conference_slot_teacher_date', 'teacher_id', 'date'),
    )


class ConferenceBooking(Base):
    __tablename__ = "conference_bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    slot_id = Column(Integer, ForeignKey('conference_slots.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    conference_type = Column(String(20), nullable=False, index=True)
    topic = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    # Parent-supplied list of discussion topics for the conference. Added to
    # match src/schemas/conference.py's `ConferenceBookingBase.parent_topics`
    # (a `List[str]`), which was never backed by a real column here --
    # `ConferenceBookingRepository.create(**data.model_dump())` passed
    # `parent_topics=...` straight into this model's constructor, raising an
    # unconditional `TypeError: 'parent_topics' is an invalid keyword
    # argument for ConferenceBooking` on every single booking creation
    # (including the auto-generated PTM speed dating bookings).
    parent_topics = Column(JSON, nullable=True)

    booking_status = Column(String(20), default=BookingStatus.CONFIRMED.value, nullable=False, index=True)

    video_meeting_link = Column(String(500), nullable=True)
    video_meeting_id = Column(String(255), nullable=True)
    video_meeting_password = Column(String(255), nullable=True)

    teacher_notes = Column(Text, nullable=True)
    parent_notes = Column(Text, nullable=True)
    # Matches ConferenceBookingUpdate/ConferenceBookingResponse's
    # follow_up_required/follow_up_notes fields, likewise never backed by a
    # real column -- every booking response (create/list/get/update/cancel/
    # check-in/complete/upload-recording) declares these as *required*
    # fields on ConferenceBookingResponse, so response serialization raised
    # a validation error on every single one of those endpoints.
    follow_up_required = Column(Boolean, default=False, nullable=False)
    follow_up_notes = Column(Text, nullable=True)

    checked_in_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    recording_url = Column(String(500), nullable=True)
    recording_s3_key = Column(String(500), nullable=True)
    # Also required (non-Optional, no default) on ConferenceBookingResponse,
    # and also already assumed to exist by
    # ConferenceBookingRepository.get_pending_reminders' filter on
    # `ConferenceBooking.reminder_24h_sent`/`.reminder_1h_sent` -- confirming
    # these are the model's real missing columns, not a schema mistake.
    reminder_24h_sent = Column(Boolean, default=False, nullable=False)
    reminder_1h_sent = Column(Boolean, default=False, nullable=False)

    # PTM Speed Dating fields
    speed_round = Column(Boolean, default=False, nullable=False, index=True)
    auto_talking_points = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    slot = relationship("ConferenceSlot", back_populates="bookings")
    parent = relationship("Parent")
    student = relationship("Student")
    survey = relationship("ConferenceSurvey", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    reminders = relationship("ConferenceReminder", back_populates="booking", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_conference_booking_institution', 'institution_id'),
        Index('idx_conference_booking_slot', 'slot_id'),
        Index('idx_conference_booking_parent', 'parent_id'),
        Index('idx_conference_booking_student', 'student_id'),
        Index('idx_conference_booking_status', 'booking_status'),
        Index('idx_conference_booking_type', 'conference_type'),
        Index('idx_conference_booking_speed_round', 'speed_round'),
    )


class ConferenceSurvey(Base):
    __tablename__ = "conference_surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey('conference_bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    respondent_type = Column(String(20), nullable=False)
    rating = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    # communication_rating/helpfulness_rating/suggestions and updated_at are
    # required by src/schemas/conference.py's ConferenceSurveyCreate/
    # ConferenceSurveyResponse but had no matching columns here --
    # ConferenceSurveyRepository.create(**data.model_dump()) raised
    # `TypeError: 'communication_rating' is an invalid keyword argument`
    # on every survey submission, and ConferenceSurveyResponse's required
    # `updated_at` field made every successful response fail validation too.
    communication_rating = Column(Integer, nullable=True)
    helpfulness_rating = Column(Integer, nullable=True)
    suggestions = Column(Text, nullable=True)

    was_helpful = Column(Boolean, nullable=True)
    would_recommend = Column(Boolean, nullable=True)

    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("ConferenceBooking", back_populates="survey")
    
    __table_args__ = (
        Index('idx_conference_survey_booking', 'booking_id'),
    )


class ConferenceReminder(Base):
    __tablename__ = "conference_reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey('conference_bookings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    reminder_type = Column(String(20), nullable=False)
    scheduled_for = Column(DateTime, nullable=False, index=True)
    sent_at = Column(DateTime, nullable=True)
    status = Column(String(20), default='pending', nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    booking = relationship("ConferenceBooking", back_populates="reminders")
    
    __table_args__ = (
        Index('idx_conference_reminder_booking', 'booking_id'),
        Index('idx_conference_reminder_scheduled', 'scheduled_for'),
        Index('idx_conference_reminder_status', 'status'),
    )
