"""Integration tests for the `family` router (src/api/v1/family.py).

Covers the parent-facing "family group" feature: an auto-created FamilyGroup
per parent (with a FamilyGroupMember per linked child), a family calendar,
sibling performance/attendance/behavior comparisons, notification batches,
shared expenses (with per-student splits), and a handful of "bulk" actions
(pay fees, download report cards, RSVP to events, toggle active children).

No Celery/Redis-backed features are touched by this router (no `.delay()`
calls, no direct redis usage), so there is nothing to skip on that front.
"""
import uuid
from datetime import datetime, date, time, timedelta
from decimal import Decimal

import pytest

from src.models.institution import Institution
from src.models.student import Parent, StudentParent, Student
from src.models.family import FamilyGroup, FamilyGroupMember, FamilyCalendarEvent
from src.models.assignment import Assignment, Submission, AssignmentStatus, SubmissionStatus
from src.models.examination import Exam, ExamSchedule, ExamResult, ExamType
from src.models.attendance import Attendance, AttendanceSummary, AttendanceStatus
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures: this router needs a `parent` role/user (with a linked
# Parent row + child Student), which tests/conftest.py's standard
# `auth_headers` (admin role) doesn't provide. `parent_user` and `parent_role`
# already exist in tests/conftest.py; we just add the login-headers fixture
# on top, following the exact pattern described for this task.
# ---------------------------------------------------------------------------
@pytest.fixture
def parent_headers(client, parent_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": parent_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def parent_record(db_session, parent_user) -> Parent:
    """The Parent row tests/conftest.py's `parent_user` fixture creates alongside the User."""
    return db_session.query(Parent).filter(Parent.user_id == parent_user.id).first()


@pytest.fixture
def child_student(db_session, parent_record, student) -> Student:
    """Links tests/conftest.py's `student` fixture to our parent as their child."""
    link = StudentParent(
        student_id=student.id,
        parent_id=parent_record.id,
        relation_type="father",
        is_primary_contact=True,
    )
    db_session.add(link)
    db_session.commit()
    return student


@pytest.fixture
def family_group_id(client, parent_headers, child_student) -> int:
    """Triggers the router's get_or_create_family_group via a real GET, so the
    resulting group + member rows are created exactly the way the app creates
    them (not hand-rolled in the test), then hands back the group id.
    """
    response = client.get("/api/v1/family/dashboard", headers=parent_headers)
    assert response.status_code == 200
    return response.json()["family_group"]["id"]


# ---------------------------------------------------------------------------
# A second institution + admin, for cross-institution 403/404 checks.
# ---------------------------------------------------------------------------
@pytest.fixture
def other_institution(db_session) -> Institution:
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
def other_admin_role(db_session):
    from src.models.role import Role
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role):
    from src.models.user import User
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheradmin{suffix}",
        email=f"otheradmin{suffix}@otherschool.com",
        first_name="Other",
        last_name="Admin",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_admin_role.id,
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
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ===========================================================================
# GET /dashboard
# ===========================================================================
class TestFamilyDashboard:
    def test_requires_auth(self, client):
        response = client.get("/api/v1/family/dashboard")
        # FastAPI's HTTPBearer returns 403 (not 401) for a missing Authorization
        # header -- this matches the behavior of every other protected router
        # in this codebase.
        assert response.status_code == 403

    def test_404_when_no_parent_profile(self, client, auth_headers):
        """auth_headers is the standard admin-role user, which has no Parent row."""
        response = client.get("/api/v1/family/dashboard", headers=auth_headers)
        assert response.status_code == 404
        assert "Parent profile not found" in response.json()["detail"]

    def test_auto_creates_family_group_with_no_children(self, client, parent_headers, parent_record, db_session):
        response = client.get("/api/v1/family/dashboard", headers=parent_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["family_group"]["parent_id"] == parent_record.id
        assert data["family_group"]["name"] == "My Family"
        assert data["children"] == []
        assert data["total_pending_assignments"] == 0
        assert data["total_upcoming_exams"] == 0
        assert data["unread_notifications"] == 0

        # Re-fetching must reuse the same group, not create a second one.
        response2 = client.get("/api/v1/family/dashboard", headers=parent_headers)
        assert response2.json()["family_group"]["id"] == data["family_group"]["id"]
        count = db_session.query(FamilyGroup).filter(FamilyGroup.parent_id == parent_record.id).count()
        assert count == 1

    def test_includes_linked_child_with_computed_stats(
        self, client, parent_headers, child_student, section, grade, institution,
        teacher, subject, academic_year, db_session,
    ):
        # An assignment due in the future with a not-yet-submitted submission
        # counts toward pending_assignments.
        assignment = Assignment(
            institution_id=institution.id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Algebra Homework",
            due_date=datetime.utcnow() + timedelta(days=5),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        submission = Submission(
            assignment_id=assignment.id,
            student_id=child_student.id,
            status=SubmissionStatus.NOT_SUBMITTED,
        )
        db_session.add(submission)

        # An exam scheduled within the next 30 days for the child's section.
        exam = Exam(
            institution_id=institution.id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Mid Term Maths",
            exam_type=ExamType.MID_TERM,
            start_date=date.today() + timedelta(days=10),
            end_date=date.today() + timedelta(days=10),
        )
        db_session.add(exam)
        db_session.flush()
        exam_schedule = ExamSchedule(
            institution_id=institution.id,
            exam_id=exam.id,
            subject_id=subject.id,
            section_id=section.id,
            exam_date=date.today() + timedelta(days=10),
            start_time=time(9, 0),
            end_time=time(11, 0),
        )
        db_session.add(exam_schedule)

        exam_result = ExamResult(
            institution_id=institution.id,
            exam_id=exam.id,
            student_id=child_student.id,
            total_marks_obtained=Decimal("80.00"),
            total_max_marks=Decimal("100.00"),
            percentage=Decimal("80.00"),
            is_pass=True,
            subjects_passed=1,
            subjects_failed=0,
        )
        db_session.add(exam_result)

        summary = AttendanceSummary(
            institution_id=institution.id,
            student_id=child_student.id,
            month=datetime.utcnow().month,
            year=datetime.utcnow().year,
            total_days=20,
            present_days=18,
            absent_days=2,
            attendance_percentage=Decimal("90.00"),
        )
        db_session.add(summary)
        db_session.commit()

        response = client.get("/api/v1/family/dashboard", headers=parent_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["children"]) == 1
        child = data["children"][0]
        assert child["student_id"] == child_student.id
        assert child["student_name"] == f"{child_student.first_name} {child_student.last_name}"
        assert child["grade"] == grade.name
        assert child["section"] == section.name
        assert child["pending_assignments"] == 1
        assert child["upcoming_exams"] == 1
        assert float(child["attendance_percentage"]) == 90.00
        assert float(child["average_grade"]) == 80.00
        assert data["total_pending_assignments"] == 1
        assert data["total_upcoming_exams"] == 1


# ===========================================================================
# POST /groups, POST /groups/{group_id}/members
# ===========================================================================
class TestFamilyGroupsAndMembers:
    def test_create_family_group_success(self, client, auth_headers, admin_user, parent_record):
        response = client.post(
            "/api/v1/family/groups",
            headers=auth_headers,
            json={"institution_id": admin_user.institution_id, "parent_id": parent_record.id, "name": "The Smiths"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "The Smiths"
        assert data["parent_id"] == parent_record.id
        assert data["is_active"] is True

    def test_create_family_group_cross_institution_403(self, client, auth_headers, other_institution, parent_record):
        response = client.post(
            "/api/v1/family/groups",
            headers=auth_headers,
            json={"institution_id": other_institution.id, "parent_id": parent_record.id, "name": "Cross Tenant"},
        )
        assert response.status_code == 403

    def test_add_family_member_success(self, client, auth_headers, admin_user, db_session, institution, student):
        parent = Parent(institution_id=institution.id, first_name="P", last_name="Q", is_active=True)
        db_session.add(parent)
        db_session.flush()
        group = FamilyGroup(institution_id=institution.id, parent_id=parent.id, name="G")
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        response = client.post(
            f"/api/v1/family/groups/{group.id}/members",
            headers=auth_headers,
            json={"student_id": student.id, "display_color": "#4ECDC4"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["student_id"] == student.id
        assert data["display_color"] == "#4ECDC4"
        assert "id" in data and "added_at" in data

    def test_add_family_member_group_not_found_404(self, client, auth_headers, student):
        response = client.post(
            "/api/v1/family/groups/999999/members",
            headers=auth_headers,
            json={"student_id": student.id},
        )
        assert response.status_code == 404

    def test_add_family_member_cross_institution_404(self, client, other_admin_headers, db_session, institution, student):
        parent = Parent(institution_id=institution.id, first_name="P", last_name="Q", is_active=True)
        db_session.add(parent)
        db_session.flush()
        group = FamilyGroup(institution_id=institution.id, parent_id=parent.id, name="G")
        db_session.add(group)
        db_session.commit()
        db_session.refresh(group)

        response = client.post(
            f"/api/v1/family/groups/{group.id}/members",
            headers=other_admin_headers,
            json={"student_id": student.id},
        )
        assert response.status_code == 404


# ===========================================================================
# GET /calendar, POST /calendar/events
# ===========================================================================
class TestFamilyCalendar:
    def test_get_calendar_requires_month_and_year(self, client, parent_headers):
        response = client.get("/api/v1/family/calendar", headers=parent_headers)
        assert response.status_code == 422

    def test_get_calendar_empty(self, client, parent_headers, family_group_id):
        today = date.today()
        response = client.get(
            "/api/v1/family/calendar",
            headers=parent_headers,
            params={"month": today.month, "year": today.year},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["events"] == []
        assert data["month"] == today.month

    def test_create_and_list_calendar_event_with_metadata(self, client, parent_headers, family_group_id, child_student):
        today = date.today()
        create_resp = client.post(
            "/api/v1/family/calendar/events",
            headers=parent_headers,
            json={
                "family_group_id": family_group_id,
                "student_id": child_student.id,
                "event_type": "custom",
                "title": "Parent-Teacher Meeting",
                "description": "Discuss progress",
                "start_date": datetime(today.year, today.month, min(today.day, 27), 10, 0).isoformat(),
                "location": "Room 12",
                "metadata": {"reminder_minutes": 30},
            },
        )
        assert create_resp.status_code == 201, create_resp.text
        created = create_resp.json()
        assert created["title"] == "Parent-Teacher Meeting"
        # Regression check: the metadata JSON column must round-trip, not be
        # silently dropped by the `metadata`/`metadata_json` name clash.
        assert created["metadata"] == {"reminder_minutes": 30}

        list_resp = client.get(
            "/api/v1/family/calendar",
            headers=parent_headers,
            params={"month": today.month, "year": today.year},
        )
        assert list_resp.status_code == 200
        events = list_resp.json()["events"]
        assert len(events) == 1
        assert events[0]["title"] == "Parent-Teacher Meeting"
        assert events[0]["student_name"] == f"{child_student.first_name} {child_student.last_name}"
        assert events[0]["metadata"] == {"reminder_minutes": 30}
        assert str(events[0]["student_id"]) in list_resp.json()["children_colors"]

    def test_create_calendar_event_cross_institution_404(self, client, other_admin_headers, family_group_id, child_student):
        today = date.today()
        response = client.post(
            "/api/v1/family/calendar/events",
            headers=other_admin_headers,
            json={
                "family_group_id": family_group_id,
                "student_id": child_student.id,
                "event_type": "custom",
                "title": "Snooping",
                "start_date": datetime(today.year, today.month, 1, 10, 0).isoformat(),
            },
        )
        assert response.status_code == 404

    def test_calendar_filters_by_student_ids(self, client, parent_headers, family_group_id, child_student, db_session):
        today = date.today()
        event = FamilyCalendarEvent(
            family_group_id=family_group_id,
            student_id=child_student.id,
            event_type="custom",
            title="In range",
            start_date=datetime(today.year, today.month, min(today.day, 27), 9, 0),
        )
        db_session.add(event)
        db_session.commit()

        response = client.get(
            "/api/v1/family/calendar",
            headers=parent_headers,
            params={"month": today.month, "year": today.year, "student_ids": [999999]},
        )
        assert response.status_code == 200
        assert response.json()["events"] == []


# ===========================================================================
# GET /comparisons/performance, /comparisons/attendance, /comparisons/behavior
# ===========================================================================
class TestFamilyComparisons:
    def test_performance_comparison_404_no_parent(self, client, auth_headers):
        response = client.get("/api/v1/family/comparisons/performance", headers=auth_headers)
        assert response.status_code == 404

    def test_performance_comparison_empty(self, client, parent_headers, family_group_id):
        response = client.get("/api/v1/family/comparisons/performance", headers=parent_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["students"] == []
        assert data["average"] is None

    def test_performance_comparison_with_data(
        self, client, parent_headers, family_group_id, child_student, institution, academic_year, grade,
        db_session,
    ):
        exam = Exam(
            institution_id=institution.id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Final Exam",
            exam_type=ExamType.FINAL,
            start_date=date.today(),
            end_date=date.today(),
        )
        db_session.add(exam)
        db_session.flush()
        result = ExamResult(
            institution_id=institution.id,
            exam_id=exam.id,
            student_id=child_student.id,
            total_marks_obtained=Decimal("91.00"),
            total_max_marks=Decimal("100.00"),
            percentage=Decimal("91.00"),
            is_pass=True,
            subjects_passed=1,
            subjects_failed=0,
        )
        db_session.add(result)
        db_session.commit()

        response = client.get(
            "/api/v1/family/comparisons/performance",
            headers=parent_headers,
            params={"period": "last_month"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["students"]) == 1
        assert float(data["students"][0]["value"]) == 91.0
        assert data["students"][0]["rank"] == 1
        assert float(data["average"]) == 91.0
        assert len(data["insights"]) == 1

    def test_performance_comparison_invalid_period_422(self, client, parent_headers, family_group_id):
        response = client.get(
            "/api/v1/family/comparisons/performance",
            headers=parent_headers,
            params={"period": "not_a_real_period"},
        )
        assert response.status_code == 422

    def test_attendance_comparison(self, client, parent_headers, family_group_id, child_student, institution, db_session):
        start = date.today() - timedelta(days=10)
        end = date.today()
        # Regression check for the AttendanceStatus enum-vs-raw-string bug:
        # this must not 500.
        db_session.add(Attendance(
            institution_id=institution.id, student_id=child_student.id,
            date=start + timedelta(days=1), status=AttendanceStatus.PRESENT,
        ))
        db_session.add(Attendance(
            institution_id=institution.id, student_id=child_student.id,
            date=start + timedelta(days=2), status=AttendanceStatus.PRESENT,
        ))
        db_session.add(Attendance(
            institution_id=institution.id, student_id=child_student.id,
            date=start + timedelta(days=3), status=AttendanceStatus.ABSENT,
        ))
        db_session.commit()

        response = client.get(
            "/api/v1/family/comparisons/attendance",
            headers=parent_headers,
            params={"start_date": start.isoformat(), "end_date": end.isoformat()},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["students"]) == 1
        assert data["students"][0]["total_days"] == 3
        assert data["students"][0]["present_days"] == 2
        assert round(float(data["students"][0]["attendance_percentage"]), 2) == round(200 / 3, 2)
        assert round(float(data["family_average"]), 2) == round(200 / 3, 2)

    def test_behavior_comparison(
        self, client, parent_headers, family_group_id, child_student, institution, teacher, grade, subject, db_session,
    ):
        assignment = Assignment(
            institution_id=institution.id, teacher_id=teacher.id, grade_id=grade.id,
            subject_id=subject.id, title="Essay", max_marks=Decimal("50.00"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        now = datetime.utcnow() - timedelta(seconds=5)
        db_session.add(Submission(
            assignment_id=assignment.id, student_id=child_student.id,
            submitted_at=now, is_late=False, status=SubmissionStatus.SUBMITTED,
        ))
        db_session.commit()

        start = (datetime.utcnow() - timedelta(days=1)).date()
        end = (datetime.utcnow() + timedelta(days=1)).date()
        response = client.get(
            "/api/v1/family/comparisons/behavior",
            headers=parent_headers,
            params={"start_date": start.isoformat(), "end_date": end.isoformat()},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["students"]) == 1
        assert data["students"][0]["total_submissions"] == 1
        assert data["students"][0]["on_time_submissions"] == 1
        assert data["students"][0]["punctuality_rate"] == 100


# ===========================================================================
# GET /notifications, PATCH /notifications/{batch_id}/read
# ===========================================================================
class TestFamilyNotifications:
    def test_get_notifications_empty(self, client, parent_headers, family_group_id):
        response = client.get("/api/v1/family/notifications", headers=parent_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_notifications_with_batch_and_items(
        self, client, parent_headers, family_group_id, child_student, db_session,
    ):
        from src.models.family import FamilyNotificationBatch, FamilyNotificationItem

        batch = FamilyNotificationBatch(
            family_group_id=family_group_id,
            batch_date=date.today(),
            notification_count=1,
            summary={"total": 1},
        )
        db_session.add(batch)
        db_session.flush()
        item = FamilyNotificationItem(
            batch_id=batch.id,
            student_id=child_student.id,
            notification_type="grade_posted",
            title="New grade",
            message="Your child received a new grade",
            metadata_json={"exam_id": 42},
        )
        db_session.add(item)
        db_session.commit()

        response = client.get("/api/v1/family/notifications", headers=parent_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["notification_count"] == 1
        assert len(data[0]["items"]) == 1
        assert data[0]["items"][0]["student_name"] == f"{child_student.first_name} {child_student.last_name}"
        # Regression check for the metadata/metadata_json alias fix.
        assert data[0]["items"][0]["metadata"] == {"exam_id": 42}

    def test_get_notifications_unread_only_filter(self, client, parent_headers, family_group_id, db_session):
        from src.models.family import FamilyNotificationBatch

        db_session.add(FamilyNotificationBatch(
            family_group_id=family_group_id, batch_date=date.today(),
            notification_count=1, summary={}, is_read=True,
        ))
        db_session.add(FamilyNotificationBatch(
            family_group_id=family_group_id, batch_date=date.today(),
            notification_count=1, summary={}, is_read=False,
        ))
        db_session.commit()

        response = client.get(
            "/api/v1/family/notifications", headers=parent_headers, params={"unread_only": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["is_read"] is False

    def test_mark_notification_read_success(self, client, parent_headers, family_group_id, db_session):
        from src.models.family import FamilyNotificationBatch

        batch = FamilyNotificationBatch(
            family_group_id=family_group_id, batch_date=date.today(),
            notification_count=1, summary={},
        )
        db_session.add(batch)
        db_session.commit()
        db_session.refresh(batch)

        response = client.patch(f"/api/v1/family/notifications/{batch.id}/read", headers=parent_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        db_session.refresh(batch)
        assert batch.is_read is True
        assert batch.read_at is not None

    def test_mark_notification_read_not_found_404(self, client, parent_headers):
        response = client.patch("/api/v1/family/notifications/999999/read", headers=parent_headers)
        assert response.status_code == 404

    def test_mark_notification_read_cross_institution_404(
        self, client, other_admin_headers, family_group_id, db_session,
    ):
        """Regression check: marking another institution's notification batch
        as read must be rejected, not silently succeed."""
        from src.models.family import FamilyNotificationBatch

        batch = FamilyNotificationBatch(
            family_group_id=family_group_id, batch_date=date.today(),
            notification_count=1, summary={},
        )
        db_session.add(batch)
        db_session.commit()
        db_session.refresh(batch)

        response = client.patch(f"/api/v1/family/notifications/{batch.id}/read", headers=other_admin_headers)
        assert response.status_code == 404
        db_session.refresh(batch)
        assert batch.is_read is False


# ===========================================================================
# GET /expenses, POST /expenses
# ===========================================================================
class TestSharedExpenses:
    def test_get_expenses_404_no_parent(self, client, auth_headers):
        response = client.get("/api/v1/family/expenses", headers=auth_headers)
        assert response.status_code == 404

    def test_get_expenses_empty(self, client, parent_headers, family_group_id):
        response = client.get("/api/v1/family/expenses", headers=parent_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_create_shared_expense_equal_split(self, client, admin_user, auth_headers, family_group_id, child_student):
        response = client.post(
            "/api/v1/family/expenses",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "family_group_id": family_group_id,
                "expense_type": "field_trip",
                "title": "Museum Trip",
                "total_amount": "100.00",
                "split_type": "equal",
                "student_ids": [child_student.id],
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["title"] == "Museum Trip"
        assert len(data["splits"]) == 1
        assert Decimal(data["splits"][0]["amount"]) == Decimal("100.00")
        assert data["splits"][0]["student_name"] == f"{child_student.first_name} {child_student.last_name}"
        assert data["is_paid"] is False

    def test_create_shared_expense_custom_split(self, client, admin_user, auth_headers, family_group_id, child_student):
        response = client.post(
            "/api/v1/family/expenses",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "family_group_id": family_group_id,
                "expense_type": "uniform",
                "title": "Uniform Set",
                "total_amount": "60.00",
                "split_type": "custom",
                "student_ids": [child_student.id],
                "custom_splits": {str(child_student.id): "60.00"},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["splits"]) == 1
        assert Decimal(data["splits"][0]["amount"]) == Decimal("60.00")

    def test_create_shared_expense_empty_student_ids_422(self, client, admin_user, auth_headers, family_group_id):
        """Regression check for the ZeroDivisionError bug: an equal split
        with no students must be a clean validation error, not a 500."""
        response = client.post(
            "/api/v1/family/expenses",
            headers=auth_headers,
            json={
                "institution_id": admin_user.institution_id,
                "family_group_id": family_group_id,
                "expense_type": "field_trip",
                "title": "Museum Trip",
                "total_amount": "100.00",
                "split_type": "equal",
                "student_ids": [],
            },
        )
        assert response.status_code == 422

    def test_create_shared_expense_cross_institution_403(self, client, auth_headers, other_institution, family_group_id, child_student):
        response = client.post(
            "/api/v1/family/expenses",
            headers=auth_headers,
            json={
                "institution_id": other_institution.id,
                "family_group_id": family_group_id,
                "expense_type": "field_trip",
                "title": "Museum Trip",
                "total_amount": "100.00",
                "split_type": "equal",
                "student_ids": [child_student.id],
            },
        )
        assert response.status_code == 403

    def test_get_expenses_unpaid_only_filter(self, client, admin_user, auth_headers, parent_headers, family_group_id, child_student, db_session):
        from src.models.family import SharedExpense

        paid = SharedExpense(
            institution_id=admin_user.institution_id, family_group_id=family_group_id,
            expense_type="book", title="Paid book", total_amount=Decimal("20.00"),
            split_type="equal", is_paid=True,
        )
        unpaid = SharedExpense(
            institution_id=admin_user.institution_id, family_group_id=family_group_id,
            expense_type="book", title="Unpaid book", total_amount=Decimal("30.00"),
            split_type="equal", is_paid=False,
        )
        db_session.add_all([paid, unpaid])
        db_session.commit()

        response = client.get(
            "/api/v1/family/expenses", headers=parent_headers, params={"unpaid_only": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Unpaid book"


# ===========================================================================
# POST /bulk/pay-fees, /bulk/download-report-cards, /bulk/rsvp-events, /toggle-children
# ===========================================================================
class TestBulkActions:
    def test_bulk_pay_fees_success_and_missing(self, client, admin_user, auth_headers, family_group_id, db_session):
        from src.models.family import SharedExpense

        expense = SharedExpense(
            institution_id=admin_user.institution_id, family_group_id=family_group_id,
            expense_type="trip", title="Trip", total_amount=Decimal("50.00"), split_type="equal",
        )
        db_session.add(expense)
        db_session.commit()
        db_session.refresh(expense)

        response = client.post(
            "/api/v1/family/bulk/pay-fees",
            headers=auth_headers,
            json={"expense_ids": [expense.id, 999999], "payment_method": "card", "transaction_id": "tx_1"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["paid_expenses"] == 1
        assert float(data["total_amount"]) == 50.0
        assert data["failed_expenses"] == [999999]

        db_session.refresh(expense)
        assert expense.is_paid is True

    def test_bulk_pay_fees_already_paid_not_double_counted(self, client, admin_user, auth_headers, family_group_id, db_session):
        from src.models.family import SharedExpense

        expense = SharedExpense(
            institution_id=admin_user.institution_id, family_group_id=family_group_id,
            expense_type="trip", title="Trip", total_amount=Decimal("50.00"),
            split_type="equal", is_paid=True,
        )
        db_session.add(expense)
        db_session.commit()
        db_session.refresh(expense)

        response = client.post(
            "/api/v1/family/bulk/pay-fees",
            headers=auth_headers,
            json={"expense_ids": [expense.id], "payment_method": "card"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["paid_expenses"] == 0
        assert float(data["total_amount"]) == 0.0

    def test_bulk_download_report_cards(self, client, admin_user, auth_headers, child_student):
        response = client.post(
            "/api/v1/family/bulk/download-report-cards",
            headers=auth_headers,
            json={"student_ids": [child_student.id, 999999], "document_type": "report_card"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["file_count"] == 1
        assert data["download_url"].startswith("/downloads/report-cards/")

    def test_bulk_rsvp_events_success_and_missing(self, client, parent_headers, family_group_id, child_student, db_session):
        event = FamilyCalendarEvent(
            family_group_id=family_group_id, student_id=child_student.id,
            event_type="custom", title="Sports Day", start_date=datetime.utcnow() + timedelta(days=3),
        )
        db_session.add(event)
        db_session.commit()
        db_session.refresh(event)

        response = client.post(
            "/api/v1/family/bulk/rsvp-events",
            headers=parent_headers,
            json={"event_ids": [event.id, 999999], "student_ids": [child_student.id], "rsvp_status": "attending"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 1
        assert data["failed_events"] == [999999]
        assert data["confirmations"][0]["status"] == "attending"

    def test_toggle_child_data(self, client, admin_user, auth_headers, child_student):
        response = client.post(
            "/api/v1/family/toggle-children",
            headers=auth_headers,
            json={"student_ids": [child_student.id, 999999]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["active_students"] == [child_student.id, 999999]
        assert str(child_student.id) in data["data_summary"]
        assert "999999" not in data["data_summary"]
        assert data["data_summary"][str(child_student.id)]["name"] == f"{child_student.first_name} {child_student.last_name}"
