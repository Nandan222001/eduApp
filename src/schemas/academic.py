from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class TermTypeEnum(str, Enum):
    SEMESTER = "semester"
    TRIMESTER = "trimester"
    QUARTER = "quarter"
    CUSTOM = "custom"


class DayOfWeekEnum(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class AcademicYearBase(BaseModel):
    name: str = Field(..., max_length=100)
    start_date: date
    end_date: date
    is_active: bool = True
    is_current: bool = False
    description: Optional[str] = None


class AcademicYearCreate(AcademicYearBase):
    institution_id: int


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None


class AcademicYearResponse(AcademicYearBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class GradeBase(BaseModel):
    name: str = Field(..., max_length=100)
    display_order: int = 0
    description: Optional[str] = None
    is_active: bool = True


class GradeCreate(GradeBase):
    institution_id: int
    academic_year_id: int


class GradeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    display_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class GradeResponse(GradeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    created_at: datetime
    updated_at: datetime


class SectionBase(BaseModel):
    name: str = Field(..., max_length=100)
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True


class SectionCreate(SectionBase):
    institution_id: int
    grade_id: int


class SectionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SectionResponse(SectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    grade_id: int
    created_at: datetime
    updated_at: datetime


class SubjectBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    is_active: bool = True


class SubjectCreate(SubjectBase):
    institution_id: int


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SubjectResponse(SubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class GradeSubjectBase(BaseModel):
    grade_id: int
    subject_id: int
    is_compulsory: bool = True


class GradeSubjectCreate(GradeSubjectBase):
    institution_id: int


class GradeSubjectResponse(GradeSubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime


class GradeWithSectionsResponse(GradeResponse):
    sections: List[SectionResponse] = []


class GradeWithSubjectsResponse(GradeResponse):
    subjects: List[SubjectResponse] = []


class AcademicYearWithGradesResponse(AcademicYearResponse):
    grades: List[GradeResponse] = []


class ChapterBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: int = 0
    description: Optional[str] = None
    is_active: bool = True


class ChapterCreate(ChapterBase):
    institution_id: int
    subject_id: int
    grade_id: int


class ChapterUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ChapterResponse(ChapterBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    subject_id: int
    grade_id: int
    created_at: datetime
    updated_at: datetime


class TopicBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: int = 0
    description: Optional[str] = None
    is_active: bool = True


class TopicCreate(TopicBase):
    institution_id: int
    chapter_id: int


class TopicUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    code: Optional[str] = Field(None, max_length=50)
    display_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TopicResponse(TopicBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    chapter_id: int
    created_at: datetime
    updated_at: datetime


class ChapterWithTopicsResponse(ChapterResponse):
    topics: List[TopicResponse] = []


class SubjectWithChaptersResponse(SubjectResponse):
    chapters: List[ChapterResponse] = []


class TermBase(BaseModel):
    name: str = Field(..., max_length=100)
    term_type: TermTypeEnum
    start_date: date
    end_date: date
    display_order: int = 0
    is_active: bool = True
    description: Optional[str] = None


class TermCreate(TermBase):
    institution_id: int
    academic_year_id: int


class TermUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    term_type: Optional[TermTypeEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class TermResponse(TermBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    created_at: datetime
    updated_at: datetime


class TimetableTemplateBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    is_active: bool = True


class TimetableTemplateCreate(TimetableTemplateBase):
    institution_id: int


class TimetableTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TimetableTemplateResponse(TimetableTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


# NOTE on this file's Timetable* schemas: `src.models.timetable.PeriodSlot`/
# `TimetableEntry` are normalized as TimetableTemplate -> PeriodSlot (a
# template's period grid, keyed by `period_number`) and separately
# Timetable (one per section+academic_year, optionally following a
# template) -> TimetableEntry (that section's actual day/period/subject/
# teacher grid). These schemas previously assumed a flat, denormalized shape
# with `institution_id`/`display_order`/`name`/`is_break` on the period and
# `institution_id`/`template_id`/`section_id`/`period_id` on the entry, none
# of which exist on the real models (model/schema drift, bug class 11) --
# every endpoint in `src/api/v1/timetables.py` that touched a period or
# entry raised an `AttributeError` building its query. This is very likely
# the same underlying cause as `src/api/v1/timetable.py` (singular)'s
# separately-known `DayOfWeek`-import crash: both routers/schema modules
# read like they were written against an older, richer version of
# `src.models.timetable` that has since been normalized down to the shape
# below, and neither was updated to match. Fixed here (for this router
# only) by rebuilding these schemas to mirror the real columns.
class PeriodBase(BaseModel):
    period_number: int = Field(..., ge=1)
    start_time: time
    end_time: time
    duration_minutes: int = Field(..., ge=1)
    period_type: str = Field("lecture", max_length=20)


class PeriodCreate(PeriodBase):
    template_id: int


class PeriodUpdate(BaseModel):
    period_number: Optional[int] = Field(None, ge=1)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=1)
    period_type: Optional[str] = Field(None, max_length=20)


class PeriodResponse(PeriodBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int
    created_at: datetime


class TimetableTemplateWithPeriodsResponse(TimetableTemplateResponse):
    periods: List[PeriodResponse] = []


class TimetableInstanceCreate(BaseModel):
    institution_id: int
    section_id: int
    academic_year_id: int
    template_id: Optional[int] = None
    is_active: bool = True


class TimetableInstanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    section_id: int
    academic_year_id: int
    template_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TimetableEntryBase(BaseModel):
    day_of_week: DayOfWeekEnum
    period_number: int = Field(..., ge=1)
    subject_id: int
    teacher_id: Optional[int] = None
    room_number: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class TimetableEntryCreate(TimetableEntryBase):
    timetable_id: int


class TimetableEntryUpdate(BaseModel):
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    room_number: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class TimetableEntryResponse(TimetableEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timetable_id: int
    created_at: datetime
    updated_at: datetime


class TimetableEntryWithDetailsResponse(TimetableEntryResponse):
    subject: Optional[SubjectResponse] = None


class TimetableInstanceWithEntriesResponse(TimetableInstanceResponse):
    entries: List[TimetableEntryResponse] = []


class TimetableConflict(BaseModel):
    type: str
    message: str
    entry_id: Optional[int] = None
    timetable_id: Optional[int] = None
    teacher_id: Optional[int] = None
    period_number: Optional[int] = None
    day_of_week: Optional[DayOfWeekEnum] = None


class TimetableValidationResponse(BaseModel):
    is_valid: bool
    conflicts: List[TimetableConflict] = []


class BulkGradeOrderUpdate(BaseModel):
    grades: List[dict] = Field(..., description="List of {id: int, display_order: int}")


class BulkSectionOrderUpdate(BaseModel):
    sections: List[dict] = Field(..., description="List of {id: int, display_order: int}")


class BulkPeriodOrderUpdate(BaseModel):
    periods: List[dict] = Field(..., description="List of {id: int, period_number: int}")


class AcademicYearWithTermsResponse(AcademicYearResponse):
    terms: List[TermResponse] = []
