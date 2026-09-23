"""Integration tests for the `question_blueprints` router
(src/api/v1/question_blueprints.py).

Covers historical-pattern analysis over previous-year papers, blueprint
creation (manual and from-analysis), listing/filtering, update/delete, and
question-paper suggestion generation against the institution's question
bank. No source bugs were found in this router or its service
(`QuestionBlueprintService`) -- every mutating/lookup endpoint already
derives `institution_id` from `current_user` (never trusts a client-supplied
value) and 403s on a cross-institution id lookup.
"""
import json
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.previous_year_papers import PreviousYearPaper, QuestionBank, QuestionBlueprint
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# A second institution + admin, for cross-institution 403/404 checks.
# ---------------------------------------------------------------------------
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
def other_admin_role(db_session) -> Role:
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role) -> User:
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
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_admin_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def previous_year_paper(db_session, institution, grade, subject) -> PreviousYearPaper:
    paper = PreviousYearPaper(
        institution_id=institution.id,
        title="CBSE Board 2023",
        board="cbse",
        year=2023,
        grade_id=grade.id,
        subject_id=subject.id,
        total_marks=100,
        duration_minutes=180,
    )
    db_session.add(paper)
    db_session.commit()
    db_session.refresh(paper)
    return paper


@pytest.fixture
def bank_questions(db_session, institution, previous_year_paper, grade, subject):
    specs = [
        ("easy", "remember", "short_answer", 2),
        ("medium", "apply", "numerical", 5),
        ("hard", "analyze", "long_answer", 8),
    ]
    questions = []
    for difficulty, bloom, qtype, marks in specs:
        q = QuestionBank(
            institution_id=institution.id,
            paper_id=previous_year_paper.id,
            question_text=f"A {difficulty} {qtype} question",
            question_type=qtype,
            grade_id=grade.id,
            subject_id=subject.id,
            difficulty_level=difficulty,
            bloom_taxonomy_level=bloom,
            marks=marks,
        )
        db_session.add(q)
        questions.append(q)
    db_session.commit()
    for q in questions:
        db_session.refresh(q)
    return questions


@pytest.fixture
def sample_blueprint(db_session, institution, grade, subject, admin_user) -> QuestionBlueprint:
    blueprint = QuestionBlueprint(
        institution_id=institution.id,
        blueprint_name="Term 1 Blueprint",
        board="cbse",
        grade_id=grade.id,
        subject_id=subject.id,
        total_marks=100,
        duration_minutes=180,
        difficulty_distribution=json.dumps({"easy": 100.0}),
        bloom_taxonomy_distribution=json.dumps({"remember": 100.0}),
        question_type_distribution=json.dumps({"short_answer": 100.0}),
        created_by=admin_user.id,
    )
    db_session.add(blueprint)
    db_session.commit()
    db_session.refresh(blueprint)
    return blueprint


# ---------------------------------------------------------------------------
# Analyze historical patterns
# ---------------------------------------------------------------------------
class TestAnalyzeHistoricalPatterns:
    def test_analyze_success(self, client, auth_headers, bank_questions, grade, subject):
        response = client.post(
            "/api/v1/question-blueprints/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id, "year_start": 2020, "year_end": 2025},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["papers_analyzed"] == 1
        assert data["questions_analyzed"] == 3
        assert pytest.approx(data["difficulty_distribution"]["easy"]) == pytest.approx(100 / 3)

    def test_analyze_no_data_returns_404(self, client, auth_headers, grade, subject):
        response = client.post(
            "/api/v1/question-blueprints/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_analyze_scoped_to_own_institution(
        self, client, auth_headers, db_session, other_institution, grade, subject
    ):
        # A paper belonging to a different institution must not feed this
        # institution's analysis.
        other_paper = PreviousYearPaper(
            institution_id=other_institution.id,
            title="Other Institution Paper",
            board="cbse",
            year=2023,
            grade_id=grade.id,
            subject_id=subject.id,
        )
        db_session.add(other_paper)
        db_session.commit()

        response = client.post(
            "/api/v1/question-blueprints/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_analyze_unauthenticated(self, client, grade, subject):
        response = client.post(
            "/api/v1/question-blueprints/analyze",
            json={"board": "cbse", "grade_id": grade.id, "subject_id": subject.id},
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Create blueprint
# ---------------------------------------------------------------------------
class TestCreateBlueprint:
    def test_create_blueprint_success(self, client, auth_headers, institution, grade, subject, admin_user):
        response = client.post(
            "/api/v1/question-blueprints/create",
            json={
                "blueprint_name": "Final Exam Blueprint",
                "board": "cbse",
                "grade_id": grade.id,
                "subject_id": subject.id,
                "total_marks": 80,
                "duration_minutes": 180,
                "difficulty_distribution": {"easy": 40.0, "hard": 60.0},
                "bloom_taxonomy_distribution": {"remember": 50.0, "apply": 50.0},
                "question_type_distribution": {"short_answer": 100.0},
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["blueprint_name"] == "Final Exam Blueprint"
        assert data["institution_id"] == institution.id
        assert data["created_by"] == admin_user.id
        assert json.loads(data["difficulty_distribution"]) == {"easy": 40.0, "hard": 60.0}

    def test_create_blueprint_total_marks_out_of_range_validation_error(self, client, auth_headers, grade, subject):
        response = client.post(
            "/api/v1/question-blueprints/create",
            json={
                "blueprint_name": "Bad Blueprint",
                "board": "cbse",
                "grade_id": grade.id,
                "subject_id": subject.id,
                "total_marks": 5000,
                "duration_minutes": 180,
                "difficulty_distribution": {},
                "bloom_taxonomy_distribution": {},
                "question_type_distribution": {},
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_blueprint_unauthenticated(self, client, grade, subject):
        response = client.post(
            "/api/v1/question-blueprints/create",
            json={
                "blueprint_name": "X",
                "board": "cbse",
                "grade_id": grade.id,
                "subject_id": subject.id,
                "total_marks": 80,
                "duration_minutes": 180,
                "difficulty_distribution": {},
                "bloom_taxonomy_distribution": {},
                "question_type_distribution": {},
            },
        )
        assert response.status_code == 403


class TestCreateBlueprintFromAnalysis:
    def test_create_from_analysis_success(self, client, auth_headers, bank_questions, grade, subject):
        response = client.post(
            "/api/v1/question-blueprints/create-from-analysis",
            json={
                "blueprint_name": "Auto Blueprint",
                "board": "cbse",
                "grade_id": grade.id,
                "subject_id": subject.id,
                "year_start": 2020,
                "year_end": 2025,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["blueprint_name"] == "Auto Blueprint"
        assert data["total_marks"] == 100  # avg total_marks from the single fixture paper

    def test_create_from_analysis_no_data_returns_400(self, client, auth_headers, grade, subject):
        response = client.post(
            "/api/v1/question-blueprints/create-from-analysis",
            json={
                "blueprint_name": "Auto Blueprint",
                "board": "cbse",
                "grade_id": grade.id,
                "subject_id": subject.id,
            },
            headers=auth_headers,
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# List blueprints
# ---------------------------------------------------------------------------
class TestListBlueprints:
    def test_list_blueprints_scoped_to_own_institution(
        self, client, auth_headers, sample_blueprint, db_session, other_institution, grade, subject, admin_user
    ):
        other_blueprint = QuestionBlueprint(
            institution_id=other_institution.id,
            blueprint_name="Other Institution Blueprint",
            board="cbse",
            grade_id=grade.id,
            subject_id=subject.id,
            total_marks=100,
            duration_minutes=180,
            difficulty_distribution=json.dumps({}),
            bloom_taxonomy_distribution=json.dumps({}),
            question_type_distribution=json.dumps({}),
        )
        db_session.add(other_blueprint)
        db_session.commit()

        response = client.get("/api/v1/question-blueprints/", headers=auth_headers)
        assert response.status_code == 200
        names = [b["blueprint_name"] for b in response.json()]
        assert sample_blueprint.blueprint_name in names
        assert "Other Institution Blueprint" not in names

    def test_list_blueprints_filter_by_grade(self, client, auth_headers, sample_blueprint, grade):
        response = client.get(f"/api/v1/question-blueprints/?grade_id={grade.id}", headers=auth_headers)
        assert response.status_code == 200
        assert any(b["id"] == sample_blueprint.id for b in response.json())

    def test_list_blueprints_active_only_excludes_inactive(self, client, auth_headers, db_session, sample_blueprint):
        sample_blueprint.is_active = False
        db_session.commit()

        response = client.get("/api/v1/question-blueprints/?active_only=true", headers=auth_headers)
        assert response.status_code == 200
        assert all(b["id"] != sample_blueprint.id for b in response.json())

        response_all = client.get("/api/v1/question-blueprints/?active_only=false", headers=auth_headers)
        assert any(b["id"] == sample_blueprint.id for b in response_all.json())


# ---------------------------------------------------------------------------
# Get / update / delete blueprint
# ---------------------------------------------------------------------------
class TestGetBlueprint:
    def test_get_blueprint_success(self, client, auth_headers, sample_blueprint):
        response = client.get(f"/api/v1/question-blueprints/{sample_blueprint.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == sample_blueprint.id

    def test_get_blueprint_not_found(self, client, auth_headers):
        response = client.get("/api/v1/question-blueprints/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_blueprint_cross_institution_forbidden(self, client, other_admin_headers, sample_blueprint):
        response = client.get(f"/api/v1/question-blueprints/{sample_blueprint.id}", headers=other_admin_headers)
        assert response.status_code == 403


class TestUpdateBlueprint:
    def test_update_blueprint_success(self, client, auth_headers, sample_blueprint):
        response = client.put(
            f"/api/v1/question-blueprints/{sample_blueprint.id}",
            json={"blueprint_name": "Updated Blueprint", "total_marks": 120},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["blueprint_name"] == "Updated Blueprint"
        assert data["total_marks"] == 120

    def test_update_blueprint_distribution_reserialized_as_json(self, client, auth_headers, sample_blueprint):
        response = client.put(
            f"/api/v1/question-blueprints/{sample_blueprint.id}",
            json={"difficulty_distribution": {"medium": 100.0}},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert json.loads(response.json()["difficulty_distribution"]) == {"medium": 100.0}

    def test_update_blueprint_not_found(self, client, auth_headers):
        response = client.put(
            "/api/v1/question-blueprints/999999",
            json={"blueprint_name": "X"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_update_blueprint_cross_institution_forbidden(self, client, other_admin_headers, sample_blueprint):
        response = client.put(
            f"/api/v1/question-blueprints/{sample_blueprint.id}",
            json={"blueprint_name": "Hacked"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403


class TestDeleteBlueprint:
    def test_delete_blueprint_success(self, client, auth_headers, sample_blueprint):
        response = client.delete(f"/api/v1/question-blueprints/{sample_blueprint.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        get_response = client.get(f"/api/v1/question-blueprints/{sample_blueprint.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_blueprint_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/question-blueprints/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_blueprint_cross_institution_forbidden(self, client, other_admin_headers, sample_blueprint):
        response = client.delete(f"/api/v1/question-blueprints/{sample_blueprint.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Suggestions
# ---------------------------------------------------------------------------
class TestGenerateQuestionSuggestions:
    def test_generate_suggestions_success(self, client, auth_headers, sample_blueprint, bank_questions):
        response = client.get(
            f"/api/v1/question-blueprints/{sample_blueprint.id}/suggestions?include_predictions=false",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["blueprint_id"] == sample_blueprint.id
        assert data["total_suggestion_groups"] >= 1
        matched = data["suggestions"][0]
        assert matched["difficulty_level"] == "easy"
        assert matched["bloom_level"] == "remember"
        assert any("easy" in q["question_text"] for q in matched["suggested_questions"])

    def test_generate_suggestions_not_found(self, client, auth_headers):
        response = client.get(
            "/api/v1/question-blueprints/999999/suggestions",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_generate_suggestions_cross_institution_forbidden(self, client, other_admin_headers, sample_blueprint):
        response = client.get(
            f"/api/v1/question-blueprints/{sample_blueprint.id}/suggestions",
            headers=other_admin_headers,
        )
        assert response.status_code == 403
