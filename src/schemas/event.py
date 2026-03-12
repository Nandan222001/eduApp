from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from src.models.event import EventType, EventStatus, RSVPStatus


class EventBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    event_type: str
    start_date: datetime
    end_date: datetime
    location: Optional[str] = Field(None, max_length=500)
    venue: Optional[str] = Field(None, max_length=255)
    organizer: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    max_participants: Optional[int] = Field(None, ge=1)
    registration_required: bool = False
    registration_deadline: Optional[datetime] = None
    is_public: bool = False
    allow_guests: bool = False
    status: str = "draft"
    banner_image_url: Optional[str] = None


class EventCreate(EventBase):
    institution_id: int


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=500)
    venue: Optional[str] = Field(None, max_length=255)
    organizer: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    max_participants: Optional[int] = Field(None, ge=1)
    registration_required: Optional[bool] = None
    registration_deadline: Optional[datetime] = None
    is_public: Optional[bool] = None
    allow_guests: Optional[bool] = None
    status: Optional[str] = None
    banner_image_url: Optional[str] = None


class EventResponse(EventBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class EventRSVPBase(BaseModel):
    status: str = "pending"
    number_of_guests: int = Field(default=0, ge=0)
    remarks: Optional[str] = None


class EventRSVPCreate(EventRSVPBase):
    event_id: int
    user_id: int


class EventRSVPUpdate(BaseModel):
    status: Optional[str] = None
    number_of_guests: Optional[int] = Field(None, ge=0)
    remarks: Optional[str] = None


class EventRSVPResponse(EventRSVPBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    event_id: int
    user_id: int
    response_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class EventRSVPWithUser(EventRSVPResponse):
    user_name: str
    user_email: Optional[str] = None


class EventPhotoBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    photo_url: str = Field(..., max_length=500)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    display_order: int = 0
    is_featured: bool = False
    is_active: bool = True


class EventPhotoCreate(EventPhotoBase):
    event_id: int
    file_size: Optional[int] = None
    file_type: Optional[str] = None


class EventPhotoUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class EventPhotoResponse(EventPhotoBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    event_id: int
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime


class EventWithDetails(EventResponse):
    rsvp_count: int = 0
    accepted_count: int = 0
    declined_count: int = 0
    photo_count: int = 0


class EventCalendarItem(BaseModel):
    id: int
    title: str
    event_type: str
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None
    status: str
