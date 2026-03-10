from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.assignment import AssignmentStatus, SubmissionStatus
from src.dependencies.auth import get_current_user
from src.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentWithFilesResponse,
    AssignmentWithStatsResponse,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionGradeInput,
    SubmissionResponse,
    SubmissionWithFilesResponse,
    SubmissionWithStudentResponse,
    SubmissionStatistics,
    AssignmentAnalytics,
    FileUploadResponse
)
from src.services.assignment_service import AssignmentService, SubmissionService

router = APIRouter()


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != assignment_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create assignment for this institution"
        )

    service = AssignmentService(db)
    assignment = service.create_assignment(assignment_data)
    return assignment


@router.get("/", response_model=dict)
async def list_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    grade_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    status: Optional[AssignmentStatus] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    assignments, total = service.list_assignments(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        grade_id=grade_id,
        section_id=section_id,
        subject_id=subject_id,
        teacher_id=teacher_id,
        status=status,
        search=search,
        is_active=is_active
    )
    return {
        "items": assignments,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{assignment_id}", response_model=AssignmentWithFilesResponse)
async def get_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    assignment = service.get_assignment_with_files(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this assignment"
        )

    return assignment


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    assignment = service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this assignment"
        )

    updated_assignment = service.update_assignment(assignment_id, assignment_data)
    return updated_assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    assignment = service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this assignment"
        )

    service.delete_assignment(assignment_id)
    return None


@router.post("/{assignment_id}/files", response_model=FileUploadResponse)
async def upload_assignment_file(
    assignment_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    assignment = service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload files for this assignment"
        )

    result = await service.upload_assignment_file(assignment_id, file)
    return result


@router.delete("/{assignment_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment_file(
    assignment_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AssignmentService(db)
    assignment = service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete files from this assignment"
        )

    success = service.delete_assignment_file(file_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return None


@router.get("/{assignment_id}/submissions", response_model=dict)
async def list_assignment_submissions(
    assignment_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[SubmissionStatus] = Query(None),
    is_late: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view submissions for this assignment"
        )

    service = SubmissionService(db)
    submissions, total = service.list_assignment_submissions(
        assignment_id=assignment_id,
        skip=skip,
        limit=limit,
        status=status,
        is_late=is_late
    )

    return {
        "items": submissions,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{assignment_id}/statistics", response_model=SubmissionStatistics)
async def get_submission_statistics(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view statistics for this assignment"
        )

    service = SubmissionService(db)
    stats = service.get_submission_statistics(assignment_id)
    return stats


@router.get("/{assignment_id}/analytics", response_model=AssignmentAnalytics)
async def get_assignment_analytics(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view analytics for this assignment"
        )

    service = SubmissionService(db)
    analytics = service.get_assignment_analytics(assignment_id)
    return analytics
