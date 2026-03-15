from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.database import get_db
from src.schemas.college_planning import (
    CollegeVisitCreate,
    CollegeVisitUpdate,
    CollegeVisitResponse,
    CollegeApplicationCreate,
    CollegeApplicationUpdate,
    CollegeApplicationResponse,
    ApplicationChecklistUpdate,
    DecisionNotificationRequest,
    CounselorCollaborationRequest,
)
from src.services.college_planning_service import CollegePlanningService
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter()


@router.post("/visits", response_model=CollegeVisitResponse, status_code=status.HTTP_201_CREATED)
async def create_college_visit(
    visit_data: CollegeVisitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    visit_dict = visit_data.model_dump()
    return service.create_college_visit(visit_dict)


@router.get("/visits", response_model=List[CollegeVisitResponse])
async def list_college_visits(
    student_id: int,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    return service.list_college_visits(
        student_id=student_id,
        institution_id=current_user.institution_id,
        limit=limit,
        offset=offset
    )


@router.get("/visits/{visit_id}", response_model=CollegeVisitResponse)
async def get_college_visit(
    visit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    visit = service.get_college_visit(visit_id, current_user.institution_id)
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College visit not found"
        )
    return visit


@router.put("/visits/{visit_id}", response_model=CollegeVisitResponse)
async def update_college_visit(
    visit_id: int,
    update_data: CollegeVisitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    visit = service.update_college_visit(
        visit_id,
        current_user.institution_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College visit not found"
        )
    return visit


@router.delete("/visits/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_college_visit(
    visit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    success = service.delete_college_visit(visit_id, current_user.institution_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College visit not found"
        )


@router.post("/applications", response_model=CollegeApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_college_application(
    application_data: CollegeApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    app_dict = application_data.model_dump()
    return service.create_college_application(app_dict)


@router.get("/applications", response_model=List[CollegeApplicationResponse])
async def list_college_applications(
    student_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    return service.list_college_applications(
        student_id=student_id,
        institution_id=current_user.institution_id,
        status=status_filter,
        limit=limit,
        offset=offset
    )


@router.get("/applications/{application_id}", response_model=CollegeApplicationResponse)
async def get_college_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    application = service.get_college_application(application_id, current_user.institution_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College application not found"
        )
    return application


@router.put("/applications/{application_id}", response_model=CollegeApplicationResponse)
async def update_college_application(
    application_id: int,
    update_data: CollegeApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    application = service.update_college_application(
        application_id,
        current_user.institution_id,
        update_data.model_dump(exclude_unset=True)
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College application not found"
        )
    return application


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_college_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    success = service.delete_college_application(application_id, current_user.institution_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College application not found"
        )


@router.patch("/applications/{application_id}/checklist", response_model=CollegeApplicationResponse)
async def update_application_checklist(
    application_id: int,
    checklist_data: ApplicationChecklistUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    application = service.update_application_checklist(
        application_id,
        current_user.institution_id,
        checklist_data.model_dump(exclude_unset=True)
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College application not found"
        )
    return application


@router.post("/applications/{application_id}/decision", response_model=CollegeApplicationResponse)
async def record_decision(
    application_id: int,
    decision_data: DecisionNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    application = service.record_decision(
        application_id=application_id,
        institution_id=current_user.institution_id,
        decision_outcome=decision_data.decision_outcome,
        financial_aid_offered=decision_data.financial_aid_offered,
        scholarship_amount=decision_data.scholarship_amount,
        deposit_deadline=decision_data.deposit_deadline
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College application not found"
        )
    return application


@router.get("/applications/deadlines/{student_id}", response_model=List[CollegeApplicationResponse])
async def get_upcoming_deadlines(
    student_id: int,
    days_ahead: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    return service.get_upcoming_deadlines(
        student_id=student_id,
        institution_id=current_user.institution_id,
        days_ahead=days_ahead
    )


@router.get("/applications/statistics/{student_id}")
async def get_application_statistics(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    return service.get_application_statistics(
        student_id=student_id,
        institution_id=current_user.institution_id
    )


@router.post("/collaboration/share")
async def share_with_counselor(
    collaboration_data: CounselorCollaborationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CollegePlanningService(db)
    notification = service.share_with_counselor(
        student_id=collaboration_data.student_id,
        institution_id=current_user.institution_id,
        counselor_user_id=collaboration_data.counselor_user_id,
        message=collaboration_data.message,
        application_id=collaboration_data.application_id
    )
    return {
        "success": True,
        "message": "Collaboration request sent to counselor",
        "notification_id": notification.id
    }
