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
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    is_active: bool = True


class TimetableTemplateCreate(TimetableTemplateBase):
    institution_id: int
    academic_year_id: int


class TimetableTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TimetableTemplateResponse(TimetableTemplateBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    created_at: datetime
    updated_at: datetime


class PeriodBase(BaseModel):
    name: str = Field(..., max_length=100)
    start_time: time
    end_time: time
    display_order: int = 0
    is_break: bool = False


class PeriodCreate(PeriodBase):
    institution_id: int
    template_id: int


class PeriodUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    display_order: Optional[int] = None
    is_break: Optional[bool] = None


class PeriodResponse(PeriodBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    template_id: int
    created_at: datetime
    updated_at: datetime


class TimetableEntryBase(BaseModel):
    section_id: int
    period_id: int
    subject_id: int
    teacher_id: Optional[int] = None
    day_of_week: DayOfWeekEnum
    room_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class TimetableEntryCreate(TimetableEntryBase):
    institution_id: int
    template_id: int


class TimetableEntryUpdate(BaseModel):
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    room_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class TimetableEntryResponse(TimetableEntryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    template_id: int
    created_at: datetime
    updated_at: datetime


class TimetableEntryWithDetailsResponse(TimetableEntryResponse):
    subject: Optional[SubjectResponse] = None
    period: Optional[PeriodResponse] = None


class TimetableTemplateWithPeriodsResponse(TimetableTemplateResponse):
    periods: List[PeriodResponse] = []


class TimetableConflict(BaseModel):
    type: str
    message: str
    entry_id: Optional[int] = None
    section_id: Optional[int] = None
    teacher_id: Optional[int] = None
    period_id: Optional[int] = None
    day_of_week: Optional[DayOfWeekEnum] = None


class TimetableValidationResponse(BaseModel):
    is_valid: bool
    conflicts: List[TimetableConflict] = []


class BulkGradeOrderUpdate(BaseModel):
    grades: List[dict] = Field(..., description="List of {id: int, display_order: int}")


class BulkSectionOrderUpdate(BaseModel):
    sections: List[dict] = Field(..., description="List of {id: int, display_order: int}")


class BulkPeriodOrderUpdate(BaseModel):
    periods: List[dict] = Field(..., description="List of {id: int, display_order: int}")


class AcademicYearWithTermsResponse(AcademicYearResponse):
    terms: List[TermResponse] = []
