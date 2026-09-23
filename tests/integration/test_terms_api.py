"""Integration tests for the `terms` router (src/api/v1/terms.py).

Unlike its sibling academic-structure routers, this router talks to the
`Term` model directly (no service layer) -- so it originally had none of
the duplicate-name/parent-ownership guards its siblings get "for free"
from AcademicYearService/GradeService/etc. Bugs fixed as part of this
pass (see the commit message for full detail):

1. `create_term` never verified `academic_year_id` belongs to the
   caller's institution (cross-tenant FK reference -- a user could file a
   Term against another institution's AcademicYear as long as they passed
   their own `institution_id`). Now 404s with "Academic year not found".
2. `create_term`/`update_term` never checked for a duplicate
   (academic_year_id, name) pair before insert/rename, so violating the
   model's `uq_academic_year_term_name` unique constraint raised an
   unhandled `IntegrityError` (500) instead of a clean 400. Now both
   check first and return 400.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.academic import AcademicYear, Term, TermType
from src.utils.security import get_password_hash


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
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_academic_year(db_session, other_institution) -> AcademicYear:
    year = AcademicYear(
        institution_id=other_institution.id,
        name="Other 2023-2024",
        start_date="2023-04-01",
        end_date="2024-03-31",
        is_active=True,
        is_current=True,
    )
    db_session.add(year)
    db_session.commit()
    db_session.refresh(year)
    return year


@pytest.fixture
def term(db_session, institution, academic_year) -> Term:
    term = Term(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        name="Term 1",
        term_type=TermType.SEMESTER,
        start_date="2023-04-01",
        end_date="2023-09-30",
        display_order=1,
    )
    db_session.add(term)
    db_session.commit()
    db_session.refresh(term)
    return term


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------
class TestCreateTerm:
    def test_create_happy_path(self, client, auth_headers, institution, academic_year):
        response = client.post(
            "/api/v1/terms/",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "name": "Term 1",
                "term_type": "semester",
                "start_date": "2023-04-01",
                "end_date": "2023-09-30",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Term 1"
        assert data["term_type"] == "semester"
        assert data["academic_year_id"] == academic_year.id

    def test_create_cross_institution_forbidden(self, client, auth_headers, other_institution, other_academic_year):
        response = client.post(
            "/api/v1/terms/",
            json={
                "institution_id": other_institution.id,
                "academic_year_id": other_academic_year.id,
                "name": "Term 1",
                "term_type": "semester",
                "start_date": "2023-04-01",
                "end_date": "2023-09-30",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_with_other_institutions_academic_year_not_found(
        self, client, auth_headers, institution, other_academic_year
    ):
        """Regression test: institution_id belongs to the caller, but
        academic_year_id references another institution's row entirely.
        """
        response = client.post(
            "/api/v1/terms/",
            json={
                "institution_id": institution.id,
                "academic_year_id": other_academic_year.id,
                "name": "Term 1",
                "term_type": "semester",
                "start_date": "2023-04-01",
                "end_date": "2023-09-30",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_create_academic_year_does_not_exist(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/terms/",
            json={
                "institution_id": institution.id,
                "academic_year_id": 999999,
                "name": "Term 1",
                "term_type": "semester",
                "start_date": "2023-04-01",
                "end_date": "2023-09-30",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_create_duplicate_name_in_same_year_returns_400(self, client, auth_headers, institution, academic_year, term):
        response = client.post(
            "/api/v1/terms/",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "name": term.name,
                "term_type": "semester",
                "start_date": "2023-10-01",
                "end_date": "2024-03-31",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_invalid_term_type_returns_422(self, client, auth_headers, institution, academic_year):
        response = client.post(
            "/api/v1/terms/",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "name": "Bad Term",
                "term_type": "not-a-real-type",
                "start_date": "2023-04-01",
                "end_date": "2023-09-30",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------
class TestListTerms:
    def test_list_default(self, client, auth_headers, term):
        response = client.get("/api/v1/terms/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(item["id"] == term.id for item in data["items"])

    def test_list_only_returns_own_institution(self, client, auth_headers, other_institution, other_academic_year, db_session):
        other_term = Term(
            institution_id=other_institution.id,
            academic_year_id=other_academic_year.id,
            name="Other Term",
            term_type=TermType.SEMESTER,
            start_date="2023-04-01",
            end_date="2023-09-30",
        )
        db_session.add(other_term)
        db_session.commit()

        response = client.get("/api/v1/terms/", headers=auth_headers)
        ids = [item["id"] for item in response.json()["items"]]
        assert other_term.id not in ids

    def test_list_filter_by_academic_year(self, client, auth_headers, institution, academic_year, term, db_session):
        second_year = AcademicYear(
            institution_id=institution.id,
            name="2024-2025",
            start_date="2024-04-01",
            end_date="2025-03-31",
        )
        db_session.add(second_year)
        db_session.commit()
        db_session.refresh(second_year)
        second_term = Term(
            institution_id=institution.id,
            academic_year_id=second_year.id,
            name="Term A",
            term_type=TermType.QUARTER,
            start_date="2024-04-01",
            end_date="2024-06-30",
        )
        db_session.add(second_term)
        db_session.commit()

        response = client.get(f"/api/v1/terms/?academic_year_id={academic_year.id}", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert term.id in ids
        assert second_term.id not in ids

    def test_list_pagination(self, client, auth_headers, institution, academic_year, db_session):
        for i in range(3):
            db_session.add(Term(
                institution_id=institution.id,
                academic_year_id=academic_year.id,
                name=f"Pag Term {i}",
                term_type=TermType.CUSTOM,
                start_date="2023-04-01",
                end_date="2023-09-30",
                display_order=i,
            ))
        db_session.commit()

        response = client.get("/api/v1/terms/?skip=0&limit=2", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["items"]) == 2


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------
class TestGetTerm:
    def test_get_happy_path(self, client, auth_headers, term):
        response = client.get(f"/api/v1/terms/{term.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == term.id

    def test_get_not_found(self, client, auth_headers):
        response = client.get("/api/v1/terms/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_forbidden(self, client, other_admin_headers, term):
        response = client.get(f"/api/v1/terms/{term.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------
class TestUpdateTerm:
    def test_update_happy_path(self, client, auth_headers, term):
        response = client.put(
            f"/api/v1/terms/{term.id}",
            json={"name": "Term 1 Renamed", "is_active": False},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Term 1 Renamed"
        assert data["is_active"] is False

    def test_update_not_found(self, client, auth_headers):
        response = client.put("/api/v1/terms/999999", json={"name": "Nope"}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_cross_institution_forbidden(self, client, other_admin_headers, term):
        response = client.put(f"/api/v1/terms/{term.id}", json={"name": "Hijacked"}, headers=other_admin_headers)
        assert response.status_code == 403

    def test_update_duplicate_name_returns_400(self, client, auth_headers, institution, academic_year, term, db_session):
        second_term = Term(
            institution_id=institution.id,
            academic_year_id=academic_year.id,
            name="Term 2",
            term_type=TermType.SEMESTER,
            start_date="2023-10-01",
            end_date="2024-03-31",
        )
        db_session.add(second_term)
        db_session.commit()
        db_session.refresh(second_term)

        response = client.put(
            f"/api/v1/terms/{second_term.id}",
            json={"name": term.name},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_update_same_name_is_a_noop_not_a_conflict(self, client, auth_headers, term):
        """Renaming a term to its own current name must not trip the
        duplicate check against itself.
        """
        response = client.put(
            f"/api/v1/terms/{term.id}",
            json={"name": term.name, "description": "still fine"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["description"] == "still fine"


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------
class TestDeleteTerm:
    def test_delete_happy_path(self, client, auth_headers, term):
        response = client.delete(f"/api/v1/terms/{term.id}", headers=auth_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/terms/{term.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/terms/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_forbidden(self, client, other_admin_headers, term):
        response = client.delete(f"/api/v1/terms/{term.id}", headers=other_admin_headers)
        assert response.status_code == 403
