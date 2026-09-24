"""Integration tests for the `subject_rpg` router (src/api/v1/subject_rpg.py).

RPG-gamified subject learning: student characters, subject worlds, battle
sessions (question quiz -> score/XP/loot), subject passports, quests, co-op
partner matching, and leaderboards.

Bugs found and fixed while writing this coverage:

1. **Zero authentication on all 19 endpoints (bug class 2) -- the 9th
   zero-auth router found this session.** No endpoint had
   `Depends(get_current_user)` at all, and every endpoint taking an
   `institution_id` query param trusted it unchecked -- any unauthenticated
   caller could read or fabricate any institution's RPG characters, battle
   sessions, quests, and passports. Fixed by adding `Depends(get_current_user)`
   everywhere, plus:
   - A `_check_institution_access` helper (403 unless the caller's
     institution matches, or superuser) on every endpoint that takes an
     `institution_id` query param.
   - The same check on every endpoint that looks up a single object by id
     with no `institution_id` param at all (`get_character`,
     `update_character`, `get_character_stats`, `get_subject_world`,
     `get_battle`, `complete_battle`, `update_quest_progress`, `get_quest`)
     -- these looked an object up by id with *no* institution scoping
     whatsoever, so any authenticated caller could read or mutate any other
     institution's character/battle/quest by id alone.
2. **`start_battle`/`create_quest`/`generate_daily_quests` never validated
   that the `character_id` query param actually belonged to the (now
   institution-checked) `institution_id`** -- a caller could pass their own
   institution id (passing the new check above) alongside another
   institution's `character_id`, silently wiring a foreign character into a
   new battle session or quest that would later award it XP/levels/loot.
   Fixed with a `_get_character_or_404` helper that scopes the character
   lookup to `institution_id` before it's used.
"""
from datetime import datetime, timedelta

import pytest

from src.models.subject_rpg import (
    StudentCharacter, SubjectWorld, BattleSession, QuestLog, QuestType, SubjectPassport
)
from src.models.institution import Institution
from src.models.academic import Chapter


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
def character(db_session, institution, student) -> StudentCharacter:
    char = StudentCharacter(
        institution_id=institution.id,
        student_id=student.id,
        character_name="Hero",
        level=1,
        xp=0,
        health=100,
        mana=50,
        equipment={"weapon": {"name": "Wooden Sword", "power": 5}},
    )
    db_session.add(char)
    db_session.commit()
    db_session.refresh(char)
    return char


@pytest.fixture
def other_institution_student(db_session, other_institution):
    from src.models.student import Student
    student = Student(
        institution_id=other_institution.id,
        first_name="Rival",
        last_name="Student",
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def other_institution_character(db_session, other_institution, other_institution_student) -> StudentCharacter:
    char = StudentCharacter(
        institution_id=other_institution.id,
        student_id=other_institution_student.id,
        character_name="Rival Hero",
        level=1,
        xp=0,
        health=100,
        mana=50,
    )
    db_session.add(char)
    db_session.commit()
    db_session.refresh(char)
    return char


@pytest.fixture
def chapter(db_session, institution, subject, grade) -> Chapter:
    ch = Chapter(
        institution_id=institution.id,
        subject_id=subject.id,
        grade_id=grade.id,
        name="Algebra Basics",
        code="ALG1",
        display_order=1,
        is_active=True,
    )
    db_session.add(ch)
    db_session.commit()
    db_session.refresh(ch)
    return ch


@pytest.fixture
def battle_session(db_session, institution, student, character, chapter) -> BattleSession:
    session = BattleSession(
        institution_id=institution.id,
        student_id=student.id,
        character_id=character.id,
        chapter_id=chapter.id,
        boss_name="Algebra Boss",
        questions=[
            {"question_id": 1, "question_text": "2+2?", "correct_option": "4", "marks": 1.0},
            {"question_id": 2, "question_text": "3+3?", "correct_option": "6", "marks": 1.0},
        ],
        answers={},
        score=0,
        xp_earned=0,
        loot={},
        is_completed=False,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session


@pytest.fixture
def quest(db_session, institution, student, character) -> QuestLog:
    q = QuestLog(
        institution_id=institution.id,
        student_id=student.id,
        character_id=character.id,
        quest_type=QuestType.DAILY,
        description="Complete 3 battles",
        target=3,
        progress=0,
        reward_xp=100,
        reward_gold=50,
        is_completed=False,
    )
    db_session.add(q)
    db_session.commit()
    db_session.refresh(q)
    return q


# ---------------------------------------------------------------------------
# Auth required
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestAuthRequired:
    def test_get_character_requires_auth(self, client, character):
        response = client.get(f"/api/v1/subject-rpg/characters/{character.id}")
        assert response.status_code in (401, 403)

    def test_leaderboard_requires_auth(self, client, institution):
        response = client.get(
            "/api/v1/subject-rpg/leaderboard", params={"institution_id": institution.id}
        )
        assert response.status_code in (401, 403)

    def test_create_character_requires_auth(self, client, institution, student):
        response = client.post(
            "/api/v1/subject-rpg/characters",
            params={"student_id": student.id, "institution_id": institution.id},
        )
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Characters
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestCharacters:
    def test_get_or_create_character(self, client, auth_headers, institution, student):
        response = client.post(
            "/api/v1/subject-rpg/characters",
            headers=auth_headers,
            params={"student_id": student.id, "institution_id": institution.id},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["student_id"] == student.id
        assert data["level"] == 1

    def test_create_character_cross_institution_403(
        self, client, auth_headers, other_institution, student
    ):
        response = client.post(
            "/api/v1/subject-rpg/characters",
            headers=auth_headers,
            params={"student_id": student.id, "institution_id": other_institution.id},
        )
        assert response.status_code == 403

    def test_get_character(self, client, auth_headers, character):
        response = client.get(
            f"/api/v1/subject-rpg/characters/{character.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["character_name"] == "Hero"

    def test_get_character_not_found(self, client, auth_headers):
        response = client.get("/api/v1/subject-rpg/characters/999999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_character_cross_institution_403(
        self, client, auth_headers, other_institution_character
    ):
        response = client.get(
            f"/api/v1/subject-rpg/characters/{other_institution_character.id}",
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_update_character(self, client, auth_headers, character):
        response = client.put(
            f"/api/v1/subject-rpg/characters/{character.id}",
            headers=auth_headers,
            json={"character_name": "Renamed Hero"},
        )
        assert response.status_code == 200
        assert response.json()["character_name"] == "Renamed Hero"

    def test_update_character_cross_institution_403(
        self, client, auth_headers, other_institution_character
    ):
        response = client.put(
            f"/api/v1/subject-rpg/characters/{other_institution_character.id}",
            headers=auth_headers,
            json={"character_name": "Hijacked"},
        )
        assert response.status_code == 403

    def test_get_character_stats(self, client, auth_headers, character):
        response = client.get(
            f"/api/v1/subject-rpg/characters/{character.id}/stats", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["character"]["id"] == character.id
        assert data["total_battles"] == 0

    def test_get_character_stats_cross_institution_403(
        self, client, auth_headers, other_institution_character
    ):
        response = client.get(
            f"/api/v1/subject-rpg/characters/{other_institution_character.id}/stats",
            headers=auth_headers,
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Subject worlds
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestSubjectWorlds:
    def test_create_or_get_world(self, client, auth_headers, institution, subject):
        response = client.post(
            "/api/v1/subject-rpg/worlds",
            headers=auth_headers,
            params={"subject_id": subject.id, "institution_id": institution.id},
        )
        assert response.status_code == 201, response.text
        assert response.json()["subject_id"] == subject.id

    def test_get_world(self, client, auth_headers, institution, subject):
        create_response = client.post(
            "/api/v1/subject-rpg/worlds",
            headers=auth_headers,
            params={"subject_id": subject.id, "institution_id": institution.id},
        )
        world_id = create_response.json()["id"]

        response = client.get(f"/api/v1/subject-rpg/worlds/{world_id}", headers=auth_headers)
        assert response.status_code == 200

    def test_get_world_cross_institution_403(self, db_session, client, auth_headers, other_institution):
        from src.models.academic import Subject as SubjectModel
        import uuid
        other_subject = SubjectModel(
            institution_id=other_institution.id,
            name="Other Subject",
            code=f"OS{uuid.uuid4().hex[:6]}",
            is_active=True,
        )
        db_session.add(other_subject)
        db_session.commit()
        db_session.refresh(other_subject)

        world = SubjectWorld(
            institution_id=other_institution.id,
            subject_id=other_subject.id,
            world_name="Forbidden World",
            chapters_as_regions={},
            is_active=True,
        )
        db_session.add(world)
        db_session.commit()
        db_session.refresh(world)

        response = client.get(f"/api/v1/subject-rpg/worlds/{world.id}", headers=auth_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Battles
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestBattles:
    def test_start_battle(self, client, auth_headers, institution, student, character, chapter):
        response = client.post(
            "/api/v1/subject-rpg/battles/start",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "character_id": character.id,
                "institution_id": institution.id,
            },
            json={"chapter_id": chapter.id},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["character_id"] == character.id
        assert data["is_completed"] is False

    def test_start_battle_rejects_foreign_character(
        self, client, auth_headers, institution, student, other_institution_character, chapter
    ):
        response = client.post(
            "/api/v1/subject-rpg/battles/start",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "character_id": other_institution_character.id,
                "institution_id": institution.id,
            },
            json={"chapter_id": chapter.id},
        )
        assert response.status_code == 404

    def test_get_battle(self, client, auth_headers, battle_session):
        response = client.get(
            f"/api/v1/subject-rpg/battles/{battle_session.id}", headers=auth_headers
        )
        assert response.status_code == 200

    def test_get_battle_cross_institution_403(
        self, db_session, client, auth_headers, other_institution,
        other_institution_character, other_institution_student
    ):
        session = BattleSession(
            institution_id=other_institution.id,
            student_id=other_institution_student.id,
            character_id=other_institution_character.id,
            boss_name="Foreign Boss",
            questions=[],
            answers={},
            score=0,
            xp_earned=0,
            loot={},
            is_completed=False,
        )
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)

        response = client.get(f"/api/v1/subject-rpg/battles/{session.id}", headers=auth_headers)
        assert response.status_code == 403

    def test_complete_battle(self, client, auth_headers, battle_session):
        response = client.post(
            f"/api/v1/subject-rpg/battles/{battle_session.id}/complete",
            headers=auth_headers,
            json={"answers": {"1": "4", "2": "6"}},
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["battle_session"]["is_completed"] is True
        assert data["results"]["score"] == 100.0
        assert data["results"]["xp_earned"] > 0

    def test_complete_battle_cross_institution_403(
        self, db_session, client, auth_headers, other_institution,
        other_institution_character, other_institution_student
    ):
        session = BattleSession(
            institution_id=other_institution.id,
            student_id=other_institution_student.id,
            character_id=other_institution_character.id,
            boss_name="Foreign Boss",
            questions=[],
            answers={},
            score=0,
            xp_earned=0,
            loot={},
            is_completed=False,
        )
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)

        response = client.post(
            f"/api/v1/subject-rpg/battles/{session.id}/complete",
            headers=auth_headers,
            json={"answers": {}},
        )
        assert response.status_code == 403

    def test_get_student_battles(self, client, auth_headers, institution, student, battle_session):
        response = client.get(
            f"/api/v1/subject-rpg/battles/student/{student.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(b["id"] == battle_session.id for b in data)

    def test_get_student_battles_cross_institution_403(
        self, client, auth_headers, other_institution, student
    ):
        response = client.get(
            f"/api/v1/subject-rpg/battles/student/{student.id}",
            headers=auth_headers,
            params={"institution_id": other_institution.id},
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Passports
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestPassports:
    def test_get_passport_creates_if_missing(self, client, auth_headers, institution, student, subject):
        response = client.get(
            "/api/v1/subject-rpg/passports",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "subject_id": subject.id,
                "institution_id": institution.id,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["student_id"] == student.id
        assert data["stamps"] == []

    def test_get_passport_cross_institution_403(
        self, client, auth_headers, other_institution, student, subject
    ):
        response = client.get(
            "/api/v1/subject-rpg/passports",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "subject_id": subject.id,
                "institution_id": other_institution.id,
            },
        )
        assert response.status_code == 403

    def test_get_student_passports(self, client, auth_headers, institution, student, subject):
        client.get(
            "/api/v1/subject-rpg/passports",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "subject_id": subject.id,
                "institution_id": institution.id,
            },
        )
        response = client.get(
            f"/api/v1/subject-rpg/passports/student/{student.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) >= 1


# ---------------------------------------------------------------------------
# Quests
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestQuests:
    def test_create_quest(self, client, auth_headers, institution, student, character):
        response = client.post(
            "/api/v1/subject-rpg/quests",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "character_id": character.id,
                "institution_id": institution.id,
            },
            json={
                "quest_type": "daily",
                "description": "Answer 5 questions",
                "target": 5,
                "reward_xp": 50,
                "reward_gold": 25,
            },
        )
        assert response.status_code == 201, response.text
        assert response.json()["description"] == "Answer 5 questions"

    def test_create_quest_rejects_foreign_character(
        self, client, auth_headers, institution, student, other_institution_character
    ):
        response = client.post(
            "/api/v1/subject-rpg/quests",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "character_id": other_institution_character.id,
                "institution_id": institution.id,
            },
            json={
                "quest_type": "daily",
                "description": "Answer 5 questions",
                "target": 5,
                "reward_xp": 50,
            },
        )
        assert response.status_code == 404

    def test_get_active_quests(self, client, auth_headers, institution, student, quest):
        response = client.get(
            "/api/v1/subject-rpg/quests/active",
            headers=auth_headers,
            params={"student_id": student.id, "institution_id": institution.id},
        )
        assert response.status_code == 200
        assert any(q["id"] == quest.id for q in response.json())

    def test_generate_daily_quests(self, client, auth_headers, institution, student, character):
        response = client.post(
            "/api/v1/subject-rpg/quests/daily",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "character_id": character.id,
                "institution_id": institution.id,
            },
        )
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_update_quest_progress(self, client, auth_headers, quest):
        response = client.put(
            f"/api/v1/subject-rpg/quests/{quest.id}/progress",
            headers=auth_headers,
            json={"progress_increment": 1},
        )
        assert response.status_code == 200
        assert response.json()["progress"] == 1

    def test_update_quest_progress_completes_quest(self, client, auth_headers, quest):
        response = client.put(
            f"/api/v1/subject-rpg/quests/{quest.id}/progress",
            headers=auth_headers,
            json={"progress_increment": 3},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["progress"] == 3
        assert data["is_completed"] is True

    def test_update_quest_progress_cross_institution_403(
        self, db_session, client, auth_headers, other_institution,
        other_institution_character, other_institution_student
    ):
        q = QuestLog(
            institution_id=other_institution.id,
            student_id=other_institution_student.id,
            character_id=other_institution_character.id,
            quest_type=QuestType.DAILY,
            description="Foreign quest",
            target=3,
            progress=0,
            reward_xp=10,
            is_completed=False,
        )
        db_session.add(q)
        db_session.commit()
        db_session.refresh(q)

        response = client.put(
            f"/api/v1/subject-rpg/quests/{q.id}/progress",
            headers=auth_headers,
            json={"progress_increment": 1},
        )
        assert response.status_code == 403

    def test_get_quest(self, client, auth_headers, quest):
        response = client.get(f"/api/v1/subject-rpg/quests/{quest.id}", headers=auth_headers)
        assert response.status_code == 200

    def test_get_quest_cross_institution_403(
        self, db_session, client, auth_headers, other_institution,
        other_institution_character, other_institution_student
    ):
        q = QuestLog(
            institution_id=other_institution.id,
            student_id=other_institution_student.id,
            character_id=other_institution_character.id,
            quest_type=QuestType.DAILY,
            description="Foreign quest",
            target=3,
            progress=0,
            reward_xp=10,
            is_completed=False,
        )
        db_session.add(q)
        db_session.commit()
        db_session.refresh(q)

        response = client.get(f"/api/v1/subject-rpg/quests/{q.id}", headers=auth_headers)
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Co-op / leaderboard
# ---------------------------------------------------------------------------
@pytest.mark.integration
class TestCoopAndLeaderboard:
    def test_find_coop_partners_empty_without_character(
        self, client, auth_headers, institution, student, chapter
    ):
        response = client.get(
            "/api/v1/subject-rpg/coop/partners",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "chapter_id": chapter.id,
                "institution_id": institution.id,
            },
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_find_coop_partners_cross_institution_403(
        self, client, auth_headers, other_institution, student, chapter
    ):
        response = client.get(
            "/api/v1/subject-rpg/coop/partners",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "chapter_id": chapter.id,
                "institution_id": other_institution.id,
            },
        )
        assert response.status_code == 403

    def test_leaderboard(self, client, auth_headers, institution, character):
        response = client.get(
            "/api/v1/subject-rpg/leaderboard",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert any(entry["character_name"] == "Hero" for entry in data)

    def test_leaderboard_excludes_other_institution(
        self, client, auth_headers, institution, other_institution_character
    ):
        response = client.get(
            "/api/v1/subject-rpg/leaderboard",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert all(
            entry["character_name"] != "Rival Hero" for entry in response.json()
        )

    def test_leaderboard_cross_institution_403(self, client, auth_headers, other_institution):
        response = client.get(
            "/api/v1/subject-rpg/leaderboard",
            headers=auth_headers,
            params={"institution_id": other_institution.id},
        )
        assert response.status_code == 403
