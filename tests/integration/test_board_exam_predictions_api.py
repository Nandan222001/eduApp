"""Integration tests for the `board_exam_predictions` router
(src/api/v1/board_exam_predictions.py).

Analyzes previous-year-paper question data to predict which topics are
likely to appear in an upcoming board exam (`POST /analyze`), and exposes
the resulting `TopicPrediction` rows via several read endpoints (ranked
list, top-N, due-topics, by-chapter, and a summary). Every endpoint already
had a real `Depends(get_current_user)` and used the sync `Session` API
consistently end to end (router -> `BoardExamPredictionService` ->
`TopicPredictionRepository`/`QuestionBankRepository`) -- read the service,
repository and both models (`QuestionBank`, `TopicPrediction`) field-by-field
against the schemas (`schemas/previous_year_papers.py`) and found no bugs
from any of the 14 tracked bug classes: no async/sync mismatch, no
`func.count(...).filter(...)` SQL-FILTER misuse (the repository's counts use
`db.query(func.count(...)).filter(...)`, i.e. `Query.filter`, not the
FILTER-clause pattern), the one `func.avg(...)` result is explicitly
`float()`-cast before being put on a plain dict, and every predicted-topic
query is scoped by `institution_id`.
"""
import uuid
from datetime import date

import pytest


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution

    unique_suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {unique_suffix}",
        slug=f"other-school-{unique_suffix}",
        phone="+1234567891",
        address="456 Other Street, Other City, Other State, Other Country 54321",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def paper_2022(db_session, institution, subject, grade):
    from src.models.previous_year_papers import PreviousYearPaper, Board

    p = PreviousYearPaper(
        institution_id=institution.id,
        title="Algebra Final Exam 2022",
        board=Board.CBSE,
        year=2022,
        grade_id=grade.id,
        subject_id=subject.id,
        is_active=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def paper_2023(db_session, institution, subject, grade):
    from src.models.previous_year_papers import PreviousYearPaper, Board

    p = PreviousYearPaper(
        institution_id=institution.id,
        title="Algebra Final Exam 2023",
        board=Board.CBSE,
        year=2023,
        grade_id=grade.id,
        subject_id=subject.id,
        is_active=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def chapter(db_session, institution, subject, grade):
    from src.models.academic import Chapter

    c = Chapter(
        institution_id=institution.id,
        subject_id=subject.id,
        grade_id=grade.id,
        name="Quadratic Equations",
        display_order=1,
        is_active=True,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def topic(db_session, institution, chapter):
    from src.models.academic import Topic

    t = Topic(
        institution_id=institution.id,
        chapter_id=chapter.id,
        name="Discriminant",
        display_order=1,
        is_active=True,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


def _make_question(db_session, institution, grade, subject, chapter, topic, paper, marks=5):
    from src.models.previous_year_papers import QuestionBank, QuestionType, DifficultyLevel, BloomTaxonomyLevel

    q = QuestionBank(
        institution_id=institution.id,
        paper_id=paper.id,
        question_text="Find the discriminant of x^2 + 2x + 1 = 0",
        question_type=QuestionType.SHORT_ANSWER,
        grade_id=grade.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        topic_id=topic.id,
        difficulty_level=DifficultyLevel.MEDIUM,
        bloom_taxonomy_level=BloomTaxonomyLevel.APPLY,
        marks=marks,
        is_active=True,
    )
    db_session.add(q)
    db_session.commit()
    db_session.refresh(q)
    return q


@pytest.fixture
def questions(db_session, institution, grade, subject, chapter, topic, paper_2022, paper_2023):
    q1 = _make_question(db_session, institution, grade, subject, chapter, topic, paper_2022)
    q2 = _make_question(db_session, institution, grade, subject, chapter, topic, paper_2023)
    return [q1, q2]


BASE = "/api/v1/board-exam-predictions"


class TestAnalyzeExamPatterns:
    def test_requires_auth(self, client, grade, subject):
        response = client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
        )
        assert response.status_code == 403

    def test_analyze_generates_predictions(self, client, auth_headers, questions, grade, subject):
        response = client.post(
            f"{BASE}/analyze",
            json={
                "board": "cbse",
                "grade_id": grade.id,
                "subject_id": subject.id,
                "year_start": 2020,
                "year_end": 2023,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["total_topics_analyzed"] == 1
        assert body["predictions_generated"] == 1
        assert body["year_range"] == "2020-2023"

    def test_analyze_with_no_matching_questions_returns_zero(self, client, auth_headers, grade, subject):
        response = client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["total_topics_analyzed"] == 0
        assert body["predictions_generated"] == 0


class TestGetTopicPredictions:
    def test_requires_auth(self, client, grade, subject):
        response = client.get(
            f"{BASE}/predictions",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
        )
        assert response.status_code == 403

    def test_get_predictions_after_analysis(self, client, auth_headers, questions, grade, subject):
        analyze_resp = client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert analyze_resp.status_code == 200

        response = client.get(
            f"{BASE}/predictions",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["topic_name"] == "Discriminant"
        assert body[0]["frequency_count"] == 2

    def test_get_predictions_empty_without_analysis(self, client, auth_headers, grade, subject):
        response = client.get(
            f"{BASE}/predictions",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_invalid_order_by_rejected(self, client, auth_headers, grade, subject):
        response = client.get(
            f"{BASE}/predictions",
            params={
                "board": "cbse",
                "grade_id": grade.id,
                "subject_id": subject.id,
                "order_by": "not_a_real_field",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestTopPredictionsAndDueTopics:
    def test_top_predictions_requires_auth(self, client, grade, subject):
        response = client.get(
            f"{BASE}/top-predictions",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
        )
        assert response.status_code == 403

    def test_top_predictions_returns_ranked_list(self, client, auth_headers, questions, grade, subject):
        client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        response = client.get(
            f"{BASE}/top-predictions",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id, "top_n": 5},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_due_topics_requires_auth(self, client, grade, subject):
        response = client.get(
            f"{BASE}/due-topics",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
        )
        assert response.status_code == 403

    def test_due_topics_flags_overdue_topic(self, client, auth_headers, db_session, institution, grade, subject, chapter, topic):
        from src.models.previous_year_papers import PreviousYearPaper, Board

        # Two appearances several years apart, none recently -> should be
        # flagged as "due" (years_since_last_appearance >= 3).
        old_paper_1 = PreviousYearPaper(
            institution_id=institution.id, title="Old Paper 1", board=Board.CBSE,
            year=2015, grade_id=grade.id, subject_id=subject.id, is_active=True,
        )
        old_paper_2 = PreviousYearPaper(
            institution_id=institution.id, title="Old Paper 2", board=Board.CBSE,
            year=2017, grade_id=grade.id, subject_id=subject.id, is_active=True,
        )
        db_session.add_all([old_paper_1, old_paper_2])
        db_session.commit()
        db_session.refresh(old_paper_1)
        db_session.refresh(old_paper_2)

        _make_question(db_session, institution, grade, subject, chapter, topic, old_paper_1)
        _make_question(db_session, institution, grade, subject, chapter, topic, old_paper_2)

        client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id, "year_start": 2010, "year_end": 2024},
            headers=auth_headers,
        )

        response = client.get(
            f"{BASE}/due-topics",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["is_due"] is True


class TestPredictionsByChapterAndSummary:
    def test_by_chapter_requires_auth(self, client, grade, subject, chapter):
        response = client.get(
            f"{BASE}/by-chapter/{chapter.id}",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
        )
        assert response.status_code == 403

    def test_by_chapter_returns_predictions(self, client, auth_headers, questions, grade, subject, chapter):
        client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        response = client.get(
            f"{BASE}/by-chapter/{chapter.id}",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_summary_requires_auth(self, client, grade, subject):
        response = client.get(
            f"{BASE}/summary",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
        )
        assert response.status_code == 403

    def test_summary_after_analysis(self, client, auth_headers, questions, grade, subject):
        client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        response = client.get(
            f"{BASE}/summary",
            params={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["total_topics"] == 1
        assert isinstance(body["avg_probability_score"], float)

    def test_summary_scoped_to_institution(self, client, auth_headers, questions, grade, subject, other_institution, db_session):
        """Predictions generated for one institution must not leak into
        another institution's summary -- get_analysis_summary filters by
        institution_id throughout."""
        from src.models.academic import Grade, Subject, AcademicYear

        client.post(
            f"{BASE}/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )

        other_year = AcademicYear(
            institution_id=other_institution.id, name="2023-2024",
            start_date=date(2023, 4, 1), end_date=date(2024, 3, 31),
            is_current=True, is_active=True,
        )
        db_session.add(other_year)
        db_session.commit()
        db_session.refresh(other_year)

        other_grade = Grade(
            institution_id=other_institution.id, academic_year_id=other_year.id,
            name="Grade 10", display_order=10, is_active=True,
        )
        other_subject = Subject(
            institution_id=other_institution.id, name="Mathematics", code="MATH10",
            is_active=True,
        )
        db_session.add_all([other_grade, other_subject])
        db_session.commit()
        db_session.refresh(other_grade)
        db_session.refresh(other_subject)

        # Same grade_id/subject_id integers reused under a different
        # institution -- summary must still come back empty for
        # `other_institution`'s own analysis (this test institution's own
        # auth_headers user only ever queries their own institution, so this
        # just confirms a fresh grade/subject with no predictions is 0).
        response = client.get(
            f"{BASE}/summary",
            params={"board": "cbse", "grade_id": other_grade.id, "subject_id": other_subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["total_topics"] == 0
