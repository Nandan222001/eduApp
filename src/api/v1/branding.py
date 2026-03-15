from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.branding import (
    InstitutionBrandingCreate,
    InstitutionBrandingUpdate,
    InstitutionBrandingResponse,
    BrandingPreviewResponse,
    CustomDomainRequest,
    CustomDomainResponse,
    UploadLogoResponse,
    EmailDomainSetupRequest,
    EmailDomainSetupResponse,
    EmailDomainVerificationResponse,
    AuthenticatedSenderRequest,
    AuthenticatedSenderResponse,
    NotificationSoundUploadResponse,
    LoadingAnimationUploadResponse,
    SplashScreenConfig,
)
from src.services.branding_service import branding_service
from src.services.email_domain_service import email_domain_service
from src.services.branded_media_service import branded_media_service

router = APIRouter(prefix="/branding", tags=["Branding"])


@router.post("/", response_model=InstitutionBrandingResponse, status_code=status.HTTP_201_CREATED)
def create_branding(
    branding_data: InstitutionBrandingCreate,
    db: Session = Depends(get_db)
):
    """Create branding configuration for an institution."""
    return branding_service.create_branding(db, branding_data)


@router.get("/institution/{institution_id}", response_model=InstitutionBrandingResponse)
def get_branding(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Get branding for an institution."""
    branding = branding_service.get_branding_by_institution_id(db, institution_id)
    if not branding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branding not found"
        )
    return branding


@router.put("/institution/{institution_id}", response_model=InstitutionBrandingResponse)
def update_branding(
    institution_id: int,
    branding_data: InstitutionBrandingUpdate,
    db: Session = Depends(get_db)
):
    """Update branding for an institution."""
    return branding_service.update_branding(db, institution_id, branding_data)


@router.post("/institution/{institution_id}/logo", response_model=UploadLogoResponse)
async def upload_logo(
    institution_id: int,
    field: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload logo, favicon, email logo, or login background."""
    url, s3_key = branding_service.upload_logo(db, institution_id, file, field)
    return UploadLogoResponse(url=url, s3_key=s3_key, field=field)


@router.post("/institution/{institution_id}/domain", response_model=CustomDomainResponse)
def set_custom_domain(
    institution_id: int,
    domain_data: CustomDomainRequest,
    db: Session = Depends(get_db)
):
    """Set custom domain for an institution."""
    return branding_service.set_custom_domain(db, institution_id, domain_data)


@router.post("/institution/{institution_id}/domain/verify")
def verify_domain(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Verify custom domain ownership."""
    verified = branding_service.verify_domain(db, institution_id)
    return {"verified": verified}


@router.get("/institution/{institution_id}/preview", response_model=BrandingPreviewResponse)
def get_branding_preview(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Get branding preview."""
    return branding_service.get_branding_preview(db, institution_id)


@router.delete("/institution/{institution_id}")
def delete_branding(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Delete branding configuration."""
    branding_service.delete_branding(db, institution_id)
    return {"message": "Branding deleted successfully"}


# Email Domain Routes
@router.post("/institution/{institution_id}/email-domain", response_model=EmailDomainSetupResponse)
async def setup_email_domain(
    institution_id: int,
    request: EmailDomainSetupRequest,
    db: Session = Depends(get_db)
):
    """Set up custom email domain with SendGrid."""
    return await email_domain_service.setup_email_domain(db, institution_id, request.domain)


@router.post("/institution/{institution_id}/email-domain/verify", response_model=EmailDomainVerificationResponse)
async def verify_email_domain(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Verify custom email domain."""
    return await email_domain_service.verify_email_domain(db, institution_id)


@router.post("/institution/{institution_id}/email-domain/sender", response_model=AuthenticatedSenderResponse)
async def create_authenticated_sender(
    institution_id: int,
    request: AuthenticatedSenderRequest,
    db: Session = Depends(get_db)
):
    """Create authenticated sender for custom email domain."""
    return await email_domain_service.create_authenticated_sender(
        db, 
        institution_id, 
        request.from_email, 
        request.from_name, 
        request.reply_to
    )


@router.get("/institution/{institution_id}/email-domain/dns")
async def get_email_domain_dns_records(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Get DNS records for email domain configuration."""
    return await email_domain_service.get_dns_records(db, institution_id)


@router.delete("/institution/{institution_id}/email-domain")
async def delete_email_domain(
    institution_id: int,
    db: Session = Depends(get_db)
):
    """Delete email domain configuration."""
    await email_domain_service.delete_email_domain(db, institution_id)
    return {"message": "Email domain deleted successfully"}


# Notification Sound Routes
@router.post("/institution/{institution_id}/notification-sound/{notification_type}", 
             response_model=NotificationSoundUploadResponse)
async def upload_notification_sound(
    institution_id: int,
    notification_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a notification sound for a specific notification type."""
    return await branded_media_service.upload_notification_sound(
        db, institution_id, notification_type, file
    )


@router.delete("/institution/{institution_id}/notification-sound/{notification_type}")
def delete_notification_sound(
    institution_id: int,
    notification_type: str,
    db: Session = Depends(get_db)
):
    """Delete a notification sound."""
    branded_media_service.delete_notification_sound(db, institution_id, notification_type)
    return {"message": "Notification sound deleted successfully"}


# Loading Animation Routes
@router.post("/institution/{institution_id}/loading-animation", 
             response_model=LoadingAnimationUploadResponse)
async def upload_loading_animation(
    institution_id: int,
    animation_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload loading screen animation (Lottie JSON, GIF, or video)."""
    return await branded_media_service.upload_loading_animation(
        db, institution_id, file, animation_type
    )


# Splash Screen Routes
@router.put("/institution/{institution_id}/splash-screen", response_model=SplashScreenConfig)
def update_splash_screen_config(
    institution_id: int,
    config: SplashScreenConfig,
    db: Session = Depends(get_db)
):
    """Update splash screen configuration."""
    return branded_media_service.update_splash_screen_config(
        db, institution_id, config.model_dump(exclude_unset=True)
    )


# Custom Settings Routes
@router.put("/institution/{institution_id}/custom-settings", response_model=InstitutionBrandingResponse)
def update_custom_settings(
    institution_id: int,
    custom_help_docs_url: Optional[str] = None,
    merchandise_store_enabled: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Update custom help docs URL and merchandise store settings."""
    return branding_service.update_custom_settings(
        db, institution_id, custom_help_docs_url, merchandise_store_enabled
    )
