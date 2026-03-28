from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# Certificate Template Schemas
class CertificateTemplateBase(BaseModel):
    template_name: str = Field(..., max_length=200)
    certificate_type: str = Field(..., max_length=50)
    template_config: dict[str, Any]
    is_default: bool = False
    is_active: bool = True


class CertificateTemplateCreate(CertificateTemplateBase):
    institution_id: int


class CertificateTemplateUpdate(BaseModel):
    template_name: str | None = Field(None, max_length=200)
    certificate_type: str | None = Field(None, max_length=50)
    template_config: dict[str, Any] | None = None
    is_default: bool | None = None
    is_active: bool | None = None


class CertificateTemplateResponse(CertificateTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


# Issued Certificate Schemas
class GenerateTransferCertificateRequest(BaseModel):
    student_id: int
    leaving_date: date
    reason_for_leaving: str
    conduct: str = "Good"
    remarks: str | None = None
    template_id: int | None = None


class GenerateLeavingCertificateRequest(BaseModel):
    student_id: int
    leaving_date: date
    reason: str
    conduct: str = "Good"
    remarks: str | None = None
    template_id: int | None = None


class GenerateBonafideCertificateRequest(BaseModel):
    student_id: int
    academic_year: str
    purpose: str
    remarks: str | None = None
    template_id: int | None = None


class GenerateCharacterCertificateRequest(BaseModel):
    student_id: int
    conduct_assessment: str
    behavioral_remarks: str
    remarks: str | None = None
    template_id: int | None = None


class GenerateStudyCertificateRequest(BaseModel):
    student_id: int
    from_date: date
    to_date: date
    purpose: str
    remarks: str | None = None
    template_id: int | None = None


class GenerateConductCertificateRequest(BaseModel):
    student_id: int
    conduct_rating: str
    remarks: str | None = None
    template_id: int | None = None


class GenerateMigrationCertificateRequest(BaseModel):
    student_id: int
    migration_to: str
    migration_reason: str
    last_exam_passed: str | None = None
    remarks: str | None = None
    template_id: int | None = None


class GenerateFeeCertificateRequest(BaseModel):
    student_id: int
    academic_year: str
    total_fees_paid: float
    remarks: str | None = None
    template_id: int | None = None


class GenerateNoDuesCertificateRequest(BaseModel):
    student_id: int
    remarks: str | None = None
    template_id: int | None = None


class IssueCertificateRequest(BaseModel):
    certificate_type: str
    data: dict[str, Any]
    template_id: int | None = None
    remarks: str | None = None


class IssuedCertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    student_id: int
    certificate_type: str
    template_id: int | None
    serial_number: str
    issue_date: date
    data_snapshot: dict[str, Any]
    pdf_url: str | None
    issued_by: int | None
    remarks: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class RevokeCertificateRequest(BaseModel):
    reason: str | None = None


# ID Card Template Schemas
class IDCardTemplateBase(BaseModel):
    template_name: str = Field(..., max_length=200)
    layout_config: dict[str, Any]
    color_scheme: str | None = Field(None, max_length=100)
    logo_position: str | None = Field(None, max_length=50)
    fields_to_show: dict[str, Any] | None = None
    orientation: str = "portrait"
    is_default: bool = False


class IDCardTemplateCreate(IDCardTemplateBase):
    institution_id: int


class IDCardTemplateUpdate(BaseModel):
    template_name: str | None = Field(None, max_length=200)
    layout_config: dict[str, Any] | None = None
    color_scheme: str | None = Field(None, max_length=100)
    logo_position: str | None = Field(None, max_length=50)
    fields_to_show: dict[str, Any] | None = None
    orientation: str | None = None
    is_default: bool | None = None


class IDCardTemplateResponse(IDCardTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class GenerateIDCardRequest(BaseModel):
    student_id: int
    template_id: int | None = None
    valid_until: date | None = None


class GenerateBulkIDCardsRequest(BaseModel):
    section_id: int | None = None
    grade_id: int | None = None
    template_id: int | None = None
    valid_until: date | None = None


# Staff Member Schemas
class StaffMemberBase(BaseModel):
    employee_id: str = Field(..., max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    designation: str | None = Field(None, max_length=200)
    department: str = Field(..., max_length=50)
    date_of_birth: date | None = None
    gender: str | None = Field(None, max_length=20)
    address: str | None = None
    qualification: str | None = Field(None, max_length=255)
    joining_date: date | None = None
    bank_account_number: str | None = Field(None, max_length=50)
    bank_name: str | None = Field(None, max_length=200)
    ifsc_code: str | None = Field(None, max_length=20)
    pan_number: str | None = Field(None, max_length=20)
    aadhar_number: str | None = Field(None, max_length=20)
    basic_salary: Decimal | None = None
    photo_url: str | None = Field(None, max_length=500)


class StaffMemberCreate(StaffMemberBase):
    institution_id: int


class StaffMemberUpdate(BaseModel):
    employee_id: str | None = Field(None, max_length=50)
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    designation: str | None = Field(None, max_length=200)
    department: str | None = Field(None, max_length=50)
    date_of_birth: date | None = None
    gender: str | None = Field(None, max_length=20)
    address: str | None = None
    qualification: str | None = Field(None, max_length=255)
    joining_date: date | None = None
    leaving_date: date | None = None
    bank_account_number: str | None = Field(None, max_length=50)
    bank_name: str | None = Field(None, max_length=200)
    ifsc_code: str | None = Field(None, max_length=20)
    pan_number: str | None = Field(None, max_length=20)
    aadhar_number: str | None = Field(None, max_length=20)
    basic_salary: Decimal | None = None
    photo_url: str | None = Field(None, max_length=500)
    is_active: bool | None = None
    status: str | None = None


class StaffMemberResponse(StaffMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    leaving_date: date | None
    is_active: bool
    status: str
    created_at: datetime
    updated_at: datetime


# Staff Payroll Schemas
class StaffPayrollBase(BaseModel):
    staff_id: int
    month: int = Field(..., ge=1, le=12)
    year: int
    basic_salary: Decimal
    hra: Decimal = Decimal('0.00')
    da: Decimal = Decimal('0.00')
    ta: Decimal = Decimal('0.00')
    special_allowance: Decimal = Decimal('0.00')
    pf_deduction: Decimal = Decimal('0.00')
    esi_deduction: Decimal = Decimal('0.00')
    professional_tax: Decimal = Decimal('0.00')
    tds: Decimal = Decimal('0.00')
    other_deductions: Decimal = Decimal('0.00')
    gross_salary: Decimal
    net_salary: Decimal


class StaffPayrollCreate(StaffPayrollBase):
    institution_id: int


class StaffPayrollUpdate(BaseModel):
    basic_salary: Decimal | None = None
    hra: Decimal | None = None
    da: Decimal | None = None
    ta: Decimal | None = None
    special_allowance: Decimal | None = None
    pf_deduction: Decimal | None = None
    esi_deduction: Decimal | None = None
    professional_tax: Decimal | None = None
    tds: Decimal | None = None
    other_deductions: Decimal | None = None
    gross_salary: Decimal | None = None
    net_salary: Decimal | None = None
    payment_status: str | None = None
    payment_date: date | None = None
    transaction_reference: str | None = None


class StaffPayrollResponse(StaffPayrollBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    payment_status: str
    payment_date: date | None
    transaction_reference: str | None
    created_at: datetime
    updated_at: datetime


# SMS Template Schemas
class SMSTemplateBase(BaseModel):
    template_name: str = Field(..., max_length=200)
    template_type: str = Field(..., max_length=50)
    message_body: str
    is_active: bool = True


class SMSTemplateCreate(SMSTemplateBase):
    institution_id: int


class SMSTemplateUpdate(BaseModel):
    template_name: str | None = Field(None, max_length=200)
    template_type: str | None = Field(None, max_length=50)
    message_body: str | None = None
    is_active: bool | None = None


class SMSTemplateResponse(SMSTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


# Enquiry Record Schemas
class EnquiryRecordBase(BaseModel):
    enquiry_date: date
    student_name: str = Field(..., max_length=200)
    parent_name: str = Field(..., max_length=200)
    parent_phone: str = Field(..., max_length=20)
    parent_email: str | None = Field(None, max_length=255)
    enquiry_for_grade: str | None = Field(None, max_length=50)
    source: str = Field(..., max_length=50)
    notes: str | None = None
    assigned_to: int | None = None
    follow_up_date: date | None = None


class EnquiryRecordCreate(EnquiryRecordBase):
    institution_id: int


class EnquiryRecordUpdate(BaseModel):
    enquiry_date: date | None = None
    student_name: str | None = Field(None, max_length=200)
    parent_name: str | None = Field(None, max_length=200)
    parent_phone: str | None = Field(None, max_length=20)
    parent_email: str | None = Field(None, max_length=255)
    enquiry_for_grade: str | None = Field(None, max_length=50)
    source: str | None = Field(None, max_length=50)
    status: str | None = None
    notes: str | None = None
    assigned_to: int | None = None
    follow_up_date: date | None = None


class EnquiryRecordResponse(EnquiryRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    status: str
    sms_sent_count: int
    last_sms_sent_at: datetime | None
    created_at: datetime
    updated_at: datetime


# Bulk Operations
class BulkStaffImportRow(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    designation: str | None = None
    department: str
    date_of_birth: str | None = None
    gender: str | None = None
    qualification: str | None = None
    joining_date: str | None = None
    basic_salary: str | None = None


class StaffFilterParams(BaseModel):
    department: str | None = None
    status: str | None = None
    is_active: bool | None = None
    search: str | None = None


class EnquiryFilterParams(BaseModel):
    source: str | None = None
    status: str | None = None
    assigned_to: int | None = None
    from_date: date | None = None
    to_date: date | None = None
    search: str | None = None


class SendSMSRequest(BaseModel):
    template_id: int
    recipient_type: str  # 'student', 'parent', 'enquiry'
    recipient_ids: list[int]
    variables: dict[str, str] | None = None


class PayrollGenerateRequest(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int
    staff_ids: list[int] | None = None


class CertificateStatistics(BaseModel):
    total_issued: int
    issued_by_type: dict[str, int]
    recent_certificates: list[IssuedCertificateResponse]


class StaffStatistics(BaseModel):
    total_staff: int
    active_staff: int
    inactive_staff: int
    staff_by_department: dict[str, int]
    staff_by_status: dict[str, int]


class EnquiryStatistics(BaseModel):
    total_enquiries: int
    enquiries_by_status: dict[str, int]
    enquiries_by_source: dict[str, int]
    conversion_rate: float
