from datetime import datetime, time
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from src.models.timetable import DayOfWeek, PeriodType


class PeriodSlotBase(BaseModel):
    period_number: int = Field(..., ge=1)
    period_name: Optional[str] = Field(None, max_length=100)
    period_type: str = "lecture"
    start_time: time
    end_time: time
    is_break: bool = False
    is_active: bool = True


class PeriodSlotCreate(PeriodSlotBase):
    template_id: int


class PeriodSlotUpdate(BaseModel):
    period_number: Optional[int] = Field(None, ge=1)
    period_name: Optional[str] = Field(None, max_length=100)
    period_type: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_break: Optional[bool] = None
    is_active: Optional[bool] = None


class PeriodSlotResponse(PeriodSlotBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    template_id: int
    created_at: datetime
    updated_at: datetime


class TimetableTemplateBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    school_start_time: time
    school_end_time: time
    periods_per_day: int = Field(default=8, ge=1)
    period_duration_minutes: int = Field(default=45, ge=1)
    break_duration_minutes: int = Field(default=10, ge=0)
    lunch_duration_minutes: int = Field(default=30, ge=0)
    working_days: str = "monday,tuesday,wednesday,thursday,friday"
    is_default: bool = False
    is_active: bool = True


class TimetableTemplateCreate(TimetableTemplateBase):
    institution_id: int
    academic_year_id: int


class TimetableTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    school_start_time: Optional[time] = None
    school_end_time: Optional[time] = None
    periods_per_day: Optional[int] = Field(None, ge=1)
    period_duration_minutes: Optional[int] = Field(None, ge=1)
    break_duration_minutes: Optional[int] = Field(None, ge=0)
    lunch_duration_minutes: Optional[int] = Field(None, ge=0)
    working_days: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class TimetableTemplateResponse(TimetableTemplateBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    created_at: datetime
    updated_at: datetime


class TimetableTemplateWithPeriods(TimetableTemplateResponse):
    periods: List[PeriodSlotResponse] = []


class TimetableBase(BaseModel):
    effective_from: datetime
    effective_until: Optional[datetime] = None
    is_active: bool = True


class TimetableCreate(TimetableBase):
    institution_id: int
    academic_year_id: int
    grade_id: int
    section_id: int
    template_id: Optional[int] = None


class TimetableUpdate(BaseModel):
    template_id: Optional[int] = None
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    is_active: Optional[bool] = None


class TimetableResponse(TimetableBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    grade_id: int
    section_id: int
    template_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class TimetableEntryBase(BaseModel):
    day_of_week: str
    period_number: int = Field(..., ge=1)
    start_time: time
    end_time: time
    period_type: str = "lecture"
    room_number: Optional[str] = Field(None, max_length=50)
    is_substitution: bool = False
    original_teacher_id: Optional[int] = None
    substitution_reason: Optional[str] = None
    remarks: Optional[str] = None
    is_active: bool = True


class TimetableEntryCreate(TimetableEntryBase):
    timetable_id: int
    subject_id: int
    teacher_id: Optional[int] = None


class TimetableEntryUpdate(BaseModel):
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    day_of_week: Optional[str] = None
    period_number: Optional[int] = Field(None, ge=1)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    period_type: Optional[str] = None
    room_number: Optional[str] = Field(None, max_length=50)
    is_substitution: Optional[bool] = None
    original_teacher_id: Optional[int] = None
    substitution_reason: Optional[str] = None
    remarks: Optional[str] = None
    is_active: Optional[bool] = None


class TimetableEntryResponse(TimetableEntryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    timetable_id: int
    subject_id: int
    teacher_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class TimetableEntryWithDetails(TimetableEntryResponse):
    subject_name: str
    subject_code: Optional[str] = None
    teacher_name: Optional[str] = None
    original_teacher_name: Optional[str] = None


class TimetableWithEntries(TimetableResponse):
    entries: List[TimetableEntryWithDetails] = []


class ConflictCheck(BaseModel):
    has_conflict: bool
    conflict_type: Optional[str] = None
    conflict_message: Optional[str] = None
    conflicting_entries: List[TimetableEntryWithDetails] = []
