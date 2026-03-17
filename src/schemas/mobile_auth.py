from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class BiometricSetupRequest(BaseModel):
    enabled: bool
    biometric_type: str
    device_id: Optional[int] = None
    device_fingerprint: Optional[str] = None


class BiometricSetupResponse(BaseModel):
    success: bool
    enabled: bool
    biometric_type: Optional[str] = None
    message: str


class DeviceRegistrationRequest(BaseModel):
    device_name: str
    device_type: str
    device_fingerprint: str
    device_model: Optional[str] = None
    os_version: Optional[str] = None
    app_version: Optional[str] = None


class DeviceRegistrationResponse(BaseModel):
    device_id: int
    is_new: bool
    is_trusted: bool
    message: str


class PinSetupRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6)
    enabled: bool
    device_id: Optional[int] = None
    device_fingerprint: Optional[str] = None


class PinVerifyRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6)
    device_id: Optional[int] = None


class SecuritySettingsRequest(BaseModel):
    session_timeout_minutes: Optional[int] = Field(None, ge=5, le=1440)
    auto_lock_minutes: Optional[int] = Field(None, ge=1, le=60)
    require_biometric_for_sensitive: Optional[bool] = None


class SecuritySettingsResponse(BaseModel):
    biometric_enabled: bool
    pin_enabled: bool
    session_timeout_minutes: int
    auto_lock_minutes: int
    require_biometric_for_sensitive: bool


class SensitiveOperationRequest(BaseModel):
    operation_type: str
    operation_details: Optional[str] = None
    auth_method: str
    auth_success: bool
    device_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class DeviceListResponse(BaseModel):
    id: int
    device_name: str
    device_type: str
    device_model: Optional[str] = None
    os_version: Optional[str] = None
    last_active: datetime
    is_current: bool
    is_trusted: bool
    biometric_enabled: bool
    biometric_type: Optional[str] = None
    created_at: datetime


class AuthEventResponse(BaseModel):
    id: int
    event_type: str
    auth_method: str
    success: bool
    failure_reason: Optional[str] = None
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime


class MessageResponse(BaseModel):
    message: str
