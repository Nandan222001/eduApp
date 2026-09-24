"""Integration tests for the `content_marketplace` router
(src/api/v1/content_marketplace.py).

A peer-to-peer study content marketplace: students create/submit study
content for review, teachers/admins moderate it (approve/reject/request
revision), an automated plagiarism checker compares new submissions against
existing approved content, students buy/sell content with an in-app credits
system (with a revenue-share payout to the creator), and students review
purchased/owned content.

Bugs found and fixed while writing this coverage:

1. **`require_roles` (and 3 other inline role checks) compared `Role.name`
   (a display label, e.g. "Student", "Admin") against the lowercase
   machine-readable role identifiers every caller passes in
   (`"student"`/`"teacher"`/`"admin"`/`"super_admin"`)** -- `Role.slug` is
   the correct attribute for this comparison (confirmed against
   `src/dependencies/rbac.py`'s `RoleChecker`, the canonical role-gate
   helper used elsewhere in this codebase, which already compares
   `.slug`). Since `tests/conftest.py`'s `admin_role`/`teacher_role`/
   `student_role` fixtures (matching how roles are actually seeded) use
   capitalized `name`s with lowercase `slug`s, this comparison could never
   succeed for any non-superuser -- every single role-gated endpoint in
   this router (create/update/delete content, add/update/delete reviews,
   purchases, moderation actions, plagiarism checks) 403'd unconditionally
   for every real student/teacher/admin caller, superusers only exempted.
   Fixed by comparing `.slug` instead of `.name` in all 4 sites (also
   null-guarding `current_user.role` in the 3 inline checks, since a
   superuser can have no role row at all).
2. **`ContentMarketplaceService.purchase_content`'s creator earning
   transaction passed `'metadata': {...}` into `CreditTransaction(**data)`**
   -- the model's mapped attribute for that JSON column is `metadata_json`
   (SQLAlchemy reserves the plain `metadata` name on every Declarative
   model for the schema/table registry). Passing `metadata=` didn't raise
   (the class already has a `metadata` attribute, so the constructor's
   `hasattr` check passes), it silently shadowed that class attribute on
   the new instance instead of writing to the real column -- so every
   content sale's creator-side transaction record silently lost its
   `buyer_id` metadata. Fixed by renaming the key to `metadata_json`.
3. **`CreditTransactionResponse.metadata` had the matching read-side bug**
   -- with no alias, `from_attributes` read `getattr(transaction,
   'metadata')`, which (per the shadowing above) resolves to the
   *class-level* `sqlalchemy.MetaData` registry object whenever an
   instance hadn't had that name separately overwritten, not the actual
   JSON data -- so response validation raised a `ValidationError` (not a
   dict) on every single call to `GET /credits/transactions` with at least
   one transaction, a full 500. Fixed with `validation_alias`/
   `serialization_alias='metadata_json'`/`'metadata'`, the same pattern
   already used in `src/schemas/merchandise.py` and
   `src/schemas/document_vault.py` for this exact SQLAlchemy naming clash.
4. **`POST /plagiarism/{content_id}/check` never caught
   `ContentPlagiarismService.check_content_plagiarism`'s
   `ValueError("Content not found")`** for an unknown `content_id`,
   producing an unhandled 500 instead of a clean 404 (every sibling
   endpoint in this router that looks up content by id returns 404).
   Fixed with a try/except, and also added the missing institution check
   (see next item), which makes this doubly unreachable in practice but
   keeps the endpoint well-behaved if the service is ever called with an
   id this router didn't already validate.
5. **Cross-tenant gap (bug class 12) across all 5 moderation/plagiarism
   endpoints that take a bare `content_id`** -- `approve_content`,
   `reject_content`, `request_content_revision`, `get_moderation_history`,
   `check_content_plagiarism`, and (separately) `get_plagiarism_report`
   never checked that the target content actually belonged to the
   reviewing teacher/admin's own institution. Any teacher/admin from
   institution A could moderate (approve/reject/request revision on) or
   read plagiarism/moderation history for institution B's content just by
   knowing/guessing its id -- a real cross-tenant data-integrity and
   confidentiality gap, not just a missing-coverage gap. Fixed with a
   shared `_get_scoped_content` helper (404, matching how an unknown id
   already responds, rather than 403, to avoid confirming cross-tenant ids
   exist) applied to all 6 sites.
"""
import uuid

import pytest

from src.models.content_marketplace import (
    StudentContent,
    ContentReview,
    ContentPurchase,
    StudentCreditsBalance,
    ContentType,
    ContentStatus,
    ModerationStatus,
    PlagiarismStatus,
)
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.user import User
from src.utils.security import get_password_hash


# ---------------------------------------------------------------------------
# Local fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def student_headers(client, student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def teacher_headers(client, teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def second_student_user(db_session, institution, student_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"student2_{suffix}",
        email=f"student2_{suffix}@testschool.com",
        first_name="Second",
        last_name="Student",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=student_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_student(db_session, institution, second_student_user, section) -> Student:
    from datetime import datetime
    s = Student(
        institution_id=institution.id,
        user_id=second_student_user.id,
        admission_number="ADM002",
        first_name=second_student_user.first_name,
        last_name=second_student_user.last_name,
        email=second_student_user.email,
        section_id=section.id,
        date_of_birth=datetime(2008, 4, 1).date(),
        admission_date=datetime(2020, 4, 1).date(),
        gender="Male",
        is_active=True,
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def second_student_headers(client, second_student_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": second_student_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


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
def other_teacher_user(db_session, other_institution, teacher_role) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=f"otherteacher{suffix}",
        email=f"otherteacher{suffix}@otherschool.com",
        first_name="Other",
        last_name="Teacher",
        hashed_password=get_password_hash("password123"),
        institution_id=other_institution.id,
        role_id=teacher_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_teacher(db_session, other_institution, other_teacher_user) -> Teacher:
    from datetime import datetime
    t = Teacher(
        institution_id=other_institution.id,
        user_id=other_teacher_user.id,
        employee_id="OEMP001",
        first_name=other_teacher_user.first_name,
        last_name=other_teacher_user.last_name,
        email=other_teacher_user.email,
        phone="+1987654321",
        date_of_birth=datetime(1980, 1, 1).date(),
        joining_date=datetime(2019, 1, 1).date(),
        is_active=True,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def other_teacher_headers(client, other_teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _content_payload(**overrides):
    payload = {
        "content_type": "study_guide",
        "subject": "Mathematics",
        "topic": "Algebra Basics",
        "grade_level": "Grade 8",
        "title": "My Algebra Study Guide",
        "description": "A comprehensive guide to basic algebra concepts and problems.",
        "preview_content": "Preview of algebra basics",
        "price_credits": 10,
        "tags": ["algebra", "math"],
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def content(db_session, institution, student) -> StudentContent:
    c = StudentContent(
        institution_id=institution.id,
        creator_student_id=student.id,
        content_type=ContentType.STUDY_GUIDE,
        subject="Mathematics",
        topic="Algebra Basics",
        grade_level="Grade 8",
        title="Existing Content",
        description="An existing piece of content used across several tests.",
        price_credits=10,
        status=ContentStatus.APPROVED,
        moderation_status=ModerationStatus.APPROVED,
        plagiarism_status=PlagiarismStatus.PASSED,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def pending_content(db_session, institution, student) -> StudentContent:
    c = StudentContent(
        institution_id=institution.id,
        creator_student_id=student.id,
        content_type=ContentType.SUMMARY_NOTES,
        subject="Science",
        topic="Photosynthesis",
        grade_level="Grade 7",
        title="Pending Review Content",
        description="Content submitted for review, awaiting moderation action.",
        price_credits=0,
        status=ContentStatus.PENDING_REVIEW,
        moderation_status=ModerationStatus.PENDING,
        plagiarism_status=PlagiarismStatus.NOT_CHECKED,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TestAuth:
    def test_create_content_requires_auth(self, client):
        response = client.post(
            "/api/v1/content-marketplace/contents",
            json=_content_payload(),
        )
        assert response.status_code in (401, 403)

    def test_list_credits_balance_requires_auth(self, client):
        response = client.get("/api/v1/content-marketplace/credits/balance")
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Content CRUD
# ---------------------------------------------------------------------------
class TestContentCrud:
    def test_student_can_create_content(self, client, student_headers, student):
        response = client.post(
            "/api/v1/content-marketplace/contents",
            json=_content_payload(),
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["title"] == "My Algebra Study Guide"
        assert data["creator_student_id"] == student.id
        assert data["status"] == "draft"
        assert data["moderation_status"] == "pending"

    def test_teacher_cannot_create_content(self, client, teacher_headers, teacher):
        response = client.post(
            "/api/v1/content-marketplace/contents",
            json=_content_payload(),
            headers=teacher_headers,
        )
        assert response.status_code == 403

    def test_get_content_detail(self, client, student_headers, content):
        response = client.get(
            f"/api/v1/content-marketplace/contents/{content.id}",
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["id"] == content.id
        assert data["can_download"] is True  # price_credits == 0? no, but creator

    def test_get_content_detail_not_found(self, client, student_headers):
        response = client.get(
            "/api/v1/content-marketplace/contents/999999",
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_get_content_detail_cross_institution_denied(
        self, client, other_teacher_headers, content
    ):
        response = client.get(
            f"/api/v1/content-marketplace/contents/{content.id}",
            headers=other_teacher_headers,
        )
        assert response.status_code == 403

    def test_creator_can_update_own_content(self, client, student_headers, content):
        response = client.put(
            f"/api/v1/content-marketplace/contents/{content.id}",
            json={"title": "Updated Title"},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["title"] == "Updated Title"

    def test_non_creator_cannot_update_content(
        self, client, second_student_headers, second_student, content
    ):
        response = client.put(
            f"/api/v1/content-marketplace/contents/{content.id}",
            json={"title": "Hacked Title"},
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_submit_content_for_review(self, client, student_headers, content, db_session):
        # reset to draft first so the transition is meaningful
        content.status = ContentStatus.DRAFT
        db_session.commit()

        response = client.post(
            f"/api/v1/content-marketplace/contents/{content.id}/submit-review",
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "pending_review"

    def test_creator_can_delete_own_content(self, client, student_headers, content):
        response = client.delete(
            f"/api/v1/content-marketplace/contents/{content.id}",
            headers=student_headers,
        )
        assert response.status_code == 200

    def test_admin_can_delete_any_content(self, client, auth_headers, content):
        response = client.delete(
            f"/api/v1/content-marketplace/contents/{content.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200

    def test_search_contents(self, client, student_headers, content):
        response = client.post(
            "/api/v1/content-marketplace/contents/search?skip=0&limit=20",
            json={"subject": "Mathematics"},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        titles = [c["title"] for c in response.json()]
        assert "Existing Content" in titles

    def test_my_contents(self, client, student_headers, content):
        response = client.get(
            "/api/v1/content-marketplace/my-contents",
            headers=student_headers,
        )
        assert response.status_code == 200
        assert any(c["id"] == content.id for c in response.json())


# ---------------------------------------------------------------------------
# Purchases + credits
# ---------------------------------------------------------------------------
class TestPurchasesAndCredits:
    def _fund_balance(self, db_session, institution, student, amount=100):
        balance = StudentCreditsBalance(
            institution_id=institution.id,
            student_id=student.id,
            total_credits=amount,
        )
        db_session.add(balance)
        db_session.commit()
        db_session.refresh(balance)
        return balance

    def test_purchase_content(
        self, client, db_session, institution, second_student, second_student_headers, content
    ):
        self._fund_balance(db_session, institution, second_student, amount=100)

        response = client.post(
            "/api/v1/content-marketplace/purchases",
            json={"content_id": content.id},
            headers=second_student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["content_id"] == content.id
        assert data["credits_paid"] == 10

    def test_cannot_purchase_own_content(self, client, db_session, institution, student, student_headers, content):
        self._fund_balance(db_session, institution, student, amount=100)
        response = client.post(
            "/api/v1/content-marketplace/purchases",
            json={"content_id": content.id},
            headers=student_headers,
        )
        assert response.status_code == 400

    def test_purchase_insufficient_credits(
        self, client, db_session, institution, second_student, second_student_headers, content
    ):
        self._fund_balance(db_session, institution, second_student, amount=1)
        response = client.post(
            "/api/v1/content-marketplace/purchases",
            json={"content_id": content.id},
            headers=second_student_headers,
        )
        assert response.status_code == 400
        assert "Insufficient" in response.json()["detail"]

    def test_double_purchase_rejected(
        self, client, db_session, institution, second_student, second_student_headers, content
    ):
        self._fund_balance(db_session, institution, second_student, amount=100)
        first = client.post(
            "/api/v1/content-marketplace/purchases",
            json={"content_id": content.id},
            headers=second_student_headers,
        )
        assert first.status_code == 200
        second = client.post(
            "/api/v1/content-marketplace/purchases",
            json={"content_id": content.id},
            headers=second_student_headers,
        )
        assert second.status_code == 400

    def test_my_purchases(
        self, client, db_session, institution, second_student, second_student_headers, content
    ):
        self._fund_balance(db_session, institution, second_student, amount=100)
        client.post(
            "/api/v1/content-marketplace/purchases",
            json={"content_id": content.id},
            headers=second_student_headers,
        )
        response = client.get(
            "/api/v1/content-marketplace/my-purchases",
            headers=second_student_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_credits_balance_creates_on_first_access(self, client, student_headers, student):
        response = client.get(
            "/api/v1/content-marketplace/credits/balance",
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["total_credits"] == 0

    def test_credit_transactions_after_sale(
        self,
        client,
        db_session,
        institution,
        student,
        student_headers,
        second_student,
        second_student_headers,
        content,
    ):
        """Regression test for the metadata/metadata_json shadowing bug:
        a creator earning transaction (with buyer_id metadata) must be
        both persisted correctly and returned without a response
        validation crash.
        """
        self._fund_balance(db_session, institution, second_student, amount=100)
        purchase_resp = client.post(
            "/api/v1/content-marketplace/purchases",
            json={"content_id": content.id},
            headers=second_student_headers,
        )
        assert purchase_resp.status_code == 200, purchase_resp.text

        # Creator (student, the seller) should now have an earning transaction.
        response = client.get(
            "/api/v1/content-marketplace/credits/transactions",
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        transactions = response.json()
        assert len(transactions) == 1
        txn = transactions[0]
        assert txn["transaction_type"] == "earn_sale"
        assert txn["amount"] == 8  # 80% revenue share of 10 credits
        assert txn["metadata"] == {"buyer_id": second_student.id}

        # Buyer should have a spend transaction too.
        buyer_response = client.get(
            "/api/v1/content-marketplace/credits/transactions",
            headers=second_student_headers,
        )
        assert buyer_response.status_code == 200
        buyer_txns = buyer_response.json()
        assert len(buyer_txns) == 1
        assert buyer_txns[0]["transaction_type"] == "spend_purchase"
        assert buyer_txns[0]["amount"] == -10


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class TestReviews:
    def test_add_review(self, client, second_student_headers, second_student, content):
        response = client.post(
            "/api/v1/content-marketplace/reviews",
            json={"content_id": content.id, "rating": 5, "review_text": "Great content!"},
            headers=second_student_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["rating"] == 5

    def test_duplicate_review_rejected(self, client, second_student_headers, second_student, content):
        client.post(
            "/api/v1/content-marketplace/reviews",
            json={"content_id": content.id, "rating": 5},
            headers=second_student_headers,
        )
        response = client.post(
            "/api/v1/content-marketplace/reviews",
            json={"content_id": content.id, "rating": 3},
            headers=second_student_headers,
        )
        assert response.status_code == 400

    def test_list_content_reviews(self, client, second_student_headers, second_student, content):
        client.post(
            "/api/v1/content-marketplace/reviews",
            json={"content_id": content.id, "rating": 4},
            headers=second_student_headers,
        )
        response = client.get(
            f"/api/v1/content-marketplace/contents/{content.id}/reviews",
            headers=second_student_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_update_review_updates_content_rating(
        self, client, db_session, second_student_headers, second_student, content
    ):
        create_resp = client.post(
            "/api/v1/content-marketplace/reviews",
            json={"content_id": content.id, "rating": 2},
            headers=second_student_headers,
        )
        review_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/content-marketplace/reviews/{review_id}",
            json={"rating": 5},
            headers=second_student_headers,
        )
        assert response.status_code == 200
        assert response.json()["rating"] == 5

        db_session.refresh(content)
        assert content.rating == 5.0

    def test_delete_review(self, client, second_student_headers, second_student, content):
        create_resp = client.post(
            "/api/v1/content-marketplace/reviews",
            json={"content_id": content.id, "rating": 3},
            headers=second_student_headers,
        )
        review_id = create_resp.json()["id"]

        response = client.delete(
            f"/api/v1/content-marketplace/reviews/{review_id}",
            headers=second_student_headers,
        )
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# Moderation
# ---------------------------------------------------------------------------
class TestModeration:
    def test_student_cannot_access_moderation_queue(self, client, student_headers):
        response = client.post(
            "/api/v1/content-marketplace/moderation/queue?skip=0&limit=20",
            json={},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_teacher_sees_pending_content_in_queue(self, client, teacher_headers, pending_content):
        response = client.post(
            "/api/v1/content-marketplace/moderation/queue?skip=0&limit=20",
            json={},
            headers=teacher_headers,
        )
        assert response.status_code == 200, response.text
        ids = [c["id"] for c in response.json()]
        assert pending_content.id in ids

    def test_teacher_can_approve_content(self, client, teacher_headers, teacher, pending_content):
        response = client.post(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/approve",
            json={"content_id": pending_content.id, "moderation_status": "approved", "quality_score": 8, "accuracy_score": 9},
            headers=teacher_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["moderation_status"] == "approved"

    def test_teacher_can_reject_content_with_reason(self, client, teacher_headers, teacher, pending_content):
        response = client.post(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/reject",
            json={"content_id": pending_content.id, "moderation_status": "rejected", "rejection_reason": "Not accurate"},
            headers=teacher_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["moderation_status"] == "rejected"

    def test_reject_without_reason_fails(self, client, teacher_headers, teacher, pending_content):
        response = client.post(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/reject",
            json={"content_id": pending_content.id, "moderation_status": "rejected"},
            headers=teacher_headers,
        )
        assert response.status_code == 400

    def test_request_revision_without_notes_fails(self, client, teacher_headers, teacher, pending_content):
        response = client.post(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/request-revision",
            json={"content_id": pending_content.id, "moderation_status": "needs_revision"},
            headers=teacher_headers,
        )
        assert response.status_code == 400

    def test_moderation_history(self, client, teacher_headers, teacher, pending_content):
        client.post(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/approve",
            json={"content_id": pending_content.id, "moderation_status": "approved"},
            headers=teacher_headers,
        )
        response = client.get(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/history",
            headers=teacher_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_cross_institution_teacher_cannot_approve(
        self, client, other_teacher_headers, other_teacher, pending_content
    ):
        response = client.post(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/approve",
            json={"content_id": pending_content.id, "moderation_status": "approved"},
            headers=other_teacher_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_teacher_cannot_read_history(
        self, client, other_teacher_headers, other_teacher, pending_content
    ):
        response = client.get(
            f"/api/v1/content-marketplace/moderation/{pending_content.id}/history",
            headers=other_teacher_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Plagiarism
# ---------------------------------------------------------------------------
class TestPlagiarism:
    def test_teacher_can_run_plagiarism_check(self, client, teacher_headers, teacher, pending_content):
        response = client.post(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/check",
            headers=teacher_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["content_id"] == pending_content.id
        assert data["plagiarism_status"] in ("passed", "under_review", "failed")

    def test_plagiarism_check_unknown_content_returns_404(self, client, teacher_headers, teacher):
        response = client.post(
            "/api/v1/content-marketplace/plagiarism/999999/check",
            headers=teacher_headers,
        )
        assert response.status_code == 404

    def test_cross_institution_teacher_cannot_check_plagiarism(
        self, client, other_teacher_headers, other_teacher, pending_content
    ):
        response = client.post(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/check",
            headers=other_teacher_headers,
        )
        assert response.status_code == 404

    def test_creator_can_view_plagiarism_report(self, client, teacher_headers, student_headers, pending_content):
        client.post(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/check",
            headers=teacher_headers,
        )
        response = client.get(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/report",
            headers=student_headers,
        )
        assert response.status_code == 200, response.text

    def test_non_owner_student_cannot_view_plagiarism_report(
        self, client, teacher_headers, second_student_headers, pending_content
    ):
        client.post(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/check",
            headers=teacher_headers,
        )
        response = client.get(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/report",
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_cross_institution_staff_cannot_view_plagiarism_report(
        self, client, teacher_headers, other_teacher_headers, other_teacher, pending_content
    ):
        client.post(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/check",
            headers=teacher_headers,
        )
        response = client.get(
            f"/api/v1/content-marketplace/plagiarism/{pending_content.id}/report",
            headers=other_teacher_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Creator analytics + download
# ---------------------------------------------------------------------------
class TestAnalyticsAndDownload:
    def test_creator_analytics(self, client, student_headers, content):
        response = client.get(
            "/api/v1/content-marketplace/analytics/creator",
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_contents"] == 1
        assert data["published_contents"] == 1

    def test_download_free_content(self, client, db_session, second_student_headers, second_student, content):
        content.price_credits = 0
        db_session.commit()
        response = client.get(
            f"/api/v1/content-marketplace/contents/{content.id}/download",
            headers=second_student_headers,
        )
        assert response.status_code == 200

    def test_download_requires_purchase(self, client, second_student_headers, second_student, content):
        response = client.get(
            f"/api/v1/content-marketplace/contents/{content.id}/download",
            headers=second_student_headers,
        )
        assert response.status_code == 403
