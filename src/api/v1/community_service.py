from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from datetime import datetime, date, timedelta
from decimal import Decimal
import secrets
import io
import csv

from src.database import get_db
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import AcademicYear, Grade, Section
from src.models.community_service import (
    ServiceActivity,
    OrganizationContact,
    ServicePortfolio,
    GraduationRequirement,
    StudentGraduationProgress,
    ServiceCertificate,
    ServiceActivityType,
    VerificationStatus,
)
from src.dependencies.auth import get_current_user
from src.schemas.community_service import (
    ServiceActivityCreate,
    ServiceActivityUpdate,
    ServiceActivityResponse,
    VerificationRequest,
    ExternalVerificationResponse,
    OrganizationContactCreate,
    OrganizationContactUpdate,
    OrganizationContactResponse,
    ServicePortfolioResponse,
    PortfolioDetailResponse,
    ActivityTypeBreakdown,
    OrganizationBreakdown,
    GraduationRequirementCreate,
    GraduationRequirementUpdate,
    GraduationRequirementResponse,
    StudentGraduationProgressResponse,
    GraduationStatusResponse,
    ServiceCertificateCreate,
    ServiceCertificateResponse,
    HoursByMonth,
    StudentServiceReport,
    InstitutionServiceReport,
    ExportRequest,
)
from src.config import settings
from src.tasks.email_tasks import send_verification_email

router = APIRouter()


def update_portfolio(db: Session, student_id: int, institution_id: int):
    """Update student's service portfolio with latest activity data."""
    portfolio = db.query(ServicePortfolio).filter(
        ServicePortfolio.student_id == student_id,
        ServicePortfolio.institution_id == institution_id
    ).first()
    
    if not portfolio:
        portfolio = ServicePortfolio(
            institution_id=institution_id,
            student_id=student_id
        )
        db.add(portfolio)
    
    activities = db.query(ServiceActivity).filter(
        ServiceActivity.student_id == student_id,
        ServiceActivity.institution_id == institution_id
    ).all()
    
    portfolio.total_hours = sum(a.hours_logged for a in activities)
    portfolio.verified_hours = sum(a.hours_logged for a in activities if a.verification_status == VerificationStatus.VERIFIED)
    portfolio.pending_hours = sum(a.hours_logged for a in activities if a.verification_status == VerificationStatus.PENDING)
    portfolio.rejected_hours = sum(a.hours_logged for a in activities if a.verification_status == VerificationStatus.REJECTED)
    
    portfolio.volunteer_hours = sum(a.hours_logged for a in activities if a.activity_type == ServiceActivityType.VOLUNTEER and a.verification_status == VerificationStatus.VERIFIED)
    portfolio.fundraising_hours = sum(a.hours_logged for a in activities if a.activity_type == ServiceActivityType.FUNDRAISING and a.verification_status == VerificationStatus.VERIFIED)
    portfolio.environmental_hours = sum(a.hours_logged for a in activities if a.activity_type == ServiceActivityType.ENVIRONMENTAL and a.verification_status == VerificationStatus.VERIFIED)
    portfolio.tutoring_hours = sum(a.hours_logged for a in activities if a.activity_type == ServiceActivityType.TUTORING and a.verification_status == VerificationStatus.VERIFIED)
    portfolio.healthcare_hours = sum(a.hours_logged for a in activities if a.activity_type == ServiceActivityType.HEALTHCARE and a.verification_status == VerificationStatus.VERIFIED)
    portfolio.animal_welfare_hours = sum(a.hours_logged for a in activities if a.activity_type == ServiceActivityType.ANIMAL_WELFARE and a.verification_status == VerificationStatus.VERIFIED)
    
    portfolio.total_activities = len(activities)
    portfolio.organizations_count = len(set(a.organization_name for a in activities))
    
    if activities:
        portfolio.last_activity_date = max(a.date for a in activities)
    
    db.commit()
    return portfolio


def update_graduation_progress(db: Session, student_id: int, institution_id: int):
    """Update student's graduation requirement progress."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or not student.section:
        return
    
    grade_id = student.section.grade_id
    
    requirements = db.query(GraduationRequirement).filter(
        GraduationRequirement.institution_id == institution_id,
        GraduationRequirement.is_active == True,
        or_(
            GraduationRequirement.grade_id == grade_id,
            GraduationRequirement.grade_id == None
        )
    ).all()
    
    portfolio = db.query(ServicePortfolio).filter(
        ServicePortfolio.student_id == student_id,
        ServicePortfolio.institution_id == institution_id
    ).first()
    
    if not portfolio:
        return
    
    for requirement in requirements:
        progress = db.query(StudentGraduationProgress).filter(
            StudentGraduationProgress.student_id == student_id,
            StudentGraduationProgress.requirement_id == requirement.id
        ).first()
        
        if not progress:
            progress = StudentGraduationProgress(
                institution_id=institution_id,
                student_id=student_id,
                requirement_id=requirement.id,
                hours_required=requirement.required_hours
            )
            db.add(progress)
        
        if requirement.activity_type:
            type_map = {
                ServiceActivityType.VOLUNTEER: portfolio.volunteer_hours,
                ServiceActivityType.FUNDRAISING: portfolio.fundraising_hours,
                ServiceActivityType.ENVIRONMENTAL: portfolio.environmental_hours,
                ServiceActivityType.TUTORING: portfolio.tutoring_hours,
                ServiceActivityType.HEALTHCARE: portfolio.healthcare_hours,
                ServiceActivityType.ANIMAL_WELFARE: portfolio.animal_welfare_hours,
            }
            progress.hours_completed = type_map.get(requirement.activity_type, Decimal(0))
        else:
            progress.hours_completed = portfolio.verified_hours
        
        progress.hours_required = requirement.required_hours
        progress.percentage_complete = min(
            Decimal(100),
            (progress.hours_completed / progress.hours_required * 100) if progress.hours_required > 0 else Decimal(0)
        )
        progress.is_completed = progress.hours_completed >= progress.hours_required
        
        if progress.is_completed and not progress.completion_date:
            progress.completion_date = date.today()
    
    db.commit()


@router.post("/activities", response_model=ServiceActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_service_activity(
    activity_data: ServiceActivityCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a new community service activity."""
    student = db.query(Student).filter(
        Student.id == activity_data.student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    verification_token = secrets.token_urlsafe(32)
    token_expires = datetime.utcnow() + timedelta(days=30)
    
    new_activity = ServiceActivity(
        institution_id=current_user.institution_id,
        verification_token=verification_token,
        verification_token_expires=token_expires,
        **activity_data.model_dump()
    )
    
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    
    update_portfolio(db, student.id, current_user.institution_id)
    update_graduation_progress(db, student.id, current_user.institution_id)
    
    verification_link = f"{settings.app_env}/verify-service/{verification_token}"
    
    background_tasks.add_task(
        send_verification_email,
        activity_data.contact_email,
        activity_data.contact_person,
        student.first_name + " " + student.last_name,
        activity_data.activity_name,
        activity_data.organization_name,
        float(activity_data.hours_logged),
        activity_data.date.isoformat(),
        verification_link
    )
    
    response = ServiceActivityResponse.model_validate(new_activity)
    response.student_name = f"{student.first_name} {student.last_name}"
    response.verification_link = verification_link
    
    return response


@router.get("/activities", response_model=List[ServiceActivityResponse])
async def get_service_activities(
    student_id: Optional[int] = None,
    activity_type: Optional[ServiceActivityType] = None,
    verification_status: Optional[VerificationStatus] = None,
    organization_name: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of community service activities with filters."""
    query = db.query(ServiceActivity).filter(
        ServiceActivity.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(ServiceActivity.student_id == student_id)
    
    if activity_type:
        query = query.filter(ServiceActivity.activity_type == activity_type)
    
    if verification_status:
        query = query.filter(ServiceActivity.verification_status == verification_status)
    
    if organization_name:
        query = query.filter(ServiceActivity.organization_name.ilike(f"%{organization_name}%"))
    
    if start_date:
        query = query.filter(ServiceActivity.date >= start_date)
    
    if end_date:
        query = query.filter(ServiceActivity.date <= end_date)
    
    activities = query.order_by(ServiceActivity.date.desc()).offset(skip).limit(limit).all()
    
    results = []
    for activity in activities:
        response = ServiceActivityResponse.model_validate(activity)
        student = db.query(Student).filter(Student.id == activity.student_id).first()
        if student:
            response.student_name = f"{student.first_name} {student.last_name}"
        results.append(response)
    
    return results


@router.get("/activities/{activity_id}", response_model=ServiceActivityResponse)
async def get_service_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific community service activity."""
    activity = db.query(ServiceActivity).filter(
        ServiceActivity.id == activity_id,
        ServiceActivity.institution_id == current_user.institution_id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service activity not found"
        )
    
    response = ServiceActivityResponse.model_validate(activity)
    student = db.query(Student).filter(Student.id == activity.student_id).first()
    if student:
        response.student_name = f"{student.first_name} {student.last_name}"
    
    return response


@router.put("/activities/{activity_id}", response_model=ServiceActivityResponse)
async def update_service_activity(
    activity_id: int,
    activity_update: ServiceActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a community service activity."""
    activity = db.query(ServiceActivity).filter(
        ServiceActivity.id == activity_id,
        ServiceActivity.institution_id == current_user.institution_id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service activity not found"
        )
    
    if activity.verification_status != VerificationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update activity that has been verified or rejected"
        )
    
    update_data = activity_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)
    
    db.commit()
    db.refresh(activity)
    
    update_portfolio(db, activity.student_id, current_user.institution_id)
    update_graduation_progress(db, activity.student_id, current_user.institution_id)
    
    response = ServiceActivityResponse.model_validate(activity)
    student = db.query(Student).filter(Student.id == activity.student_id).first()
    if student:
        response.student_name = f"{student.first_name} {student.last_name}"
    
    return response


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a community service activity."""
    activity = db.query(ServiceActivity).filter(
        ServiceActivity.id == activity_id,
        ServiceActivity.institution_id == current_user.institution_id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service activity not found"
        )
    
    if activity.verification_status != VerificationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete activity that has been verified or rejected"
        )
    
    student_id = activity.student_id
    db.delete(activity)
    db.commit()
    
    update_portfolio(db, student_id, current_user.institution_id)
    update_graduation_progress(db, student_id, current_user.institution_id)


@router.post("/verify-external", response_model=ExternalVerificationResponse)
async def verify_external(
    verification: VerificationRequest,
    db: Session = Depends(get_db),
):
    """External verification endpoint for organization contacts to verify service hours."""
    activity = db.query(ServiceActivity).filter(
        ServiceActivity.verification_token == verification.verification_token
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token"
        )
    
    if activity.verification_token_expires and activity.verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    
    if activity.verification_status != VerificationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity has already been verified or rejected"
        )
    
    activity.verification_status = VerificationStatus.VERIFIED
    activity.verification_date = date.today()
    activity.verifier_signature_url = verification.signature_url
    
    if verification.comments:
        if not activity.metadata:
            activity.metadata = {}
        activity.metadata['verifier_comments'] = verification.comments
    
    db.commit()
    
    update_portfolio(db, activity.student_id, activity.institution_id)
    update_graduation_progress(db, activity.student_id, activity.institution_id)
    
    student = db.query(Student).filter(Student.id == activity.student_id).first()
    student_name = f"{student.first_name} {student.last_name}" if student else "Unknown"
    
    return ExternalVerificationResponse(
        success=True,
        message="Service hours successfully verified",
        activity_id=activity.id,
        student_name=student_name,
        organization_name=activity.organization_name,
        hours_verified=activity.hours_logged
    )


@router.post("/activities/{activity_id}/reject")
async def reject_activity(
    activity_id: int,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a service activity (admin/teacher only)."""
    teacher = db.query(Teacher).filter(
        Teacher.user_id == current_user.id,
        Teacher.institution_id == current_user.institution_id
    ).first()
    
    if not teacher and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and administrators can reject activities"
        )
    
    activity = db.query(ServiceActivity).filter(
        ServiceActivity.id == activity_id,
        ServiceActivity.institution_id == current_user.institution_id
    ).first()
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service activity not found"
        )
    
    activity.verification_status = VerificationStatus.REJECTED
    activity.verification_date = date.today()
    
    if not activity.metadata:
        activity.metadata = {}
    activity.metadata['rejection_reason'] = reason
    activity.metadata['rejected_by'] = current_user.id
    
    db.commit()
    
    update_portfolio(db, activity.student_id, current_user.institution_id)
    update_graduation_progress(db, activity.student_id, current_user.institution_id)
    
    return {"message": "Activity rejected successfully"}


@router.post("/organizations", response_model=OrganizationContactResponse, status_code=status.HTTP_201_CREATED)
async def create_organization_contact(
    org_data: OrganizationContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new organization contact."""
    existing = db.query(OrganizationContact).filter(
        OrganizationContact.institution_id == current_user.institution_id,
        OrganizationContact.organization_name == org_data.organization_name,
        OrganizationContact.contact_email == org_data.contact_email
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization contact already exists"
        )
    
    new_org = OrganizationContact(
        institution_id=current_user.institution_id,
        **org_data.model_dump()
    )
    
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    return OrganizationContactResponse.model_validate(new_org)


@router.get("/organizations", response_model=List[OrganizationContactResponse])
async def get_organization_contacts(
    is_verified: Optional[bool] = None,
    is_active: Optional[bool] = None,
    organization_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of organization contacts."""
    query = db.query(OrganizationContact).filter(
        OrganizationContact.institution_id == current_user.institution_id
    )
    
    if is_verified is not None:
        query = query.filter(OrganizationContact.is_verified == is_verified)
    
    if is_active is not None:
        query = query.filter(OrganizationContact.is_active == is_active)
    
    if organization_type:
        query = query.filter(OrganizationContact.organization_type == organization_type)
    
    if search:
        query = query.filter(
            or_(
                OrganizationContact.organization_name.ilike(f"%{search}%"),
                OrganizationContact.contact_person.ilike(f"%{search}%")
            )
        )
    
    organizations = query.order_by(OrganizationContact.organization_name).offset(skip).limit(limit).all()
    
    return [OrganizationContactResponse.model_validate(org) for org in organizations]


@router.put("/organizations/{org_id}", response_model=OrganizationContactResponse)
async def update_organization_contact(
    org_id: int,
    org_update: OrganizationContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an organization contact."""
    org = db.query(OrganizationContact).filter(
        OrganizationContact.id == org_id,
        OrganizationContact.institution_id == current_user.institution_id
    ).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization contact not found"
        )
    
    update_data = org_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    
    db.commit()
    db.refresh(org)
    
    return OrganizationContactResponse.model_validate(org)


@router.get("/portfolio/{student_id}", response_model=PortfolioDetailResponse)
async def get_student_portfolio(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed service portfolio for a student."""
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    portfolio = db.query(ServicePortfolio).filter(
        ServicePortfolio.student_id == student_id,
        ServicePortfolio.institution_id == current_user.institution_id
    ).first()
    
    if not portfolio:
        portfolio = update_portfolio(db, student_id, current_user.institution_id)
    
    activities = db.query(ServiceActivity).filter(
        ServiceActivity.student_id == student_id,
        ServiceActivity.institution_id == current_user.institution_id
    ).all()
    
    activity_breakdown = []
    for activity_type in ServiceActivityType:
        total = sum(a.hours_logged for a in activities if a.activity_type == activity_type)
        verified = sum(a.hours_logged for a in activities if a.activity_type == activity_type and a.verification_status == VerificationStatus.VERIFIED)
        if total > 0:
            percentage = (verified / portfolio.verified_hours * 100) if portfolio.verified_hours > 0 else 0
            activity_breakdown.append(ActivityTypeBreakdown(
                activity_type=activity_type.value,
                hours=total,
                verified_hours=verified,
                percentage=Decimal(percentage)
            ))
    
    org_data = db.query(
        ServiceActivity.organization_name,
        func.sum(ServiceActivity.hours_logged).label('total_hours'),
        func.sum(func.case([(ServiceActivity.verification_status == VerificationStatus.VERIFIED, ServiceActivity.hours_logged)], else_=0)).label('verified_hours'),
        func.count(ServiceActivity.id).label('activity_count')
    ).filter(
        ServiceActivity.student_id == student_id,
        ServiceActivity.institution_id == current_user.institution_id
    ).group_by(ServiceActivity.organization_name).all()
    
    organization_breakdown = [
        OrganizationBreakdown(
            organization_name=row.organization_name,
            total_hours=Decimal(row.total_hours),
            verified_hours=Decimal(row.verified_hours),
            activity_count=row.activity_count
        )
        for row in org_data
    ]
    
    recent_activities_data = db.query(ServiceActivity).filter(
        ServiceActivity.student_id == student_id,
        ServiceActivity.institution_id == current_user.institution_id
    ).order_by(ServiceActivity.date.desc()).limit(10).all()
    
    recent_activities = [ServiceActivityResponse.model_validate(a) for a in recent_activities_data]
    
    progress_records = db.query(StudentGraduationProgress).filter(
        StudentGraduationProgress.student_id == student_id,
        StudentGraduationProgress.institution_id == current_user.institution_id
    ).all()
    
    graduation_progress = []
    for progress in progress_records:
        requirement = db.query(GraduationRequirement).filter(
            GraduationRequirement.id == progress.requirement_id
        ).first()
        if requirement:
            graduation_progress.append({
                "requirement_name": requirement.requirement_name,
                "hours_completed": float(progress.hours_completed),
                "hours_required": float(progress.hours_required),
                "percentage_complete": float(progress.percentage_complete),
                "is_completed": progress.is_completed
            })
    
    portfolio_response = ServicePortfolioResponse.model_validate(portfolio)
    portfolio_response.student_name = f"{student.first_name} {student.last_name}"
    
    return PortfolioDetailResponse(
        portfolio=portfolio_response,
        activity_breakdown=activity_breakdown,
        organization_breakdown=organization_breakdown,
        recent_activities=recent_activities,
        graduation_progress=graduation_progress
    )


@router.post("/requirements", response_model=GraduationRequirementResponse, status_code=status.HTTP_201_CREATED)
async def create_graduation_requirement(
    requirement_data: GraduationRequirementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new graduation requirement."""
    new_requirement = GraduationRequirement(
        institution_id=current_user.institution_id,
        **requirement_data.model_dump()
    )
    
    db.add(new_requirement)
    db.commit()
    db.refresh(new_requirement)
    
    return GraduationRequirementResponse.model_validate(new_requirement)


@router.get("/requirements", response_model=List[GraduationRequirementResponse])
async def get_graduation_requirements(
    grade_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of graduation requirements."""
    query = db.query(GraduationRequirement).filter(
        GraduationRequirement.institution_id == current_user.institution_id
    )
    
    if grade_id is not None:
        query = query.filter(
            or_(
                GraduationRequirement.grade_id == grade_id,
                GraduationRequirement.grade_id == None
            )
        )
    
    if academic_year_id:
        query = query.filter(GraduationRequirement.academic_year_id == academic_year_id)
    
    if is_active is not None:
        query = query.filter(GraduationRequirement.is_active == is_active)
    
    requirements = query.all()
    
    return [GraduationRequirementResponse.model_validate(req) for req in requirements]


@router.put("/requirements/{requirement_id}", response_model=GraduationRequirementResponse)
async def update_graduation_requirement(
    requirement_id: int,
    requirement_update: GraduationRequirementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a graduation requirement."""
    requirement = db.query(GraduationRequirement).filter(
        GraduationRequirement.id == requirement_id,
        GraduationRequirement.institution_id == current_user.institution_id
    ).first()
    
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Graduation requirement not found"
        )
    
    update_data = requirement_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(requirement, field, value)
    
    db.commit()
    db.refresh(requirement)
    
    return GraduationRequirementResponse.model_validate(requirement)


@router.get("/graduation-status/{student_id}", response_model=GraduationStatusResponse)
async def get_graduation_status(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get graduation requirement status for a student."""
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    portfolio = db.query(ServicePortfolio).filter(
        ServicePortfolio.student_id == student_id,
        ServicePortfolio.institution_id == current_user.institution_id
    ).first()
    
    if not portfolio:
        portfolio = update_portfolio(db, student_id, current_user.institution_id)
    
    update_graduation_progress(db, student_id, current_user.institution_id)
    
    progress_records = db.query(StudentGraduationProgress).filter(
        StudentGraduationProgress.student_id == student_id,
        StudentGraduationProgress.institution_id == current_user.institution_id
    ).all()
    
    requirements = []
    requirements_met = 0
    total_requirements = len(progress_records)
    
    for progress in progress_records:
        requirement = db.query(GraduationRequirement).filter(
            GraduationRequirement.id == progress.requirement_id
        ).first()
        
        if not requirement:
            continue
        
        response = StudentGraduationProgressResponse.model_validate(progress)
        response.requirement_name = requirement.requirement_name
        response.activity_type = requirement.activity_type.value if requirement.activity_type else None
        requirements.append(response)
        
        if progress.is_completed:
            requirements_met += 1
    
    overall_percentage = Decimal(0)
    if total_requirements > 0:
        overall_percentage = Decimal(requirements_met / total_requirements * 100)
    
    is_on_track = requirements_met == total_requirements
    
    return GraduationStatusResponse(
        student_id=student_id,
        student_name=f"{student.first_name} {student.last_name}",
        total_verified_hours=portfolio.verified_hours,
        requirements=requirements,
        overall_completion_percentage=overall_percentage,
        is_on_track=is_on_track,
        requirements_met=requirements_met,
        total_requirements=total_requirements
    )


@router.post("/certificates", response_model=ServiceCertificateResponse, status_code=status.HTTP_201_CREATED)
async def generate_certificate(
    cert_data: ServiceCertificateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a community service certificate for a student."""
    student = db.query(Student).filter(
        Student.id == cert_data.student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    portfolio = db.query(ServicePortfolio).filter(
        ServicePortfolio.student_id == cert_data.student_id,
        ServicePortfolio.institution_id == current_user.institution_id
    ).first()
    
    if not portfolio or portfolio.verified_hours == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verified hours found for certificate generation"
        )
    
    cert_number = f"CS-{current_user.institution_id}-{student.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    new_certificate = ServiceCertificate(
        institution_id=current_user.institution_id,
        certificate_number=cert_number,
        total_hours=portfolio.verified_hours,
        issue_date=date.today(),
        **cert_data.model_dump()
    )
    
    db.add(new_certificate)
    db.commit()
    db.refresh(new_certificate)
    
    response = ServiceCertificateResponse.model_validate(new_certificate)
    response.student_name = f"{student.first_name} {student.last_name}"
    
    if new_certificate.academic_year_id:
        academic_year = db.query(AcademicYear).filter(
            AcademicYear.id == new_certificate.academic_year_id
        ).first()
        if academic_year:
            response.academic_year_name = academic_year.name
    
    if new_certificate.signed_by:
        signer = db.query(Teacher).filter(Teacher.id == new_certificate.signed_by).first()
        if signer:
            response.signer_name = f"{signer.first_name} {signer.last_name}"
    
    return response


@router.get("/certificates", response_model=List[ServiceCertificateResponse])
async def get_certificates(
    student_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    certificate_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of service certificates."""
    query = db.query(ServiceCertificate).filter(
        ServiceCertificate.institution_id == current_user.institution_id
    )
    
    if student_id:
        query = query.filter(ServiceCertificate.student_id == student_id)
    
    if academic_year_id:
        query = query.filter(ServiceCertificate.academic_year_id == academic_year_id)
    
    if certificate_type:
        query = query.filter(ServiceCertificate.certificate_type == certificate_type)
    
    certificates = query.order_by(ServiceCertificate.issue_date.desc()).all()
    
    results = []
    for cert in certificates:
        response = ServiceCertificateResponse.model_validate(cert)
        
        student = db.query(Student).filter(Student.id == cert.student_id).first()
        if student:
            response.student_name = f"{student.first_name} {student.last_name}"
        
        if cert.academic_year_id:
            academic_year = db.query(AcademicYear).filter(
                AcademicYear.id == cert.academic_year_id
            ).first()
            if academic_year:
                response.academic_year_name = academic_year.name
        
        if cert.signed_by:
            signer = db.query(Teacher).filter(Teacher.id == cert.signed_by).first()
            if signer:
                response.signer_name = f"{signer.first_name} {signer.last_name}"
        
        results.append(response)
    
    return results


@router.get("/reports/student/{student_id}", response_model=StudentServiceReport)
async def get_student_report(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate comprehensive service report for a student."""
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    portfolio = db.query(ServicePortfolio).filter(
        ServicePortfolio.student_id == student_id
    ).first()
    
    if not portfolio:
        portfolio = update_portfolio(db, student_id, current_user.institution_id)
    
    activities = db.query(ServiceActivity).filter(
        ServiceActivity.student_id == student_id
    ).all()
    
    activity_breakdown = []
    for activity_type in ServiceActivityType:
        total = sum(a.hours_logged for a in activities if a.activity_type == activity_type)
        verified = sum(a.hours_logged for a in activities if a.activity_type == activity_type and a.verification_status == VerificationStatus.VERIFIED)
        if total > 0:
            percentage = (verified / portfolio.verified_hours * 100) if portfolio.verified_hours > 0 else 0
            activity_breakdown.append(ActivityTypeBreakdown(
                activity_type=activity_type.value,
                hours=total,
                verified_hours=verified,
                percentage=Decimal(percentage)
            ))
    
    org_data = db.query(
        ServiceActivity.organization_name,
        func.sum(ServiceActivity.hours_logged).label('total_hours'),
        func.sum(func.case([(ServiceActivity.verification_status == VerificationStatus.VERIFIED, ServiceActivity.hours_logged)], else_=0)).label('verified_hours'),
        func.count(ServiceActivity.id).label('activity_count')
    ).filter(
        ServiceActivity.student_id == student_id
    ).group_by(ServiceActivity.organization_name).all()
    
    organization_breakdown = [
        OrganizationBreakdown(
            organization_name=row.organization_name,
            total_hours=Decimal(row.total_hours),
            verified_hours=Decimal(row.verified_hours),
            activity_count=row.activity_count
        )
        for row in org_data
    ]
    
    monthly_data = db.query(
        extract('month', ServiceActivity.date).label('month'),
        extract('year', ServiceActivity.date).label('year'),
        func.sum(ServiceActivity.hours_logged).label('hours'),
        func.sum(func.case([(ServiceActivity.verification_status == VerificationStatus.VERIFIED, ServiceActivity.hours_logged)], else_=0)).label('verified_hours'),
        func.count(ServiceActivity.id).label('activity_count')
    ).filter(
        ServiceActivity.student_id == student_id
    ).group_by('month', 'year').all()
    
    monthly_trends = [
        HoursByMonth(
            month=int(row.month),
            year=int(row.year),
            hours=Decimal(row.hours),
            verified_hours=Decimal(row.verified_hours),
            activity_count=row.activity_count
        )
        for row in monthly_data
    ]
    
    certificates = db.query(ServiceCertificate).filter(
        ServiceCertificate.student_id == student_id
    ).order_by(ServiceCertificate.issue_date.desc()).all()
    
    certificates_earned = [ServiceCertificateResponse.model_validate(cert) for cert in certificates]
    
    return StudentServiceReport(
        student_id=student_id,
        student_name=f"{student.first_name} {student.last_name}",
        total_hours=portfolio.total_hours,
        verified_hours=portfolio.verified_hours,
        pending_hours=portfolio.pending_hours,
        activity_breakdown=activity_breakdown,
        organization_breakdown=organization_breakdown,
        monthly_trends=monthly_trends,
        certificates_earned=certificates_earned
    )


@router.get("/reports/institution", response_model=InstitutionServiceReport)
async def get_institution_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate institution-wide community service report."""
    portfolios = db.query(ServicePortfolio).filter(
        ServicePortfolio.institution_id == current_user.institution_id
    ).all()
    
    total_students = len(portfolios)
    active_students = len([p for p in portfolios if p.verified_hours > 0])
    total_hours = sum(p.total_hours for p in portfolios)
    verified_hours = sum(p.verified_hours for p in portfolios)
    pending_hours = sum(p.pending_hours for p in portfolios)
    average_hours = verified_hours / active_students if active_students > 0 else 0
    
    activities = db.query(ServiceActivity).filter(
        ServiceActivity.institution_id == current_user.institution_id
    ).all()
    
    activity_breakdown = []
    for activity_type in ServiceActivityType:
        total = sum(a.hours_logged for a in activities if a.activity_type == activity_type)
        verified = sum(a.hours_logged for a in activities if a.activity_type == activity_type and a.verification_status == VerificationStatus.VERIFIED)
        if total > 0:
            percentage = (verified / verified_hours * 100) if verified_hours > 0 else 0
            activity_breakdown.append(ActivityTypeBreakdown(
                activity_type=activity_type.value,
                hours=total,
                verified_hours=verified,
                percentage=Decimal(percentage)
            ))
    
    org_data = db.query(
        ServiceActivity.organization_name,
        func.sum(ServiceActivity.hours_logged).label('total_hours'),
        func.sum(func.case([(ServiceActivity.verification_status == VerificationStatus.VERIFIED, ServiceActivity.hours_logged)], else_=0)).label('verified_hours'),
        func.count(ServiceActivity.id).label('activity_count')
    ).filter(
        ServiceActivity.institution_id == current_user.institution_id
    ).group_by(ServiceActivity.organization_name).order_by(func.sum(ServiceActivity.hours_logged).desc()).limit(20).all()
    
    top_organizations = [
        OrganizationBreakdown(
            organization_name=row.organization_name,
            total_hours=Decimal(row.total_hours),
            verified_hours=Decimal(row.verified_hours),
            activity_count=row.activity_count
        )
        for row in org_data
    ]
    
    monthly_data = db.query(
        extract('month', ServiceActivity.date).label('month'),
        extract('year', ServiceActivity.date).label('year'),
        func.sum(ServiceActivity.hours_logged).label('hours'),
        func.sum(func.case([(ServiceActivity.verification_status == VerificationStatus.VERIFIED, ServiceActivity.hours_logged)], else_=0)).label('verified_hours'),
        func.count(ServiceActivity.id).label('activity_count')
    ).filter(
        ServiceActivity.institution_id == current_user.institution_id
    ).group_by('month', 'year').all()
    
    monthly_trends = [
        HoursByMonth(
            month=int(row.month),
            year=int(row.year),
            hours=Decimal(row.hours),
            verified_hours=Decimal(row.verified_hours),
            activity_count=row.activity_count
        )
        for row in monthly_data
    ]
    
    return InstitutionServiceReport(
        institution_id=current_user.institution_id,
        total_students=total_students,
        active_students=active_students,
        total_hours=total_hours,
        verified_hours=verified_hours,
        pending_hours=pending_hours,
        average_hours_per_student=Decimal(average_hours),
        activity_breakdown=activity_breakdown,
        top_organizations=top_organizations,
        monthly_trends=monthly_trends
    )


@router.post("/export")
async def export_service_hours(
    export_request: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export community service hours data to CSV."""
    query = db.query(ServiceActivity).filter(
        ServiceActivity.institution_id == current_user.institution_id
    )
    
    if export_request.student_id:
        query = query.filter(ServiceActivity.student_id == export_request.student_id)
    
    if export_request.grade_id:
        students_in_grade = db.query(Student.id).join(Section).filter(
            Section.grade_id == export_request.grade_id
        ).subquery()
        query = query.filter(ServiceActivity.student_id.in_(students_in_grade))
    
    if export_request.start_date:
        query = query.filter(ServiceActivity.date >= export_request.start_date)
    
    if export_request.end_date:
        query = query.filter(ServiceActivity.date <= export_request.end_date)
    
    if export_request.activity_type:
        query = query.filter(ServiceActivity.activity_type == export_request.activity_type)
    
    if export_request.verification_status:
        query = query.filter(ServiceActivity.verification_status == export_request.verification_status)
    
    if not export_request.include_unverified:
        query = query.filter(ServiceActivity.verification_status == VerificationStatus.VERIFIED)
    
    activities = query.order_by(ServiceActivity.date).all()
    
    if export_request.format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Student Name", "Activity Name", "Organization", "Contact Person",
            "Contact Email", "Activity Type", "Date", "Hours", "Verification Status",
            "Verification Date", "Description"
        ])
        
        for activity in activities:
            student = db.query(Student).filter(Student.id == activity.student_id).first()
            student_name = f"{student.first_name} {student.last_name}" if student else ""
            
            writer.writerow([
                student_name,
                activity.activity_name,
                activity.organization_name,
                activity.contact_person,
                activity.contact_email,
                activity.activity_type.value,
                activity.date.isoformat(),
                float(activity.hours_logged),
                activity.verification_status.value,
                activity.verification_date.isoformat() if activity.verification_date else "",
                activity.description or ""
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=community_service_export.csv"}
        )
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Only CSV format is currently supported"
    )
