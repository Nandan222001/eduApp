from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from src.models.olympics import (
    CompetitionType, CompetitionScope, EventType, CompetitionStatus
)


class CompetitionBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    competition_type: CompetitionType
    scope: CompetitionScope
    start_date: datetime
    end_date: datetime
    rules: Optional[Dict[str, Any]] = None
    prize_pool: Optional[Dict[str, Any]] = None
    participating_institutions: Optional[List[int]] = None
    banner_url: Optional[str] = Field(None, max_length=500)
    organizer_id: Optional[int] = None


class CompetitionCreate(CompetitionBase):
    pass


class CompetitionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    competition_type: Optional[CompetitionType] = None
    scope: Optional[CompetitionScope] = None
    status: Optional[CompetitionStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    rules: Optional[Dict[str, Any]] = None
    prize_pool: Optional[Dict[str, Any]] = None
    participating_institutions: Optional[List[int]] = None
    banner_url: Optional[str] = Field(None, max_length=500)
    organizer_id: Optional[int] = None
    is_active: Optional[bool] = None


class CompetitionResponse(CompetitionBase):
    id: int
    institution_id: int
    status: CompetitionStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompetitionEventBase(BaseModel):
    event_name: str = Field(..., max_length=200)
    description: Optional[str] = None
    event_type: EventType
    max_participants: Optional[int] = None
    duration_minutes: Optional[int] = None
    question_set: Optional[Dict[str, Any]] = None
    scoring_rules: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class CompetitionEventCreate(CompetitionEventBase):
    competition_id: int


class CompetitionEventUpdate(BaseModel):
    event_name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    max_participants: Optional[int] = None
    duration_minutes: Optional[int] = None
    question_set: Optional[Dict[str, Any]] = None
    scoring_rules: Optional[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_active: Optional[bool] = None


class CompetitionEventResponse(CompetitionEventBase):
    id: int
    institution_id: int
    competition_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompetitionEntryBase(BaseModel):
    event_id: int
    participant_student_id: int
    team_id: Optional[int] = None
    submission_data: Optional[Dict[str, Any]] = None


class CompetitionEntryCreate(CompetitionEntryBase):
    pass


class CompetitionEntryUpdate(BaseModel):
    score: Optional[Decimal] = None
    rank: Optional[int] = None
    time_taken: Optional[int] = None
    submission_data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class CompetitionEntryResponse(BaseModel):
    id: int
    institution_id: int
    event_id: int
    participant_student_id: int
    team_id: Optional[int] = None
    score: Decimal
    rank: Optional[int] = None
    time_taken: Optional[int] = None
    submission_data: Optional[Dict[str, Any]] = None
    status: str
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    certificate_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompetitionTeamBase(BaseModel):
    team_name: str = Field(..., max_length=200)
    team_leader_id: Optional[int] = None
    members: List[int] = Field(..., min_length=1)
    avatar_url: Optional[str] = Field(None, max_length=500)


class CompetitionTeamCreate(CompetitionTeamBase):
    event_id: int


class CompetitionTeamUpdate(BaseModel):
    team_name: Optional[str] = Field(None, max_length=200)
    team_leader_id: Optional[int] = None
    members: Optional[List[int]] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class CompetitionTeamResponse(CompetitionTeamBase):
    id: int
    institution_id: int
    event_id: int
    total_score: Decimal
    rank: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompetitionLeaderboardBase(BaseModel):
    scope: CompetitionScope
    rankings: Dict[str, Any]
    total_participants: int = 0
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias='metadata_json', serialization_alias='metadata')


class CompetitionLeaderboardCreate(CompetitionLeaderboardBase):
    competition_id: int


class CompetitionLeaderboardResponse(CompetitionLeaderboardBase):
    id: int
    institution_id: int
    competition_id: int
    last_updated: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubmitAnswerRequest(BaseModel):
    entry_id: int
    answer_data: Dict[str, Any]
    time_taken: Optional[int] = None


class GradeSubmissionRequest(BaseModel):
    entry_id: int
    score: Decimal
    feedback: Optional[str] = None


class LeaderboardEntry(BaseModel):
    rank: int
    participant_id: int
    participant_name: str
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    score: Decimal
    time_taken: Optional[int] = None
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None


class LiveLeaderboardResponse(BaseModel):
    competition_id: int
    event_id: Optional[int] = None
    scope: CompetitionScope
    entries: List[LeaderboardEntry]
    total_participants: int
    last_updated: datetime


class CertificateGenerateRequest(BaseModel):
    entry_ids: List[int]
    template: Optional[str] = None


class TeamFormationRequest(BaseModel):
    event_id: int
    team_name: str
    member_ids: List[int]
    team_leader_id: Optional[int] = None


class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
