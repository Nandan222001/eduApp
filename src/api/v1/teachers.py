from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.teacher import (
    TeacherCreate,
    TeacherUpdate,
    TeacherResponse,
    TeacherSubjectCreate,
    TeacherSubjectResponse,
    BulkImportResult,
    TeacherMyDashboardResponse,
)
from src.services.teacher_service import TeacherService

router = APIRouter()


@router.post("/", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher_data: TeacherCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != teacher_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create teacher for this institution"
        )
    
    service = TeacherService(db)
    teacher = service.create_teacher(teacher_data)
    return teacher


@router.get("/", response_model=dict)
async def list_teachers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    teachers, total = service.list_teachers(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active
    )
    return {
        "items": teachers,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    teacher = service.get_teacher(teacher_id)
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    if teacher.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this teacher"
        )
    
    return teacher


@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: int,
    teacher_data: TeacherUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    teacher = service.get_teacher(teacher_id)
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    if teacher.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this teacher"
        )
    
    updated_teacher = service.update_teacher(teacher_id, teacher_data)
    return updated_teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    teacher = service.get_teacher(teacher_id)
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    if teacher.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this teacher"
        )
    
    service.delete_teacher(teacher_id)
    return None


@router.post("/bulk-import", response_model=BulkImportResult)
async def bulk_import_teachers(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    result = await service.bulk_import_teachers(current_user.institution_id, file)
    return result


@router.post("/teacher-subjects", response_model=TeacherSubjectResponse, status_code=status.HTTP_201_CREATED)
async def assign_subject_to_teacher(
    data: TeacherSubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    service = TeacherService(db)
    teacher_subject = service.assign_subject_to_teacher(data)
    return teacher_subject


@router.delete("/teacher-subjects/{teacher_id}/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_subject_from_teacher(
    teacher_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    success = service.remove_subject_from_teacher(teacher_id, subject_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher-subject assignment not found"
        )
    
    return None


@router.get("/{teacher_id}/subjects", response_model=list)
async def get_teacher_subjects(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    teacher = service.get_teacher(teacher_id)
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found"
        )
    
    if teacher.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    subjects = service.get_teacher_subjects(teacher_id)
    return subjects


@router.get("/my-dashboard", response_model=TeacherMyDashboardResponse)
async def get_my_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TeacherService(db)
    dashboard_data = service.get_teacher_my_dashboard(current_user)
    return dashboard_data
