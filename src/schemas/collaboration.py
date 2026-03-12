from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator


class StudyBuddyProfileBase(BaseModel):
    subjects: List[int] = Field(..., description="List of subject IDs")
    performance_level: str = Field(..., description="Performance level: excellent, good, average, needs_improvement")
    study_schedule: Optional[Dict[str, Any]] = None
    preferred_study_times: Optional[List[str]] = None
    study_goals: Optional[str] = None
    learning_style: Optional[str] = Field(None, description="visual, auditory, kinesthetic, reading_writing")
    availability_days: Optional[List[str]] = None
    preferred_group_size: int = Field(4, ge=2, le=10)
    is_available: bool = True
    bio: Optional[str] = None


class StudyBuddyProfileCreate(StudyBuddyProfileBase):
    pass


class StudyBuddyProfileUpdate(BaseModel):
    subjects: Optional[List[int]] = None
    performance_level: Optional[str] = None
    study_schedule: Optional[Dict[str, Any]] = None
    preferred_study_times: Optional[List[str]] = None
    study_goals: Optional[str] = None
    learning_style: Optional[str] = None
    availability_days: Optional[List[str]] = None
    preferred_group_size: Optional[int] = None
    is_available: Optional[bool] = None
    bio: Optional[str] = None


class StudyBuddyProfileResponse(StudyBuddyProfileBase):
    id: int
    institution_id: int
    student_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudyBuddyMatchResponse(BaseModel):
    id: int
    institution_id: int
    requester_id: int
    matched_student_id: int
    match_score: float
    common_subjects: Optional[List[int]] = None
    match_reason: Optional[str] = None
    status: str
    created_at: datetime
    responded_at: Optional[datetime] = None
    matched_student: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class StudyBuddyMatchRequest(BaseModel):
    subject_ids: Optional[List[int]] = None
    performance_level: Optional[str] = None
    max_matches: int = Field(10, ge=1, le=50)


class StudySessionBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    scheduled_start: datetime
    scheduled_end: datetime
    video_platform: Optional[str] = Field(None, description="zoom, teams, meet, jitsi")
    meeting_link: Optional[str] = None
    max_participants: int = Field(10, ge=2, le=100)
    is_public: bool = True
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class StudySessionCreate(StudySessionBase):
    group_id: Optional[int] = None


class StudySessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    video_platform: Optional[str] = None
    meeting_link: Optional[str] = None
    max_participants: Optional[int] = None
    is_public: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class StudySessionResponse(StudySessionBase):
    id: int
    institution_id: int
    group_id: Optional[int] = None
    created_by: int
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    video_room_id: Optional[str] = None
    recording_url: Optional[str] = None
    participant_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionParticipantResponse(BaseModel):
    id: int
    session_id: int
    user_id: int
    joined_at: Optional[datetime] = None
    left_at: Optional[datetime] = None
    duration_minutes: int
    is_organizer: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SessionJoinRequest(BaseModel):
    session_id: int


class SessionStartRequest(BaseModel):
    video_room_id: Optional[str] = None


class CollaborativeNoteBase(BaseModel):
    title: str = Field(..., max_length=500)
    content: str
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    is_public: bool = False
    tags: Optional[List[str]] = None


class CollaborativeNoteCreate(CollaborativeNoteBase):
    group_id: Optional[int] = None
    session_id: Optional[int] = None


class CollaborativeNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    change_description: Optional[str] = None


class CollaborativeNoteResponse(CollaborativeNoteBase):
    id: int
    institution_id: int
    group_id: Optional[int] = None
    session_id: Optional[int] = None
    created_by: int
    version: int
    last_edited_by: Optional[int] = None
    view_count: int
    edit_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteEditorResponse(BaseModel):
    id: int
    note_id: int
    user_id: int
    can_edit: bool
    added_at: datetime
    last_edit_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NoteRevisionResponse(BaseModel):
    id: int
    note_id: int
    user_id: int
    content: str
    version: int
    change_description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AddNoteEditorRequest(BaseModel):
    user_id: int
    can_edit: bool = True


class PeerTutorProfileBase(BaseModel):
    expertise_subjects: List[int] = Field(..., description="List of subject IDs")
    hourly_rate: Optional[float] = Field(None, ge=0)
    availability_schedule: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None
    qualifications: Optional[str] = None
    is_active: bool = True


class PeerTutorProfileCreate(PeerTutorProfileBase):
    pass


class PeerTutorProfileUpdate(BaseModel):
    expertise_subjects: Optional[List[int]] = None
    hourly_rate: Optional[float] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None
    qualifications: Optional[str] = None
    is_active: Optional[bool] = None


class PeerTutorProfileResponse(PeerTutorProfileBase):
    id: int
    institution_id: int
    student_id: int
    user_id: int
    total_sessions: int
    average_rating: float
    total_earnings: float
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TutoringRequestBase(BaseModel):
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic: str = Field(..., max_length=500)
    description: str
    preferred_time: Optional[datetime] = None
    duration_minutes: int = Field(60, ge=30, le=180)
    offered_rate: Optional[float] = Field(None, ge=0)


class TutoringRequestCreate(TutoringRequestBase):
    pass


class TutoringRequestUpdate(BaseModel):
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    preferred_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    offered_rate: Optional[float] = None
    status: Optional[str] = None


class TutoringRequestResponse(TutoringRequestBase):
    id: int
    institution_id: int
    student_id: int
    tutor_id: Optional[int] = None
    status: str
    created_at: datetime
    matched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TutoringSessionBase(BaseModel):
    scheduled_start: datetime
    scheduled_end: datetime
    meeting_link: Optional[str] = None
    session_notes: Optional[str] = None
    payment_amount: Optional[float] = None


class TutoringSessionCreate(BaseModel):
    request_id: int
    tutor_id: int
    scheduled_start: datetime
    scheduled_end: datetime
    meeting_link: Optional[str] = None
    payment_amount: Optional[float] = None


class TutoringSessionUpdate(BaseModel):
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    meeting_link: Optional[str] = None
    session_notes: Optional[str] = None
    payment_amount: Optional[float] = None
    status: Optional[str] = None


class TutoringSessionResponse(TutoringSessionBase):
    id: int
    institution_id: int
    request_id: int
    tutor_id: int
    student_id: int
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    payment_status: str
    student_rating: Optional[int] = None
    student_feedback: Optional[str] = None
    tutor_notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TutoringSessionRatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None


class GroupPerformanceAnalyticsResponse(BaseModel):
    id: int
    institution_id: int
    group_id: int
    period_start: datetime
    period_end: datetime
    total_study_hours: float
    total_sessions: int
    average_attendance: float
    member_performance: Optional[Dict[str, Any]] = None
    subject_distribution: Optional[Dict[str, Any]] = None
    activity_metrics: Optional[Dict[str, Any]] = None
    engagement_score: float
    collaboration_score: float
    overall_performance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GenerateAnalyticsRequest(BaseModel):
    group_id: int
    period_start: datetime
    period_end: datetime


class TutorSearchRequest(BaseModel):
    subject_id: Optional[int] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    max_rate: Optional[float] = Field(None, ge=0)
    availability_day: Optional[str] = None
