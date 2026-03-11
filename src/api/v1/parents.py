from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.parent import (
    ParentDashboardResponse,
    ChildOverviewResponse,
    TodayAttendanceResponse,
    RecentGradeResponse,
    PendingAssignmentResponse,
    WeeklyProgressResponse,
    PerformanceComparisonResponse,
)
from src.services.parent_service import ParentService

router = APIRouter()


@router.get("/dashboard", response_model=ParentDashboardResponse)
async def get_parent_dashboard(
    child_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive parent dashboard with all child information
    """
    service = ParentService(db)
    dashboard = service.get_parent_dashboard(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        child_id=child_id
    )
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard data not found"
        )
    
    return dashboard


@router.get("/children", response_model=List[ChildOverviewResponse])
async def get_children(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get list of all children associated with the parent
    """
    service = ParentService(db)
    children = service.get_parent_children(
        user_id=current_user.id,
        institution_id=current_user.institution_id
    )
    
    return children


@router.get("/children/{child_id}/overview", response_model=ChildOverviewResponse)
async def get_child_overview(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed overview for a specific child
    """
    service = ParentService(db)
    overview = service.get_child_overview(
        child_id=child_id,
        user_id=current_user.id,
        institution_id=current_user.institution_id
    )
    
    if not overview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not associated with this parent"
        )
    
    return overview


@router.get("/children/{child_id}/attendance/today", response_model=TodayAttendanceResponse)
async def get_today_attendance(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get today's attendance status for a child
    """
    service = ParentService(db)
    attendance = service.get_today_attendance(
        child_id=child_id,
        user_id=current_user.id,
        institution_id=current_user.institution_id
    )
    
    return attendance


@router.get("/children/{child_id}/grades/recent", response_model=List[RecentGradeResponse])
async def get_recent_grades(
    child_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get recent grades for a child
    """
    service = ParentService(db)
    grades = service.get_recent_grades(
        child_id=child_id,
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        limit=limit
    )
    
    return grades


@router.get("/children/{child_id}/assignments/pending", response_model=List[PendingAssignmentResponse])
async def get_pending_assignments(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get pending assignments for a child
    """
    service = ParentService(db)
    assignments = service.get_pending_assignments(
        child_id=child_id,
        user_id=current_user.id,
        institution_id=current_user.institution_id
    )
    
    return assignments


@router.get("/children/{child_id}/progress/weekly", response_model=WeeklyProgressResponse)
async def get_weekly_progress(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get weekly progress summary for a child
    """
    service = ParentService(db)
    progress = service.get_weekly_progress(
        child_id=child_id,
        user_id=current_user.id,
        institution_id=current_user.institution_id
    )
    
    return progress


@router.get("/children/{child_id}/performance/comparison", response_model=PerformanceComparisonResponse)
async def get_performance_comparison(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get performance comparison between current term and previous term
    """
    service = ParentService(db)
    comparison = service.get_performance_comparison(
        child_id=child_id,
        user_id=current_user.id,
        institution_id=current_user.institution_id
    )
    
    return comparison


@router.get("/children/{child_id}/goals", response_model=dict)
async def get_child_goals(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get goal tracking information for a child
    """
    service = ParentService(db)
    goals = service.get_child_goals(
        child_id=child_id,
        user_id=current_user.id,
        institution_id=current_user.institution_id
    )
    
    return goals
