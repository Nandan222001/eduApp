from typing import Optional, BinaryIO, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from src.models.branding import InstitutionBranding
from src.models.institution import Institution
from src.schemas.branding import (
    InstitutionBrandingCreate,
    InstitutionBrandingUpdate,
    CustomDomainRequest,
)
from src.utils.s3_client import s3_client
from datetime import datetime
import re


class BrandingService:
    
    @staticmethod
    def get_branding_by_institution_id(
        db: Session,
        institution_id: int
    ) -> Optional[InstitutionBranding]:
        """Get branding for an institution."""
        return db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
    
    @staticmethod
    def get_branding_by_domain(
        db: Session,
        domain: str
    ) -> Optional[InstitutionBranding]:
        """Get branding by custom domain or subdomain."""
        return db.query(InstitutionBranding).filter(
            (InstitutionBranding.custom_domain == domain) |
            (InstitutionBranding.subdomain == domain)
        ).first()
    
    @staticmethod
    def create_branding(
        db: Session,
        branding_data: InstitutionBrandingCreate
    ) -> InstitutionBranding:
        """Create branding for an institution."""
        # Verify institution exists
        institution = db.query(Institution).filter(
            Institution.id == branding_data.institution_id
        ).first()
        
        if not institution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution not found"
            )
        
        # Check if branding already exists
        existing = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == branding_data.institution_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branding already exists for this institution"
            )
        
        # Validate custom domain/subdomain uniqueness
        if branding_data.custom_domain:
            BrandingService._validate_domain_uniqueness(
                db, branding_data.custom_domain, None
            )
        
        if branding_data.subdomain:
            BrandingService._validate_subdomain_uniqueness(
                db, branding_data.subdomain, None
            )
        
        # Create branding
        branding = InstitutionBranding(**branding_data.model_dump())
        db.add(branding)
        db.commit()
        db.refresh(branding)
        
        return branding
    
    @staticmethod
    def update_branding(
        db: Session,
        institution_id: int,
        branding_data: InstitutionBrandingUpdate
    ) -> InstitutionBranding:
        """Update branding for an institution."""
        branding = BrandingService.get_branding_by_institution_id(db, institution_id)
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found for this institution"
            )
        
        # Validate domain/subdomain if being updated
        update_data = branding_data.model_dump(exclude_unset=True)
        
        if "custom_domain" in update_data and update_data["custom_domain"]:
            BrandingService._validate_domain_uniqueness(
                db, update_data["custom_domain"], branding.id
            )
            # Reset verification when domain changes
            if update_data["custom_domain"] != branding.custom_domain:
                update_data["domain_verified"] = False
        
        if "subdomain" in update_data and update_data["subdomain"]:
            BrandingService._validate_subdomain_uniqueness(
                db, update_data["subdomain"], branding.id
            )
        
        # Update fields
        for key, value in update_data.items():
            setattr(branding, key, value)
        
        branding.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(branding)
        
        return branding
    
    @staticmethod
    def upload_logo(
        db: Session,
        institution_id: int,
        file: UploadFile,
        field: str
    ) -> tuple[str, str]:
        """Upload a logo/image to S3 and update branding."""
        branding = BrandingService.get_branding_by_institution_id(db, institution_id)
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found for this institution"
            )
        
        # Validate field
        valid_fields = ["logo", "favicon", "email_logo", "login_background"]
        if field not in valid_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid field. Must be one of: {', '.join(valid_fields)}"
            )
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Validate file size (10MB)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 10MB"
            )
        
        # Delete old file if exists
        old_s3_key = getattr(branding, f"{field}_s3_key", None)
        if old_s3_key:
            try:
                s3_client.delete_file(old_s3_key)
            except Exception:
                pass
        
        # Upload to S3
        try:
            folder = f"branding/{institution_id}/{field}"
            file_url, s3_key = s3_client.upload_file(
                file.file,
                file.filename,
                folder=folder,
                content_type=file.content_type
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
        
        # Update branding
        setattr(branding, f"{field}_url", file_url)
        setattr(branding, f"{field}_s3_key", s3_key)
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(branding)
        
        return file_url, s3_key
    
    @staticmethod
    def set_custom_domain(
        db: Session,
        institution_id: int,
        domain_data: CustomDomainRequest
    ) -> Dict[str, Any]:
        """Set custom domain for an institution."""
        branding = BrandingService.get_branding_by_institution_id(db, institution_id)
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found for this institution"
            )
        
        # Validate domain format
        domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
        if not re.match(domain_pattern, domain_data.custom_domain):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid domain format"
            )
        
        # Check uniqueness
        BrandingService._validate_domain_uniqueness(
            db, domain_data.custom_domain, branding.id
        )
        
        # Update branding
        branding.custom_domain = domain_data.custom_domain
        branding.ssl_enabled = domain_data.ssl_enabled
        branding.domain_verified = False
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(branding)
        
        # Generate DNS verification records
        dns_records = BrandingService._generate_dns_records(domain_data.custom_domain)
        
        return {
            "custom_domain": branding.custom_domain,
            "subdomain": branding.subdomain,
            "domain_verified": branding.domain_verified,
            "ssl_enabled": branding.ssl_enabled,
            "verification_instructions": (
                "Add the following DNS records to verify domain ownership. "
                "Verification may take up to 48 hours."
            ),
            "dns_records": dns_records
        }
    
    @staticmethod
    def verify_domain(
        db: Session,
        institution_id: int
    ) -> bool:
        """Verify custom domain ownership."""
        branding = BrandingService.get_branding_by_institution_id(db, institution_id)
        
        if not branding or not branding.custom_domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No custom domain configured"
            )
        
        # In production, this would check DNS records
        # For now, we'll simulate verification
        branding.domain_verified = True
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(branding)
        
        return True
    
    @staticmethod
    def get_branding_preview(
        db: Session,
        institution_id: int
    ) -> Dict[str, Any]:
        """Get branding preview data."""
        branding = BrandingService.get_branding_by_institution_id(db, institution_id)
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found for this institution"
            )
        
        institution = db.query(Institution).filter(
            Institution.id == institution_id
        ).first()
        
        # Generate preview URL
        if branding.custom_domain and branding.domain_verified:
            preview_url = f"https://{branding.custom_domain}"
        elif branding.subdomain:
            preview_url = f"https://{branding.subdomain}.yourdomain.com"
        else:
            preview_url = f"https://app.yourdomain.com/institution/{institution.slug}"
        
        return {
            "branding": branding,
            "institution_name": branding.institution_name_override or institution.name,
            "preview_url": preview_url
        }
    
    @staticmethod
    def delete_branding(
        db: Session,
        institution_id: int
    ) -> bool:
        """Delete branding and associated S3 files."""
        branding = BrandingService.get_branding_by_institution_id(db, institution_id)
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found for this institution"
            )
        
        # Delete S3 files
        s3_keys = [
            branding.logo_s3_key,
            branding.favicon_s3_key,
            branding.email_logo_s3_key,
            branding.login_background_s3_key,
            branding.loading_screen_animation_s3_key
        ]
        
        # Delete notification sounds
        if branding.branded_notification_sounds:
            for sound_config in branding.branded_notification_sounds.values():
                if isinstance(sound_config, dict) and sound_config.get("s3_key"):
                    s3_keys.append(sound_config["s3_key"])
        
        for s3_key in s3_keys:
            if s3_key:
                try:
                    s3_client.delete_file(s3_key)
                except Exception:
                    pass
        
        db.delete(branding)
        db.commit()
        
        return True
    
    @staticmethod
    def update_custom_settings(
        db: Session,
        institution_id: int,
        custom_help_docs_url: Optional[str] = None,
        merchandise_store_enabled: Optional[bool] = None
    ) -> InstitutionBranding:
        """Update custom help docs URL and merchandise store settings."""
        branding = BrandingService.get_branding_by_institution_id(db, institution_id)
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found for this institution"
            )
        
        if custom_help_docs_url is not None:
            branding.custom_help_docs_url = custom_help_docs_url
        
        if merchandise_store_enabled is not None:
            branding.merchandise_store_enabled = merchandise_store_enabled
        
        branding.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(branding)
        
        return branding
    
    @staticmethod
    def _validate_domain_uniqueness(
        db: Session,
        domain: str,
        exclude_id: Optional[int] = None
    ) -> None:
        """Validate that custom domain is unique."""
        query = db.query(InstitutionBranding).filter(
            InstitutionBranding.custom_domain == domain
        )
        
        if exclude_id:
            query = query.filter(InstitutionBranding.id != exclude_id)
        
        if query.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This custom domain is already in use"
            )
    
    @staticmethod
    def _validate_subdomain_uniqueness(
        db: Session,
        subdomain: str,
        exclude_id: Optional[int] = None
    ) -> None:
        """Validate that subdomain is unique."""
        query = db.query(InstitutionBranding).filter(
            InstitutionBranding.subdomain == subdomain
        )
        
        if exclude_id:
            query = query.filter(InstitutionBranding.id != exclude_id)
        
        if query.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This subdomain is already in use"
            )
    
    @staticmethod
    def _generate_dns_records(domain: str) -> list[Dict[str, str]]:
        """Generate DNS verification records."""
        return [
            {
                "type": "CNAME",
                "name": domain,
                "value": "app.yourdomain.com",
                "ttl": "3600"
            },
            {
                "type": "TXT",
                "name": f"_verification.{domain}",
                "value": "domain-verification=xyz123",
                "ttl": "3600"
            }
        ]


branding_service = BrandingService()
