from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.academic import (
    GradeCreate,
    GradeUpdate,
    GradeResponse,
    BulkGradeOrderUpdate,
)
from src.services.academic_service import GradeService
from src.models.academic import Grade

router = APIRouter()


@router.post("/", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
async def create_grade(
    grade_data: GradeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != grade_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create grade for this institution"
        )
    
    service = GradeService(db)
    grade = service.create_grade(grade_data)
    return grade


@router.get("/", response_model=dict)
async def list_grades(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    academic_year_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GradeService(db)
    grades, total = service.list_grades(
        institution_id=current_user.institution_id,
        academic_year_id=academic_year_id,
        skip=skip,
        limit=limit,
        is_active=is_active
    )
    return {
        "items": grades,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{grade_id}", response_model=GradeResponse)
async def get_grade(
    grade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GradeService(db)
    grade = service.get_grade(grade_id)
    
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )
    
    if grade.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this grade"
        )
    
    return grade


@router.put("/{grade_id}", response_model=GradeResponse)
async def update_grade(
    grade_id: int,
    grade_data: GradeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GradeService(db)
    grade = service.get_grade(grade_id)
    
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )
    
    if grade.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this grade"
        )
    
    updated_grade = service.update_grade(grade_id, grade_data)
    return updated_grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(
    grade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GradeService(db)
    grade = service.get_grade(grade_id)
    
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade not found"
        )
    
    if grade.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this grade"
        )
    
    service.delete_grade(grade_id)
    return None


@router.put("/bulk-order", response_model=dict)
async def update_grade_order(
    order_data: BulkGradeOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for item in order_data.grades:
        grade = db.query(Grade).filter(
            Grade.id == item['id'],
            Grade.institution_id == current_user.institution_id
        ).first()
        
        if grade:
            grade.display_order = item['display_order']
    
    db.commit()
    return {"message": "Order updated successfully"}
