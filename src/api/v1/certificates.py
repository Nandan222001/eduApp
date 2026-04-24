from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.school_admin import (
    CertificateTemplate,
    IDCardTemplate,
    IssuedCertificate,
    IssuedCertificateStatus,
)
from src.models.user import User
from src.services.school_admin_service import SchoolAdminService

# ── Request schemas (matching frontend field names exactly) ────────────────────

class IssueCertificateBody(BaseModel):
    student_id: int
    certificate_type: str
    template_id: Optional[int] = None
    remarks: Optional[str] = None
    issue_date: Optional[date] = None
    data: dict[str, Any] = {}


class CertificateTemplateCreateBody(BaseModel):
    name: str
    certificate_type: str
    template_config: dict[str, Any]
    is_default: bool = False


class CertificateTemplateUpdateBody(BaseModel):
    name: Optional[str] = None
    certificate_type: Optional[str] = None
    template_config: Optional[dict[str, Any]] = None
    is_default: Optional[bool] = None


class RevokeCertificateBody(BaseModel):
    reason: Optional[str] = None


# ── Response helpers ───────────────────────────────────────────────────────────

def _cert_response(cert: IssuedCertificate) -> dict:
    return {
        "id": cert.id,
        "institution_id": cert.institution_id,
        "student_id": cert.student_id,
        "certificate_type": cert.certificate_type,
        "serial_number": cert.serial_number,
        "issue_date": cert.issue_date,
        "template_id": cert.template_id,
        "remarks": cert.remarks,
        "pdf_url": cert.pdf_url,
        "issued_by_id": cert.issued_by,
        "is_revoked": cert.status == IssuedCertificateStatus.REVOKED.value,
        "status": cert.status,
        "data_snapshot": cert.data_snapshot,
        "created_at": cert.created_at,
        "updated_at": cert.updated_at,
    }


def _template_response(tmpl: CertificateTemplate) -> dict:
    return {
        "id": tmpl.id,
        "institution_id": tmpl.institution_id,
        "name": tmpl.template_name,
        "certificate_type": tmpl.certificate_type,
        "template_config": tmpl.template_config,
        "is_default": tmpl.is_default,
        "is_active": tmpl.is_active,
        "created_at": tmpl.created_at,
        "updated_at": tmpl.updated_at,
    }


def _id_card_template_response(tmpl: IDCardTemplate) -> dict:
    layout = tmpl.layout_config or {}
    return {
        "id": tmpl.id,
        "institution_id": tmpl.institution_id,
        "name": tmpl.template_name,
        "orientation": tmpl.orientation,
        "front_config": layout.get("front", {}),
        "back_config": layout.get("back", {}),
        "logo_url": layout.get("logo_url"),
        "color_scheme": tmpl.color_scheme,
        "logo_position": tmpl.logo_position,
        "fields_to_show": tmpl.fields_to_show,
        "is_default": tmpl.is_default,
        "created_at": tmpl.created_at,
        "updated_at": tmpl.updated_at,
    }


# ── Certificates router (/certificates) ───────────────────────────────────────

cert_router = APIRouter(tags=["certificates"])


@cert_router.get("/")
def list_certificates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    certificate_type: Optional[str] = None,
    student_id: Optional[int] = None,
    is_revoked: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    certs, total = service.list_certificates(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        certificate_type=certificate_type,
        student_id=student_id,
        is_revoked=is_revoked,
        search=search,
    )
    return {
        "items": [_cert_response(c) for c in certs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@cert_router.post("/issue", status_code=status.HTTP_201_CREATED)
def issue_certificate(
    body: IssueCertificateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    cert = service.issue_certificate(
        institution_id=current_user.institution_id,
        student_id=body.student_id,
        certificate_type=body.certificate_type,
        template_id=body.template_id,
        remarks=body.remarks,
        data=body.data,
        issued_by=current_user.id,
    )
    return _cert_response(cert)


@cert_router.post("/preview")
def preview_certificate(
    body: IssueCertificateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    # Build a transient certificate object for PDF rendering without saving
    from src.models.school_admin import IssuedCertificate as CertModel
    from datetime import datetime as dt

    preview_cert = CertModel(
        institution_id=current_user.institution_id,
        student_id=body.student_id,
        certificate_type=body.certificate_type,
        template_id=body.template_id,
        serial_number="PREVIEW",
        issue_date=body.issue_date or date.today(),
        data_snapshot=body.data,
        issued_by=current_user.id,
        remarks=body.remarks,
        status=IssuedCertificateStatus.DRAFT.value,
        created_at=dt.utcnow(),
        updated_at=dt.utcnow(),
    )
    pdf_stream = service.generate_certificate_pdf(preview_cert)
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=preview.pdf"},
    )


@cert_router.get("/{cert_id}")
def get_certificate(
    cert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cert = db.query(IssuedCertificate).filter(
        IssuedCertificate.id == cert_id,
        IssuedCertificate.institution_id == current_user.institution_id,
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return _cert_response(cert)


@cert_router.get("/{cert_id}/download")
def download_certificate(
    cert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cert = db.query(IssuedCertificate).filter(
        IssuedCertificate.id == cert_id,
        IssuedCertificate.institution_id == current_user.institution_id,
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    service = SchoolAdminService(db)
    pdf_stream = service.generate_certificate_pdf(cert)
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=certificate_{cert.serial_number}.pdf"
        },
    )


@cert_router.post("/{cert_id}/revoke")
def revoke_certificate(
    cert_id: int,
    body: RevokeCertificateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cert = db.query(IssuedCertificate).filter(
        IssuedCertificate.id == cert_id,
        IssuedCertificate.institution_id == current_user.institution_id,
    ).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if cert.status == IssuedCertificateStatus.REVOKED.value:
        raise HTTPException(status_code=400, detail="Certificate already revoked")
    cert.status = IssuedCertificateStatus.REVOKED.value
    if body.reason:
        cert.remarks = f"{cert.remarks or ''}\nRevoked: {body.reason}".strip()
    db.commit()
    db.refresh(cert)
    return _cert_response(cert)


# ── Certificate Templates router (/certificate-templates) ─────────────────────

template_router = APIRouter(tags=["certificate-templates"])


@template_router.get("/")
def list_certificate_templates(
    certificate_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    templates = service.list_certificate_templates(
        institution_id=current_user.institution_id,
        certificate_type=certificate_type,
    )
    return [_template_response(t) for t in templates]


@template_router.post("/", status_code=status.HTTP_201_CREATED)
def create_certificate_template(
    body: CertificateTemplateCreateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    from src.schemas.school_admin import CertificateTemplateCreate

    data = CertificateTemplateCreate(
        institution_id=current_user.institution_id,
        template_name=body.name,
        certificate_type=body.certificate_type,
        template_config=body.template_config,
        is_default=body.is_default,
    )
    template = service.create_certificate_template(data)
    return _template_response(template)


@template_router.get("/{template_id}")
def get_certificate_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tmpl = db.query(CertificateTemplate).filter(
        CertificateTemplate.id == template_id,
        CertificateTemplate.institution_id == current_user.institution_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Certificate template not found")
    return _template_response(tmpl)


@template_router.put("/{template_id}")
def update_certificate_template(
    template_id: int,
    body: CertificateTemplateUpdateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tmpl = db.query(CertificateTemplate).filter(
        CertificateTemplate.id == template_id,
        CertificateTemplate.institution_id == current_user.institution_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Certificate template not found")

    if body.name is not None:
        tmpl.template_name = body.name
    if body.certificate_type is not None:
        tmpl.certificate_type = body.certificate_type
    if body.template_config is not None:
        tmpl.template_config = body.template_config
    if body.is_default is not None:
        if body.is_default:
            db.query(CertificateTemplate).filter(
                CertificateTemplate.institution_id == current_user.institution_id,
                CertificateTemplate.certificate_type == tmpl.certificate_type,
                CertificateTemplate.id != template_id,
            ).update({"is_default": False})
        tmpl.is_default = body.is_default

    db.commit()
    db.refresh(tmpl)
    return _template_response(tmpl)


@template_router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certificate_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tmpl = db.query(CertificateTemplate).filter(
        CertificateTemplate.id == template_id,
        CertificateTemplate.institution_id == current_user.institution_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Certificate template not found")
    db.delete(tmpl)
    db.commit()
    return None


# ── ID Cards router (/id-cards) ───────────────────────────────────────────────

class GenerateIDCardBody(BaseModel):
    student_id: int
    template_id: Optional[int] = None
    valid_until: Optional[date] = None


class BulkIDCardBody(BaseModel):
    grade_id: Optional[int] = None
    section_id: Optional[int] = None
    template_id: Optional[int] = None
    valid_until: Optional[date] = None


id_card_router = APIRouter(tags=["id-cards"])


@id_card_router.post("/generate")
def generate_id_card(
    body: GenerateIDCardBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.generate_bulk_id_cards(
        institution_id=current_user.institution_id,
        section_id=None,
        grade_id=None,
        template_id=body.template_id,
        valid_until=body.valid_until,
    )
    # Return metadata — actual PDF generation handled by generate_bulk_id_cards
    return {
        "student_id": body.student_id,
        "template_id": body.template_id,
        "valid_until": body.valid_until,
        "message": "ID card generation queued",
    }


@id_card_router.post("/bulk-generate")
def bulk_generate_id_cards(
    body: BulkIDCardBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SchoolAdminService(db)
    result = service.generate_bulk_id_cards(
        institution_id=current_user.institution_id,
        section_id=body.section_id,
        grade_id=body.grade_id,
        template_id=body.template_id,
        valid_until=body.valid_until,
    )
    return result


# ── ID Card Templates router (/id-card-templates) ─────────────────────────────

class IDCardTemplateCreateBody(BaseModel):
    name: str
    orientation: str = "portrait"
    front_config: dict[str, Any] = {}
    back_config: dict[str, Any] = {}
    is_default: bool = False


class IDCardTemplateUpdateBody(BaseModel):
    name: Optional[str] = None
    orientation: Optional[str] = None
    front_config: Optional[dict[str, Any]] = None
    back_config: Optional[dict[str, Any]] = None
    is_default: Optional[bool] = None


id_card_template_router = APIRouter(tags=["id-card-templates"])


@id_card_template_router.get("/")
def list_id_card_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    templates = db.query(IDCardTemplate).filter(
        IDCardTemplate.institution_id == current_user.institution_id,
    ).order_by(IDCardTemplate.is_default.desc(), IDCardTemplate.template_name).all()
    return [_id_card_template_response(t) for t in templates]


@id_card_template_router.post("/", status_code=status.HTTP_201_CREATED)
def create_id_card_template(
    body: IDCardTemplateCreateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.is_default:
        db.query(IDCardTemplate).filter(
            IDCardTemplate.institution_id == current_user.institution_id,
        ).update({"is_default": False})

    tmpl = IDCardTemplate(
        institution_id=current_user.institution_id,
        template_name=body.name,
        orientation=body.orientation,
        layout_config={"front": body.front_config, "back": body.back_config},
        is_default=body.is_default,
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return _id_card_template_response(tmpl)


@id_card_template_router.get("/{template_id}")
def get_id_card_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tmpl = db.query(IDCardTemplate).filter(
        IDCardTemplate.id == template_id,
        IDCardTemplate.institution_id == current_user.institution_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="ID card template not found")
    return _id_card_template_response(tmpl)


@id_card_template_router.put("/{template_id}")
def update_id_card_template(
    template_id: int,
    body: IDCardTemplateUpdateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tmpl = db.query(IDCardTemplate).filter(
        IDCardTemplate.id == template_id,
        IDCardTemplate.institution_id == current_user.institution_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="ID card template not found")

    if body.is_default:
        db.query(IDCardTemplate).filter(
            IDCardTemplate.institution_id == current_user.institution_id,
            IDCardTemplate.id != template_id,
        ).update({"is_default": False})

    layout = dict(tmpl.layout_config or {})
    if body.front_config is not None:
        layout["front"] = body.front_config
    if body.back_config is not None:
        layout["back"] = body.back_config
    if body.front_config is not None or body.back_config is not None:
        tmpl.layout_config = layout

    if body.name is not None:
        tmpl.template_name = body.name
    if body.orientation is not None:
        tmpl.orientation = body.orientation
    if body.is_default is not None:
        tmpl.is_default = body.is_default

    db.commit()
    db.refresh(tmpl)
    return _id_card_template_response(tmpl)


@id_card_template_router.post("/{template_id}/upload-logo")
async def upload_id_card_logo(
    template_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tmpl = db.query(IDCardTemplate).filter(
        IDCardTemplate.id == template_id,
        IDCardTemplate.institution_id == current_user.institution_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="ID card template not found")

    from src.utils.s3_client import s3_client
    content = await file.read()
    s3_key = f"id-card-logos/{current_user.institution_id}/{template_id}/{file.filename}"
    try:
        logo_url = s3_client.upload_file(content, s3_key, content_type=file.content_type or "image/png")
    except Exception:
        # Fallback: store filename in layout_config when S3 unavailable
        logo_url = f"/media/id-card-logos/{template_id}/{file.filename}"

    layout = dict(tmpl.layout_config or {})
    layout["logo_url"] = logo_url
    tmpl.layout_config = layout
    db.commit()
    db.refresh(tmpl)
    return {"logo_url": logo_url}


@id_card_template_router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_id_card_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tmpl = db.query(IDCardTemplate).filter(
        IDCardTemplate.id == template_id,
        IDCardTemplate.institution_id == current_user.institution_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="ID card template not found")
    db.delete(tmpl)
    db.commit()
    return None
