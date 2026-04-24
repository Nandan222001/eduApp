from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.school_admin import (
    CertificateTemplateCreate,
    CertificateTemplateResponse,
    EnquiryRecordCreate,
    EnquiryRecordResponse,
    EnquiryRecordUpdate,
    EnquiryStatistics,
    GenerateBulkIDCardsRequest,
    IssueCertificateRequest,
    IssuedCertificateResponse,
    PayrollGenerateRequest,
    SendSMSRequest,
    SMSTemplateCreate,
    SMSTemplateResponse,
    SMSTemplateUpdate,
    StaffMemberCreate,
    StaffMemberResponse,
    StaffMemberUpdate,
    StaffPayrollResponse,
    StaffPayrollUpdate,
    StaffStatistics,
)
from src.schemas.student import StudentPromotionRequest
from src.services.school_admin_service import SchoolAdminService

router = APIRouter()


# Certificate Endpoints
@router.post("/certificates/issue", response_model=IssuedCertificateResponse, status_code=status.HTTP_201_CREATED)
async def issue_certificate(
    data: IssueCertificateRequest,
    student_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    certificate = service.issue_certificate(
        institution_id=current_user.institution_id,
        student_id=student_id,
        certificate_type=data.certificate_type,
        template_id=data.template_id,
        remarks=data.remarks,
        data=data.data if data.data else {},
        issued_by=current_user.id
    )
    return certificate


@router.get("/certificates/templates", response_model=list)
async def list_certificate_templates(
    certificate_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    templates = service.list_certificate_templates(
        institution_id=current_user.institution_id,
        certificate_type=certificate_type
    )
    return templates


@router.post("/certificates/templates", response_model=CertificateTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_certificate_template(
    data: CertificateTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create template for this institution"
        )

    service = SchoolAdminService(db)
    template = service.create_certificate_template(data)
    return template


@router.get("/certificates/{id}/download")
async def download_certificate(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    certificate = service.get_certificate(id)

    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )

    if certificate.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this certificate"
        )

    pdf_stream = service.generate_certificate_pdf(certificate)

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=certificate_{certificate.serial_number}.pdf"
        }
    )


@router.get("/certificates/student/{student_id}", response_model=list)
async def list_student_certificates(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    certificates = service.list_student_certificates(
        institution_id=current_user.institution_id,
        student_id=student_id
    )
    return certificates


@router.post("/certificates/bulk-id-cards", response_model=dict)
async def generate_bulk_id_cards(
    data: GenerateBulkIDCardsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.generate_bulk_id_cards(
        institution_id=current_user.institution_id,
        section_id=data.section_id,
        grade_id=data.grade_id,
        template_id=data.template_id,
        valid_until=data.valid_until
    )
    return result


# Staff Endpoints
@router.get("/staff", response_model=dict)
async def list_staff(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    staff, total = service.list_staff(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        department=department,
        status=status,
        is_active=is_active,
        search=search
    )
    return {
        "items": staff,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/staff/statistics", response_model=StaffStatistics)
async def get_staff_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    return service.get_staff_statistics(current_user.institution_id)


@router.get("/staff/{id}", response_model=StaffMemberResponse)
async def get_staff_member(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    staff = service.get_staff_member(id)

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    if staff.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this staff member"
        )

    return staff


@router.post("/staff", response_model=StaffMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_staff_member(
    data: StaffMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create staff for this institution"
        )

    service = SchoolAdminService(db)
    staff = service.create_staff_member(data)
    return staff


@router.put("/staff/{id}", response_model=StaffMemberResponse)
async def update_staff_member(
    id: int,
    data: StaffMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    staff = service.get_staff_member(id)

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    if staff.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this staff member"
        )

    updated_staff = service.update_staff_member(id, data)
    return updated_staff


@router.delete("/staff/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff_member(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    staff = service.get_staff_member(id)

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    if staff.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this staff member"
        )

    service.delete_staff_member(id)
    return None


@router.post("/staff/bulk-import", response_model=dict)
async def bulk_import_staff(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = await service.bulk_import_staff(current_user.institution_id, file)
    return result


# Payroll Endpoints
@router.get("/staff/payroll", response_model=dict)
async def list_payroll(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    payrolls, total = service.list_payroll(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        month=month,
        year=year
    )
    return {
        "items": payrolls,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/staff/payroll/generate", response_model=dict)
async def generate_monthly_payroll(
    data: PayrollGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.generate_monthly_payroll(
        institution_id=current_user.institution_id,
        month=data.month,
        year=data.year,
        staff_ids=data.staff_ids
    )
    return result


@router.put("/staff/payroll/{id}", response_model=StaffPayrollResponse)
async def update_payroll(
    id: int,
    data: StaffPayrollUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    payroll = service.get_payroll(id)

    if not payroll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll record not found"
        )

    if payroll.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this payroll"
        )

    updated_payroll = service.update_payroll(id, data)
    return updated_payroll


@router.post("/staff/payroll/bulk-process", response_model=dict)
async def bulk_process_payroll(
    payroll_ids: list[int],
    payment_date: date,
    transaction_reference: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.bulk_process_payroll(
        institution_id=current_user.institution_id,
        payroll_ids=payroll_ids,
        payment_date=payment_date,
        transaction_reference=transaction_reference
    )
    return result


@router.get("/staff/payroll/report", response_model=dict)
async def get_payroll_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    report = service.get_payroll_report(
        institution_id=current_user.institution_id,
        month=month,
        year=year
    )
    return report


# SMS Endpoints
@router.get("/sms/templates", response_model=list)
async def list_sms_templates(
    template_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    templates = service.list_sms_templates(
        institution_id=current_user.institution_id,
        template_type=template_type
    )
    return templates


@router.post("/sms/templates", response_model=SMSTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_sms_template(
    data: SMSTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create template for this institution"
        )

    service = SchoolAdminService(db)
    template = service.create_sms_template(data)
    return template


@router.get("/sms/templates/{id}", response_model=SMSTemplateResponse)
async def get_sms_template(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    template = service.get_sms_template(id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMS template not found"
        )

    if template.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this template"
        )

    return template


@router.put("/sms/templates/{id}", response_model=SMSTemplateResponse)
async def update_sms_template(
    id: int,
    data: SMSTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    template = service.get_sms_template(id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMS template not found"
        )

    if template.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this template"
        )

    updated_template = service.update_sms_template(id, data)
    return updated_template


@router.delete("/sms/templates/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sms_template(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    template = service.get_sms_template(id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMS template not found"
        )

    if template.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this template"
        )

    service.delete_sms_template(id)
    return None


@router.post("/sms/send", response_model=dict)
async def send_sms(
    data: SendSMSRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.send_sms(
        institution_id=current_user.institution_id,
        template_id=data.template_id,
        recipient_type=data.recipient_type,
        recipient_ids=data.recipient_ids,
        variables=data.variables
    )
    return result


@router.post("/sms/send-bulk", response_model=dict)
async def send_bulk_sms(
    template_id: int,
    grade_id: Optional[int] = None,
    section_id: Optional[int] = None,
    variables: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.send_bulk_sms(
        institution_id=current_user.institution_id,
        template_id=template_id,
        grade_id=grade_id,
        section_id=section_id,
        variables=variables
    )
    return result


# Enquiry Endpoints
@router.get("/enquiries", response_model=dict)
async def list_enquiries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    enquiries, total = service.list_enquiries(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        source=source,
        status=status,
        assigned_to=assigned_to,
        from_date=from_date,
        to_date=to_date,
        search=search
    )
    return {
        "items": enquiries,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/enquiries/statistics", response_model=EnquiryStatistics)
async def get_enquiry_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    return service.get_enquiry_statistics(current_user.institution_id)


@router.get("/enquiries/{id}", response_model=EnquiryRecordResponse)
async def get_enquiry(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    enquiry = service.get_enquiry(id)

    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found"
        )

    if enquiry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this enquiry"
        )

    return enquiry


@router.post("/enquiries", response_model=EnquiryRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_enquiry(
    data: EnquiryRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create enquiry for this institution"
        )

    service = SchoolAdminService(db)
    enquiry = service.create_enquiry(data)
    return enquiry


@router.put("/enquiries/{id}", response_model=EnquiryRecordResponse)
async def update_enquiry(
    id: int,
    data: EnquiryRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    enquiry = service.get_enquiry(id)

    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found"
        )

    if enquiry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this enquiry"
        )

    updated_enquiry = service.update_enquiry(id, data)
    return updated_enquiry


@router.delete("/enquiries/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enquiry(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    enquiry = service.get_enquiry(id)

    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found"
        )

    if enquiry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this enquiry"
        )

    service.delete_enquiry(id)
    return None


@router.put("/enquiries/{id}/status", response_model=EnquiryRecordResponse)
async def update_enquiry_status(
    id: int,
    new_status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    enquiry = service.get_enquiry(id)

    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found"
        )

    if enquiry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this enquiry"
        )

    updated_enquiry = service.update_enquiry_status(id, new_status)
    return updated_enquiry


@router.post("/enquiries/{id}/send-sms", response_model=dict)
async def send_enquiry_follow_up_sms(
    id: int,
    template_id: int,
    variables: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    enquiry = service.get_enquiry(id)

    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found"
        )

    if enquiry.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this enquiry"
        )

    result = service.send_enquiry_follow_up_sms(id, template_id, variables)
    return result


# Student Promotion Enhancement
@router.put("/students/promote", response_model=dict)
async def promote_students_with_criteria(
    data: StudentPromotionRequest,
    minimum_attendance_percentage: Optional[float] = Query(None, ge=0, le=100),
    minimum_pass_percentage: Optional[float] = Query(None, ge=0, le=100),
    subject_wise_pass_required: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.promote_students_with_criteria(
        institution_id=current_user.institution_id,
        student_ids=data.student_ids,
        target_grade_id=data.target_grade_id,
        target_section_id=data.target_section_id,
        effective_date=data.effective_date,
        minimum_attendance_percentage=minimum_attendance_percentage,
        minimum_pass_percentage=minimum_pass_percentage,
        subject_wise_pass_required=subject_wise_pass_required
    )
    return result
