from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class ParentBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    occupation: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    relation_type: Optional[str] = Field(None, max_length=50)
    is_primary_contact: bool = True


class ParentCreate(ParentBase):
    institution_id: int


class ParentUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    occupation: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    relation_type: Optional[str] = Field(None, max_length=50)
    is_primary_contact: Optional[bool] = None
    is_active: Optional[bool] = None


class ParentResponse(ParentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: Optional[int] = None
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudentParentLink(BaseModel):
    parent_id: int
    relation_type: str
    is_primary_contact: bool = False


class StudentBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    admission_number: Optional[str] = Field(None, max_length=50)
    roll_number: Optional[str] = Field(None, max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    blood_group: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = None
    parent_name: Optional[str] = Field(None, max_length=255)
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = Field(None, max_length=20)
    admission_date: Optional[date] = None
    photo_url: Optional[str] = Field(None, max_length=500)
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relation: Optional[str] = Field(None, max_length=100)
    previous_school: Optional[str] = Field(None, max_length=255)
    medical_conditions: Optional[str] = None
    nationality: Optional[str] = Field(None, max_length=100)
    religion: Optional[str] = Field(None, max_length=100)
    caste: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    aadhar_number: Optional[str] = Field(None, max_length=20)
    status: str = Field(default='active', max_length=20)
    is_active: bool = True


class StudentCreate(StudentBase):
    institution_id: int
    section_id: Optional[int] = None
    user_id: Optional[int] = None
    parent_ids: Optional[List[int]] = []


class StudentUpdate(BaseModel):
    admission_number: Optional[str] = Field(None, max_length=50)
    roll_number: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    blood_group: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = None
    parent_name: Optional[str] = Field(None, max_length=255)
    parent_email: Optional[EmailStr] = None
    parent_phone: Optional[str] = Field(None, max_length=20)
    admission_date: Optional[date] = None
    section_id: Optional[int] = None
    photo_url: Optional[str] = Field(None, max_length=500)
    emergency_contact_name: Optional[str] = Field(None, max_length=255)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relation: Optional[str] = Field(None, max_length=100)
    previous_school: Optional[str] = Field(None, max_length=255)
    medical_conditions: Optional[str] = None
    nationality: Optional[str] = Field(None, max_length=100)
    religion: Optional[str] = Field(None, max_length=100)
    caste: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    aadhar_number: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class SectionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    grade_id: int


class GradeInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str


class ParentInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    relation_type: Optional[str]
    is_primary_contact: bool


class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: Optional[int] = None
    section_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class StudentDetailResponse(StudentResponse):
    section: Optional[SectionInfo] = None
    parents_info: List[ParentInfo] = []


class AttendanceSummaryData(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    attendance_percentage: float


class PerformanceSummaryData(BaseModel):
    exam_name: str
    total_marks: float
    obtained_marks: float
    percentage: float
    grade: Optional[str]
    rank: Optional[int]


class StudentProfileResponse(StudentDetailResponse):
    attendance_summary: Optional[AttendanceSummaryData] = None
    recent_performance: List[PerformanceSummaryData] = []
    total_assignments: int = 0
    completed_assignments: int = 0
    pending_assignments: int = 0


class StudentBulkImportRow(BaseModel):
    admission_number: Optional[str] = None
    roll_number: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    parent_phone: Optional[str] = None
    admission_date: Optional[str] = None
    section_name: Optional[str] = None
    grade_name: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    previous_school: Optional[str] = None
    medical_conditions: Optional[str] = None
    nationality: Optional[str] = None
    religion: Optional[str] = None
    caste: Optional[str] = None
    category: Optional[str] = None
    aadhar_number: Optional[str] = None


class BulkImportPreviewRow(BaseModel):
    row_number: int
    data: Dict[str, Any]
    errors: List[str] = []
    warnings: List[str] = []
    is_valid: bool = True


class BulkImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    preview: List[BulkImportPreviewRow]


class BulkImportResult(BaseModel):
    total: int
    success: int
    failed: int
    errors: List[dict] = []


class StudentPromotionRequest(BaseModel):
    student_ids: List[int]
    target_grade_id: int
    target_section_id: Optional[int] = None
    effective_date: Optional[date] = None


class StudentPromotionCriteria(BaseModel):
    minimum_attendance_percentage: Optional[float] = Field(None, ge=0, le=100)
    minimum_pass_percentage: Optional[float] = Field(None, ge=0, le=100)
    subject_wise_pass_required: Optional[bool] = None


class StudentTransferRequest(BaseModel):
    student_id: int
    target_section_id: int
    effective_date: Optional[date] = None
    reason: Optional[str] = None


class IDCardData(BaseModel):
    student_id: int
    student_name: str
    admission_number: str
    class_section: str
    photo_url: Optional[str]
    institution_name: str
    institution_logo: Optional[str]
    valid_until: date
    date_of_birth: Optional[date]
    blood_group: Optional[str]


class StudentFilterParams(BaseModel):
    grade_id: Optional[int] = None
    section_id: Optional[int] = None
    status: Optional[str] = None
    gender: Optional[str] = None
    search: Optional[str] = None
    is_active: Optional[bool] = None


class StudentStatistics(BaseModel):
    total_students: int
    active_students: int
    inactive_students: int
    male_students: int
    female_students: int
    students_by_grade: Dict[str, int]
    students_by_status: Dict[str, int]


class LinkParentRequest(BaseModel):
    parent_id: int
    relation_type: str
    is_primary_contact: bool = False


class BulkPromotionResult(BaseModel):
    promoted: int
    failed: int
    errors: List[Dict[str, Any]] = []
