from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional
from datetime import datetime


class NotificationChannel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    email: bool = True
    push: bool = True
    sms: bool = False
    in_app: bool = True


class NotificationPreferences(BaseModel):
    assignment_created: NotificationChannel = NotificationChannel()
    assignment_graded: NotificationChannel = NotificationChannel()
    exam_scheduled: NotificationChannel = NotificationChannel()
    exam_result_published: NotificationChannel = NotificationChannel()
    announcement_posted: NotificationChannel = NotificationChannel()
    message_received: NotificationChannel = NotificationChannel()
    goal_achieved: NotificationChannel = NotificationChannel()
    badge_earned: NotificationChannel = NotificationChannel()
    attendance_marked: NotificationChannel = NotificationChannel()
    fee_due: NotificationChannel = NotificationChannel()
    material_shared: NotificationChannel = NotificationChannel()
    doubt_answered: NotificationChannel = NotificationChannel()


class ThemeSettings(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    mode: str = Field(default='auto', pattern='^(light|dark|auto)$')
    primary_color: Optional[str] = None
    font_size: str = Field(default='medium', pattern='^(small|medium|large)$')
    compact_mode: bool = False


class PrivacySettings(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    profile_public: bool = True
    show_in_leaderboard: bool = True
    show_email: bool = False
    show_phone: bool = False
    allow_messages: bool = True
    show_online_status: bool = True


class UserSettingsResponse(BaseModel):
    notifications: NotificationPreferences
    theme: ThemeSettings
    privacy: PrivacySettings
    language: str
    timezone: str

    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    notifications: Optional[NotificationPreferences] = None
    theme: Optional[ThemeSettings] = None
    privacy: Optional[PrivacySettings] = None
    language: Optional[str] = None
    timezone: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class ConnectedDevice(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    device_name: str
    device_type: str
    browser: Optional[str] = None
    os: Optional[str] = None
    ip_address: str
    location: Optional[str] = None
    last_active: datetime
    is_current: bool

    class Config:
        from_attributes = True


class AccountDeletionRequestCreate(BaseModel):
    reason: str = Field(..., min_length=1, max_length=50)
    feedback: Optional[str] = Field(None, max_length=1000)
    password: str = Field(..., min_length=1)


class AccountDeletionRequestResponse(BaseModel):
    message: str
    request_id: str
