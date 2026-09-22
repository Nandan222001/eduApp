from datetime import datetime, date, date as date_type, time
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from src.models.conferences import LocationType, AvailabilityStatus, ConferenceType, BookingStatus


class ConferenceSlotBase(BaseModel):
    date: date
    time_slot: time
    duration_minutes: int = Field(..., ge=15, le=120)
    location: LocationType
    physical_location: Optional[str] = Field(None, max_length=255)
    max_bookings: int = Field(default=1, ge=1, le=10)
    notes: Optional[str] = None

    @field_validator('duration_minutes')
    @classmethod
    def validate_duration(cls, v):
        if v not in [15, 30, 45, 60, 90, 120]:
            raise ValueError('Duration must be 15, 30, 45, 60, 90, or 120 minutes')
        return v


class ConferenceSlotCreate(ConferenceSlotBase):
    institution_id: int
    teacher_id: int


class ConferenceSlotUpdate(BaseModel):
    # Aliased import: see the identical comment in
    # src/schemas/community_service.py's ServiceActivityUpdate for why a
    # field literally named `date` needs Optional[date_type] here, not
    # Optional[date] -- the latter resolves to NoneType under pydantic v2.
    date: Optional[date_type] = None
    time_slot: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=120)
    location: Optional[LocationType] = None
    physical_location: Optional[str] = Field(None, max_length=255)
    max_bookings: Optional[int] = Field(None, ge=1, le=10)
    availability_status: Optional[AvailabilityStatus] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('duration_minutes')
    @classmethod
    def validate_duration(cls, v):
        if v is not None and v not in [15, 30, 45, 60, 90, 120]:
            raise ValueError('Duration must be 15, 30, 45, 60, 90, or 120 minutes')
        return v


class ConferenceSlotResponse(ConferenceSlotBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    teacher_id: int
    current_bookings: int
    availability_status: AvailabilityStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ConferenceBookingBase(BaseModel):
    conference_type: ConferenceType
    parent_topics: Optional[List[str]] = None
    parent_notes: Optional[str] = None


class ConferenceBookingCreate(ConferenceBookingBase):
    institution_id: int
    slot_id: int
    parent_id: int
    student_id: int


class ConferenceBookingUpdate(BaseModel):
    conference_type: Optional[ConferenceType] = None
    parent_topics: Optional[List[str]] = None
    parent_notes: Optional[str] = None
    teacher_notes: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_notes: Optional[str] = None
    booking_status: Optional[BookingStatus] = None
    cancellation_reason: Optional[str] = None


class ConferenceBookingResponse(ConferenceBookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    slot_id: int
    parent_id: int
    student_id: int
    teacher_notes: Optional[str]
    video_meeting_link: Optional[str]
    video_meeting_id: Optional[str]
    video_meeting_password: Optional[str]
    recording_url: Optional[str]
    follow_up_required: bool
    follow_up_notes: Optional[str]
    booking_status: BookingStatus
    checked_in_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]
    reminder_24h_sent: bool
    reminder_1h_sent: bool
    created_at: datetime
    updated_at: datetime


class ConferenceBookingWithSlotResponse(ConferenceBookingResponse):
    slot: ConferenceSlotResponse


class ConferenceSlotWithBookingsResponse(ConferenceSlotResponse):
    bookings: List[ConferenceBookingResponse]


class ConferenceSurveyBase(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = None
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    helpfulness_rating: Optional[int] = Field(None, ge=1, le=5)
    would_recommend: Optional[bool] = None
    suggestions: Optional[str] = None


class ConferenceSurveyCreate(ConferenceSurveyBase):
    booking_id: int
    respondent_type: str = Field(..., pattern='^(parent|teacher)$')


class ConferenceSurveyUpdate(ConferenceSurveyBase):
    pass


class ConferenceSurveyResponse(ConferenceSurveyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    respondent_type: str
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ConferenceCheckInRequest(BaseModel):
    booking_id: int


class ConferenceRecordingUpload(BaseModel):
    booking_id: int
    recording_url: str
    recording_s3_key: Optional[str] = None


class ConferenceAvailabilityQuery(BaseModel):
    teacher_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    location: Optional[LocationType] = None
    min_duration: Optional[int] = None


class BulkSlotCreate(BaseModel):
    institution_id: int
    teacher_id: int
    date_from: date
    date_to: date
    time_slots: List[time]
    duration_minutes: int = Field(..., ge=15, le=120)
    location: LocationType
    physical_location: Optional[str] = Field(None, max_length=255)
    max_bookings: int = Field(default=1, ge=1, le=10)
    skip_weekends: bool = True
    notes: Optional[str] = None

    @field_validator('duration_minutes')
    @classmethod
    def validate_duration(cls, v):
        if v not in [15, 30, 45, 60, 90, 120]:
            raise ValueError('Duration must be 15, 30, 45, 60, 90, or 120 minutes')
        return v


class ConferenceStatistics(BaseModel):
    total_slots: int
    available_slots: int
    booked_slots: int
    completed_conferences: int
    cancelled_conferences: int
    average_rating: Optional[float]
    total_bookings: int
    upcoming_conferences: int
    past_conferences: int


class TeacherConferenceStats(BaseModel):
    teacher_id: int
    total_slots_created: int
    total_bookings: int
    completed_conferences: int
    average_rating: Optional[float]
    total_hours: float
    upcoming_conferences: int
