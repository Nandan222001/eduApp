import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Parent, Student
from src.models.user import User


def _group_payload(institution_id: int, organizer_parent_id: int, **overrides) -> dict:
    payload = {
        "institution_id": institution_id,
        "organizer_parent_id": organizer_parent_id,
        "group_name": "Maple Street Carpool",
        "members": [
            {
                "parent_id": organizer_parent_id,
                "parent_name": "Organizer Parent",
                "phone": "+1234567890",
                "students": [{"student_id": 1, "student_name": "Kid One"}],
            }
        ],
        "pickup_points": [
            {"address": "123 Maple St", "pickup_time": "07:00:00", "drop_time": "15:00:00"}
        ],
        "rotation_schedule": {"days": ["monday", "wednesday", "friday"]},
        "max_members": 4,
    }
    payload.update(overrides)
    return payload


def _request_payload(institution_id: int, parent_id: int, student_id: int, **overrides) -> dict:
    payload = {
        "institution_id": institution_id,
        "parent_id": parent_id,
        "request_type": "seeking",
        "student_ids": [student_id],
        "route": {
            "start_address": "123 Maple St",
            "start_latitude": "12.9716",
            "start_longitude": "77.5946",
            "end_address": "School",
            "end_latitude": "12.9800",
            "end_longitude": "77.6000",
        },
        "schedule_days": ["monday", "wednesday", "friday"],
        "departure_time": "07:00:00",
        # matching_criteria is a plain Dict[str, Any] (not validated against the
        # MatchingCriteria schema), so unlike this codebase's Decimal fields
        # (which do accept numeric strings) these values must be real JSON
        # numbers -- carpool_service.calculate_route_compatibility compares
        # them directly against a computed float with no str->float coercion.
        "matching_criteria": {"max_distance_km": 10, "preferred_departure_time_window": 30},
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def parent(db_session: Session, parent_user: User) -> Parent:
    """The Parent row created alongside parent_user."""
    return db_session.query(Parent).filter(Parent.user_id == parent_user.id).first()


@pytest.fixture
def second_parent(db_session: Session, institution: Institution) -> Parent:
    parent = Parent(
        institution_id=institution.id,
        first_name="Second",
        last_name="Parent",
        email="second.parent@testschool.com",
        phone="+1987654321",
        relation_type="mother",
        is_primary_contact=True,
        is_active=True,
    )
    db_session.add(parent)
    db_session.commit()
    db_session.refresh(parent)
    return parent


@pytest.mark.integration
class TestCarpoolsAPI:
    """Integration tests for /api/v1/carpools/*, the real, mounted router
    (src/api/v1/carpools.py) backed by src/models/carpools.py,
    src/schemas/carpool.py and src/services/carpool_service.py. The
    router mounts with a bare `APIRouter()` (no internal prefix), so no
    doubled-prefix issue (bug class 5), and its route decorators don't
    exhibit the static-path-after-param-route ordering bug (bug class 7)
    either -- every static segment (e.g. `/groups`, `/rides`) is declared
    at a different path-segment count than its `{id}` sibling. Route
    matching for real geocoding/distance data (`find_compatible_carpools`)
    uses a pure-Python haversine calculation against lat/lon stored on
    the request/group JSON columns -- no external maps/geocoding API is
    called, so full matching-workflow coverage below is exercised
    end-to-end with no network dependency to skip."""

    # ---- Groups -----------------------------------------------------

    def test_create_and_get_group(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent
    ):
        response = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, parent.id),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["group_name"] == "Maple Street Carpool"
        assert data["status"] == "active"
        assert data["max_members"] == 4
        group_id = data["id"]

        response = client.get(f"/api/v1/carpools/groups/{group_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["organizer_parent_id"] == parent.id

    def test_create_group_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session, parent: Parent
    ):
        other = Institution(name="Rival Carpool School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(other.id, parent.id),
        )
        assert response.status_code == 403

    def test_create_group_unknown_parent_not_found(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, 999999),
        )
        assert response.status_code == 404

    def test_list_groups_with_status_filter(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent
    ):
        create = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, parent.id, group_name="Filterable Group"),
        )
        group_id = create.json()["id"]

        response = client.get("/api/v1/carpools/groups", headers=auth_headers, params={"status": "active"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(g["id"] == group_id for g in data["items"])

        response = client.get("/api/v1/carpools/groups", headers=auth_headers, params={"status": "suspended"})
        assert response.status_code == 200
        assert all(g["id"] != group_id for g in response.json()["items"])

    def test_update_and_delete_group(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent
    ):
        create = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, parent.id, group_name="To Be Renamed"),
        )
        group_id = create.json()["id"]

        response = client.put(
            f"/api/v1/carpools/groups/{group_id}",
            headers=auth_headers,
            json={"group_name": "Renamed Carpool", "status": "inactive"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["group_name"] == "Renamed Carpool"
        assert data["status"] == "inactive"

        response = client.delete(f"/api/v1/carpools/groups/{group_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/carpools/groups/{group_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_join_group_and_rotate_driver(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        parent: Parent,
        second_parent: Parent,
    ):
        create = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, parent.id, max_members=5),
        )
        group_id = create.json()["id"]
        assert len(create.json()["members"]) == 1

        # `parent_id` is a query param and the body is the raw students
        # array -- `students: List[dict]` has no explicit Body()/pydantic
        # model, so FastAPI treats the whole JSON body as that one field.
        response = client.post(
            f"/api/v1/carpools/groups/{group_id}/join",
            headers=auth_headers,
            params={"parent_id": second_parent.id},
            json=[{"student_id": 2, "student_name": "Kid Two"}],
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["members"]) == 2
        assert any(m["parent_id"] == second_parent.id for m in data["members"])

        # Joining with an unknown parent is rejected.
        response = client.post(
            f"/api/v1/carpools/groups/{group_id}/join",
            headers=auth_headers,
            params={"parent_id": 999999},
            json=[{"student_id": 3, "student_name": "Kid Three"}],
        )
        assert response.status_code == 400

        response = client.post(
            f"/api/v1/carpools/groups/{group_id}/rotate-driver",
            headers=auth_headers,
            json={
                "new_driver_parent_id": second_parent.id,
                "week_start_date": date.today().isoformat(),
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["active_driver_parent_id"] == second_parent.id
        assert data["current_week_start"] == date.today().isoformat()

        # Rotating to a non-member is rejected.
        response = client.post(
            f"/api/v1/carpools/groups/{group_id}/rotate-driver",
            headers=auth_headers,
            json={
                "new_driver_parent_id": 999999,
                "week_start_date": date.today().isoformat(),
            },
        )
        assert response.status_code == 400

    def test_create_ride_schedule(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent
    ):
        create = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, parent.id),
        )
        group_id = create.json()["id"]

        start = date.today()
        end = start + timedelta(days=6)
        response = client.post(
            f"/api/v1/carpools/groups/{group_id}/schedule",
            headers=auth_headers,
            params={"start_date": start.isoformat(), "end_date": end.isoformat()},
        )
        assert response.status_code == 201
        data = response.json()
        # rotation_schedule requests monday/wednesday/friday; a 7-day window
        # contains one of each, x2 rides (morning+afternoon) per matched day.
        assert data["rides_created"] == 6

        response = client.get(
            "/api/v1/carpools/rides", headers=auth_headers, params={"group_id": group_id}
        )
        assert response.status_code == 200
        assert response.json()["total"] == 6

    # ---- Requests + matching -----------------------------------------

    def test_create_and_get_request(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent, student: Student
    ):
        response = client.post(
            "/api/v1/carpools/requests",
            headers=auth_headers,
            json=_request_payload(institution.id, parent.id, student.id),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "active"
        assert data["request_type"] == "seeking"
        request_id = data["id"]

        response = client.get(f"/api/v1/carpools/requests/{request_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["student_ids"] == [student.id]

    def test_create_request_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session, parent: Parent, student: Student
    ):
        other = Institution(name="Other Carpool School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/carpools/requests",
            headers=auth_headers,
            json=_request_payload(other.id, parent.id, student.id),
        )
        assert response.status_code == 403

    def test_list_requests_with_filters(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent, student: Student
    ):
        create = client.post(
            "/api/v1/carpools/requests",
            headers=auth_headers,
            json=_request_payload(institution.id, parent.id, student.id, request_type="offering", available_seats=3),
        )
        request_id = create.json()["id"]

        response = client.get(
            "/api/v1/carpools/requests",
            headers=auth_headers,
            params={"request_type": "offering", "parent_id": parent.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(r["id"] == request_id for r in data["items"])

        response = client.get(
            "/api/v1/carpools/requests", headers=auth_headers, params={"request_type": "seeking"}
        )
        assert response.status_code == 200
        assert all(r["id"] != request_id for r in response.json()["items"])

    def test_update_and_delete_request(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent, student: Student
    ):
        create = client.post(
            "/api/v1/carpools/requests",
            headers=auth_headers,
            json=_request_payload(institution.id, parent.id, student.id),
        )
        request_id = create.json()["id"]

        response = client.put(
            f"/api/v1/carpools/requests/{request_id}",
            headers=auth_headers,
            json={"status": "cancelled", "notes": "No longer needed"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"
        assert data["notes"] == "No longer needed"

        response = client.delete(f"/api/v1/carpools/requests/{request_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/carpools/requests/{request_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_find_matching_carpools_and_get_matches(
        self,
        client: TestClient,
        auth_headers: dict,
        institution: Institution,
        parent: Parent,
        second_parent: Parent,
        student: Student,
    ):
        # An "offering" request from one parent with nearby coordinates,
        # overlapping schedule days and enough seats for the "seeking"
        # request below to match against.
        offering = client.post(
            "/api/v1/carpools/requests",
            headers=auth_headers,
            json=_request_payload(
                institution.id,
                second_parent.id,
                student.id,
                request_type="offering",
                available_seats=3,
                route={
                    "start_address": "125 Maple St",
                    "start_latitude": "12.9720",
                    "start_longitude": "77.5950",
                    "end_address": "School",
                },
            ),
        ).json()

        seeking = client.post(
            "/api/v1/carpools/requests",
            headers=auth_headers,
            json=_request_payload(institution.id, parent.id, student.id, request_type="seeking"),
        ).json()

        response = client.post(
            f"/api/v1/carpools/requests/{seeking['id']}/match",
            headers=auth_headers,
            json={"max_results": 10, "include_groups": False, "include_requests": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_matches"] == 1
        assert data["matches"][0]["matched_request_id"] == offering["id"]
        assert float(data["matches"][0]["compatibility_score"]) > 0

        response = client.get(f"/api/v1/carpools/matches/{seeking['id']}", headers=auth_headers)
        assert response.status_code == 200
        match_data = response.json()
        assert match_data["total"] == 1
        assert match_data["items"][0]["matched_request_id"] == offering["id"]

    # ---- Rides ---------------------------------------------------------

    def test_create_list_update_ride(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent
    ):
        group = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, parent.id),
        ).json()

        ride_date = date.today().isoformat()
        response = client.post(
            "/api/v1/carpools/rides",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "group_id": group["id"],
                "driver_parent_id": parent.id,
                "ride_date": ride_date,
                "ride_type": "morning",
                "passengers": [{"student_id": 1, "student_name": "Kid One"}],
                "pickup_sequence": [{"address": "123 Maple St", "pickup_time": "07:00:00"}],
                "pickup_time": "07:00:00",
            },
        )
        assert response.status_code == 201
        ride = response.json()
        assert ride["confirmation_status"] == "scheduled"
        ride_id = ride["id"]

        response = client.get(f"/api/v1/carpools/rides/{ride_id}", headers=auth_headers)
        assert response.status_code == 200

        response = client.get(
            "/api/v1/carpools/rides", headers=auth_headers, params={"ride_date": ride_date, "status": "scheduled"}
        )
        assert response.status_code == 200
        assert any(r["id"] == ride_id for r in response.json()["items"])

        response = client.put(
            f"/api/v1/carpools/rides/{ride_id}",
            headers=auth_headers,
            json={"notes": "Running 5 minutes late"},
        )
        assert response.status_code == 200
        assert response.json()["notes"] == "Running 5 minutes late"

        response = client.delete(f"/api/v1/carpools/rides/{ride_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_confirm_ride_workflow(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent, second_parent: Parent
    ):
        group = client.post(
            "/api/v1/carpools/groups",
            headers=auth_headers,
            json=_group_payload(institution.id, parent.id),
        ).json()

        # Two passengers -> confirm_ride's service call is exercised twice on
        # the same ride, so a second write to the `confirmations` JSON column
        # must actually persist the first parent's earlier confirmation too
        # (regression coverage for the same-object JSON-mutation bug fixed in
        # CarpoolService.confirm_ride: `ride.confirmations = confirmations`
        # where `confirmations is ride.confirmations` was invisible to
        # SQLAlchemy's change tracking and silently dropped from the UPDATE).
        ride = client.post(
            "/api/v1/carpools/rides",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "group_id": group["id"],
                "driver_parent_id": parent.id,
                "ride_date": date.today().isoformat(),
                "ride_type": "morning",
                "passengers": [
                    {"student_id": 1, "student_name": "Kid One"},
                    {"student_id": 2, "student_name": "Kid Two"},
                ],
                "pickup_sequence": [{"address": "123 Maple St", "pickup_time": "07:00:00"}],
                "pickup_time": "07:00:00",
            },
        ).json()

        response = client.post(
            f"/api/v1/carpools/rides/{ride['id']}/confirm",
            headers=auth_headers,
            json={"parent_id": parent.id, "confirmation": True, "notes": "All set"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["confirmation_status"] == "scheduled"
        assert data["confirmations"][str(parent.id)]["confirmed"] is True

        response = client.post(
            f"/api/v1/carpools/rides/{ride['id']}/confirm",
            headers=auth_headers,
            json={"parent_id": second_parent.id, "confirmation": True, "notes": "Also set"},
        )
        assert response.status_code == 200
        data = response.json()
        # Both confirmations must be present -- the first one only survives
        # this second write if it wasn't silently dropped from the UPDATE.
        assert len(data["confirmations"]) == 2
        assert data["confirmations"][str(parent.id)]["confirmed"] is True
        assert data["confirmations"][str(second_parent.id)]["confirmed"] is True
        assert data["confirmation_status"] == "confirmed"

        # Confirming a nonexistent ride is rejected cleanly.
        response = client.post(
            "/api/v1/carpools/rides/999999/confirm",
            headers=auth_headers,
            json={"parent_id": parent.id, "confirmation": True},
        )
        assert response.status_code == 400

    # ---- Emergencies -----------------------------------------------------

    def test_create_list_update_emergency(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent, second_parent: Parent
    ):
        group_payload = _group_payload(institution.id, parent.id)
        group_payload["members"].append(
            {
                "parent_id": second_parent.id,
                "parent_name": "Second Parent",
                "phone": "+1987654321",
                "students": [{"student_id": 2, "student_name": "Kid Two"}],
            }
        )
        group = client.post(
            "/api/v1/carpools/groups", headers=auth_headers, json=group_payload
        ).json()

        ride = client.post(
            "/api/v1/carpools/rides",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "group_id": group["id"],
                "driver_parent_id": parent.id,
                "ride_date": date.today().isoformat(),
                "ride_type": "morning",
                "passengers": [{"student_id": 1, "student_name": "Kid One"}],
                "pickup_sequence": [{"address": "123 Maple St", "pickup_time": "07:00:00"}],
                "pickup_time": "07:00:00",
            },
        ).json()

        response = client.post(
            "/api/v1/carpools/emergencies",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "ride_id": ride["id"],
                "reporter_parent_id": parent.id,
                "emergency_type": "breakdown",
                "severity": "high",
                "description": "Flat tire on the highway",
                "notified_parents": [second_parent.id],
                "estimated_delay": 20,
            },
        )
        assert response.status_code == 201
        data = response.json()
        # notified_parents on the response is server-computed (every other
        # group member), not the client-submitted list.
        assert data["notified_parents"] == [second_parent.id]
        assert data["resolved_at"] is None
        emergency_id = data["id"]

        response = client.get(f"/api/v1/carpools/emergencies/{emergency_id}", headers=auth_headers)
        assert response.status_code == 200

        response = client.get(
            "/api/v1/carpools/emergencies",
            headers=auth_headers,
            params={"ride_id": ride["id"], "resolved": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(e["id"] == emergency_id for e in data["items"])

        response = client.get(
            "/api/v1/carpools/emergencies", headers=auth_headers, params={"resolved": True}
        )
        assert response.status_code == 200
        assert all(e["id"] != emergency_id for e in response.json()["items"])

        response = client.put(
            f"/api/v1/carpools/emergencies/{emergency_id}",
            headers=auth_headers,
            json={"resolution": "Spare tire installed", "resolved_at": "2026-01-01T10:00:00"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["resolution"] == "Spare tire installed"
        assert data["resolved_at"] is not None

    def test_create_emergency_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, institution: Institution, parent: Parent
    ):
        group = client.post(
            "/api/v1/carpools/groups", headers=auth_headers, json=_group_payload(institution.id, parent.id)
        ).json()
        ride = client.post(
            "/api/v1/carpools/rides",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "group_id": group["id"],
                "driver_parent_id": parent.id,
                "ride_date": date.today().isoformat(),
                "ride_type": "morning",
                "passengers": [{"student_id": 1, "student_name": "Kid One"}],
                "pickup_sequence": [{"address": "123 Maple St", "pickup_time": "07:00:00"}],
                "pickup_time": "07:00:00",
            },
        ).json()

        response = client.post(
            "/api/v1/carpools/emergencies",
            headers=auth_headers,
            json={
                "institution_id": institution.id + 999999,
                "ride_id": ride["id"],
                "reporter_parent_id": parent.id,
                "emergency_type": "accident",
                "severity": "critical",
                "description": "Collision at intersection",
                "notified_parents": [],
            },
        )
        assert response.status_code == 403
