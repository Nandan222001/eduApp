"""Integration tests for the `conferences` router (src/api/v1/conferences.py).

Parent-teacher conference scheduling: teacher-created bookable slots
(single + bulk-generated), parent bookings against those slots (with
auto-generated video meeting links for virtual/hybrid slots, and two
auto-created 24h/1h `ConferenceReminder` rows per booking), booking
lifecycle actions (update/cancel/check-in/complete/upload-recording),
post-conference surveys, institution/teacher-level statistics, and a
"PTM speed dating" feature that auto-schedules a sequence of short
back-to-back slots across every teacher at the institution for one
parent+student.

Bugs found and fixed while writing this coverage:

1. **Comprehensive model/schema drift crashing every booking and every
   survey (bug class 9)** -- `src/schemas/conference.py`'s
   `ConferenceBookingBase`/`ConferenceBookingUpdate`/
   `ConferenceBookingResponse` reference `parent_topics`, `follow_up_required`,
   `follow_up_notes`, `reminder_24h_sent` and `reminder_1h_sent`, and
   `ConferenceSurveyCreate`/`ConferenceSurveyResponse` reference
   `communication_rating`, `helpfulness_rating`, `suggestions` and
   `updated_at` -- none of these had matching columns on
   `src/models/conferences.py`'s `ConferenceBooking`/`ConferenceSurvey`.
   Since `ConferenceBookingRepository.create`/`ConferenceSurveyRepository.
   create` do a plain `Model(**data.model_dump())`, **every single booking
   creation** (`POST /bookings`, and every PTM speed-dating booking) and
   **every single survey submission** (`POST /bookings/{id}/survey`) raised
   an unconditional `TypeError: '<field>' is an invalid keyword argument`.
   Response serialization was just as broken in the other direction:
   `ConferenceBookingResponse`/`ConferenceSurveyResponse` declare
   `follow_up_required`/`reminder_24h_sent`/`reminder_1h_sent`/`updated_at`
   as *required* (non-Optional, no default) fields, so even an endpoint
   that didn't construct a new row (list/get/cancel/check-in/complete/
   upload-recording) would have failed response validation the moment any
   booking/survey row existed to serialize. Confirmed these were the
   model's real missing columns, not a schema mistake, two ways: (a)
   `ConferenceBookingRepository.get_pending_reminders` already filters on
   `ConferenceBooking.reminder_24h_sent`/`.reminder_1h_sent` as if they
   existed, and (b) the PTM speed-dating service already sets `topic`/
   `notes` (both real columns) via the same `ConferenceBookingCreate`
   construction path, showing the schema's *intended* design genuinely
   needs a matching model. Fixed by adding all 5 booking columns and all 4
   survey columns to the models (see src/models/conferences.py for the
   exact column definitions and reasoning).
2. **`create_booking` never validated the target slot's actual institution
   against the request (bug class 12 variant)** -- the router only checks
   the caller's *claimed* `institution_id` against the request body
   (`current_user.institution_id == booking_data.institution_id`), never
   against the slot actually being booked. A caller could pass their own
   institution_id (satisfying the router's check) while pointing `slot_id`
   at a different institution's conference slot, creating a
   cross-institution booking against another school's teacher. Fixed by
   checking `slot.institution_id == data.institution_id` in
   `ConferenceBookingService.create_booking`.
3. **`GET /statistics/teacher/{teacher_id}` had zero institution scoping**
   -- any authenticated user from any institution could pull any other
   institution's teacher conference statistics just by guessing a
   `teacher_id`. Fixed by looking the teacher up and requiring
   `teacher.institution_id == current_user.institution_id`, 404 otherwise.
4. **PTM speed dating scheduled bookings for a `student_id` from any
   institution (bug class 12 variant)** -- `PTMSpeedDatingService.
   generate_ptm_speed_schedule` looked up the target student by id alone,
   with no institution filter, so a caller from institution A could pass a
   `student_id` belonging to institution B and the service would happily
   generate speed-dating bookings across institution A's teachers for
   institution B's student. Fixed by verifying
   `student.institution_id == institution_id` (404 otherwise, matching the
   "student not found" response a real cross-tenant lookup should give).
5. **PTM speed dating was 100% broken by two separate bugs, both only
   reachable once the model/schema drift above was fixed enough for the
   feature to run at all**:
   - `_get_or_create_speed_slot`/`_generate_talking_points` use `and_(...)`
     (a SQLAlchemy filter combinator) throughout, but `conference_service.py`
     never imported it (`from sqlalchemy.orm import Session` was the only
     top-of-file SQLAlchemy import) -- every single call raised
     `NameError: name 'and_' is not defined`. Fixed by adding
     `from sqlalchemy import and_`.
   - `_get_or_create_speed_slot` routed its new slot through
     `ConferenceSlotCreate` (the same schema `POST /slots` uses), whose
     `duration_minutes` field requires one of `[15, 30, 45, 60, 90, 120]`
     -- but PTM speed dating is explicitly documented (in both the
     router's and the service's own docstrings) as generating **5-minute**
     sequential slots, so this raised a `ValidationError` on every call.
     Fixed by constructing the `ConferenceSlot` row directly instead of
     through that schema (see src/services/conference_service.py for the
     full reasoning).
6. **`GET /bookings/my` (a parent viewing their own bookings) 403'd
   unconditionally for every caller, including real parents** --
   `src/models/user.py`'s `User` has no `parent_profile` relationship at
   all (only `teacher_profile`/`student_profile`), so
   `hasattr(current_user, 'parent_profile')` was always `False`. This
   entire endpoint -- one of the two ways a parent can see their own
   scheduled conferences -- was completely unusable. The very next lines
   already do the real check correctly (a `ParentRepository` lookup by
   `user_id`, 404 if none found), so the dead `hasattr` check was simply
   removed rather than fixed in place.
"""
import uuid
from datetime import date, datetime, time, timedelta

import pytest

from src.models.conferences import ConferenceSlot, ConferenceBooking, AvailabilityStatus, BookingStatus
from src.models.teacher import Teacher
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def parent_headers(client, parent_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": parent_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def parent_record(db_session, parent_user):
    from src.models.student import Parent
    return db_session.query(Parent).filter(Parent.user_id == parent_user.id).first()


@pytest.fixture
def future_date() -> date:
    return date.today() + timedelta(days=14)


@pytest.fixture
def slot(db_session, institution, teacher, future_date) -> ConferenceSlot:
    s = ConferenceSlot(
        institution_id=institution.id,
        teacher_id=teacher.id,
        date=future_date,
        time_slot=time(10, 0),
        duration_minutes=30,
        location="in_person",
        max_bookings=1,
        current_bookings=0,
        availability_status=AvailabilityStatus.AVAILABLE.value,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def virtual_slot(db_session, institution, teacher, future_date) -> ConferenceSlot:
    s = ConferenceSlot(
        institution_id=institution.id,
        teacher_id=teacher.id,
        date=future_date,
        time_slot=time(11, 0),
        duration_minutes=30,
        location="virtual",
        max_bookings=1,
        current_bookings=0,
        availability_status=AvailabilityStatus.AVAILABLE.value,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def booking(db_session, institution, slot, parent_record, student) -> ConferenceBooking:
    b = ConferenceBooking(
        institution_id=institution.id,
        slot_id=slot.id,
        parent_id=parent_record.id,
        student_id=student.id,
        conference_type="academic",
        booking_status=BookingStatus.CONFIRMED.value,
    )
    db_session.add(b)
    slot.current_bookings += 1
    db_session.commit()
    db_session.refresh(b)
    return b


# A second institution + admin/teacher, for cross-institution 403/404 checks.
@pytest.fixture
def other_institution(db_session):
    from src.models.institution import Institution
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
def other_admin_user(db_session, other_institution, admin_role):
    from src.models.user import User
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
def other_teacher(db_session, other_institution):
    t = Teacher(
        institution_id=other_institution.id,
        employee_id="OTHER-EMP001",
        first_name="Foreign",
        last_name="Teacher",
        email="foreignteacher@otherschool.com",
        is_active=True,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def teacher_subject(db_session, institution, teacher, subject):
    """PTMSpeedDatingService.generate_ptm_speed_schedule schedules a slot
    per TeacherSubject row in the institution -- without at least one, it
    404s with "No teachers found for institution"."""
    from src.models.teacher import TeacherSubject

    ts = TeacherSubject(institution_id=institution.id, teacher_id=teacher.id, subject_id=subject.id, is_primary=True)
    db_session.add(ts)
    db_session.commit()
    db_session.refresh(ts)
    return ts


@pytest.fixture
def other_slot(db_session, other_institution, other_teacher, future_date) -> ConferenceSlot:
    s = ConferenceSlot(
        institution_id=other_institution.id,
        teacher_id=other_teacher.id,
        date=future_date,
        time_slot=time(9, 0),
        duration_minutes=30,
        location="in_person",
        max_bookings=1,
        availability_status=AvailabilityStatus.AVAILABLE.value,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


# ===========================================================================
# POST /conferences/slots, POST /conferences/slots/bulk
# ===========================================================================
class TestCreateSlots:
    def test_requires_auth(self, client, institution, teacher, future_date):
        response = client.post(
            "/api/v1/conferences/slots",
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "date": str(future_date),
                "time_slot": "10:00:00",
                "duration_minutes": 30,
                "location": "in_person",
            },
        )
        assert response.status_code == 403

    def test_create_slot(self, client, auth_headers, institution, teacher, future_date):
        response = client.post(
            "/api/v1/conferences/slots",
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "date": str(future_date),
                "time_slot": "14:00:00",
                "duration_minutes": 30,
                "location": "in_person",
                "max_bookings": 2,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["teacher_id"] == teacher.id
        assert body["availability_status"] == "available"
        assert body["current_bookings"] == 0

    def test_create_slot_invalid_duration(self, client, auth_headers, institution, teacher, future_date):
        response = client.post(
            "/api/v1/conferences/slots",
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "date": str(future_date),
                "time_slot": "14:00:00",
                "duration_minutes": 37,
                "location": "in_person",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_slot_wrong_institution_403(self, client, auth_headers, other_institution, teacher, future_date):
        response = client.post(
            "/api/v1/conferences/slots",
            json={
                "institution_id": other_institution.id,
                "teacher_id": teacher.id,
                "date": str(future_date),
                "time_slot": "14:00:00",
                "duration_minutes": 30,
                "location": "in_person",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_bulk_slots(self, client, auth_headers, institution, teacher, future_date):
        response = client.post(
            "/api/v1/conferences/slots/bulk",
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "date_from": str(future_date),
                "date_to": str(future_date + timedelta(days=2)),
                "time_slots": ["09:00:00", "09:30:00"],
                "duration_minutes": 30,
                "location": "in_person",
                "skip_weekends": False,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert len(body) == 6  # 3 days * 2 time slots

    def test_create_bulk_slots_wrong_institution_403(self, client, auth_headers, other_institution, teacher, future_date):
        response = client.post(
            "/api/v1/conferences/slots/bulk",
            json={
                "institution_id": other_institution.id,
                "teacher_id": teacher.id,
                "date_from": str(future_date),
                "date_to": str(future_date),
                "time_slots": ["09:00:00"],
                "duration_minutes": 30,
                "location": "in_person",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403


# ===========================================================================
# GET /conferences/slots, GET /conferences/slots/available
# ===========================================================================
class TestListSlots:
    def test_list_slots(self, client, auth_headers, slot):
        response = client.get("/api/v1/conferences/slots", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        ids = [s["id"] for s in body["items"]]
        assert slot.id in ids
        assert body["total"] >= 1

    def test_list_slots_scoped_to_own_institution(self, client, auth_headers, other_slot):
        response = client.get("/api/v1/conferences/slots", headers=auth_headers)
        assert response.status_code == 200
        ids = [s["id"] for s in response.json()["items"]]
        assert other_slot.id not in ids

    def test_list_slots_filter_by_teacher(self, client, auth_headers, slot, teacher):
        response = client.get(
            "/api/v1/conferences/slots", params={"teacher_id": teacher.id}, headers=auth_headers
        )
        assert response.status_code == 200
        assert all(s["teacher_id"] == teacher.id for s in response.json()["items"])

    def test_get_available_slots(self, client, auth_headers, slot, booking, future_date):
        """`slot` is fully booked via the `booking` fixture (max_bookings=1,
        current_bookings=1) so it must not appear as available."""
        response = client.get(
            "/api/v1/conferences/slots/available",
            params={"date_from": str(future_date), "date_to": str(future_date)},
            headers=auth_headers,
        )
        assert response.status_code == 200
        ids = [s["id"] for s in response.json()]
        assert slot.id not in ids

    def test_get_available_slots_requires_date_range(self, client, auth_headers):
        response = client.get("/api/v1/conferences/slots/available", headers=auth_headers)
        assert response.status_code == 422


# ===========================================================================
# GET/PUT/DELETE /conferences/slots/{slot_id}
# ===========================================================================
class TestSlotDetail:
    def test_get_slot(self, client, auth_headers, slot):
        response = client.get(f"/api/v1/conferences/slots/{slot.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == slot.id
        assert response.json()["bookings"] == []

    def test_get_slot_404(self, client, auth_headers):
        response = client.get("/api/v1/conferences/slots/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_slot_cross_institution_403(self, client, auth_headers, other_slot):
        response = client.get(f"/api/v1/conferences/slots/{other_slot.id}", headers=auth_headers)
        assert response.status_code == 403

    def test_update_slot(self, client, auth_headers, slot):
        response = client.put(
            f"/api/v1/conferences/slots/{slot.id}",
            json={"notes": "Bring report card", "max_bookings": 3},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["notes"] == "Bring report card"
        assert response.json()["max_bookings"] == 3

    def test_update_slot_404(self, client, auth_headers):
        response = client.put(
            "/api/v1/conferences/slots/999999", json={"notes": "x"}, headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_slot_cross_institution_403(self, client, auth_headers, other_slot):
        response = client.put(
            f"/api/v1/conferences/slots/{other_slot.id}", json={"notes": "x"}, headers=auth_headers
        )
        assert response.status_code == 403

    def test_delete_slot(self, client, auth_headers, institution, teacher, future_date):
        create_resp = client.post(
            "/api/v1/conferences/slots",
            json={
                "institution_id": institution.id,
                "teacher_id": teacher.id,
                "date": str(future_date),
                "time_slot": "16:00:00",
                "duration_minutes": 30,
                "location": "in_person",
            },
            headers=auth_headers,
        )
        slot_id = create_resp.json()["id"]

        response = client.delete(f"/api/v1/conferences/slots/{slot_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_delete_slot_with_bookings_rejected(self, client, auth_headers, slot, booking):
        response = client.delete(f"/api/v1/conferences/slots/{slot.id}", headers=auth_headers)
        assert response.status_code == 400

    def test_delete_slot_404(self, client, auth_headers):
        response = client.delete("/api/v1/conferences/slots/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_slot_cross_institution_403(self, client, auth_headers, other_slot):
        response = client.delete(f"/api/v1/conferences/slots/{other_slot.id}", headers=auth_headers)
        assert response.status_code == 403


# ===========================================================================
# POST /conferences/bookings
# ===========================================================================
class TestCreateBooking:
    def test_requires_auth(self, client, institution, slot, parent_record, student):
        response = client.post(
            "/api/v1/conferences/bookings",
            json={
                "institution_id": institution.id,
                "slot_id": slot.id,
                "parent_id": parent_record.id,
                "student_id": student.id,
                "conference_type": "academic",
            },
        )
        assert response.status_code == 403

    def test_create_booking(self, client, auth_headers, institution, slot, parent_record, student, db_session):
        response = client.post(
            "/api/v1/conferences/bookings",
            json={
                "institution_id": institution.id,
                "slot_id": slot.id,
                "parent_id": parent_record.id,
                "student_id": student.id,
                "conference_type": "academic",
                "parent_topics": ["Homework habits", "Test performance"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["slot_id"] == slot.id
        assert body["booking_status"] == "confirmed"
        assert body["parent_topics"] == ["Homework habits", "Test performance"]
        assert body["reminder_24h_sent"] is False
        assert body["follow_up_required"] is False

        db_session.refresh(slot)
        assert slot.current_bookings == 1
        assert slot.availability_status == "booked"

        from src.models.conferences import ConferenceReminder
        reminders = db_session.query(ConferenceReminder).filter(
            ConferenceReminder.booking_id == body["id"]
        ).all()
        assert len(reminders) == 2
        assert {r.reminder_type for r in reminders} == {"24_hour", "1_hour"}

    def test_create_booking_generates_video_link_for_virtual_slot(self, client, auth_headers, institution, virtual_slot, parent_record, student):
        response = client.post(
            "/api/v1/conferences/bookings",
            json={
                "institution_id": institution.id,
                "slot_id": virtual_slot.id,
                "parent_id": parent_record.id,
                "student_id": student.id,
                "conference_type": "general",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["video_meeting_link"]
        assert response.json()["video_meeting_id"]

    def test_create_booking_wrong_institution_403(self, client, auth_headers, other_institution, slot, parent_record, student):
        response = client.post(
            "/api/v1/conferences/bookings",
            json={
                "institution_id": other_institution.id,
                "slot_id": slot.id,
                "parent_id": parent_record.id,
                "student_id": student.id,
                "conference_type": "academic",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_booking_slot_from_different_institution_rejected(self, client, auth_headers, institution, other_slot, parent_record, student):
        """Regression test: caller claims their own institution_id (passing
        the router-level check) but points slot_id at another
        institution's slot -- must still be rejected."""
        response = client.post(
            "/api/v1/conferences/bookings",
            json={
                "institution_id": institution.id,
                "slot_id": other_slot.id,
                "parent_id": parent_record.id,
                "student_id": student.id,
                "conference_type": "academic",
            },
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_create_booking_slot_not_found(self, client, auth_headers, institution, parent_record, student):
        response = client.post(
            "/api/v1/conferences/bookings",
            json={
                "institution_id": institution.id,
                "slot_id": 999999,
                "parent_id": parent_record.id,
                "student_id": student.id,
                "conference_type": "academic",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_create_booking_fully_booked_slot_rejected(self, client, auth_headers, institution, slot, booking, parent_record, student):
        response = client.post(
            "/api/v1/conferences/bookings",
            json={
                "institution_id": institution.id,
                "slot_id": slot.id,
                "parent_id": parent_record.id,
                "student_id": student.id,
                "conference_type": "academic",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400


# ===========================================================================
# GET /conferences/bookings, GET /conferences/bookings/my
# ===========================================================================
class TestListBookings:
    def test_list_bookings(self, client, auth_headers, booking):
        response = client.get("/api/v1/conferences/bookings", headers=auth_headers)
        assert response.status_code == 200
        ids = [b["id"] for b in response.json()["items"]]
        assert booking.id in ids

    def test_list_bookings_filter_by_status(self, client, auth_headers, booking):
        response = client.get(
            "/api/v1/conferences/bookings",
            params={"booking_status": "cancelled"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_get_my_bookings_as_parent(self, client, parent_headers, booking, parent_record):
        response = client.get("/api/v1/conferences/bookings/my", headers=parent_headers)
        assert response.status_code == 200
        ids = [b["id"] for b in response.json()]
        assert booking.id in ids
        assert response.json()[0]["slot"]["id"] == booking.slot_id

    def test_get_my_bookings_non_parent_404(self, client, auth_headers):
        """A non-parent caller has no matching Parent row, so the endpoint
        falls through to the ParentRepository lookup's 404."""
        response = client.get("/api/v1/conferences/bookings/my", headers=auth_headers)
        assert response.status_code == 404


# ===========================================================================
# GET/PUT /conferences/bookings/{booking_id}
# ===========================================================================
class TestBookingDetail:
    def test_get_booking(self, client, auth_headers, booking):
        response = client.get(f"/api/v1/conferences/bookings/{booking.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == booking.id
        assert response.json()["slot"]["id"] == booking.slot_id

    def test_get_booking_404(self, client, auth_headers):
        response = client.get("/api/v1/conferences/bookings/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_booking_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.get(f"/api/v1/conferences/bookings/{booking.id}", headers=other_admin_headers)
        assert response.status_code == 403

    def test_update_booking(self, client, auth_headers, booking):
        response = client.put(
            f"/api/v1/conferences/bookings/{booking.id}",
            json={"teacher_notes": "Discussed math progress", "follow_up_required": True, "follow_up_notes": "Check back in a month"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["teacher_notes"] == "Discussed math progress"
        assert body["follow_up_required"] is True
        assert body["follow_up_notes"] == "Check back in a month"

    def test_update_booking_404(self, client, auth_headers):
        response = client.put(
            "/api/v1/conferences/bookings/999999", json={"teacher_notes": "x"}, headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_booking_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.put(
            f"/api/v1/conferences/bookings/{booking.id}",
            json={"teacher_notes": "hijacked"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403


# ===========================================================================
# POST /conferences/bookings/{booking_id}/cancel
# ===========================================================================
class TestCancelBooking:
    def test_cancel_booking(self, client, auth_headers, booking, slot, db_session):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/cancel",
            params={"cancellation_reason": "Parent unavailable"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["booking_status"] == "cancelled"
        assert body["cancellation_reason"] == "Parent unavailable"

        db_session.refresh(slot)
        assert slot.current_bookings == 0
        assert slot.availability_status == "available"

    def test_cancel_already_cancelled_booking_rejected(self, client, auth_headers, booking):
        first = client.post(f"/api/v1/conferences/bookings/{booking.id}/cancel", headers=auth_headers)
        assert first.status_code == 200
        second = client.post(f"/api/v1/conferences/bookings/{booking.id}/cancel", headers=auth_headers)
        assert second.status_code == 400

    def test_cancel_booking_404(self, client, auth_headers):
        response = client.post("/api/v1/conferences/bookings/999999/cancel", headers=auth_headers)
        assert response.status_code == 404

    def test_cancel_booking_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/cancel", headers=other_admin_headers
        )
        assert response.status_code == 403


# ===========================================================================
# POST /conferences/bookings/{booking_id}/check-in, /complete
# ===========================================================================
class TestCheckInAndComplete:
    def test_check_in_booking(self, client, auth_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/check-in", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["checked_in_at"] is not None

    def test_check_in_booking_404(self, client, auth_headers):
        response = client.post("/api/v1/conferences/bookings/999999/check-in", headers=auth_headers)
        assert response.status_code == 404

    def test_check_in_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/check-in", headers=other_admin_headers
        )
        assert response.status_code == 403

    def test_complete_booking(self, client, auth_headers, booking, slot, db_session):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/complete", headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert body["booking_status"] == "completed"
        assert body["completed_at"] is not None

        db_session.refresh(slot)
        assert slot.availability_status == "completed"

    def test_complete_booking_404(self, client, auth_headers):
        response = client.post("/api/v1/conferences/bookings/999999/complete", headers=auth_headers)
        assert response.status_code == 404

    def test_complete_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/complete", headers=other_admin_headers
        )
        assert response.status_code == 403


# ===========================================================================
# POST /conferences/bookings/{booking_id}/recording
# ===========================================================================
class TestUploadRecording:
    def test_upload_recording(self, client, auth_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/recording",
            json={
                "booking_id": booking.id,
                "recording_url": "https://s3.amazonaws.com/bucket/rec.mp4",
                "recording_s3_key": "recordings/rec.mp4",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["recording_url"] == "https://s3.amazonaws.com/bucket/rec.mp4"

    def test_upload_recording_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/conferences/bookings/999999/recording",
            json={"booking_id": 999999, "recording_url": "https://x.com/r.mp4"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_upload_recording_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/recording",
            json={"booking_id": booking.id, "recording_url": "https://x.com/r.mp4"},
            headers=other_admin_headers,
        )
        assert response.status_code == 403


# ===========================================================================
# POST/GET /conferences/bookings/{booking_id}/survey
# ===========================================================================
class TestConferenceSurvey:
    def test_submit_survey(self, client, auth_headers, booking, db_session):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/survey",
            json={
                "booking_id": booking.id,
                "respondent_type": "teacher",
                "rating": 5,
                "feedback": "Great conversation",
                "communication_rating": 4,
                "helpfulness_rating": 5,
                "would_recommend": True,
                "suggestions": "More time next time",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["rating"] == 5
        assert body["communication_rating"] == 4
        assert body["helpfulness_rating"] == 5
        assert body["suggestions"] == "More time next time"
        assert body["submitted_at"] is not None
        assert body["updated_at"] is not None

    def test_submit_survey_booking_id_mismatch(self, client, auth_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/survey",
            json={"booking_id": booking.id + 1, "respondent_type": "teacher", "rating": 5},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_submit_survey_invalid_respondent_type(self, client, auth_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/survey",
            json={"booking_id": booking.id, "respondent_type": "student", "rating": 5},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_submit_survey_booking_404(self, client, auth_headers):
        response = client.post(
            "/api/v1/conferences/bookings/999999/survey",
            json={"booking_id": 999999, "respondent_type": "teacher", "rating": 5},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_submit_survey_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/survey",
            json={"booking_id": booking.id, "respondent_type": "parent", "rating": 3},
            headers=other_admin_headers,
        )
        assert response.status_code == 403

    def test_resubmitting_survey_updates_existing(self, client, auth_headers, booking):
        first = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/survey",
            json={"booking_id": booking.id, "respondent_type": "teacher", "rating": 3},
            headers=auth_headers,
        )
        assert first.status_code == 201
        second = client.post(
            f"/api/v1/conferences/bookings/{booking.id}/survey",
            json={"booking_id": booking.id, "respondent_type": "teacher", "rating": 5},
            headers=auth_headers,
        )
        assert second.status_code == 201
        assert second.json()["id"] == first.json()["id"]
        assert second.json()["rating"] == 5

    def test_get_survey(self, client, auth_headers, booking):
        client.post(
            f"/api/v1/conferences/bookings/{booking.id}/survey",
            json={"booking_id": booking.id, "respondent_type": "teacher", "rating": 4},
            headers=auth_headers,
        )
        response = client.get(f"/api/v1/conferences/bookings/{booking.id}/survey", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["rating"] == 4

    def test_get_survey_404_when_none_submitted(self, client, auth_headers, booking):
        response = client.get(f"/api/v1/conferences/bookings/{booking.id}/survey", headers=auth_headers)
        assert response.status_code == 404

    def test_get_survey_booking_404(self, client, auth_headers):
        response = client.get("/api/v1/conferences/bookings/999999/survey", headers=auth_headers)
        assert response.status_code == 404

    def test_get_survey_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.get(
            f"/api/v1/conferences/bookings/{booking.id}/survey", headers=other_admin_headers
        )
        assert response.status_code == 403


# ===========================================================================
# GET /conferences/statistics, GET /conferences/statistics/teacher/{id}
# ===========================================================================
class TestStatistics:
    def test_get_institution_statistics(self, client, auth_headers, slot, booking):
        response = client.get("/api/v1/conferences/statistics", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["total_slots"] >= 1
        assert body["total_bookings"] >= 1

    def test_get_teacher_statistics(self, client, auth_headers, teacher, slot, booking):
        response = client.get(
            f"/api/v1/conferences/statistics/teacher/{teacher.id}", headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert body["teacher_id"] == teacher.id
        assert body["total_slots_created"] >= 1
        assert body["total_bookings"] >= 1

    def test_get_teacher_statistics_404(self, client, auth_headers):
        response = client.get(
            "/api/v1/conferences/statistics/teacher/999999", headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_teacher_statistics_cross_institution_404(self, client, auth_headers, other_teacher):
        """Regression test: previously had zero institution scoping at all
        -- any authenticated user could pull any institution's teacher
        stats by guessing a teacher_id."""
        response = client.get(
            f"/api/v1/conferences/statistics/teacher/{other_teacher.id}", headers=auth_headers
        )
        assert response.status_code == 404


# ===========================================================================
# POST /conferences/ptm-speed-dating/schedule
# ===========================================================================
class TestPTMSpeedDating:
    def test_schedule_ptm_speed_dating(self, client, auth_headers, parent_record, student, teacher, teacher_subject, future_date, db_session):
        response = client.post(
            "/api/v1/conferences/ptm-speed-dating/schedule",
            params={
                "parent_id": parent_record.id,
                "student_id": student.id,
                "target_date": str(future_date),
                "start_time": "09:00",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        body = response.json()
        assert len(body) >= 1
        booking = body[0]
        assert booking["booking_status"] == "confirmed"
        # ConferenceBookingResponse doesn't expose speed_round/
        # auto_talking_points (that's what GET .../talking-points is for --
        # covered separately below); just confirm the booking round-trips.
        assert booking["id"] is not None

    def test_schedule_ptm_speed_dating_invalid_time_format(self, client, auth_headers, parent_record, student, future_date):
        response = client.post(
            "/api/v1/conferences/ptm-speed-dating/schedule",
            params={
                "parent_id": parent_record.id,
                "student_id": student.id,
                "target_date": str(future_date),
                "start_time": "not-a-time",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_schedule_ptm_speed_dating_student_not_found(self, client, auth_headers, parent_record, future_date):
        response = client.post(
            "/api/v1/conferences/ptm-speed-dating/schedule",
            params={
                "parent_id": parent_record.id,
                "student_id": 999999,
                "target_date": str(future_date),
                "start_time": "09:00",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_schedule_ptm_speed_dating_cross_institution_student_rejected(
        self, client, auth_headers, parent_record, future_date, other_institution, db_session, section, academic_year
    ):
        """Regression test: a student_id from a different institution than
        the caller's must not be usable to auto-schedule speed-dating
        bookings against the caller's own institution's teachers."""
        from src.models.student import Student

        foreign_student = Student(
            institution_id=other_institution.id,
            first_name="Foreign",
            last_name="Kid",
            is_active=True,
        )
        db_session.add(foreign_student)
        db_session.commit()
        db_session.refresh(foreign_student)

        response = client.post(
            "/api/v1/conferences/ptm-speed-dating/schedule",
            params={
                "parent_id": parent_record.id,
                "student_id": foreign_student.id,
                "target_date": str(future_date),
                "start_time": "09:00",
            },
            headers=auth_headers,
        )
        assert response.status_code == 404


# ===========================================================================
# GET /conferences/bookings/{booking_id}/talking-points
# ===========================================================================
class TestTalkingPoints:
    def test_talking_points_not_a_speed_booking(self, client, auth_headers, booking):
        response = client.get(
            f"/api/v1/conferences/bookings/{booking.id}/talking-points", headers=auth_headers
        )
        assert response.status_code == 400

    def test_talking_points_404(self, client, auth_headers):
        response = client.get(
            "/api/v1/conferences/bookings/999999/talking-points", headers=auth_headers
        )
        assert response.status_code == 404

    def test_talking_points_cross_institution_403(self, client, other_admin_headers, booking):
        response = client.get(
            f"/api/v1/conferences/bookings/{booking.id}/talking-points", headers=other_admin_headers
        )
        assert response.status_code == 403

    def test_talking_points_for_speed_booking(self, client, auth_headers, parent_record, student, teacher_subject, future_date):
        schedule_resp = client.post(
            "/api/v1/conferences/ptm-speed-dating/schedule",
            params={
                "parent_id": parent_record.id,
                "student_id": student.id,
                "target_date": str(future_date),
                "start_time": "10:00",
            },
            headers=auth_headers,
        )
        booking_id = schedule_resp.json()[0]["id"]

        response = client.get(
            f"/api/v1/conferences/bookings/{booking_id}/talking-points", headers=auth_headers
        )
        assert response.status_code == 200
        body = response.json()
        assert body["booking_id"] == booking_id
        assert body["speed_round"] is True
        assert "points" in body["auto_talking_points"]
