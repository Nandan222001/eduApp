from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from datetime import datetime
from src.models.research import (
    ResearchProject, ResearchTeamMember, ResearchMilestone, LiteratureReference,
    ResearchDocument, DocumentVersion, ExperimentLog, ResearchDataFile,
    AdvisorFeedback, PeerReview, ProjectType, PublicationStatus,
    DataCollectionStatus, MilestoneStatus
)
from src.schemas.research import (
    ResearchProjectCreate, ResearchProjectUpdate, ResearchMilestoneCreate,
    ResearchMilestoneUpdate, ResearchDocumentCreate, ResearchDocumentUpdate,
    ExperimentLogCreate, ExperimentLogUpdate, ResearchDataFileCreate,
    AdvisorFeedbackCreate, AdvisorFeedbackUpdate, PeerReviewCreate,
    PeerReviewUpdate, TeamMemberAddRequest, DocumentVersionCreate,
    LiteratureReferenceCreate
)
from src.repositories.research_repository import (
    ResearchProjectRepository, ResearchTeamMemberRepository,
    ResearchMilestoneRepository, LiteratureReferenceRepository,
    ResearchDocumentRepository, DocumentVersionRepository,
    ExperimentLogRepository, ResearchDataFileRepository,
    AdvisorFeedbackRepository, PeerReviewRepository
)


class ResearchProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.project_repo = ResearchProjectRepository(db)
        self.team_member_repo = ResearchTeamMemberRepository(db)
        self.milestone_repo = ResearchMilestoneRepository(db)
        self.literature_repo = LiteratureReferenceRepository(db)

    def create_project(self, data: ResearchProjectCreate, current_user_id: int) -> ResearchProject:
        project_data = data.model_dump(exclude={'team_members', 'timeline', 'literature_references'})
        project = self.project_repo.create(**project_data)
        
        for member_data in data.team_members:
            self.team_member_repo.create(
                project_id=project.id,
                student_id=member_data.student_id,
                role=member_data.role
            )
        
        for idx, milestone_data in enumerate(data.timeline):
            self.milestone_repo.create(
                project_id=project.id,
                title=milestone_data.milestone_title,
                description=milestone_data.milestone_description,
                deadline=milestone_data.deadline,
                display_order=idx
            )
        
        for ref_data in data.literature_references:
            self.literature_repo.create(
                project_id=project.id,
                **ref_data.model_dump()
            )
        
        self.db.commit()
        self.db.refresh(project)
        return project

    def get_project(self, project_id: int) -> Optional[ResearchProject]:
        return self.project_repo.get_by_id(project_id)

    def get_project_with_details(self, project_id: int) -> Optional[ResearchProject]:
        return self.project_repo.get_with_details(project_id)

    def list_projects(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        subject_area: Optional[str] = None,
        project_type: Optional[ProjectType] = None,
        publication_status: Optional[PublicationStatus] = None,
        advisor_id: Optional[int] = None,
        student_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[ResearchProject], int]:
        projects = self.project_repo.list_by_institution(
            institution_id=institution_id,
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
        
        total = self.project_repo.count_by_institution(
            institution_id=institution_id,
            subject_area=subject_area,
            project_type=project_type,
            publication_status=publication_status,
            advisor_id=advisor_id,
            student_id=student_id,
            search=search,
            is_active=is_active
        )
        
        return projects, total

    def update_project(self, project_id: int, data: ResearchProjectUpdate) -> Optional[ResearchProject]:
        update_data = data.model_dump(exclude_unset=True)
        project = self.project_repo.update(project_id, **update_data)
        if project:
            self.db.commit()
            self.db.refresh(project)
        return project

    def delete_project(self, project_id: int) -> bool:
        success = self.project_repo.delete(project_id)
        if success:
            self.db.commit()
        return success

    def add_team_member(self, project_id: int, data: TeamMemberAddRequest) -> ResearchTeamMember:
        existing = self.team_member_repo.get_by_project_and_student(project_id, data.student_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student is already a team member"
            )
        
        member = self.team_member_repo.create(
            project_id=project_id,
            student_id=data.student_id,
            role=data.role
        )
        self.db.commit()
        self.db.refresh(member)
        return member

    def remove_team_member(self, member_id: int) -> bool:
        success = self.team_member_repo.delete(member_id)
        if success:
            self.db.commit()
        return success

    def get_team_members(self, project_id: int) -> List[ResearchTeamMember]:
        return self.team_member_repo.list_by_project(project_id)


class ResearchMilestoneService:
    def __init__(self, db: Session):
        self.db = db
        self.milestone_repo = ResearchMilestoneRepository(db)

    def create_milestone(self, data: ResearchMilestoneCreate, project_id: int) -> ResearchMilestone:
        milestone = self.milestone_repo.create(
            project_id=project_id,
            **data.model_dump()
        )
        self.db.commit()
        self.db.refresh(milestone)
        return milestone

    def get_milestone(self, milestone_id: int) -> Optional[ResearchMilestone]:
        return self.milestone_repo.get_by_id(milestone_id)

    def list_milestones(self, project_id: int) -> List[ResearchMilestone]:
        return self.milestone_repo.list_by_project(project_id)

    def update_milestone(self, milestone_id: int, data: ResearchMilestoneUpdate) -> Optional[ResearchMilestone]:
        update_data = data.model_dump(exclude_unset=True)
        
        if data.status == MilestoneStatus.COMPLETED and 'completed_at' not in update_data:
            update_data['completed_at'] = datetime.utcnow()
        
        milestone = self.milestone_repo.update(milestone_id, **update_data)
        if milestone:
            self.db.commit()
            self.db.refresh(milestone)
        return milestone

    def delete_milestone(self, milestone_id: int) -> bool:
        success = self.milestone_repo.delete(milestone_id)
        if success:
            self.db.commit()
        return success

    def get_overdue_milestones(self, project_id: int) -> List[ResearchMilestone]:
        return self.milestone_repo.get_overdue_milestones(project_id)


class ResearchDocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.document_repo = ResearchDocumentRepository(db)
        self.version_repo = DocumentVersionRepository(db)

    def create_document(self, data: ResearchDocumentCreate, student_id: int) -> ResearchDocument:
        document = self.document_repo.create(
            created_by_student_id=student_id,
            **data.model_dump()
        )
        self.db.commit()
        self.db.refresh(document)
        return document

    def get_document(self, document_id: int) -> Optional[ResearchDocument]:
        return self.document_repo.get_by_id(document_id)

    def get_document_with_versions(self, document_id: int) -> Optional[ResearchDocument]:
        return self.document_repo.get_with_versions(document_id)

    def list_documents(self, project_id: int) -> List[ResearchDocument]:
        return self.document_repo.list_by_project(project_id)

    def update_document(
        self, 
        document_id: int, 
        data: ResearchDocumentUpdate, 
        student_id: int,
        create_version: bool = True
    ) -> Optional[ResearchDocument]:
        document = self.document_repo.get_by_id(document_id)
        if not document:
            return None
        
        if create_version and (data.content or data.file_url):
            # Snapshot the document's content as it stood BEFORE this update
            # is applied below, not the incoming new content -- otherwise the
            # version row and the post-update document end up holding the
            # identical (new) text, and the version history can never show
            # what the document said prior to this edit.
            latest_version_number = self.version_repo.get_latest_version_number(document_id)
            self.version_repo.create(
                document_id=document_id,
                version_number=latest_version_number + 1,
                content=document.content,
                file_url=document.file_url,
                created_by_student_id=student_id
            )
        
        update_data = data.model_dump(exclude_unset=True)
        document = self.document_repo.update(document_id, **update_data)
        if document:
            self.db.commit()
            self.db.refresh(document)
        return document

    def delete_document(self, document_id: int) -> bool:
        success = self.document_repo.delete(document_id)
        if success:
            self.db.commit()
        return success

    def create_version(self, document_id: int, data: DocumentVersionCreate, student_id: int) -> DocumentVersion:
        document = self.document_repo.get_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        latest_version_number = self.version_repo.get_latest_version_number(document_id)
        
        version = self.version_repo.create(
            document_id=document_id,
            version_number=latest_version_number + 1,
            content=data.content or document.content,
            file_url=data.file_url or document.file_url,
            changes_summary=data.changes_summary,
            created_by_student_id=student_id
        )
        self.db.commit()
        self.db.refresh(version)
        return version

    def list_versions(self, document_id: int) -> List[DocumentVersion]:
        return self.version_repo.list_by_document(document_id)


class ExperimentLogService:
    def __init__(self, db: Session):
        self.db = db
        self.log_repo = ExperimentLogRepository(db)

    def create_log(self, data: ExperimentLogCreate, student_id: int) -> ExperimentLog:
        log = self.log_repo.create(
            recorded_by_student_id=student_id,
            **data.model_dump()
        )
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_log(self, log_id: int) -> Optional[ExperimentLog]:
        return self.log_repo.get_by_id(log_id)

    def list_logs(self, project_id: int) -> List[ExperimentLog]:
        return self.log_repo.list_by_project(project_id)

    def update_log(self, log_id: int, data: ExperimentLogUpdate) -> Optional[ExperimentLog]:
        update_data = data.model_dump(exclude_unset=True)
        log = self.log_repo.update(log_id, **update_data)
        if log:
            self.db.commit()
            self.db.refresh(log)
        return log

    def delete_log(self, log_id: int) -> bool:
        success = self.log_repo.delete(log_id)
        if success:
            self.db.commit()
        return success


class ResearchDataFileService:
    def __init__(self, db: Session):
        self.db = db
        self.file_repo = ResearchDataFileRepository(db)

    def create_data_file(self, data: ResearchDataFileCreate, student_id: int) -> ResearchDataFile:
        data_file = self.file_repo.create(
            uploaded_by_student_id=student_id,
            **data.model_dump()
        )
        self.db.commit()
        self.db.refresh(data_file)
        return data_file

    def get_data_file(self, file_id: int) -> Optional[ResearchDataFile]:
        return self.file_repo.get_by_id(file_id)

    def list_data_files(self, project_id: int) -> List[ResearchDataFile]:
        return self.file_repo.list_by_project(project_id)

    def delete_data_file(self, file_id: int) -> bool:
        success = self.file_repo.delete(file_id)
        if success:
            self.db.commit()
        return success


class AdvisorFeedbackService:
    def __init__(self, db: Session):
        self.db = db
        self.feedback_repo = AdvisorFeedbackRepository(db)

    def create_feedback(self, data: AdvisorFeedbackCreate, teacher_id: int) -> AdvisorFeedback:
        feedback = self.feedback_repo.create(
            teacher_id=teacher_id,
            **data.model_dump()
        )
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def get_feedback(self, feedback_id: int) -> Optional[AdvisorFeedback]:
        return self.feedback_repo.get_by_id(feedback_id)

    def list_feedback(self, project_id: int) -> List[AdvisorFeedback]:
        return self.feedback_repo.list_by_project(project_id)

    def update_feedback(self, feedback_id: int, data: AdvisorFeedbackUpdate) -> Optional[AdvisorFeedback]:
        update_data = data.model_dump(exclude_unset=True)
        feedback = self.feedback_repo.update(feedback_id, **update_data)
        if feedback:
            self.db.commit()
            self.db.refresh(feedback)
        return feedback

    def delete_feedback(self, feedback_id: int) -> bool:
        success = self.feedback_repo.delete(feedback_id)
        if success:
            self.db.commit()
        return success


class PeerReviewService:
    def __init__(self, db: Session):
        self.db = db
        self.review_repo = PeerReviewRepository(db)

    def create_review(self, data: PeerReviewCreate, reviewer_student_id: int) -> PeerReview:
        existing = self.review_repo.get_by_reviewer(data.project_id, reviewer_student_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted a review for this project"
            )
        
        review = self.review_repo.create(
            reviewer_student_id=reviewer_student_id,
            **data.model_dump()
        )
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_review(self, review_id: int) -> Optional[PeerReview]:
        return self.review_repo.get_by_id(review_id)

    def list_reviews(self, project_id: int) -> List[PeerReview]:
        return self.review_repo.list_by_project(project_id)

    def update_review(self, review_id: int, data: PeerReviewUpdate) -> Optional[PeerReview]:
        update_data = data.model_dump(exclude_unset=True)
        review = self.review_repo.update(review_id, **update_data)
        if review:
            self.db.commit()
            self.db.refresh(review)
        return review

    def delete_review(self, review_id: int) -> bool:
        success = self.review_repo.delete(review_id)
        if success:
            self.db.commit()
        return success

    def get_average_rating(self, project_id: int) -> Optional[float]:
        return self.review_repo.get_average_rating(project_id)


class LiteratureReferenceService:
    def __init__(self, db: Session):
        self.db = db
        self.reference_repo = LiteratureReferenceRepository(db)

    def create_reference(self, data: LiteratureReferenceCreate, project_id: int) -> LiteratureReference:
        reference = self.reference_repo.create(
            project_id=project_id,
            **data.model_dump()
        )
        self.db.commit()
        self.db.refresh(reference)
        return reference

    def get_reference(self, reference_id: int) -> Optional[LiteratureReference]:
        return self.reference_repo.get_by_id(reference_id)

    def list_references(self, project_id: int) -> List[LiteratureReference]:
        return self.reference_repo.list_by_project(project_id)

    def delete_reference(self, reference_id: int) -> bool:
        success = self.reference_repo.delete(reference_id)
        if success:
            self.db.commit()
        return success
