"""Integration tests for the `flashcards` router (src/api/v1/flashcards.py).

Flashcard decks + cards, deck sharing, per-user spaced-repetition study
progress/sessions (SM-2 algorithm), and due-card retrieval.

Bugs found and fixed while writing this coverage:

1. **Zero authentication on all 20 endpoints (bug class 2) -- the single
   most severe bug class this session, the fourth router found with this
   issue after `analytics.py`/`institution_admin.py`/`quizzes.py`.** No
   endpoint in this router had `Depends(get_current_user)` at all: any
   unauthenticated caller could create/edit/delete any deck or card
   belonging to any institution, share/unshare any deck, and read or
   fabricate any user's personal study progress and spaced-repetition
   session data. Fixed by adding `Depends(get_current_user)` to every
   endpoint, plus:
   - A `_check_institution_access` helper (403 unless the caller's
     institution matches the deck's, or superuser) on every read of a
     specific deck/card.
   - A `_check_deck_owner_or_staff` helper (creator, institution staff, or
     superuser) on every deck/card mutation (create card, update/delete
     deck or card, share/unshare) and on `create_deck`/`create_deck_with_cards`
     themselves (also rejecting a `creator_id` that doesn't match the
     caller, unless superuser -- mirrors the "cannot create on behalf of
     another user" check already established in this codebase's
     `quizzes.py` fix).
   - `list_decks` now ignores a client-supplied `institution_id` query
     param for non-superusers instead of trusting it (would otherwise let
     any authenticated user enumerate another institution's decks),
     matching `quizzes.py`'s `list_quizzes` fix.
   - A `_check_self_or_staff` helper (the user themself, institution staff,
     or superuser) on the three per-user *read* endpoints
     (`get_study_progress`, `get_deck_stats`, `get_due_cards`), and a
     stricter `_check_self_only` helper (the user themself, or superuser --
     no staff override) on `update_study_session`, since that endpoint
     writes personal study activity on the caller's behalf and staff
     shouldn't be able to fabricate a student's practice history.
2. **`POST /cards` (create_flashcard) never validated `deck_id` before use**
   -- the target deck was looked up only *after* the card had already been
   added to the session (solely to update its `total_cards` counter), so
   an unknown `deck_id` raised an unhandled FK `IntegrityError` (500)
   instead of a clean 404. Fixed by looking the deck up first (404 if
   missing), which also gives the new ownership check above something to
   check against.
"""
import uuid

import pytest

from src.models.flashcard import FlashcardDeck, Flashcard, FlashcardStudySession, SpacedRepetitionLevel
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
def other_teacher_headers(client, other_teacher_user) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": other_teacher_user.email, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def deck(db_session, institution, student_user) -> FlashcardDeck:
    d = FlashcardDeck(
        institution_id=institution.id,
        creator_id=student_user.id,
        title="Biology Basics",
        description="Core biology terms.",
        visibility="private",
    )
    db_session.add(d)
    db_session.commit()
    db_session.refresh(d)
    return d


@pytest.fixture
def card(db_session, deck) -> Flashcard:
    c = Flashcard(
        deck_id=deck.id,
        front_content="What is a cell?",
        back_content="The basic unit of life.",
        order_index=0,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TestAuth:
    def test_list_decks_requires_auth(self, client):
        response = client.get("/api/v1/flashcards/decks")
        assert response.status_code in (401, 403)

    def test_create_deck_requires_auth(self, client, institution, student_user):
        response = client.post(
            "/api/v1/flashcards/decks",
            json={
                "institution_id": institution.id,
                "creator_id": student_user.id,
                "title": "No Auth Deck",
            },
        )
        assert response.status_code in (401, 403)

    def test_study_session_requires_auth(self, client, card, student_user):
        response = client.post(
            f"/api/v1/flashcards/cards/{card.id}/study/{student_user.id}",
            json={"repetition_level": "learning", "is_correct": True},
        )
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Deck CRUD
# ---------------------------------------------------------------------------
class TestDeckCrud:
    def test_create_deck(self, client, student_headers, institution, student_user):
        response = client.post(
            "/api/v1/flashcards/decks",
            json={
                "institution_id": institution.id,
                "creator_id": student_user.id,
                "title": "World Capitals",
                "description": "Country -> capital city.",
            },
            headers=student_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["title"] == "World Capitals"

    def test_create_deck_cross_institution_denied(
        self, client, student_headers, other_institution, student_user
    ):
        response = client.post(
            "/api/v1/flashcards/decks",
            json={
                "institution_id": other_institution.id,
                "creator_id": student_user.id,
                "title": "Cross Tenant Deck",
            },
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_create_deck_on_behalf_of_another_user_denied(
        self, client, student_headers, institution, second_student_user
    ):
        response = client.post(
            "/api/v1/flashcards/decks",
            json={
                "institution_id": institution.id,
                "creator_id": second_student_user.id,
                "title": "Impersonation Deck",
            },
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_create_deck_with_cards_bulk(self, client, student_headers, institution, student_user):
        response = client.post(
            "/api/v1/flashcards/decks/bulk",
            json={
                "deck": {
                    "institution_id": institution.id,
                    "creator_id": student_user.id,
                    "title": "Bulk Deck",
                },
                "flashcards": [
                    {"front_content": "Q1", "back_content": "A1"},
                    {"front_content": "Q2", "back_content": "A2"},
                ],
            },
            headers=student_headers,
        )
        assert response.status_code == 201, response.text
        assert response.json()["total_cards"] == 2

    def test_list_decks_scoped_to_own_institution(
        self, client, teacher_headers, other_teacher_headers, deck
    ):
        response = client.get("/api/v1/flashcards/decks", headers=teacher_headers)
        assert response.status_code == 200
        assert any(d["id"] == deck.id for d in response.json())

        cross_response = client.get("/api/v1/flashcards/decks", headers=other_teacher_headers)
        assert cross_response.status_code == 200
        assert all(d["id"] != deck.id for d in cross_response.json())

    def test_get_deck(self, client, student_headers, deck):
        response = client.get(f"/api/v1/flashcards/decks/{deck.id}", headers=student_headers)
        assert response.status_code == 200
        assert response.json()["id"] == deck.id

    def test_get_deck_not_found(self, client, student_headers):
        response = client.get("/api/v1/flashcards/decks/999999", headers=student_headers)
        assert response.status_code == 404

    def test_get_deck_cross_institution_denied(self, client, other_teacher_headers, deck):
        response = client.get(f"/api/v1/flashcards/decks/{deck.id}", headers=other_teacher_headers)
        assert response.status_code == 403

    def test_creator_can_update_own_deck(self, client, student_headers, deck):
        response = client.put(
            f"/api/v1/flashcards/decks/{deck.id}",
            json={"title": "Updated Title"},
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    def test_non_creator_student_cannot_update_deck(self, client, second_student_headers, deck):
        response = client.put(
            f"/api/v1/flashcards/decks/{deck.id}",
            json={"title": "Hacked Title"},
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_teacher_can_update_institution_deck(self, client, teacher_headers, deck):
        response = client.put(
            f"/api/v1/flashcards/decks/{deck.id}",
            json={"title": "Teacher Edited"},
            headers=teacher_headers,
        )
        assert response.status_code == 200

    def test_creator_can_delete_own_deck(self, client, student_headers, deck):
        response = client.delete(f"/api/v1/flashcards/decks/{deck.id}", headers=student_headers)
        assert response.status_code == 204

    def test_cross_institution_teacher_cannot_delete_deck(self, client, other_teacher_headers, deck):
        response = client.delete(f"/api/v1/flashcards/decks/{deck.id}", headers=other_teacher_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Card CRUD
# ---------------------------------------------------------------------------
class TestCardCrud:
    def test_create_card(self, client, student_headers, deck):
        response = client.post(
            "/api/v1/flashcards/cards",
            json={"deck_id": deck.id, "front_content": "Q", "back_content": "A"},
            headers=student_headers,
        )
        assert response.status_code == 201, response.text

    def test_create_card_unknown_deck_returns_404(self, client, student_headers):
        response = client.post(
            "/api/v1/flashcards/cards",
            json={"deck_id": 999999, "front_content": "Q", "back_content": "A"},
            headers=student_headers,
        )
        assert response.status_code == 404

    def test_create_card_non_owner_denied(self, client, second_student_headers, deck):
        response = client.post(
            "/api/v1/flashcards/cards",
            json={"deck_id": deck.id, "front_content": "Q", "back_content": "A"},
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_create_card_updates_deck_total(self, client, db_session, student_headers, deck):
        client.post(
            "/api/v1/flashcards/cards",
            json={"deck_id": deck.id, "front_content": "Q1", "back_content": "A1"},
            headers=student_headers,
        )
        db_session.refresh(deck)
        assert deck.total_cards == 1

    def test_list_deck_cards(self, client, student_headers, deck, card):
        response = client.get(f"/api/v1/flashcards/decks/{deck.id}/cards", headers=student_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_flashcard(self, client, student_headers, card):
        response = client.get(f"/api/v1/flashcards/cards/{card.id}", headers=student_headers)
        assert response.status_code == 200
        assert response.json()["id"] == card.id

    def test_get_flashcard_not_found(self, client, student_headers):
        response = client.get("/api/v1/flashcards/cards/999999", headers=student_headers)
        assert response.status_code == 404

    def test_update_flashcard_by_creator(self, client, student_headers, card):
        response = client.put(
            f"/api/v1/flashcards/cards/{card.id}",
            json={"front_content": "Updated question"},
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["front_content"] == "Updated question"

    def test_update_flashcard_non_owner_denied(self, client, second_student_headers, card):
        response = client.put(
            f"/api/v1/flashcards/cards/{card.id}",
            json={"front_content": "Hacked"},
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_delete_flashcard_updates_deck_total(self, client, db_session, student_headers, deck, card):
        deck.total_cards = 1
        db_session.commit()

        response = client.delete(f"/api/v1/flashcards/cards/{card.id}", headers=student_headers)
        assert response.status_code == 204

        db_session.refresh(deck)
        assert deck.total_cards == 0


# ---------------------------------------------------------------------------
# Sharing
# ---------------------------------------------------------------------------
class TestSharing:
    def test_owner_can_share_deck(self, client, student_headers, deck, second_student_user):
        response = client.post(
            f"/api/v1/flashcards/decks/{deck.id}/share",
            json={"deck_id": deck.id, "shared_with_user_id": second_student_user.id},
            headers=student_headers,
        )
        assert response.status_code == 201, response.text

    def test_non_owner_cannot_share_deck(self, client, second_student_headers, deck, second_student_user):
        response = client.post(
            f"/api/v1/flashcards/decks/{deck.id}/share",
            json={"deck_id": deck.id, "shared_with_user_id": second_student_user.id},
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_list_deck_shares(self, client, student_headers, deck, second_student_user):
        client.post(
            f"/api/v1/flashcards/decks/{deck.id}/share",
            json={"deck_id": deck.id, "shared_with_user_id": second_student_user.id},
            headers=student_headers,
        )
        response = client.get(f"/api/v1/flashcards/decks/{deck.id}/shares", headers=student_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_owner_can_unshare(self, client, student_headers, deck, second_student_user):
        share_resp = client.post(
            f"/api/v1/flashcards/decks/{deck.id}/share",
            json={"deck_id": deck.id, "shared_with_user_id": second_student_user.id},
            headers=student_headers,
        )
        share_id = share_resp.json()["id"]
        response = client.delete(f"/api/v1/flashcards/decks/shares/{share_id}", headers=student_headers)
        assert response.status_code == 204


# ---------------------------------------------------------------------------
# Study progress / sessions / due cards
# ---------------------------------------------------------------------------
class TestStudy:
    def test_self_can_record_study_session(self, client, student_headers, card, student_user):
        response = client.post(
            f"/api/v1/flashcards/cards/{card.id}/study/{student_user.id}",
            json={"repetition_level": "learning", "is_correct": True},
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["correct_count"] == 1
        assert data["interval_days"] == 1

    def test_cannot_record_study_session_for_another_user(
        self, client, student_headers, card, second_student_user
    ):
        response = client.post(
            f"/api/v1/flashcards/cards/{card.id}/study/{second_student_user.id}",
            json={"repetition_level": "learning", "is_correct": True},
            headers=student_headers,
        )
        assert response.status_code == 403

    def test_incorrect_answer_resets_progress(self, client, student_headers, card, student_user):
        client.post(
            f"/api/v1/flashcards/cards/{card.id}/study/{student_user.id}",
            json={"repetition_level": "learning", "is_correct": True},
            headers=student_headers,
        )
        response = client.post(
            f"/api/v1/flashcards/cards/{card.id}/study/{student_user.id}",
            json={"repetition_level": "learning", "is_correct": False},
            headers=student_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["incorrect_count"] == 1
        assert data["repetitions"] == 0
        assert data["repetition_level"] == "new"

    def test_self_can_view_own_progress(self, client, student_headers, deck, student_user):
        response = client.get(
            f"/api/v1/flashcards/decks/{deck.id}/progress/{student_user.id}",
            headers=student_headers,
        )
        assert response.status_code == 200
        assert response.json()["user_id"] == student_user.id

    def test_other_student_cannot_view_progress(
        self, client, second_student_headers, deck, student_user
    ):
        response = client.get(
            f"/api/v1/flashcards/decks/{deck.id}/progress/{student_user.id}",
            headers=second_student_headers,
        )
        assert response.status_code == 403

    def test_teacher_can_view_institution_student_progress(
        self, client, teacher_headers, deck, student_user
    ):
        response = client.get(
            f"/api/v1/flashcards/decks/{deck.id}/progress/{student_user.id}",
            headers=teacher_headers,
        )
        assert response.status_code == 200

    def test_cross_institution_teacher_cannot_view_progress(
        self, client, other_teacher_headers, deck, student_user
    ):
        response = client.get(
            f"/api/v1/flashcards/decks/{deck.id}/progress/{student_user.id}",
            headers=other_teacher_headers,
        )
        assert response.status_code == 403

    def test_get_deck_stats(self, client, student_headers, deck, card, student_user):
        client.post(
            f"/api/v1/flashcards/cards/{card.id}/study/{student_user.id}",
            json={"repetition_level": "learning", "is_correct": True},
            headers=student_headers,
        )
        response = client.get(
            f"/api/v1/flashcards/decks/{deck.id}/stats/{student_user.id}",
            headers=student_headers,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_cards"] == 1
        assert data["cards_studied"] == 1
        assert data["average_accuracy"] == 100.0

    def test_get_due_cards(self, client, student_headers, deck, card, student_user):
        response = client.get(
            f"/api/v1/flashcards/decks/{deck.id}/due-cards/{student_user.id}",
            headers=student_headers,
        )
        assert response.status_code == 200
        assert any(c["id"] == card.id for c in response.json())

    def test_get_due_cards_other_student_denied(
        self, client, second_student_headers, deck, student_user
    ):
        response = client.get(
            f"/api/v1/flashcards/decks/{deck.id}/due-cards/{student_user.id}",
            headers=second_student_headers,
        )
        assert response.status_code == 403
