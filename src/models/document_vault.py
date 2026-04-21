from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from src.database import Base


class FamilyDocument(Base):
    __tablename__ = "family_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    document_name = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False, unique=True, index=True)
    encryption_key = Column(String(500), nullable=False)
    
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    expiry_date = Column(DateTime, nullable=True, index=True)
    shared_with = Column(JSON, nullable=True)
    
    uploaded_by_role = Column(String(50), nullable=True)
    
    ocr_text = Column(Text, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)
    
    is_sensitive = Column(Boolean, default=True, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    student = relationship("Student")
    uploaded_by = relationship("User")
    access_logs = relationship("DocumentAccessLog", back_populates="document", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_family_doc_institution_student', 'institution_id', 'student_id'),
        Index('idx_family_doc_type', 'document_type'),
        Index('idx_family_doc_expiry', 'expiry_date'),
        Index('idx_family_doc_created', 'created_at'),
        Index('idx_family_doc_deleted', 'is_deleted'),
    )


class DocumentAccessLog(Base):
    __tablename__ = "document_access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey('family_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='SET NULL'), nullable=True, index=True)
    
    action_type = Column(String(50), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    user_role = Column(String(50), nullable=True)
    user_name = Column(String(255), nullable=True)
    
    access_granted = Column(Boolean, default=True, nullable=False)
    denial_reason = Column(String(255), nullable=True)
    
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    document = relationship("FamilyDocument", back_populates="access_logs")
    
    __table_args__ = (
        Index('idx_doc_access_document_user', 'document_id', 'user_id'),
        Index('idx_doc_access_action', 'action_type'),
        Index('idx_doc_access_created', 'created_at'),
    )


class DocumentShare(Base):
    __tablename__ = "document_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey('family_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    shared_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    shared_with_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    
    share_type = Column(String(50), nullable=False)
    permissions = Column(JSON, nullable=True)
    
    expiry_date = Column(DateTime, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    metadata_json = Column('metadata', JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    
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
