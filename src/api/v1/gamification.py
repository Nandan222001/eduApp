from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.gamification_service import GamificationService
from src.schemas.gamification import (
    BadgeCreate, BadgeUpdate, BadgeResponse, UserBadgeResponse,
    AwardBadgeRequest, UserPointsResponse, PointHistoryResponse,
    AddPointsRequest, LeaderboardResponse, UserGamificationStats,
    AchievementCreate, AchievementUpdate, AchievementResponse,
    UserAchievementResponse, LeaderboardCreate, LeaderboardUpdate,
    LeaderboardDBResponse, LeaderboardWithEntriesResponse,
    StreakTrackerResponse, UserShowcaseResponse, PointsCalculationResult
)
from src.models.gamification import BadgeType, AchievementType

router = APIRouter()


@router.post("/badges", response_model=BadgeResponse, status_code=status.HTTP_201_CREATED)
def create_badge(
    badge: BadgeCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.create_badge(db, institution_id, badge)


@router.get("/badges", response_model=List[BadgeResponse])
def list_badges(
    institution_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return GamificationService.get_badges(db, institution_id, skip, limit)


@router.get("/badges/{badge_id}", response_model=BadgeResponse)
def get_badge(
    badge_id: int,
    db: Session = Depends(get_db)
):
    badge = GamificationService.get_badge(db, badge_id)
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    return badge


@router.put("/badges/{badge_id}", response_model=BadgeResponse)
def update_badge(
    badge_id: int,
    badge: BadgeUpdate,
    db: Session = Depends(get_db)
):
    updated_badge = GamificationService.update_badge(db, badge_id, badge)
    if not updated_badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    return updated_badge


@router.post("/badges/award", response_model=UserBadgeResponse, status_code=status.HTTP_201_CREATED)
def award_badge(
    award_data: AwardBadgeRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.award_badge(db, institution_id, award_data)


@router.get("/users/{user_id}/badges", response_model=List[UserBadgeResponse])
def get_user_badges(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.get_user_badges(db, user_id, institution_id)


@router.get("/users/{user_id}/points", response_model=UserPointsResponse)
def get_user_points(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.get_or_create_user_points(db, user_id, institution_id)


@router.post("/points/add", response_model=PointsCalculationResult)
def add_points(
    points_data: AddPointsRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.add_points(db, institution_id, points_data)


@router.get("/users/{user_id}/point-history", response_model=List[PointHistoryResponse])
def get_point_history(
    user_id: int,
    institution_id: int = Query(...),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    return GamificationService.get_point_history(db, user_id, institution_id, limit)


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    institution_id: int = Query(...),
    limit: int = Query(50, ge=1, le=100),
    current_user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return GamificationService.get_leaderboard(db, institution_id, limit, current_user_id)


@router.get("/users/{user_id}/stats", response_model=UserGamificationStats)
def get_user_stats(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
    user_badges = GamificationService.get_user_badges(db, user_id, institution_id)
    point_history = GamificationService.get_point_history(db, user_id, institution_id, 10)
    
    badges_by_type = {}
    for badge_type in BadgeType:
        badges_by_type[badge_type.value] = sum(
            1 for ub in user_badges if ub.badge.badge_type == badge_type
        )
    
    return UserGamificationStats(
        user_id=user_id,
        total_points=user_points.total_points,
        level=user_points.level,
        current_streak=user_points.current_streak,
        longest_streak=user_points.longest_streak,
        total_badges=len(user_badges),
        badges_by_type=badges_by_type,
        recent_achievements=user_badges[:5],
        point_history=point_history
    )


@router.post("/achievements", response_model=AchievementResponse, status_code=status.HTTP_201_CREATED)
def create_achievement(
    achievement: AchievementCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.create_achievement(db, institution_id, achievement)


@router.get("/achievements", response_model=List[AchievementResponse])
def list_achievements(
    institution_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return GamificationService.get_achievements(db, institution_id, skip, limit)


@router.get("/users/{user_id}/achievements", response_model=List[UserAchievementResponse])
def get_user_achievements(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.get_user_achievements(db, user_id, institution_id)


@router.post("/leaderboards", response_model=LeaderboardDBResponse, status_code=status.HTTP_201_CREATED)
def create_leaderboard(
    leaderboard: LeaderboardCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.create_leaderboard(db, institution_id, leaderboard)


@router.get("/leaderboards", response_model=List[LeaderboardDBResponse])
def list_leaderboards(
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return GamificationService.get_leaderboards(db, institution_id)


@router.get("/leaderboards/{leaderboard_id}", response_model=LeaderboardWithEntriesResponse)
def get_leaderboard_with_entries(
    leaderboard_id: int,
    db: Session = Depends(get_db)
):
    from src.models.gamification import Leaderboard
    leaderboard = db.query(Leaderboard).filter(Leaderboard.id == leaderboard_id).first()
    if not leaderboard:
        raise HTTPException(status_code=404, detail="Leaderboard not found")
    return leaderboard


@router.put("/leaderboards/{leaderboard_id}", response_model=LeaderboardDBResponse)
def update_leaderboard(
    leaderboard_id: int,
    leaderboard: LeaderboardUpdate,
    db: Session = Depends(get_db)
):
    updated_leaderboard = GamificationService.update_leaderboard(db, leaderboard_id, leaderboard)
    if not updated_leaderboard:
        raise HTTPException(status_code=404, detail="Leaderboard not found")
    return updated_leaderboard


@router.post("/leaderboards/{leaderboard_id}/regenerate", status_code=status.HTTP_200_OK)
def regenerate_leaderboard(
    leaderboard_id: int,
    db: Session = Depends(get_db)
):
    entries = GamificationService.regenerate_leaderboard_entries(db, leaderboard_id)
    return {"message": "Leaderboard regenerated successfully", "entries_count": len(entries)}


@router.get("/users/{user_id}/showcase", response_model=UserShowcaseResponse)
def get_user_showcase(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    from src.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
    user_badges = GamificationService.get_user_badges(db, user_id, institution_id)
    user_achievements = GamificationService.get_user_achievements(db, user_id, institution_id)
    recent_activities = GamificationService.get_point_history(db, user_id, institution_id, 20)
    
    leaderboard_data = GamificationService.get_leaderboard(db, institution_id, 100, user_id)
    
    return UserShowcaseResponse(
        user_id=user_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        total_points=user_points.total_points,
        level=user_points.level,
        current_streak=user_points.current_streak,
        longest_streak=user_points.longest_streak,
        badges=user_badges[:10],
        achievements=user_achievements[:10],
        recent_activities=recent_activities,
        rank=leaderboard_data.current_user_rank
    )


@router.get("/users/{user_id}/streaks", response_model=List[StreakTrackerResponse])
def get_user_streaks(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    from src.models.gamification import StreakTracker
    
    streaks = db.query(StreakTracker).filter(
        StreakTracker.user_id == user_id,
        StreakTracker.institution_id == institution_id
    ).all()
    
    return streaks


@router.post("/users/{user_id}/daily-login")
def record_daily_login(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    from src.models.gamification import PointEventType
    
    user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
    
    today = user_points.last_login_date.date() if user_points.last_login_date else None
    current_date = datetime.utcnow().date()
    
    if today != current_date:
        user_points.last_login_date = datetime.utcnow()
        
        streak_tracker = GamificationService.update_streak_tracker(
            db, user_id, institution_id, 'daily_login', increment=True
        )
        
        from src.services.gamification_service import PointsCalculationEngine
        streak_bonus = PointsCalculationEngine.calculate_streak_bonus(streak_tracker.current_streak)
        
        result = GamificationService.add_points(
            db,
            institution_id,
            AddPointsRequest(
                user_id=user_id,
                points=streak_bonus,
                event_type=PointEventType.DAILY_LOGIN,
                description=f"Daily login bonus (streak: {streak_tracker.current_streak})",
                metadata={"streak": streak_tracker.current_streak}
            )
        )
        
        return {
            "message": "Daily login recorded",
            "streak": streak_tracker.current_streak,
            "points_earned": streak_bonus,
            "result": result
        }
    
    return {
        "message": "Already logged in today",
        "streak": user_points.current_streak
    }
