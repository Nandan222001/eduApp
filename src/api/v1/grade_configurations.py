from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.examination import (
    GradeConfigurationCreate,
    GradeConfigurationUpdate,
    GradeConfigurationResponse,
)
from src.models.examination import GradeConfiguration

router = APIRouter()


@router.post("/", response_model=GradeConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_grade_configuration(
    config_data: GradeConfigurationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != config_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    overlapping = db.query(GradeConfiguration).filter(
        GradeConfiguration.institution_id == config_data.institution_id,
        GradeConfiguration.is_active == True,
        GradeConfiguration.min_percentage <= config_data.max_percentage,
        GradeConfiguration.max_percentage >= config_data.min_percentage
    ).first()
    
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Grade percentage range overlaps with existing configuration"
        )
    
    config = GradeConfiguration(**config_data.model_dump())
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@router.get("/", response_model=dict)
async def list_grade_configurations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(GradeConfiguration).filter(
        GradeConfiguration.institution_id == current_user.institution_id
    )
    
    if is_active is not None:
        query = query.filter(GradeConfiguration.is_active == is_active)
    
    total = query.count()
    configs = query.order_by(
        GradeConfiguration.min_percentage.desc()
    ).offset(skip).limit(limit).all()
    
    return {
        "items": configs,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{config_id}", response_model=GradeConfigurationResponse)
async def get_grade_configuration(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = db.query(GradeConfiguration).filter(
        GradeConfiguration.id == config_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade configuration not found"
        )
    
    if config.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return config


@router.put("/{config_id}", response_model=GradeConfigurationResponse)
async def update_grade_configuration(
    config_id: int,
    config_data: GradeConfigurationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = db.query(GradeConfiguration).filter(
        GradeConfiguration.id == config_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade configuration not found"
        )
    
    if config.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    for key, value in config_data.model_dump(exclude_unset=True).items():
        setattr(config, key, value)
    
    db.commit()
    db.refresh(config)
    return config


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade_configuration(
    config_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = db.query(GradeConfiguration).filter(
        GradeConfiguration.id == config_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grade configuration not found"
        )
    
    if config.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    db.delete(config)
    db.commit()
    return None
