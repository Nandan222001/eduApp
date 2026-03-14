from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal


class CollaborationGoalCreate(BaseModel):
    student_id: int
    teacher_id: int
    parent_id: int
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    measurable_target: str
    target_value: Optional[Decimal] = None
    unit: Optional[str] = None
    success_criteria: Optional[List[Dict[str, Any]]] = None
    start_date: date
    target_date: date
    metadata: Optional[Dict[str, Any]] = None


class CollaborationGoalUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    measurable_target: Optional[str] = None
    target_value: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    unit: Optional[str] = None
    success_criteria: Optional[List[Dict[str, Any]]] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    status: Optional[str] = None
    progress_percentage: Optional[Decimal] = None
    achievement_notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CollaborationGoalProgressCreate(BaseModel):
    goal_id: int
    new_value: Decimal
    notes: Optional[str] = None
    evidence_urls: Optional[List[str]] = None


class CollaborationGoalProgressResponse(BaseModel):
    id: int
    goal_id: int
    previous_value: Decimal
    new_value: Decimal
    progress_percentage: Decimal
    notes: Optional[str]
    evidence_urls: Optional[List[str]]
    recorded_by_user_id: Optional[int]
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class CollaborationGoalResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    teacher_id: int
    parent_id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    measurable_target: str
    target_value: Optional[Decimal]
    current_value: Decimal
    unit: Optional[str]
    success_criteria: Optional[List[Dict[str, Any]]]
    start_date: date
    target_date: date
    status: str
    progress_percentage: Decimal
    parent_agreed_at: Optional[datetime]
    teacher_agreed_at: Optional[datetime]
    achievement_notes: Optional[str]
    achieved_at: Optional[datetime]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    progress_updates: List[CollaborationGoalProgressResponse] = []

    class Config:
        from_attributes = True


class ConferenceAgendaItem(BaseModel):
    topic: str
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class ConferenceActionItem(BaseModel):
    action: str
    assigned_to: str
    due_date: Optional[date] = None
    completed: bool = False


class ParentTeacherConferenceCreate(BaseModel):
    student_id: int
    teacher_id: int
    parent_id: int
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: datetime
    location: Optional[str] = None
    meeting_type: str = Field(..., description="in_person, video_conference, phone")
    video_conference_platform: Optional[str] = None
    agenda: Optional[List[ConferenceAgendaItem]] = None


class ParentTeacherConferenceUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    location: Optional[str] = None
    meeting_type: Optional[str] = None
    video_conference_platform: Optional[str] = None
    agenda: Optional[List[ConferenceAgendaItem]] = None
    meeting_notes: Optional[str] = None
    action_items: Optional[List[ConferenceActionItem]] = None
    status: Optional[str] = None
    parent_attended: Optional[bool] = None
    teacher_attended: Optional[bool] = None


class ParentTeacherConferenceResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    teacher_id: int
    parent_id: int
    title: str
    description: Optional[str]
    scheduled_start: datetime
    scheduled_end: datetime
    location: Optional[str]
    meeting_type: str
    video_conference_url: Optional[str]
    video_conference_id: Optional[str]
    video_conference_password: Optional[str]
    video_conference_platform: Optional[str]
    agenda: Optional[List[Dict[str, Any]]]
    meeting_notes: Optional[str]
    action_items: Optional[List[Dict[str, Any]]]
    status: str
    actual_start: Optional[datetime]
    actual_end: Optional[datetime]
    parent_attended: bool
    teacher_attended: bool
    recording_url: Optional[str]
    attachments: Optional[List[Dict[str, Any]]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeacherCommitmentCreate(BaseModel):
    commitment: str
    target_date: Optional[date] = None


class TeacherCommitmentUpdate(BaseModel):
    commitment: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None
    progress_notes: Optional[str] = None


class TeacherCommitmentResponse(BaseModel):
    id: int
    action_plan_id: int
    commitment: str
    target_date: Optional[date]
    status: str
    progress_notes: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ParentCommitmentCreate(BaseModel):
    commitment: str
    target_date: Optional[date] = None


class ParentCommitmentUpdate(BaseModel):
    commitment: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None
    progress_notes: Optional[str] = None


class ParentCommitmentResponse(BaseModel):
    id: int
    action_plan_id: int
    commitment: str
    target_date: Optional[date]
    status: str
    progress_notes: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SharedActionPlanCreate(BaseModel):
    student_id: int
    teacher_id: int
    parent_id: int
    conference_id: Optional[int] = None
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    focus_area: Optional[str] = None
    start_date: date
    end_date: date
    teacher_commitments: List[TeacherCommitmentCreate] = []
    parent_commitments: List[ParentCommitmentCreate] = []


class SharedActionPlanUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    focus_area: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    review_notes: Optional[str] = None


class SharedActionPlanResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    teacher_id: int
    parent_id: int
    conference_id: Optional[int]
    title: str
    description: Optional[str]
    focus_area: Optional[str]
    start_date: date
    end_date: date
    status: str
    overall_progress_percentage: Decimal
    review_notes: Optional[str]
    last_reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    teacher_commitments: List[TeacherCommitmentResponse] = []
    parent_commitments: List[ParentCommitmentResponse] = []

    class Config:
        from_attributes = True


class HomeLearningActivityCreate(BaseModel):
    student_id: int
    teacher_id: int
    parent_id: int
    subject_id: Optional[int] = None
    title: str = Field(..., max_length=255)
    description: str
    learning_objectives: Optional[List[str]] = None
    classroom_topic: Optional[str] = None
    classroom_alignment_notes: Optional[str] = None
    instructions: Optional[str] = None
    materials_needed: Optional[List[str]] = None
    estimated_duration_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None
    resources: Optional[List[Dict[str, str]]] = None
    suggested_date: Optional[date] = None


class HomeLearningActivityUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    classroom_topic: Optional[str] = None
    classroom_alignment_notes: Optional[str] = None
    instructions: Optional[str] = None
    materials_needed: Optional[List[str]] = None
    estimated_duration_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None
    resources: Optional[List[Dict[str, str]]] = None
    suggested_date: Optional[date] = None
    parent_feedback: Optional[str] = None
    student_completed: Optional[bool] = None


class HomeLearningActivityResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    teacher_id: int
    parent_id: int
    subject_id: Optional[int]
    title: str
    description: str
    learning_objectives: Optional[List[str]]
    classroom_topic: Optional[str]
    classroom_alignment_notes: Optional[str]
    instructions: Optional[str]
    materials_needed: Optional[List[str]]
    estimated_duration_minutes: Optional[int]
    difficulty_level: Optional[str]
    resources: Optional[List[Dict[str, str]]]
    suggested_date: Optional[date]
    parent_feedback: Optional[str]
    parent_feedback_at: Optional[datetime]
    student_completed: bool
    student_completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ParentTeacherMessageThreadCreate(BaseModel):
    student_id: int
    teacher_id: int
    parent_id: int
    subject: str = Field(..., max_length=255)
    translation_enabled: bool = False
    parent_preferred_language: Optional[str] = None


class ParentTeacherMessageThreadResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    teacher_id: int
    parent_id: int
    subject: str
    status: str
    translation_enabled: bool
    parent_preferred_language: Optional[str]
    last_message_at: Optional[datetime]
    last_message_by_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ParentTeacherMessageCreate(BaseModel):
    thread_id: int
    content: str
    original_language: Optional[str] = None
    attachments: Optional[List[Dict[str, str]]] = None


class ParentTeacherMessageResponse(BaseModel):
    id: int
    thread_id: int
    sender_user_id: int
    content: str
    original_language: Optional[str]
    translated_content: Optional[Dict[str, str]]
    attachments: Optional[List[Dict[str, str]]]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CollaborationDocumentCreate(BaseModel):
    student_id: int
    teacher_id: int
    parent_id: int
    document_type: str
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    document_url: str
    requires_parent_signature: bool = True
    requires_teacher_signature: bool = True
    expires_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class CollaborationDocumentSignature(BaseModel):
    signature_url: str


class CollaborationDocumentReject(BaseModel):
    rejection_reason: str


class CollaborationDocumentResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    teacher_id: int
    parent_id: int
    document_type: str
    title: str
    description: Optional[str]
    document_url: str
    document_version: int
    requires_parent_signature: bool
    requires_teacher_signature: bool
    parent_signature_url: Optional[str]
    parent_signed_at: Optional[datetime]
    parent_signed_by_user_id: Optional[int]
    teacher_signature_url: Optional[str]
    teacher_signed_at: Optional[datetime]
    teacher_signed_by_user_id: Optional[int]
    status: str
    rejection_reason: Optional[str]
    rejected_by_user_id: Optional[int]
    rejected_at: Optional[datetime]
    expires_at: Optional[datetime]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
