"""
Seed script for initializing gamification system with default badges and achievements.
Run this after running migrations to populate initial gamification data.
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.gamification import (
    Badge, BadgeType, BadgeRarity,
    Achievement, AchievementType
)


def seed_default_badges(db: Session, institution_id: int):
    """Seed default badges for an institution."""
    
    badges = [
        # Attendance Badges
        {
            "name": "Perfect Week",
            "description": "Attended all classes for a week straight",
            "badge_type": BadgeType.ATTENDANCE,
            "rarity": BadgeRarity.COMMON,
            "points_required": 50,
            "criteria": {"attendance_count": 5, "status": "present"},
            "auto_award": True,
        },
        {
            "name": "Perfect Month",
            "description": "Attended all classes for a month",
            "badge_type": BadgeType.ATTENDANCE,
            "rarity": BadgeRarity.RARE,
            "points_required": 200,
            "criteria": {"attendance_count": 20, "status": "present"},
            "auto_award": True,
        },
        {
            "name": "Attendance Champion",
            "description": "Attended 100 classes",
            "badge_type": BadgeType.ATTENDANCE,
            "rarity": BadgeRarity.EPIC,
            "points_required": 500,
            "criteria": {"attendance_count": 100, "status": "present"},
            "auto_award": True,
        },
        
        # Assignment Badges
        {
            "name": "First Submission",
            "description": "Submitted your first assignment",
            "badge_type": BadgeType.ASSIGNMENT,
            "rarity": BadgeRarity.COMMON,
            "points_required": 10,
            "criteria": {"submission_count": 1},
            "auto_award": True,
        },
        {
            "name": "Assignment Master",
            "description": "Submitted 50 assignments",
            "badge_type": BadgeType.ASSIGNMENT,
            "rarity": BadgeRarity.EPIC,
            "points_required": 500,
            "criteria": {"submission_count": 50},
            "auto_award": True,
        },
        {
            "name": "Excellence Seeker",
            "description": "Achieved excellent grades on 10 assignments",
            "badge_type": BadgeType.ASSIGNMENT,
            "rarity": BadgeRarity.RARE,
            "points_required": 300,
            "criteria": {"submission_count": 10, "min_grade": 90},
            "auto_award": True,
        },
        
        # Streak Badges
        {
            "name": "Week Warrior",
            "description": "Maintained a 7-day activity streak",
            "badge_type": BadgeType.STREAK,
            "rarity": BadgeRarity.COMMON,
            "points_required": 100,
            "criteria": {"streak_count": 7},
            "auto_award": True,
        },
        {
            "name": "Month Master",
            "description": "Maintained a 30-day activity streak",
            "badge_type": BadgeType.STREAK,
            "rarity": BadgeRarity.RARE,
            "points_required": 500,
            "criteria": {"streak_count": 30},
            "auto_award": True,
        },
        {
            "name": "Streak Legend",
            "description": "Maintained a 100-day activity streak",
            "badge_type": BadgeType.STREAK,
            "rarity": BadgeRarity.LEGENDARY,
            "points_required": 2000,
            "criteria": {"streak_count": 100},
            "auto_award": True,
        },
        
        # Milestone Badges
        {
            "name": "First Steps",
            "description": "Earned your first 100 points",
            "badge_type": BadgeType.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "points_required": 50,
            "criteria": {"total_points": 100},
            "auto_award": True,
        },
        {
            "name": "Rising Star",
            "description": "Earned 1,000 points",
            "badge_type": BadgeType.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "points_required": 100,
            "criteria": {"total_points": 1000},
            "auto_award": True,
        },
        {
            "name": "Point Collector",
            "description": "Earned 5,000 points",
            "badge_type": BadgeType.MILESTONE,
            "rarity": BadgeRarity.RARE,
            "points_required": 500,
            "criteria": {"total_points": 5000},
            "auto_award": True,
        },
        {
            "name": "10K Club",
            "description": "Earned 10,000 points",
            "badge_type": BadgeType.MILESTONE,
            "rarity": BadgeRarity.EPIC,
            "points_required": 1000,
            "criteria": {"total_points": 10000},
            "auto_award": True,
        },
        {
            "name": "Elite Achiever",
            "description": "Earned 50,000 points",
            "badge_type": BadgeType.MILESTONE,
            "rarity": BadgeRarity.LEGENDARY,
            "points_required": 5000,
            "criteria": {"total_points": 50000},
            "auto_award": True,
        },
        
        # Goal Badges
        {
            "name": "Goal Getter",
            "description": "Completed your first goal",
            "badge_type": BadgeType.GOAL,
            "rarity": BadgeRarity.COMMON,
            "points_required": 100,
            "criteria": {"goals_completed": 1},
            "auto_award": True,
        },
        {
            "name": "Goal Master",
            "description": "Completed 10 goals",
            "badge_type": BadgeType.GOAL,
            "rarity": BadgeRarity.RARE,
            "points_required": 500,
            "criteria": {"goals_completed": 10},
            "auto_award": True,
        },
        
        # Special Badges (manually awarded)
        {
            "name": "Star Student",
            "description": "Awarded for exceptional performance",
            "badge_type": BadgeType.SPECIAL,
            "rarity": BadgeRarity.LEGENDARY,
            "points_required": 1000,
            "criteria": {},
            "auto_award": False,
        },
        {
            "name": "Class Leader",
            "description": "Demonstrated outstanding leadership",
            "badge_type": BadgeType.SPECIAL,
            "rarity": BadgeRarity.EPIC,
            "points_required": 500,
            "criteria": {},
            "auto_award": False,
        },
        {
            "name": "Helper",
            "description": "Helped fellow students excel",
            "badge_type": BadgeType.SPECIAL,
            "rarity": BadgeRarity.RARE,
            "points_required": 250,
            "criteria": {},
            "auto_award": False,
        },
    ]
    
    created_badges = []
    for badge_data in badges:
        # Check if badge already exists
        existing = db.query(Badge).filter(
            Badge.institution_id == institution_id,
            Badge.name == badge_data["name"]
        ).first()
        
        if not existing:
            badge = Badge(
                institution_id=institution_id,
                **badge_data
            )
            db.add(badge)
            created_badges.append(badge_data["name"])
    
    db.commit()
    return created_badges


def seed_default_achievements(db: Session, institution_id: int):
    """Seed default achievements for an institution."""
    
    achievements = [
        # Points Achievements
        {
            "name": "Bronze Collector",
            "description": "Accumulate 1,000 total points",
            "achievement_type": AchievementType.POINTS,
            "points_reward": 100,
            "requirements": {"points": 1000},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Silver Collector",
            "description": "Accumulate 5,000 total points",
            "achievement_type": AchievementType.POINTS,
            "points_reward": 500,
            "requirements": {"points": 5000},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Gold Collector",
            "description": "Accumulate 10,000 total points",
            "achievement_type": AchievementType.POINTS,
            "points_reward": 1000,
            "requirements": {"points": 10000},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Platinum Collector",
            "description": "Accumulate 25,000 total points",
            "achievement_type": AchievementType.POINTS,
            "points_reward": 2500,
            "requirements": {"points": 25000},
            "is_secret": False,
            "is_repeatable": False,
        },
        
        # Streak Achievements
        {
            "name": "Consistency Beginner",
            "description": "Maintain a 7-day streak",
            "achievement_type": AchievementType.STREAK,
            "points_reward": 100,
            "requirements": {"streak": 7},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Consistency Pro",
            "description": "Maintain a 30-day streak",
            "achievement_type": AchievementType.STREAK,
            "points_reward": 500,
            "requirements": {"streak": 30},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Consistency Master",
            "description": "Maintain a 100-day streak",
            "achievement_type": AchievementType.STREAK,
            "points_reward": 2000,
            "requirements": {"streak": 100},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Consistency Legend",
            "description": "Maintain a 365-day streak",
            "achievement_type": AchievementType.STREAK,
            "points_reward": 10000,
            "requirements": {"streak": 365},
            "is_secret": True,
            "is_repeatable": False,
        },
        
        # Level Achievements
        {
            "name": "Level 5 Reached",
            "description": "Reach level 5",
            "achievement_type": AchievementType.LEVEL,
            "points_reward": 250,
            "requirements": {"level": 5},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Level 10 Reached",
            "description": "Reach level 10",
            "achievement_type": AchievementType.LEVEL,
            "points_reward": 500,
            "requirements": {"level": 10},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Level 25 Reached",
            "description": "Reach level 25",
            "achievement_type": AchievementType.LEVEL,
            "points_reward": 2500,
            "requirements": {"level": 25},
            "is_secret": False,
            "is_repeatable": False,
        },
        {
            "name": "Level 50 Master",
            "description": "Reach level 50",
            "achievement_type": AchievementType.LEVEL,
            "points_reward": 5000,
            "requirements": {"level": 50},
            "is_secret": True,
            "is_repeatable": False,
        },
        
        # Attendance Achievements
        {
            "name": "Never Miss",
            "description": "Perfect attendance for 30 days",
            "achievement_type": AchievementType.ATTENDANCE,
            "points_reward": 500,
            "requirements": {"attendance_days": 30, "status": "present"},
            "is_secret": False,
            "is_repeatable": True,
        },
        
        # Assignment Achievements
        {
            "name": "Assignment Warrior",
            "description": "Submit 100 assignments",
            "achievement_type": AchievementType.ASSIGNMENT,
            "points_reward": 1000,
            "requirements": {"submissions": 100},
            "is_secret": False,
            "is_repeatable": False,
        },
        
        # Goal Achievements
        {
            "name": "Goal Champion",
            "description": "Complete 20 goals",
            "achievement_type": AchievementType.GOAL,
            "points_reward": 2000,
            "requirements": {"goals": 20},
            "is_secret": False,
            "is_repeatable": False,
        },
    ]
    
    created_achievements = []
    for achievement_data in achievements:
        # Check if achievement already exists
        existing = db.query(Achievement).filter(
            Achievement.institution_id == institution_id,
            Achievement.name == achievement_data["name"]
        ).first()
        
        if not existing:
            achievement = Achievement(
                institution_id=institution_id,
                **achievement_data
            )
            db.add(achievement)
            created_achievements.append(achievement_data["name"])
    
    db.commit()
    return created_achievements


def main():
    """Main function to seed gamification data."""
    db = SessionLocal()
    
    try:
        # Get institution_id from command line or use default
        institution_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
        
        print(f"Seeding gamification data for institution {institution_id}...")
        
        # Seed badges
        print("\nSeeding badges...")
        created_badges = seed_default_badges(db, institution_id)
        print(f"Created {len(created_badges)} badges:")
        for badge_name in created_badges:
            print(f"  - {badge_name}")
        
        # Seed achievements
        print("\nSeeding achievements...")
        created_achievements = seed_default_achievements(db, institution_id)
        print(f"Created {len(created_achievements)} achievements:")
        for achievement_name in created_achievements:
            print(f"  - {achievement_name}")
        
        print("\n✅ Gamification seed completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error seeding gamification data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
