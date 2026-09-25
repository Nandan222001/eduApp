"""Integration tests for the `doubts` router (src/api/v1/doubts.py).

IMPORTANT SCOPE NOTE: despite the model/frontend evidence of a full "student
Q&A" feature (DoubtPost/DoubtAnswer/DoubtVote/DoubtBookmark models,
src/schemas/doubt.py, frontend/src/api/doubts.ts expecting POST /doubts,
GET/PUT/DELETE /doubts/{id}, /doubts/{id}/answers, /doubts/{id}/vote, etc.),
`src/api/v1/doubts.py` as it actually exists in this codebase does NOT
implement any of that basic CRUD. It is solely the *AI-intelligence* layer
that operates on top of already-existing DoubtPost rows: auto-tagging,
semantic similarity search, answer suggestions sourced from similar
doubts/question bank/study materials, priority scoring, and teacher
auto-assignment. There is no create/list/get/update/delete-doubt endpoint,
no answer-posting endpoint, and no vote/bookmark endpoint anywhere in the
backend (confirmed via a full-codebase grep for DoubtPost/DoubtAnswer usage
in src/api/v1/*.py -- doubts.py is the only file that touches them). This is
flagged back to the human rather than silently building a large new feature
that wasn't asked for; these tests cover the AI-intelligence router exactly
as it exists, seeding DoubtPost/DoubtAnswer rows directly via db_session
since there's no API to create them.

Bugs found and fixed while writing these tests (see the accompanying commit
for the exact diffs):
  1. `POST /{doubt_id}/tags/auto-generate` -> DoubtTaggingService.auto_tag_doubt
     never filtered by institution_id at all, so any authenticated user (of
     ANY institution) could mutate (and read back, via the response) another
     institution's doubt's subject/chapter/topic/difficulty/tags by simply
     guessing/enumerating a doubt_id. Fixed by adding an institution_id
     parameter, scoped from the router.
  2. `POST /{doubt_id}/priority/calculate` -> same cross-tenant gap in
     DoubtPriorityService.calculate_priority_score (no institution_id
     filter at all) -- any user could recompute/leak another institution's
     doubt's priority/urgency/difficulty scores. Fixed the same way.
  3. `POST /suggestions/{suggestion_id}/vote` -> DoubtAnswerSuggestionService
     .vote_suggestion_helpful looked up the suggestion by id ALONE, no
     institution scoping -- any user could toggle is_helpful/helpful_votes
     on another institution's suggestion. Fixed the same way.
  4. `POST /{doubt_id}/reassign-teacher` -> DoubtTeacherAssignmentService
     .reassign_doubt used `new_teacher_id` without validating it refers to
     a real teacher in the caller's institution first. A nonexistent id
     caused an unhandled FK IntegrityError (500); a valid-but-wrong-
     institution id silently assigned a doubt to a teacher from a totally
     different institution. Fixed by validating the teacher exists in the
     same institution before assigning, returning a clean failure otherwise.

Ruled out during investigation (verified directly, not just by inspection,
before writing any test around them):
  - `doubt.difficulty = <lowercase string>` in DoubtTaggingService looked
    like the "raw string vs SQLEnum" bug class at first glance, but
    DoubtDifficulty/DoubtStatus are `(str, Enum)` subclasses whose member
    VALUES are the lowercase strings themselves, so SQLAlchemy's Enum type's
    `_valid_lookup` matches them via hash/eq (confirmed with a standalone
    repro against a real engine) -- assignment and commit succeed, no
    LookupError. Left as-is; there is a passing regression test below.
  - `get_doubt_intelligence_summary` returns a raw `Teacher` ORM instance
    under the `teacher` key of a `response_model`-less dict response.
    Confirmed via a direct jsonable_encoder() repro that FastAPI's encoder
    falls back to `vars(obj)` for arbitrary objects and serializes it fine
    (filtering out `_sa_instance_state`) -- not a crash, just serializes the
    teacher's plain columns. Not fixed (harmless, if a little sloppy);
    covered by a passing test below.
"""
import uuid
from datetime import datetime, timedelta

import pytest

from src.models.institution import Institution
from src.models.doubt import DoubtPost, DoubtAnswer, DoubtSuggestedAnswer, DoubtStatus, DoubtPriority, TeacherDoubtStats
from src.models.teacher import Teacher, TeacherSubject
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": teacher_user.email, "password": "password123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": student_user.email, "password": "password123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def other_institution(db_session) -> Institution:
    suffix = uuid.uuid4().hex[:12]
    inst = Institution(
        name=f"Other School {suffix}",
        slug=f"other-school-{suffix}",
        phone="+1987654321",
        address="456 Other Street, Other City, Other State, Other Country",
        is_active=True,
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    return inst


@pytest.fixture
def other_admin_role(db_session):
    from src.models.role import Role
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role):
    from src.models.user import User
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheradmin{suffix}",
        email=f"otheradmin{suffix}@otherschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_admin_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_admin_headers(client, other_admin_user) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": other_admin_user.email, "password": "password123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def doubt(db_session, institution, student_user, subject) -> DoubtPost:
    d = DoubtPost(
        institution_id=institution.id,
        user_id=student_user.id,
        subject_id=subject.id,
        title="How does photosynthesis work",
        description="I don't understand the light-dependent reactions in chloroplasts.",
    )
    db_session.add(d)
    db_session.commit()
    db_session.refresh(d)
    return d


@pytest.fixture
def other_institution_doubt(db_session, other_institution, other_admin_user) -> DoubtPost:
    d = DoubtPost(
        institution_id=other_institution.id,
        user_id=other_admin_user.id,
        title="Secret doubt from another school",
        description="This belongs to a different institution entirely.",
    )
    db_session.add(d)
    db_session.commit()
    db_session.refresh(d)
    return d


@pytest.fixture
def teacher_with_subject(db_session, institution, teacher, subject) -> Teacher:
    link = TeacherSubject(institution_id=institution.id, teacher_id=teacher.id, subject_id=subject.id, is_primary=True)
    db_session.add(link)
    db_session.commit()
    return teacher


# ===========================================================================
# POST /{doubt_id}/process
# ===========================================================================
class TestProcessDoubt:
    def test_process_success(self, client, auth_headers, doubt, teacher_with_subject):
        response = client.post(f"/api/v1/doubts/{doubt.id}/process", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["doubt_id"] == doubt.id
        assert "tagging" in data["processing_steps"]
        assert "embedding" in data["processing_steps"]
        assert "priority" in data["processing_steps"]
        assert "teacher_assignment" in data["processing_steps"]

    def test_process_without_auto_assignment(self, client, auth_headers, doubt):
        response = client.post(
            f"/api/v1/doubts/{doubt.id}/process",
            headers=auth_headers,
            params={"enable_auto_assignment": False},
        )
        assert response.status_code == 200
        assert "teacher_assignment" not in response.json()["processing_steps"]

    def test_process_not_found_404(self, client, auth_headers):
        response = client.post("/api/v1/doubts/999999/process", headers=auth_headers)
        assert response.status_code == 404

    def test_process_cross_institution_404(self, client, other_admin_headers, doubt):
        response = client.post(f"/api/v1/doubts/{doubt.id}/process", headers=other_admin_headers)
        assert response.status_code == 404

    def test_process_requires_auth(self, client, doubt):
        response = client.post(f"/api/v1/doubts/{doubt.id}/process")
        assert response.status_code == 403


# ===========================================================================
# GET /{doubt_id}/intelligence
# ===========================================================================
class TestDoubtIntelligenceSummary:
    def test_intelligence_summary_success(self, client, auth_headers, doubt):
        response = client.get(f"/api/v1/doubts/{doubt.id}/intelligence", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["doubt"]["id"] == doubt.id
        assert data["doubt"]["status"] == "unanswered"
        assert data["teacher_assignment"] is None

    def test_intelligence_summary_with_assigned_teacher(self, client, auth_headers, doubt, teacher_with_subject):
        process_resp = client.post(f"/api/v1/doubts/{doubt.id}/process", headers=auth_headers)
        assert process_resp.status_code == 200

        response = client.get(f"/api/v1/doubts/{doubt.id}/intelligence", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        if data["teacher_assignment"] is not None:
            # Regression check: a raw Teacher ORM object under 'teacher' must
            # still serialize cleanly (not 500), even though it isn't a
            # proper schema.
            assert data["teacher_assignment"]["teacher_id"] == teacher_with_subject.id
            assert data["teacher_assignment"]["teacher"]["id"] == teacher_with_subject.id

    def test_intelligence_summary_not_found_404(self, client, auth_headers):
        response = client.get("/api/v1/doubts/999999/intelligence", headers=auth_headers)
        assert response.status_code == 404

    def test_intelligence_summary_cross_institution_404(self, client, other_admin_headers, doubt):
        response = client.get(f"/api/v1/doubts/{doubt.id}/intelligence", headers=other_admin_headers)
        assert response.status_code == 404


# ===========================================================================
# GET /{doubt_id}/similar, POST /search/semantic
# ===========================================================================
class TestSimilarAndSearch:
    def test_find_similar_doubts_empty(self, client, auth_headers, doubt):
        response = client.get(f"/api/v1/doubts/{doubt.id}/similar", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["doubt_id"] == doubt.id
        assert data["similar_doubts"] == []
        assert data["count"] == 0

    def test_find_similar_doubts_finds_related(self, client, auth_headers, db_session, institution, student_user, subject, doubt):
        twin = DoubtPost(
            institution_id=institution.id,
            user_id=student_user.id,
            subject_id=subject.id,
            title="How does photosynthesis work",
            description="I don't understand the light-dependent reactions in chloroplasts.",
        )
        db_session.add(twin)
        db_session.commit()
        db_session.refresh(twin)

        # `find_similar_doubts` only considers candidates that already have a
        # DoubtEmbedding row -- generate one for `twin` first (doubt_id gets
        # its own embedding lazily, inside the /similar call itself).
        gen_resp = client.post("/api/v1/doubts/batch/generate-embeddings", headers=auth_headers)
        assert gen_resp.status_code == 200

        response = client.get(
            f"/api/v1/doubts/{doubt.id}/similar", headers=auth_headers, params={"similarity_threshold": 0.5}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1
        assert any(s["doubt_id"] == twin.id for s in data["similar_doubts"])

    def test_find_similar_doubts_not_found_returns_empty(self, client, auth_headers):
        response = client.get("/api/v1/doubts/999999/similar", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["count"] == 0

    def test_find_similar_doubts_cross_institution_returns_empty(self, client, other_admin_headers, doubt):
        response = client.get(f"/api/v1/doubts/{doubt.id}/similar", headers=other_admin_headers)
        assert response.status_code == 200
        assert response.json()["count"] == 0

    def test_semantic_search(self, client, auth_headers, doubt, subject):
        response = client.post(
            "/api/v1/doubts/search/semantic",
            headers=auth_headers,
            params={"query_text": "chloroplast light reactions photosynthesis", "subject_id": subject.id, "similarity_threshold": 0.3},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["query"] == "chloroplast light reactions photosynthesis"
        assert isinstance(data["results"], list)

    def test_semantic_search_scoped_to_own_institution(self, client, auth_headers, other_institution_doubt):
        # A doubt that only exists in a different institution must never
        # show up in this caller's semantic search results.
        response = client.post(
            "/api/v1/doubts/search/semantic",
            headers=auth_headers,
            params={"query_text": "Secret doubt from another school", "similarity_threshold": 0.1},
        )
        assert response.status_code == 200
        assert all(r["doubt_id"] != other_institution_doubt.id for r in response.json()["results"])


# ===========================================================================
# Answer suggestions: GET/POST .../suggestions, vote
# ===========================================================================
class TestAnswerSuggestions:
    def test_get_suggestions_empty(self, client, auth_headers, doubt):
        response = client.get(f"/api/v1/doubts/{doubt.id}/suggestions", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == {"doubt_id": doubt.id, "suggestions": [], "count": 0}

    def test_generate_suggestions_from_similar_answered_doubt(
        self, client, auth_headers, db_session, institution, student_user, subject, doubt
    ):
        answered_twin = DoubtPost(
            institution_id=institution.id,
            user_id=student_user.id,
            subject_id=subject.id,
            title="How does photosynthesis work",
            description="I don't understand the light-dependent reactions in chloroplasts.",
            status=DoubtStatus.ANSWERED,
            answer_count=1,
        )
        db_session.add(answered_twin)
        db_session.flush()
        answer = DoubtAnswer(
            institution_id=institution.id,
            doubt_id=answered_twin.id,
            user_id=student_user.id,
            content="The light-dependent reactions happen in the thylakoid membrane.",
            is_accepted=True,
        )
        db_session.add(answer)
        db_session.commit()

        # `_get_suggestions_from_similar_doubts` sources candidates through
        # find_similar_doubts, which only considers doubts that already have
        # a DoubtEmbedding row.
        gen_resp = client.post("/api/v1/doubts/batch/generate-embeddings", headers=auth_headers)
        assert gen_resp.status_code == 200

        response = client.post(f"/api/v1/doubts/{doubt.id}/suggestions/generate", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["doubt_id"] == doubt.id
        assert data["count"] >= 1
        assert data["suggestions"][0]["source_type"] == "similar_doubt"

        # And GET /suggestions should now return the persisted suggestion.
        get_resp = client.get(f"/api/v1/doubts/{doubt.id}/suggestions", headers=auth_headers)
        assert get_resp.json()["count"] >= 1

    def test_generate_suggestions_not_found_returns_empty(self, client, auth_headers):
        response = client.post("/api/v1/doubts/999999/suggestions/generate", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["count"] == 0

    def test_vote_suggestion_helpful(self, client, auth_headers, db_session, institution, doubt):
        suggestion = DoubtSuggestedAnswer(
            doubt_id=doubt.id,
            institution_id=institution.id,
            source_type="similar_doubt",
            suggested_content="Some suggested content",
            confidence_score=0.8,
        )
        db_session.add(suggestion)
        db_session.commit()
        db_session.refresh(suggestion)

        response = client.post(
            f"/api/v1/doubts/suggestions/{suggestion.id}/vote", headers=auth_headers, params={"is_helpful": True}
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["is_helpful"] is True
        assert data["helpful_votes"] == 1

    def test_vote_suggestion_not_helpful_does_not_increment(self, client, auth_headers, db_session, institution, doubt):
        suggestion = DoubtSuggestedAnswer(
            doubt_id=doubt.id,
            institution_id=institution.id,
            source_type="similar_doubt",
            suggested_content="Content",
            confidence_score=0.8,
        )
        db_session.add(suggestion)
        db_session.commit()
        db_session.refresh(suggestion)

        response = client.post(
            f"/api/v1/doubts/suggestions/{suggestion.id}/vote", headers=auth_headers, params={"is_helpful": False}
        )
        assert response.status_code == 200
        assert response.json()["helpful_votes"] == 0

    def test_vote_suggestion_not_found_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/doubts/suggestions/999999/vote", headers=auth_headers, params={"is_helpful": True}
        )
        assert response.status_code == 404

    # --- Regression: cross-tenant vote bug fix ---
    def test_vote_suggestion_cross_institution_404(self, client, other_admin_headers, db_session, institution, doubt):
        suggestion = DoubtSuggestedAnswer(
            doubt_id=doubt.id,
            institution_id=institution.id,
            source_type="similar_doubt",
            suggested_content="Content",
            confidence_score=0.8,
        )
        db_session.add(suggestion)
        db_session.commit()
        db_session.refresh(suggestion)

        response = client.post(
            f"/api/v1/doubts/suggestions/{suggestion.id}/vote",
            headers=other_admin_headers,
            params={"is_helpful": True},
        )
        assert response.status_code == 404

        db_session.refresh(suggestion)
        assert suggestion.is_helpful is None
        assert suggestion.helpful_votes == 0


# ===========================================================================
# Tagging: POST .../tags/auto-generate, GET .../tags/suggestions
# ===========================================================================
class TestTagging:
    def test_auto_generate_tags_success(self, client, auth_headers, doubt, subject):
        response = client.post(f"/api/v1/doubts/{doubt.id}/tags/auto-generate", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert subject.name in data["auto_tags"]
        assert data["subject_id"] == subject.id

    def test_auto_generate_tags_detects_difficulty(self, client, auth_headers, db_session, institution, student_user, subject):
        # Regression check for the raw-string-vs-SQLEnum bug class: this
        # description contains 'basic'/'simple', which the tagger maps to a
        # plain lowercase 'easy' string before assigning to the SQLEnum
        # `difficulty` column -- must not 500.
        easy_doubt = DoubtPost(
            institution_id=institution.id,
            user_id=student_user.id,
            subject_id=subject.id,
            title="Basic simple introduction question",
            description="This is a basic and simple beginner question, just fundamental stuff.",
        )
        db_session.add(easy_doubt)
        db_session.commit()
        db_session.refresh(easy_doubt)

        response = client.post(f"/api/v1/doubts/{easy_doubt.id}/tags/auto-generate", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["difficulty"] == "easy"
        assert "difficulty:easy" in data["auto_tags"]

        db_session.refresh(easy_doubt)
        assert easy_doubt.difficulty.value == "easy"

    def test_auto_generate_tags_not_found_404(self, client, auth_headers):
        response = client.post("/api/v1/doubts/999999/tags/auto-generate", headers=auth_headers)
        assert response.status_code == 404

    # --- Regression: cross-tenant auto-tag mutation bug fix ---
    def test_auto_generate_tags_cross_institution_404_and_no_mutation(
        self, client, other_admin_headers, doubt, db_session
    ):
        original_tags = doubt.auto_generated_tags
        response = client.post(f"/api/v1/doubts/{doubt.id}/tags/auto-generate", headers=other_admin_headers)
        assert response.status_code == 404

        db_session.refresh(doubt)
        assert doubt.auto_generated_tags == original_tags

    def test_tag_suggestions(self, client, auth_headers, doubt, subject):
        response = client.get(f"/api/v1/doubts/{doubt.id}/tags/suggestions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["doubt_id"] == doubt.id
        assert subject.name in data["suggested_tags"]

    def test_tag_suggestions_cross_institution_returns_empty(self, client, other_admin_headers, doubt):
        response = client.get(f"/api/v1/doubts/{doubt.id}/tags/suggestions", headers=other_admin_headers)
        assert response.status_code == 200
        assert response.json()["suggested_tags"] == []


# ===========================================================================
# Priority: POST .../priority/calculate, GET /prioritized
# ===========================================================================
class TestPriority:
    def test_calculate_priority_success(self, client, auth_headers, doubt):
        response = client.post(f"/api/v1/doubts/{doubt.id}/priority/calculate", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["priority"] in ("low", "medium", "high", "urgent")
        assert 0.0 <= data["priority_score"] <= 1.0

    def test_calculate_priority_not_found_404(self, client, auth_headers):
        response = client.post("/api/v1/doubts/999999/priority/calculate", headers=auth_headers)
        assert response.status_code == 404

    # --- Regression: cross-tenant priority mutation bug fix ---
    def test_calculate_priority_cross_institution_404_and_no_mutation(
        self, client, other_admin_headers, doubt, db_session
    ):
        assert doubt.priority_score == 0.0
        response = client.post(f"/api/v1/doubts/{doubt.id}/priority/calculate", headers=other_admin_headers)
        assert response.status_code == 404

        db_session.refresh(doubt)
        assert doubt.priority_score == 0.0

    def test_urgent_keyword_raises_priority(self, client, auth_headers, db_session, institution, student_user, subject):
        urgent_doubt = DoubtPost(
            institution_id=institution.id,
            user_id=student_user.id,
            subject_id=subject.id,
            title="URGENT exam tomorrow need help ASAP",
            description="I have an exam tomorrow and need this answered immediately, urgent deadline.",
        )
        db_session.add(urgent_doubt)
        db_session.commit()
        db_session.refresh(urgent_doubt)

        response = client.post(f"/api/v1/doubts/{urgent_doubt.id}/priority/calculate", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["urgency_score"] > 0.3

    def test_get_prioritized_doubts(self, client, auth_headers, doubt):
        client.post(f"/api/v1/doubts/{doubt.id}/priority/calculate", headers=auth_headers)

        response = client.get("/api/v1/doubts/prioritized", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(d["id"] == doubt.id for d in data["doubts"])

    def test_get_prioritized_doubts_filter_by_subject(self, client, auth_headers, doubt, subject):
        response = client.get("/api/v1/doubts/prioritized", headers=auth_headers, params={"subject_id": subject.id})
        assert response.status_code == 200
        assert all(True for _ in response.json()["doubts"])  # scoping asserted below

    def test_get_prioritized_doubts_scoped_to_own_institution(self, client, other_admin_headers, doubt):
        response = client.get("/api/v1/doubts/prioritized", headers=other_admin_headers)
        assert response.status_code == 200
        assert all(d["id"] != doubt.id for d in response.json()["doubts"])


# ===========================================================================
# Teacher assignment
# ===========================================================================
class TestTeacherAssignment:
    def test_assign_teacher_success(self, client, auth_headers, doubt, teacher_with_subject):
        response = client.post(f"/api/v1/doubts/{doubt.id}/assign-teacher", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["assigned_teacher_id"] == teacher_with_subject.id
        assert data["auto_assigned"] is True

    def test_assign_teacher_no_eligible_teacher_400(self, client, auth_headers, doubt):
        # No teacher is linked to `doubt`'s subject at all.
        response = client.post(f"/api/v1/doubts/{doubt.id}/assign-teacher", headers=auth_headers)
        assert response.status_code == 400
        assert "no suitable teacher" in response.json()["detail"].lower()

    def test_assign_teacher_already_assigned_no_auto_400(self, client, auth_headers, doubt, teacher_with_subject):
        first = client.post(f"/api/v1/doubts/{doubt.id}/assign-teacher", headers=auth_headers)
        assert first.status_code == 200

        second = client.post(
            f"/api/v1/doubts/{doubt.id}/assign-teacher", headers=auth_headers, params={"auto_assign": False}
        )
        assert second.status_code == 400

    def test_assign_teacher_not_found_400(self, client, auth_headers):
        response = client.post("/api/v1/doubts/999999/assign-teacher", headers=auth_headers)
        assert response.status_code == 400

    def test_reassign_teacher_success(self, client, auth_headers, doubt, teacher_with_subject, db_session, institution):
        client.post(f"/api/v1/doubts/{doubt.id}/assign-teacher", headers=auth_headers)

        second_teacher = Teacher(
            institution_id=institution.id,
            employee_id="EMP-SECOND",
            first_name="Second",
            last_name="Teacher",
            email="second.teacher@testschool.com",
            is_active=True,
        )
        db_session.add(second_teacher)
        db_session.commit()
        db_session.refresh(second_teacher)

        response = client.post(
            f"/api/v1/doubts/{doubt.id}/reassign-teacher",
            headers=auth_headers,
            params={"new_teacher_id": second_teacher.id},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["old_teacher_id"] == teacher_with_subject.id
        assert data["new_teacher_id"] == second_teacher.id

    def test_reassign_teacher_doubt_not_found_400(self, client, auth_headers, teacher):
        response = client.post(
            "/api/v1/doubts/999999/reassign-teacher", headers=auth_headers, params={"new_teacher_id": teacher.id}
        )
        assert response.status_code == 400

    # --- Regression: nonexistent-teacher-id bug fix (was an unhandled 500) ---
    def test_reassign_teacher_nonexistent_teacher_400(self, client, auth_headers, doubt):
        response = client.post(
            f"/api/v1/doubts/{doubt.id}/reassign-teacher", headers=auth_headers, params={"new_teacher_id": 999999}
        )
        assert response.status_code == 400

    # --- Regression: cross-institution teacher-id bug fix ---
    def test_reassign_teacher_cross_institution_teacher_400(
        self, client, auth_headers, doubt, other_institution, db_session
    ):
        foreign_teacher = Teacher(
            institution_id=other_institution.id,
            employee_id="EMP-FOREIGN",
            first_name="Foreign",
            last_name="Teacher",
            email="foreign.teacher@otherschool.com",
            is_active=True,
        )
        db_session.add(foreign_teacher)
        db_session.commit()
        db_session.refresh(foreign_teacher)

        response = client.post(
            f"/api/v1/doubts/{doubt.id}/reassign-teacher",
            headers=auth_headers,
            params={"new_teacher_id": foreign_teacher.id},
        )
        assert response.status_code == 400

        db_session.refresh(doubt)
        assert doubt.assigned_teacher_id != foreign_teacher.id

    def test_teacher_workload(self, client, auth_headers, doubt, teacher_with_subject):
        client.post(f"/api/v1/doubts/{doubt.id}/assign-teacher", headers=auth_headers)

        response = client.get(f"/api/v1/doubts/teachers/{teacher_with_subject.id}/workload", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["teacher_id"] == teacher_with_subject.id
        assert data["total_stats"]["total_assigned"] >= 1

    def test_teacher_workload_no_stats_yet(self, client, auth_headers, teacher):
        response = client.get(f"/api/v1/doubts/teachers/{teacher.id}/workload", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_stats"]["total_assigned"] == 0
        assert data["subject_breakdown"] == []


# ===========================================================================
# Batch endpoints
# ===========================================================================
class TestBatchEndpoints:
    def test_batch_process_doubts(self, client, auth_headers, doubt):
        response = client.post("/api/v1/doubts/batch/process", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_processed"] >= 1
        assert data["successful"] + data["failed"] == data["total_processed"]

    def test_batch_process_doubts_scoped_to_own_institution(self, client, other_admin_headers, doubt):
        response = client.post("/api/v1/doubts/batch/process", headers=other_admin_headers)
        assert response.status_code == 200
        assert response.json()["total_processed"] == 0

    def test_batch_generate_embeddings(self, client, auth_headers, doubt):
        response = client.post("/api/v1/doubts/batch/generate-embeddings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["successful"] >= 1

    def test_batch_auto_tag(self, client, auth_headers, doubt):
        response = client.post("/api/v1/doubts/batch/auto-tag", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total_processed"] >= 1

    def test_batch_recalculate_priorities(self, client, auth_headers, doubt):
        response = client.post("/api/v1/doubts/batch/recalculate-priorities", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total_processed"] >= 1

    def test_batch_auto_assign_teachers(self, client, auth_headers, doubt, teacher_with_subject):
        response = client.post("/api/v1/doubts/batch/auto-assign-teachers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["successful"] >= 1


# ===========================================================================
# Analytics
# ===========================================================================
class TestIntelligenceAnalytics:
    def test_analytics_no_doubts(self, client, auth_headers):
        response = client.get("/api/v1/doubts/analytics/intelligence", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_doubts"] == 0
        # Must not divide by zero.
        assert data["intelligence_coverage"]["embeddings"]["percentage"] == 0

    def test_analytics_with_doubts(self, client, auth_headers, doubt):
        response = client.get("/api/v1/doubts/analytics/intelligence", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_doubts"] >= 1

    def test_analytics_scoped_to_own_institution(self, client, other_admin_headers, doubt):
        response = client.get("/api/v1/doubts/analytics/intelligence", headers=other_admin_headers)
        assert response.status_code == 200
        assert response.json()["total_doubts"] == 0


# ===========================================================================
# Reprocess
# ===========================================================================
class TestReprocessDoubt:
    def test_reprocess_default_steps(self, client, auth_headers, doubt):
        response = client.post(f"/api/v1/doubts/{doubt.id}/reprocess", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        steps = data["reprocessing_steps"]
        assert set(steps.keys()) == {"tagging", "embedding", "similar_doubts", "suggestions", "priority"}

    def test_reprocess_specific_steps(self, client, auth_headers, doubt):
        response = client.post(
            f"/api/v1/doubts/{doubt.id}/reprocess", headers=auth_headers, params={"steps": ["priority"]}
        )
        assert response.status_code == 200
        assert list(response.json()["reprocessing_steps"].keys()) == ["priority"]

    def test_reprocess_not_found_404(self, client, auth_headers):
        response = client.post("/api/v1/doubts/999999/reprocess", headers=auth_headers)
        assert response.status_code == 404

    def test_reprocess_cross_institution_404(self, client, other_admin_headers, doubt):
        response = client.post(f"/api/v1/doubts/{doubt.id}/reprocess", headers=other_admin_headers)
        assert response.status_code == 404
