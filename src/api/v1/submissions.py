from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.assignment import SubmissionStatus
from src.dependencies.auth import get_current_user
from src.schemas.assignment import (
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionGradeInput,
    SubmissionResponse,
    SubmissionWithFilesResponse,
    FileUploadResponse
)
from src.services.assignment_service import SubmissionService, AssignmentService

router = APIRouter()


@router.post("/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_submission(
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(submission_data.assignment_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    if assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit to this assignment"
        )

    service = SubmissionService(db)
    submission = service.create_or_update_submission(submission_data)
    return submission


@router.get("/{submission_id}", response_model=SubmissionWithFilesResponse)
async def get_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    submission = service.get_submission_with_files(submission_id)

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(submission.assignment_id)

    if not assignment or assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this submission"
        )

    return submission


@router.get("/assignment/{assignment_id}/student/{student_id}", response_model=SubmissionWithFilesResponse)
async def get_student_submission(
    assignment_id: int,
    student_id: int,
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
            detail="Not authorized to access this submission"
        )

    service = SubmissionService(db)
    submission = service.get_student_submission(assignment_id, student_id)

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    return submission


@router.post("/{submission_id}/grade", response_model=SubmissionResponse)
async def grade_submission(
    submission_id: int,
    grade_data: SubmissionGradeInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    submission = service.get_submission(submission_id)

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(submission.assignment_id)

    if not assignment or assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to grade this submission"
        )

    from src.models.teacher import Teacher
    teacher = db.query(Teacher).filter(
        Teacher.user_id == current_user.id,
        Teacher.institution_id == current_user.institution_id
    ).first()

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can grade submissions"
        )

    graded_submission = service.grade_submission(
        submission_id=submission_id,
        grader_id=teacher.id,
        grade_data=grade_data
    )

    return graded_submission


@router.post("/{submission_id}/files", response_model=FileUploadResponse)
async def upload_submission_file(
    submission_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    submission = service.get_submission(submission_id)

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(submission.assignment_id)

    if not assignment or assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload files for this submission"
        )

    result = await service.upload_submission_file(submission_id, file)
    return result


@router.delete("/{submission_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission_file(
    submission_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    submission = service.get_submission(submission_id)

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    assignment_service = AssignmentService(db)
    assignment = assignment_service.get_assignment(submission.assignment_id)

    if not assignment or assignment.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete files from this submission"
        )

    success = service.delete_submission_file(file_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return None
