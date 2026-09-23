from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Index, JSON,
    Text
)
from sqlalchemy.orm import relationship
from src.database import Base


class CredentialType(str, PyEnum):
    DIGITAL_BADGE = "digital_badge"
    CERTIFICATE = "certificate"


class CredentialSubType(str, PyEnum):
    ACADEMIC = "academic"
    SKILL_BASED = "skill_based"
    PARTICIPATION = "participation"


class CredentialStatus(str, PyEnum):
    PENDING = "pending"
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"


class DigitalCredential(Base):
    __tablename__ = "digital_credentials"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    issuer_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    credential_type = Column(String(20), nullable=False, index=True)
    sub_type = Column(String(20), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    certificate_number = Column(String(100), unique=True, nullable=False, index=True)
    skills = Column(JSON, nullable=True)
    metadata_json = Column('metadata', JSON, nullable=True)

    course_id = Column(Integer, nullable=True)
    exam_id = Column(Integer, nullable=True)
    assignment_id = Column(Integer, nullable=True)
    grade = Column(String(20), nullable=True)
    score = Column(Integer, nullable=True)

    blockchain_hash = Column(String(255), nullable=True)
    blockchain_credential_id = Column(String(100), nullable=True, index=True)
    blockchain_status = Column(String(20), nullable=True)
    verification_url = Column(String(500), nullable=True)
    # qr_code_url holds a base64 data-URI PNG (see credential_service.py's
    # _generate_qr_code), not a short URL -- can be several KB, so Text not
    # String(500). Found via a real /credentials/ POST hitting MySQL's
    # "Data too long" error while writing test_credentials_api.py.
    qr_code_url = Column(Text, nullable=True)

    issued_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    status = Column(String(20), default=CredentialStatus.PENDING.value, nullable=False, index=True)

    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    revoke_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")
    recipient = relationship("User", foreign_keys=[recipient_id])
    issuer = relationship("User", foreign_keys=[issuer_id])
    shares = relationship("CredentialShare", back_populates="credential")
    verifications = relationship("CredentialVerification", back_populates="credential")

    __table_args__ = (
        Index('idx_digital_credential_institution_status', 'institution_id', 'status'),
    )


class CredentialVerification(Base):
    __tablename__ = "credential_verifications"

    id = Column(Integer, primary_key=True, index=True)
    credential_id = Column(Integer, ForeignKey('digital_credentials.id', ondelete='CASCADE'), nullable=True, index=True)

    verifier_name = Column(String(255), nullable=True)
    verifier_email = Column(String(255), nullable=True)
    verifier_organization = Column(String(255), nullable=True)
    verifier_ip = Column(String(50), nullable=True)

    verification_method = Column(String(50), nullable=False)
    verification_result = Column(String(20), nullable=False)
    metadata_json = Column('metadata', JSON, nullable=True)

    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    credential = relationship("DigitalCredential", back_populates="verifications")


class CredentialShare(Base):
    __tablename__ = "credential_shares"

    id = Column(Integer, primary_key=True, index=True)
    credential_id = Column(Integer, ForeignKey('digital_credentials.id', ondelete='CASCADE'), nullable=False, index=True)

    share_token = Column(String(64), unique=True, nullable=False, index=True)
    share_url = Column(String(500), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    recipient_name = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    last_viewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    credential = relationship("DigitalCredential", back_populates="shares")


class CredentialTemplate(Base):
    __tablename__ = "credential_templates"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    credential_type = Column(String(20), nullable=False)
    sub_type = Column(String(20), nullable=False)
    template_data = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution = relationship("Institution")

    __table_args__ = (
        Index('idx_credential_template_institution', 'institution_id', 'is_active'),
    )
