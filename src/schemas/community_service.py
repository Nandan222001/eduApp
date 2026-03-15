from datetime import datetime, date
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from src.models.community_service import ServiceActivityType, VerificationStatus


class ServiceActivityBase(BaseModel):
    activity_name: str = Field(..., max_length=255)
    organization_name: str = Field(..., max_length=255)
    contact_person: str = Field(..., max_length=255)
    contact_email: EmailStr
    contact_phone: Optional[str] = Field(None, max_length=20)
    activity_type: ServiceActivityType
    date: date
    hours_logged: Decimal = Field(..., ge=0, le=999.99)
    description: Optional[str] = None
    impact_statement: Optional[str] = None
    reflection_essay: Optional[str] = None
    attachments: Optional[List[Dict[str, str]]] = None


class ServiceActivityCreate(ServiceActivityBase):
    student_id: int


class ServiceActivityUpdate(BaseModel):
    activity_name: Optional[str] = Field(None, max_length=255)
    organization_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    activity_type: Optional[ServiceActivityType] = None
    date: Optional[date] = None
    hours_logged: Optional[Decimal] = Field(None, ge=0, le=999.99)
    description: Optional[str] = None
    impact_statement: Optional[str] = None
    reflection_essay: Optional[str] = None
    attachments: Optional[List[Dict[str, str]]] = None


class ServiceActivityResponse(ServiceActivityBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    verification_status: VerificationStatus
    verifier_signature_url: Optional[str]
    verification_date: Optional[date]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None
    verification_link: Optional[str] = None


class VerificationRequest(BaseModel):
    verification_token: str
    signature_url: Optional[str] = None
    comments: Optional[str] = None


class ExternalVerificationResponse(BaseModel):
    success: bool
    message: str
    activity_id: int
    student_name: str
    organization_name: str
    hours_verified: Decimal


class OrganizationContactBase(BaseModel):
    organization_name: str = Field(..., max_length=255)
    contact_person: str = Field(..., max_length=255)
    contact_email: EmailStr
    contact_phone: Optional[str] = Field(None, max_length=20)
    organization_address: Optional[str] = None
    organization_website: Optional[str] = Field(None, max_length=500)
    organization_type: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class OrganizationContactCreate(OrganizationContactBase):
    pass


class OrganizationContactUpdate(BaseModel):
    organization_name: Optional[str] = Field(None, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    organization_address: Optional[str] = None
    organization_website: Optional[str] = Field(None, max_length=500)
    organization_type: Optional[str] = Field(None, max_length=100)
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class OrganizationContactResponse(OrganizationContactBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    is_verified: bool
    is_active: bool
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class ServicePortfolioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    total_hours: Decimal
    verified_hours: Decimal
    pending_hours: Decimal
    rejected_hours: Decimal
    volunteer_hours: Decimal
    fundraising_hours: Decimal
    environmental_hours: Decimal
    tutoring_hours: Decimal
    healthcare_hours: Decimal
    animal_welfare_hours: Decimal
    total_activities: int
    organizations_count: int
    last_activity_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None


class ActivityTypeBreakdown(BaseModel):
    activity_type: str
    hours: Decimal
    percentage: Decimal
    verified_hours: Decimal


class OrganizationBreakdown(BaseModel):
    organization_name: str
    total_hours: Decimal
    verified_hours: Decimal
    activity_count: int


class PortfolioDetailResponse(BaseModel):
    portfolio: ServicePortfolioResponse
    activity_breakdown: List[ActivityTypeBreakdown]
    organization_breakdown: List[OrganizationBreakdown]
    recent_activities: List[ServiceActivityResponse]
    graduation_progress: List[Dict[str, Any]]


class GraduationRequirementBase(BaseModel):
    requirement_name: str = Field(..., max_length=255)
    required_hours: Decimal = Field(..., ge=0)
    activity_type: Optional[ServiceActivityType] = None
    is_mandatory: bool = True
    description: Optional[str] = None
    grade_id: Optional[int] = None
    academic_year_id: Optional[int] = None


class GraduationRequirementCreate(GraduationRequirementBase):
    pass


class GraduationRequirementUpdate(BaseModel):
    requirement_name: Optional[str] = Field(None, max_length=255)
    required_hours: Optional[Decimal] = Field(None, ge=0)
    activity_type: Optional[ServiceActivityType] = None
    is_mandatory: Optional[bool] = None
    description: Optional[str] = None
    grade_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    is_active: Optional[bool] = None


class GraduationRequirementResponse(GraduationRequirementBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    is_active: bool
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class StudentGraduationProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    requirement_id: int
    hours_completed: Decimal
    hours_required: Decimal
    is_completed: bool
    completion_date: Optional[date]
    percentage_complete: Decimal
    created_at: datetime
    updated_at: datetime
    requirement_name: Optional[str] = None
    activity_type: Optional[str] = None


class GraduationStatusResponse(BaseModel):
    student_id: int
    student_name: str
    total_verified_hours: Decimal
    requirements: List[StudentGraduationProgressResponse]
    overall_completion_percentage: Decimal
    is_on_track: bool
    requirements_met: int
    total_requirements: int


class ServiceCertificateBase(BaseModel):
    certificate_type: str = Field(..., max_length=50)
    purpose: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class ServiceCertificateCreate(ServiceCertificateBase):
    student_id: int
    academic_year_id: Optional[int] = None
    signed_by: Optional[int] = None


class ServiceCertificateResponse(ServiceCertificateBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    certificate_number: str
    total_hours: Decimal
    issue_date: date
    academic_year_id: Optional[int]
    certificate_url: Optional[str]
    pdf_path: Optional[str]
    signed_by: Optional[int]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None
    academic_year_name: Optional[str] = None
    signer_name: Optional[str] = None


class HoursByMonth(BaseModel):
    month: int
    year: int
    hours: Decimal
    verified_hours: Decimal
    activity_count: int


class StudentServiceReport(BaseModel):
    student_id: int
    student_name: str
    total_hours: Decimal
    verified_hours: Decimal
    pending_hours: Decimal
    activity_breakdown: List[ActivityTypeBreakdown]
    organization_breakdown: List[OrganizationBreakdown]
    monthly_trends: List[HoursByMonth]
    certificates_earned: List[ServiceCertificateResponse]


class InstitutionServiceReport(BaseModel):
    institution_id: int
    total_students: int
    active_students: int
    total_hours: Decimal
    verified_hours: Decimal
    pending_hours: Decimal
    average_hours_per_student: Decimal
    activity_breakdown: List[ActivityTypeBreakdown]
    top_organizations: List[OrganizationBreakdown]
    monthly_trends: List[HoursByMonth]


class ExportRequest(BaseModel):
    student_id: Optional[int] = None
    grade_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    activity_type: Optional[ServiceActivityType] = None
    verification_status: Optional[VerificationStatus] = None
    format: str = Field("csv", pattern="^(csv|pdf)$")
    include_unverified: bool = False
