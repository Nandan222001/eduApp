"""Integration tests for the `recommendations` router (src/api/v1/recommendations.py).

Covers the "intelligent recommendation" feature: comprehensive/topic-scoped
study material recommendations blending learning-style detection (VARK),
difficulty-level detection, peer collaborative filtering, content
effectiveness scoring, study-path sequencing, and canned "external content"
lookups (Khan Academy/YouTube EDU/OpenStax/Coursera/MIT OCW -- these are
hardcoded template responses in ExternalContentLibraryIntegrator, not real
network calls, so nothing needs mocking there).

No Celery `.delay()` calls and no direct Redis usage anywhere in this router
or its service (src/services/recommendation_service.py) -- everything is
synchronous ORM queries plus in-process scoring -- so there is nothing to
skip on that front.

Bugs found and fixed while writing these tests (see src/api/v1/recommendations.py
and src/services/recommendation_service.py for the inline comments):

1. `StudyPathSequencer.generate_study_path` (and its `_calculate_chapter_priority`
   helper) read/ordered by `Chapter.sequence_number` / `Topic.sequence_number`,
   columns that do not exist on either model (only `display_order` does) --
   every call to GET /study-path/{student_id}/{subject_id} (and the
   study_paths section of the comprehensive/filtered endpoints, whenever a
   student has any unresolved weak area) raised AttributeError. Fixed by
   using `display_order` throughout.
2. `IntelligentRecommendationService.generate_comprehensive_recommendations`
   passed the raw `{'visual': ..., 'auditory': ...}` dict from
   `detect_learning_style()` straight through as `learning_style_profile`,
   but `ComprehensiveRecommendationResponse.learning_style_profile` is a
   `LearningStyleProfile` schema requiring `visual_score`/`auditory_score`/
   `reading_writing_score`/`kinesthetic_score`/`dominant_style` -- none of
   which existed in the raw dict, so response validation failed 100% of the
   time. Fixed by remapping to the schema's field names (matching the logic
   the sibling GET /learning-style/{id} endpoint already used correctly).
3. `_merge_all_recommendations` built each recommended-material entry as
   `{'material_id', 'material': <StudyMaterial ORM instance>, 'score',
   'reasons', 'sources'}` with no `title`/`material_type` keys at all, but
   `MaterialRecommendation` requires both (no defaults) -- so
   GET /comprehensive/{id} always 500'd on response validation whenever any
   material was recommended, and the raw ORM object embedded under
   'material' also isn't JSON-serializable via FastAPI's jsonable_encoder
   (relevant for POST /filtered, whose response_model is a bare `dict` and
   so isn't validated/stripped the same way). Fixed by extracting
   title/material_type from the ORM object and never returning the object
   itself. `get_recommendations_for_topic`'s `internal_materials` list had
   the identical raw-ORM-under-'material' problem (affecting POST /topic
   and POST /filtered with a topic_id) -- fixed the same way.
4. Cross-tenant authorization gaps: `Student` lookups in
   GET /comprehensive/{id}, GET /learning-style/{id}, GET /difficulty-level/{id},
   GET /similar-students/{id}, GET /study-path/{id}/{subject_id}, and
   GET /peer-success-materials/{id} filtered only by `Student.id`, with no
   `institution_id` check -- any authenticated user of any institution could
   read another institution's student data by guessing/incrementing the id.
   Same gap for the `Topic` lookup in GET /external-content/{topic_id}, the
   `Topic` lookup inside `get_recommendations_for_topic` (POST /topic,
   POST /filtered), and the `Chapter` query inside `generate_study_path`
   (a cross-institution `subject_id` returned that institution's chapters).
   Fixed by adding `institution_id`-scoping filters matching the pattern
   already used correctly by GET /material-effectiveness/{id}.
5. `get_recommendations_for_topic` returned `{'error': 'Topic not found'}`
   as a 200 response body instead of a 404, for both POST /topic and
   POST /filtered -- inconsistent with every other endpoint in this router
   (and with GET /external-content/{id}, GET /material-effectiveness/{id},
   etc., which all raise a proper 404). Fixed both router call sites to
   check for the error and raise HTTPException(404).
6. Minor: `_merge_all_recommendations`'s peer-material fallback query
   (`db.query(StudyMaterial).filter(StudyMaterial.id == material_id)`) had
   no `institution_id` filter, so a colliding id from another institution
   could leak that institution's material title/type into a
   recommendation. Fixed by scoping it to the caller's institution_id.
"""
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.student import Student
from src.models.academic import Chapter, Topic
from src.models.study_material import StudyMaterial, MaterialAccessLog, MaterialType
from src.models.study_planner import WeakArea, ChapterPerformance
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local role/user fixtures: some endpoints (`POST /topic`, `POST /filtered`)
# look up the *caller's own* Student profile via `current_user.id`, so we
# need to authenticate as a student, not the standard admin `auth_headers`.
# tests/conftest.py already provides `student_user` + `student` (linked to
# each other); we just add the login-headers fixture on top, following the
# exact pattern this task describes.
# ---------------------------------------------------------------------------
@pytest.fixture
def student_headers(client: TestClient, student_user: User, student: Student) -> dict:
    """`student` (not just `student_user`) is a required dependency here --
    `/topic` and `/filtered` look up the caller's Student row by user_id, so
    without forcing that fixture to actually run, tests using only
    `student_headers` would 404 with "Student profile not found"."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_institution_student(db_session: Session) -> Student:
    """A Student belonging to a completely different institution, for
    cross-tenant 404 checks against the admin/student in the primary
    `institution` fixture."""
    suffix = uuid.uuid4().hex[:10]
    other_institution = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        is_active=True,
    )
    db_session.add(other_institution)
    db_session.commit()
    db_session.refresh(other_institution)

    role = Role(
        name="Other Student Role",
        slug=f"other-student-{suffix}",
        is_system_role=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    user = User(
        username=f"other_student_{suffix}",
        email=f"other_student_{suffix}@otherschool.com",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=role.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    other_student = Student(
        institution_id=other_institution.id,
        user_id=user.id,
        first_name="Other",
        last_name="Student",
        admission_number=f"OTH-{suffix}",
        is_active=True,
    )
    db_session.add(other_student)
    db_session.commit()
    db_session.refresh(other_student)
    return other_student


@pytest.fixture
def chapter(db_session: Session, institution: Institution, subject, grade) -> Chapter:
    chapter = Chapter(
        institution_id=institution.id,
        subject_id=subject.id,
        grade_id=grade.id,
        name="Algebra Basics",
        code=f"CH-{uuid.uuid4().hex[:6]}",
        display_order=1,
        is_active=True,
    )
    db_session.add(chapter)
    db_session.commit()
    db_session.refresh(chapter)
    return chapter


@pytest.fixture
def topic(db_session: Session, institution: Institution, chapter: Chapter) -> Topic:
    topic = Topic(
        institution_id=institution.id,
        chapter_id=chapter.id,
        name="Linear Equations",
        code=f"TP-{uuid.uuid4().hex[:6]}",
        display_order=1,
        is_active=True,
    )
    db_session.add(topic)
    db_session.commit()
    db_session.refresh(topic)
    return topic


@pytest.fixture
def study_material(db_session: Session, institution: Institution, subject, chapter: Chapter, topic: Topic) -> StudyMaterial:
    material = StudyMaterial(
        institution_id=institution.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        topic_id=topic.id,
        title="Intro to Linear Equations",
        file_path="/files/intro-linear-equations.mp4",
        file_name="intro-linear-equations.mp4",
        file_size=1024 * 1024,
        material_type=MaterialType.VIDEO,
        view_count=60,
        download_count=25,
        tags=["beginner"],
        is_active=True,
    )
    db_session.add(material)
    db_session.commit()
    db_session.refresh(material)
    return material


def _make_weak_area(db_session, institution, student, subject, chapter=None, topic=None, weakness_score=Decimal("70.00")):
    weak_area = WeakArea(
        institution_id=institution.id,
        student_id=student.id,
        subject_id=subject.id,
        chapter_id=chapter.id if chapter else None,
        topic_id=topic.id if topic else None,
        weakness_score=weakness_score,
        average_score=Decimal("40.00"),
        is_resolved=False,
    )
    db_session.add(weak_area)
    db_session.commit()
    db_session.refresh(weak_area)
    return weak_area


def _make_chapter_performance(db_session, institution, student, subject, chapter, mastery_score):
    perf = ChapterPerformance(
        institution_id=institution.id,
        student_id=student.id,
        subject_id=subject.id,
        chapter_id=chapter.id,
        average_score=Decimal(str(mastery_score)),
        success_rate=Decimal(str(mastery_score)),
        mastery_score=Decimal(str(mastery_score)),
    )
    db_session.add(perf)
    db_session.commit()
    db_session.refresh(perf)
    return perf


def _make_access_log(db_session, institution, material, user, action="view"):
    log = MaterialAccessLog(
        institution_id=institution.id,
        material_id=material.id,
        user_id=user.id,
        action=action,
        accessed_at=datetime.utcnow() - timedelta(seconds=5),
    )
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)
    return log


# ---------------------------------------------------------------------------
# GET /comprehensive/{student_id}
# ---------------------------------------------------------------------------
class TestComprehensiveRecommendations:
    def test_happy_path_minimal_data(self, client, auth_headers, student):
        """With no weak areas/materials at all, the endpoint should still
        return a well-formed (if mostly empty) response -- this is the
        primary regression test for bug #2 (learning_style_profile shape
        mismatch), since detect_learning_style() always runs even with no
        access logs."""
        response = client.get(
            f"/api/v1/recommendations/comprehensive/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert "generated_at" in data
        style = data["learning_style_profile"]
        assert set(["visual_score", "auditory_score", "reading_writing_score",
                     "kinesthetic_score", "dominant_style"]).issubset(style.keys())
        assert data["summary"]["total_weak_areas"] == 0
        assert data["recommended_materials"] == []
        assert data["external_content"] == []
        assert data["study_paths"] == []
        assert data["weak_areas_summary"] == []

    def test_happy_path_with_weak_area_and_material(
        self, client, auth_headers, db_session, institution, student, subject,
        chapter, topic, study_material, student_user,
    ):
        """Exercises the full material-merge path (learning style + peer +
        difficulty engines all contribute) -- regression test for bug #3
        (missing title/material_type on recommended_materials)."""
        _make_weak_area(db_session, institution, student, subject, chapter, topic)
        _make_chapter_performance(db_session, institution, student, subject, chapter, 40.0)
        _make_access_log(db_session, institution, study_material, student_user)

        response = client.get(
            f"/api/v1/recommendations/comprehensive/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["summary"]["total_weak_areas"] == 1
        assert len(data["weak_areas_summary"]) == 1
        wa = data["weak_areas_summary"][0]
        assert wa["subject"] == subject.name
        assert wa["chapter"] == chapter.name
        assert len(data["study_paths"]) == 1
        study_path = data["study_paths"][0]
        assert study_path["subject_id"] == subject.id
        assert study_path["total_chapters"] == 1
        assert study_path["path"][0]["sequence"] == chapter.display_order

        for material_rec in data["recommended_materials"]:
            assert "title" in material_rec and material_rec["title"]
            assert "material_type" in material_rec and material_rec["material_type"]
            assert isinstance(material_rec["reasons"], list)
            assert isinstance(material_rec["sources"], list)

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/recommendations/comprehensive/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_returns_404(self, client, auth_headers, other_institution_student):
        response = client.get(
            f"/api/v1/recommendations/comprehensive/{other_institution_student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_requires_auth(self, client, student):
        response = client.get(f"/api/v1/recommendations/comprehensive/{student.id}")
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# POST /topic
# ---------------------------------------------------------------------------
class TestTopicRecommendations:
    def test_happy_path(self, client, student_headers, topic, study_material):
        response = client.post(
            "/api/v1/recommendations/topic",
            json={"topic_id": topic.id, "include_external": True},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["topic_id"] == topic.id
        assert data["topic_name"] == topic.name
        assert "difficulty_recommendation" in data
        assert "learning_style_profile" in data
        assert "internal_materials" in data
        assert "external_content" in data
        for rec in data["internal_materials"]:
            assert "title" in rec
            assert "material_type" in rec
            assert "material" not in rec  # regression: no raw ORM leak

    def test_without_external_content(self, client, student_headers, topic):
        response = client.post(
            "/api/v1/recommendations/topic",
            json={"topic_id": topic.id, "include_external": False},
            headers=student_headers,
        )
        assert response.status_code == 200
        assert "external_content" not in response.json()

    def test_topic_not_found_returns_404(self, client, student_headers):
        response = client.post(
            "/api/v1/recommendations/topic",
            json={"topic_id": 999999},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_topic_returns_404(
        self, client, student_headers, db_session, other_institution_student,
    ):
        other_topic = db_session.query(Topic).filter(
            Topic.institution_id == other_institution_student.institution_id
        ).first()
        if other_topic is None:
            other_chapter = Chapter(
                institution_id=other_institution_student.institution_id,
                subject_id=_ensure_other_subject(db_session, other_institution_student).id,
                grade_id=_ensure_other_grade(db_session, other_institution_student).id,
                name="Other Chapter",
                display_order=1,
                is_active=True,
            )
            db_session.add(other_chapter)
            db_session.commit()
            db_session.refresh(other_chapter)
            other_topic = Topic(
                institution_id=other_institution_student.institution_id,
                chapter_id=other_chapter.id,
                name="Other Topic",
                display_order=1,
                is_active=True,
            )
            db_session.add(other_topic)
            db_session.commit()
            db_session.refresh(other_topic)

        response = client.post(
            "/api/v1/recommendations/topic",
            json={"topic_id": other_topic.id},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_no_student_profile_returns_404(self, client, auth_headers, topic):
        """`auth_headers` logs in as the admin fixture, which has no linked
        Student row."""
        response = client.post(
            "/api/v1/recommendations/topic",
            json={"topic_id": topic.id},
            headers=auth_headers,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Student profile not found"

    def test_validation_error_missing_topic_id(self, client, student_headers):
        response = client.post(
            "/api/v1/recommendations/topic",
            json={},
            headers=student_headers,
        )
        assert response.status_code == 422


def _ensure_other_grade(db_session, other_student):
    from src.models.academic import AcademicYear, Grade
    year = AcademicYear(
        institution_id=other_student.institution_id,
        name=f"Year-{uuid.uuid4().hex[:6]}",
        start_date=datetime(2023, 4, 1).date(),
        end_date=datetime(2024, 3, 31).date(),
        is_current=True,
        is_active=True,
    )
    db_session.add(year)
    db_session.commit()
    db_session.refresh(year)
    grade = Grade(
        institution_id=other_student.institution_id,
        academic_year_id=year.id,
        name=f"Grade-{uuid.uuid4().hex[:6]}",
        display_order=1,
        is_active=True,
    )
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)
    return grade


def _ensure_other_subject(db_session, other_student):
    from src.models.academic import Subject
    subject = Subject(
        institution_id=other_student.institution_id,
        name=f"Subject-{uuid.uuid4().hex[:6]}",
        is_active=True,
    )
    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)
    return subject


# ---------------------------------------------------------------------------
# GET /learning-style/{student_id}
# ---------------------------------------------------------------------------
class TestLearningStyleProfile:
    def test_happy_path_default_scores(self, client, auth_headers, student):
        """No access logs at all -> even split across all four VARK dims."""
        response = client.get(
            f"/api/v1/recommendations/learning-style/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["visual_score"] == 0.25
        assert data["auditory_score"] == 0.25
        assert data["reading_writing_score"] == 0.25
        assert data["kinesthetic_score"] == 0.25
        assert data["dominant_style"] in {
            "visual", "auditory", "reading_writing", "kinesthetic"
        }

    def test_happy_path_visual_dominant(
        self, client, auth_headers, db_session, institution, student, student_user, study_material,
    ):
        _make_access_log(db_session, institution, study_material, student_user)
        response = client.get(
            f"/api/v1/recommendations/learning-style/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["dominant_style"] == "visual"
        assert data["visual_score"] > data["auditory_score"]

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/recommendations/learning-style/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_returns_404(self, client, auth_headers, other_institution_student):
        response = client.get(
            f"/api/v1/recommendations/learning-style/{other_institution_student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /difficulty-level/{student_id}
# ---------------------------------------------------------------------------
class TestDifficultyRecommendation:
    def test_happy_path_no_performance_data(self, client, auth_headers, student):
        """No ChapterPerformance rows -> defaults to mastery_score=50 -> medium."""
        response = client.get(
            f"/api/v1/recommendations/difficulty-level/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["mastery_score"] == 50.0
        assert data["recommended_difficulty"] == "medium"
        assert "difficulty_range" in data
        assert "reasoning" in data

    def test_happy_path_with_chapter_filter(
        self, client, auth_headers, db_session, institution, student, subject, chapter,
    ):
        _make_chapter_performance(db_session, institution, student, subject, chapter, 90.0)
        response = client.get(
            f"/api/v1/recommendations/difficulty-level/{student.id}",
            params={"chapter_id": chapter.id},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["mastery_score"] == 90.0
        assert data["recommended_difficulty"] == "very_hard"

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/recommendations/difficulty-level/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_returns_404(self, client, auth_headers, other_institution_student):
        response = client.get(
            f"/api/v1/recommendations/difficulty-level/{other_institution_student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /similar-students/{student_id}
# ---------------------------------------------------------------------------
class TestSimilarStudents:
    def test_happy_path_finds_similar_peer(
        self, client, auth_headers, db_session, institution, student, section, subject, grade,
    ):
        # A peer in the same institution/section with an identical
        # performance vector across >= 3 chapters -> cosine similarity 1.0,
        # comfortably over the 0.5 threshold.
        peer_suffix = uuid.uuid4().hex[:8]
        peer_role_user = User(
            username=f"peer_{peer_suffix}",
            email=f"peer_{peer_suffix}@testschool.com",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student.user.role_id if student.user else None,
            is_active=True,
        )
        db_session.add(peer_role_user)
        db_session.commit()
        db_session.refresh(peer_role_user)

        peer = Student(
            institution_id=institution.id,
            user_id=peer_role_user.id,
            section_id=section.id,
            first_name="Peer",
            last_name="Student",
            admission_number=f"PEER-{peer_suffix}",
            is_active=True,
        )
        db_session.add(peer)
        db_session.commit()
        db_session.refresh(peer)

        chapters = []
        for i in range(3):
            ch = Chapter(
                institution_id=institution.id,
                subject_id=subject.id,
                grade_id=grade.id,
                name=f"Chapter {i}",
                display_order=i,
                is_active=True,
            )
            db_session.add(ch)
            db_session.commit()
            db_session.refresh(ch)
            chapters.append(ch)

        # Ensure the target student also has a section (required by the
        # `same_grade_students` filter to even consider `peer`).
        student.section_id = section.id
        db_session.add(student)
        db_session.commit()

        for ch in chapters:
            _make_chapter_performance(db_session, institution, student, subject, ch, 60.0)
            _make_chapter_performance(db_session, institution, peer, subject, ch, 60.0)

        response = client.get(
            f"/api/v1/recommendations/similar-students/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert data["total_found"] >= 1
        peer_ids = [s["student_id"] for s in data["similar_students"]]
        assert peer.id in peer_ids

    def test_happy_path_no_peers(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/recommendations/similar-students/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_found"] == 0
        assert data["similar_students"] == []

    def test_invalid_limit_rejected(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/recommendations/similar-students/{student.id}",
            params={"limit": 0},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/recommendations/similar-students/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_returns_404(self, client, auth_headers, other_institution_student):
        response = client.get(
            f"/api/v1/recommendations/similar-students/{other_institution_student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /material-effectiveness/{material_id}
# ---------------------------------------------------------------------------
class TestMaterialEffectiveness:
    def test_happy_path(self, client, auth_headers, db_session, institution, study_material, student_user):
        _make_access_log(db_session, institution, study_material, student_user)
        response = client.get(
            f"/api/v1/recommendations/material-effectiveness/{study_material.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["material_id"] == study_material.id
        assert data["total_accesses"] == 1
        assert data["unique_students"] == 1
        assert "effectiveness_score" in data

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/recommendations/material-effectiveness/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_returns_404(
        self, client, auth_headers, db_session, other_institution_student,
    ):
        other_material = StudyMaterial(
            institution_id=other_institution_student.institution_id,
            title="Other Institution Material",
            file_path="/files/other.pdf",
            file_name="other.pdf",
            file_size=100,
            material_type=MaterialType.PDF,
            is_active=True,
        )
        db_session.add(other_material)
        db_session.commit()
        db_session.refresh(other_material)

        response = client.get(
            f"/api/v1/recommendations/material-effectiveness/{other_material.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# GET /study-path/{student_id}/{subject_id}
# ---------------------------------------------------------------------------
class TestStudyPath:
    def test_happy_path(
        self, client, auth_headers, db_session, institution, student, subject, chapter, topic,
    ):
        """Regression test for the sequence_number -> display_order bug:
        previously this endpoint raised AttributeError on every call with
        at least one active chapter for the subject."""
        response = client.get(
            f"/api/v1/recommendations/study-path/{student.id}/{subject.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["subject_id"] == subject.id
        assert data["student_id"] == student.id
        assert data["total_chapters"] == 1
        assert data["path"][0]["chapter_id"] == chapter.id
        assert data["path"][0]["sequence"] == chapter.display_order
        assert data["path"][0]["topics"][0]["sequence"] == topic.display_order

    def test_student_not_found(self, client, auth_headers, subject):
        response = client.get(
            f"/api/v1/recommendations/study-path/999999/{subject.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_student_returns_404(
        self, client, auth_headers, other_institution_student, subject,
    ):
        response = client.get(
            f"/api/v1/recommendations/study-path/{other_institution_student.id}/{subject.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_subject_returns_empty_path(
        self, client, auth_headers, student, db_session, other_institution_student,
    ):
        """The student is real (same institution as the caller) but the
        subject_id belongs to a different institution -- regression test for
        the Chapter institution-scoping fix: this must NOT leak the other
        institution's chapters, so the path should just come back empty."""
        other_subject = _ensure_other_subject(db_session, other_institution_student)
        response = client.get(
            f"/api/v1/recommendations/study-path/{student.id}/{other_subject.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_chapters"] == 0
        assert data["path"] == []


# ---------------------------------------------------------------------------
# GET /external-content/{topic_id}
# ---------------------------------------------------------------------------
class TestExternalContent:
    def test_happy_path(self, client, auth_headers, topic, subject):
        response = client.get(
            f"/api/v1/recommendations/external-content/{topic.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["topic_id"] == topic.id
        assert data["topic_name"] == topic.name
        assert data["subject"] == subject.name
        assert set(data["external_content"].keys()) == {
            "khan_academy", "youtube_edu", "openstax", "coursera", "mit_ocw"
        }

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/recommendations/external-content/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_returns_404(
        self, client, auth_headers, db_session, other_institution_student,
    ):
        other_subject = _ensure_other_subject(db_session, other_institution_student)
        other_grade = _ensure_other_grade(db_session, other_institution_student)
        other_chapter = Chapter(
            institution_id=other_institution_student.institution_id,
            subject_id=other_subject.id,
            grade_id=other_grade.id,
            name="Other Chapter",
            display_order=1,
            is_active=True,
        )
        db_session.add(other_chapter)
        db_session.commit()
        db_session.refresh(other_chapter)
        other_topic = Topic(
            institution_id=other_institution_student.institution_id,
            chapter_id=other_chapter.id,
            name="Other Topic",
            display_order=1,
            is_active=True,
        )
        db_session.add(other_topic)
        db_session.commit()
        db_session.refresh(other_topic)

        response = client.get(
            f"/api/v1/recommendations/external-content/{other_topic.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /filtered
# ---------------------------------------------------------------------------
class TestFilteredRecommendations:
    def test_happy_path_with_topic_id(self, client, student_headers, topic):
        response = client.post(
            "/api/v1/recommendations/filtered",
            json={"topic_id": topic.id, "include_external": True},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["topic_id"] == topic.id

    def test_happy_path_without_topic_id_uses_comprehensive(self, client, student_headers):
        response = client.post(
            "/api/v1/recommendations/filtered",
            json={"include_external": False},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "recommended_materials" in data
        assert "learning_style_profile" in data
        assert set(["visual_score", "dominant_style"]).issubset(
            data["learning_style_profile"].keys()
        )

    def test_topic_not_found_returns_404(self, client, student_headers):
        response = client.post(
            "/api/v1/recommendations/filtered",
            json={"topic_id": 999999},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_no_student_profile_returns_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/recommendations/filtered",
            json={"include_external": False},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_limit_out_of_range_rejected(self, client, student_headers):
        response = client.post(
            "/api/v1/recommendations/filtered",
            json={"limit": 500},
            headers=student_headers,
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /peer-success-materials/{student_id}
# ---------------------------------------------------------------------------
class TestPeerSuccessMaterials:
    def test_happy_path_no_peers(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/recommendations/peer-success-materials/{student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert data["total_similar_peers"] == 0
        assert data["materials"] == []

    def test_invalid_limit_rejected(self, client, auth_headers, student):
        response = client.get(
            f"/api/v1/recommendations/peer-success-materials/{student.id}",
            params={"limit": 0},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/recommendations/peer-success-materials/999999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_returns_404(self, client, auth_headers, other_institution_student):
        response = client.get(
            f"/api/v1/recommendations/peer-success-materials/{other_institution_student.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404
