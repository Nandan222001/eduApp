import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student


@pytest.mark.integration
class TestJournalismAPI:
    """Integration tests for /api/v1/journalism/*, the real, mounted
    router (src/api/v1/journalism.py) backed by src/models/journalism.py
    and src/schemas/journalism.py (both written this session, see
    TESTING_PROGRESS.md's "journalism" router fix)."""

    def test_create_and_get_edition(self, client: TestClient, auth_headers: dict, institution: Institution):
        response = client.post(
            "/api/v1/journalism/editions",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "edition_number": 1,
                "publication_date": "2026-01-15",
                "theme": "Back to School",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["edition_number"] == 1
        assert data["publication_status"] == "draft"
        edition_id = data["id"]

        response = client.get(f"/api/v1/journalism/editions/{edition_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["theme"] == "Back to School"
        assert data["article_count"] == 0

    def test_duplicate_edition_number_rejected(self, client: TestClient, auth_headers: dict, institution: Institution):
        payload = {
            "institution_id": institution.id,
            "edition_number": 42,
            "publication_date": "2026-02-01",
        }
        first = client.post("/api/v1/journalism/editions", headers=auth_headers, json=payload)
        assert first.status_code == 201

        second = client.post("/api/v1/journalism/editions", headers=auth_headers, json=payload)
        assert second.status_code == 400

    def test_create_edition_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Rival School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/journalism/editions",
            headers=auth_headers,
            json={"institution_id": other.id, "edition_number": 1, "publication_date": "2026-01-01"},
        )
        assert response.status_code == 403

    def test_update_and_delete_edition(self, client: TestClient, auth_headers: dict, institution: Institution):
        create = client.post(
            "/api/v1/journalism/editions",
            headers=auth_headers,
            json={"institution_id": institution.id, "edition_number": 7, "publication_date": "2026-03-01"},
        )
        edition_id = create.json()["id"]

        response = client.put(
            f"/api/v1/journalism/editions/{edition_id}",
            headers=auth_headers,
            json={"publication_status": "review"},
        )
        assert response.status_code == 200
        assert response.json()["publication_status"] == "review"

        response = client.delete(f"/api/v1/journalism/editions/{edition_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/journalism/editions/{edition_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_list_editions(self, client: TestClient, auth_headers: dict, institution: Institution):
        client.post(
            "/api/v1/journalism/editions",
            headers=auth_headers,
            json={"institution_id": institution.id, "edition_number": 99, "publication_date": "2026-04-01"},
        )
        response = client.get("/api/v1/journalism/editions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(e["edition_number"] == 99 for e in data["items"])

    def test_create_and_get_article(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/journalism/articles",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "School Wins Regional Championship",
                "article_type": "sports",
                "content_html": "<p>The team celebrated a hard fought victory today.</p>",
                "author_student_id": student.id,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["review_status"] == "pending"
        assert data["slug"] == "school-wins-regional-championship"
        assert data["word_count"] == 8
        article_id = data["id"]

        response = client.get(f"/api/v1/journalism/articles/{article_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["author_name"] == f"{student.first_name} {student.last_name}"
        assert data["review_count"] == 0

    def test_article_review_workflow_to_publish(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        article = client.post(
            "/api/v1/journalism/articles",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Editorial: On Homework",
                "article_type": "opinion",
                "content_html": "<p>Some thoughts on homework policy.</p>",
            },
        ).json()
        article_id = article["id"]

        response = client.post(f"/api/v1/journalism/articles/{article_id}/submit", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["review_status"] == "peer_review"

        # Publishing before approval is rejected.
        response = client.post(
            f"/api/v1/journalism/articles/{article_id}/publish",
            headers=auth_headers,
            json={"article_id": article_id},
        )
        assert response.status_code == 400

        response = client.put(
            f"/api/v1/journalism/articles/{article_id}/workflow",
            headers=auth_headers,
            json={"article_id": article_id, "review_status": "approved", "editor_notes": "Looks good"},
        )
        assert response.status_code == 200
        assert response.json()["review_status"] == "approved"

        response = client.post(
            f"/api/v1/journalism/articles/{article_id}/publish",
            headers=auth_headers,
            json={"article_id": article_id},
        )
        assert response.status_code == 200
        assert response.json()["publish_date"] is not None

    def test_create_review_and_list(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        article = client.post(
            "/api/v1/journalism/articles",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Club Fair Recap",
                "article_type": "news",
                "content_html": "<p>Clubs showcased their activities.</p>",
            },
        ).json()

        response = client.post(
            "/api/v1/journalism/reviews",
            headers=auth_headers,
            json={
                "article_id": article["id"],
                "review_type": "peer",
                "comments": "Nice work",
                "rating": 4,
                "reviewer_student_id": student.id,
            },
        )
        assert response.status_code == 201

        response = client.get(f"/api/v1/journalism/articles/{article['id']}/reviews", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["reviewer_name"] == f"{student.first_name} {student.last_name}"

    def test_assign_and_get_member(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/journalism/members",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "role": "writer",
                "position_title": "Staff Writer",
            },
        )
        assert response.status_code == 201
        member_id = response.json()["id"]

        # Duplicate role for the same student is rejected.
        dup = client.post(
            "/api/v1/journalism/members",
            headers=auth_headers,
            json={"institution_id": institution.id, "student_id": student.id, "role": "writer"},
        )
        assert dup.status_code == 400

        response = client.get(f"/api/v1/journalism/members/{member_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["student_name"] == f"{student.first_name} {student.last_name}"
        assert data["article_count"] == 0

        response = client.get("/api/v1/journalism/members", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_article_analytics_view_tracking(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        article = client.post(
            "/api/v1/journalism/articles",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Cafeteria Menu Update",
                "article_type": "news",
                "content_html": "<p>New lunch options this week.</p>",
            },
        ).json()

        response = client.post(
            "/api/v1/journalism/analytics/view",
            headers=auth_headers,
            json={"article_id": article["id"], "time_spent_seconds": 45, "engagement_score": 8},
        )
        assert response.status_code == 201

        response = client.get(f"/api/v1/journalism/analytics/articles/{article['id']}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_views"] == 1
        assert data["avg_time_spent"] == 45.0

    def test_edition_analytics_and_member_stats(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        edition = client.post(
            "/api/v1/journalism/editions",
            headers=auth_headers,
            json={"institution_id": institution.id, "edition_number": 55, "publication_date": "2026-05-01"},
        ).json()

        article = client.post(
            "/api/v1/journalism/articles",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Spring Concert Preview",
                "article_type": "arts",
                "content_html": "<p>The music department previews its spring concert.</p>",
                "edition_id": edition["id"],
                "author_student_id": student.id,
            },
        ).json()

        client.post(
            "/api/v1/journalism/analytics/view",
            headers=auth_headers,
            json={"article_id": article["id"]},
        )

        response = client.get(f"/api/v1/journalism/analytics/editions/{edition['id']}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_articles"] == 1
        assert data["total_views"] == 1
        assert len(data["top_articles"]) == 1

        client.post(
            "/api/v1/journalism/members",
            headers=auth_headers,
            json={"institution_id": institution.id, "student_id": student.id, "role": "writer"},
        )

        response = client.get("/api/v1/journalism/analytics/members/stats", headers=auth_headers)
        assert response.status_code == 200
        stats = response.json()
        assert any(s["student_name"] == f"{student.first_name} {student.last_name}" for s in stats)
