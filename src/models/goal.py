from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class GoalType(str, Enum):
    ATTENDANCE = "attendance"
    ASSIGNMENT = "assignment"
    EXAM = "exam"
    GRADE = "grade"
    SUBJECT = "subject"
    CUSTOM = "custom"


class GoalStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class GoalTemplate(Base):
    __tablename__ = "goal_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    goal_type = Column(SQLEnum(GoalType), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    default_target_value = Column(Numeric(10, 2), nullable=True)
    default_duration_days = Column(Integer, nullable=True)
    smart_criteria = Column(JSON, nullable=True)
    suggested_milestones = Column(JSON, nullable=True)
    points_reward = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    creator = relationship("User", foreign_keys=[created_by])
    goals = relationship("Goal", back_populates="template")
    
    __table_args__ = (
        Index('idx_goal_template_institution', 'institution_id'),
        Index('idx_goal_template_type', 'goal_type'),
        Index('idx_goal_template_active', 'is_active'),
    )


class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey('goal_templates.id', ondelete='SET NULL'), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    goal_type = Column(SQLEnum(GoalType), nullable=False, index=True)
    category = Column(String(100), nullable=True)
    
    specific = Column(Text, nullable=True)
    measurable = Column(Text, nullable=True)
    achievable = Column(Text, nullable=True)
    relevant = Column(Text, nullable=True)
    time_bound = Column(Text, nullable=True)
    
    target_value = Column(Numeric(10, 2), nullable=False)
    current_value = Column(Numeric(10, 2), default=0, nullable=False)
    unit = Column(String(50), nullable=True)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    status = Column(SQLEnum(GoalStatus), default=GoalStatus.DRAFT, nullable=False, index=True)
    progress_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    
    points_reward = Column(Integer, default=0, nullable=False)
    points_earned = Column(Integer, default=0, nullable=False)
    
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='SET NULL'), nullable=True, index=True)
    
    metadata_json = Column('metadata', JSON, nullable=True)
    
    completed_at = Column(DateTime, nullable=True)
    last_calculated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    template = relationship("GoalTemplate", back_populates="goals")
    subject = relationship("Subject")
    grade = relationship("Grade")
    milestones = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")
    progress_logs = relationship("GoalProgressLog", back_populates="goal", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_goal_institution', 'institution_id'),
        Index('idx_goal_user', 'user_id'),
        Index('idx_goal_template', 'template_id'),
        Index('idx_goal_type', 'goal_type'),
        Index('idx_goal_status', 'status'),
        Index('idx_goal_dates', 'start_date', 'end_date'),
        Index('idx_goal_subject', 'subject_id'),
        Index('idx_goal_grade', 'grade_id'),
    )


class GoalMilestone(Base):
    __tablename__ = "goal_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey('goals.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_value = Column(Numeric(10, 2), nullable=False)
    current_value = Column(Numeric(10, 2), default=0, nullable=False)
    order = Column(Integer, nullable=False)
    target_date = Column(Date, nullable=True)
    status = Column(SQLEnum(MilestoneStatus), default=MilestoneStatus.PENDING, nullable=False, index=True)
    progress_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    points_reward = Column(Integer, default=0, nullable=False)
    points_earned = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    goal = relationship("Goal", back_populates="milestones")
    
    __table_args__ = (
        Index('idx_goal_milestone_institution', 'institution_id'),
        Index('idx_milestone_goal', 'goal_id'),
        Index('idx_goal_milestone_status', 'status'),
        Index('idx_goal_milestone_order', 'goal_id', 'order'),
    )


class GoalProgressLog(Base):
    __tablename__ = "goal_progress_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey('goals.id', ondelete='CASCADE'), nullable=False, index=True)
    previous_value = Column(Numeric(10, 2), nullable=False)
    new_value = Column(Numeric(10, 2), nullable=False)
    change = Column(Numeric(10, 2), nullable=False)
    previous_percentage = Column(Numeric(5, 2), nullable=False)
    new_percentage = Column(Numeric(5, 2), nullable=False)
    notes = Column(Text, nullable=True)
    data_source = Column(String(100), nullable=True)
    reference_id = Column(Integer, nullable=True)
    reference_type = Column(String(50), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    goal = relationship("Goal", back_populates="progress_logs")
    
    __table_args__ = (
        Index('idx_progress_log_institution', 'institution_id'),
        Index('idx_progress_log_goal', 'goal_id'),
        Index('idx_progress_log_recorded', 'recorded_at'),
        Index('idx_progress_log_reference', 'reference_type', 'reference_id'),
    )


class GoalAnalytics(Base):
    __tablename__ = "goal_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    total_goals = Column(Integer, default=0, nullable=False)
    active_goals = Column(Integer, default=0, nullable=False)
    completed_goals = Column(Integer, default=0, nullable=False)
    failed_goals = Column(Integer, default=0, nullable=False)
    
    completion_rate = Column(Numeric(5, 2), default=0, nullable=False)
    average_progress = Column(Numeric(5, 2), default=0, nullable=False)
    total_points_earned = Column(Integer, default=0, nullable=False)
    
    goals_this_month = Column(Integer, default=0, nullable=False)
    goals_this_quarter = Column(Integer, default=0, nullable=False)
    goals_this_year = Column(Integer, default=0, nullable=False)
    
    completed_this_month = Column(Integer, default=0, nullable=False)
    completed_this_quarter = Column(Integer, default=0, nullable=False)
    completed_this_year = Column(Integer, default=0, nullable=False)
    
    last_calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'user_id', name='uq_institution_user_goal_analytics'),
        Index('idx_goal_analytics_institution', 'institution_id'),
        Index('idx_goal_analytics_user', 'user_id'),
    )
