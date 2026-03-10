from datetime import datetime, date, timedelta
from typing import List, Optional
from celery import Task
from sqlalchemy.orm import Session

from src.celery_app import celery_app
from src.database import SessionLocal
from src.models.student import Student
from src.models.academic import Section, AcademicYear
from src.models.analytics import (
    StudentPerformanceMetrics,
    ClassPerformanceMetrics,
    InstitutionPerformanceMetrics,
)
from src.repositories.analytics_repository import AnalyticsRepository
from src.services.analytics_service import AnalyticsService
from src.schemas.analytics import AnalyticsQueryParams, DateRangeType


class AnalyticsTask(Task):
    _db: Optional[Session] = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs) -> None:
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=AnalyticsTask, bind=True, name="analytics.aggregate_student_metrics")
def aggregate_student_metrics_task(
    self,
    institution_id: int,
    student_ids: Optional[List[int]] = None,
    period_days: int = 30,
) -> dict:
    """Aggregate performance metrics for students."""
    db = self.db
    repo = AnalyticsRepository(db)
    service = AnalyticsService(db)

    end_date = date.today()
    start_date = end_date - timedelta(days=period_days)

    params = AnalyticsQueryParams(
        date_range_type=DateRangeType.CUSTOM,
        start_date=start_date,
        end_date=end_date,
    )

    if not student_ids:
        students = db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.is_active == True,
        ).all()
        student_ids = [s.id for s in students]

    processed = 0
    failed = 0

    for student_id in student_ids:
        try:
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student or not student.section_id:
                continue

            section = db.query(Section).filter(Section.id == student.section_id).first()
            if not section:
                continue

            academic_year = (
                db.query(AcademicYear)
                .filter(
                    AcademicYear.institution_id == institution_id,
                    AcademicYear.is_current == True,
                )
                .first()
            )

            if not academic_year:
                continue

            exam_metrics = service._calculate_student_exam_metrics(
                student_id, institution_id, start_date, end_date
            )
            attendance_metrics = service._calculate_student_attendance_metrics(
                student_id, institution_id, start_date, end_date
            )
            assignment_metrics = service._calculate_student_assignment_metrics(
                student_id, institution_id, start_date, end_date
            )
            gamification_metrics = service._calculate_student_gamification_metrics(
                student_id, institution_id
            )

            metrics = StudentPerformanceMetrics(
                institution_id=institution_id,
                student_id=student_id,
                academic_year_id=academic_year.id,
                grade_id=section.grade_id,
                period_start=start_date,
                period_end=end_date,
                **exam_metrics,
                **attendance_metrics,
                **assignment_metrics,
                **gamification_metrics,
            )

            repo.save_student_metrics(metrics)
            processed += 1

        except Exception as e:
            failed += 1
            print(f"Error processing student {student_id}: {str(e)}")

    return {"processed": processed, "failed": failed}


@celery_app.task(base=AnalyticsTask, bind=True, name="analytics.aggregate_class_metrics")
def aggregate_class_metrics_task(
    self,
    institution_id: int,
    section_ids: Optional[List[int]] = None,
    period_days: int = 30,
) -> dict:
    """Aggregate performance metrics for classes/sections."""
    db = self.db
    repo = AnalyticsRepository(db)
    service = AnalyticsService(db)

    end_date = date.today()
    start_date = end_date - timedelta(days=period_days)

    if not section_ids:
        sections = db.query(Section).filter(
            Section.institution_id == institution_id,
            Section.is_active == True,
        ).all()
        section_ids = [s.id for s in sections]

    processed = 0
    failed = 0

    academic_year = (
        db.query(AcademicYear)
        .filter(
            AcademicYear.institution_id == institution_id,
            AcademicYear.is_current == True,
        )
        .first()
    )

    if not academic_year:
        return {"processed": 0, "failed": 0, "error": "No current academic year"}

    for section_id in section_ids:
        try:
            section = db.query(Section).filter(Section.id == section_id).first()
            if not section:
                continue

            students = db.query(Student).filter(
                Student.section_id == section_id,
                Student.institution_id == institution_id,
            ).all()

            student_ids = [s.id for s in students]

            exam_metrics = service._calculate_class_exam_metrics(
                student_ids, institution_id, start_date, end_date
            )
            attendance_metrics = service._calculate_class_attendance_metrics(
                student_ids, institution_id, start_date, end_date
            )
            assignment_metrics = service._calculate_class_assignment_metrics(
                student_ids, institution_id, start_date, end_date
            )

            metrics = ClassPerformanceMetrics(
                institution_id=institution_id,
                section_id=section_id,
                academic_year_id=academic_year.id,
                period_start=start_date,
                period_end=end_date,
                total_students=len(students),
                active_students=sum(1 for s in students if s.is_active),
                **exam_metrics,
                **attendance_metrics,
                **assignment_metrics,
            )

            repo.save_class_metrics(metrics)
            processed += 1

        except Exception as e:
            failed += 1
            print(f"Error processing section {section_id}: {str(e)}")

    return {"processed": processed, "failed": failed}


@celery_app.task(base=AnalyticsTask, bind=True, name="analytics.aggregate_institution_metrics")
def aggregate_institution_metrics_task(
    self, institution_id: int, period_days: int = 30
) -> dict:
    """Aggregate performance metrics for the entire institution."""
    db = self.db
    repo = AnalyticsRepository(db)
    service = AnalyticsService(db)

    end_date = date.today()
    start_date = end_date - timedelta(days=period_days)

    academic_year = (
        db.query(AcademicYear)
        .filter(
            AcademicYear.institution_id == institution_id,
            AcademicYear.is_current == True,
        )
        .first()
    )

    if not academic_year:
        return {"processed": 0, "error": "No current academic year"}

    try:
        students = db.query(Student).filter(
            Student.institution_id == institution_id
        ).all()
        student_ids = [s.id for s in students]

        sections = db.query(Section).filter(
            Section.institution_id == institution_id,
            Section.is_active == True,
        ).all()

        exam_metrics = service._calculate_institution_exam_metrics(
            student_ids, institution_id, start_date, end_date
        )
        attendance_metrics = service._calculate_institution_attendance_metrics(
            student_ids, institution_id, start_date, end_date
        )
        assignment_metrics = service._calculate_institution_assignment_metrics(
            institution_id, start_date, end_date
        )

        metrics = InstitutionPerformanceMetrics(
            institution_id=institution_id,
            academic_year_id=academic_year.id,
            period_start=start_date,
            period_end=end_date,
            total_students=len(students),
            active_students=sum(1 for s in students if s.is_active),
            total_teachers=0,
            total_classes=len(sections),
            **exam_metrics,
            **attendance_metrics,
            **assignment_metrics,
        )

        repo.save_institution_metrics(metrics)
        return {"processed": 1, "failed": 0}

    except Exception as e:
        return {"processed": 0, "failed": 1, "error": str(e)}


@celery_app.task(base=AnalyticsTask, bind=True, name="analytics.clean_expired_cache")
def clean_expired_cache_task(self) -> dict:
    """Clean expired analytics cache entries."""
    db = self.db
    repo = AnalyticsRepository(db)

    try:
        deleted = repo.clean_expired_cache()
        return {"deleted": deleted}
    except Exception as e:
        return {"deleted": 0, "error": str(e)}


@celery_app.task(base=AnalyticsTask, bind=True, name="analytics.daily_aggregation")
def daily_aggregation_task(self, institution_ids: Optional[List[int]] = None) -> dict:
    """Run daily aggregation for all institutions."""
    db = self.db

    if not institution_ids:
        from src.models.institution import Institution
        institutions = db.query(Institution).filter(
            Institution.is_active == True
        ).all()
        institution_ids = [i.id for i in institutions]

    results = []
    for institution_id in institution_ids:
        try:
            aggregate_student_metrics_task.delay(institution_id, period_days=30)
            aggregate_class_metrics_task.delay(institution_id, period_days=30)
            aggregate_institution_metrics_task.delay(institution_id, period_days=30)
            results.append({"institution_id": institution_id, "status": "scheduled"})
        except Exception as e:
            results.append({"institution_id": institution_id, "status": "failed", "error": str(e)})

    return {"results": results}
