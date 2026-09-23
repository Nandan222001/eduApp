"""Integration tests for the `search` router (src/api/v1/search.py).

Cross-entity search: a full `POST /search` global search across students,
teachers, assignments, previous-year papers and announcements (with
per-category filters); a lightweight `GET /search/quick` dropdown search;
per-user search history (list/clear); popularity-ranked search suggestions;
and available filter option lists (grades/subjects/sections/boards/years).
Every endpoint is institution-scoped via `get_current_institution_id`
(a `ContextVar` populated by `get_current_user`, which every endpoint here
also depends on -- FastAPI resolves dependencies in declaration order, and
`current_user` is always declared first, so by the time
`get_current_institution_id` runs the context is already set).

Bug found and fixed while writing this coverage:

1. **`current_user.role` (an ORM `Role` object) passed where a plain role
   slug string was expected** -- both `POST /search` and
   `GET /search/suggestions` did `user_role=current_user.role` (the SQLAlchemy
   relationship, i.e. a `Role` instance), but `SearchService` always threads
   that straight into `PopularSearch.role == user_role`, a plain `String`
   column. Comparing a column to an arbitrary mapped object (not a
   relationship comparison -- `PopularSearch.role` isn't a relationship) is
   not a valid SQL expression at all: every single call raised an
   unconditional `sqlalchemy.exc.ArgumentError: SQL expression element or
   literal value expected, got <Role ...>` -- meaning **`POST /search`, the
   router's main global-search feature, was 100% broken on every request**
   (it unconditionally calls `_update_popular_searches` at the end of
   `global_search`), and `GET /search/suggestions` was broken too. Fixed by
   passing `current_user.role.slug` (the plain string identifier, e.g.
   `"admin"`/`"teacher"`, matching how every other role comparison in this
   codebase works) instead of the ORM object.

Otherwise, no further bugs were found in this router, its service, or the
models it queries -- read `search_service.py` end to end (every query,
filter and enum/`.value` access) and `schemas/search.py` field-by-field
against the models it constructs response objects from (`Student`,
`Teacher`, `Assignment`, `PreviousYearPaper`, `Announcement`,
`SearchHistory`, `PopularSearch`); no metadata/metadata_json drift, no
async/sync mismatch, no route-shadowing, and no cross-tenant gap (every
query filters by `institution_id`, and history/suggestions are additionally
scoped to the requesting user).
"""
import uuid
from datetime import date, timedelta

import pytest


@pytest.fixture
def assignment(db_session, institution, subject, grade, section, teacher, academic_year):
    from src.models.assignment import Assignment, AssignmentStatus

    a = Assignment(
        institution_id=institution.id,
        title="Algebra Homework Chapter 5",
        description="Practice quadratic equations",
        subject_id=subject.id,
        grade_id=grade.id,
        section_id=section.id,
        teacher_id=teacher.id,
        due_date=date.today() + timedelta(days=7),
        max_marks=100,
        status=AssignmentStatus.PUBLISHED,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture
def paper(db_session, institution, subject, grade):
    from src.models.previous_year_papers import PreviousYearPaper, Board

    p = PreviousYearPaper(
        institution_id=institution.id,
        title="Algebra Final Exam 2022",
        description="Final exam covering algebra topics",
        subject_id=subject.id,
        grade_id=grade.id,
        board=Board.CBSE,
        year=2022,
        is_active=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def announcement(db_session, institution, admin_user):
    from src.models.notification import Announcement

    a = Announcement(
        institution_id=institution.id,
        created_by=admin_user.id,
        title="Algebra Club Meeting",
        content="Join us for an algebra study session this Friday.",
        audience_type="all",
        priority="medium",
        channels=["in_app"],
        is_published=True,
    )
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


# ===========================================================================
# POST /search
# ===========================================================================
class TestGlobalSearch:
    def test_requires_auth(self, client):
        response = client.post("/api/v1/search", json={"query": "algebra"})
        assert response.status_code == 403

    def test_search_finds_student_by_name(self, client, auth_headers, student):
        response = client.post(
            "/api/v1/search",
            json={"query": student.first_name, "search_types": ["students"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["total_results"] >= 1
        ids = [s["id"] for s in body["students"]]
        assert student.id in ids
        assert body["teachers"] == []

    def test_search_finds_teacher(self, client, auth_headers, teacher):
        response = client.post(
            "/api/v1/search",
            json={"query": teacher.employee_id, "search_types": ["teachers"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        ids = [t["id"] for t in response.json()["teachers"]]
        assert teacher.id in ids

    def test_search_finds_assignment(self, client, auth_headers, assignment):
        response = client.post(
            "/api/v1/search",
            json={"query": "algebra", "search_types": ["assignments"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        titles = [a["title"] for a in response.json()["assignments"]]
        assert assignment.title in titles

    def test_search_finds_paper(self, client, auth_headers, paper):
        response = client.post(
            "/api/v1/search",
            json={"query": "algebra", "search_types": ["papers"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        titles = [p["title"] for p in response.json()["papers"]]
        assert paper.title in titles

    def test_search_finds_announcement(self, client, auth_headers, announcement):
        response = client.post(
            "/api/v1/search",
            json={"query": "algebra", "search_types": ["announcements"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        titles = [a["title"] for a in response.json()["announcements"]]
        assert announcement.title in titles

    def test_search_across_all_types_by_default(self, client, auth_headers, student, teacher, assignment, paper, announcement):
        response = client.post(
            "/api/v1/search", json={"query": "algebra"}, headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert len(body["assignments"]) >= 1
        assert len(body["papers"]) >= 1
        assert len(body["announcements"]) >= 1
        assert body["total_results"] == (
            len(body["students"]) + len(body["teachers"]) + len(body["assignments"])
            + len(body["papers"]) + len(body["announcements"])
        )

    def test_search_scoped_to_own_institution(self, client, auth_headers, student, other_institution, db_session, section, academic_year):
        from src.models.student import Student

        foreign_student = Student(
            institution_id=other_institution.id,
            first_name="ZzzUnique",
            last_name="Foreign",
            is_active=True,
        )
        db_session.add(foreign_student)
        db_session.commit()

        response = client.post(
            "/api/v1/search",
            json={"query": "ZzzUnique", "search_types": ["students"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["students"] == []

    def test_search_with_grade_filter(self, client, auth_headers, student, grade):
        response = client.post(
            "/api/v1/search",
            json={
                "query": student.first_name,
                "search_types": ["students"],
                "filters": {"grade_id": grade.id},
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        ids = [s["id"] for s in response.json()["students"]]
        assert student.id in ids

    def test_search_no_results(self, client, auth_headers):
        response = client.post(
            "/api/v1/search",
            json={"query": "zzz_no_such_thing_zzz"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["total_results"] == 0

    def test_search_query_too_short_validation_error(self, client, auth_headers):
        response = client.post(
            "/api/v1/search", json={"query": ""}, headers=auth_headers
        )
        assert response.status_code == 422

    def test_search_saves_history(self, client, auth_headers, student, admin_user, db_session):
        from src.models.search import SearchHistory

        client.post(
            "/api/v1/search",
            json={"query": "algebra-history-test"},
            headers=auth_headers,
        )
        entry = db_session.query(SearchHistory).filter(
            SearchHistory.user_id == admin_user.id,
            SearchHistory.query == "algebra-history-test",
        ).first()
        assert entry is not None
        assert entry.institution_id == admin_user.institution_id


# ===========================================================================
# GET /search/quick
# ===========================================================================
class TestQuickSearch:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/search/quick", params={"q": "algebra"})
        assert response.status_code == 403

    def test_quick_search_mixed_results(self, client, auth_headers, assignment):
        response = client.get(
            "/api/v1/search/quick", params={"q": "algebra"}, headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert body["query"] == "algebra"
        types = {r["type"] for r in body["results"]}
        assert "assignment" in types

    def test_quick_search_missing_query_validation_error(self, client, auth_headers):
        response = client.get("/api/v1/search/quick", headers=auth_headers)
        assert response.status_code == 422

    def test_quick_search_respects_limit(self, client, auth_headers, db_session, institution, section, academic_year):
        from src.models.student import Student

        for i in range(8):
            db_session.add(Student(
                institution_id=institution.id,
                first_name=f"QuickBulk{i}",
                last_name="Test",
                is_active=True,
            ))
        db_session.commit()

        response = client.get(
            "/api/v1/search/quick",
            params={"q": "QuickBulk", "limit": 3},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()["results"]) <= 3


# ===========================================================================
# GET /search/history, DELETE /search/history
# ===========================================================================
class TestSearchHistory:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/search/history")
        assert response.status_code == 403

    def test_get_search_history_empty(self, client, auth_headers):
        response = client.get("/api/v1/search/history", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["items"] == []
        assert body["total"] == 0

    def test_get_search_history_after_searching(self, client, auth_headers):
        client.post("/api/v1/search", json={"query": "history-item-one"}, headers=auth_headers)
        client.post("/api/v1/search", json={"query": "history-item-two"}, headers=auth_headers)

        response = client.get("/api/v1/search/history", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 2
        queries = [item["query"] for item in body["items"]]
        assert "history-item-one" in queries
        assert "history-item-two" in queries

    def test_search_history_scoped_to_own_user(self, client, auth_headers, teacher_user):
        client.post("/api/v1/search", json={"query": "admins-own-search"}, headers=auth_headers)

        teacher_login = client.post(
            "/api/v1/auth/login",
            json={"email": teacher_user.email, "password": "password123"},
        )
        teacher_headers = {"Authorization": f"Bearer {teacher_login.json()['access_token']}"}

        response = client.get("/api/v1/search/history", headers=teacher_headers)
        assert response.status_code == 200
        assert response.json()["total"] == 0

    def test_clear_search_history(self, client, auth_headers):
        client.post("/api/v1/search", json={"query": "to-be-cleared"}, headers=auth_headers)

        response = client.delete("/api/v1/search/history", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Search history cleared successfully"

        history = client.get("/api/v1/search/history", headers=auth_headers)
        assert history.json()["total"] == 0


# ===========================================================================
# GET /search/suggestions
# ===========================================================================
class TestSearchSuggestions:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/search/suggestions", params={"q": "al"})
        assert response.status_code == 403

    def test_suggestions_from_history(self, client, auth_headers):
        client.post("/api/v1/search", json={"query": "suggestion-source-query"}, headers=auth_headers)

        response = client.get(
            "/api/v1/search/suggestions", params={"q": "suggestion-source"}, headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        queries = [s["query"] for s in body["suggestions"]]
        assert "suggestion-source-query" in queries
        assert all(s["type"] == "history" for s in body["suggestions"])

    def test_suggestions_missing_query_validation_error(self, client, auth_headers):
        response = client.get("/api/v1/search/suggestions", headers=auth_headers)
        assert response.status_code == 422


# ===========================================================================
# GET /search/filters
# ===========================================================================
class TestSearchFilters:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/search/filters")
        assert response.status_code == 403

    def test_get_filter_options(self, client, auth_headers, grade, subject, section):
        response = client.get("/api/v1/search/filters", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        grade_ids = [g["id"] for g in body["grades"]]
        subject_ids = [s["id"] for s in body["subjects"]]
        section_ids = [s["id"] for s in body["sections"]]
        assert grade.id in grade_ids
        assert subject.id in subject_ids
        assert section.id in section_ids
        assert "cbse" in body["boards"]
        assert "active" in body["statuses"]

    def test_filter_options_scoped_to_own_institution(self, client, auth_headers, other_institution, db_session):
        from src.models.academic import Grade, AcademicYear

        other_year = AcademicYear(
            institution_id=other_institution.id,
            name="2099-2100",
            start_date=date(2099, 4, 1),
            end_date=date(2100, 3, 31),
            is_current=True,
        )
        db_session.add(other_year)
        db_session.commit()
        db_session.refresh(other_year)

        foreign_grade = Grade(
            institution_id=other_institution.id,
            academic_year_id=other_year.id,
            name="ForeignGradeXYZ",
            display_order=99,
            is_active=True,
        )
        db_session.add(foreign_grade)
        db_session.commit()

        response = client.get("/api/v1/search/filters", headers=auth_headers)
        assert response.status_code == 200
        grade_names = [g["name"] for g in response.json()["grades"]]
        assert "ForeignGradeXYZ" not in grade_names


@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution

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
