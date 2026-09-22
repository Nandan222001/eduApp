from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from src.models.peer_tutoring import (
    TutorStatus, SessionStatus, SessionType, ReviewStatus,
    EndorsementType, IncentiveType, BadgeCategory, ModerationActionType
)


class TutorProfileBase(BaseModel):
    bio: Optional[str] = None
    subjects: Dict[str, Any] = Field(..., description="Dictionary of subjects and expertise levels")
    availability: Dict[str, Any] = Field(..., description="Dictionary of available time slots")
    hourly_rate: Decimal = Decimal("0.00")
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    video_intro_url: Optional[str] = Field(None, max_length=500)
    languages: Optional[List[str]] = None
    teaching_style: Optional[str] = None
    max_students_per_session: int = 1
    accepts_group_sessions: bool = False


class TutorProfileCreate(TutorProfileBase):
    user_id: int
    student_id: Optional[int] = None


class TutorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    subjects: Optional[Dict[str, Any]] = None
    availability: Optional[Dict[str, Any]] = None
    hourly_rate: Optional[Decimal] = None
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    video_intro_url: Optional[str] = Field(None, max_length=500)
    languages: Optional[List[str]] = None
    teaching_style: Optional[str] = None
    max_students_per_session: Optional[int] = None
    accepts_group_sessions: Optional[bool] = None
    status: Optional[TutorStatus] = None


class TutorProfileResponse(TutorProfileBase):
    id: int
    institution_id: int
    user_id: int
    student_id: Optional[int] = None
    status: TutorStatus
    total_sessions: int
    completed_sessions: int
    average_rating: Decimal
    total_reviews: int
    total_hours_tutored: Decimal
    total_points: int
    level: int
    current_streak: int
    longest_streak: int
    verification_status: bool
    background_check_completed: bool
    last_active_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TutoringSessionBase(BaseModel):
    subject_id: Optional[int] = None
    session_type: SessionType = SessionType.ONE_ON_ONE
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    topic: Optional[str] = Field(None, max_length=255)
    scheduled_start: datetime
    scheduled_end: datetime
    notes: Optional[str] = None


class TutoringSessionCreate(TutoringSessionBase):
    tutor_id: int
    student_id: int


class TutoringSessionUpdate(BaseModel):
    subject_id: Optional[int] = None
    session_type: Optional[SessionType] = None
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    topic: Optional[str] = Field(None, max_length=255)
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[SessionStatus] = None
    notes: Optional[str] = None
    tutor_notes: Optional[str] = None
    student_notes: Optional[str] = None
    materials_shared: Optional[Dict[str, Any]] = None


class TutoringSessionResponse(TutoringSessionBase):
    id: int
    institution_id: int
    tutor_id: int
    student_id: int
    status: SessionStatus
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_url: Optional[str] = None
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    video_platform: Optional[str] = None
    recording_url: Optional[str] = None
    tutor_notes: Optional[str] = None
    student_notes: Optional[str] = None
    materials_shared: Optional[Dict[str, Any]] = None
    points_awarded: int
    is_recorded: bool
    is_flagged: bool
    flagged_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionStartRequest(BaseModel):
    meeting_url: Optional[str] = Field(None, max_length=500)
    meeting_id: Optional[str] = Field(None, max_length=255)
    meeting_password: Optional[str] = Field(None, max_length=100)
    video_platform: Optional[str] = Field(None, max_length=50)


class SessionCompleteRequest(BaseModel):
    tutor_notes: Optional[str] = None
    materials_shared: Optional[Dict[str, Any]] = None
    recording_url: Optional[str] = Field(None, max_length=500)


class SessionCancelRequest(BaseModel):
    cancellation_reason: str


class TutorReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None
    knowledge_rating: Optional[int] = Field(None, ge=1, le=5)
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    patience_rating: Optional[int] = Field(None, ge=1, le=5)
    helpfulness_rating: Optional[int] = Field(None, ge=1, le=5)
    punctuality_rating: Optional[int] = Field(None, ge=1, le=5)
    is_anonymous: bool = False


class TutorReviewCreate(TutorReviewBase):
    session_id: int


class TutorReviewResponse(TutorReviewBase):
    id: int
    institution_id: int
    tutor_id: int
    session_id: int
    student_id: int
    status: ReviewStatus
    is_featured: bool
    helpful_count: int
    flagged_count: int
    moderated_by: Optional[int] = None
    moderation_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TutorEndorsementBase(BaseModel):
    endorsement_type: EndorsementType
    subject_id: Optional[int] = None
    comments: Optional[str] = None


class TutorEndorsementCreate(TutorEndorsementBase):
    tutor_id: int


class TutorEndorsementResponse(TutorEndorsementBase):
    id: int
    institution_id: int
    tutor_id: int
    endorser_id: int
    weight: int
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TutorBadgeResponse(BaseModel):
    id: int
    institution_id: int
    tutor_id: int
    name: str
    description: Optional[str] = None
    category: BadgeCategory
    icon_url: Optional[str] = None
    points_value: int
    rarity: Optional[str] = None
    criteria_met: Optional[Dict[str, Any]] = None
    earned_at: datetime
    is_displayed: bool
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class TutorIncentiveResponse(BaseModel):
    id: int
    institution_id: int
    tutor_id: int
    incentive_type: IncentiveType
    title: str
    description: Optional[str] = None
    value: Optional[Decimal] = None
    service_hours: Optional[Decimal] = None
    certificate_url: Optional[str] = None
    certificate_number: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_redeemed: bool
    redeemed_at: Optional[datetime] = None
    requirements_met: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TutorPointHistoryResponse(BaseModel):
    id: int
    institution_id: int
    tutor_id: int
    session_id: Optional[int] = None
    points: int
    reason: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionModerationLogBase(BaseModel):
    action_type: ModerationActionType
    reason: str
    details: Optional[str] = None
    quality_score: Optional[int] = Field(None, ge=0, le=100)
    safety_score: Optional[int] = Field(None, ge=0, le=100)


class SessionModerationLogCreate(SessionModerationLogBase):
    session_id: int


class SessionModerationLogResolve(BaseModel):
    resolution_notes: str


class SessionModerationLogResponse(SessionModerationLogBase):
    id: int
    institution_id: int
    session_id: int
    moderator_id: int
    auto_flagged: bool
    flag_reasons: Optional[Dict[str, Any]] = None
    resolved: bool
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TutorLeaderboardResponse(BaseModel):
    id: int
    institution_id: int
    tutor_id: int
    rank: int
    previous_rank: Optional[int] = None
    score: int
    period: str
    period_start: datetime
    period_end: datetime
    sessions_count: int
    total_hours: Decimal
    average_rating: Decimal
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaderboardEntryResponse(BaseModel):
    tutor_id: int
    tutor_name: str
    rank: int
    previous_rank: Optional[int] = None
    score: int
    sessions_count: int
    total_hours: Decimal
    average_rating: Decimal
    level: int
    badges_count: int


class LeaderboardListResponse(BaseModel):
    entries: List[LeaderboardEntryResponse]
    period: str
    period_start: datetime
    period_end: datetime
    total_tutors: int


class MatchingPreferenceBase(BaseModel):
    preferred_subjects: Optional[List[int]] = None
    preferred_tutors: Optional[List[int]] = None
    blocked_tutors: Optional[List[int]] = None
    learning_style: Optional[str] = Field(None, max_length=50)
    preferred_session_duration: Optional[int] = None
    preferred_times: Optional[Dict[str, Any]] = None
    language_preference: Optional[str] = Field(None, max_length=50)
    special_requirements: Optional[str] = None
    auto_match: bool = True


class MatchingPreferenceCreate(MatchingPreferenceBase):
    student_id: int


class MatchingPreferenceUpdate(MatchingPreferenceBase):
    pass


class MatchingPreferenceResponse(MatchingPreferenceBase):
    id: int
    institution_id: int
    student_id: int
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TutorMatchRequest(BaseModel):
    student_id: int
    subject_id: int
    preferred_time: Optional[datetime] = None
    session_duration: Optional[int] = 60
    session_type: SessionType = SessionType.ONE_ON_ONE


class TutorMatchScore(BaseModel):
    tutor_id: int
    tutor_name: str
    match_score: float
    subject_expertise: float
    availability_score: float
    rating_score: float
    compatibility_score: float
    total_sessions: int
    average_rating: Decimal
    reasons: List[str]


class TutorMatchResponse(BaseModel):
    matches: List[TutorMatchScore]
    total_matches: int


class TutorStatsResponse(BaseModel):
    tutor_id: int
    total_sessions: int
    completed_sessions: int
    cancelled_sessions: int
    no_show_sessions: int
    total_hours_tutored: Decimal
    average_rating: Decimal
    total_reviews: int
    rating_distribution: Dict[str, int]
    total_points: int
    level: int
    current_streak: int
    longest_streak: int
    badges_count: int
    endorsements_count: int
    subjects_taught: List[Dict[str, Any]]
    monthly_sessions: Dict[str, int]


class IncentiveEligibilityResponse(BaseModel):
    eligible: bool
    incentive_type: IncentiveType
    title: str
    description: str
    requirements: Dict[str, Any]
    progress: Dict[str, Any]
    completion_percentage: float


class SessionParticipantResponse(BaseModel):
    id: int
    institution_id: int
    session_id: int
    student_id: int
    joined_at: Optional[datetime] = None
    left_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    was_present: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
