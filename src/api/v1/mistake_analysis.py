from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.student import Student
from src.models.mistake_analysis import RemediationStatus, EarnedVia
from src.schemas.mistake_analysis import (
    MistakePatternResponse, MistakePatternUpdate,
    MistakeInsuranceTokenResponse, MistakeInsuranceTokenCreate,
    InsuranceReviewResponse,
    MistakeAnalysisRequest, CorrectionPlanResponse,
    InsuranceClaimRequest, InsuranceClaimValidationResponse, InsuranceClaimResponse,
    StudentMistakeSummary, SubjectMistakeAnalysis
)
from src.services.mistake_analysis_service import MistakeAnalysisService

router = APIRouter(prefix="/mistake-analysis", tags=["Mistake Analysis"])


def _verify_student_access(student_id: int, current_user: User, db: Session) -> None:
    """Ensure the requesting user may see this student's mistake data.

    Every endpoint in this router had NO authentication dependency at all
    (the most severe bug class this audit checks for) -- any unauthenticated
    caller could pull any student's exam-mistake history, generate/redeem
    mistake-insurance tokens, and view/alter remediation status just by
    guessing sequential ids. This adds real auth plus a same-institution
    check for the endpoints that take a student_id directly. Superusers
    bypass the institution check.
    """
    if current_user.is_superuser:
        return
    student = db.query(Student).filter(Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if student.institution_id != current_user.institution_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this student")


@router.post("/detect", response_model=List[MistakePatternResponse])
def detect_mistake_patterns(
    request: MistakeAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(request.student_id, current_user, db)
    service = MistakeAnalysisService(db)
    patterns = service.detect_patterns(request)
    return patterns


@router.get("/students/{student_id}/summary", response_model=StudentMistakeSummary)
def get_student_mistake_summary(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(student_id, current_user, db)
    service = MistakeAnalysisService(db)
    summary = service.get_student_summary(student_id)
    return summary


@router.get("/students/{student_id}/patterns", response_model=List[MistakePatternResponse])
def get_student_patterns(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    remediation_status: Optional[RemediationStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(student_id, current_user, db)
    service = MistakeAnalysisService(db)
    patterns = service.pattern_repo.get_student_patterns(
        student_id=student_id,
        subject_id=subject_id,
        remediation_status=remediation_status
    )
    return [MistakePatternResponse.model_validate(p) for p in patterns]


@router.get("/students/{student_id}/subjects/{subject_id}/analysis", response_model=SubjectMistakeAnalysis)
def get_subject_analysis(
    student_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(student_id, current_user, db)
    service = MistakeAnalysisService(db)
    analysis = service.get_subject_analysis(student_id, subject_id)
    return analysis


@router.get("/students/{student_id}/marks-impact")
def calculate_marks_impact(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(student_id, current_user, db)
    service = MistakeAnalysisService(db)
    impact = service.calculate_marks_impact(student_id, subject_id)
    return impact


@router.get("/students/{student_id}/correction-plan", response_model=CorrectionPlanResponse)
def generate_correction_plan(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(student_id, current_user, db)
    service = MistakeAnalysisService(db)
    plan = service.generate_correction_plan(student_id, subject_id)
    return plan


@router.patch("/patterns/{pattern_id}/status", response_model=MistakePatternResponse)
def update_pattern_remediation_status(
    pattern_id: int,
    new_status: RemediationStatus = Query(..., alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # `new_status` (bug fix): the original parameter was named `status`, which
    # shadowed the `from fastapi import status` module import used a few
    # lines below for `status.HTTP_404_NOT_FOUND` -- since a plain
    # RemediationStatus enum has no such attribute, the not-found branch
    # raised an unhandled AttributeError (500) instead of ever returning a
    # 404. The wire-level query param is kept as `?status=...` via `alias`
    # so no API contract changes.
    service = MistakeAnalysisService(db)
    existing = service.pattern_repo.get_pattern_by_id(pattern_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pattern not found"
        )
    _verify_student_access(existing.student_id, current_user, db)
    pattern = service.update_pattern_status(pattern_id, new_status)
    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pattern not found"
        )
    return pattern


@router.post("/insurance/tokens", response_model=MistakeInsuranceTokenResponse, status_code=status.HTTP_201_CREATED)
def create_insurance_token(
    token_data: MistakeInsuranceTokenCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(token_data.student_id, current_user, db)
    service = MistakeAnalysisService(db)
    token = service.create_insurance_token(
        student_id=token_data.student_id,
        earned_via=token_data.earned_via
    )
    return token


@router.get("/insurance/students/{student_id}/tokens", response_model=List[MistakeInsuranceTokenResponse])
def get_student_insurance_tokens(
    student_id: int,
    include_used: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(student_id, current_user, db)
    service = MistakeAnalysisService(db)
    tokens = service.get_student_tokens(student_id, include_used)
    return tokens


@router.post("/insurance/validate-claim", response_model=InsuranceClaimValidationResponse)
def validate_insurance_claim(
    request: InsuranceClaimRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    validation = service.validate_insurance_claim(request)
    return validation


@router.post("/insurance/process-claim", response_model=InsuranceClaimResponse)
def process_insurance_claim(
    request: InsuranceClaimRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    result = service.process_insurance_claim(request)
    return result


@router.get("/insurance/reviews/{review_id}", response_model=InsuranceReviewResponse)
def get_insurance_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    review = service.review_repo.get_review_by_id(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return InsuranceReviewResponse.model_validate(review)


@router.get("/insurance/exams/{exam_id}/reviews", response_model=List[InsuranceReviewResponse])
def get_exam_insurance_reviews(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = MistakeAnalysisService(db)
    reviews = service.review_repo.get_reviews_by_exam(exam_id)
    return [InsuranceReviewResponse.model_validate(r) for r in reviews]


@router.get("/insurance/students/{student_id}/reviews", response_model=List[InsuranceReviewResponse])
def get_student_insurance_reviews(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _verify_student_access(student_id, current_user, db)
    service = MistakeAnalysisService(db)
    reviews = service.review_repo.get_student_reviews(student_id)
    return [InsuranceReviewResponse.model_validate(r) for r in reviews]
