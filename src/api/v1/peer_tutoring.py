from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from src.database import get_db
from src.dependencies.auth import get_current_user, require_roles
from src.services.peer_tutoring_service import PeerTutoringService
from src.schemas.peer_tutoring import (
    TutorProfileCreate, TutorProfileUpdate, TutorProfileResponse,
    TutoringSessionCreate, TutoringSessionUpdate, TutoringSessionResponse,
    SessionStartRequest, SessionCompleteRequest, SessionCancelRequest,
    TutorReviewCreate, TutorReviewResponse,
    TutorEndorsementCreate, TutorEndorsementResponse,
    TutorBadgeResponse, TutorIncentiveResponse, TutorPointHistoryResponse,
    SessionModerationLogCreate, SessionModerationLogResponse, SessionModerationLogResolve,
    TutorLeaderboardResponse, LeaderboardListResponse, LeaderboardEntryResponse,
    MatchingPreferenceCreate, MatchingPreferenceUpdate, MatchingPreferenceResponse,
    TutorMatchRequest, TutorMatchResponse, TutorStatsResponse,
    IncentiveEligibilityResponse, SessionParticipantResponse
)
from src.models.peer_tutoring import (
    TutorProfile, TutoringSession, TutorReview, TutorEndorsement,
    TutorBadge, TutorIncentive, TutorPointHistory, SessionModerationLog,
    TutorLeaderboard, MatchingPreference, SessionParticipant,
    TutorStatus, SessionStatus, IncentiveType
)
from src.models.user import User
from decimal import Decimal

router = APIRouter()


@router.post("/tutors", response_model=TutorProfileResponse, status_code=status.HTTP_201_CREATED)
def create_tutor_profile(
    profile: TutorProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a tutor profile.

    Previously this whole router had no authentication dependency on any
    endpoint at all, and every create/list endpoint accepted an arbitrary
    `institution_id` (and, on several endpoints, an arbitrary acting-user
    id such as `moderator_id`/`endorser_id`/`user_id`) straight from the
    caller -- any unauthenticated client could read or write peer-tutoring
    data for any institution and act as any user. Fixed by requiring
    `Depends(get_current_user)` on every endpoint (matching every other
    router in this codebase), always deriving `institution_id` from
    `current_user.institution_id`, and scoping id-based lookups
    (tutor/session/review/etc.) to the caller's own institution.
    """
    is_staff = current_user.is_superuser or (
        current_user.role and current_user.role.slug in ("teacher", "admin", "super_admin")
    )
    if profile.user_id != current_user.id and not is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create a tutor profile on behalf of another user"
        )
    if profile.user_id != current_user.id:
        target_user = db.query(User).filter(User.id == profile.user_id).first()
        if not target_user or target_user.institution_id != current_user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user not found"
            )
    return PeerTutoringService.create_tutor_profile(db, current_user.institution_id, profile)


@router.get("/tutors", response_model=List[TutorProfileResponse])
def list_tutors(
    status_filter: Optional[TutorStatus] = Query(None, alias="status"),
    subject_id: Optional[int] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return PeerTutoringService.list_tutors(
        db, current_user.institution_id, status_filter, subject_id, min_rating, skip, limit
    )


@router.get("/tutors/{tutor_id}", response_model=TutorProfileResponse)
def get_tutor_profile(
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tutor = PeerTutoringService.get_tutor_profile(db, tutor_id)
    if not tutor or tutor.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Tutor profile not found")
    return tutor


@router.get("/tutors/user/{user_id}", response_model=TutorProfileResponse)
def get_tutor_profile_by_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tutor = PeerTutoringService.get_tutor_profile_by_user(db, user_id, current_user.institution_id)
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor profile not found")
    return tutor


@router.put("/tutors/{tutor_id}", response_model=TutorProfileResponse)
def update_tutor_profile(
    tutor_id: int,
    profile: TutorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = PeerTutoringService.get_tutor_profile(db, tutor_id)
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Tutor profile not found")
    updated = PeerTutoringService.update_tutor_profile(db, tutor_id, profile)
    if not updated:
        raise HTTPException(status_code=404, detail="Tutor profile not found")
    return updated


@router.post("/sessions", response_model=TutoringSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session: TutoringSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a tutoring session.

    Previously `session.tutor_id`/`session.student_id` were never checked
    against the caller's institution -- a session could be created linking
    a tutor/student from a different institution entirely (cross-tenant
    gap, bug class 17). Fixed by validating both belong to the caller's
    own institution first.
    """
    try:
        return PeerTutoringService.create_session(db, current_user.institution_id, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions", response_model=List[TutoringSessionResponse])
def list_sessions(
    tutor_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    status_filter: Optional[SessionStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TutoringSession).filter(
        TutoringSession.institution_id == current_user.institution_id
    )
    
    if tutor_id:
        query = query.filter(TutoringSession.tutor_id == tutor_id)
    
    if student_id:
        query = query.filter(TutoringSession.student_id == student_id)
    
    if status_filter:
        query = query.filter(TutoringSession.status == status_filter)
    
    query = query.order_by(desc(TutoringSession.scheduled_start))
    
    return query.offset(skip).limit(limit).all()


@router.get("/sessions/{session_id}", response_model=TutoringSessionResponse)
def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
    if not session or session.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.put("/sessions/{session_id}", response_model=TutoringSessionResponse)
def update_session(
    session_id: int,
    session: TutoringSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Session not found")
    updated = PeerTutoringService.update_session(db, session_id, session)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@router.post("/sessions/{session_id}/start", response_model=TutoringSessionResponse)
def start_session(
    session_id: int,
    start_data: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Session not found")
    session = PeerTutoringService.start_session(db, session_id, start_data)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/sessions/{session_id}/complete", response_model=TutoringSessionResponse)
def complete_session(
    session_id: int,
    complete_data: SessionCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Session not found")
    session = PeerTutoringService.complete_session(db, session_id, complete_data)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/sessions/{session_id}/cancel", response_model=TutoringSessionResponse)
def cancel_session(
    session_id: int,
    cancel_data: SessionCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a session as the caller.

    Previously accepted an arbitrary `user_id` query parameter with no
    verification -- any caller could cancel a session while attributing
    the cancellation to any other user. Fixed to always attribute the
    cancellation to `current_user.id`.
    """
    existing = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Session not found")
    session = PeerTutoringService.cancel_session(db, session_id, current_user.id, cancel_data)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/reviews", response_model=TutorReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review: TutorReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from src.models.student import Student
    student = db.query(Student).filter(
        Student.user_id == current_user.id,
        Student.institution_id == current_user.institution_id
    ).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    try:
        return PeerTutoringService.create_review(db, current_user.institution_id, student.id, review)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/reviews", response_model=List[TutorReviewResponse])
def list_reviews(
    tutor_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TutorReview).filter(
        TutorReview.institution_id == current_user.institution_id
    )
    
    if tutor_id:
        query = query.filter(TutorReview.tutor_id == tutor_id)
    
    if student_id:
        query = query.filter(TutorReview.student_id == student_id)
    
    query = query.order_by(desc(TutorReview.created_at))
    
    return query.offset(skip).limit(limit).all()


@router.get("/tutors/{tutor_id}/reviews", response_model=List[TutorReviewResponse])
def get_tutor_reviews(
    tutor_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(TutorReview).filter(
        TutorReview.tutor_id == tutor_id,
        TutorReview.institution_id == current_user.institution_id
    ).order_by(desc(TutorReview.created_at)).offset(skip).limit(limit).all()


@router.post("/endorsements", response_model=TutorEndorsementResponse, status_code=status.HTTP_201_CREATED)
def create_endorsement(
    endorsement: TutorEndorsementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an endorsement as the caller.

    Previously accepted an arbitrary `endorser_id` query parameter --
    fixed to always attribute the endorsement to `current_user.id`. Also
    fixed: `endorsement.tutor_id` was never checked against the caller's
    institution (cross-tenant gap, bug class 17).
    """
    try:
        return PeerTutoringService.create_endorsement(
            db, current_user.institution_id, current_user.id, endorsement
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/tutors/{tutor_id}/endorsements", response_model=List[TutorEndorsementResponse])
def get_tutor_endorsements(
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(TutorEndorsement).filter(
        TutorEndorsement.tutor_id == tutor_id,
        TutorEndorsement.institution_id == current_user.institution_id
    ).order_by(desc(TutorEndorsement.created_at)).all()


@router.get("/tutors/{tutor_id}/badges", response_model=List[TutorBadgeResponse])
def get_tutor_badges(
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(TutorBadge).filter(
        TutorBadge.tutor_id == tutor_id,
        TutorBadge.institution_id == current_user.institution_id,
        TutorBadge.is_displayed == True
    ).order_by(TutorBadge.display_order, desc(TutorBadge.earned_at)).all()


@router.get("/tutors/{tutor_id}/incentives", response_model=List[TutorIncentiveResponse])
def get_tutor_incentives(
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(TutorIncentive).filter(
        TutorIncentive.tutor_id == tutor_id,
        TutorIncentive.institution_id == current_user.institution_id
    ).order_by(desc(TutorIncentive.created_at)).all()


@router.get("/tutors/{tutor_id}/points-history", response_model=List[TutorPointHistoryResponse])
def get_tutor_points_history(
    tutor_id: int,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(TutorPointHistory).filter(
        TutorPointHistory.tutor_id == tutor_id,
        TutorPointHistory.institution_id == current_user.institution_id
    ).order_by(desc(TutorPointHistory.created_at)).limit(limit).all()


@router.get("/tutors/{tutor_id}/stats", response_model=TutorStatsResponse)
def get_tutor_stats(
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tutor = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if not tutor or tutor.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    sessions_by_status = db.query(
        TutoringSession.status,
        func.count(TutoringSession.id)
    ).filter(
        TutoringSession.tutor_id == tutor_id
    ).group_by(TutoringSession.status).all()
    
    status_counts = {status.value: 0 for status in SessionStatus}
    for status, count in sessions_by_status:
        status_counts[status.value] = count
    
    rating_dist = db.query(
        TutorReview.rating,
        func.count(TutorReview.id)
    ).filter(
        TutorReview.tutor_id == tutor_id
    ).group_by(TutorReview.rating).all()
    
    rating_distribution = {str(i): 0 for i in range(1, 6)}
    for rating, count in rating_dist:
        rating_distribution[str(rating)] = count
    
    badges_count = db.query(func.count(TutorBadge.id)).filter(
        TutorBadge.tutor_id == tutor_id
    ).scalar() or 0
    
    endorsements_count = db.query(func.count(TutorEndorsement.id)).filter(
        TutorEndorsement.tutor_id == tutor_id
    ).scalar() or 0
    
    subjects_taught = []
    if tutor.subjects:
        for subject_id, details in tutor.subjects.items():
            subjects_taught.append({
                'subject_id': subject_id,
                'expertise_level': details.get('level', 5) if isinstance(details, dict) else 5,
                'sessions_count': details.get('sessions', 0) if isinstance(details, dict) else 0
            })
    
    monthly_sessions = db.query(
        func.date_format(TutoringSession.scheduled_start, '%Y-%m').label('month'),
        func.count(TutoringSession.id)
    ).filter(
        TutoringSession.tutor_id == tutor_id,
        TutoringSession.status == SessionStatus.COMPLETED
    ).group_by('month').order_by(desc('month')).limit(12).all()
    
    monthly_data = {}
    for month, count in monthly_sessions:
        monthly_data[month] = count
    
    return TutorStatsResponse(
        tutor_id=tutor.id,
        total_sessions=tutor.total_sessions,
        completed_sessions=status_counts.get(SessionStatus.COMPLETED.value, 0),
        cancelled_sessions=status_counts.get(SessionStatus.CANCELLED.value, 0),
        no_show_sessions=status_counts.get(SessionStatus.NO_SHOW.value, 0),
        total_hours_tutored=tutor.total_hours_tutored,
        average_rating=tutor.average_rating,
        total_reviews=tutor.total_reviews,
        rating_distribution=rating_distribution,
        total_points=tutor.total_points,
        level=tutor.level,
        current_streak=tutor.current_streak,
        longest_streak=tutor.longest_streak,
        badges_count=badges_count,
        endorsements_count=endorsements_count,
        subjects_taught=subjects_taught,
        monthly_sessions=monthly_data
    )


@router.post("/moderation", response_model=SessionModerationLogResponse, status_code=status.HTTP_201_CREATED)
def create_moderation_log(
    log: SessionModerationLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a moderation log entry (teacher/admin only).

    Previously accepted arbitrary `institution_id`/`moderator_id` query
    parameters with no auth at all. Fixed to require a teacher/admin/
    super_admin caller and always attribute the entry to `current_user`.
    """
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    try:
        return PeerTutoringService.create_moderation_log(
            db, current_user.institution_id, current_user.id, log
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/moderation", response_model=List[SessionModerationLogResponse])
def list_moderation_logs(
    session_id: Optional[int] = Query(None),
    resolved: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    query = db.query(SessionModerationLog).filter(
        SessionModerationLog.institution_id == current_user.institution_id
    )

    if session_id:
        query = query.filter(SessionModerationLog.session_id == session_id)

    if resolved is not None:
        query = query.filter(SessionModerationLog.resolved == resolved)

    query = query.order_by(desc(SessionModerationLog.created_at))

    return query.offset(skip).limit(limit).all()


@router.put("/moderation/{log_id}/resolve", response_model=SessionModerationLogResponse)
def resolve_moderation_log(
    log_id: int,
    payload: SessionModerationLogResolve,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_roles(current_user, ["teacher", "admin", "super_admin"])
    log = db.query(SessionModerationLog).filter(
        SessionModerationLog.id == log_id,
        SessionModerationLog.institution_id == current_user.institution_id
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Moderation log not found")

    log.resolved = True
    log.resolved_at = datetime.utcnow()
    log.resolution_notes = payload.resolution_notes
    
    db.commit()
    db.refresh(log)
    return log


@router.get("/leaderboard", response_model=LeaderboardListResponse)
def get_leaderboard(
    period: str = Query("monthly", regex="^(weekly|monthly|yearly)$"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    leaderboard_entries = PeerTutoringService.get_leaderboard(db, current_user.institution_id, period, limit)

    if not leaderboard_entries:
        leaderboard_entries = PeerTutoringService.update_leaderboard(db, current_user.institution_id, period)
    
    entries = []
    for entry in leaderboard_entries[:limit]:
        tutor = db.query(TutorProfile).filter(TutorProfile.id == entry.tutor_id).first()
        if tutor:
            user = db.query(User).filter(User.id == tutor.user_id).first()
            tutor_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
            
            badges_count = db.query(func.count(TutorBadge.id)).filter(
                TutorBadge.tutor_id == tutor.id
            ).scalar() or 0
            
            entries.append(LeaderboardEntryResponse(
                tutor_id=tutor.id,
                tutor_name=tutor_name,
                rank=entry.rank,
                previous_rank=entry.previous_rank,
                score=entry.score,
                sessions_count=entry.sessions_count,
                total_hours=entry.total_hours,
                average_rating=entry.average_rating,
                level=tutor.level,
                badges_count=badges_count
            ))
    
    period_start = leaderboard_entries[0].period_start if leaderboard_entries else datetime.utcnow()
    period_end = leaderboard_entries[0].period_end if leaderboard_entries else datetime.utcnow()
    
    return LeaderboardListResponse(
        entries=entries,
        period=period,
        period_start=period_start,
        period_end=period_end,
        total_tutors=len(entries)
    )


@router.post("/leaderboard/update")
def update_leaderboard(
    period: str = Query("monthly", regex="^(weekly|monthly|yearly)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entries = PeerTutoringService.update_leaderboard(db, current_user.institution_id, period)
    return {"message": "Leaderboard updated successfully", "entries_count": len(entries)}


@router.post("/matching-preferences", response_model=MatchingPreferenceResponse, status_code=status.HTTP_201_CREATED)
def create_matching_preference(
    preference: MatchingPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a student's tutor-matching preferences.

    Previously `preference.student_id` was never checked against the
    caller's institution (cross-tenant gap, bug class 17).
    """
    try:
        return PeerTutoringService.create_matching_preference(db, current_user.institution_id, preference)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/matching-preferences/{student_id}", response_model=MatchingPreferenceResponse)
def get_matching_preference(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preference = db.query(MatchingPreference).filter(
        MatchingPreference.student_id == student_id,
        MatchingPreference.institution_id == current_user.institution_id
    ).first()
    if not preference:
        raise HTTPException(status_code=404, detail="Matching preference not found")
    return preference


@router.put("/matching-preferences/{preference_id}", response_model=MatchingPreferenceResponse)
def update_matching_preference(
    preference_id: int,
    preference: MatchingPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(MatchingPreference).filter(
        MatchingPreference.id == preference_id,
        MatchingPreference.institution_id == current_user.institution_id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Matching preference not found")
    updated = PeerTutoringService.update_matching_preference(db, preference_id, preference)
    if not updated:
        raise HTTPException(status_code=404, detail="Matching preference not found")
    return updated


@router.post("/match", response_model=TutorMatchResponse)
def match_tutors(
    match_request: TutorMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    matches = PeerTutoringService.match_tutors(db, current_user.institution_id, match_request)
    return TutorMatchResponse(
        matches=matches,
        total_matches=len(matches)
    )


@router.get("/tutors/{tutor_id}/incentive-eligibility", response_model=List[IncentiveEligibilityResponse])
def check_incentive_eligibility(
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tutor = db.query(TutorProfile).filter(TutorProfile.id == tutor_id).first()
    if not tutor or tutor.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    eligibility_results = []
    
    service_hours_requirement = Decimal('20')
    service_hours_progress = min(float(tutor.total_hours_tutored / service_hours_requirement), 1.0)
    eligibility_results.append(IncentiveEligibilityResponse(
        eligible=tutor.total_hours_tutored >= service_hours_requirement,
        incentive_type=IncentiveType.SERVICE_HOURS,
        title="20 Hours Service Award",
        description="Complete 20 hours of peer tutoring",
        requirements={'hours': str(service_hours_requirement)},
        progress={'current_hours': str(tutor.total_hours_tutored)},
        completion_percentage=service_hours_progress * 100
    ))
    
    certificate_eligible = tutor.completed_sessions >= 50 and tutor.average_rating >= Decimal('4.0')
    certificate_progress = min(
        (tutor.completed_sessions / 50 + float(tutor.average_rating) / 5) / 2,
        1.0
    )
    eligibility_results.append(IncentiveEligibilityResponse(
        eligible=certificate_eligible,
        incentive_type=IncentiveType.CERTIFICATE,
        title="Outstanding Peer Tutor Certificate",
        description="Complete 50 sessions with 4.0+ rating",
        requirements={'sessions': 50, 'min_rating': '4.0'},
        progress={
            'current_sessions': tutor.completed_sessions,
            'current_rating': str(tutor.average_rating)
        },
        completion_percentage=certificate_progress * 100
    ))
    
    leaderboard = db.query(TutorLeaderboard).filter(
        TutorLeaderboard.tutor_id == tutor_id,
        TutorLeaderboard.period == "monthly"
    ).order_by(desc(TutorLeaderboard.created_at)).first()
    
    rank = leaderboard.rank if leaderboard else 999
    priority_eligible = rank <= 5
    eligibility_results.append(IncentiveEligibilityResponse(
        eligible=priority_eligible,
        incentive_type=IncentiveType.PRIORITY_REGISTRATION,
        title="Priority Course Registration",
        description="Be in top 5 tutors of the month",
        requirements={'max_rank': 5},
        progress={'current_rank': rank},
        completion_percentage=100.0 if priority_eligible else (5 - rank) / 5 * 100 if rank < 10 else 0
    ))
    
    return eligibility_results


@router.post("/incentives/{incentive_id}/redeem", response_model=TutorIncentiveResponse)
def redeem_incentive(
    incentive_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Redeem a tutor incentive.

    This was the last of three endpoints at the bottom of the router (along
    with `get_session_participants` and `flag_session` below) that had no
    auth dependency at all and no institution scoping -- any unauthenticated
    client could redeem, view or flag any institution's peer-tutoring
    records by id. Fixed to require `Depends(get_current_user)` and scope
    the lookup to the caller's own institution.
    """
    incentive = db.query(TutorIncentive).filter(
        TutorIncentive.id == incentive_id,
        TutorIncentive.institution_id == current_user.institution_id
    ).first()
    if not incentive:
        raise HTTPException(status_code=404, detail="Incentive not found")

    if incentive.is_redeemed:
        raise HTTPException(status_code=400, detail="Incentive already redeemed")

    incentive.is_redeemed = True
    incentive.redeemed_at = datetime.utcnow()

    db.commit()
    db.refresh(incentive)
    return incentive


@router.get("/sessions/{session_id}/participants", response_model=List[SessionParticipantResponse])
def get_session_participants(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(TutoringSession).filter(
        TutoringSession.id == session_id,
        TutoringSession.institution_id == current_user.institution_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id
    ).all()


@router.post("/sessions/{session_id}/flag")
def flag_session(
    session_id: int,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(TutoringSession).filter(
        TutoringSession.id == session_id,
        TutoringSession.institution_id == current_user.institution_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_flagged = True
    session.flagged_reason = reason

    db.commit()
    return {"message": "Session flagged successfully", "session_id": session_id}
