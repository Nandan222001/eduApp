from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, Float, JSON
from sqlalchemy.orm import relationship
from src.database import Base


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class AlertType(str, Enum):
    SENTIMENT_DISTRESS = "sentiment_distress"
    ATTENDANCE_DROP = "attendance_drop"
    GRADE_DECLINE = "grade_decline"
    PARTICIPATION_DROP = "participation_drop"
    SOCIAL_ISOLATION = "social_isolation"
    BEHAVIORAL_CHANGE = "behavioral_change"
    MULTIPLE_INDICATORS = "multiple_indicators"


class SentimentCategory(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    DISTRESSED = "distressed"
    CRISIS = "crisis"


class ConsentStatus(str, Enum):
    PENDING = "pending"
    GRANTED = "granted"
    DENIED = "denied"
    REVOKED = "revoked"
    EXPIRED = "expired"


class DataAccessLevel(str, Enum):
    NONE = "none"
    BASIC = "basic"
    FULL = "full"
    EMERGENCY_ONLY = "emergency_only"


class WellbeingAlert(Base):
    __tablename__ = "wellbeing_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    alert_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    status = Column(String(20), default=AlertStatus.PENDING.value, nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False, index=True)
    
    detected_indicators = Column(JSON, nullable=False)
    recommended_actions = Column(JSON, nullable=False)
    metadata = Column(JSON, nullable=True)
    
    assigned_counselor_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    acknowledged_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    parent_notified = Column(Boolean, default=False, nullable=False)
    parent_notified_at = Column(DateTime, nullable=True)
    
    auto_detected = Column(Boolean, default=True, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    assigned_counselor = relationship("User", foreign_keys=[assigned_counselor_id])
    acknowledged_user = relationship("User", foreign_keys=[acknowledged_by])
    resolved_user = relationship("User", foreign_keys=[resolved_by])
    
    notes = relationship("AlertNote", back_populates="alert", cascade="all, delete-orphan")
    interventions = relationship("WellbeingIntervention", back_populates="alert", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_wellbeing_alert_institution', 'institution_id'),
        Index('idx_wellbeing_alert_student', 'student_id'),
        Index('idx_wellbeing_alert_type', 'alert_type'),
        Index('idx_wellbeing_alert_severity', 'severity'),
        Index('idx_wellbeing_alert_status', 'status'),
        Index('idx_wellbeing_alert_risk_score', 'risk_score'),
        Index('idx_wellbeing_alert_counselor', 'assigned_counselor_id'),
        Index('idx_wellbeing_alert_detected', 'detected_at'),
        Index('idx_wellbeing_alert_student_status', 'student_id', 'status'),
    )


class AlertNote(Base):
    __tablename__ = "alert_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey('wellbeing_alerts.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    is_confidential = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    alert = relationship("WellbeingAlert", back_populates="notes")
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_alert_note_alert', 'alert_id'),
        Index('idx_alert_note_creator', 'created_by'),
    )


class WellbeingIntervention(Base):
    __tablename__ = "wellbeing_interventions"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey('wellbeing_alerts.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    counselor_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    intervention_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    action_taken = Column(Text, nullable=False)
    
    scheduled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    outcome = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False, nullable=False)
    follow_up_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    alert = relationship("WellbeingAlert", back_populates="interventions")
    institution = relationship("Institution")
    student = relationship("Student")
    counselor = relationship("User")
    
    __table_args__ = (
        Index('idx_intervention_alert', 'alert_id'),
        Index('idx_intervention_institution', 'institution_id'),
        Index('idx_intervention_student', 'student_id'),
        Index('idx_intervention_counselor', 'counselor_id'),
        Index('idx_intervention_scheduled', 'scheduled_at'),
    )


class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    source_type = Column(String(50), nullable=False, index=True)
    source_id = Column(Integer, nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    sentiment_score = Column(Float, nullable=False, index=True)
    sentiment_category = Column(String(20), nullable=False, index=True)
    
    distress_indicators = Column(JSON, nullable=True)
    detected_keywords = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=False)
    
    flagged_for_review = Column(Boolean, default=False, nullable=False, index=True)
    reviewed = Column(Boolean, default=False, nullable=False)
    reviewed_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    institution = relationship("Institution")
    student = relationship("Student")
    reviewer = relationship("User")
    
    __table_args__ = (
        Index('idx_sentiment_institution', 'institution_id'),
        Index('idx_sentiment_student', 'student_id'),
        Index('idx_sentiment_source', 'source_type', 'source_id'),
        Index('idx_sentiment_category', 'sentiment_category'),
        Index('idx_sentiment_score', 'sentiment_score'),
        Index('idx_sentiment_flagged', 'flagged_for_review'),
        Index('idx_sentiment_student_created', 'student_id', 'created_at'),
    )


class BehavioralPattern(Base):
    __tablename__ = "behavioral_patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    pattern_type = Column(String(50), nullable=False, index=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    baseline_metrics = Column(JSON, nullable=False)
    current_metrics = Column(JSON, nullable=False)
    change_percentage = Column(Float, nullable=False, index=True)
    
    is_concerning = Column(Boolean, default=False, nullable=False, index=True)
    concern_level = Column(Float, nullable=False)
    
    details = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_behavioral_pattern_institution', 'institution_id'),
        Index('idx_behavioral_pattern_student', 'student_id'),
        Index('idx_behavioral_pattern_type', 'pattern_type'),
        Index('idx_behavioral_pattern_concerning', 'is_concerning'),
        Index('idx_behavioral_pattern_change', 'change_percentage'),
        Index('idx_behavioral_pattern_period', 'period_start', 'period_end'),
    )


class WellbeingConsent(Base):
    __tablename__ = "wellbeing_consents"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=True, index=True)
    
    consent_type = Column(String(100), nullable=False)
    status = Column(String(20), default=ConsentStatus.PENDING.value, nullable=False, index=True)
    data_access_level = Column(String(20), default=DataAccessLevel.BASIC.value, nullable=False)
    
    granted_by_parent = Column(Boolean, default=False, nullable=False)
    granted_by_student = Column(Boolean, default=False, nullable=False)
    
    consent_details = Column(JSON, nullable=True)
    restrictions = Column(JSON, nullable=True)
    
    granted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    revocation_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    parent = relationship("Parent")
    revoker = relationship("User")
    
    __table_args__ = (
        Index('idx_wellbeing_consent_institution', 'institution_id'),
        Index('idx_wellbeing_consent_student', 'student_id'),
        Index('idx_wellbeing_consent_parent', 'parent_id'),
        Index('idx_wellbeing_consent_status', 'status'),
        Index('idx_wellbeing_consent_expires', 'expires_at'),
    )


class WellbeingDataAccess(Base):
    __tablename__ = "wellbeing_data_access"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    access_type = Column(String(50), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(Integer, nullable=False)
    
    purpose = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    institution = relationship("Institution")
    user = relationship("User")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_data_access_institution', 'institution_id'),
        Index('idx_data_access_user', 'user_id'),
        Index('idx_data_access_student', 'student_id'),
        Index('idx_data_access_resource', 'resource_type', 'resource_id'),
        Index('idx_data_access_accessed', 'accessed_at'),
    )


class CounselorProfile(Base):
    __tablename__ = "counselor_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    license_number = Column(String(100), nullable=True)
    specializations = Column(JSON, nullable=True)
    qualifications = Column(JSON, nullable=True)
    bio = Column(Text, nullable=True)
    
    max_case_load = Column(Integer, default=50, nullable=False)
    current_case_load = Column(Integer, default=0, nullable=False)
    
    availability_schedule = Column(JSON, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    office_location = Column(String(255), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    can_handle_crisis = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_counselor_institution', 'institution_id'),
        Index('idx_counselor_user', 'user_id'),
        Index('idx_counselor_active', 'is_active'),
        Index('idx_counselor_crisis', 'can_handle_crisis'),
    )


class StudentWellbeingProfile(Base):
    __tablename__ = "student_wellbeing_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    current_risk_level = Column(String(20), default="low", nullable=False, index=True)
    overall_risk_score = Column(Float, default=0.0, nullable=False, index=True)
    
    sentiment_trend = Column(Float, default=0.0, nullable=False)
    attendance_trend = Column(Float, default=0.0, nullable=False)
    grade_trend = Column(Float, default=0.0, nullable=False)
    participation_trend = Column(Float, default=0.0, nullable=False)
    social_trend = Column(Float, default=0.0, nullable=False)
    
    total_alerts = Column(Integer, default=0, nullable=False)
    active_alerts = Column(Integer, default=0, nullable=False)
    resolved_alerts = Column(Integer, default=0, nullable=False)
    
    last_intervention_date = Column(DateTime, nullable=True)
    last_assessment_date = Column(DateTime, nullable=True)
    next_review_date = Column(DateTime, nullable=True)
    
    additional_info = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_wellbeing_profile_institution', 'institution_id'),
        Index('idx_wellbeing_profile_student', 'student_id'),
        Index('idx_wellbeing_profile_risk_level', 'current_risk_level'),
        Index('idx_wellbeing_profile_risk_score', 'overall_risk_score'),
        Index('idx_wellbeing_profile_next_review', 'next_review_date'),
    )


class MoodEntry(Base):
    __tablename__ = "mood_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    mood_rating = Column(Integer, nullable=False)
    mood_emoji = Column(String(10), nullable=False)
    journal_entry = Column(Text, nullable=True)
    date = Column(String(10), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_mood_entry_institution', 'institution_id'),
        Index('idx_mood_entry_student', 'student_id'),
        Index('idx_mood_entry_date', 'date'),
        Index('idx_mood_entry_student_date', 'student_id', 'date'),
    )


class WeeklySurvey(Base):
    __tablename__ = "weekly_surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    survey_type = Column(String(20), nullable=False, index=True)
    responses = Column(JSON, nullable=False)
    total_score = Column(Integer, nullable=False)
    severity_level = Column(String(50), nullable=False)
    week_start_date = Column(String(10), nullable=False, index=True)
    
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_weekly_survey_institution', 'institution_id'),
        Index('idx_weekly_survey_student', 'student_id'),
        Index('idx_weekly_survey_type', 'survey_type'),
        Index('idx_weekly_survey_week', 'week_start_date'),
        Index('idx_weekly_survey_student_type', 'student_id', 'survey_type'),
    )


class AnonymousReport(Base):
    __tablename__ = "anonymous_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    report_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    date_of_incident = Column(String(10), nullable=True)
    witnesses = Column(Text, nullable=True)
    
    status = Column(String(20), default='pending', nullable=False, index=True)
    severity = Column(String(20), default='medium', nullable=False, index=True)
    
    assigned_to = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    assigned_user = relationship("User")
    
    __table_args__ = (
        Index('idx_anonymous_report_institution', 'institution_id'),
        Index('idx_anonymous_report_type', 'report_type'),
        Index('idx_anonymous_report_status', 'status'),
        Index('idx_anonymous_report_severity', 'severity'),
        Index('idx_anonymous_report_created', 'created_at'),
    )


class ParentNotification(Base):
    __tablename__ = "parent_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey('wellbeing_alerts.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=True, index=True)
    
    notification_type = Column(String(20), nullable=False)
    severity_level = Column(String(20), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    
    alert = relationship("WellbeingAlert")
    student = relationship("Student")
    parent = relationship("Parent")
    
    __table_args__ = (
        Index('idx_parent_notification_alert', 'alert_id'),
        Index('idx_parent_notification_student', 'student_id'),
        Index('idx_parent_notification_parent', 'parent_id'),
        Index('idx_parent_notification_sent', 'sent_at'),
    )


class MentalHealthResource(Base):
    __tablename__ = "mental_health_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=True, index=True)
    
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    contact_info = Column(JSON, nullable=False)
    specializations = Column(JSON, nullable=True)
    availability = Column(String(255), nullable=True)
    age_group = Column(String(100), nullable=True)
    cost = Column(String(100), nullable=True)
    
    is_emergency = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    
    __table_args__ = (
        Index('idx_resource_institution', 'institution_id'),
        Index('idx_resource_type', 'type'),
        Index('idx_resource_emergency', 'is_emergency'),
        Index('idx_resource_active', 'is_active'),
    )


class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey('wellbeing_alerts.id', ondelete='SET NULL'), nullable=True, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey('mental_health_resources.id', ondelete='CASCADE'), nullable=False, index=True)
    counselor_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    referral_reason = Column(Text, nullable=False)
    referral_notes = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, index=True)
    status = Column(String(30), default='pending', nullable=False, index=True)
    
    referred_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    appointment_date = Column(DateTime, nullable=True)
    outcome = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    alert = relationship("WellbeingAlert")
    student = relationship("Student")
    institution = relationship("Institution")
    resource = relationship("MentalHealthResource")
    counselor = relationship("User")
    
    __table_args__ = (
        Index('idx_referral_alert', 'alert_id'),
        Index('idx_referral_student', 'student_id'),
        Index('idx_referral_institution', 'institution_id'),
        Index('idx_referral_resource', 'resource_id'),
        Index('idx_referral_counselor', 'counselor_id'),
        Index('idx_referral_status', 'status'),
        Index('idx_referral_priority', 'priority'),
    )
