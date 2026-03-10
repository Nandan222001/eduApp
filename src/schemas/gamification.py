from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from src.models.gamification import (
    BadgeType, BadgeRarity, PointEventType, AchievementType,
    LeaderboardType, LeaderboardPeriod
)


class BadgeBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    badge_type: BadgeType
    rarity: BadgeRarity = BadgeRarity.COMMON
    icon_url: Optional[str] = Field(None, max_length=500)
    points_required: Optional[int] = None
    criteria: Optional[Dict[str, Any]] = None
    auto_award: bool = False
    is_active: bool = True


class BadgeCreate(BadgeBase):
    pass


class BadgeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    badge_type: Optional[BadgeType] = None
    rarity: Optional[BadgeRarity] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    points_required: Optional[int] = None
    criteria: Optional[Dict[str, Any]] = None
    auto_award: Optional[bool] = None
    is_active: Optional[bool] = None


class BadgeResponse(BadgeBase):
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBadgeResponse(BaseModel):
    id: int
    institution_id: int
    user_id: int
    badge_id: int
    earned_at: datetime
    points_awarded: int
    metadata: Optional[Dict[str, Any]] = None
    badge: BadgeResponse
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AwardBadgeRequest(BaseModel):
    user_id: int
    badge_id: int
    points_awarded: int = 0
    metadata: Optional[Dict[str, Any]] = None


class UserPointsResponse(BaseModel):
    id: int
    institution_id: int
    user_id: int
    total_points: int
    level: int
    experience_points: int
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[datetime] = None
    last_login_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PointHistoryResponse(BaseModel):
    id: int
    institution_id: int
    user_points_id: int
    event_type: PointEventType
    points: int
    description: Optional[str] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AddPointsRequest(BaseModel):
    user_id: int
    points: int
    event_type: PointEventType
    description: Optional[str] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class LeaderboardEntryResponse(BaseModel):
    user_id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    total_points: int
    level: int
    rank: int
    badges_count: int


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntryResponse]
    total_users: int
    current_user_rank: Optional[int] = None


class UserGamificationStats(BaseModel):
    user_id: int
    total_points: int
    level: int
    current_streak: int
    longest_streak: int
    total_badges: int
    badges_by_type: dict
    recent_achievements: List[UserBadgeResponse]
    point_history: List[PointHistoryResponse]


class AchievementBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    achievement_type: AchievementType
    icon_url: Optional[str] = Field(None, max_length=500)
    points_reward: int = 0
    requirements: Dict[str, Any]
    is_secret: bool = False
    is_repeatable: bool = False
    is_active: bool = True


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    achievement_type: Optional[AchievementType] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    points_reward: Optional[int] = None
    requirements: Optional[Dict[str, Any]] = None
    is_secret: Optional[bool] = None
    is_repeatable: Optional[bool] = None
    is_active: Optional[bool] = None


class AchievementResponse(AchievementBase):
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserAchievementResponse(BaseModel):
    id: int
    institution_id: int
    user_id: int
    achievement_id: int
    progress: float
    is_completed: bool
    completed_at: Optional[datetime] = None
    times_completed: int
    metadata: Optional[Dict[str, Any]] = None
    achievement: AchievementResponse
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AchievementProgressUpdate(BaseModel):
    user_id: int
    achievement_id: int
    progress: float
    metadata: Optional[Dict[str, Any]] = None


class LeaderboardBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    leaderboard_type: LeaderboardType
    period: LeaderboardPeriod
    grade_id: Optional[int] = None
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_public: bool = True
    show_full_names: bool = True
    max_entries: int = 100
    is_active: bool = True


class LeaderboardCreate(LeaderboardBase):
    pass


class LeaderboardUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    leaderboard_type: Optional[LeaderboardType] = None
    period: Optional[LeaderboardPeriod] = None
    grade_id: Optional[int] = None
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_public: Optional[bool] = None
    show_full_names: Optional[bool] = None
    max_entries: Optional[int] = None
    is_active: Optional[bool] = None


class LeaderboardDBResponse(LeaderboardBase):
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaderboardEntryDBResponse(BaseModel):
    id: int
    institution_id: int
    leaderboard_id: int
    user_id: int
    rank: int
    score: int
    previous_rank: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaderboardWithEntriesResponse(LeaderboardDBResponse):
    entries: List[LeaderboardEntryDBResponse]


class StreakTrackerResponse(BaseModel):
    id: int
    institution_id: int
    user_id: int
    streak_type: str
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PointsCalculationResult(BaseModel):
    points_awarded: int
    level_up: bool
    new_level: int
    badges_earned: List[BadgeResponse]
    achievements_unlocked: List[AchievementResponse]


class UserShowcaseResponse(BaseModel):
    user_id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    total_points: int
    level: int
    current_streak: int
    longest_streak: int
    badges: List[UserBadgeResponse]
    achievements: List[UserAchievementResponse]
    recent_activities: List[PointHistoryResponse]
    rank: Optional[int] = None
