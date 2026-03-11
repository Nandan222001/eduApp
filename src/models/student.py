from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from src.database import Base


class Parent(Base):
    __tablename__ = "parents"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    occupation = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    relation_type = Column(String(50), nullable=True)
    is_primary_contact = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    students = relationship("StudentParent", back_populates="parent", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'email', name='uq_institution_parent_email'),
        Index('idx_parent_institution', 'institution_id'),
        Index('idx_parent_user', 'user_id'),
        Index('idx_parent_email', 'email'),
        Index('idx_parent_active', 'is_active'),
    )


class StudentParent(Base):
    __tablename__ = "student_parents"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    relation_type = Column(String(50), nullable=False)
    is_primary_contact = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    student = relationship("Student", back_populates="parents")
    parent = relationship("Parent", back_populates="students")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'parent_id', name='uq_student_parent'),
        Index('idx_student_parent_student', 'student_id'),
        Index('idx_student_parent_parent', 'parent_id'),
    )


class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='SET NULL'), nullable=True, index=True)
    admission_number = Column(String(50), nullable=True)
    roll_number = Column(String(50), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    parent_name = Column(String(255), nullable=True)
    parent_email = Column(String(255), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    admission_date = Column(Date, nullable=True)
    photo_url = Column(String(500), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relation = Column(String(100), nullable=True)
    previous_school = Column(String(255), nullable=True)
    medical_conditions = Column(Text, nullable=True)
    nationality = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)
    caste = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)
    aadhar_number = Column(String(20), nullable=True)
    status = Column(String(20), default='active', nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="students")
    user = relationship("User", back_populates="student_profile")
    section = relationship("Section", back_populates="students")
    parents = relationship("StudentParent", back_populates="student", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    attendance_summaries = relationship("AttendanceSummary", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="student", cascade="all, delete-orphan")
    weak_areas = relationship("WeakArea", back_populates="student", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'email', name='uq_institution_student_email'),
        UniqueConstraint('institution_id', 'admission_number', name='uq_institution_student_admission_number'),
        Index('idx_student_institution', 'institution_id'),
        Index('idx_student_user', 'user_id'),
        Index('idx_student_section', 'section_id'),
        Index('idx_student_active', 'is_active'),
        Index('idx_student_email', 'email'),
        Index('idx_student_status', 'status'),
    )
