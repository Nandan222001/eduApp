from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.services.subject_rpg_service import SubjectRPGService
from src.schemas.subject_rpg import (
    StudentCharacterCreate, StudentCharacterUpdate, StudentCharacterResponse,
    SubjectWorldCreate, SubjectWorldResponse,
    BattleSessionStart, BattleAnswers, BattleSessionResponse, BattleResultsResponse,
    SubjectPassportResponse,
    QuestLogCreate, QuestLogResponse, QuestProgressUpdate,
    CoOpPartnerResponse, LeaderboardEntry, CharacterStatsResponse, QuestTypeEnum
)
from src.models.subject_rpg import StudentCharacter, BattleSession, QuestLog

router = APIRouter()


def _check_institution_access(current_user: User, institution_id: int) -> None:
    """403s unless the caller is a superuser or belongs to this institution.

    This whole router had zero authentication (bug class 2 -- the 9th
    zero-auth router found this session) *and* every endpoint that took an
    `institution_id` query param trusted it unchecked, letting any caller
    read or write another institution's RPG characters, battles, quests,
    and passports just by passing a different id (same shape as this
    session's `study_planner.py` fix).
    """
    if not current_user.is_superuser and current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this institution's data"
        )


def _get_character_or_404(db: Session, character_id: int, institution_id: int) -> StudentCharacter:
    """Looks up a character scoped to `institution_id`.

    Used to validate a client-supplied `character_id` actually belongs to
    the (now-verified) caller's institution before it's wired into a new
    battle session or quest -- without this, a caller could pass their own
    (valid) `institution_id` alongside another institution's `character_id`
    and have that foreign character silently awarded XP/levels/loot meant
    for their own battle.
    """
    character = db.query(StudentCharacter).filter(
        StudentCharacter.id == character_id,
        StudentCharacter.institution_id == institution_id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.post("/characters", response_model=StudentCharacterResponse, status_code=status.HTTP_201_CREATED)
def get_or_create_character(
    student_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    character = SubjectRPGService.get_or_create_character(db, student_id, institution_id)
    return character


@router.get("/characters/{character_id}", response_model=StudentCharacterResponse)
def get_character(
    character_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    character = db.query(StudentCharacter).filter(StudentCharacter.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    _check_institution_access(current_user, character.institution_id)
    return character


@router.put("/characters/{character_id}", response_model=StudentCharacterResponse)
def update_character(
    character_id: int,
    update_data: StudentCharacterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(StudentCharacter).filter(StudentCharacter.id == character_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Character not found")
    _check_institution_access(current_user, existing.institution_id)

    character = SubjectRPGService.update_character(
        db,
        character_id,
        character_name=update_data.character_name,
        avatar_url=update_data.avatar_url,
        equipment=update_data.equipment
    )
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.get("/characters/{character_id}/stats", response_model=CharacterStatsResponse)
def get_character_stats(
    character_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    character = db.query(StudentCharacter).filter(StudentCharacter.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    _check_institution_access(current_user, character.institution_id)

    total_battles = db.query(BattleSession).filter(
        BattleSession.character_id == character_id,
        BattleSession.is_completed == True
    ).count()

    avg_score_result = db.query(func.avg(BattleSession.score)).filter(
        BattleSession.character_id == character_id,
        BattleSession.is_completed == True
    ).scalar()
    avg_score = float(avg_score_result) if avg_score_result else 0.0

    total_xp_earned = db.query(func.sum(BattleSession.xp_earned)).filter(
        BattleSession.character_id == character_id,
        BattleSession.is_completed == True
    ).scalar() or 0

    active_quests = db.query(QuestLog).filter(
        QuestLog.character_id == character_id,
        QuestLog.is_completed == False
    ).count()

    completed_quests = db.query(QuestLog).filter(
        QuestLog.character_id == character_id,
        QuestLog.is_completed == True
    ).count()

    return CharacterStatsResponse(
        character=character,
        total_battles=total_battles,
        avg_score=round(avg_score, 2),
        total_xp_earned=total_xp_earned,
        active_quests=active_quests,
        completed_quests=completed_quests
    )


@router.post("/worlds", response_model=SubjectWorldResponse, status_code=status.HTTP_201_CREATED)
def create_or_get_subject_world(
    subject_id: int = Query(...),
    institution_id: int = Query(...),
    world_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    world = SubjectRPGService.get_or_create_subject_world(db, subject_id, institution_id, world_name)
    return world


@router.get("/worlds/{world_id}", response_model=SubjectWorldResponse)
def get_subject_world(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from src.models.subject_rpg import SubjectWorld
    world = db.query(SubjectWorld).filter(SubjectWorld.id == world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="Subject world not found")
    _check_institution_access(current_user, world.institution_id)
    return world


@router.post("/battles/start", response_model=BattleSessionResponse, status_code=status.HTTP_201_CREATED)
def start_battle(
    battle_data: BattleSessionStart,
    student_id: int = Query(...),
    character_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    _get_character_or_404(db, character_id, institution_id)

    session = SubjectRPGService.start_battle_session(
        db, institution_id, student_id, battle_data.chapter_id, character_id
    )
    return session


@router.get("/battles/{battle_id}", response_model=BattleSessionResponse)
def get_battle(
    battle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    battle = db.query(BattleSession).filter(BattleSession.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle session not found")
    _check_institution_access(current_user, battle.institution_id)
    return battle


@router.post("/battles/{battle_id}/complete", response_model=BattleResultsResponse)
def complete_battle(
    battle_id: int,
    answers: BattleAnswers,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(BattleSession).filter(BattleSession.id == battle_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Battle session not found or already completed")
    _check_institution_access(current_user, existing.institution_id)

    result = SubjectRPGService.complete_battle_session(db, battle_id, answers.answers)
    if not result:
        raise HTTPException(status_code=404, detail="Battle session not found or already completed")
    return result


@router.get("/battles/student/{student_id}", response_model=List[BattleSessionResponse])
def get_student_battles(
    student_id: int,
    institution_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    battles = db.query(BattleSession).filter(
        BattleSession.student_id == student_id,
        BattleSession.institution_id == institution_id
    ).order_by(BattleSession.created_at.desc()).offset(skip).limit(limit).all()
    return battles


@router.get("/passports", response_model=SubjectPassportResponse)
def get_passport(
    student_id: int = Query(...),
    subject_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    passport = SubjectRPGService.get_passport(db, student_id, subject_id, institution_id)
    return passport


@router.get("/passports/student/{student_id}", response_model=List[SubjectPassportResponse])
def get_student_passports(
    student_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    from src.models.subject_rpg import SubjectPassport
    passports = db.query(SubjectPassport).filter(
        SubjectPassport.student_id == student_id,
        SubjectPassport.institution_id == institution_id
    ).all()
    return passports


@router.post("/quests", response_model=QuestLogResponse, status_code=status.HTTP_201_CREATED)
def create_quest(
    quest_data: QuestLogCreate,
    student_id: int = Query(...),
    character_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    _get_character_or_404(db, character_id, institution_id)

    from src.models.subject_rpg import QuestType
    quest = SubjectRPGService.create_quest(
        db=db,
        institution_id=institution_id,
        student_id=student_id,
        character_id=character_id,
        quest_type=QuestType(quest_data.quest_type.value),
        description=quest_data.description,
        target=quest_data.target,
        reward_xp=quest_data.reward_xp,
        reward_gold=quest_data.reward_gold,
        expires_hours=quest_data.expires_hours
    )
    return quest


@router.get("/quests/active", response_model=List[QuestLogResponse])
def get_active_quests(
    student_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    quests = SubjectRPGService.get_active_quests(db, student_id, institution_id)
    return quests


@router.post("/quests/daily", response_model=List[QuestLogResponse])
def generate_daily_quests(
    student_id: int = Query(...),
    character_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    _get_character_or_404(db, character_id, institution_id)

    quests = SubjectRPGService.generate_daily_quests(db, student_id, institution_id, character_id)
    return quests


@router.put("/quests/{quest_id}/progress", response_model=QuestLogResponse)
def update_quest_progress(
    quest_id: int,
    progress_data: QuestProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(QuestLog).filter(QuestLog.id == quest_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Quest not found or already completed")
    _check_institution_access(current_user, existing.institution_id)

    quest = SubjectRPGService.update_quest_progress(db, quest_id, progress_data.progress_increment)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found or already completed")
    return quest


@router.get("/quests/{quest_id}", response_model=QuestLogResponse)
def get_quest(
    quest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quest = db.query(QuestLog).filter(QuestLog.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    _check_institution_access(current_user, quest.institution_id)
    return quest


@router.get("/coop/partners", response_model=List[CoOpPartnerResponse])
def find_coop_partners(
    student_id: int = Query(...),
    chapter_id: int = Query(...),
    institution_id: int = Query(...),
    max_partners: int = Query(3, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    partners = SubjectRPGService.find_co_op_partners(
        db, institution_id, student_id, chapter_id, max_partners
    )
    return partners


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    institution_id: int = Query(...),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_institution_access(current_user, institution_id)
    characters = db.query(StudentCharacter).filter(
        StudentCharacter.institution_id == institution_id
    ).order_by(StudentCharacter.xp.desc()).limit(limit).all()

    leaderboard = []
    for rank, character in enumerate(characters, 1):
        leaderboard.append(LeaderboardEntry(
            rank=rank,
            character_name=character.character_name,
            level=character.level,
            total_xp=character.xp,
            avatar_url=character.avatar_url
        ))

    return leaderboard
