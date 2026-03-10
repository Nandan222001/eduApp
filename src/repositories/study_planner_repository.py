from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc

from src.models.study_planner import (
    StudyPlan, WeakArea, DailyStudyTask, TopicAssignment, StudyProgress,
    StudyPlanStatus, TaskStatus, TaskPriority
)
from src.models.student import Student
from src.models.academic import Subject, Chapter, Topic
from src.schemas.study_planner import (
    StudyPlanCreate, StudyPlanUpdate,
    WeakAreaCreate, WeakAreaUpdate,
    DailyStudyTaskCreate, DailyStudyTaskUpdate,
    TopicAssignmentCreate, TopicAssignmentUpdate
)


class StudyPlanRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_study_plan(self, plan_data: StudyPlanCreate) -> StudyPlan:
        plan = StudyPlan(**plan_data.model_dump())
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan
    
    def get_study_plan_by_id(self, plan_id: int, institution_id: int) -> Optional[StudyPlan]:
        return self.db.query(StudyPlan).filter(
            StudyPlan.id == plan_id,
            StudyPlan.institution_id == institution_id
        ).first()
    
    def get_study_plan_with_details(self, plan_id: int, institution_id: int) -> Optional[StudyPlan]:
        return self.db.query(StudyPlan).filter(
            StudyPlan.id == plan_id,
            StudyPlan.institution_id == institution_id
        ).options(
            joinedload(StudyPlan.daily_tasks),
            joinedload(StudyPlan.topic_assignments)
        ).first()
    
    def list_study_plans(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        status: Optional[StudyPlanStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[StudyPlan]:
        query = self.db.query(StudyPlan).filter(StudyPlan.institution_id == institution_id)
        
        if student_id:
            query = query.filter(StudyPlan.student_id == student_id)
        if status:
            query = query.filter(StudyPlan.status == status)
        
        return query.order_by(desc(StudyPlan.created_at)).offset(skip).limit(limit).all()
    
    def update_study_plan(
        self,
        plan_id: int,
        institution_id: int,
        plan_data: StudyPlanUpdate
    ) -> Optional[StudyPlan]:
        plan = self.get_study_plan_by_id(plan_id, institution_id)
        if not plan:
            return None
        
        update_data = plan_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(plan, field, value)
        
        self.db.commit()
        self.db.refresh(plan)
        return plan
    
    def delete_study_plan(self, plan_id: int, institution_id: int) -> bool:
        plan = self.get_study_plan_by_id(plan_id, institution_id)
        if not plan:
            return False
        
        self.db.delete(plan)
        self.db.commit()
        return True
    
    def get_active_plan_for_student(self, student_id: int, institution_id: int) -> Optional[StudyPlan]:
        return self.db.query(StudyPlan).filter(
            StudyPlan.student_id == student_id,
            StudyPlan.institution_id == institution_id,
            StudyPlan.status == StudyPlanStatus.ACTIVE
        ).order_by(desc(StudyPlan.created_at)).first()


class WeakAreaRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_weak_area(self, weak_area_data: WeakAreaCreate) -> WeakArea:
        weak_area = WeakArea(**weak_area_data.model_dump())
        self.db.add(weak_area)
        self.db.commit()
        self.db.refresh(weak_area)
        return weak_area
    
    def get_weak_area_by_id(self, weak_area_id: int, institution_id: int) -> Optional[WeakArea]:
        return self.db.query(WeakArea).filter(
            WeakArea.id == weak_area_id,
            WeakArea.institution_id == institution_id
        ).first()
    
    def list_weak_areas(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        is_resolved: Optional[bool] = None,
        min_weakness_score: Optional[Decimal] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[WeakArea]:
        query = self.db.query(WeakArea).filter(WeakArea.institution_id == institution_id)
        
        if student_id:
            query = query.filter(WeakArea.student_id == student_id)
        if subject_id:
            query = query.filter(WeakArea.subject_id == subject_id)
        if is_resolved is not None:
            query = query.filter(WeakArea.is_resolved == is_resolved)
        if min_weakness_score:
            query = query.filter(WeakArea.weakness_score >= min_weakness_score)
        
        return query.options(
            joinedload(WeakArea.subject),
            joinedload(WeakArea.chapter),
            joinedload(WeakArea.topic)
        ).order_by(desc(WeakArea.weakness_score)).offset(skip).limit(limit).all()
    
    def update_weak_area(
        self,
        weak_area_id: int,
        institution_id: int,
        weak_area_data: WeakAreaUpdate
    ) -> Optional[WeakArea]:
        weak_area = self.get_weak_area_by_id(weak_area_id, institution_id)
        if not weak_area:
            return None
        
        update_data = weak_area_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(weak_area, field, value)
        
        if update_data.get('is_resolved') and not weak_area.resolved_at:
            weak_area.resolved_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(weak_area)
        return weak_area
    
    def delete_weak_area(self, weak_area_id: int, institution_id: int) -> bool:
        weak_area = self.get_weak_area_by_id(weak_area_id, institution_id)
        if not weak_area:
            return False
        
        self.db.delete(weak_area)
        self.db.commit()
        return True
    
    def get_weak_area_by_topic(
        self,
        student_id: int,
        topic_id: int,
        institution_id: int
    ) -> Optional[WeakArea]:
        return self.db.query(WeakArea).filter(
            WeakArea.student_id == student_id,
            WeakArea.topic_id == topic_id,
            WeakArea.institution_id == institution_id,
            WeakArea.is_resolved == False
        ).first()


class DailyStudyTaskRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_daily_task(self, task_data: DailyStudyTaskCreate) -> DailyStudyTask:
        task = DailyStudyTask(**task_data.model_dump())
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def bulk_create_tasks(self, tasks_data: List[DailyStudyTaskCreate]) -> List[DailyStudyTask]:
        tasks = [DailyStudyTask(**task_data.model_dump()) for task_data in tasks_data]
        self.db.add_all(tasks)
        self.db.commit()
        for task in tasks:
            self.db.refresh(task)
        return tasks
    
    def get_task_by_id(self, task_id: int, institution_id: int) -> Optional[DailyStudyTask]:
        return self.db.query(DailyStudyTask).filter(
            DailyStudyTask.id == task_id,
            DailyStudyTask.institution_id == institution_id
        ).first()
    
    def list_tasks(
        self,
        institution_id: int,
        study_plan_id: Optional[int] = None,
        student_id: Optional[int] = None,
        task_date: Optional[date] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[DailyStudyTask]:
        query = self.db.query(DailyStudyTask).filter(
            DailyStudyTask.institution_id == institution_id
        )
        
        if study_plan_id:
            query = query.filter(DailyStudyTask.study_plan_id == study_plan_id)
        if student_id:
            query = query.filter(DailyStudyTask.student_id == student_id)
        if task_date:
            query = query.filter(DailyStudyTask.task_date == task_date)
        if status:
            query = query.filter(DailyStudyTask.status == status)
        if priority:
            query = query.filter(DailyStudyTask.priority == priority)
        
        return query.options(
            joinedload(DailyStudyTask.subject),
            joinedload(DailyStudyTask.chapter),
            joinedload(DailyStudyTask.topic)
        ).order_by(
            DailyStudyTask.task_date,
            desc(DailyStudyTask.priority_score)
        ).offset(skip).limit(limit).all()
    
    def get_tasks_by_date_range(
        self,
        institution_id: int,
        student_id: int,
        start_date: date,
        end_date: date,
        study_plan_id: Optional[int] = None
    ) -> List[DailyStudyTask]:
        query = self.db.query(DailyStudyTask).filter(
            DailyStudyTask.institution_id == institution_id,
            DailyStudyTask.student_id == student_id,
            DailyStudyTask.task_date >= start_date,
            DailyStudyTask.task_date <= end_date
        )
        
        if study_plan_id:
            query = query.filter(DailyStudyTask.study_plan_id == study_plan_id)
        
        return query.options(
            joinedload(DailyStudyTask.subject),
            joinedload(DailyStudyTask.chapter),
            joinedload(DailyStudyTask.topic)
        ).order_by(
            DailyStudyTask.task_date,
            desc(DailyStudyTask.priority_score)
        ).all()
    
    def update_task(
        self,
        task_id: int,
        institution_id: int,
        task_data: DailyStudyTaskUpdate
    ) -> Optional[DailyStudyTask]:
        task = self.get_task_by_id(task_id, institution_id)
        if not task:
            return None
        
        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        if update_data.get('status') == TaskStatus.COMPLETED and not task.completed_at:
            task.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def delete_task(self, task_id: int, institution_id: int) -> bool:
        task = self.get_task_by_id(task_id, institution_id)
        if not task:
            return False
        
        self.db.delete(task)
        self.db.commit()
        return True
    
    def get_pending_tasks_for_study_plan(
        self,
        study_plan_id: int,
        institution_id: int,
        from_date: Optional[date] = None
    ) -> List[DailyStudyTask]:
        query = self.db.query(DailyStudyTask).filter(
            DailyStudyTask.study_plan_id == study_plan_id,
            DailyStudyTask.institution_id == institution_id,
            DailyStudyTask.status == TaskStatus.PENDING
        )
        
        if from_date:
            query = query.filter(DailyStudyTask.task_date >= from_date)
        
        return query.order_by(DailyStudyTask.task_date).all()


class TopicAssignmentRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_topic_assignment(self, assignment_data: TopicAssignmentCreate) -> TopicAssignment:
        assignment = TopicAssignment(**assignment_data.model_dump())
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment
    
    def bulk_create_assignments(
        self,
        assignments_data: List[TopicAssignmentCreate]
    ) -> List[TopicAssignment]:
        assignments = [
            TopicAssignment(**assignment_data.model_dump())
            for assignment_data in assignments_data
        ]
        self.db.add_all(assignments)
        self.db.commit()
        for assignment in assignments:
            self.db.refresh(assignment)
        return assignments
    
    def get_assignment_by_id(
        self,
        assignment_id: int,
        institution_id: int
    ) -> Optional[TopicAssignment]:
        return self.db.query(TopicAssignment).filter(
            TopicAssignment.id == assignment_id,
            TopicAssignment.institution_id == institution_id
        ).first()
    
    def list_assignments(
        self,
        institution_id: int,
        study_plan_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        is_completed: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[TopicAssignment]:
        query = self.db.query(TopicAssignment).filter(
            TopicAssignment.institution_id == institution_id
        )
        
        if study_plan_id:
            query = query.filter(TopicAssignment.study_plan_id == study_plan_id)
        if subject_id:
            query = query.filter(TopicAssignment.subject_id == subject_id)
        if is_completed is not None:
            query = query.filter(TopicAssignment.is_completed == is_completed)
        
        return query.options(
            joinedload(TopicAssignment.subject),
            joinedload(TopicAssignment.chapter),
            joinedload(TopicAssignment.topic)
        ).order_by(desc(TopicAssignment.priority_score)).offset(skip).limit(limit).all()
    
    def update_assignment(
        self,
        assignment_id: int,
        institution_id: int,
        assignment_data: TopicAssignmentUpdate
    ) -> Optional[TopicAssignment]:
        assignment = self.get_assignment_by_id(assignment_id, institution_id)
        if not assignment:
            return None
        
        update_data = assignment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(assignment, field, value)
        
        self.db.commit()
        self.db.refresh(assignment)
        return assignment
    
    def delete_assignment(self, assignment_id: int, institution_id: int) -> bool:
        assignment = self.get_assignment_by_id(assignment_id, institution_id)
        if not assignment:
            return False
        
        self.db.delete(assignment)
        self.db.commit()
        return True


class StudyProgressRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create_progress(self, progress_data: Dict[str, Any]) -> StudyProgress:
        progress = StudyProgress(**progress_data)
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        return progress
    
    def get_progress_by_id(self, progress_id: int, institution_id: int) -> Optional[StudyProgress]:
        return self.db.query(StudyProgress).filter(
            StudyProgress.id == progress_id,
            StudyProgress.institution_id == institution_id
        ).first()
    
    def get_progress_by_date(
        self,
        study_plan_id: int,
        progress_date: date,
        institution_id: int
    ) -> Optional[StudyProgress]:
        return self.db.query(StudyProgress).filter(
            StudyProgress.study_plan_id == study_plan_id,
            StudyProgress.progress_date == progress_date,
            StudyProgress.institution_id == institution_id
        ).first()
    
    def list_progress(
        self,
        institution_id: int,
        study_plan_id: Optional[int] = None,
        student_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[StudyProgress]:
        query = self.db.query(StudyProgress).filter(
            StudyProgress.institution_id == institution_id
        )
        
        if study_plan_id:
            query = query.filter(StudyProgress.study_plan_id == study_plan_id)
        if student_id:
            query = query.filter(StudyProgress.student_id == student_id)
        if start_date:
            query = query.filter(StudyProgress.progress_date >= start_date)
        if end_date:
            query = query.filter(StudyProgress.progress_date <= end_date)
        
        return query.order_by(desc(StudyProgress.progress_date)).offset(skip).limit(limit).all()
    
    def update_progress(
        self,
        progress_id: int,
        institution_id: int,
        progress_data: Dict[str, Any]
    ) -> Optional[StudyProgress]:
        progress = self.get_progress_by_id(progress_id, institution_id)
        if not progress:
            return None
        
        for field, value in progress_data.items():
            setattr(progress, field, value)
        
        self.db.commit()
        self.db.refresh(progress)
        return progress
