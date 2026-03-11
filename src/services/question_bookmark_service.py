from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from src.models.previous_year_papers import QuestionBookmark
from src.schemas.previous_year_papers import (
    QuestionBookmarkCreate,
    QuestionBookmarkUpdate,
    QuestionBookmarkResponse
)


class QuestionBookmarkService:
    def __init__(self, db: Session):
        self.db = db

    def create_bookmark(
        self,
        user_id: int,
        institution_id: int,
        bookmark_data: QuestionBookmarkCreate
    ) -> QuestionBookmarkResponse:
        existing = self.db.query(QuestionBookmark).filter(
            and_(
                QuestionBookmark.user_id == user_id,
                QuestionBookmark.question_id == bookmark_data.question_id
            )
        ).first()
        
        if existing:
            return QuestionBookmarkResponse.model_validate(existing)
        
        bookmark = QuestionBookmark(
            user_id=user_id,
            institution_id=institution_id,
            question_id=bookmark_data.question_id,
            notes=bookmark_data.notes,
            tags=bookmark_data.tags
        )
        
        self.db.add(bookmark)
        self.db.commit()
        self.db.refresh(bookmark)
        
        return QuestionBookmarkResponse.model_validate(bookmark)

    def list_bookmarks(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[QuestionBookmarkResponse], int]:
        query = self.db.query(QuestionBookmark).filter(
            QuestionBookmark.user_id == user_id
        )
        
        total = query.count()
        
        bookmarks = query.order_by(
            QuestionBookmark.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return (
            [QuestionBookmarkResponse.model_validate(b) for b in bookmarks],
            total
        )

    def get_bookmark(self, bookmark_id: int) -> Optional[QuestionBookmarkResponse]:
        bookmark = self.db.query(QuestionBookmark).filter(
            QuestionBookmark.id == bookmark_id
        ).first()
        
        if not bookmark:
            return None
        
        return QuestionBookmarkResponse.model_validate(bookmark)

    def get_bookmark_by_question(
        self,
        user_id: int,
        question_id: int
    ) -> Optional[QuestionBookmarkResponse]:
        bookmark = self.db.query(QuestionBookmark).filter(
            and_(
                QuestionBookmark.user_id == user_id,
                QuestionBookmark.question_id == question_id
            )
        ).first()
        
        if not bookmark:
            return None
        
        return QuestionBookmarkResponse.model_validate(bookmark)

    def update_bookmark(
        self,
        bookmark_id: int,
        bookmark_data: QuestionBookmarkUpdate
    ) -> Optional[QuestionBookmarkResponse]:
        bookmark = self.db.query(QuestionBookmark).filter(
            QuestionBookmark.id == bookmark_id
        ).first()
        
        if not bookmark:
            return None
        
        update_data = bookmark_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(bookmark, key, value)
        
        self.db.commit()
        self.db.refresh(bookmark)
        
        return QuestionBookmarkResponse.model_validate(bookmark)

    def delete_bookmark(self, bookmark_id: int) -> bool:
        bookmark = self.db.query(QuestionBookmark).filter(
            QuestionBookmark.id == bookmark_id
        ).first()
        
        if not bookmark:
            return False
        
        self.db.delete(bookmark)
        self.db.commit()
        
        return True
