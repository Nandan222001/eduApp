import csv
import io
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from fastapi import HTTPException, UploadFile, status
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from src.models.academic import Section
from src.models.attendance import AttendanceSummary
from src.models.examination import ExamResult
from src.models.school_admin import (
    CertificateTemplate,
    EnquiryRecord,
    EnquiryStatus,
    IssuedCertificate,
    IssuedCertificateStatus,
    PayrollPaymentStatus,
    SMSTemplate,
    StaffMember,
    StaffPayroll,
    StaffStatus,
)
from src.models.student import Student
from src.schemas.school_admin import (
    CertificateTemplateCreate,
    EnquiryRecordCreate,
    EnquiryRecordUpdate,
    EnquiryStatistics,
    SMSTemplateCreate,
    SMSTemplateUpdate,
    StaffMemberCreate,
    StaffMemberUpdate,
    StaffPayrollUpdate,
    StaffStatistics,
)


class SchoolAdminService:
    def __init__(self, db: Session):
        self.db = db

    def generate_serial_number(self, institution_id: int, certificate_type: str) -> str:
        count = self.db.query(func.count(IssuedCertificate.id)).filter(
            IssuedCertificate.institution_id == institution_id,
            IssuedCertificate.certificate_type == certificate_type
        ).scalar() or 0

        year = datetime.now().year
        type_code = ''.join([word[0].upper() for word in certificate_type.split('_')])
        return f"{type_code}/{year}/{count + 1:05d}"

    def issue_certificate(
        self,
        institution_id: int,
        student_id: int,
        certificate_type: str,
        template_id: Optional[int],
        remarks: Optional[str],
        data: dict[str, Any],
        issued_by: int
    ) -> IssuedCertificate:
        student = self.db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        if template_id:
            template = self.db.query(CertificateTemplate).filter(
                CertificateTemplate.id == template_id,
                CertificateTemplate.institution_id == institution_id
            ).first()

            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Certificate template not found"
                )

        serial_number = self.generate_serial_number(institution_id, certificate_type)

        certificate = IssuedCertificate(
            institution_id=institution_id,
            student_id=student_id,
            certificate_type=certificate_type,
            template_id=template_id,
            serial_number=serial_number,
            issue_date=date.today(),
            data_snapshot=data,
            issued_by=issued_by,
            remarks=remarks,
            status=IssuedCertificateStatus.ISSUED.value
        )

        self.db.add(certificate)
        self.db.commit()
        self.db.refresh(certificate)
        return certificate

    def get_certificate(self, certificate_id: int) -> Optional[IssuedCertificate]:
        return self.db.query(IssuedCertificate).filter(
            IssuedCertificate.id == certificate_id
        ).first()

    def list_certificate_templates(
        self,
        institution_id: int,
        certificate_type: Optional[str] = None
    ) -> list[CertificateTemplate]:
        query = self.db.query(CertificateTemplate).filter(
            CertificateTemplate.institution_id == institution_id,
            CertificateTemplate.is_active
        )

        if certificate_type:
            query = query.filter(CertificateTemplate.certificate_type == certificate_type)

        return query.order_by(CertificateTemplate.is_default.desc(), CertificateTemplate.template_name).all()

    def create_certificate_template(self, data: CertificateTemplateCreate) -> CertificateTemplate:
        if data.is_default:
            self.db.query(CertificateTemplate).filter(
                CertificateTemplate.institution_id == data.institution_id,
                CertificateTemplate.certificate_type == data.certificate_type,
                CertificateTemplate.is_default
            ).update({"is_default": False})

        template = CertificateTemplate(**data.model_dump())
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def generate_certificate_pdf(self, certificate: IssuedCertificate) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )

        elements.append(Paragraph(f"{certificate.certificate_type.replace('_', ' ').upper()}", title_style))
        elements.append(Spacer(1, 0.5*inch))
        elements.append(Paragraph(f"Certificate No: {certificate.serial_number}", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))

        for key, value in certificate.data_snapshot.items():
            elements.append(Paragraph(f"<b>{key.replace('_', ' ').title()}:</b> {value}", styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))

        elements.append(Spacer(1, 0.5*inch))
        elements.append(Paragraph(f"Issue Date: {certificate.issue_date.strftime('%d-%m-%Y')}", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)
        return buffer

    def list_student_certificates(
        self,
        institution_id: int,
        student_id: int
    ) -> list[IssuedCertificate]:
        return self.db.query(IssuedCertificate).filter(
            IssuedCertificate.institution_id == institution_id,
            IssuedCertificate.student_id == student_id
        ).order_by(IssuedCertificate.issue_date.desc()).all()

    def list_certificates(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 50,
        certificate_type: Optional[str] = None,
        student_id: Optional[int] = None,
        is_revoked: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[IssuedCertificate], int]:
        query = self.db.query(IssuedCertificate).filter(
            IssuedCertificate.institution_id == institution_id
        )
        if certificate_type:
            query = query.filter(IssuedCertificate.certificate_type == certificate_type)
        if student_id:
            query = query.filter(IssuedCertificate.student_id == student_id)
        if is_revoked is not None:
            target_status = IssuedCertificateStatus.REVOKED.value if is_revoked else IssuedCertificateStatus.ISSUED.value
            query = query.filter(IssuedCertificate.status == target_status)
        if search:
            query = query.filter(IssuedCertificate.serial_number.ilike(f"%{search}%"))
        total = query.count()
        certs = query.order_by(IssuedCertificate.issue_date.desc()).offset(skip).limit(limit).all()
        return certs, total

    def generate_bulk_id_cards(
        self,
        institution_id: int,
        section_id: Optional[int],
        grade_id: Optional[int],
        template_id: Optional[int],
        valid_until: Optional[date]
    ) -> dict[str, Any]:
        query = self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.is_active
        )

        if section_id:
            query = query.filter(Student.section_id == section_id)
        elif grade_id:
            query = query.join(Section).filter(Section.grade_id == grade_id)

        students = query.all()

        if not valid_until:
            valid_until = date(date.today().year + 1, 12, 31)

        return {
            "total_cards": len(students),
            "students": [{"id": s.id, "name": f"{s.first_name} {s.last_name}"} for s in students],
            "valid_until": valid_until,
            "message": f"ID cards generated for {len(students)} students"
        }

    def list_staff(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        department: Optional[str] = None,
        status: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> tuple[list[StaffMember], int]:
        query = self.db.query(StaffMember).filter(
            StaffMember.institution_id == institution_id
        )

        if department:
            query = query.filter(StaffMember.department == department)

        if status:
            query = query.filter(StaffMember.status == status)

        if is_active is not None:
            query = query.filter(StaffMember.is_active == is_active)

        if search:
            search_filter = or_(
                StaffMember.first_name.ilike(f"%{search}%"),
                StaffMember.last_name.ilike(f"%{search}%"),
                StaffMember.email.ilike(f"%{search}%"),
                StaffMember.employee_id.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        total = query.count()
        staff = query.order_by(StaffMember.first_name).offset(skip).limit(limit).all()

        return staff, total

    def get_staff_member(self, staff_id: int) -> Optional[StaffMember]:
        return self.db.query(StaffMember).filter(StaffMember.id == staff_id).first()

    def create_staff_member(self, data: StaffMemberCreate) -> StaffMember:
        existing = self.db.query(StaffMember).filter(
            StaffMember.institution_id == data.institution_id,
            StaffMember.employee_id == data.employee_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Staff member with this employee ID already exists"
            )

        staff = StaffMember(**data.model_dump())
        self.db.add(staff)
        self.db.commit()
        self.db.refresh(staff)
        return staff

    def update_staff_member(self, staff_id: int, data: StaffMemberUpdate) -> StaffMember:
        staff = self.get_staff_member(staff_id)

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(staff, key, value)

        self.db.commit()
        self.db.refresh(staff)
        return staff

    def delete_staff_member(self, staff_id: int):
        staff = self.get_staff_member(staff_id)

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found"
            )

        self.db.delete(staff)
        self.db.commit()

    async def bulk_import_staff(self, institution_id: int, file: UploadFile) -> dict[str, Any]:
        content = await file.read()
        content_str = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content_str))

        success_count = 0
        failed_count = 0
        errors = []

        for row_num, row in enumerate(csv_reader, start=1):
            try:
                staff_data = StaffMemberCreate(
                    institution_id=institution_id,
                    employee_id=row.get('employee_id', ''),
                    first_name=row.get('first_name', ''),
                    last_name=row.get('last_name', ''),
                    email=row.get('email') if row.get('email') else None,
                    phone=row.get('phone') if row.get('phone') else None,
                    designation=row.get('designation') if row.get('designation') else None,
                    department=row.get('department', ''),
                    date_of_birth=datetime.strptime(row['date_of_birth'], '%Y-%m-%d').date() if row.get('date_of_birth') else None,
                    gender=row.get('gender') if row.get('gender') else None,
                    qualification=row.get('qualification') if row.get('qualification') else None,
                    joining_date=datetime.strptime(row['joining_date'], '%Y-%m-%d').date() if row.get('joining_date') else None,
                    basic_salary=Decimal(row['basic_salary']) if row.get('basic_salary') else None,
                )

                self.create_staff_member(staff_data)
                success_count += 1
            except Exception as e:
                failed_count += 1
                errors.append({"row": row_num, "error": str(e)})

        return {
            "total": success_count + failed_count,
            "success": success_count,
            "failed": failed_count,
            "errors": errors
        }

    def get_staff_statistics(self, institution_id: int) -> StaffStatistics:
        total_staff = self.db.query(func.count(StaffMember.id)).filter(
            StaffMember.institution_id == institution_id
        ).scalar() or 0

        active_staff = self.db.query(func.count(StaffMember.id)).filter(
            StaffMember.institution_id == institution_id,
            StaffMember.is_active
        ).scalar() or 0

        inactive_staff = total_staff - active_staff

        staff_by_department = {}
        dept_results = self.db.query(
            StaffMember.department,
            func.count(StaffMember.id)
        ).filter(
            StaffMember.institution_id == institution_id
        ).group_by(StaffMember.department).all()

        for dept, count in dept_results:
            staff_by_department[dept] = count

        staff_by_status = {}
        status_results = self.db.query(
            StaffMember.status,
            func.count(StaffMember.id)
        ).filter(
            StaffMember.institution_id == institution_id
        ).group_by(StaffMember.status).all()

        for stat, count in status_results:
            staff_by_status[stat] = count

        return StaffStatistics(
            total_staff=total_staff,
            active_staff=active_staff,
            inactive_staff=inactive_staff,
            staff_by_department=staff_by_department,
            staff_by_status=staff_by_status
        )

    def list_payroll(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        month: Optional[int] = None,
        year: Optional[int] = None
    ) -> tuple[list[StaffPayroll], int]:
        query = self.db.query(StaffPayroll).filter(
            StaffPayroll.institution_id == institution_id
        )

        if month:
            query = query.filter(StaffPayroll.month == month)

        if year:
            query = query.filter(StaffPayroll.year == year)

        total = query.count()
        payrolls = query.order_by(
            StaffPayroll.year.desc(),
            StaffPayroll.month.desc()
        ).offset(skip).limit(limit).all()

        return payrolls, total

    def get_payroll(self, payroll_id: int) -> Optional[StaffPayroll]:
        return self.db.query(StaffPayroll).filter(StaffPayroll.id == payroll_id).first()

    def generate_monthly_payroll(
        self,
        institution_id: int,
        month: int,
        year: int,
        staff_ids: Optional[list[int]] = None
    ) -> dict[str, Any]:
        query = self.db.query(StaffMember).filter(
            StaffMember.institution_id == institution_id,
            StaffMember.is_active ,
            StaffMember.status == StaffStatus.ACTIVE.value
        )

        if staff_ids:
            query = query.filter(StaffMember.id.in_(staff_ids))

        staff_members = query.all()

        success_count = 0
        failed_count = 0
        errors = []

        for staff in staff_members:
            try:
                existing = self.db.query(StaffPayroll).filter(
                    StaffPayroll.staff_id == staff.id,
                    StaffPayroll.month == month,
                    StaffPayroll.year == year
                ).first()

                if existing:
                    failed_count += 1
                    errors.append({
                        "staff_id": staff.id,
                        "error": "Payroll already exists for this month"
                    })
                    continue

                basic_salary = staff.basic_salary or Decimal('0.00')
                hra = basic_salary * Decimal('0.10')
                da = basic_salary * Decimal('0.05')
                ta = Decimal('1000.00')

                gross_salary = basic_salary + hra + da + ta

                pf_deduction = basic_salary * Decimal('0.12')
                professional_tax = Decimal('200.00')

                total_deductions = pf_deduction + professional_tax
                net_salary = gross_salary - total_deductions

                payroll = StaffPayroll(
                    institution_id=institution_id,
                    staff_id=staff.id,
                    month=month,
                    year=year,
                    basic_salary=basic_salary,
                    hra=hra,
                    da=da,
                    ta=ta,
                    special_allowance=Decimal('0.00'),
                    pf_deduction=pf_deduction,
                    esi_deduction=Decimal('0.00'),
                    professional_tax=professional_tax,
                    tds=Decimal('0.00'),
                    other_deductions=Decimal('0.00'),
                    gross_salary=gross_salary,
                    net_salary=net_salary,
                    payment_status=PayrollPaymentStatus.PENDING.value
                )

                self.db.add(payroll)
                success_count += 1
            except Exception as e:
                failed_count += 1
                errors.append({"staff_id": staff.id, "error": str(e)})

        self.db.commit()

        return {
            "total": success_count + failed_count,
            "success": success_count,
            "failed": failed_count,
            "errors": errors
        }

    def update_payroll(self, payroll_id: int, data: StaffPayrollUpdate) -> StaffPayroll:
        payroll = self.get_payroll(payroll_id)

        if not payroll:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payroll record not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(payroll, key, value)

        self.db.commit()
        self.db.refresh(payroll)
        return payroll

    def bulk_process_payroll(
        self,
        institution_id: int,
        payroll_ids: list[int],
        payment_date: date,
        transaction_reference: Optional[str] = None
    ) -> dict[str, Any]:
        payrolls = self.db.query(StaffPayroll).filter(
            StaffPayroll.institution_id == institution_id,
            StaffPayroll.id.in_(payroll_ids)
        ).all()

        success_count = 0
        for payroll in payrolls:
            payroll.payment_status = PayrollPaymentStatus.PAID.value
            payroll.payment_date = payment_date
            payroll.transaction_reference = transaction_reference
            success_count += 1

        self.db.commit()

        return {
            "total": len(payroll_ids),
            "processed": success_count,
            "message": f"Successfully processed {success_count} payroll records"
        }

    def get_payroll_report(
        self,
        institution_id: int,
        month: int,
        year: int
    ) -> dict[str, Any]:
        payrolls = self.db.query(StaffPayroll).filter(
            StaffPayroll.institution_id == institution_id,
            StaffPayroll.month == month,
            StaffPayroll.year == year
        ).all()

        total_basic = sum(p.basic_salary for p in payrolls)
        total_gross = sum(p.gross_salary for p in payrolls)
        total_deductions = sum(
            p.pf_deduction + p.esi_deduction + p.professional_tax + p.tds + p.other_deductions
            for p in payrolls
        )
        total_net = sum(p.net_salary for p in payrolls)

        paid_count = sum(1 for p in payrolls if p.payment_status == PayrollPaymentStatus.PAID.value)
        pending_count = sum(1 for p in payrolls if p.payment_status == PayrollPaymentStatus.PENDING.value)

        return {
            "month": month,
            "year": year,
            "total_employees": len(payrolls),
            "total_basic_salary": float(total_basic),
            "total_gross_salary": float(total_gross),
            "total_deductions": float(total_deductions),
            "total_net_salary": float(total_net),
            "paid_count": paid_count,
            "pending_count": pending_count,
            "payrolls": payrolls
        }

    def list_sms_templates(
        self,
        institution_id: int,
        template_type: Optional[str] = None
    ) -> list[SMSTemplate]:
        query = self.db.query(SMSTemplate).filter(
            SMSTemplate.institution_id == institution_id
        )

        if template_type:
            query = query.filter(SMSTemplate.template_type == template_type)

        return query.order_by(SMSTemplate.template_name).all()

    def get_sms_template(self, template_id: int) -> Optional[SMSTemplate]:
        return self.db.query(SMSTemplate).filter(SMSTemplate.id == template_id).first()

    def create_sms_template(self, data: SMSTemplateCreate) -> SMSTemplate:
        template = SMSTemplate(**data.model_dump())
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update_sms_template(self, template_id: int, data: SMSTemplateUpdate) -> SMSTemplate:
        template = self.get_sms_template(template_id)

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SMS template not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(template, key, value)

        self.db.commit()
        self.db.refresh(template)
        return template

    def delete_sms_template(self, template_id: int):
        template = self.get_sms_template(template_id)

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SMS template not found"
            )

        self.db.delete(template)
        self.db.commit()

    def send_sms(
        self,
        institution_id: int,
        template_id: int,
        recipient_type: str,
        recipient_ids: list[int],
        variables: Optional[dict[str, str]] = None
    ) -> dict[str, Any]:
        template = self.get_sms_template(template_id)

        if not template or template.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SMS template not found"
            )

        message = template.message_body
        if variables:
            for key, value in variables.items():
                message = message.replace(f"{{{{{key}}}}}", value)

        sent_count = len(recipient_ids)

        return {
            "template_id": template_id,
            "recipient_type": recipient_type,
            "sent_count": sent_count,
            "message": f"SMS sent successfully to {sent_count} recipients"
        }

    def send_bulk_sms(
        self,
        institution_id: int,
        template_id: int,
        grade_id: Optional[int] = None,
        section_id: Optional[int] = None,
        variables: Optional[dict[str, str]] = None
    ) -> dict[str, Any]:
        template = self.get_sms_template(template_id)

        if not template or template.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SMS template not found"
            )

        query = self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.is_active
        )

        if section_id:
            query = query.filter(Student.section_id == section_id)
        elif grade_id:
            query = query.join(Section).filter(Section.grade_id == grade_id)

        students = query.all()

        message = template.message_body
        if variables:
            for key, value in variables.items():
                message = message.replace(f"{{{{{key}}}}}", value)

        sent_count = len(students)

        return {
            "template_id": template_id,
            "grade_id": grade_id,
            "section_id": section_id,
            "sent_count": sent_count,
            "message": f"SMS sent successfully to parents of {sent_count} students"
        }

    def list_enquiries(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        source: Optional[str] = None,
        status: Optional[str] = None,
        assigned_to: Optional[int] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        search: Optional[str] = None
    ) -> tuple[list[EnquiryRecord], int]:
        query = self.db.query(EnquiryRecord).filter(
            EnquiryRecord.institution_id == institution_id
        )

        if source:
            query = query.filter(EnquiryRecord.source == source)

        if status:
            query = query.filter(EnquiryRecord.status == status)

        if assigned_to:
            query = query.filter(EnquiryRecord.assigned_to == assigned_to)

        if from_date:
            query = query.filter(EnquiryRecord.enquiry_date >= from_date)

        if to_date:
            query = query.filter(EnquiryRecord.enquiry_date <= to_date)

        if search:
            search_filter = or_(
                EnquiryRecord.student_name.ilike(f"%{search}%"),
                EnquiryRecord.parent_name.ilike(f"%{search}%"),
                EnquiryRecord.parent_phone.ilike(f"%{search}%"),
                EnquiryRecord.parent_email.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)

        total = query.count()
        enquiries = query.order_by(EnquiryRecord.enquiry_date.desc()).offset(skip).limit(limit).all()

        return enquiries, total

    def get_enquiry(self, enquiry_id: int) -> Optional[EnquiryRecord]:
        return self.db.query(EnquiryRecord).filter(EnquiryRecord.id == enquiry_id).first()

    def create_enquiry(self, data: EnquiryRecordCreate) -> EnquiryRecord:
        enquiry = EnquiryRecord(**data.model_dump())
        self.db.add(enquiry)
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def update_enquiry(self, enquiry_id: int, data: EnquiryRecordUpdate) -> EnquiryRecord:
        enquiry = self.get_enquiry(enquiry_id)

        if not enquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enquiry not found"
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(enquiry, key, value)

        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def delete_enquiry(self, enquiry_id: int):
        enquiry = self.get_enquiry(enquiry_id)

        if not enquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enquiry not found"
            )

        self.db.delete(enquiry)
        self.db.commit()

    def update_enquiry_status(self, enquiry_id: int, new_status: str) -> EnquiryRecord:
        enquiry = self.get_enquiry(enquiry_id)

        if not enquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enquiry not found"
            )

        enquiry.status = new_status
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def send_enquiry_follow_up_sms(
        self,
        enquiry_id: int,
        template_id: int,
        variables: Optional[dict[str, str]] = None
    ) -> dict[str, Any]:
        enquiry = self.get_enquiry(enquiry_id)

        if not enquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enquiry not found"
            )

        template = self.get_sms_template(template_id)

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SMS template not found"
            )

        message = template.message_body
        if variables:
            for key, value in variables.items():
                message = message.replace(f"{{{{{key}}}}}", value)

        enquiry.sms_sent_count += 1
        enquiry.last_sms_sent_at = datetime.utcnow()
        self.db.commit()

        return {
            "enquiry_id": enquiry_id,
            "template_id": template_id,
            "message": "Follow-up SMS sent successfully"
        }

    def get_enquiry_statistics(self, institution_id: int) -> EnquiryStatistics:
        total_enquiries = self.db.query(func.count(EnquiryRecord.id)).filter(
            EnquiryRecord.institution_id == institution_id
        ).scalar() or 0

        enquiries_by_status = {}
        status_results = self.db.query(
            EnquiryRecord.status,
            func.count(EnquiryRecord.id)
        ).filter(
            EnquiryRecord.institution_id == institution_id
        ).group_by(EnquiryRecord.status).all()

        for stat, count in status_results:
            enquiries_by_status[stat] = count

        enquiries_by_source = {}
        source_results = self.db.query(
            EnquiryRecord.source,
            func.count(EnquiryRecord.id)
        ).filter(
            EnquiryRecord.institution_id == institution_id
        ).group_by(EnquiryRecord.source).all()

        for src, count in source_results:
            enquiries_by_source[src] = count

        converted_count = enquiries_by_status.get(EnquiryStatus.CONVERTED.value, 0)
        conversion_rate = (converted_count / total_enquiries * 100) if total_enquiries > 0 else 0.0

        return EnquiryStatistics(
            total_enquiries=total_enquiries,
            enquiries_by_status=enquiries_by_status,
            enquiries_by_source=enquiries_by_source,
            conversion_rate=conversion_rate
        )

    def promote_students_with_criteria(
        self,
        institution_id: int,
        student_ids: list[int],
        target_grade_id: int,
        target_section_id: Optional[int] = None,
        effective_date: Optional[date] = None,
        minimum_attendance_percentage: Optional[float] = None,
        minimum_pass_percentage: Optional[float] = None,
        subject_wise_pass_required: Optional[bool] = None
    ) -> dict[str, Any]:
        students = self.db.query(Student).filter(
            Student.id.in_(student_ids),
            Student.institution_id == institution_id
        ).all()

        promoted_students = []
        failed_students = []
        promotion_report = []

        for student in students:
            eligible = True
            reasons = []

            if minimum_attendance_percentage is not None:
                attendance_summary = self.db.query(AttendanceSummary).filter(
                    AttendanceSummary.student_id == student.id
                ).order_by(AttendanceSummary.id.desc()).first()

                if attendance_summary:
                    attendance_pct = attendance_summary.attendance_percentage
                    if attendance_pct < minimum_attendance_percentage:
                        eligible = False
                        reasons.append(f"Attendance {attendance_pct:.1f}% < {minimum_attendance_percentage}%")
                else:
                    eligible = False
                    reasons.append("No attendance data available")

            if minimum_pass_percentage is not None:
                exam_results = self.db.query(ExamResult).filter(
                    ExamResult.student_id == student.id
                ).all()

                if exam_results:
                    avg_percentage = sum(r.percentage for r in exam_results) / len(exam_results)
                    if avg_percentage < minimum_pass_percentage:
                        eligible = False
                        reasons.append(f"Academic performance {avg_percentage:.1f}% < {minimum_pass_percentage}%")
                else:
                    eligible = False
                    reasons.append("No exam results available")

            if subject_wise_pass_required:
                exam_results = self.db.query(ExamResult).filter(
                    ExamResult.student_id == student.id
                ).all()

                if exam_results:
                    failed_subjects = [r for r in exam_results if r.percentage < 40]
                    if failed_subjects:
                        eligible = False
                        reasons.append(f"Failed in {len(failed_subjects)} subject(s)")
                else:
                    eligible = False
                    reasons.append("No exam results available")

            if eligible:
                old_section_id = student.section_id
                student.section_id = target_section_id
                promoted_students.append(student.id)

                promotion_report.append({
                    "student_id": student.id,
                    "student_name": f"{student.first_name} {student.last_name}",
                    "promoted": True,
                    "old_section_id": old_section_id,
                    "new_section_id": target_section_id,
                    "reasons": []
                })
            else:
                failed_students.append(student.id)

                promotion_report.append({
                    "student_id": student.id,
                    "student_name": f"{student.first_name} {student.last_name}",
                    "promoted": False,
                    "reasons": reasons
                })

        self.db.commit()

        return {
            "total_students": len(students),
            "promoted_count": len(promoted_students),
            "failed_count": len(failed_students),
            "promoted_students": promoted_students,
            "failed_students": failed_students,
            "promotion_report": promotion_report,
            "criteria_applied": {
                "minimum_attendance_percentage": minimum_attendance_percentage,
                "minimum_pass_percentage": minimum_pass_percentage,
                "subject_wise_pass_required": subject_wise_pass_required
            }
        }

