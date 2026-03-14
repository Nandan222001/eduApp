from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime, date

from src.database import get_db
from src.models.user import User
from src.models.collaboration import (
    CollaborationGoal,
    CollaborationGoalProgress,
    ParentTeacherConference,
    SharedActionPlan,
    TeacherCommitment,
    ParentCommitment,
    HomeLearningActivity,
    ParentTeacherMessageThread,
    ParentTeacherMessage,
    CollaborationDocument,
    CollaborationGoalStatus,
    ConferenceStatus,
    ActionPlanStatus,
    CommitmentStatus,
    MessageThreadStatus,
    DocumentSignatureStatus,
)
from src.schemas.collaboration import (
    CollaborationGoalCreate,
    CollaborationGoalUpdate,
    CollaborationGoalResponse,
    CollaborationGoalProgressCreate,
    CollaborationGoalProgressResponse,
    ParentTeacherConferenceCreate,
    ParentTeacherConferenceUpdate,
    ParentTeacherConferenceResponse,
    SharedActionPlanCreate,
    SharedActionPlanUpdate,
    SharedActionPlanResponse,
    TeacherCommitmentCreate,
    TeacherCommitmentUpdate,
    TeacherCommitmentResponse,
    ParentCommitmentCreate,
    ParentCommitmentUpdate,
    ParentCommitmentResponse,
    HomeLearningActivityCreate,
    HomeLearningActivityUpdate,
    HomeLearningActivityResponse,
    ParentTeacherMessageThreadCreate,
    ParentTeacherMessageThreadResponse,
    ParentTeacherMessageCreate,
    ParentTeacherMessageResponse,
    CollaborationDocumentCreate,
    CollaborationDocumentResponse,
    CollaborationDocumentSignature,
    CollaborationDocumentReject,
)
from src.dependencies.auth import get_current_user

router = APIRouter()


@router.post("/goals", response_model=CollaborationGoalResponse, status_code=status.HTTP_201_CREATED)
def create_collaboration_goal(
    goal_data: CollaborationGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = CollaborationGoal(
        institution_id=current_user.institution_id,
        student_id=goal_data.student_id,
        teacher_id=goal_data.teacher_id,
        parent_id=goal_data.parent_id,
        title=goal_data.title,
        description=goal_data.description,
        category=goal_data.category,
        measurable_target=goal_data.measurable_target,
        target_value=goal_data.target_value,
        unit=goal_data.unit,
        success_criteria=goal_data.success_criteria,
        start_date=goal_data.start_date,
        target_date=goal_data.target_date,
        metadata=goal_data.metadata,
        created_by_user_id=current_user.id,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/goals", response_model=List[CollaborationGoalResponse])
def get_collaboration_goals(
    student_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CollaborationGoal).filter(
        CollaborationGoal.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(CollaborationGoal.student_id == student_id)
    if teacher_id:
        query = query.filter(CollaborationGoal.teacher_id == teacher_id)
    if parent_id:
        query = query.filter(CollaborationGoal.parent_id == parent_id)
    if status_filter:
        query = query.filter(CollaborationGoal.status == status_filter)
    
    goals = query.options(joinedload(CollaborationGoal.progress_updates)).order_by(
        desc(CollaborationGoal.created_at)
    ).offset(skip).limit(limit).all()
    
    return goals


@router.get("/goals/{goal_id}", response_model=CollaborationGoalResponse)
def get_collaboration_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(CollaborationGoal).filter(
        CollaborationGoal.id == goal_id,
        CollaborationGoal.institution_id == current_user.institution_id,
    ).options(joinedload(CollaborationGoal.progress_updates)).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    return goal


@router.put("/goals/{goal_id}", response_model=CollaborationGoalResponse)
def update_collaboration_goal(
    goal_id: int,
    goal_data: CollaborationGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(CollaborationGoal).filter(
        CollaborationGoal.id == goal_id,
        CollaborationGoal.institution_id == current_user.institution_id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    update_data = goal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    db.commit()
    db.refresh(goal)
    return goal


@router.post("/goals/{goal_id}/agree")
def agree_to_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(CollaborationGoal).filter(
        CollaborationGoal.id == goal_id,
        CollaborationGoal.institution_id == current_user.institution_id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    if current_user.teacher_profile and current_user.teacher_profile.id == goal.teacher_id:
        goal.teacher_agreed_at = datetime.utcnow()
    
    if hasattr(current_user, 'parent_profile') and current_user.parent_profile:
        if current_user.parent_profile.id == goal.parent_id:
            goal.parent_agreed_at = datetime.utcnow()
    
    if goal.parent_agreed_at and goal.teacher_agreed_at:
        goal.status = CollaborationGoalStatus.ACTIVE.value
    
    db.commit()
    db.refresh(goal)
    return {"message": "Agreement recorded", "goal": goal}


@router.post("/goals/{goal_id}/progress", response_model=CollaborationGoalProgressResponse)
def add_goal_progress(
    goal_id: int,
    progress_data: CollaborationGoalProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(CollaborationGoal).filter(
        CollaborationGoal.id == goal_id,
        CollaborationGoal.institution_id == current_user.institution_id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    previous_value = goal.current_value
    
    progress = CollaborationGoalProgress(
        institution_id=current_user.institution_id,
        goal_id=goal_id,
        previous_value=previous_value,
        new_value=progress_data.new_value,
        progress_percentage=(progress_data.new_value / goal.target_value * 100) if goal.target_value else 0,
        notes=progress_data.notes,
        evidence_urls=progress_data.evidence_urls,
        recorded_by_user_id=current_user.id,
    )
    
    goal.current_value = progress_data.new_value
    goal.progress_percentage = progress.progress_percentage
    
    if goal.current_value >= goal.target_value:
        goal.status = CollaborationGoalStatus.ACHIEVED.value
        goal.achieved_at = datetime.utcnow()
    
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collaboration_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(CollaborationGoal).filter(
        CollaborationGoal.id == goal_id,
        CollaborationGoal.institution_id == current_user.institution_id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    db.delete(goal)
    db.commit()


@router.post("/conferences", response_model=ParentTeacherConferenceResponse, status_code=status.HTTP_201_CREATED)
def create_conference(
    conference_data: ParentTeacherConferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = ParentTeacherConference(
        institution_id=current_user.institution_id,
        student_id=conference_data.student_id,
        teacher_id=conference_data.teacher_id,
        parent_id=conference_data.parent_id,
        title=conference_data.title,
        description=conference_data.description,
        scheduled_start=conference_data.scheduled_start,
        scheduled_end=conference_data.scheduled_end,
        location=conference_data.location,
        meeting_type=conference_data.meeting_type,
        video_conference_platform=conference_data.video_conference_platform,
        agenda=conference_data.agenda,
        created_by_user_id=current_user.id,
    )
    
    if conference_data.meeting_type == "video_conference":
        conference.video_conference_url = f"https://meet.example.com/{conference.id}"
        conference.video_conference_id = f"meeting-{conference.id}"
    
    db.add(conference)
    db.commit()
    db.refresh(conference)
    return conference


@router.get("/conferences", response_model=List[ParentTeacherConferenceResponse])
def get_conferences(
    student_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ParentTeacherConference).filter(
        ParentTeacherConference.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(ParentTeacherConference.student_id == student_id)
    if teacher_id:
        query = query.filter(ParentTeacherConference.teacher_id == teacher_id)
    if parent_id:
        query = query.filter(ParentTeacherConference.parent_id == parent_id)
    if status_filter:
        query = query.filter(ParentTeacherConference.status == status_filter)
    if from_date:
        query = query.filter(ParentTeacherConference.scheduled_start >= from_date)
    if to_date:
        query = query.filter(ParentTeacherConference.scheduled_start <= to_date)
    
    conferences = query.order_by(desc(ParentTeacherConference.scheduled_start)).offset(skip).limit(limit).all()
    return conferences


@router.get("/conferences/{conference_id}", response_model=ParentTeacherConferenceResponse)
def get_conference(
    conference_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = db.query(ParentTeacherConference).filter(
        ParentTeacherConference.id == conference_id,
        ParentTeacherConference.institution_id == current_user.institution_id,
    ).first()
    
    if not conference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference not found",
        )
    
    return conference


@router.put("/conferences/{conference_id}", response_model=ParentTeacherConferenceResponse)
def update_conference(
    conference_id: int,
    conference_data: ParentTeacherConferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = db.query(ParentTeacherConference).filter(
        ParentTeacherConference.id == conference_id,
        ParentTeacherConference.institution_id == current_user.institution_id,
    ).first()
    
    if not conference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference not found",
        )
    
    update_data = conference_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(conference, field, value)
    
    db.commit()
    db.refresh(conference)
    return conference


@router.post("/conferences/{conference_id}/start")
def start_conference(
    conference_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = db.query(ParentTeacherConference).filter(
        ParentTeacherConference.id == conference_id,
        ParentTeacherConference.institution_id == current_user.institution_id,
    ).first()
    
    if not conference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference not found",
        )
    
    conference.status = ConferenceStatus.IN_PROGRESS.value
    conference.actual_start = datetime.utcnow()
    
    db.commit()
    db.refresh(conference)
    return conference


@router.post("/conferences/{conference_id}/complete")
def complete_conference(
    conference_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = db.query(ParentTeacherConference).filter(
        ParentTeacherConference.id == conference_id,
        ParentTeacherConference.institution_id == current_user.institution_id,
    ).first()
    
    if not conference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference not found",
        )
    
    conference.status = ConferenceStatus.COMPLETED.value
    conference.actual_end = datetime.utcnow()
    
    db.commit()
    db.refresh(conference)
    return conference


@router.delete("/conferences/{conference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conference(
    conference_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = db.query(ParentTeacherConference).filter(
        ParentTeacherConference.id == conference_id,
        ParentTeacherConference.institution_id == current_user.institution_id,
    ).first()
    
    if not conference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference not found",
        )
    
    db.delete(conference)
    db.commit()


@router.post("/action-plans", response_model=SharedActionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_action_plan(
    plan_data: SharedActionPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = SharedActionPlan(
        institution_id=current_user.institution_id,
        student_id=plan_data.student_id,
        teacher_id=plan_data.teacher_id,
        parent_id=plan_data.parent_id,
        conference_id=plan_data.conference_id,
        title=plan_data.title,
        description=plan_data.description,
        focus_area=plan_data.focus_area,
        start_date=plan_data.start_date,
        end_date=plan_data.end_date,
        created_by_user_id=current_user.id,
    )
    
    db.add(plan)
    db.flush()
    
    for tc_data in plan_data.teacher_commitments:
        teacher_commitment = TeacherCommitment(
            institution_id=current_user.institution_id,
            action_plan_id=plan.id,
            commitment=tc_data.commitment,
            target_date=tc_data.target_date,
        )
        db.add(teacher_commitment)
    
    for pc_data in plan_data.parent_commitments:
        parent_commitment = ParentCommitment(
            institution_id=current_user.institution_id,
            action_plan_id=plan.id,
            commitment=pc_data.commitment,
            target_date=pc_data.target_date,
        )
        db.add(parent_commitment)
    
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/action-plans", response_model=List[SharedActionPlanResponse])
def get_action_plans(
    student_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(SharedActionPlan).filter(
        SharedActionPlan.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(SharedActionPlan.student_id == student_id)
    if teacher_id:
        query = query.filter(SharedActionPlan.teacher_id == teacher_id)
    if parent_id:
        query = query.filter(SharedActionPlan.parent_id == parent_id)
    if status_filter:
        query = query.filter(SharedActionPlan.status == status_filter)
    
    plans = query.options(
        joinedload(SharedActionPlan.teacher_commitments),
        joinedload(SharedActionPlan.parent_commitments),
    ).order_by(desc(SharedActionPlan.created_at)).offset(skip).limit(limit).all()
    
    return plans


@router.get("/action-plans/{plan_id}", response_model=SharedActionPlanResponse)
def get_action_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(SharedActionPlan).filter(
        SharedActionPlan.id == plan_id,
        SharedActionPlan.institution_id == current_user.institution_id,
    ).options(
        joinedload(SharedActionPlan.teacher_commitments),
        joinedload(SharedActionPlan.parent_commitments),
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action plan not found",
        )
    
    return plan


@router.put("/action-plans/{plan_id}", response_model=SharedActionPlanResponse)
def update_action_plan(
    plan_id: int,
    plan_data: SharedActionPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(SharedActionPlan).filter(
        SharedActionPlan.id == plan_id,
        SharedActionPlan.institution_id == current_user.institution_id,
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action plan not found",
        )
    
    update_data = plan_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
    
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/action-plans/{plan_id}/teacher-commitments", response_model=TeacherCommitmentResponse)
def add_teacher_commitment(
    plan_id: int,
    commitment_data: TeacherCommitmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(SharedActionPlan).filter(
        SharedActionPlan.id == plan_id,
        SharedActionPlan.institution_id == current_user.institution_id,
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action plan not found",
        )
    
    commitment = TeacherCommitment(
        institution_id=current_user.institution_id,
        action_plan_id=plan_id,
        commitment=commitment_data.commitment,
        target_date=commitment_data.target_date,
    )
    
    db.add(commitment)
    db.commit()
    db.refresh(commitment)
    return commitment


@router.put("/teacher-commitments/{commitment_id}", response_model=TeacherCommitmentResponse)
def update_teacher_commitment(
    commitment_id: int,
    commitment_data: TeacherCommitmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    commitment = db.query(TeacherCommitment).filter(
        TeacherCommitment.id == commitment_id,
        TeacherCommitment.institution_id == current_user.institution_id,
    ).first()
    
    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )
    
    update_data = commitment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(commitment, field, value)
    
    if commitment_data.status == CommitmentStatus.COMPLETED.value and not commitment.completed_at:
        commitment.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(commitment)
    return commitment


@router.post("/action-plans/{plan_id}/parent-commitments", response_model=ParentCommitmentResponse)
def add_parent_commitment(
    plan_id: int,
    commitment_data: ParentCommitmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(SharedActionPlan).filter(
        SharedActionPlan.id == plan_id,
        SharedActionPlan.institution_id == current_user.institution_id,
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action plan not found",
        )
    
    commitment = ParentCommitment(
        institution_id=current_user.institution_id,
        action_plan_id=plan_id,
        commitment=commitment_data.commitment,
        target_date=commitment_data.target_date,
    )
    
    db.add(commitment)
    db.commit()
    db.refresh(commitment)
    return commitment


@router.put("/parent-commitments/{commitment_id}", response_model=ParentCommitmentResponse)
def update_parent_commitment(
    commitment_id: int,
    commitment_data: ParentCommitmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    commitment = db.query(ParentCommitment).filter(
        ParentCommitment.id == commitment_id,
        ParentCommitment.institution_id == current_user.institution_id,
    ).first()
    
    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )
    
    update_data = commitment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(commitment, field, value)
    
    if commitment_data.status == CommitmentStatus.COMPLETED.value and not commitment.completed_at:
        commitment.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(commitment)
    return commitment


@router.delete("/action-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(SharedActionPlan).filter(
        SharedActionPlan.id == plan_id,
        SharedActionPlan.institution_id == current_user.institution_id,
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action plan not found",
        )
    
    db.delete(plan)
    db.commit()


@router.post("/home-activities", response_model=HomeLearningActivityResponse, status_code=status.HTTP_201_CREATED)
def create_home_learning_activity(
    activity_data: HomeLearningActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = HomeLearningActivity(
        institution_id=current_user.institution_id,
        student_id=activity_data.student_id,
        teacher_id=activity_data.teacher_id,
        parent_id=activity_data.parent_id,
        subject_id=activity_data.subject_id,
        title=activity_data.title,
        description=activity_data.description,
        learning_objectives=activity_data.learning_objectives,
        classroom_topic=activity_data.classroom_topic,
        classroom_alignment_notes=activity_data.classroom_alignment_notes,
        instructions=activity_data.instructions,
        materials_needed=activity_data.materials_needed,
        estimated_duration_minutes=activity_data.estimated_duration_minutes,
        difficulty_level=activity_data.difficulty_level,
        resources=activity_data.resources,
        suggested_date=activity_data.suggested_date,
        created_by_user_id=current_user.id,
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/home-activities", response_model=List[HomeLearningActivityResponse])
def get_home_learning_activities(
    student_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    completed: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(HomeLearningActivity).filter(
        HomeLearningActivity.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(HomeLearningActivity.student_id == student_id)
    if teacher_id:
        query = query.filter(HomeLearningActivity.teacher_id == teacher_id)
    if parent_id:
        query = query.filter(HomeLearningActivity.parent_id == parent_id)
    if subject_id:
        query = query.filter(HomeLearningActivity.subject_id == subject_id)
    if completed is not None:
        query = query.filter(HomeLearningActivity.student_completed == completed)
    
    activities = query.order_by(desc(HomeLearningActivity.created_at)).offset(skip).limit(limit).all()
    return activities


@router.get("/home-activities/{activity_id}", response_model=HomeLearningActivityResponse)
def get_home_learning_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = db.query(HomeLearningActivity).filter(
        HomeLearningActivity.id == activity_id,
        HomeLearningActivity.institution_id == current_user.institution_id,
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )
    
    return activity


@router.put("/home-activities/{activity_id}", response_model=HomeLearningActivityResponse)
def update_home_learning_activity(
    activity_id: int,
    activity_data: HomeLearningActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = db.query(HomeLearningActivity).filter(
        HomeLearningActivity.id == activity_id,
        HomeLearningActivity.institution_id == current_user.institution_id,
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )
    
    update_data = activity_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "parent_feedback" and value:
            activity.parent_feedback_at = datetime.utcnow()
        if field == "student_completed" and value and not activity.student_completed:
            activity.student_completed_at = datetime.utcnow()
        setattr(activity, field, value)
    
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/home-activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_home_learning_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = db.query(HomeLearningActivity).filter(
        HomeLearningActivity.id == activity_id,
        HomeLearningActivity.institution_id == current_user.institution_id,
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )
    
    db.delete(activity)
    db.commit()


@router.post("/message-threads", response_model=ParentTeacherMessageThreadResponse, status_code=status.HTTP_201_CREATED)
def create_message_thread(
    thread_data: ParentTeacherMessageThreadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_thread = db.query(ParentTeacherMessageThread).filter(
        ParentTeacherMessageThread.student_id == thread_data.student_id,
        ParentTeacherMessageThread.teacher_id == thread_data.teacher_id,
        ParentTeacherMessageThread.parent_id == thread_data.parent_id,
        ParentTeacherMessageThread.institution_id == current_user.institution_id,
    ).first()
    
    if existing_thread:
        return existing_thread
    
    thread = ParentTeacherMessageThread(
        institution_id=current_user.institution_id,
        student_id=thread_data.student_id,
        teacher_id=thread_data.teacher_id,
        parent_id=thread_data.parent_id,
        subject=thread_data.subject,
        translation_enabled=thread_data.translation_enabled,
        parent_preferred_language=thread_data.parent_preferred_language,
    )
    
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return thread


@router.get("/message-threads", response_model=List[ParentTeacherMessageThreadResponse])
def get_message_threads(
    student_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(ParentTeacherMessageThread).filter(
        ParentTeacherMessageThread.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(ParentTeacherMessageThread.student_id == student_id)
    if teacher_id:
        query = query.filter(ParentTeacherMessageThread.teacher_id == teacher_id)
    if parent_id:
        query = query.filter(ParentTeacherMessageThread.parent_id == parent_id)
    if status_filter:
        query = query.filter(ParentTeacherMessageThread.status == status_filter)
    
    threads = query.order_by(desc(ParentTeacherMessageThread.last_message_at)).offset(skip).limit(limit).all()
    return threads


@router.get("/message-threads/{thread_id}", response_model=ParentTeacherMessageThreadResponse)
def get_message_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thread = db.query(ParentTeacherMessageThread).filter(
        ParentTeacherMessageThread.id == thread_id,
        ParentTeacherMessageThread.institution_id == current_user.institution_id,
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message thread not found",
        )
    
    return thread


@router.post("/message-threads/{thread_id}/messages", response_model=ParentTeacherMessageResponse)
def send_message(
    thread_id: int,
    message_data: ParentTeacherMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thread = db.query(ParentTeacherMessageThread).filter(
        ParentTeacherMessageThread.id == thread_id,
        ParentTeacherMessageThread.institution_id == current_user.institution_id,
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message thread not found",
        )
    
    message = ParentTeacherMessage(
        institution_id=current_user.institution_id,
        thread_id=thread_id,
        sender_user_id=current_user.id,
        content=message_data.content,
        original_language=message_data.original_language,
        attachments=message_data.attachments,
    )
    
    if thread.translation_enabled and thread.parent_preferred_language:
        message.translated_content = {
            thread.parent_preferred_language: message_data.content
        }
    
    db.add(message)
    
    thread.last_message_at = datetime.utcnow()
    thread.last_message_by_user_id = current_user.id
    
    db.commit()
    db.refresh(message)
    return message


@router.get("/message-threads/{thread_id}/messages", response_model=List[ParentTeacherMessageResponse])
def get_messages(
    thread_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    thread = db.query(ParentTeacherMessageThread).filter(
        ParentTeacherMessageThread.id == thread_id,
        ParentTeacherMessageThread.institution_id == current_user.institution_id,
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message thread not found",
        )
    
    messages = db.query(ParentTeacherMessage).filter(
        ParentTeacherMessage.thread_id == thread_id
    ).order_by(ParentTeacherMessage.created_at).offset(skip).limit(limit).all()
    
    return messages


@router.patch("/messages/{message_id}/read", response_model=ParentTeacherMessageResponse)
def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = db.query(ParentTeacherMessage).filter(
        ParentTeacherMessage.id == message_id,
        ParentTeacherMessage.institution_id == current_user.institution_id,
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    
    message.is_read = True
    message.read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    return message


@router.post("/documents", response_model=CollaborationDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_collaboration_document(
    document_data: CollaborationDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = CollaborationDocument(
        institution_id=current_user.institution_id,
        student_id=document_data.student_id,
        teacher_id=document_data.teacher_id,
        parent_id=document_data.parent_id,
        document_type=document_data.document_type,
        title=document_data.title,
        description=document_data.description,
        document_url=document_data.document_url,
        requires_parent_signature=document_data.requires_parent_signature,
        requires_teacher_signature=document_data.requires_teacher_signature,
        expires_at=document_data.expires_at,
        metadata=document_data.metadata,
        created_by_user_id=current_user.id,
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/documents", response_model=List[CollaborationDocumentResponse])
def get_collaboration_documents(
    student_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    document_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CollaborationDocument).filter(
        CollaborationDocument.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(CollaborationDocument.student_id == student_id)
    if teacher_id:
        query = query.filter(CollaborationDocument.teacher_id == teacher_id)
    if parent_id:
        query = query.filter(CollaborationDocument.parent_id == parent_id)
    if document_type:
        query = query.filter(CollaborationDocument.document_type == document_type)
    if status_filter:
        query = query.filter(CollaborationDocument.status == status_filter)
    
    documents = query.order_by(desc(CollaborationDocument.created_at)).offset(skip).limit(limit).all()
    return documents


@router.get("/documents/{document_id}", response_model=CollaborationDocumentResponse)
def get_collaboration_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(CollaborationDocument).filter(
        CollaborationDocument.id == document_id,
        CollaborationDocument.institution_id == current_user.institution_id,
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    return document


@router.post("/documents/{document_id}/parent-sign", response_model=CollaborationDocumentResponse)
def parent_sign_document(
    document_id: int,
    signature_data: CollaborationDocumentSignature,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(CollaborationDocument).filter(
        CollaborationDocument.id == document_id,
        CollaborationDocument.institution_id == current_user.institution_id,
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    if document.status == DocumentSignatureStatus.EXPIRED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has expired",
        )
    
    document.parent_signature_url = signature_data.signature_url
    document.parent_signed_at = datetime.utcnow()
    document.parent_signed_by_user_id = current_user.id
    document.parent_signature_ip = request.client.host if request.client else None
    
    if document.requires_parent_signature and document.requires_teacher_signature:
        if document.teacher_signed_at:
            document.status = DocumentSignatureStatus.FULLY_SIGNED.value
        else:
            document.status = DocumentSignatureStatus.PARENT_SIGNED.value
    elif document.requires_parent_signature:
        document.status = DocumentSignatureStatus.FULLY_SIGNED.value
    
    db.commit()
    db.refresh(document)
    return document


@router.post("/documents/{document_id}/teacher-sign", response_model=CollaborationDocumentResponse)
def teacher_sign_document(
    document_id: int,
    signature_data: CollaborationDocumentSignature,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(CollaborationDocument).filter(
        CollaborationDocument.id == document_id,
        CollaborationDocument.institution_id == current_user.institution_id,
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    if document.status == DocumentSignatureStatus.EXPIRED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has expired",
        )
    
    document.teacher_signature_url = signature_data.signature_url
    document.teacher_signed_at = datetime.utcnow()
    document.teacher_signed_by_user_id = current_user.id
    document.teacher_signature_ip = request.client.host if request.client else None
    
    if document.requires_parent_signature and document.requires_teacher_signature:
        if document.parent_signed_at:
            document.status = DocumentSignatureStatus.FULLY_SIGNED.value
        else:
            document.status = DocumentSignatureStatus.TEACHER_SIGNED.value
    elif document.requires_teacher_signature:
        document.status = DocumentSignatureStatus.FULLY_SIGNED.value
    
    db.commit()
    db.refresh(document)
    return document


@router.post("/documents/{document_id}/reject", response_model=CollaborationDocumentResponse)
def reject_document(
    document_id: int,
    reject_data: CollaborationDocumentReject,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(CollaborationDocument).filter(
        CollaborationDocument.id == document_id,
        CollaborationDocument.institution_id == current_user.institution_id,
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    document.status = DocumentSignatureStatus.REJECTED.value
    document.rejection_reason = reject_data.rejection_reason
    document.rejected_by_user_id = current_user.id
    document.rejected_at = datetime.utcnow()
    
    db.commit()
    db.refresh(document)
    return document


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collaboration_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(CollaborationDocument).filter(
        CollaborationDocument.id == document_id,
        CollaborationDocument.institution_id == current_user.institution_id,
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    db.delete(document)
    db.commit()
