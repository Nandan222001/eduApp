from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.schemas.content_marketplace import (
    StudentContentCreate, StudentContentUpdate, StudentContentResponse,
    StudentContentDetailResponse, ContentReviewCreate, ContentReviewUpdate,
    ContentReviewResponse, ContentPurchaseCreate, ContentPurchaseResponse,
    ModerationReviewCreate, ModerationReviewResponse, PlagiarismCheckResponse,
    StudentCreditsBalanceResponse, CreditTransactionResponse,
    ContentSearchFilters, CreatorAnalyticsResponse, ModerationQueueFilters,
    ContentSubmitForReview, ContentFlagRequest, ReviewHelpfulRequest
)
from src.services.content_marketplace_service import ContentMarketplaceService
from src.services.content_moderation_service import ContentModerationService
from src.services.content_plagiarism_service import ContentPlagiarismService
from src.repositories.content_marketplace_repository import (
    StudentContentRepository, ContentReviewRepository, StudentCreditsRepository
)

router = APIRouter(prefix="/content-marketplace", tags=["content-marketplace"])


def require_roles(user: User, allowed_roles: List[str]) -> None:
    if user.is_superuser:
        return

    # Role.name is a display label (e.g. "Student", "Admin"); Role.slug is the
    # lowercase machine-readable identifier (e.g. "student", "admin") that
    # every caller of this helper passes in `allowed_roles`. Comparing
    # against `.name` here meant this check could never pass for any
    # non-superuser -- every single role-gated endpoint in this router
    # (create/update/delete content, reviews, purchases, moderation,
    # plagiarism) 403'd for every real student/teacher/admin caller.
    if user.role and user.role.slug in allowed_roles:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient role permissions"
    )


def _get_scoped_content(db: Session, content_id: int, institution_id: int):
    """Fetch content and 404 unless it belongs to the caller's institution.

    Used by the moderation/plagiarism endpoints below, none of which
    previously checked that the content_id they were given actually belonged
    to the reviewing teacher/admin's own institution -- a caller could act on
    (or read moderation/plagiarism data for) any other institution's content
    just by knowing/guessing its id.
    """
    repo = StudentContentRepository(db)
    content = repo.get_by_id(content_id)
    if not content or content.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    return content


@router.post("/contents", response_model=StudentContentResponse)
async def create_content(
    data: StudentContentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    service = ContentMarketplaceService(db)
    content = service.create_content(
        institution_id=current_user.institution_id,
        creator_student_id=current_user.student_profile.id,
        data=data
    )
    
    return content


@router.get("/contents/{content_id}", response_model=StudentContentDetailResponse)
async def get_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ContentMarketplaceService(db)
    
    student_id = None
    if current_user.student_profile:
        student_id = current_user.student_profile.id
    
    content = service.get_content_detail(content_id, student_id)
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    if content['institution_id'] != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return content


@router.put("/contents/{content_id}", response_model=StudentContentResponse)
async def update_content(
    content_id: int,
    data: StudentContentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    repo = StudentContentRepository(db)
    content = repo.get_by_id(content_id)
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    if not current_user.student_profile or content.creator_student_id != current_user.student_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    service = ContentMarketplaceService(db)
    updated_content = service.update_content(content_id, data)
    
    return updated_content


@router.post("/contents/{content_id}/submit-review", response_model=StudentContentResponse)
async def submit_content_for_review(
    content_id: int,
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    repo = StudentContentRepository(db)
    content = repo.get_by_id(content_id)
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    if not current_user.student_profile or content.creator_student_id != current_user.student_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    service = ContentMarketplaceService(db)
    updated_content = service.submit_for_review(content_id)
    
    plagiarism_service = ContentPlagiarismService(db)
    background_tasks.add_task(
        plagiarism_service.check_content_plagiarism,
        content_id,
        current_user.institution_id
    )
    
    return updated_content


@router.delete("/contents/{content_id}")
async def delete_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student", "admin", "super_admin"])
    
    repo = StudentContentRepository(db)
    content = repo.get_by_id(content_id)
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    is_creator = current_user.student_profile and content.creator_student_id == current_user.student_profile.id
    is_admin = bool(current_user.role and current_user.role.slug in ["admin", "super_admin"])
    
    if not (is_creator or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    repo.delete(content_id)
    
    return {"message": "Content deleted successfully"}


@router.post("/contents/search", response_model=List[StudentContentResponse])
async def search_contents(
    filters: ContentSearchFilters,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ContentMarketplaceService(db)
    contents = service.search_contents(
        institution_id=current_user.institution_id,
        filters=filters.dict(exclude_unset=True),
        skip=skip,
        limit=limit
    )
    
    return contents


@router.get("/my-contents", response_model=List[StudentContentResponse])
async def get_my_contents(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    repo = StudentContentRepository(db)
    contents = repo.list_by_creator(current_user.student_profile.id, skip, limit)
    
    return contents


@router.post("/purchases", response_model=ContentPurchaseResponse)
async def purchase_content(
    data: ContentPurchaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    try:
        service = ContentMarketplaceService(db)
        purchase = service.purchase_content(
            institution_id=current_user.institution_id,
            buyer_student_id=current_user.student_profile.id,
            content_id=data.content_id
        )
        return purchase
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my-purchases", response_model=List[ContentPurchaseResponse])
async def get_my_purchases(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    from src.repositories.content_marketplace_repository import ContentPurchaseRepository
    repo = ContentPurchaseRepository(db)
    purchases = repo.list_by_buyer(current_user.student_profile.id, skip, limit)
    
    return purchases


@router.post("/reviews", response_model=ContentReviewResponse)
async def add_review(
    data: ContentReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    try:
        service = ContentMarketplaceService(db)
        review = service.add_review(
            institution_id=current_user.institution_id,
            reviewer_student_id=current_user.student_profile.id,
            data=data
        )
        return review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/contents/{content_id}/reviews", response_model=List[ContentReviewResponse])
async def get_content_reviews(
    content_id: int,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = ContentReviewRepository(db)
    reviews = repo.list_by_content(content_id, skip, limit)
    
    return reviews


@router.put("/reviews/{review_id}", response_model=ContentReviewResponse)
async def update_review(
    review_id: int,
    data: ContentReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    repo = ContentReviewRepository(db)
    review = repo.get_by_id(review_id)
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if not current_user.student_profile or review.reviewer_student_id != current_user.student_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    update_data = data.dict(exclude_unset=True)
    updated_review = repo.update(review_id, update_data)
    
    content_repo = StudentContentRepository(db)
    content_repo.update_rating(review.content_id)
    
    return updated_review


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student", "admin", "super_admin"])
    
    repo = ContentReviewRepository(db)
    review = repo.get_by_id(review_id)
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    is_reviewer = current_user.student_profile and review.reviewer_student_id == current_user.student_profile.id
    is_admin = bool(current_user.role and current_user.role.slug in ["admin", "super_admin"])
    
    if not (is_reviewer or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    content_id = review.content_id
    repo.delete(review_id)
    
    content_repo = StudentContentRepository(db)
    content_repo.update_rating(content_id)
    
    return {"message": "Review deleted successfully"}


@router.get("/analytics/creator", response_model=CreatorAnalyticsResponse)
async def get_creator_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    service = ContentMarketplaceService(db)
    analytics = service.get_creator_analytics(current_user.student_profile.id)
    
    return analytics


@router.get("/credits/balance", response_model=StudentCreditsBalanceResponse)
async def get_credits_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    repo = StudentCreditsRepository(db)
    balance = repo.get_or_create_balance(
        current_user.institution_id,
        current_user.student_profile.id
    )
    
    return balance


@router.get("/credits/transactions", response_model=List[CreditTransactionResponse])
async def get_credit_transactions(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    repo = StudentCreditsRepository(db)
    balance = repo.get_or_create_balance(
        current_user.institution_id,
        current_user.student_profile.id
    )
    
    transactions = repo.list_transactions(balance.id, skip, limit)
    
    return transactions


@router.post("/moderation/queue", response_model=List[StudentContentResponse])
async def get_moderation_queue(
    filters: ModerationQueueFilters,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    service = ContentModerationService(db)
    contents = service.get_moderation_queue(
        institution_id=current_user.institution_id,
        filters=filters.dict(exclude_unset=True),
        skip=skip,
        limit=limit
    )
    
    return contents


@router.post("/moderation/{content_id}/approve", response_model=ModerationReviewResponse)
async def approve_content(
    content_id: int,
    data: ModerationReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])

    if not current_user.teacher_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher profile required"
        )

    _get_scoped_content(db, content_id, current_user.institution_id)

    service = ContentModerationService(db)
    review = service.approve_content(
        content_id=content_id,
        reviewer_teacher_id=current_user.teacher_profile.id,
        institution_id=current_user.institution_id,
        quality_score=data.quality_score,
        accuracy_score=data.accuracy_score,
        feedback=data.feedback
    )
    
    return review


@router.post("/moderation/{content_id}/reject", response_model=ModerationReviewResponse)
async def reject_content(
    content_id: int,
    data: ModerationReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    if not current_user.teacher_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher profile required"
        )
    
    if not data.rejection_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required"
        )

    _get_scoped_content(db, content_id, current_user.institution_id)

    service = ContentModerationService(db)
    review = service.reject_content(
        content_id=content_id,
        reviewer_teacher_id=current_user.teacher_profile.id,
        institution_id=current_user.institution_id,
        rejection_reason=data.rejection_reason,
        quality_score=data.quality_score,
        accuracy_score=data.accuracy_score
    )
    
    return review


@router.post("/moderation/{content_id}/request-revision", response_model=ModerationReviewResponse)
async def request_content_revision(
    content_id: int,
    data: ModerationReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    if not current_user.teacher_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher profile required"
        )
    
    if not data.revision_notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Revision notes are required"
        )

    _get_scoped_content(db, content_id, current_user.institution_id)

    service = ContentModerationService(db)
    review = service.request_revision(
        content_id=content_id,
        reviewer_teacher_id=current_user.teacher_profile.id,
        institution_id=current_user.institution_id,
        revision_notes=data.revision_notes,
        quality_score=data.quality_score,
        accuracy_score=data.accuracy_score
    )
    
    return review


@router.get("/moderation/{content_id}/history", response_model=List[ModerationReviewResponse])
async def get_moderation_history(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])

    _get_scoped_content(db, content_id, current_user.institution_id)

    service = ContentModerationService(db)
    history = service.get_content_moderation_history(content_id)

    return history


@router.post("/plagiarism/{content_id}/check", response_model=PlagiarismCheckResponse)
async def check_content_plagiarism(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])

    _get_scoped_content(db, content_id, current_user.institution_id)

    try:
        service = ContentPlagiarismService(db)
        check = service.check_content_plagiarism(
            content_id=content_id,
            institution_id=current_user.institution_id
        )
    except ValueError as e:
        # check_content_plagiarism raises ValueError("Content not found") for
        # an unknown content_id -- this was never caught here, so it bubbled
        # up as an unhandled 500 instead of a clean 404. (The
        # `_get_scoped_content` call above already makes this unreachable in
        # practice, but the service can be called standalone elsewhere, so
        # the endpoint should still degrade cleanly rather than 500.)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    return check


@router.get("/plagiarism/{content_id}/report", response_model=PlagiarismCheckResponse)
async def get_plagiarism_report(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student", "teacher", "admin", "super_admin"])
    
    repo = StudentContentRepository(db)
    content = repo.get_by_id(content_id)
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    if content.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    is_creator = current_user.student_profile and content.creator_student_id == current_user.student_profile.id
    is_staff = bool(current_user.role and current_user.role.slug in ["teacher", "admin", "super_admin"])

    if not (is_creator or is_staff):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    service = ContentPlagiarismService(db)
    report = service.get_plagiarism_report(content_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No plagiarism check found"
        )
    
    return report


@router.get("/contents/{content_id}/download")
async def download_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["student"])
    
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile required"
        )
    
    try:
        service = ContentMarketplaceService(db)
        content = service.download_content(
            content_id=content_id,
            student_id=current_user.student_profile.id
        )
        
        return {
            "download_url": content.full_content_url,
            "s3_key": content.s3_key,
            "title": content.title,
            "content_type": content.content_type
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
