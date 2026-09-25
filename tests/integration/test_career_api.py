"""Integration tests for the `career` router (src/api/v1/career.py).

Career pathways (CRUD), student career profiles, ML-scored career
recommendations, skill-gap analysis, personalized learning paths, mock labor
market data, and industry mentor matching. Every endpoint already had a real
`Depends(get_current_user)`.

Bug found and fixed while writing this coverage (`career_service.py`,
model/schema drift, bug class 11): `_get_academic_performance`/
`_get_top_subjects` (used by `build_student_profile_from_data`, which
`generate_career_recommendations` falls back to whenever a student has no
career profile yet) queried `ExamMarks.subject_id`, `ExamMarks.marks_obtained`
and `ExamMarks.total_marks` -- none of which exist on that model.
`ExamMarks` only has `exam_subject_id` (a join key), `theory_marks_obtained`
and `practical_marks_obtained`; `subject_id` and the max-marks columns
(`theory_max_marks`/`practical_max_marks`) live on the joined `ExamSubject`
row. `_get_top_subjects` built the bad `ExamMarks.subject_id` reference
directly into its query, so it raised `AttributeError` on **every** call
regardless of whether the student had any exam records at all --
`POST /career/recommendations/generate` was 100% broken for any student
without a pre-existing profile. `_get_academic_performance` only crashed
once a student had at least one real exam record (empty-list short-circuits
before touching the bad attributes). Fixed by joining `ExamSubject` and
reading the real columns; also explicitly `float()`-cast the `func.avg(...)`
results in `_get_top_subjects` (bug class 4) before they're written into
`StudentCareerProfile.top_subjects`, a JSON column -- the raw `Decimal`
pymysql returns isn't JSON-serializable and would otherwise raise `TypeError`
on commit.

Otherwise read `career_service.py` end to end against `models/career.py` and
`schemas/career.py` field-by-field, no further drift found (including the
`IndustryMentor.total_mentorships`/`average_rating`/`is_verified`/
`verified_at` columns the response schema reads), no async/sync mismatch,
no `func.count(...).filter(...)` SQL-FILTER misuse, salary/score Decimal
fields elsewhere are already explicitly `float()`-cast before being put into
plain dicts, and `career_recommender.py`'s scoring is pure rule-based Python
(no dependency on the untrained sklearn models actually being fit).
"""
import pytest


BASE = "/api/v1/career"


@pytest.fixture
def other_institution(db_session):
    import uuid
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


def _pathway_payload(**overrides):
    payload = {
        "title": "Software Engineer",
        "description": "Builds and maintains software systems",
        "category": "technology",
        "industry": "technology",
        "required_education": "bachelor_degree",
        "required_skills": [{"name": "Python", "level": "intermediate", "importance": "high"}],
        "personality_match": [{"type": "investigative"}, {"type": "realistic"}],
        "average_salary_min": "60000.00",
        "average_salary_max": "120000.00",
        "job_growth_rate": "12.50",
        "demand_level": "high",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def pathway(client, auth_headers, institution):
    response = client.post(
        f"{BASE}/pathways",
        json=_pathway_payload(institution_id=institution.id),
        headers=auth_headers,
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def career_student(db_session, institution, student_user, section, academic_year):
    from src.models.student import Student
    from datetime import datetime

    s = Student(
        institution_id=institution.id,
        user_id=student_user.id,
        admission_number="ADM-CAREER-1",
        first_name=student_user.first_name,
        last_name=student_user.last_name,
        email=student_user.email,
        section_id=section.id,
        date_of_birth=datetime(2008, 3, 20).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Female",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


class TestCareerPathwayCRUD:
    def test_create_requires_auth(self, client, institution):
        response = client.post(f"{BASE}/pathways", json=_pathway_payload(institution_id=institution.id))
        assert response.status_code == 403

    def test_create_pathway(self, client, auth_headers, institution):
        response = client.post(
            f"{BASE}/pathways",
            json=_pathway_payload(institution_id=institution.id),
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["title"] == "Software Engineer"
        assert body["average_salary_min"] == "60000.00" or float(body["average_salary_min"]) == 60000.00

    def test_list_pathways(self, client, auth_headers, pathway):
        response = client.get(f"{BASE}/pathways", headers=auth_headers)
        assert response.status_code == 200
        titles = [p["title"] for p in response.json()]
        assert "Software Engineer" in titles

    def test_list_pathways_requires_auth(self, client):
        response = client.get(f"{BASE}/pathways")
        assert response.status_code == 403

    def test_get_pathway(self, client, auth_headers, pathway):
        response = client.get(f"{BASE}/pathways/{pathway['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == pathway["id"]

    def test_get_pathway_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/pathways/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_pathway(self, client, auth_headers, pathway):
        response = client.put(
            f"{BASE}/pathways/{pathway['id']}",
            json={"demand_level": "very_high"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["demand_level"] == "very_high"

    def test_update_pathway_not_found(self, client, auth_headers):
        response = client.put(
            f"{BASE}/pathways/999999",
            json={"demand_level": "very_high"},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestStudentCareerProfile:
    def test_create_profile_requires_auth(self, client, career_student, institution):
        response = client.post(
            f"{BASE}/profiles",
            json={"student_id": career_student.id, "institution_id": institution.id, "interests": []},
        )
        assert response.status_code == 403

    def test_create_and_get_profile(self, client, auth_headers, career_student, institution):
        response = client.post(
            f"{BASE}/profiles",
            json={
                "student_id": career_student.id,
                "institution_id": institution.id,
                "interests": [{"category": "technology", "level": "high"}],
                "current_skills": [{"name": "Python", "level": "intermediate"}],
                "personality_type": "investigative",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["student_id"] == career_student.id
        assert float(body["profile_completeness"]) > 0

        get_resp = client.get(f"{BASE}/profiles/{career_student.id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["student_id"] == career_student.id

    def test_get_profile_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/profiles/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_profile_creates_if_missing(self, client, auth_headers, career_student):
        response = client.put(
            f"{BASE}/profiles/{career_student.id}",
            json={"career_goals": ["Become a software engineer"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["career_goals"] == ["Become a software engineer"]


class TestRecommendationsAndSkillGap:
    def test_generate_recommendations(self, client, auth_headers, career_student, institution, pathway):
        response = client.post(
            f"{BASE}/recommendations/generate",
            json={"student_id": career_student.id, "institution_id": institution.id, "top_n": 5},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["career_pathway_id"] == pathway["id"]
        assert 0 <= float(body[0]["match_score"]) <= 100

    def test_generate_recommendations_no_pathways_404(self, client, auth_headers, career_student, institution):
        response = client.post(
            f"{BASE}/recommendations/generate",
            json={"student_id": career_student.id, "institution_id": institution.id},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_get_student_recommendations_empty_without_profile(self, client, auth_headers, career_student):
        response = client.get(f"{BASE}/recommendations/{career_student.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_analyze_skill_gap_requires_profile(self, client, auth_headers, career_student, institution, pathway):
        response = client.post(
            f"{BASE}/skill-gap/analyze",
            json={
                "student_id": career_student.id,
                "institution_id": institution.id,
                "career_pathway_id": pathway["id"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_analyze_skill_gap(self, client, auth_headers, career_student, institution, pathway):
        client.post(
            f"{BASE}/profiles",
            json={
                "student_id": career_student.id,
                "institution_id": institution.id,
                "current_skills": [{"name": "HTML", "level": "beginner"}],
            },
            headers=auth_headers,
        )
        response = client.post(
            f"{BASE}/skill-gap/analyze",
            json={
                "student_id": career_student.id,
                "institution_id": institution.id,
                "career_pathway_id": pathway["id"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["career_pathway_id"] == pathway["id"]
        assert any(g["name"] == "Python" for g in body["skill_gaps"])


class TestLearningPaths:
    def test_create_learning_path(self, client, auth_headers, career_student, institution, pathway):
        client.post(
            f"{BASE}/profiles",
            json={"student_id": career_student.id, "institution_id": institution.id},
            headers=auth_headers,
        )
        response = client.post(
            f"{BASE}/learning-paths",
            json={
                "student_id": career_student.id,
                "institution_id": institution.id,
                "career_pathway_id": pathway["id"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["target_career"] == "Software Engineer"
        path_id = body["id"]

        list_resp = client.get(f"{BASE}/learning-paths/{career_student.id}", headers=auth_headers)
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

        update_resp = client.put(
            f"{BASE}/learning-paths/{path_id}",
            json={"priority": 3},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["priority"] == 3

    def test_update_learning_path_not_found(self, client, auth_headers):
        response = client.put(
            f"{BASE}/learning-paths/999999",
            json={"priority": 2},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_learning_path_scoped_to_institution(self, client, auth_headers, career_student, institution, pathway, other_institution, db_session):
        """A learning path belonging to another institution must 404 rather
        than being updatable -- update_learning_path filters by both id and
        current_user.institution_id."""
        from src.models.career import PersonalizedLearningPath, StudentCareerProfile

        profile = StudentCareerProfile(
            institution_id=other_institution.id,
            student_id=career_student.id,
            profile_completeness=0,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)

        foreign_path = PersonalizedLearningPath(
            institution_id=other_institution.id,
            student_profile_id=profile.id,
            title="Foreign Path",
            recommended_courses=[],
        )
        db_session.add(foreign_path)
        db_session.commit()
        db_session.refresh(foreign_path)

        response = client.put(
            f"{BASE}/learning-paths/{foreign_path.id}",
            json={"priority": 9},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestLaborMarketData:
    def test_get_labor_market_data_requires_auth(self, client, pathway):
        response = client.get(f"{BASE}/labor-market/{pathway['id']}")
        assert response.status_code == 403

    def test_get_labor_market_data_mock_fallback(self, client, auth_headers, pathway):
        response = client.get(f"{BASE}/labor-market/{pathway['id']}", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["data_source"] == "Mock Data"
        assert body["median_salary"] == 75000

    def test_get_labor_market_data_pathway_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/labor-market/999999", headers=auth_headers)
        assert response.status_code == 404


class TestIndustryMentors:
    def _mentor_payload(self, **overrides):
        payload = {
            "first_name": "Jane",
            "last_name": "Mentor",
            "email": "jane.mentor@example.com",
            "current_position": "Senior Engineer",
            "company": "TechCorp",
            "industry": "technology",
            "expertise_areas": ["python", "machine learning"],
            "personality_type": "investigative",
        }
        payload.update(overrides)
        return payload

    def test_create_mentor_requires_auth(self, client):
        response = client.post(f"{BASE}/mentors", json=self._mentor_payload())
        assert response.status_code == 403

    def test_create_and_get_mentor(self, client, auth_headers):
        response = client.post(f"{BASE}/mentors", json=self._mentor_payload(), headers=auth_headers)
        assert response.status_code == 201
        mentor = response.json()

        get_resp = client.get(f"{BASE}/mentors/{mentor['id']}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["email"] == "jane.mentor@example.com"

    def test_get_mentor_not_found(self, client, auth_headers):
        response = client.get(f"{BASE}/mentors/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_list_mentors(self, client, auth_headers):
        client.post(f"{BASE}/mentors", json=self._mentor_payload(email="a@example.com"), headers=auth_headers)
        response = client.get(f"{BASE}/mentors", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_match_and_accept_mentor(self, client, auth_headers, career_student, institution):
        client.post(
            f"{BASE}/profiles",
            json={
                "student_id": career_student.id,
                "institution_id": institution.id,
                "preferred_industries": ["technology"],
                "personality_type": "investigative",
            },
            headers=auth_headers,
        )
        client.post(
            f"{BASE}/mentors",
            json=self._mentor_payload(email="match@example.com"),
            headers=auth_headers,
        )

        response = client.post(
            f"{BASE}/mentor-matches",
            json={"student_id": career_student.id, "institution_id": institution.id, "top_n": 3},
            headers=auth_headers,
        )
        assert response.status_code == 200
        matches = response.json()
        assert len(matches) == 1
        match_id = matches[0]["id"]
        assert float(matches[0]["match_score"]) > 0

        accept_resp = client.post(
            f"{BASE}/mentor-matches/accept",
            json={"match_id": match_id, "goals": [{"goal": "Learn ML"}]},
            headers=auth_headers,
        )
        assert accept_resp.status_code == 200
        assert accept_resp.json()["status"] == "matched"

        list_resp = client.get(f"{BASE}/mentor-matches/{career_student.id}", headers=auth_headers)
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

    def test_match_mentors_requires_profile(self, client, auth_headers, career_student, institution):
        response = client.post(
            f"{BASE}/mentor-matches",
            json={"student_id": career_student.id, "institution_id": institution.id},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_accept_mentor_match_not_found(self, client, auth_headers):
        response = client.post(
            f"{BASE}/mentor-matches/accept",
            json={"match_id": 999999},
            headers=auth_headers,
        )
        assert response.status_code == 404
