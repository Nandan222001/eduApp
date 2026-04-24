from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.academic import (
    SectionCreate,
    SectionUpdate,
    SectionResponse,
)
from src.utils.serialization import serialize_list
from src.services.academic_service import SectionService

router = APIRouter()


@router.post("/", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    section_data: SectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != section_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create section for this institution"
        )
    
    service = SectionService(db)
    section = service.create_section(section_data)
    return section


@router.get("/", response_model=dict)
async def list_sections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    grade_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SectionService(db)
    sections, total = service.list_sections(
        institution_id=current_user.institution_id,
        grade_id=grade_id,
        skip=skip,
        limit=limit,
        is_active=is_active
    )
    return {
        "items": serialize_list(SectionResponse, sections),
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{section_id}", response_model=SectionResponse)
async def get_section(
    section_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SectionService(db)
    section = service.get_section(section_id)
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    if section.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this section"
        )
    
    return section


@router.put("/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: int,
    section_data: SectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SectionService(db)
    section = service.get_section(section_id)
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    if section.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this section"
        )
    
    updated_section = service.update_section(section_id, section_data)
    return updated_section


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SectionService(db)
    section = service.get_section(section_id)
    
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    
    if section.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this section"
        )
    
    service.delete_section(section_id)
    return None
