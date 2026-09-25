"""Integration tests for the `attendance` router (src/api/v1/attendance.py).

Covers marking/updating/deleting attendance, bulk marking, correction
requests + review, and the reporting/summary endpoints.

Also serves as the validation pass for a previously-inherited, uncommitted
diff to attendance.py/attendance_service.py that added:
  1. Role checks rejecting student callers from create/bulk/update/delete
     attendance.
  2. An institution-ownership check on the target student in create_attendance.
  3. bulk_mark_attendance filtering out cross-institution students into
     errors/failed instead of silently processing them.
  4. Same-student checks on get_attendance/request_correction so a student
     caller can only see/correct their own attendance.
  5. review_correction: the institution-ownership check moved into the
     service (before any mutation), fixing a check-after-act bug where a
     cross-institution caller could mutate a correction's status before the
     403 was raised.

All 5 fixes get an explicit regression test below, in addition to normal
endpoint coverage.
"""
import uuid
from datetime import date, datetime, timedelta

import pytest

from src.models.institution import Institution
from src.models.attendance import Attendance, AttendanceCorrection, AttendanceStatus, CorrectionStatus
from src.models.student import Student
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures: this router needs teacher/student login headers, which
# tests/conftest.py doesn't provide directly (only the User fixtures).
# ---------------------------------------------------------------------------
@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": teacher_user.email, "password": "password123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": student_user.email, "password": "password123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


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
    response = client.post("/api/v1/auth/login", json={"email": other_admin_user.email, "password": "password123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_student_same_institution(db_session, institution, section, student_role) -> Student:
    """A second student in the SAME institution as the main `student` fixture,
    for "student can't view/correct another student's attendance" checks."""
    from src.models.user import User

    suffix = uuid.uuid4().hex[:8]
    role = student_role
    user = User(
        username=f"student2_{suffix}",
        email=f"student2_{suffix}@testschool.com",
        first_name="Jane2",
        last_name="Student2",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    student = Student(
        institution_id=institution.id,
        user_id=user.id,
        admission_number=f"ADM{suffix}",
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        section_id=section.id,
        date_of_birth=datetime(2008, 3, 20).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Male",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def marked_attendance(db_session, institution, student, subject) -> Attendance:
    att = Attendance(
        institution_id=institution.id,
        student_id=student.id,
        subject_id=subject.id,
        date=date.today() - timedelta(days=1),
        status=AttendanceStatus.PRESENT,
    )
    db_session.add(att)
    db_session.commit()
    db_session.refresh(att)
    return att


# ===========================================================================
# POST / (create_attendance)
# ===========================================================================
class TestCreateAttendance:
    def test_create_success_as_admin(self, client, auth_headers, admin_user, student, subject):
        response = client.post(
            "/api/v1/attendance/",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "date": str(date.today()),
                "status": "present",
                "subject_id": subject.id,
                "institution_id": admin_user.institution_id,
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert data["status"] == "present"

    def test_create_success_as_teacher(self, client, teacher_headers, teacher_user, student, subject):
        response = client.post(
            "/api/v1/attendance/",
            headers=teacher_headers,
            json={
                "student_id": student.id,
                "date": str(date.today()),
                "status": "absent",
                "subject_id": subject.id,
                "institution_id": teacher_user.institution_id,
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["status"] == "absent"

    def test_create_cross_institution_403(self, client, auth_headers, other_institution, student):
        response = client.post(
            "/api/v1/attendance/",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "date": str(date.today()),
                "status": "present",
                "institution_id": other_institution.id,
            },
        )
        assert response.status_code == 403

    def test_create_duplicate_400(self, client, auth_headers, admin_user, student, subject):
        payload = {
            "student_id": student.id,
            "date": str(date.today()),
            "status": "present",
            "subject_id": subject.id,
            "institution_id": admin_user.institution_id,
        }
        first = client.post("/api/v1/attendance/", headers=auth_headers, json=payload)
        assert first.status_code == 201
        second = client.post("/api/v1/attendance/", headers=auth_headers, json=payload)
        assert second.status_code == 400

    # --- Regression: fix #1 (role check) ---
    def test_create_rejected_for_student_caller(self, client, student_headers, student_user, student, subject):
        response = client.post(
            "/api/v1/attendance/",
            headers=student_headers,
            json={
                "student_id": student.id,
                "date": str(date.today()),
                "status": "present",
                "subject_id": subject.id,
                "institution_id": student_user.institution_id,
            },
        )
        assert response.status_code == 403
        assert "teachers or admins" in response.json()["detail"].lower()

    # --- Regression: fix #2 (student institution ownership check) ---
    def test_create_rejected_for_cross_institution_student(
        self, client, auth_headers, admin_user, other_institution, db_session
    ):
        from src.models.role import Role
        from src.models.user import User

        suffix = uuid.uuid4().hex[:8]
        role = Role(name=f"Student{suffix}", slug=f"student-{suffix}", is_system_role=True)
        db_session.add(role)
        db_session.flush()
        user = User(
            username=f"outsider{suffix}",
            email=f"outsider{suffix}@otherschool.com",
            first_name="Out",
            last_name="Sider",
            hashed_password=get_password_hash("password123"),
            institution_id=other_institution.id,
            role_id=role.id,
            is_active=True,
        )
        db_session.add(user)
        db_session.flush()
        foreign_student = Student(
            institution_id=other_institution.id,
            user_id=user.id,
            admission_number=f"OUT{suffix}",
            first_name="Out",
            last_name="Sider",
            email=user.email,
            date_of_birth=datetime(2008, 1, 1).date(),
            admission_date=datetime(2020, 1, 1).date(),
            is_active=True,
        )
        db_session.add(foreign_student)
        db_session.commit()
        db_session.refresh(foreign_student)

        # admin (institution A) tries to mark attendance for a student who
        # actually belongs to institution B -- must be rejected, not create
        # a cross-institution attendance record.
        response = client.post(
            "/api/v1/attendance/",
            headers=auth_headers,
            json={
                "student_id": foreign_student.id,
                "date": str(date.today()),
                "status": "present",
                "institution_id": admin_user.institution_id,
            },
        )
        assert response.status_code == 404

    def test_create_nonexistent_student_404(self, client, auth_headers, admin_user):
        response = client.post(
            "/api/v1/attendance/",
            headers=auth_headers,
            json={
                "student_id": 999999,
                "date": str(date.today()),
                "status": "present",
                "institution_id": admin_user.institution_id,
            },
        )
        assert response.status_code == 404

    def test_create_requires_auth(self, client, student):
        response = client.post(
            "/api/v1/attendance/",
            json={"student_id": student.id, "date": str(date.today()), "status": "present", "institution_id": 1},
        )
        assert response.status_code == 403


# ===========================================================================
# POST /bulk (bulk_mark_attendance)
# ===========================================================================
class TestBulkMarkAttendance:
    def test_bulk_mark_success(self, client, auth_headers, student, second_student_same_institution, section, subject):
        response = client.post(
            "/api/v1/attendance/bulk",
            headers=auth_headers,
            json={
                "date": str(date.today()),
                "section_id": section.id,
                "subject_id": subject.id,
                "attendances": [
                    {"student_id": student.id, "status": "present"},
                    {"student_id": second_student_same_institution.id, "status": "absent"},
                ],
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["total"] == 2
        assert data["success"] == 2
        assert data["failed"] == 0

    # --- Regression: fix #1 ---
    def test_bulk_mark_rejected_for_student_caller(self, client, student_headers, student, section):
        response = client.post(
            "/api/v1/attendance/bulk",
            headers=student_headers,
            json={
                "date": str(date.today()),
                "section_id": section.id,
                "attendances": [{"student_id": student.id, "status": "present"}],
            },
        )
        assert response.status_code == 403

    # --- Regression: fix #3 ---
    def test_bulk_mark_filters_cross_institution_students(
        self, client, auth_headers, student, section, db_session, other_institution
    ):
        from src.models.role import Role
        from src.models.user import User

        suffix = uuid.uuid4().hex[:8]
        role = Role(name=f"Student{suffix}", slug=f"student-{suffix}", is_system_role=True)
        db_session.add(role)
        db_session.flush()
        user = User(
            username=f"foreign{suffix}",
            email=f"foreign{suffix}@otherschool.com",
            first_name="F",
            last_name="S",
            hashed_password=get_password_hash("password123"),
            institution_id=other_institution.id,
            role_id=role.id,
            is_active=True,
        )
        db_session.add(user)
        db_session.flush()
        foreign_student = Student(
            institution_id=other_institution.id,
            user_id=user.id,
            admission_number=f"FS{suffix}",
            first_name="F",
            last_name="S",
            email=user.email,
            date_of_birth=datetime(2008, 1, 1).date(),
            admission_date=datetime(2020, 1, 1).date(),
            is_active=True,
        )
        db_session.add(foreign_student)
        db_session.commit()
        db_session.refresh(foreign_student)

        response = client.post(
            "/api/v1/attendance/bulk",
            headers=auth_headers,
            json={
                "date": str(date.today()),
                "section_id": section.id,
                "attendances": [
                    {"student_id": student.id, "status": "present"},
                    {"student_id": foreign_student.id, "status": "present"},
                ],
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["total"] == 2
        assert data["success"] == 1
        assert data["failed"] == 1
        assert any(e["student_id"] == foreign_student.id for e in data["errors"])

        # And the cross-institution attendance record must NOT have been created.
        created = db_session.query(Attendance).filter(Attendance.student_id == foreign_student.id).first()
        assert created is None


# ===========================================================================
# GET /{attendance_id} (get_attendance)
# ===========================================================================
class TestGetAttendance:
    def test_get_success_as_admin(self, client, auth_headers, marked_attendance):
        response = client.get(f"/api/v1/attendance/{marked_attendance.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == marked_attendance.id

    def test_get_not_found_404(self, client, auth_headers):
        response = client.get("/api/v1/attendance/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_403(self, client, other_admin_headers, marked_attendance):
        response = client.get(f"/api/v1/attendance/{marked_attendance.id}", headers=other_admin_headers)
        assert response.status_code == 403

    # --- Regression: fix #4 ---
    def test_get_own_attendance_as_student(self, client, student_headers, marked_attendance):
        response = client.get(f"/api/v1/attendance/{marked_attendance.id}", headers=student_headers)
        assert response.status_code == 200
        assert response.json()["id"] == marked_attendance.id

    def test_get_other_students_attendance_as_student_403(
        self, client, db_session, institution, student, second_student_same_institution, subject, student_headers
    ):
        other_att = Attendance(
            institution_id=institution.id,
            student_id=second_student_same_institution.id,
            subject_id=subject.id,
            date=date.today() - timedelta(days=1),
            status=AttendanceStatus.PRESENT,
        )
        db_session.add(other_att)
        db_session.commit()
        db_session.refresh(other_att)

        # student_headers logs in as the *first* student (`student_user`
        # fixture), which is a different person than `other_att`'s owner.
        response = client.get(f"/api/v1/attendance/{other_att.id}", headers=student_headers)
        assert response.status_code == 403


# ===========================================================================
# PUT /{attendance_id} (update_attendance)
# ===========================================================================
class TestUpdateAttendance:
    def test_update_success(self, client, auth_headers, marked_attendance):
        response = client.put(
            f"/api/v1/attendance/{marked_attendance.id}",
            headers=auth_headers,
            json={"status": "late", "remarks": "Traffic"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "late"
        assert data["remarks"] == "Traffic"

    def test_update_not_found_404(self, client, auth_headers):
        response = client.put("/api/v1/attendance/999999", headers=auth_headers, json={"status": "late"})
        assert response.status_code == 404

    def test_update_cross_institution_403(self, client, other_admin_headers, marked_attendance):
        response = client.put(
            f"/api/v1/attendance/{marked_attendance.id}", headers=other_admin_headers, json={"status": "late"}
        )
        assert response.status_code == 403

    # --- Regression: fix #1 ---
    def test_update_rejected_for_student_caller(self, client, student_headers, marked_attendance):
        response = client.put(
            f"/api/v1/attendance/{marked_attendance.id}", headers=student_headers, json={"status": "late"}
        )
        assert response.status_code == 403


# ===========================================================================
# DELETE /{attendance_id} (delete_attendance)
# ===========================================================================
class TestDeleteAttendance:
    def test_delete_success(self, client, auth_headers, marked_attendance, db_session):
        response = client.delete(f"/api/v1/attendance/{marked_attendance.id}", headers=auth_headers)
        assert response.status_code == 204
        assert db_session.query(Attendance).filter(Attendance.id == marked_attendance.id).first() is None

    def test_delete_not_found_404(self, client, auth_headers):
        response = client.delete("/api/v1/attendance/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_403(self, client, other_admin_headers, marked_attendance):
        response = client.delete(f"/api/v1/attendance/{marked_attendance.id}", headers=other_admin_headers)
        assert response.status_code == 403

    # --- Regression: fix #1 ---
    def test_delete_rejected_for_student_caller(self, client, student_headers, marked_attendance):
        response = client.delete(f"/api/v1/attendance/{marked_attendance.id}", headers=student_headers)
        assert response.status_code == 403


# ===========================================================================
# POST /corrections, GET /corrections, PUT /corrections/{id}
# ===========================================================================
class TestCorrections:
    def test_request_correction_success_as_teacher(self, client, teacher_headers, teacher_user, marked_attendance):
        response = client.post(
            "/api/v1/attendance/corrections",
            headers=teacher_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Marked incorrectly",
                "institution_id": teacher_user.institution_id,
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["old_status"] == "present"
        assert data["new_status"] == "absent"
        assert data["status"] == "pending"

    def test_request_correction_cross_institution_403(self, client, other_admin_headers, other_institution, marked_attendance):
        response = client.post(
            "/api/v1/attendance/corrections",
            headers=other_admin_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Bogus",
                "institution_id": other_institution.id,
            },
        )
        assert response.status_code == 403

    # --- Regression: fix #4 ---
    def test_request_correction_as_own_student_success(self, client, student_headers, student_user, marked_attendance):
        response = client.post(
            "/api/v1/attendance/corrections",
            headers=student_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "I was actually absent",
                "institution_id": student_user.institution_id,
            },
        )
        assert response.status_code == 201, response.text

    def test_request_correction_for_another_students_attendance_403(
        self, client, db_session, institution, student, second_student_same_institution, subject, student_headers
    ):
        other_att = Attendance(
            institution_id=institution.id,
            student_id=second_student_same_institution.id,
            subject_id=subject.id,
            date=date.today() - timedelta(days=1),
            status=AttendanceStatus.PRESENT,
        )
        db_session.add(other_att)
        db_session.commit()
        db_session.refresh(other_att)

        response = client.post(
            "/api/v1/attendance/corrections",
            headers=student_headers,
            json={
                "attendance_id": other_att.id,
                "new_status": "absent",
                "reason": "Trying to correct someone else's record",
                "institution_id": institution.id,
            },
        )
        assert response.status_code == 403

    def test_list_corrections(self, client, auth_headers, admin_user, teacher_headers, teacher_user, marked_attendance):
        client.post(
            "/api/v1/attendance/corrections",
            headers=teacher_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Reason",
                "institution_id": teacher_user.institution_id,
            },
        )
        response = client.get("/api/v1/attendance/corrections", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    def test_review_correction_approve_success(self, client, auth_headers, teacher_headers, teacher_user, marked_attendance, db_session):
        create_resp = client.post(
            "/api/v1/attendance/corrections",
            headers=teacher_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Reason",
                "institution_id": teacher_user.institution_id,
            },
        )
        correction_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/attendance/corrections/{correction_id}",
            headers=auth_headers,
            json={"status": "approved", "review_remarks": "Confirmed"},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["status"] == "approved"

        db_session.refresh(marked_attendance)
        assert marked_attendance.status == AttendanceStatus.ABSENT

    def test_review_correction_reject_success(self, client, auth_headers, teacher_headers, teacher_user, marked_attendance, db_session):
        create_resp = client.post(
            "/api/v1/attendance/corrections",
            headers=teacher_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Reason",
                "institution_id": teacher_user.institution_id,
            },
        )
        correction_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/attendance/corrections/{correction_id}",
            headers=auth_headers,
            json={"status": "rejected", "review_remarks": "Not valid"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

        db_session.refresh(marked_attendance)
        # Status must be unchanged for a rejected correction.
        assert marked_attendance.status == AttendanceStatus.PRESENT

    def test_review_correction_not_found_404(self, client, auth_headers):
        response = client.put(
            "/api/v1/attendance/corrections/999999", headers=auth_headers, json={"status": "approved"}
        )
        assert response.status_code == 404

    def test_review_correction_already_reviewed_400(self, client, auth_headers, teacher_headers, teacher_user, marked_attendance):
        create_resp = client.post(
            "/api/v1/attendance/corrections",
            headers=teacher_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Reason",
                "institution_id": teacher_user.institution_id,
            },
        )
        correction_id = create_resp.json()["id"]
        client.put(
            f"/api/v1/attendance/corrections/{correction_id}", headers=auth_headers, json={"status": "approved"}
        )
        second = client.put(
            f"/api/v1/attendance/corrections/{correction_id}", headers=auth_headers, json={"status": "rejected"}
        )
        assert second.status_code == 400

    # --- Regression: fix #1 ---
    def test_review_correction_rejected_for_student_caller(self, client, student_headers, teacher_headers, teacher_user, marked_attendance):
        create_resp = client.post(
            "/api/v1/attendance/corrections",
            headers=teacher_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Reason",
                "institution_id": teacher_user.institution_id,
            },
        )
        correction_id = create_resp.json()["id"]
        response = client.put(
            f"/api/v1/attendance/corrections/{correction_id}", headers=student_headers, json={"status": "approved"}
        )
        assert response.status_code == 403

    # --- Regression: fix #5 (check-after-act ordering bug) ---
    def test_review_correction_cross_institution_403_and_no_mutation(
        self, client, auth_headers, teacher_headers, teacher_user, other_admin_headers, marked_attendance, db_session
    ):
        create_resp = client.post(
            "/api/v1/attendance/corrections",
            headers=teacher_headers,
            json={
                "attendance_id": marked_attendance.id,
                "new_status": "absent",
                "reason": "Reason",
                "institution_id": teacher_user.institution_id,
            },
        )
        assert create_resp.status_code == 201
        correction_id = create_resp.json()["id"]

        # A caller from a totally different institution tries to review it.
        response = client.put(
            f"/api/v1/attendance/corrections/{correction_id}",
            headers=other_admin_headers,
            json={"status": "approved", "review_remarks": "Sneaky approval"},
        )
        assert response.status_code == 403

        # The correction's status must NOT have been mutated by the rejected
        # attempt (this is exactly what the pre-fix bug got wrong: the
        # service committed the status change before the router's 403 check
        # ran).
        correction = db_session.query(AttendanceCorrection).filter(AttendanceCorrection.id == correction_id).first()
        db_session.refresh(correction)
        assert correction.status == CorrectionStatus.PENDING
        assert correction.reviewed_by_id is None

        # And the underlying attendance record must still be untouched too.
        db_session.refresh(marked_attendance)
        assert marked_attendance.status == AttendanceStatus.PRESENT

        # A legitimate same-institution admin can still review it correctly.
        legit_response = client.put(
            f"/api/v1/attendance/corrections/{correction_id}",
            headers=auth_headers,
            json={"status": "approved", "review_remarks": "Confirmed"},
        )
        assert legit_response.status_code == 200
        assert legit_response.json()["status"] == "approved"


# ===========================================================================
# Reports & summaries
# ===========================================================================
class TestReportsAndSummaries:
    def test_section_report(self, client, auth_headers, marked_attendance, section):
        response = client.get(
            f"/api/v1/attendance/reports/section/{section.id}",
            headers=auth_headers,
            params={
                "start_date": str(date.today() - timedelta(days=7)),
                "end_date": str(date.today()),
            },
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_student_detailed_report(self, client, auth_headers, marked_attendance, student):
        response = client.get(
            f"/api/v1/attendance/reports/student/{student.id}",
            headers=auth_headers,
            params={
                "start_date": str(date.today() - timedelta(days=7)),
                "end_date": str(date.today()),
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["student_id"] == student.id
        assert data["total_days"] >= 1

    def test_student_detailed_report_cross_institution_403(self, client, other_admin_headers, marked_attendance, student):
        response = client.get(
            f"/api/v1/attendance/reports/student/{student.id}",
            headers=other_admin_headers,
            params={
                "start_date": str(date.today() - timedelta(days=7)),
                "end_date": str(date.today()),
            },
        )
        assert response.status_code == 403

    def test_student_stats(self, client, auth_headers, marked_attendance, student):
        response = client.get(
            f"/api/v1/attendance/reports/student/{student.id}/stats",
            headers=auth_headers,
            params={
                "start_date": str(date.today() - timedelta(days=7)),
                "end_date": str(date.today()),
            },
        )
        assert response.status_code == 200
        assert response.json()["total_days"] >= 1

    def test_student_stats_not_found_404(self, client, auth_headers):
        response = client.get(
            "/api/v1/attendance/reports/student/999999/stats",
            headers=auth_headers,
            params={
                "start_date": str(date.today() - timedelta(days=7)),
                "end_date": str(date.today()),
            },
        )
        assert response.status_code == 404

    def test_defaulters(self, client, auth_headers, marked_attendance):
        response = client.get(
            "/api/v1/attendance/reports/defaulters",
            headers=auth_headers,
            params={
                "start_date": str(date.today() - timedelta(days=7)),
                "end_date": str(date.today()),
            },
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_subject_wise_report(self, client, auth_headers, marked_attendance):
        response = client.get(
            "/api/v1/attendance/reports/subjects",
            headers=auth_headers,
            params={
                "start_date": str(date.today() - timedelta(days=7)),
                "end_date": str(date.today()),
            },
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_student_summaries(self, client, auth_headers, marked_attendance, student, db_session, institution, subject):
        from src.models.attendance import AttendanceSummary

        summary = AttendanceSummary(
            institution_id=institution.id,
            student_id=student.id,
            subject_id=subject.id,
            month=date.today().month,
            year=date.today().year,
            total_days=10,
            present_days=9,
            absent_days=1,
            attendance_percentage=90.0,
        )
        db_session.add(summary)
        db_session.commit()

        response = client.get(f"/api/v1/attendance/summaries/student/{student.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_student_summaries_cross_institution_403(self, client, other_admin_headers, student):
        response = client.get(f"/api/v1/attendance/summaries/student/{student.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ===========================================================================
# GET / (list_attendances)
# ===========================================================================
class TestListAttendances:
    def test_list_attendances(self, client, auth_headers, marked_attendance):
        response = client.get("/api/v1/attendance/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1

    def test_list_attendances_filter_by_student(self, client, auth_headers, marked_attendance, student):
        response = client.get("/api/v1/attendance/", headers=auth_headers, params={"student_id": student.id})
        assert response.status_code == 200
        data = response.json()
        assert all(item["student_id"] == student.id for item in data["items"])
