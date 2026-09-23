import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student


@pytest.mark.integration
class TestLibraryAPI:
    """Integration tests for /api/v1/library/*, the real, mounted router
    (src/api/v1/library.py) backed by src/models/library.py and
    src/schemas/library.py. This router existed as complete, working code
    but was never added to src/api/v1/__init__.py's ROUTERS list -- see
    TESTING_PROGRESS.md's "twenty-third pass" -- so it returned 404 on
    every request despite frontend/src/api/library.ts (used by 5 real
    page/component files) calling it. Just registered at /library, this
    is its first real test coverage.

    No endpoint here requires a genuine external network call (no
    barcode/ISBN lookup integration exists in this router), so nothing
    is skipped for that reason.
    """

    def _category(self, client: TestClient, auth_headers: dict, institution: Institution, name="Fiction"):
        response = client.post(
            "/api/v1/library/categories",
            headers=auth_headers,
            json={"institution_id": institution.id, "name": name, "code": name[:3].upper()},
        )
        assert response.status_code == 201
        return response.json()

    def _book(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        accession_number="ACC-0001",
        total_copies=2,
        category_id=None,
        title="The Great Gatsby",
        author="F. Scott Fitzgerald",
    ):
        payload = {
            "institution_id": institution.id,
            "title": title,
            "author": author,
            "isbn": "9780743273565",
            "accession_number": accession_number,
            "total_copies": total_copies,
        }
        if category_id is not None:
            payload["category_id"] = category_id
        response = client.post("/api/v1/library/books", headers=auth_headers, json=payload)
        assert response.status_code == 201
        return response.json()

    def _settings(self, client: TestClient, auth_headers: dict, institution: Institution, **overrides):
        payload = {
            "institution_id": institution.id,
            "max_books_per_student": 2,
            "issue_duration_days": 14,
            "fine_per_day": "5.00",
        }
        payload.update(overrides)
        response = client.post("/api/v1/library/settings", headers=auth_headers, json=payload)
        assert response.status_code == 201
        return response.json()

    # ---- Categories ----

    def test_create_and_list_categories(self, client: TestClient, auth_headers: dict, institution: Institution):
        category = self._category(client, auth_headers, institution, name="Science Fiction")
        assert category["name"] == "Science Fiction"
        assert category["is_active"] is True

        response = client.get("/api/v1/library/categories", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(c["id"] == category["id"] for c in data)

    def test_create_category_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Rival Library School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/library/categories",
            headers=auth_headers,
            json={"institution_id": other.id, "name": "Contraband"},
        )
        assert response.status_code == 403

    # ---- Books ----

    def test_create_and_get_book(self, client: TestClient, auth_headers: dict, institution: Institution):
        category = self._category(client, auth_headers, institution, name="Non-Fiction")
        book = self._book(
            client, auth_headers, institution,
            accession_number="ACC-1001", total_copies=3, category_id=category["id"],
        )
        assert book["available_copies"] == 3
        assert book["status"] == "available"
        assert book["category_id"] == category["id"]

        response = client.get(f"/api/v1/library/books/{book['id']}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "The Great Gatsby"

    def test_create_book_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Other Library School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/library/books",
            headers=auth_headers,
            json={
                "institution_id": other.id,
                "title": "Contraband Book",
                "accession_number": "ACC-9999",
                "total_copies": 1,
            },
        )
        assert response.status_code == 403

    def test_duplicate_accession_number_rejected(self, client: TestClient, auth_headers: dict, institution: Institution):
        self._book(client, auth_headers, institution, accession_number="ACC-DUP", title="Book One")

        response = client.post(
            "/api/v1/library/books",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Book Two",
                "accession_number": "ACC-DUP",
                "total_copies": 1,
            },
        )
        assert response.status_code == 400

    def test_get_nonexistent_book(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/library/books/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_list_books_with_search_and_filters(self, client: TestClient, auth_headers: dict, institution: Institution):
        category = self._category(client, auth_headers, institution, name="Mystery")
        self._book(
            client, auth_headers, institution,
            accession_number="ACC-2001", title="Murder on the Orient Express",
            author="Agatha Christie", category_id=category["id"],
        )
        self._book(
            client, auth_headers, institution,
            accession_number="ACC-2002", title="Brave New World", author="Aldous Huxley",
        )

        response = client.get(
            "/api/v1/library/books", headers=auth_headers, params={"search": "Orient"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Murder on the Orient Express"

        response = client.get(
            "/api/v1/library/books", headers=auth_headers, params={"category_id": category["id"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["accession_number"] == "ACC-2001"

        response = client.get(
            "/api/v1/library/books", headers=auth_headers, params={"author": "Huxley"}
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

    def test_update_and_delete_book(self, client: TestClient, auth_headers: dict, institution: Institution):
        book = self._book(client, auth_headers, institution, accession_number="ACC-3001")

        response = client.put(
            f"/api/v1/library/books/{book['id']}",
            headers=auth_headers,
            json={"rack_number": "R-42", "price": "19.99"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rack_number"] == "R-42"
        assert data["price"] == "19.99"

        response = client.delete(f"/api/v1/library/books/{book['id']}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/library/books/{book['id']}", headers=auth_headers)
        assert response.status_code == 404

    # ---- Issue / return workflow ----

    def test_issue_and_return_book_workflow(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        book = self._book(client, auth_headers, institution, accession_number="ACC-4001", total_copies=1)

        response = client.post(
            "/api/v1/library/issues",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "book_id": book["id"],
                "student_id": student.id,
                "issue_date": "2026-01-01",
                "due_date": "2026-01-15",
            },
        )
        assert response.status_code == 201
        issue = response.json()
        assert issue["status"] == "active"
        issue_id = issue["id"]

        # Book is now fully checked out.
        response = client.get(f"/api/v1/library/books/{book['id']}", headers=auth_headers)
        assert response.json()["available_copies"] == 0
        assert response.json()["status"] == "issued"

        # A second issue attempt on the same (now unavailable) book is rejected.
        response = client.post(
            "/api/v1/library/issues",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "book_id": book["id"],
                "student_id": student.id,
                "issue_date": "2026-01-01",
                "due_date": "2026-01-15",
            },
        )
        assert response.status_code == 400

        response = client.get(f"/api/v1/library/issues/{issue_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["book_id"] == book["id"]

        # Return on time -> no fine.
        response = client.post(
            f"/api/v1/library/issues/{issue_id}/return",
            headers=auth_headers,
            json={"return_date": "2026-01-10"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "returned"
        assert float(data["fine_amount"]) == 0.0

        # Availability restored.
        response = client.get(f"/api/v1/library/books/{book['id']}", headers=auth_headers)
        assert response.json()["available_copies"] == 1
        assert response.json()["status"] == "available"

        # Returning again is rejected.
        response = client.post(
            f"/api/v1/library/issues/{issue_id}/return",
            headers=auth_headers,
            json={"return_date": "2026-01-10"},
        )
        assert response.status_code == 400

    def test_return_overdue_book_calculates_fine(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        self._settings(client, auth_headers, institution, fine_per_day="5.00", max_fine_amount="30.00")
        book = self._book(client, auth_headers, institution, accession_number="ACC-4002", total_copies=1)

        issue = client.post(
            "/api/v1/library/issues",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "book_id": book["id"],
                "student_id": student.id,
                "issue_date": "2026-01-01",
                "due_date": "2026-01-15",
            },
        ).json()

        # 10 days overdue * 5.00/day = 50.00, capped at max_fine_amount 30.00.
        response = client.post(
            f"/api/v1/library/issues/{issue['id']}/return",
            headers=auth_headers,
            json={"return_date": "2026-01-25", "fine_paid": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["fine_amount"]) == 30.00
        assert data["fine_paid"] is False

    def test_issue_rejects_when_max_books_reached(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        self._settings(client, auth_headers, institution, max_books_per_student=1)
        book1 = self._book(client, auth_headers, institution, accession_number="ACC-5001", total_copies=1)
        book2 = self._book(client, auth_headers, institution, accession_number="ACC-5002", total_copies=1)

        response = client.post(
            "/api/v1/library/issues",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "book_id": book1["id"],
                "student_id": student.id,
                "issue_date": "2026-01-01",
                "due_date": "2026-01-15",
            },
        )
        assert response.status_code == 201

        response = client.post(
            "/api/v1/library/issues",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "book_id": book2["id"],
                "student_id": student.id,
                "issue_date": "2026-01-02",
                "due_date": "2026-01-16",
            },
        )
        assert response.status_code == 400
        assert "maximum book limit" in response.json()["detail"]

    def test_list_issues_with_filters(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        book = self._book(client, auth_headers, institution, accession_number="ACC-6001", total_copies=2)
        client.post(
            "/api/v1/library/issues",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "book_id": book["id"],
                "student_id": student.id,
                "issue_date": "2026-02-01",
                "due_date": "2026-02-15",
            },
        )

        response = client.get(
            "/api/v1/library/issues", headers=auth_headers, params={"student_id": student.id}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert all(i["student_id"] == student.id for i in data["items"])

        response = client.get(
            "/api/v1/library/issues", headers=auth_headers, params={"status": "active"}
        )
        assert response.status_code == 200
        assert all(i["status"] == "active" for i in response.json()["items"])

    def test_overdue_report(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        book = self._book(client, auth_headers, institution, accession_number="ACC-7001", total_copies=1)
        client.post(
            "/api/v1/library/issues",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "book_id": book["id"],
                "student_id": student.id,
                "issue_date": "2020-01-01",
                "due_date": "2020-01-15",
            },
        )

        response = client.get("/api/v1/library/overdue", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        entry = next(e for e in data if e["book_title"] == "The Great Gatsby")
        assert entry["student_name"] == f"{student.first_name} {student.last_name}"
        assert entry["days_overdue"] > 0

    # ---- Settings ----

    def test_create_get_update_settings(self, client: TestClient, auth_headers: dict, institution: Institution):
        settings = self._settings(client, auth_headers, institution, max_books_per_student=4)
        assert settings["max_books_per_student"] == 4
        assert settings["working_days"] == "mon,tue,wed,thu,fri"

        response = client.get("/api/v1/library/settings", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["institution_id"] == institution.id

        response = client.put(
            "/api/v1/library/settings",
            headers=auth_headers,
            json={"max_books_per_student": 6, "fine_per_day": "2.50"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["max_books_per_student"] == 6
        assert data["fine_per_day"] == "2.50"

    def test_duplicate_settings_rejected(self, client: TestClient, auth_headers: dict, institution: Institution):
        self._settings(client, auth_headers, institution)

        response = client.post(
            "/api/v1/library/settings",
            headers=auth_headers,
            json={"institution_id": institution.id, "max_books_per_student": 1},
        )
        assert response.status_code == 400

    def test_get_settings_not_found(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/library/settings", headers=auth_headers)
        assert response.status_code == 404
