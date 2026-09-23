from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from pydantic import BaseModel, Field
from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models import User

router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackCreate(BaseModel):
    category: str = Field(..., description="Feedback category: bug, feature, improvement, other")
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)
    rating: Optional[int] = Field(None, ge=1, le=5)
    metadata: Optional[dict] = None


class FeedbackResponse(BaseModel):
    id: UUID
    category: str
    subject: str
    message: str
    rating: Optional[int]
    status: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit user feedback."""
    from src.models import Feedback as FeedbackModel

    new_feedback = FeedbackModel(
        user_id=current_user.id,
        category=feedback.category,
        subject=feedback.subject,
        message=feedback.message,
        rating=feedback.rating,
        status="pending",
        metadata_json=feedback.metadata or {},
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return {
        "message": "Feedback submitted successfully",
        "feedback_id": str(new_feedback.id),
        "status": "pending",
    }


@router.get("/my-feedback", response_model=List[FeedbackResponse])
def get_my_feedback(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's feedback submissions."""
    from src.models import Feedback as FeedbackModel

    feedback_list = (
        db.query(FeedbackModel)
        .filter(FeedbackModel.user_id == current_user.id)
        .order_by(FeedbackModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return feedback_list


@router.get("/stats/summary", response_model=dict)
def get_feedback_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get feedback statistics for the current user."""
    from src.models import Feedback as FeedbackModel

    # `func.count(...).filter(...)` compiles to the SQL FILTER (WHERE ...)
    # clause, a Postgres/SQLite-only aggregate extension that MySQL doesn't
    # support at all -- every call to this endpoint raised
    # ProgrammingError 1064. Conditional aggregation via case() works on
    # every backend.
    stats = (
        db.query(
            func.count(FeedbackModel.id).label("total"),
            func.sum(case((FeedbackModel.status == "pending", 1), else_=0)).label("pending"),
            func.sum(case((FeedbackModel.status == "reviewed", 1), else_=0)).label("reviewed"),
            func.sum(case((FeedbackModel.status == "resolved", 1), else_=0)).label("resolved"),
        )
        .filter(FeedbackModel.user_id == current_user.id)
        .one()
    )

    # func.sum(...) comes back through pymysql as a Decimal. response_model
    # is `dict` (Dict[str, Any]), and Pydantic v2's JSON-mode serializer
    # falls back to str() for a type it doesn't otherwise recognize under
    # Any -- an un-cast Decimal here silently turned these counts into JSON
    # strings (e.g. "1" instead of 1) instead of numbers.
    return {
        "total": int(stats.total or 0),
        "pending": int(stats.pending or 0),
        "reviewed": int(stats.reviewed or 0),
        "resolved": int(stats.resolved or 0),
    }


@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific feedback by ID."""
    from src.models import Feedback as FeedbackModel

    feedback = (
        db.query(FeedbackModel)
        .filter(FeedbackModel.id == str(feedback_id))
        .filter(FeedbackModel.user_id == current_user.id)
        .first()
    )

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    return feedback
