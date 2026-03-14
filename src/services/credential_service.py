from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
import logging
import uuid
import hashlib
import json
import qrcode
import io
import base64
from fastapi import HTTPException

from src.models.digital_credential import (
    DigitalCredential,
    CredentialVerification,
    CredentialShare,
    CredentialTemplate,
    CredentialType,
    CredentialSubType,
    CredentialStatus
)
from src.models.user import User
from src.models.institution import Institution
from src.schemas.credential import (
    CredentialCreate,
    CredentialBulkCreate,
    CredentialUpdate,
    CredentialRevoke,
    CredentialShareCreate,
    CredentialTemplateCreate,
    CredentialTemplateUpdate
)
from src.services.blockchain_service import BlockchainService
from src.config import settings

logger = logging.getLogger(__name__)


class CredentialService:
    def __init__(self, db: Session):
        self.db = db
        self.blockchain_service = BlockchainService()

    def _generate_certificate_number(self, institution_id: int) -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_component = uuid.uuid4().hex[:8].upper()
        return f"CERT-{institution_id}-{timestamp}-{random_component}"

    def _generate_verification_url(self, credential_id: int, certificate_number: str) -> str:
        base_url = getattr(settings, 'app_url', 'http://localhost:8000')
        return f"{base_url}/verify/credential/{certificate_number}"

    def _generate_qr_code(self, verification_url: str) -> str:
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"

    def issue_credential(
        self,
        institution_id: int,
        issuer_id: int,
        credential_data: CredentialCreate
    ) -> DigitalCredential:
        recipient = self.db.query(User).filter(
            User.id == credential_data.recipient_id,
            User.institution_id == institution_id
        ).first()
        
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")

        certificate_number = self._generate_certificate_number(institution_id)
        
        credential = DigitalCredential(
            institution_id=institution_id,
            recipient_id=credential_data.recipient_id,
            issuer_id=issuer_id,
            credential_type=credential_data.credential_type,
            sub_type=credential_data.sub_type,
            title=credential_data.title,
            description=credential_data.description,
            certificate_number=certificate_number,
            skills=credential_data.skills or [],
            metadata=credential_data.metadata or {},
            expires_at=credential_data.expires_at,
            course_id=credential_data.course_id,
            exam_id=credential_data.exam_id,
            assignment_id=credential_data.assignment_id,
            grade=credential_data.grade,
            score=credential_data.score,
            status=CredentialStatus.PENDING
        )
        
        self.db.add(credential)
        self.db.flush()
        
        verification_url = self._generate_verification_url(credential.id, certificate_number)
        qr_code_url = self._generate_qr_code(verification_url)
        
        credential.verification_url = verification_url
        credential.qr_code_url = qr_code_url
        
        try:
            blockchain_credential_id = f"CRED-{credential.id}-{uuid.uuid4().hex[:8]}"
            
            blockchain_data = {
                "credentialId": blockchain_credential_id,
                "recipientId": str(credential_data.recipient_id),
                "recipientName": f"{recipient.first_name} {recipient.last_name}",
                "recipientEmail": recipient.email,
                "issuerId": str(issuer_id),
                "issuerName": "Institution Issuer",
                "credentialType": credential_data.credential_type.value,
                "subType": credential_data.sub_type.value,
                "title": credential_data.title,
                "description": credential_data.description or "",
                "skills": credential_data.skills or [],
                "metadata": json.dumps(credential_data.metadata or {}),
                "expiresAt": credential_data.expires_at.isoformat() if credential_data.expires_at else ""
            }
            
            blockchain_hash = self.blockchain_service.issue_credential(blockchain_data)
            
            credential.blockchain_hash = blockchain_hash
            credential.blockchain_credential_id = blockchain_credential_id
            credential.blockchain_status = "issued"
            credential.issued_at = datetime.utcnow()
            credential.status = CredentialStatus.ACTIVE
            
        except Exception as e:
            logger.error(f"Failed to issue credential to blockchain: {str(e)}")
            credential.blockchain_status = "failed"
            credential.status = CredentialStatus.PENDING
        
        self.db.commit()
        self.db.refresh(credential)
        
        return credential

    def bulk_issue_credentials(
        self,
        institution_id: int,
        issuer_id: int,
        credential_data: CredentialBulkCreate
    ) -> List[DigitalCredential]:
        credentials = []
        
        for recipient_id in credential_data.recipient_ids:
            try:
                single_credential = CredentialCreate(
                    recipient_id=recipient_id,
                    credential_type=credential_data.credential_type,
                    sub_type=credential_data.sub_type,
                    title=credential_data.title,
                    description=credential_data.description,
                    skills=credential_data.skills,
                    metadata=credential_data.metadata,
                    expires_at=credential_data.expires_at,
                    course_id=credential_data.course_id,
                    exam_id=credential_data.exam_id,
                    assignment_id=credential_data.assignment_id
                )
                
                credential = self.issue_credential(institution_id, issuer_id, single_credential)
                credentials.append(credential)
            except Exception as e:
                logger.error(f"Failed to issue credential to recipient {recipient_id}: {str(e)}")
                continue
        
        return credentials

    def verify_credential(
        self,
        certificate_number: Optional[str] = None,
        blockchain_credential_id: Optional[str] = None,
        credential_id: Optional[int] = None,
        verifier_name: Optional[str] = None,
        verifier_email: Optional[str] = None,
        verifier_organization: Optional[str] = None,
        verifier_ip: Optional[str] = None
    ) -> Dict[str, Any]:
        query = self.db.query(DigitalCredential)
        
        if credential_id:
            query = query.filter(DigitalCredential.id == credential_id)
        elif certificate_number:
            query = query.filter(DigitalCredential.certificate_number == certificate_number)
        elif blockchain_credential_id:
            query = query.filter(DigitalCredential.blockchain_credential_id == blockchain_credential_id)
        else:
            raise HTTPException(status_code=400, detail="Must provide credential identifier")
        
        credential = query.first()
        
        if not credential:
            verification = CredentialVerification(
                credential_id=None,
                verifier_name=verifier_name,
                verifier_email=verifier_email,
                verifier_organization=verifier_organization,
                verifier_ip=verifier_ip,
                verification_method="certificate_number" if certificate_number else "blockchain_id",
                verification_result="not_found"
            )
            self.db.add(verification)
            self.db.commit()
            
            return {
                "valid": False,
                "credential": None,
                "message": "Credential not found",
                "verified_at": datetime.utcnow(),
                "blockchain_verified": False
            }
        
        blockchain_verified = False
        if credential.blockchain_credential_id:
            try:
                blockchain_credential = self.blockchain_service.verify_credential(
                    credential.blockchain_credential_id
                )
                blockchain_verified = blockchain_credential is not None
            except Exception as e:
                logger.error(f"Blockchain verification failed: {str(e)}")
        
        is_valid = (
            credential.status == CredentialStatus.ACTIVE and
            (credential.expires_at is None or credential.expires_at > datetime.utcnow())
        )
        
        verification = CredentialVerification(
            credential_id=credential.id,
            verifier_name=verifier_name,
            verifier_email=verifier_email,
            verifier_organization=verifier_organization,
            verifier_ip=verifier_ip,
            verification_method="certificate_number" if certificate_number else "blockchain_id",
            verification_result="valid" if is_valid else "invalid",
            metadata={
                "blockchain_verified": blockchain_verified,
                "status": credential.status.value,
                "expired": credential.expires_at < datetime.utcnow() if credential.expires_at else False
            }
        )
        self.db.add(verification)
        self.db.commit()
        
        return {
            "valid": is_valid,
            "credential": credential,
            "message": "Credential is valid" if is_valid else "Credential is not valid",
            "verified_at": datetime.utcnow(),
            "blockchain_verified": blockchain_verified
        }

    def revoke_credential(
        self,
        credential_id: int,
        institution_id: int,
        revoked_by: int,
        reason: str
    ) -> DigitalCredential:
        credential = self.db.query(DigitalCredential).filter(
            DigitalCredential.id == credential_id,
            DigitalCredential.institution_id == institution_id
        ).first()
        
        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")
        
        if credential.status == CredentialStatus.REVOKED:
            raise HTTPException(status_code=400, detail="Credential already revoked")
        
        credential.status = CredentialStatus.REVOKED
        credential.revoked_at = datetime.utcnow()
        credential.revoked_by = revoked_by
        credential.revoke_reason = reason
        
        if credential.blockchain_credential_id:
            try:
                self.blockchain_service.revoke_credential(
                    credential.blockchain_credential_id,
                    str(revoked_by),
                    reason
                )
                credential.blockchain_status = "revoked"
            except Exception as e:
                logger.error(f"Failed to revoke credential on blockchain: {str(e)}")
        
        self.db.commit()
        self.db.refresh(credential)
        
        return credential

    def create_share_link(
        self,
        credential_id: int,
        institution_id: int,
        share_data: CredentialShareCreate
    ) -> CredentialShare:
        credential = self.db.query(DigitalCredential).filter(
            DigitalCredential.id == credential_id,
            DigitalCredential.institution_id == institution_id
        ).first()
        
        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")
        
        share_token = uuid.uuid4().hex
        base_url = getattr(settings, 'app_url', 'http://localhost:8000')
        share_url = f"{base_url}/share/credential/{share_token}"
        
        share = CredentialShare(
            credential_id=credential_id,
            share_token=share_token,
            share_url=share_url,
            recipient_email=share_data.recipient_email,
            recipient_name=share_data.recipient_name,
            expires_at=share_data.expires_at,
            is_active=True
        )
        
        self.db.add(share)
        self.db.commit()
        self.db.refresh(share)
        
        return share

    def get_credential_by_id(
        self,
        credential_id: int,
        institution_id: int
    ) -> Optional[DigitalCredential]:
        return self.db.query(DigitalCredential).filter(
            DigitalCredential.id == credential_id,
            DigitalCredential.institution_id == institution_id
        ).first()

    def get_credentials_by_recipient(
        self,
        recipient_id: int,
        institution_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[DigitalCredential]:
        return self.db.query(DigitalCredential).filter(
            DigitalCredential.recipient_id == recipient_id,
            DigitalCredential.institution_id == institution_id
        ).order_by(desc(DigitalCredential.issued_at)).offset(skip).limit(limit).all()

    def get_credentials_by_issuer(
        self,
        issuer_id: int,
        institution_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[DigitalCredential]:
        return self.db.query(DigitalCredential).filter(
            DigitalCredential.issuer_id == issuer_id,
            DigitalCredential.institution_id == institution_id
        ).order_by(desc(DigitalCredential.issued_at)).offset(skip).limit(limit).all()

    def get_credential_statistics(self, institution_id: int) -> Dict[str, Any]:
        total_issued = self.db.query(func.count(DigitalCredential.id)).filter(
            DigitalCredential.institution_id == institution_id
        ).scalar()
        
        active_count = self.db.query(func.count(DigitalCredential.id)).filter(
            DigitalCredential.institution_id == institution_id,
            DigitalCredential.status == CredentialStatus.ACTIVE
        ).scalar()
        
        revoked_count = self.db.query(func.count(DigitalCredential.id)).filter(
            DigitalCredential.institution_id == institution_id,
            DigitalCredential.status == CredentialStatus.REVOKED
        ).scalar()
        
        expired_count = self.db.query(func.count(DigitalCredential.id)).filter(
            DigitalCredential.institution_id == institution_id,
            DigitalCredential.status == CredentialStatus.EXPIRED
        ).scalar()
        
        pending_count = self.db.query(func.count(DigitalCredential.id)).filter(
            DigitalCredential.institution_id == institution_id,
            DigitalCredential.status == CredentialStatus.PENDING
        ).scalar()
        
        by_type = {}
        type_counts = self.db.query(
            DigitalCredential.credential_type,
            func.count(DigitalCredential.id)
        ).filter(
            DigitalCredential.institution_id == institution_id
        ).group_by(DigitalCredential.credential_type).all()
        
        for cred_type, count in type_counts:
            by_type[cred_type.value] = count
        
        by_subtype = {}
        subtype_counts = self.db.query(
            DigitalCredential.sub_type,
            func.count(DigitalCredential.id)
        ).filter(
            DigitalCredential.institution_id == institution_id
        ).group_by(DigitalCredential.sub_type).all()
        
        for sub_type, count in subtype_counts:
            by_subtype[sub_type.value] = count
        
        recent_issuances = self.db.query(DigitalCredential).filter(
            DigitalCredential.institution_id == institution_id
        ).order_by(desc(DigitalCredential.issued_at)).limit(10).all()
        
        return {
            "total_issued": total_issued,
            "active_credentials": active_count,
            "revoked_credentials": revoked_count,
            "expired_credentials": expired_count,
            "pending_credentials": pending_count,
            "by_type": by_type,
            "by_subtype": by_subtype,
            "recent_issuances": recent_issuances
        }

    def create_template(
        self,
        institution_id: int,
        created_by: int,
        template_data: CredentialTemplateCreate
    ) -> CredentialTemplate:
        template = CredentialTemplate(
            institution_id=institution_id,
            name=template_data.name,
            credential_type=template_data.credential_type,
            sub_type=template_data.sub_type,
            template_data=template_data.template_data,
            created_by=created_by,
            is_active=True
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        return template

    def get_templates(
        self,
        institution_id: int,
        credential_type: Optional[CredentialType] = None,
        sub_type: Optional[CredentialSubType] = None,
        is_active: bool = True
    ) -> List[CredentialTemplate]:
        query = self.db.query(CredentialTemplate).filter(
            CredentialTemplate.institution_id == institution_id,
            CredentialTemplate.is_active == is_active
        )
        
        if credential_type:
            query = query.filter(CredentialTemplate.credential_type == credential_type)
        
        if sub_type:
            query = query.filter(CredentialTemplate.sub_type == sub_type)
        
        return query.all()
