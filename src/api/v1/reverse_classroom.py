from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from src.database import get_db
from src.models.reverse_classroom import TeachingSession, TeachingChallenge, ExplanationType, DifficultyLevel
from src.models.student import Student
from src.models.user import User
from src.dependencies.auth import get_current_user
from src.schemas.reverse_classroom import (
    TeachingSessionCreate,
    TeachingSessionUpdate,
    TeachingSessionResponse,
    TeachingSessionDetail,
    TeachingChallengeCreate,
    TeachingChallengeSubmit,
    TeachingChallengeResponse,
    AudioTranscriptionRequest,
    StudentProgress,
    TopicProgress,
    BulkAnalysisRequest,
    AIAnalysisResult
)
from src.services.reverse_classroom_service import reverse_classroom_service

router = APIRouter(prefix="/reverse-classroom", tags=["reverse-classroom"])


# Teaching Session Endpoints
@router.post("/sessions", response_model=TeachingSessionResponse, status_code=status.HTTP_201_CREATED)
def create_teaching_session(
    session_data: TeachingSessionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new teaching session where student explains a topic"""
    # Verify student exists and belongs to the caller's own institution
    student = db.query(Student).filter(
        Student.id == session_data.student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Create session
    db_session = TeachingSession(
        institution_id=student.institution_id,
        student_id=session_data.student_id,
        topic_id=session_data.topic_id,
        explanation_type=session_data.explanation_type,
        explanation_content=session_data.explanation_content,
        duration_seconds=session_data.duration_seconds,
        is_analyzed=False
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Trigger analysis in background, reusing the request-scoped `db` --
    # FastAPI (>=0.106) keeps a `yield`-based dependency like `get_db` open
    # until background tasks finish, so this session is still valid here.
    # Previously this opened its own `SessionLocal()`, which binds to
    # `settings.database_url` (the app's real configured credentials)
    # instead of whatever `app.dependency_overrides[get_db]` a caller (e.g.
    # this test suite) has installed -- in this environment that meant
    # "Access denied for user 'mysql'" on every background analysis attempt.
    background_tasks.add_task(
        analyze_session_background,
        db,
        db_session.id,
        session_data.topic_id
    )

    return db_session


def analyze_session_background(db: Session, session_id: int, topic_id: int):
    """Background task to analyze teaching session"""
    try:
        session = db.query(TeachingSession).filter(TeachingSession.id == session_id).first()
        if not session:
            return

        # Get topic knowledge base
        topic_knowledge = reverse_classroom_service.get_topic_knowledge_base(db, topic_id)

        # Analyze the explanation
        reverse_classroom_service.analyze_student_explanation(
            db=db,
            session_id=session_id,
            explanation_content=session.explanation_content,
            topic_knowledge=topic_knowledge
        )
    except Exception as e:
        print(f"Background analysis failed: {e}")


@router.post("/sessions/transcribe", response_model=TeachingSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session_with_audio(
    audio_request: AudioTranscriptionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a teaching session by transcribing audio using Whisper API"""
    # Verify student exists and belongs to the caller's own institution
    student = db.query(Student).filter(
        Student.id == audio_request.student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Transcribe audio
    try:
        transcription = reverse_classroom_service.transcribe_audio(audio_request.audio_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Create session with transcription
    db_session = TeachingSession(
        institution_id=student.institution_id,
        student_id=audio_request.student_id,
        topic_id=audio_request.topic_id,
        explanation_type=ExplanationType.VOICE,
        explanation_content=transcription,
        is_analyzed=False
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Trigger analysis in background (see note above on reusing `db`)
    background_tasks.add_task(
        analyze_session_background,
        db,
        db_session.id,
        audio_request.topic_id
    )

    return db_session


@router.get("/sessions", response_model=List[TeachingSessionResponse])
def list_teaching_sessions(
    student_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    explanation_type: Optional[ExplanationType] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List teaching sessions with optional filters"""
    query = db.query(TeachingSession).filter(
        TeachingSession.institution_id == current_user.institution_id
    )

    if student_id:
        query = query.filter(TeachingSession.student_id == student_id)
    if topic_id:
        query = query.filter(TeachingSession.topic_id == topic_id)
    if explanation_type:
        query = query.filter(TeachingSession.explanation_type == explanation_type)

    sessions = query.order_by(TeachingSession.created_at.desc()).offset(skip).limit(limit).all()
    return sessions


@router.get("/sessions/{session_id}", response_model=TeachingSessionDetail)
def get_teaching_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific teaching session with AI analysis and challenges"""
    session = db.query(TeachingSession).filter(
        TeachingSession.id == session_id,
        TeachingSession.institution_id == current_user.institution_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Teaching session not found")
    return session


@router.put("/sessions/{session_id}", response_model=TeachingSessionResponse)
def update_teaching_session(
    session_id: int,
    session_update: TeachingSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a teaching session"""
    db_session = db.query(TeachingSession).filter(
        TeachingSession.id == session_id,
        TeachingSession.institution_id == current_user.institution_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Teaching session not found")

    for field, value in session_update.model_dump(exclude_unset=True).items():
        setattr(db_session, field, value)

    db.commit()
    db.refresh(db_session)
    return db_session


@router.post("/sessions/{session_id}/analyze", response_model=AIAnalysisResult)
def analyze_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger AI analysis for a teaching session"""
    session = db.query(TeachingSession).filter(
        TeachingSession.id == session_id,
        TeachingSession.institution_id == current_user.institution_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Teaching session not found")

    # Get topic knowledge base
    topic_knowledge = reverse_classroom_service.get_topic_knowledge_base(db, session.topic_id)

    # Analyze the explanation
    try:
        analysis = reverse_classroom_service.analyze_student_explanation(
            db=db,
            session_id=session_id,
            explanation_content=session.explanation_content,
            topic_knowledge=topic_knowledge
        )
        return AIAnalysisResult(**analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teaching_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a teaching session"""
    db_session = db.query(TeachingSession).filter(
        TeachingSession.id == session_id,
        TeachingSession.institution_id == current_user.institution_id
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Teaching session not found")

    db.delete(db_session)
    db.commit()


# Teaching Challenge Endpoints
@router.post("/challenges", response_model=TeachingChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_teaching_challenge(
    challenge_data: TeachingChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new teaching challenge for a session"""
    session = db.query(TeachingSession).filter(
        TeachingSession.id == challenge_data.session_id,
        TeachingSession.institution_id == current_user.institution_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Teaching session not found")

    # Get topic knowledge base
    topic_knowledge = reverse_classroom_service.get_topic_knowledge_base(db, session.topic_id)

    # Get previous analysis if available
    previous_analysis = session.ai_analysis if session.is_analyzed else None

    # Generate challenge prompt
    try:
        challenge_prompt = reverse_classroom_service.generate_challenge(
            db=db,
            session_id=session.id,
            difficulty=challenge_data.difficulty,
            topic_knowledge=topic_knowledge,
            previous_analysis=previous_analysis
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Create challenge
    db_challenge = TeachingChallenge(
        institution_id=session.institution_id,
        session_id=challenge_data.session_id,
        student_id=session.student_id,
        difficulty=challenge_data.difficulty,
        challenge_prompt=challenge_prompt,
        completed=False
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)

    return db_challenge


@router.get("/challenges", response_model=List[TeachingChallengeResponse])
def list_teaching_challenges(
    session_id: Optional[int] = None,
    student_id: Optional[int] = None,
    difficulty: Optional[DifficultyLevel] = None,
    completed: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List teaching challenges with optional filters"""
    query = db.query(TeachingChallenge).filter(
        TeachingChallenge.institution_id == current_user.institution_id
    )

    if session_id:
        query = query.filter(TeachingChallenge.session_id == session_id)
    if student_id:
        query = query.filter(TeachingChallenge.student_id == student_id)
    if difficulty:
        query = query.filter(TeachingChallenge.difficulty == difficulty)
    if completed is not None:
        query = query.filter(TeachingChallenge.completed == completed)

    challenges = query.order_by(TeachingChallenge.created_at.desc()).offset(skip).limit(limit).all()
    return challenges


@router.get("/challenges/{challenge_id}", response_model=TeachingChallengeResponse)
def get_teaching_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific teaching challenge"""
    challenge = db.query(TeachingChallenge).filter(
        TeachingChallenge.id == challenge_id,
        TeachingChallenge.institution_id == current_user.institution_id
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Teaching challenge not found")
    return challenge


@router.post("/challenges/{challenge_id}/submit", response_model=TeachingChallengeResponse)
def submit_challenge_response(
    challenge_id: int,
    submission: TeachingChallengeSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a response to a teaching challenge"""
    challenge = db.query(TeachingChallenge).filter(
        TeachingChallenge.id == challenge_id,
        TeachingChallenge.institution_id == current_user.institution_id
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Teaching challenge not found")

    if challenge.completed:
        raise HTTPException(status_code=400, detail="Challenge already completed")

    # Update challenge with student response
    challenge.student_response = submission.student_response
    challenge.completed_at = datetime.utcnow()

    # Get session and topic knowledge
    session = db.query(TeachingSession).filter(TeachingSession.id == challenge.session_id).first()
    topic_knowledge = reverse_classroom_service.get_topic_knowledge_base(db, session.topic_id)

    # Evaluate the response
    try:
        evaluation = reverse_classroom_service.evaluate_challenge_response(
            db=db,
            challenge_id=challenge_id,
            student_response=submission.student_response,
            difficulty=challenge.difficulty,
            topic_knowledge=topic_knowledge
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    db.refresh(challenge)
    return challenge


@router.delete("/challenges/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teaching_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a teaching challenge"""
    db_challenge = db.query(TeachingChallenge).filter(
        TeachingChallenge.id == challenge_id,
        TeachingChallenge.institution_id == current_user.institution_id
    ).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Teaching challenge not found")

    db.delete(db_challenge)
    db.commit()


# Progress Tracking Endpoints
@router.get("/progress/student/{student_id}", response_model=StudentProgress)
def get_student_progress(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive progress for a student"""
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    progress = reverse_classroom_service.get_student_progress(
        db=db,
        student_id=student_id,
        institution_id=student.institution_id
    )
    return StudentProgress(**progress)


@router.get("/progress/topic/{topic_id}", response_model=TopicProgress)
def get_topic_progress(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress analytics for a specific topic"""
    # `institution_id` used to be a client-supplied query parameter, letting
    # any authenticated caller pull another institution's topic-mastery
    # analytics just by passing a different id. Derived from the caller's
    # own session instead.
    progress = reverse_classroom_service.get_topic_progress(
        db=db,
        topic_id=topic_id,
        institution_id=current_user.institution_id
    )
    return TopicProgress(**progress)


# Bulk Operations
@router.post("/sessions/bulk-analyze", status_code=status.HTTP_202_ACCEPTED)
def bulk_analyze_sessions(
    request: BulkAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger bulk analysis for multiple sessions"""
    sessions = db.query(TeachingSession).filter(
        TeachingSession.id.in_(request.session_ids),
        TeachingSession.institution_id == current_user.institution_id
    ).all()

    if not sessions:
        raise HTTPException(status_code=404, detail="No sessions found")

    # Add background tasks for each session. `analyze_session_background`'s
    # signature is `(db, session_id, topic_id)` -- this call site was never
    # updated when that signature changed to take `db` first (see the note
    # on `create_teaching_session` above), so it silently passed
    # `session.id` in as `db` and `session.topic_id` in as `session_id` with
    # `topic_id` missing entirely, raising a `TypeError` in every queued
    # background task (invisible to the 202 response, but the sessions were
    # never actually analyzed). Fixed to pass the request-scoped `db`.
    for session in sessions:
        if not session.is_analyzed:
            background_tasks.add_task(
                analyze_session_background,
                db,
                session.id,
                session.topic_id
            )

    return {
        "message": f"Queued {len(sessions)} sessions for analysis",
        "session_ids": [s.id for s in sessions]
    }
