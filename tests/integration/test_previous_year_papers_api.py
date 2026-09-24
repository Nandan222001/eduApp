"""Integration tests for the `previous_year_papers` router
(src/api/v1/previous_year_papers.py).

This router was already fully authenticated and institution-scoped end to
end when reviewed this pass -- no auth or cross-tenant gaps were found on
any of its 12 endpoints. One real gap was found and fixed:

1. **`POST /` (create_paper) never overrode `uploaded_by`** -- it is a
   client-suppliable field on `PreviousYearPaperCreate`, so any caller could
   attribute a paper's upload to an arbitrary user id. Fixed by forcing it to
   `current_user.id` regardless of what the request body sends;
   `test_create_paper_ignores_spoofed_uploaded_by` is the regression test.

The rest of this file confirms the pre-existing institution scoping (403s on
another institution's paper, and that `/facets`/`/statistics` -- both static
routes registered ahead of the dynamic `/{paper_id}` route -- are not
shadowed by it) plus the PDF upload/OCR/view/download flows.
"""
import uuid
from datetime import date
from unittest.mock import patch

import pytest

from src.models.institution import Institution
from src.models.previous_year_papers import PreviousYearPaper
from src.models.user import User
from src.utils.security import get_password_hash


@pytest.fixture
def other_institution(db_session):
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
def other_admin_user(db_session, other_institution, admin_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheradmin{suffix}",
        email=f"otheradmin{suffix}@otherschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=admin_role.id,
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
def paper(db_session, institution, grade, subject, admin_user) -> PreviousYearPaper:
    p = PreviousYearPaper(
        institution_id=institution.id,
        title="CBSE Class 10 Maths 2023",
        board="cbse",
        year=2023,
        grade_id=grade.id,
        subject_id=subject.id,
        total_marks=80,
        uploaded_by=admin_user.id,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def other_paper(db_session, other_institution) -> PreviousYearPaper:
    from src.models.academic import AcademicYear, Grade, Subject

    academic_year = AcademicYear(
        institution_id=other_institution.id,
        name="2024-2025",
        start_date=date(2024, 4, 1),
        end_date=date(2025, 3, 31),
        is_current=True,
    )
    db_session.add(academic_year)
    db_session.commit()
    db_session.refresh(academic_year)

    grade = Grade(
        institution_id=other_institution.id,
        academic_year_id=academic_year.id,
        name="Grade 10",
        display_order=10,
        is_active=True,
    )
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)

    subject = Subject(
        institution_id=other_institution.id,
        name="Maths",
        code=f"MATH{uuid.uuid4().hex[:6]}",
        is_active=True,
    )
    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)

    p = PreviousYearPaper(
        institution_id=other_institution.id,
        title="Other Institution Paper",
        board="icse",
        year=2022,
        grade_id=grade.id,
        subject_id=subject.id,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
def test_list_papers_requires_auth(client):
    response = client.get("/api/v1/previous-year-papers/")
    assert response.status_code in (401, 403)


def test_create_paper_requires_auth(client, institution, grade, subject):
    response = client.post(
        "/api/v1/previous-year-papers/",
        json={
            "title": "Test Paper",
            "board": "cbse",
            "year": 2023,
            "grade_id": grade.id,
            "subject_id": subject.id,
            "institution_id": institution.id,
        },
    )
    assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Cross-tenant scoping
# ---------------------------------------------------------------------------
def test_create_paper_forbidden_for_other_institution(client, auth_headers, other_institution, grade, subject):
    response = client.post(
        "/api/v1/previous-year-papers/",
        json={
            "title": "Sneaky Paper",
            "board": "cbse",
            "year": 2023,
            "grade_id": grade.id,
            "subject_id": subject.id,
            "institution_id": other_institution.id,
        },
        headers=auth_headers,
    )
    assert response.status_code == 403


def test_get_paper_from_other_institution_is_forbidden(client, auth_headers, other_paper):
    response = client.get(f"/api/v1/previous-year-papers/{other_paper.id}", headers=auth_headers)
    assert response.status_code == 403


def test_update_paper_from_other_institution_is_forbidden(client, auth_headers, other_paper):
    response = client.put(
        f"/api/v1/previous-year-papers/{other_paper.id}",
        json={"title": "Hacked title"},
        headers=auth_headers,
    )
    assert response.status_code == 403


def test_delete_paper_from_other_institution_is_forbidden(client, auth_headers, other_paper):
    response = client.delete(f"/api/v1/previous-year-papers/{other_paper.id}", headers=auth_headers)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Route-shadowing: /facets and /statistics must resolve before /{paper_id}
# ---------------------------------------------------------------------------
def test_facets_route_not_shadowed_by_paper_id_route(client, auth_headers, paper):
    response = client.get("/api/v1/previous-year-papers/facets", headers=auth_headers)
    assert response.status_code == 200, response.text
    assert "boards" in response.json()


def test_statistics_route_not_shadowed_by_paper_id_route(client, auth_headers, paper):
    response = client.get("/api/v1/previous-year-papers/statistics", headers=auth_headers)
    assert response.status_code == 200, response.text
    assert response.json()["total_papers"] >= 1


# ---------------------------------------------------------------------------
# CRUD + regression: spoofed uploaded_by
# ---------------------------------------------------------------------------
def test_create_paper_ignores_spoofed_uploaded_by(client, auth_headers, admin_user, institution, grade, subject):
    response = client.post(
        "/api/v1/previous-year-papers/",
        json={
            "title": "Test Paper",
            "board": "cbse",
            "year": 2023,
            "grade_id": grade.id,
            "subject_id": subject.id,
            "institution_id": institution.id,
            "uploaded_by": 999999,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["uploaded_by"] == admin_user.id
    assert data["uploaded_by"] != 999999


def test_list_papers_scoped_to_own_institution(client, auth_headers, paper, other_paper):
    response = client.get("/api/v1/previous-year-papers/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    ids = [item["id"] for item in data["items"]]
    assert paper.id in ids
    assert other_paper.id not in ids


def test_get_paper_success(client, auth_headers, paper):
    response = client.get(f"/api/v1/previous-year-papers/{paper.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == paper.id


def test_update_paper_success(client, auth_headers, paper):
    response = client.put(
        f"/api/v1/previous-year-papers/{paper.id}",
        json={"title": "Updated Title", "is_active": False},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["is_active"] is False


def test_delete_paper_success(client, auth_headers, paper):
    response = client.delete(f"/api/v1/previous-year-papers/{paper.id}", headers=auth_headers)
    assert response.status_code == 204

    follow_up = client.get(f"/api/v1/previous-year-papers/{paper.id}", headers=auth_headers)
    assert follow_up.status_code == 404


# ---------------------------------------------------------------------------
# PDF upload / OCR / view / download
# ---------------------------------------------------------------------------
def test_upload_pdf_rejects_non_pdf_content_type(client, auth_headers, paper):
    response = client.post(
        f"/api/v1/previous-year-papers/{paper.id}/upload-pdf",
        headers=auth_headers,
        files={"file": ("notes.txt", b"not a pdf", "text/plain")},
    )
    assert response.status_code == 400


def test_upload_pdf_success(client, auth_headers, paper):
    with patch(
        "src.services.previous_year_papers_service.s3_client.upload_file",
        return_value="https://test-bucket.s3.amazonaws.com/previous_year_papers/fake-key.pdf",
    ):
        response = client.post(
            f"/api/v1/previous-year-papers/{paper.id}/upload-pdf",
            headers=auth_headers,
            files={"file": ("paper.pdf", b"%PDF-1.4 fake content", "application/pdf")},
        )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["pdf_file_name"] == "paper.pdf"
    assert data["pdf_file_size"] == len(b"%PDF-1.4 fake content")


def test_process_ocr_success(client, auth_headers, paper):
    response = client.post(
        f"/api/v1/previous-year-papers/{paper.id}/process-ocr",
        json={"paper_id": paper.id, "ocr_text": "Question 1: Solve for x."},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["ocr_processed"] is True

    with_ocr = client.get(f"/api/v1/previous-year-papers/{paper.id}/with-ocr", headers=auth_headers)
    assert with_ocr.status_code == 200
    assert with_ocr.json()["ocr_text"] == "Question 1: Solve for x."


def test_view_and_download_counts_increment(client, auth_headers, paper):
    view_response = client.post(f"/api/v1/previous-year-papers/{paper.id}/view", headers=auth_headers)
    assert view_response.status_code == 204

    download_response = client.post(f"/api/v1/previous-year-papers/{paper.id}/download", headers=auth_headers)
    assert download_response.status_code == 204

    detail = client.get(f"/api/v1/previous-year-papers/{paper.id}", headers=auth_headers)
    assert detail.json()["view_count"] == 1
    assert detail.json()["download_count"] == 1
