from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.database import get_db
from src.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalAnalyticsResponse,
)
from src.services.goal import GoalService
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    return service.create_goal(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        goal_data=goal_data,
    )


@router.get("", response_model=List[GoalResponse])
async def get_goals(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    return service.get_goals(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
    )


@router.get("/analytics", response_model=GoalAnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    return service.get_analytics(
        user_id=current_user.id, institution_id=current_user.institution_id
    )


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    goal = service.get_goal(goal_id=goal_id, user_id=current_user.id)
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found"
        )
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    update_data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    goal = service.update_goal(
        goal_id=goal_id, user_id=current_user.id, update_data=update_data
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found"
        )
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    success = service.delete_goal(goal_id=goal_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found"
        )


@router.patch(
    "/{goal_id}/milestones/{milestone_id}", response_model=GoalResponse
)
async def update_milestone_progress(
    goal_id: int,
    milestone_id: int,
    progress: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    goal = service.update_milestone_progress(
        goal_id=goal_id,
        milestone_id=milestone_id,
        user_id=current_user.id,
        progress=progress,
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal or milestone not found",
        )
    return goal


@router.post(
    "/{goal_id}/milestones/{milestone_id}/complete", response_model=GoalResponse
)
async def complete_milestone(
    goal_id: int,
    milestone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = GoalService(db)
    goal = service.complete_milestone(
        goal_id=goal_id, milestone_id=milestone_id, user_id=current_user.id
    )
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal or milestone not found",
        )
    return goal
