from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.services.study_buddy_service import StudyBuddyService
from src.schemas.study_buddy import (
    StudyBuddySessionCreate,
    StudyBuddySessionResponse,
    StudyBuddyChatRequest,
    StudyBuddyChatResponse,
    StudyBuddyMessageResponse,
    StudyPatternAnalysis,
    DailyStudyPlan,
    MotivationalMessage,
    StudyBuddyInsightResponse,
)

router = APIRouter()


@router.post("/sessions", response_model=StudyBuddySessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: StudyBuddySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    session = service.create_session(
        institution_id=current_user.institution_id,
        student_id=session_data.student_id,
        session_title=session_data.session_title,
        context=session_data.context
    )
    return session


@router.get("/sessions", response_model=List[StudyBuddySessionResponse])
async def get_sessions(
    student_id: int,
    is_active: Optional[bool] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    sessions = service.get_student_sessions(
        student_id=student_id,
        is_active=is_active,
        limit=limit
    )
    return sessions


@router.get("/sessions/{session_id}", response_model=StudyBuddySessionResponse)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    session = service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session


@router.post("/sessions/{session_id}/end", response_model=StudyBuddySessionResponse)
async def end_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    session = service.end_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session


@router.get("/sessions/{session_id}/messages", response_model=List[StudyBuddyMessageResponse])
async def get_session_messages(
    session_id: int,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    messages = service.get_session_messages(session_id, limit)
    return messages


@router.post("/chat", response_model=StudyBuddyChatResponse)
async def chat(
    chat_request: StudyBuddyChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.student_profile:
        student_id = current_user.student_profile.id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can use the study buddy chat"
        )
    
    service = StudyBuddyService(db)
    response = service.chat(
        institution_id=current_user.institution_id,
        student_id=student_id,
        message=chat_request.message,
        session_id=chat_request.session_id,
        context=chat_request.context
    )
    return response


@router.get("/analyze-patterns/{student_id}", response_model=StudyPatternAnalysis)
async def analyze_study_patterns(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    analysis = service.analyze_study_patterns(student_id)
    return analysis


@router.get("/daily-plan/{student_id}", response_model=DailyStudyPlan)
async def get_daily_plan(
    student_id: int,
    target_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not target_date:
        target_date = date.today()
    
    service = StudyBuddyService(db)
    plan = service.generate_daily_plan(student_id, target_date)
    return plan


@router.get("/motivational-message/{student_id}", response_model=MotivationalMessage)
async def get_motivational_message(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    message = service.generate_motivational_message(student_id)
    return message


@router.get("/insights/{student_id}", response_model=List[StudyBuddyInsightResponse])
async def get_insights(
    student_id: int,
    is_read: Optional[bool] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    insights = service.get_student_insights(
        student_id=student_id,
        is_read=is_read,
        limit=limit
    )
    return insights


@router.post("/insights/{insight_id}/mark-read", response_model=StudyBuddyInsightResponse)
async def mark_insight_read(
    insight_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = StudyBuddyService(db)
    insight = service.mark_insight_read(insight_id)
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found"
        )
    return insight
