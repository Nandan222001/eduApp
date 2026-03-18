from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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
        metadata=feedback.metadata or {},
    )
    
    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)
    
    return {
        "message": "Feedback submitted successfully",
        "feedback_id": str(new_feedback.id),
        "status": "pending",
    }


@router.get("/my-feedback", response_model=List[FeedbackResponse])
async def get_my_feedback(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's feedback submissions."""
    from src.models import Feedback as FeedbackModel
    
    result = await db.execute(
        select(FeedbackModel)
        .where(FeedbackModel.user_id == current_user.id)
        .order_by(FeedbackModel.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    feedback_list = result.scalars().all()
    return feedback_list


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific feedback by ID."""
    from src.models import Feedback as FeedbackModel
    
    result = await db.execute(
        select(FeedbackModel)
        .where(FeedbackModel.id == feedback_id)
        .where(FeedbackModel.user_id == current_user.id)
    )
    
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    return feedback


@router.get("/stats/summary", response_model=dict)
async def get_feedback_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get feedback statistics for the current user."""
    from src.models import Feedback as FeedbackModel
    
    result = await db.execute(
        select(
            func.count(FeedbackModel.id).label("total"),
            func.count(FeedbackModel.id).filter(FeedbackModel.status == "pending").label("pending"),
            func.count(FeedbackModel.id).filter(FeedbackModel.status == "reviewed").label("reviewed"),
            func.count(FeedbackModel.id).filter(FeedbackModel.status == "resolved").label("resolved"),
        )
        .where(FeedbackModel.user_id == current_user.id)
    )
    
    stats = result.one()
    
    return {
        "total": stats.total or 0,
        "pending": stats.pending or 0,
        "reviewed": stats.reviewed or 0,
        "resolved": stats.resolved or 0,
    }
