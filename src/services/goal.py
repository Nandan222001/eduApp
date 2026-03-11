from typing import List, Optional
from sqlalchemy.orm import Session
from src.repositories.goal import GoalRepository
from src.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    MilestoneResponse,
    GoalAnalyticsResponse,
    GoalStatusEnum,
    MilestoneStatusEnum,
    GoalTypeEnum,
)
from src.models.goal import Goal, GoalMilestone
from datetime import date


class GoalService:
    def __init__(self, db: Session):
        self.repository = GoalRepository(db)

    def create_goal(
        self, user_id: int, institution_id: int, goal_data: GoalCreate
    ) -> GoalResponse:
        goal = self.repository.create_goal(user_id, institution_id, goal_data)
        return self._map_goal_to_response(goal)

    def get_goal(self, goal_id: int, user_id: int) -> Optional[GoalResponse]:
        goal = self.repository.get_goal_by_id(goal_id, user_id)
        if goal:
            return self._map_goal_to_response(goal)
        return None

    def get_goals(
        self, user_id: int, institution_id: int, skip: int = 0, limit: int = 100
    ) -> List[GoalResponse]:
        goals = self.repository.get_goals_by_user(user_id, institution_id, skip, limit)
        return [self._map_goal_to_response(goal) for goal in goals]

    def update_goal(
        self, goal_id: int, user_id: int, update_data: GoalUpdate
    ) -> Optional[GoalResponse]:
        goal = self.repository.get_goal_by_id(goal_id, user_id)
        if not goal:
            return None

        updated_goal = self.repository.update_goal(goal, update_data)
        return self._map_goal_to_response(updated_goal)

    def delete_goal(self, goal_id: int, user_id: int) -> bool:
        goal = self.repository.get_goal_by_id(goal_id, user_id)
        if not goal:
            return False

        self.repository.delete_goal(goal)
        return True

    def update_milestone_progress(
        self, goal_id: int, milestone_id: int, user_id: int, progress: int
    ) -> Optional[GoalResponse]:
        goal = self.repository.get_goal_by_id(goal_id, user_id)
        if not goal:
            return None

        self.repository.update_milestone_progress(milestone_id, goal_id, progress)
        updated_goal = self.repository.get_goal_by_id(goal_id, user_id)
        return self._map_goal_to_response(updated_goal)

    def complete_milestone(
        self, goal_id: int, milestone_id: int, user_id: int
    ) -> Optional[GoalResponse]:
        goal = self.repository.get_goal_by_id(goal_id, user_id)
        if not goal:
            return None

        self.repository.complete_milestone(milestone_id, goal_id)
        updated_goal = self.repository.get_goal_by_id(goal_id, user_id)
        return self._map_goal_to_response(updated_goal)

    def get_analytics(
        self, user_id: int, institution_id: int
    ) -> GoalAnalyticsResponse:
        analytics_data = self.repository.get_analytics(user_id, institution_id)
        return GoalAnalyticsResponse(**analytics_data)

    def _map_goal_to_response(self, goal: Goal) -> GoalResponse:
        today = date.today()
        status = self._determine_frontend_status(goal, today)

        return GoalResponse(
            id=str(goal.id),
            title=goal.title,
            description=goal.description or "",
            type=self._map_type_from_db(goal.goal_type),
            specific=goal.specific or "",
            measurable=goal.measurable or "",
            achievable=goal.achievable or "",
            relevant=goal.relevant or "",
            time_bound=goal.time_bound or "",
            start_date=goal.start_date,
            target_date=goal.end_date,
            status=status,
            progress=int(goal.progress_percentage),
            milestones=[
                self._map_milestone_to_response(m) for m in goal.milestones
            ],
            completed_date=goal.completed_at,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
        )

    def _map_milestone_to_response(
        self, milestone: GoalMilestone
    ) -> MilestoneResponse:
        return MilestoneResponse(
            id=str(milestone.id),
            title=milestone.title,
            description=milestone.description or "",
            target_date=milestone.target_date,
            progress=int(milestone.progress_percentage),
            status=self._map_milestone_status(milestone.status),
            completed_date=milestone.completed_at,
        )

    def _determine_frontend_status(self, goal: Goal, today: date) -> GoalStatusEnum:
        if goal.status == "completed":
            return GoalStatusEnum.COMPLETED
        elif today > goal.end_date:
            return GoalStatusEnum.OVERDUE
        elif today >= goal.start_date and goal.progress_percentage > 0:
            return GoalStatusEnum.IN_PROGRESS
        elif today >= goal.start_date:
            return GoalStatusEnum.IN_PROGRESS
        else:
            return GoalStatusEnum.NOT_STARTED

    def _map_type_from_db(self, db_type: str) -> GoalTypeEnum:
        type_mapping = {
            "attendance": GoalTypeEnum.PERFORMANCE,
            "assignment": GoalTypeEnum.BEHAVIORAL,
            "exam": GoalTypeEnum.SKILL,
            "grade": GoalTypeEnum.PERFORMANCE,
            "subject": GoalTypeEnum.SKILL,
            "custom": GoalTypeEnum.PERFORMANCE,
        }
        return type_mapping.get(db_type, GoalTypeEnum.PERFORMANCE)

    def _map_milestone_status(self, db_status: str) -> MilestoneStatusEnum:
        status_mapping = {
            "pending": MilestoneStatusEnum.PENDING,
            "in_progress": MilestoneStatusEnum.IN_PROGRESS,
            "completed": MilestoneStatusEnum.COMPLETED,
            "failed": MilestoneStatusEnum.PENDING,
        }
        return status_mapping.get(db_status, MilestoneStatusEnum.PENDING)
