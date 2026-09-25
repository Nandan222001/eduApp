"""Integration tests for the `weakness_detection` router
(src/api/v1/weakness_detection.py).

Chapter-performance analysis, spaced-repetition question recommendations,
prioritized focus areas, personalized insights, and the full comprehensive
analysis pipeline that ties them together.

Real bug found and fixed while writing this coverage:

1. **`PUT /question-recommendations/{id}` let an unhandled `ValueError`
   escape for an unknown (or cross-institution) recommendation id** --
   `SmartQuestionRecommender.update_spaced_repetition` raises a plain
   `ValueError` in that case, which reached Starlette's default handler as
   an unhandled 500 instead of a clean 404 (same shape as this session's
   `ml_monitoring.py`/`question_nlp.py` insufficient-data
   `ValueError`-miscategorization bugs). Fixed by catching it in the
   endpoint and raising `HTTPException(404)`.

Every endpoint already had a real `Depends(get_current_user)` and scoped
every query through `current_user.institution_id` (never a client-supplied
institution id), so no auth or cross-tenant gap was found here.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest

from src.models.academic import Chapter
from src.models.examination import Exam, ExamSubject, ExamMarks, ExamType, ExamStatus
from src.models.previous_year_papers import (
    QuestionBank, QuestionType, DifficultyLevel, BloomTaxonomyLevel
)
from src.models.study_planner import (
    WeakArea, ChapterPerformance, QuestionRecommendation, FocusArea, PersonalizedInsight
)


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def chapter(db_session, institution, subject, grade) -> Chapter:
    ch = Chapter(
        institution_id=institution.id,
        subject_id=subject.id,
        grade_id=grade.id,
        name="Algebra Basics",
        code="ALG1",
        display_order=1,
        is_active=True,
    )
    db_session.add(ch)
    db_session.commit()
    db_session.refresh(ch)
    return ch


@pytest.fixture
def exam(db_session, institution, academic_year, grade) -> Exam:
    e = Exam(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        grade_id=grade.id,
        name="Term 1",
        exam_type=list(ExamType)[0],
        start_date=date.today() - timedelta(days=10),
        end_date=date.today() - timedelta(days=9),
        status=list(ExamStatus)[0],
    )
    db_session.add(e)
    db_session.commit()
    db_session.refresh(e)
    return e


@pytest.fixture
def exam_subject(db_session, institution, exam, subject) -> ExamSubject:
    es = ExamSubject(
        institution_id=institution.id,
        exam_id=exam.id,
        subject_id=subject.id,
        theory_max_marks=Decimal("80.00"),
        practical_max_marks=Decimal("20.00"),
    )
    db_session.add(es)
    db_session.commit()
    db_session.refresh(es)
    return es


@pytest.fixture
def exam_marks(db_session, institution, exam_subject, student) -> ExamMarks:
    """A weak (40%) result for `student` in `exam_subject`'s subject --
    `analyze_chapter_performance` attributes it to every chapter of that
    subject, including the `chapter` fixture."""
    m = ExamMarks(
        institution_id=institution.id,
        exam_subject_id=exam_subject.id,
        student_id=student.id,
        theory_marks_obtained=Decimal("30.00"),
        practical_marks_obtained=Decimal("10.00"),
        is_absent=False,
    )
    db_session.add(m)
    db_session.commit()
    db_session.refresh(m)
    return m


@pytest.fixture
def weak_area(db_session, institution, student, subject, chapter) -> WeakArea:
    wa = WeakArea(
        institution_id=institution.id,
        student_id=student.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        weakness_score=Decimal("75.0"),
        average_score=Decimal("45.0"),
        attempts_count=3,
        is_resolved=False,
    )
    db_session.add(wa)
    db_session.commit()
    db_session.refresh(wa)
    return wa


@pytest.fixture
def chapter_performance(db_session, institution, student, subject, chapter) -> ChapterPerformance:
    cp = ChapterPerformance(
        institution_id=institution.id,
        student_id=student.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        average_score=Decimal("45.00"),
        total_attempts=3,
        successful_attempts=1,
        failed_attempts=2,
        success_rate=Decimal("33.33"),
        proficiency_level="developing",
        trend="declining",
        improvement_rate=Decimal("-5.00"),
        mastery_score=Decimal("35.00"),
    )
    db_session.add(cp)
    db_session.commit()
    db_session.refresh(cp)
    return cp


@pytest.fixture
def question_bank_entry(db_session, institution, subject, chapter, grade) -> QuestionBank:
    q = QuestionBank(
        institution_id=institution.id,
        question_text="What is 2+2?",
        question_type=QuestionType.NUMERICAL,
        grade_id=grade.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        difficulty_level=DifficultyLevel.MEDIUM,
        bloom_taxonomy_level=BloomTaxonomyLevel.APPLY,
        marks=1.0,
        is_active=True,
    )
    db_session.add(q)
    db_session.commit()
    db_session.refresh(q)
    return q


@pytest.fixture
def question_recommendation(db_session, institution, student, question_bank_entry) -> QuestionRecommendation:
    rec = QuestionRecommendation(
        institution_id=institution.id,
        student_id=student.id,
        question_id=question_bank_entry.id,
        recommendation_score=Decimal("80.0"),
        relevance_score=Decimal("80.0"),
        difficulty_match_score=Decimal("70.0"),
        weakness_alignment_score=Decimal("75.0"),
        spaced_repetition_score=Decimal("100.0"),
        next_review_date=date.today(),
        is_completed=False,
    )
    db_session.add(rec)
    db_session.commit()
    db_session.refresh(rec)
    return rec


@pytest.fixture
def focus_area(db_session, institution, student, subject, chapter) -> FocusArea:
    fa = FocusArea(
        institution_id=institution.id,
        student_id=student.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        focus_type="critical",
        urgency_score=Decimal("90.0"),
        importance_score=Decimal("85.0"),
        impact_score=Decimal("80.0"),
        combined_priority=Decimal("85.0"),
        recommended_hours=Decimal("5.0"),
        status="active",
    )
    db_session.add(fa)
    db_session.commit()
    db_session.refresh(fa)
    return fa


@pytest.fixture
def personalized_insight(db_session, institution, student) -> PersonalizedInsight:
    insight = PersonalizedInsight(
        institution_id=institution.id,
        student_id=student.id,
        insight_type="low_mastery_alert",
        category="performance",
        title="Low Mastery Alert",
        description="You have low mastery in some chapters.",
        severity="high",
        priority=1,
        is_actionable=True,
        is_acknowledged=False,
        is_resolved=False,
        ai_generated=False,
    )
    db_session.add(insight)
    db_session.commit()
    db_session.refresh(insight)
    return insight


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestAuthRequired:
    def test_analyze_requires_auth(self, client, student):
        response = client.post(
            "/api/v1/weakness-detection/analyze", json={"student_id": student.id}
        )
        assert response.status_code in (401, 403)

    def test_chapter_performance_requires_auth(self, client, student):
        response = client.get(
            f"/api/v1/weakness-detection/chapter-performance/{student.id}"
        )
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Chapter performance
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestChapterPerformance:
    def test_get_chapter_performance(self, client, auth_headers, student, chapter, exam_marks):
        # `get_chapter_performance` recomputes from live exam marks (it
        # does not just read back whatever is already in the
        # `chapter_performance` table), so a real `ExamMarks` row is needed
        # to see any results here.
        response = client.get(
            f"/api/v1/weakness-detection/chapter-performance/{student.id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert any(cp["chapter_id"] == chapter.id for cp in data)
        matching = next(cp for cp in data if cp["chapter_id"] == chapter.id)
        assert matching["average_score"] == "40.00"

    def test_get_weak_chapters(self, client, auth_headers, student, chapter_performance):
        response = client.get(
            f"/api/v1/weakness-detection/weak-chapters/{student.id}",
            headers=auth_headers,
            params={"mastery_threshold": 60.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(cp["id"] == chapter_performance.id for cp in data)

    def test_get_weak_chapters_excludes_above_threshold(
        self, client, auth_headers, student, chapter_performance
    ):
        response = client.get(
            f"/api/v1/weakness-detection/weak-chapters/{student.id}",
            headers=auth_headers,
            params={"mastery_threshold": 10.0},
        )
        assert response.status_code == 200
        assert response.json() == []


# ---------------------------------------------------------------------------
# Question recommendations
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestQuestionRecommendations:
    def test_list_recommendations(self, client, auth_headers, student, question_recommendation):
        response = client.get(
            "/api/v1/weakness-detection/question-recommendations",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(r["id"] == question_recommendation.id for r in data)

    def test_list_recommendations_excludes_completed_by_default(
        self, db_session, client, auth_headers, student, question_recommendation
    ):
        question_recommendation.is_completed = True
        db_session.commit()

        response = client.get(
            "/api/v1/weakness-detection/question-recommendations",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_list_recommendations_due_only(
        self, db_session, client, auth_headers, student, question_recommendation
    ):
        question_recommendation.next_review_date = date.today() + timedelta(days=5)
        db_session.commit()

        response = client.get(
            "/api/v1/weakness-detection/question-recommendations",
            headers=auth_headers,
            params={"student_id": student.id, "due_only": True},
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_update_recommendation(self, client, auth_headers, question_recommendation):
        response = client.put(
            f"/api/v1/weakness-detection/question-recommendations/{question_recommendation.id}",
            headers=auth_headers,
            json={"performance_score": 95},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["repetition_number"] == 1
        assert data["interval_days"] == 1

    def test_update_unknown_recommendation_returns_404_not_500(self, client, auth_headers):
        """Regression test: previously an unhandled ValueError -> 500."""
        response = client.put(
            "/api/v1/weakness-detection/question-recommendations/999999",
            headers=auth_headers,
            json={"performance_score": 50},
        )
        assert response.status_code == 404

    def test_update_recommendation_cross_institution_404(
        self, db_session, client, auth_headers, other_institution_recommendation
    ):
        response = client.put(
            f"/api/v1/weakness-detection/question-recommendations/{other_institution_recommendation.id}",
            headers=auth_headers,
            json={"performance_score": 50},
        )
        assert response.status_code == 404


@pytest.fixture
def other_institution_recommendation(db_session):
    import uuid
    from src.models.institution import Institution
    from src.models.student import Student
    from src.models.academic import AcademicYear, Grade, Subject

    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        phone="+1987654321",
        address="456 Other Street, Other City, Other State, Other Country",
        is_active=True,
    )
    db_session.add(inst)
    db_session.flush()

    other_student = Student(institution_id=inst.id, first_name="Rival", last_name="Student")
    db_session.add(other_student)

    other_subject = Subject(
        institution_id=inst.id, name="Other Subject", code=f"OS{suffix[:6]}", is_active=True
    )
    db_session.add(other_subject)
    db_session.flush()

    q = QuestionBank(
        institution_id=inst.id,
        question_text="Foreign question",
        question_type=QuestionType.NUMERICAL,
        grade_id=_ensure_grade(db_session, inst.id),
        subject_id=other_subject.id,
        difficulty_level=DifficultyLevel.MEDIUM,
        bloom_taxonomy_level=BloomTaxonomyLevel.APPLY,
        is_active=True,
    )
    db_session.add(q)
    db_session.flush()

    rec = QuestionRecommendation(
        institution_id=inst.id,
        student_id=other_student.id,
        question_id=q.id,
        recommendation_score=Decimal("50.0"),
        relevance_score=Decimal("50.0"),
        difficulty_match_score=Decimal("50.0"),
        weakness_alignment_score=Decimal("50.0"),
        spaced_repetition_score=Decimal("50.0"),
    )
    db_session.add(rec)
    db_session.commit()
    db_session.refresh(rec)
    return rec


def _ensure_grade(db_session, institution_id):
    from src.models.academic import AcademicYear, Grade
    year = AcademicYear(
        institution_id=institution_id,
        name="2023-2024",
        start_date=date(2023, 4, 1),
        end_date=date(2024, 3, 31),
        is_current=True,
        is_active=True,
    )
    db_session.add(year)
    db_session.flush()
    grade = Grade(
        institution_id=institution_id,
        academic_year_id=year.id,
        name="Grade 10",
        display_order=10,
        is_active=True,
    )
    db_session.add(grade)
    db_session.flush()
    return grade.id


# ---------------------------------------------------------------------------
# Focus areas
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestFocusAreas:
    def test_list_focus_areas(self, client, auth_headers, student, focus_area):
        response = client.get(
            "/api/v1/weakness-detection/focus-areas",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(f["id"] == focus_area.id for f in data)

    def test_list_focus_areas_filtered_by_status(self, client, auth_headers, student, focus_area):
        response = client.get(
            "/api/v1/weakness-detection/focus-areas",
            headers=auth_headers,
            params={"student_id": student.id, "status": "completed"},
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_update_focus_area(self, client, auth_headers, focus_area):
        response = client.put(
            f"/api/v1/weakness-detection/focus-areas/{focus_area.id}",
            headers=auth_headers,
            json={"status": "completed"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"

    def test_update_focus_area_not_found(self, client, auth_headers):
        response = client.put(
            "/api/v1/weakness-detection/focus-areas/999999",
            headers=auth_headers,
            json={"status": "completed"},
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Personalized insights
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestPersonalizedInsights:
    def test_list_insights(self, client, auth_headers, student, personalized_insight):
        response = client.get(
            "/api/v1/weakness-detection/personalized-insights",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(i["id"] == personalized_insight.id for i in data)

    def test_update_insight(self, client, auth_headers, personalized_insight):
        response = client.put(
            f"/api/v1/weakness-detection/personalized-insights/{personalized_insight.id}",
            headers=auth_headers,
            json={"is_acknowledged": True},
        )
        assert response.status_code == 200
        assert response.json()["is_acknowledged"] is True

    def test_update_insight_not_found(self, client, auth_headers):
        response = client.put(
            "/api/v1/weakness-detection/personalized-insights/999999",
            headers=auth_headers,
            json={"is_acknowledged": True},
        )
        assert response.status_code == 404

    def test_insights_summary(self, db_session, client, auth_headers, student, personalized_insight):
        second = PersonalizedInsight(
            institution_id=personalized_insight.institution_id,
            student_id=student.id,
            insight_type="declining_performance",
            category="trend",
            title="Declining",
            description="desc",
            severity="medium",
            priority=5,
            is_actionable=True,
            is_acknowledged=True,
            is_resolved=False,
        )
        db_session.add(second)
        db_session.commit()

        response = client.get(
            f"/api/v1/weakness-detection/insights/summary/{student.id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_insights"] == 2
        assert data["high"] == 1
        assert data["medium"] == 1
        assert data["acknowledged"] == 1
        assert data["unacknowledged"] == 1
        assert data["categories"]["performance"] == 1
        assert data["categories"]["trend"] == 1


# ---------------------------------------------------------------------------
# Comprehensive analysis
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestComprehensiveAnalysis:
    def test_run_analysis_smoke(
        self, client, auth_headers, student, weak_area, question_bank_entry
    ):
        """Exercises the full pipeline (chapter analysis, focus-area
        prioritization, question recommendation, insight generation) with a
        seeded weak area and a matching question-bank entry, and confirms it
        returns 200 with a well-formed response instead of crashing."""
        response = client.post(
            "/api/v1/weakness-detection/analyze",
            headers=auth_headers,
            json={"student_id": student.id, "generate_recommendations": True},
        )
        assert response.status_code == 200, response.text
        data = response.json()

        assert data["summary"]["weak_areas_count"] == 1
        assert data["summary"]["focus_areas_count"] == 1
        assert len(data["focus_areas"]) == 1
        # No `target_exam_date` was given, so urgency stays at its 50.0
        # baseline (never crosses the 80 threshold needed for "critical");
        # combined with the weak area's importance boost this lands on
        # "high_priority", which is the correct outcome for this input.
        assert data["focus_areas"][0]["focus_type"] == "high_priority"
        assert len(data["question_recommendations"]) >= 1
        assert len(data["personalized_insights"]) >= 1
        assert len(data["weak_areas"]) == 1
        assert data["weak_areas"][0]["id"] == weak_area.id

    def test_run_analysis_without_recommendations(self, client, auth_headers, student, weak_area):
        response = client.post(
            "/api/v1/weakness-detection/analyze",
            headers=auth_headers,
            json={"student_id": student.id, "generate_recommendations": False},
        )
        assert response.status_code == 200, response.text
        assert response.json()["question_recommendations"] == []
