from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.models.quiz import QuizLeaderboard, QuizAttempt, Quiz
from src.models.user import User
from src.services.realtime_service import realtime_service
import asyncio
import logging

logger = logging.getLogger(__name__)


class QuizRealtimeService:
    @staticmethod
    async def update_and_broadcast_leaderboard(
        db: Session,
        quiz_id: int,
        user_id: int,
        score: float,
        percentage: float,
        time_seconds: int
    ):
        try:
            quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
            if not quiz or not quiz.enable_leaderboard:
                return
            
            leaderboard_entry = db.query(QuizLeaderboard).filter(
                QuizLeaderboard.quiz_id == quiz_id,
                QuizLeaderboard.user_id == user_id
            ).first()
            
            if leaderboard_entry:
                if score > leaderboard_entry.best_score:
                    leaderboard_entry.best_score = score
                    leaderboard_entry.best_percentage = percentage
                    leaderboard_entry.best_time_seconds = time_seconds
                leaderboard_entry.total_attempts += 1
            else:
                leaderboard_entry = QuizLeaderboard(
                    quiz_id=quiz_id,
                    user_id=user_id,
                    best_score=score,
                    best_percentage=percentage,
                    best_time_seconds=time_seconds,
                    total_attempts=1
                )
                db.add(leaderboard_entry)
            
            db.commit()
            
            leaderboard_data = QuizRealtimeService._get_leaderboard_data(db, quiz_id)
            
            await realtime_service.update_quiz_leaderboard(
                db=db,
                quiz_id=quiz_id,
                leaderboard_data=leaderboard_data
            )
            
        except Exception as e:
            logger.error(f"Error updating quiz leaderboard: {str(e)}")
            db.rollback()

    @staticmethod
    def _get_leaderboard_data(db: Session, quiz_id: int, limit: int = 10) -> List[dict]:
        entries = db.query(
            QuizLeaderboard,
            User.full_name,
            User.email
        ).join(
            User, QuizLeaderboard.user_id == User.id
        ).filter(
            QuizLeaderboard.quiz_id == quiz_id
        ).order_by(
            desc(QuizLeaderboard.best_score),
            QuizLeaderboard.best_time_seconds
        ).limit(limit).all()
        
        leaderboard_data = []
        for rank, (entry, user_name, user_email) in enumerate(entries, start=1):
            entry.rank = rank
            leaderboard_data.append({
                "rank": rank,
                "user_id": entry.user_id,
                "user_name": user_name or user_email,
                "best_score": entry.best_score,
                "best_percentage": entry.best_percentage,
                "best_time_seconds": entry.best_time_seconds,
                "total_attempts": entry.total_attempts
            })
        
        db.commit()
        return leaderboard_data

    @staticmethod
    def trigger_leaderboard_update(db: Session, quiz_id: int, user_id: int, attempt_id: int):
        try:
            attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
            if attempt and attempt.status == "completed":
                asyncio.create_task(
                    QuizRealtimeService.update_and_broadcast_leaderboard(
                        db=db,
                        quiz_id=quiz_id,
                        user_id=user_id,
                        score=attempt.score,
                        percentage=attempt.percentage,
                        time_seconds=attempt.time_taken_seconds
                    )
                )
        except Exception as e:
            logger.error(f"Error triggering leaderboard update: {str(e)}")


quiz_realtime_service = QuizRealtimeService()
