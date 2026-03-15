from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class JobType(str, Enum):
    PART_TIME = "part_time"
    SEASONAL = "seasonal"
    INTERNSHIP = "internship"
    VOLUNTEER = "volunteer"


class PermitType(str, Enum):
    STATE_SPECIFIC = "state_specific"


class AuthorizationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    EXPIRED = "expired"


class StudentJobListing(Base):
    __tablename__ = "student_job_listings"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    employer_name = Column(String(200), nullable=False, index=True)
    job_title = Column(String(200), nullable=False, index=True)
    job_type = Column(SQLEnum(JobType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    hourly_pay = Column(Numeric(10, 2), nullable=True)
    hours_per_week = Column(Integer, nullable=True)
    location = Column(String(300), nullable=True)
    application_link = Column(String(500), nullable=True)
    posting_date = Column(Date, default=date.today, nullable=False, index=True)
    expiry_date = Column(Date, nullable=True, index=True)
    employer_verified = Column(Boolean, default=False, nullable=False, index=True)
    application_count = Column(Integer, default=0, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    applications = relationship("JobApplication", back_populates="job_listing", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_job_listing_institution', 'institution_id'),
        Index('idx_job_listing_employer', 'employer_name'),
        Index('idx_job_listing_job_type', 'job_type'),
        Index('idx_job_listing_posting_date', 'posting_date'),
        Index('idx_job_listing_expiry_date', 'expiry_date'),
        Index('idx_job_listing_verified', 'employer_verified'),
        Index('idx_job_listing_active', 'is_active'),
    )


class WorkPermit(Base):
    __tablename__ = "work_permits"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    permit_type = Column(SQLEnum(PermitType), nullable=False, index=True)
    issue_date = Column(Date, nullable=False, index=True)
    expiry_date = Column(Date, nullable=False, index=True)
    employer_name = Column(String(200), nullable=True)
    max_hours_per_week = Column(Integer, nullable=True)
    school_authorization_status = Column(SQLEnum(AuthorizationStatus), default=AuthorizationStatus.PENDING, nullable=False, index=True)
    parent_consent = Column(Boolean, default=False, nullable=False, index=True)
    
    permit_number = Column(String(100), nullable=True, index=True)
    restrictions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_work_permit_institution', 'institution_id'),
        Index('idx_work_permit_student', 'student_id'),
        Index('idx_work_permit_type', 'permit_type'),
        Index('idx_work_permit_issue_date', 'issue_date'),
        Index('idx_work_permit_expiry_date', 'expiry_date'),
        Index('idx_work_permit_status', 'school_authorization_status'),
        Index('idx_work_permit_parent_consent', 'parent_consent'),
        Index('idx_work_permit_active', 'is_active'),
    )


class StudentEmployment(Base):
    __tablename__ = "student_employments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    work_permit_id = Column(Integer, ForeignKey('work_permits.id', ondelete='SET NULL'), nullable=True, index=True)
    
    employer = Column(String(200), nullable=False, index=True)
    job_title = Column(String(200), nullable=False)
    job_type = Column(SQLEnum(JobType), nullable=False, index=True)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True, index=True)
    hours_per_week = Column(Integer, nullable=True)
    hourly_pay = Column(Numeric(10, 2), nullable=True)
    
    skills_gained = Column(Text, nullable=True)
    responsibilities = Column(Text, nullable=True)
    supervisor_name = Column(String(200), nullable=True)
    supervisor_reference = Column(Text, nullable=True)
    supervisor_contact = Column(String(200), nullable=True)
    
    is_current = Column(Boolean, default=True, nullable=False, index=True)
    verified_for_graduation = Column(Boolean, default=False, nullable=False, index=True)
    verification_date = Column(Date, nullable=True)
    verified_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    total_hours_worked = Column(Numeric(10, 2), nullable=True)
    performance_rating = Column(Numeric(3, 2), nullable=True)
    would_recommend = Column(Boolean, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    work_permit = relationship("WorkPermit")
    verifier = relationship("User", foreign_keys=[verified_by])
    
    __table_args__ = (
        Index('idx_student_employment_institution', 'institution_id'),
        Index('idx_student_employment_student', 'student_id'),
        Index('idx_student_employment_employer', 'employer'),
        Index('idx_student_employment_job_type', 'job_type'),
        Index('idx_student_employment_start_date', 'start_date'),
        Index('idx_student_employment_end_date', 'end_date'),
        Index('idx_student_employment_current', 'is_current'),
        Index('idx_student_employment_verified', 'verified_for_graduation'),
        Index('idx_student_employment_active', 'is_active'),
    )


class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    job_listing_id = Column(Integer, ForeignKey('student_job_listings.id', ondelete='CASCADE'), nullable=False, index=True)
    
    application_date = Column(Date, default=date.today, nullable=False, index=True)
    status = Column(String(50), default='submitted', nullable=False, index=True)
    cover_letter = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    interview_date = Column(Date, nullable=True)
    response_date = Column(Date, nullable=True)
    outcome = Column(String(50), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    job_listing = relationship("StudentJobListing", back_populates="applications")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'job_listing_id', name='uq_student_job_application'),
        Index('idx_job_application_institution', 'institution_id'),
        Index('idx_job_application_student', 'student_id'),
        Index('idx_job_application_listing', 'job_listing_id'),
        Index('idx_job_application_date', 'application_date'),
        Index('idx_job_application_status', 'status'),
    )
