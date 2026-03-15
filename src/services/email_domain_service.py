from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import httpx
import re
from datetime import datetime

from src.models.branding import InstitutionBranding
from src.config import settings


class EmailDomainService:
    """Service for managing custom email domains with SendGrid integration."""
    
    SENDGRID_API_BASE = "https://api.sendgrid.com/v3"
    
    def __init__(self):
        self.api_key = settings.sendgrid_api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def setup_email_domain(
        self,
        db: Session,
        institution_id: int,
        domain: str
    ) -> Dict[str, Any]:
        """
        Set up custom email domain with SendGrid.
        Creates domain whitelabel and returns DNS records for verification.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution branding not found"
            )
        
        # Validate domain format
        if not self._validate_domain_format(domain):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid domain format"
            )
        
        # Check if domain is already in use
        existing = db.query(InstitutionBranding).filter(
            InstitutionBranding.custom_email_domain == domain,
            InstitutionBranding.id != branding.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email domain is already in use"
            )
        
        # Create domain whitelabel in SendGrid
        try:
            sendgrid_response = await self._create_sendgrid_domain(domain)
            
            # Update branding with domain info
            branding.custom_email_domain = domain
            branding.sendgrid_domain_id = str(sendgrid_response.get("id"))
            branding.email_domain_verified = False
            branding.dkim_valid = False
            branding.spf_valid = False
            branding.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(branding)
            
            # Extract DNS records from SendGrid response
            dns_records = self._extract_dns_records(sendgrid_response)
            
            return {
                "domain": domain,
                "sendgrid_domain_id": branding.sendgrid_domain_id,
                "dns_records": dns_records,
                "verification_status": {
                    "domain_verified": False,
                    "dkim_valid": False,
                    "spf_valid": False
                },
                "instructions": (
                    "Add the following DNS records to your domain. "
                    "Verification may take up to 48 hours."
                )
            }
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"SendGrid API error: {e.response.text}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to set up email domain: {str(e)}"
            )
    
    async def verify_email_domain(
        self,
        db: Session,
        institution_id: int
    ) -> Dict[str, Any]:
        """
        Verify email domain with SendGrid.
        Checks DKIM and SPF records.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding or not branding.custom_email_domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No custom email domain configured"
            )
        
        if not branding.sendgrid_domain_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email domain not properly initialized"
            )
        
        try:
            # Validate domain with SendGrid
            validation_result = await self._validate_sendgrid_domain(
                branding.sendgrid_domain_id
            )
            
            # Get domain status
            domain_status = await self._get_sendgrid_domain(
                branding.sendgrid_domain_id
            )
            
            # Update branding with verification status
            branding.email_domain_verified = domain_status.get("valid", False)
            branding.dkim_valid = domain_status.get("dkim", {}).get("valid", False)
            branding.spf_valid = domain_status.get("spf", {}).get("valid", False)
            branding.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(branding)
            
            return {
                "domain": branding.custom_email_domain,
                "verification_status": {
                    "domain_verified": branding.email_domain_verified,
                    "dkim_valid": branding.dkim_valid,
                    "spf_valid": branding.spf_valid
                },
                "message": (
                    "Domain verified successfully" 
                    if branding.email_domain_verified 
                    else "Domain verification pending"
                )
            }
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"SendGrid API error: {e.response.text}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to verify email domain: {str(e)}"
            )
    
    async def create_authenticated_sender(
        self,
        db: Session,
        institution_id: int,
        from_email: str,
        from_name: str,
        reply_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create authenticated sender for custom email domain.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding or not branding.custom_email_domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No custom email domain configured"
            )
        
        if not branding.email_domain_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email domain must be verified before creating authenticated sender"
            )
        
        # Validate from_email matches custom domain
        email_domain = from_email.split('@')[1] if '@' in from_email else None
        if email_domain != branding.custom_email_domain:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"From email must use domain: {branding.custom_email_domain}"
            )
        
        try:
            sender_data = {
                "nickname": f"{from_name} - Institution {institution_id}",
                "from": {
                    "email": from_email,
                    "name": from_name
                },
                "reply_to": {
                    "email": reply_to or from_email,
                    "name": from_name
                },
                "address": "123 Main St",
                "city": "City",
                "state": "State",
                "zip": "12345",
                "country": "United States"
            }
            
            sender_response = await self._create_sendgrid_sender(sender_data)
            
            # Update branding
            branding.email_from_name = from_name
            branding.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(branding)
            
            return {
                "sender_id": sender_response.get("id"),
                "from_email": from_email,
                "from_name": from_name,
                "reply_to": reply_to or from_email,
                "verification_required": sender_response.get("verified", False) is False
            }
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"SendGrid API error: {e.response.text}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create authenticated sender: {str(e)}"
            )
    
    async def get_dns_records(
        self,
        db: Session,
        institution_id: int
    ) -> List[Dict[str, str]]:
        """
        Get DNS records for email domain configuration.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding or not branding.sendgrid_domain_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No email domain configured"
            )
        
        try:
            domain_data = await self._get_sendgrid_domain(branding.sendgrid_domain_id)
            return self._extract_dns_records(domain_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve DNS records: {str(e)}"
            )
    
    async def delete_email_domain(
        self,
        db: Session,
        institution_id: int
    ) -> bool:
        """
        Delete email domain configuration.
        """
        branding = db.query(InstitutionBranding).filter(
            InstitutionBranding.institution_id == institution_id
        ).first()
        
        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution branding not found"
            )
        
        if branding.sendgrid_domain_id:
            try:
                await self._delete_sendgrid_domain(branding.sendgrid_domain_id)
            except Exception:
                pass
        
        # Clear email domain fields
        branding.custom_email_domain = None
        branding.sendgrid_domain_id = None
        branding.email_domain_verified = False
        branding.dkim_valid = False
        branding.spf_valid = False
        branding.updated_at = datetime.utcnow()
        
        db.commit()
        
        return True
    
    async def _create_sendgrid_domain(self, domain: str) -> Dict[str, Any]:
        """Create domain whitelabel in SendGrid."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.SENDGRID_API_BASE}/whitelabel/domains",
                headers=self.headers,
                json={
                    "domain": domain,
                    "subdomain": "em",
                    "automatic_security": True,
                    "custom_spf": False,
                    "default": True
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def _validate_sendgrid_domain(self, domain_id: str) -> Dict[str, Any]:
        """Validate domain with SendGrid."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.SENDGRID_API_BASE}/whitelabel/domains/{domain_id}/validate",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def _get_sendgrid_domain(self, domain_id: str) -> Dict[str, Any]:
        """Get domain details from SendGrid."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.SENDGRID_API_BASE}/whitelabel/domains/{domain_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def _delete_sendgrid_domain(self, domain_id: str) -> None:
        """Delete domain from SendGrid."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.SENDGRID_API_BASE}/whitelabel/domains/{domain_id}",
                headers=self.headers
            )
            response.raise_for_status()
    
    async def _create_sendgrid_sender(self, sender_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create verified sender in SendGrid."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.SENDGRID_API_BASE}/verified_senders",
                headers=self.headers,
                json=sender_data
            )
            response.raise_for_status()
            return response.json()
    
    def _validate_domain_format(self, domain: str) -> bool:
        """Validate domain format."""
        pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
        return bool(re.match(pattern, domain))
    
    def _extract_dns_records(self, sendgrid_response: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract DNS records from SendGrid response."""
        records = []
        
        # DNS records are in 'dns' key
        dns_data = sendgrid_response.get("dns", {})
        
        # DKIM records
        if "dkim1" in dns_data:
            records.append({
                "type": "CNAME",
                "host": dns_data["dkim1"].get("host", ""),
                "value": dns_data["dkim1"].get("data", ""),
                "description": "DKIM Record 1"
            })
        
        if "dkim2" in dns_data:
            records.append({
                "type": "CNAME",
                "host": dns_data["dkim2"].get("host", ""),
                "value": dns_data["dkim2"].get("data", ""),
                "description": "DKIM Record 2"
            })
        
        # SPF/Mail CNAME
        if "mail_cname" in dns_data:
            records.append({
                "type": "CNAME",
                "host": dns_data["mail_cname"].get("host", ""),
                "value": dns_data["mail_cname"].get("data", ""),
                "description": "Mail CNAME"
            })
        
        return records


email_domain_service = EmailDomainService()
