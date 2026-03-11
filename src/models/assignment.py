from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum, Numeric, Float
from sqlalchemy.orm import relationship
from src.database import Base


class AssignmentStatus(str, PyEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    ARCHIVED = "archived"


class SubmissionStatus(str, PyEnum):
    NOT_SUBMITTED = "not_submitted"
    SUBMITTED = "submitted"
    LATE_SUBMITTED = "late_submitted"
    GRADED = "graded"
    RETURNED = "returned"


class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='SET NULL'), nullable=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    
    due_date = Column(DateTime, nullable=True)
    publish_date = Column(DateTime, nullable=True)
    close_date = Column(DateTime, nullable=True)
    
    max_marks = Column(Numeric(10, 2), nullable=False, default=100)
    passing_marks = Column(Numeric(10, 2), nullable=True)
    
    allow_late_submission = Column(Boolean, default=False, nullable=False)
    late_penalty_percentage = Column(Float, nullable=True)
    max_file_size_mb = Column(Integer, default=10, nullable=False)
    allowed_file_types = Column(String(255), nullable=True)
    
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DRAFT, nullable=False, index=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="assignments")
    teacher = relationship("Teacher", back_populates="assignments")
    grade = relationship("Grade", back_populates="assignments")
    section = relationship("Section", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")
    chapter = relationship("Chapter", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")
    attachment_files = relationship("AssignmentFile", back_populates="assignment", cascade="all, delete-orphan")
    rubric_criteria = relationship("RubricCriteria", back_populates="assignment", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_assignment_institution', 'institution_id'),
        Index('idx_assignment_teacher', 'teacher_id'),
        Index('idx_assignment_grade', 'grade_id'),
        Index('idx_assignment_section', 'section_id'),
        Index('idx_assignment_subject', 'subject_id'),
        Index('idx_assignment_chapter', 'chapter_id'),
        Index('idx_assignment_status', 'status'),
        Index('idx_assignment_due_date', 'due_date'),
        Index('idx_assignment_active', 'is_active'),
    )


class AssignmentFile(Base):
    __tablename__ = "assignment_files"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey('assignments.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    file_url = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    assignment = relationship("Assignment", back_populates="attachment_files")
    
    __table_args__ = (
        Index('idx_assignment_file_assignment', 'assignment_id'),
    )


class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey('assignments.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = Column(Text, nullable=True)
    submission_text = Column(Text, nullable=True)
    
    submitted_at = Column(DateTime, nullable=True, index=True)
    is_late = Column(Boolean, default=False, nullable=False, index=True)
    
    marks_obtained = Column(Numeric(10, 2), nullable=True)
    grade = Column(String(10), nullable=True)
    feedback = Column(Text, nullable=True)
    
    graded_by = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    graded_at = Column(DateTime, nullable=True)
    
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.NOT_SUBMITTED, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")
    grader = relationship("Teacher", foreign_keys=[graded_by], back_populates="graded_submissions")
    submission_files = relationship("SubmissionFile", back_populates="submission", cascade="all, delete-orphan")
    rubric_grades = relationship("SubmissionGrade", back_populates="submission", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student_submission'),
        Index('idx_submission_assignment', 'assignment_id'),
        Index('idx_submission_student', 'student_id'),
        Index('idx_submission_status', 'status'),
        Index('idx_submission_submitted_at', 'submitted_at'),
        Index('idx_submission_is_late', 'is_late'),
        Index('idx_submission_graded_by', 'graded_by'),
    )


class SubmissionFile(Base):
    __tablename__ = "submission_files"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    file_url = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    submission = relationship("Submission", back_populates="submission_files")
    
    __table_args__ = (
        Index('idx_submission_file_submission', 'submission_id'),
    )


class RubricCriteria(Base):
    __tablename__ = "rubric_criteria"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey('assignments.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    max_points = Column(Numeric(10, 2), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    assignment = relationship("Assignment", back_populates="rubric_criteria")
    levels = relationship("RubricLevel", back_populates="criteria", cascade="all, delete-orphan")
    grades = relationship("SubmissionGrade", back_populates="criteria", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_rubric_criteria_assignment', 'assignment_id'),
    )


class RubricLevel(Base):
    __tablename__ = "rubric_levels"
    
    id = Column(Integer, primary_key=True, index=True)
    criteria_id = Column(Integer, ForeignKey('rubric_criteria.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    points = Column(Numeric(10, 2), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    criteria = relationship("RubricCriteria", back_populates="levels")
    
    __table_args__ = (
        Index('idx_rubric_level_criteria', 'criteria_id'),
    )


class SubmissionGrade(Base):
    __tablename__ = "submission_grades"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False, index=True)
    criteria_id = Column(Integer, ForeignKey('rubric_criteria.id', ondelete='CASCADE'), nullable=False, index=True)
    points_awarded = Column(Numeric(10, 2), nullable=False)
    feedback = Column(Text, nullable=True)
    graded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    submission = relationship("Submission", back_populates="rubric_grades")
    criteria = relationship("RubricCriteria", back_populates="grades")
    
    __table_args__ = (
        UniqueConstraint('submission_id', 'criteria_id', name='uq_submission_criteria_grade'),
        Index('idx_submission_grade_submission', 'submission_id'),
        Index('idx_submission_grade_criteria', 'criteria_id'),
    )
