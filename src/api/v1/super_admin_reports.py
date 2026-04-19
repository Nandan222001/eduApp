from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, text, cast, Integer, String, extract
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from decimal import Decimal
import json
import csv
import io
import hashlib
from enum import Enum

from src.database import get_db, get_db_with_context
from src.dependencies.auth import require_super_admin
from src.models.user import User
from src.models.institution import Institution
from src.models.subscription import Subscription, Payment, Invoice, UsageRecord
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.audit_log import AuditLog, ActivityLog, ImpersonationLog
from src.models.assignment import Assignment
from src.models.attendance import Attendance
from src.models.examination import Exam
from src.schemas.super_admin_reports import (
    ReportBuilderRequest,
    ReportBuilderResponse,
    ScheduledReportCreate,
    ScheduledReportUpdate,
    ScheduledReportResponse,
    ScheduledReportListResponse,
    DataExportRequest,
    DataExportResponse,
    AnonymizationConfig,
    ComplianceReportType,
    ComplianceReportRequest,
    ComplianceReportResponse,
    ExecutiveDashboardRequest,
    ExecutiveDashboardResponse,
    APIAccessLogFilters,
    APIAccessLogResponse,
    SecurityAuditReportRequest,
    SecurityAuditReportResponse,
    DataRetentionPolicyCreate,
    DataRetentionPolicyUpdate,
    DataRetentionPolicyResponse,
    DataRetentionPolicyListResponse,
    ArchivalJobCreate,
    ArchivalJobResponse,
    ArchivalJobListResponse,
)
from src.models.super_admin_reports import ScheduledReport, DataRetentionPolicy, ArchivalJob
from src.services.super_admin_report_service import (
    report_builder_service,
    scheduled_report_service,
    data_export_service,
    compliance_report_service,
    executive_dashboard_service,
    security_audit_service,
    data_retention_service,
)

router = APIRouter(prefix="/super-admin/reports", tags=["Super Admin Reports"])


# ==================== Report Builder ====================

@router.post("/builder/execute", response_model=ReportBuilderResponse)
async def execute_custom_report(
    report_request: ReportBuilderRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ReportBuilderResponse:
    """
    Execute a custom report with drag-drop field selection, filtering, and aggregation.
    Supports flexible query building with dynamic fields, filters, and grouping.
    """
    return report_builder_service.execute_report(db, report_request, current_user.id)


@router.post("/builder/validate")
async def validate_report_config(
    report_request: ReportBuilderRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Validate report configuration before execution."""
    validation_result = report_builder_service.validate_report_config(db, report_request)
    return validation_result


@router.get("/builder/available-fields")
async def get_available_report_fields(
    entity_type: str = Query(..., description="Entity type: users, institutions, subscriptions, etc."),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get available fields for report building based on entity type."""
    available_fields = report_builder_service.get_available_fields(entity_type)
    return {"entity_type": entity_type, "fields": available_fields}


@router.get("/builder/available-aggregations")
async def get_available_aggregations(
    current_user: User = Depends(require_super_admin),
):
    """Get available aggregation functions."""
    return {
        "aggregations": [
            {"name": "count", "description": "Count of records", "applies_to": ["all"]},
            {"name": "sum", "description": "Sum of numeric values", "applies_to": ["numeric"]},
            {"name": "avg", "description": "Average of numeric values", "applies_to": ["numeric"]},
            {"name": "min", "description": "Minimum value", "applies_to": ["numeric", "date"]},
            {"name": "max", "description": "Maximum value", "applies_to": ["numeric", "date"]},
            {"name": "distinct_count", "description": "Count of distinct values", "applies_to": ["all"]},
        ]
    }


# ==================== Scheduled Reports ====================

@router.post("/scheduled", response_model=ScheduledReportResponse, status_code=status.HTTP_201_CREATED)
async def create_scheduled_report(
    report_data: ScheduledReportCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ScheduledReportResponse:
    """
    Create a scheduled report with email delivery and S3 storage.
    Supports cron-like scheduling and automatic report generation.
    """
    report = scheduled_report_service.create_scheduled_report(
        db, report_data, current_user.id
    )
    
    # Schedule the report generation task
    background_tasks.add_task(
        scheduled_report_service.schedule_report_task,
        report.id
    )
    
    return ScheduledReportResponse.from_orm(report)


@router.get("/scheduled", response_model=ScheduledReportListResponse)
async def list_scheduled_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    report_type: Optional[str] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ScheduledReportListResponse:
    """List all scheduled reports with filtering."""
    return scheduled_report_service.list_scheduled_reports(
        db, page, page_size, is_active, report_type
    )


@router.get("/scheduled/{report_id}", response_model=ScheduledReportResponse)
async def get_scheduled_report(
    report_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ScheduledReportResponse:
    """Get details of a specific scheduled report."""
    report = scheduled_report_service.get_scheduled_report(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled report not found"
        )
    return ScheduledReportResponse.from_orm(report)


@router.put("/scheduled/{report_id}", response_model=ScheduledReportResponse)
async def update_scheduled_report(
    report_id: int,
    report_data: ScheduledReportUpdate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ScheduledReportResponse:
    """Update a scheduled report configuration."""
    report = scheduled_report_service.update_scheduled_report(
        db, report_id, report_data
    )
    return ScheduledReportResponse.from_orm(report)


@router.delete("/scheduled/{report_id}")
async def delete_scheduled_report(
    report_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Delete a scheduled report."""
    scheduled_report_service.delete_scheduled_report(db, report_id)
    return {"message": "Scheduled report deleted successfully"}


@router.post("/scheduled/{report_id}/execute")
async def execute_scheduled_report_now(
    report_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Execute a scheduled report immediately."""
    background_tasks.add_task(
        scheduled_report_service.execute_report_now,
        report_id,
        current_user.id
    )
    return {"message": "Report execution started", "report_id": report_id}


@router.get("/scheduled/{report_id}/executions")
async def get_report_execution_history(
    report_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get execution history for a scheduled report."""
    return scheduled_report_service.get_execution_history(
        db, report_id, page, page_size
    )


# ==================== Cross-Institution Data Export ====================

@router.post("/export/cross-institution", response_model=DataExportResponse)
async def export_cross_institution_data(
    export_request: DataExportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> DataExportResponse:
    """
    Export cross-institution data with anonymization options for research purposes.
    Supports multiple formats (CSV, JSON, Excel) and anonymization strategies.
    """
    export_job = data_export_service.create_export_job(
        db, export_request, current_user.id
    )
    
    # Start export in background
    background_tasks.add_task(
        data_export_service.process_export_job,
        export_job.id
    )
    
    return DataExportResponse(
        job_id=export_job.id,
        status="processing",
        message="Export job started",
        created_at=export_job.created_at
    )


@router.get("/export/{job_id}/status")
async def get_export_job_status(
    job_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get status of a data export job."""
    job_status = data_export_service.get_export_job_status(db, job_id)
    if not job_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found"
        )
    return job_status


@router.get("/export/{job_id}/download")
async def download_export_file(
    job_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Download the exported data file."""
    file_data = data_export_service.get_export_file(db, job_id)
    if not file_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export file not found or not ready"
        )
    
    return Response(
        content=file_data["content"],
        media_type=file_data["media_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{file_data["filename"]}"'
        }
    )


@router.get("/export/jobs")
async def list_export_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """List all data export jobs."""
    return data_export_service.list_export_jobs(db, page, page_size, status)


# ==================== Compliance Reports ====================

@router.post("/compliance/student-privacy-audit", response_model=ComplianceReportResponse)
async def generate_student_privacy_audit(
    request: ComplianceReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ComplianceReportResponse:
    """
    Generate student data privacy audit log report.
    Tracks all access, modifications, and deletions of student data for compliance.
    """
    report = compliance_report_service.generate_privacy_audit_report(
        db, request, current_user.id
    )
    return report


@router.post("/compliance/billing-history", response_model=ComplianceReportResponse)
async def generate_billing_compliance_report(
    request: ComplianceReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ComplianceReportResponse:
    """
    Generate subscription billing history report for tax purposes.
    Includes all invoices, payments, and tax calculations.
    """
    report = compliance_report_service.generate_billing_report(
        db, request, current_user.id
    )
    return report


@router.post("/compliance/usage-report", response_model=ComplianceReportResponse)
async def generate_usage_compliance_report(
    request: ComplianceReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ComplianceReportResponse:
    """
    Generate usage report for contract renewals.
    Shows platform usage metrics, active users, storage consumption, etc.
    """
    report = compliance_report_service.generate_usage_report(
        db, request, current_user.id
    )
    return report


@router.post("/compliance/gdpr-data-access")
async def generate_gdpr_data_access_report(
    user_id: int = Query(..., description="User ID for GDPR data access request"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """
    Generate comprehensive GDPR data access report for a specific user.
    Includes all personal data stored across the system.
    """
    report = compliance_report_service.generate_gdpr_report(db, user_id)
    return report


@router.get("/compliance/available-reports")
async def get_available_compliance_reports(
    current_user: User = Depends(require_super_admin),
):
    """Get list of available compliance report types."""
    return {
        "report_types": [
            {
                "type": "student_privacy_audit",
                "name": "Student Data Privacy Audit",
                "description": "Audit log of all student data access and modifications"
            },
            {
                "type": "billing_history",
                "name": "Billing History for Tax Compliance",
                "description": "Complete billing and payment history for tax purposes"
            },
            {
                "type": "usage_report",
                "name": "Platform Usage Report",
                "description": "Usage metrics for contract renewals and reporting"
            },
            {
                "type": "gdpr_data_access",
                "name": "GDPR Data Access Report",
                "description": "Complete personal data report for GDPR compliance"
            },
            {
                "type": "data_retention",
                "name": "Data Retention Compliance",
                "description": "Report on data retention policies and archived data"
            },
        ]
    }


# ==================== Executive Dashboard Templates ====================

@router.post("/executive-dashboard", response_model=ExecutiveDashboardResponse)
async def generate_executive_dashboard(
    request: ExecutiveDashboardRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ExecutiveDashboardResponse:
    """
    Generate executive dashboard template for board meetings.
    Includes KPIs, trends, financial metrics, and strategic insights.
    """
    dashboard = executive_dashboard_service.generate_dashboard(db, request)
    return dashboard


@router.get("/executive-dashboard/templates")
async def get_executive_dashboard_templates(
    current_user: User = Depends(require_super_admin),
):
    """Get available executive dashboard templates."""
    return {
        "templates": [
            {
                "id": "quarterly_board_meeting",
                "name": "Quarterly Board Meeting",
                "description": "Comprehensive quarterly performance overview",
                "metrics": ["revenue", "growth", "user_metrics", "churn", "engagement"]
            },
            {
                "id": "financial_overview",
                "name": "Financial Overview",
                "description": "Financial performance and projections",
                "metrics": ["mrr", "arr", "revenue_breakdown", "cost_analysis", "profitability"]
            },
            {
                "id": "platform_health",
                "name": "Platform Health Dashboard",
                "description": "Platform stability and performance metrics",
                "metrics": ["uptime", "error_rates", "response_times", "user_satisfaction"]
            },
            {
                "id": "growth_metrics",
                "name": "Growth Metrics",
                "description": "User growth and expansion metrics",
                "metrics": ["new_institutions", "user_growth", "market_expansion", "conversion_rates"]
            },
        ]
    }


@router.post("/executive-dashboard/export")
async def export_executive_dashboard(
    request: ExecutiveDashboardRequest,
    format: str = Query("pdf", regex="^(pdf|pptx|excel)$"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Export executive dashboard in various formats (PDF, PowerPoint, Excel)."""
    exported_file = executive_dashboard_service.export_dashboard(
        db, request, format
    )
    
    return Response(
        content=exported_file["content"],
        media_type=exported_file["media_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{exported_file["filename"]}"'
        }
    )


# ==================== API Access Logs & Security Audit ====================

@router.get("/security/api-access-logs", response_model=APIAccessLogResponse)
async def get_api_access_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    user_id: Optional[int] = Query(None),
    institution_id: Optional[int] = Query(None),
    endpoint: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    status_code: Optional[int] = Query(None),
    has_errors: Optional[bool] = Query(None),
    ip_address: Optional[str] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> APIAccessLogResponse:
    """
    Get API access logs for security monitoring.
    Tracks all API requests with detailed information.
    """
    filters = APIAccessLogFilters(
        start_date=start_date,
        end_date=end_date,
        user_id=user_id,
        institution_id=institution_id,
        endpoint=endpoint,
        method=method,
        status_code=status_code,
        has_errors=has_errors,
        ip_address=ip_address
    )
    
    return security_audit_service.get_api_access_logs(
        db, filters, page, page_size
    )


@router.post("/security/audit-report", response_model=SecurityAuditReportResponse)
async def generate_security_audit_report(
    request: SecurityAuditReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> SecurityAuditReportResponse:
    """
    Generate comprehensive security audit report.
    Includes failed login attempts, suspicious activities, data access patterns.
    """
    report = security_audit_service.generate_audit_report(
        db, request, current_user.id
    )
    return report


@router.get("/security/anomalies")
async def detect_security_anomalies(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Detect security anomalies and suspicious patterns."""
    anomalies = security_audit_service.detect_anomalies(db, days)
    return {"anomalies": anomalies, "period_days": days}


@router.get("/security/failed-logins")
async def get_failed_login_attempts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    hours: int = Query(24, ge=1, le=720),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get recent failed login attempts for security monitoring."""
    failed_logins = security_audit_service.get_failed_login_attempts(
        db, hours, page, page_size
    )
    return failed_logins


@router.get("/security/data-access-patterns")
async def analyze_data_access_patterns(
    entity_type: str = Query(..., description="Entity type to analyze: students, users, institutions"),
    days: int = Query(30, ge=1, le=90),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Analyze data access patterns for compliance and security."""
    patterns = security_audit_service.analyze_access_patterns(
        db, entity_type, days
    )
    return patterns


# ==================== Data Retention Policy Management ====================

@router.post("/data-retention/policies", response_model=DataRetentionPolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_data_retention_policy(
    policy_data: DataRetentionPolicyCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> DataRetentionPolicyResponse:
    """
    Create a data retention policy for automated archival and deletion.
    Defines rules for data lifecycle management.
    """
    policy = data_retention_service.create_policy(db, policy_data, current_user.id)
    return DataRetentionPolicyResponse.from_orm(policy)


@router.get("/data-retention/policies", response_model=DataRetentionPolicyListResponse)
async def list_data_retention_policies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    entity_type: Optional[str] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> DataRetentionPolicyListResponse:
    """List all data retention policies."""
    return data_retention_service.list_policies(
        db, page, page_size, is_active, entity_type
    )


@router.get("/data-retention/policies/{policy_id}", response_model=DataRetentionPolicyResponse)
async def get_data_retention_policy(
    policy_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> DataRetentionPolicyResponse:
    """Get details of a specific data retention policy."""
    policy = data_retention_service.get_policy(db, policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data retention policy not found"
        )
    return DataRetentionPolicyResponse.from_orm(policy)


@router.put("/data-retention/policies/{policy_id}", response_model=DataRetentionPolicyResponse)
async def update_data_retention_policy(
    policy_id: int,
    policy_data: DataRetentionPolicyUpdate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> DataRetentionPolicyResponse:
    """Update a data retention policy."""
    policy = data_retention_service.update_policy(db, policy_id, policy_data)
    return DataRetentionPolicyResponse.from_orm(policy)


@router.delete("/data-retention/policies/{policy_id}")
async def delete_data_retention_policy(
    policy_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Delete a data retention policy."""
    data_retention_service.delete_policy(db, policy_id)
    return {"message": "Data retention policy deleted successfully"}


@router.post("/data-retention/policies/{policy_id}/execute")
async def execute_retention_policy(
    policy_id: int,
    background_tasks: BackgroundTasks,
    dry_run: bool = Query(False, description="Preview actions without executing"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Execute a data retention policy (archive/delete old data)."""
    if dry_run:
        preview = data_retention_service.preview_policy_execution(db, policy_id)
        return {
            "dry_run": True,
            "preview": preview,
            "message": "This is a preview. Set dry_run=false to execute."
        }
    
    background_tasks.add_task(
        data_retention_service.execute_policy,
        policy_id,
        current_user.id
    )
    
    return {
        "message": "Data retention policy execution started",
        "policy_id": policy_id
    }


# ==================== Archival Jobs ====================

@router.post("/archival/jobs", response_model=ArchivalJobResponse, status_code=status.HTTP_201_CREATED)
async def create_archival_job(
    job_data: ArchivalJobCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ArchivalJobResponse:
    """
    Create and execute a data archival job.
    Archives old data to cold storage (S3) for compliance and cost optimization.
    """
    job = data_retention_service.create_archival_job(
        db, job_data, current_user.id
    )
    
    # Start archival in background
    background_tasks.add_task(
        data_retention_service.process_archival_job,
        job.id
    )
    
    return ArchivalJobResponse.from_orm(job)


@router.get("/archival/jobs", response_model=ArchivalJobListResponse)
async def list_archival_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ArchivalJobListResponse:
    """List all archival jobs."""
    return data_retention_service.list_archival_jobs(
        db, page, page_size, status, entity_type
    )


@router.get("/archival/jobs/{job_id}", response_model=ArchivalJobResponse)
async def get_archival_job(
    job_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> ArchivalJobResponse:
    """Get details of a specific archival job."""
    job = data_retention_service.get_archival_job(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archival job not found"
        )
    return ArchivalJobResponse.from_orm(job)


@router.post("/archival/jobs/{job_id}/restore")
async def restore_archived_data(
    job_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Restore archived data from cold storage."""
    background_tasks.add_task(
        data_retention_service.restore_archived_data,
        job_id,
        current_user.id
    )
    
    return {
        "message": "Data restoration started",
        "job_id": job_id
    }


@router.get("/archival/storage-stats")
async def get_archival_storage_stats(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Get archival storage statistics and cost estimates."""
    stats = data_retention_service.get_storage_stats(db)
    return stats


@router.post("/archival/cleanup-old-data")
async def cleanup_old_data(
    background_tasks: BackgroundTasks,
    entity_type: str = Query(..., description="Entity type to cleanup"),
    days_old: int = Query(..., ge=30, description="Delete data older than X days"),
    dry_run: bool = Query(True, description="Preview without deleting"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete old data based on retention policies."""
    if dry_run:
        preview = data_retention_service.preview_cleanup(
            db, entity_type, days_old
        )
        return {
            "dry_run": True,
            "preview": preview,
            "warning": "This data will be permanently deleted. Set dry_run=false to confirm."
        }
    
    background_tasks.add_task(
        data_retention_service.cleanup_old_data,
        entity_type,
        days_old,
        current_user.id
    )
    
    return {
        "message": "Data cleanup started",
        "entity_type": entity_type,
        "days_old": days_old
    }
