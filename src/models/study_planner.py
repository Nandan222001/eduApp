from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class StudyPlanStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    RESCHEDULED = "rescheduled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class StudyPlan(Base):
    __tablename__ = "study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_exam_id = Column(Integer, ForeignKey('exams.id', ondelete='SET NULL'), nullable=True, index=True)
    target_exam_date = Column(Date, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(SQLEnum(StudyPlanStatus), default=StudyPlanStatus.DRAFT, nullable=False, index=True)
    total_study_hours = Column(Numeric(10, 2), nullable=True)
    hours_per_day = Column(Numeric(5, 2), nullable=True)
    calendar_sync_enabled = Column(Boolean, default=False, nullable=False)
    calendar_sync_url = Column(String(500), nullable=True)
    adaptive_rescheduling_enabled = Column(Boolean, default=True, nullable=False)
    last_rescheduled_at = Column(DateTime, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student", back_populates="study_plans")
    target_exam = relationship("Exam")
    daily_tasks = relationship("DailyStudyTask", back_populates="study_plan", cascade="all, delete-orphan")
    topic_assignments = relationship("TopicAssignment", back_populates="study_plan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_study_plan_institution', 'institution_id'),
        Index('idx_study_plan_student', 'student_id'),
        Index('idx_study_plan_status', 'status'),
        Index('idx_study_plan_target_exam', 'target_exam_id'),
        Index('idx_study_plan_dates', 'start_date', 'end_date'),
    )


class WeakArea(Base):
    __tablename__ = "weak_areas"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    weakness_score = Column(Numeric(5, 2), nullable=False)
    average_score = Column(Numeric(5, 2), nullable=True)
    attempts_count = Column(Integer, default=0, nullable=False)
    last_attempted_at = Column(DateTime, nullable=True)
    identified_from = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student", back_populates="weak_areas")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    topic = relationship("Topic")
    
    __table_args__ = (
        Index('idx_weak_area_institution', 'institution_id'),
        Index('idx_weak_area_student', 'student_id'),
        Index('idx_weak_area_subject', 'subject_id'),
        Index('idx_weak_area_chapter', 'chapter_id'),
        Index('idx_weak_area_topic', 'topic_id'),
        Index('idx_weak_area_resolved', 'is_resolved'),
        Index('idx_weak_area_weakness_score', 'weakness_score'),
    )


class DailyStudyTask(Base):
    __tablename__ = "daily_study_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    study_plan_id = Column(Integer, ForeignKey('study_plans.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    task_date = Column(Date, nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False, index=True)
    priority_score = Column(Numeric(10, 4), nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=False)
    actual_duration_minutes = Column(Integer, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    completion_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    skipped_reason = Column(Text, nullable=True)
    rescheduled_from_date = Column(Date, nullable=True)
    rescheduled_to_date = Column(Date, nullable=True)
    rescheduled_reason = Column(Text, nullable=True)
    calendar_event_id = Column(String(200), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    study_plan = relationship("StudyPlan", back_populates="daily_tasks")
    student = relationship("Student")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    topic = relationship("Topic")
    
    __table_args__ = (
        Index('idx_daily_task_institution', 'institution_id'),
        Index('idx_daily_task_study_plan', 'study_plan_id'),
        Index('idx_daily_task_student', 'student_id'),
        Index('idx_daily_task_date', 'task_date'),
        Index('idx_daily_task_subject', 'subject_id'),
        Index('idx_daily_task_status', 'status'),
        Index('idx_daily_task_priority', 'priority'),
        Index('idx_daily_task_student_date', 'student_id', 'task_date'),
    )


class TopicAssignment(Base):
    __tablename__ = "topic_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    study_plan_id = Column(Integer, ForeignKey('study_plans.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    priority_score = Column(Numeric(10, 4), nullable=False)
    importance_probability = Column(Numeric(5, 4), nullable=True)
    weakness_score = Column(Numeric(5, 2), nullable=True)
    subject_weightage = Column(Numeric(5, 2), nullable=True)
    allocated_hours = Column(Numeric(5, 2), nullable=False)
    completed_hours = Column(Numeric(5, 2), default=0, nullable=False)
    target_completion_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    study_plan = relationship("StudyPlan", back_populates="topic_assignments")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    topic = relationship("Topic")
    
    __table_args__ = (
        UniqueConstraint('study_plan_id', 'topic_id', name='uq_study_plan_topic'),
        Index('idx_topic_assignment_institution', 'institution_id'),
        Index('idx_topic_assignment_study_plan', 'study_plan_id'),
        Index('idx_topic_assignment_subject', 'subject_id'),
        Index('idx_topic_assignment_priority', 'priority_score'),
        Index('idx_topic_assignment_completed', 'is_completed'),
    )


class StudyProgress(Base):
    __tablename__ = "study_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    study_plan_id = Column(Integer, ForeignKey('study_plans.id', ondelete='CASCADE'), nullable=False, index=True)
    progress_date = Column(Date, nullable=False, index=True)
    total_tasks = Column(Integer, nullable=False)
    completed_tasks = Column(Integer, nullable=False)
    skipped_tasks = Column(Integer, nullable=False)
    total_study_hours = Column(Numeric(5, 2), nullable=False)
    actual_study_hours = Column(Numeric(5, 2), nullable=False)
    completion_rate = Column(Numeric(5, 2), nullable=False)
    adherence_score = Column(Numeric(5, 2), nullable=True)
    productivity_score = Column(Numeric(5, 2), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    study_plan = relationship("StudyPlan")
    
    __table_args__ = (
        UniqueConstraint('study_plan_id', 'progress_date', name='uq_study_plan_progress_date'),
        Index('idx_study_progress_institution', 'institution_id'),
        Index('idx_study_progress_student', 'student_id'),
        Index('idx_study_progress_study_plan', 'study_plan_id'),
        Index('idx_study_progress_date', 'progress_date'),
    )
