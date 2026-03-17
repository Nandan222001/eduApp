from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.services.homework_scanner_service import HomeworkScannerService
from src.schemas.homework_scanner import (
    HomeworkScanResponse,
    HomeworkScanDetailResponse,
    HomeworkScanAnalysis,
)

router = APIRouter()


@router.post("/scans", response_model=HomeworkScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    file: UploadFile = File(...),
    student_id: int = Form(...),
    subject_id: Optional[int] = Form(None),
    scan_title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    service = HomeworkScannerService(db)
    scan = await service.create_scan(
        institution_id=current_user.institution_id,
        student_id=student_id,
        file=file,
        subject_id=subject_id,
        scan_title=scan_title
    )
    return scan


@router.get("/scans", response_model=List[HomeworkScanResponse])
async def get_scans(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    scans = service.get_student_scans(
        student_id=student_id,
        subject_id=subject_id,
        limit=limit,
        skip=skip
    )
    return scans


@router.get("/scans/{scan_id}", response_model=HomeworkScanResponse)
async def get_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    scan = service.get_scan(scan_id)
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    return scan


@router.get("/scans/{scan_id}/analyze", response_model=HomeworkScanAnalysis)
async def analyze_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    analysis = service.analyze_scan(scan_id)
    if "error" in analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=analysis["error"]
        )
    return analysis


@router.delete("/scans/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = HomeworkScannerService(db)
    success = service.delete_scan(scan_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    return None
