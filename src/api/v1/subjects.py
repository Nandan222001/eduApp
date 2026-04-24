from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.academic import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    GradeSubjectCreate,
    GradeSubjectResponse,
)
from src.utils.serialization import serialize_list
from src.services.academic_service import SubjectService

router = APIRouter()


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != subject_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create subject for this institution"
        )
    
    service = SubjectService(db)
    subject = service.create_subject(subject_data)
    return subject


@router.get("/", response_model=dict)
async def list_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubjectService(db)
    subjects, total = service.list_subjects(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active
    )
    return {
        "items": serialize_list(SubjectResponse, subjects),
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubjectService(db)
    subject = service.get_subject(subject_id)
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    if subject.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this subject"
        )
    
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubjectService(db)
    subject = service.get_subject(subject_id)
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    if subject.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this subject"
        )
    
    updated_subject = service.update_subject(subject_id, subject_data)
    return updated_subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubjectService(db)
    subject = service.get_subject(subject_id)
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    if subject.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this subject"
        )
    
    service.delete_subject(subject_id)
    return None


@router.post("/grade-subjects", response_model=GradeSubjectResponse, status_code=status.HTTP_201_CREATED)
async def assign_subject_to_grade(
    data: GradeSubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    service = SubjectService(db)
    grade_subject = service.assign_subject_to_grade(data)
    return grade_subject


@router.delete("/grade-subjects/{grade_id}/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_subject_from_grade(
    grade_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubjectService(db)
    success = service.remove_subject_from_grade(grade_id, subject_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade-subject assignment not found"
        )
    
    return None


@router.get("/grades/{grade_id}/subjects", response_model=list)
async def get_grade_subjects(
    grade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SubjectService(db)
    subjects = service.get_grade_subjects(grade_id)
    return subjects
