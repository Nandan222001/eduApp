from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text, JSON, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship
from src.database import Base


class FamilyGroup(Base):
    __tablename__ = "family_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    parent = relationship("Parent")
    children = relationship("FamilyGroupMember", back_populates="family_group", cascade="all, delete-orphan")
    calendar_events = relationship("FamilyCalendarEvent", back_populates="family_group", cascade="all, delete-orphan")
    notifications = relationship("FamilyNotificationBatch", back_populates="family_group", cascade="all, delete-orphan")
    shared_expenses = relationship("SharedExpense", back_populates="family_group", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_family_group_institution', 'institution_id'),
        Index('idx_family_group_parent', 'parent_id'),
        Index('idx_family_group_active', 'is_active'),
    )


class FamilyGroupMember(Base):
    __tablename__ = "family_group_members"
    
    id = Column(Integer, primary_key=True, index=True)
    family_group_id = Column(Integer, ForeignKey('family_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    display_color = Column(String(7), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family_group = relationship("FamilyGroup", back_populates="children")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('family_group_id', 'student_id', name='uq_family_group_student'),
        Index('idx_family_member_group', 'family_group_id'),
        Index('idx_family_member_student', 'student_id'),
    )


class FamilyEventType(str, Enum):
    ASSIGNMENT = "assignment"
    EXAM = "exam"
    CONFERENCE = "conference"
    EVENT = "event"
    CUSTOM = "custom"


class FamilyCalendarEvent(Base):
    __tablename__ = "family_calendar_events"
    
    id = Column(Integer, primary_key=True, index=True)
    family_group_id = Column(Integer, ForeignKey('family_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    family_group = relationship("FamilyGroup", back_populates="calendar_events")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_family_calendar_group', 'family_group_id'),
        Index('idx_family_calendar_student', 'student_id'),
        Index('idx_family_calendar_type', 'event_type'),
        Index('idx_family_calendar_dates', 'start_date', 'end_date'),
    )


class ComparisonMetricType(str, Enum):
    PERFORMANCE = "performance"
    ATTENDANCE = "attendance"
    BEHAVIOR = "behavior"
    ASSIGNMENT_COMPLETION = "assignment_completion"


class SiblingComparison(Base):
    __tablename__ = "sibling_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    family_group_id = Column(Integer, ForeignKey('family_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    metric_type = Column(String(50), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    comparison_data = Column(JSON, nullable=False)
    insights = Column(JSON, nullable=True)
    privacy_level = Column(String(20), default='aggregated', nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    family_group = relationship("FamilyGroup")
    
    __table_args__ = (
        Index('idx_sibling_comparison_group', 'family_group_id'),
        Index('idx_sibling_comparison_metric', 'metric_type'),
        Index('idx_sibling_comparison_period', 'period_start', 'period_end'),
    )


class FamilyNotificationBatch(Base):
    __tablename__ = "family_notification_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    family_group_id = Column(Integer, ForeignKey('family_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    batch_date = Column(Date, nullable=False, index=True)
    notification_count = Column(Integer, default=0, nullable=False)
    summary = Column(JSON, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    family_group = relationship("FamilyGroup", back_populates="notifications")
    items = relationship("FamilyNotificationItem", back_populates="batch", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_family_notification_batch_group', 'family_group_id'),
        Index('idx_family_notification_batch_date', 'batch_date'),
        Index('idx_family_notification_batch_read', 'is_read'),
    )


class FamilyNotificationItem(Base):
    __tablename__ = "family_notification_items"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey('family_notification_batches.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    notification_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default='medium', nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    batch = relationship("FamilyNotificationBatch", back_populates="items")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_family_notification_item_batch', 'batch_id'),
        Index('idx_family_notification_item_student', 'student_id'),
        Index('idx_family_notification_item_type', 'notification_type'),
    )


class ExpenseSplitType(str, Enum):
    EQUAL = "equal"
    WEIGHTED = "weighted"
    CUSTOM = "custom"


class SharedExpense(Base):
    __tablename__ = "shared_expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    family_group_id = Column(Integer, ForeignKey('family_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    expense_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    split_type = Column(String(20), default=ExpenseSplitType.EQUAL.value, nullable=False)
    due_date = Column(Date, nullable=True, index=True)
    is_paid = Column(Boolean, default=False, nullable=False, index=True)
    paid_at = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(255), nullable=True)
    receipt_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    family_group = relationship("FamilyGroup", back_populates="shared_expenses")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_shared_expense_institution', 'institution_id'),
        Index('idx_shared_expense_group', 'family_group_id'),
        Index('idx_shared_expense_due_date', 'due_date'),
        Index('idx_shared_expense_paid', 'is_paid'),
    )


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey('shared_expenses.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    weight = Column(Numeric(5, 2), nullable=True)
    is_paid = Column(Boolean, default=False, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    expense = relationship("SharedExpense", back_populates="splits")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('expense_id', 'student_id', name='uq_expense_student_split'),
        Index('idx_expense_split_expense', 'expense_id'),
        Index('idx_expense_split_student', 'student_id'),
        Index('idx_expense_split_paid', 'is_paid'),
    )


class FamilyDashboardWidget(Base):
    __tablename__ = "family_dashboard_widgets"
    
    id = Column(Integer, primary_key=True, index=True)
    family_group_id = Column(Integer, ForeignKey('family_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    widget_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    position = Column(Integer, default=0, nullable=False)
    config = Column(JSON, nullable=True)
    is_visible = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    family_group = relationship("FamilyGroup")
    
    __table_args__ = (
        Index('idx_family_widget_group', 'family_group_id'),
        Index('idx_family_widget_type', 'widget_type'),
        Index('idx_family_widget_position', 'position'),
    )
