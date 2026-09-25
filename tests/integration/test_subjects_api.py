"""Integration tests for the `subjects` router (src/api/v1/subjects.py).

Covers Subject CRUD plus the grade-subject assignment endpoints
(`assign_subject_to_grade` / `remove_subject_from_grade` /
`get_grade_subjects`).

Three real bugs fixed in the grade-subject endpoints as part of this
pass (see commit message for full detail):

1. `remove_subject_from_grade` (`DELETE /grade-subjects/{grade_id}/{subject_id}`)
   did *no* institution check at all -- any authenticated user of any
   institution could delete another institution's grade-subject link by
   guessing/incrementing ids. Fixed by scoping the Grade lookup to
   `current_user.institution_id` first.
2. `get_grade_subjects` (`GET /grades/{grade_id}/subjects`) had the same
   gap -- any user could list another institution's subjects assigned to
   a grade they don't own. Fixed the same way.
3. `assign_subject_to_grade` checked `current_user.institution_id ==
   data.institution_id`, but never verified `grade_id`/`subject_id`
   actually belong to that institution, letting a caller link another
   institution's Grade/Subject rows together under their own
   `institution_id`. Fixed by validating both belong to the caller's
   institution before creating the link.

A fourth bug (not a security gap, but a crash) was also fixed:
`get_grade_subjects` declared `response_model=list`, and the handler
returned raw SQLAlchemy `Subject` ORM objects directly -- FastAPI's
`jsonable_encoder` has no `SubjectResponse` schema to validate against
in that case and falls back to walking `vars(obj)`, which includes the
non-serializable `_sa_instance_state` key, causing a 500. Fixed by
changing `response_model` to `List[SubjectResponse]` (already imported
and used elsewhere in the file), which lets FastAPI validate/serialize
the ORM rows correctly via `from_attributes`.
"""
import uuid

import pytest

from src.models.institution import Institution
from src.models.role import Role
from src.models.user import User
from src.models.academic import AcademicYear, Grade, Subject, GradeSubject
from src.utils.security import get_password_hash


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
def other_admin_role(db_session) -> Role:
    suffix = uuid.uuid4().hex[:8]
    role = Role(name=f"Admin{suffix}", slug=f"admin-{suffix}", description="Administrator role", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_admin_user(db_session, other_institution, other_admin_role) -> User:
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


@pytest.fixture
def other_academic_year(db_session, other_institution) -> AcademicYear:
    year = AcademicYear(
        institution_id=other_institution.id,
        name="Other 2023-2024",
        start_date="2023-04-01",
        end_date="2024-03-31",
        is_active=True,
        is_current=True,
    )
    db_session.add(year)
    db_session.commit()
    db_session.refresh(year)
    return year


@pytest.fixture
def other_grade(db_session, other_institution, other_academic_year) -> Grade:
    grade = Grade(institution_id=other_institution.id, academic_year_id=other_academic_year.id, name="Other Grade 10")
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)
    return grade


@pytest.fixture
def other_subject(db_session, other_institution) -> Subject:
    subject = Subject(institution_id=other_institution.id, name="Other Physics", code="PHY-OTHER")
    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)
    return subject


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------
class TestCreateSubject:
    def test_create_happy_path(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/subjects/",
            json={"institution_id": institution.id, "name": "Physics", "code": "PHY10"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Physics"
        assert data["code"] == "PHY10"

    def test_create_duplicate_name_returns_400(self, client, auth_headers, institution, subject):
        response = client.post(
            "/api/v1/subjects/",
            json={"institution_id": institution.id, "name": subject.name, "code": "DIFFERENT"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_duplicate_code_returns_400(self, client, auth_headers, institution, subject):
        response = client.post(
            "/api/v1/subjects/",
            json={"institution_id": institution.id, "name": "A Different Name", "code": subject.code},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_cross_institution_forbidden(self, client, auth_headers, other_institution):
        response = client.post(
            "/api/v1/subjects/",
            json={"institution_id": other_institution.id, "name": "Chemistry"},
            headers=auth_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------
class TestListSubjects:
    def test_list_default(self, client, auth_headers, subject):
        response = client.get("/api/v1/subjects/", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert subject.id in ids

    def test_list_only_returns_own_institution(self, client, auth_headers, other_subject):
        response = client.get("/api/v1/subjects/", headers=auth_headers)
        ids = [item["id"] for item in response.json()["items"]]
        assert other_subject.id not in ids

    def test_list_search_by_name(self, client, auth_headers, subject):
        response = client.get("/api/v1/subjects/?search=Math", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert subject.id in ids

    def test_list_search_no_match(self, client, auth_headers, subject):
        response = client.get("/api/v1/subjects/?search=NoSuchSubjectXYZ", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_list_filter_is_active(self, client, auth_headers, institution, db_session):
        inactive = Subject(institution_id=institution.id, name="Inactive Subject", is_active=False)
        db_session.add(inactive)
        db_session.commit()

        response = client.get("/api/v1/subjects/?is_active=false", headers=auth_headers)
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]
        assert inactive.id in ids


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------
class TestGetSubject:
    def test_get_happy_path(self, client, auth_headers, subject):
        response = client.get(f"/api/v1/subjects/{subject.id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == subject.id

    def test_get_not_found(self, client, auth_headers):
        response = client.get("/api/v1/subjects/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_cross_institution_forbidden(self, client, other_admin_headers, subject):
        response = client.get(f"/api/v1/subjects/{subject.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------
class TestUpdateSubject:
    def test_update_happy_path(self, client, auth_headers, subject):
        response = client.put(
            f"/api/v1/subjects/{subject.id}",
            json={"name": "Advanced Mathematics"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Advanced Mathematics"

    def test_update_not_found(self, client, auth_headers):
        response = client.put("/api/v1/subjects/999999", json={"name": "Nope"}, headers=auth_headers)
        assert response.status_code == 404

    def test_update_cross_institution_forbidden(self, client, other_admin_headers, subject):
        response = client.put(f"/api/v1/subjects/{subject.id}", json={"name": "Hijacked"}, headers=other_admin_headers)
        assert response.status_code == 403

    def test_update_duplicate_code_returns_400(self, client, auth_headers, institution, subject, db_session):
        second_subject = Subject(institution_id=institution.id, name="Biology", code="BIO10")
        db_session.add(second_subject)
        db_session.commit()
        db_session.refresh(second_subject)

        response = client.put(
            f"/api/v1/subjects/{second_subject.id}",
            json={"code": subject.code},
            headers=auth_headers,
        )
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------
class TestDeleteSubject:
    def test_delete_happy_path(self, client, auth_headers, subject):
        response = client.delete(f"/api/v1/subjects/{subject.id}", headers=auth_headers)
        assert response.status_code == 204

        get_response = client.get(f"/api/v1/subjects/{subject.id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_not_found(self, client, auth_headers):
        response = client.delete("/api/v1/subjects/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_cross_institution_forbidden(self, client, other_admin_headers, subject):
        response = client.delete(f"/api/v1/subjects/{subject.id}", headers=other_admin_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# grade-subject assignment
# ---------------------------------------------------------------------------
class TestAssignSubjectToGrade:
    def test_assign_happy_path(self, client, auth_headers, institution, grade, subject):
        response = client.post(
            "/api/v1/subjects/grade-subjects",
            json={"institution_id": institution.id, "grade_id": grade.id, "subject_id": subject.id, "is_compulsory": True},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["grade_id"] == grade.id
        assert data["subject_id"] == subject.id
        assert data["is_compulsory"] is True

    def test_assign_duplicate_returns_400(self, client, auth_headers, institution, grade, subject, db_session):
        db_session.add(GradeSubject(institution_id=institution.id, grade_id=grade.id, subject_id=subject.id))
        db_session.commit()

        response = client.post(
            "/api/v1/subjects/grade-subjects",
            json={"institution_id": institution.id, "grade_id": grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_assign_cross_institution_forbidden(self, client, auth_headers, other_institution, other_grade, other_subject):
        response = client.post(
            "/api/v1/subjects/grade-subjects",
            json={"institution_id": other_institution.id, "grade_id": other_grade.id, "subject_id": other_subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_assign_with_other_institutions_grade_not_found(self, client, auth_headers, institution, other_grade, subject):
        """Regression test: institution_id belongs to the caller, but
        grade_id references another institution's Grade entirely.
        """
        response = client.post(
            "/api/v1/subjects/grade-subjects",
            json={"institution_id": institution.id, "grade_id": other_grade.id, "subject_id": subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_assign_with_other_institutions_subject_not_found(self, client, auth_headers, institution, grade, other_subject):
        response = client.post(
            "/api/v1/subjects/grade-subjects",
            json={"institution_id": institution.id, "grade_id": grade.id, "subject_id": other_subject.id},
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestRemoveSubjectFromGrade:
    def test_remove_happy_path(self, client, auth_headers, institution, grade, subject, db_session):
        db_session.add(GradeSubject(institution_id=institution.id, grade_id=grade.id, subject_id=subject.id))
        db_session.commit()

        response = client.delete(f"/api/v1/subjects/grade-subjects/{grade.id}/{subject.id}", headers=auth_headers)
        assert response.status_code == 204

    def test_remove_not_found(self, client, auth_headers, grade, subject):
        response = client.delete(f"/api/v1/subjects/grade-subjects/{grade.id}/{subject.id}", headers=auth_headers)
        assert response.status_code == 404

    def test_remove_cross_institution_grade_returns_404(
        self, client, auth_headers, other_institution, other_grade, other_subject, db_session
    ):
        """Regression test: before the fix, this endpoint did no
        institution check at all, so any authenticated user could delete
        another institution's grade-subject link outright (204, silent
        cross-tenant mutation).
        """
        db_session.add(GradeSubject(institution_id=other_institution.id, grade_id=other_grade.id, subject_id=other_subject.id))
        db_session.commit()

        response = client.delete(
            f"/api/v1/subjects/grade-subjects/{other_grade.id}/{other_subject.id}", headers=auth_headers
        )
        assert response.status_code == 404

        # and it must still exist afterward, untouched
        still_there = db_session.query(GradeSubject).filter(
            GradeSubject.grade_id == other_grade.id, GradeSubject.subject_id == other_subject.id
        ).first()
        assert still_there is not None


class TestGetGradeSubjects:
    def test_get_grade_subjects_happy_path(self, client, auth_headers, institution, grade, subject, db_session):
        db_session.add(GradeSubject(institution_id=institution.id, grade_id=grade.id, subject_id=subject.id))
        db_session.commit()

        response = client.get(f"/api/v1/subjects/grades/{grade.id}/subjects", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(item["id"] == subject.id for item in data)
        # Full SubjectResponse fields must be present (validates the
        # response_model=list -> List[SubjectResponse] fix).
        assert data[0]["name"]
        assert "institution_id" in data[0]

    def test_get_grade_subjects_empty_list(self, client, auth_headers, grade):
        response = client.get(f"/api/v1/subjects/grades/{grade.id}/subjects", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_grade_subjects_grade_not_found(self, client, auth_headers):
        response = client.get("/api/v1/subjects/grades/999999/subjects", headers=auth_headers)
        assert response.status_code == 404

    def test_get_grade_subjects_cross_institution_returns_404(
        self, client, auth_headers, other_institution, other_grade, other_subject, db_session
    ):
        """Regression test: before the fix, any authenticated user could
        read another institution's grade-subject assignments by grade id.
        """
        db_session.add(GradeSubject(institution_id=other_institution.id, grade_id=other_grade.id, subject_id=other_subject.id))
        db_session.commit()

        response = client.get(f"/api/v1/subjects/grades/{other_grade.id}/subjects", headers=auth_headers)
        assert response.status_code == 404
