from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user, get_current_superuser, require_roles
from src.schemas.institution import (
    InstitutionCreate,
    InstitutionUpdate,
    InstitutionResponse,
)
from src.services.institution_service import InstitutionService

router = APIRouter()


@router.post("/", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_institution(
    institution_data: InstitutionCreate,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)
    institution = service.create_institution(institution_data)
    return institution


@router.get("/", response_model=dict)
async def list_institutions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)
    institutions, total = service.list_institutions(
        skip=skip, 
        limit=limit, 
        search=search, 
        is_active=is_active
    )
    return {
        "items": institutions,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{institution_id}", response_model=InstitutionResponse)
async def get_institution(
    institution_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_superuser and current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this institution"
        )
    
    service = InstitutionService(db)
    institution = service.get_institution(institution_id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    return institution


@router.get("/{institution_id}/stats", response_model=dict)
async def get_institution_stats(
    institution_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_superuser and current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this institution"
        )
    
    service = InstitutionService(db)
    institution = service.get_institution(institution_id)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    stats = service.get_institution_stats(institution_id)
    return stats


@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: int,
    institution_data: InstitutionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_superuser and current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this institution"
        )

    require_roles(current_user, ["admin", "institution_admin"])

    service = InstitutionService(db)
    institution = service.update_institution(institution_id, institution_data)
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    return institution


@router.delete("/{institution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_institution(
    institution_id: int,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)
    success = service.delete_institution(institution_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    return None
