from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from src.models import (
    StudyBuddyProfile, StudyBuddyMatch, StudySession, SessionParticipant,
    CollaborativeNote, NoteEditor, NoteRevision, PeerTutorProfile,
    TutoringRequest, TutoringSession, GroupPerformanceAnalytics,
    Student, User, MatchStatus, SessionStatus, TutorRequestStatus
)


class StudyBuddyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_profile(self, profile_data: Dict[str, Any]) -> StudyBuddyProfile:
        profile = StudyBuddyProfile(**profile_data)
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_profile_by_student(self, student_id: int) -> Optional[StudyBuddyProfile]:
        return self.db.query(StudyBuddyProfile).filter(
            StudyBuddyProfile.student_id == student_id
        ).first()

    def update_profile(self, profile: StudyBuddyProfile, update_data: Dict[str, Any]) -> StudyBuddyProfile:
        for key, value in update_data.items():
            if value is not None:
                setattr(profile, key, value)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_potential_matches(
        self,
        student_id: int,
        institution_id: int,
        subject_ids: Optional[List[int]] = None,
        performance_level: Optional[str] = None,
        limit: int = 10
    ) -> List[StudyBuddyProfile]:
        query = self.db.query(StudyBuddyProfile).filter(
            and_(
                StudyBuddyProfile.institution_id == institution_id,
                StudyBuddyProfile.student_id != student_id,
                StudyBuddyProfile.is_available == True
            )
        )

        if subject_ids:
            query = query.filter(
                StudyBuddyProfile.subjects.overlap(subject_ids)
            )

        if performance_level:
            query = query.filter(
                StudyBuddyProfile.performance_level == performance_level
            )

        return query.limit(limit).all()

    def create_match(self, match_data: Dict[str, Any]) -> StudyBuddyMatch:
        match = StudyBuddyMatch(**match_data)
        self.db.add(match)
        self.db.commit()
        self.db.refresh(match)
        return match

    def get_match_by_id(self, match_id: int) -> Optional[StudyBuddyMatch]:
        return self.db.query(StudyBuddyMatch).filter(
            StudyBuddyMatch.id == match_id
        ).first()

    def get_student_matches(
        self,
        student_id: int,
        status: Optional[str] = None
    ) -> List[StudyBuddyMatch]:
        query = self.db.query(StudyBuddyMatch).filter(
            or_(
                StudyBuddyMatch.requester_id == student_id,
                StudyBuddyMatch.matched_student_id == student_id
            )
        )

        if status:
            query = query.filter(StudyBuddyMatch.status == status)

        return query.order_by(desc(StudyBuddyMatch.created_at)).all()

    def update_match_status(
        self,
        match: StudyBuddyMatch,
        status: str
    ) -> StudyBuddyMatch:
        match.status = status
        match.responded_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(match)
        return match


class StudySessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, session_data: Dict[str, Any]) -> StudySession:
        session = StudySession(**session_data)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session_by_id(self, session_id: int) -> Optional[StudySession]:
        return self.db.query(StudySession).options(
            joinedload(StudySession.participants)
        ).filter(StudySession.id == session_id).first()

    def get_sessions(
        self,
        institution_id: int,
        group_id: Optional[int] = None,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[StudySession]:
        query = self.db.query(StudySession).filter(
            StudySession.institution_id == institution_id
        )

        if group_id:
            query = query.filter(StudySession.group_id == group_id)

        if status:
            query = query.filter(StudySession.status == status)

        if start_date:
            query = query.filter(StudySession.scheduled_start >= start_date)

        if end_date:
            query = query.filter(StudySession.scheduled_end <= end_date)

        return query.order_by(desc(StudySession.scheduled_start)).limit(limit).offset(offset).all()

    def update_session(self, session: StudySession, update_data: Dict[str, Any]) -> StudySession:
        for key, value in update_data.items():
            if value is not None:
                setattr(session, key, value)
        self.db.commit()
        self.db.refresh(session)
        return session

    def add_participant(self, participant_data: Dict[str, Any]) -> SessionParticipant:
        participant = SessionParticipant(**participant_data)
        self.db.add(participant)
        
        session = self.db.query(StudySession).filter(
            StudySession.id == participant_data['session_id']
        ).first()
        if session:
            session.participant_count += 1
        
        self.db.commit()
        self.db.refresh(participant)
        return participant

    def get_session_participant(
        self,
        session_id: int,
        user_id: int
    ) -> Optional[SessionParticipant]:
        return self.db.query(SessionParticipant).filter(
            and_(
                SessionParticipant.session_id == session_id,
                SessionParticipant.user_id == user_id
            )
        ).first()

    def update_participant(
        self,
        participant: SessionParticipant,
        update_data: Dict[str, Any]
    ) -> SessionParticipant:
        for key, value in update_data.items():
            if value is not None:
                setattr(participant, key, value)
        self.db.commit()
        self.db.refresh(participant)
        return participant

    def get_user_sessions(
        self,
        user_id: int,
        upcoming: bool = False
    ) -> List[StudySession]:
        query = self.db.query(StudySession).join(
            SessionParticipant,
            SessionParticipant.session_id == StudySession.id
        ).filter(SessionParticipant.user_id == user_id)

        if upcoming:
            query = query.filter(
                and_(
                    StudySession.scheduled_start > datetime.utcnow(),
                    StudySession.status == SessionStatus.SCHEDULED
                )
            )

        return query.order_by(desc(StudySession.scheduled_start)).all()


class CollaborativeNoteRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_note(self, note_data: Dict[str, Any]) -> CollaborativeNote:
        note = CollaborativeNote(**note_data)
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def get_note_by_id(self, note_id: int) -> Optional[CollaborativeNote]:
        return self.db.query(CollaborativeNote).options(
            joinedload(CollaborativeNote.editors),
            joinedload(CollaborativeNote.revisions)
        ).filter(CollaborativeNote.id == note_id).first()

    def get_notes(
        self,
        institution_id: int,
        group_id: Optional[int] = None,
        session_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        is_public: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[CollaborativeNote]:
        query = self.db.query(CollaborativeNote).filter(
            CollaborativeNote.institution_id == institution_id
        )

        if group_id:
            query = query.filter(CollaborativeNote.group_id == group_id)

        if session_id:
            query = query.filter(CollaborativeNote.session_id == session_id)

        if subject_id:
            query = query.filter(CollaborativeNote.subject_id == subject_id)

        if is_public is not None:
            query = query.filter(CollaborativeNote.is_public == is_public)

        return query.order_by(desc(CollaborativeNote.updated_at)).limit(limit).offset(offset).all()

    def update_note(self, note: CollaborativeNote, update_data: Dict[str, Any]) -> CollaborativeNote:
        for key, value in update_data.items():
            if value is not None and key != 'change_description':
                setattr(note, key, value)
        note.version += 1
        note.edit_count += 1
        self.db.commit()
        self.db.refresh(note)
        return note

    def add_editor(self, editor_data: Dict[str, Any]) -> NoteEditor:
        editor = NoteEditor(**editor_data)
        self.db.add(editor)
        self.db.commit()
        self.db.refresh(editor)
        return editor

    def get_note_editors(self, note_id: int) -> List[NoteEditor]:
        return self.db.query(NoteEditor).filter(
            NoteEditor.note_id == note_id
        ).all()

    def create_revision(self, revision_data: Dict[str, Any]) -> NoteRevision:
        revision = NoteRevision(**revision_data)
        self.db.add(revision)
        self.db.commit()
        self.db.refresh(revision)
        return revision

    def get_note_revisions(self, note_id: int, limit: int = 20) -> List[NoteRevision]:
        return self.db.query(NoteRevision).filter(
            NoteRevision.note_id == note_id
        ).order_by(desc(NoteRevision.version)).limit(limit).all()

    def increment_view_count(self, note: CollaborativeNote) -> None:
        note.view_count += 1
        self.db.commit()


class PeerTutoringRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_tutor_profile(self, profile_data: Dict[str, Any]) -> PeerTutorProfile:
        profile = PeerTutorProfile(**profile_data)
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_tutor_profile_by_id(self, profile_id: int) -> Optional[PeerTutorProfile]:
        return self.db.query(PeerTutorProfile).filter(
            PeerTutorProfile.id == profile_id
        ).first()

    def get_tutor_profile_by_student(self, student_id: int) -> Optional[PeerTutorProfile]:
        return self.db.query(PeerTutorProfile).filter(
            PeerTutorProfile.student_id == student_id
        ).first()

    def update_tutor_profile(
        self,
        profile: PeerTutorProfile,
        update_data: Dict[str, Any]
    ) -> PeerTutorProfile:
        for key, value in update_data.items():
            if value is not None:
                setattr(profile, key, value)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def search_tutors(
        self,
        institution_id: int,
        subject_id: Optional[int] = None,
        min_rating: Optional[float] = None,
        max_rate: Optional[float] = None,
        limit: int = 20
    ) -> List[PeerTutorProfile]:
        query = self.db.query(PeerTutorProfile).filter(
            and_(
                PeerTutorProfile.institution_id == institution_id,
                PeerTutorProfile.is_active == True
            )
        )

        if subject_id:
            query = query.filter(
                PeerTutorProfile.expertise_subjects.contains([subject_id])
            )

        if min_rating:
            query = query.filter(PeerTutorProfile.average_rating >= min_rating)

        if max_rate:
            query = query.filter(
                or_(
                    PeerTutorProfile.hourly_rate <= max_rate,
                    PeerTutorProfile.hourly_rate == None
                )
            )

        return query.order_by(desc(PeerTutorProfile.average_rating)).limit(limit).all()

    def create_tutoring_request(self, request_data: Dict[str, Any]) -> TutoringRequest:
        request = TutoringRequest(**request_data)
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        return request

    def get_tutoring_request_by_id(self, request_id: int) -> Optional[TutoringRequest]:
        return self.db.query(TutoringRequest).filter(
            TutoringRequest.id == request_id
        ).first()

    def get_tutoring_requests(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        tutor_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[TutoringRequest]:
        query = self.db.query(TutoringRequest).filter(
            TutoringRequest.institution_id == institution_id
        )

        if student_id:
            query = query.filter(TutoringRequest.student_id == student_id)

        if tutor_id:
            query = query.filter(TutoringRequest.tutor_id == tutor_id)

        if status:
            query = query.filter(TutoringRequest.status == status)

        return query.order_by(desc(TutoringRequest.created_at)).limit(limit).all()

    def update_tutoring_request(
        self,
        request: TutoringRequest,
        update_data: Dict[str, Any]
    ) -> TutoringRequest:
        for key, value in update_data.items():
            if value is not None:
                setattr(request, key, value)
        self.db.commit()
        self.db.refresh(request)
        return request

    def create_tutoring_session(self, session_data: Dict[str, Any]) -> TutoringSession:
        session = TutoringSession(**session_data)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_tutoring_session_by_id(self, session_id: int) -> Optional[TutoringSession]:
        return self.db.query(TutoringSession).filter(
            TutoringSession.id == session_id
        ).first()

    def get_tutoring_sessions(
        self,
        tutor_id: Optional[int] = None,
        student_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[TutoringSession]:
        query = self.db.query(TutoringSession)

        if tutor_id:
            query = query.filter(TutoringSession.tutor_id == tutor_id)

        if student_id:
            query = query.filter(TutoringSession.student_id == student_id)

        if status:
            query = query.filter(TutoringSession.status == status)

        return query.order_by(desc(TutoringSession.scheduled_start)).limit(limit).all()

    def update_tutoring_session(
        self,
        session: TutoringSession,
        update_data: Dict[str, Any]
    ) -> TutoringSession:
        for key, value in update_data.items():
            if value is not None:
                setattr(session, key, value)
        self.db.commit()
        self.db.refresh(session)
        return session

    def update_tutor_stats(
        self,
        tutor_profile: PeerTutorProfile,
        rating: Optional[int] = None,
        earnings: Optional[float] = None
    ) -> None:
        if rating:
            total_rating = tutor_profile.average_rating * tutor_profile.total_sessions
            tutor_profile.total_sessions += 1
            tutor_profile.average_rating = (total_rating + rating) / tutor_profile.total_sessions

        if earnings:
            tutor_profile.total_earnings += earnings

        self.db.commit()


class GroupAnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_analytics(self, analytics_data: Dict[str, Any]) -> GroupPerformanceAnalytics:
        analytics = GroupPerformanceAnalytics(**analytics_data)
        self.db.add(analytics)
        self.db.commit()
        self.db.refresh(analytics)
        return analytics

    def get_analytics_by_id(self, analytics_id: int) -> Optional[GroupPerformanceAnalytics]:
        return self.db.query(GroupPerformanceAnalytics).filter(
            GroupPerformanceAnalytics.id == analytics_id
        ).first()

    def get_group_analytics(
        self,
        group_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 10
    ) -> List[GroupPerformanceAnalytics]:
        query = self.db.query(GroupPerformanceAnalytics).filter(
            GroupPerformanceAnalytics.group_id == group_id
        )

        if start_date:
            query = query.filter(GroupPerformanceAnalytics.period_start >= start_date)

        if end_date:
            query = query.filter(GroupPerformanceAnalytics.period_end <= end_date)

        return query.order_by(desc(GroupPerformanceAnalytics.created_at)).limit(limit).all()

    def update_analytics(
        self,
        analytics: GroupPerformanceAnalytics,
        update_data: Dict[str, Any]
    ) -> GroupPerformanceAnalytics:
        for key, value in update_data.items():
            if value is not None:
                setattr(analytics, key, value)
        self.db.commit()
        self.db.refresh(analytics)
        return analytics
