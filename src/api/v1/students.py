from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentDetailResponse,
    StudentProfileResponse,
    BulkImportResult,
    BulkImportPreviewResponse,
    StudentPromotionRequest,
    StudentTransferRequest,
    IDCardData,
    ParentCreate,
    ParentUpdate,
    ParentResponse,
    LinkParentRequest,
    StudentStatistics,
)
from src.services.student_service import StudentService
from src.utils.s3_client import s3_client
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from datetime import datetime

router = APIRouter()


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_data.institution_id = current_user.institution_id
    service = StudentService(db)
    student = service.create_student(student_data)
    return student


@router.get("/", response_model=dict)
async def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    grade_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    status: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    students, total = service.list_students(
        institution_id=current_user.institution_id,
        grade_id=grade_id,
        section_id=section_id,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active,
        status=status,
        gender=gender
    )
    return {
        "items": students,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/statistics", response_model=StudentStatistics)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    return service.get_statistics(current_user.institution_id)


@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.get_student(student_id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this student"
        )
    
    return student


@router.get("/{student_id}/profile", response_model=dict)
async def get_student_profile(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.get_student(student_id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this student"
        )
    
    profile = service.get_student_profile(student_id)
    return profile


@router.get("/{student_id}/dashboard", response_model=dict)
async def get_student_dashboard(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.get_student(student_id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this student"
        )
    
    dashboard_data = service.get_student_dashboard(student_id, current_user.institution_id)
    return dashboard_data


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.get_student(student_id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this student"
        )
    
    updated_student = service.update_student(student_id, student_data)
    return updated_student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.get_student(student_id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this student"
        )
    
    service.delete_student(student_id)
    return None


@router.post("/bulk-import/preview", response_model=BulkImportPreviewResponse)
async def preview_bulk_import(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    preview = await service.preview_bulk_import(current_user.institution_id, file)
    return preview


@router.post("/bulk-import", response_model=BulkImportResult)
async def bulk_import_students(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    result = await service.bulk_import_students(current_user.institution_id, file)
    return result


@router.post("/promote", response_model=dict)
async def promote_students(
    data: StudentPromotionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    result = service.promote_students(current_user.institution_id, data)
    return result


@router.post("/transfer", response_model=StudentResponse)
async def transfer_student(
    data: StudentTransferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.transfer_student(current_user.institution_id, data)
    return student


@router.get("/{student_id}/id-card", response_model=IDCardData)
async def get_id_card_data(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    id_card_data = service.get_id_card_data(student_id, current_user.institution_id)
    
    if not id_card_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return id_card_data


@router.post("/{student_id}/upload-photo")
async def upload_student_photo(
    student_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.get_student(student_id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    if student.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this student"
        )
    
    allowed_content_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG and PNG images are allowed"
        )
    
    try:
        file_url, s3_key = s3_client.upload_file(
            file.file,
            file.filename,
            folder=f"students/{student_id}/photos",
            content_type=file.content_type
        )
        
        from src.schemas.student import StudentUpdate
        update_data = StudentUpdate(photo_url=file_url)
        service.update_student(student_id, update_data)
        
        return {"photo_url": file_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo: {str(e)}"
        )


@router.get("/{student_id}/id-card/download")
async def download_id_card(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    id_card_data = service.get_id_card_data(student_id, current_user.institution_id)
    
    if not id_card_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(3.5*inch, 2.2*inch),
        rightMargin=0.2*inch,
        leftMargin=0.2*inch,
        topMargin=0.2*inch,
        bottomMargin=0.2*inch
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=10,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=7,
        spaceAfter=3,
        alignment=TA_CENTER
    )
    
    elements.append(Paragraph(id_card_data.institution_name, title_style))
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph("STUDENT ID CARD", normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    data = [
        ['Name:', id_card_data.student_name],
        ['Admission No:', id_card_data.admission_number],
        ['Class:', id_card_data.class_section],
        ['Valid Until:', id_card_data.valid_until.strftime('%d-%m-%Y')],
    ]
    
    if id_card_data.date_of_birth:
        data.append(['DOB:', id_card_data.date_of_birth.strftime('%d-%m-%Y')])
    
    if id_card_data.blood_group:
        data.append(['Blood Group:', id_card_data.blood_group])
    
    table = Table(data, colWidths=[1.2*inch, 1.8*inch])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
    ]))
    
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=student_{student_id}_id_card.pdf"
        }
    )


@router.post("/parents", response_model=ParentResponse, status_code=status.HTTP_201_CREATED)
async def create_parent(
    parent_data: ParentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent_data.institution_id = current_user.institution_id
    service = StudentService(db)
    parent = service.create_parent(parent_data)
    return parent


@router.post("/{student_id}/parents/link")
async def link_parent_to_student(
    student_id: int,
    link_data: LinkParentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student_parent = service.link_parent_to_student(
        student_id,
        current_user.institution_id,
        link_data
    )
    return {"message": "Parent linked successfully", "id": student_parent.id}


@router.delete("/{student_id}/parents/{parent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_parent_from_student(
    student_id: int,
    parent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    service.unlink_parent_from_student(
        student_id,
        parent_id,
        current_user.institution_id
    )
    return None
