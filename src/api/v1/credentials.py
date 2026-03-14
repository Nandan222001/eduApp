from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload

from src.database import get_db
from src.dependencies.auth import get_current_user, require_role
from src.models.user import User
from src.models.digital_credential import DigitalCredential, CredentialShare
from src.schemas.credential import (
    CredentialCreate,
    CredentialBulkCreate,
    CredentialUpdate,
    CredentialRevoke,
    CredentialResponse,
    CredentialDetailResponse,
    CredentialVerificationRequest,
    CredentialVerificationResponse,
    PublicCredentialVerificationResponse,
    CredentialShareCreate,
    CredentialShareResponse,
    CredentialTemplateCreate,
    CredentialTemplateUpdate,
    CredentialTemplateResponse,
    CredentialStatistics,
    CredentialType,
    CredentialSubType
)
from src.services.credential_service import CredentialService
from src.services.blockchain_service import BlockchainService

router = APIRouter(prefix="/credentials", tags=["Credentials"])


@router.post("/", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
def issue_credential(
    credential_data: CredentialCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    credential = service.issue_credential(
        institution_id=current_user.institution_id,
        issuer_id=current_user.id,
        credential_data=credential_data
    )
    return credential


@router.post("/bulk", response_model=List[CredentialResponse], status_code=status.HTTP_201_CREATED)
def bulk_issue_credentials(
    credential_data: CredentialBulkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    credentials = service.bulk_issue_credentials(
        institution_id=current_user.institution_id,
        issuer_id=current_user.id,
        credential_data=credential_data
    )
    return credentials


@router.get("/", response_model=List[CredentialResponse])
def list_credentials(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    credential_type: Optional[CredentialType] = None,
    sub_type: Optional[CredentialSubType] = None,
    recipient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DigitalCredential).filter(
        DigitalCredential.institution_id == current_user.institution_id
    )
    
    if credential_type:
        query = query.filter(DigitalCredential.credential_type == credential_type)
    
    if sub_type:
        query = query.filter(DigitalCredential.sub_type == sub_type)
    
    if recipient_id:
        query = query.filter(DigitalCredential.recipient_id == recipient_id)
    
    credentials = query.order_by(DigitalCredential.issued_at.desc()).offset(skip).limit(limit).all()
    return credentials


@router.get("/my-credentials", response_model=List[CredentialResponse])
def get_my_credentials(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    credentials = service.get_credentials_by_recipient(
        recipient_id=current_user.id,
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit
    )
    return credentials


@router.get("/issued-by-me", response_model=List[CredentialResponse])
def get_issued_by_me(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    credentials = service.get_credentials_by_issuer(
        issuer_id=current_user.id,
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit
    )
    return credentials


@router.get("/statistics", response_model=CredentialStatistics)
def get_credential_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    stats = service.get_credential_statistics(current_user.institution_id)
    return stats


@router.get("/{credential_id}", response_model=CredentialDetailResponse)
def get_credential(
    credential_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    credential = db.query(DigitalCredential).filter(
        DigitalCredential.id == credential_id,
        DigitalCredential.institution_id == current_user.institution_id
    ).options(
        joinedload(DigitalCredential.recipient),
        joinedload(DigitalCredential.issuer),
        joinedload(DigitalCredential.institution)
    ).first()
    
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    verification_count = len(credential.verifications)
    share_count = len(credential.shares)
    
    return {
        **credential.__dict__,
        "recipient_name": f"{credential.recipient.first_name} {credential.recipient.last_name}" if credential.recipient else None,
        "recipient_email": credential.recipient.email if credential.recipient else None,
        "issuer_name": f"{credential.issuer.first_name} {credential.issuer.last_name}" if credential.issuer else None,
        "institution_name": credential.institution.name if credential.institution else None,
        "verification_count": verification_count,
        "share_count": share_count
    }


@router.put("/{credential_id}", response_model=CredentialResponse)
def update_credential(
    credential_id: int,
    update_data: CredentialUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    credential = db.query(DigitalCredential).filter(
        DigitalCredential.id == credential_id,
        DigitalCredential.institution_id == current_user.institution_id
    ).first()
    
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(credential, key, value)
    
    db.commit()
    db.refresh(credential)
    return credential


@router.post("/{credential_id}/revoke", response_model=CredentialResponse)
def revoke_credential(
    credential_id: int,
    revoke_data: CredentialRevoke,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    credential = service.revoke_credential(
        credential_id=credential_id,
        institution_id=current_user.institution_id,
        revoked_by=current_user.id,
        reason=revoke_data.reason
    )
    return credential


@router.post("/{credential_id}/share", response_model=CredentialShareResponse)
def create_share_link(
    credential_id: int,
    share_data: CredentialShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    share = service.create_share_link(
        credential_id=credential_id,
        institution_id=current_user.institution_id,
        share_data=share_data
    )
    return share


@router.post("/verify", response_model=CredentialVerificationResponse)
def verify_credential_internal(
    verification_request: CredentialVerificationRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    
    client_ip = request.client.host if request.client else None
    
    result = service.verify_credential(
        credential_id=verification_request.credential_id,
        certificate_number=verification_request.certificate_number,
        blockchain_credential_id=verification_request.blockchain_credential_id,
        verifier_name=verification_request.verifier_name,
        verifier_email=verification_request.verifier_email,
        verifier_organization=verification_request.verifier_organization,
        verifier_ip=client_ip
    )
    
    return result


@router.get("/templates/list", response_model=List[CredentialTemplateResponse])
def list_templates(
    credential_type: Optional[CredentialType] = None,
    sub_type: Optional[CredentialSubType] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    templates = service.get_templates(
        institution_id=current_user.institution_id,
        credential_type=credential_type,
        sub_type=sub_type
    )
    return templates


@router.post("/templates", response_model=CredentialTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: CredentialTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    template = service.create_template(
        institution_id=current_user.institution_id,
        created_by=current_user.id,
        template_data=template_data
    )
    return template


public_router = APIRouter(prefix="/verify", tags=["Public Credential Verification"])


@router.get("/verify/certificate/{certificate_number}", response_model=PublicCredentialVerificationResponse)
def verify_by_certificate_number(
    certificate_number: str,
    request: Request,
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    
    client_ip = request.client.host if request.client else None
    
    result = service.verify_credential(
        certificate_number=certificate_number,
        verifier_ip=client_ip
    )
    
    if result["credential"]:
        credential = result["credential"]
        recipient = db.query(User).filter(User.id == credential.recipient_id).first()
        
        credential_detail = {
            **credential.__dict__,
            "recipient_name": f"{recipient.first_name} {recipient.last_name}" if recipient else None,
            "recipient_email": recipient.email if recipient else None,
            "verification_count": 0,
            "share_count": 0
        }
        
        return PublicCredentialVerificationResponse(
            valid=result["valid"],
            credential=credential_detail,
            message=result["message"],
            verified_at=result["verified_at"],
            blockchain_verified=result["blockchain_verified"]
        )
    
    return PublicCredentialVerificationResponse(
        valid=False,
        credential=None,
        message=result["message"],
        verified_at=result["verified_at"],
        blockchain_verified=False
    )


@router.get("/share/credential/{share_token}")
def view_shared_credential(
    share_token: str,
    db: Session = Depends(get_db)
):
    from datetime import datetime
    
    share = db.query(CredentialShare).filter(
        CredentialShare.share_token == share_token,
        CredentialShare.is_active == True
    ).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Shared credential not found")
    
    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    share.view_count += 1
    share.last_viewed_at = datetime.utcnow()
    db.commit()
    
    credential = db.query(DigitalCredential).filter(
        DigitalCredential.id == share.credential_id
    ).options(
        joinedload(DigitalCredential.recipient),
        joinedload(DigitalCredential.issuer),
        joinedload(DigitalCredential.institution)
    ).first()
    
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    return {
        "credential": {
            **credential.__dict__,
            "recipient_name": f"{credential.recipient.first_name} {credential.recipient.last_name}" if credential.recipient else None,
            "recipient_email": credential.recipient.email if credential.recipient else None,
            "issuer_name": f"{credential.issuer.first_name} {credential.issuer.last_name}" if credential.issuer else None,
            "institution_name": credential.institution.name if credential.institution else None
        },
        "share": share
    }


employer_router = APIRouter(prefix="/employer", tags=["Employer Verification Portal"])


@employer_router.get("/verify")
def employer_verification_portal():
    return {
        "message": "Employer Verification Portal",
        "description": "Use this portal to verify digital credentials issued by educational institutions",
        "verification_methods": [
            {
                "method": "certificate_number",
                "endpoint": "/api/v1/verify/certificate/{certificate_number}",
                "description": "Verify using certificate number"
            },
            {
                "method": "blockchain_id",
                "endpoint": "/api/v1/credentials/verify",
                "description": "Verify using blockchain credential ID"
            },
            {
                "method": "qr_code",
                "description": "Scan QR code on credential to verify"
            }
        ]
    }


@employer_router.post("/verify/batch")
def batch_verify_credentials(
    certificate_numbers: List[str],
    request: Request,
    db: Session = Depends(get_db)
):
    service = CredentialService(db)
    client_ip = request.client.host if request.client else None
    
    results = []
    for cert_number in certificate_numbers:
        try:
            result = service.verify_credential(
                certificate_number=cert_number,
                verifier_ip=client_ip
            )
            results.append({
                "certificate_number": cert_number,
                "valid": result["valid"],
                "message": result["message"],
                "blockchain_verified": result["blockchain_verified"]
            })
        except Exception as e:
            results.append({
                "certificate_number": cert_number,
                "valid": False,
                "message": str(e),
                "blockchain_verified": False
            })
    
    return {
        "total": len(certificate_numbers),
        "results": results
    }


@employer_router.get("/credential/{certificate_number}/history")
def get_credential_blockchain_history(
    certificate_number: str,
    db: Session = Depends(get_db)
):
    credential = db.query(DigitalCredential).filter(
        DigitalCredential.certificate_number == certificate_number
    ).first()
    
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    if not credential.blockchain_credential_id:
        raise HTTPException(status_code=400, detail="Credential not on blockchain")
    
    blockchain_service = BlockchainService()
    history = blockchain_service.get_credential_history(credential.blockchain_credential_id)
    
    return {
        "certificate_number": certificate_number,
        "blockchain_credential_id": credential.blockchain_credential_id,
        "history": history
    }
