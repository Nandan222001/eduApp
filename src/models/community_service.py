from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class ServiceActivityType(str, Enum):
    VOLUNTEER = "volunteer"
    FUNDRAISING = "fundraising"
    ENVIRONMENTAL = "environmental"
    TUTORING = "tutoring"
    HEALTHCARE = "healthcare"
    ANIMAL_WELFARE = "animal_welfare"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class ServiceActivity(Base):
    __tablename__ = "service_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    activity_name = Column(String(255), nullable=False)
    organization_name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False, index=True)
    contact_phone = Column(String(20), nullable=True)
    activity_type = Column(SQLEnum(ServiceActivityType), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    hours_logged = Column(Numeric(6, 2), nullable=False)
    description = Column(Text, nullable=True)
    impact_statement = Column(Text, nullable=True)
    reflection_essay = Column(Text, nullable=True)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True)
    verifier_signature_url = Column(String(500), nullable=True)
    verification_date = Column(Date, nullable=True)
    verification_token = Column(String(255), nullable=True, unique=True, index=True)
    verification_token_expires = Column(DateTime, nullable=True)
    attachments = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_service_activity_institution', 'institution_id'),
        Index('idx_service_activity_student', 'student_id'),
        Index('idx_service_activity_organization', 'organization_name'),
        Index('idx_service_activity_type', 'activity_type'),
        Index('idx_service_activity_date', 'date'),
        Index('idx_service_activity_status', 'verification_status'),
        Index('idx_service_activity_contact_email', 'contact_email'),
        Index('idx_service_activity_token', 'verification_token'),
    )


class OrganizationContact(Base):
    __tablename__ = "organization_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    organization_name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False, index=True)
    contact_phone = Column(String(20), nullable=True)
    organization_address = Column(Text, nullable=True)
    organization_website = Column(String(500), nullable=True)
    organization_type = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'organization_name', 'contact_email', name='uq_institution_org_contact'),
        Index('idx_org_contact_institution', 'institution_id'),
        Index('idx_org_contact_organization', 'organization_name'),
        Index('idx_org_contact_email', 'contact_email'),
        Index('idx_org_contact_verified', 'is_verified'),
        Index('idx_org_contact_active', 'is_active'),
    )


class ServicePortfolio(Base):
    __tablename__ = "service_portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    total_hours = Column(Numeric(8, 2), default=0, nullable=False)
    verified_hours = Column(Numeric(8, 2), default=0, nullable=False)
    pending_hours = Column(Numeric(8, 2), default=0, nullable=False)
    rejected_hours = Column(Numeric(8, 2), default=0, nullable=False)
    volunteer_hours = Column(Numeric(8, 2), default=0, nullable=False)
    fundraising_hours = Column(Numeric(8, 2), default=0, nullable=False)
    environmental_hours = Column(Numeric(8, 2), default=0, nullable=False)
    tutoring_hours = Column(Numeric(8, 2), default=0, nullable=False)
    healthcare_hours = Column(Numeric(8, 2), default=0, nullable=False)
    animal_welfare_hours = Column(Numeric(8, 2), default=0, nullable=False)
    total_activities = Column(Integer, default=0, nullable=False)
    organizations_count = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'student_id', name='uq_institution_student_portfolio'),
        Index('idx_service_portfolio_institution', 'institution_id'),
        Index('idx_service_portfolio_student', 'student_id'),
        Index('idx_service_portfolio_verified_hours', 'verified_hours'),
    )


class GraduationRequirement(Base):
    __tablename__ = "graduation_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=True, index=True)
    requirement_name = Column(String(255), nullable=False)
    required_hours = Column(Numeric(8, 2), nullable=False)
    activity_type = Column(SQLEnum(ServiceActivityType), nullable=True, index=True)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    grade = relationship("Grade")
    academic_year = relationship("AcademicYear")
    
    __table_args__ = (
        Index('idx_graduation_req_institution', 'institution_id'),
        Index('idx_graduation_req_grade', 'grade_id'),
        Index('idx_graduation_req_activity_type', 'activity_type'),
        Index('idx_graduation_req_academic_year', 'academic_year_id'),
        Index('idx_graduation_req_active', 'is_active'),
    )


class StudentGraduationProgress(Base):
    __tablename__ = "student_graduation_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    requirement_id = Column(Integer, ForeignKey('graduation_requirements.id', ondelete='CASCADE'), nullable=False, index=True)
    hours_completed = Column(Numeric(8, 2), default=0, nullable=False)
    hours_required = Column(Numeric(8, 2), nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completion_date = Column(Date, nullable=True)
    percentage_complete = Column(Numeric(5, 2), default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    requirement = relationship("GraduationRequirement")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'requirement_id', name='uq_student_requirement_progress'),
        Index('idx_student_grad_progress_institution', 'institution_id'),
        Index('idx_student_grad_progress_student', 'student_id'),
        Index('idx_student_grad_progress_requirement', 'requirement_id'),
        Index('idx_student_grad_progress_completed', 'is_completed'),
    )


class ServiceCertificate(Base):
    __tablename__ = "service_certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    certificate_number = Column(String(100), nullable=False, unique=True, index=True)
    certificate_type = Column(String(50), nullable=False)
    total_hours = Column(Numeric(8, 2), nullable=False)
    issue_date = Column(Date, nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='SET NULL'), nullable=True, index=True)
    certificate_url = Column(String(500), nullable=True)
    pdf_path = Column(String(500), nullable=True)
    signed_by = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    purpose = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    academic_year = relationship("AcademicYear")
    signer = relationship("Teacher")
    
    __table_args__ = (
        Index('idx_service_cert_institution', 'institution_id'),
        Index('idx_service_cert_student', 'student_id'),
        Index('idx_service_cert_number', 'certificate_number'),
        Index('idx_service_cert_issue_date', 'issue_date'),
        Index('idx_service_cert_academic_year', 'academic_year_id'),
        Index('idx_service_cert_signed_by', 'signed_by'),
    )
