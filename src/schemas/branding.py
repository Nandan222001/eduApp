from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, HttpUrl


class ColorScheme(BaseModel):
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    background_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')


class EmailBranding(BaseModel):
    email_logo_url: Optional[str] = None
    email_header_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    email_footer_text: Optional[str] = None
    email_from_name: Optional[str] = Field(None, max_length=100)


class LoginPageCustomization(BaseModel):
    login_background_url: Optional[str] = None
    login_banner_text: Optional[str] = Field(None, max_length=255)
    login_welcome_message: Optional[str] = None


class SocialLinks(BaseModel):
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    website: Optional[str] = None


class InstitutionBrandingBase(BaseModel):
    # Logo and favicon
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    
    # Color scheme
    primary_color: Optional[str] = Field("#1976d2", pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field("#dc004e", pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field("#f50057", pattern=r'^#[0-9A-Fa-f]{6}$')
    background_color: Optional[str] = Field("#ffffff", pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field("#000000", pattern=r'^#[0-9A-Fa-f]{6}$')
    
    # Custom domain
    custom_domain: Optional[str] = Field(None, max_length=255)
    subdomain: Optional[str] = Field(None, max_length=100)
    ssl_enabled: Optional[bool] = False
    
    # Email branding
    email_logo_url: Optional[str] = None
    email_header_color: Optional[str] = Field("#1976d2", pattern=r'^#[0-9A-Fa-f]{6}$')
    email_footer_text: Optional[str] = None
    email_from_name: Optional[str] = Field(None, max_length=100)
    
    # Custom email domain
    custom_email_domain: Optional[str] = Field(None, max_length=255)
    email_domain_verified: Optional[bool] = False
    dkim_valid: Optional[bool] = False
    spf_valid: Optional[bool] = False
    
    # Login page customization
    login_background_url: Optional[str] = None
    login_banner_text: Optional[str] = Field(None, max_length=255)
    login_welcome_message: Optional[str] = None
    
    # Additional customization
    institution_name_override: Optional[str] = Field(None, max_length=255)
    custom_css: Optional[str] = None
    custom_meta_tags: Optional[Dict[str, Any]] = None
    
    # Social media links
    social_links: Optional[Dict[str, str]] = None
    
    # Branded notification sounds
    branded_notification_sounds: Optional[Dict[str, Any]] = None
    
    # Loading screen and animations
    loading_screen_animation_url: Optional[str] = None
    splash_screen_config: Optional[Dict[str, Any]] = None
    
    # Custom help and merchandise
    custom_help_docs_url: Optional[str] = Field(None, max_length=500)
    merchandise_store_enabled: Optional[bool] = False
    
    # Feature flags
    show_powered_by: Optional[bool] = True
    is_active: Optional[bool] = True


class InstitutionBrandingCreate(InstitutionBrandingBase):
    institution_id: int


class InstitutionBrandingUpdate(BaseModel):
    # Logo and favicon
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    
    # Color scheme
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    accent_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    background_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    
    # Custom domain
    custom_domain: Optional[str] = Field(None, max_length=255)
    subdomain: Optional[str] = Field(None, max_length=100)
    ssl_enabled: Optional[bool] = None
    
    # Email branding
    email_logo_url: Optional[str] = None
    email_header_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    email_footer_text: Optional[str] = None
    email_from_name: Optional[str] = Field(None, max_length=100)
    
    # Custom email domain
    custom_email_domain: Optional[str] = Field(None, max_length=255)
    email_domain_verified: Optional[bool] = None
    dkim_valid: Optional[bool] = None
    spf_valid: Optional[bool] = None
    
    # Login page customization
    login_background_url: Optional[str] = None
    login_banner_text: Optional[str] = Field(None, max_length=255)
    login_welcome_message: Optional[str] = None
    
    # Additional customization
    institution_name_override: Optional[str] = Field(None, max_length=255)
    custom_css: Optional[str] = None
    custom_meta_tags: Optional[Dict[str, Any]] = None
    
    # Social media links
    social_links: Optional[Dict[str, str]] = None
    
    # Branded notification sounds
    branded_notification_sounds: Optional[Dict[str, Any]] = None
    
    # Loading screen and animations
    loading_screen_animation_url: Optional[str] = None
    splash_screen_config: Optional[Dict[str, Any]] = None
    
    # Custom help and merchandise
    custom_help_docs_url: Optional[str] = Field(None, max_length=500)
    merchandise_store_enabled: Optional[bool] = None
    
    # Feature flags
    show_powered_by: Optional[bool] = None
    is_active: Optional[bool] = None


class InstitutionBrandingResponse(InstitutionBrandingBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    logo_s3_key: Optional[str] = None
    favicon_s3_key: Optional[str] = None
    email_logo_s3_key: Optional[str] = None
    login_background_s3_key: Optional[str] = None
    loading_screen_animation_s3_key: Optional[str] = None
    domain_verified: bool = False
    sendgrid_domain_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class BrandingPreviewResponse(BaseModel):
    branding: InstitutionBrandingResponse
    institution_name: str
    preview_url: str


class CustomDomainRequest(BaseModel):
    custom_domain: str = Field(..., max_length=255)
    ssl_enabled: bool = False


class CustomDomainResponse(BaseModel):
    custom_domain: str
    subdomain: Optional[str]
    domain_verified: bool
    ssl_enabled: bool
    verification_instructions: str
    dns_records: list[Dict[str, str]]


class UploadLogoResponse(BaseModel):
    url: str
    s3_key: str
    field: str


class EmailDomainSetupRequest(BaseModel):
    domain: str = Field(..., max_length=255)


class EmailDomainSetupResponse(BaseModel):
    domain: str
    sendgrid_domain_id: str
    dns_records: list[Dict[str, str]]
    verification_status: Dict[str, bool]
    instructions: str


class EmailDomainVerificationResponse(BaseModel):
    domain: str
    verification_status: Dict[str, bool]
    message: str


class AuthenticatedSenderRequest(BaseModel):
    from_email: str
    from_name: str
    reply_to: Optional[str] = None


class AuthenticatedSenderResponse(BaseModel):
    sender_id: str
    from_email: str
    from_name: str
    reply_to: str
    verification_required: bool


class NotificationSoundUploadResponse(BaseModel):
    notification_type: str
    url: str
    duration_ms: int
    waveform: list


class LoadingAnimationUploadResponse(BaseModel):
    url: str
    type: str
    size: int


class SplashScreenConfig(BaseModel):
    background_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    logo_url: Optional[str] = None
    tagline: Optional[str] = None
    duration_ms: Optional[int] = Field(None, ge=500, le=5000)
    fade_animation: Optional[bool] = True
    show_progress_bar: Optional[bool] = True
