from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class ProjectType(str, Enum):
    SCIENCE_FAIR = "science_fair"
    HISTORY_PROJECT = "history_project"
    LITERARY_ANALYSIS = "literary_analysis"
    MATH_INVESTIGATION = "math_investigation"


class PublicationStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    SUBMITTED = "submitted"
    PUBLISHED = "published"
    REJECTED = "rejected"


class DataCollectionStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class TeamMemberRole(str, Enum):
    LEAD = "lead"
    RESEARCHER = "researcher"
    DATA_ANALYST = "data_analyst"
    WRITER = "writer"
    EDITOR = "editor"


class DocumentVisibility(str, Enum):
    TEAM = "team"
    ADVISOR = "advisor"
    PUBLIC = "public"


class FeedbackStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    ADDRESSED = "addressed"


class ReviewDecision(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    NEEDS_REVISION = "needs_revision"
    REJECTED = "rejected"


class ResearchProject(Base):
    __tablename__ = "research_projects"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    project_title = Column(String(500), nullable=False)
    abstract = Column(Text, nullable=True)
    research_question = Column(Text, nullable=False)
    hypothesis = Column(Text, nullable=True)
    methodology = Column(Text, nullable=True)
    subject_area = Column(String(200), nullable=False, index=True)
    project_type = Column(SQLEnum(ProjectType), nullable=False, index=True)
    advisor_teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    data_collection_status = Column(SQLEnum(DataCollectionStatus), default=DataCollectionStatus.NOT_STARTED, nullable=False, index=True)
    findings = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    presentation_url = Column(String(1000), nullable=True)
    publication_status = Column(SQLEnum(PublicationStatus), default=PublicationStatus.DRAFT, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    advisor = relationship("Teacher", foreign_keys=[advisor_teacher_id])
    team_members = relationship("ResearchTeamMember", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("ResearchMilestone", back_populates="project", cascade="all, delete-orphan")
    literature_references = relationship("LiteratureReference", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("ResearchDocument", back_populates="project", cascade="all, delete-orphan")
    experiment_logs = relationship("ExperimentLog", back_populates="project", cascade="all, delete-orphan")
    data_files = relationship("ResearchDataFile", back_populates="project", cascade="all, delete-orphan")
    advisor_feedback = relationship("AdvisorFeedback", back_populates="project", cascade="all, delete-orphan")
    peer_reviews = relationship("PeerReview", back_populates="project", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_research_project_institution', 'institution_id'),
        Index('idx_research_project_advisor', 'advisor_teacher_id'),
        Index('idx_research_project_subject', 'subject_area'),
        Index('idx_research_project_type', 'project_type'),
        Index('idx_research_project_status', 'publication_status'),
        Index('idx_research_project_data_status', 'data_collection_status'),
        Index('idx_research_project_active', 'is_active'),
    )


class ResearchTeamMember(Base):
    __tablename__ = "research_team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    role = Column(SQLEnum(TeamMemberRole), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="team_members")
    student = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('project_id', 'student_id', name='uq_project_student'),
        Index('idx_team_member_project', 'project_id'),
        Index('idx_team_member_student', 'student_id'),
    )


class ResearchMilestone(Base):
    __tablename__ = "research_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=False)
    status = Column(SQLEnum(MilestoneStatus), default=MilestoneStatus.PENDING, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="milestones")
    
    __table_args__ = (
        Index('idx_milestone_project', 'project_id'),
        Index('idx_research_milestone_status', 'status'),
        Index('idx_milestone_deadline', 'deadline'),
    )


class LiteratureReference(Base):
    __tablename__ = "literature_references"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    authors = Column(String(1000), nullable=True)
    publication_year = Column(Integer, nullable=True)
    source = Column(String(500), nullable=True)
    doi = Column(String(200), nullable=True)
    url = Column(String(1000), nullable=True)
    citation_format = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="literature_references")
    
    __table_args__ = (
        Index('idx_literature_project', 'project_id'),
    )


class ResearchDocument(Base):
    __tablename__ = "research_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=True)
    file_url = Column(String(1000), nullable=True)
    file_type = Column(String(50), nullable=True)
    visibility = Column(SQLEnum(DocumentVisibility), default=DocumentVisibility.TEAM, nullable=False)
    created_by_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="documents")
    created_by = relationship("Student")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_document_project', 'project_id'),
        Index('idx_document_creator', 'created_by_student_id'),
        Index('idx_document_visibility', 'visibility'),
    )


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey('research_documents.id', ondelete='CASCADE'), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)
    file_url = Column(String(1000), nullable=True)
    changes_summary = Column(Text, nullable=True)
    created_by_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    document = relationship("ResearchDocument", back_populates="versions")
    created_by = relationship("Student")
    
    __table_args__ = (
        UniqueConstraint('document_id', 'version_number', name='uq_document_version'),
        Index('idx_version_document', 'document_id'),
        Index('idx_version_creator', 'created_by_student_id'),
    )


class ExperimentLog(Base):
    __tablename__ = "experiment_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    experiment_title = Column(String(300), nullable=False)
    experiment_date = Column(DateTime, nullable=False)
    procedure = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    results = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    recorded_by_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="experiment_logs")
    recorded_by = relationship("Student")
    
    __table_args__ = (
        Index('idx_experiment_project', 'project_id'),
        Index('idx_experiment_recorder', 'recorded_by_student_id'),
        Index('idx_experiment_date', 'experiment_date'),
    )


class ResearchDataFile(Base):
    __tablename__ = "research_data_files"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = Column(String(300), nullable=False)
    file_url = Column(String(1000), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    uploaded_by_student_id = Column(Integer, ForeignKey('students.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="data_files")
    uploaded_by = relationship("Student")
    
    __table_args__ = (
        Index('idx_data_file_project', 'project_id'),
        Index('idx_data_file_uploader', 'uploaded_by_student_id'),
    )


class AdvisorFeedback(Base):
    __tablename__ = "advisor_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False, index=True)
    feedback_text = Column(Text, nullable=False)
    feedback_type = Column(String(100), nullable=True)
    status = Column(SQLEnum(FeedbackStatus), default=FeedbackStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="advisor_feedback")
    teacher = relationship("Teacher")
    
    __table_args__ = (
        Index('idx_feedback_project', 'project_id'),
        Index('idx_feedback_teacher', 'teacher_id'),
        Index('idx_feedback_status', 'status'),
    )


class PeerReview(Base):
    __tablename__ = "peer_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('research_projects.id', ondelete='CASCADE'), nullable=False, index=True)
    reviewer_student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    review_text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)
    decision = Column(SQLEnum(ReviewDecision), default=ReviewDecision.PENDING, nullable=False, index=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    project = relationship("ResearchProject", back_populates="peer_reviews")
    reviewer = relationship("Student")
    
    __table_args__ = (
        Index('idx_peer_review_project', 'project_id'),
        Index('idx_peer_review_reviewer', 'reviewer_student_id'),
        Index('idx_peer_review_decision', 'decision'),
    )
