from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.academic import (
    TermCreate,
    TermUpdate,
    TermResponse,
)
from src.models.academic import Term

router = APIRouter()


@router.post("/", response_model=TermResponse, status_code=status.HTTP_201_CREATED)
async def create_term(
    term_data: TermCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != term_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create term for this institution"
        )
    
    term = Term(**term_data.model_dump())
    db.add(term)
    db.commit()
    db.refresh(term)
    return term


@router.get("/", response_model=dict)
async def list_terms(
    academic_year_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Term).filter(Term.institution_id == current_user.institution_id)
    
    if academic_year_id:
        query = query.filter(Term.academic_year_id == academic_year_id)
    
    total = query.count()
    terms = query.order_by(Term.display_order, Term.start_date).offset(skip).limit(limit).all()
    
    return {
        "items": serialize_list(TermResponse, terms),
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{term_id}", response_model=TermResponse)
async def get_term(
    term_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    term = db.query(Term).filter(Term.id == term_id).first()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    if term.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this term"
        )
    
    return term


@router.put("/{term_id}", response_model=TermResponse)
async def update_term(
    term_id: int,
    term_data: TermUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    term = db.query(Term).filter(Term.id == term_id).first()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    if term.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this term"
        )
    
    for key, value in term_data.model_dump(exclude_unset=True).items():
        setattr(term, key, value)
    
    db.commit()
    db.refresh(term)
    return term


@router.delete("/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_term(
    term_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    term = db.query(Term).filter(Term.id == term_id).first()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    if term.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this term"
        )
    
    db.delete(term)
    db.commit()
    return None
