import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student


@pytest.mark.integration
class TestTransportAPI:
    """Integration tests for /api/v1/transport/*, the real, mounted router
    (src/api/v1/transport.py) backed by src/models/transport.py and
    src/schemas/transport.py. See TESTING_PROGRESS.md's "twenty-third pass"
    for how this router was found unregistered (fixed) and previously
    completely untested.

    No endpoint in this router makes an external network/GPS/maps call --
    route/stop geo fields (latitude/longitude) are plain stored coordinates,
    not calls to a geocoding or mapping service -- so nothing here needed to
    be skipped for lack of network access in this test environment.
    """

    def _route_payload(self, institution_id: int, **overrides) -> dict:
        payload = {
            "institution_id": institution_id,
            "route_number": "R-1",
            "route_name": "Downtown Loop",
            "start_location": "School Campus",
            "end_location": "Downtown Terminal",
            "total_distance_km": "12.5",
            "estimated_duration_minutes": 40,
            "vehicle_type": "bus",
            "vehicle_number": "KA-01-AB-1234",
            "vehicle_capacity": 40,
            "driver_name": "Ravi Kumar",
            "driver_phone": "+911234567890",
            "monthly_fee": "1500.00",
        }
        payload.update(overrides)
        return payload

    def test_create_and_get_route(self, client: TestClient, auth_headers: dict, institution: Institution):
        response = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["route_name"] == "Downtown Loop"
        assert data["status"] == "active"
        assert data["is_active"] is True
        route_id = data["id"]

        response = client.get(f"/api/v1/transport/routes/{route_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["route_number"] == "R-1"
        assert data["stops"] == []

    def test_create_route_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other_institution = Institution(name="Rival School", is_active=True)
        db_session.add(other_institution)
        db_session.commit()
        db_session.refresh(other_institution)

        response = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(other_institution.id),
        )
        assert response.status_code == 403

    def test_get_nonexistent_route(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/transport/routes/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_list_routes_with_filters(self, client: TestClient, auth_headers: dict, institution: Institution):
        client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-LIST", vehicle_type="van"),
        )

        response = client.get("/api/v1/transport/routes", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(r["route_number"] == "R-LIST" for r in data["items"])

        response = client.get(
            "/api/v1/transport/routes",
            headers=auth_headers,
            params={"vehicle_type": "van"},
        )
        assert response.status_code == 200
        assert all(r["vehicle_type"] == "van" for r in response.json()["items"])

        response = client.get(
            "/api/v1/transport/routes",
            headers=auth_headers,
            params={"vehicle_type": "car"},
        )
        assert response.json()["total"] == 0

    def test_update_and_delete_route(self, client: TestClient, auth_headers: dict, institution: Institution):
        create = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-UPD"),
        )
        route_id = create.json()["id"]

        response = client.put(
            f"/api/v1/transport/routes/{route_id}",
            headers=auth_headers,
            json={"status": "maintenance", "driver_name": "New Driver"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "maintenance"
        assert data["driver_name"] == "New Driver"

        response = client.delete(f"/api/v1/transport/routes/{route_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/transport/routes/{route_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_create_list_update_and_delete_stop(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        route = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-STOPS"),
        ).json()
        route_id = route["id"]

        # Nested under /routes/{route_id}/stops to match the real frontend
        # (frontend/src/api/transport.ts's createStop/updateStop/deleteStop).
        response = client.post(
            f"/api/v1/transport/routes/{route_id}/stops",
            headers=auth_headers,
            json={
                "stop_name": "Main Gate",
                "stop_address": "1 Main St",
                "stop_order": 1,
                "pickup_time": "07:30:00",
                "drop_time": "15:30:00",
                "latitude": "12.9716",
                "longitude": "77.5946",
            },
        )
        assert response.status_code == 201
        stop = response.json()
        assert stop["route_id"] == route_id
        assert stop["stop_name"] == "Main Gate"
        stop_id = stop["id"]

        response = client.get(f"/api/v1/transport/routes/{route_id}/stops", headers=auth_headers)
        assert response.status_code == 200
        stops = response.json()
        assert len(stops) == 1
        assert stops[0]["id"] == stop_id

        response = client.put(
            f"/api/v1/transport/routes/{route_id}/stops/{stop_id}",
            headers=auth_headers,
            json={"stop_name": "Main Gate (renamed)"},
        )
        assert response.status_code == 200
        assert response.json()["stop_name"] == "Main Gate (renamed)"

        response = client.delete(
            f"/api/v1/transport/routes/{route_id}/stops/{stop_id}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(f"/api/v1/transport/routes/{route_id}/stops", headers=auth_headers)
        assert response.json() == []

    def test_stop_not_found_under_wrong_route(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        route_a = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-A"),
        ).json()
        route_b = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-B"),
        ).json()

        stop = client.post(
            f"/api/v1/transport/routes/{route_a['id']}/stops",
            headers=auth_headers,
            json={"stop_name": "Stop A", "stop_order": 1},
        ).json()

        response = client.put(
            f"/api/v1/transport/routes/{route_b['id']}/stops/{stop['id']}",
            headers=auth_headers,
            json={"stop_name": "Hijacked"},
        )
        assert response.status_code == 404

    def test_assign_student_get_and_list(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        route = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-ASSIGN"),
        ).json()

        response = client.post(
            "/api/v1/transport/student-assignments",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "route_id": route["id"],
                "pickup_location": "Home Gate",
                "drop_location": "School Gate",
                "monthly_fee": "1500.00",
                "start_date": "2026-04-01T00:00:00",
                "emergency_contact_name": "Parent Name",
                "emergency_contact_phone": "+911111111111",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["student_id"] == student.id
        assert data["route_id"] == route["id"]
        assert data["pickup_location"] == "Home Gate"
        assignment_id = data["id"]

        response = client.get(
            f"/api/v1/transport/student-assignments/{assignment_id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["emergency_contact_name"] == "Parent Name"

        response = client.get(
            "/api/v1/transport/student-assignments",
            headers=auth_headers,
            params={"route_id": route["id"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(a["id"] == assignment_id for a in data["items"])

    def test_duplicate_active_assignment_rejected(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        route = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-DUP"),
        ).json()

        payload = {
            "institution_id": institution.id,
            "student_id": student.id,
            "route_id": route["id"],
            "start_date": "2026-04-01T00:00:00",
        }
        first = client.post(
            "/api/v1/transport/student-assignments", headers=auth_headers, json=payload
        )
        assert first.status_code == 201

        second = client.post(
            "/api/v1/transport/student-assignments", headers=auth_headers, json=payload
        )
        assert second.status_code == 400

    def test_update_and_delete_assignment(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        route = client.post(
            "/api/v1/transport/routes",
            headers=auth_headers,
            json=self._route_payload(institution.id, route_number="R-UPDASSIGN"),
        ).json()

        assignment = client.post(
            "/api/v1/transport/student-assignments",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "route_id": route["id"],
                "start_date": "2026-04-01T00:00:00",
            },
        ).json()

        response = client.put(
            f"/api/v1/transport/student-assignments/{assignment['id']}",
            headers=auth_headers,
            json={"is_active": False, "remarks": "Moved to a different school"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False
        assert data["remarks"] == "Moved to a different school"

        response = client.delete(
            f"/api/v1/transport/student-assignments/{assignment['id']}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(
            f"/api/v1/transport/student-assignments/{assignment['id']}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_assign_student_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session, student: Student
    ):
        other_institution = Institution(name="Other District School", is_active=True)
        db_session.add(other_institution)
        db_session.commit()
        db_session.refresh(other_institution)

        response = client.post(
            "/api/v1/transport/student-assignments",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "student_id": student.id,
                "route_id": 1,
                "start_date": "2026-04-01T00:00:00",
            },
        )
        assert response.status_code == 403
