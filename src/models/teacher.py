from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from src.database import Base


class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    employee_id = Column(String(50), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    qualification = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    joining_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="teachers")
    user = relationship("User", back_populates="teacher_profile")
    teacher_subjects = relationship("TeacherSubject", back_populates="teacher", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="teacher", cascade="all, delete-orphan")
    graded_submissions = relationship("Submission", foreign_keys="Submission.graded_by", back_populates="grader")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'email', name='uq_institution_teacher_email'),
        UniqueConstraint('institution_id', 'employee_id', name='uq_institution_teacher_employee_id'),
        Index('idx_teacher_institution', 'institution_id'),
        Index('idx_teacher_user', 'user_id'),
        Index('idx_teacher_active', 'is_active'),
        Index('idx_teacher_email', 'email'),
    )


class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="teacher_subjects")
    teacher = relationship("Teacher", back_populates="teacher_subjects")
    subject = relationship("Subject", back_populates="teacher_subjects")
    
    __table_args__ = (
        UniqueConstraint('teacher_id', 'subject_id', name='uq_teacher_subject'),
        Index('idx_teacher_subject_institution', 'institution_id'),
        Index('idx_teacher_subject_teacher', 'teacher_id'),
        Index('idx_teacher_subject_subject', 'subject_id'),
    )
