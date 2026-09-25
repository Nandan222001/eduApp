from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
import json
import logging

from src.models.olympics import (
    Competition, CompetitionEvent, CompetitionEntry, CompetitionTeam,
    CompetitionLeaderboard, CompetitionScope, CompetitionStatus, EventType
)
from src.models.student import Student
from src.models.institution import Institution
from src.schemas.olympics import (
    CompetitionCreate, CompetitionUpdate, CompetitionEventCreate,
    CompetitionEventUpdate, CompetitionEntryCreate, CompetitionEntryUpdate,
    CompetitionTeamCreate, CompetitionTeamUpdate, LeaderboardEntry,
    LiveLeaderboardResponse, SubmitAnswerRequest, GradeSubmissionRequest
)
from src.services.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


class OlympicsService:
    
    @staticmethod
    def create_competition(
        db: Session,
        institution_id: int,
        competition_data: CompetitionCreate
    ) -> Competition:
        competition = Competition(
            institution_id=institution_id,
            **competition_data.model_dump()
        )
        db.add(competition)
        db.commit()
        db.refresh(competition)
        return competition
    
    @staticmethod
    def get_competition(db: Session, competition_id: int) -> Optional[Competition]:
        return db.query(Competition).filter(Competition.id == competition_id).first()
    
    @staticmethod
    def get_competitions(
        db: Session,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[CompetitionStatus] = None,
        scope: Optional[CompetitionScope] = None
    ) -> List[Competition]:
        query = db.query(Competition).filter(Competition.institution_id == institution_id)
        
        if status:
            query = query.filter(Competition.status == status)
        if scope:
            query = query.filter(Competition.scope == scope)
        
        return query.order_by(desc(Competition.start_date)).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_competition(
        db: Session,
        competition_id: int,
        competition_data: CompetitionUpdate
    ) -> Optional[Competition]:
        competition = db.query(Competition).filter(Competition.id == competition_id).first()
        if not competition:
            return None
        
        for key, value in competition_data.model_dump(exclude_unset=True).items():
            setattr(competition, key, value)
        
        db.commit()
        db.refresh(competition)
        return competition
    
    @staticmethod
    def create_event(
        db: Session,
        institution_id: int,
        event_data: CompetitionEventCreate
    ) -> CompetitionEvent:
        event = CompetitionEvent(
            institution_id=institution_id,
            **event_data.model_dump()
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def get_event(db: Session, event_id: int) -> Optional[CompetitionEvent]:
        return db.query(CompetitionEvent).filter(CompetitionEvent.id == event_id).first()
    
    @staticmethod
    def get_events_by_competition(
        db: Session,
        competition_id: int
    ) -> List[CompetitionEvent]:
        return db.query(CompetitionEvent).filter(
            CompetitionEvent.competition_id == competition_id
        ).all()
    
    @staticmethod
    def update_event(
        db: Session,
        event_id: int,
        event_data: CompetitionEventUpdate
    ) -> Optional[CompetitionEvent]:
        event = db.query(CompetitionEvent).filter(CompetitionEvent.id == event_id).first()
        if not event:
            return None
        
        for key, value in event_data.model_dump(exclude_unset=True).items():
            setattr(event, key, value)
        
        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def create_entry(
        db: Session,
        institution_id: int,
        entry_data: CompetitionEntryCreate
    ) -> CompetitionEntry:
        entry = CompetitionEntry(
            institution_id=institution_id,
            **entry_data.model_dump()
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    
    @staticmethod
    def get_entry(db: Session, entry_id: int) -> Optional[CompetitionEntry]:
        return db.query(CompetitionEntry).filter(CompetitionEntry.id == entry_id).first()
    
    @staticmethod
    def get_entries_by_event(
        db: Session,
        event_id: int,
        skip: int = 0,
        limit: int = 1000
    ) -> List[CompetitionEntry]:
        return db.query(CompetitionEntry).filter(
            CompetitionEntry.event_id == event_id
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_entry(
        db: Session,
        entry_id: int,
        entry_data: CompetitionEntryUpdate
    ) -> Optional[CompetitionEntry]:
        entry = db.query(CompetitionEntry).filter(CompetitionEntry.id == entry_id).first()
        if not entry:
            return None
        
        for key, value in entry_data.model_dump(exclude_unset=True).items():
            setattr(entry, key, value)
        
        db.commit()
        db.refresh(entry)
        return entry
    
    @staticmethod
    def submit_answer(
        db: Session,
        submit_data: SubmitAnswerRequest
    ) -> Optional[CompetitionEntry]:
        entry = db.query(CompetitionEntry).filter(
            CompetitionEntry.id == submit_data.entry_id
        ).first()
        
        if not entry:
            return None
        
        entry.submission_data = submit_data.answer_data
        entry.time_taken = submit_data.time_taken
        entry.submitted_at = datetime.utcnow()
        entry.status = 'submitted'
        
        db.commit()
        db.refresh(entry)
        
        return entry
    
    @staticmethod
    def grade_submission(
        db: Session,
        grade_data: GradeSubmissionRequest
    ) -> Optional[CompetitionEntry]:
        entry = db.query(CompetitionEntry).filter(
            CompetitionEntry.id == grade_data.entry_id
        ).first()
        
        if not entry:
            return None
        
        entry.score = grade_data.score
        entry.graded_at = datetime.utcnow()
        entry.status = 'graded'
        
        if grade_data.feedback:
            if not entry.submission_data:
                entry.submission_data = {}
            entry.submission_data['feedback'] = grade_data.feedback
        
        db.commit()
        db.refresh(entry)
        
        return entry
    
    @staticmethod
    def create_team(
        db: Session,
        institution_id: int,
        team_data: CompetitionTeamCreate
    ) -> CompetitionTeam:
        team = CompetitionTeam(
            institution_id=institution_id,
            **team_data.model_dump()
        )
        db.add(team)
        db.commit()
        db.refresh(team)
        return team
    
    @staticmethod
    def get_team(db: Session, team_id: int) -> Optional[CompetitionTeam]:
        return db.query(CompetitionTeam).filter(CompetitionTeam.id == team_id).first()
    
    @staticmethod
    def get_teams_by_event(db: Session, event_id: int) -> List[CompetitionTeam]:
        return db.query(CompetitionTeam).filter(
            CompetitionTeam.event_id == event_id
        ).all()
    
    @staticmethod
    def update_team(
        db: Session,
        team_id: int,
        team_data: CompetitionTeamUpdate
    ) -> Optional[CompetitionTeam]:
        team = db.query(CompetitionTeam).filter(CompetitionTeam.id == team_id).first()
        if not team:
            return None
        
        for key, value in team_data.model_dump(exclude_unset=True).items():
            setattr(team, key, value)
        
        db.commit()
        db.refresh(team)
        return team
    
    @staticmethod
    def calculate_team_scores(db: Session, event_id: int) -> None:
        teams = db.query(CompetitionTeam).filter(
            CompetitionTeam.event_id == event_id
        ).all()
        
        for team in teams:
            entries = db.query(CompetitionEntry).filter(
                and_(
                    CompetitionEntry.event_id == event_id,
                    CompetitionEntry.team_id == team.id
                )
            ).all()
            
            total_score = sum(entry.score for entry in entries if entry.score)
            team.total_score = total_score
        
        db.commit()
    
    @staticmethod
    def calculate_rankings(db: Session, event_id: int, is_team_event: bool = False) -> None:
        if is_team_event:
            teams = db.query(CompetitionTeam).filter(
                CompetitionTeam.event_id == event_id
            ).order_by(
                desc(CompetitionTeam.total_score),
                CompetitionTeam.created_at
            ).all()
            
            for rank, team in enumerate(teams, start=1):
                team.rank = rank
        else:
            entries = db.query(CompetitionEntry).filter(
                CompetitionEntry.event_id == event_id
            ).order_by(
                desc(CompetitionEntry.score),
                CompetitionEntry.time_taken,
                CompetitionEntry.created_at
            ).all()
            
            for rank, entry in enumerate(entries, start=1):
                entry.rank = rank
        
        db.commit()
    
    @staticmethod
    def get_leaderboard(db: Session, competition_id: int, scope: CompetitionScope) -> Optional[CompetitionLeaderboard]:
        return db.query(CompetitionLeaderboard).filter(
            and_(
                CompetitionLeaderboard.competition_id == competition_id,
                CompetitionLeaderboard.scope == scope
            )
        ).first()
    
    @staticmethod
    def update_leaderboard(
        db: Session,
        competition_id: int,
        scope: CompetitionScope,
        institution_id: int
    ) -> CompetitionLeaderboard:
        leaderboard = db.query(CompetitionLeaderboard).filter(
            and_(
                CompetitionLeaderboard.competition_id == competition_id,
                CompetitionLeaderboard.scope == scope
            )
        ).first()
        
        rankings = OlympicsService._calculate_competition_rankings(
            db, competition_id, scope
        )
        
        if leaderboard:
            leaderboard.rankings = rankings
            leaderboard.last_updated = datetime.utcnow()
            leaderboard.total_participants = len(rankings.get('entries', []))
        else:
            leaderboard = CompetitionLeaderboard(
                institution_id=institution_id,
                competition_id=competition_id,
                scope=scope,
                rankings=rankings,
                total_participants=len(rankings.get('entries', []))
            )
            db.add(leaderboard)
        
        db.commit()
        db.refresh(leaderboard)
        return leaderboard
    
    @staticmethod
    def _calculate_competition_rankings(
        db: Session,
        competition_id: int,
        scope: CompetitionScope
    ) -> Dict[str, Any]:
        events = db.query(CompetitionEvent).filter(
            CompetitionEvent.competition_id == competition_id
        ).all()
        
        participant_scores = {}
        
        for event in events:
            entries = db.query(CompetitionEntry).filter(
                CompetitionEntry.event_id == event.id
            ).all()
            
            for entry in entries:
                key = f"student_{entry.participant_student_id}"
                if key not in participant_scores:
                    participant_scores[key] = {
                        'student_id': entry.participant_student_id,
                        'total_score': Decimal(0),
                        'events_participated': 0,
                        'institution_id': entry.institution_id
                    }
                
                participant_scores[key]['total_score'] += entry.score or Decimal(0)
                participant_scores[key]['events_participated'] += 1
        
        sorted_participants = sorted(
            participant_scores.values(),
            key=lambda x: (-x['total_score'], -x['events_participated'])
        )
        
        rankings_list = []
        for rank, participant in enumerate(sorted_participants, start=1):
            student = db.query(Student).filter(Student.id == participant['student_id']).first()
            if student:
                # Field names here must match the `LeaderboardEntry` schema
                # (participant_id/participant_name/score, not student_id/
                # student_name/total_score) -- the router unpacks each of
                # these dicts straight into `LeaderboardEntry(**entry_data)`
                # in `update_competition_leaderboard`, and the mismatched
                # names previously made that endpoint 100% fail with a
                # pydantic ValidationError as soon as there was at least one
                # ranked participant (model/schema drift, bug class 11).
                rankings_list.append({
                    'rank': rank,
                    'participant_id': participant['student_id'],
                    'participant_name': f"{student.first_name} {student.last_name}",
                    'team_id': None,
                    'team_name': None,
                    'score': float(participant['total_score']),
                    'time_taken': None,
                    'institution_id': participant['institution_id'],
                    'institution_name': None,
                })
        
        return {
            'entries': rankings_list,
            'last_calculated': datetime.utcnow().isoformat()
        }
    
    @staticmethod
    async def broadcast_score_update(
        competition_id: int,
        event_id: int,
        entry_id: int,
        score: Decimal,
        rank: Optional[int] = None
    ):
        message = {
            'type': 'score_update',
            'competition_id': competition_id,
            'event_id': event_id,
            'entry_id': entry_id,
            'score': float(score),
            'rank': rank,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        room = f"competition_{competition_id}_event_{event_id}"
        await websocket_manager.broadcast_to_room(room, message)
    
    @staticmethod
    async def broadcast_leaderboard_update(
        competition_id: int,
        event_id: Optional[int],
        leaderboard_data: List[LeaderboardEntry]
    ):
        message = {
            'type': 'leaderboard_update',
            'competition_id': competition_id,
            'event_id': event_id,
            'leaderboard': [entry.model_dump() for entry in leaderboard_data],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        room = f"competition_{competition_id}"
        if event_id:
            room = f"competition_{competition_id}_event_{event_id}"
        
        await websocket_manager.broadcast_to_room(room, message)
    
    @staticmethod
    def generate_certificate(
        db: Session,
        entry: CompetitionEntry,
        template: Optional[str] = None
    ) -> str:
        event = entry.event
        competition = event.competition
        student = db.query(Student).filter(Student.id == entry.participant_student_id).first()
        
        certificate_data = {
            'student_name': f"{student.first_name} {student.last_name}" if student else "Unknown",
            'competition_title': competition.title,
            'event_name': event.event_name,
            'score': float(entry.score),
            'rank': entry.rank,
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'certificate_id': f"CERT-{competition.id}-{event.id}-{entry.id}"
        }
        
        certificate_url = f"/certificates/{certificate_data['certificate_id']}.pdf"
        
        entry.certificate_url = certificate_url
        db.commit()
        
        return certificate_url


class OlympicsRedisService:
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def update_live_score(
        self,
        competition_id: int,
        event_id: int,
        participant_id: int,
        score: float,
        time_taken: Optional[int] = None
    ):
        key = f"olympics:competition:{competition_id}:event:{event_id}:leaderboard"
        
        score_data = {
            'score': score,
            'participant_id': participant_id,
            'time_taken': time_taken or 0,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        await self.redis.zadd(key, {json.dumps(score_data): score})
        await self.redis.expire(key, 86400)
    
    async def get_live_leaderboard(
        self,
        competition_id: int,
        event_id: int,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        key = f"olympics:competition:{competition_id}:event:{event_id}:leaderboard"
        
        results = await self.redis.zrevrange(key, 0, limit - 1, withscores=True)
        
        leaderboard = []
        for rank, (data_str, score) in enumerate(results, start=1):
            data = json.loads(data_str)
            data['rank'] = rank
            data['score'] = score
            leaderboard.append(data)
        
        return leaderboard
    
    async def clear_leaderboard(self, competition_id: int, event_id: int):
        key = f"olympics:competition:{competition_id}:event:{event_id}:leaderboard"
        await self.redis.delete(key)
    
    async def get_participant_rank(
        self,
        competition_id: int,
        event_id: int,
        participant_id: int
    ) -> Optional[int]:
        key = f"olympics:competition:{competition_id}:event:{event_id}:leaderboard"
        
        all_scores = await self.redis.zrevrange(key, 0, -1)
        
        for rank, data_str in enumerate(all_scores, start=1):
            data = json.loads(data_str)
            if data['participant_id'] == participant_id:
                return rank
        
        return None
