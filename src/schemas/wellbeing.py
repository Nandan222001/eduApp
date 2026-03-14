from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SentimentAnalysisBase(BaseModel):
    source_type: str
    source_id: int
    content: str
    sentiment_score: float
    sentiment_category: str
    distress_indicators: Optional[Dict[str, Any]] = None
    detected_keywords: Optional[Dict[str, Any]] = None
    confidence_score: float


class SentimentAnalysisCreate(SentimentAnalysisBase):
    institution_id: int
    student_id: int


class SentimentAnalysisResponse(SentimentAnalysisBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    flagged_for_review: bool
    reviewed: bool
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class BehavioralPatternBase(BaseModel):
    pattern_type: str
    period_start: datetime
    period_end: datetime
    baseline_metrics: Dict[str, Any]
    current_metrics: Dict[str, Any]
    change_percentage: float
    is_concerning: bool
    concern_level: float
    details: Optional[Dict[str, Any]] = None


class BehavioralPatternCreate(BehavioralPatternBase):
    institution_id: int
    student_id: int


class BehavioralPatternResponse(BehavioralPatternBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    created_at: datetime
    updated_at: datetime


class WellbeingAlertBase(BaseModel):
    alert_type: str
    severity: str
    title: str
    description: str
    risk_score: float
    detected_indicators: Dict[str, Any]
    recommended_actions: List[str]
    metadata: Optional[Dict[str, Any]] = None


class WellbeingAlertCreate(WellbeingAlertBase):
    institution_id: int
    student_id: int
    auto_detected: bool = True


class WellbeingAlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_counselor_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    parent_notified: Optional[bool] = None


class WellbeingAlertResponse(WellbeingAlertBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    status: str
    assigned_counselor_id: Optional[int] = None
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    parent_notified: bool
    parent_notified_at: Optional[datetime] = None
    auto_detected: bool
    detected_at: datetime
    created_at: datetime
    updated_at: datetime


class AlertNoteBase(BaseModel):
    content: str
    is_confidential: bool = True


class AlertNoteCreate(AlertNoteBase):
    alert_id: int


class AlertNoteResponse(AlertNoteBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    alert_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime


class WellbeingInterventionBase(BaseModel):
    intervention_type: str
    description: str
    action_taken: str
    scheduled_at: Optional[datetime] = None
    outcome: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None


class WellbeingInterventionCreate(WellbeingInterventionBase):
    alert_id: int
    institution_id: int
    student_id: int
    counselor_id: int


class WellbeingInterventionUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    outcome: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[datetime] = None


class WellbeingInterventionResponse(WellbeingInterventionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    alert_id: int
    institution_id: int
    student_id: int
    counselor_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class WellbeingConsentBase(BaseModel):
    consent_type: str
    data_access_level: str
    granted_by_parent: bool = False
    granted_by_student: bool = False
    consent_details: Optional[Dict[str, Any]] = None
    restrictions: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None


class WellbeingConsentCreate(WellbeingConsentBase):
    institution_id: int
    student_id: int
    parent_id: Optional[int] = None


class WellbeingConsentUpdate(BaseModel):
    status: Optional[str] = None
    data_access_level: Optional[str] = None
    revocation_reason: Optional[str] = None


class WellbeingConsentResponse(WellbeingConsentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    parent_id: Optional[int] = None
    status: str
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[int] = None
    revocation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CounselorProfileBase(BaseModel):
    license_number: Optional[str] = None
    specializations: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    bio: Optional[str] = None
    max_case_load: int = 50
    availability_schedule: Optional[Dict[str, Any]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    office_location: Optional[str] = None
    can_handle_crisis: bool = False


class CounselorProfileCreate(CounselorProfileBase):
    institution_id: int
    user_id: int


class CounselorProfileUpdate(BaseModel):
    specializations: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    bio: Optional[str] = None
    max_case_load: Optional[int] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    office_location: Optional[str] = None
    is_active: Optional[bool] = None
    can_handle_crisis: Optional[bool] = None


class CounselorProfileResponse(CounselorProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: int
    current_case_load: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudentWellbeingProfileBase(BaseModel):
    current_risk_level: str
    overall_risk_score: float
    sentiment_trend: float
    attendance_trend: float
    grade_trend: float
    participation_trend: float
    social_trend: float
    additional_info: Optional[Dict[str, Any]] = None


class StudentWellbeingProfileResponse(StudentWellbeingProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    total_alerts: int
    active_alerts: int
    resolved_alerts: int
    last_intervention_date: Optional[datetime] = None
    last_assessment_date: Optional[datetime] = None
    next_review_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CounselorDashboardStats(BaseModel):
    total_students_monitored: int
    active_alerts_count: int
    critical_alerts_count: int
    high_risk_students: int
    medium_risk_students: int
    pending_interventions: int
    overdue_reviews: int


class StudentRiskSummary(BaseModel):
    student_id: int
    student_name: str
    risk_level: str
    risk_score: float
    active_alerts: int
    latest_alert: Optional[WellbeingAlertResponse] = None
    trends: Dict[str, float]
    last_intervention: Optional[datetime] = None
    assigned_counselor_id: Optional[int] = None


class CounselorDashboardResponse(BaseModel):
    stats: CounselorDashboardStats
    high_priority_students: List[StudentRiskSummary]
    recent_alerts: List[WellbeingAlertResponse]
    pending_interventions: List[WellbeingInterventionResponse]


class SentimentAnalysisRequest(BaseModel):
    content: str
    source_type: str
    source_id: int
    student_id: int


class BehavioralAnalysisRequest(BaseModel):
    student_id: int
    analysis_period_days: int = 30


class StudentWellbeingReportRequest(BaseModel):
    student_id: int
    start_date: datetime
    end_date: datetime
    include_sentiments: bool = True
    include_behavioral_patterns: bool = True
    include_interventions: bool = True


class DataAccessLogRequest(BaseModel):
    resource_type: str
    resource_id: int
    purpose: str


class MoodEntryBase(BaseModel):
    mood_rating: int
    mood_emoji: str
    journal_entry: Optional[str] = None
    date: str


class MoodEntryCreate(MoodEntryBase):
    institution_id: int
    student_id: int


class MoodEntryResponse(MoodEntryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    created_at: datetime


class WeeklySurveyBase(BaseModel):
    survey_type: str
    responses: Dict[str, int]
    total_score: int
    severity_level: str
    week_start_date: str


class WeeklySurveyCreate(WeeklySurveyBase):
    institution_id: int
    student_id: int


class WeeklySurveyResponse(WeeklySurveyBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    completed_at: datetime


class AnonymousReportBase(BaseModel):
    report_type: str
    description: str
    location: Optional[str] = None
    date_of_incident: Optional[str] = None
    witnesses: Optional[str] = None
    severity: str = "medium"


class AnonymousReportCreate(AnonymousReportBase):
    institution_id: int


class AnonymousReportUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None


class AnonymousReportResponse(AnonymousReportBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    status: str
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ParentNotificationBase(BaseModel):
    notification_type: str
    severity_level: str
    subject: str
    message: str


class ParentNotificationCreate(ParentNotificationBase):
    alert_id: int
    student_id: int
    parent_id: Optional[int] = None


class ParentNotificationResponse(ParentNotificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    alert_id: int
    student_id: int
    parent_id: Optional[int] = None
    sent_at: datetime
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None


class MentalHealthResourceBase(BaseModel):
    name: str
    type: str
    description: str
    contact_info: Dict[str, Any]
    specializations: Optional[List[str]] = None
    availability: Optional[str] = None
    age_group: Optional[str] = None
    cost: Optional[str] = None
    is_emergency: bool = False
    is_active: bool = True


class MentalHealthResourceCreate(MentalHealthResourceBase):
    institution_id: Optional[int] = None


class MentalHealthResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    specializations: Optional[List[str]] = None
    availability: Optional[str] = None
    age_group: Optional[str] = None
    cost: Optional[str] = None
    is_emergency: Optional[bool] = None
    is_active: Optional[bool] = None


class MentalHealthResourceResponse(MentalHealthResourceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ReferralBase(BaseModel):
    referral_reason: str
    referral_notes: Optional[str] = None
    priority: str


class ReferralCreate(ReferralBase):
    alert_id: Optional[int] = None
    student_id: int
    institution_id: int
    resource_id: int
    counselor_id: int


class ReferralUpdate(BaseModel):
    status: Optional[str] = None
    appointment_date: Optional[datetime] = None
    outcome: Optional[str] = None
    completed_at: Optional[datetime] = None


class ReferralResponse(ReferralBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    alert_id: Optional[int] = None
    student_id: int
    institution_id: int
    resource_id: int
    counselor_id: int
    status: str
    referred_at: datetime
    appointment_date: Optional[datetime] = None
    outcome: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
