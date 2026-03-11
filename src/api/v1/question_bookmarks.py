from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.previous_year_papers import (
    QuestionBookmarkCreate,
    QuestionBookmarkUpdate,
    QuestionBookmarkResponse,
)
from src.services.question_bookmark_service import QuestionBookmarkService

router = APIRouter()


@router.post("/", response_model=QuestionBookmarkResponse, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    bookmark_data: QuestionBookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBookmarkService(db)
    bookmark = service.create_bookmark(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        bookmark_data=bookmark_data
    )
    return bookmark


@router.get("/", response_model=dict)
async def list_bookmarks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBookmarkService(db)
    bookmarks, total = service.list_bookmarks(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return {
        "items": bookmarks,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{bookmark_id}", response_model=QuestionBookmarkResponse)
async def get_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBookmarkService(db)
    bookmark = service.get_bookmark(bookmark_id)

    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )

    if bookmark.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this bookmark"
        )

    return bookmark


@router.put("/{bookmark_id}", response_model=QuestionBookmarkResponse)
async def update_bookmark(
    bookmark_id: int,
    bookmark_data: QuestionBookmarkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBookmarkService(db)
    bookmark = service.get_bookmark(bookmark_id)

    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )

    if bookmark.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this bookmark"
        )

    updated_bookmark = service.update_bookmark(bookmark_id, bookmark_data)
    return updated_bookmark


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBookmarkService(db)
    bookmark = service.get_bookmark(bookmark_id)

    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )

    if bookmark.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this bookmark"
        )

    service.delete_bookmark(bookmark_id)


@router.get("/check/{question_id}", response_model=dict)
async def check_bookmark(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = QuestionBookmarkService(db)
    bookmark = service.get_bookmark_by_question(current_user.id, question_id)
    
    return {
        "is_bookmarked": bookmark is not None,
        "bookmark": bookmark
    }
