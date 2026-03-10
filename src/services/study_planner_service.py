from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime, timedelta, time
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from src.repositories.study_planner_repository import (
    StudyPlanRepository, WeakAreaRepository,
    DailyStudyTaskRepository, TopicAssignmentRepository,
    StudyProgressRepository
)
from src.repositories.examination_repository import (
    ExamRepository, ExamMarksRepository, ExamSubjectRepository
)
from src.models.study_planner import StudyPlanStatus, TaskStatus, TaskPriority
from src.models.academic import Subject, Chapter, Topic
from src.models.examination import ExamSubject
from src.schemas.study_planner import (
    StudyPlanCreate, StudyPlanUpdate, StudyPlanResponse,
    WeakAreaCreate, WeakAreaUpdate,
    DailyStudyTaskCreate, DailyStudyTaskUpdate,
    TopicAssignmentCreate, TopicAssignmentUpdate,
    StudyPlanGenerationRequest, StudyPlanGenerationResponse,
    TaskRescheduleRequest, TaskCompletionRequest,
    AdaptiveReschedulingRequest, AdaptiveReschedulingResponse,
    TopicPrioritizationRequest, TopicPrioritizationResponse, TopicPriority,
    DailyTasksRequest, DailyTasksSummary
)


class StudyPlannerService:
    def __init__(self, db: Session):
        self.db = db
        self.study_plan_repo = StudyPlanRepository(db)
        self.weak_area_repo = WeakAreaRepository(db)
        self.daily_task_repo = DailyStudyTaskRepository(db)
        self.topic_assignment_repo = TopicAssignmentRepository(db)
        self.progress_repo = StudyProgressRepository(db)
        self.exam_repo = ExamRepository(db)
        self.exam_marks_repo = ExamMarksRepository(db)
        self.exam_subject_repo = ExamSubjectRepository(db)
    
    def create_study_plan(self, plan_data: StudyPlanCreate):
        return self.study_plan_repo.create_study_plan(plan_data)
    
    def get_study_plan(self, plan_id: int, institution_id: int):
        return self.study_plan_repo.get_study_plan_by_id(plan_id, institution_id)
    
    def get_study_plan_with_details(self, plan_id: int, institution_id: int):
        return self.study_plan_repo.get_study_plan_with_details(plan_id, institution_id)
    
    def list_study_plans(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        status: Optional[StudyPlanStatus] = None,
        skip: int = 0,
        limit: int = 100
    ):
        return self.study_plan_repo.list_study_plans(
            institution_id, student_id, status, skip, limit
        )
    
    def update_study_plan(self, plan_id: int, institution_id: int, plan_data: StudyPlanUpdate):
        return self.study_plan_repo.update_study_plan(plan_id, institution_id, plan_data)
    
    def delete_study_plan(self, plan_id: int, institution_id: int) -> bool:
        return self.study_plan_repo.delete_study_plan(plan_id, institution_id)
    
    def identify_weak_areas_from_exam(
        self,
        student_id: int,
        exam_id: int,
        institution_id: int,
        weakness_threshold: Decimal = Decimal('60.0')
    ) -> List[Any]:
        exam_subjects = self.exam_subject_repo.get_exam_subjects_by_exam(exam_id, institution_id)
        weak_areas = []
        
        for exam_subject in exam_subjects:
            marks = self.exam_marks_repo.get_student_marks(
                exam_subject.id, student_id, institution_id
            )
            
            if marks and not marks.is_absent:
                theory_obtained = marks.theory_marks_obtained or Decimal('0')
                practical_obtained = marks.practical_marks_obtained or Decimal('0')
                total_obtained = theory_obtained + practical_obtained
                total_max = exam_subject.theory_max_marks + exam_subject.practical_max_marks
                
                percentage = (total_obtained / total_max * 100) if total_max > 0 else Decimal('0')
                
                if percentage < weakness_threshold:
                    weakness_score = Decimal('100') - percentage
                    
                    weak_area_data = WeakAreaCreate(
                        institution_id=institution_id,
                        student_id=student_id,
                        subject_id=exam_subject.subject_id,
                        weakness_score=weakness_score,
                        average_score=percentage,
                        attempts_count=1,
                        identified_from=f"exam_{exam_id}"
                    )
                    weak_area = self.weak_area_repo.create_weak_area(weak_area_data)
                    weak_areas.append(weak_area)
        
        return weak_areas
    
    def list_weak_areas(
        self,
        institution_id: int,
        student_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        is_resolved: Optional[bool] = None,
        min_weakness_score: Optional[Decimal] = None,
        skip: int = 0,
        limit: int = 100
    ):
        return self.weak_area_repo.list_weak_areas(
            institution_id, student_id, subject_id, is_resolved,
            min_weakness_score, skip, limit
        )
    
    def update_weak_area(
        self,
        weak_area_id: int,
        institution_id: int,
        weak_area_data: WeakAreaUpdate
    ):
        return self.weak_area_repo.update_weak_area(weak_area_id, institution_id, weak_area_data)
    
    def calculate_topic_priority_score(
        self,
        importance_probability: Decimal,
        weakness_score: Decimal,
        subject_weightage: Decimal
    ) -> Decimal:
        probability_weight = Decimal('0.4')
        weakness_weight = Decimal('0.35')
        weightage_weight = Decimal('0.25')
        
        normalized_probability = importance_probability / Decimal('1.0')
        normalized_weakness = weakness_score / Decimal('100.0')
        normalized_weightage = subject_weightage / Decimal('100.0')
        
        priority_score = (
            (normalized_probability * probability_weight) +
            (normalized_weakness * weakness_weight) +
            (normalized_weightage * weightage_weight)
        ) * Decimal('100')
        
        return priority_score
    
    def prioritize_topics(
        self,
        institution_id: int,
        request: TopicPrioritizationRequest
    ) -> TopicPrioritizationResponse:
        weak_areas = self.weak_area_repo.list_weak_areas(
            institution_id=institution_id,
            student_id=request.student_id,
            subject_id=request.subject_id,
            is_resolved=False if request.include_weak_areas_only else None,
            skip=0,
            limit=1000
        )
        
        exam_subjects = []
        if request.exam_id:
            exam_subjects = self.exam_subject_repo.get_exam_subjects_by_exam(
                request.exam_id, institution_id
            )
        
        subject_weightage_map = {}
        for exam_subject in exam_subjects:
            if exam_subject.weightage:
                subject_weightage_map[exam_subject.subject_id] = exam_subject.weightage
        
        topic_priorities = []
        for weak_area in weak_areas:
            subject_weightage = subject_weightage_map.get(
                weak_area.subject_id,
                Decimal('50.0')
            )
            
            importance_probability = Decimal('0.5')
            
            priority_score = self.calculate_topic_priority_score(
                importance_probability,
                weak_area.weakness_score,
                subject_weightage
            )
            
            recommended_hours = self._calculate_recommended_hours(
                weak_area.weakness_score,
                subject_weightage
            )
            
            topic_name = weak_area.topic.name if weak_area.topic else weak_area.chapter.name if weak_area.chapter else weak_area.subject.name
            chapter_name = weak_area.chapter.name if weak_area.chapter else None
            
            topic_priorities.append(TopicPriority(
                topic_id=weak_area.topic_id or weak_area.chapter_id or weak_area.subject_id,
                topic_name=topic_name,
                subject_id=weak_area.subject_id,
                subject_name=weak_area.subject.name,
                chapter_id=weak_area.chapter_id,
                chapter_name=chapter_name,
                priority_score=priority_score,
                importance_probability=importance_probability,
                weakness_score=weak_area.weakness_score,
                subject_weightage=subject_weightage,
                recommended_hours=recommended_hours,
                rank=0
            ))
        
        topic_priorities.sort(key=lambda x: x.priority_score, reverse=True)
        for rank, topic_priority in enumerate(topic_priorities, start=1):
            topic_priority.rank = rank
        
        total_recommended_hours = sum(tp.recommended_hours for tp in topic_priorities)
        
        return TopicPrioritizationResponse(
            priorities=topic_priorities,
            total_topics=len(topic_priorities),
            total_recommended_hours=total_recommended_hours,
            metadata={
                'calculation_method': 'probability_weakness_weightage',
                'weights': {
                    'probability': 0.4,
                    'weakness': 0.35,
                    'weightage': 0.25
                }
            }
        )
    
    def _calculate_recommended_hours(
        self,
        weakness_score: Decimal,
        subject_weightage: Decimal
    ) -> Decimal:
        base_hours = Decimal('2.0')
        
        weakness_multiplier = weakness_score / Decimal('100.0')
        weightage_multiplier = subject_weightage / Decimal('100.0')
        
        recommended_hours = base_hours * (
            Decimal('1.0') + weakness_multiplier + (weightage_multiplier * Decimal('0.5'))
        )
        
        return min(recommended_hours, Decimal('10.0'))
    
    def generate_study_plan(
        self,
        institution_id: int,
        request: StudyPlanGenerationRequest
    ) -> StudyPlanGenerationResponse:
        study_plan_data = StudyPlanCreate(
            institution_id=institution_id,
            student_id=request.student_id,
            name=f"Study Plan for {request.start_date} to {request.end_date}",
            description="AI-generated personalized study plan",
            target_exam_id=request.target_exam_id,
            target_exam_date=request.target_exam_date,
            start_date=request.start_date,
            end_date=request.end_date,
            hours_per_day=request.hours_per_day,
            metadata=request.metadata
        )
        
        study_plan = self.study_plan_repo.create_study_plan(study_plan_data)
        
        prioritization_request = TopicPrioritizationRequest(
            student_id=request.student_id,
            exam_id=request.target_exam_id,
            include_weak_areas_only=True
        )
        prioritization_response = self.prioritize_topics(institution_id, prioritization_request)
        
        available_days = self._calculate_available_days(
            request.start_date,
            request.end_date,
            request.include_weekends,
            request.excluded_dates or []
        )
        
        total_available_hours = len(available_days) * float(request.hours_per_day)
        
        topic_assignments = []
        for topic_priority in prioritization_response.priorities:
            allocation_percentage = float(topic_priority.priority_score) / sum(
                float(tp.priority_score) for tp in prioritization_response.priorities
            )
            allocated_hours = Decimal(str(total_available_hours * allocation_percentage))
            
            assignment_data = TopicAssignmentCreate(
                institution_id=institution_id,
                study_plan_id=study_plan.id,
                subject_id=topic_priority.subject_id,
                chapter_id=topic_priority.chapter_id,
                topic_id=topic_priority.topic_id,
                priority_score=topic_priority.priority_score,
                importance_probability=topic_priority.importance_probability,
                weakness_score=topic_priority.weakness_score,
                subject_weightage=topic_priority.subject_weightage,
                allocated_hours=allocated_hours
            )
            
            assignment = self.topic_assignment_repo.create_topic_assignment(assignment_data)
            topic_assignments.append(assignment)
        
        daily_tasks = self._generate_daily_tasks(
            institution_id=institution_id,
            study_plan=study_plan,
            topic_assignments=topic_assignments,
            available_days=available_days,
            hours_per_day=request.hours_per_day,
            preferred_start_time=request.preferred_start_time
        )
        
        total_study_hours = sum(ta.allocated_hours for ta in topic_assignments)
        study_plan.total_study_hours = total_study_hours
        study_plan.status = StudyPlanStatus.ACTIVE
        self.db.commit()
        self.db.refresh(study_plan)
        
        summary = {
            'total_days': len(available_days),
            'total_hours': float(total_study_hours),
            'total_topics': len(topic_assignments),
            'total_tasks': len(daily_tasks),
            'average_tasks_per_day': round(len(daily_tasks) / len(available_days), 2) if available_days else 0
        }
        
        from src.schemas.study_planner import TopicAssignmentResponse, DailyStudyTaskResponse
        
        return StudyPlanGenerationResponse(
            study_plan=StudyPlanResponse.model_validate(study_plan),
            topic_assignments=[TopicAssignmentResponse.model_validate(ta) for ta in topic_assignments],
            daily_tasks=[DailyStudyTaskResponse.model_validate(dt) for dt in daily_tasks],
            summary=summary
        )
    
    def _calculate_available_days(
        self,
        start_date: date,
        end_date: date,
        include_weekends: bool,
        excluded_dates: List[date]
    ) -> List[date]:
        available_days = []
        current_date = start_date
        
        while current_date <= end_date:
            if current_date not in excluded_dates:
                if include_weekends or current_date.weekday() < 5:
                    available_days.append(current_date)
            current_date += timedelta(days=1)
        
        return available_days
    
    def _generate_daily_tasks(
        self,
        institution_id: int,
        study_plan: Any,
        topic_assignments: List[Any],
        available_days: List[date],
        hours_per_day: Decimal,
        preferred_start_time: Optional[time]
    ) -> List[Any]:
        daily_tasks = []
        
        sorted_assignments = sorted(
            topic_assignments,
            key=lambda x: x.priority_score,
            reverse=True
        )
        
        day_index = 0
        for assignment in sorted_assignments:
            remaining_hours = assignment.allocated_hours
            
            while remaining_hours > 0 and day_index < len(available_days):
                task_date = available_days[day_index]
                
                session_hours = min(remaining_hours, Decimal('2.0'))
                duration_minutes = int(session_hours * 60)
                
                start_time_val = preferred_start_time
                end_time_val = None
                if start_time_val:
                    start_datetime = datetime.combine(task_date, start_time_val)
                    end_datetime = start_datetime + timedelta(minutes=duration_minutes)
                    end_time_val = end_datetime.time()
                
                subject = self.db.query(Subject).filter(
                    Subject.id == assignment.subject_id
                ).first()
                
                topic_name = ""
                if assignment.topic_id:
                    topic = self.db.query(Topic).filter(Topic.id == assignment.topic_id).first()
                    topic_name = topic.name if topic else ""
                elif assignment.chapter_id:
                    chapter = self.db.query(Chapter).filter(Chapter.id == assignment.chapter_id).first()
                    topic_name = chapter.name if chapter else ""
                else:
                    topic_name = subject.name if subject else ""
                
                priority = self._map_priority_score_to_level(assignment.priority_score)
                
                task_data = DailyStudyTaskCreate(
                    institution_id=institution_id,
                    study_plan_id=study_plan.id,
                    student_id=study_plan.student_id,
                    task_date=task_date,
                    subject_id=assignment.subject_id,
                    chapter_id=assignment.chapter_id,
                    topic_id=assignment.topic_id,
                    title=f"Study: {topic_name}",
                    description=f"Focus on {subject.name if subject else 'subject'} - {topic_name}",
                    priority=priority,
                    priority_score=assignment.priority_score,
                    estimated_duration_minutes=duration_minutes,
                    start_time=start_time_val,
                    end_time=end_time_val
                )
                
                task = self.daily_task_repo.create_daily_task(task_data)
                daily_tasks.append(task)
                
                remaining_hours -= session_hours
                day_index += 1
        
        return daily_tasks
    
    def _map_priority_score_to_level(self, priority_score: Decimal) -> TaskPriority:
        if priority_score >= 80:
            return TaskPriority.CRITICAL
        elif priority_score >= 60:
            return TaskPriority.HIGH
        elif priority_score >= 40:
            return TaskPriority.MEDIUM
        else:
            return TaskPriority.LOW
    
    def get_daily_tasks(
        self,
        institution_id: int,
        request: DailyTasksRequest
    ) -> DailyTasksSummary:
        task_date = request.date or date.today()
        
        tasks = self.daily_task_repo.list_tasks(
            institution_id=institution_id,
            student_id=request.student_id,
            study_plan_id=request.study_plan_id,
            task_date=task_date,
            skip=0,
            limit=100
        )
        
        completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        pending_tasks = sum(1 for t in tasks if t.status == TaskStatus.PENDING)
        total_estimated_minutes = sum(t.estimated_duration_minutes for t in tasks)
        total_actual_minutes = sum(t.actual_duration_minutes or 0 for t in tasks)
        
        completion_rate = Decimal('0')
        if len(tasks) > 0:
            completion_rate = Decimal(str(completed_tasks / len(tasks) * 100))
        
        return DailyTasksSummary(
            date=task_date,
            tasks=tasks,
            total_tasks=len(tasks),
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            total_estimated_minutes=total_estimated_minutes,
            total_actual_minutes=total_actual_minutes,
            completion_rate=completion_rate
        )
    
    def complete_task(
        self,
        institution_id: int,
        request: TaskCompletionRequest
    ):
        update_data = DailyStudyTaskUpdate(
            status=TaskStatus.COMPLETED,
            completion_percentage=request.completion_percentage,
            actual_duration_minutes=request.actual_duration_minutes
        )
        
        task = self.daily_task_repo.update_task(
            request.task_id, institution_id, update_data
        )
        
        if task:
            self._update_study_progress(task)
        
        return task
    
    def reschedule_task(
        self,
        institution_id: int,
        request: TaskRescheduleRequest
    ):
        task = self.daily_task_repo.get_task_by_id(request.task_id, institution_id)
        if not task:
            return None
        
        update_data = DailyStudyTaskUpdate(
            task_date=request.new_date,
            status=TaskStatus.RESCHEDULED,
            metadata={
                **(task.metadata or {}),
                'rescheduled_from': str(task.task_date),
                'reschedule_reason': request.reason
            }
        )
        
        updated_task = self.daily_task_repo.update_task(
            request.task_id, institution_id, update_data
        )
        
        updated_task.rescheduled_from_date = task.task_date
        updated_task.rescheduled_to_date = request.new_date
        updated_task.rescheduled_reason = request.reason
        updated_task.status = TaskStatus.PENDING
        self.db.commit()
        self.db.refresh(updated_task)
        
        return updated_task
    
    def adaptive_reschedule(
        self,
        institution_id: int,
        request: AdaptiveReschedulingRequest
    ) -> AdaptiveReschedulingResponse:
        study_plan = self.study_plan_repo.get_study_plan_by_id(
            request.study_plan_id, institution_id
        )
        
        if not study_plan or not study_plan.adaptive_rescheduling_enabled:
            return AdaptiveReschedulingResponse(
                rescheduled_tasks_count=0,
                affected_dates=[],
                new_tasks=[],
                updated_tasks=[],
                message="Adaptive rescheduling is not enabled for this study plan"
            )
        
        pending_tasks = self.daily_task_repo.get_pending_tasks_for_study_plan(
            request.study_plan_id, institution_id, date.today()
        )
        
        if not request.consider_pending_tasks:
            pending_tasks = [t for t in pending_tasks if t.task_date < date.today()]
        
        available_days = self._calculate_available_days(
            date.today(),
            study_plan.end_date,
            True,
            []
        )
        
        updated_tasks = []
        affected_dates = set()
        
        for i, task in enumerate(pending_tasks):
            if i < len(available_days):
                new_date = available_days[i]
                
                update_data = DailyStudyTaskUpdate(
                    task_date=new_date,
                    status=TaskStatus.PENDING
                )
                
                updated_task = self.daily_task_repo.update_task(
                    task.id, institution_id, update_data
                )
                
                if updated_task:
                    updated_task.rescheduled_from_date = task.task_date
                    updated_task.rescheduled_to_date = new_date
                    updated_task.rescheduled_reason = request.reason
                    self.db.commit()
                    self.db.refresh(updated_task)
                    
                    updated_tasks.append(updated_task)
                    affected_dates.add(new_date)
        
        study_plan.last_rescheduled_at = datetime.utcnow()
        self.db.commit()
        
        return AdaptiveReschedulingResponse(
            rescheduled_tasks_count=len(updated_tasks),
            affected_dates=sorted(list(affected_dates)),
            new_tasks=[],
            updated_tasks=updated_tasks,
            message=f"Successfully rescheduled {len(updated_tasks)} tasks"
        )
    
    def _update_study_progress(self, task: Any):
        existing_progress = self.progress_repo.get_progress_by_date(
            task.study_plan_id, task.task_date, task.institution_id
        )
        
        tasks_for_day = self.daily_task_repo.list_tasks(
            institution_id=task.institution_id,
            study_plan_id=task.study_plan_id,
            task_date=task.task_date,
            skip=0,
            limit=100
        )
        
        total_tasks = len(tasks_for_day)
        completed_tasks = sum(1 for t in tasks_for_day if t.status == TaskStatus.COMPLETED)
        skipped_tasks = sum(1 for t in tasks_for_day if t.status == TaskStatus.SKIPPED)
        
        total_study_hours = sum(Decimal(t.estimated_duration_minutes) / 60 for t in tasks_for_day)
        actual_study_hours = sum(
            Decimal(t.actual_duration_minutes or 0) / 60
            for t in tasks_for_day
            if t.status == TaskStatus.COMPLETED
        )
        
        completion_rate = Decimal('0')
        if total_tasks > 0:
            completion_rate = Decimal(str(completed_tasks / total_tasks * 100))
        
        adherence_score = Decimal('0')
        if float(total_study_hours) > 0:
            adherence_score = (actual_study_hours / total_study_hours * 100)
        
        progress_data = {
            'institution_id': task.institution_id,
            'student_id': task.student_id,
            'study_plan_id': task.study_plan_id,
            'progress_date': task.task_date,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'skipped_tasks': skipped_tasks,
            'total_study_hours': total_study_hours,
            'actual_study_hours': actual_study_hours,
            'completion_rate': completion_rate,
            'adherence_score': adherence_score,
            'productivity_score': min(completion_rate, adherence_score)
        }
        
        if existing_progress:
            self.progress_repo.update_progress(
                existing_progress.id, task.institution_id, progress_data
            )
        else:
            self.progress_repo.create_progress(progress_data)
    
    def get_study_progress(
        self,
        institution_id: int,
        study_plan_id: Optional[int] = None,
        student_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
    ):
        return self.progress_repo.list_progress(
            institution_id, study_plan_id, student_id,
            start_date, end_date, skip, limit
        )
