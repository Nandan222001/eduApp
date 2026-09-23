import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.role import Role
from src.models.student import Student
from src.models.user import User
from src.models.yearbook import YearbookEdition
from src.utils.security import get_password_hash

BASE = "/api/v1/yearbook"


@pytest.fixture
def student_auth_headers(client: TestClient, student: Student, student_user: User) -> dict:
    """Real login (not a hand-crafted JWT) so a matching session exists in
    the client fixture's fake Redis -- get_current_user needs both. The
    `student` fixture (from conftest.py) is already tied to `student_user`
    via user_id, which is what the yearbook router looks up for every
    student-only endpoint (signatures, submissions)."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def edition(db_session: Session, institution: Institution, admin_user: User) -> YearbookEdition:
    edition = YearbookEdition(
        institution_id=institution.id,
        created_by=admin_user.id,
        academic_year="2024-2025",
        theme="New Horizons",
        publication_status="draft",
    )
    db_session.add(edition)
    db_session.commit()
    db_session.refresh(edition)
    return edition


@pytest.mark.integration
class TestYearbookAPI:
    """Integration tests for /api/v1/yearbook/*, the real, mounted router
    (src/api/v1/yearbook.py) backed by src/models/yearbook.py and
    src/schemas/yearbook.py (both written this session, see
    TESTING_PROGRESS.md). No external services (S3, PDF rendering) are
    involved anywhere in this router -- /editions/{id}/generate-pdf just
    returns a static "processing started" dict without touching S3 or a
    real PDF renderer, so it's covered end-to-end like everything else
    here; the only thing genuinely skipped is uploading an actual binary
    photo file, since this router's photo-submission endpoint takes a JSON
    body with a pre-computed photo_url/s3_key (the real upload-to-S3 step
    lives elsewhere, not in this router)."""

    # ---------------------------------------------------------------
    # Editions
    # ---------------------------------------------------------------

    def test_create_and_get_edition_with_stats(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            f"{BASE}/editions",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year": "2025-2026",
                "theme": "Rising Stars",
                "is_public": False,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["academic_year"] == "2025-2026"
        assert data["publication_status"] == "draft"
        edition_id = data["id"]

        response = client.get(f"{BASE}/editions/{edition_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_pages"] == 0
        assert data["total_signatures"] == 0
        assert data["pending_submissions"] == 0
        assert data["approved_submissions"] == 0

    def test_create_edition_duplicate_academic_year_conflict(
        self, client: TestClient, auth_headers: dict, institution: Institution, edition: YearbookEdition
    ):
        response = client.post(
            f"{BASE}/editions",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "academic_year": edition.academic_year,
            },
        )
        assert response.status_code == 400

    def test_create_edition_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other_institution = Institution(name="Other School", is_active=True)
        db_session.add(other_institution)
        db_session.commit()
        db_session.refresh(other_institution)

        response = client.post(
            f"{BASE}/editions",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "academic_year": "2025-2026",
            },
        )
        assert response.status_code == 403

    def test_list_editions_with_filters(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition
    ):
        response = client.get(f"{BASE}/editions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(e["id"] == edition.id for e in data["items"])

        response = client.get(
            f"{BASE}/editions",
            headers=auth_headers,
            params={"academic_year": edition.academic_year},
        )
        assert response.status_code == 200
        assert all(e["academic_year"] == edition.academic_year for e in response.json()["items"])

        response = client.get(
            f"{BASE}/editions", headers=auth_headers, params={"status": "published"}
        )
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_update_edition_publish_sets_published_at(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition
    ):
        response = client.put(
            f"{BASE}/editions/{edition.id}",
            headers=auth_headers,
            json={"publication_status": "published", "is_public": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["publication_status"] == "published"
        assert data["published_at"] is not None

    def test_update_and_delete_edition_not_found(self, client: TestClient, auth_headers: dict):
        response = client.put(
            f"{BASE}/editions/999999", headers=auth_headers, json={"theme": "x"}
        )
        assert response.status_code == 404

        response = client.delete(f"{BASE}/editions/999999", headers=auth_headers)
        assert response.status_code == 404

    # ---------------------------------------------------------------
    # Pages
    # ---------------------------------------------------------------

    def test_create_and_list_pages(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition
    ):
        response = client.post(
            f"{BASE}/pages",
            headers=auth_headers,
            json={
                "edition_id": edition.id,
                "page_number": 1,
                "section": "cover",
                "photos": [{"photo_url": "https://example.com/p1.jpg", "caption": "Cover"}],
            },
        )
        assert response.status_code == 201
        page = response.json()
        assert page["section"] == "cover"

        client.post(
            f"{BASE}/pages",
            headers=auth_headers,
            json={"edition_id": edition.id, "page_number": 2, "section": "seniors"},
        )

        response = client.get(f"{BASE}/editions/{edition.id}/pages", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 2

        response = client.get(
            f"{BASE}/editions/{edition.id}/pages",
            headers=auth_headers,
            params={"section": "seniors"},
        )
        assert response.status_code == 200
        pages = response.json()
        assert len(pages) == 1
        assert pages[0]["section"] == "seniors"

        response = client.get(f"{BASE}/pages/{page['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == page["id"]

    def test_duplicate_page_number_conflict(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition
    ):
        client.post(
            f"{BASE}/pages",
            headers=auth_headers,
            json={"edition_id": edition.id, "page_number": 5, "section": "clubs"},
        )
        response = client.post(
            f"{BASE}/pages",
            headers=auth_headers,
            json={"edition_id": edition.id, "page_number": 5, "section": "sports"},
        )
        assert response.status_code == 400

    def test_locked_page_cannot_be_updated_or_deleted(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition
    ):
        page = client.post(
            f"{BASE}/pages",
            headers=auth_headers,
            json={"edition_id": edition.id, "page_number": 9, "section": "faculty"},
        ).json()

        response = client.put(
            f"{BASE}/pages/{page['id']}", headers=auth_headers, json={"is_locked": True}
        )
        assert response.status_code == 200
        assert response.json()["is_locked"] is True

        response = client.put(
            f"{BASE}/pages/{page['id']}", headers=auth_headers, json={"section": "academics"}
        )
        assert response.status_code == 403

        response = client.delete(f"{BASE}/pages/{page['id']}", headers=auth_headers)
        assert response.status_code == 403

    # ---------------------------------------------------------------
    # Signatures (student-only) -- also exercises get_my_signatures, which
    # builds an aliased query with `Student.alias(...)`.
    # ---------------------------------------------------------------

    def test_signature_create_list_and_my_signatures(
        self,
        client: TestClient,
        auth_headers: dict,
        student_auth_headers: dict,
        edition: YearbookEdition,
        student: Student,
        student_role: Role,
        db_session: Session,
        institution: Institution,
    ):
        recipient_user = User(
            username="recipient_user",
            email="recipient_user@testschool.com",
            first_name="Recipient",
            last_name="Kid",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(recipient_user)
        db_session.commit()
        db_session.refresh(recipient_user)

        recipient = Student(
            institution_id=institution.id,
            user_id=recipient_user.id,
            admission_number="ADM999",
            first_name="Recipient",
            last_name="Kid",
            email="recipient@testschool.com",
            date_of_birth=date(2008, 1, 1),
            admission_date=date(2020, 4, 1),
            gender="Male",
            is_active=True,
        )
        db_session.add(recipient)
        db_session.commit()
        db_session.refresh(recipient)

        response = client.post(
            f"{BASE}/signatures",
            headers=student_auth_headers,
            json={
                "edition_id": edition.id,
                "to_student_id": recipient.id,
                "message": "Have a great summer!",
                "stickers": ["star"],
            },
        )
        assert response.status_code == 201
        sig = response.json()
        assert sig["from_student_id"] == student.id
        assert sig["to_student_id"] == recipient.id

        # Non-students are forbidden from signing.
        response = client.post(
            f"{BASE}/signatures",
            headers=auth_headers,
            json={"edition_id": edition.id, "to_student_id": recipient.id, "message": "hi"},
        )
        assert response.status_code == 403

        response = client.get(
            f"{BASE}/editions/{edition.id}/signatures", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

        # get_my_signatures is read as the recipient -- needs its own login.
        recipient_login = client.post(
            "/api/v1/auth/login",
            json={"email": recipient_user.email, "password": "password123"},
        )
        recipient_headers = {
            "Authorization": f"Bearer {recipient_login.json()['access_token']}"
        }
        response = client.get(
            f"{BASE}/signatures/my-signatures",
            headers=recipient_headers,
            params={"edition_id": edition.id},
        )
        assert response.status_code == 200
        my_sigs = response.json()
        assert len(my_sigs) == 1
        assert my_sigs[0]["from_student_name"] == f"{student.first_name} {student.last_name}"
        assert my_sigs[0]["to_student_name"] == f"{recipient.first_name} {recipient.last_name}"

    # ---------------------------------------------------------------
    # Photo / quote / memory submissions
    # ---------------------------------------------------------------

    def test_photo_submission_lifecycle(
        self,
        client: TestClient,
        auth_headers: dict,
        student_auth_headers: dict,
        edition: YearbookEdition,
        student: Student,
    ):
        response = client.post(
            f"{BASE}/photo-submissions",
            headers=student_auth_headers,
            json={
                "edition_id": edition.id,
                "photo_url": "https://example.com/photo1.jpg",
                "s3_key": "yearbook/2024/photo1.jpg",
                "caption": "Field trip",
            },
        )
        assert response.status_code == 201
        submission = response.json()
        assert submission["status"] == "pending"
        assert submission["student_id"] == student.id
        submission_id = submission["id"]

        response = client.get(
            f"{BASE}/editions/{edition.id}/photo-submissions", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

        response = client.put(
            f"{BASE}/photo-submissions/{submission_id}",
            headers=student_auth_headers,
            json={"caption": "Updated caption"},
        )
        assert response.status_code == 200
        assert response.json()["caption"] == "Updated caption"

        response = client.post(
            f"{BASE}/photo-submissions/{submission_id}/review",
            headers=auth_headers,
            json={"status": "approved", "review_notes": "Looks great"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved"
        assert data["reviewed_at"] is not None

        # Once reviewed, the student can no longer edit it.
        response = client.put(
            f"{BASE}/photo-submissions/{submission_id}",
            headers=student_auth_headers,
            json={"caption": "Too late"},
        )
        assert response.status_code == 403

    def test_quote_and_memory_submission_review(
        self,
        client: TestClient,
        auth_headers: dict,
        student_auth_headers: dict,
        edition: YearbookEdition,
    ):
        quote = client.post(
            f"{BASE}/quote-submissions",
            headers=student_auth_headers,
            json={"edition_id": edition.id, "quote_text": "Carpe diem", "category": "senior_quote"},
        )
        assert quote.status_code == 201
        quote_id = quote.json()["id"]

        response = client.get(
            f"{BASE}/editions/{edition.id}/quote-submissions", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

        response = client.post(
            f"{BASE}/quote-submissions/{quote_id}/review",
            headers=auth_headers,
            json={"status": "rejected", "review_notes": "Too generic"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

        memory = client.post(
            f"{BASE}/memory-submissions",
            headers=student_auth_headers,
            json={
                "edition_id": edition.id,
                "title": "The big win",
                "content": "We won the championship game in overtime.",
                "tags": ["sports", "championship"],
            },
        )
        assert memory.status_code == 201
        memory_id = memory.json()["id"]

        response = client.get(
            f"{BASE}/editions/{edition.id}/memory-submissions", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

        response = client.post(
            f"{BASE}/memory-submissions/{memory_id}/review",
            headers=auth_headers,
            json={"status": "approved"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    # ---------------------------------------------------------------
    # Flipbook / archive / print orders / statistics
    # ---------------------------------------------------------------

    def test_flipbook_requires_published_or_public(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition
    ):
        response = client.get(f"{BASE}/editions/{edition.id}/flipbook", headers=auth_headers)
        assert response.status_code == 403

        client.put(
            f"{BASE}/editions/{edition.id}",
            headers=auth_headers,
            json={"publication_status": "published"},
        )
        client.post(
            f"{BASE}/pages",
            headers=auth_headers,
            json={"edition_id": edition.id, "page_number": 1, "section": "cover"},
        )

        response = client.get(f"{BASE}/editions/{edition.id}/flipbook", headers=auth_headers)
        assert response.status_code == 200
        pages = response.json()
        assert len(pages) == 1
        assert pages[0]["page_number"] == 1

    def test_archive_lists_only_published_editions(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition
    ):
        response = client.get(f"{BASE}/archive", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

        client.put(
            f"{BASE}/editions/{edition.id}",
            headers=auth_headers,
            json={"publication_status": "published"},
        )

        response = client.get(f"{BASE}/archive", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == edition.id
        assert data[0]["total_pages"] == 0

    def test_generate_pdf_requires_ready_status_then_print_order(
        self, client: TestClient, auth_headers: dict, edition: YearbookEdition, db_session: Session
    ):
        response = client.post(f"{BASE}/editions/{edition.id}/generate-pdf", headers=auth_headers)
        assert response.status_code == 400

        client.put(
            f"{BASE}/editions/{edition.id}",
            headers=auth_headers,
            json={"publication_status": "ready_for_print"},
        )
        response = client.post(f"{BASE}/editions/{edition.id}/generate-pdf", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "processing"

        # generate-pdf doesn't persist a pdf_url (it just kicks off a
        # background task in the real system) -- print orders require one,
        # so set it directly to exercise that path.
        db_edition = db_session.get(YearbookEdition, edition.id)
        db_edition.pdf_url = "https://example.com/yearbook.pdf"
        db_session.commit()

        response = client.post(
            f"{BASE}/print-orders",
            headers=auth_headers,
            json={
                "edition_id": edition.id,
                "quantity": 3,
                "delivery_address": "123 Main St",
                "contact_name": "Parent Name",
                "contact_phone": "+1234567890",
                "contact_email": "parent@test.com",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["quantity"] == 3
        assert data["total_cost"] == 75.00
        assert data["order_id"].startswith("YB-")

    def test_statistics(
        self,
        client: TestClient,
        auth_headers: dict,
        student_auth_headers: dict,
        edition: YearbookEdition,
    ):
        client.post(
            f"{BASE}/pages",
            headers=auth_headers,
            json={"edition_id": edition.id, "page_number": 1, "section": "cover"},
        )
        client.post(
            f"{BASE}/photo-submissions",
            headers=student_auth_headers,
            json={
                "edition_id": edition.id,
                "photo_url": "https://example.com/p.jpg",
                "s3_key": "k1",
            },
        )

        response = client.get(f"{BASE}/editions/{edition.id}/statistics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_pages"] == 1
        assert data["pages_by_section"] == {"cover": 1}
        assert data["photo_submissions"] == {"pending": 1}
        assert data["publication_status"] == "draft"
