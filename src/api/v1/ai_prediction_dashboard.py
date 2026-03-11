from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.previous_year_papers import Board
from src.schemas.ai_prediction_dashboard import (
    AIPredictionDashboardResponse,
    StudyPlanRequest,
    StudyPlanResponse,
    WhatIfScenarioRequest,
    WhatIfScenarioResponse,
    CrashCourseModeResponse
)
from src.services.ai_prediction_dashboard_service import AIPredictionDashboardService

router = APIRouter(prefix="/ai-prediction-dashboard", tags=["AI Prediction Dashboard"])


@router.get("/dashboard", response_model=AIPredictionDashboardResponse)
async def get_ai_prediction_dashboard(
    board: Board,
    grade_id: int,
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive AI prediction dashboard with:
    - Topic probability rankings with star ratings and percentage bars
    - Predicted question paper blueprint
    - Expected marks distribution
    - Focus area recommendations with priority tags
    - Study time allocation
    """
    service = AIPredictionDashboardService(db)
    
    dashboard_data = await service.get_dashboard(
        institution_id=current_user.institution_id,
        student_id=current_user.id,
        board=board,
        grade_id=grade_id,
        subject_id=subject_id
    )
    
    return dashboard_data


@router.post("/study-plan", response_model=StudyPlanResponse)
async def generate_study_plan(
    request: StudyPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized study plan timeline with daily tasks and completion checkboxes
    """
    service = AIPredictionDashboardService(db)
    
    study_plan = await service.generate_study_plan(
        institution_id=current_user.institution_id,
        student_id=current_user.id,
        board=request.board,
        grade_id=request.grade_id,
        subject_id=request.subject_id,
        exam_date=request.exam_date,
        available_hours_per_day=request.available_hours_per_day,
        weak_areas=request.weak_areas
    )
    
    return study_plan


@router.post("/what-if-scenario", response_model=WhatIfScenarioResponse)
async def simulate_what_if_scenario(
    request: WhatIfScenarioRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    What-if scenario simulator with interactive sliders to predict outcomes
    """
    service = AIPredictionDashboardService(db)
    
    scenario_result = await service.simulate_what_if_scenario(
        institution_id=current_user.institution_id,
        student_id=current_user.id,
        board=request.board,
        grade_id=request.grade_id,
        subject_id=request.subject_id,
        study_hours_adjustment=request.study_hours_adjustment,
        focus_topic_ids=request.focus_topic_ids,
        practice_test_count=request.practice_test_count
    )
    
    return scenario_result


@router.get("/crash-course-mode", response_model=CrashCourseModeResponse)
async def activate_crash_course_mode(
    board: Board,
    grade_id: int,
    subject_id: int,
    days_until_exam: int = Query(..., ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Last-minute crash course mode activator with prioritized study materials
    """
    service = AIPredictionDashboardService(db)
    
    crash_course = await service.activate_crash_course_mode(
        institution_id=current_user.institution_id,
        student_id=current_user.id,
        board=board,
        grade_id=grade_id,
        subject_id=subject_id,
        days_until_exam=days_until_exam
    )
    
    return crash_course
