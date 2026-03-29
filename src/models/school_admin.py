from datetime import datetime
from enum import Enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from src.database import Base


class CertificateType(str, Enum):
    TRANSFER_CERTIFICATE = "transfer_certificate"
    LEAVING_CERTIFICATE = "leaving_certificate"
    BONAFIDE = "bonafide"
    CHARACTER_CERTIFICATE = "character_certificate"
    STUDY_CERTIFICATE = "study_certificate"
    CONDUCT_CERTIFICATE = "conduct_certificate"
    MIGRATION_CERTIFICATE = "migration_certificate"
    FEE_CERTIFICATE = "fee_certificate"
    NO_DUES_CERTIFICATE = "no_dues_certificate"
    SPORTS_CERTIFICATE = "sports_certificate"
    MERIT_CERTIFICATE = "merit_certificate"
    PARTICIPATION_CERTIFICATE = "participation_certificate"
    CUSTOM = "custom"


class IssuedCertificateStatus(str, Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    REVOKED = "revoked"


class IDCardOrientation(str, Enum):
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"


class StaffDepartment(str, Enum):
    TEACHING = "teaching"
    NON_TEACHING = "non_teaching"
    ADMINISTRATION = "administration"
    TRANSPORT = "transport"
    MAINTENANCE = "maintenance"
    ACCOUNTS = "accounts"
    LIBRARY = "library"
    LAB = "lab"
    SPORTS = "sports"
    SECURITY = "security"


class StaffStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    RESIGNED = "resigned"
    TERMINATED = "terminated"
    RETIRED = "retired"


class PayrollPaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    PAID = "paid"


class SMSTemplateType(str, Enum):
    ENQUIRY_RESPONSE = "enquiry_response"
    FEE_REMINDER = "fee_reminder"
    ATTENDANCE_ALERT = "attendance_alert"
    EXAM_NOTIFICATION = "exam_notification"
    RESULT_PUBLISHED = "result_published"
    GENERAL = "general"
    ADMISSION_ENQUIRY = "admission_enquiry"
    PARENT_NOTIFICATION = "parent_notification"
    EVENT_REMINDER = "event_reminder"


class EnquirySource(str, Enum):
    WALK_IN = "walk_in"
    PHONE = "phone"
    WEBSITE = "website"
    REFERRAL = "referral"
    ADVERTISEMENT = "advertisement"


class EnquiryStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    FOLLOW_UP = "follow_up"
    CONVERTED = "converted"
    CLOSED = "closed"


class CertificateTemplate(Base):
    __tablename__ = "certificate_templates"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    template_name = Column(String(200), nullable=False)
    certificate_type = Column(String(50), nullable=False, index=True)
    template_config = Column(JSON, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    issued_certificates = relationship("IssuedCertificate", back_populates="template", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_certificate_template_institution', 'institution_id'),
        Index('idx_certificate_template_type', 'certificate_type'),
        Index('idx_certificate_template_active', 'is_active'),
    )


class IssuedCertificate(Base):
    __tablename__ = "issued_certificates"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    certificate_type = Column(String(50), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey('certificate_templates.id', ondelete='SET NULL'), nullable=True, index=True)
    serial_number = Column(String(100), nullable=False, unique=True, index=True)
    issue_date = Column(Date, nullable=False, index=True)
    data_snapshot = Column(JSON, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    issued_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    remarks = Column(Text, nullable=True)
    status = Column(String(20), default=IssuedCertificateStatus.DRAFT.value, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    template = relationship("CertificateTemplate", back_populates="issued_certificates")
    issuer = relationship("User", foreign_keys=[issued_by])

    __table_args__ = (
        Index('idx_issued_certificate_institution', 'institution_id'),
        Index('idx_issued_certificate_student', 'student_id'),
        Index('idx_issued_certificate_type', 'certificate_type'),
        Index('idx_issued_certificate_template', 'template_id'),
        Index('idx_issued_certificate_serial', 'serial_number'),
        Index('idx_issued_certificate_issue_date', 'issue_date'),
        Index('idx_issued_certificate_status', 'status'),
        Index('idx_issued_certificate_issued_by', 'issued_by'),
    )


class IDCardTemplate(Base):
    __tablename__ = "id_card_templates"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    template_name = Column(String(200), nullable=False)
    layout_config = Column(JSON, nullable=False)
    color_scheme = Column(String(100), nullable=True)
    logo_position = Column(String(50), nullable=True)
    fields_to_show = Column(JSON, nullable=True)
    orientation = Column(String(20), default=IDCardOrientation.PORTRAIT.value, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_id_card_template_institution', 'institution_id'),
        Index('idx_id_card_template_orientation', 'orientation'),
    )


class StaffMember(Base):
    __tablename__ = "staff_members"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    employee_id = Column(String(50), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    designation = Column(String(200), nullable=True)
    department = Column(String(50), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    qualification = Column(String(255), nullable=True)
    joining_date = Column(Date, nullable=True, index=True)
    leaving_date = Column(Date, nullable=True, index=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_name = Column(String(200), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    pan_number = Column(String(20), nullable=True)
    aadhar_number = Column(String(20), nullable=True)
    basic_salary = Column(Numeric(10, 2), nullable=True)
    photo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    status = Column(String(20), default=StaffStatus.ACTIVE.value, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    payrolls = relationship("StaffPayroll", back_populates="staff_member", cascade="all, delete-orphan")
    assigned_enquiries = relationship("EnquiryRecord", back_populates="assigned_to_staff", foreign_keys="EnquiryRecord.assigned_to")

    __table_args__ = (
        UniqueConstraint('institution_id', 'employee_id', name='uq_institution_employee_id'),
        Index('idx_staff_institution', 'institution_id'),
        Index('idx_staff_employee_id', 'employee_id'),
        Index('idx_staff_email', 'email'),
        Index('idx_staff_department', 'department'),
        Index('idx_staff_joining_date', 'joining_date'),
        Index('idx_staff_leaving_date', 'leaving_date'),
        Index('idx_staff_active', 'is_active'),
        Index('idx_staff_status', 'status'),
    )


class StaffPayroll(Base):
    __tablename__ = "staff_payrolls"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    staff_id = Column(Integer, ForeignKey('staff_members.id', ondelete='CASCADE'), nullable=False, index=True)
    month = Column(Integer, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    basic_salary = Column(Numeric(10, 2), nullable=False)
    hra = Column(Numeric(10, 2), default=0, nullable=False)
    da = Column(Numeric(10, 2), default=0, nullable=False)
    ta = Column(Numeric(10, 2), default=0, nullable=False)
    special_allowance = Column(Numeric(10, 2), default=0, nullable=False)
    pf_deduction = Column(Numeric(10, 2), default=0, nullable=False)
    esi_deduction = Column(Numeric(10, 2), default=0, nullable=False)
    professional_tax = Column(Numeric(10, 2), default=0, nullable=False)
    tds = Column(Numeric(10, 2), default=0, nullable=False)
    other_deductions = Column(Numeric(10, 2), default=0, nullable=False)
    gross_salary = Column(Numeric(10, 2), nullable=False)
    net_salary = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String(20), default=PayrollPaymentStatus.PENDING.value, nullable=False, index=True)
    payment_date = Column(Date, nullable=True, index=True)
    transaction_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    staff_member = relationship("StaffMember", back_populates="payrolls")

    __table_args__ = (
        UniqueConstraint('staff_id', 'month', 'year', name='uq_staff_month_year'),
        Index('idx_payroll_institution', 'institution_id'),
        Index('idx_payroll_staff', 'staff_id'),
        Index('idx_payroll_month_year', 'month', 'year'),
        Index('idx_payroll_payment_status', 'payment_status'),
        Index('idx_payroll_payment_date', 'payment_date'),
    )


class SMSTemplate(Base):
    __tablename__ = "sms_templates"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    template_name = Column(String(200), nullable=False)
    template_type = Column(String(50), nullable=False, index=True)
    message_body = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_sms_template_institution', 'institution_id'),
        Index('idx_sms_template_type', 'template_type'),
        Index('idx_sms_template_active', 'is_active'),
    )


class EnquiryRecord(Base):
    __tablename__ = "enquiry_records"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    enquiry_date = Column(Date, nullable=False, index=True)
    student_name = Column(String(200), nullable=False)
    parent_name = Column(String(200), nullable=False)
    parent_phone = Column(String(20), nullable=False, index=True)
    parent_email = Column(String(255), nullable=True)
    enquiry_for_grade = Column(String(50), nullable=True)
    source = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default=EnquiryStatus.NEW.value, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey('staff_members.id', ondelete='SET NULL'), nullable=True, index=True)
    sms_sent_count = Column(Integer, default=0, nullable=False)
    last_sms_sent_at = Column(DateTime, nullable=True)
    follow_up_date = Column(Date, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    assigned_to_staff = relationship("StaffMember", back_populates="assigned_enquiries", foreign_keys=[assigned_to])

    __table_args__ = (
        Index('idx_enquiry_institution', 'institution_id'),
        Index('idx_enquiry_date', 'enquiry_date'),
        Index('idx_enquiry_phone', 'parent_phone'),
        Index('idx_enquiry_source', 'source'),
        Index('idx_enquiry_status', 'status'),
        Index('idx_enquiry_assigned_to', 'assigned_to'),
        Index('idx_enquiry_follow_up_date', 'follow_up_date'),
    )
