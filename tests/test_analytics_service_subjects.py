import pytest
from datetime import date, timedelta
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.academic import AcademicYear, Grade, Subject
from src.models.student import Student
from src.models.examination import Exam, ExamSubject, ExamMarks, ExamType, ExamStatus
from src.services.analytics_service import AnalyticsService


@pytest.mark.asyncio
class TestIdentifyStrengthWeakSubjects:
    """AnalyticsService._identify_strength_subjects/_identify_weak_subjects
    (~line 1082-1183) previously built an ambiguous SQLAlchemy join:
    `.join(ExamSubject).join(Subject).join(Exam)` with no explicit ON
    conditions, which raised `InvalidRequestError: Can't determine which
    FROM clause to join from` on every real call (flagged in
    TESTING_PROGRESS.md pass fourteen, fixed this pass with explicit
    join conditions). This is service-level, not router-level, coverage
    since get_student_performance_comparison (the only caller) isn't
    wired to any API endpoint yet."""

    async def test_identifies_strength_and_weak_subjects(
        self, db_session: Session, institution: Institution, academic_year: AcademicYear, grade: Grade, student: Student
    ):
        service = AnalyticsService(db_session)

        strong_subject = Subject(institution_id=institution.id, name="Physics", code="PHY10", is_active=True)
        weak_subject = Subject(institution_id=institution.id, name="Chemistry", code="CHEM10", is_active=True)
        db_session.add_all([strong_subject, weak_subject])
        db_session.commit()
        db_session.refresh(strong_subject)
        db_session.refresh(weak_subject)

        exam = Exam(
            institution_id=institution.id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Midterm",
            exam_type=ExamType.MID_TERM,
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() - timedelta(days=5),
            status=ExamStatus.COMPLETED,
        )
        db_session.add(exam)
        db_session.commit()
        db_session.refresh(exam)

        strong_exam_subject = ExamSubject(
            institution_id=institution.id,
            exam_id=exam.id,
            subject_id=strong_subject.id,
            theory_max_marks=100,
            practical_max_marks=0,
        )
        weak_exam_subject = ExamSubject(
            institution_id=institution.id,
            exam_id=exam.id,
            subject_id=weak_subject.id,
            theory_max_marks=100,
            practical_max_marks=0,
        )
        db_session.add_all([strong_exam_subject, weak_exam_subject])
        db_session.commit()
        db_session.refresh(strong_exam_subject)
        db_session.refresh(weak_exam_subject)

        db_session.add_all([
            ExamMarks(
                institution_id=institution.id,
                exam_subject_id=strong_exam_subject.id,
                student_id=student.id,
                theory_marks_obtained=95,
            ),
            ExamMarks(
                institution_id=institution.id,
                exam_subject_id=weak_exam_subject.id,
                student_id=student.id,
                theory_marks_obtained=30,
            ),
        ])
        db_session.commit()

        start_date = date.today() - timedelta(days=30)
        end_date = date.today()

        strengths = await service._identify_strength_subjects(student.id, institution.id, start_date, end_date)
        weaknesses = await service._identify_weak_subjects(student.id, institution.id, start_date, end_date)

        assert strengths[0] == "Physics"
        assert weaknesses[0] == "Chemistry"
