from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class GoalTypeEnum(str, Enum):
    PERFORMANCE = "performance"
    BEHAVIORAL = "behavioral"
    SKILL = "skill"


class GoalStatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class MilestoneStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_date: date
    progress: int = Field(default=0, ge=0, le=100)


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    progress: Optional[int] = Field(None, ge=0, le=100)


class MilestoneResponse(MilestoneBase):
    id: str
    status: MilestoneStatusEnum
    completed_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class GoalBase(BaseModel):
    title: str
    description: str
    type: GoalTypeEnum
    specific: str
    measurable: str
    achievable: str
    relevant: str
    time_bound: str
    start_date: date
    target_date: date


class GoalCreate(GoalBase):
    milestones: List[MilestoneCreate] = []


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[GoalTypeEnum] = None
    specific: Optional[str] = None
    measurable: Optional[str] = None
    achievable: Optional[str] = None
    relevant: Optional[str] = None
    time_bound: Optional[str] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[GoalStatusEnum] = None


class GoalResponse(GoalBase):
    id: str
    status: GoalStatusEnum
    progress: int
    milestones: List[MilestoneResponse]
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoalAnalyticsByType(BaseModel):
    performance: int = 0
    behavioral: int = 0
    skill: int = 0


class GoalAnalyticsByStatus(BaseModel):
    not_started: int = 0
    in_progress: int = 0
    completed: int = 0
    overdue: int = 0


class ImpactCorrelation(BaseModel):
    academic_performance: float = 0.0
    attendance_rate: float = 0.0
    assignment_completion: float = 0.0


class MonthlyProgress(BaseModel):
    month: str
    goals_created: int = 0
    goals_completed: int = 0


class GoalAnalyticsResponse(BaseModel):
    total_goals: int = 0
    completed_goals: int = 0
    completion_rate: float = 0.0
    average_progress: float = 0.0
    goals_by_type: GoalAnalyticsByType
    goals_by_status: GoalAnalyticsByStatus
    impact_correlation: ImpactCorrelation
    monthly_progress: List[MonthlyProgress] = []

    class Config:
        from_attributes = True
