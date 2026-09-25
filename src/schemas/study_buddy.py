from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class StudyBuddyMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    context: Optional[Dict[str, Any]] = None


class StudyBuddyMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    role: str
    content: str
    # The ORM model maps this DB column to the Python attribute
    # `metadata_json` (SQLAlchemy's declarative `Base` already reserves the
    # bare `metadata` name for the class-level `MetaData` object), so
    # reading `metadata` via `from_attributes` here used to fetch that
    # `MetaData` instance instead of the JSON payload and fail Pydantic
    # validation with a 500 on every `GET /sessions/{id}/messages` call
    # whose messages carried metadata. Aliased to read/write the real
    # attribute while keeping the public field name unchanged.
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias="metadata_json", serialization_alias="metadata")
    created_at: datetime


class StudyBuddySessionCreate(BaseModel):
    student_id: int
    session_title: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class StudyBuddySessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    session_title: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_messages: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class StudyBuddyChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: str = Field(..., min_length=1)
    context: Optional[Dict[str, Any]] = None


class StudyBuddyChatResponse(BaseModel):
    session_id: int
    response: str
    suggestions: Optional[List[str]] = None
    related_topics: Optional[List[Dict[str, Any]]] = None


class StudyPatternAnalysis(BaseModel):
    strong_subjects: List[Dict[str, Any]]
    weak_subjects: List[Dict[str, Any]]
    study_hours_trend: List[Dict[str, Any]]
    performance_trend: List[Dict[str, Any]]
    consistency_score: float
    recommendations: List[str]


class DailyStudyPlan(BaseModel):
    date: str
    total_study_hours: float
    tasks: List[Dict[str, Any]]
    break_intervals: List[Dict[str, Any]]
    priority_areas: List[str]
    motivational_tips: List[str]


class MotivationalMessage(BaseModel):
    message: str
    type: str
    tips: Optional[List[str]] = None
    encouragement: Optional[str] = None


class StudyBuddyInsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    insight_type: str
    title: str
    content: str
    priority: int
    is_read: bool
    read_at: Optional[datetime] = None
    # Same `metadata`/`metadata_json` attribute-name mismatch as
    # `StudyBuddyMessageResponse` above.
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias="metadata_json", serialization_alias="metadata")
    created_at: datetime
