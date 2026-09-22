from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from src.database import Base


class DocumentFolder(Base):
    __tablename__ = "document_folders"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_folder_id = Column(Integer, ForeignKey('document_folders.id', ondelete='CASCADE'), nullable=True, index=True)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(50), nullable=True)
    icon = Column(String(100), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_doc_folder_parent', 'parent_id'),
        Index('idx_doc_folder_parent_folder', 'parent_folder_id'),
    )


class FamilyDocument(Base):
    """NOTE: this class was previously written to a different, earlier design
    (document_name/file_url/uploaded_by_user_id, no folders or per-document
    sharing) that didn't match what src/api/v1/document_vault.py (the real,
    mounted router) and src/schemas/document_vault.py actually construct/
    return -- every FamilyDocument(...) call in the router raised a real
    TypeError at runtime (e.g. 'parent_id' is an invalid keyword argument).
    Rewritten to match the router+schema, which is the active, intentional
    design (parent-owned documents organized into folders, granular
    per-document sharing via DocumentShare, OCR text extraction, FERPA
    access logging) -- confirmed by reading every FamilyDocument(...)
    construction site and .attribute access in the router directly."""
    __tablename__ = "family_documents"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey('parents.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    folder_id = Column(Integer, ForeignKey('document_folders.id', ondelete='SET NULL'), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    document_type = Column(String(50), nullable=False, index=True)
    tags = Column(JSON, nullable=True)

    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    mime_type = Column(String(100), nullable=True)

    encrypted_file_url = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False, unique=True, index=True)
    encryption_key_hash = Column(String(255), nullable=False)
    encryption_iv = Column(String(64), nullable=False)

    ocr_text = Column(Text, nullable=True)
    extracted_metadata = Column(JSON, nullable=True)

    issue_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True, index=True)

    ferpa_compliant = Column(Boolean, default=True, nullable=False)
    is_sensitive = Column(Boolean, default=True, nullable=False)
    access_log_enabled = Column(Boolean, default=True, nullable=False)

    status = Column(String(20), default="active", nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    parent = relationship("Parent")
    student = relationship("Student")
    folder = relationship("DocumentFolder")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    access_logs = relationship("DocumentAccessLog", back_populates="document", cascade="all, delete-orphan")
    shares = relationship("DocumentShare", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_family_doc_institution_parent', 'institution_id', 'parent_id'),
        Index('idx_family_doc_type', 'document_type'),
        Index('idx_family_doc_expiry', 'expiry_date'),
        Index('idx_family_doc_created', 'created_at'),
        Index('idx_family_doc_active', 'is_active'),
    )


class DocumentAccessLog(Base):
    __tablename__ = "document_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey('family_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    action = Column(String(50), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    document = relationship("FamilyDocument", back_populates="access_logs")

    __table_args__ = (
        Index('idx_doc_access_document_user', 'document_id', 'user_id'),
        Index('idx_doc_access_action', 'action'),
        Index('idx_doc_access_created', 'created_at'),
    )


class DocumentShare(Base):
    __tablename__ = "document_shares"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey('family_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    shared_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    shared_with_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    permission = Column(String(20), default="view", nullable=False)

    expires_at = Column(DateTime, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("FamilyDocument", back_populates="shares")

    __table_args__ = (
        Index('idx_doc_share_document', 'document_id'),
        Index('idx_doc_share_with_user', 'shared_with_user_id'),
        Index('idx_doc_share_active', 'is_active'),
    )


class DocumentExpirationAlert(Base):
    __tablename__ = "document_expiration_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey('family_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='SET NULL'), nullable=True, index=True)
    
    alert_type = Column(String(50), nullable=False)
    days_before_expiry = Column(Integer, nullable=False)
    
    sent_at = Column(DateTime, nullable=True)
    is_sent = Column(Boolean, default=False, nullable=False, index=True)
    
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_doc_alert_document', 'document_id'),
        Index('idx_doc_alert_sent', 'is_sent'),
    )
