from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Index, UniqueConstraint, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class BadgeType(str, Enum):
    ATTENDANCE = "attendance"
    ASSIGNMENT = "assignment"
    EXAM = "exam"
    GOAL = "goal"
    STREAK = "streak"
    MILESTONE = "milestone"
    SPECIAL = "special"


class BadgeRarity(str, Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class PointEventType(str, Enum):
    ATTENDANCE = "attendance"
    ASSIGNMENT_SUBMIT = "assignment_submit"
    ASSIGNMENT_GRADE = "assignment_grade"
    EXAM_PASS = "exam_pass"
    EXAM_EXCELLENT = "exam_excellent"
    GOAL_COMPLETE = "goal_complete"
    MILESTONE_ACHIEVE = "milestone_achieve"
    DAILY_LOGIN = "daily_login"
    STREAK = "streak"
    BADGE_EARN = "badge_earn"


class AchievementType(str, Enum):
    ATTENDANCE = "attendance"
    ASSIGNMENT = "assignment"
    EXAM = "exam"
    GOAL = "goal"
    STREAK = "streak"
    LEVEL = "level"
    POINTS = "points"
    SOCIAL = "social"


class LeaderboardType(str, Enum):
    GLOBAL = "global"
    GRADE = "grade"
    SECTION = "section"
    SUBJECT = "subject"
    CUSTOM = "custom"


class LeaderboardPeriod(str, Enum):
    ALL_TIME = "all_time"
    YEARLY = "yearly"
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    DAILY = "daily"


class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    badge_type = Column(SQLEnum(BadgeType), nullable=False, index=True)
    rarity = Column(SQLEnum(BadgeRarity), default=BadgeRarity.COMMON, nullable=False)
    icon_url = Column(String(500), nullable=True)
    points_required = Column(Integer, nullable=True)
    criteria = Column(JSON, nullable=True)
    auto_award = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'name', name='uq_institution_badge_name'),
        Index('idx_badge_institution', 'institution_id'),
        Index('idx_badge_type', 'badge_type'),
        Index('idx_badge_active', 'is_active'),
        Index('idx_badge_auto_award', 'auto_award'),
    )


class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey('badges.id', ondelete='CASCADE'), nullable=False, index=True)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    points_awarded = Column(Integer, default=0, nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    badge = relationship("Badge", back_populates="user_badges")
    
    __table_args__ = (
        Index('idx_user_badge_institution', 'institution_id'),
        Index('idx_user_badge_user', 'user_id'),
        Index('idx_user_badge_badge', 'badge_id'),
        Index('idx_user_badge_earned', 'earned_at'),
    )


class UserPoints(Base):
    __tablename__ = "user_points"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    total_points = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    experience_points = Column(Integer, default=0, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(DateTime, nullable=True)
    last_login_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    point_history = relationship("PointHistory", back_populates="user_points", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'user_id', name='uq_institution_user_points'),
        Index('idx_user_points_institution', 'institution_id'),
        Index('idx_user_points_user', 'user_id'),
        Index('idx_user_points_total', 'total_points'),
        Index('idx_user_points_level', 'level'),
        Index('idx_user_points_streak', 'current_streak'),
    )


class PointHistory(Base):
    __tablename__ = "point_history"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_points_id = Column(Integer, ForeignKey('user_points.id', ondelete='CASCADE'), nullable=False, index=True)
    event_type = Column(SQLEnum(PointEventType), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    reference_id = Column(Integer, nullable=True)
    reference_type = Column(String(50), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user_points = relationship("UserPoints", back_populates="point_history")
    
    __table_args__ = (
        Index('idx_point_history_institution', 'institution_id'),
        Index('idx_point_history_user_points', 'user_points_id'),
        Index('idx_point_history_event_type', 'event_type'),
        Index('idx_point_history_reference', 'reference_type', 'reference_id'),
        Index('idx_point_history_created', 'created_at'),
    )


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    achievement_type = Column(SQLEnum(AchievementType), nullable=False, index=True)
    icon_url = Column(String(500), nullable=True)
    points_reward = Column(Integer, default=0, nullable=False)
    requirements = Column(JSON, nullable=False)
    is_secret = Column(Boolean, default=False, nullable=False)
    is_repeatable = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user_achievements = relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'name', name='uq_institution_achievement_name'),
        Index('idx_achievement_institution', 'institution_id'),
        Index('idx_achievement_type', 'achievement_type'),
        Index('idx_achievement_active', 'is_active'),
    )


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey('achievements.id', ondelete='CASCADE'), nullable=False, index=True)
    progress = Column(Numeric(5, 2), default=0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    times_completed = Column(Integer, default=0, nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    achievement = relationship("Achievement", back_populates="user_achievements")
    
    __table_args__ = (
        Index('idx_user_achievement_institution', 'institution_id'),
        Index('idx_user_achievement_user', 'user_id'),
        Index('idx_user_achievement_achievement', 'achievement_id'),
        Index('idx_user_achievement_completed', 'is_completed'),
        Index('idx_user_achievement_user_achievement', 'user_id', 'achievement_id'),
    )


class Leaderboard(Base):
    __tablename__ = "leaderboards"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    leaderboard_type = Column(SQLEnum(LeaderboardType), nullable=False, index=True)
    period = Column(SQLEnum(LeaderboardPeriod), nullable=False, index=True)
    grade_id = Column(Integer, ForeignKey('grades.id', ondelete='CASCADE'), nullable=True, index=True)
    section_id = Column(Integer, ForeignKey('sections.id', ondelete='CASCADE'), nullable=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True, index=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    show_full_names = Column(Boolean, default=True, nullable=False)
    max_entries = Column(Integer, default=100, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    grade = relationship("Grade")
    section = relationship("Section")
    subject = relationship("Subject")
    entries = relationship("LeaderboardEntry", back_populates="leaderboard", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_leaderboard_institution', 'institution_id'),
        Index('idx_leaderboard_type', 'leaderboard_type'),
        Index('idx_leaderboard_period', 'period'),
        Index('idx_leaderboard_grade', 'grade_id'),
        Index('idx_leaderboard_section', 'section_id'),
        Index('idx_leaderboard_subject', 'subject_id'),
        Index('idx_leaderboard_active', 'is_active'),
    )


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    leaderboard_id = Column(Integer, ForeignKey('leaderboards.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    previous_rank = Column(Integer, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    leaderboard = relationship("Leaderboard", back_populates="entries")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('leaderboard_id', 'user_id', name='uq_leaderboard_user'),
        Index('idx_leaderboard_entry_institution', 'institution_id'),
        Index('idx_leaderboard_entry_leaderboard', 'leaderboard_id'),
        Index('idx_leaderboard_entry_user', 'user_id'),
        Index('idx_leaderboard_entry_rank', 'rank'),
        Index('idx_leaderboard_entry_score', 'score'),
    )


class StreakTracker(Base):
    __tablename__ = "streak_trackers"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    streak_type = Column(String(50), nullable=False, index=True)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(DateTime, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('institution_id', 'user_id', 'streak_type', name='uq_user_streak_type'),
        Index('idx_streak_tracker_institution', 'institution_id'),
        Index('idx_streak_tracker_user', 'user_id'),
        Index('idx_streak_tracker_type', 'streak_type'),
        Index('idx_streak_tracker_current', 'current_streak'),
    )
