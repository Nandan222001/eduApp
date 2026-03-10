from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from src.models.gamification import (
    Badge, UserBadge, UserPoints, PointHistory,
    Achievement, UserAchievement, Leaderboard, LeaderboardEntry,
    StreakTracker
)


class GamificationRepository:
    
    @staticmethod
    def create_badge(db: Session, badge: Badge) -> Badge:
        db.add(badge)
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def get_badge_by_id(db: Session, badge_id: int) -> Optional[Badge]:
        return db.query(Badge).filter(Badge.id == badge_id).first()
    
    @staticmethod
    def get_badges_by_institution(
        db: Session, 
        institution_id: int, 
        is_active: bool = True,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Badge]:
        query = db.query(Badge).filter(Badge.institution_id == institution_id)
        if is_active is not None:
            query = query.filter(Badge.is_active == is_active)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_badge(db: Session, badge: Badge) -> Badge:
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def award_user_badge(db: Session, user_badge: UserBadge) -> UserBadge:
        db.add(user_badge)
        db.commit()
        db.refresh(user_badge)
        return user_badge
    
    @staticmethod
    def get_user_badges(db: Session, user_id: int, institution_id: int) -> List[UserBadge]:
        return db.query(UserBadge).filter(
            UserBadge.user_id == user_id,
            UserBadge.institution_id == institution_id
        ).order_by(desc(UserBadge.earned_at)).all()
    
    @staticmethod
    def get_user_points(db: Session, user_id: int, institution_id: int) -> Optional[UserPoints]:
        return db.query(UserPoints).filter(
            UserPoints.user_id == user_id,
            UserPoints.institution_id == institution_id
        ).first()
    
    @staticmethod
    def create_user_points(db: Session, user_points: UserPoints) -> UserPoints:
        db.add(user_points)
        db.commit()
        db.refresh(user_points)
        return user_points
    
    @staticmethod
    def update_user_points(db: Session, user_points: UserPoints) -> UserPoints:
        db.commit()
        db.refresh(user_points)
        return user_points
    
    @staticmethod
    def add_point_history(db: Session, point_history: PointHistory) -> PointHistory:
        db.add(point_history)
        db.commit()
        db.refresh(point_history)
        return point_history
    
    @staticmethod
    def get_point_history(
        db: Session, 
        user_points_id: int, 
        limit: int = 50
    ) -> List[PointHistory]:
        return db.query(PointHistory).filter(
            PointHistory.user_points_id == user_points_id
        ).order_by(desc(PointHistory.created_at)).limit(limit).all()
    
    @staticmethod
    def create_achievement(db: Session, achievement: Achievement) -> Achievement:
        db.add(achievement)
        db.commit()
        db.refresh(achievement)
        return achievement
    
    @staticmethod
    def get_achievements_by_institution(
        db: Session,
        institution_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Achievement]:
        return db.query(Achievement).filter(
            Achievement.institution_id == institution_id,
            Achievement.is_active == True
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_achievement_by_id(db: Session, achievement_id: int) -> Optional[Achievement]:
        return db.query(Achievement).filter(Achievement.id == achievement_id).first()
    
    @staticmethod
    def create_user_achievement(db: Session, user_achievement: UserAchievement) -> UserAchievement:
        db.add(user_achievement)
        db.commit()
        db.refresh(user_achievement)
        return user_achievement
    
    @staticmethod
    def get_user_achievements(db: Session, user_id: int, institution_id: int) -> List[UserAchievement]:
        return db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id,
            UserAchievement.institution_id == institution_id
        ).order_by(desc(UserAchievement.updated_at)).all()
    
    @staticmethod
    def update_user_achievement(db: Session, user_achievement: UserAchievement) -> UserAchievement:
        db.commit()
        db.refresh(user_achievement)
        return user_achievement
    
    @staticmethod
    def create_leaderboard(db: Session, leaderboard: Leaderboard) -> Leaderboard:
        db.add(leaderboard)
        db.commit()
        db.refresh(leaderboard)
        return leaderboard
    
    @staticmethod
    def get_leaderboards_by_institution(db: Session, institution_id: int) -> List[Leaderboard]:
        return db.query(Leaderboard).filter(
            Leaderboard.institution_id == institution_id,
            Leaderboard.is_active == True
        ).all()
    
    @staticmethod
    def get_leaderboard_by_id(db: Session, leaderboard_id: int) -> Optional[Leaderboard]:
        return db.query(Leaderboard).filter(Leaderboard.id == leaderboard_id).first()
    
    @staticmethod
    def update_leaderboard(db: Session, leaderboard: Leaderboard) -> Leaderboard:
        db.commit()
        db.refresh(leaderboard)
        return leaderboard
    
    @staticmethod
    def create_leaderboard_entry(db: Session, entry: LeaderboardEntry) -> LeaderboardEntry:
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    
    @staticmethod
    def get_leaderboard_entries(db: Session, leaderboard_id: int) -> List[LeaderboardEntry]:
        return db.query(LeaderboardEntry).filter(
            LeaderboardEntry.leaderboard_id == leaderboard_id
        ).order_by(LeaderboardEntry.rank).all()
    
    @staticmethod
    def delete_leaderboard_entries(db: Session, leaderboard_id: int) -> None:
        db.query(LeaderboardEntry).filter(
            LeaderboardEntry.leaderboard_id == leaderboard_id
        ).delete()
        db.commit()
    
    @staticmethod
    def get_or_create_streak_tracker(
        db: Session,
        user_id: int,
        institution_id: int,
        streak_type: str
    ) -> StreakTracker:
        streak = db.query(StreakTracker).filter(
            StreakTracker.user_id == user_id,
            StreakTracker.institution_id == institution_id,
            StreakTracker.streak_type == streak_type
        ).first()
        
        if not streak:
            streak = StreakTracker(
                institution_id=institution_id,
                user_id=user_id,
                streak_type=streak_type,
                current_streak=0,
                longest_streak=0
            )
            db.add(streak)
            db.commit()
            db.refresh(streak)
        
        return streak
    
    @staticmethod
    def update_streak_tracker(db: Session, streak: StreakTracker) -> StreakTracker:
        db.commit()
        db.refresh(streak)
        return streak
    
    @staticmethod
    def get_user_streaks(db: Session, user_id: int, institution_id: int) -> List[StreakTracker]:
        return db.query(StreakTracker).filter(
            StreakTracker.user_id == user_id,
            StreakTracker.institution_id == institution_id
        ).all()
