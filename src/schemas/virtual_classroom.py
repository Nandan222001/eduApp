from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class ClassroomStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"
    CANCELLED = "cancelled"


class RecordingStatus(str, Enum):
    IDLE = "idle"
    RECORDING = "recording"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ParticipantRole(str, Enum):
    HOST = "host"
    MODERATOR = "moderator"
    PARTICIPANT = "participant"
    OBSERVER = "observer"


class BreakoutRoomStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"


class PollStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ENDED = "ended"


class QuizStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ENDED = "ended"


class VirtualClassroomCreate(BaseModel):
    subject_id: Optional[int] = None
    section_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    max_participants: int = Field(default=100, ge=1, le=1000)
    is_recording_enabled: bool = False
    is_screen_sharing_enabled: bool = True
    is_whiteboard_enabled: bool = True
    is_chat_enabled: bool = True
    is_breakout_rooms_enabled: bool = False
    settings: Optional[Dict[str, Any]] = None
    participant_user_ids: Optional[List[int]] = None


class VirtualClassroomUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None
    max_participants: Optional[int] = Field(None, ge=1, le=1000)
    is_recording_enabled: Optional[bool] = None
    is_screen_sharing_enabled: Optional[bool] = None
    is_whiteboard_enabled: Optional[bool] = None
    is_chat_enabled: Optional[bool] = None
    is_breakout_rooms_enabled: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None
    status: Optional[ClassroomStatus] = None


class VirtualClassroomResponse(BaseModel):
    id: int
    institution_id: int
    subject_id: Optional[int]
    section_id: Optional[int]
    teacher_id: int
    title: str
    description: Optional[str]
    channel_name: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    status: ClassroomStatus
    max_participants: int
    is_recording_enabled: bool
    is_screen_sharing_enabled: bool
    is_whiteboard_enabled: bool
    is_chat_enabled: bool
    is_breakout_rooms_enabled: bool
    whiteboard_data: Optional[Dict[str, Any]]
    settings: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    participant_count: Optional[int] = None
    current_participants: Optional[int] = None

    class Config:
        from_attributes = True


class ParticipantResponse(BaseModel):
    id: int
    classroom_id: int
    user_id: int
    role: ParticipantRole
    joined_at: Optional[datetime]
    left_at: Optional[datetime]
    duration_seconds: int
    is_video_enabled: bool
    is_audio_enabled: bool
    is_screen_sharing: bool
    agora_uid: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JoinClassroomRequest(BaseModel):
    user_id: int
    role: ParticipantRole = ParticipantRole.PARTICIPANT


class JoinClassroomResponse(BaseModel):
    token: str
    channel_name: str
    uid: int
    app_id: str
    classroom: VirtualClassroomResponse
    participant: ParticipantResponse


class StartClassroomRequest(BaseModel):
    pass


class EndClassroomRequest(BaseModel):
    pass


class RecordingCreate(BaseModel):
    classroom_id: int


class RecordingResponse(BaseModel):
    id: int
    classroom_id: int
    recording_id: str
    resource_id: Optional[str]
    sid: Optional[str]
    file_url: Optional[str]
    s3_key: Optional[str]
    file_size: Optional[int]
    duration_seconds: Optional[int]
    status: RecordingStatus
    started_at: Optional[datetime]
    stopped_at: Optional[datetime]
    metadata: Optional[Dict[str, Any]]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecordingViewCreate(BaseModel):
    recording_id: int
    last_position_seconds: int = 0


class RecordingViewUpdate(BaseModel):
    last_position_seconds: int
    completed: bool = False


class RecordingViewResponse(BaseModel):
    id: int
    recording_id: int
    user_id: int
    started_at: datetime
    last_position_seconds: int
    completed: bool
    watch_duration_seconds: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BreakoutRoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    max_participants: int = Field(default=10, ge=2, le=50)
    duration_minutes: int = Field(default=15, ge=5, le=120)
    participant_user_ids: List[int]


class BreakoutRoomResponse(BaseModel):
    id: int
    classroom_id: int
    name: str
    channel_name: str
    max_participants: int
    duration_minutes: int
    status: BreakoutRoomStatus
    created_at: datetime
    closed_at: Optional[datetime]
    participant_count: Optional[int] = None

    class Config:
        from_attributes = True


class JoinBreakoutRoomResponse(BaseModel):
    token: str
    channel_name: str
    uid: int
    app_id: str
    breakout_room: BreakoutRoomResponse


class AttendanceResponse(BaseModel):
    id: int
    classroom_id: int
    user_id: int
    student_id: Optional[int]
    joined_at: datetime
    left_at: Optional[datetime]
    total_duration_seconds: int
    is_present: bool
    attendance_percentage: float
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    classroom_id: int
    total_participants: int
    present_count: int
    absent_count: int
    average_duration_seconds: float
    average_attendance_percentage: float


class PollOptionCreate(BaseModel):
    text: str
    value: str


class PollCreate(BaseModel):
    question: str
    options: List[PollOptionCreate]
    is_anonymous: bool = False
    allow_multiple_choices: bool = False


class PollUpdate(BaseModel):
    question: Optional[str] = None
    options: Optional[List[PollOptionCreate]] = None
    is_anonymous: Optional[bool] = None
    allow_multiple_choices: Optional[bool] = None
    status: Optional[PollStatus] = None


class PollResponse(BaseModel):
    id: int
    classroom_id: int
    created_by: int
    question: str
    options: List[Dict[str, Any]]
    status: PollStatus
    is_anonymous: bool
    allow_multiple_choices: bool
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    total_responses: Optional[int] = None
    results: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class PollResponseCreate(BaseModel):
    selected_options: List[str]


class PollResponseResponse(BaseModel):
    id: int
    poll_id: int
    user_id: int
    selected_options: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class QuizQuestionCreate(BaseModel):
    question: str
    type: str = Field(..., pattern="^(multiple_choice|true_false|short_answer)$")
    options: Optional[List[str]] = None
    correct_answer: str
    points: int = Field(default=1, ge=1)


class QuizCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    questions: List[QuizQuestionCreate]
    duration_minutes: Optional[int] = Field(None, ge=1, le=180)
    passing_score: int = Field(default=60, ge=0, le=100)


class QuizUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    questions: Optional[List[QuizQuestionCreate]] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=180)
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[QuizStatus] = None


class QuizResponse(BaseModel):
    id: int
    classroom_id: int
    created_by: int
    title: str
    description: Optional[str]
    questions: List[Dict[str, Any]]
    status: QuizStatus
    duration_minutes: Optional[int]
    passing_score: int
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    total_submissions: Optional[int] = None
    average_score: Optional[float] = None

    class Config:
        from_attributes = True


class QuizAnswerSubmit(BaseModel):
    question_id: str
    answer: str


class QuizSubmissionCreate(BaseModel):
    answers: List[QuizAnswerSubmit]


class QuizSubmissionResponse(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    answers: List[Dict[str, Any]]
    score: Optional[int]
    total_questions: int
    correct_answers: int
    started_at: datetime
    submitted_at: Optional[datetime]
    time_taken_seconds: Optional[int]
    is_passed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WhiteboardUpdate(BaseModel):
    session_data: Dict[str, Any]


class WhiteboardResponse(BaseModel):
    id: int
    classroom_id: int
    session_data: Dict[str, Any]
    snapshot_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClassroomAnalytics(BaseModel):
    classroom_id: int
    total_participants: int
    average_duration_minutes: float
    peak_concurrent_users: int
    total_messages: int
    poll_engagement_rate: float
    quiz_completion_rate: float
    recording_views: int
    breakout_rooms_created: int


class ParticipantActivity(BaseModel):
    user_id: int
    total_sessions: int
    total_duration_seconds: int
    average_attendance_percentage: float
    polls_responded: int
    quizzes_completed: int
    recordings_watched: int
