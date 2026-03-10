from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from src.models.analytics import (
    AnalyticsCache,
    StudentPerformanceMetrics,
    ClassPerformanceMetrics,
    InstitutionPerformanceMetrics,
    GeneratedReport,
    ReportType,
    ReportStatus,
)


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_cache(self, cache_key: str) -> Optional[AnalyticsCache]:
        return (
            self.db.query(AnalyticsCache)
            .filter(
                AnalyticsCache.cache_key == cache_key,
                AnalyticsCache.expires_at > datetime.utcnow(),
            )
            .first()
        )

    def set_cache(
        self,
        institution_id: int,
        cache_key: str,
        cache_type: str,
        data: str,
        expires_at: datetime,
        metadata: Optional[str] = None,
    ) -> AnalyticsCache:
        existing = self.db.query(AnalyticsCache).filter(
            AnalyticsCache.cache_key == cache_key
        ).first()

        if existing:
            existing.data = data
            existing.metadata = metadata
            existing.expires_at = expires_at
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing

        cache = AnalyticsCache(
            institution_id=institution_id,
            cache_key=cache_key,
            cache_type=cache_type,
            data=data,
            metadata=metadata,
            expires_at=expires_at,
        )
        self.db.add(cache)
        self.db.commit()
        self.db.refresh(cache)
        return cache

    def clean_expired_cache(self) -> int:
        deleted = (
            self.db.query(AnalyticsCache)
            .filter(AnalyticsCache.expires_at <= datetime.utcnow())
            .delete()
        )
        self.db.commit()
        return deleted

    def save_student_metrics(
        self, metrics: StudentPerformanceMetrics
    ) -> StudentPerformanceMetrics:
        existing = (
            self.db.query(StudentPerformanceMetrics)
            .filter(
                StudentPerformanceMetrics.student_id == metrics.student_id,
                StudentPerformanceMetrics.period_start == metrics.period_start,
                StudentPerformanceMetrics.period_end == metrics.period_end,
            )
            .first()
        )

        if existing:
            for key, value in metrics.__dict__.items():
                if key not in ["_sa_instance_state", "id", "created_at"]:
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing

        self.db.add(metrics)
        self.db.commit()
        self.db.refresh(metrics)
        return metrics

    def get_student_metrics(
        self,
        institution_id: int,
        student_id: int,
        period_start: date,
        period_end: date,
    ) -> Optional[StudentPerformanceMetrics]:
        return (
            self.db.query(StudentPerformanceMetrics)
            .filter(
                StudentPerformanceMetrics.institution_id == institution_id,
                StudentPerformanceMetrics.student_id == student_id,
                StudentPerformanceMetrics.period_start == period_start,
                StudentPerformanceMetrics.period_end == period_end,
            )
            .first()
        )

    def save_class_metrics(
        self, metrics: ClassPerformanceMetrics
    ) -> ClassPerformanceMetrics:
        existing = (
            self.db.query(ClassPerformanceMetrics)
            .filter(
                ClassPerformanceMetrics.section_id == metrics.section_id,
                ClassPerformanceMetrics.period_start == metrics.period_start,
                ClassPerformanceMetrics.period_end == metrics.period_end,
            )
            .first()
        )

        if existing:
            for key, value in metrics.__dict__.items():
                if key not in ["_sa_instance_state", "id", "created_at"]:
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing

        self.db.add(metrics)
        self.db.commit()
        self.db.refresh(metrics)
        return metrics

    def get_class_metrics(
        self,
        institution_id: int,
        section_id: int,
        period_start: date,
        period_end: date,
    ) -> Optional[ClassPerformanceMetrics]:
        return (
            self.db.query(ClassPerformanceMetrics)
            .filter(
                ClassPerformanceMetrics.institution_id == institution_id,
                ClassPerformanceMetrics.section_id == section_id,
                ClassPerformanceMetrics.period_start == period_start,
                ClassPerformanceMetrics.period_end == period_end,
            )
            .first()
        )

    def save_institution_metrics(
        self, metrics: InstitutionPerformanceMetrics
    ) -> InstitutionPerformanceMetrics:
        existing = (
            self.db.query(InstitutionPerformanceMetrics)
            .filter(
                InstitutionPerformanceMetrics.institution_id == metrics.institution_id,
                InstitutionPerformanceMetrics.period_start == metrics.period_start,
                InstitutionPerformanceMetrics.period_end == metrics.period_end,
            )
            .first()
        )

        if existing:
            for key, value in metrics.__dict__.items():
                if key not in ["_sa_instance_state", "id", "created_at"]:
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing

        self.db.add(metrics)
        self.db.commit()
        self.db.refresh(metrics)
        return metrics

    def get_institution_metrics(
        self,
        institution_id: int,
        period_start: date,
        period_end: date,
    ) -> Optional[InstitutionPerformanceMetrics]:
        return (
            self.db.query(InstitutionPerformanceMetrics)
            .filter(
                InstitutionPerformanceMetrics.institution_id == institution_id,
                InstitutionPerformanceMetrics.period_start == period_start,
                InstitutionPerformanceMetrics.period_end == period_end,
            )
            .first()
        )

    def create_report(
        self,
        institution_id: int,
        report_type: ReportType,
        report_title: str,
        generated_by_id: int,
        report_description: Optional[str] = None,
        parameters: Optional[str] = None,
    ) -> GeneratedReport:
        report = GeneratedReport(
            institution_id=institution_id,
            report_type=report_type,
            report_title=report_title,
            report_description=report_description,
            generated_by_id=generated_by_id,
            parameters=parameters,
            status=ReportStatus.PENDING,
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def update_report_status(
        self,
        report_id: int,
        status: ReportStatus,
        file_path: Optional[str] = None,
        file_url: Optional[str] = None,
        file_size: Optional[int] = None,
        error_message: Optional[str] = None,
    ) -> Optional[GeneratedReport]:
        report = self.db.query(GeneratedReport).filter(
            GeneratedReport.id == report_id
        ).first()

        if not report:
            return None

        report.status = status
        if file_path:
            report.file_path = file_path
        if file_url:
            report.file_url = file_url
        if file_size:
            report.file_size = file_size
        if error_message:
            report.error_message = error_message

        if status == ReportStatus.PROCESSING:
            report.started_at = datetime.utcnow()
        elif status in [ReportStatus.COMPLETED, ReportStatus.FAILED]:
            report.completed_at = datetime.utcnow()

        report.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_report(
        self, institution_id: int, report_id: int
    ) -> Optional[GeneratedReport]:
        return (
            self.db.query(GeneratedReport)
            .filter(
                GeneratedReport.id == report_id,
                GeneratedReport.institution_id == institution_id,
            )
            .first()
        )

    def list_reports(
        self,
        institution_id: int,
        report_type: Optional[ReportType] = None,
        status: Optional[ReportStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[GeneratedReport]:
        query = self.db.query(GeneratedReport).filter(
            GeneratedReport.institution_id == institution_id
        )

        if report_type:
            query = query.filter(GeneratedReport.report_type == report_type)
        if status:
            query = query.filter(GeneratedReport.status == status)

        return (
            query.order_by(GeneratedReport.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def delete_report(self, institution_id: int, report_id: int) -> bool:
        report = (
            self.db.query(GeneratedReport)
            .filter(
                GeneratedReport.id == report_id,
                GeneratedReport.institution_id == institution_id,
            )
            .first()
        )

        if not report:
            return False

        self.db.delete(report)
        self.db.commit()
        return True
