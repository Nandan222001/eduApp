from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.academic import (
    AcademicYearCreate,
    AcademicYearUpdate,
    AcademicYearResponse,
)
from src.utils.serialization import serialize_list
from src.services.academic_service import AcademicYearService

router = APIRouter()


@router.post("/", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
async def create_academic_year(
    academic_year_data: AcademicYearCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != academic_year_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create academic year for this institution"
        )
    
    service = AcademicYearService(db)
    academic_year = service.create_academic_year(academic_year_data)
    return academic_year


@router.get("/", response_model=dict)
async def list_academic_years(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    is_current: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AcademicYearService(db)
    academic_years, total = service.list_academic_years(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        is_active=is_active,
        is_current=is_current
    )
    return {
        "items": serialize_list(AcademicYearResponse, academic_years),
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{academic_year_id}", response_model=AcademicYearResponse)
async def get_academic_year(
    academic_year_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AcademicYearService(db)
    academic_year = service.get_academic_year(academic_year_id)
    
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )
    
    if academic_year.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this academic year"
        )
    
    return academic_year


@router.put("/{academic_year_id}", response_model=AcademicYearResponse)
async def update_academic_year(
    academic_year_id: int,
    academic_year_data: AcademicYearUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AcademicYearService(db)
    academic_year = service.get_academic_year(academic_year_id)
    
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )
    
    if academic_year.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this academic year"
        )
    
    updated_academic_year = service.update_academic_year(academic_year_id, academic_year_data)
    return updated_academic_year


@router.delete("/{academic_year_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_academic_year(
    academic_year_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AcademicYearService(db)
    academic_year = service.get_academic_year(academic_year_id)
    
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )
    
    if academic_year.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this academic year"
        )
    
    service.delete_academic_year(academic_year_id)
    return None
