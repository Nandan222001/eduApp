from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, distinct
from fastapi import HTTPException, status

from src.models.peer_recognition import (
    PeerRecognition, RecognitionLike, RecognitionBadge, 
    DailyRecognitionLimit, RecognitionNotification, RecognitionAnalytics,
    RecognitionType
)
from src.models.student import Student
from src.models.notification import Notification, NotificationPriority, NotificationGroup
from src.models.gamification import UserPoints, PointHistory, PointEventType
from src.schemas.peer_recognition import (
    PeerRecognitionCreate, PeerRecognitionResponse,
    PeerRecognitionWithStudents, RecognitionBadgeResponse,
    DailyRecognitionLimitResponse, AppreciationWallResponse,
    TrendingRecognitionResponse, RecognitionAnalyticsResponse,
    PositivityIndexResponse, MostRecognizedStudentsResponse,
    RecognitionStatsResponse
)


class PeerRecognitionService:
    
    BADGE_LEVELS = {
        'bronze': {'min': 5, 'max': 9, 'points': 50},
        'silver': {'min': 10, 'max': 24, 'points': 100},
        'gold': {'min': 25, 'max': 49, 'points': 200},
        'platinum': {'min': 50, 'max': 99, 'points': 300},
        'diamond': {'min': 100, 'max': float('inf'), 'points': 500}
    }
    
    RECOGNITION_POINTS = {
        RecognitionType.KINDNESS: 10,
        RecognitionType.ACADEMIC_HELP: 15,
        RecognitionType.TEAMWORK: 12,
        RecognitionType.LEADERSHIP: 20,
        RecognitionType.CREATIVITY: 15,
        RecognitionType.PERSEVERANCE: 18,
        RecognitionType.SPORTSMANSHIP: 12
    }
    
    @staticmethod
    def check_daily_limit(db: Session, institution_id: int, student_id: int) -> Tuple[bool, int]:
        today = date.today()
        limit_record = db.query(DailyRecognitionLimit).filter(
            DailyRecognitionLimit.institution_id == institution_id,
            DailyRecognitionLimit.student_id == student_id,
            DailyRecognitionLimit.limit_date == today
        ).first()
        
        if not limit_record:
            limit_record = DailyRecognitionLimit(
                institution_id=institution_id,
                student_id=student_id,
                limit_date=today,
                recognitions_sent=0,
                max_daily_limit=10
            )
            db.add(limit_record)
            db.commit()
            db.refresh(limit_record)
        
        remaining = limit_record.max_daily_limit - limit_record.recognitions_sent
        can_send = limit_record.recognitions_sent < limit_record.max_daily_limit
        
        return can_send, remaining
    
    @staticmethod
    def increment_daily_limit(db: Session, institution_id: int, student_id: int) -> None:
        today = date.today()
        limit_record = db.query(DailyRecognitionLimit).filter(
            DailyRecognitionLimit.institution_id == institution_id,
            DailyRecognitionLimit.student_id == student_id,
            DailyRecognitionLimit.limit_date == today
        ).first()
        
        if limit_record:
            limit_record.recognitions_sent += 1
            db.commit()
    
    @staticmethod
    def create_recognition(
        db: Session,
        institution_id: int,
        from_student_id: int,
        recognition_data: PeerRecognitionCreate
    ) -> PeerRecognition:
        if from_student_id == recognition_data.to_student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send recognition to yourself"
            )
        
        can_send, remaining = PeerRecognitionService.check_daily_limit(
            db, institution_id, from_student_id
        )
        
        if not can_send:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily recognition limit reached. Try again tomorrow."
            )
        
        to_student = db.query(Student).filter(
            Student.id == recognition_data.to_student_id,
            Student.institution_id == institution_id
        ).first()
        
        if not to_student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient student not found"
            )
        
        recognition = PeerRecognition(
            institution_id=institution_id,
            from_student_id=from_student_id,
            to_student_id=recognition_data.to_student_id,
            recognition_type=recognition_data.recognition_type,
            message=recognition_data.message,
            is_public=recognition_data.is_public,
            created_date=date.today()
        )
        
        db.add(recognition)
        db.commit()
        db.refresh(recognition)
        
        PeerRecognitionService.increment_daily_limit(db, institution_id, from_student_id)
        
        PeerRecognitionService.award_points(db, institution_id, recognition)
        
        PeerRecognitionService.check_and_award_badges(
            db, institution_id, recognition_data.to_student_id, recognition_data.recognition_type
        )
        
        PeerRecognitionService.create_notification(db, recognition)
        
        return recognition
    
    @staticmethod
    def award_points(db: Session, institution_id: int, recognition: PeerRecognition) -> None:
        points = PeerRecognitionService.RECOGNITION_POINTS.get(recognition.recognition_type, 10)
        
        user_points = db.query(UserPoints).filter(
            UserPoints.institution_id == institution_id,
            UserPoints.user_id == recognition.to_student.user_id
        ).first() if recognition.to_student.user_id else None
        
        if user_points:
            user_points.total_points += points
            user_points.experience_points += points
            user_points.last_activity_date = datetime.utcnow()
            
            level_threshold = 500
            new_level = (user_points.experience_points // level_threshold) + 1
            if new_level > user_points.level:
                user_points.level = new_level
            
            point_history = PointHistory(
                institution_id=institution_id,
                user_points_id=user_points.id,
                event_type=PointEventType.SOCIAL,
                points=points,
                description=f"Received {recognition.recognition_type.value} recognition",
                reference_id=recognition.id,
                reference_type="peer_recognition",
                metadata_json={
                    "recognition_type": recognition.recognition_type.value,
                    "from_student_id": recognition.from_student_id
                }
            )
            db.add(point_history)
            db.commit()
    
    @staticmethod
    def check_and_award_badges(
        db: Session, 
        institution_id: int, 
        student_id: int, 
        recognition_type: RecognitionType
    ) -> Optional[RecognitionBadge]:
        count = db.query(func.count(PeerRecognition.id)).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.to_student_id == student_id,
            PeerRecognition.recognition_type == recognition_type
        ).scalar()
        
        badge_level = None
        points = 0
        
        for level, config in PeerRecognitionService.BADGE_LEVELS.items():
            if config['min'] <= count <= config['max']:
                badge_level = level
                points = config['points']
                break
        
        if badge_level and count in [5, 10, 25, 50, 100]:
            existing_badge = db.query(RecognitionBadge).filter(
                RecognitionBadge.institution_id == institution_id,
                RecognitionBadge.student_id == student_id,
                RecognitionBadge.recognition_type == recognition_type,
                RecognitionBadge.badge_level == badge_level
            ).first()
            
            if not existing_badge:
                badge = RecognitionBadge(
                    institution_id=institution_id,
                    student_id=student_id,
                    recognition_type=recognition_type,
                    badge_level=badge_level,
                    recognitions_count=count,
                    points_awarded=points
                )
                db.add(badge)
                db.commit()
                db.refresh(badge)
                
                return badge
        
        return None
    
    @staticmethod
    def create_notification(db: Session, recognition: PeerRecognition) -> None:
        if not recognition.to_student.user_id:
            return
        
        from_student = db.query(Student).filter(Student.id == recognition.from_student_id).first()
        from_name = f"{from_student.first_name} {from_student.last_name}" if from_student else "A peer"
        
        notification = Notification(
            institution_id=recognition.institution_id,
            user_id=recognition.to_student.user_id,
            title="🌟 You received a recognition!",
            message=f"{from_name} recognized you for {recognition.recognition_type.value.replace('_', ' ')}: {recognition.message}",
            notification_type="peer_recognition",
            notification_group=NotificationGroup.SOCIAL.value,
            priority=NotificationPriority.MEDIUM.value,
            channel="in_app",
            status="sent",
            data={
                "recognition_id": recognition.id,
                "recognition_type": recognition.recognition_type.value,
                "from_student_id": recognition.from_student_id
            }
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        recognition_notification = RecognitionNotification(
            recognition_id=recognition.id,
            notification_id=notification.id,
            is_sent=True,
            sent_at=datetime.utcnow()
        )
        db.add(recognition_notification)
        db.commit()
    
    @staticmethod
    def get_received_recognitions(
        db: Session,
        institution_id: int,
        student_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[PeerRecognition]:
        recognitions = db.query(PeerRecognition).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.to_student_id == student_id
        ).order_by(desc(PeerRecognition.created_at)).offset(skip).limit(limit).all()
        
        return recognitions
    
    @staticmethod
    def get_appreciation_wall(
        db: Session,
        institution_id: int,
        page: int = 1,
        page_size: int = 20,
        current_student_id: Optional[int] = None
    ) -> AppreciationWallResponse:
        skip = (page - 1) * page_size
        
        query = db.query(PeerRecognition).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.is_public == True
        )
        
        total_count = query.count()
        
        recognitions = query.order_by(
            desc(PeerRecognition.created_at)
        ).offset(skip).limit(page_size).all()
        
        recognition_responses = []
        for recognition in recognitions:
            from_student = db.query(Student).filter(Student.id == recognition.from_student_id).first()
            to_student = db.query(Student).filter(Student.id == recognition.to_student_id).first()
            
            is_liked = False
            if current_student_id:
                is_liked = db.query(RecognitionLike).filter(
                    RecognitionLike.recognition_id == recognition.id,
                    RecognitionLike.student_id == current_student_id
                ).first() is not None
            
            recognition_dict = {
                **recognition.__dict__,
                'from_student_name': f"{from_student.first_name} {from_student.last_name}" if from_student else None,
                'to_student_name': f"{to_student.first_name} {to_student.last_name}" if to_student else None,
                'is_liked_by_current_user': is_liked,
                'from_student': {
                    'id': from_student.id,
                    'first_name': from_student.first_name,
                    'last_name': from_student.last_name,
                    'photo_url': from_student.photo_url
                } if from_student else None,
                'to_student': {
                    'id': to_student.id,
                    'first_name': to_student.first_name,
                    'last_name': to_student.last_name,
                    'photo_url': to_student.photo_url
                } if to_student else None
            }
            
            recognition_responses.append(PeerRecognitionWithStudents(**recognition_dict))
        
        has_more = (skip + page_size) < total_count
        
        return AppreciationWallResponse(
            recognitions=recognition_responses,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_more=has_more
        )
    
    @staticmethod
    def toggle_like(
        db: Session,
        recognition_id: int,
        student_id: int,
        institution_id: Optional[int] = None
    ) -> Dict[str, any]:
        query = db.query(PeerRecognition).filter(
            PeerRecognition.id == recognition_id
        )
        if institution_id is not None:
            query = query.filter(PeerRecognition.institution_id == institution_id)
        recognition = query.first()
        
        if not recognition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recognition not found"
            )
        
        existing_like = db.query(RecognitionLike).filter(
            RecognitionLike.recognition_id == recognition_id,
            RecognitionLike.student_id == student_id
        ).first()
        
        if existing_like:
            db.delete(existing_like)
            recognition.likes_count = max(0, recognition.likes_count - 1)
            db.commit()
            return {"liked": False, "likes_count": recognition.likes_count}
        else:
            like = RecognitionLike(
                recognition_id=recognition_id,
                student_id=student_id
            )
            db.add(like)
            recognition.likes_count += 1
            db.commit()
            return {"liked": True, "likes_count": recognition.likes_count}
    
    @staticmethod
    def get_trending_recognitions(
        db: Session,
        institution_id: int,
        limit: int = 10,
        days: int = 7
    ) -> List[TrendingRecognitionResponse]:
        cutoff_date = date.today() - timedelta(days=days)
        
        recognitions = db.query(PeerRecognition).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.is_public == True,
            PeerRecognition.created_date >= cutoff_date
        ).all()
        
        trending_list = []
        for recognition in recognitions:
            age_days = (date.today() - recognition.created_date).days + 1
            trending_score = (recognition.likes_count * 2 + 1) / (age_days ** 0.5)
            
            from_student = db.query(Student).filter(Student.id == recognition.from_student_id).first()
            to_student = db.query(Student).filter(Student.id == recognition.to_student_id).first()
            
            recognition_dict = {
                **recognition.__dict__,
                'from_student_name': f"{from_student.first_name} {from_student.last_name}" if from_student else None,
                'to_student_name': f"{to_student.first_name} {to_student.last_name}" if to_student else None,
                'is_liked_by_current_user': False,
                'from_student': {
                    'id': from_student.id,
                    'first_name': from_student.first_name,
                    'last_name': from_student.last_name,
                    'photo_url': from_student.photo_url
                } if from_student else None,
                'to_student': {
                    'id': to_student.id,
                    'first_name': to_student.first_name,
                    'last_name': to_student.last_name,
                    'photo_url': to_student.photo_url
                } if to_student else None
            }
            
            trending_list.append(
                TrendingRecognitionResponse(
                    recognition=PeerRecognitionWithStudents(**recognition_dict),
                    trending_score=trending_score
                )
            )
        
        trending_list.sort(key=lambda x: x.trending_score, reverse=True)
        return trending_list[:limit]
    
    @staticmethod
    def calculate_positivity_index(
        db: Session,
        institution_id: int,
        period: str = "week"
    ) -> PositivityIndexResponse:
        if period == "week":
            days = 7
        elif period == "month":
            days = 30
        else:
            days = 1
        
        current_start = date.today() - timedelta(days=days)
        previous_start = current_start - timedelta(days=days)
        
        current_stats = db.query(
            func.count(PeerRecognition.id).label('total'),
            func.count(distinct(PeerRecognition.from_student_id)).label('givers'),
            func.count(distinct(PeerRecognition.to_student_id)).label('receivers')
        ).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.created_date >= current_start
        ).first()
        
        previous_stats = db.query(
            func.count(PeerRecognition.id).label('total')
        ).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.created_date >= previous_start,
            PeerRecognition.created_date < current_start
        ).scalar()
        
        total_recognitions = current_stats.total or 0
        unique_givers = current_stats.givers or 0
        unique_receivers = current_stats.receivers or 0
        unique_participants = len(set([unique_givers, unique_receivers]))
        
        current_index = int((total_recognitions * 10) + (unique_participants * 5))
        previous_index = int((previous_stats or 0) * 10) if previous_stats else None
        
        change_percentage = None
        trend = "stable"
        if previous_index and previous_index > 0:
            change_percentage = ((current_index - previous_index) / previous_index) * 100
            if change_percentage > 5:
                trend = "up"
            elif change_percentage < -5:
                trend = "down"
        
        avg_daily = total_recognitions / days if days > 0 else 0
        
        return PositivityIndexResponse(
            institution_id=institution_id,
            period=period,
            current_index=current_index,
            previous_index=previous_index,
            change_percentage=change_percentage,
            trend=trend,
            total_recognitions=total_recognitions,
            unique_participants=unique_participants,
            average_daily_recognitions=avg_daily
        )
    
    @staticmethod
    def get_most_recognized_students(
        db: Session,
        institution_id: int,
        limit: int = 10,
        days: Optional[int] = None
    ) -> List[MostRecognizedStudentsResponse]:
        query = db.query(
            PeerRecognition.to_student_id,
            func.count(PeerRecognition.id).label('count')
        ).filter(
            PeerRecognition.institution_id == institution_id
        )
        
        if days:
            cutoff_date = date.today() - timedelta(days=days)
            query = query.filter(PeerRecognition.created_date >= cutoff_date)
        
        top_students = query.group_by(
            PeerRecognition.to_student_id
        ).order_by(
            desc('count')
        ).limit(limit).all()
        
        results = []
        for student_id, count in top_students:
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                continue
            
            recognitions_by_type = {}
            for rec_type in RecognitionType:
                type_count = db.query(func.count(PeerRecognition.id)).filter(
                    PeerRecognition.to_student_id == student_id,
                    PeerRecognition.recognition_type == rec_type
                ).scalar()
                if type_count > 0:
                    recognitions_by_type[rec_type.value] = type_count
            
            badges = db.query(RecognitionBadge).filter(
                RecognitionBadge.student_id == student_id,
                RecognitionBadge.institution_id == institution_id
            ).all()
            
            results.append(MostRecognizedStudentsResponse(
                student_id=student_id,
                student_name=f"{student.first_name} {student.last_name}",
                total_recognitions=count,
                recognitions_by_type=recognitions_by_type,
                badges_earned=[RecognitionBadgeResponse.model_validate(badge) for badge in badges]
            ))
        
        return results
    
    @staticmethod
    def get_recognition_stats(
        db: Session,
        institution_id: int,
        student_id: int
    ) -> RecognitionStatsResponse:
        received_count = db.query(func.count(PeerRecognition.id)).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.to_student_id == student_id
        ).scalar()
        
        sent_count = db.query(func.count(PeerRecognition.id)).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.from_student_id == student_id
        ).scalar()
        
        likes_received = db.query(func.sum(PeerRecognition.likes_count)).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.to_student_id == student_id
        ).scalar() or 0
        
        badges = db.query(RecognitionBadge).filter(
            RecognitionBadge.student_id == student_id,
            RecognitionBadge.institution_id == institution_id
        ).all()
        
        received_by_type = {}
        sent_by_type = {}
        
        for rec_type in RecognitionType:
            received_type_count = db.query(func.count(PeerRecognition.id)).filter(
                PeerRecognition.to_student_id == student_id,
                PeerRecognition.recognition_type == rec_type
            ).scalar()
            if received_type_count > 0:
                received_by_type[rec_type.value] = received_type_count
            
            sent_type_count = db.query(func.count(PeerRecognition.id)).filter(
                PeerRecognition.from_student_id == student_id,
                PeerRecognition.recognition_type == rec_type
            ).scalar()
            if sent_type_count > 0:
                sent_by_type[rec_type.value] = sent_type_count
        
        return RecognitionStatsResponse(
            received_count=received_count or 0,
            sent_count=sent_count or 0,
            likes_received=likes_received,
            badges_earned=[RecognitionBadgeResponse.model_validate(badge) for badge in badges],
            received_by_type=received_by_type,
            sent_by_type=sent_by_type
        )
    
    @staticmethod
    def update_analytics(db: Session, institution_id: int, analytics_date: date) -> RecognitionAnalytics:
        recognitions = db.query(PeerRecognition).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.created_date == analytics_date
        ).all()
        
        total_recognitions = len(recognitions)
        unique_givers = len(set([r.from_student_id for r in recognitions]))
        unique_receivers = len(set([r.to_student_id for r in recognitions]))
        total_likes = sum([r.likes_count for r in recognitions])
        
        positivity_index = (total_recognitions * 10) + (unique_givers + unique_receivers) * 5 + total_likes
        
        most_recognized = db.query(
            PeerRecognition.to_student_id,
            func.count(PeerRecognition.id).label('count')
        ).filter(
            PeerRecognition.institution_id == institution_id,
            PeerRecognition.created_date == analytics_date
        ).group_by(
            PeerRecognition.to_student_id
        ).order_by(
            desc('count')
        ).first()
        
        most_recognized_student_id = most_recognized[0] if most_recognized else None
        most_recognized_count = most_recognized[1] if most_recognized else 0
        
        analytics = db.query(RecognitionAnalytics).filter(
            RecognitionAnalytics.institution_id == institution_id,
            RecognitionAnalytics.analytics_date == analytics_date
        ).first()
        
        if analytics:
            analytics.total_recognitions = total_recognitions
            analytics.unique_givers = unique_givers
            analytics.unique_receivers = unique_receivers
            analytics.total_likes = total_likes
            analytics.positivity_index = positivity_index
            analytics.most_recognized_student_id = most_recognized_student_id
            analytics.most_recognized_count = most_recognized_count
        else:
            analytics = RecognitionAnalytics(
                institution_id=institution_id,
                analytics_date=analytics_date,
                total_recognitions=total_recognitions,
                unique_givers=unique_givers,
                unique_receivers=unique_receivers,
                total_likes=total_likes,
                positivity_index=positivity_index,
                most_recognized_student_id=most_recognized_student_id,
                most_recognized_count=most_recognized_count
            )
            db.add(analytics)
        
        db.commit()
        db.refresh(analytics)
        return analytics
