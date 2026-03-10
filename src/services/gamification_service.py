from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from decimal import Decimal

from src.models.gamification import (
    Badge, UserBadge, UserPoints, PointHistory, PointEventType,
    Achievement, UserAchievement, Leaderboard, LeaderboardEntry,
    StreakTracker, BadgeType, AchievementType, LeaderboardType, LeaderboardPeriod
)
from src.models.user import User
from src.models.attendance import Attendance, AttendanceStatus
from src.models.assignment import Submission, SubmissionStatus
from src.models.goal import Goal, GoalStatus

from src.schemas.gamification import (
    BadgeCreate, BadgeUpdate, AwardBadgeRequest, AddPointsRequest,
    LeaderboardEntryResponse, LeaderboardResponse, AchievementCreate,
    AchievementUpdate, AchievementProgressUpdate, LeaderboardCreate,
    LeaderboardUpdate, PointsCalculationResult
)


class PointsCalculationEngine:
    POINTS_CONFIG = {
        'attendance': {
            'present': 5,
            'late': 3,
            'half_day': 4,
        },
        'assignment': {
            'submit': 10,
            'grade_excellent': 50,
            'grade_good': 30,
            'grade_average': 20,
            'grade_below_average': 10,
        },
        'exam': {
            'pass': 100,
            'excellent': 200,
        },
        'goal': {
            'complete': 150,
            'milestone': 50,
        },
        'streak': {
            'daily_login': 5,
            'weekly_bonus': 25,
            'monthly_bonus': 100,
        },
        'level': {
            'points_per_level': 500,
        }
    }
    
    @staticmethod
    def calculate_attendance_points(attendance_status: AttendanceStatus) -> int:
        status_map = {
            AttendanceStatus.PRESENT: PointsCalculationEngine.POINTS_CONFIG['attendance']['present'],
            AttendanceStatus.LATE: PointsCalculationEngine.POINTS_CONFIG['attendance']['late'],
            AttendanceStatus.HALF_DAY: PointsCalculationEngine.POINTS_CONFIG['attendance']['half_day'],
            AttendanceStatus.ABSENT: 0,
        }
        return status_map.get(attendance_status, 0)
    
    @staticmethod
    def calculate_assignment_points(marks_obtained: float, max_marks: float) -> Tuple[int, str]:
        if max_marks == 0:
            return 0, 'submit'
        
        percentage = (marks_obtained / max_marks) * 100
        
        if percentage >= 90:
            return PointsCalculationEngine.POINTS_CONFIG['assignment']['grade_excellent'], 'excellent'
        elif percentage >= 75:
            return PointsCalculationEngine.POINTS_CONFIG['assignment']['grade_good'], 'good'
        elif percentage >= 60:
            return PointsCalculationEngine.POINTS_CONFIG['assignment']['grade_average'], 'average'
        elif percentage >= 40:
            return PointsCalculationEngine.POINTS_CONFIG['assignment']['grade_below_average'], 'below_average'
        else:
            return 0, 'poor'
    
    @staticmethod
    def calculate_exam_points(marks_obtained: float, max_marks: float) -> Tuple[int, str]:
        if max_marks == 0:
            return 0, 'fail'
        
        percentage = (marks_obtained / max_marks) * 100
        
        if percentage >= 90:
            return PointsCalculationEngine.POINTS_CONFIG['exam']['excellent'], 'excellent'
        elif percentage >= 60:
            return PointsCalculationEngine.POINTS_CONFIG['exam']['pass'], 'pass'
        else:
            return 0, 'fail'
    
    @staticmethod
    def calculate_goal_points(goal: Goal) -> int:
        return goal.points_reward if goal.points_reward > 0 else PointsCalculationEngine.POINTS_CONFIG['goal']['complete']
    
    @staticmethod
    def calculate_milestone_points() -> int:
        return PointsCalculationEngine.POINTS_CONFIG['goal']['milestone']
    
    @staticmethod
    def calculate_streak_bonus(streak_count: int) -> int:
        base_points = PointsCalculationEngine.POINTS_CONFIG['streak']['daily_login']
        
        if streak_count % 30 == 0:
            return PointsCalculationEngine.POINTS_CONFIG['streak']['monthly_bonus']
        elif streak_count % 7 == 0:
            return PointsCalculationEngine.POINTS_CONFIG['streak']['weekly_bonus']
        else:
            return base_points
    
    @staticmethod
    def calculate_level(total_points: int) -> int:
        points_per_level = PointsCalculationEngine.POINTS_CONFIG['level']['points_per_level']
        return max(1, (total_points // points_per_level) + 1)


class BadgeAwardingEngine:
    
    @staticmethod
    def check_and_award_badges(
        db: Session, 
        user_id: int, 
        institution_id: int,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> List[Badge]:
        awarded_badges = []
        
        active_badges = db.query(Badge).filter(
            Badge.institution_id == institution_id,
            Badge.is_active == True,
            Badge.auto_award == True
        ).all()
        
        for badge in active_badges:
            if BadgeAwardingEngine._check_badge_criteria(db, user_id, institution_id, badge, event_type, event_data):
                already_awarded = db.query(UserBadge).filter(
                    UserBadge.user_id == user_id,
                    UserBadge.badge_id == badge.id
                ).first()
                
                if not already_awarded:
                    awarded_badges.append(badge)
        
        return awarded_badges
    
    @staticmethod
    def _check_badge_criteria(
        db: Session,
        user_id: int,
        institution_id: int,
        badge: Badge,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> bool:
        if not badge.criteria:
            return False
        
        criteria = badge.criteria
        
        if badge.badge_type == BadgeType.ATTENDANCE:
            return BadgeAwardingEngine._check_attendance_criteria(db, user_id, institution_id, criteria)
        elif badge.badge_type == BadgeType.ASSIGNMENT:
            return BadgeAwardingEngine._check_assignment_criteria(db, user_id, institution_id, criteria)
        elif badge.badge_type == BadgeType.STREAK:
            return BadgeAwardingEngine._check_streak_criteria(db, user_id, institution_id, criteria)
        elif badge.badge_type == BadgeType.MILESTONE:
            return BadgeAwardingEngine._check_milestone_criteria(db, user_id, institution_id, criteria)
        
        return False
    
    @staticmethod
    def _check_attendance_criteria(db: Session, user_id: int, institution_id: int, criteria: Dict) -> bool:
        required_count = criteria.get('attendance_count', 0)
        status_filter = criteria.get('status', 'present')
        
        attendance_count = db.query(func.count(Attendance.id)).join(
            Attendance.student
        ).filter(
            Attendance.institution_id == institution_id,
            Attendance.student.has(user_id=user_id),
            Attendance.status == status_filter
        ).scalar()
        
        return attendance_count >= required_count
    
    @staticmethod
    def _check_assignment_criteria(db: Session, user_id: int, institution_id: int, criteria: Dict) -> bool:
        required_count = criteria.get('submission_count', 0)
        min_grade = criteria.get('min_grade', 0)
        
        submission_count = db.query(func.count(Submission.id)).join(
            Submission.student
        ).filter(
            Submission.student.has(user_id=user_id),
            Submission.status == SubmissionStatus.GRADED
        ).scalar()
        
        return submission_count >= required_count
    
    @staticmethod
    def _check_streak_criteria(db: Session, user_id: int, institution_id: int, criteria: Dict) -> bool:
        required_streak = criteria.get('streak_count', 0)
        
        user_points = db.query(UserPoints).filter(
            UserPoints.user_id == user_id,
            UserPoints.institution_id == institution_id
        ).first()
        
        if user_points:
            return user_points.current_streak >= required_streak
        
        return False
    
    @staticmethod
    def _check_milestone_criteria(db: Session, user_id: int, institution_id: int, criteria: Dict) -> bool:
        required_points = criteria.get('total_points', 0)
        
        user_points = db.query(UserPoints).filter(
            UserPoints.user_id == user_id,
            UserPoints.institution_id == institution_id
        ).first()
        
        if user_points:
            return user_points.total_points >= required_points
        
        return False


class GamificationService:
    
    @staticmethod
    def create_badge(db: Session, institution_id: int, badge_data: BadgeCreate) -> Badge:
        badge = Badge(
            institution_id=institution_id,
            **badge_data.model_dump()
        )
        db.add(badge)
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def update_badge(db: Session, badge_id: int, badge_data: BadgeUpdate) -> Optional[Badge]:
        badge = db.query(Badge).filter(Badge.id == badge_id).first()
        if not badge:
            return None
        
        update_data = badge_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(badge, field, value)
        
        db.commit()
        db.refresh(badge)
        return badge
    
    @staticmethod
    def get_badges(db: Session, institution_id: int, skip: int = 0, limit: int = 100) -> List[Badge]:
        return db.query(Badge).filter(
            Badge.institution_id == institution_id,
            Badge.is_active == True
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_badge(db: Session, badge_id: int) -> Optional[Badge]:
        return db.query(Badge).filter(Badge.id == badge_id).first()
    
    @staticmethod
    def award_badge(db: Session, institution_id: int, award_data: AwardBadgeRequest) -> UserBadge:
        user_badge = UserBadge(
            institution_id=institution_id,
            user_id=award_data.user_id,
            badge_id=award_data.badge_id,
            points_awarded=award_data.points_awarded,
            metadata=award_data.metadata
        )
        db.add(user_badge)
        
        if award_data.points_awarded > 0:
            GamificationService.add_points(
                db,
                institution_id,
                AddPointsRequest(
                    user_id=award_data.user_id,
                    points=award_data.points_awarded,
                    event_type=PointEventType.BADGE_EARN,
                    description=f"Earned badge",
                    reference_id=award_data.badge_id,
                    reference_type="badge"
                )
            )
        
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
    def get_or_create_user_points(db: Session, user_id: int, institution_id: int) -> UserPoints:
        user_points = db.query(UserPoints).filter(
            UserPoints.user_id == user_id,
            UserPoints.institution_id == institution_id
        ).first()
        
        if not user_points:
            user_points = UserPoints(
                institution_id=institution_id,
                user_id=user_id,
                total_points=0,
                level=1,
                experience_points=0,
                current_streak=0,
                longest_streak=0
            )
            db.add(user_points)
            db.commit()
            db.refresh(user_points)
        
        return user_points
    
    @staticmethod
    def add_points(db: Session, institution_id: int, points_data: AddPointsRequest) -> PointsCalculationResult:
        user_points = GamificationService.get_or_create_user_points(
            db, points_data.user_id, institution_id
        )
        
        old_level = user_points.level
        user_points.total_points += points_data.points
        user_points.experience_points += points_data.points
        user_points.level = PointsCalculationEngine.calculate_level(user_points.total_points)
        user_points.last_activity_date = datetime.utcnow()
        
        level_up = user_points.level > old_level
        
        GamificationService.update_streak(db, user_points)
        
        point_history = PointHistory(
            institution_id=institution_id,
            user_points_id=user_points.id,
            event_type=points_data.event_type,
            points=points_data.points,
            description=points_data.description,
            reference_id=points_data.reference_id,
            reference_type=points_data.reference_type,
            metadata=points_data.metadata
        )
        db.add(point_history)
        
        awarded_badges = BadgeAwardingEngine.check_and_award_badges(
            db,
            points_data.user_id,
            institution_id,
            points_data.event_type.value,
            points_data.metadata or {}
        )
        
        badge_responses = []
        for badge in awarded_badges:
            user_badge = UserBadge(
                institution_id=institution_id,
                user_id=points_data.user_id,
                badge_id=badge.id,
                points_awarded=badge.points_required or 0
            )
            db.add(user_badge)
            badge_responses.append(badge)
        
        achievements_unlocked = GamificationService._check_and_update_achievements(
            db, points_data.user_id, institution_id, points_data.event_type.value
        )
        
        db.commit()
        db.refresh(user_points)
        
        return PointsCalculationResult(
            points_awarded=points_data.points,
            level_up=level_up,
            new_level=user_points.level,
            badges_earned=badge_responses,
            achievements_unlocked=achievements_unlocked
        )
    
    @staticmethod
    def update_streak(db: Session, user_points: UserPoints) -> None:
        today = datetime.utcnow().date()
        last_activity = user_points.last_activity_date
        
        if last_activity:
            last_activity_date = last_activity.date()
            days_diff = (today - last_activity_date).days
            
            if days_diff == 0:
                pass
            elif days_diff == 1:
                user_points.current_streak += 1
                if user_points.current_streak > user_points.longest_streak:
                    user_points.longest_streak = user_points.current_streak
            else:
                user_points.current_streak = 1
        else:
            user_points.current_streak = 1
    
    @staticmethod
    def process_attendance_points(
        db: Session,
        user_id: int,
        institution_id: int,
        attendance_status: AttendanceStatus,
        attendance_id: int
    ) -> PointsCalculationResult:
        points = PointsCalculationEngine.calculate_attendance_points(attendance_status)
        
        if points > 0:
            return GamificationService.add_points(
                db,
                institution_id,
                AddPointsRequest(
                    user_id=user_id,
                    points=points,
                    event_type=PointEventType.ATTENDANCE,
                    description=f"Attendance marked as {attendance_status.value}",
                    reference_id=attendance_id,
                    reference_type="attendance"
                )
            )
        
        return PointsCalculationResult(
            points_awarded=0,
            level_up=False,
            new_level=1,
            badges_earned=[],
            achievements_unlocked=[]
        )
    
    @staticmethod
    def process_assignment_submission_points(
        db: Session,
        user_id: int,
        institution_id: int,
        submission_id: int
    ) -> PointsCalculationResult:
        submit_points = PointsCalculationEngine.POINTS_CONFIG['assignment']['submit']
        
        return GamificationService.add_points(
            db,
            institution_id,
            AddPointsRequest(
                user_id=user_id,
                points=submit_points,
                event_type=PointEventType.ASSIGNMENT_SUBMIT,
                description="Assignment submitted",
                reference_id=submission_id,
                reference_type="submission"
            )
        )
    
    @staticmethod
    def process_assignment_grade_points(
        db: Session,
        user_id: int,
        institution_id: int,
        submission_id: int,
        marks_obtained: float,
        max_marks: float
    ) -> PointsCalculationResult:
        points, grade_level = PointsCalculationEngine.calculate_assignment_points(marks_obtained, max_marks)
        
        if points > 0:
            return GamificationService.add_points(
                db,
                institution_id,
                AddPointsRequest(
                    user_id=user_id,
                    points=points,
                    event_type=PointEventType.ASSIGNMENT_GRADE,
                    description=f"Assignment graded: {grade_level}",
                    reference_id=submission_id,
                    reference_type="submission",
                    metadata={"grade_level": grade_level, "percentage": (marks_obtained / max_marks) * 100}
                )
            )
        
        return PointsCalculationResult(
            points_awarded=0,
            level_up=False,
            new_level=1,
            badges_earned=[],
            achievements_unlocked=[]
        )
    
    @staticmethod
    def process_goal_completion_points(
        db: Session,
        user_id: int,
        institution_id: int,
        goal_id: int,
        goal: Goal
    ) -> PointsCalculationResult:
        points = PointsCalculationEngine.calculate_goal_points(goal)
        
        return GamificationService.add_points(
            db,
            institution_id,
            AddPointsRequest(
                user_id=user_id,
                points=points,
                event_type=PointEventType.GOAL_COMPLETE,
                description=f"Goal completed: {goal.title}",
                reference_id=goal_id,
                reference_type="goal"
            )
        )
    
    @staticmethod
    def get_leaderboard(
        db: Session, 
        institution_id: int, 
        limit: int = 50,
        current_user_id: Optional[int] = None
    ) -> LeaderboardResponse:
        query = db.query(
            UserPoints.user_id,
            User.username,
            User.first_name,
            User.last_name,
            UserPoints.total_points,
            UserPoints.level,
            func.count(UserBadge.id).label('badges_count')
        ).join(
            User, UserPoints.user_id == User.id
        ).outerjoin(
            UserBadge, UserPoints.user_id == UserBadge.user_id
        ).filter(
            UserPoints.institution_id == institution_id
        ).group_by(
            UserPoints.user_id,
            User.username,
            User.first_name,
            User.last_name,
            UserPoints.total_points,
            UserPoints.level
        ).order_by(
            desc(UserPoints.total_points)
        )
        
        results = query.limit(limit).all()
        
        entries = [
            LeaderboardEntryResponse(
                user_id=r.user_id,
                username=r.username,
                first_name=r.first_name,
                last_name=r.last_name,
                total_points=r.total_points,
                level=r.level,
                rank=idx + 1,
                badges_count=r.badges_count
            )
            for idx, r in enumerate(results)
        ]
        
        current_user_rank = None
        if current_user_id:
            all_users = query.all()
            for idx, r in enumerate(all_users):
                if r.user_id == current_user_id:
                    current_user_rank = idx + 1
                    break
        
        total_users = db.query(func.count(UserPoints.id)).filter(
            UserPoints.institution_id == institution_id
        ).scalar()
        
        return LeaderboardResponse(
            entries=entries,
            total_users=total_users,
            current_user_rank=current_user_rank
        )
    
    @staticmethod
    def get_point_history(
        db: Session, 
        user_id: int, 
        institution_id: int,
        limit: int = 50
    ) -> List[PointHistory]:
        user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
        
        return db.query(PointHistory).filter(
            PointHistory.user_points_id == user_points.id
        ).order_by(desc(PointHistory.created_at)).limit(limit).all()
    
    @staticmethod
    def create_achievement(db: Session, institution_id: int, achievement_data: AchievementCreate) -> Achievement:
        achievement = Achievement(
            institution_id=institution_id,
            **achievement_data.model_dump()
        )
        db.add(achievement)
        db.commit()
        db.refresh(achievement)
        return achievement
    
    @staticmethod
    def get_achievements(db: Session, institution_id: int, skip: int = 0, limit: int = 100) -> List[Achievement]:
        return db.query(Achievement).filter(
            Achievement.institution_id == institution_id,
            Achievement.is_active == True
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_user_achievements(db: Session, user_id: int, institution_id: int) -> List[UserAchievement]:
        return db.query(UserAchievement).filter(
            UserAchievement.user_id == user_id,
            UserAchievement.institution_id == institution_id
        ).order_by(desc(UserAchievement.updated_at)).all()
    
    @staticmethod
    def _check_and_update_achievements(
        db: Session,
        user_id: int,
        institution_id: int,
        event_type: str
    ) -> List[Achievement]:
        unlocked_achievements = []
        
        achievements = db.query(Achievement).filter(
            Achievement.institution_id == institution_id,
            Achievement.is_active == True
        ).all()
        
        for achievement in achievements:
            user_achievement = db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.id
            ).first()
            
            if not user_achievement:
                user_achievement = UserAchievement(
                    institution_id=institution_id,
                    user_id=user_id,
                    achievement_id=achievement.id,
                    progress=0,
                    is_completed=False
                )
                db.add(user_achievement)
            
            if not user_achievement.is_completed or achievement.is_repeatable:
                progress = GamificationService._calculate_achievement_progress(
                    db, user_id, institution_id, achievement
                )
                user_achievement.progress = progress
                
                if progress >= 100 and not user_achievement.is_completed:
                    user_achievement.is_completed = True
                    user_achievement.completed_at = datetime.utcnow()
                    user_achievement.times_completed += 1
                    unlocked_achievements.append(achievement)
                    
                    if achievement.points_reward > 0:
                        GamificationService.add_points(
                            db,
                            institution_id,
                            AddPointsRequest(
                                user_id=user_id,
                                points=achievement.points_reward,
                                event_type=PointEventType.MILESTONE_ACHIEVE,
                                description=f"Achievement unlocked: {achievement.name}",
                                reference_id=achievement.id,
                                reference_type="achievement"
                            )
                        )
        
        return unlocked_achievements
    
    @staticmethod
    def _calculate_achievement_progress(
        db: Session,
        user_id: int,
        institution_id: int,
        achievement: Achievement
    ) -> float:
        requirements = achievement.requirements
        
        if achievement.achievement_type == AchievementType.POINTS:
            required_points = requirements.get('points', 0)
            user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
            return min(100, (user_points.total_points / required_points) * 100) if required_points > 0 else 0
        
        elif achievement.achievement_type == AchievementType.STREAK:
            required_streak = requirements.get('streak', 0)
            user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
            return min(100, (user_points.current_streak / required_streak) * 100) if required_streak > 0 else 0
        
        elif achievement.achievement_type == AchievementType.LEVEL:
            required_level = requirements.get('level', 0)
            user_points = GamificationService.get_or_create_user_points(db, user_id, institution_id)
            return min(100, (user_points.level / required_level) * 100) if required_level > 0 else 0
        
        return 0
    
    @staticmethod
    def create_leaderboard(db: Session, institution_id: int, leaderboard_data: LeaderboardCreate) -> Leaderboard:
        leaderboard = Leaderboard(
            institution_id=institution_id,
            **leaderboard_data.model_dump()
        )
        db.add(leaderboard)
        db.commit()
        db.refresh(leaderboard)
        return leaderboard
    
    @staticmethod
    def update_leaderboard(db: Session, leaderboard_id: int, leaderboard_data: LeaderboardUpdate) -> Optional[Leaderboard]:
        leaderboard = db.query(Leaderboard).filter(Leaderboard.id == leaderboard_id).first()
        if not leaderboard:
            return None
        
        update_data = leaderboard_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(leaderboard, field, value)
        
        db.commit()
        db.refresh(leaderboard)
        return leaderboard
    
    @staticmethod
    def get_leaderboards(db: Session, institution_id: int) -> List[Leaderboard]:
        return db.query(Leaderboard).filter(
            Leaderboard.institution_id == institution_id,
            Leaderboard.is_active == True
        ).all()
    
    @staticmethod
    def regenerate_leaderboard_entries(db: Session, leaderboard_id: int) -> List[LeaderboardEntry]:
        leaderboard = db.query(Leaderboard).filter(Leaderboard.id == leaderboard_id).first()
        if not leaderboard:
            return []
        
        db.query(LeaderboardEntry).filter(LeaderboardEntry.leaderboard_id == leaderboard_id).delete()
        
        query = db.query(
            UserPoints.user_id,
            UserPoints.total_points
        ).filter(
            UserPoints.institution_id == leaderboard.institution_id
        )
        
        if leaderboard.leaderboard_type == LeaderboardType.GRADE and leaderboard.grade_id:
            query = query.join(User).filter(User.student_profile.has(grade_id=leaderboard.grade_id))
        elif leaderboard.leaderboard_type == LeaderboardType.SECTION and leaderboard.section_id:
            query = query.join(User).filter(User.student_profile.has(section_id=leaderboard.section_id))
        
        if leaderboard.period != LeaderboardPeriod.ALL_TIME:
            start_date = GamificationService._get_period_start_date(leaderboard.period)
            query = query.filter(UserPoints.updated_at >= start_date)
        
        results = query.order_by(desc(UserPoints.total_points)).limit(leaderboard.max_entries).all()
        
        entries = []
        for idx, (user_id, score) in enumerate(results):
            entry = LeaderboardEntry(
                institution_id=leaderboard.institution_id,
                leaderboard_id=leaderboard_id,
                user_id=user_id,
                rank=idx + 1,
                score=score
            )
            db.add(entry)
            entries.append(entry)
        
        db.commit()
        return entries
    
    @staticmethod
    def _get_period_start_date(period: LeaderboardPeriod) -> datetime:
        now = datetime.utcnow()
        
        if period == LeaderboardPeriod.DAILY:
            return datetime(now.year, now.month, now.day)
        elif period == LeaderboardPeriod.WEEKLY:
            return now - timedelta(days=now.weekday())
        elif period == LeaderboardPeriod.MONTHLY:
            return datetime(now.year, now.month, 1)
        elif period == LeaderboardPeriod.YEARLY:
            return datetime(now.year, 1, 1)
        
        return datetime.min
    
    @staticmethod
    def update_streak_tracker(
        db: Session,
        user_id: int,
        institution_id: int,
        streak_type: str,
        increment: bool = True
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
        
        today = datetime.utcnow().date()
        last_activity = streak.last_activity_date
        
        if last_activity:
            last_activity_date = last_activity.date()
            days_diff = (today - last_activity_date).days
            
            if days_diff == 0:
                pass
            elif days_diff == 1 and increment:
                streak.current_streak += 1
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
            else:
                streak.current_streak = 1 if increment else 0
        else:
            streak.current_streak = 1 if increment else 0
        
        streak.last_activity_date = datetime.utcnow()
        
        db.commit()
        db.refresh(streak)
        return streak
