from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CredentialType(str, Enum):
    DIGITAL_BADGE = "digital_badge"
    CERTIFICATE = "certificate"


class CredentialSubType(str, Enum):
    ACADEMIC = "academic"
    SKILL_BASED = "skill_based"
    PARTICIPATION = "participation"


class CredentialStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"


class CredentialBase(BaseModel):
    credential_type: CredentialType
    sub_type: CredentialSubType
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    skills: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    course_id: Optional[int] = None
    exam_id: Optional[int] = None
    assignment_id: Optional[int] = None
    grade: Optional[str] = None
    score: Optional[int] = None


class CredentialCreate(CredentialBase):
    recipient_id: int


class CredentialBulkCreate(BaseModel):
    recipient_ids: List[int]
    credential_type: CredentialType
    sub_type: CredentialSubType
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    skills: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    course_id: Optional[int] = None
    exam_id: Optional[int] = None
    assignment_id: Optional[int] = None


class CredentialUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    skills: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    grade: Optional[str] = None
    score: Optional[int] = None


class CredentialRevoke(BaseModel):
    reason: str = Field(..., min_length=1)


class CredentialResponse(CredentialBase):
    id: int
    institution_id: int
    recipient_id: int
    issuer_id: Optional[int]
    certificate_number: str
    blockchain_hash: Optional[str]
    blockchain_credential_id: Optional[str]
    blockchain_status: Optional[str]
    verification_url: Optional[str]
    qr_code_url: Optional[str]
    issued_at: Optional[datetime]
    status: CredentialStatus
    revoked_at: Optional[datetime]
    revoked_by: Optional[int]
    revoke_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CredentialDetailResponse(CredentialResponse):
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    issuer_name: Optional[str] = None
    institution_name: Optional[str] = None
    verification_count: int = 0
    share_count: int = 0


class CredentialVerificationRequest(BaseModel):
    credential_id: Optional[int] = None
    certificate_number: Optional[str] = None
    blockchain_credential_id: Optional[str] = None
    verifier_name: Optional[str] = None
    verifier_email: Optional[str] = None
    verifier_organization: Optional[str] = None


class CredentialVerificationResponse(BaseModel):
    id: int
    credential_id: int
    verifier_name: Optional[str]
    verifier_email: Optional[str]
    verifier_organization: Optional[str]
    verifier_ip: Optional[str]
    verification_method: str
    verification_result: str
    metadata: Optional[Dict[str, Any]]
    verified_at: datetime
    credential: Optional[CredentialResponse] = None

    class Config:
        from_attributes = True


class CredentialShareCreate(BaseModel):
    recipient_email: Optional[str] = None
    recipient_name: Optional[str] = None
    expires_at: Optional[datetime] = None


class CredentialShareResponse(BaseModel):
    id: int
    credential_id: int
    share_token: str
    share_url: str
    recipient_email: Optional[str]
    recipient_name: Optional[str]
    expires_at: Optional[datetime]
    is_active: bool
    view_count: int
    last_viewed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CredentialTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    credential_type: CredentialType
    sub_type: CredentialSubType
    template_data: Dict[str, Any]


class CredentialTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    template_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class CredentialTemplateResponse(BaseModel):
    id: int
    institution_id: int
    name: str
    credential_type: CredentialType
    sub_type: CredentialSubType
    template_data: Dict[str, Any]
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PublicCredentialVerificationResponse(BaseModel):
    valid: bool
    credential: Optional[CredentialDetailResponse] = None
    message: str
    verified_at: datetime
    blockchain_verified: bool = False


class CredentialStatistics(BaseModel):
    total_issued: int
    active_credentials: int
    revoked_credentials: int
    expired_credentials: int
    pending_credentials: int
    by_type: Dict[str, int]
    by_subtype: Dict[str, int]
    recent_issuances: List[CredentialResponse]
