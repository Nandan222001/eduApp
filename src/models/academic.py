from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Text, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class TermType(str, Enum):
    SEMESTER = "semester"
    TRIMESTER = "trimester"
    QUARTER = "quarter"
    CUSTOM = "custom"


class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class AcademicYear(Base):
    __tablename__ = "academic_years"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="academic_years")
    grades = relationship("Grade", back_populates="academic_year", cascade="all, delete-orphan")
    terms = relationship("Term", back_populates="academic_year", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'name', name='uq_institution_academic_year_name'),
        Index('idx_academic_year_institution', 'institution_id'),
        Index('idx_academic_year_current', 'is_current'),
        Index('idx_academic_year_active', 'is_active'),
    )


class Grade(Base):
    __tablename__ = "grades"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="grades")
    academic_year = relationship("AcademicYear", back_populates="grades")
    sections = relationship("Section", back_populates="grade", cascade="all, delete-orphan")
    grade_subjects = relationship("GradeSubject", back_populates="grade", cascade="all, delete-orphan")
    chapters = relationship("Chapter", back_populates="grade", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="grade", cascade="all, delete-orphan")
    previous_year_papers = relationship("PreviousYearPaper", back_populates="grade", cascade="all, delete-orphan")
    questions_bank = relationship("QuestionBank", back_populates="grade", cascade="all, delete-orphan")
    study_materials = relationship("StudyMaterial", back_populates="grade", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'academic_year_id', 'name', name='uq_institution_year_grade_name'),
        Index('idx_grade_institution', 'institution_id'),
        Index('idx_grade_academic_year', 'academic_year_id'),
        Index('idx_grade_active', 'is_active'),
    )


class Section(Base):
    __tablename__ = "sections"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="sections")
    grade = relationship("Grade", back_populates="sections")
    students = relationship("Student", back_populates="section")
    attendances = relationship("Attendance", back_populates="section")
    assignments = relationship("Assignment", back_populates="section")
    
    __table_args__ = (
        UniqueConstraint('grade_id', 'name', name='uq_grade_section_name'),
        Index('idx_section_institution', 'institution_id'),
        Index('idx_section_grade', 'grade_id'),
        Index('idx_section_active', 'is_active'),
    )


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="subjects")
    grade_subjects = relationship("GradeSubject", back_populates="subject", cascade="all, delete-orphan")
    teacher_subjects = relationship("TeacherSubject", back_populates="subject", cascade="all, delete-orphan")
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="subject")
    attendance_summaries = relationship("AttendanceSummary", back_populates="subject")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    previous_year_papers = relationship("PreviousYearPaper", back_populates="subject", cascade="all, delete-orphan")
    questions_bank = relationship("QuestionBank", back_populates="subject", cascade="all, delete-orphan")
    study_materials = relationship("StudyMaterial", back_populates="subject", cascade="all, delete-orphan")
    homework_scans = relationship("HomeworkScan", back_populates="subject", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'name', name='uq_institution_subject_name'),
        UniqueConstraint('institution_id', 'code', name='uq_institution_subject_code'),
        Index('idx_subject_institution', 'institution_id'),
        Index('idx_subject_active', 'is_active'),
    )


class GradeSubject(Base):
    __tablename__ = "grade_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    is_compulsory = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="grade_subjects")
    grade = relationship("Grade", back_populates="grade_subjects")
    subject = relationship("Subject", back_populates="grade_subjects")
    
    __table_args__ = (
        UniqueConstraint('grade_id', 'subject_id', name='uq_grade_subject'),
        Index('idx_grade_subject_institution', 'institution_id'),
        Index('idx_grade_subject_grade', 'grade_id'),
        Index('idx_grade_subject_subject', 'subject_id'),
    )


class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="chapters")
    subject = relationship("Subject", back_populates="chapters")
    grade = relationship("Grade", back_populates="chapters")
    topics = relationship("Topic", back_populates="chapter", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="chapter")
    questions_bank = relationship("QuestionBank", back_populates="chapter")
    study_materials = relationship("StudyMaterial", back_populates="chapter")
    
    __table_args__ = (
        UniqueConstraint('subject_id', 'grade_id', 'name', name='uq_subject_grade_chapter_name'),
        UniqueConstraint('subject_id', 'grade_id', 'code', name='uq_subject_grade_chapter_code'),
        Index('idx_chapter_institution', 'institution_id'),
        Index('idx_chapter_subject', 'subject_id'),
        Index('idx_chapter_grade', 'grade_id'),
        Index('idx_chapter_active', 'is_active'),
    )


class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="topics")
    chapter = relationship("Chapter", back_populates="topics")
    questions_bank = relationship("QuestionBank", back_populates="topic")
    study_materials = relationship("StudyMaterial", back_populates="topic")
    
    __table_args__ = (
        UniqueConstraint('chapter_id', 'name', name='uq_chapter_topic_name'),
        UniqueConstraint('chapter_id', 'code', name='uq_chapter_topic_code'),
        Index('idx_topic_institution', 'institution_id'),
        Index('idx_topic_chapter', 'chapter_id'),
        Index('idx_topic_active', 'is_active'),
    )


class Syllabus(Base):
    __tablename__ = "syllabi"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    academic_year = Column(String(20), nullable=True)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    grade = relationship("Grade")
    subject = relationship("Subject")

    __table_args__ = (
        Index('idx_syllabus_institution', 'institution_id'),
        Index('idx_syllabus_grade', 'grade_id'),
        Index('idx_syllabus_subject', 'subject_id'),
    )


class Term(Base):
    __tablename__ = "terms"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    term_type = Column(SQLEnum(TermType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    display_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="terms")
    academic_year = relationship("AcademicYear", back_populates="terms")
    
    __table_args__ = (
        UniqueConstraint('academic_year_id', 'name', name='uq_academic_year_term_name'),
        Index('idx_term_institution', 'institution_id'),
        Index('idx_term_academic_year', 'academic_year_id'),
        Index('idx_term_active', 'is_active'),
        Index('idx_term_dates', 'start_date', 'end_date'),
    )

