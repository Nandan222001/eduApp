from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract
from datetime import datetime, date
from src.models.goal import Goal, GoalMilestone, GoalProgressLog
from src.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    MilestoneCreate,
    MilestoneUpdate,
    GoalStatusEnum,
    MilestoneStatusEnum,
    GoalTypeEnum,
)


class GoalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_goal(
        self, user_id: int, institution_id: int, goal_data: GoalCreate
    ) -> Goal:
        goal = Goal(
            user_id=user_id,
            institution_id=institution_id,
            title=goal_data.title,
            description=goal_data.description,
            goal_type=self._map_type_to_db(goal_data.type),
            specific=goal_data.specific,
            measurable=goal_data.measurable,
            achievable=goal_data.achievable,
            relevant=goal_data.relevant,
            time_bound=goal_data.time_bound,
            start_date=goal_data.start_date,
            end_date=goal_data.target_date,
            target_value=100.0,
            current_value=0.0,
            progress_percentage=0.0,
            status=self._determine_status(goal_data.start_date, goal_data.target_date),
        )
        self.db.add(goal)
        self.db.flush()

        for idx, milestone_data in enumerate(goal_data.milestones):
            milestone = GoalMilestone(
                institution_id=institution_id,
                goal_id=goal.id,
                title=milestone_data.title,
                description=milestone_data.description,
                target_value=100.0,
                current_value=milestone_data.progress,
                order=idx + 1,
                target_date=milestone_data.target_date,
                status=MilestoneStatusEnum.PENDING,
                progress_percentage=milestone_data.progress,
            )
            self.db.add(milestone)

        self.db.commit()
        self.db.refresh(goal)
        return goal

    def get_goal_by_id(self, goal_id: int, user_id: int) -> Optional[Goal]:
        return (
            self.db.query(Goal)
            .filter(and_(Goal.id == goal_id, Goal.user_id == user_id))
            .first()
        )

    def get_goals_by_user(
        self, user_id: int, institution_id: int, skip: int = 0, limit: int = 100
    ) -> List[Goal]:
        return (
            self.db.query(Goal)
            .filter(
                and_(Goal.user_id == user_id, Goal.institution_id == institution_id)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_goal(self, goal: Goal, update_data: GoalUpdate) -> Goal:
        update_dict = update_data.dict(exclude_unset=True)

        for field, value in update_dict.items():
            if field == "type":
                setattr(goal, "goal_type", self._map_type_to_db(value))
            elif field == "target_date":
                setattr(goal, "end_date", value)
            elif field == "progress":
                setattr(goal, "progress_percentage", value)
                setattr(goal, "current_value", value)
                if value >= 100:
                    goal.status = "completed"
                    goal.completed_at = datetime.utcnow()
            elif field == "status":
                setattr(goal, "status", value)
            else:
                setattr(goal, field, value)

        goal.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def delete_goal(self, goal: Goal) -> None:
        self.db.delete(goal)
        self.db.commit()

    def update_milestone_progress(
        self, milestone_id: int, goal_id: int, progress: int
    ) -> Optional[GoalMilestone]:
        milestone = (
            self.db.query(GoalMilestone)
            .filter(
                and_(GoalMilestone.id == milestone_id, GoalMilestone.goal_id == goal_id)
            )
            .first()
        )

        if milestone:
            milestone.progress_percentage = progress
            milestone.current_value = progress
            if progress >= 100:
                milestone.status = MilestoneStatusEnum.COMPLETED
                milestone.completed_at = datetime.utcnow()
            elif progress > 0:
                milestone.status = MilestoneStatusEnum.IN_PROGRESS

            self._update_goal_progress(goal_id)
            self.db.commit()
            self.db.refresh(milestone)

        return milestone

    def complete_milestone(
        self, milestone_id: int, goal_id: int
    ) -> Optional[GoalMilestone]:
        milestone = (
            self.db.query(GoalMilestone)
            .filter(
                and_(GoalMilestone.id == milestone_id, GoalMilestone.goal_id == goal_id)
            )
            .first()
        )

        if milestone:
            milestone.progress_percentage = 100
            milestone.current_value = 100
            milestone.status = MilestoneStatusEnum.COMPLETED
            milestone.completed_at = datetime.utcnow()

            self._update_goal_progress(goal_id)
            self.db.commit()
            self.db.refresh(milestone)

        return milestone

    def _update_goal_progress(self, goal_id: int) -> None:
        goal = self.db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return

        milestones = (
            self.db.query(GoalMilestone).filter(GoalMilestone.goal_id == goal_id).all()
        )

        if milestones:
            total_progress = sum(m.progress_percentage for m in milestones)
            avg_progress = total_progress / len(milestones)
            goal.progress_percentage = avg_progress
            goal.current_value = avg_progress

            if avg_progress >= 100:
                goal.status = "completed"
                goal.completed_at = datetime.utcnow()
            elif avg_progress > 0:
                goal.status = "active"

    def get_analytics(self, user_id: int, institution_id: int) -> dict:
        goals = (
            self.db.query(Goal)
            .filter(
                and_(Goal.user_id == user_id, Goal.institution_id == institution_id)
            )
            .all()
        )

        total_goals = len(goals)
        completed_goals = sum(1 for g in goals if g.status == "completed")
        completion_rate = (
            (completed_goals / total_goals * 100) if total_goals > 0 else 0.0
        )
        average_progress = (
            sum(g.progress_percentage for g in goals) / total_goals
            if total_goals > 0
            else 0.0
        )

        goals_by_type = {
            "performance": sum(1 for g in goals if g.goal_type == "attendance"),
            "behavioral": sum(1 for g in goals if g.goal_type == "assignment"),
            "skill": sum(1 for g in goals if g.goal_type == "exam"),
        }

        today = date.today()
        goals_by_status = {
            "not_started": sum(
                1 for g in goals if g.status == "draft" and g.start_date > today
            ),
            "in_progress": sum(1 for g in goals if g.status == "active"),
            "completed": completed_goals,
            "overdue": sum(
                1 for g in goals if g.status == "active" and g.end_date < today
            ),
        }

        impact_correlation = {
            "academic_performance": 75.0,
            "attendance_rate": 82.0,
            "assignment_completion": 88.0,
        }

        monthly_progress = self._get_monthly_progress(user_id, institution_id)

        return {
            "total_goals": total_goals,
            "completed_goals": completed_goals,
            "completion_rate": round(completion_rate, 2),
            "average_progress": round(average_progress, 2),
            "goals_by_type": goals_by_type,
            "goals_by_status": goals_by_status,
            "impact_correlation": impact_correlation,
            "monthly_progress": monthly_progress,
        }

    def _get_monthly_progress(self, user_id: int, institution_id: int) -> list:
        from datetime import timedelta

        result = []
        today = datetime.utcnow()

        for i in range(6, -1, -1):
            month_start = (today - timedelta(days=30 * i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(
                days=1
            )

            created_count = (
                self.db.query(func.count(Goal.id))
                .filter(
                    and_(
                        Goal.user_id == user_id,
                        Goal.institution_id == institution_id,
                        Goal.created_at >= month_start,
                        Goal.created_at <= month_end,
                    )
                )
                .scalar()
            )

            completed_count = (
                self.db.query(func.count(Goal.id))
                .filter(
                    and_(
                        Goal.user_id == user_id,
                        Goal.institution_id == institution_id,
                        Goal.completed_at >= month_start,
                        Goal.completed_at <= month_end,
                    )
                )
                .scalar()
            )

            result.append(
                {
                    "month": month_start.strftime("%b %Y"),
                    "goals_created": created_count or 0,
                    "goals_completed": completed_count or 0,
                }
            )

        return result

    def _determine_status(self, start_date: date, end_date: date) -> str:
        today = date.today()
        if today < start_date:
            return "draft"
        elif today >= start_date and today <= end_date:
            return "active"
        elif today > end_date:
            return "failed"
        return "draft"

    def _map_type_to_db(self, goal_type: GoalTypeEnum) -> str:
        type_mapping = {
            GoalTypeEnum.PERFORMANCE: "attendance",
            GoalTypeEnum.BEHAVIORAL: "assignment",
            GoalTypeEnum.SKILL: "exam",
        }
        return type_mapping.get(goal_type, "custom")
