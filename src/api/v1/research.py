from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
from src.models.research import ProjectType, PublicationStatus, DataCollectionStatus
from src.dependencies.auth import get_current_user
from src.schemas.research import (
    ResearchProjectCreate, ResearchProjectUpdate, ResearchProjectResponse,
    ResearchProjectDetailResponse, ResearchMilestoneCreate, ResearchMilestoneUpdate,
    ResearchMilestoneResponse, ResearchDocumentCreate, ResearchDocumentUpdate,
    ResearchDocumentResponse, DocumentVersionCreate, DocumentVersionResponse,
    ExperimentLogCreate, ExperimentLogUpdate, ExperimentLogResponse,
    ResearchDataFileCreate, ResearchDataFileResponse, AdvisorFeedbackCreate,
    AdvisorFeedbackUpdate, AdvisorFeedbackResponse, PeerReviewCreate,
    PeerReviewUpdate, PeerReviewResponse, TeamMemberAddRequest,
    ResearchTeamMemberResponse, LiteratureReferenceCreate, LiteratureReferenceResponse,
    ProjectShowcaseResponse, FileUploadResponse
)
from src.services.research_service import (
    ResearchProjectService, ResearchMilestoneService, ResearchDocumentService,
    ExperimentLogService, ResearchDataFileService, AdvisorFeedbackService,
    PeerReviewService, LiteratureReferenceService
)

router = APIRouter()


@router.post("/projects", response_model=ResearchProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_research_project(
    project_data: ResearchProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.institution_id != project_data.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create project for this institution"
        )

    service = ResearchProjectService(db)
    project = service.create_project(project_data, current_user.id)
    return project


@router.get("/projects", response_model=dict)
async def list_research_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    subject_area: Optional[str] = Query(None),
    project_type: Optional[ProjectType] = Query(None),
    publication_status: Optional[PublicationStatus] = Query(None),
    advisor_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    projects, total = service.list_projects(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        subject_area=subject_area,
        project_type=project_type,
        publication_status=publication_status,
        advisor_id=advisor_id,
        student_id=student_id,
        search=search,
        is_active=is_active
    )
    return {
        "items": [ResearchProjectResponse.model_validate(p) for p in projects],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/projects/{project_id}", response_model=ResearchProjectDetailResponse)
async def get_research_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    project = service.get_project_with_details(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research project not found"
        )

    if project.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )

    return project


@router.put("/projects/{project_id}", response_model=ResearchProjectResponse)
async def update_research_project(
    project_id: int,
    project_data: ResearchProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    project = service.get_project(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research project not found"
        )

    if project.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )

    updated_project = service.update_project(project_id, project_data)
    return updated_project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_research_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    project = service.get_project(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research project not found"
        )

    if project.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project"
        )

    service.delete_project(project_id)


@router.post("/projects/{project_id}/team-members", response_model=ResearchTeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_team_member(
    project_id: int,
    member_data: TeamMemberAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    project = service.get_project(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research project not found"
        )

    if project.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project"
        )

    member = service.add_team_member(project_id, member_data)
    return member


@router.delete("/projects/team-members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    success = service.remove_team_member(member_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )


@router.get("/projects/{project_id}/team-members", response_model=List[ResearchTeamMemberResponse])
async def list_team_members(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    members = service.get_team_members(project_id)
    return members


@router.post("/projects/{project_id}/milestones", response_model=ResearchMilestoneResponse, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    project_id: int,
    milestone_data: ResearchMilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project_service = ResearchProjectService(db)
    project = project_service.get_project(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research project not found"
        )

    if project.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project"
        )

    service = ResearchMilestoneService(db)
    milestone = service.create_milestone(milestone_data, project_id)
    return milestone


@router.get("/projects/{project_id}/milestones", response_model=List[ResearchMilestoneResponse])
async def list_milestones(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchMilestoneService(db)
    milestones = service.list_milestones(project_id)
    return milestones


@router.put("/milestones/{milestone_id}", response_model=ResearchMilestoneResponse)
async def update_milestone(
    milestone_id: int,
    milestone_data: ResearchMilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchMilestoneService(db)
    milestone = service.get_milestone(milestone_id)

    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )

    updated_milestone = service.update_milestone(milestone_id, milestone_data)
    return updated_milestone


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchMilestoneService(db)
    success = service.delete_milestone(milestone_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )


@router.get("/projects/{project_id}/milestones/overdue", response_model=List[ResearchMilestoneResponse])
async def get_overdue_milestones(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchMilestoneService(db)
    milestones = service.get_overdue_milestones(project_id)
    return milestones


@router.post("/projects/{project_id}/documents", response_model=ResearchDocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    project_id: int,
    document_data: ResearchDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create documents"
        )

    service = ResearchDocumentService(db)
    document = service.create_document(document_data, current_user.student_profile.id)
    return document


@router.get("/projects/{project_id}/documents", response_model=List[ResearchDocumentResponse])
async def list_documents(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchDocumentService(db)
    documents = service.list_documents(project_id)
    return documents


@router.get("/documents/{document_id}", response_model=ResearchDocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchDocumentService(db)
    document = service.get_document(document_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document


@router.put("/documents/{document_id}", response_model=ResearchDocumentResponse)
async def update_document(
    document_id: int,
    document_data: ResearchDocumentUpdate,
    create_version: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can update documents"
        )

    service = ResearchDocumentService(db)
    document = service.update_document(
        document_id, 
        document_data, 
        current_user.student_profile.id,
        create_version
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchDocumentService(db)
    success = service.delete_document(document_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )


@router.post("/documents/{document_id}/versions", response_model=DocumentVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_document_version(
    document_id: int,
    version_data: DocumentVersionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create versions"
        )

    service = ResearchDocumentService(db)
    version = service.create_version(document_id, version_data, current_user.student_profile.id)
    return version


@router.get("/documents/{document_id}/versions", response_model=List[DocumentVersionResponse])
async def list_document_versions(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchDocumentService(db)
    versions = service.list_versions(document_id)
    return versions


@router.post("/projects/{project_id}/experiment-logs", response_model=ExperimentLogResponse, status_code=status.HTTP_201_CREATED)
async def create_experiment_log(
    project_id: int,
    log_data: ExperimentLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create experiment logs"
        )

    service = ExperimentLogService(db)
    log = service.create_log(log_data, current_user.student_profile.id)
    return log


@router.get("/projects/{project_id}/experiment-logs", response_model=List[ExperimentLogResponse])
async def list_experiment_logs(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExperimentLogService(db)
    logs = service.list_logs(project_id)
    return logs


@router.put("/experiment-logs/{log_id}", response_model=ExperimentLogResponse)
async def update_experiment_log(
    log_id: int,
    log_data: ExperimentLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExperimentLogService(db)
    log = service.get_log(log_id)

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment log not found"
        )

    updated_log = service.update_log(log_id, log_data)
    return updated_log


@router.delete("/experiment-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExperimentLogService(db)
    success = service.delete_log(log_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment log not found"
        )


@router.post("/projects/{project_id}/data-files", response_model=ResearchDataFileResponse, status_code=status.HTTP_201_CREATED)
async def upload_data_file(
    project_id: int,
    file_data: ResearchDataFileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can upload data files"
        )

    service = ResearchDataFileService(db)
    data_file = service.create_data_file(file_data, current_user.student_profile.id)
    return data_file


@router.get("/projects/{project_id}/data-files", response_model=List[ResearchDataFileResponse])
async def list_data_files(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchDataFileService(db)
    files = service.list_data_files(project_id)
    return files


@router.delete("/data-files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchDataFileService(db)
    success = service.delete_data_file(file_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data file not found"
        )


@router.post("/projects/{project_id}/advisor-feedback", response_model=AdvisorFeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_advisor_feedback(
    project_id: int,
    feedback_data: AdvisorFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.teacher_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can provide advisor feedback"
        )

    service = AdvisorFeedbackService(db)
    feedback = service.create_feedback(feedback_data, current_user.teacher_profile.id)
    return feedback


@router.get("/projects/{project_id}/advisor-feedback", response_model=List[AdvisorFeedbackResponse])
async def list_advisor_feedback(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdvisorFeedbackService(db)
    feedback_list = service.list_feedback(project_id)
    return feedback_list


@router.put("/advisor-feedback/{feedback_id}", response_model=AdvisorFeedbackResponse)
async def update_advisor_feedback(
    feedback_id: int,
    feedback_data: AdvisorFeedbackUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdvisorFeedbackService(db)
    feedback = service.get_feedback(feedback_id)

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )

    updated_feedback = service.update_feedback(feedback_id, feedback_data)
    return updated_feedback


@router.delete("/advisor-feedback/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_advisor_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdvisorFeedbackService(db)
    success = service.delete_feedback(feedback_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )


@router.post("/projects/{project_id}/peer-reviews", response_model=PeerReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_peer_review(
    project_id: int,
    review_data: PeerReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit peer reviews"
        )

    service = PeerReviewService(db)
    review = service.create_review(review_data, current_user.student_profile.id)
    return review


@router.get("/projects/{project_id}/peer-reviews", response_model=List[PeerReviewResponse])
async def list_peer_reviews(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PeerReviewService(db)
    reviews = service.list_reviews(project_id)
    return reviews


@router.put("/peer-reviews/{review_id}", response_model=PeerReviewResponse)
async def update_peer_review(
    review_id: int,
    review_data: PeerReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PeerReviewService(db)
    review = service.get_review(review_id)

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    if current_user.student_profile and review.reviewer_student_id != current_user.student_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this review"
        )

    updated_review = service.update_review(review_id, review_data)
    return updated_review


@router.delete("/peer-reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_peer_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PeerReviewService(db)
    success = service.delete_review(review_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )


@router.get("/projects/{project_id}/average-rating")
async def get_project_average_rating(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PeerReviewService(db)
    avg_rating = service.get_average_rating(project_id)
    return {"project_id": project_id, "average_rating": avg_rating}


@router.post("/projects/{project_id}/literature-references", response_model=LiteratureReferenceResponse, status_code=status.HTTP_201_CREATED)
async def add_literature_reference(
    project_id: int,
    reference_data: LiteratureReferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LiteratureReferenceService(db)
    reference = service.create_reference(reference_data, project_id)
    return reference


@router.get("/projects/{project_id}/literature-references", response_model=List[LiteratureReferenceResponse])
async def list_literature_references(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LiteratureReferenceService(db)
    references = service.list_references(project_id)
    return references


@router.delete("/literature-references/{reference_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_literature_reference(
    reference_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LiteratureReferenceService(db)
    success = service.delete_reference(reference_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reference not found"
        )


@router.get("/showcase", response_model=List[ProjectShowcaseResponse])
async def get_research_showcase(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    subject_area: Optional[str] = Query(None),
    project_type: Optional[ProjectType] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ResearchProjectService(db)
    projects, total = service.list_projects(
        institution_id=current_user.institution_id,
        skip=skip,
        limit=limit,
        subject_area=subject_area,
        project_type=project_type,
        publication_status=PublicationStatus.PUBLISHED,
        is_active=True
    )
    
    peer_review_service = PeerReviewService(db)
    showcase_projects = []
    
    for project in projects:
        team_size = len(project.team_members)
        avg_rating = peer_review_service.get_average_rating(project.id)
        
        showcase_projects.append(ProjectShowcaseResponse(
            id=project.id,
            project_title=project.project_title,
            abstract=project.abstract,
            subject_area=project.subject_area,
            project_type=project.project_type,
            publication_status=project.publication_status,
            presentation_url=project.presentation_url,
            created_at=project.created_at,
            team_size=team_size,
            avg_rating=avg_rating
        ))
    
    return showcase_projects
