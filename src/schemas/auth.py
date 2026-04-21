from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int
    institution_id: int
    role_id: int
    email: str
    exp: int
    type: str = "access"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    institution_id: Optional[int] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class MessageResponse(BaseModel):
    message: str


class RoleInfo(BaseModel):
    id: int
    name: str
    slug: str


class InstitutionInfo(BaseModel):
    id: int
    name: str
    slug: str


class UserInfo(BaseModel):
    id: int
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    institution_id: int
    role_id: int
    role_slug: Optional[str] = None
    is_active: bool
    is_superuser: bool
    email_verified: bool
    last_login: Optional[datetime] = None
    permissions: List[str]
    role: Optional[RoleInfo] = None
    institution: Optional[InstitutionInfo] = None


class LoginResponse(Token):
    user: UserInfo
