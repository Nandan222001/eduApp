from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
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
    attachments = Column(ARRAY(String), nullable=True)
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
    metadata = Column(Text, nullable=True)
    
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
