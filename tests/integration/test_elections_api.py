import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.utils.security import get_password_hash
from src.models.institution import Institution
from src.models.role import Role
from src.models.student import Student
from src.models.user import User


@pytest.fixture
def student_headers(client: TestClient, student_user: User) -> dict:
    """Log in as the student-role user backing the `student` fixture.

    Voting/nomination endpoints operate on the caller's own Student profile
    (looked up via Student.user_id == current_user.id), so admin_headers
    can't be used to cast a vote -- a real student login is required, the
    same real-login pattern auth_headers/super_admin_headers use elsewhere.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _election_payload(institution_id: int, **overrides) -> dict:
    now = datetime.utcnow()
    payload = {
        "institution_id": institution_id,
        "election_title": "Student Council President 2026",
        "description": "Annual student council election",
        "position": "president",
        "eligible_voters": "whole_school",
        "nomination_start": now.isoformat(),
        "nomination_end": (now + timedelta(days=2)).isoformat(),
        "campaign_period_start": (now + timedelta(days=2)).isoformat(),
        "campaign_period_end": (now + timedelta(days=4)).isoformat(),
        "voting_start": (now + timedelta(days=4)).isoformat(),
        "voting_end": (now + timedelta(days=5)).isoformat(),
    }
    payload.update(overrides)
    return payload


@pytest.mark.integration
class TestElectionsAPI:
    """Integration tests for /api/v1/elections/*, one of the routers that
    existed but was never registered anywhere until TESTING_PROGRESS.md's
    twenty-third pass. Covers the full election lifecycle: election
    create/get/list/update/delete, candidate nomination/approval, the
    voter-registry + ballot-casting workflow (including a rejected
    double-vote), ranked-choice voting, results calculation/tallying,
    analytics, and the campaign-activity CRUD sub-resource."""

    # ---- Elections ----------------------------------------------------

    def test_create_and_get_election(self, client: TestClient, auth_headers: dict, institution: Institution):
        response = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id),
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["election_title"] == "Student Council President 2026"
        assert data["election_status"] == "draft"
        election_id = data["id"]

        response = client.get(f"/api/v1/elections/{election_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_candidates"] == 0
        assert data["total_eligible_voters"] == 0
        assert data["total_votes_cast"] == 0
        assert data["voter_turnout_percentage"] is None

    def test_create_election_for_other_institution_forbidden(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        other = Institution(name="Rival School", is_active=True)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        response = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(other.id),
        )
        assert response.status_code == 403

    def test_get_nonexistent_election(self, client: TestClient, auth_headers: dict):
        response = client.get("/api/v1/elections/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_list_and_filter_elections(self, client: TestClient, auth_headers: dict, institution: Institution):
        client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id, position="secretary", election_title="Secretary Race"),
        )

        response = client.get("/api/v1/elections/", headers=auth_headers, params={"position": "secretary"})
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(e["election_title"] == "Secretary Race" for e in data["items"])

    def test_update_and_delete_election(self, client: TestClient, auth_headers: dict, institution: Institution):
        create = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id, election_title="Treasurer Race", position="treasurer"),
        )
        election_id = create.json()["id"]

        response = client.put(
            f"/api/v1/elections/{election_id}",
            headers=auth_headers,
            json={"election_status": "nomination_open"},
        )
        assert response.status_code == 200
        assert response.json()["election_status"] == "nomination_open"

        response = client.delete(f"/api/v1/elections/{election_id}", headers=auth_headers)
        assert response.status_code == 204

        response = client.get(f"/api/v1/elections/{election_id}", headers=auth_headers)
        assert response.status_code == 404

    # ---- Candidates -----------------------------------------------------

    def test_nominate_candidate_workflow(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        election = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id, election_title="VP Race", position="vice_president"),
        ).json()

        response = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={
                "election_id": election["id"],
                "student_id": student.id,
                "position": "vice_president",
                "campaign_statement": "Vote for me!",
                "campaign_platform_points": ["More clubs", "Better cafeteria food"],
            },
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["candidate_status"] == "pending"
        candidate_id = data["id"]

        # Duplicate nomination for the same student is rejected.
        dup = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={"election_id": election["id"], "student_id": student.id, "position": "vice_president"},
        )
        assert dup.status_code == 400

        response = client.get(f"/api/v1/elections/candidates/election/{election['id']}", headers=auth_headers)
        assert response.status_code == 200
        candidates = response.json()
        assert len(candidates) == 1
        assert candidates[0]["student_name"] == f"{student.first_name} {student.last_name}"

        response = client.get(f"/api/v1/elections/candidates/{candidate_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["student_name"] == f"{student.first_name} {student.last_name}"

    def test_approve_candidate(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        election = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id, election_title="Approval Race"),
        ).json()

        candidate = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={"election_id": election["id"], "student_id": student.id, "position": "president"},
        ).json()

        response = client.post(
            f"/api/v1/elections/candidates/{candidate['id']}/approve",
            headers=auth_headers,
            json={"candidate_status": "approved"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["candidate_status"] == "approved"
        assert data["approval_date"] is not None

        # A withdrawal via the update endpoint stamps withdrawal_date.
        response = client.put(
            f"/api/v1/elections/candidates/{candidate['id']}",
            headers=auth_headers,
            json={"withdrawal_reason": "Moving away"},
        )
        assert response.status_code == 200
        assert response.json()["withdrawal_date"] is not None

    # ---- Voting -----------------------------------------------------------

    def _setup_open_election_with_approved_candidate(
        self, client, auth_headers, institution, student, position="president"
    ):
        election = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id, election_title="Live Election", position=position),
        ).json()

        candidate = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={"election_id": election["id"], "student_id": student.id, "position": position},
        ).json()

        client.post(
            f"/api/v1/elections/candidates/{candidate['id']}/approve",
            headers=auth_headers,
            json={"candidate_status": "approved"},
        )

        reg = client.post(f"/api/v1/elections/{election['id']}/voter-registry", headers=auth_headers)
        assert reg.status_code == 200

        opened = client.put(
            f"/api/v1/elections/{election['id']}",
            headers=auth_headers,
            json={"election_status": "voting_open"},
        )
        assert opened.status_code == 200
        assert opened.json()["election_status"] == "voting_open"

        return election, candidate

    def test_voting_workflow(
        self,
        client: TestClient,
        auth_headers: dict,
        student_headers: dict,
        institution: Institution,
        student: Student,
    ):
        election, candidate = self._setup_open_election_with_approved_candidate(
            client, auth_headers, institution, student
        )

        response = client.post(
            "/api/v1/elections/votes/cast",
            headers=student_headers,
            json={"election_id": election["id"], "candidate_id": candidate["id"]},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert data["vote_hash"]
        assert data["verification_code"]

        # Voting a second time is rejected.
        dup = client.post(
            "/api/v1/elections/votes/cast",
            headers=student_headers,
            json={"election_id": election["id"], "candidate_id": candidate["id"]},
        )
        assert dup.status_code == 400

        response = client.get(
            f"/api/v1/elections/{election['id']}/voter-registry",
            headers=auth_headers,
            params={"has_voted": True},
        )
        assert response.status_code == 200
        registry = response.json()
        assert len(registry) == 1
        assert registry[0]["student_id"] == student.id
        assert registry[0]["has_voted"] is True

    def test_vote_without_registration_forbidden(
        self,
        client: TestClient,
        auth_headers: dict,
        student_headers: dict,
        institution: Institution,
        student: Student,
    ):
        election = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id, election_title="No Registry Election"),
        ).json()

        candidate = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={"election_id": election["id"], "student_id": student.id, "position": "president"},
        ).json()
        client.post(
            f"/api/v1/elections/candidates/{candidate['id']}/approve",
            headers=auth_headers,
            json={"candidate_status": "approved"},
        )
        # Note: voter-registry is deliberately NOT populated here.
        client.put(
            f"/api/v1/elections/{election['id']}",
            headers=auth_headers,
            json={"election_status": "voting_open"},
        )

        response = client.post(
            "/api/v1/elections/votes/cast",
            headers=student_headers,
            json={"election_id": election["id"], "candidate_id": candidate["id"]},
        )
        assert response.status_code == 403

    def test_ranked_choice_voting(
        self,
        client: TestClient,
        auth_headers: dict,
        student_headers: dict,
        institution: Institution,
        student: Student,
        db_session: Session,
    ):
        election = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(
                institution.id, election_title="Ranked Choice Race", enable_ranked_choice=True
            ),
        ).json()
        assert election["enable_ranked_choice"] is True

        candidate_a = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={"election_id": election["id"], "student_id": student.id, "position": "president"},
        ).json()
        client.post(
            f"/api/v1/elections/candidates/{candidate_a['id']}/approve",
            headers=auth_headers,
            json={"candidate_status": "approved"},
        )

        # A second candidate needs a second student -- clone the fixture's
        # student under a different user so the ranked ballot has more than
        # one choice to rank.
        from src.models.role import Role as RoleModel

        student_role = db_session.query(RoleModel).filter(RoleModel.slug == "student").first()
        second_user = User(
            username="student2",
            email="student2@testschool.com",
            first_name="Second",
            last_name="Student",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(second_user)
        db_session.commit()
        db_session.refresh(second_user)
        second_student = Student(
            institution_id=institution.id,
            user_id=second_user.id,
            admission_number="ADM002",
            first_name=second_user.first_name,
            last_name=second_user.last_name,
            email=second_user.email,
            section_id=student.section_id,
            date_of_birth=datetime(2008, 5, 1).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Male",
            is_active=True,
        )
        db_session.add(second_student)
        db_session.commit()
        db_session.refresh(second_student)

        candidate_b = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={"election_id": election["id"], "student_id": second_student.id, "position": "president"},
        ).json()
        client.post(
            f"/api/v1/elections/candidates/{candidate_b['id']}/approve",
            headers=auth_headers,
            json={"candidate_status": "approved"},
        )

        client.post(f"/api/v1/elections/{election['id']}/voter-registry", headers=auth_headers)
        client.put(
            f"/api/v1/elections/{election['id']}",
            headers=auth_headers,
            json={"election_status": "voting_open"},
        )

        response = client.post(
            "/api/v1/elections/votes/ranked-choice",
            headers=student_headers,
            json={
                "election_id": election["id"],
                "ranked_candidates": [candidate_a["id"], candidate_b["id"]],
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["success"] is True

        # Close voting and calculate results using the ranked-choice path.
        client.put(
            f"/api/v1/elections/{election['id']}",
            headers=auth_headers,
            json={"election_status": "voting_closed"},
        )
        response = client.post(f"/api/v1/elections/{election['id']}/calculate-results", headers=auth_headers)
        assert response.status_code == 200, response.text
        results = response.json()
        assert len(results) == 2
        winner = next(r for r in results if r["is_winner"])
        assert winner["candidate_id"] == candidate_a["id"]
        assert winner["first_choice_votes"] == 1

    # ---- Results & analytics ----------------------------------------------

    def test_calculate_and_get_results(
        self,
        client: TestClient,
        auth_headers: dict,
        student_headers: dict,
        institution: Institution,
        student: Student,
    ):
        election, candidate = self._setup_open_election_with_approved_candidate(
            client, auth_headers, institution, student
        )

        client.post(
            "/api/v1/elections/votes/cast",
            headers=student_headers,
            json={"election_id": election["id"], "candidate_id": candidate["id"]},
        )

        # Results not yet available before voting is closed.
        premature = client.get(f"/api/v1/elections/{election['id']}/results", headers=auth_headers)
        assert premature.status_code == 400

        client.put(
            f"/api/v1/elections/{election['id']}",
            headers=auth_headers,
            json={"election_status": "voting_closed"},
        )

        response = client.post(f"/api/v1/elections/{election['id']}/calculate-results", headers=auth_headers)
        assert response.status_code == 200, response.text
        results = response.json()
        assert len(results) == 1
        assert results[0]["total_votes"] == 1
        assert results[0]["is_winner"] is True
        assert results[0]["vote_percentage"] == "100.00"

        response = client.get(f"/api/v1/elections/{election['id']}/results", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["candidate_name"] == f"{student.first_name} {student.last_name}"

    def test_election_analytics(
        self,
        client: TestClient,
        auth_headers: dict,
        student_headers: dict,
        institution: Institution,
        student: Student,
    ):
        election, candidate = self._setup_open_election_with_approved_candidate(
            client, auth_headers, institution, student
        )
        client.post(
            "/api/v1/elections/votes/cast",
            headers=student_headers,
            json={"election_id": election["id"], "candidate_id": candidate["id"]},
        )

        response = client.get(f"/api/v1/elections/{election['id']}/analytics", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_eligible_voters"] == 1
        assert data["total_votes_cast"] == 1
        assert data["voter_turnout_percentage"] == 100.0
        assert len(data["candidate_statistics"]) == 1
        assert data["candidate_statistics"][0]["total_votes"] == 1

    # ---- Campaign activities ------------------------------------------

    def test_campaign_activity_lifecycle(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        election = client.post(
            "/api/v1/elections/",
            headers=auth_headers,
            json=_election_payload(institution.id, election_title="Campaign Race"),
        ).json()
        candidate = client.post(
            "/api/v1/elections/candidates",
            headers=auth_headers,
            json={"election_id": election["id"], "student_id": student.id, "position": "president"},
        ).json()

        response = client.post(
            "/api/v1/elections/campaign-activities",
            headers=auth_headers,
            json={
                "candidate_id": candidate["id"],
                "activity_type": "rally",
                "activity_title": "Campaign Kickoff Rally",
                "activity_date": datetime.utcnow().isoformat(),
                "location": "Main Hall",
                "attendees_count": 50,
            },
        )
        assert response.status_code == 201, response.text
        activity_id = response.json()["id"]

        response = client.get(
            f"/api/v1/elections/campaign-activities/candidate/{candidate['id']}", headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.put(
            f"/api/v1/elections/campaign-activities/{activity_id}",
            headers=auth_headers,
            json={"attendees_count": 75},
        )
        assert response.status_code == 200
        assert response.json()["attendees_count"] == 75

        response = client.delete(
            f"/api/v1/elections/campaign-activities/{activity_id}", headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(
            f"/api/v1/elections/campaign-activities/candidate/{candidate['id']}", headers=auth_headers
        )
        assert response.json() == []
