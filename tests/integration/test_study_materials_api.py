"""Integration tests for the `study_materials` router (src/api/v1/study_materials.py).

Upload/search/CRUD of study materials, bookmarks, sharing, subject/chapter/
topic hierarchy, autocomplete, stats, recently-accessed, and material tags.

Real bugs found and fixed while writing this coverage:

1. **`POST /bookmarks` (create_bookmark) and `POST /share` (share_material)
   never validated `material_id` before use** -- the id came straight from
   the client and went unchecked into `MaterialBookmark`/`MaterialShare`'s
   FK column, so an unknown id raised an unhandled `IntegrityError` (500)
   instead of a clean 404, and a valid id belonging to *another*
   institution's material could be bookmarked/shared anyway (same shape as
   this session's earlier `flashcards.py` `create_flashcard`/`deck_id` fix
   and the general cross-tenant-gap bug class). Fixed by looking the
   material up first, scoped to the caller's institution, 404ing if
   missing.

All other endpoints were already correctly authenticated and institution-
scoped (every DB lookup is scoped through `current_user.institution_id`,
never a client-supplied institution id), so no auth or cross-tenant gaps
were found beyond the two above.
"""
import io
import json
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from src.models.study_material import (
    StudyMaterial, MaterialBookmark, MaterialShare, MaterialTag, MaterialType
)
from src.models.institution import Institution
from src.models.user import User
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def other_institution(db_session):
    import uuid
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
def other_institution_material(db_session, other_institution) -> StudyMaterial:
    material = StudyMaterial(
        institution_id=other_institution.id,
        title="Other Institution's Notes",
        file_path="study-materials/other/notes.pdf",
        file_name="notes.pdf",
        file_size=1234,
        material_type=MaterialType.PDF,
        mime_type="application/pdf",
        tags=["algebra"],
        is_public=False,
    )
    db_session.add(material)
    db_session.commit()
    db_session.refresh(material)
    return material


@pytest.fixture
def material(db_session, institution, admin_user, subject) -> StudyMaterial:
    material = StudyMaterial(
        institution_id=institution.id,
        subject_id=subject.id,
        uploaded_by=admin_user.id,
        title="Algebra Basics",
        description="Intro to algebra",
        file_path="study-materials/1/pdf/algebra.pdf",
        file_name="algebra.pdf",
        file_size=2048,
        material_type=MaterialType.PDF,
        mime_type="application/pdf",
        tags=["algebra", "math"],
        is_public=False,
        view_count=3,
        download_count=1,
    )
    db_session.add(material)
    db_session.commit()
    db_session.refresh(material)
    return material


@pytest.fixture
def mock_s3(monkeypatch):
    with patch(
        "src.api.v1.study_materials.S3Client.upload_file",
        return_value="https://test-bucket.s3.amazonaws.com/study-materials/fake-key.pdf",
    ) as mock_upload, patch(
        "src.api.v1.study_materials.S3Client.generate_presigned_url",
        return_value="https://test-bucket.s3.amazonaws.com/study-materials/fake-key.pdf?sig=abc",
    ) as mock_presign:
        yield mock_upload, mock_presign


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestAuthRequired:
    def test_search_requires_auth(self, client):
        response = client.get("/api/v1/study-materials/search")
        assert response.status_code in (401, 403)

    def test_get_material_requires_auth(self, client, material):
        response = client.get(f"/api/v1/study-materials/{material.id}")
        assert response.status_code in (401, 403)

    def test_upload_requires_auth(self, client):
        response = client.post(
            "/api/v1/study-materials/upload",
            files={"file": ("test.pdf", b"content", "application/pdf")},
            data={"title": "Test"},
        )
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestUploadMaterial:
    def test_upload_pdf(self, client, auth_headers, subject, mock_s3):
        response = client.post(
            "/api/v1/study-materials/upload",
            headers=auth_headers,
            files={"file": ("notes.pdf", b"%PDF-1.4 fake content", "application/pdf")},
            data={
                "title": "Uploaded Notes",
                "description": "Some notes",
                "subject_id": str(subject.id),
                "tags": json.dumps(["notes", "algebra"]),
                "is_public": "false",
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["material"]["title"] == "Uploaded Notes"
        assert data["material"]["material_type"] == "pdf"
        assert data["material"]["file_size"] == len(b"%PDF-1.4 fake content")
        assert data["material"]["tags"] == ["notes", "algebra"]

    def test_upload_infers_material_type_from_mime(self, client, auth_headers, mock_s3):
        response = client.post(
            "/api/v1/study-materials/upload",
            headers=auth_headers,
            files={"file": ("clip.mp4", b"videodata", "video/mp4")},
            data={"title": "A Video"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["material"]["material_type"] == "video"


# ---------------------------------------------------------------------------
# Get / update / delete
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestGetUpdateDeleteMaterial:
    def test_get_material(self, client, auth_headers, material):
        response = client.get(f"/api/v1/study-materials/{material.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Algebra Basics"

    def test_get_material_not_found(self, client, auth_headers):
        response = client.get("/api/v1/study-materials/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_material_cross_institution_404(self, client, auth_headers, other_institution_material):
        response = client.get(
            f"/api/v1/study-materials/{other_institution_material.id}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_material(self, client, auth_headers, material):
        response = client.put(
            f"/api/v1/study-materials/{material.id}",
            headers=auth_headers,
            json={"title": "Algebra Basics Revised", "is_public": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Algebra Basics Revised"
        assert data["is_public"] is True

    def test_update_material_cross_institution_404(
        self, client, auth_headers, other_institution_material
    ):
        response = client.put(
            f"/api/v1/study-materials/{other_institution_material.id}",
            headers=auth_headers,
            json={"title": "Hijacked"},
        )
        assert response.status_code == 404

    def test_delete_material(self, client, auth_headers, material, db_session):
        response = client.delete(f"/api/v1/study-materials/{material.id}", headers=auth_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/study-materials/{material.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_material_cross_institution_404(
        self, client, auth_headers, other_institution_material
    ):
        response = client.delete(
            f"/api/v1/study-materials/{other_institution_material.id}", headers=auth_headers
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestSearchMaterials:
    def test_search_by_query(self, client, auth_headers, material):
        response = client.get(
            "/api/v1/study-materials/search", headers=auth_headers, params={"query": "Algebra"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(m["id"] == material.id for m in data["materials"])

    def test_search_excludes_other_institution(
        self, client, auth_headers, other_institution_material
    ):
        response = client.get(
            "/api/v1/study-materials/search",
            headers=auth_headers,
            params={"query": "Other Institution"},
        )
        assert response.status_code == 200
        data = response.json()
        assert all(m["id"] != other_institution_material.id for m in data["materials"])

    def test_search_by_material_type(self, client, auth_headers, material):
        response = client.get(
            "/api/v1/study-materials/search", headers=auth_headers, params={"material_type": "pdf"}
        )
        assert response.status_code == 200
        assert any(m["id"] == material.id for m in response.json()["materials"])

    def test_search_by_tags(self, client, auth_headers, material):
        response = client.get(
            "/api/v1/study-materials/search", headers=auth_headers, params={"tags": "algebra"}
        )
        assert response.status_code == 200
        assert any(m["id"] == material.id for m in response.json()["materials"])

    def test_search_pagination(self, client, auth_headers, material):
        response = client.get(
            "/api/v1/study-materials/search",
            headers=auth_headers,
            params={"page": 1, "page_size": 1},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 1
        assert len(data["materials"]) <= 1


# ---------------------------------------------------------------------------
# View / download
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestViewDownload:
    def test_view_material_increments_count(self, client, auth_headers, material, db_session):
        # `client`'s overridden get_db yields this very same `db_session`, so
        # `material` and any row the endpoint loads share one identity map --
        # capture the baseline before the call, since `material.view_count`
        # itself gets mutated in place once the endpoint's own query returns
        # the identical Python object.
        initial_view_count = material.view_count
        response = client.post(f"/api/v1/study-materials/{material.id}/view", headers=auth_headers)
        assert response.status_code == 200

        db_session.expire_all()
        refreshed = db_session.get(StudyMaterial, material.id)
        assert refreshed.view_count == initial_view_count + 1

    def test_download_material(self, client, auth_headers, material, mock_s3, db_session):
        initial_download_count = material.download_count
        response = client.post(
            f"/api/v1/study-materials/{material.id}/download", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_name"] == "algebra.pdf"
        assert "download_url" in data

        db_session.expire_all()
        refreshed = db_session.get(StudyMaterial, material.id)
        assert refreshed.download_count == initial_download_count + 1

    def test_download_material_not_found(self, client, auth_headers):
        response = client.post("/api/v1/study-materials/999999/download", headers=auth_headers)
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Bookmarks
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestBookmarks:
    def test_create_bookmark(self, client, auth_headers, material):
        response = client.post(
            "/api/v1/study-materials/bookmarks",
            headers=auth_headers,
            json={"material_id": material.id, "is_favorite": True, "notes": "review later"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["material_id"] == material.id
        assert data["is_favorite"] is True

    def test_create_bookmark_unknown_material_returns_404_not_500(self, client, auth_headers):
        """Regression test: previously raised an unhandled IntegrityError (500)."""
        response = client.post(
            "/api/v1/study-materials/bookmarks",
            headers=auth_headers,
            json={"material_id": 999999},
        )
        assert response.status_code == 404

    def test_create_bookmark_cross_institution_404(
        self, client, auth_headers, other_institution_material
    ):
        response = client.post(
            "/api/v1/study-materials/bookmarks",
            headers=auth_headers,
            json={"material_id": other_institution_material.id},
        )
        assert response.status_code == 404

    def test_update_bookmark(self, client, auth_headers, material):
        client.post(
            "/api/v1/study-materials/bookmarks",
            headers=auth_headers,
            json={"material_id": material.id},
        )
        response = client.put(
            f"/api/v1/study-materials/bookmarks/{material.id}",
            headers=auth_headers,
            json={"is_favorite": True, "notes": "updated"},
        )
        assert response.status_code == 200
        assert response.json()["is_favorite"] is True

    def test_update_bookmark_not_found(self, client, auth_headers, material):
        response = client.put(
            f"/api/v1/study-materials/bookmarks/{material.id}",
            headers=auth_headers,
            json={"is_favorite": True},
        )
        assert response.status_code == 404

    def test_delete_bookmark(self, client, auth_headers, material):
        client.post(
            "/api/v1/study-materials/bookmarks",
            headers=auth_headers,
            json={"material_id": material.id},
        )
        response = client.delete(
            f"/api/v1/study-materials/bookmarks/{material.id}", headers=auth_headers
        )
        assert response.status_code == 204

    def test_get_my_bookmarks(self, client, auth_headers, material):
        client.post(
            "/api/v1/study-materials/bookmarks",
            headers=auth_headers,
            json={"material_id": material.id, "is_favorite": True},
        )
        response = client.get("/api/v1/study-materials/bookmarks/my/list", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(b["material_id"] == material.id for b in data)

    def test_get_my_bookmarks_favorites_only(self, client, auth_headers, material):
        client.post(
            "/api/v1/study-materials/bookmarks",
            headers=auth_headers,
            json={"material_id": material.id, "is_favorite": False},
        )
        response = client.get(
            "/api/v1/study-materials/bookmarks/my/list",
            headers=auth_headers,
            params={"favorites_only": True},
        )
        assert response.status_code == 200
        assert response.json() == []


# ---------------------------------------------------------------------------
# Sharing
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestSharing:
    def test_share_material(self, client, auth_headers, material):
        response = client.post(
            "/api/v1/study-materials/share",
            headers=auth_headers,
            json={"material_id": material.id, "message": "check this out"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["material_id"] == material.id
        assert data["share_token"]

    def test_share_unknown_material_returns_404_not_500(self, client, auth_headers):
        response = client.post(
            "/api/v1/study-materials/share",
            headers=auth_headers,
            json={"material_id": 999999},
        )
        assert response.status_code == 404

    def test_share_cross_institution_404(self, client, auth_headers, other_institution_material):
        response = client.post(
            "/api/v1/study-materials/share",
            headers=auth_headers,
            json={"material_id": other_institution_material.id},
        )
        assert response.status_code == 404

    def test_get_shared_material_by_token_no_auth_needed(self, client, auth_headers, material):
        create_response = client.post(
            "/api/v1/study-materials/share",
            headers=auth_headers,
            json={"material_id": material.id},
        )
        token = create_response.json()["share_token"]

        response = client.get(f"/api/v1/study-materials/share/{token}")
        assert response.status_code == 200
        assert response.json()["material"]["id"] == material.id

    def test_get_shared_material_unknown_token_404(self, client):
        response = client.get("/api/v1/study-materials/share/does-not-exist")
        assert response.status_code == 404

    def test_get_shared_material_expired_404(self, client, auth_headers, material, db_session):
        create_response = client.post(
            "/api/v1/study-materials/share",
            headers=auth_headers,
            json={"material_id": material.id},
        )
        token = create_response.json()["share_token"]

        share = db_session.query(MaterialShare).filter(MaterialShare.share_token == token).first()
        share.expires_at = datetime.utcnow() - timedelta(days=1)
        db_session.commit()

        response = client.get(f"/api/v1/study-materials/share/{token}")
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Hierarchy / autocomplete / stats / recent / tags
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestHierarchyAndMisc:
    def test_get_hierarchy(self, client, auth_headers, material, subject):
        response = client.get("/api/v1/study-materials/hierarchy/tree", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(node["id"] == subject.id and node["material_count"] >= 1 for node in data)

    def test_get_autocomplete(self, client, auth_headers, material):
        response = client.get(
            "/api/v1/study-materials/autocomplete/suggestions",
            headers=auth_headers,
            params={"q": "Algebra"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "Algebra Basics" in data["suggestions"]

    def test_get_stats(self, client, auth_headers, material):
        response = client.get("/api/v1/study-materials/stats/overview", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_materials"] >= 1
        assert isinstance(data["total_views"], int)
        assert isinstance(data["total_downloads"], int)
        assert data["total_views"] >= material.view_count

    def test_get_stats_excludes_other_institution(
        self, client, auth_headers, other_institution_material
    ):
        response = client.get("/api/v1/study-materials/stats/overview", headers=auth_headers)
        assert response.status_code == 200
        # Only this institution's zero materials should be counted (no
        # `material` fixture used in this test).
        assert response.json()["total_materials"] == 0

    def test_get_recently_accessed(self, client, auth_headers, material):
        client.post(f"/api/v1/study-materials/{material.id}/view", headers=auth_headers)
        response = client.get("/api/v1/study-materials/recent/accessed", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert any(m["id"] == material.id for m in data)

    def test_create_and_list_tags(self, client, auth_headers):
        response = client.post(
            "/api/v1/study-materials/tags",
            headers=auth_headers,
            json={"name": "revision", "color": "#ff0000"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["name"] == "revision"

        list_response = client.get("/api/v1/study-materials/tags/list", headers=auth_headers)
        assert list_response.status_code == 200
        assert any(t["name"] == "revision" for t in list_response.json())
