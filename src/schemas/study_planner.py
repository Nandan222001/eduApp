from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from decimal import Decimal
from src.models.study_planner import StudyPlanStatus, TaskStatus, TaskPriority


class WeakAreaBase(BaseModel):
    subject_id: int
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    weakness_score: Decimal = Field(..., ge=0, le=100)
    average_score: Optional[Decimal] = Field(None, ge=0, le=100)
    attempts_count: int = Field(default=0, ge=0)
    identified_from: Optional[str] = None
    notes: Optional[str] = None


class WeakAreaCreate(WeakAreaBase):
    institution_id: int
    student_id: int


class WeakAreaUpdate(BaseModel):
    weakness_score: Optional[Decimal] = Field(None, ge=0, le=100)
    average_score: Optional[Decimal] = Field(None, ge=0, le=100)
    attempts_count: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    is_resolved: Optional[bool] = None


class WeakAreaResponse(WeakAreaBase):
    id: int
    institution_id: int
    student_id: int
    is_resolved: bool
    resolved_at: Optional[datetime]
    last_attempted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudyPlanBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    target_exam_id: Optional[int] = None
    target_exam_date: Optional[date] = None
    start_date: date
    end_date: date
    hours_per_day: Optional[Decimal] = Field(None, ge=0, le=24)
    calendar_sync_enabled: bool = False
    calendar_sync_url: Optional[str] = None
    adaptive_rescheduling_enabled: bool = True
    metadata: Optional[Dict[str, Any]] = None


class StudyPlanCreate(StudyPlanBase):
    institution_id: int
    student_id: int


class StudyPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    target_exam_date: Optional[date] = None
    end_date: Optional[date] = None
    hours_per_day: Optional[Decimal] = Field(None, ge=0, le=24)
    status: Optional[StudyPlanStatus] = None
    calendar_sync_enabled: Optional[bool] = None
    calendar_sync_url: Optional[str] = None
    adaptive_rescheduling_enabled: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class StudyPlanResponse(StudyPlanBase):
    id: int
    institution_id: int
    student_id: int
    status: StudyPlanStatus
    total_study_hours: Optional[Decimal]
    last_rescheduled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DailyStudyTaskBase(BaseModel):
    task_date: date
    subject_id: int
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    estimated_duration_minutes: int = Field(..., ge=1)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    metadata: Optional[Dict[str, Any]] = None


class DailyStudyTaskCreate(DailyStudyTaskBase):
    institution_id: int
    study_plan_id: int
    student_id: int
    priority_score: Optional[Decimal] = None


class DailyStudyTaskUpdate(BaseModel):
    task_date: Optional[date] = None
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    estimated_duration_minutes: Optional[int] = Field(None, ge=1)
    actual_duration_minutes: Optional[int] = Field(None, ge=0)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[TaskStatus] = None
    completion_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    skipped_reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class DailyStudyTaskResponse(DailyStudyTaskBase):
    id: int
    institution_id: int
    study_plan_id: int
    student_id: int
    priority_score: Optional[Decimal]
    actual_duration_minutes: Optional[int]
    status: TaskStatus
    completion_percentage: Decimal
    completed_at: Optional[datetime]
    rescheduled_from_date: Optional[date]
    rescheduled_to_date: Optional[date]
    rescheduled_reason: Optional[str]
    calendar_event_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TopicAssignmentBase(BaseModel):
    subject_id: int
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    priority_score: Decimal
    importance_probability: Optional[Decimal] = Field(None, ge=0, le=1)
    weakness_score: Optional[Decimal] = Field(None, ge=0, le=100)
    subject_weightage: Optional[Decimal] = Field(None, ge=0, le=100)
    allocated_hours: Decimal = Field(..., ge=0)
    target_completion_date: Optional[date] = None
    notes: Optional[str] = None


class TopicAssignmentCreate(TopicAssignmentBase):
    institution_id: int
    study_plan_id: int


class TopicAssignmentUpdate(BaseModel):
    priority_score: Optional[Decimal] = None
    allocated_hours: Optional[Decimal] = Field(None, ge=0)
    completed_hours: Optional[Decimal] = Field(None, ge=0)
    target_completion_date: Optional[date] = None
    is_completed: Optional[bool] = None
    notes: Optional[str] = None


class TopicAssignmentResponse(TopicAssignmentBase):
    id: int
    institution_id: int
    study_plan_id: int
    completed_hours: Decimal
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudyProgressResponse(BaseModel):
    id: int
    institution_id: int
    student_id: int
    study_plan_id: int
    progress_date: date
    total_tasks: int
    completed_tasks: int
    skipped_tasks: int
    total_study_hours: Decimal
    actual_study_hours: Decimal
    completion_rate: Decimal
    adherence_score: Optional[Decimal]
    productivity_score: Optional[Decimal]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudyPlanGenerationRequest(BaseModel):
    student_id: int
    target_exam_id: Optional[int] = None
    target_exam_date: Optional[date] = None
    start_date: date
    end_date: date
    hours_per_day: Decimal = Field(..., ge=0.5, le=24)
    include_weekends: bool = True
    preferred_start_time: Optional[time] = None
    preferred_subjects: Optional[List[int]] = None
    excluded_dates: Optional[List[date]] = None
    metadata: Optional[Dict[str, Any]] = None


class StudyPlanGenerationResponse(BaseModel):
    study_plan: StudyPlanResponse
    topic_assignments: List[TopicAssignmentResponse]
    daily_tasks: List[DailyStudyTaskResponse]
    summary: Dict[str, Any]


class TaskRescheduleRequest(BaseModel):
    task_id: int
    new_date: date
    reason: Optional[str] = None


class TaskCompletionRequest(BaseModel):
    task_id: int
    actual_duration_minutes: Optional[int] = None
    completion_percentage: Decimal = Field(100, ge=0, le=100)
    notes: Optional[str] = None


class AdaptiveReschedulingRequest(BaseModel):
    study_plan_id: int
    reason: str
    consider_pending_tasks: bool = True
    redistribute_hours: bool = True


class AdaptiveReschedulingResponse(BaseModel):
    rescheduled_tasks_count: int
    affected_dates: List[date]
    new_tasks: List[DailyStudyTaskResponse]
    updated_tasks: List[DailyStudyTaskResponse]
    message: str


class TopicPrioritizationRequest(BaseModel):
    student_id: int
    subject_id: Optional[int] = None
    exam_id: Optional[int] = None
    include_weak_areas_only: bool = False


class TopicPriority(BaseModel):
    topic_id: int
    topic_name: str
    subject_id: int
    subject_name: str
    chapter_id: Optional[int]
    chapter_name: Optional[str]
    priority_score: Decimal
    importance_probability: Optional[Decimal]
    weakness_score: Optional[Decimal]
    subject_weightage: Optional[Decimal]
    recommended_hours: Decimal
    rank: int


class TopicPrioritizationResponse(BaseModel):
    priorities: List[TopicPriority]
    total_topics: int
    total_recommended_hours: Decimal
    metadata: Dict[str, Any]


class DailyTasksRequest(BaseModel):
    student_id: int
    study_plan_id: Optional[int] = None
    date: Optional[date] = None


class DailyTasksSummary(BaseModel):
    date: date
    tasks: List[DailyStudyTaskResponse]
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_estimated_minutes: int
    total_actual_minutes: int
    completion_rate: Decimal


class CalendarSyncRequest(BaseModel):
    study_plan_id: int
    calendar_provider: str = Field(..., description="google, outlook, ical")
    calendar_id: Optional[str] = None
    sync_url: Optional[str] = None


class CalendarSyncResponse(BaseModel):
    success: bool
    synced_tasks_count: int
    calendar_events: List[Dict[str, Any]]
    message: str
