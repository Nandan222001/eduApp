"""Integration tests for the `timetables` router (src/api/v1/timetables.py).

Timetable templates (a reusable period grid), their period slots, per-section
"timetable instances" for an academic year, that instance's day/period/
subject/teacher entries, and cross-section teacher-conflict validation.

Real bugs found and fixed while writing this coverage:

1. **Severe model/schema drift across the entire router (bug class 11) --
   the router was completely non-functional.** `src.models.timetable`'s
   actual `PeriodSlot`/`TimetableEntry` models are normalized as
   `TimetableTemplate -> PeriodSlot` (keyed by `period_number`, no
   `institution_id` of its own) and, separately, `Timetable` (one per
   section+academic_year, optionally following a template) `->
   TimetableEntry` (day_of_week/period_number/subject/teacher, again no
   `institution_id`/`template_id`/`section_id`/`period_id` columns) -- but
   the router referenced `Period.institution_id`, `Period.display_order`,
   `TimetableEntry.institution_id`, `TimetableEntry.template_id`,
   `TimetableEntry.section_id`, and `TimetableEntry.period_id`, none of
   which exist. Every endpoint that touched a period or entry raised an
   `AttributeError` building its query. This is very likely the same
   underlying cause as `src/api/v1/timetable.py` (singular)'s separately-
   known `DayOfWeek`-import crash -- both routers/schemas read like they
   were written against an older, richer version of the model that has
   since been normalized, and neither was updated to match. Per this
   session's scope, only this router (and the `academic.py` schema classes
   used exclusively by it) were fixed here; `timetable.py` (singular) was
   left untouched as previously flagged.

   Fixed by rebuilding the router (and the `TimetableTemplate*`/`Period*`/
   `TimetableEntry*` schemas in `src/schemas/academic.py`, which back only
   this router) to match the real model shape, including exposing the
   previously-missing "timetable instance" resource (`POST/GET/DELETE
   /instances`) that `TimetableEntry` actually hangs off of, ownership
   checks scoped through the owning template/instance (since periods and
   entries carry no institution id of their own), a clean 400 instead of a
   raw `IntegrityError` on a duplicate (timetable, day, period) entry, and
   a `/validate/{template_id}` conflict check re-targeted at what's
   actually possible under the real schema: the same teacher double-booked
   at the same day/period across *different* sections sharing a template
   (a single instance can't have two entries at the same day+period at all,
   since the DB's own unique constraint already prevents that).
"""
from datetime import time

import pytest

from src.models.institution import Institution
from src.models.timetable import TimetableTemplate, PeriodSlot, Timetable, TimetableEntry


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
def template(db_session, institution) -> TimetableTemplate:
    t = TimetableTemplate(
        institution_id=institution.id,
        name="Standard Weekday Template",
        description="Default period grid",
        is_active=True,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def other_institution_template(db_session, other_institution) -> TimetableTemplate:
    t = TimetableTemplate(
        institution_id=other_institution.id,
        name="Foreign Template",
        is_active=True,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def period(db_session, template) -> PeriodSlot:
    p = PeriodSlot(
        template_id=template.id,
        period_number=1,
        start_time=time(9, 0),
        end_time=time(9, 45),
        duration_minutes=45,
        period_type="lecture",
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def second_section(db_session, institution, grade):
    from src.models.academic import Section
    import uuid
    s = Section(
        institution_id=institution.id,
        grade_id=grade.id,
        name=f"Section B-{uuid.uuid4().hex[:6]}",
        capacity=40,
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def instance(db_session, institution, section, academic_year, template) -> Timetable:
    t = Timetable(
        institution_id=institution.id,
        section_id=section.id,
        academic_year_id=academic_year.id,
        template_id=template.id,
        is_active=True,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def other_institution_instance(db_session, other_institution):
    from src.models.academic import AcademicYear, Grade, Section
    import uuid
    year = AcademicYear(
        institution_id=other_institution.id,
        name="2023-2024",
        start_date="2023-04-01",
        end_date="2024-03-31",
        is_current=True,
        is_active=True,
    )
    db_session.add(year)
    db_session.flush()
    other_grade = Grade(
        institution_id=other_institution.id,
        academic_year_id=year.id,
        name="Grade 10",
        display_order=10,
        is_active=True,
    )
    db_session.add(other_grade)
    db_session.flush()
    other_section = Section(
        institution_id=other_institution.id,
        grade_id=other_grade.id,
        name=f"Section {uuid.uuid4().hex[:6]}",
        capacity=40,
        is_active=True,
    )
    db_session.add(other_section)
    db_session.flush()
    t = Timetable(
        institution_id=other_institution.id,
        section_id=other_section.id,
        academic_year_id=year.id,
        is_active=True,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def entry(db_session, instance, subject) -> TimetableEntry:
    e = TimetableEntry(
        timetable_id=instance.id,
        day_of_week="monday",
        period_number=1,
        subject_id=subject.id,
    )
    db_session.add(e)
    db_session.commit()
    db_session.refresh(e)
    return e


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestAuthRequired:
    def test_list_templates_requires_auth(self, client):
        response = client.get("/api/v1/timetables/templates")
        assert response.status_code in (401, 403)

    def test_create_template_requires_auth(self, client, institution):
        response = client.post(
            "/api/v1/timetables/templates",
            json={"name": "X", "institution_id": institution.id},
        )
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestTemplates:
    def test_create_template(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/timetables/templates",
            headers=auth_headers,
            json={"name": "New Template", "description": "d", "institution_id": institution.id},
        )
        assert response.status_code == 201, response.text
        assert response.json()["name"] == "New Template"

    def test_create_template_cross_institution_403(self, client, auth_headers, other_institution):
        response = client.post(
            "/api/v1/timetables/templates",
            headers=auth_headers,
            json={"name": "X", "institution_id": other_institution.id},
        )
        assert response.status_code == 403

    def test_list_templates_scoped_to_institution(
        self, client, auth_headers, template, other_institution_template
    ):
        response = client.get("/api/v1/timetables/templates", headers=auth_headers)
        assert response.status_code == 200
        ids = [t["id"] for t in response.json()["items"]]
        assert template.id in ids
        assert other_institution_template.id not in ids

    def test_get_template_with_periods(self, client, auth_headers, template, period):
        response = client.get(f"/api/v1/timetables/templates/{template.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["periods"]) == 1
        assert data["periods"][0]["id"] == period.id

    def test_get_template_cross_institution_403(
        self, client, auth_headers, other_institution_template
    ):
        response = client.get(
            f"/api/v1/timetables/templates/{other_institution_template.id}", headers=auth_headers
        )
        assert response.status_code == 403

    def test_update_template(self, client, auth_headers, template):
        response = client.put(
            f"/api/v1/timetables/templates/{template.id}",
            headers=auth_headers,
            json={"name": "Renamed"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Renamed"

    def test_delete_template(self, client, auth_headers, template):
        response = client.delete(
            f"/api/v1/timetables/templates/{template.id}", headers=auth_headers
        )
        assert response.status_code == 204


# ---------------------------------------------------------------------------
# Periods
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestPeriods:
    def test_create_period(self, client, auth_headers, template):
        response = client.post(
            "/api/v1/timetables/periods",
            headers=auth_headers,
            json={
                "template_id": template.id,
                "period_number": 1,
                "start_time": "09:00:00",
                "end_time": "09:45:00",
                "duration_minutes": 45,
                "period_type": "lecture",
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["period_number"] == 1

    def test_create_period_cross_institution_403(
        self, client, auth_headers, other_institution_template
    ):
        response = client.post(
            "/api/v1/timetables/periods",
            headers=auth_headers,
            json={
                "template_id": other_institution_template.id,
                "period_number": 1,
                "start_time": "09:00:00",
                "end_time": "09:45:00",
                "duration_minutes": 45,
            },
        )
        assert response.status_code == 403

    def test_list_periods(self, client, auth_headers, template, period):
        response = client.get(
            "/api/v1/timetables/periods",
            headers=auth_headers,
            params={"template_id": template.id},
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

    def test_update_period(self, client, auth_headers, period):
        response = client.put(
            f"/api/v1/timetables/periods/{period.id}",
            headers=auth_headers,
            json={"period_type": "lab"},
        )
        assert response.status_code == 200
        assert response.json()["period_type"] == "lab"

    def test_update_period_cross_institution_403(
        self, db_session, client, auth_headers, other_institution_template
    ):
        p = PeriodSlot(
            template_id=other_institution_template.id,
            period_number=1,
            start_time=time(9, 0),
            end_time=time(9, 45),
            duration_minutes=45,
        )
        db_session.add(p)
        db_session.commit()
        db_session.refresh(p)

        response = client.put(
            f"/api/v1/timetables/periods/{p.id}",
            headers=auth_headers,
            json={"period_type": "lab"},
        )
        assert response.status_code == 403

    def test_delete_period(self, client, auth_headers, period):
        response = client.delete(
            f"/api/v1/timetables/periods/{period.id}", headers=auth_headers
        )
        assert response.status_code == 204

    def test_bulk_order_update(self, client, auth_headers, db_session, template):
        p1 = PeriodSlot(
            template_id=template.id, period_number=1,
            start_time=time(9, 0), end_time=time(9, 45), duration_minutes=45,
        )
        p2 = PeriodSlot(
            template_id=template.id, period_number=2,
            start_time=time(9, 45), end_time=time(10, 30), duration_minutes=45,
        )
        db_session.add_all([p1, p2])
        db_session.commit()
        db_session.refresh(p1)
        db_session.refresh(p2)

        response = client.put(
            "/api/v1/timetables/periods/bulk-order",
            headers=auth_headers,
            json={"periods": [
                {"id": p1.id, "period_number": 2},
                {"id": p2.id, "period_number": 1},
            ]},
        )
        assert response.status_code == 200, response.text

        db_session.refresh(p1)
        db_session.refresh(p2)
        assert p1.period_number == 2
        assert p2.period_number == 1

    def test_bulk_order_update_ignores_foreign_period(
        self, db_session, client, auth_headers, other_institution_template
    ):
        """A period id belonging to another institution's template must not
        be touched even though the endpoint takes raw ids."""
        foreign = PeriodSlot(
            template_id=other_institution_template.id,
            period_number=5,
            start_time=time(9, 0), end_time=time(9, 45), duration_minutes=45,
        )
        db_session.add(foreign)
        db_session.commit()
        db_session.refresh(foreign)

        response = client.put(
            "/api/v1/timetables/periods/bulk-order",
            headers=auth_headers,
            json={"periods": [{"id": foreign.id, "period_number": 99}]},
        )
        assert response.status_code == 200

        db_session.refresh(foreign)
        assert foreign.period_number == 5


# ---------------------------------------------------------------------------
# Timetable instances
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestInstances:
    def test_create_instance(self, client, auth_headers, institution, section, academic_year, template):
        response = client.post(
            "/api/v1/timetables/instances",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "section_id": section.id,
                "academic_year_id": academic_year.id,
                "template_id": template.id,
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["section_id"] == section.id

    def test_create_instance_cross_institution_403(
        self, client, auth_headers, other_institution, section, academic_year
    ):
        response = client.post(
            "/api/v1/timetables/instances",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "section_id": section.id,
                "academic_year_id": academic_year.id,
            },
        )
        assert response.status_code == 403

    def test_create_instance_rejects_foreign_template(
        self, client, auth_headers, institution, section, academic_year, other_institution_template
    ):
        response = client.post(
            "/api/v1/timetables/instances",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "section_id": section.id,
                "academic_year_id": academic_year.id,
                "template_id": other_institution_template.id,
            },
        )
        assert response.status_code == 403

    def test_list_instances(self, client, auth_headers, institution, instance):
        response = client.get("/api/v1/timetables/instances", headers=auth_headers)
        assert response.status_code == 200
        ids = [i["id"] for i in response.json()["items"]]
        assert instance.id in ids

    def test_get_instance_with_entries(self, client, auth_headers, instance, entry):
        response = client.get(f"/api/v1/timetables/instances/{instance.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) == 1
        assert data["entries"][0]["id"] == entry.id

    def test_get_instance_cross_institution_403(
        self, client, auth_headers, other_institution_instance
    ):
        response = client.get(
            f"/api/v1/timetables/instances/{other_institution_instance.id}", headers=auth_headers
        )
        assert response.status_code == 403

    def test_delete_instance(self, client, auth_headers, instance):
        response = client.delete(
            f"/api/v1/timetables/instances/{instance.id}", headers=auth_headers
        )
        assert response.status_code == 204


# ---------------------------------------------------------------------------
# Entries
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestEntries:
    def test_create_entry(self, client, auth_headers, instance, subject):
        response = client.post(
            "/api/v1/timetables/entries",
            headers=auth_headers,
            json={
                "timetable_id": instance.id,
                "day_of_week": "monday",
                "period_number": 1,
                "subject_id": subject.id,
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["day_of_week"] == "monday"

    def test_create_entry_cross_institution_403(
        self, client, auth_headers, other_institution_instance, subject
    ):
        response = client.post(
            "/api/v1/timetables/entries",
            headers=auth_headers,
            json={
                "timetable_id": other_institution_instance.id,
                "day_of_week": "monday",
                "period_number": 1,
                "subject_id": subject.id,
            },
        )
        assert response.status_code == 403

    def test_create_duplicate_entry_returns_400_not_500(self, client, auth_headers, instance, entry, subject):
        """Regression test: previously this could only ever reach a raw
        IntegrityError since the whole endpoint 500'd on unrelated
        AttributeErrors first."""
        response = client.post(
            "/api/v1/timetables/entries",
            headers=auth_headers,
            json={
                "timetable_id": instance.id,
                "day_of_week": entry.day_of_week,
                "period_number": entry.period_number,
                "subject_id": subject.id,
            },
        )
        assert response.status_code == 400

    def test_list_entries(self, client, auth_headers, instance, entry):
        response = client.get(
            "/api/v1/timetables/entries",
            headers=auth_headers,
            params={"timetable_id": instance.id},
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1

    def test_list_entries_cross_institution_403(
        self, client, auth_headers, other_institution_instance
    ):
        response = client.get(
            "/api/v1/timetables/entries",
            headers=auth_headers,
            params={"timetable_id": other_institution_instance.id},
        )
        assert response.status_code == 403

    def test_get_entry_with_details(self, client, auth_headers, entry, subject):
        response = client.get(f"/api/v1/timetables/entries/{entry.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["subject"]["id"] == subject.id

    def test_get_entry_cross_institution_403(
        self, db_session, client, auth_headers, other_institution_instance, other_institution
    ):
        from src.models.academic import Subject as SubjectModel
        import uuid
        foreign_subject = SubjectModel(
            institution_id=other_institution.id,
            name="Foreign Subject",
            code=f"FS{uuid.uuid4().hex[:6]}",
            is_active=True,
        )
        db_session.add(foreign_subject)
        db_session.commit()
        db_session.refresh(foreign_subject)

        foreign_entry = TimetableEntry(
            timetable_id=other_institution_instance.id,
            day_of_week="tuesday",
            period_number=1,
            subject_id=foreign_subject.id,
        )
        db_session.add(foreign_entry)
        db_session.commit()
        db_session.refresh(foreign_entry)

        response = client.get(
            f"/api/v1/timetables/entries/{foreign_entry.id}", headers=auth_headers
        )
        assert response.status_code == 403

    def test_update_entry(self, client, auth_headers, entry):
        response = client.put(
            f"/api/v1/timetables/entries/{entry.id}",
            headers=auth_headers,
            json={"room_number": "101"},
        )
        assert response.status_code == 200
        assert response.json()["room_number"] == "101"

    def test_delete_entry(self, client, auth_headers, entry):
        response = client.delete(
            f"/api/v1/timetables/entries/{entry.id}", headers=auth_headers
        )
        assert response.status_code == 204


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestValidation:
    def test_validate_no_conflicts(self, client, auth_headers, template, entry):
        response = client.get(
            f"/api/v1/timetables/validate/{template.id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["conflicts"] == []

    def test_validate_detects_teacher_double_booking_across_sections(
        self, db_session, client, auth_headers, institution, template,
        academic_year, second_section, subject, teacher, entry
    ):
        # `entry` (from the fixture) is on `instance`/`section`, period 1,
        # monday, no teacher yet -- give it a teacher, then create a second
        # section's timetable (sharing the same template) with an entry for
        # the SAME teacher at the SAME day/period.
        entry.teacher_id = teacher.id
        db_session.commit()

        second_instance = Timetable(
            institution_id=institution.id,
            section_id=second_section.id,
            academic_year_id=academic_year.id,
            template_id=template.id,
            is_active=True,
        )
        db_session.add(second_instance)
        db_session.flush()

        conflicting_entry = TimetableEntry(
            timetable_id=second_instance.id,
            day_of_week="monday",
            period_number=1,
            subject_id=subject.id,
            teacher_id=teacher.id,
        )
        db_session.add(conflicting_entry)
        db_session.commit()

        response = client.get(
            f"/api/v1/timetables/validate/{template.id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False
        assert len(data["conflicts"]) == 1
        assert data["conflicts"][0]["teacher_id"] == teacher.id

    def test_validate_cross_institution_403(self, client, auth_headers, other_institution_template):
        response = client.get(
            f"/api/v1/timetables/validate/{other_institution_template.id}", headers=auth_headers
        )
        assert response.status_code == 403
