import json
from datetime import date, datetime
from io import BytesIO
from typing import Any

import qrcode
from barcode import Code128
from barcode.writer import ImageWriter
from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from src.models.academic import Section
from src.models.examination import Exam, ExamResult
from src.models.fee import FeePayment
from src.models.institution import Institution
from src.models.school_admin import (
    CertificateType,
    IDCardTemplate,
    IssuedCertificate,
    IssuedCertificateStatus,
)
from src.models.student import Student
from src.utils.s3_client import s3_client


class CertificateService:
    def __init__(self, db: Session):
        self.db = db

    def _get_student_with_details(self, student_id: int, institution_id: int) -> Student:
        """Fetch student with all related details"""
        student = self.db.query(Student).options(
            joinedload(Student.section).joinedload(Section.grade)
        ).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        return student

    def _get_institution_settings(self, institution_id: int) -> dict[str, Any]:
        """Fetch institution with settings"""
        institution = self.db.query(Institution).filter(
            Institution.id == institution_id
        ).first()

        if not institution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution not found"
            )

        settings = {}
        if institution.settings:
            try:
                settings = json.loads(institution.settings) if isinstance(institution.settings, str) else institution.settings
            except (json.JSONDecodeError, TypeError):
                settings = {}

        return {
            'id': institution.id,
            'name': institution.name,
            'logo_url': institution.logo_url,
            'address': settings.get('address', ''),
            'phone': settings.get('phone', ''),
            'email': settings.get('email', ''),
            'website': settings.get('website', ''),
            'affiliation_number': settings.get('affiliation_number', ''),
            'affiliation_board': settings.get('affiliation_board', ''),
            'principal_name': settings.get('principal_name', ''),
            'principal_signature': settings.get('principal_signature', ''),
        }

    def _generate_serial_number(self, institution_id: int, cert_type: str) -> str:
        """Generate unique serial number for certificate"""
        year = datetime.now().year
        count = self.db.query(func.count(IssuedCertificate.id)).filter(
            IssuedCertificate.institution_id == institution_id,
            IssuedCertificate.certificate_type == cert_type,
            func.year(IssuedCertificate.issue_date) == year
        ).scalar() or 0

        prefix_map = {
            CertificateType.TRANSFER_CERTIFICATE.value: 'TC',
            CertificateType.LEAVING_CERTIFICATE.value: 'LC',
            CertificateType.BONAFIDE.value: 'BC',
            CertificateType.CHARACTER_CERTIFICATE.value: 'CC',
            CertificateType.STUDY_CERTIFICATE.value: 'SC',
            CertificateType.CONDUCT_CERTIFICATE.value: 'CDC',
            CertificateType.MIGRATION_CERTIFICATE.value: 'MC',
            CertificateType.FEE_CERTIFICATE.value: 'FC',
            CertificateType.NO_DUES_CERTIFICATE.value: 'NDC',
        }

        prefix = prefix_map.get(cert_type, 'CERT')
        return f"{prefix}/{year}/{count + 1:05d}"

    def _get_fee_status(self, student_id: int, institution_id: int) -> str:
        """Get fee payment status for student"""
        current_year = datetime.now().year

        total_fees = self.db.query(func.sum(FeePayment.total_amount)).filter(
            FeePayment.student_id == student_id,
            FeePayment.institution_id == institution_id,
            func.year(FeePayment.payment_date) == current_year
        ).scalar() or 0

        if total_fees > 0:
            return "Paid"

        return "Pending"

    def _get_exam_passed(self, student_id: int) -> str | None:
        """Get last exam passed by student"""
        last_result = self.db.query(ExamResult).join(
            Exam, ExamResult.exam_id == Exam.id
        ).filter(
            ExamResult.student_id == student_id,
            ExamResult.is_pass is True
        ).order_by(Exam.start_date.desc()).first()

        if last_result and last_result.exam:
            return last_result.exam.name
        return None

    def _render_certificate_pdf(
        self,
        certificate_data: dict[str, Any],
        institution: dict[str, Any],
        template_config: dict[str, Any] | None = None
    ) -> bytes:
        """Render certificate PDF using ReportLab"""
        buffer = BytesIO()

        page_size = A4
        doc = SimpleDocTemplate(
            buffer,
            pagesize=page_size,
            rightMargin=30 * mm,
            leftMargin=30 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm
        )

        elements = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )

        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#666666'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica'
        )

        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#333333'),
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        )

        field_style = ParagraphStyle(
            'FieldStyle',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#000000'),
            spaceAfter=6,
            alignment=TA_LEFT,
            fontName='Helvetica'
        )

        # Institution header
        elements.append(Paragraph(institution['name'], title_style))

        if institution.get('address'):
            elements.append(Paragraph(institution['address'], subtitle_style))

        if institution.get('affiliation_board') and institution.get('affiliation_number'):
            affiliation_text = f"{institution['affiliation_board']} - Affiliation No: {institution['affiliation_number']}"
            elements.append(Paragraph(affiliation_text, subtitle_style))

        elements.append(Spacer(1, 15))

        # Certificate title
        cert_title = certificate_data.get('title', 'Certificate')
        elements.append(Paragraph(cert_title, title_style))
        elements.append(Spacer(1, 10))

        # Serial number and date
        serial_para = Paragraph(
            f"Serial No: <b>{certificate_data.get('serial_number', 'N/A')}</b>",
            field_style
        )
        date_para = Paragraph(
            f"Date: <b>{certificate_data.get('issue_date', date.today().strftime('%d-%b-%Y'))}</b>",
            field_style
        )

        header_table = Table([[serial_para, date_para]], colWidths=[3*inch, 3*inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 15))

        # Certificate content
        if certificate_data.get('content'):
            elements.append(Paragraph(certificate_data['content'], body_style))
            elements.append(Spacer(1, 15))

        # Fields table
        if certificate_data.get('fields'):
            field_data = []
            for field in certificate_data['fields']:
                field_data.append([
                    Paragraph(f"<b>{field['label']}:</b>", field_style),
                    Paragraph(str(field['value']), field_style)
                ])

            fields_table = Table(field_data, colWidths=[2*inch, 4*inch])
            fields_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(fields_table)
            elements.append(Spacer(1, 20))

        # Remarks
        if certificate_data.get('remarks'):
            elements.append(Paragraph(f"<b>Remarks:</b> {certificate_data['remarks']}", body_style))
            elements.append(Spacer(1, 20))

        # Signature section
        signature_data = [
            [Paragraph("", field_style), Paragraph("", field_style)],
            [Paragraph("_________________", field_style), Paragraph("_________________", field_style)],
            [Paragraph("Authorized Signatory", field_style), Paragraph("Principal", field_style)]
        ]

        signature_table = Table(signature_data, colWidths=[3*inch, 3*inch])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ]))
        elements.append(signature_table)

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

    def generate_transfer_certificate(
        self,
        student_id: int,
        institution_id: int,
        leaving_date: date,
        reason_for_leaving: str,
        conduct: str = "Good",
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Transfer Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        exam_passed = self._get_exam_passed(student_id) or "N/A"
        fee_status = self._get_fee_status(student_id, institution_id)

        certificate_data = {
            'title': 'TRANSFER CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, was a bonafide student of this institution.",
            'fields': [
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Date of Birth', 'value': student.date_of_birth.strftime('%d-%b-%Y') if student.date_of_birth else 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Date of Admission', 'value': student.admission_date.strftime('%d-%b-%Y') if student.admission_date else 'N/A'},
                {'label': 'Date of Leaving', 'value': leaving_date.strftime('%d-%b-%Y')},
                {'label': 'Reason for Leaving', 'value': reason_for_leaving},
                {'label': 'Conduct', 'value': conduct},
                {'label': 'Last Exam Passed', 'value': exam_passed},
                {'label': 'Fee Status', 'value': fee_status},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'date_of_birth': student.date_of_birth.isoformat() if student.date_of_birth else None,
                'class_section': class_section,
                'admission_date': student.admission_date.isoformat() if student.admission_date else None,
                'leaving_date': leaving_date.isoformat(),
                'reason_for_leaving': reason_for_leaving,
                'conduct': conduct,
                'exam_passed': exam_passed,
                'fee_status': fee_status,
                'remarks': remarks
            }
        }

    def generate_leaving_certificate(
        self,
        student_id: int,
        institution_id: int,
        leaving_date: date,
        reason: str,
        conduct: str = "Good",
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Leaving Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        certificate_data = {
            'title': 'LEAVING CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b> studied in this institution from <b>{student.admission_date.strftime('%d-%b-%Y') if student.admission_date else 'N/A'}</b> to <b>{leaving_date.strftime('%d-%b-%Y')}</b>.",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Date of Leaving', 'value': leaving_date.strftime('%d-%b-%Y')},
                {'label': 'Reason', 'value': reason},
                {'label': 'Conduct & Character', 'value': conduct},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'leaving_date': leaving_date.isoformat(),
                'reason': reason,
                'conduct': conduct,
                'remarks': remarks
            }
        }

    def generate_bonafide_certificate(
        self,
        student_id: int,
        institution_id: int,
        academic_year: str,
        purpose: str,
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Bonafide Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        certificate_data = {
            'title': 'BONAFIDE CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, is a bonafide student of this institution studying in class <b>{class_section}</b> for the academic year <b>{academic_year}</b>. This certificate is issued for the purpose of <b>{purpose}</b>.",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Academic Year', 'value': academic_year},
                {'label': 'Purpose', 'value': purpose},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'academic_year': academic_year,
                'purpose': purpose,
                'remarks': remarks
            }
        }

    def generate_character_certificate(
        self,
        student_id: int,
        institution_id: int,
        conduct_assessment: str,
        behavioral_remarks: str,
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Character Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        certificate_data = {
            'title': 'CHARACTER CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, was a student of this institution. During the period of study, the student has shown <b>{conduct_assessment}</b> character and conduct.",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Conduct Assessment', 'value': conduct_assessment},
                {'label': 'Behavioral Remarks', 'value': behavioral_remarks},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'conduct_assessment': conduct_assessment,
                'behavioral_remarks': behavioral_remarks,
                'remarks': remarks
            }
        }

    def generate_study_certificate(
        self,
        student_id: int,
        institution_id: int,
        from_date: date,
        to_date: date,
        purpose: str,
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Study Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        certificate_data = {
            'title': 'STUDY CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, has been studying in this institution from <b>{from_date.strftime('%d-%b-%Y')}</b> to <b>{to_date.strftime('%d-%b-%Y')}</b> in class <b>{class_section}</b>. This certificate is issued for the purpose of <b>{purpose}</b>.",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Period of Study', 'value': f"{from_date.strftime('%d-%b-%Y')} to {to_date.strftime('%d-%b-%Y')}"},
                {'label': 'Purpose', 'value': purpose},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'from_date': from_date.isoformat(),
                'to_date': to_date.isoformat(),
                'purpose': purpose,
                'remarks': remarks
            }
        }

    def generate_conduct_certificate(
        self,
        student_id: int,
        institution_id: int,
        conduct_rating: str,
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Conduct Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        certificate_data = {
            'title': 'CONDUCT CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, is a student of this institution studying in class <b>{class_section}</b>. The conduct and behavior of the student during the period of study has been <b>{conduct_rating}</b>.",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Conduct Rating', 'value': conduct_rating},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'conduct_rating': conduct_rating,
                'remarks': remarks
            }
        }

    def generate_migration_certificate(
        self,
        student_id: int,
        institution_id: int,
        migration_to: str,
        migration_reason: str,
        last_exam_passed: str | None = None,
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Migration Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        exam_passed = last_exam_passed or self._get_exam_passed(student_id) or "N/A"

        certificate_data = {
            'title': 'MIGRATION CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, was a student of this institution and has successfully completed <b>{class_section}</b>. Permission is hereby granted for migration to <b>{migration_to}</b>.",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class Completed', 'value': class_section},
                {'label': 'Last Exam Passed', 'value': exam_passed},
                {'label': 'Migrating To', 'value': migration_to},
                {'label': 'Migration Reason', 'value': migration_reason},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'exam_passed': exam_passed,
                'migration_to': migration_to,
                'migration_reason': migration_reason,
                'remarks': remarks
            }
        }

    def generate_fee_certificate(
        self,
        student_id: int,
        institution_id: int,
        academic_year: str,
        total_fees_paid: float,
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate Fee Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        certificate_data = {
            'title': 'FEE CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, studying in class <b>{class_section}</b>, has paid total fees of <b>Rs. {total_fees_paid:.2f}</b> for the academic year <b>{academic_year}</b>.",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Academic Year', 'value': academic_year},
                {'label': 'Total Fees Paid', 'value': f"Rs. {total_fees_paid:.2f}"},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'academic_year': academic_year,
                'total_fees_paid': total_fees_paid,
                'remarks': remarks
            }
        }

    def generate_no_dues_certificate(
        self,
        student_id: int,
        institution_id: int,
        remarks: str | None = None
    ) -> dict[str, Any]:
        """Generate No Dues Certificate PDF"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        father_name = student.parent_name or "N/A"
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"

        certificate_data = {
            'title': 'NO DUES CERTIFICATE',
            'serial_number': 'DRAFT',
            'issue_date': date.today().strftime('%d-%b-%Y'),
            'content': f"This is to certify that <b>{student.first_name} {student.last_name}</b>, son/daughter of <b>{father_name}</b>, admission number <b>{student.admission_number or 'N/A'}</b>, who studied in class <b>{class_section}</b>, has no dues pending from the following departments:",
            'fields': [
                {'label': 'Student Name', 'value': f"{student.first_name} {student.last_name}"},
                {'label': 'Father\'s Name', 'value': father_name},
                {'label': 'Admission Number', 'value': student.admission_number or 'N/A'},
                {'label': 'Class/Section', 'value': class_section},
                {'label': 'Library', 'value': 'No Dues'},
                {'label': 'Accounts', 'value': 'No Dues'},
                {'label': 'Hostel', 'value': 'No Dues'},
                {'label': 'Transport', 'value': 'No Dues'},
            ],
            'remarks': remarks
        }

        pdf_bytes = self._render_certificate_pdf(certificate_data, institution)

        return {
            'pdf_bytes': pdf_bytes,
            'data_snapshot': {
                'student_name': f"{student.first_name} {student.last_name}",
                'father_name': father_name,
                'admission_number': student.admission_number,
                'class_section': class_section,
                'remarks': remarks
            }
        }

    def generate_id_card_pdf(
        self,
        student_id: int,
        institution_id: int,
        template_id: int | None = None,
        valid_until: date | None = None
    ) -> bytes:
        """Generate ID Card PDF with QR code and barcode"""
        student = self._get_student_with_details(student_id, institution_id)
        institution = self._get_institution_settings(institution_id)

        # Get template
        if template_id:
            self.db.query(IDCardTemplate).filter(
                IDCardTemplate.id == template_id,
                IDCardTemplate.institution_id == institution_id
            ).first()
        else:
            self.db.query(IDCardTemplate).filter(
                IDCardTemplate.institution_id == institution_id,
                IDCardTemplate.is_default is True
            ).first()


        # Generate QR code
        qr_data = {
            'student_id': student.id,
            'admission_number': student.admission_number,
            'name': f"{student.first_name} {student.last_name}",
            'institution_id': institution_id
        }
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)

        # Generate barcode
        barcode_buffer = BytesIO()
        barcode_value = student.admission_number or str(student.id).zfill(8)
        Code128(barcode_value, writer=ImageWriter()).write(barcode_buffer)
        barcode_buffer.seek(0)

        # Create PDF
        buffer = BytesIO()
        page_width = 3.375 * inch  # Standard ID card width
        page_height = 2.125 * inch  # Standard ID card height

        c = canvas.Canvas(buffer, pagesize=(page_width, page_height))

        # Front side
        # Background
        c.setFillColorRGB(0.95, 0.95, 0.95)
        c.rect(0, 0, page_width, page_height, fill=True, stroke=False)

        # Institution name
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(page_width / 2, page_height - 0.3 * inch, institution['name'])

        # Student photo (if available)
        if student.photo_url:
            try:
                photo_x = 0.2 * inch
                photo_y = page_height - 1.5 * inch
                photo_width = 0.8 * inch
                photo_height = 1.0 * inch
                c.drawImage(student.photo_url, photo_x, photo_y, width=photo_width, height=photo_height, mask='auto')
            except OSError:
                pass

        # Student details
        c.setFont("Helvetica-Bold", 8)
        c.drawString(1.2 * inch, page_height - 0.7 * inch, f"{student.first_name} {student.last_name}")

        c.setFont("Helvetica", 7)
        class_section = "N/A"
        if student.section and student.section.grade:
            class_section = f"{student.section.grade.name} - {student.section.name}"
        c.drawString(1.2 * inch, page_height - 0.95 * inch, f"Class: {class_section}")
        c.drawString(1.2 * inch, page_height - 1.15 * inch, f"ID: {student.admission_number or 'N/A'}")

        if valid_until:
            c.drawString(1.2 * inch, page_height - 1.35 * inch, f"Valid: {valid_until.strftime('%d-%m-%Y')}")

        # QR Code
        c.drawImage(ImageReader(qr_buffer), 2.5 * inch, page_height - 1.7 * inch, width=0.7 * inch, height=0.7 * inch)

        c.showPage()

        # Back side
        c.setFillColorRGB(0.95, 0.95, 0.95)
        c.rect(0, 0, page_width, page_height, fill=True, stroke=False)

        # Emergency contact
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(0.2 * inch, page_height - 0.4 * inch, "Emergency Contact:")

        c.setFont("Helvetica", 7)
        emergency_name = student.emergency_contact_name or student.parent_name or "N/A"
        emergency_phone = student.emergency_contact_phone or student.parent_phone or "N/A"
        c.drawString(0.2 * inch, page_height - 0.6 * inch, f"Name: {emergency_name}")
        c.drawString(0.2 * inch, page_height - 0.8 * inch, f"Phone: {emergency_phone}")

        if student.blood_group:
            c.drawString(0.2 * inch, page_height - 1.0 * inch, f"Blood Group: {student.blood_group}")

        # Barcode
        c.drawImage(ImageReader(barcode_buffer), 0.2 * inch, page_height - 1.9 * inch, width=2.5 * inch, height=0.4 * inch)

        # Institution contact
        c.setFont("Helvetica", 6)
        if institution.get('phone'):
            c.drawString(0.2 * inch, 0.15 * inch, f"Phone: {institution['phone']}")
        if institution.get('website'):
            c.drawString(1.7 * inch, 0.15 * inch, f"Web: {institution['website']}")

        c.save()
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

    def generate_bulk_id_cards(
        self,
        institution_id: int,
        section_id: int | None = None,
        grade_id: int | None = None,
        template_id: int | None = None,
        valid_until: date | None = None
    ) -> bytes:
        """Generate bulk ID cards for class/section"""
        query = self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.is_active is True
        )

        if section_id:
            query = query.filter(Student.section_id == section_id)
        elif grade_id:
            query = query.join(Section).filter(Section.grade_id == grade_id)

        students = query.all()

        if not students:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No students found for the specified criteria"
            )

        # Combine all ID cards into single PDF
        combined_buffer = BytesIO()
        combined_buffer.write(b'%PDF-1.4\n')

        for student in students:
            try:
                pdf_bytes = self.generate_id_card_pdf(
                    student.id,
                    institution_id,
                    template_id,
                    valid_until
                )
                combined_buffer.write(pdf_bytes)
            except Exception:
                continue

        pdf_bytes = combined_buffer.getvalue()
        combined_buffer.close()

        return pdf_bytes

    def issue_certificate(
        self,
        student_id: int,
        institution_id: int,
        certificate_type: str,
        pdf_bytes: bytes,
        data_snapshot: dict[str, Any],
        template_id: int | None = None,
        issued_by_user_id: int | None = None,
        remarks: str | None = None
    ) -> IssuedCertificate:
        """Issue certificate and store to S3"""
        # Generate serial number
        serial_number = self._generate_serial_number(institution_id, certificate_type)

        # Upload PDF to S3
        s3_key = f"certificates/{institution_id}/{certificate_type}/{serial_number}.pdf"
        try:
            pdf_url = s3_client.upload_file(
                pdf_bytes,
                s3_key,
                content_type='application/pdf'
            )
        except Exception:
            pdf_url = None

        # Create record
        issued_cert = IssuedCertificate(
            institution_id=institution_id,
            student_id=student_id,
            certificate_type=certificate_type,
            template_id=template_id,
            serial_number=serial_number,
            issue_date=date.today(),
            data_snapshot=data_snapshot,
            pdf_url=pdf_url,
            issued_by=issued_by_user_id,
            remarks=remarks,
            status=IssuedCertificateStatus.ISSUED.value
        )

        self.db.add(issued_cert)
        self.db.commit()
        self.db.refresh(issued_cert)

        return issued_cert

    def revoke_certificate(
        self,
        certificate_id: int,
        institution_id: int,
        revoked_by_user_id: int | None = None,
        reason: str | None = None
    ) -> IssuedCertificate:
        """Revoke an issued certificate"""
        certificate = self.db.query(IssuedCertificate).filter(
            IssuedCertificate.id == certificate_id,
            IssuedCertificate.institution_id == institution_id
        ).first()

        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certificate not found"
            )

        if certificate.status == IssuedCertificateStatus.REVOKED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Certificate is already revoked"
            )

        certificate.status = IssuedCertificateStatus.REVOKED.value
        if reason:
            certificate.remarks = f"{certificate.remarks or ''}\nRevoked: {reason}".strip()

        self.db.commit()
        self.db.refresh(certificate)

        return certificate
