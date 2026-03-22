from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum, Float, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class GroupMemberRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    LINK = "link"
    ANNOUNCEMENT = "announcement"


class ActivityType(str, Enum):
    MEMBER_JOINED = "member_joined"
    MEMBER_LEFT = "member_left"
    MEMBER_PROMOTED = "member_promoted"
    MESSAGE_SENT = "message_sent"
    RESOURCE_UPLOADED = "resource_uploaded"
    GROUP_UPDATED = "group_updated"


class InviteStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MatchStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class TutorRequestStatus(str, Enum):
    OPEN = "open"
    MATCHED = "matched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class StudyGroup(Base):
    __tablename__ = "study_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    avatar_url = Column(String(1000), nullable=True)
    cover_image_url = Column(String(1000), nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    max_members = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    member_count = Column(Integer, default=1, nullable=False)
    resource_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    creator = relationship("User", foreign_keys=[created_by])
    
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("GroupMessage", back_populates="group", cascade="all, delete-orphan")
    resources = relationship("GroupResource", back_populates="group", cascade="all, delete-orphan")
    activities = relationship("GroupActivity", back_populates="group", cascade="all, delete-orphan")
    invites = relationship("GroupInvite", back_populates="group", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_study_group_institution', 'institution_id'),
        Index('idx_study_group_subject', 'subject_id'),
        Index('idx_study_group_chapter', 'chapter_id'),
        Index('idx_study_group_creator', 'created_by'),
        Index('idx_study_group_public', 'is_public'),
        Index('idx_study_group_created', 'created_at'),
    )


class GroupMember(Base):
    __tablename__ = "group_members"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(SQLEnum(GroupMemberRole), default=GroupMemberRole.MEMBER, nullable=False)
    
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active_at = Column(DateTime, nullable=True)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup", back_populates="members")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('group_id', 'user_id', name='uq_group_user_member'),
        Index('idx_group_member_institution', 'institution_id'),
        Index('idx_group_member_group', 'group_id'),
        Index('idx_group_member_user', 'user_id'),
        Index('idx_group_member_role', 'role'),
    )


class GroupMessage(Base):
    __tablename__ = "group_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT, nullable=False)
    attachments = Column(JSON, nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    reply_to_id = Column(Integer, ForeignKey('group_messages.id', ondelete='SET NULL'), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup", back_populates="messages")
    user = relationship("User")
    reply_to = relationship("GroupMessage", remote_side=[id])
    
    __table_args__ = (
        Index('idx_group_message_institution', 'institution_id'),
        Index('idx_group_message_group', 'group_id'),
        Index('idx_group_message_user', 'user_id'),
        Index('idx_group_message_created', 'created_at'),
        Index('idx_group_message_pinned', 'is_pinned'),
    )


class GroupResource(Base):
    __tablename__ = "group_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(1000), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(200), nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup", back_populates="resources")
    uploader = relationship("User")
    
    __table_args__ = (
        Index('idx_group_resource_institution', 'institution_id'),
        Index('idx_group_resource_group', 'group_id'),
        Index('idx_group_resource_uploader', 'uploaded_by'),
        Index('idx_group_resource_created', 'created_at'),
    )


class GroupActivity(Base):
    __tablename__ = "group_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    activity_type = Column(SQLEnum(ActivityType), nullable=False)
    content = Column(String(1000), nullable=False)
    metadata_json = Column('metadata', Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup", back_populates="activities")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_group_activity_institution', 'institution_id'),
        Index('idx_group_activity_group', 'group_id'),
        Index('idx_group_activity_user', 'user_id'),
        Index('idx_group_activity_type', 'activity_type'),
        Index('idx_group_activity_created', 'created_at'),
    )


class GroupInvite(Base):
    __tablename__ = "group_invites"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    invited_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    invited_user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    invite_token = Column(String(100), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(InviteStatus), default=InviteStatus.PENDING, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup", back_populates="invites")
    inviter = relationship("User", foreign_keys=[invited_by])
    invited_user = relationship("User", foreign_keys=[invited_user_id])
    
    __table_args__ = (
        Index('idx_group_invite_institution', 'institution_id'),
        Index('idx_group_invite_group', 'group_id'),
        Index('idx_group_invite_inviter', 'invited_by'),
        Index('idx_group_invite_invited_user', 'invited_user_id'),
        Index('idx_group_invite_status', 'status'),
        Index('idx_group_invite_token', 'invite_token'),
    )


class StudyBuddyProfile(Base):
    __tablename__ = "study_buddy_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    subjects = Column(JSON, nullable=False)
    performance_level = Column(String(50), nullable=False)
    study_schedule = Column(JSON, nullable=True)
    preferred_study_times = Column(JSON, nullable=True)
    study_goals = Column(Text, nullable=True)
    learning_style = Column(String(50), nullable=True)
    availability_days = Column(JSON, nullable=True)
    preferred_group_size = Column(Integer, default=4, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    bio = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('student_id', name='uq_student_buddy_profile'),
        Index('idx_buddy_profile_institution', 'institution_id'),
        Index('idx_buddy_profile_student', 'student_id'),
        Index('idx_buddy_profile_user', 'user_id'),
        Index('idx_buddy_profile_available', 'is_available'),
        Index('idx_buddy_profile_performance', 'performance_level'),
    )


class StudyBuddyMatch(Base):
    __tablename__ = "study_buddy_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    requester_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    matched_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    match_score = Column(Float, nullable=False)
    common_subjects = Column(JSON, nullable=True)
    match_reason = Column(Text, nullable=True)
    status = Column(SQLEnum(MatchStatus), default=MatchStatus.PENDING, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)
    
    institution = relationship("Institution")
    requester = relationship("Student", foreign_keys=[requester_id])
    matched_student = relationship("Student", foreign_keys=[matched_student_id])
    
    __table_args__ = (
        Index('idx_buddy_match_institution', 'institution_id'),
        Index('idx_buddy_match_requester', 'requester_id'),
        Index('idx_buddy_match_matched', 'matched_student_id'),
        Index('idx_buddy_match_status', 'status'),
        Index('idx_buddy_match_score', 'match_score'),
    )


class StudySession(Base):
    __tablename__ = "study_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    
    scheduled_start = Column(DateTime, nullable=False, index=True)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    
    video_room_id = Column(String(200), nullable=True)
    video_platform = Column(String(100), nullable=True)
    meeting_link = Column(String(1000), nullable=True)
    recording_url = Column(String(1000), nullable=True)
    
    max_participants = Column(Integer, default=10, nullable=False)
    participant_count = Column(Integer, default=0, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.SCHEDULED, nullable=False)
    
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup")
    creator = relationship("User")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    
    participants = relationship("SessionParticipant", back_populates="session", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_study_session_institution', 'institution_id'),
        Index('idx_study_session_group', 'group_id'),
        Index('idx_study_session_creator', 'created_by'),
        Index('idx_study_session_subject', 'subject_id'),
        Index('idx_study_session_status', 'status'),
        Index('idx_study_session_scheduled', 'scheduled_start'),
        Index('idx_study_session_public', 'is_public'),
    )


class SessionParticipant(Base):
    __tablename__ = "session_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey('study_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0, nullable=False)
    is_organizer = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    session = relationship("StudySession", back_populates="participants")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('session_id', 'user_id', name='uq_session_participant'),
        Index('idx_session_participant_institution', 'institution_id'),
        Index('idx_session_participant_session', 'session_id'),
        Index('idx_session_participant_user', 'user_id'),
    )


class CollaborativeNote(Base):
    __tablename__ = "collaborative_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=True, index=True)
    session_id = Column(Integer, ForeignKey('study_sessions.id', ondelete='SET NULL'), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    
    is_public = Column(Boolean, default=False, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    last_edited_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    view_count = Column(Integer, default=0, nullable=False)
    edit_count = Column(Integer, default=0, nullable=False)
    
    tags = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup")
    session = relationship("StudySession")
    creator = relationship("User", foreign_keys=[created_by])
    last_editor = relationship("User", foreign_keys=[last_edited_by])
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    
    editors = relationship("NoteEditor", back_populates="note", cascade="all, delete-orphan")
    revisions = relationship("NoteRevision", back_populates="note", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_collab_note_institution', 'institution_id'),
        Index('idx_collab_note_group', 'group_id'),
        Index('idx_collab_note_session', 'session_id'),
        Index('idx_collab_note_creator', 'created_by'),
        Index('idx_collab_note_subject', 'subject_id'),
        Index('idx_collab_note_public', 'is_public'),
        Index('idx_collab_note_created', 'created_at'),
    )


class NoteEditor(Base):
    __tablename__ = "note_editors"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey('collaborative_notes.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    can_edit = Column(Boolean, default=True, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_edit_at = Column(DateTime, nullable=True)
    
    note = relationship("CollaborativeNote", back_populates="editors")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('note_id', 'user_id', name='uq_note_editor'),
        Index('idx_note_editor_note', 'note_id'),
        Index('idx_note_editor_user', 'user_id'),
    )


class NoteRevision(Base):
    __tablename__ = "note_revisions"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey('collaborative_notes.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    version = Column(Integer, nullable=False)
    change_description = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    note = relationship("CollaborativeNote", back_populates="revisions")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_note_revision_note', 'note_id'),
        Index('idx_note_revision_user', 'user_id'),
        Index('idx_note_revision_version', 'version'),
        Index('idx_note_revision_created', 'created_at'),
    )


class PeerTutorProfile(Base):
    __tablename__ = "peer_tutor_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    expertise_subjects = Column(JSON, nullable=False)
    hourly_rate = Column(Float, nullable=True)
    availability_schedule = Column(JSON, nullable=True)
    bio = Column(Text, nullable=True)
    qualifications = Column(Text, nullable=True)
    
    total_sessions = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    total_earnings = Column(Float, default=0.0, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    student = relationship("Student")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('student_id', name='uq_student_tutor_profile'),
        Index('idx_tutor_profile_institution', 'institution_id'),
        Index('idx_tutor_profile_student', 'student_id'),
        Index('idx_tutor_profile_user', 'user_id'),
        Index('idx_tutor_profile_active', 'is_active'),
        Index('idx_tutor_profile_verified', 'is_verified'),
        Index('idx_tutor_profile_rating', 'average_rating'),
    )


class TutoringRequest(Base):
    __tablename__ = "tutoring_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('peer_tutor_profiles.id', ondelete='SET NULL'), nullable=True, index=True)
    
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    
    preferred_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=60, nullable=False)
    offered_rate = Column(Float, nullable=True)
    
    status = Column(SQLEnum(TutorRequestStatus), default=TutorRequestStatus.OPEN, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    matched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    institution = relationship("Institution")
    student = relationship("Student")
    tutor = relationship("PeerTutorProfile")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
    
    __table_args__ = (
        Index('idx_tutoring_request_institution', 'institution_id'),
        Index('idx_tutoring_request_student', 'student_id'),
        Index('idx_tutoring_request_tutor', 'tutor_id'),
        Index('idx_tutoring_request_subject', 'subject_id'),
        Index('idx_tutoring_request_status', 'status'),
        Index('idx_tutoring_request_created', 'created_at'),
    )


class TutoringSession(Base):
    __tablename__ = "tutoring_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    request_id = Column(Integer, ForeignKey('tutoring_requests.id', ondelete='CASCADE'), nullable=False, index=True)
    tutor_id = Column(Integer, ForeignKey('peer_tutor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    
    meeting_link = Column(String(1000), nullable=True)
    session_notes = Column(Text, nullable=True)
    
    payment_amount = Column(Float, nullable=True)
    payment_status = Column(String(50), default="pending", nullable=False)
    
    student_rating = Column(Integer, nullable=True)
    student_feedback = Column(Text, nullable=True)
    tutor_notes = Column(Text, nullable=True)
    
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.SCHEDULED, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    request = relationship("TutoringRequest")
    tutor = relationship("PeerTutorProfile")
    student = relationship("Student")
    
    __table_args__ = (
        Index('idx_tutoring_session_institution', 'institution_id'),
        Index('idx_tutoring_session_request', 'request_id'),
        Index('idx_tutoring_session_tutor', 'tutor_id'),
        Index('idx_tutoring_session_student', 'student_id'),
        Index('idx_tutoring_session_status', 'status'),
        Index('idx_tutoring_session_scheduled', 'scheduled_start'),
    )


class GroupPerformanceAnalytics(Base):
    __tablename__ = "group_performance_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('study_groups.id', ondelete='CASCADE'), nullable=False, index=True)
    
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    total_study_hours = Column(Float, default=0.0, nullable=False)
    total_sessions = Column(Integer, default=0, nullable=False)
    average_attendance = Column(Float, default=0.0, nullable=False)
    
    member_performance = Column(JSON, nullable=True)
    subject_distribution = Column(JSON, nullable=True)
    activity_metrics = Column(JSON, nullable=True)
    
    engagement_score = Column(Float, default=0.0, nullable=False)
    collaboration_score = Column(Float, default=0.0, nullable=False)
    overall_performance = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    group = relationship("StudyGroup")
    
    __table_args__ = (
        Index('idx_group_analytics_institution', 'institution_id'),
        Index('idx_group_analytics_group', 'group_id'),
        Index('idx_group_analytics_period', 'period_start', 'period_end'),
        Index('idx_group_analytics_created', 'created_at'),
    )
