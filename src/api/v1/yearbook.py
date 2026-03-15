from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime
from src.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.yearbook import (
    YearbookEdition,
    YearbookPage,
    YearbookSignature,
    YearbookPhotoSubmission,
    YearbookQuoteSubmission,
    YearbookMemorySubmission,
    PublicationStatus,
    SubmissionStatus
)
from src.dependencies.auth import get_current_user
from src.schemas.yearbook import (
    YearbookEditionCreate,
    YearbookEditionUpdate,
    YearbookEditionResponse,
    YearbookEditionWithStats,
    YearbookPageCreate,
    YearbookPageUpdate,
    YearbookPageResponse,
    YearbookSignatureCreate,
    YearbookSignatureUpdate,
    YearbookSignatureResponse,
    YearbookSignatureWithStudents,
    YearbookPhotoSubmissionCreate,
    YearbookPhotoSubmissionUpdate,
    YearbookPhotoSubmissionReview,
    YearbookPhotoSubmissionResponse,
    YearbookPhotoSubmissionWithStudent,
    YearbookQuoteSubmissionCreate,
    YearbookQuoteSubmissionUpdate,
    YearbookQuoteSubmissionReview,
    YearbookQuoteSubmissionResponse,
    YearbookQuoteSubmissionWithStudent,
    YearbookMemorySubmissionCreate,
    YearbookMemorySubmissionUpdate,
    YearbookMemorySubmissionReview,
    YearbookMemorySubmissionResponse,
    YearbookMemorySubmissionWithStudent,
    FlipBookPageView,
    YearbookArchiveItem,
    YearbookPrintOrder,
    YearbookPrintOrderResponse
)

router = APIRouter()


# Yearbook Edition Management
@router.post("/editions", response_model=YearbookEditionResponse, status_code=status.HTTP_201_CREATED)
async def create_yearbook_edition(
    edition_data: YearbookEditionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != edition_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    existing = db.query(YearbookEdition).filter(
        YearbookEdition.institution_id == edition_data.institution_id,
        YearbookEdition.academic_year == edition_data.academic_year
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yearbook edition for this academic year already exists"
        )

    edition = YearbookEdition(**edition_data.model_dump(), created_by=current_user.id)
    db.add(edition)
    db.commit()
    db.refresh(edition)
    return edition


@router.get("/editions", response_model=dict)
async def list_yearbook_editions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    academic_year: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(YearbookEdition).filter(
        YearbookEdition.institution_id == current_user.institution_id
    )
    
    if academic_year:
        query = query.filter(YearbookEdition.academic_year == academic_year)
    if status_filter:
        query = query.filter(YearbookEdition.publication_status == status_filter)
    
    total = query.count()
    editions = query.order_by(desc(YearbookEdition.academic_year)).offset(skip).limit(limit).all()
    
    return {
        "items": editions,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/editions/{edition_id}", response_model=YearbookEditionWithStats)
async def get_yearbook_edition(
    edition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    total_pages = db.query(YearbookPage).filter(YearbookPage.edition_id == edition_id).count()
    total_signatures = db.query(YearbookSignature).filter(
        YearbookSignature.edition_id == edition_id
    ).count()
    
    pending_photos = db.query(YearbookPhotoSubmission).filter(
        YearbookPhotoSubmission.edition_id == edition_id,
        YearbookPhotoSubmission.status == SubmissionStatus.PENDING.value
    ).count()
    pending_quotes = db.query(YearbookQuoteSubmission).filter(
        YearbookQuoteSubmission.edition_id == edition_id,
        YearbookQuoteSubmission.status == SubmissionStatus.PENDING.value
    ).count()
    pending_memories = db.query(YearbookMemorySubmission).filter(
        YearbookMemorySubmission.edition_id == edition_id,
        YearbookMemorySubmission.status == SubmissionStatus.PENDING.value
    ).count()
    
    approved_photos = db.query(YearbookPhotoSubmission).filter(
        YearbookPhotoSubmission.edition_id == edition_id,
        YearbookPhotoSubmission.status == SubmissionStatus.APPROVED.value
    ).count()
    approved_quotes = db.query(YearbookQuoteSubmission).filter(
        YearbookQuoteSubmission.edition_id == edition_id,
        YearbookQuoteSubmission.status == SubmissionStatus.APPROVED.value
    ).count()
    approved_memories = db.query(YearbookMemorySubmission).filter(
        YearbookMemorySubmission.edition_id == edition_id,
        YearbookMemorySubmission.status == SubmissionStatus.APPROVED.value
    ).count()
    
    edition_dict = {
        **edition.__dict__,
        "total_pages": total_pages,
        "total_signatures": total_signatures,
        "pending_submissions": pending_photos + pending_quotes + pending_memories,
        "approved_submissions": approved_photos + approved_quotes + approved_memories
    }
    
    return YearbookEditionWithStats(**edition_dict)


@router.put("/editions/{edition_id}", response_model=YearbookEditionResponse)
async def update_yearbook_edition(
    edition_id: int,
    update_data: YearbookEditionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(edition, field, value)
    
    if update_data.publication_status == PublicationStatus.PUBLISHED.value and not edition.published_at:
        edition.published_at = datetime.utcnow()
    
    db.commit()
    db.refresh(edition)
    return edition


@router.delete("/editions/{edition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_yearbook_edition(
    edition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    db.delete(edition)
    db.commit()
    return None


# Page Management
@router.post("/pages", response_model=YearbookPageResponse, status_code=status.HTTP_201_CREATED)
async def create_yearbook_page(
    page_data: YearbookPageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == page_data.edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    existing_page = db.query(YearbookPage).filter(
        YearbookPage.edition_id == page_data.edition_id,
        YearbookPage.page_number == page_data.page_number
    ).first()
    
    if existing_page:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page number already exists in this edition"
        )
    
    page = YearbookPage(**page_data.model_dump(), created_by=current_user.id)
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@router.get("/editions/{edition_id}/pages", response_model=List[YearbookPageResponse])
async def list_yearbook_pages(
    edition_id: int,
    section: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    query = db.query(YearbookPage).filter(YearbookPage.edition_id == edition_id)
    
    if section:
        query = query.filter(YearbookPage.section == section)
    
    pages = query.order_by(YearbookPage.page_number).all()
    return pages


@router.get("/pages/{page_id}", response_model=YearbookPageResponse)
async def get_yearbook_page(
    page_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page = db.query(YearbookPage).join(YearbookEdition).filter(
        YearbookPage.id == page_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return page


@router.put("/pages/{page_id}", response_model=YearbookPageResponse)
async def update_yearbook_page(
    page_id: int,
    update_data: YearbookPageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page = db.query(YearbookPage).join(YearbookEdition).filter(
        YearbookPage.id == page_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This page is locked and cannot be edited"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(page, field, value)
    
    db.commit()
    db.refresh(page)
    return page


@router.delete("/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_yearbook_page(
    page_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    page = db.query(YearbookPage).join(YearbookEdition).filter(
        YearbookPage.id == page_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This page is locked and cannot be deleted"
        )
    
    db.delete(page)
    db.commit()
    return None


# Signature Collection
@router.post("/signatures", response_model=YearbookSignatureResponse, status_code=status.HTTP_201_CREATED)
async def create_yearbook_signature(
    signature_data: YearbookSignatureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == signature_data.edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can sign yearbooks"
        )
    
    to_student = db.query(Student).filter(
        Student.id == signature_data.to_student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not to_student:
        raise HTTPException(status_code=404, detail="Recipient student not found")
    
    signature = YearbookSignature(
        **signature_data.model_dump(),
        from_student_id=student.id
    )
    db.add(signature)
    db.commit()
    db.refresh(signature)
    return signature


@router.get("/editions/{edition_id}/signatures", response_model=dict)
async def list_yearbook_signatures(
    edition_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    to_student_id: Optional[int] = Query(None),
    from_student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    query = db.query(YearbookSignature).filter(YearbookSignature.edition_id == edition_id)
    
    if to_student_id:
        query = query.filter(YearbookSignature.to_student_id == to_student_id)
    if from_student_id:
        query = query.filter(YearbookSignature.from_student_id == from_student_id)
    
    total = query.count()
    signatures = query.order_by(desc(YearbookSignature.created_at)).offset(skip).limit(limit).all()
    
    return {
        "items": signatures,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/signatures/my-signatures", response_model=List[YearbookSignatureWithStudents])
async def get_my_signatures(
    edition_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view signatures"
        )
    
    signatures = db.query(
        YearbookSignature,
        Student.alias("from_student"),
        Student.alias("to_student")
    ).join(
        Student, YearbookSignature.from_student_id == Student.id, isouter=True
    ).filter(
        YearbookSignature.edition_id == edition_id,
        YearbookSignature.to_student_id == student.id
    ).all()
    
    result = []
    for sig in signatures:
        from_student = db.query(Student).filter(Student.id == sig.from_student_id).first()
        to_student = db.query(Student).filter(Student.id == sig.to_student_id).first()
        
        sig_dict = {
            **sig.__dict__,
            "from_student_name": f"{from_student.first_name} {from_student.last_name}" if from_student else "Unknown",
            "to_student_name": f"{to_student.first_name} {to_student.last_name}" if to_student else "Unknown",
            "from_student_photo": from_student.photo_url if from_student else None,
            "to_student_photo": to_student.photo_url if to_student else None
        }
        result.append(YearbookSignatureWithStudents(**sig_dict))
    
    return result


@router.put("/signatures/{signature_id}", response_model=YearbookSignatureResponse)
async def update_yearbook_signature(
    signature_id: int,
    update_data: YearbookSignatureUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can edit signatures"
        )
    
    signature = db.query(YearbookSignature).filter(
        YearbookSignature.id == signature_id,
        YearbookSignature.from_student_id == student.id
    ).first()
    
    if not signature:
        raise HTTPException(status_code=404, detail="Signature not found")
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(signature, field, value)
    
    db.commit()
    db.refresh(signature)
    return signature


@router.delete("/signatures/{signature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_yearbook_signature(
    signature_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can delete signatures"
        )
    
    signature = db.query(YearbookSignature).filter(
        YearbookSignature.id == signature_id,
        YearbookSignature.from_student_id == student.id
    ).first()
    
    if not signature:
        raise HTTPException(status_code=404, detail="Signature not found")
    
    db.delete(signature)
    db.commit()
    return None


# Photo Submissions
@router.post("/photo-submissions", response_model=YearbookPhotoSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_yearbook_photo(
    submission_data: YearbookPhotoSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == submission_data.edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit photos"
        )
    
    submission = YearbookPhotoSubmission(
        **submission_data.model_dump(),
        student_id=student.id
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/editions/{edition_id}/photo-submissions", response_model=dict)
async def list_photo_submissions(
    edition_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    query = db.query(YearbookPhotoSubmission).filter(
        YearbookPhotoSubmission.edition_id == edition_id
    )
    
    if status_filter:
        query = query.filter(YearbookPhotoSubmission.status == status_filter)
    if student_id:
        query = query.filter(YearbookPhotoSubmission.student_id == student_id)
    
    total = query.count()
    submissions = query.order_by(desc(YearbookPhotoSubmission.submitted_at)).offset(skip).limit(limit).all()
    
    return {
        "items": submissions,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/photo-submissions/{submission_id}", response_model=YearbookPhotoSubmissionResponse)
async def update_photo_submission(
    submission_id: int,
    update_data: YearbookPhotoSubmissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can update submissions"
        )
    
    submission = db.query(YearbookPhotoSubmission).filter(
        YearbookPhotoSubmission.id == submission_id,
        YearbookPhotoSubmission.student_id == student.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Photo submission not found")
    
    if submission.status != SubmissionStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update a reviewed submission"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(submission, field, value)
    
    db.commit()
    db.refresh(submission)
    return submission


@router.post("/photo-submissions/{submission_id}/review", response_model=YearbookPhotoSubmissionResponse)
async def review_photo_submission(
    submission_id: int,
    review_data: YearbookPhotoSubmissionReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.query(YearbookPhotoSubmission).join(YearbookEdition).filter(
        YearbookPhotoSubmission.id == submission_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Photo submission not found")
    
    submission.status = review_data.status
    submission.review_notes = review_data.review_notes
    submission.page_id = review_data.page_id
    submission.reviewed_by = current_user.id
    submission.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    return submission


# Quote Submissions
@router.post("/quote-submissions", response_model=YearbookQuoteSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_yearbook_quote(
    submission_data: YearbookQuoteSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == submission_data.edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit quotes"
        )
    
    submission = YearbookQuoteSubmission(
        **submission_data.model_dump(),
        student_id=student.id
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/editions/{edition_id}/quote-submissions", response_model=dict)
async def list_quote_submissions(
    edition_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    query = db.query(YearbookQuoteSubmission).filter(
        YearbookQuoteSubmission.edition_id == edition_id
    )
    
    if status_filter:
        query = query.filter(YearbookQuoteSubmission.status == status_filter)
    if student_id:
        query = query.filter(YearbookQuoteSubmission.student_id == student_id)
    
    total = query.count()
    submissions = query.order_by(desc(YearbookQuoteSubmission.submitted_at)).offset(skip).limit(limit).all()
    
    return {
        "items": submissions,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/quote-submissions/{submission_id}", response_model=YearbookQuoteSubmissionResponse)
async def update_quote_submission(
    submission_id: int,
    update_data: YearbookQuoteSubmissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can update submissions"
        )
    
    submission = db.query(YearbookQuoteSubmission).filter(
        YearbookQuoteSubmission.id == submission_id,
        YearbookQuoteSubmission.student_id == student.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Quote submission not found")
    
    if submission.status != SubmissionStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update a reviewed submission"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(submission, field, value)
    
    db.commit()
    db.refresh(submission)
    return submission


@router.post("/quote-submissions/{submission_id}/review", response_model=YearbookQuoteSubmissionResponse)
async def review_quote_submission(
    submission_id: int,
    review_data: YearbookQuoteSubmissionReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.query(YearbookQuoteSubmission).join(YearbookEdition).filter(
        YearbookQuoteSubmission.id == submission_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Quote submission not found")
    
    submission.status = review_data.status
    submission.review_notes = review_data.review_notes
    submission.page_id = review_data.page_id
    submission.reviewed_by = current_user.id
    submission.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    return submission


# Memory Submissions
@router.post("/memory-submissions", response_model=YearbookMemorySubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_yearbook_memory(
    submission_data: YearbookMemorySubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == submission_data.edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit memories"
        )
    
    submission = YearbookMemorySubmission(
        **submission_data.model_dump(),
        student_id=student.id
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/editions/{edition_id}/memory-submissions", response_model=dict)
async def list_memory_submissions(
    edition_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    student_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    query = db.query(YearbookMemorySubmission).filter(
        YearbookMemorySubmission.edition_id == edition_id
    )
    
    if status_filter:
        query = query.filter(YearbookMemorySubmission.status == status_filter)
    if student_id:
        query = query.filter(YearbookMemorySubmission.student_id == student_id)
    
    total = query.count()
    submissions = query.order_by(desc(YearbookMemorySubmission.submitted_at)).offset(skip).limit(limit).all()
    
    return {
        "items": submissions,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/memory-submissions/{submission_id}", response_model=YearbookMemorySubmissionResponse)
async def update_memory_submission(
    submission_id: int,
    update_data: YearbookMemorySubmissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can update submissions"
        )
    
    submission = db.query(YearbookMemorySubmission).filter(
        YearbookMemorySubmission.id == submission_id,
        YearbookMemorySubmission.student_id == student.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Memory submission not found")
    
    if submission.status != SubmissionStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update a reviewed submission"
        )
    
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(submission, field, value)
    
    db.commit()
    db.refresh(submission)
    return submission


@router.post("/memory-submissions/{submission_id}/review", response_model=YearbookMemorySubmissionResponse)
async def review_memory_submission(
    submission_id: int,
    review_data: YearbookMemorySubmissionReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.query(YearbookMemorySubmission).join(YearbookEdition).filter(
        YearbookMemorySubmission.id == submission_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Memory submission not found")
    
    submission.status = review_data.status
    submission.review_notes = review_data.review_notes
    submission.page_id = review_data.page_id
    submission.reviewed_by = current_user.id
    submission.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    return submission


# Flip Book Viewing
@router.get("/editions/{edition_id}/flipbook", response_model=List[FlipBookPageView])
async def get_flipbook_pages(
    edition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    if not edition.is_public and edition.publication_status != PublicationStatus.PUBLISHED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This yearbook is not yet published"
        )
    
    pages = db.query(YearbookPage).filter(
        YearbookPage.edition_id == edition_id
    ).order_by(YearbookPage.page_number).all()
    
    result = []
    for page in pages:
        result.append(FlipBookPageView(
            page_number=page.page_number,
            section=page.section,
            layout_template=page.layout_template,
            photos=page.photos,
            text_content=page.text_content,
            background_color=page.background_color,
            background_image_url=page.background_image_url,
            is_double_page=page.is_double_page
        ))
    
    return result


# Archive of Past Yearbooks
@router.get("/archive", response_model=List[YearbookArchiveItem])
async def get_yearbook_archive(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    editions = db.query(YearbookEdition).filter(
        YearbookEdition.institution_id == current_user.institution_id,
        YearbookEdition.publication_status == PublicationStatus.PUBLISHED.value
    ).order_by(desc(YearbookEdition.academic_year)).all()
    
    result = []
    for edition in editions:
        page_count = db.query(YearbookPage).filter(
            YearbookPage.edition_id == edition.id
        ).count()
        
        result.append(YearbookArchiveItem(
            id=edition.id,
            academic_year=edition.academic_year,
            theme=edition.theme,
            cover_design_url=edition.cover_design_url,
            publication_status=edition.publication_status,
            digital_flip_book_url=edition.digital_flip_book_url,
            pdf_url=edition.pdf_url,
            published_at=edition.published_at,
            total_pages=page_count
        ))
    
    return result


# PDF Generation for Print Orders
@router.post("/editions/{edition_id}/generate-pdf", response_model=dict)
async def generate_yearbook_pdf(
    edition_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    if edition.publication_status not in [
        PublicationStatus.READY_FOR_PRINT.value,
        PublicationStatus.PUBLISHED.value
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yearbook must be in ready_for_print or published status"
        )
    
    return {
        "message": "PDF generation started",
        "edition_id": edition_id,
        "status": "processing"
    }


@router.post("/print-orders", response_model=YearbookPrintOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_print_order(
    order_data: YearbookPrintOrder,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == order_data.edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    if not edition.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF must be generated before placing print order"
        )
    
    edition.print_order_count += order_data.quantity
    db.commit()
    
    import uuid
    order_id = f"YB-{edition.academic_year}-{uuid.uuid4().hex[:8].upper()}"
    
    return YearbookPrintOrderResponse(
        order_id=order_id,
        edition_id=edition.id,
        quantity=order_data.quantity,
        status="pending",
        estimated_delivery=None,
        total_cost=order_data.quantity * 25.00,
        created_at=datetime.utcnow()
    )


@router.get("/editions/{edition_id}/statistics", response_model=dict)
async def get_yearbook_statistics(
    edition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    edition = db.query(YearbookEdition).filter(
        YearbookEdition.id == edition_id,
        YearbookEdition.institution_id == current_user.institution_id
    ).first()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Yearbook edition not found")
    
    total_pages = db.query(YearbookPage).filter(YearbookPage.edition_id == edition_id).count()
    
    pages_by_section = db.query(
        YearbookPage.section,
        func.count(YearbookPage.id)
    ).filter(
        YearbookPage.edition_id == edition_id
    ).group_by(YearbookPage.section).all()
    
    total_signatures = db.query(YearbookSignature).filter(
        YearbookSignature.edition_id == edition_id
    ).count()
    
    photo_submissions = db.query(
        YearbookPhotoSubmission.status,
        func.count(YearbookPhotoSubmission.id)
    ).filter(
        YearbookPhotoSubmission.edition_id == edition_id
    ).group_by(YearbookPhotoSubmission.status).all()
    
    quote_submissions = db.query(
        YearbookQuoteSubmission.status,
        func.count(YearbookQuoteSubmission.id)
    ).filter(
        YearbookQuoteSubmission.edition_id == edition_id
    ).group_by(YearbookQuoteSubmission.status).all()
    
    memory_submissions = db.query(
        YearbookMemorySubmission.status,
        func.count(YearbookMemorySubmission.id)
    ).filter(
        YearbookMemorySubmission.edition_id == edition_id
    ).group_by(YearbookMemorySubmission.status).all()
    
    return {
        "edition_id": edition_id,
        "academic_year": edition.academic_year,
        "total_pages": total_pages,
        "pages_by_section": {section: count for section, count in pages_by_section},
        "total_signatures": total_signatures,
        "photo_submissions": {status: count for status, count in photo_submissions},
        "quote_submissions": {status: count for status, count in quote_submissions},
        "memory_submissions": {status: count for status, count in memory_submissions},
        "print_order_count": edition.print_order_count,
        "publication_status": edition.publication_status
    }
