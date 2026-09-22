import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.academic import AcademicYear, Grade, Subject
from src.models.student import Student
from src.models.teacher import Teacher


@pytest.mark.integration
class TestExamsAPI:
    """Integration tests for /api/v1/exams/*, an established, pre-existing
    router (src/api/v1/exams.py) backed by src/services/examination_service.py
    -- one of the ~95 registered backend routers not part of this session's
    earlier 10-router Phase-2 pass, picked up as part of the next round of
    backend route-module auditing (see TESTING_PROGRESS.md). Note this
    router takes institution_id/entered_by as query params rather than
    deriving them from an authenticated user -- it has no auth dependency
    at all, so no auth_headers are used here (matches the router's own,
    pre-existing design; not something introduced or masked by these tests)."""

    def test_create_and_get_exam(
        self, client: TestClient, institution: Institution, academic_year: AcademicYear, grade: Grade
    ):
        response = client.post(
            "/api/v1/exams",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Midterm Examination",
                "exam_type": "mid_term",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=5)),
                "total_marks": "500",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Midterm Examination"
        assert data["status"] == "scheduled"
        exam_id = data["id"]

        response = client.get(f"/api/v1/exams/{exam_id}", params={"institution_id": institution.id})
        assert response.status_code == 200
        assert response.json()["name"] == "Midterm Examination"

    def test_get_nonexistent_exam(self, client: TestClient, institution: Institution):
        response = client.get("/api/v1/exams/999999", params={"institution_id": institution.id})
        assert response.status_code == 404

    def test_list_exams(
        self, client: TestClient, institution: Institution, academic_year: AcademicYear, grade: Grade
    ):
        client.post(
            "/api/v1/exams",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Unit Test 1",
                "exam_type": "unit",
                "start_date": str(date.today()),
                "end_date": str(date.today()),
            },
        )
        response = client.get("/api/v1/exams", params={"institution_id": institution.id})
        assert response.status_code == 200
        data = response.json()
        assert any(e["name"] == "Unit Test 1" for e in data)

    def test_update_and_delete_exam(
        self, client: TestClient, institution: Institution, academic_year: AcademicYear, grade: Grade
    ):
        create = client.post(
            "/api/v1/exams",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Final Exam",
                "exam_type": "final",
                "start_date": str(date.today()),
                "end_date": str(date.today() + timedelta(days=2)),
            },
        )
        exam_id = create.json()["id"]

        response = client.put(
            f"/api/v1/exams/{exam_id}",
            params={"institution_id": institution.id},
            json={"is_published": True, "status": "ongoing"},
        )
        assert response.status_code == 200
        assert response.json()["is_published"] is True
        assert response.json()["status"] == "ongoing"

        response = client.delete(f"/api/v1/exams/{exam_id}", params={"institution_id": institution.id})
        assert response.status_code == 204

        response = client.get(f"/api/v1/exams/{exam_id}", params={"institution_id": institution.id})
        assert response.status_code == 404

    def test_exam_subjects_and_marks_and_results_flow(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        subject: Subject,
        student: Student,
        teacher: Teacher,
    ):
        exam = client.post(
            "/api/v1/exams",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Term 1",
                "exam_type": "unit",
                "start_date": str(date.today()),
                "end_date": str(date.today()),
            },
        ).json()

        exam_subject = client.post(
            f"/api/v1/exams/{exam['id']}/subjects",
            json={
                "institution_id": institution.id,
                "exam_id": exam["id"],
                "subject_id": subject.id,
                "theory_max_marks": "80",
                "practical_max_marks": "20",
                "theory_passing_marks": "24",
            },
        )
        assert exam_subject.status_code == 201
        exam_subject_id = exam_subject.json()["id"]

        response = client.get(
            f"/api/v1/exams/{exam['id']}/subjects", params={"institution_id": institution.id}
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        marks = client.post(
            "/api/v1/exams/marks",
            params={"entered_by": teacher.id},
            json={
                "institution_id": institution.id,
                "exam_subject_id": exam_subject_id,
                "student_id": student.id,
                "theory_marks_obtained": "70",
                "practical_marks_obtained": "18",
            },
        )
        assert marks.status_code == 201
        assert marks.json()["theory_marks_obtained"] == "70.00"

        response = client.get(
            f"/api/v1/exams/subjects/{exam_subject_id}/marks", params={"institution_id": institution.id}
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        results = client.post(
            f"/api/v1/exams/{exam['id']}/results/generate", params={"institution_id": institution.id}
        )
        assert results.status_code == 200
        data = results.json()
        assert len(data) == 1
        assert data[0]["total_marks_obtained"] == "88.00" or float(data[0]["total_marks_obtained"]) == 88.0

        response = client.get(
            f"/api/v1/exams/{exam['id']}/results/student/{student.id}",
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        student_result = response.json()
        assert student_result["student_id"] == student.id
        assert float(student_result["percentage"]) == 88.0

    def test_grade_configuration_crud(self, client: TestClient, institution: Institution):
        response = client.post(
            "/api/v1/exams/grade-configurations",
            json={
                "institution_id": institution.id,
                "name": "A Grade",
                "grade": "A",
                "min_percentage": "80",
                "max_percentage": "100",
                "grade_point": "4.0",
            },
        )
        assert response.status_code == 201
        config_id = response.json()["id"]

        response = client.get(
            "/api/v1/exams/grade-configurations", params={"institution_id": institution.id}
        )
        assert response.status_code == 200
        assert any(c["id"] == config_id for c in response.json())

        response = client.put(
            f"/api/v1/exams/grade-configurations/{config_id}",
            params={"institution_id": institution.id},
            json={"grade_point": "4.5"},
        )
        assert response.status_code == 200
        assert response.json()["grade_point"] == "4.50"

        response = client.delete(
            f"/api/v1/exams/grade-configurations/{config_id}", params={"institution_id": institution.id}
        )
        assert response.status_code == 204

    def test_exam_schedule_create_and_list(
        self,
        client: TestClient,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        subject: Subject,
    ):
        exam = client.post(
            "/api/v1/exams",
            json={
                "institution_id": institution.id,
                "academic_year_id": academic_year.id,
                "grade_id": grade.id,
                "name": "Schedule Test Exam",
                "exam_type": "unit",
                "start_date": str(date.today()),
                "end_date": str(date.today()),
            },
        ).json()

        response = client.post(
            f"/api/v1/exams/{exam['id']}/schedules",
            json={
                "institution_id": institution.id,
                "exam_id": exam["id"],
                "subject_id": subject.id,
                "exam_date": str(date.today()),
                "start_time": "09:00:00",
                "end_time": "11:00:00",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["has_conflicts"] is False
        assert data["schedule"]["subject_id"] == subject.id

        response = client.get(
            f"/api/v1/exams/{exam['id']}/schedules", params={"institution_id": institution.id}
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
