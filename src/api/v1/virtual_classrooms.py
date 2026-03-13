from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from src.database import get_db
from src.schemas.virtual_classroom import (
    VirtualClassroomCreate,
    VirtualClassroomUpdate,
    VirtualClassroomResponse,
    ParticipantResponse,
    JoinClassroomRequest,
    JoinClassroomResponse,
    StartClassroomRequest,
    EndClassroomRequest,
    RecordingResponse,
    BreakoutRoomCreate,
    BreakoutRoomResponse,
    JoinBreakoutRoomResponse,
    AttendanceResponse,
    AttendanceSummary,
    PollCreate,
    PollUpdate,
    PollResponse,
    PollResponseCreate,
    PollResponseResponse,
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuizSubmissionCreate,
    QuizSubmissionResponse,
    WhiteboardUpdate,
    WhiteboardResponse,
    ClassroomAnalytics,
    ClassroomStatus,
    RecordingStatus
)
from src.services.virtual_classroom_service import VirtualClassroomService
from src.config import settings

router = APIRouter()


@router.post("/virtual-classrooms", response_model=VirtualClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    data: VirtualClassroomCreate,
    institution_id: int = Query(...),
    teacher_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new virtual classroom"""
    service = VirtualClassroomService(db)
    classroom = await service.create_classroom(institution_id, teacher_id, data)
    
    participant_count = len(classroom.participants)
    response = VirtualClassroomResponse.model_validate(classroom)
    response.participant_count = participant_count
    response.current_participants = 0
    
    return response


@router.get("/virtual-classrooms/{classroom_id}", response_model=VirtualClassroomResponse)
async def get_classroom(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Get classroom by ID"""
    service = VirtualClassroomService(db)
    classroom = service.get_classroom(classroom_id)
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    participant_count = len(classroom.participants)
    current_participants = len([p for p in classroom.participants if p.joined_at and not p.left_at])
    
    response = VirtualClassroomResponse.model_validate(classroom)
    response.participant_count = participant_count
    response.current_participants = current_participants
    
    return response


@router.get("/virtual-classrooms", response_model=dict)
async def list_classrooms(
    institution_id: int = Query(...),
    status_filter: Optional[ClassroomStatus] = Query(None, alias="status"),
    teacher_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    section_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List classrooms with filters"""
    service = VirtualClassroomService(db)
    classrooms, total = service.list_classrooms(
        institution_id=institution_id,
        status=status_filter,
        teacher_id=teacher_id,
        subject_id=subject_id,
        section_id=section_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    
    items = []
    for classroom in classrooms:
        participant_count = len(classroom.participants)
        current_participants = len([p for p in classroom.participants if p.joined_at and not p.left_at])
        
        response = VirtualClassroomResponse.model_validate(classroom)
        response.participant_count = participant_count
        response.current_participants = current_participants
        items.append(response)
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.put("/virtual-classrooms/{classroom_id}", response_model=VirtualClassroomResponse)
async def update_classroom(
    classroom_id: int,
    data: VirtualClassroomUpdate,
    db: Session = Depends(get_db)
):
    """Update classroom"""
    service = VirtualClassroomService(db)
    classroom = await service.update_classroom(classroom_id, data)
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    participant_count = len(classroom.participants)
    current_participants = len([p for p in classroom.participants if p.joined_at and not p.left_at])
    
    response = VirtualClassroomResponse.model_validate(classroom)
    response.participant_count = participant_count
    response.current_participants = current_participants
    
    return response


@router.post("/virtual-classrooms/{classroom_id}/start", response_model=VirtualClassroomResponse)
async def start_classroom(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Start a live classroom session"""
    service = VirtualClassroomService(db)
    
    try:
        classroom = await service.start_classroom(classroom_id)
        
        participant_count = len(classroom.participants)
        current_participants = len([p for p in classroom.participants if p.joined_at and not p.left_at])
        
        response = VirtualClassroomResponse.model_validate(classroom)
        response.participant_count = participant_count
        response.current_participants = current_participants
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/virtual-classrooms/{classroom_id}/end", response_model=VirtualClassroomResponse)
async def end_classroom(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """End a live classroom session"""
    service = VirtualClassroomService(db)
    
    try:
        classroom = await service.end_classroom(classroom_id)
        
        participant_count = len(classroom.participants)
        current_participants = len([p for p in classroom.participants if p.joined_at and not p.left_at])
        
        response = VirtualClassroomResponse.model_validate(classroom)
        response.participant_count = participant_count
        response.current_participants = current_participants
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/virtual-classrooms/{classroom_id}/join", response_model=JoinClassroomResponse)
async def join_classroom(
    classroom_id: int,
    request: JoinClassroomRequest,
    db: Session = Depends(get_db)
):
    """Join a live classroom session"""
    service = VirtualClassroomService(db)
    
    try:
        participant, token = await service.join_classroom(
            classroom_id=classroom_id,
            user_id=request.user_id,
            role=request.role
        )
        
        classroom = service.get_classroom(classroom_id)
        
        participant_count = len(classroom.participants)
        current_participants = len([p for p in classroom.participants if p.joined_at and not p.left_at])
        
        classroom_response = VirtualClassroomResponse.model_validate(classroom)
        classroom_response.participant_count = participant_count
        classroom_response.current_participants = current_participants
        
        return JoinClassroomResponse(
            token=token,
            channel_name=classroom.channel_name,
            uid=participant.agora_uid,
            app_id=settings.agora_app_id,
            classroom=classroom_response,
            participant=ParticipantResponse.model_validate(participant)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/virtual-classrooms/{classroom_id}/leave")
async def leave_classroom(
    classroom_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Leave a classroom session"""
    service = VirtualClassroomService(db)
    participant = await service.leave_classroom(classroom_id, user_id)
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    return {"message": "Left classroom successfully"}


@router.get("/virtual-classrooms/{classroom_id}/participants", response_model=List[ParticipantResponse])
async def get_classroom_participants(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Get all participants in a classroom"""
    service = VirtualClassroomService(db)
    classroom = service.get_classroom(classroom_id)
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    return [ParticipantResponse.model_validate(p) for p in classroom.participants]


@router.post("/virtual-classrooms/{classroom_id}/recordings/start", response_model=RecordingResponse)
async def start_recording(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Start recording a classroom session"""
    service = VirtualClassroomService(db)
    
    try:
        recording = await service.start_recording(classroom_id)
        return RecordingResponse.model_validate(recording)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/virtual-classrooms/recordings/{recording_id}/stop", response_model=RecordingResponse)
async def stop_recording(
    recording_id: int,
    db: Session = Depends(get_db)
):
    """Stop recording a classroom session"""
    service = VirtualClassroomService(db)
    
    try:
        recording = await service.stop_recording(recording_id)
        return RecordingResponse.model_validate(recording)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/virtual-classrooms/{classroom_id}/recordings", response_model=List[RecordingResponse])
async def get_classroom_recordings(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Get all recordings for a classroom"""
    service = VirtualClassroomService(db)
    classroom = service.get_classroom(classroom_id)
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    return [RecordingResponse.model_validate(r) for r in classroom.recordings]


@router.post("/virtual-classrooms/{classroom_id}/breakout-rooms", response_model=BreakoutRoomResponse, status_code=status.HTTP_201_CREATED)
async def create_breakout_room(
    classroom_id: int,
    data: BreakoutRoomCreate,
    db: Session = Depends(get_db)
):
    """Create a breakout room"""
    service = VirtualClassroomService(db)
    
    try:
        breakout_room = await service.create_breakout_room(classroom_id, data)
        
        participant_count = len(breakout_room.participants)
        response = BreakoutRoomResponse.model_validate(breakout_room)
        response.participant_count = participant_count
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/breakout-rooms/{breakout_room_id}/join", response_model=JoinBreakoutRoomResponse)
async def join_breakout_room(
    breakout_room_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Join a breakout room"""
    service = VirtualClassroomService(db)
    
    try:
        participant, token = await service.join_breakout_room(breakout_room_id, user_id)
        
        breakout_room = db.query(service.db.query.__self__.__class__).get(breakout_room_id)
        
        participant_count = len(breakout_room.participants)
        breakout_response = BreakoutRoomResponse.model_validate(breakout_room)
        breakout_response.participant_count = participant_count
        
        return JoinBreakoutRoomResponse(
            token=token,
            channel_name=breakout_room.channel_name,
            uid=participant.agora_uid,
            app_id=settings.agora_app_id,
            breakout_room=breakout_response
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/breakout-rooms/{breakout_room_id}/close")
async def close_breakout_room(
    breakout_room_id: int,
    db: Session = Depends(get_db)
):
    """Close a breakout room"""
    service = VirtualClassroomService(db)
    
    try:
        await service.close_breakout_room(breakout_room_id)
        return {"message": "Breakout room closed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/virtual-classrooms/{classroom_id}/breakout-rooms", response_model=List[BreakoutRoomResponse])
async def get_breakout_rooms(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Get all breakout rooms for a classroom"""
    service = VirtualClassroomService(db)
    classroom = service.get_classroom(classroom_id)
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    items = []
    for room in classroom.breakout_rooms:
        participant_count = len(room.participants)
        response = BreakoutRoomResponse.model_validate(room)
        response.participant_count = participant_count
        items.append(response)
    
    return items


@router.get("/virtual-classrooms/{classroom_id}/attendance", response_model=dict)
async def get_classroom_attendance(
    classroom_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get attendance records for a classroom"""
    service = VirtualClassroomService(db)
    records, total = service.get_attendance(classroom_id, skip, limit)
    
    return {
        "items": [AttendanceResponse.model_validate(r) for r in records],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/virtual-classrooms/{classroom_id}/polls", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
async def create_poll(
    classroom_id: int,
    data: PollCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a poll"""
    service = VirtualClassroomService(db)
    poll = await service.create_poll(classroom_id, user_id, data)
    
    response = PollResponse.model_validate(poll)
    response.total_responses = 0
    
    return response


@router.post("/polls/{poll_id}/start", response_model=PollResponse)
async def start_poll(
    poll_id: int,
    db: Session = Depends(get_db)
):
    """Start a poll"""
    service = VirtualClassroomService(db)
    
    try:
        poll = await service.start_poll(poll_id)
        
        response = PollResponse.model_validate(poll)
        response.total_responses = len(poll.responses)
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/polls/{poll_id}/end", response_model=PollResponse)
async def end_poll(
    poll_id: int,
    db: Session = Depends(get_db)
):
    """End a poll"""
    service = VirtualClassroomService(db)
    
    try:
        poll = await service.end_poll(poll_id)
        
        response = PollResponse.model_validate(poll)
        response.total_responses = len(poll.responses)
        response.results = service.get_poll_results(poll_id)
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/polls/{poll_id}/respond", response_model=PollResponseResponse)
async def respond_to_poll(
    poll_id: int,
    data: PollResponseCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Respond to a poll"""
    service = VirtualClassroomService(db)
    
    try:
        response = await service.submit_poll_response(poll_id, user_id, data)
        return PollResponseResponse.model_validate(response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/polls/{poll_id}/results")
async def get_poll_results(
    poll_id: int,
    db: Session = Depends(get_db)
):
    """Get poll results"""
    service = VirtualClassroomService(db)
    
    try:
        results = service.get_poll_results(poll_id)
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/virtual-classrooms/{classroom_id}/polls", response_model=List[PollResponse])
async def get_classroom_polls(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Get all polls for a classroom"""
    service = VirtualClassroomService(db)
    classroom = service.get_classroom(classroom_id)
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    items = []
    for poll in classroom.polls:
        response = PollResponse.model_validate(poll)
        response.total_responses = len(poll.responses)
        if poll.status.value == "ended":
            response.results = service.get_poll_results(poll.id)
        items.append(response)
    
    return items


@router.post("/virtual-classrooms/{classroom_id}/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    classroom_id: int,
    data: QuizCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Create a quiz"""
    service = VirtualClassroomService(db)
    quiz = await service.create_quiz(classroom_id, user_id, data)
    
    response = QuizResponse.model_validate(quiz)
    response.total_submissions = 0
    
    return response


@router.post("/quizzes/{quiz_id}/start", response_model=QuizResponse)
async def start_quiz(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    """Start a quiz"""
    service = VirtualClassroomService(db)
    
    try:
        quiz = await service.start_quiz(quiz_id)
        
        response = QuizResponse.model_validate(quiz)
        response.total_submissions = len(quiz.submissions)
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/quizzes/{quiz_id}/end", response_model=QuizResponse)
async def end_quiz(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    """End a quiz"""
    service = VirtualClassroomService(db)
    
    try:
        quiz = await service.end_quiz(quiz_id)
        
        response = QuizResponse.model_validate(quiz)
        response.total_submissions = len(quiz.submissions)
        
        if quiz.submissions:
            avg_score = sum(s.score for s in quiz.submissions if s.score) / len(quiz.submissions)
            response.average_score = avg_score
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizSubmissionResponse)
async def submit_quiz(
    quiz_id: int,
    data: QuizSubmissionCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Submit quiz answers"""
    service = VirtualClassroomService(db)
    
    try:
        submission = await service.submit_quiz(quiz_id, user_id, data)
        return QuizSubmissionResponse.model_validate(submission)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/virtual-classrooms/{classroom_id}/quizzes", response_model=List[QuizResponse])
async def get_classroom_quizzes(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Get all quizzes for a classroom"""
    service = VirtualClassroomService(db)
    classroom = service.get_classroom(classroom_id)
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    items = []
    for quiz in classroom.quizzes:
        response = QuizResponse.model_validate(quiz)
        response.total_submissions = len(quiz.submissions)
        
        if quiz.submissions:
            avg_score = sum(s.score for s in quiz.submissions if s.score) / len(quiz.submissions)
            response.average_score = avg_score
        
        items.append(response)
    
    return items


@router.post("/virtual-classrooms/{classroom_id}/whiteboard", response_model=WhiteboardResponse)
async def save_whiteboard(
    classroom_id: int,
    data: WhiteboardUpdate,
    db: Session = Depends(get_db)
):
    """Save whiteboard session data"""
    service = VirtualClassroomService(db)
    session = await service.save_whiteboard_session(classroom_id, data.session_data)
    return WhiteboardResponse.model_validate(session)


@router.get("/virtual-classrooms/{classroom_id}/analytics", response_model=ClassroomAnalytics)
async def get_classroom_analytics(
    classroom_id: int,
    db: Session = Depends(get_db)
):
    """Get classroom analytics"""
    service = VirtualClassroomService(db)
    
    try:
        analytics = service.get_classroom_analytics(classroom_id)
        return ClassroomAnalytics(**analytics)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
