from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid
from src.repositories.collaboration_repository import (
    StudyBuddyRepository, StudySessionRepository, CollaborativeNoteRepository,
    PeerTutoringRepository, GroupAnalyticsRepository
)
from src.models import (
    StudyBuddyProfile, StudyBuddyMatch, StudySession, SessionParticipant,
    CollaborativeNote, PeerTutorProfile, TutoringRequest, TutoringSession,
    GroupPerformanceAnalytics, MatchStatus, SessionStatus, TutorRequestStatus,
    Student, User
)


class StudyBuddyMatchingService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = StudyBuddyRepository(db)

    def create_or_update_profile(
        self,
        student_id: int,
        user_id: int,
        institution_id: int,
        profile_data: Dict[str, Any]
    ) -> StudyBuddyProfile:
        existing_profile = self.repository.get_profile_by_student(student_id)
        
        if existing_profile:
            return self.repository.update_profile(existing_profile, profile_data)
        else:
            profile_data.update({
                'student_id': student_id,
                'user_id': user_id,
                'institution_id': institution_id
            })
            return self.repository.create_profile(profile_data)

    def calculate_match_score(
        self,
        requester_profile: StudyBuddyProfile,
        candidate_profile: StudyBuddyProfile
    ) -> Tuple[float, List[int], str]:
        score = 0.0
        reasons = []

        common_subjects = list(set(requester_profile.subjects) & set(candidate_profile.subjects))
        if common_subjects:
            subject_score = (len(common_subjects) / max(len(requester_profile.subjects), 1)) * 40
            score += subject_score
            reasons.append(f"{len(common_subjects)} common subjects")

        if requester_profile.performance_level == candidate_profile.performance_level:
            score += 20
            reasons.append("Similar performance level")
        elif abs(self._performance_level_to_value(requester_profile.performance_level) - 
                 self._performance_level_to_value(candidate_profile.performance_level)) <= 1:
            score += 10
            reasons.append("Compatible performance level")

        if requester_profile.learning_style and candidate_profile.learning_style:
            if requester_profile.learning_style == candidate_profile.learning_style:
                score += 15
                reasons.append("Same learning style")

        if requester_profile.availability_days and candidate_profile.availability_days:
            common_days = list(set(requester_profile.availability_days) & set(candidate_profile.availability_days))
            if common_days:
                day_score = (len(common_days) / 7) * 15
                score += day_score
                reasons.append(f"{len(common_days)} common availability days")

        if requester_profile.preferred_study_times and candidate_profile.preferred_study_times:
            common_times = list(set(requester_profile.preferred_study_times) & set(candidate_profile.preferred_study_times))
            if common_times:
                score += 10
                reasons.append("Compatible study times")

        match_reason = "; ".join(reasons) if reasons else "Basic compatibility"
        
        return score, common_subjects, match_reason

    def _performance_level_to_value(self, level: str) -> int:
        levels = {
            'excellent': 4,
            'good': 3,
            'average': 2,
            'needs_improvement': 1
        }
        return levels.get(level, 2)

    def find_study_buddies(
        self,
        student_id: int,
        institution_id: int,
        subject_ids: Optional[List[int]] = None,
        performance_level: Optional[str] = None,
        max_matches: int = 10
    ) -> List[Dict[str, Any]]:
        requester_profile = self.repository.get_profile_by_student(student_id)
        if not requester_profile:
            return []

        potential_matches = self.repository.get_potential_matches(
            student_id=student_id,
            institution_id=institution_id,
            subject_ids=subject_ids or requester_profile.subjects,
            performance_level=performance_level,
            limit=max_matches * 2
        )

        matches_with_scores = []
        for candidate in potential_matches:
            score, common_subjects, reason = self.calculate_match_score(
                requester_profile, candidate
            )
            
            if score >= 20:
                matches_with_scores.append({
                    'profile': candidate,
                    'score': score,
                    'common_subjects': common_subjects,
                    'reason': reason
                })

        matches_with_scores.sort(key=lambda x: x['score'], reverse=True)
        return matches_with_scores[:max_matches]

    def create_match_request(
        self,
        requester_id: int,
        matched_student_id: int,
        institution_id: int,
        match_score: float,
        common_subjects: List[int],
        match_reason: str
    ) -> StudyBuddyMatch:
        match_data = {
            'institution_id': institution_id,
            'requester_id': requester_id,
            'matched_student_id': matched_student_id,
            'match_score': match_score,
            'common_subjects': common_subjects,
            'match_reason': match_reason,
            'status': MatchStatus.PENDING
        }
        return self.repository.create_match(match_data)

    def respond_to_match(
        self,
        match_id: int,
        student_id: int,
        accept: bool
    ) -> StudyBuddyMatch:
        match = self.repository.get_match_by_id(match_id)
        if not match:
            raise ValueError("Match not found")

        if match.matched_student_id != student_id:
            raise ValueError("Unauthorized to respond to this match")

        status = MatchStatus.ACCEPTED if accept else MatchStatus.DECLINED
        return self.repository.update_match_status(match, status)


class StudySessionService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = StudySessionRepository(db)

    def create_session(
        self,
        user_id: int,
        institution_id: int,
        session_data: Dict[str, Any]
    ) -> StudySession:
        session_data.update({
            'created_by': user_id,
            'institution_id': institution_id,
            'video_room_id': self._generate_room_id()
        })
        
        session = self.repository.create_session(session_data)
        
        participant_data = {
            'institution_id': institution_id,
            'session_id': session.id,
            'user_id': user_id,
            'is_organizer': True
        }
        self.repository.add_participant(participant_data)
        
        return session

    def _generate_room_id(self) -> str:
        return f"session-{uuid.uuid4().hex[:12]}"

    def join_session(
        self,
        session_id: int,
        user_id: int,
        institution_id: int
    ) -> SessionParticipant:
        session = self.repository.get_session_by_id(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.participant_count >= session.max_participants:
            raise ValueError("Session is full")

        existing_participant = self.repository.get_session_participant(session_id, user_id)
        if existing_participant:
            return existing_participant

        participant_data = {
            'institution_id': institution_id,
            'session_id': session_id,
            'user_id': user_id,
            'joined_at': datetime.utcnow()
        }
        return self.repository.add_participant(participant_data)

    def start_session(
        self,
        session_id: int,
        user_id: int,
        video_room_id: Optional[str] = None
    ) -> StudySession:
        session = self.repository.get_session_by_id(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.created_by != user_id:
            raise ValueError("Only the organizer can start the session")

        update_data = {
            'actual_start': datetime.utcnow(),
            'status': SessionStatus.IN_PROGRESS
        }
        if video_room_id:
            update_data['video_room_id'] = video_room_id

        return self.repository.update_session(session, update_data)

    def end_session(self, session_id: int, user_id: int) -> StudySession:
        session = self.repository.get_session_by_id(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.created_by != user_id:
            raise ValueError("Only the organizer can end the session")

        update_data = {
            'actual_end': datetime.utcnow(),
            'status': SessionStatus.COMPLETED
        }
        return self.repository.update_session(session, update_data)

    def leave_session(
        self,
        session_id: int,
        user_id: int
    ) -> SessionParticipant:
        participant = self.repository.get_session_participant(session_id, user_id)
        if not participant:
            raise ValueError("Participant not found")

        if participant.joined_at:
            duration = (datetime.utcnow() - participant.joined_at).total_seconds() / 60
            update_data = {
                'left_at': datetime.utcnow(),
                'duration_minutes': int(duration)
            }
            return self.repository.update_participant(participant, update_data)
        
        return participant


class CollaborativeNoteService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = CollaborativeNoteRepository(db)

    def create_note(
        self,
        user_id: int,
        institution_id: int,
        note_data: Dict[str, Any]
    ) -> CollaborativeNote:
        note_data.update({
            'created_by': user_id,
            'institution_id': institution_id,
            'last_edited_by': user_id,
            'version': 1
        })
        
        note = self.repository.create_note(note_data)
        
        editor_data = {
            'note_id': note.id,
            'user_id': user_id,
            'can_edit': True
        }
        self.repository.add_editor(editor_data)
        
        revision_data = {
            'note_id': note.id,
            'user_id': user_id,
            'content': note.content,
            'version': 1,
            'change_description': 'Initial version'
        }
        self.repository.create_revision(revision_data)
        
        return note

    def update_note(
        self,
        note_id: int,
        user_id: int,
        update_data: Dict[str, Any]
    ) -> CollaborativeNote:
        note = self.repository.get_note_by_id(note_id)
        if not note:
            raise ValueError("Note not found")

        is_editor = any(e.user_id == user_id and e.can_edit for e in note.editors)
        if not is_editor and note.created_by != user_id:
            raise ValueError("User does not have permission to edit this note")

        change_description = update_data.pop('change_description', None)
        
        updated_note = self.repository.update_note(note, update_data)
        updated_note.last_edited_by = user_id
        
        if 'content' in update_data:
            revision_data = {
                'note_id': note_id,
                'user_id': user_id,
                'content': updated_note.content,
                'version': updated_note.version,
                'change_description': change_description or f'Update by user {user_id}'
            }
            self.repository.create_revision(revision_data)
        
        self.db.commit()
        return updated_note

    def add_editor(
        self,
        note_id: int,
        user_id: int,
        editor_user_id: int,
        can_edit: bool = True
    ) -> None:
        note = self.repository.get_note_by_id(note_id)
        if not note:
            raise ValueError("Note not found")

        if note.created_by != user_id:
            raise ValueError("Only the creator can add editors")

        editor_data = {
            'note_id': note_id,
            'user_id': editor_user_id,
            'can_edit': can_edit
        }
        self.repository.add_editor(editor_data)

    def get_note_with_access_check(
        self,
        note_id: int,
        user_id: int
    ) -> CollaborativeNote:
        note = self.repository.get_note_by_id(note_id)
        if not note:
            raise ValueError("Note not found")

        has_access = (
            note.is_public or
            note.created_by == user_id or
            any(e.user_id == user_id for e in note.editors)
        )

        if not has_access:
            raise ValueError("Access denied")

        self.repository.increment_view_count(note)
        return note


class PeerTutoringService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PeerTutoringRepository(db)

    def create_tutor_profile(
        self,
        student_id: int,
        user_id: int,
        institution_id: int,
        profile_data: Dict[str, Any]
    ) -> PeerTutorProfile:
        existing_profile = self.repository.get_tutor_profile_by_student(student_id)
        if existing_profile:
            raise ValueError("Tutor profile already exists for this student")

        profile_data.update({
            'student_id': student_id,
            'user_id': user_id,
            'institution_id': institution_id
        })
        return self.repository.create_tutor_profile(profile_data)

    def create_tutoring_request(
        self,
        student_id: int,
        institution_id: int,
        request_data: Dict[str, Any]
    ) -> TutoringRequest:
        request_data.update({
            'student_id': student_id,
            'institution_id': institution_id,
            'status': TutorRequestStatus.OPEN
        })
        return self.repository.create_tutoring_request(request_data)

    def match_tutor_to_request(
        self,
        request_id: int,
        tutor_id: int
    ) -> TutoringRequest:
        request = self.repository.get_tutoring_request_by_id(request_id)
        if not request:
            raise ValueError("Request not found")

        if request.status != TutorRequestStatus.OPEN:
            raise ValueError("Request is not open")

        tutor_profile = self.repository.get_tutor_profile_by_id(tutor_id)
        if not tutor_profile or not tutor_profile.is_active:
            raise ValueError("Tutor not available")

        update_data = {
            'tutor_id': tutor_id,
            'status': TutorRequestStatus.MATCHED,
            'matched_at': datetime.utcnow()
        }
        return self.repository.update_tutoring_request(request, update_data)

    def create_tutoring_session(
        self,
        request_id: int,
        tutor_id: int,
        session_data: Dict[str, Any]
    ) -> TutoringSession:
        request = self.repository.get_tutoring_request_by_id(request_id)
        if not request:
            raise ValueError("Request not found")

        tutor_profile = self.repository.get_tutor_profile_by_id(tutor_id)
        if not tutor_profile:
            raise ValueError("Tutor profile not found")

        session_data.update({
            'request_id': request_id,
            'tutor_id': tutor_id,
            'student_id': request.student_id,
            'institution_id': request.institution_id,
            'status': SessionStatus.SCHEDULED
        })
        
        return self.repository.create_tutoring_session(session_data)

    def complete_tutoring_session(
        self,
        session_id: int,
        rating: Optional[int] = None,
        feedback: Optional[str] = None
    ) -> TutoringSession:
        session = self.repository.get_tutoring_session_by_id(session_id)
        if not session:
            raise ValueError("Session not found")

        update_data = {
            'status': SessionStatus.COMPLETED,
            'actual_end': datetime.utcnow()
        }

        if rating:
            update_data['student_rating'] = rating
            tutor_profile = self.repository.get_tutor_profile_by_id(session.tutor_id)
            if tutor_profile:
                self.repository.update_tutor_stats(tutor_profile, rating=rating)

        if feedback:
            update_data['student_feedback'] = feedback

        if session.payment_amount and session.payment_status == 'completed':
            tutor_profile = self.repository.get_tutor_profile_by_id(session.tutor_id)
            if tutor_profile:
                self.repository.update_tutor_stats(tutor_profile, earnings=session.payment_amount)

        return self.repository.update_tutoring_session(session, update_data)


class GroupAnalyticsService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = GroupAnalyticsRepository(db)
        self.session_repo = StudySessionRepository(db)

    def generate_group_analytics(
        self,
        group_id: int,
        institution_id: int,
        period_start: datetime,
        period_end: datetime
    ) -> GroupPerformanceAnalytics:
        sessions = self.session_repo.get_sessions(
            institution_id=institution_id,
            group_id=group_id,
            start_date=period_start,
            end_date=period_end
        )

        total_study_hours = 0.0
        total_sessions = len(sessions)
        total_attendance = 0
        member_data = {}
        subject_data = {}

        for session in sessions:
            if session.actual_start and session.actual_end:
                duration = (session.actual_end - session.actual_start).total_seconds() / 3600
                total_study_hours += duration

            total_attendance += session.participant_count

            if session.subject_id:
                subject_data[session.subject_id] = subject_data.get(session.subject_id, 0) + 1

            for participant in session.participants:
                if participant.user_id not in member_data:
                    member_data[participant.user_id] = {
                        'sessions_attended': 0,
                        'total_minutes': 0
                    }
                member_data[participant.user_id]['sessions_attended'] += 1
                member_data[participant.user_id]['total_minutes'] += participant.duration_minutes

        average_attendance = total_attendance / total_sessions if total_sessions > 0 else 0

        engagement_score = min(100, (total_study_hours / max(total_sessions, 1)) * 20)
        collaboration_score = min(100, average_attendance * 10)
        overall_performance = (engagement_score + collaboration_score) / 2

        analytics_data = {
            'institution_id': institution_id,
            'group_id': group_id,
            'period_start': period_start,
            'period_end': period_end,
            'total_study_hours': total_study_hours,
            'total_sessions': total_sessions,
            'average_attendance': average_attendance,
            'member_performance': member_data,
            'subject_distribution': subject_data,
            'activity_metrics': {
                'active_members': len(member_data),
                'avg_session_duration': total_study_hours / total_sessions if total_sessions > 0 else 0
            },
            'engagement_score': engagement_score,
            'collaboration_score': collaboration_score,
            'overall_performance': overall_performance
        }

        return self.repository.create_analytics(analytics_data)
