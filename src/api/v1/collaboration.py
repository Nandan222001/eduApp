from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies.auth import get_current_user, require_role
from src.models import User, Student
from src.schemas.collaboration import (
    StudyBuddyProfileCreate, StudyBuddyProfileUpdate, StudyBuddyProfileResponse,
    StudyBuddyMatchRequest, StudyBuddyMatchResponse,
    StudySessionCreate, StudySessionUpdate, StudySessionResponse,
    SessionParticipantResponse, SessionJoinRequest, SessionStartRequest,
    CollaborativeNoteCreate, CollaborativeNoteUpdate, CollaborativeNoteResponse,
    NoteEditorResponse, NoteRevisionResponse, AddNoteEditorRequest,
    PeerTutorProfileCreate, PeerTutorProfileUpdate, PeerTutorProfileResponse,
    TutoringRequestCreate, TutoringRequestUpdate, TutoringRequestResponse,
    TutoringSessionCreate, TutoringSessionUpdate, TutoringSessionResponse,
    TutoringSessionRatingRequest, GroupPerformanceAnalyticsResponse,
    GenerateAnalyticsRequest, TutorSearchRequest
)
from src.services.collaboration_service import (
    StudyBuddyMatchingService, StudySessionService, CollaborativeNoteService,
    PeerTutoringService, GroupAnalyticsService
)

router = APIRouter()


@router.post("/study-buddy/profile", response_model=StudyBuddyProfileResponse)
async def create_or_update_study_buddy_profile(
    profile_data: StudyBuddyProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = StudyBuddyMatchingService(db)
    profile = service.create_or_update_profile(
        student_id=current_user.student_profile.id,
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        profile_data=profile_data.model_dump(exclude_unset=True)
    )
    return profile


@router.get("/study-buddy/profile", response_model=StudyBuddyProfileResponse)
async def get_my_study_buddy_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = StudyBuddyMatchingService(db)
    profile = service.repository.get_profile_by_student(current_user.student_profile.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study buddy profile not found"
        )
    
    return profile


@router.put("/study-buddy/profile", response_model=StudyBuddyProfileResponse)
async def update_study_buddy_profile(
    profile_data: StudyBuddyProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = StudyBuddyMatchingService(db)
    profile = service.repository.get_profile_by_student(current_user.student_profile.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study buddy profile not found"
        )

    updated_profile = service.repository.update_profile(
        profile,
        profile_data.model_dump(exclude_unset=True)
    )
    return updated_profile


@router.post("/study-buddy/find-matches", response_model=List[StudyBuddyMatchResponse])
async def find_study_buddy_matches(
    search_params: StudyBuddyMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = StudyBuddyMatchingService(db)
    matches = service.find_study_buddies(
        student_id=current_user.student_profile.id,
        institution_id=current_user.institution_id,
        subject_ids=search_params.subject_ids,
        performance_level=search_params.performance_level,
        max_matches=search_params.max_matches
    )

    match_responses = []
    for match_data in matches:
        profile = match_data['profile']
        student = db.query(Student).filter(Student.id == profile.student_id).first()
        
        match_responses.append(StudyBuddyMatchResponse(
            id=0,
            institution_id=current_user.institution_id,
            requester_id=current_user.student_profile.id,
            matched_student_id=profile.student_id,
            match_score=match_data['score'],
            common_subjects=match_data['common_subjects'],
            match_reason=match_data['reason'],
            status="potential",
            created_at=datetime.utcnow(),
            matched_student={
                'id': student.id,
                'name': f"{student.first_name} {student.last_name}",
                'email': student.email,
                'performance_level': profile.performance_level
            } if student else None
        ))
    
    return match_responses


@router.post("/study-buddy/matches/{matched_student_id}", response_model=StudyBuddyMatchResponse)
async def create_study_buddy_match(
    matched_student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = StudyBuddyMatchingService(db)
    requester_profile = service.repository.get_profile_by_student(current_user.student_profile.id)
    
    if not requester_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please create a study buddy profile first"
        )

    matched_student = db.query(Student).filter(Student.id == matched_student_id).first()
    if not matched_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    matched_profile = service.repository.get_profile_by_student(matched_student_id)
    if not matched_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Matched student does not have a study buddy profile"
        )

    score, common_subjects, reason = service.calculate_match_score(requester_profile, matched_profile)
    
    match = service.create_match_request(
        requester_id=current_user.student_profile.id,
        matched_student_id=matched_student_id,
        institution_id=current_user.institution_id,
        match_score=score,
        common_subjects=common_subjects,
        match_reason=reason
    )
    
    return match


@router.get("/study-buddy/matches", response_model=List[StudyBuddyMatchResponse])
async def get_my_study_buddy_matches(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = StudyBuddyMatchingService(db)
    matches = service.repository.get_student_matches(
        student_id=current_user.student_profile.id,
        status=status
    )
    
    return matches


@router.post("/study-buddy/matches/{match_id}/respond")
async def respond_to_study_buddy_match(
    match_id: int,
    accept: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = StudyBuddyMatchingService(db)
    try:
        match = service.respond_to_match(
            match_id=match_id,
            student_id=current_user.student_profile.id,
            accept=accept
        )
        return {"status": "success", "match": match}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions", response_model=StudySessionResponse)
async def create_study_session(
    session_data: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    session = service.create_session(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        session_data=session_data.model_dump()
    )
    return session


@router.get("/sessions", response_model=List[StudySessionResponse])
async def get_study_sessions(
    group_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    sessions = service.repository.get_sessions(
        institution_id=current_user.institution_id,
        group_id=group_id,
        status=status,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    return sessions


@router.get("/sessions/{session_id}", response_model=StudySessionResponse)
async def get_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    session = service.repository.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session


@router.put("/sessions/{session_id}", response_model=StudySessionResponse)
async def update_study_session(
    session_id: int,
    update_data: StudySessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    session = service.repository.get_session_by_id(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the organizer can update the session"
        )
    
    updated_session = service.repository.update_session(
        session,
        update_data.model_dump(exclude_unset=True)
    )
    return updated_session


@router.post("/sessions/{session_id}/join", response_model=SessionParticipantResponse)
async def join_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    try:
        participant = service.join_session(
            session_id=session_id,
            user_id=current_user.id,
            institution_id=current_user.institution_id
        )
        return participant
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/start", response_model=StudySessionResponse)
async def start_study_session(
    session_id: int,
    start_data: SessionStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    try:
        session = service.start_session(
            session_id=session_id,
            user_id=current_user.id,
            video_room_id=start_data.video_room_id
        )
        return session
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/end", response_model=StudySessionResponse)
async def end_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    try:
        session = service.end_session(
            session_id=session_id,
            user_id=current_user.id
        )
        return session
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/leave", response_model=SessionParticipantResponse)
async def leave_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    try:
        participant = service.leave_session(
            session_id=session_id,
            user_id=current_user.id
        )
        return participant
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/sessions/my/upcoming", response_model=List[StudySessionResponse])
async def get_my_upcoming_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = StudySessionService(db)
    sessions = service.repository.get_user_sessions(
        user_id=current_user.id,
        upcoming=True
    )
    return sessions


@router.post("/notes", response_model=CollaborativeNoteResponse)
async def create_collaborative_note(
    note_data: CollaborativeNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CollaborativeNoteService(db)
    note = service.create_note(
        user_id=current_user.id,
        institution_id=current_user.institution_id,
        note_data=note_data.model_dump()
    )
    return note


@router.get("/notes", response_model=List[CollaborativeNoteResponse])
async def get_collaborative_notes(
    group_id: Optional[int] = Query(None),
    session_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    is_public: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CollaborativeNoteService(db)
    notes = service.repository.get_notes(
        institution_id=current_user.institution_id,
        group_id=group_id,
        session_id=session_id,
        subject_id=subject_id,
        is_public=is_public,
        limit=limit,
        offset=offset
    )
    return notes


@router.get("/notes/{note_id}", response_model=CollaborativeNoteResponse)
async def get_collaborative_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CollaborativeNoteService(db)
    try:
        note = service.get_note_with_access_check(
            note_id=note_id,
            user_id=current_user.id
        )
        return note
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.put("/notes/{note_id}", response_model=CollaborativeNoteResponse)
async def update_collaborative_note(
    note_id: int,
    update_data: CollaborativeNoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CollaborativeNoteService(db)
    try:
        note = service.update_note(
            note_id=note_id,
            user_id=current_user.id,
            update_data=update_data.model_dump(exclude_unset=True)
        )
        return note
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/notes/{note_id}/editors")
async def add_note_editor(
    note_id: int,
    editor_data: AddNoteEditorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CollaborativeNoteService(db)
    try:
        service.add_editor(
            note_id=note_id,
            user_id=current_user.id,
            editor_user_id=editor_data.user_id,
            can_edit=editor_data.can_edit
        )
        return {"status": "success", "message": "Editor added successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/notes/{note_id}/revisions", response_model=List[NoteRevisionResponse])
async def get_note_revisions(
    note_id: int,
    limit: int = Query(20, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CollaborativeNoteService(db)
    try:
        note = service.get_note_with_access_check(note_id, current_user.id)
        revisions = service.repository.get_note_revisions(note_id, limit)
        return revisions
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/tutoring/profile", response_model=PeerTutorProfileResponse)
async def create_tutor_profile(
    profile_data: PeerTutorProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = PeerTutoringService(db)
    try:
        profile = service.create_tutor_profile(
            student_id=current_user.student_profile.id,
            user_id=current_user.id,
            institution_id=current_user.institution_id,
            profile_data=profile_data.model_dump()
        )
        return profile
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/tutoring/profile", response_model=PeerTutorProfileResponse)
async def get_my_tutor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = PeerTutoringService(db)
    profile = service.repository.get_tutor_profile_by_student(current_user.student_profile.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found"
        )
    
    return profile


@router.put("/tutoring/profile", response_model=PeerTutorProfileResponse)
async def update_tutor_profile(
    profile_data: PeerTutorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = PeerTutoringService(db)
    profile = service.repository.get_tutor_profile_by_student(current_user.student_profile.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found"
        )

    updated_profile = service.repository.update_tutor_profile(
        profile,
        profile_data.model_dump(exclude_unset=True)
    )
    return updated_profile


@router.post("/tutoring/search", response_model=List[PeerTutorProfileResponse])
async def search_tutors(
    search_params: TutorSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PeerTutoringService(db)
    tutors = service.repository.search_tutors(
        institution_id=current_user.institution_id,
        subject_id=search_params.subject_id,
        min_rating=search_params.min_rating,
        max_rate=search_params.max_rate
    )
    return tutors


@router.post("/tutoring/requests", response_model=TutoringRequestResponse)
async def create_tutoring_request(
    request_data: TutoringRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )

    service = PeerTutoringService(db)
    request = service.create_tutoring_request(
        student_id=current_user.student_profile.id,
        institution_id=current_user.institution_id,
        request_data=request_data.model_dump()
    )
    return request


@router.get("/tutoring/requests", response_model=List[TutoringRequestResponse])
async def get_tutoring_requests(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PeerTutoringService(db)
    
    student_id = None
    if current_user.student_profile:
        student_id = current_user.student_profile.id
    
    requests = service.repository.get_tutoring_requests(
        institution_id=current_user.institution_id,
        student_id=student_id,
        status=status
    )
    return requests


@router.post("/tutoring/requests/{request_id}/match/{tutor_id}")
async def match_tutor_to_request(
    request_id: int,
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PeerTutoringService(db)
    try:
        request = service.match_tutor_to_request(request_id, tutor_id)
        return {"status": "success", "request": request}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/tutoring/sessions", response_model=TutoringSessionResponse)
async def create_tutoring_session(
    session_data: TutoringSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PeerTutoringService(db)
    try:
        session = service.create_tutoring_session(
            request_id=session_data.request_id,
            tutor_id=session_data.tutor_id,
            session_data=session_data.model_dump()
        )
        return session
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/tutoring/sessions", response_model=List[TutoringSessionResponse])
async def get_tutoring_sessions(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PeerTutoringService(db)
    
    student_id = None
    tutor_id = None
    
    if current_user.student_profile:
        student_id = current_user.student_profile.id
        tutor_profile = service.repository.get_tutor_profile_by_student(student_id)
        if tutor_profile:
            tutor_id = tutor_profile.id
    
    sessions = service.repository.get_tutoring_sessions(
        tutor_id=tutor_id,
        student_id=student_id,
        status=status
    )
    return sessions


@router.post("/tutoring/sessions/{session_id}/complete")
async def complete_tutoring_session(
    session_id: int,
    rating_data: TutoringSessionRatingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = PeerTutoringService(db)
    try:
        session = service.complete_tutoring_session(
            session_id=session_id,
            rating=rating_data.rating,
            feedback=rating_data.feedback
        )
        return {"status": "success", "session": session}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/analytics/generate", response_model=GroupPerformanceAnalyticsResponse)
async def generate_group_analytics(
    analytics_data: GenerateAnalyticsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = GroupAnalyticsService(db)
    analytics = service.generate_group_analytics(
        group_id=analytics_data.group_id,
        institution_id=current_user.institution_id,
        period_start=analytics_data.period_start,
        period_end=analytics_data.period_end
    )
    return analytics


@router.get("/analytics/group/{group_id}", response_model=List[GroupPerformanceAnalyticsResponse])
async def get_group_analytics(
    group_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = GroupAnalyticsService(db)
    analytics = service.repository.get_group_analytics(
        group_id=group_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    return analytics
