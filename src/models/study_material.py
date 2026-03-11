from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, BigInteger, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from enum import Enum
from src.database import Base


class MaterialType(str, Enum):
    PDF = "pdf"
    VIDEO = "video"
    AUDIO = "audio"
    IMAGE = "image"
    DOCUMENT = "document"
    PRESENTATION = "presentation"
    SPREADSHEET = "spreadsheet"
    ARCHIVE = "archive"
    OTHER = "other"


class StudyMaterial(Base):
    __tablename__ = "study_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True, index=True)
    chapter_id = Column(Integer, ForeignKey('chapters.id', ondelete='SET NULL'), nullable=True, index=True)
    topic_id = Column(Integer, ForeignKey('topics.id', ondelete='SET NULL'), nullable=True, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=True, index=True)
    uploaded_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(1000), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    material_type = Column(SQLEnum(MaterialType), nullable=False, index=True)
    mime_type = Column(String(200), nullable=True)
    
    thumbnail_path = Column(String(1000), nullable=True)
    preview_path = Column(String(1000), nullable=True)
    
    view_count = Column(Integer, default=0, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    
    tags = Column(ARRAY(String), nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="study_materials")
    subject = relationship("Subject", back_populates="study_materials")
    chapter = relationship("Chapter", back_populates="study_materials")
    topic = relationship("Topic", back_populates="study_materials")
    grade = relationship("Grade", back_populates="study_materials")
    uploader = relationship("User")
    
    bookmarks = relationship("MaterialBookmark", back_populates="material", cascade="all, delete-orphan")
    access_logs = relationship("MaterialAccessLog", back_populates="material", cascade="all, delete-orphan")
    shares = relationship("MaterialShare", back_populates="material", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_study_material_institution', 'institution_id'),
        Index('idx_study_material_subject', 'subject_id'),
        Index('idx_study_material_chapter', 'chapter_id'),
        Index('idx_study_material_topic', 'topic_id'),
        Index('idx_study_material_grade', 'grade_id'),
        Index('idx_study_material_uploaded_by', 'uploaded_by'),
        Index('idx_study_material_type', 'material_type'),
        Index('idx_study_material_active', 'is_active'),
        Index('idx_study_material_public', 'is_public'),
        Index('idx_study_material_created', 'created_at'),
        Index('idx_study_material_tags', 'tags', postgresql_using='gin'),
    )


class MaterialBookmark(Base):
    __tablename__ = "material_bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey('study_materials.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    notes = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    material = relationship("StudyMaterial", back_populates="bookmarks")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('material_id', 'user_id', name='uq_material_user_bookmark'),
        Index('idx_material_bookmark_institution', 'institution_id'),
        Index('idx_material_bookmark_material', 'material_id'),
        Index('idx_material_bookmark_user', 'user_id'),
        Index('idx_material_bookmark_favorite', 'is_favorite'),
    )


class MaterialAccessLog(Base):
    __tablename__ = "material_access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey('study_materials.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    action = Column(String(50), nullable=False)  # view, download, share
    accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    institution = relationship("Institution")
    material = relationship("StudyMaterial", back_populates="access_logs")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_material_access_institution', 'institution_id'),
        Index('idx_material_access_material', 'material_id'),
        Index('idx_material_access_user', 'user_id'),
        Index('idx_material_access_action', 'action'),
        Index('idx_material_access_time', 'accessed_at'),
    )


class MaterialShare(Base):
    __tablename__ = "material_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey('study_materials.id', ondelete='CASCADE'), nullable=False, index=True)
    shared_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    shared_with = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    
    share_token = Column(String(100), unique=True, nullable=False, index=True)
    message = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    material = relationship("StudyMaterial", back_populates="shares")
    sharer = relationship("User", foreign_keys=[shared_by])
    recipient = relationship("User", foreign_keys=[shared_with])
    
    __table_args__ = (
        Index('idx_material_share_institution', 'institution_id'),
        Index('idx_material_share_material', 'material_id'),
        Index('idx_material_share_shared_by', 'shared_by'),
        Index('idx_material_share_shared_with', 'shared_with'),
        Index('idx_material_share_token', 'share_token'),
        Index('idx_material_share_active', 'is_active'),
        Index('idx_material_share_expires', 'expires_at'),
    )


class MaterialTag(Base):
    __tablename__ = "material_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=True)
    usage_count = Column(Integer, default=0, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'name', name='uq_institution_material_tag_name'),
        Index('idx_material_tag_institution', 'institution_id'),
        Index('idx_material_tag_active', 'is_active'),
        Index('idx_material_tag_usage', 'usage_count'),
    )
