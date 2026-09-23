import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.user import User


@pytest.fixture
def student_headers(client: TestClient, student: Student) -> dict:
    """Real login as the `student` fixture's underlying user.

    Several research endpoints (documents, experiment logs, data files,
    peer reviews) gate on `current_user.student_profile`, which the
    regular `auth_headers` (an admin user with no student/teacher
    profile) can never satisfy.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def teacher_headers(client: TestClient, teacher: Teacher) -> dict:
    """Real login as the `teacher` fixture's underlying user, for the
    advisor-feedback endpoints gated on `current_user.teacher_profile`."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_project(client: TestClient, headers: dict, institution: Institution, **overrides) -> dict:
    payload = {
        "institution_id": institution.id,
        "project_title": "Effects of Light Color on Plant Growth",
        "research_question": "Does light color affect the rate of plant growth?",
        "subject_area": "Biology",
        "project_type": "science_fair",
    }
    payload.update(overrides)
    response = client.post("/api/v1/research/projects", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.integration
class TestResearchAPI:
    """Integration tests for /api/v1/research/*, the real, mounted router
    (src/api/v1/research.py, registered with no internal prefix collision)
    backed by src/models/research.py and src/services/research_service.py.
    No endpoint here makes an external network/AI-model call, so every
    central endpoint is exercised end-to-end against the real MySQL
    database."""

    def test_create_and_get_project(
        self, client: TestClient, auth_headers: dict, institution: Institution,
        student: Student, teacher: Teacher,
    ):
        response = client.post(
            "/api/v1/research/projects",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "project_title": "Effects of Light Color on Plant Growth",
                "research_question": "Does light color affect the rate of plant growth?",
                "hypothesis": "Blue light accelerates growth.",
                "subject_area": "Biology",
                "project_type": "science_fair",
                "advisor_teacher_id": teacher.id,
                "team_members": [{"student_id": student.id, "role": "lead"}],
                "timeline": [
                    {"milestone_title": "Literature review", "deadline": "2026-10-01T00:00:00"}
                ],
                "literature_references": [
                    {"title": "Plant Biology Basics", "authors": "J. Smith", "publication_year": 2020}
                ],
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["project_title"] == "Effects of Light Color on Plant Growth"
        assert data["data_collection_status"] == "not_started"
        assert data["publication_status"] == "draft"
        assert data["is_active"] is True
        project_id = data["id"]

        response = client.get(f"/api/v1/research/projects/{project_id}", headers=auth_headers)
        assert response.status_code == 200
        detail = response.json()
        assert len(detail["team_members"]) == 1
        assert detail["team_members"][0]["student_id"] == student.id
        assert len(detail["milestones"]) == 1
        assert detail["milestones"][0]["title"] == "Literature review"
        assert len(detail["literature_references"]) == 1
        assert detail["literature_references"][0]["title"] == "Plant Biology Basics"

    def test_create_project_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Rival Research Academy", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/research/projects",
            headers=auth_headers,
            json={
                "institution_id": other.id,
                "project_title": "Contraband Project",
                "research_question": "Why is this here?",
                "subject_area": "Chemistry",
                "project_type": "science_fair",
            },
        )
        assert response.status_code == 403

    def test_get_project_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, institution: Institution, db_session: Session
    ):
        project = _create_project(client, auth_headers, institution)

        # A user from a different institution cannot see it.
        other = Institution(name="Second Research Academy", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)
        from src.utils.security import get_password_hash
        from src.models.user import User as UserModel
        from src.models.role import Role

        role = Role(name="Admin2", slug="admin2", description="x", is_system_role=True)
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        other_user = UserModel(
            username="otheradmin",
            email="otheradmin@rival.com",
            first_name="Other",
            last_name="Admin",
            hashed_password=get_password_hash("password123"),
            institution_id=other.id,
            role_id=role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        login = client.post(
            "/api/v1/auth/login", json={"email": other_user.email, "password": "password123"}
        )
        other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = client.get(f"/api/v1/research/projects/{project['id']}", headers=other_headers)
        assert response.status_code == 403

    def test_get_nonexistent_project(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/research/projects/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_list_and_filter_projects(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        _create_project(client, auth_headers, institution, subject_area="Physics", project_type="math_investigation")
        _create_project(client, auth_headers, institution, subject_area="Biology", project_type="science_fair")

        response = client.get("/api/v1/research/projects", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert data["skip"] == 0

        response = client.get(
            "/api/v1/research/projects",
            headers=auth_headers,
            params={"subject_area": "Physics"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert all(p["subject_area"] == "Physics" for p in data["items"])

        response = client.get(
            "/api/v1/research/projects",
            headers=auth_headers,
            params={"project_type": "science_fair"},
        )
        assert response.status_code == 200
        assert all(p["project_type"] == "science_fair" for p in response.json()["items"])

    def test_update_and_delete_project(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        project = _create_project(client, auth_headers, institution)

        response = client.put(
            f"/api/v1/research/projects/{project['id']}",
            headers=auth_headers,
            json={
                "findings": "Blue light produced 20% faster growth.",
                "publication_status": "submitted",
                "data_collection_status": "completed",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["findings"] == "Blue light produced 20% faster growth."
        assert data["publication_status"] == "submitted"
        assert data["data_collection_status"] == "completed"

        response = client.delete(f"/api/v1/research/projects/{project['id']}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/research/projects/{project['id']}", headers=auth_headers)
        assert response.status_code == 404

    def test_team_members_add_duplicate_and_remove(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        project = _create_project(client, auth_headers, institution)

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/team-members",
            headers=auth_headers,
            json={"student_id": student.id, "role": "researcher"},
        )
        assert response.status_code == 201
        member_id = response.json()["id"]

        # Adding the same student again is rejected.
        dup = client.post(
            f"/api/v1/research/projects/{project['id']}/team-members",
            headers=auth_headers,
            json={"student_id": student.id, "role": "writer"},
        )
        assert dup.status_code == 400

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/team-members", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.delete(
            f"/api/v1/research/projects/team-members/{member_id}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/team-members", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_milestone_workflow_and_overdue(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        project = _create_project(client, auth_headers, institution)

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/milestones",
            headers=auth_headers,
            json={
                "title": "Submit proposal",
                "deadline": "2020-01-01T00:00:00",  # deliberately in the past
            },
        )
        assert response.status_code == 201
        milestone = response.json()
        assert milestone["status"] == "pending"
        milestone_id = milestone["id"]

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/milestones", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/milestones/overdue", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["id"] == milestone_id

        # Completing the milestone stamps completed_at automatically and
        # removes it from the overdue list.
        response = client.put(
            f"/api/v1/research/milestones/{milestone_id}",
            headers=auth_headers,
            json={"status": "completed"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/milestones/overdue", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 0

        response = client.delete(f"/api/v1/research/milestones/{milestone_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_document_create_update_and_versions(
        self, client: TestClient, auth_headers: dict, student_headers: dict,
        institution: Institution, student: Student,
    ):
        project = _create_project(client, auth_headers, institution)

        # Only a student can create a document.
        forbidden = client.post(
            "/api/v1/research/projects/1/documents",
            headers=auth_headers,
            json={"project_id": project["id"], "title": "Draft report"},
        )
        assert forbidden.status_code == 403

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/documents",
            headers=student_headers,
            json={
                "project_id": project["id"],
                "title": "Draft report",
                "content": "Initial content.",
            },
        )
        assert response.status_code == 201
        document = response.json()
        assert document["created_by_student_id"] == student.id
        document_id = document["id"]

        response = client.get(f"/api/v1/research/documents/{document_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Draft report"

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/documents", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        # Updating with new content (default create_version=True) records a version.
        response = client.put(
            f"/api/v1/research/documents/{document_id}",
            headers=student_headers,
            json={"content": "Revised content."},
        )
        assert response.status_code == 200
        assert response.json()["content"] == "Revised content."

        response = client.get(
            f"/api/v1/research/documents/{document_id}/versions", headers=auth_headers
        )
        assert response.status_code == 200
        versions = response.json()
        assert len(versions) == 1
        assert versions[0]["version_number"] == 1
        assert versions[0]["content"] == "Initial content."

        # Explicit version creation endpoint.
        response = client.post(
            f"/api/v1/research/documents/{document_id}/versions",
            headers=student_headers,
            json={"content": "Revised content.", "changes_summary": "Added references"},
        )
        assert response.status_code == 201
        assert response.json()["version_number"] == 2

        response = client.delete(f"/api/v1/research/documents/{document_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_experiment_log_crud(
        self, client: TestClient, auth_headers: dict, student_headers: dict,
        institution: Institution, student: Student,
    ):
        project = _create_project(client, auth_headers, institution)

        forbidden = client.post(
            f"/api/v1/research/projects/{project['id']}/experiment-logs",
            headers=auth_headers,
            json={
                "project_id": project["id"],
                "experiment_title": "Trial 1",
                "experiment_date": "2026-05-01T00:00:00",
            },
        )
        assert forbidden.status_code == 403

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/experiment-logs",
            headers=student_headers,
            json={
                "project_id": project["id"],
                "experiment_title": "Trial 1",
                "experiment_date": "2026-05-01T00:00:00",
                "observations": "Seedlings sprouted after 3 days.",
            },
        )
        assert response.status_code == 201
        log = response.json()
        assert log["recorded_by_student_id"] == student.id
        log_id = log["id"]

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/experiment-logs", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.put(
            f"/api/v1/research/experiment-logs/{log_id}",
            headers=auth_headers,
            json={"results": "Blue light group grew 20% taller.", "conclusion": "Hypothesis supported."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["results"] == "Blue light group grew 20% taller."
        assert data["conclusion"] == "Hypothesis supported."

        response = client.delete(f"/api/v1/research/experiment-logs/{log_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_data_file_upload_and_list(
        self, client: TestClient, auth_headers: dict, student_headers: dict,
        institution: Institution, student: Student,
    ):
        project = _create_project(client, auth_headers, institution)

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/data-files",
            headers=student_headers,
            json={
                "project_id": project["id"],
                "file_name": "measurements.csv",
                "file_url": "https://files.example.com/measurements.csv",
                "file_type": "text/csv",
                "file_size": 2048,
            },
        )
        assert response.status_code == 201
        data_file = response.json()
        assert data_file["uploaded_by_student_id"] == student.id
        file_id = data_file["id"]

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/data-files", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.delete(f"/api/v1/research/data-files/{file_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_advisor_feedback_requires_teacher_and_updates(
        self, client: TestClient, auth_headers: dict, teacher_headers: dict,
        institution: Institution, teacher: Teacher,
    ):
        project = _create_project(client, auth_headers, institution, advisor_teacher_id=teacher.id)

        forbidden = client.post(
            f"/api/v1/research/projects/{project['id']}/advisor-feedback",
            headers=auth_headers,
            json={"project_id": project["id"], "feedback_text": "Needs more data."},
        )
        assert forbidden.status_code == 403

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/advisor-feedback",
            headers=teacher_headers,
            json={
                "project_id": project["id"],
                "feedback_text": "Needs more data points before submission.",
                "feedback_type": "methodology",
            },
        )
        assert response.status_code == 201
        feedback = response.json()
        assert feedback["teacher_id"] == teacher.id
        assert feedback["status"] == "pending"
        feedback_id = feedback["id"]

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/advisor-feedback", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.put(
            f"/api/v1/research/advisor-feedback/{feedback_id}",
            headers=teacher_headers,
            json={"status": "reviewed"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "reviewed"

        response = client.delete(
            f"/api/v1/research/advisor-feedback/{feedback_id}", headers=teacher_headers
        )
        assert response.status_code == 204

    def test_peer_review_duplicate_rejected_and_average_rating(
        self, client: TestClient, auth_headers: dict, student_headers: dict,
        institution: Institution, student: Student,
    ):
        project = _create_project(client, auth_headers, institution)

        forbidden = client.post(
            f"/api/v1/research/projects/{project['id']}/peer-reviews",
            headers=auth_headers,
            json={"project_id": project["id"], "review_text": "Solid work."},
        )
        assert forbidden.status_code == 403

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/peer-reviews",
            headers=student_headers,
            json={
                "project_id": project["id"],
                "review_text": "Well documented methodology.",
                "rating": 4,
                "strengths": "Clear hypothesis",
            },
        )
        assert response.status_code == 201
        review = response.json()
        assert review["reviewer_student_id"] == student.id
        assert review["decision"] == "pending"
        review_id = review["id"]

        # The same student cannot review the same project twice.
        dup = client.post(
            f"/api/v1/research/projects/{project['id']}/peer-reviews",
            headers=student_headers,
            json={"project_id": project["id"], "review_text": "Again.", "rating": 5},
        )
        assert dup.status_code == 400

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/peer-reviews", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/average-rating", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["average_rating"] == 4.0

        # An advisor/admin (no student_profile) can move the review's decision forward.
        response = client.put(
            f"/api/v1/research/peer-reviews/{review_id}",
            headers=auth_headers,
            json={"decision": "approved"},
        )
        assert response.status_code == 200
        assert response.json()["decision"] == "approved"

        response = client.delete(f"/api/v1/research/peer-reviews/{review_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_literature_references(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        project = _create_project(client, auth_headers, institution)

        response = client.post(
            f"/api/v1/research/projects/{project['id']}/literature-references",
            headers=auth_headers,
            json={
                "title": "Photosynthesis and Light Spectra",
                "authors": "A. Green",
                "publication_year": 2019,
                "source": "Journal of Plant Science",
            },
        )
        assert response.status_code == 201
        reference_id = response.json()["id"]

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/literature-references", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.delete(
            f"/api/v1/research/literature-references/{reference_id}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(
            f"/api/v1/research/projects/{project['id']}/literature-references", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_showcase_lists_only_published_active_projects(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        draft_project = _create_project(client, auth_headers, institution, project_title="Still a Draft")
        published_project = _create_project(
            client, auth_headers, institution, project_title="Published Research"
        )

        client.post(
            f"/api/v1/research/projects/{published_project['id']}/team-members",
            headers=auth_headers,
            json={"student_id": student.id, "role": "lead"},
        )
        client.put(
            f"/api/v1/research/projects/{published_project['id']}",
            headers=auth_headers,
            json={"publication_status": "published"},
        )

        response = client.get("/api/v1/research/showcase", headers=auth_headers)
        assert response.status_code == 200
        titles = [p["project_title"] for p in response.json()]
        assert "Published Research" in titles
        assert "Still a Draft" not in titles

        showcased = next(p for p in response.json() if p["project_title"] == "Published Research")
        assert showcased["team_size"] == 1
        assert showcased["avg_rating"] is None
