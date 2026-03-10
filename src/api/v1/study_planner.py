from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from decimal import Decimal

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.study_planner import StudyPlanStatus, TaskStatus, TaskPriority
from src.services.study_planner_service import StudyPlannerService
from src.schemas.study_planner import (
    StudyPlanCreate, StudyPlanUpdate, StudyPlanResponse,
    WeakAreaCreate, WeakAreaUpdate, WeakAreaResponse,
    DailyStudyTaskCreate, DailyStudyTaskUpdate, DailyStudyTaskResponse,
    TopicAssignmentCreate, TopicAssignmentUpdate, TopicAssignmentResponse,
    StudyProgressResponse,
    StudyPlanGenerationRequest, StudyPlanGenerationResponse,
    TaskRescheduleRequest, TaskCompletionRequest,
    AdaptiveReschedulingRequest, AdaptiveReschedulingResponse,
    TopicPrioritizationRequest, TopicPrioritizationResponse,
    DailyTasksRequest, DailyTasksSummary,
    CalendarSyncRequest, CalendarSyncResponse
)

router = APIRouter(prefix="/study-planner", tags=["Study Planner"])


@router.post("/plans", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def create_study_plan(
    plan_data: StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.create_study_plan(plan_data)


@router.get("/plans/{plan_id}", response_model=StudyPlanResponse)
def get_study_plan(
    plan_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    plan = service.get_study_plan(plan_id, institution_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return plan


@router.get("/plans", response_model=List[StudyPlanResponse])
def list_study_plans(
    institution_id: int = Query(...),
    student_id: Optional[int] = None,
    status: Optional[StudyPlanStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.list_study_plans(institution_id, student_id, status, skip, limit)


@router.patch("/plans/{plan_id}", response_model=StudyPlanResponse)
def update_study_plan(
    plan_id: int,
    plan_data: StudyPlanUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    plan = service.update_study_plan(plan_id, institution_id, plan_data)
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_plan(
    plan_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    success = service.delete_study_plan(plan_id, institution_id)
    if not success:
        raise HTTPException(status_code=404, detail="Study plan not found")


@router.post("/plans/generate", response_model=StudyPlanGenerationResponse, status_code=status.HTTP_201_CREATED)
def generate_study_plan(
    request: StudyPlanGenerationRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.generate_study_plan(institution_id, request)


@router.post("/weak-areas", response_model=WeakAreaResponse, status_code=status.HTTP_201_CREATED)
def create_weak_area(
    weak_area_data: WeakAreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.weak_area_repo.create_weak_area(weak_area_data)


@router.post("/weak-areas/identify-from-exam", response_model=List[WeakAreaResponse])
def identify_weak_areas_from_exam(
    student_id: int,
    exam_id: int,
    institution_id: int = Query(...),
    weakness_threshold: Decimal = Decimal('60.0'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.identify_weak_areas_from_exam(
        student_id, exam_id, institution_id, weakness_threshold
    )


@router.get("/weak-areas", response_model=List[WeakAreaResponse])
def list_weak_areas(
    institution_id: int = Query(...),
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    is_resolved: Optional[bool] = None,
    min_weakness_score: Optional[Decimal] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.list_weak_areas(
        institution_id, student_id, subject_id, is_resolved,
        min_weakness_score, skip, limit
    )


@router.patch("/weak-areas/{weak_area_id}", response_model=WeakAreaResponse)
def update_weak_area(
    weak_area_id: int,
    weak_area_data: WeakAreaUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    weak_area = service.update_weak_area(weak_area_id, institution_id, weak_area_data)
    if not weak_area:
        raise HTTPException(status_code=404, detail="Weak area not found")
    return weak_area


@router.post("/topics/prioritize", response_model=TopicPrioritizationResponse)
def prioritize_topics(
    request: TopicPrioritizationRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.prioritize_topics(institution_id, request)


@router.post("/tasks", response_model=DailyStudyTaskResponse, status_code=status.HTTP_201_CREATED)
def create_daily_task(
    task_data: DailyStudyTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.daily_task_repo.create_daily_task(task_data)


@router.get("/tasks/{task_id}", response_model=DailyStudyTaskResponse)
def get_daily_task(
    task_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    task = service.daily_task_repo.get_task_by_id(task_id, institution_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/tasks", response_model=List[DailyStudyTaskResponse])
def list_daily_tasks(
    institution_id: int = Query(...),
    study_plan_id: Optional[int] = None,
    student_id: Optional[int] = None,
    task_date: Optional[date] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.daily_task_repo.list_tasks(
        institution_id, study_plan_id, student_id, task_date,
        status, priority, skip, limit
    )


@router.post("/tasks/daily", response_model=DailyTasksSummary)
def get_daily_tasks(
    request: DailyTasksRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.get_daily_tasks(institution_id, request)


@router.patch("/tasks/{task_id}", response_model=DailyStudyTaskResponse)
def update_daily_task(
    task_id: int,
    task_data: DailyStudyTaskUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    task = service.daily_task_repo.update_task(task_id, institution_id, task_data)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks/complete", response_model=DailyStudyTaskResponse)
def complete_task(
    request: TaskCompletionRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    task = service.complete_task(institution_id, request)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks/reschedule", response_model=DailyStudyTaskResponse)
def reschedule_task(
    request: TaskRescheduleRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    task = service.reschedule_task(institution_id, request)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks/adaptive-reschedule", response_model=AdaptiveReschedulingResponse)
def adaptive_reschedule(
    request: AdaptiveReschedulingRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.adaptive_reschedule(institution_id, request)


@router.post("/topic-assignments", response_model=TopicAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_topic_assignment(
    assignment_data: TopicAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.topic_assignment_repo.create_topic_assignment(assignment_data)


@router.get("/topic-assignments", response_model=List[TopicAssignmentResponse])
def list_topic_assignments(
    institution_id: int = Query(...),
    study_plan_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    is_completed: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.topic_assignment_repo.list_assignments(
        institution_id, study_plan_id, subject_id, is_completed, skip, limit
    )


@router.patch("/topic-assignments/{assignment_id}", response_model=TopicAssignmentResponse)
def update_topic_assignment(
    assignment_id: int,
    assignment_data: TopicAssignmentUpdate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    assignment = service.topic_assignment_repo.update_assignment(
        assignment_id, institution_id, assignment_data
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Topic assignment not found")
    return assignment


@router.get("/progress", response_model=List[StudyProgressResponse])
def get_study_progress(
    institution_id: int = Query(...),
    study_plan_id: Optional[int] = None,
    student_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    return service.get_study_progress(
        institution_id, study_plan_id, student_id,
        start_date, end_date, skip, limit
    )


@router.post("/calendar/sync", response_model=CalendarSyncResponse)
def sync_calendar(
    request: CalendarSyncRequest,
    institution_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = StudyPlannerService(db)
    plan = service.get_study_plan(request.study_plan_id, institution_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    tasks = service.daily_task_repo.list_tasks(
        institution_id=institution_id,
        study_plan_id=request.study_plan_id,
        skip=0,
        limit=1000
    )
    
    calendar_events = []
    for task in tasks:
        event = {
            'title': task.title,
            'description': task.description,
            'start': f"{task.task_date}T{task.start_time}" if task.start_time else str(task.task_date),
            'end': f"{task.task_date}T{task.end_time}" if task.end_time else str(task.task_date),
            'status': task.status.value,
            'priority': task.priority.value
        }
        calendar_events.append(event)
    
    plan_update = StudyPlanUpdate(
        calendar_sync_enabled=True,
        calendar_sync_url=request.sync_url
    )
    service.update_study_plan(request.study_plan_id, institution_id, plan_update)
    
    return CalendarSyncResponse(
        success=True,
        synced_tasks_count=len(calendar_events),
        calendar_events=calendar_events,
        message=f"Successfully synced {len(calendar_events)} tasks to calendar"
    )
