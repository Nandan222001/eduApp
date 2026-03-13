from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, timedelta

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.learning_path import (
    LearningPath, TopicSequence, SpacedRepetitionSchedule,
    LearningMilestone, LearningVelocityRecord, TopicPerformanceData,
    PrerequisiteRelationship, MilestoneStatus
)
from src.models.academic import Topic
from src.schemas.learning_path import (
    LearningPathCreate, LearningPathUpdate, LearningPathResponse,
    LearningPathDetailResponse, SequenceGenerationRequest,
    TopicSequenceResponse, SpacedRepetitionScheduleCreate,
    SpacedRepetitionScheduleUpdate, SpacedRepetitionScheduleResponse,
    MasteryUpdateRequest, TopicPerformanceDataCreate, TopicPerformanceDataResponse,
    LearningVelocityResponse, VisualizationDataResponse, LearningPathProgressResponse,
    PrerequisiteRelationshipCreate, PrerequisiteRelationshipResponse,
    LearningMilestoneCreate, LearningMilestoneResponse
)
from src.services.learning_path_service import (
    AdaptiveLearningPathService, DifficultyAdaptationService,
    SpacedRepetitionService, LearningVelocityService, MasteryTrackingService
)

router = APIRouter(prefix="/learning-paths", tags=["Learning Paths"])


@router.post("", response_model=LearningPathResponse, status_code=status.HTTP_201_CREATED)
def create_learning_path(
    path_data: LearningPathCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new learning path for a student"""
    learning_path = AdaptiveLearningPathService.create_learning_path(
        db=db,
        institution_id=current_user.institution_id,
        path_data=path_data
    )
    return learning_path


@router.post("/generate", response_model=LearningPathDetailResponse, status_code=status.HTTP_201_CREATED)
def generate_personalized_sequence(
    request: SequenceGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a personalized learning path with adaptive sequencing"""
    learning_path = AdaptiveLearningPathService.generate_personalized_sequence(
        db=db,
        institution_id=current_user.institution_id,
        request=request
    )
    
    # Reload with relationships
    db.refresh(learning_path)
    learning_path = db.query(LearningPath).options(
        joinedload(LearningPath.milestones),
        joinedload(LearningPath.topic_sequences)
    ).filter(LearningPath.id == learning_path.id).first()
    
    return learning_path


@router.get("", response_model=List[LearningPathResponse])
def list_learning_paths(
    student_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List learning paths with filters"""
    query = db.query(LearningPath).filter(
        LearningPath.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(LearningPath.student_id == student_id)
    if grade_id:
        query = query.filter(LearningPath.grade_id == grade_id)
    if subject_id:
        query = query.filter(LearningPath.subject_id == subject_id)
    if status:
        query = query.filter(LearningPath.status == status)
    
    learning_paths = query.offset(skip).limit(limit).all()
    return learning_paths


@router.get("/{learning_path_id}", response_model=LearningPathDetailResponse)
def get_learning_path(
    learning_path_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed learning path information"""
    learning_path = db.query(LearningPath).options(
        joinedload(LearningPath.milestones),
        joinedload(LearningPath.topic_sequences)
    ).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    return learning_path


@router.patch("/{learning_path_id}", response_model=LearningPathResponse)
def update_learning_path(
    learning_path_id: int,
    path_data: LearningPathUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a learning path"""
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    update_data = path_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(learning_path, field, value)
    
    db.commit()
    db.refresh(learning_path)
    return learning_path


@router.delete("/{learning_path_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_path(
    learning_path_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a learning path"""
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    db.delete(learning_path)
    db.commit()


@router.post("/{learning_path_id}/milestones", response_model=LearningMilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    learning_path_id: int,
    milestone_data: LearningMilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new milestone for a learning path"""
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    milestone = LearningMilestone(
        institution_id=current_user.institution_id,
        learning_path_id=learning_path_id,
        **milestone_data.model_dump()
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.get("/{learning_path_id}/progress", response_model=LearningPathProgressResponse)
def get_learning_path_progress(
    learning_path_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed progress information for a learning path"""
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    # Get topic sequences
    topic_sequences = db.query(TopicSequence).filter(
        TopicSequence.learning_path_id == learning_path_id
    ).all()
    
    total_topics = len(topic_sequences)
    completed_topics = sum(1 for ts in topic_sequences if ts.completed_at is not None)
    
    # Get upcoming reviews
    review_schedules = SpacedRepetitionService.get_due_reviews(
        db=db,
        institution_id=current_user.institution_id,
        student_id=learning_path.student_id,
        limit=5
    )
    
    next_review_topics = [
        {
            "topic_id": schedule.topic_id,
            "next_review_date": schedule.next_review_date.isoformat(),
            "priority": schedule.priority.value
        }
        for schedule in review_schedules
    ]
    
    # Get upcoming milestones
    milestones = db.query(LearningMilestone).filter(
        LearningMilestone.learning_path_id == learning_path_id,
        LearningMilestone.status.in_([MilestoneStatus.UNLOCKED, MilestoneStatus.IN_PROGRESS])
    ).order_by(LearningMilestone.milestone_order).limit(3).all()
    
    upcoming_milestones = [
        {
            "title": m.title,
            "target_date": m.target_date.isoformat() if m.target_date else None,
            "status": m.status.value,
            "reward_points": m.reward_points
        }
        for m in milestones
    ]
    
    # Calculate current streak
    recent_completions = db.query(TopicSequence).filter(
        TopicSequence.learning_path_id == learning_path_id,
        TopicSequence.completed_at.isnot(None)
    ).order_by(TopicSequence.completed_at.desc()).limit(30).all()
    
    current_streak = 0
    if recent_completions:
        last_date = recent_completions[0].completed_at.date()
        for ts in recent_completions:
            if ts.completed_at:
                completion_date = ts.completed_at.date()
                if (last_date - completion_date).days <= 1:
                    current_streak += 1
                    last_date = completion_date
                else:
                    break
    
    # Estimate days remaining
    estimated_days_remaining = None
    if learning_path.learning_velocity > 0 and completed_topics < total_topics:
        remaining_topics = total_topics - completed_topics
        estimated_days_remaining = int(remaining_topics / learning_path.learning_velocity)
    
    # Velocity trend
    velocity_records = LearningVelocityService.get_velocity_trend(
        db=db,
        institution_id=current_user.institution_id,
        learning_path_id=learning_path_id,
        student_id=learning_path.student_id,
        periods=3
    )
    
    velocity_trend = "stable"
    if len(velocity_records) >= 2:
        latest = velocity_records[0].velocity_score
        previous = velocity_records[1].velocity_score
        if latest > previous * 1.1:
            velocity_trend = "increasing"
        elif latest < previous * 0.9:
            velocity_trend = "decreasing"
    
    # Generate recommendations
    recommendations = []
    if learning_path.learning_velocity < 0.5:
        recommendations.append("Consider dedicating more time to daily practice")
    if len(review_schedules) > 10:
        recommendations.append("You have many reviews pending - prioritize review sessions")
    if completed_topics > 0 and completed_topics / total_topics > 0.7:
        recommendations.append("Great progress! You're nearing completion")
    
    return LearningPathProgressResponse(
        learning_path_id=learning_path_id,
        completion_percentage=learning_path.completion_percentage,
        topics_completed=completed_topics,
        topics_total=total_topics,
        current_streak=current_streak,
        estimated_days_remaining=estimated_days_remaining,
        next_review_topics=next_review_topics,
        upcoming_milestones=upcoming_milestones,
        velocity_trend=velocity_trend,
        recommendations=recommendations
    )


@router.get("/{learning_path_id}/visualization", response_model=VisualizationDataResponse)
def get_learning_path_visualization(
    learning_path_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get visualization data for the learning path"""
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    # Get topic sequences with topic details
    topic_sequences = db.query(TopicSequence).join(Topic).filter(
        TopicSequence.learning_path_id == learning_path_id
    ).all()
    
    # Build nodes
    nodes = []
    for ts in topic_sequences:
        nodes.append({
            "id": ts.topic_id,
            "label": ts.topic.name,
            "sequence_order": ts.sequence_order,
            "mastery_level": ts.mastery_level.value,
            "mastery_score": ts.mastery_score,
            "difficulty_level": ts.difficulty_level.value,
            "is_unlocked": ts.is_unlocked,
            "is_completed": ts.completed_at is not None,
            "chapter_id": ts.topic.chapter_id
        })
    
    # Build edges (prerequisites)
    edges = []
    for ts in topic_sequences:
        if ts.prerequisite_topic_ids:
            for prereq_id in ts.prerequisite_topic_ids:
                edges.append({
                    "source": prereq_id,
                    "target": ts.topic_id,
                    "type": "prerequisite"
                })
    
    # Get milestones
    milestones = db.query(LearningMilestone).filter(
        LearningMilestone.learning_path_id == learning_path_id
    ).order_by(LearningMilestone.milestone_order).all()
    
    milestone_data = [
        {
            "id": m.id,
            "title": m.title,
            "order": m.milestone_order,
            "status": m.status.value,
            "required_topics": m.required_topic_ids,
            "reward_points": m.reward_points,
            "target_date": m.target_date.isoformat() if m.target_date else None
        }
        for m in milestones
    ]
    
    # Progress summary
    total_topics = len(topic_sequences)
    completed_topics = sum(1 for ts in topic_sequences if ts.completed_at is not None)
    unlocked_topics = sum(1 for ts in topic_sequences if ts.is_unlocked)
    
    progress_summary = {
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "unlocked_topics": unlocked_topics,
        "completion_percentage": learning_path.completion_percentage,
        "current_difficulty": learning_path.current_difficulty.value,
        "learning_velocity": learning_path.learning_velocity,
        "status": learning_path.status.value
    }
    
    return VisualizationDataResponse(
        nodes=nodes,
        edges=edges,
        milestones=milestone_data,
        progress_summary=progress_summary
    )


@router.post("/mastery/update", status_code=status.HTTP_200_OK)
def update_mastery(
    request: MasteryUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update mastery level for a topic based on performance"""
    topic_sequence = db.query(TopicSequence).join(LearningPath).filter(
        TopicSequence.id == request.topic_sequence_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not topic_sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic sequence not found"
        )
    
    MasteryTrackingService.update_mastery(
        db=db,
        institution_id=current_user.institution_id,
        topic_sequence=topic_sequence,
        performance_score=request.performance_score,
        time_spent=request.time_spent_minutes,
        correct_answers=request.correct_answers,
        total_questions=request.total_questions
    )
    
    return {"message": "Mastery updated successfully"}


@router.post("/performance", response_model=TopicPerformanceDataResponse, status_code=status.HTTP_201_CREATED)
def record_performance(
    performance_data: TopicPerformanceDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record performance data for a topic"""
    topic_sequence = db.query(TopicSequence).join(LearningPath).filter(
        TopicSequence.id == performance_data.topic_sequence_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not topic_sequence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic sequence not found"
        )
    
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == topic_sequence.learning_path_id
    ).first()
    
    performance = TopicPerformanceData(
        institution_id=current_user.institution_id,
        student_id=learning_path.student_id,
        **performance_data.model_dump()
    )
    db.add(performance)
    db.commit()
    db.refresh(performance)
    return performance


@router.post("/spaced-repetition", response_model=SpacedRepetitionScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_spaced_repetition_schedule(
    schedule_data: SpacedRepetitionScheduleCreate,
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a spaced repetition schedule for a topic"""
    schedule = SpacedRepetitionService.create_schedule(
        db=db,
        institution_id=current_user.institution_id,
        student_id=student_id,
        topic_id=schedule_data.topic_id,
        learning_path_id=schedule_data.learning_path_id
    )
    return schedule


@router.patch("/spaced-repetition/{schedule_id}", response_model=SpacedRepetitionScheduleResponse)
def update_spaced_repetition_schedule(
    schedule_id: int,
    review_data: SpacedRepetitionScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a spaced repetition schedule after review"""
    schedule = db.query(SpacedRepetitionSchedule).filter(
        SpacedRepetitionSchedule.id == schedule_id,
        SpacedRepetitionSchedule.institution_id == current_user.institution_id
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    updated_schedule = SpacedRepetitionService.update_schedule(
        db=db,
        schedule=schedule,
        review_quality=review_data.review_quality,
        time_spent=review_data.time_spent_minutes,
        score=review_data.score
    )
    
    return updated_schedule


@router.get("/spaced-repetition/due", response_model=List[SpacedRepetitionScheduleResponse])
def get_due_reviews(
    student_id: int,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get due review items for a student"""
    schedules = SpacedRepetitionService.get_due_reviews(
        db=db,
        institution_id=current_user.institution_id,
        student_id=student_id,
        limit=limit
    )
    return schedules


@router.post("/{learning_path_id}/velocity/calculate", response_model=LearningVelocityResponse)
def calculate_learning_velocity(
    learning_path_id: int,
    period_days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate learning velocity for a given period"""
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    velocity_record = LearningVelocityService.calculate_velocity(
        db=db,
        institution_id=current_user.institution_id,
        learning_path_id=learning_path_id,
        student_id=learning_path.student_id,
        period_days=period_days
    )
    
    return velocity_record


@router.get("/{learning_path_id}/velocity/trend", response_model=List[LearningVelocityResponse])
def get_velocity_trend(
    learning_path_id: int,
    periods: int = Query(4, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get velocity trend over multiple periods"""
    learning_path = db.query(LearningPath).filter(
        LearningPath.id == learning_path_id,
        LearningPath.institution_id == current_user.institution_id
    ).first()
    
    if not learning_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found"
        )
    
    velocity_records = LearningVelocityService.get_velocity_trend(
        db=db,
        institution_id=current_user.institution_id,
        learning_path_id=learning_path_id,
        student_id=learning_path.student_id,
        periods=periods
    )
    
    return velocity_records


@router.post("/prerequisites", response_model=PrerequisiteRelationshipResponse, status_code=status.HTTP_201_CREATED)
def create_prerequisite_relationship(
    prereq_data: PrerequisiteRelationshipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a prerequisite relationship between topics"""
    # Validate topics exist
    topic = db.query(Topic).filter(
        Topic.id == prereq_data.topic_id,
        Topic.institution_id == current_user.institution_id
    ).first()
    
    prereq_topic = db.query(Topic).filter(
        Topic.id == prereq_data.prerequisite_topic_id,
        Topic.institution_id == current_user.institution_id
    ).first()
    
    if not topic or not prereq_topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # Check for circular dependency
    if prereq_data.topic_id == prereq_data.prerequisite_topic_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create self-referencing prerequisite"
        )
    
    prerequisite = PrerequisiteRelationship(
        institution_id=current_user.institution_id,
        **prereq_data.model_dump()
    )
    db.add(prerequisite)
    db.commit()
    db.refresh(prerequisite)
    return prerequisite


@router.get("/prerequisites/{topic_id}", response_model=List[PrerequisiteRelationshipResponse])
def get_topic_prerequisites(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prerequisites for a topic"""
    prerequisites = db.query(PrerequisiteRelationship).filter(
        PrerequisiteRelationship.institution_id == current_user.institution_id,
        PrerequisiteRelationship.topic_id == topic_id
    ).all()
    
    return prerequisites


@router.delete("/prerequisites/{prerequisite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prerequisite_relationship(
    prerequisite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a prerequisite relationship"""
    prerequisite = db.query(PrerequisiteRelationship).filter(
        PrerequisiteRelationship.id == prerequisite_id,
        PrerequisiteRelationship.institution_id == current_user.institution_id
    ).first()
    
    if not prerequisite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prerequisite relationship not found"
        )
    
    db.delete(prerequisite)
    db.commit()
