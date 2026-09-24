"""Integration tests for the `data_management` router (src/api/v1/data_management.py).

Admin-only bulk data import/export tooling: entity metadata for the export
builder, CSV export/preview, scheduled exports, CSV import (column
detection, validation, execution, history, rollback, error download). Every
endpoint gates on `current_user.role != "admin"` before doing anything else.

Bug found and fixed while writing this coverage:

1. **Every single admin check compared `current_user.role` (the SQLAlchemy
   `Role` relationship object) directly against the string `"admin"`**
   (bug class 12 -- ORM relationship compared where a plain value is
   expected). `User.role` is `relationship("Role", ...)`, never a string,
   so `current_user.role != "admin"` was **unconditionally `True` for
   every caller, including real admins** -- this made all 12 endpoints in
   the router return 403 for 100% of requests, real admin or not. The
   entire Data Management feature (bulk import/export used by
   `DataManagement`-style admin UI, per `ENTITY_METADATA`) was completely
   unusable regardless of caller. Fixed all 12 occurrences to
   `not current_user.role or current_user.role.slug != "admin"` (matching
   the `role.slug` comparison pattern already used elsewhere in this
   codebase, e.g. `search.py`, `rate_limits.py`).

Note: several endpoints here (export/import) operate on hardcoded sample
data rather than real DB rows (`sample_data` dicts in `export_data`/
`get_export_preview`, and `import_data` counts CSV rows without writing
them anywhere) -- this looks like a deliberately stubbed-out prototype
rather than a bug in scope for this pass (no model/schema exists to
persist an import job, no `DataImport`/`DataExport` model at all), so
tests below cover it as-is (its actual current behavior) rather than
guessing at unwritten persistence logic.
"""
import io
import uuid

import pytest


@pytest.fixture
def teacher_auth_headers(client, teacher_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestEntities:
    def test_get_all_entities_as_admin(self, client, auth_headers):
        response = client.get(
            "/api/v1/data-management/entities",
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert len(data) == 3
        entity_names = {e["entity"] for e in data}
        assert entity_names == {"students", "teachers", "attendance"}

    def test_get_single_entity(self, client, auth_headers):
        response = client.get(
            "/api/v1/data-management/entities",
            params={"entity": "students"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["entity"] == "students"
        assert any(col["id"] == "email" for col in data[0]["columns"])

    def test_get_entities_forbidden_for_non_admin(self, client, teacher_auth_headers):
        response = client.get(
            "/api/v1/data-management/entities",
            headers=teacher_auth_headers,
        )
        assert response.status_code == 403

    def test_get_entities_requires_auth(self, client):
        response = client.get("/api/v1/data-management/entities")
        assert response.status_code == 403


class TestExportPreview:
    def test_export_preview(self, client, auth_headers):
        response = client.post(
            "/api/v1/data-management/export/preview",
            json={"entity": "students", "columns": ["id", "first_name", "email"]},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["totalCount"] == 2
        assert len(data["rows"]) == 2
        assert set(data["rows"][0].keys()) == {"id", "first_name", "email"}

    def test_export_preview_forbidden_for_non_admin(self, client, teacher_auth_headers):
        response = client.post(
            "/api/v1/data-management/export/preview",
            json={"entity": "students", "columns": ["id"]},
            headers=teacher_auth_headers,
        )
        assert response.status_code == 403


class TestExport:
    def test_export_csv(self, client, auth_headers):
        response = client.post(
            "/api/v1/data-management/export",
            json={"entity": "students", "format": "csv", "columns": ["id", "first_name", "email"]},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.headers["content-type"].startswith("text/csv")
        assert "john@example.com" in response.text

    def test_export_unsupported_format(self, client, auth_headers):
        response = client.post(
            "/api/v1/data-management/export",
            json={"entity": "students", "format": "pdf", "columns": ["id"]},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_export_forbidden_for_non_admin(self, client, teacher_auth_headers):
        response = client.post(
            "/api/v1/data-management/export",
            json={"entity": "students", "format": "csv", "columns": ["id"]},
            headers=teacher_auth_headers,
        )
        assert response.status_code == 403


class TestScheduledExports:
    def test_list_scheduled_exports_empty(self, client, auth_headers):
        response = client.get(
            "/api/v1/data-management/scheduled-exports",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_delete_scheduled_export(self, client, auth_headers):
        create_response = client.post(
            "/api/v1/data-management/scheduled-exports",
            json={"entity": "students", "frequency": "weekly"},
            headers=auth_headers,
        )
        assert create_response.status_code == 200
        assert create_response.json()["entity"] == "students"

        delete_response = client.delete(
            "/api/v1/data-management/scheduled-exports/some-id",
            headers=auth_headers,
        )
        assert delete_response.status_code == 200
        assert delete_response.json()["status"] == "deleted"

    def test_scheduled_exports_forbidden_for_non_admin(self, client, teacher_auth_headers):
        response = client.get(
            "/api/v1/data-management/scheduled-exports",
            headers=teacher_auth_headers,
        )
        assert response.status_code == 403


class TestImport:
    def test_detect_columns(self, client, auth_headers):
        csv_content = b"first_name,last_name,email\nJohn,Doe,john@example.com\n"
        response = client.post(
            "/api/v1/data-management/import/detect-columns",
            files={"file": ("students.csv", io.BytesIO(csv_content), "text/csv")},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["columns"] == ["first_name", "last_name", "email"]

    def test_detect_columns_unsupported_file(self, client, auth_headers):
        response = client.post(
            "/api/v1/data-management/import/detect-columns",
            files={"file": ("students.txt", io.BytesIO(b"whatever"), "text/plain")},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_detect_columns_forbidden_for_non_admin(self, client, teacher_auth_headers):
        csv_content = b"first_name\nJohn\n"
        response = client.post(
            "/api/v1/data-management/import/detect-columns",
            files={"file": ("students.csv", io.BytesIO(csv_content), "text/csv")},
            headers=teacher_auth_headers,
        )
        assert response.status_code == 403

    def test_validate_import_with_missing_email(self, client, auth_headers):
        csv_content = b"first_name,last_name,email\nJohn,Doe,\nJane,Smith,jane@example.com\n"
        response = client.post(
            "/api/v1/data-management/import/validate",
            files={"file": ("students.csv", io.BytesIO(csv_content), "text/csv")},
            data={
                "entity": "students",
                "column_mappings": "{}",
                "skip_first_row": "true",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["totalRows"] == 2
        assert data["valid"] is False
        assert len(data["errors"]) == 1
        assert data["errors"][0]["column"] == "email"

    def test_validate_import_all_valid(self, client, auth_headers):
        csv_content = b"first_name,last_name,email\nJohn,Doe,john@example.com\n"
        response = client.post(
            "/api/v1/data-management/import/validate",
            files={"file": ("students.csv", io.BytesIO(csv_content), "text/csv")},
            data={
                "entity": "students",
                "column_mappings": "{}",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] == []

    def test_import_data(self, client, auth_headers):
        csv_content = b"first_name,last_name,email\nJohn,Doe,john@example.com\n"
        response = client.post(
            "/api/v1/data-management/import",
            files={"file": ("students.csv", io.BytesIO(csv_content), "text/csv")},
            data={
                "entity": "students",
                "column_mappings": "{}",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["importedRows"] == 1
        assert data["importId"].startswith("IMP_")

    def test_import_data_forbidden_for_non_admin(self, client, teacher_auth_headers):
        csv_content = b"first_name\nJohn\n"
        response = client.post(
            "/api/v1/data-management/import",
            files={"file": ("students.csv", io.BytesIO(csv_content), "text/csv")},
            data={"entity": "students", "column_mappings": "{}"},
            headers=teacher_auth_headers,
        )
        assert response.status_code == 403

    def test_import_history(self, client, auth_headers):
        response = client.get(
            "/api/v1/data-management/import/history",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["entity"] == "students"

    def test_rollback_import(self, client, auth_headers):
        response = client.post(
            "/api/v1/data-management/import/some-id/rollback",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rolled_back"

    def test_download_import_errors(self, client, auth_headers):
        response = client.get(
            "/api/v1/data-management/import/some-id/errors",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        assert "Email is required" in response.text

    def test_download_import_errors_forbidden_for_non_admin(self, client, teacher_auth_headers):
        response = client.get(
            "/api/v1/data-management/import/some-id/errors",
            headers=teacher_auth_headers,
        )
        assert response.status_code == 403
