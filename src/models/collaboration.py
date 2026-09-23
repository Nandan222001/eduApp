from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Index, JSON,
    Numeric, Text
)
from sqlalchemy.orm import relationship
from src.database import Base


class CollaborationGoalStatus(str, Enum):
    PROPOSED = "proposed"
    ACTIVE = "active"
    ACHIEVED = "achieved"
    ABANDONED = "abandoned"


class ConferenceStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class ActionPlanStatus(str, Enum):
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class CommitmentStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MISSED = "missed"


class MessageThreadStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    CLOSED = "closed"


class DocumentSignatureStatus(str, Enum):
    PENDING = "pending"
    PARENT_SIGNED = "parent_signed"
    TEACHER_SIGNED = "teacher_signed"
    FULLY_SIGNED = "fully_signed"
    REJECTED = "rejected"
    EXPIRED = "expired"


class CollaborationGoal(Base):
    __tablename__ = "collaboration_goals"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    measurable_target = Column(Text, nullable=False)
    target_value = Column(Numeric(10, 2), nullable=True)
    current_value = Column(Numeric(10, 2), default=0, nullable=False)
    unit = Column(String(50), nullable=True)
    success_criteria = Column(JSON, nullable=True)
    start_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)

    status = Column(String(20), default=CollaborationGoalStatus.PROPOSED.value, nullable=False, index=True)
    progress_percentage = Column(Numeric(5, 2), default=0, nullable=False)

    parent_agreed_at = Column(DateTime, nullable=True)
    teacher_agreed_at = Column(DateTime, nullable=True)
    achievement_notes = Column(Text, nullable=True)
    achieved_at = Column(DateTime, nullable=True)

    metadata_json = Column('metadata', JSON, nullable=True)

    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    teacher = relationship("Teacher")
    parent = relationship("Parent")
    created_by = relationship("User")
    progress_updates = relationship(
        "CollaborationGoalProgress", back_populates="goal", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('idx_collab_goal_institution_status', 'institution_id', 'status'),
        Index('idx_collab_goal_student', 'student_id'),
        Index('idx_collab_goal_teacher', 'teacher_id'),
        Index('idx_collab_goal_parent', 'parent_id'),
    )


class CollaborationGoalProgress(Base):
    __tablename__ = "collaboration_goal_progress"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey('collaboration_goals.id', ondelete='CASCADE'), nullable=False, index=True)

    previous_value = Column(Numeric(10, 2), nullable=False)
    new_value = Column(Numeric(10, 2), nullable=False)
    progress_percentage = Column(Numeric(5, 2), nullable=False)
    notes = Column(Text, nullable=True)
    evidence_urls = Column(JSON, nullable=True)

    recorded_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    goal = relationship("CollaborationGoal", back_populates="progress_updates")
    recorded_by = relationship("User")

    __table_args__ = (
        Index('idx_collab_goal_progress_goal', 'goal_id'),
    )


class ParentTeacherConference(Base):
    __tablename__ = "parent_teacher_conferences"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    meeting_type = Column(String(30), nullable=False)

    video_conference_url = Column(String(500), nullable=True)
    video_conference_id = Column(String(100), nullable=True)
    video_conference_password = Column(String(100), nullable=True)
    video_conference_platform = Column(String(50), nullable=True)

    agenda = Column(JSON, nullable=True)
    meeting_notes = Column(Text, nullable=True)
    action_items = Column(JSON, nullable=True)

    status = Column(String(20), default=ConferenceStatus.SCHEDULED.value, nullable=False, index=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    parent_attended = Column(Boolean, default=False, nullable=False)
    teacher_attended = Column(Boolean, default=False, nullable=False)
    recording_url = Column(String(500), nullable=True)
    attachments = Column(JSON, nullable=True)

    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    teacher = relationship("Teacher")
    parent = relationship("Parent")
    created_by = relationship("User")
    action_plans = relationship("SharedActionPlan", back_populates="conference")

    __table_args__ = (
        Index('idx_conference_institution_status', 'institution_id', 'status'),
        Index('idx_conference_student', 'student_id'),
        Index('idx_conference_teacher', 'teacher_id'),
        Index('idx_conference_parent', 'parent_id'),
        Index('idx_conference_scheduled_start', 'scheduled_start'),
    )


class SharedActionPlan(Base):
    __tablename__ = "shared_action_plans"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    conference_id = Column(
        Integer, ForeignKey('parent_teacher_conferences.id', ondelete='SET NULL'), nullable=True, index=True
    )

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    focus_area = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    status = Column(String(20), default=ActionPlanStatus.ACTIVE.value, nullable=False, index=True)
    overall_progress_percentage = Column(Numeric(5, 2), default=0, nullable=False)
    review_notes = Column(Text, nullable=True)
    last_reviewed_at = Column(DateTime, nullable=True)

    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    teacher = relationship("Teacher")
    parent = relationship("Parent")
    conference = relationship("ParentTeacherConference", back_populates="action_plans")
    created_by = relationship("User")
    teacher_commitments = relationship(
        "TeacherCommitment", back_populates="action_plan", cascade="all, delete-orphan"
    )
    parent_commitments = relationship(
        "ParentCommitment", back_populates="action_plan", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('idx_action_plan_institution_status', 'institution_id', 'status'),
        Index('idx_action_plan_student', 'student_id'),
        Index('idx_action_plan_teacher', 'teacher_id'),
        Index('idx_action_plan_parent', 'parent_id'),
    )


class TeacherCommitment(Base):
    __tablename__ = "teacher_commitments"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    action_plan_id = Column(
        Integer, ForeignKey('shared_action_plans.id', ondelete='CASCADE'), nullable=False, index=True
    )

    commitment = Column(Text, nullable=False)
    target_date = Column(Date, nullable=True)
    status = Column(String(20), default=CommitmentStatus.PENDING.value, nullable=False, index=True)
    progress_notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    action_plan = relationship("SharedActionPlan", back_populates="teacher_commitments")

    __table_args__ = (
        Index('idx_teacher_commitment_action_plan', 'action_plan_id'),
    )


class ParentCommitment(Base):
    __tablename__ = "parent_commitments"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    action_plan_id = Column(
        Integer, ForeignKey('shared_action_plans.id', ondelete='CASCADE'), nullable=False, index=True
    )

    commitment = Column(Text, nullable=False)
    target_date = Column(Date, nullable=True)
    status = Column(String(20), default=CommitmentStatus.PENDING.value, nullable=False, index=True)
    progress_notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    action_plan = relationship("SharedActionPlan", back_populates="parent_commitments")

    __table_args__ = (
        Index('idx_parent_commitment_action_plan', 'action_plan_id'),
    )


class HomeLearningActivity(Base):
    __tablename__ = "home_learning_activities"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    learning_objectives = Column(JSON, nullable=True)
    classroom_topic = Column(String(255), nullable=True)
    classroom_alignment_notes = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    materials_needed = Column(JSON, nullable=True)
    estimated_duration_minutes = Column(Integer, nullable=True)
    difficulty_level = Column(String(20), nullable=True)
    resources = Column(JSON, nullable=True)
    suggested_date = Column(Date, nullable=True)

    parent_feedback = Column(Text, nullable=True)
    parent_feedback_at = Column(DateTime, nullable=True)
    student_completed = Column(Boolean, default=False, nullable=False)
    student_completed_at = Column(DateTime, nullable=True)

    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    teacher = relationship("Teacher")
    parent = relationship("Parent")
    subject = relationship("Subject")
    created_by = relationship("User")

    __table_args__ = (
        Index('idx_home_activity_institution', 'institution_id'),
        Index('idx_home_activity_student', 'student_id'),
        Index('idx_home_activity_teacher', 'teacher_id'),
        Index('idx_home_activity_parent', 'parent_id'),
    )


class ParentTeacherMessageThread(Base):
    __tablename__ = "parent_teacher_message_threads"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)

    subject = Column(String(255), nullable=False)
    status = Column(String(20), default=MessageThreadStatus.ACTIVE.value, nullable=False, index=True)
    translation_enabled = Column(Boolean, default=False, nullable=False)
    parent_preferred_language = Column(String(10), nullable=True)

    last_message_at = Column(DateTime, nullable=True)
    last_message_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    teacher = relationship("Teacher")
    parent = relationship("Parent")
    last_message_by = relationship("User")
    messages = relationship(
        "ParentTeacherMessage", back_populates="thread", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index('idx_msg_thread_institution_status', 'institution_id', 'status'),
        Index('idx_msg_thread_student_teacher_parent', 'student_id', 'teacher_id', 'parent_id'),
    )


class ParentTeacherMessage(Base):
    __tablename__ = "parent_teacher_messages"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    thread_id = Column(
        Integer, ForeignKey('parent_teacher_message_threads.id', ondelete='CASCADE'), nullable=False, index=True
    )
    sender_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    content = Column(Text, nullable=False)
    original_language = Column(String(10), nullable=True)
    translated_content = Column(JSON, nullable=True)
    attachments = Column(JSON, nullable=True)

    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    thread = relationship("ParentTeacherMessageThread", back_populates="messages")
    sender = relationship("User")

    __table_args__ = (
        Index('idx_message_thread', 'thread_id'),
        Index('idx_message_institution', 'institution_id'),
    )


class CollaborationDocument(Base):
    __tablename__ = "collaboration_documents"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)

    document_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    document_url = Column(String(500), nullable=False)
    document_version = Column(Integer, default=1, nullable=False)

    requires_parent_signature = Column(Boolean, default=True, nullable=False)
    requires_teacher_signature = Column(Boolean, default=True, nullable=False)

    parent_signature_url = Column(String(500), nullable=True)
    parent_signed_at = Column(DateTime, nullable=True)
    parent_signed_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    parent_signature_ip = Column(String(45), nullable=True)

    teacher_signature_url = Column(String(500), nullable=True)
    teacher_signed_at = Column(DateTime, nullable=True)
    teacher_signed_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    teacher_signature_ip = Column(String(45), nullable=True)

    status = Column(String(20), default=DocumentSignatureStatus.PENDING.value, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    rejected_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    rejected_at = Column(DateTime, nullable=True)

    expires_at = Column(DateTime, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)

    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")
    teacher = relationship("Teacher")
    parent = relationship("Parent")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    parent_signed_by = relationship("User", foreign_keys=[parent_signed_by_user_id])
    teacher_signed_by = relationship("User", foreign_keys=[teacher_signed_by_user_id])
    rejected_by = relationship("User", foreign_keys=[rejected_by_user_id])

    __table_args__ = (
        Index('idx_collab_doc_institution_status', 'institution_id', 'status'),
        Index('idx_collab_doc_student', 'student_id'),
        Index('idx_collab_doc_teacher', 'teacher_id'),
        Index('idx_collab_doc_parent', 'parent_id'),
    )
