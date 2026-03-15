from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.schemas.scholarship_essays import (
    EssayPromptCreate,
    EssayPromptUpdate,
    EssayPromptResponse,
    StudentEssayCreate,
    StudentEssayUpdate,
    StudentEssayResponse,
    EssayPeerReviewCreate,
    EssayPeerReviewUpdate,
    EssayPeerReviewResponse,
    EssayTemplateCreate,
    EssayTemplateUpdate,
    EssayTemplateResponse,
    ReviewRubricCreate,
    ReviewRubricUpdate,
    ReviewRubricResponse,
    EssayAnalyticsResponse,
    PeerReviewAssignmentRequest,
    CounselorFeedbackRequest,
    GrammarCheckRequest,
    FinalizeEssayRequest,
    EssayImprovementReport,
)
from src.services.scholarship_essays_service import ScholarshipEssaysService
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter()


@router.post("/prompts", response_model=EssayPromptResponse, status_code=status.HTTP_201_CREATED)
async def create_essay_prompt(
    prompt_data: EssayPromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    prompt_dict = prompt_data.model_dump()
    return service.create_essay_prompt(prompt_dict)


@router.get("/prompts", response_model=List[EssayPromptResponse])
async def list_essay_prompts(
    prompt_type: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    return service.list_essay_prompts(
        institution_id=current_user.institution_id,
        prompt_type=prompt_type,
        limit=limit,
        offset=offset
    )


@router.get("/prompts/{prompt_id}", response_model=EssayPromptResponse)
async def get_essay_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    prompt = service.get_essay_prompt(prompt_id, current_user.institution_id)
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay prompt not found"
        )
    return prompt


@router.put("/prompts/{prompt_id}", response_model=EssayPromptResponse)
async def update_essay_prompt(
    prompt_id: int,
    update_data: EssayPromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    prompt = service.update_essay_prompt(
        prompt_id,
        current_user.institution_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay prompt not found"
        )
    return prompt


@router.delete("/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_essay_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    success = service.delete_essay_prompt(prompt_id, current_user.institution_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay prompt not found"
        )


@router.post("/essays", response_model=StudentEssayResponse, status_code=status.HTTP_201_CREATED)
async def create_student_essay(
    essay_data: StudentEssayCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    essay_dict = essay_data.model_dump()
    return service.create_student_essay(essay_dict)


@router.get("/essays", response_model=List[StudentEssayResponse])
async def list_student_essays(
    student_id: Optional[int] = Query(None),
    prompt_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    return service.list_student_essays(
        institution_id=current_user.institution_id,
        student_id=student_id,
        prompt_id=prompt_id,
        status=status_filter,
        limit=limit,
        offset=offset
    )


@router.get("/essays/{essay_id}", response_model=StudentEssayResponse)
async def get_student_essay(
    essay_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    essay = service.get_student_essay(essay_id, current_user.institution_id)
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student essay not found"
        )
    return essay


@router.put("/essays/{essay_id}", response_model=StudentEssayResponse)
async def update_student_essay(
    essay_id: int,
    update_data: StudentEssayUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    essay = service.update_student_essay(
        essay_id,
        current_user.institution_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student essay not found"
        )
    return essay


@router.delete("/essays/{essay_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student_essay(
    essay_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    success = service.delete_student_essay(essay_id, current_user.institution_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student essay not found"
        )


@router.post("/essays/{essay_id}/assign-reviewers", response_model=List[EssayPeerReviewResponse])
async def assign_peer_reviewers(
    essay_id: int,
    assignment_data: PeerReviewAssignmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    reviews = service.assign_peer_reviewers(
        essay_id=essay_id,
        institution_id=current_user.institution_id,
        num_reviewers=assignment_data.num_reviewers,
        preferred_reviewers=assignment_data.preferred_reviewers
    )
    if not reviews:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found or no reviewers available"
        )
    return reviews


@router.post("/essays/{essay_id}/counselor-feedback", response_model=StudentEssayResponse)
async def submit_counselor_feedback(
    essay_id: int,
    feedback_data: CounselorFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    essay = service.submit_counselor_feedback(
        essay_id=essay_id,
        institution_id=current_user.institution_id,
        counselor_user_id=current_user.id,
        feedback=feedback_data.feedback,
        rating=feedback_data.rating,
        approved=feedback_data.approved
    )
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )
    return essay


@router.post("/essays/{essay_id}/grammar-check", response_model=StudentEssayResponse)
async def run_grammar_check(
    essay_id: int,
    check_data: GrammarCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    essay = service.run_grammar_check(
        essay_id=essay_id,
        institution_id=current_user.institution_id
    )
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )
    return essay


@router.post("/essays/{essay_id}/finalize", response_model=StudentEssayResponse)
async def finalize_essay(
    essay_id: int,
    finalize_data: FinalizeEssayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    essay = service.finalize_essay(
        essay_id=essay_id,
        institution_id=current_user.institution_id,
        finalized_version=finalize_data.finalized_version
    )
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )
    return essay


@router.get("/essays/{essay_id}/analytics", response_model=List[EssayAnalyticsResponse])
async def get_essay_analytics(
    essay_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    analytics = service.get_essay_analytics(
        essay_id=essay_id,
        institution_id=current_user.institution_id
    )
    return analytics


@router.get("/essays/{essay_id}/improvement-report", response_model=EssayImprovementReport)
async def get_essay_improvement_report(
    essay_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    report = service.get_essay_improvement_report(
        essay_id=essay_id,
        institution_id=current_user.institution_id
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )
    return report


@router.post("/reviews", response_model=EssayPeerReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_peer_review(
    review_data: EssayPeerReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    review_dict = review_data.model_dump()
    return service.create_peer_review(review_dict)


@router.get("/reviews", response_model=List[EssayPeerReviewResponse])
async def list_peer_reviews(
    essay_id: Optional[int] = Query(None),
    reviewer_student_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    return service.list_peer_reviews(
        institution_id=current_user.institution_id,
        essay_id=essay_id,
        reviewer_student_id=reviewer_student_id,
        status=status_filter,
        limit=limit,
        offset=offset
    )


@router.get("/reviews/{review_id}", response_model=EssayPeerReviewResponse)
async def get_peer_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    review = service.get_peer_review(review_id, current_user.institution_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Peer review not found"
        )
    return review


@router.put("/reviews/{review_id}", response_model=EssayPeerReviewResponse)
async def update_peer_review(
    review_id: int,
    update_data: EssayPeerReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    review = service.update_peer_review(
        review_id,
        current_user.institution_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Peer review not found"
        )
    return review


@router.post("/templates", response_model=EssayTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_essay_template(
    template_data: EssayTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    template_dict = template_data.model_dump()
    return service.create_essay_template(template_dict)


@router.get("/templates", response_model=List[EssayTemplateResponse])
async def list_essay_templates(
    prompt_type: Optional[str] = Query(None),
    is_featured: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    return service.list_essay_templates(
        institution_id=current_user.institution_id,
        prompt_type=prompt_type,
        is_featured=is_featured,
        limit=limit,
        offset=offset
    )


@router.get("/templates/{template_id}", response_model=EssayTemplateResponse)
async def get_essay_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    template = service.get_essay_template(template_id, current_user.institution_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay template not found"
        )
    return template


@router.put("/templates/{template_id}", response_model=EssayTemplateResponse)
async def update_essay_template(
    template_id: int,
    update_data: EssayTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    template = service.update_essay_template(
        template_id,
        current_user.institution_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay template not found"
        )
    return template


@router.post("/templates/{template_id}/helpful", response_model=EssayTemplateResponse)
async def mark_template_helpful(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    template = service.mark_template_helpful(template_id, current_user.institution_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay template not found"
        )
    return template


@router.post("/rubrics", response_model=ReviewRubricResponse, status_code=status.HTTP_201_CREATED)
async def create_review_rubric(
    rubric_data: ReviewRubricCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    rubric_dict = rubric_data.model_dump()
    return service.create_review_rubric(rubric_dict)


@router.get("/rubrics", response_model=List[ReviewRubricResponse])
async def list_review_rubrics(
    prompt_type: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    return service.list_review_rubrics(
        institution_id=current_user.institution_id,
        prompt_type=prompt_type,
        limit=limit,
        offset=offset
    )


@router.get("/rubrics/default", response_model=ReviewRubricResponse)
async def get_default_rubric(
    prompt_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    rubric = service.get_default_rubric(
        institution_id=current_user.institution_id,
        prompt_type=prompt_type
    )
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Default rubric not found"
        )
    return rubric


@router.get("/rubrics/{rubric_id}", response_model=ReviewRubricResponse)
async def get_review_rubric(
    rubric_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    rubric = service.get_review_rubric(rubric_id, current_user.institution_id)
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review rubric not found"
        )
    return rubric


@router.put("/rubrics/{rubric_id}", response_model=ReviewRubricResponse)
async def update_review_rubric(
    rubric_id: int,
    update_data: ReviewRubricUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ScholarshipEssaysService(db)
    rubric = service.update_review_rubric(
        rubric_id,
        current_user.institution_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review rubric not found"
        )
    return rubric
