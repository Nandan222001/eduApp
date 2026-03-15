from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class StudentJobListingBase(BaseModel):
    employer_name: str = Field(..., max_length=200)
    job_title: str = Field(..., max_length=200)
    job_type: str
    description: str
    requirements: Optional[str] = None
    hourly_pay: Optional[Decimal] = None
    hours_per_week: Optional[int] = None
    location: Optional[str] = Field(None, max_length=300)
    application_link: Optional[str] = Field(None, max_length=500)
    expiry_date: Optional[date] = None


class StudentJobListingCreate(StudentJobListingBase):
    institution_id: int
    employer_verified: bool = False


class StudentJobListingUpdate(BaseModel):
    employer_name: Optional[str] = Field(None, max_length=200)
    job_title: Optional[str] = Field(None, max_length=200)
    job_type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    hourly_pay: Optional[Decimal] = None
    hours_per_week: Optional[int] = None
    location: Optional[str] = Field(None, max_length=300)
    application_link: Optional[str] = Field(None, max_length=500)
    expiry_date: Optional[date] = None
    employer_verified: Optional[bool] = None
    is_active: Optional[bool] = None


class StudentJobListingResponse(StudentJobListingBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    posting_date: date
    employer_verified: bool
    application_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class WorkPermitBase(BaseModel):
    permit_type: str
    issue_date: date
    expiry_date: date
    employer_name: Optional[str] = Field(None, max_length=200)
    max_hours_per_week: Optional[int] = None
    parent_consent: bool = False
    permit_number: Optional[str] = Field(None, max_length=100)
    restrictions: Optional[str] = None
    notes: Optional[str] = None


class WorkPermitCreate(WorkPermitBase):
    institution_id: int
    student_id: int


class WorkPermitUpdate(BaseModel):
    permit_type: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    employer_name: Optional[str] = Field(None, max_length=200)
    max_hours_per_week: Optional[int] = None
    school_authorization_status: Optional[str] = None
    parent_consent: Optional[bool] = None
    permit_number: Optional[str] = Field(None, max_length=100)
    restrictions: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class WorkPermitResponse(WorkPermitBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    school_authorization_status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudentEmploymentBase(BaseModel):
    employer: str = Field(..., max_length=200)
    job_title: str = Field(..., max_length=200)
    job_type: str
    start_date: date
    end_date: Optional[date] = None
    hours_per_week: Optional[int] = None
    hourly_pay: Optional[Decimal] = None
    skills_gained: Optional[str] = None
    responsibilities: Optional[str] = None
    supervisor_name: Optional[str] = Field(None, max_length=200)
    supervisor_reference: Optional[str] = None
    supervisor_contact: Optional[str] = Field(None, max_length=200)
    total_hours_worked: Optional[Decimal] = None
    performance_rating: Optional[Decimal] = None
    would_recommend: Optional[bool] = None


class StudentEmploymentCreate(StudentEmploymentBase):
    institution_id: int
    student_id: int
    work_permit_id: Optional[int] = None
    is_current: bool = True


class StudentEmploymentUpdate(BaseModel):
    employer: Optional[str] = Field(None, max_length=200)
    job_title: Optional[str] = Field(None, max_length=200)
    job_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    hours_per_week: Optional[int] = None
    hourly_pay: Optional[Decimal] = None
    skills_gained: Optional[str] = None
    responsibilities: Optional[str] = None
    supervisor_name: Optional[str] = Field(None, max_length=200)
    supervisor_reference: Optional[str] = None
    supervisor_contact: Optional[str] = Field(None, max_length=200)
    is_current: Optional[bool] = None
    total_hours_worked: Optional[Decimal] = None
    performance_rating: Optional[Decimal] = None
    would_recommend: Optional[bool] = None
    is_active: Optional[bool] = None


class StudentEmploymentResponse(StudentEmploymentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    work_permit_id: Optional[int] = None
    is_current: bool
    verified_for_graduation: bool
    verification_date: Optional[date] = None
    verified_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class JobApplicationBase(BaseModel):
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None


class JobApplicationCreate(JobApplicationBase):
    institution_id: int
    student_id: int
    job_listing_id: int


class JobApplicationUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50)
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    interview_date: Optional[date] = None
    response_date: Optional[date] = None
    outcome: Optional[str] = Field(None, max_length=50)


class JobApplicationResponse(JobApplicationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    job_listing_id: int
    application_date: date
    status: str
    interview_date: Optional[date] = None
    response_date: Optional[date] = None
    outcome: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class JobApplicationWithListing(JobApplicationResponse):
    job_listing: StudentJobListingResponse


class EmploymentVerificationRequest(BaseModel):
    employment_id: int
    verified_for_graduation: bool
    verification_notes: Optional[str] = None


class StudentEmploymentSummary(BaseModel):
    student_id: int
    total_jobs: int
    current_jobs: int
    total_hours_worked: Decimal
    verified_jobs: int
    job_types_summary: dict
