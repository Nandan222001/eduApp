import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.user import User


@pytest.mark.integration
class TestEventsAPI:
    """Integration tests for /api/v1/events/*, one of the routers that
    existed but was never registered anywhere until TESTING_PROGRESS.md's
    twenty-third pass."""

    def test_create_and_get_event(self, client: TestClient, auth_headers: dict, institution: Institution):
        start = datetime.utcnow() + timedelta(days=1)
        response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Annual Sports Day",
                "event_type": "sports",
                "start_date": start.isoformat(),
                "end_date": (start + timedelta(hours=4)).isoformat(),
                "is_public": True,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Annual Sports Day"
        event_id = data["id"]

        response = client.get(f"/api/v1/events/{event_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Annual Sports Day"
        assert data["rsvp_count"] == 0
        assert data["photo_count"] == 0

    def test_create_event_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Other School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "institution_id": other.id,
                "title": "Contraband Event",
                "event_type": "meeting",
                "start_date": datetime.utcnow().isoformat(),
                "end_date": datetime.utcnow().isoformat(),
            },
        )
        assert response.status_code == 403

    def test_get_nonexistent_event(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/events/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_list_and_filter_events(self, client: TestClient, auth_headers: dict, institution: Institution):
        start = datetime.utcnow() + timedelta(days=2)
        client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Science Fair",
                "event_type": "academic",
                "start_date": start.isoformat(),
                "end_date": start.isoformat(),
            },
        )

        response = client.get("/api/v1/events", headers=auth_headers, params={"event_type": "academic"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(e["title"] == "Science Fair" for e in data["items"])

    def test_calendar_events(self, client: TestClient, auth_headers: dict, institution: Institution):
        start = datetime.utcnow() + timedelta(days=3)
        client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Parent Meeting",
                "event_type": "meeting",
                "start_date": start.isoformat(),
                "end_date": start.isoformat(),
            },
        )

        response = client.get(
            "/api/v1/events/calendar",
            headers=auth_headers,
            params={
                "start_date": (start - timedelta(days=1)).isoformat(),
                "end_date": (start + timedelta(days=1)).isoformat(),
            },
        )
        assert response.status_code == 200
        assert any(e["title"] == "Parent Meeting" for e in response.json())

    def test_update_and_delete_event(self, client: TestClient, auth_headers: dict, institution: Institution):
        start = datetime.utcnow() + timedelta(days=1)
        create = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Art Exhibition",
                "event_type": "cultural",
                "start_date": start.isoformat(),
                "end_date": start.isoformat(),
            },
        )
        event_id = create.json()["id"]

        response = client.put(
            f"/api/v1/events/{event_id}",
            headers=auth_headers,
            json={"status": "confirmed"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "confirmed"

        response = client.delete(f"/api/v1/events/{event_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/events/{event_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_rsvp_workflow(
        self, client: TestClient, auth_headers: dict, institution: Institution, admin_user: User
    ):
        start = datetime.utcnow() + timedelta(days=1)
        event = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Alumni Meet",
                "event_type": "social",
                "start_date": start.isoformat(),
                "end_date": start.isoformat(),
            },
        ).json()

        response = client.post(
            f"/api/v1/events/{event['id']}/rsvp",
            headers=auth_headers,
            json={"event_id": event["id"], "user_id": admin_user.id, "status": "accepted"},
        )
        assert response.status_code == 201

        # Duplicate RSVP by the same user is rejected.
        dup = client.post(
            f"/api/v1/events/{event['id']}/rsvp",
            headers=auth_headers,
            json={"event_id": event["id"], "user_id": admin_user.id, "status": "accepted"},
        )
        assert dup.status_code == 400

        response = client.get(f"/api/v1/events/{event['id']}/rsvps", headers=auth_headers)
        assert response.status_code == 200
        rsvps = response.json()
        assert len(rsvps) == 1
        assert rsvps[0]["user_name"] == f"{admin_user.first_name} {admin_user.last_name}"

        response = client.put(
            f"/api/v1/events/{event['id']}/rsvp",
            headers=auth_headers,
            json={"status": "declined"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "declined"
        assert response.json()["response_date"] is not None

        response = client.get(f"/api/v1/events/{event['id']}", headers=auth_headers)
        assert response.json()["declined_count"] == 1

    def test_event_photo_lifecycle(self, client: TestClient, auth_headers: dict, institution: Institution):
        start = datetime.utcnow() + timedelta(days=1)
        event = client.post(
            "/api/v1/events",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "title": "Field Trip",
                "event_type": "excursion",
                "start_date": start.isoformat(),
                "end_date": start.isoformat(),
            },
        ).json()

        response = client.post(
            f"/api/v1/events/{event['id']}/photos",
            headers=auth_headers,
            json={"event_id": event["id"], "photo_url": "https://example.com/photo.jpg", "title": "Group photo"},
        )
        assert response.status_code == 201
        photo_id = response.json()["id"]

        response = client.get(f"/api/v1/events/{event['id']}/photos", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.put(
            f"/api/v1/events/photos/{photo_id}",
            headers=auth_headers,
            json={"is_featured": True},
        )
        assert response.status_code == 200
        assert response.json()["is_featured"] is True

        response = client.delete(f"/api/v1/events/photos/{photo_id}", headers=auth_headers)
        assert response.status_code == 204
