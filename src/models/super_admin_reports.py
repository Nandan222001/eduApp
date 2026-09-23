from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Index, JSON, Text
)
from sqlalchemy.orm import relationship
from src.database import Base


class ExecutionStatus(str, PyEnum):
    """Status of a report/retention-execution run."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobStatus(str, PyEnum):
    """Status of a data export / archival job."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ComplianceReportType(str, PyEnum):
    """Types of compliance reports (mirrors schemas.super_admin_reports.ComplianceReportType)."""
    STUDENT_PRIVACY_AUDIT = "student_privacy_audit"
    BILLING_HISTORY = "billing_history"
    USAGE_REPORT = "usage_report"
    GDPR_DATA_ACCESS = "gdpr_data_access"
    DATA_RETENTION = "data_retention"


class DataRetentionAction(str, PyEnum):
    """Actions for data retention (mirrors schemas.super_admin_reports.DataRetentionAction)."""
    ARCHIVE = "archive"
    DELETE = "delete"
    ANONYMIZE = "anonymize"


class ScheduledReport(Base):
    """A recurring report definition with email/S3 delivery (platform-wide, super-admin owned)."""
    __tablename__ = "scheduled_reports"

    id = Column(Integer, primary_key=True, index=True)

    report_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    report_config = Column(JSON, nullable=False)
    schedule = Column(JSON, nullable=False)
    email_recipients = Column(JSON, nullable=False)

    store_in_s3 = Column(Boolean, default=True, nullable=False)
    s3_bucket = Column(String(255), nullable=True)
    s3_prefix = Column(String(255), default="reports/", nullable=True)
    retention_days = Column(Integer, default=90, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True, index=True)
    last_status = Column(String(20), nullable=True)
    last_error = Column(Text, nullable=True)
    execution_count = Column(Integer, default=0, nullable=False)

    created_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])
    executions = relationship("ReportExecution", back_populates="scheduled_report", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_scheduled_report_active_next_run', 'is_active', 'next_run_at'),
    )


class ReportExecution(Base):
    """A single run (past or in-progress) of a ScheduledReport."""
    __tablename__ = "report_executions"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_report_id = Column(Integer, ForeignKey('scheduled_reports.id', ondelete='CASCADE'), nullable=False, index=True)

    status = Column(String(20), default=ExecutionStatus.PENDING.value, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    row_count = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    s3_key = Column(String(500), nullable=True)
    download_url = Column(String(1000), nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    scheduled_report = relationship("ScheduledReport", back_populates="executions")

    __table_args__ = (
        Index('idx_report_execution_report_started', 'scheduled_report_id', 'started_at'),
    )


class DataExportJob(Base):
    """A cross-institution data export job with optional anonymization."""
    __tablename__ = "data_export_jobs"

    id = Column(Integer, primary_key=True, index=True)

    export_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    entity_types = Column(JSON, nullable=False)
    institution_ids = Column(JSON, nullable=True)
    date_from = Column(DateTime, nullable=True)
    date_to = Column(DateTime, nullable=True)
    fields_config = Column(JSON, nullable=True)
    anonymization_config = Column(JSON, nullable=True)
    output_format = Column(String(20), default="csv", nullable=False)
    compression = Column(Boolean, default=True, nullable=False)
    purpose = Column(Text, nullable=False)

    status = Column(String(20), default=JobStatus.PENDING.value, nullable=False, index=True)
    row_count = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    s3_key = Column(String(500), nullable=True)
    download_url = Column(String(1000), nullable=True)
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    created_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])

    __table_args__ = (
        Index('idx_data_export_job_status_created', 'status', 'created_at'),
    )


class ComplianceReport(Base):
    """A generated compliance report (privacy audit, billing history, usage, GDPR, retention)."""
    __tablename__ = "compliance_reports"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String(100), unique=True, nullable=False, index=True)
    report_type = Column(String(50), nullable=False, index=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    institution_ids = Column(JSON, nullable=True)
    filters = Column(JSON, nullable=True)
    summary = Column(JSON, nullable=True)
    output_format = Column(String(20), default="pdf", nullable=False)
    download_url = Column(String(1000), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)

    generated_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    generated_by = relationship("User", foreign_keys=[generated_by_id])

    __table_args__ = (
        Index('idx_compliance_report_type_period', 'report_type', 'period_start'),
    )


class SecurityAuditReport(Base):
    """A generated security audit report."""
    __tablename__ = "security_audit_reports"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String(100), unique=True, nullable=False, index=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    institution_ids = Column(JSON, nullable=True)

    failed_login_count = Column(Integer, default=0, nullable=False)
    suspicious_activity_count = Column(Integer, default=0, nullable=False)
    data_access_count = Column(Integer, default=0, nullable=False)
    impersonation_count = Column(Integer, default=0, nullable=False)
    anomalies = Column(JSON, nullable=True)
    summary = Column(JSON, nullable=True)
    download_url = Column(String(1000), nullable=True)

    generated_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    generated_by = relationship("User", foreign_keys=[generated_by_id])

    __table_args__ = (
        Index('idx_security_audit_report_period', 'period_start', 'period_end'),
    )


class DataRetentionPolicy(Base):
    """A policy defining automated archival/deletion/anonymization of aged data."""
    __tablename__ = "data_retention_policies"

    id = Column(Integer, primary_key=True, index=True)

    policy_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    entity_type = Column(String(100), nullable=False, index=True)
    retention_days = Column(Integer, nullable=False)
    action = Column(String(20), nullable=False)
    filters = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    auto_execute = Column(Boolean, default=False, nullable=False)
    execution_schedule = Column(String(255), nullable=True)

    last_executed_at = Column(DateTime, nullable=True)
    next_execution_at = Column(DateTime, nullable=True, index=True)
    last_execution_status = Column(String(20), nullable=True)
    last_error = Column(Text, nullable=True)
    records_processed = Column(Integer, default=0, nullable=False)

    created_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])
    executions = relationship("DataRetentionExecution", back_populates="policy", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_data_retention_policy_active_entity', 'is_active', 'entity_type'),
    )


class DataRetentionExecution(Base):
    """A single run (past or in-progress) of a DataRetentionPolicy."""
    __tablename__ = "data_retention_executions"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey('data_retention_policies.id', ondelete='CASCADE'), nullable=False, index=True)

    status = Column(String(20), default=ExecutionStatus.PENDING.value, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    records_archived = Column(Integer, default=0, nullable=False)
    records_deleted = Column(Integer, default=0, nullable=False)
    records_processed = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    policy = relationship("DataRetentionPolicy", back_populates="executions")

    __table_args__ = (
        Index('idx_data_retention_execution_policy_started', 'policy_id', 'started_at'),
    )


class ArchivalJob(Base):
    """A job that archives old data to cold storage (S3) for compliance/cost optimization."""
    __tablename__ = "archival_jobs"

    id = Column(Integer, primary_key=True, index=True)

    job_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    entity_type = Column(String(100), nullable=False, index=True)
    date_from = Column(DateTime, nullable=True)
    date_to = Column(DateTime, nullable=False)
    filters = Column(JSON, nullable=True)

    s3_bucket = Column(String(255), nullable=True)
    s3_prefix = Column(String(255), default="archive/", nullable=True)
    s3_key = Column(String(500), nullable=True)
    compression = Column(Boolean, default=True, nullable=False)
    delete_after_archive = Column(Boolean, default=False, nullable=False)

    status = Column(String(20), default=JobStatus.PENDING.value, nullable=False, index=True)
    records_archived = Column(Integer, default=0, nullable=False)
    records_deleted = Column(Integer, default=0, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    __table_args__ = (
        Index('idx_archival_job_status_entity', 'status', 'entity_type'),
    )


class ReportBuilderSavedQuery(Base):
    """A saved custom-report-builder query configuration for reuse."""
    __tablename__ = "report_builder_saved_queries"

    id = Column(Integer, primary_key=True, index=True)

    query_name = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=False, index=True)
    selected_fields = Column(JSON, nullable=False)
    filters = Column(JSON, nullable=True)
    group_by = Column(JSON, nullable=True)
    sort_by = Column(JSON, nullable=True)
    output_format = Column(String(20), default="json", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])


class ExecutiveDashboard(Base):
    """A generated/saved executive dashboard (board-meeting templates, KPIs, trends)."""
    __tablename__ = "executive_dashboards"

    id = Column(Integer, primary_key=True, index=True)

    template_id = Column(String(100), nullable=False, index=True)
    template_name = Column(String(255), nullable=True)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    metrics = Column(JSON, nullable=True)
    summary = Column(JSON, nullable=True)

    generated_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    generated_by = relationship("User", foreign_keys=[generated_by_id])
