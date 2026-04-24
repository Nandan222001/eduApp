from datetime import datetime
from typing import Optional, List, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from src.models.assignment import AssignmentStatus, SubmissionStatus


def _empty_str_to_none(v: Any) -> Any:
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


class AssignmentFileBase(BaseModel):
    file_name: str
    file_size: int
    file_type: str
    file_url: str
    s3_key: str


class AssignmentFileResponse(AssignmentFileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    assignment_id: int
    uploaded_at: datetime


class SubmissionFileBase(BaseModel):
    file_name: str
    file_size: int
    file_type: str
    file_url: str
    s3_key: str


class SubmissionFileResponse(SubmissionFileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    submission_id: int
    uploaded_at: datetime


class AssignmentBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    publish_date: Optional[datetime] = None
    close_date: Optional[datetime] = None
    max_marks: Decimal = Field(default=Decimal("100.00"), ge=0)
    passing_marks: Optional[Decimal] = Field(None, ge=0)
    allow_late_submission: bool = False
    late_penalty_percentage: Optional[float] = Field(None, ge=0, le=100)
    max_file_size_mb: int = Field(default=10, ge=1, le=100)
    allowed_file_types: Optional[str] = None
    status: AssignmentStatus = AssignmentStatus.DRAFT

    @field_validator("due_date", "publish_date", "close_date", mode="before")
    @classmethod
    def coerce_empty_date(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class AssignmentCreate(AssignmentBase):
    institution_id: int = 0
    teacher_id: Optional[int] = None
    grade_id: int
    section_id: Optional[int] = None
    subject_id: int
    chapter_id: Optional[int] = None

    @field_validator('passing_marks')
    @classmethod
    def validate_passing_marks(cls, v, info):
        if v is not None and 'max_marks' in info.data:
            if v > info.data['max_marks']:
                raise ValueError('Passing marks cannot exceed max marks')
        return v


class AssignmentUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    publish_date: Optional[datetime] = None
    close_date: Optional[datetime] = None

    @field_validator("due_date", "publish_date", "close_date", mode="before")
    @classmethod
    def coerce_empty_date(cls, v: Any) -> Any:
        return _empty_str_to_none(v)
    max_marks: Optional[Decimal] = Field(None, ge=0)
    passing_marks: Optional[Decimal] = Field(None, ge=0)
    allow_late_submission: Optional[bool] = None
    late_penalty_percentage: Optional[float] = Field(None, ge=0, le=100)
    max_file_size_mb: Optional[int] = Field(None, ge=1, le=100)
    allowed_file_types: Optional[str] = None
    status: Optional[AssignmentStatus] = None


class AssignmentResponse(AssignmentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    teacher_id: int
    grade_id: int
    section_id: Optional[int]
    subject_id: int
    chapter_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AssignmentWithFilesResponse(AssignmentResponse):
    attachment_files: List[AssignmentFileResponse] = []


class AssignmentWithRubricResponse(AssignmentResponse):
    attachment_files: List[AssignmentFileResponse] = []
    rubric_criteria: List["RubricCriteriaResponse"] = []


class AssignmentWithStatsResponse(AssignmentResponse):
    total_submissions: int = 0
    submitted_count: int = 0
    graded_count: int = 0
    pending_count: int = 0
    late_submissions: int = 0
    average_marks: Optional[Decimal] = None


class SubmissionBase(BaseModel):
    content: Optional[str] = None
    submission_text: Optional[str] = None


class SubmissionCreate(SubmissionBase):
    assignment_id: int
    student_id: int


class SubmissionUpdate(SubmissionBase):
    pass


class SubmissionGradeInput(BaseModel):
    marks_obtained: Decimal = Field(..., ge=0)
    grade: Optional[str] = Field(None, max_length=10)
    feedback: Optional[str] = None

    @field_validator('marks_obtained')
    @classmethod
    def validate_marks(cls, v):
        if v < 0:
            raise ValueError('Marks cannot be negative')
        return v


class SubmissionResponse(SubmissionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    assignment_id: int
    student_id: int
    submitted_at: Optional[datetime]
    is_late: bool
    marks_obtained: Optional[Decimal]
    grade: Optional[str]
    feedback: Optional[str]
    graded_by: Optional[int]
    graded_at: Optional[datetime]
    status: SubmissionStatus
    created_at: datetime
    updated_at: datetime


class SubmissionWithFilesResponse(SubmissionResponse):
    submission_files: List[SubmissionFileResponse] = []


class SubmissionWithStudentResponse(SubmissionResponse):
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_roll_number: Optional[str] = None


class SubmissionWithGradesResponse(SubmissionResponse):
    submission_files: List[SubmissionFileResponse] = []
    rubric_grades: List["SubmissionGradeResponse"] = []


class SubmissionStatistics(BaseModel):
    assignment_id: int
    total_students: int
    submitted_count: int
    not_submitted_count: int
    late_submissions: int
    graded_count: int
    pending_grading: int
    average_marks: Optional[Decimal]
    highest_marks: Optional[Decimal]
    lowest_marks: Optional[Decimal]
    pass_rate: Optional[float]


class AssignmentAnalytics(BaseModel):
    assignment_id: int
    title: str
    total_submissions: int
    submission_rate: float
    average_marks: Optional[Decimal]
    on_time_submissions: int
    late_submissions: int
    graded_count: int
    pending_count: int
    pass_count: int
    fail_count: int


class FileUploadResponse(BaseModel):
    file_name: str
    file_url: str
    s3_key: str
    file_size: int
    file_type: str


class RubricLevelBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    points: Decimal = Field(..., ge=0)
    order: int = Field(default=0)


class RubricLevelCreate(RubricLevelBase):
    pass


class RubricLevelResponse(RubricLevelBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    criteria_id: int
    created_at: datetime


class RubricCriteriaBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    max_points: Decimal = Field(..., ge=0)
    order: int = Field(default=0)


class RubricCriteriaCreate(RubricCriteriaBase):
    levels: List[RubricLevelCreate] = []


class RubricCriteriaUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    max_points: Optional[Decimal] = Field(None, ge=0)
    order: Optional[int] = None


class RubricCriteriaResponse(RubricCriteriaBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    assignment_id: int
    created_at: datetime
    levels: List[RubricLevelResponse] = []


class SubmissionGradeBase(BaseModel):
    criteria_id: int
    points_awarded: Decimal = Field(..., ge=0)
    feedback: Optional[str] = None


class SubmissionGradeCreate(SubmissionGradeBase):
    pass


class SubmissionGradeResponse(SubmissionGradeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    submission_id: int
    graded_at: datetime


class BulkGradeInput(BaseModel):
    marks_obtained: Decimal = Field(..., ge=0)
    grade: Optional[str] = Field(None, max_length=10)
    feedback: Optional[str] = None
    rubric_grades: List[SubmissionGradeCreate] = []
