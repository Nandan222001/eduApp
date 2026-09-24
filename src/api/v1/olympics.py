from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies.auth import get_current_user, get_current_user_ws
from src.models.user import User
from src.services.olympics_service import OlympicsService, OlympicsRedisService
from src.services.websocket_manager import websocket_manager
from src.redis_client import get_redis
from src.schemas.olympics import (
    CompetitionCreate, CompetitionUpdate, CompetitionResponse,
    CompetitionEventCreate, CompetitionEventUpdate, CompetitionEventResponse,
    CompetitionEntryCreate, CompetitionEntryUpdate, CompetitionEntryResponse,
    CompetitionTeamCreate, CompetitionTeamUpdate, CompetitionTeamResponse,
    CompetitionLeaderboardResponse, SubmitAnswerRequest, GradeSubmissionRequest,
    TeamFormationRequest, CertificateGenerateRequest, LiveLeaderboardResponse,
    LeaderboardEntry
)
from src.models.olympics import CompetitionScope, CompetitionStatus, EventType
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/competitions", response_model=CompetitionResponse, status_code=status.HTTP_201_CREATED)
def create_competition(
    competition: CompetitionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a competition, scoped to the caller's own institution.

    Previously this whole router had no auth dependency on any endpoint at
    all, and every create endpoint accepted an arbitrary `institution_id`
    query parameter straight from the caller -- any unauthenticated client
    could create, read or update Olympics competitions/events/entries/teams
    for any institution just by guessing IDs. Fixed by requiring
    `Depends(get_current_user)` on every endpoint (matching every other
    router in this codebase) and always deriving `institution_id` from
    `current_user.institution_id` rather than a client-supplied value.
    """
    return OlympicsService.create_competition(db, current_user.institution_id, competition)


@router.get("/competitions", response_model=List[CompetitionResponse])
def list_competitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[CompetitionStatus] = Query(None),
    scope: Optional[CompetitionScope] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OlympicsService.get_competitions(db, current_user.institution_id, skip, limit, status, scope)


@router.get("/competitions/{competition_id}", response_model=CompetitionResponse)
def get_competition(
    competition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    competition = OlympicsService.get_competition(db, competition_id)
    if not competition or competition.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition


@router.put("/competitions/{competition_id}", response_model=CompetitionResponse)
def update_competition(
    competition_id: int,
    competition: CompetitionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = OlympicsService.get_competition(db, competition_id)
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Competition not found")
    updated_competition = OlympicsService.update_competition(db, competition_id, competition)
    if not updated_competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return updated_competition


@router.post("/events", response_model=CompetitionEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event: CompetitionEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OlympicsService.create_event(db, current_user.institution_id, event)


@router.get("/events/{event_id}", response_model=CompetitionEventResponse)
def get_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/competitions/{competition_id}/events", response_model=List[CompetitionEventResponse])
def list_competition_events(
    competition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    competition = OlympicsService.get_competition(db, competition_id)
    if not competition or competition.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Competition not found")
    return OlympicsService.get_events_by_competition(db, competition_id)


@router.put("/events/{event_id}", response_model=CompetitionEventResponse)
def update_event(
    event_id: int,
    event: CompetitionEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = OlympicsService.get_event(db, event_id)
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")
    updated_event = OlympicsService.update_event(db, event_id, event)
    if not updated_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated_event


@router.post("/entries", response_model=CompetitionEntryResponse, status_code=status.HTTP_201_CREATED)
def create_entry(
    entry: CompetitionEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OlympicsService.create_entry(db, current_user.institution_id, entry)


@router.get("/entries/{entry_id}", response_model=CompetitionEntryResponse)
def get_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = OlympicsService.get_entry(db, entry_id)
    if not entry or entry.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.get("/events/{event_id}/entries", response_model=List[CompetitionEntryResponse])
def list_event_entries(
    event_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return OlympicsService.get_entries_by_event(db, event_id, skip, limit)


@router.put("/entries/{entry_id}", response_model=CompetitionEntryResponse)
def update_entry(
    entry_id: int,
    entry: CompetitionEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = OlympicsService.get_entry(db, entry_id)
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    updated_entry = OlympicsService.update_entry(db, entry_id, entry)
    if not updated_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return updated_entry


@router.post("/entries/submit", response_model=CompetitionEntryResponse)
async def submit_answer(
    submit_data: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_entry = OlympicsService.get_entry(db, submit_data.entry_id)
    if not existing_entry or existing_entry.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry = OlympicsService.submit_answer(db, submit_data)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    event = OlympicsService.get_event(db, entry.event_id)
    if event:
        await OlympicsService.broadcast_score_update(
            event.competition_id,
            entry.event_id,
            entry.id,
            entry.score,
            entry.rank
        )
    
    return entry


@router.post("/entries/grade", response_model=CompetitionEntryResponse)
async def grade_submission(
    grade_data: GradeSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_entry = OlympicsService.get_entry(db, grade_data.entry_id)
    if not existing_entry or existing_entry.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry = OlympicsService.grade_submission(db, grade_data)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    event = OlympicsService.get_event(db, entry.event_id)
    if event:
        OlympicsService.calculate_rankings(db, entry.event_id, event.event_type == EventType.TEAM)
        
        db.refresh(entry)
        
        await OlympicsService.broadcast_score_update(
            event.competition_id,
            entry.event_id,
            entry.id,
            entry.score,
            entry.rank
        )
    
    return entry


@router.post("/teams", response_model=CompetitionTeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team: CompetitionTeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return OlympicsService.create_team(db, current_user.institution_id, team)


@router.get("/teams/{team_id}", response_model=CompetitionTeamResponse)
def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = OlympicsService.get_team(db, team_id)
    if not team or team.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/events/{event_id}/teams", response_model=List[CompetitionTeamResponse])
def list_event_teams(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return OlympicsService.get_teams_by_event(db, event_id)


@router.put("/teams/{team_id}", response_model=CompetitionTeamResponse)
def update_team(
    team_id: int,
    team: CompetitionTeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = OlympicsService.get_team(db, team_id)
    if not existing or existing.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Team not found")
    updated_team = OlympicsService.update_team(db, team_id, team)
    if not updated_team:
        raise HTTPException(status_code=404, detail="Team not found")
    return updated_team


@router.post("/events/{event_id}/calculate-team-scores")
def calculate_team_scores(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")

    OlympicsService.calculate_team_scores(db, event_id)
    return {"message": "Team scores calculated successfully"}


@router.post("/events/{event_id}/calculate-rankings")
async def calculate_rankings(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")

    is_team_event = event.event_type == EventType.TEAM
    OlympicsService.calculate_rankings(db, event_id, is_team_event)

    return {"message": "Rankings calculated successfully"}


@router.get("/competitions/{competition_id}/leaderboard", response_model=CompetitionLeaderboardResponse)
def get_competition_leaderboard(
    competition_id: int,
    scope: CompetitionScope = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    competition = OlympicsService.get_competition(db, competition_id)
    if not competition or competition.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Competition not found")

    leaderboard = OlympicsService.get_leaderboard(db, competition_id, scope)
    if not leaderboard:
        raise HTTPException(status_code=404, detail="Leaderboard not found")
    return leaderboard


@router.post("/competitions/{competition_id}/leaderboard/update", response_model=CompetitionLeaderboardResponse)
async def update_competition_leaderboard(
    competition_id: int,
    scope: CompetitionScope = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    competition = OlympicsService.get_competition(db, competition_id)
    if not competition or competition.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Competition not found")

    leaderboard = OlympicsService.update_leaderboard(db, competition_id, scope, current_user.institution_id)

    leaderboard_entries = []
    for entry_data in leaderboard.rankings.get('entries', []):
        leaderboard_entries.append(LeaderboardEntry(**entry_data))

    await OlympicsService.broadcast_leaderboard_update(
        competition_id,
        None,
        leaderboard_entries
    )

    return leaderboard


@router.post("/entries/certificates/generate")
def generate_certificates(
    certificate_request: CertificateGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    certificates = []

    for entry_id in certificate_request.entry_ids:
        entry = OlympicsService.get_entry(db, entry_id)
        if entry and entry.institution_id == current_user.institution_id:
            cert_url = OlympicsService.generate_certificate(
                db, entry, certificate_request.template
            )
            certificates.append({
                'entry_id': entry_id,
                'certificate_url': cert_url
            })

    return {
        'message': f"{len(certificates)} certificates generated",
        'certificates': certificates
    }


@router.websocket("/ws/competition/{competition_id}")
async def websocket_competition(
    websocket: WebSocket,
    competition_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Real-time competition updates channel.

    Previously accepted a plain, unauthenticated `user_id: int` query
    parameter with zero verification -- any client could connect and
    impersonate any other user, and there was no institution check on
    `competition_id` either. Fixed to match the pattern already used by
    `classroom_websocket.py`/`live_events_websocket.py`: resolve the
    caller's identity from a token via `get_current_user_ws` and scope the
    competition lookup to the caller's own institution.
    """
    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    competition = OlympicsService.get_competition(db, competition_id)
    if not competition or competition.institution_id != user.institution_id:
        await websocket.close(code=1008, reason="Competition not found")
        return

    user_id = user.id
    await websocket_manager.connect(websocket, user_id)
    room = f"competition_{competition_id}"
    websocket_manager.subscribe_to_room(room, user_id)

    try:
        while True:
            data = await websocket.receive_text()

            await websocket.send_text(f"Message received: {data}")

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, user_id)
        websocket_manager.unsubscribe_from_room(room, user_id)
        logger.info(f"User {user_id} disconnected from competition {competition_id}")


@router.websocket("/ws/competition/{competition_id}/event/{event_id}")
async def websocket_event(
    websocket: WebSocket,
    competition_id: int,
    event_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Real-time event updates channel -- same auth fix as `websocket_competition`
    above (previously a raw, unverified `user_id` query parameter)."""
    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != user.institution_id or event.competition_id != competition_id:
        await websocket.close(code=1008, reason="Event not found")
        return

    user_id = user.id
    await websocket_manager.connect(websocket, user_id)
    room = f"competition_{competition_id}_event_{event_id}"
    websocket_manager.subscribe_to_room(room, user_id)

    try:
        while True:
            data = await websocket.receive_text()

            await websocket.send_text(f"Message received: {data}")

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, user_id)
        websocket_manager.unsubscribe_from_room(room, user_id)
        logger.info(f"User {user_id} disconnected from event {event_id}")


@router.get("/events/{event_id}/live-leaderboard")
async def get_live_leaderboard(
    event_id: int,
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis = Depends(get_redis)
):
    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")

    redis_service = OlympicsRedisService(redis)
    live_data = await redis_service.get_live_leaderboard(
        event.competition_id,
        event_id,
        limit
    )
    
    from src.models.student import Student
    leaderboard_entries = []
    
    for data in live_data:
        student = db.query(Student).filter(Student.id == data['participant_id']).first()
        if student:
            leaderboard_entries.append(LeaderboardEntry(
                rank=data['rank'],
                participant_id=data['participant_id'],
                participant_name=f"{student.first_name} {student.last_name}",
                team_id=None,
                team_name=None,
                score=data['score'],
                time_taken=data.get('time_taken'),
                institution_id=student.institution_id,
                institution_name=None
            ))
    
    competition = OlympicsService.get_competition(db, event.competition_id)
    
    return LiveLeaderboardResponse(
        competition_id=event.competition_id,
        event_id=event_id,
        scope=competition.scope if competition else CompetitionScope.SCHOOL,
        entries=leaderboard_entries,
        total_participants=len(leaderboard_entries),
        last_updated=datetime.utcnow()
    )


@router.post("/events/{event_id}/live-score/update")
async def update_live_score(
    event_id: int,
    participant_id: int = Query(...),
    score: float = Query(...),
    time_taken: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    redis = Depends(get_redis)
):
    event = OlympicsService.get_event(db, event_id)
    if not event or event.institution_id != current_user.institution_id:
        raise HTTPException(status_code=404, detail="Event not found")
    
    redis_service = OlympicsRedisService(redis)
    await redis_service.update_live_score(
        event.competition_id,
        event_id,
        participant_id,
        score,
        time_taken
    )
    
    rank = await redis_service.get_participant_rank(
        event.competition_id,
        event_id,
        participant_id
    )
    
    await OlympicsService.broadcast_score_update(
        event.competition_id,
        event_id,
        participant_id,
        score,
        rank
    )
    
    return {
        'message': 'Live score updated',
        'participant_id': participant_id,
        'score': score,
        'rank': rank
    }
