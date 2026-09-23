from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from src.database import Base


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


class VirtualClassroom(Base):
    __tablename__ = "virtual_classrooms"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='SET NULL'), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    channel_name = Column(String(255), nullable=False, unique=True, index=True)
    scheduled_start_time = Column(DateTime, nullable=False)
    scheduled_end_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default=ClassroomStatus.SCHEDULED.value, nullable=False, index=True)
    max_participants = Column(Integer, default=100, nullable=False)
    is_recording_enabled = Column(Boolean, default=False, nullable=False)
    is_screen_sharing_enabled = Column(Boolean, default=True, nullable=False)
    is_whiteboard_enabled = Column(Boolean, default=True, nullable=False)
    is_chat_enabled = Column(Boolean, default=True, nullable=False)
    is_breakout_rooms_enabled = Column(Boolean, default=False, nullable=False)
    whiteboard_data = Column(JSON, nullable=True)
    settings = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    teacher = relationship("Teacher", foreign_keys=[teacher_id])
    subject = relationship("Subject", foreign_keys=[subject_id])
    section = relationship("Section", foreign_keys=[section_id])

    participants = relationship("ClassroomParticipant", back_populates="classroom", cascade="all, delete-orphan")
    recordings = relationship("ClassroomRecording", back_populates="classroom", cascade="all, delete-orphan")
    breakout_rooms = relationship("BreakoutRoom", back_populates="classroom", cascade="all, delete-orphan")
    attendance_records = relationship("ClassroomAttendance", back_populates="classroom", cascade="all, delete-orphan")
    polls = relationship("ClassroomPoll", back_populates="classroom", cascade="all, delete-orphan")
    quizzes = relationship("ClassroomQuiz", back_populates="classroom", cascade="all, delete-orphan")
    whiteboard_sessions = relationship("WhiteboardSession", back_populates="classroom", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_virtual_classroom_institution_status', 'institution_id', 'status'),
        Index('idx_virtual_classroom_teacher_status', 'teacher_id', 'status'),
        Index('idx_virtual_classroom_institution_start', 'institution_id', 'scheduled_start_time'),
    )


class ClassroomParticipant(Base):
    __tablename__ = "classroom_participants"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey('virtual_classrooms.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    role = Column(String(20), default=ParticipantRole.PARTICIPANT.value, nullable=False, index=True)
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    is_video_enabled = Column(Boolean, default=True, nullable=False)
    is_audio_enabled = Column(Boolean, default=True, nullable=False)
    is_screen_sharing = Column(Boolean, default=False, nullable=False)
    agora_uid = Column(Integer, nullable=True)
    token = Column(String(500), nullable=True)
    token_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    classroom = relationship("VirtualClassroom", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index('idx_classroom_participant_classroom_user', 'classroom_id', 'user_id', unique=True),
    )


class ClassroomRecording(Base):
    __tablename__ = "classroom_recordings"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey('virtual_classrooms.id', ondelete='CASCADE'), nullable=False, index=True)

    recording_id = Column(String(100), nullable=False, unique=True, index=True)
    resource_id = Column(String(255), nullable=True)
    sid = Column(String(255), nullable=True)
    file_url = Column(String(500), nullable=True)
    s3_key = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    status = Column(String(20), default=RecordingStatus.IDLE.value, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    stopped_at = Column(DateTime, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    classroom = relationship("VirtualClassroom", back_populates="recordings")
    views = relationship("RecordingView", back_populates="recording", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_classroom_recording_classroom_status', 'classroom_id', 'status'),
    )


class RecordingView(Base):
    __tablename__ = "recording_views"

    id = Column(Integer, primary_key=True, index=True)
    recording_id = Column(Integer, ForeignKey('classroom_recordings.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_position_seconds = Column(Integer, default=0, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    watch_duration_seconds = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    recording = relationship("ClassroomRecording", back_populates="views")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index('idx_recording_view_recording_user', 'recording_id', 'user_id'),
    )


class BreakoutRoom(Base):
    __tablename__ = "breakout_rooms"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey('virtual_classrooms.id', ondelete='CASCADE'), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    channel_name = Column(String(255), nullable=False, unique=True, index=True)
    max_participants = Column(Integer, default=10, nullable=False)
    duration_minutes = Column(Integer, default=15, nullable=False)
    status = Column(String(20), default=BreakoutRoomStatus.ACTIVE.value, nullable=False, index=True)
    closed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    classroom = relationship("VirtualClassroom", back_populates="breakout_rooms")
    participants = relationship("BreakoutRoomParticipant", back_populates="breakout_room", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_breakout_room_classroom_status', 'classroom_id', 'status'),
    )


class BreakoutRoomParticipant(Base):
    __tablename__ = "breakout_room_participants"

    id = Column(Integer, primary_key=True, index=True)
    breakout_room_id = Column(Integer, ForeignKey('breakout_rooms.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    agora_uid = Column(Integer, nullable=True)
    token = Column(String(500), nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    breakout_room = relationship("BreakoutRoom", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index('idx_breakout_room_participant_room_user', 'breakout_room_id', 'user_id', unique=True),
    )


class ClassroomAttendance(Base):
    __tablename__ = "classroom_attendance"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey('virtual_classrooms.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)

    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    total_duration_seconds = Column(Integer, default=0, nullable=False)
    is_present = Column(Boolean, default=False, nullable=False)
    attendance_percentage = Column(Float, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    classroom = relationship("VirtualClassroom", back_populates="attendance_records")
    user = relationship("User", foreign_keys=[user_id])
    student = relationship("Student", foreign_keys=[student_id])

    __table_args__ = (
        Index('idx_classroom_attendance_classroom_user', 'classroom_id', 'user_id', unique=True),
        Index('idx_classroom_attendance_classroom_percentage', 'classroom_id', 'attendance_percentage'),
    )


class ClassroomPoll(Base):
    __tablename__ = "classroom_polls"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey('virtual_classrooms.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    status = Column(String(20), default=PollStatus.DRAFT.value, nullable=False, index=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    allow_multiple_choices = Column(Boolean, default=False, nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    classroom = relationship("VirtualClassroom", back_populates="polls")
    creator = relationship("User", foreign_keys=[created_by])
    responses = relationship("PollResponse", back_populates="poll", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_classroom_poll_classroom_status', 'classroom_id', 'status'),
    )


class PollResponse(Base):
    __tablename__ = "poll_responses"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey('classroom_polls.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    selected_options = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    poll = relationship("ClassroomPoll", back_populates="responses")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index('idx_poll_response_poll_user', 'poll_id', 'user_id', unique=True),
    )


class ClassroomQuiz(Base):
    __tablename__ = "classroom_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey('virtual_classrooms.id', ondelete='CASCADE'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    questions = Column(JSON, nullable=False)
    status = Column(String(20), default=QuizStatus.DRAFT.value, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=True)
    passing_score = Column(Integer, default=60, nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    classroom = relationship("VirtualClassroom", back_populates="quizzes")
    creator = relationship("User", foreign_keys=[created_by])
    submissions = relationship("QuizSubmission", back_populates="quiz", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_classroom_quiz_classroom_status', 'classroom_id', 'status'),
    )


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey('classroom_quizzes.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    answers = Column(JSON, nullable=True)
    score = Column(Integer, nullable=True)
    total_questions = Column(Integer, default=0, nullable=False)
    correct_answers = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)
    is_passed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    quiz = relationship("ClassroomQuiz", back_populates="submissions")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index('idx_quiz_submission_quiz_user', 'quiz_id', 'user_id', unique=True),
    )


class WhiteboardSession(Base):
    __tablename__ = "whiteboard_sessions"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey('virtual_classrooms.id', ondelete='CASCADE'), nullable=False, index=True)

    session_data = Column(JSON, nullable=False)
    snapshot_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    classroom = relationship("VirtualClassroom", back_populates="whiteboard_sessions")

    __table_args__ = (
        Index('idx_whiteboard_session_classroom', 'classroom_id'),
    )
