from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
import math
from collections import defaultdict

from src.models.learning_path import (
    LearningPath, TopicSequence, TopicPerformanceData, LearningMilestone,
    SpacedRepetitionSchedule, ReviewHistory, LearningVelocityRecord,
    DifficultyProgression, PrerequisiteRelationship,
    DifficultyLevel, MasteryLevel, LearningPathStatus, MilestoneStatus, ReviewPriority
)
from src.models.academic import Topic
from src.schemas.learning_path import (
    LearningPathCreate, SequenceGenerationRequest, MasteryUpdateRequest,
    TopicPerformanceDataCreate, SpacedRepetitionScheduleUpdate
)


class AdaptiveLearningPathService:
    """Service for managing adaptive learning paths with AI-driven personalization"""
    
    @staticmethod
    def create_learning_path(
        db: Session,
        institution_id: int,
        path_data: LearningPathCreate
    ) -> LearningPath:
        """Create a new learning path for a student"""
        learning_path = LearningPath(
            institution_id=institution_id,
            student_id=path_data.student_id,
            grade_id=path_data.grade_id,
            subject_id=path_data.subject_id,
            name=path_data.name,
            description=path_data.description,
            target_date=path_data.target_date,
            status=LearningPathStatus.ACTIVE,
            current_difficulty=DifficultyLevel.BEGINNER,
            learning_velocity=1.0,
            adaptation_score=0.0,
            completion_percentage=0.0,
        )
        db.add(learning_path)
        db.commit()
        db.refresh(learning_path)
        return learning_path
    
    @staticmethod
    def generate_personalized_sequence(
        db: Session,
        institution_id: int,
        request: SequenceGenerationRequest
    ) -> LearningPath:
        """Generate personalized curriculum sequence using prerequisites and AI predictions"""
        # Create the learning path
        learning_path = LearningPath(
            institution_id=institution_id,
            student_id=request.student_id,
            grade_id=request.grade_id,
            subject_id=request.subject_id,
            name=f"Personalized Path - {datetime.utcnow().strftime('%Y-%m-%d')}",
            target_date=request.target_date,
            status=LearningPathStatus.ACTIVE,
            learning_velocity=1.0
        )
        db.add(learning_path)
        db.flush()
        
        # Get prerequisite relationships
        prerequisite_map = AdaptiveLearningPathService._build_prerequisite_map(
            db, institution_id, request.topic_ids
        )
        
        # Perform topological sort to respect prerequisites
        ordered_topics = AdaptiveLearningPathService._topological_sort(
            request.topic_ids, prerequisite_map
        )
        
        # Get student's historical performance
        performance_data = AdaptiveLearningPathService._get_student_performance_history(
            db, institution_id, request.student_id
        )
        
        # Create topic sequences with adaptive difficulty
        for order, topic_id in enumerate(ordered_topics, start=1):
            # Determine difficulty based on student capability
            difficulty = AdaptiveLearningPathService._calculate_initial_difficulty(
                topic_id, performance_data, request.include_ai_predictions
            )
            
            # Get prerequisites for this topic
            prereqs = prerequisite_map.get(topic_id, [])
            
            topic_sequence = TopicSequence(
                institution_id=institution_id,
                learning_path_id=learning_path.id,
                topic_id=topic_id,
                sequence_order=order,
                prerequisite_topic_ids=prereqs if prereqs else None,
                difficulty_level=difficulty,
                mastery_level=MasteryLevel.NOT_STARTED,
                mastery_score=0.0,
                is_unlocked=(order == 1),  # Only first topic is unlocked
                estimated_duration_minutes=AdaptiveLearningPathService._estimate_duration(difficulty)
            )
            db.add(topic_sequence)
        
        # Create milestones
        AdaptiveLearningPathService._create_milestones(
            db, institution_id, learning_path.id, ordered_topics
        )
        
        db.commit()
        db.refresh(learning_path)
        return learning_path
    
    @staticmethod
    def _build_prerequisite_map(
        db: Session,
        institution_id: int,
        topic_ids: List[int]
    ) -> Dict[int, List[int]]:
        """Build a map of topic_id -> list of prerequisite topic_ids"""
        prereqs = db.query(PrerequisiteRelationship).filter(
            PrerequisiteRelationship.institution_id == institution_id,
            PrerequisiteRelationship.topic_id.in_(topic_ids)
        ).all()
        
        prereq_map = defaultdict(list)
        for prereq in prereqs:
            if prereq.prerequisite_topic_id in topic_ids:
                prereq_map[prereq.topic_id].append(prereq.prerequisite_topic_id)
        
        return dict(prereq_map)
    
    @staticmethod
    def _topological_sort(topic_ids: List[int], prerequisite_map: Dict[int, List[int]]) -> List[int]:
        """Perform topological sort to order topics based on prerequisites"""
        in_degree = {topic_id: 0 for topic_id in topic_ids}
        
        # Calculate in-degrees
        for topic_id in topic_ids:
            for prereq in prerequisite_map.get(topic_id, []):
                in_degree[topic_id] += 1
        
        # Queue for topics with no prerequisites
        queue = [tid for tid in topic_ids if in_degree[tid] == 0]
        result = []
        
        while queue:
            # Sort queue to ensure consistent ordering
            queue.sort()
            current = queue.pop(0)
            result.append(current)
            
            # Reduce in-degree for dependent topics
            for topic_id in topic_ids:
                if current in prerequisite_map.get(topic_id, []):
                    in_degree[topic_id] -= 1
                    if in_degree[topic_id] == 0:
                        queue.append(topic_id)
        
        # If cycle detected, add remaining topics
        if len(result) < len(topic_ids):
            remaining = [tid for tid in topic_ids if tid not in result]
            result.extend(sorted(remaining))
        
        return result
    
    @staticmethod
    def _get_student_performance_history(
        db: Session,
        institution_id: int,
        student_id: int
    ) -> Dict[int, float]:
        """Get student's historical performance by topic"""
        performances = db.query(
            TopicPerformanceData.topic_sequence_id,
            func.avg(TopicPerformanceData.practice_accuracy).label('avg_accuracy')
        ).join(TopicSequence).filter(
            TopicPerformanceData.institution_id == institution_id,
            TopicPerformanceData.student_id == student_id
        ).group_by(TopicPerformanceData.topic_sequence_id).all()
        
        return {p.topic_sequence_id: p.avg_accuracy or 0.5 for p in performances}
    
    @staticmethod
    def _calculate_initial_difficulty(
        topic_id: int,
        performance_data: Dict[int, float],
        use_ai: bool
    ) -> DifficultyLevel:
        """Calculate initial difficulty level for a topic"""
        # Default to intermediate
        avg_performance = sum(performance_data.values()) / len(performance_data) if performance_data else 0.5
        
        if avg_performance >= 0.85:
            return DifficultyLevel.ADVANCED
        elif avg_performance >= 0.7:
            return DifficultyLevel.INTERMEDIATE
        elif avg_performance >= 0.5:
            return DifficultyLevel.ELEMENTARY
        else:
            return DifficultyLevel.BEGINNER
    
    @staticmethod
    def _estimate_duration(difficulty: DifficultyLevel) -> int:
        """Estimate duration in minutes based on difficulty"""
        duration_map = {
            DifficultyLevel.BEGINNER: 30,
            DifficultyLevel.ELEMENTARY: 45,
            DifficultyLevel.INTERMEDIATE: 60,
            DifficultyLevel.ADVANCED: 75,
            DifficultyLevel.EXPERT: 90
        }
        return duration_map.get(difficulty, 60)
    
    @staticmethod
    def _create_milestones(
        db: Session,
        institution_id: int,
        learning_path_id: int,
        topic_ids: List[int]
    ):
        """Create milestones for the learning path"""
        # Create milestones every 5 topics or at 25%, 50%, 75%, 100% completion
        total_topics = len(topic_ids)
        milestone_positions = [
            int(total_topics * 0.25),
            int(total_topics * 0.5),
            int(total_topics * 0.75),
            total_topics
        ]
        
        milestone_names = ["Foundation", "Intermediate", "Advanced", "Mastery"]
        
        for order, (pos, name) in enumerate(zip(milestone_positions, milestone_names), start=1):
            if pos > 0 and pos <= total_topics:
                milestone = LearningMilestone(
                    institution_id=institution_id,
                    learning_path_id=learning_path_id,
                    title=f"{name} Milestone",
                    description=f"Complete {pos} topics",
                    milestone_order=order,
                    required_topic_ids=topic_ids[:pos],
                    status=MilestoneStatus.LOCKED,
                    reward_points=100 * order
                )
                db.add(milestone)


class DifficultyAdaptationService:
    """Service for adaptive difficulty progression"""
    
    @staticmethod
    def adapt_difficulty(
        db: Session,
        institution_id: int,
        student_id: int,
        topic_sequence: TopicSequence,
        recent_performance: List[float]
    ) -> DifficultyLevel:
        """Adapt difficulty based on student performance"""
        if not recent_performance:
            return topic_sequence.difficulty_level
        
        avg_performance = sum(recent_performance) / len(recent_performance)
        current_difficulty = topic_sequence.difficulty_level
        
        # Calculate performance trend
        if len(recent_performance) >= 3:
            trend = recent_performance[-1] - recent_performance[0]
        else:
            trend = 0
        
        # Determine new difficulty
        new_difficulty = current_difficulty
        adaptation_reason = "Stable performance"
        
        if avg_performance >= 0.9 and trend >= 0:
            # Excellent performance, increase difficulty
            new_difficulty = DifficultyAdaptationService._increase_difficulty(current_difficulty)
            adaptation_reason = "Excellent mastery, increasing challenge"
        elif avg_performance >= 0.75 and trend >= 0.1:
            # Good improving performance
            new_difficulty = DifficultyAdaptationService._increase_difficulty(current_difficulty)
            adaptation_reason = "Strong improvement trend"
        elif avg_performance < 0.5 and trend < 0:
            # Struggling and declining
            new_difficulty = DifficultyAdaptationService._decrease_difficulty(current_difficulty)
            adaptation_reason = "Struggling, reducing difficulty"
        elif avg_performance < 0.6:
            # Below target performance
            new_difficulty = DifficultyAdaptationService._decrease_difficulty(current_difficulty)
            adaptation_reason = "Performance below target"
        
        # Record progression
        if new_difficulty != current_difficulty:
            progression = DifficultyProgression(
                institution_id=institution_id,
                student_id=student_id,
                topic_id=topic_sequence.topic_id,
                learning_path_id=topic_sequence.learning_path_id,
                current_difficulty=new_difficulty,
                previous_difficulty=current_difficulty,
                recommended_difficulty=new_difficulty,
                performance_score=avg_performance,
                adaptation_reason=adaptation_reason
            )
            db.add(progression)
            
            topic_sequence.difficulty_level = new_difficulty
            topic_sequence.adaptive_difficulty_boost = avg_performance - 0.7
        
        db.commit()
        return new_difficulty
    
    @staticmethod
    def _increase_difficulty(current: DifficultyLevel) -> DifficultyLevel:
        """Increase difficulty level by one step"""
        levels = [
            DifficultyLevel.BEGINNER,
            DifficultyLevel.ELEMENTARY,
            DifficultyLevel.INTERMEDIATE,
            DifficultyLevel.ADVANCED,
            DifficultyLevel.EXPERT
        ]
        current_idx = levels.index(current)
        return levels[min(current_idx + 1, len(levels) - 1)]
    
    @staticmethod
    def _decrease_difficulty(current: DifficultyLevel) -> DifficultyLevel:
        """Decrease difficulty level by one step"""
        levels = [
            DifficultyLevel.BEGINNER,
            DifficultyLevel.ELEMENTARY,
            DifficultyLevel.INTERMEDIATE,
            DifficultyLevel.ADVANCED,
            DifficultyLevel.EXPERT
        ]
        current_idx = levels.index(current)
        return levels[max(current_idx - 1, 0)]


class SpacedRepetitionService:
    """Service for spaced repetition scheduling using SM-2 algorithm"""
    
    @staticmethod
    def create_schedule(
        db: Session,
        institution_id: int,
        student_id: int,
        topic_id: int,
        learning_path_id: Optional[int] = None
    ) -> SpacedRepetitionSchedule:
        """Create a new spaced repetition schedule"""
        schedule = SpacedRepetitionSchedule(
            institution_id=institution_id,
            student_id=student_id,
            topic_id=topic_id,
            learning_path_id=learning_path_id,
            easiness_factor=2.5,
            repetition_number=0,
            interval_days=1,
            next_review_date=date.today() + timedelta(days=1),
            priority=ReviewPriority.MEDIUM,
            is_due=False
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule
    
    @staticmethod
    def update_schedule(
        db: Session,
        schedule: SpacedRepetitionSchedule,
        review_quality: int,
        time_spent: Optional[int] = None,
        score: Optional[float] = None
    ) -> SpacedRepetitionSchedule:
        """Update schedule based on review quality using SM-2 algorithm"""
        # Review quality: 0-5 (0=complete blackout, 5=perfect response)
        review_quality = max(0, min(5, review_quality))
        
        # Record review history
        review_history = ReviewHistory(
            institution_id=schedule.institution_id,
            schedule_id=schedule.id,
            student_id=schedule.student_id,
            review_date=date.today(),
            review_quality=review_quality,
            time_spent_minutes=time_spent,
            score=score
        )
        db.add(review_history)
        
        # Update schedule using SM-2 algorithm
        schedule.last_review_date = date.today()
        schedule.review_quality = review_quality
        schedule.total_reviews += 1
        
        # Calculate new easiness factor
        old_ef = schedule.easiness_factor
        new_ef = old_ef + (0.1 - (5 - review_quality) * (0.08 + (5 - review_quality) * 0.02))
        schedule.easiness_factor = max(1.3, new_ef)
        
        # Calculate new interval
        if review_quality < 3:
            # Failed review - reset
            schedule.repetition_number = 0
            schedule.interval_days = 1
            schedule.consecutive_correct = 0
            schedule.priority = ReviewPriority.CRITICAL
        else:
            # Successful review
            schedule.consecutive_correct += 1
            
            if schedule.repetition_number == 0:
                schedule.interval_days = 1
            elif schedule.repetition_number == 1:
                schedule.interval_days = 6
            else:
                schedule.interval_days = int(schedule.interval_days * schedule.easiness_factor)
            
            schedule.repetition_number += 1
            
            # Update priority based on performance
            if schedule.consecutive_correct >= 3:
                schedule.priority = ReviewPriority.LOW
            elif review_quality >= 4:
                schedule.priority = ReviewPriority.MEDIUM
            else:
                schedule.priority = ReviewPriority.HIGH
        
        # Set next review date
        schedule.next_review_date = date.today() + timedelta(days=schedule.interval_days)
        
        # Update average quality
        if schedule.average_quality is None:
            schedule.average_quality = float(review_quality)
        else:
            schedule.average_quality = (schedule.average_quality * (schedule.total_reviews - 1) + review_quality) / schedule.total_reviews
        
        db.commit()
        db.refresh(schedule)
        
        # Update due status
        SpacedRepetitionService.update_due_status(db, schedule.institution_id, schedule.student_id)
        
        return schedule
    
    @staticmethod
    def update_due_status(db: Session, institution_id: int, student_id: int):
        """Update is_due status for all schedules"""
        today = date.today()
        schedules = db.query(SpacedRepetitionSchedule).filter(
            SpacedRepetitionSchedule.institution_id == institution_id,
            SpacedRepetitionSchedule.student_id == student_id
        ).all()
        
        for schedule in schedules:
            schedule.is_due = schedule.next_review_date <= today
        
        db.commit()
    
    @staticmethod
    def get_due_reviews(
        db: Session,
        institution_id: int,
        student_id: int,
        limit: int = 20
    ) -> List[SpacedRepetitionSchedule]:
        """Get due reviews for a student"""
        SpacedRepetitionService.update_due_status(db, institution_id, student_id)
        
        return db.query(SpacedRepetitionSchedule).filter(
            SpacedRepetitionSchedule.institution_id == institution_id,
            SpacedRepetitionSchedule.student_id == student_id,
            SpacedRepetitionSchedule.is_due == True
        ).order_by(
            SpacedRepetitionSchedule.priority.desc(),
            SpacedRepetitionSchedule.next_review_date
        ).limit(limit).all()


class LearningVelocityService:
    """Service for tracking and analyzing learning velocity"""
    
    @staticmethod
    def calculate_velocity(
        db: Session,
        institution_id: int,
        learning_path_id: int,
        student_id: int,
        period_days: int = 7
    ) -> LearningVelocityRecord:
        """Calculate learning velocity for a given period"""
        period_end = date.today()
        period_start = period_end - timedelta(days=period_days)
        
        # Get completed topics in period
        completed_topics = db.query(TopicSequence).filter(
            TopicSequence.institution_id == institution_id,
            TopicSequence.learning_path_id == learning_path_id,
            TopicSequence.completed_at >= period_start,
            TopicSequence.completed_at <= period_end
        ).all()
        
        # Get performance data
        performance_data = db.query(TopicPerformanceData).filter(
            TopicPerformanceData.institution_id == institution_id,
            TopicPerformanceData.student_id == student_id,
            TopicPerformanceData.recorded_at >= period_start,
            TopicPerformanceData.recorded_at <= period_end
        ).all()
        
        # Calculate metrics
        topics_completed = len(completed_topics)
        total_time = sum(p.time_spent_minutes for p in performance_data)
        avg_mastery = sum(t.mastery_score for t in completed_topics) / topics_completed if topics_completed > 0 else None
        
        # Velocity score: topics per day
        velocity_score = topics_completed / period_days if period_days > 0 else 0
        
        # Efficiency: mastery per time unit
        efficiency = (avg_mastery * topics_completed) / (total_time / 60) if total_time > 0 and avg_mastery else None
        
        # Consistency: variance in daily completion
        daily_completions = defaultdict(int)
        for topic in completed_topics:
            day = topic.completed_at.date() if topic.completed_at else date.today()
            daily_completions[day] += 1
        
        if len(daily_completions) > 1:
            completions_list = list(daily_completions.values())
            mean = sum(completions_list) / len(completions_list)
            variance = sum((x - mean) ** 2 for x in completions_list) / len(completions_list)
            consistency = 1.0 / (1.0 + variance) if variance > 0 else 1.0
        else:
            consistency = 1.0 if topics_completed > 0 else 0.0
        
        # Recommended pace adjustment
        target_velocity = 1.0  # 1 topic per day
        pace_adjustment = 1.0
        if velocity_score > 0:
            pace_adjustment = min(2.0, max(0.5, target_velocity / velocity_score))
        
        # Create velocity record
        velocity_record = LearningVelocityRecord(
            institution_id=institution_id,
            learning_path_id=learning_path_id,
            student_id=student_id,
            period_start=period_start,
            period_end=period_end,
            topics_completed=topics_completed,
            total_time_minutes=total_time,
            average_mastery_score=avg_mastery,
            velocity_score=velocity_score,
            efficiency_rating=efficiency,
            consistency_score=consistency,
            recommended_pace_adjustment=pace_adjustment,
            metrics={
                "daily_completions": dict(daily_completions),
                "target_velocity": target_velocity,
                "period_days": period_days
            }
        )
        
        db.add(velocity_record)
        db.commit()
        db.refresh(velocity_record)
        
        # Update learning path velocity
        learning_path = db.query(LearningPath).filter(
            LearningPath.id == learning_path_id
        ).first()
        if learning_path:
            learning_path.learning_velocity = velocity_score
        
        db.commit()
        
        return velocity_record
    
    @staticmethod
    def get_velocity_trend(
        db: Session,
        institution_id: int,
        learning_path_id: int,
        student_id: int,
        periods: int = 4
    ) -> List[LearningVelocityRecord]:
        """Get velocity trend over multiple periods"""
        return db.query(LearningVelocityRecord).filter(
            LearningVelocityRecord.institution_id == institution_id,
            LearningVelocityRecord.learning_path_id == learning_path_id,
            LearningVelocityRecord.student_id == student_id
        ).order_by(desc(LearningVelocityRecord.period_end)).limit(periods).all()


class MasteryTrackingService:
    """Service for tracking and updating mastery levels"""
    
    @staticmethod
    def update_mastery(
        db: Session,
        institution_id: int,
        topic_sequence: TopicSequence,
        performance_score: float,
        time_spent: int,
        correct_answers: int,
        total_questions: int
    ):
        """Update mastery level based on performance"""
        # Record performance data
        performance = TopicPerformanceData(
            institution_id=institution_id,
            topic_sequence_id=topic_sequence.id,
            student_id=db.query(LearningPath).filter(
                LearningPath.id == topic_sequence.learning_path_id
            ).first().student_id,
            practice_accuracy=performance_score,
            time_spent_minutes=time_spent,
            correct_answers=correct_answers,
            total_questions=total_questions,
            attempts_count=1
        )
        db.add(performance)
        
        # Update mastery score (weighted average)
        old_weight = 0.7
        new_weight = 0.3
        topic_sequence.mastery_score = (
            old_weight * topic_sequence.mastery_score +
            new_weight * performance_score
        )
        
        # Update mastery level
        if topic_sequence.mastery_score >= 0.9:
            topic_sequence.mastery_level = MasteryLevel.MASTERED
        elif topic_sequence.mastery_score >= 0.7:
            topic_sequence.mastery_level = MasteryLevel.PRACTICING
        elif topic_sequence.mastery_score >= 0.5:
            topic_sequence.mastery_level = MasteryLevel.LEARNING
        else:
            topic_sequence.mastery_level = MasteryLevel.NEEDS_REVIEW
        
        # Update timing
        if not topic_sequence.started_at:
            topic_sequence.started_at = datetime.utcnow()
        
        if topic_sequence.mastery_level == MasteryLevel.MASTERED and not topic_sequence.completed_at:
            topic_sequence.completed_at = datetime.utcnow()
            topic_sequence.actual_duration_minutes = time_spent
            
            # Unlock next topics
            MasteryTrackingService._unlock_next_topics(db, topic_sequence)
            
            # Update milestones
            MasteryTrackingService._update_milestones(db, topic_sequence.learning_path_id)
        
        db.commit()
    
    @staticmethod
    def _unlock_next_topics(db: Session, completed_topic: TopicSequence):
        """Unlock topics that have this topic as prerequisite"""
        next_topics = db.query(TopicSequence).filter(
            TopicSequence.learning_path_id == completed_topic.learning_path_id,
            TopicSequence.is_unlocked == False
        ).all()
        
        for topic in next_topics:
            if topic.prerequisite_topic_ids:
                # Check if all prerequisites are completed
                prereq_sequences = db.query(TopicSequence).filter(
                    TopicSequence.learning_path_id == completed_topic.learning_path_id,
                    TopicSequence.topic_id.in_(topic.prerequisite_topic_ids)
                ).all()
                
                all_completed = all(
                    seq.mastery_level == MasteryLevel.MASTERED
                    for seq in prereq_sequences
                )
                
                if all_completed:
                    topic.is_unlocked = True
            else:
                # No prerequisites, unlock next in sequence
                if topic.sequence_order == completed_topic.sequence_order + 1:
                    topic.is_unlocked = True
        
        db.commit()
    
    @staticmethod
    def _update_milestones(db: Session, learning_path_id: int):
        """Update milestone statuses based on completed topics"""
        completed_topic_ids = db.query(TopicSequence.topic_id).filter(
            TopicSequence.learning_path_id == learning_path_id,
            TopicSequence.mastery_level == MasteryLevel.MASTERED
        ).all()
        completed_ids = {t[0] for t in completed_topic_ids}
        
        milestones = db.query(LearningMilestone).filter(
            LearningMilestone.learning_path_id == learning_path_id
        ).order_by(LearningMilestone.milestone_order).all()
        
        for milestone in milestones:
            required_ids = set(milestone.required_topic_ids)
            completed_required = required_ids.intersection(completed_ids)
            
            if milestone.status == MilestoneStatus.LOCKED:
                if len(completed_required) > 0:
                    milestone.status = MilestoneStatus.UNLOCKED
            
            if milestone.status in [MilestoneStatus.UNLOCKED, MilestoneStatus.IN_PROGRESS]:
                completion_percentage = len(completed_required) / len(required_ids) if required_ids else 0
                
                if completion_percentage > 0 and completion_percentage < 1:
                    milestone.status = MilestoneStatus.IN_PROGRESS
                elif completion_percentage >= 1:
                    milestone.status = MilestoneStatus.COMPLETED
                    milestone.completed_at = datetime.utcnow()
        
        # Update learning path completion percentage
        learning_path = db.query(LearningPath).filter(
            LearningPath.id == learning_path_id
        ).first()
        
        if learning_path:
            total_topics = db.query(func.count(TopicSequence.id)).filter(
                TopicSequence.learning_path_id == learning_path_id
            ).scalar()
            
            completed_count = len(completed_ids)
            learning_path.completion_percentage = (completed_count / total_topics * 100) if total_topics > 0 else 0
            
            if learning_path.completion_percentage >= 100:
                learning_path.status = LearningPathStatus.COMPLETED
        
        db.commit()
