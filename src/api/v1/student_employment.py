from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import date, datetime
from src.database import get_db
from src.schemas.student_employment import (
    StudentJobListingCreate,
    StudentJobListingUpdate,
    StudentJobListingResponse,
    WorkPermitCreate,
    WorkPermitUpdate,
    WorkPermitResponse,
    StudentEmploymentCreate,
    StudentEmploymentUpdate,
    StudentEmploymentResponse,
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    JobApplicationWithListing,
    EmploymentVerificationRequest,
    StudentEmploymentSummary,
)
from src.models.student_employment import (
    StudentJobListing,
    WorkPermit,
    StudentEmployment,
    JobApplication,
    JobType,
    PermitType,
    AuthorizationStatus,
)
from src.dependencies.auth import get_current_user
from src.models.user import User

router = APIRouter()


@router.post("/job-listings", response_model=StudentJobListingResponse, status_code=status.HTTP_201_CREATED)
async def create_job_listing(
    listing_data: StudentJobListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job_listing = StudentJobListing(**listing_data.model_dump())
    db.add(job_listing)
    db.commit()
    db.refresh(job_listing)
    return job_listing


@router.get("/job-listings", response_model=List[StudentJobListingResponse])
async def list_job_listings(
    job_type: Optional[str] = None,
    employer_verified: Optional[bool] = None,
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StudentJobListing).filter(
        StudentJobListing.institution_id == current_user.institution_id
    )
    
    if job_type:
        query = query.filter(StudentJobListing.job_type == job_type)
    
    if employer_verified is not None:
        query = query.filter(StudentJobListing.employer_verified == employer_verified)
    
    if is_active is not None:
        query = query.filter(StudentJobListing.is_active == is_active)
    
    if search:
        search_filter = or_(
            StudentJobListing.job_title.ilike(f"%{search}%"),
            StudentJobListing.employer_name.ilike(f"%{search}%"),
            StudentJobListing.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    query = query.filter(
        or_(
            StudentJobListing.expiry_date.is_(None),
            StudentJobListing.expiry_date >= date.today()
        )
    )
    
    query = query.order_by(StudentJobListing.posting_date.desc())
    listings = query.offset(offset).limit(limit).all()
    return listings


@router.get("/job-listings/{listing_id}", response_model=StudentJobListingResponse)
async def get_job_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(StudentJobListing).filter(
        StudentJobListing.id == listing_id,
        StudentJobListing.institution_id == current_user.institution_id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )
    
    return listing


@router.put("/job-listings/{listing_id}", response_model=StudentJobListingResponse)
async def update_job_listing(
    listing_id: int,
    update_data: StudentJobListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(StudentJobListing).filter(
        StudentJobListing.id == listing_id,
        StudentJobListing.institution_id == current_user.institution_id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(listing, key, value)
    
    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/job-listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(StudentJobListing).filter(
        StudentJobListing.id == listing_id,
        StudentJobListing.institution_id == current_user.institution_id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )
    
    listing.is_active = False
    db.commit()


@router.post("/applications", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_job_application(
    application_data: JobApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_application = db.query(JobApplication).filter(
        JobApplication.student_id == application_data.student_id,
        JobApplication.job_listing_id == application_data.job_listing_id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student has already applied to this job"
        )
    
    job_listing = db.query(StudentJobListing).filter(
        StudentJobListing.id == application_data.job_listing_id
    ).first()
    
    if not job_listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )
    
    application = JobApplication(**application_data.model_dump())
    db.add(application)
    
    job_listing.application_count += 1
    
    db.commit()
    db.refresh(application)
    return application


@router.get("/applications/student/{student_id}", response_model=List[JobApplicationWithListing])
async def get_student_applications(
    student_id: int,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(JobApplication).filter(
        JobApplication.student_id == student_id,
        JobApplication.institution_id == current_user.institution_id
    )
    
    if status_filter:
        query = query.filter(JobApplication.status == status_filter)
    
    applications = query.order_by(JobApplication.application_date.desc()).all()
    
    result = []
    for app in applications:
        app_dict = {
            "id": app.id,
            "institution_id": app.institution_id,
            "student_id": app.student_id,
            "job_listing_id": app.job_listing_id,
            "application_date": app.application_date,
            "status": app.status,
            "cover_letter": app.cover_letter,
            "resume_url": app.resume_url,
            "notes": app.notes,
            "interview_date": app.interview_date,
            "response_date": app.response_date,
            "outcome": app.outcome,
            "is_active": app.is_active,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
            "job_listing": app.job_listing
        }
        result.append(app_dict)
    
    return result


@router.put("/applications/{application_id}", response_model=JobApplicationResponse)
async def update_job_application(
    application_id: int,
    update_data: JobApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.institution_id == current_user.institution_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(application, key, value)
    
    db.commit()
    db.refresh(application)
    return application


@router.post("/work-permits", response_model=WorkPermitResponse, status_code=status.HTTP_201_CREATED)
async def create_work_permit(
    permit_data: WorkPermitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    work_permit = WorkPermit(**permit_data.model_dump())
    db.add(work_permit)
    db.commit()
    db.refresh(work_permit)
    return work_permit


@router.get("/work-permits/student/{student_id}", response_model=List[WorkPermitResponse])
async def get_student_work_permits(
    student_id: int,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(WorkPermit).filter(
        WorkPermit.student_id == student_id,
        WorkPermit.institution_id == current_user.institution_id
    )
    
    if is_active is not None:
        query = query.filter(WorkPermit.is_active == is_active)
    
    permits = query.order_by(WorkPermit.issue_date.desc()).all()
    return permits


@router.get("/work-permits/{permit_id}", response_model=WorkPermitResponse)
async def get_work_permit(
    permit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    permit = db.query(WorkPermit).filter(
        WorkPermit.id == permit_id,
        WorkPermit.institution_id == current_user.institution_id
    ).first()
    
    if not permit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work permit not found"
        )
    
    return permit


@router.put("/work-permits/{permit_id}", response_model=WorkPermitResponse)
async def update_work_permit(
    permit_id: int,
    update_data: WorkPermitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    permit = db.query(WorkPermit).filter(
        WorkPermit.id == permit_id,
        WorkPermit.institution_id == current_user.institution_id
    ).first()
    
    if not permit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work permit not found"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(permit, key, value)
    
    db.commit()
    db.refresh(permit)
    return permit


@router.post("/work-permits/{permit_id}/authorize", response_model=WorkPermitResponse)
async def authorize_work_permit(
    permit_id: int,
    authorization_status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    permit = db.query(WorkPermit).filter(
        WorkPermit.id == permit_id,
        WorkPermit.institution_id == current_user.institution_id
    ).first()
    
    if not permit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work permit not found"
        )
    
    try:
        permit.school_authorization_status = AuthorizationStatus(authorization_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authorization status"
        )
    
    db.commit()
    db.refresh(permit)
    return permit


@router.post("/employments", response_model=StudentEmploymentResponse, status_code=status.HTTP_201_CREATED)
async def create_student_employment(
    employment_data: StudentEmploymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employment = StudentEmployment(**employment_data.model_dump())
    db.add(employment)
    db.commit()
    db.refresh(employment)
    return employment


@router.get("/employments/student/{student_id}", response_model=List[StudentEmploymentResponse])
async def get_student_employments(
    student_id: int,
    is_current: Optional[bool] = None,
    verified_for_graduation: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StudentEmployment).filter(
        StudentEmployment.student_id == student_id,
        StudentEmployment.institution_id == current_user.institution_id
    )
    
    if is_current is not None:
        query = query.filter(StudentEmployment.is_current == is_current)
    
    if verified_for_graduation is not None:
        query = query.filter(StudentEmployment.verified_for_graduation == verified_for_graduation)
    
    employments = query.order_by(StudentEmployment.start_date.desc()).all()
    return employments


@router.get("/employments/{employment_id}", response_model=StudentEmploymentResponse)
async def get_student_employment(
    employment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employment = db.query(StudentEmployment).filter(
        StudentEmployment.id == employment_id,
        StudentEmployment.institution_id == current_user.institution_id
    ).first()
    
    if not employment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student employment record not found"
        )
    
    return employment


@router.put("/employments/{employment_id}", response_model=StudentEmploymentResponse)
async def update_student_employment(
    employment_id: int,
    update_data: StudentEmploymentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employment = db.query(StudentEmployment).filter(
        StudentEmployment.id == employment_id,
        StudentEmployment.institution_id == current_user.institution_id
    ).first()
    
    if not employment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student employment record not found"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(employment, key, value)
    
    db.commit()
    db.refresh(employment)
    return employment


@router.post("/employments/{employment_id}/verify", response_model=StudentEmploymentResponse)
async def verify_employment_for_graduation(
    employment_id: int,
    verification_data: EmploymentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employment = db.query(StudentEmployment).filter(
        StudentEmployment.id == employment_id,
        StudentEmployment.institution_id == current_user.institution_id
    ).first()
    
    if not employment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student employment record not found"
        )
    
    employment.verified_for_graduation = verification_data.verified_for_graduation
    employment.verification_date = date.today()
    employment.verified_by = current_user.id
    
    db.commit()
    db.refresh(employment)
    return employment


@router.get("/employments/student/{student_id}/summary", response_model=StudentEmploymentSummary)
async def get_student_employment_summary(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employments = db.query(StudentEmployment).filter(
        StudentEmployment.student_id == student_id,
        StudentEmployment.institution_id == current_user.institution_id,
        StudentEmployment.is_active == True
    ).all()
    
    total_jobs = len(employments)
    current_jobs = sum(1 for e in employments if e.is_current)
    verified_jobs = sum(1 for e in employments if e.verified_for_graduation)
    
    total_hours = sum(
        (e.total_hours_worked or 0) for e in employments
    )
    
    job_types_summary = {}
    for employment in employments:
        job_type = employment.job_type.value if hasattr(employment.job_type, 'value') else str(employment.job_type)
        job_types_summary[job_type] = job_types_summary.get(job_type, 0) + 1
    
    return StudentEmploymentSummary(
        student_id=student_id,
        total_jobs=total_jobs,
        current_jobs=current_jobs,
        total_hours_worked=total_hours,
        verified_jobs=verified_jobs,
        job_types_summary=job_types_summary
    )


@router.get("/work-permits/expiring", response_model=List[WorkPermitResponse])
async def get_expiring_work_permits(
    days: int = Query(30, description="Number of days to look ahead"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import timedelta
    
    expiry_threshold = date.today() + timedelta(days=days)
    
    permits = db.query(WorkPermit).filter(
        WorkPermit.institution_id == current_user.institution_id,
        WorkPermit.is_active == True,
        WorkPermit.expiry_date <= expiry_threshold,
        WorkPermit.expiry_date >= date.today()
    ).order_by(WorkPermit.expiry_date).all()
    
    return permits


@router.get("/employments/verification-pending", response_model=List[StudentEmploymentResponse])
async def get_pending_employment_verifications(
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employments = db.query(StudentEmployment).filter(
        StudentEmployment.institution_id == current_user.institution_id,
        StudentEmployment.is_active == True,
        StudentEmployment.verified_for_graduation == False
    ).order_by(StudentEmployment.start_date.desc()).limit(limit).all()
    
    return employments


@router.get("/statistics/overview", response_model=dict)
async def get_employment_statistics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    active_listings = db.query(func.count(StudentJobListing.id)).filter(
        StudentJobListing.institution_id == current_user.institution_id,
        StudentJobListing.is_active == True,
        or_(
            StudentJobListing.expiry_date.is_(None),
            StudentJobListing.expiry_date >= date.today()
        )
    ).scalar()
    
    total_applications = db.query(func.count(JobApplication.id)).filter(
        JobApplication.institution_id == current_user.institution_id,
        JobApplication.is_active == True
    ).scalar()
    
    active_employments = db.query(func.count(StudentEmployment.id)).filter(
        StudentEmployment.institution_id == current_user.institution_id,
        StudentEmployment.is_active == True,
        StudentEmployment.is_current == True
    ).scalar()
    
    active_permits = db.query(func.count(WorkPermit.id)).filter(
        WorkPermit.institution_id == current_user.institution_id,
        WorkPermit.is_active == True,
        WorkPermit.expiry_date >= date.today()
    ).scalar()
    
    pending_verifications = db.query(func.count(StudentEmployment.id)).filter(
        StudentEmployment.institution_id == current_user.institution_id,
        StudentEmployment.is_active == True,
        StudentEmployment.verified_for_graduation == False
    ).scalar()
    
    return {
        "active_job_listings": active_listings,
        "total_applications": total_applications,
        "active_employments": active_employments,
        "active_work_permits": active_permits,
        "pending_verifications": pending_verifications
    }
