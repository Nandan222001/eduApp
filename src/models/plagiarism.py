from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, Float, JSON, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from src.database import Base


class PlagiarismCheckStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ComparisonScope(str, PyEnum):
    WITHIN_BATCH = "within_batch"
    CROSS_BATCH = "cross_batch"
    CROSS_INSTITUTION = "cross_institution"
    ALL = "all"


class ContentType(str, PyEnum):
    TEXT = "text"
    SOURCE_CODE = "source_code"
    MIXED = "mixed"


class ReviewDecision(str, PyEnum):
    CONFIRMED_PLAGIARISM = "confirmed_plagiarism"
    FALSE_POSITIVE = "false_positive"
    LEGITIMATE_CITATION = "legitimate_citation"
    NEEDS_INVESTIGATION = "needs_investigation"
    DISMISSED = "dismissed"


class PlagiarismCheck(Base):
    __tablename__ = "plagiarism_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey('assignments.id', ondelete='CASCADE'), nullable=False, index=True)
    submission_id = Column(Integer, ForeignKey('submissions.id', ondelete='CASCADE'), nullable=True, index=True)
    
    content_type = Column(Enum(ContentType), default=ContentType.TEXT, nullable=False)
    comparison_scope = Column(Enum(ComparisonScope), default=ComparisonScope.WITHIN_BATCH, nullable=False)
    
    enable_cross_institution = Column(Boolean, default=False, nullable=False)
    anonymize_cross_institution = Column(Boolean, default=True, nullable=False)
    
    status = Column(Enum(PlagiarismCheckStatus), default=PlagiarismCheckStatus.PENDING, nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    
    total_comparisons = Column(Integer, default=0, nullable=False)
    matches_found = Column(Integer, default=0, nullable=False)
    processing_time_seconds = Column(Float, nullable=True)
    
    check_settings = Column(JSON, nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="plagiarism_checks")
    assignment = relationship("Assignment", back_populates="plagiarism_checks")
    submission = relationship("Submission", back_populates="plagiarism_check", uselist=False)
    results = relationship("PlagiarismResult", back_populates="check", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_plagiarism_check_institution', 'institution_id'),
        Index('idx_plagiarism_check_assignment', 'assignment_id'),
        Index('idx_plagiarism_check_submission', 'submission_id'),
        Index('idx_plagiarism_check_status', 'status'),
    )


class PlagiarismResult(Base):
    __tablename__ = "plagiarism_results"
    
    id = Column(Integer, primary_key=True, index=True)
    check_id = Column(Integer, ForeignKey('plagiarism_checks.id', ondelete='CASCADE'), nullable=False, index=True)
    submission_id = Column(Integer, ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False, index=True)
    matched_submission_id = Column(Integer, ForeignKey('submissions.id', ondelete='CASCADE'), nullable=True, index=True)
    
    similarity_score = Column(Float, nullable=False, index=True)
    text_similarity = Column(Float, nullable=True)
    code_similarity = Column(Float, nullable=True)
    
    matched_segments_count = Column(Integer, default=0, nullable=False)
    matched_text_percentage = Column(Float, default=0.0, nullable=False)
    
    is_external_source = Column(Boolean, default=False, nullable=False)
    external_source_info = Column(JSON, nullable=True)
    
    is_cross_institution = Column(Boolean, default=False, nullable=False)
    anonymized_match_info = Column(JSON, nullable=True)
    
    has_citations = Column(Boolean, default=False, nullable=False)
    citation_info = Column(JSON, nullable=True)
    
    is_false_positive = Column(Boolean, default=False, nullable=False)
    false_positive_reason = Column(Text, nullable=True)
    
    review_status = Column(String(50), nullable=True, index=True)
    reviewed_by = Column(Integer, ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_decision = Column(Enum(ReviewDecision), nullable=True)
    review_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    check = relationship("PlagiarismCheck", back_populates="results")
    submission = relationship("Submission", foreign_keys=[submission_id], back_populates="plagiarism_results")
    matched_submission = relationship("Submission", foreign_keys=[matched_submission_id])
    reviewer = relationship("Teacher", foreign_keys=[reviewed_by])
    matched_segments = relationship("PlagiarismMatchSegment", back_populates="result", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_plagiarism_result_check', 'check_id'),
        Index('idx_plagiarism_result_submission', 'submission_id'),
        Index('idx_plagiarism_result_matched_submission', 'matched_submission_id'),
        Index('idx_plagiarism_result_similarity', 'similarity_score'),
        Index('idx_plagiarism_result_review_status', 'review_status'),
        Index('idx_plagiarism_result_reviewed_by', 'reviewed_by'),
    )


class PlagiarismMatchSegment(Base):
    __tablename__ = "plagiarism_match_segments"
    
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey('plagiarism_results.id', ondelete='CASCADE'), nullable=False, index=True)
    
    source_start = Column(Integer, nullable=False)
    source_end = Column(Integer, nullable=False)
    source_text = Column(Text, nullable=False)
    
    match_start = Column(Integer, nullable=False)
    match_end = Column(Integer, nullable=False)
    match_text = Column(Text, nullable=False)
    
    segment_similarity = Column(Float, nullable=False)
    segment_length = Column(Integer, nullable=False)
    
    is_code_segment = Column(Boolean, default=False, nullable=False)
    code_analysis = Column(JSON, nullable=True)
    
    is_citation = Column(Boolean, default=False, nullable=False)
    citation_context = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    result = relationship("PlagiarismResult", back_populates="matched_segments")
    
    __table_args__ = (
        Index('idx_match_segment_result', 'result_id'),
    )


class CodeASTFingerprint(Base):
    __tablename__ = "code_ast_fingerprints"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False, index=True)
    file_id = Column(Integer, ForeignKey('submission_files.id', ondelete='CASCADE'), nullable=True, index=True)
    
    language = Column(String(50), nullable=False)
    
    structure_hash = Column(String(64), nullable=False, index=True)
    variable_pattern_hash = Column(String(64), nullable=False)
    function_pattern_hash = Column(String(64), nullable=False)
    
    ast_features = Column(JSON, nullable=False)
    
    total_nodes = Column(Integer, nullable=False)
    total_functions = Column(Integer, nullable=False)
    total_variables = Column(Integer, nullable=False)
    complexity_score = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    submission = relationship("Submission", back_populates="code_fingerprints")
    
    __table_args__ = (
        Index('idx_ast_fingerprint_submission', 'submission_id'),
        Index('idx_ast_fingerprint_file', 'file_id'),
        Index('idx_ast_fingerprint_structure_hash', 'structure_hash'),
        Index('idx_ast_fingerprint_language', 'language'),
    )


class CitationPattern(Base):
    __tablename__ = "citation_patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    citation_type = Column(String(50), nullable=False)
    citation_text = Column(Text, nullable=False)
    
    start_position = Column(Integer, nullable=False)
    end_position = Column(Integer, nullable=False)
    
    reference_info = Column(JSON, nullable=True)
    
    is_valid = Column(Boolean, default=True, nullable=False)
    validation_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    submission = relationship("Submission", back_populates="citations")
    
    __table_args__ = (
        Index('idx_citation_pattern_submission', 'submission_id'),
        Index('idx_citation_pattern_type', 'citation_type'),
    )


class PlagiarismPrivacyConsent(Base):
    __tablename__ = "plagiarism_privacy_consents"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    
    allow_cross_institution_comparison = Column(Boolean, default=False, nullable=False)
    allow_anonymized_sharing = Column(Boolean, default=True, nullable=False)
    
    data_retention_days = Column(Integer, default=365, nullable=False)
    
    consent_given_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    consent_given_at = Column(DateTime, nullable=True)
    
    privacy_settings = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution", back_populates="plagiarism_privacy_consents")
    consent_giver = relationship("User")
    
    __table_args__ = (
        Index('idx_privacy_consent_institution', 'institution_id'),
        UniqueConstraint('institution_id', name='uq_institution_privacy_consent'),
    )
