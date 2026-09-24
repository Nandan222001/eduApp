from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from src.models.peer_tutoring import (
    TutorProfile, TutoringSession, TutorReview, TutorEndorsement,
    TutorBadge, TutorIncentive, TutorPointHistory, SessionModerationLog,
    TutorLeaderboard, MatchingPreference, SessionParticipant,
    TutorStatus, SessionStatus, SessionType, ReviewStatus,
    EndorsementType, IncentiveType, BadgeCategory, ModerationActionType
)
from src.models.student import Student
from src.models.user import User
from src.schemas.peer_tutoring import (
    TutorProfileCreate, TutorProfileUpdate, TutoringSessionCreate,
    TutoringSessionUpdate, TutorReviewCreate, TutorEndorsementCreate,
    SessionModerationLogCreate, MatchingPreferenceCreate,
    MatchingPreferenceUpdate, TutorMatchRequest, TutorMatchScore,
    SessionStartRequest, SessionCompleteRequest, SessionCancelRequest
)


class PeerTutoringService:
    
    @staticmethod
    def create_tutor_profile(
        db: Session,
        institution_id: int,
        profile_data: TutorProfileCreate
    ) -> TutorProfile:
        profile = TutorProfile(
            institution_id=institution_id,
            user_id=profile_data.user_id,
            student_id=profile_data.student_id,
            bio=profile_data.bio,
            subjects=profile_data.subjects,
            availability=profile_data.availability,
            hourly_rate=profile_data.hourly_rate,
            profile_photo_url=profile_data.profile_photo_url,
            video_intro_url=profile_data.video_intro_url,
            languages=profile_data.languages,
            teaching_style=profile_data.teaching_style,
            max_students_per_session=profile_data.max_students_per_session,
            accepts_group_sessions=profile_data.accepts_group_sessions,
            status=TutorStatus.PENDING
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    
    @staticmethod
    def update_tutor_profile(
        db: Session,
        profile_id: int,
        profile_data: TutorProfileUpdate
    ) -> Optional[TutorProfile]:
        profile = db.query(TutorProfile).filter(TutorProfile.id == profile_id).first()
        if not profile:
            return None
        
        update_data = profile_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        db.commit()
        db.refresh(profile)
        return profile
    
    @staticmethod
    def get_tutor_profile(db: Session, profile_id: int) -> Optional[TutorProfile]:
        return db.query(TutorProfile).filter(TutorProfile.id == profile_id).first()
    
    @staticmethod
    def get_tutor_profile_by_user(
        db: Session,
        user_id: int,
        institution_id: int
    ) -> Optional[TutorProfile]:
        return db.query(TutorProfile).filter(
            TutorProfile.user_id == user_id,
            TutorProfile.institution_id == institution_id
        ).first()
    
    @staticmethod
    def list_tutors(
        db: Session,
        institution_id: int,
        status: Optional[TutorStatus] = None,
        subject_id: Optional[int] = None,
        min_rating: Optional[float] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[TutorProfile]:
        query = db.query(TutorProfile).filter(
            TutorProfile.institution_id == institution_id
        )
        
        if status:
            query = query.filter(TutorProfile.status == status)
        
        if min_rating:
            query = query.filter(TutorProfile.average_rating >= min_rating)
        
        query = query.order_by(desc(TutorProfile.average_rating))
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create_session(
        db: Session,
        institution_id: int,
        session_data: TutoringSessionCreate
    ) -> TutoringSession:
        tutor = db.query(TutorProfile).filter(
            TutorProfile.id == session_data.tutor_id,
            TutorProfile.institution_id == institution_id
        ).first()
        if not tutor:
            raise ValueError("Tutor not found")

        student = db.query(Student).filter(
            Student.id == session_data.student_id,
            Student.institution_id == institution_id
        ).first()
        if not student:
            raise ValueError("Student not found")

        session = TutoringSession(
            institution_id=institution_id,
            tutor_id=session_data.tutor_id,
            student_id=session_data.student_id,
            subject_id=session_data.subject_id,
            session_type=session_data.session_type,
            title=session_data.title,
            description=session_data.description,
            topic=session_data.topic,
            scheduled_start=session_data.scheduled_start,
            scheduled_end=session_data.scheduled_end,
            notes=session_data.notes,
            status=SessionStatus.SCHEDULED
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def update_session(
        db: Session,
        session_id: int,
        session_data: TutoringSessionUpdate
    ) -> Optional[TutoringSession]:
        session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not session:
            return None
        
        update_data = session_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(session, field, value)
        
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def start_session(
        db: Session,
        session_id: int,
        start_data: SessionStartRequest
    ) -> Optional[TutoringSession]:
        session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not session:
            return None
        
        session.status = SessionStatus.IN_PROGRESS
        session.actual_start = datetime.utcnow()
        session.meeting_url = start_data.meeting_url
        session.meeting_id = start_data.meeting_id
        session.meeting_password = start_data.meeting_password
        session.video_platform = start_data.video_platform
        
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def complete_session(
        db: Session,
        session_id: int,
        complete_data: SessionCompleteRequest
    ) -> Optional[TutoringSession]:
        session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not session:
            return None
        
        session.status = SessionStatus.COMPLETED
        session.actual_end = datetime.utcnow()
        
        if session.actual_start:
            duration = (session.actual_end - session.actual_start).total_seconds() / 60
            session.duration_minutes = int(duration)
        
        session.tutor_notes = complete_data.tutor_notes
        session.materials_shared = complete_data.materials_shared
        session.recording_url = complete_data.recording_url
        
        tutor = db.query(TutorProfile).filter(TutorProfile.id == session.tutor_id).first()
        if tutor:
            tutor.completed_sessions += 1
            tutor.total_hours_tutored += Decimal(session.duration_minutes or 0) / Decimal(60)
            
            points_earned = PeerTutoringService._calculate_session_points(session)
            session.points_awarded = points_earned
            PeerTutoringService._award_points(db, tutor, points_earned, session.id, "Session completed")
            
            PeerTutoringService._check_and_award_badges(db, tutor)
            PeerTutoringService._check_and_award_incentives(db, tutor)
        
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def cancel_session(
        db: Session,
        session_id: int,
        user_id: int,
        cancel_data: SessionCancelRequest
    ) -> Optional[TutoringSession]:
        session = db.query(TutoringSession).filter(TutoringSession.id == session_id).first()
        if not session:
            return None
        
        session.status = SessionStatus.CANCELLED
        session.cancellation_reason = cancel_data.cancellation_reason
        session.cancelled_by = user_id
        
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def create_review(
        db: Session,
        institution_id: int,
        student_id: int,
        review_data: TutorReviewCreate
    ) -> TutorReview:
        session = db.query(TutoringSession).filter(
            TutoringSession.id == review_data.session_id,
            TutoringSession.institution_id == institution_id
        ).first()

        if not session:
            raise ValueError("Session not found")

        review = TutorReview(
            institution_id=institution_id,
            tutor_id=session.tutor_id,
            session_id=review_data.session_id,
            student_id=student_id,
            rating=review_data.rating,
            review_text=review_data.review_text,
            knowledge_rating=review_data.knowledge_rating,
            communication_rating=review_data.communication_rating,
            patience_rating=review_data.patience_rating,
            helpfulness_rating=review_data.helpfulness_rating,
            punctuality_rating=review_data.punctuality_rating,
            is_anonymous=review_data.is_anonymous,
            status=ReviewStatus.PENDING
        )
        db.add(review)
        
        tutor = db.query(TutorProfile).filter(TutorProfile.id == session.tutor_id).first()
        if tutor:
            tutor.total_reviews += 1
            avg_rating = db.query(func.avg(TutorReview.rating)).filter(
                TutorReview.tutor_id == tutor.id,
                TutorReview.status == ReviewStatus.APPROVED
            ).scalar() or 0
            tutor.average_rating = Decimal(str(avg_rating))
        
        db.commit()
        db.refresh(review)
        return review
    
    @staticmethod
    def create_endorsement(
        db: Session,
        institution_id: int,
        endorser_id: int,
        endorsement_data: TutorEndorsementCreate
    ) -> TutorEndorsement:
        tutor = db.query(TutorProfile).filter(
            TutorProfile.id == endorsement_data.tutor_id,
            TutorProfile.institution_id == institution_id
        ).first()
        if not tutor:
            raise ValueError("Tutor not found")

        endorser = db.query(User).filter(User.id == endorser_id).first()

        weight = 1
        if endorser and endorser.role_id:
            from src.models.role import Role
            role = db.query(Role).filter(Role.id == endorser.role_id).first()
            if role and 'teacher' in role.slug.lower():
                weight = 3
        
        endorsement = TutorEndorsement(
            institution_id=institution_id,
            tutor_id=endorsement_data.tutor_id,
            endorser_id=endorser_id,
            endorsement_type=endorsement_data.endorsement_type,
            subject_id=endorsement_data.subject_id,
            comments=endorsement_data.comments,
            weight=weight,
            is_verified=weight > 1
        )
        db.add(endorsement)
        db.commit()
        db.refresh(endorsement)
        return endorsement
    
    @staticmethod
    def create_moderation_log(
        db: Session,
        institution_id: int,
        moderator_id: int,
        log_data: SessionModerationLogCreate
    ) -> SessionModerationLog:
        session = db.query(TutoringSession).filter(
            TutoringSession.id == log_data.session_id,
            TutoringSession.institution_id == institution_id
        ).first()

        if not session:
            raise ValueError("Session not found")

        log = SessionModerationLog(
            institution_id=institution_id,
            session_id=log_data.session_id,
            moderator_id=moderator_id,
            action_type=log_data.action_type,
            reason=log_data.reason,
            details=log_data.details,
            quality_score=log_data.quality_score,
            safety_score=log_data.safety_score,
            auto_flagged=False
        )
        db.add(log)

        if log_data.action_type == ModerationActionType.TEMPORARY_SUSPENSION:
            tutor = db.query(TutorProfile).filter(
                TutorProfile.id == session.tutor_id
            ).first()
            if tutor:
                tutor.status = TutorStatus.SUSPENDED

        db.commit()
        db.refresh(log)
        return log
    
    @staticmethod
    def get_leaderboard(
        db: Session,
        institution_id: int,
        period: str = "monthly",
        limit: int = 50
    ) -> List[TutorLeaderboard]:
        now = datetime.utcnow()
        
        if period == "weekly":
            period_start = now - timedelta(days=7)
        elif period == "monthly":
            period_start = now - timedelta(days=30)
        else:
            period_start = now - timedelta(days=365)
        
        return db.query(TutorLeaderboard).filter(
            TutorLeaderboard.institution_id == institution_id,
            TutorLeaderboard.period == period,
            TutorLeaderboard.period_start >= period_start
        ).order_by(TutorLeaderboard.rank).limit(limit).all()
    
    @staticmethod
    def update_leaderboard(
        db: Session,
        institution_id: int,
        period: str = "monthly"
    ) -> List[TutorLeaderboard]:
        now = datetime.utcnow()
        
        if period == "weekly":
            period_start = now - timedelta(days=7)
        elif period == "monthly":
            period_start = now - timedelta(days=30)
        else:
            period_start = now - timedelta(days=365)
        
        period_end = now
        
        tutors = db.query(
            TutorProfile.id,
            TutorProfile.total_points,
            func.count(TutoringSession.id).label('sessions_count'),
            func.sum(TutoringSession.duration_minutes).label('total_minutes'),
            func.avg(TutorReview.rating).label('avg_rating')
        ).outerjoin(
            TutoringSession,
            and_(
                TutoringSession.tutor_id == TutorProfile.id,
                TutoringSession.status == SessionStatus.COMPLETED,
                TutoringSession.actual_end >= period_start
            )
        ).outerjoin(
            TutorReview,
            and_(
                TutorReview.tutor_id == TutorProfile.id,
                TutorReview.status == ReviewStatus.APPROVED
            )
        ).filter(
            TutorProfile.institution_id == institution_id,
            TutorProfile.status == TutorStatus.ACTIVE
        ).group_by(TutorProfile.id).all()
        
        scored_tutors = []
        for tutor_id, points, sessions, minutes, rating in tutors:
            score = (
                points +
                (sessions * 10) +
                (int(minutes or 0) // 60 * 5) +
                (int((rating or 0) * 20))
            )
            scored_tutors.append((tutor_id, score, sessions, minutes, rating))
        
        scored_tutors.sort(key=lambda x: x[1], reverse=True)
        
        db.query(TutorLeaderboard).filter(
            TutorLeaderboard.institution_id == institution_id,
            TutorLeaderboard.period == period
        ).delete()
        
        leaderboard_entries = []
        for rank, (tutor_id, score, sessions, minutes, rating) in enumerate(scored_tutors, 1):
            entry = TutorLeaderboard(
                institution_id=institution_id,
                tutor_id=tutor_id,
                rank=rank,
                score=score,
                period=period,
                period_start=period_start,
                period_end=period_end,
                sessions_count=sessions or 0,
                total_hours=Decimal(minutes or 0) / Decimal(60),
                average_rating=Decimal(str(rating or 0))
            )
            db.add(entry)
            leaderboard_entries.append(entry)
        
        db.commit()
        return leaderboard_entries
    
    @staticmethod
    def create_matching_preference(
        db: Session,
        institution_id: int,
        preference_data: MatchingPreferenceCreate
    ) -> MatchingPreference:
        student = db.query(Student).filter(
            Student.id == preference_data.student_id,
            Student.institution_id == institution_id
        ).first()
        if not student:
            raise ValueError("Student not found")

        preference = MatchingPreference(
            institution_id=institution_id,
            student_id=preference_data.student_id,
            preferred_subjects=preference_data.preferred_subjects,
            preferred_tutors=preference_data.preferred_tutors,
            blocked_tutors=preference_data.blocked_tutors,
            learning_style=preference_data.learning_style,
            preferred_session_duration=preference_data.preferred_session_duration,
            preferred_times=preference_data.preferred_times,
            language_preference=preference_data.language_preference,
            special_requirements=preference_data.special_requirements,
            auto_match=preference_data.auto_match
        )
        db.add(preference)
        db.commit()
        db.refresh(preference)
        return preference
    
    @staticmethod
    def update_matching_preference(
        db: Session,
        preference_id: int,
        preference_data: MatchingPreferenceUpdate
    ) -> Optional[MatchingPreference]:
        preference = db.query(MatchingPreference).filter(
            MatchingPreference.id == preference_id
        ).first()
        if not preference:
            return None
        
        update_data = preference_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(preference, field, value)
        
        db.commit()
        db.refresh(preference)
        return preference
    
    @staticmethod
    def match_tutors(
        db: Session,
        institution_id: int,
        match_request: TutorMatchRequest
    ) -> List[TutorMatchScore]:
        preference = db.query(MatchingPreference).filter(
            MatchingPreference.student_id == match_request.student_id,
            MatchingPreference.institution_id == institution_id
        ).first()
        
        query = db.query(TutorProfile).filter(
            TutorProfile.institution_id == institution_id,
            TutorProfile.status == TutorStatus.ACTIVE
        )
        
        if preference and preference.blocked_tutors:
            query = query.filter(~TutorProfile.id.in_(preference.blocked_tutors))
        
        tutors = query.all()
        
        matches = []
        for tutor in tutors:
            score_data = PeerTutoringService._calculate_match_score(
                tutor, match_request, preference
            )
            
            if score_data['match_score'] > 0:
                user = db.query(User).filter(User.id == tutor.user_id).first()
                tutor_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
                
                matches.append(TutorMatchScore(
                    tutor_id=tutor.id,
                    tutor_name=tutor_name,
                    match_score=score_data['match_score'],
                    subject_expertise=score_data['subject_expertise'],
                    availability_score=score_data['availability_score'],
                    rating_score=score_data['rating_score'],
                    compatibility_score=score_data['compatibility_score'],
                    total_sessions=tutor.total_sessions,
                    average_rating=tutor.average_rating,
                    reasons=score_data['reasons']
                ))
        
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches[:10]
    
    @staticmethod
    def _calculate_match_score(
        tutor: TutorProfile,
        match_request: TutorMatchRequest,
        preference: Optional[MatchingPreference]
    ) -> Dict[str, Any]:
        reasons = []
        
        subject_expertise = 0.0
        if tutor.subjects and str(match_request.subject_id) in tutor.subjects:
            subject_level = tutor.subjects.get(str(match_request.subject_id), {})
            if isinstance(subject_level, dict):
                subject_expertise = subject_level.get('level', 5) / 10.0
            else:
                subject_expertise = 0.7
            reasons.append(f"Subject expertise level: {subject_expertise * 100:.0f}%")
        else:
            return {
                'match_score': 0,
                'subject_expertise': 0,
                'availability_score': 0,
                'rating_score': 0,
                'compatibility_score': 0,
                'reasons': ["Subject not available"]
            }
        
        availability_score = 0.0
        if tutor.availability and match_request.preferred_time:
            day_of_week = match_request.preferred_time.strftime('%A').lower()
            if day_of_week in tutor.availability:
                availability_score = 1.0
                reasons.append("Available at preferred time")
            else:
                availability_score = 0.5
                reasons.append("Flexible schedule available")
        else:
            availability_score = 0.7
        
        rating_score = float(tutor.average_rating) / 5.0 if tutor.average_rating else 0.5
        if tutor.total_reviews > 10:
            reasons.append(f"Highly rated ({tutor.average_rating}/5) with {tutor.total_reviews} reviews")
        elif tutor.total_reviews > 0:
            reasons.append(f"Rated {tutor.average_rating}/5")
        
        compatibility_score = 0.7
        if preference:
            if preference.preferred_tutors and tutor.id in preference.preferred_tutors:
                compatibility_score = 1.0
                reasons.append("Previously preferred tutor")
            
            if preference.language_preference and tutor.languages:
                if preference.language_preference in tutor.languages:
                    compatibility_score = min(compatibility_score + 0.2, 1.0)
                    reasons.append("Language match")
        
        if tutor.verification_status:
            compatibility_score = min(compatibility_score + 0.1, 1.0)
            reasons.append("Verified tutor")
        
        match_score = (
            subject_expertise * 0.4 +
            availability_score * 0.25 +
            rating_score * 0.25 +
            compatibility_score * 0.1
        )
        
        return {
            'match_score': round(match_score, 2),
            'subject_expertise': round(subject_expertise, 2),
            'availability_score': round(availability_score, 2),
            'rating_score': round(rating_score, 2),
            'compatibility_score': round(compatibility_score, 2),
            'reasons': reasons
        }
    
    @staticmethod
    def _calculate_session_points(session: TutoringSession) -> int:
        base_points = 10
        
        duration_bonus = (session.duration_minutes or 0) // 15
        
        quality_bonus = 0
        if session.materials_shared:
            quality_bonus += 5
        
        if session.tutor_notes:
            quality_bonus += 3
        
        return base_points + duration_bonus + quality_bonus
    
    @staticmethod
    def _award_points(
        db: Session,
        tutor: TutorProfile,
        points: int,
        session_id: Optional[int],
        reason: str
    ) -> None:
        tutor.total_points += points
        
        new_level = (tutor.total_points // 100) + 1
        if new_level > tutor.level:
            tutor.level = new_level
        
        history = TutorPointHistory(
            institution_id=tutor.institution_id,
            tutor_id=tutor.id,
            session_id=session_id,
            points=points,
            reason=reason,
            description=f"Earned {points} points for {reason}"
        )
        db.add(history)
    
    @staticmethod
    def _check_and_award_badges(db: Session, tutor: TutorProfile) -> None:
        badges_to_award = []
        
        if tutor.completed_sessions == 10:
            badges_to_award.append({
                'name': 'First 10 Sessions',
                'description': 'Completed 10 tutoring sessions',
                'category': BadgeCategory.SESSION_COUNT,
                'points_value': 50,
                'rarity': 'common'
            })
        elif tutor.completed_sessions == 50:
            badges_to_award.append({
                'name': 'Experienced Tutor',
                'description': 'Completed 50 tutoring sessions',
                'category': BadgeCategory.SESSION_COUNT,
                'points_value': 200,
                'rarity': 'rare'
            })
        elif tutor.completed_sessions == 100:
            badges_to_award.append({
                'name': 'Master Tutor',
                'description': 'Completed 100 tutoring sessions',
                'category': BadgeCategory.SESSION_COUNT,
                'points_value': 500,
                'rarity': 'epic'
            })
        
        if tutor.average_rating >= Decimal('4.5') and tutor.total_reviews >= 10:
            existing = db.query(TutorBadge).filter(
                TutorBadge.tutor_id == tutor.id,
                TutorBadge.name == 'Excellence Award'
            ).first()
            if not existing:
                badges_to_award.append({
                    'name': 'Excellence Award',
                    'description': 'Maintained 4.5+ rating with 10+ reviews',
                    'category': BadgeCategory.RATING,
                    'points_value': 300,
                    'rarity': 'epic'
                })
        
        if tutor.current_streak >= 7:
            existing = db.query(TutorBadge).filter(
                TutorBadge.tutor_id == tutor.id,
                TutorBadge.name == 'Weekly Warrior'
            ).first()
            if not existing:
                badges_to_award.append({
                    'name': 'Weekly Warrior',
                    'description': '7-day session streak',
                    'category': BadgeCategory.STREAK,
                    'points_value': 100,
                    'rarity': 'rare'
                })
        
        for badge_data in badges_to_award:
            badge = TutorBadge(
                institution_id=tutor.institution_id,
                tutor_id=tutor.id,
                **badge_data
            )
            db.add(badge)
            tutor.total_points += badge_data['points_value']
    
    @staticmethod
    def _check_and_award_incentives(db: Session, tutor: TutorProfile) -> None:
        service_hours_threshold = Decimal('20')
        if tutor.total_hours_tutored >= service_hours_threshold:
            existing = db.query(TutorIncentive).filter(
                TutorIncentive.tutor_id == tutor.id,
                TutorIncentive.incentive_type == IncentiveType.SERVICE_HOURS,
                TutorIncentive.service_hours >= service_hours_threshold
            ).first()
            
            if not existing:
                incentive = TutorIncentive(
                    institution_id=tutor.institution_id,
                    tutor_id=tutor.id,
                    incentive_type=IncentiveType.SERVICE_HOURS,
                    title='20 Hours Service Award',
                    description='Recognized for 20+ hours of peer tutoring service',
                    service_hours=tutor.total_hours_tutored,
                    requirements_met={'hours': str(tutor.total_hours_tutored)}
                )
                db.add(incentive)
        
        if tutor.completed_sessions >= 50 and tutor.average_rating >= Decimal('4.0'):
            existing = db.query(TutorIncentive).filter(
                TutorIncentive.tutor_id == tutor.id,
                TutorIncentive.incentive_type == IncentiveType.CERTIFICATE
            ).first()
            
            if not existing:
                incentive = TutorIncentive(
                    institution_id=tutor.institution_id,
                    tutor_id=tutor.id,
                    incentive_type=IncentiveType.CERTIFICATE,
                    title='Outstanding Peer Tutor Certificate',
                    description='Certificate of Excellence in Peer Tutoring',
                    requirements_met={
                        'sessions': tutor.completed_sessions,
                        'rating': str(tutor.average_rating)
                    }
                )
                db.add(incentive)
        
        top_tutors = db.query(TutorProfile).filter(
            TutorProfile.institution_id == tutor.institution_id,
            TutorProfile.status == TutorStatus.ACTIVE
        ).order_by(desc(TutorProfile.total_points)).limit(5).all()
        
        if tutor in top_tutors:
            existing = db.query(TutorIncentive).filter(
                TutorIncentive.tutor_id == tutor.id,
                TutorIncentive.incentive_type == IncentiveType.PRIORITY_REGISTRATION
            ).first()
            
            if not existing:
                incentive = TutorIncentive(
                    institution_id=tutor.institution_id,
                    tutor_id=tutor.id,
                    incentive_type=IncentiveType.PRIORITY_REGISTRATION,
                    title='Priority Course Registration',
                    description='Early access to course registration as a top tutor',
                    valid_from=datetime.utcnow(),
                    valid_until=datetime.utcnow() + timedelta(days=180),
                    requirements_met={'rank': top_tutors.index(tutor) + 1}
                )
                db.add(incentive)
