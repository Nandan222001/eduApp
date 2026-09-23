from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from src.database import Base


class ApplicationStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    DECISION_RECEIVED = "decision_received"


class DecisionOutcome(str, Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WAITLISTED = "waitlisted"
    DEFERRED = "deferred"


class CollegeVisit(Base):
    __tablename__ = "college_visits"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    college_name = Column(String(255), nullable=False)
    visit_date = Column(Date, nullable=False)
    visit_type = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    photos = Column(JSON, nullable=True)
    rating = Column(Integer, nullable=True)
    impression_score = Column(Numeric(5, 2), nullable=True)
    pros_cons = Column(JSON, nullable=True)
    follow_up_actions = Column(JSON, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")

    __table_args__ = (
        Index('idx_college_visit_institution', 'institution_id'),
        Index('idx_college_visit_student', 'student_id'),
        Index('idx_college_visit_visit_date', 'visit_date'),
    )


class CollegeApplication(Base):
    __tablename__ = "college_applications"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)

    college_name = Column(String(255), nullable=False)
    application_type = Column(String(50), nullable=False)
    deadline = Column(Date, nullable=False)
    application_portal_url = Column(String(500), nullable=True)
    # Plain strings (not a DB-level enum) to match the API schema, which
    # treats these as free-form str -- ApplicationStatus/DecisionOutcome
    # exist for the service layer's own comparisons.
    application_status = Column(String(30), default=ApplicationStatus.NOT_STARTED.value, nullable=False, index=True)
    decision_outcome = Column(String(30), nullable=True)
    financial_aid_offered = Column(Numeric(10, 2), nullable=True)
    scholarship_amount = Column(Numeric(10, 2), nullable=True)
    deposit_deadline = Column(Date, nullable=True)
    common_app_essay = Column(Boolean, default=False, nullable=False)
    supplemental_essays = Column(JSON, nullable=True)
    recommendation_letters = Column(JSON, nullable=True)
    test_scores = Column(JSON, nullable=True)
    transcript_requested = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    student = relationship("Student")

    __table_args__ = (
        Index('idx_college_app_institution', 'institution_id'),
        Index('idx_college_app_student', 'student_id'),
        Index('idx_college_app_deadline', 'deadline'),
        Index('idx_college_app_status', 'application_status'),
    )
