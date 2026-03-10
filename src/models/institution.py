from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index
from sqlalchemy.orm import relationship
from src.database import Base


class Institution(Base):
    __tablename__ = "institutions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255), unique=True, nullable=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    max_users = Column(Integer, nullable=True)
    settings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    users = relationship("User", back_populates="institution", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="institution", cascade="all, delete-orphan")
    academic_years = relationship("AcademicYear", back_populates="institution", cascade="all, delete-orphan")
    grades = relationship("Grade", back_populates="institution", cascade="all, delete-orphan")
    sections = relationship("Section", back_populates="institution", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="institution", cascade="all, delete-orphan")
    grade_subjects = relationship("GradeSubject", back_populates="institution", cascade="all, delete-orphan")
    teachers = relationship("Teacher", back_populates="institution", cascade="all, delete-orphan")
    teacher_subjects = relationship("TeacherSubject", back_populates="institution", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="institution", cascade="all, delete-orphan")
    chapters = relationship("Chapter", back_populates="institution", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="institution", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="institution", cascade="all, delete-orphan")
    attendance_corrections = relationship("AttendanceCorrection", back_populates="institution", cascade="all, delete-orphan")
    attendance_summaries = relationship("AttendanceSummary", back_populates="institution", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="institution", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="institution", cascade="all, delete-orphan")
    previous_year_papers = relationship("PreviousYearPaper", back_populates="institution", cascade="all, delete-orphan")
    questions_bank = relationship("QuestionBank", back_populates="institution", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_institution_active', 'is_active'),
        Index('idx_institution_created', 'created_at'),
    )
