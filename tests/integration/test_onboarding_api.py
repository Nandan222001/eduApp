"""Integration tests for the `onboarding` router (src/api/v1/onboarding.py).

Onboarding flows/steps (admin-authored), and per-user progress tracking,
document uploads and e-signatures during onboarding.

Bugs found and fixed (by a prior pass on this same router before this
session started; see the router's own docstrings for detail):

1. **Every "admin only" endpoint (create/update/delete flow, add/bulk-update/
   update/delete step, verify document) had `Depends(get_current_user)` but
   no role check at all** -- any authenticated user, including a student,
   could create/edit/delete onboarding flows and steps, or verify other
   users' documents. Fixed by adding
   `require_roles(current_user, ["admin", "super_admin"])`.
2. **Cross-tenant gap**: `start_onboarding`/`get_next_step`/`get_progress_summary`/
   `complete_step` never validated that the target `flow_id`/`step_id`
   belonged to the caller's own institution -- any authenticated user from
   any institution could start, progress through, or read the progress
   summary of another institution's onboarding flow by guessing its id.
   Fixed by scoping every flow/step lookup to `current_user.institution_id`.
3. **`complete_step` could never mark the last step of a flow complete
   (autoflush/relationship-cache bug, same shape as this session's earlier
   `flashcards.py` off-by-one fixes).** The new/updated `OnboardingStepProgress`
   row was attached via `progress_id=progress.id` rather than through the
   `progress.step_progress` relationship itself, so SQLAlchemy never added
   it to that already-loaded collection. `get_next_step` reads
   `progress.step_progress` to compute which steps are done, so on a
   single-step flow it kept seeing the just-completed step as incomplete
   and re-returning it forever -- `OnboardingProgress.is_completed` never
   flipped to `True`. Fixed with an explicit `db.flush()` +
   `db.expire(progress, ['step_progress'])` before recomputing the next
   step.
"""
import uuid

import pytest

from src.models.onboarding import OnboardingFlow, OnboardingStep, StepType, UserRole
from src.models.user import User
from src.utils.security import get_password_hash


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
def other_role(db_session):
    from src.models.role import Role
    role = Role(name="Other Student", slug=f"student-{uuid.uuid4().hex[:8]}", is_system_role=True)
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def other_user(db_session, other_institution, other_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otheruser{suffix}",
        email=f"otheruser{suffix}@otherschool.com",
        first_name="Other",
        last_name="User",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=other_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_headers(client, other_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def flow(db_session, institution) -> OnboardingFlow:
    f = OnboardingFlow(
        institution_id=institution.id,
        name="New Student Onboarding",
        description="Welcome flow",
        role_specific=UserRole.STUDENT,
        is_active=True,
    )
    db_session.add(f)
    db_session.commit()
    db_session.refresh(f)
    return f


@pytest.fixture
def step(db_session, flow) -> OnboardingStep:
    s = OnboardingStep(
        flow_id=flow.id,
        step_order=1,
        step_type=StepType.WELCOME_VIDEO,
        title="Watch welcome video",
        is_required=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


# ---------------------------------------------------------------------------
# Auth + role gating
# ---------------------------------------------------------------------------
class TestAuthAndRoles:
    def test_get_flows_requires_auth(self, client):
        response = client.get("/api/v1/onboarding/flows")
        assert response.status_code in (401, 403)

    def test_create_flow_requires_admin_role(self, client, student_headers):
        response = client.post(
            "/api/v1/onboarding/flows",
            json={"name": "Hacked Flow", "steps": []},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_create_flow_as_admin_succeeds(self, client, auth_headers, institution):
        response = client.post(
            "/api/v1/onboarding/flows",
            json={
                "name": "Teacher Onboarding",
                "role_specific": "teacher",
                "steps": [
                    {
                        "step_order": 1,
                        "step_type": "profile_completion",
                        "title": "Complete profile",
                    }
                ],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["institution_id"] == institution.id
        assert len(data["steps"]) == 1

    def test_delete_flow_requires_admin_role(self, client, student_headers, flow):
        response = client.delete(f"/api/v1/onboarding/flows/{flow.id}", headers=student_headers)
        assert response.status_code == 403

    def test_verify_document_requires_admin_role(self, client, student_headers):
        response = client.post(
            "/api/v1/onboarding/documents/999/verify", headers=student_headers
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Cross-tenant scoping
# ---------------------------------------------------------------------------
class TestCrossTenantScoping:
    def test_get_flow_from_other_institution_is_404(self, client, other_headers, flow):
        response = client.get(f"/api/v1/onboarding/flows/{flow.id}", headers=other_headers)
        assert response.status_code == 404

    def test_start_onboarding_for_other_institution_flow_is_404(
        self, client, other_headers, flow
    ):
        response = client.post(
            "/api/v1/onboarding/progress/start",
            json={"flow_id": flow.id},
            headers=other_headers,
        )
        assert response.status_code == 404

    def test_get_next_step_for_other_institution_flow_is_404(
        self, client, other_headers, flow
    ):
        response = client.get(
            "/api/v1/onboarding/next-step",
            params={"flow_id": flow.id},
            headers=other_headers,
        )
        assert response.status_code == 404

    def test_complete_step_for_other_institution_step_is_404(
        self, client, other_headers, step
    ):
        response = client.post(
            f"/api/v1/onboarding/steps/{step.id}/complete",
            json={"is_skipped": False},
            headers=other_headers,
        )
        assert response.status_code == 404

    def test_progress_summary_for_other_institution_flow_is_404(
        self, client, other_headers, flow
    ):
        response = client.get(
            "/api/v1/onboarding/progress/summary",
            params={"flow_id": flow.id},
            headers=other_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Progress lifecycle (happy path, own institution)
# ---------------------------------------------------------------------------
class TestProgressLifecycle:
    def test_start_progress_get_next_step_and_complete(
        self, client, student_headers, flow, step
    ):
        start_resp = client.post(
            "/api/v1/onboarding/progress/start",
            json={"flow_id": flow.id},
            headers=student_headers,
        )
        assert start_resp.status_code == 201
        assert start_resp.json()["flow_id"] == flow.id

        next_resp = client.get(
            "/api/v1/onboarding/next-step",
            params={"flow_id": flow.id},
            headers=student_headers,
        )
        assert next_resp.status_code == 200
        assert next_resp.json()["id"] == step.id

        complete_resp = client.post(
            f"/api/v1/onboarding/steps/{step.id}/complete",
            json={"is_skipped": False, "response_data": {"watched": True}},
            headers=student_headers,
        )
        assert complete_resp.status_code == 200

        summary_resp = client.get(
            "/api/v1/onboarding/progress/summary",
            params={"flow_id": flow.id},
            headers=student_headers,
        )
        assert summary_resp.status_code == 200
        summary = summary_resp.json()
        assert summary["completed_steps"] == 1
        assert summary["is_completed"] is True

    def test_starting_same_flow_twice_returns_existing_progress(
        self, client, student_headers, flow
    ):
        first = client.post(
            "/api/v1/onboarding/progress/start",
            json={"flow_id": flow.id},
            headers=student_headers,
        )
        second = client.post(
            "/api/v1/onboarding/progress/start",
            json={"flow_id": flow.id},
            headers=student_headers,
        )
        assert first.json()["id"] == second.json()["id"]


# ---------------------------------------------------------------------------
# Documents and signatures
# ---------------------------------------------------------------------------
class TestDocumentsAndSignatures:
    def test_upload_and_get_own_document(self, client, student_headers):
        upload_resp = client.post(
            "/api/v1/onboarding/documents",
            json={
                "document_type": "id_proof",
                "document_name": "passport.pdf",
                "file_url": "https://example.com/passport.pdf",
            },
            headers=student_headers,
        )
        assert upload_resp.status_code == 201
        assert upload_resp.json()["is_verified"] is False

        list_resp = client.get("/api/v1/onboarding/documents", headers=student_headers)
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

    def test_admin_can_verify_document(self, client, auth_headers, student_headers, db_session):
        upload_resp = client.post(
            "/api/v1/onboarding/documents",
            json={
                "document_type": "id_proof",
                "document_name": "id.pdf",
                "file_url": "https://example.com/id.pdf",
            },
            headers=student_headers,
        )
        doc_id = upload_resp.json()["id"]

        verify_resp = client.post(
            f"/api/v1/onboarding/documents/{doc_id}/verify", headers=auth_headers
        )
        assert verify_resp.status_code == 200
        assert verify_resp.json()["is_verified"] is True

    def test_create_and_list_signature(self, client, student_headers):
        response = client.post(
            "/api/v1/onboarding/signatures",
            json={
                "agreement_type": "code_of_conduct",
                "agreement_text": "I agree to the code of conduct.",
            },
            headers=student_headers,
        )
        assert response.status_code == 201
        assert response.json()["agreement_type"] == "code_of_conduct"

        list_resp = client.get("/api/v1/onboarding/signatures", headers=student_headers)
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1
