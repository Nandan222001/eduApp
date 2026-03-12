from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user, require_roles
from src.models.user import User
from src.models.plagiarism import ReviewDecision
from src.schemas.plagiarism import (
    PlagiarismCheckCreate, PlagiarismCheckResponse, PlagiarismCheckUpdate,
    PlagiarismResultResponse, PlagiarismResultDetailResponse, ReviewSubmission,
    SimilarityVisualizationResponse, PlagiarismReportResponse,
    PrivacyConsentCreate, PrivacyConsentUpdate, PrivacyConsentResponse
)
from src.services.plagiarism_detection_service import PlagiarismDetectionService
from src.services.plagiarism_visualization_service import PlagiarismVisualizationService
from src.repositories.plagiarism_repository import (
    PlagiarismCheckRepository, PlagiarismResultRepository,
    PrivacyConsentRepository
)

router = APIRouter(prefix="/plagiarism", tags=["plagiarism"])


@router.post("/checks", response_model=PlagiarismCheckResponse)
def create_plagiarism_check(
    data: PlagiarismCheckCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create and initiate a plagiarism check"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    service = PlagiarismDetectionService(db)
    check = service.create_plagiarism_check(
        institution_id=current_user.institution_id,
        data=data
    )
    
    background_tasks.add_task(service.run_plagiarism_check, check.id)
    
    return check


@router.get("/checks/{check_id}", response_model=PlagiarismCheckResponse)
def get_plagiarism_check(
    check_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get plagiarism check details"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    repo = PlagiarismCheckRepository(db)
    check = repo.get_by_id(check_id)
    
    if not check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plagiarism check not found"
        )
    
    if check.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return check


@router.get("/checks/assignment/{assignment_id}", response_model=List[PlagiarismCheckResponse])
def list_assignment_checks(
    assignment_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List plagiarism checks for an assignment"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    repo = PlagiarismCheckRepository(db)
    checks = repo.list_by_assignment(assignment_id, skip, limit)
    
    return checks


@router.get("/results/check/{check_id}", response_model=List[PlagiarismResultResponse])
def get_check_results(
    check_id: int,
    min_similarity: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get plagiarism results for a check"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    check_repo = PlagiarismCheckRepository(db)
    check = check_repo.get_by_id(check_id)
    
    if not check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check not found"
        )
    
    if check.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    result_repo = PlagiarismResultRepository(db)
    results = result_repo.list_by_check(check_id, min_similarity, skip, limit)
    
    return results


@router.get("/results/{result_id}", response_model=PlagiarismResultDetailResponse)
def get_result_details(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed plagiarism result with matched segments"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    service = PlagiarismVisualizationService(db)
    result = service.get_result_with_details(result_id, current_user.institution_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found"
        )
    
    return result


@router.post("/results/{result_id}/review", response_model=PlagiarismResultResponse)
def review_plagiarism_result(
    result_id: int,
    review_data: ReviewSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Review and mark plagiarism result"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    from src.models.teacher import Teacher
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can review results"
        )
    
    service = PlagiarismDetectionService(db)
    result = service.review_result(
        result_id=result_id,
        teacher_id=teacher.id,
        decision=review_data.review_decision,
        notes=review_data.review_notes,
        is_false_positive=review_data.is_false_positive,
        false_positive_reason=review_data.false_positive_reason
    )
    
    return result


@router.get("/visualization/{result_id}", response_model=SimilarityVisualizationResponse)
def get_similarity_visualization(
    result_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get visualization data for side-by-side comparison"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    service = PlagiarismVisualizationService(db)
    visualization = service.create_visualization(result_id, current_user.institution_id)
    
    if not visualization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visualization data not found"
        )
    
    return visualization


@router.get("/report/assignment/{assignment_id}", response_model=PlagiarismReportResponse)
def get_plagiarism_report(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate plagiarism report for assignment"""
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    
    service = PlagiarismDetectionService(db)
    report = service.generate_plagiarism_report(assignment_id)
    
    if 'error' in report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=report['error']
        )
    
    from src.models.assignment import Assignment
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    report['assignment_title'] = assignment.title
    
    return report


@router.post("/privacy-consent", response_model=PrivacyConsentResponse)
def create_privacy_consent(
    data: PrivacyConsentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update privacy consent settings"""
    require_roles(current_user, ["admin", "super_admin"])
    
    repo = PrivacyConsentRepository(db)
    existing = repo.get_by_institution(current_user.institution_id)
    
    if existing:
        consent = repo.update(
            existing,
            allow_cross_institution_comparison=data.allow_cross_institution_comparison,
            allow_anonymized_sharing=data.allow_anonymized_sharing,
            data_retention_days=data.data_retention_days,
            privacy_settings=data.privacy_settings,
            consent_given_by=current_user.id
        )
    else:
        consent = repo.create(
            institution_id=current_user.institution_id,
            allow_cross_institution_comparison=data.allow_cross_institution_comparison,
            allow_anonymized_sharing=data.allow_anonymized_sharing,
            data_retention_days=data.data_retention_days,
            privacy_settings=data.privacy_settings,
            consent_given_by=current_user.id
        )
    
    db.commit()
    db.refresh(consent)
    
    return consent


@router.get("/privacy-consent", response_model=PrivacyConsentResponse)
def get_privacy_consent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get privacy consent settings for institution"""
    require_roles(current_user, ["admin", "super_admin"])
    
    repo = PrivacyConsentRepository(db)
    consent = repo.get_by_institution(current_user.institution_id)
    
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Privacy consent not configured"
        )
    
    return consent


@router.get("/results/submission/{submission_id}", response_model=List[PlagiarismResultResponse])
def get_submission_results(
    submission_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get plagiarism results for a specific submission"""
    require_roles(current_user, ["teacher", "student", "admin", "super_admin"])
    
    from src.models.assignment import Submission
    from src.models.student import Student
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if current_user.role.name == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or submission.student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    result_repo = PlagiarismResultRepository(db)
    results = result_repo.list_by_submission(submission_id, skip, limit)
    
    return results
