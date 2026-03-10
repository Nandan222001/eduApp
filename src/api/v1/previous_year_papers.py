from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.previous_year_papers import Board, QuestionType, DifficultyLevel, BloomTaxonomyLevel
from src.dependencies.auth import get_current_user
from src.schemas.previous_year_papers import (
    PreviousYearPaperCreate,
    PreviousYearPaperUpdate,
    PreviousYearPaperResponse,
    PreviousYearPaperWithOCR,
    PDFUploadResponse,
    PaperStatistics,
    OCRProcessRequest
)
from src.services.previous_year_papers_service import PreviousYearPaperService

router = APIRouter()


@router.post("/", response_model=PreviousYearPaperResponse, status_code=status.HTTP_201_CREATED)
async def create_paper(
    paper_data: PreviousYearPaperCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != paper_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create paper for this institution"
        )

    service = PreviousYearPaperService(db)
    paper = service.create_paper(paper_data)
    return paper


@router.get("/", response_model=dict)
async def list_papers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    board: Optional[Board] = Query(None),
    year: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    ocr_processed: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    papers, total = service.list_papers(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        board=board,
        year=year,
        grade_id=grade_id,
        subject_id=subject_id,
        is_active=is_active,
        ocr_processed=ocr_processed,
        search=search
    )
    return {
        "items": papers,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/facets", response_model=dict)
async def get_facets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    facets = service.get_facets(current_user.institution_id)
    return facets


@router.get("/statistics", response_model=PaperStatistics)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    statistics = service.get_statistics(current_user.institution_id)
    return statistics


@router.get("/{paper_id}", response_model=PreviousYearPaperResponse)
async def get_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this paper"
        )

    return paper


@router.get("/{paper_id}/with-ocr", response_model=PreviousYearPaperWithOCR)
async def get_paper_with_ocr(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this paper"
        )

    paper_dict = paper.model_dump()
    paper_repo = service.repository.get_by_id(paper_id)
    paper_dict['ocr_text'] = paper_repo.ocr_text if paper_repo else None
    
    return PreviousYearPaperWithOCR(**paper_dict)


@router.put("/{paper_id}", response_model=PreviousYearPaperResponse)
async def update_paper(
    paper_id: int,
    paper_data: PreviousYearPaperUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this paper"
        )

    updated_paper = service.update_paper(paper_id, paper_data)
    return updated_paper


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this paper"
        )

    service.delete_paper(paper_id)


@router.post("/{paper_id}/upload-pdf", response_model=PreviousYearPaperResponse)
async def upload_pdf(
    paper_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload PDF for this paper"
        )

    if not file.content_type or not file.content_type.startswith('application/pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )

    file_content = await file.read()
    file_size = len(file_content)

    if file_size > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 50MB limit"
        )

    from io import BytesIO
    file_obj = BytesIO(file_content)

    updated_paper = service.upload_pdf(
        paper_id=paper_id,
        file=file_obj,
        file_name=file.filename or f"paper_{paper_id}.pdf",
        file_size=file_size,
        content_type=file.content_type
    )

    if not updated_paper:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload PDF"
        )

    return updated_paper


@router.post("/{paper_id}/process-ocr", response_model=PreviousYearPaperResponse)
async def process_ocr(
    paper_id: int,
    ocr_data: OCRProcessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process OCR for this paper"
        )

    updated_paper = service.update_ocr_text(paper_id, ocr_data.ocr_text)

    if not updated_paper:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update OCR text"
        )

    return updated_paper


@router.post("/{paper_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def increment_view_count(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this paper"
        )

    service.increment_view_count(paper_id)


@router.post("/{paper_id}/download", status_code=status.HTTP_204_NO_CONTENT)
async def increment_download_count(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PreviousYearPaperService(db)
    paper = service.get_paper(paper_id)

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )

    if paper.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this paper"
        )

    service.increment_download_count(paper_id)
