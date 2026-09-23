import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher


@pytest.mark.integration
class TestFinanceEducationAPI:
    """Integration tests for /api/v1/finance-education/*, the real,
    mounted router (src/api/v1/finance_education.py) backed by
    src/models/finance_education.py and src/schemas/finance_education.py.

    None of this router's endpoints depend on get_current_user, so
    auth_headers is passed for consistency with the rest of the suite but
    isn't required by the router itself. There are no genuine external
    network/AI-model calls in this router -- "investment simulation" uses
    a fixed internal price ($100.00), not a real market data or AI call --
    so nothing needed to be skipped for external dependencies.
    """

    def test_create_list_get_update_module(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/finance-education/modules",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "module_name": "budgeting",
                "title": "Intro to Budgeting",
                "description": "Learn the basics of budgeting",
                "order_index": 1,
                "lessons": [{"title": "Lesson 1", "content": "..."}],
                "difficulty_level": "beginner",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Intro to Budgeting"
        assert data["module_name"] == "budgeting"
        module_id = data["id"]

        response = client.get(
            "/api/v1/finance-education/modules",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert any(m["id"] == module_id for m in response.json())

        response = client.get(
            "/api/v1/finance-education/modules",
            headers=auth_headers,
            params={"institution_id": institution.id, "module_name": "saving"},
        )
        assert response.status_code == 200
        assert all(m["module_name"] == "saving" for m in response.json())
        assert not any(m["id"] == module_id for m in response.json())

        response = client.get(
            f"/api/v1/finance-education/modules/{module_id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Intro to Budgeting"

        response = client.put(
            f"/api/v1/finance-education/modules/{module_id}",
            headers=auth_headers,
            json={"title": "Budgeting 101", "difficulty_level": "intermediate"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Budgeting 101"
        assert data["difficulty_level"] == "intermediate"

        response = client.get(
            "/api/v1/finance-education/modules/999999", headers=auth_headers
        )
        assert response.status_code == 404

    def test_start_module_and_track_progress(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        module = client.post(
            "/api/v1/finance-education/modules",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "module_name": "saving",
                "title": "Saving Strategies",
                "lessons": [{"title": "Lesson 1"}],
            },
        ).json()

        response = client.post(
            f"/api/v1/finance-education/modules/{module['id']}/start",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_completed"] is False
        assert data["module_id"] == module["id"]
        completion_id = data["id"]

        # Starting again for the same user/module returns the existing row,
        # not a duplicate.
        response = client.post(
            f"/api/v1/finance-education/modules/{module['id']}/start",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
        )
        assert response.status_code == 201
        assert response.json()["id"] == completion_id

        response = client.put(
            f"/api/v1/finance-education/modules/completions/{completion_id}",
            headers=auth_headers,
            json={
                "progress_percentage": "100.00",
                "lessons_completed": ["Lesson 1"],
                "is_completed": True,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_completed"] is True
        assert data["completed_at"] is not None

        response = client.get(
            f"/api/v1/finance-education/users/{student.user_id}/module-progress",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["is_completed"] is True

    def test_create_wallet_duplicate_rejected_and_update(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/finance-education/wallets",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
            json={"account_name": "My Wallet", "starting_balance": "500.00"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["current_balance"] == "500.00"
        assert data["starting_balance"] == "500.00"
        wallet_id = data["id"]

        # A second wallet for the same user/institution is rejected.
        dup = client.post(
            "/api/v1/finance-education/wallets",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
            json={"account_name": "Second Wallet"},
        )
        assert dup.status_code == 400

        response = client.get(
            f"/api/v1/finance-education/wallets/{wallet_id}", headers=auth_headers
        )
        assert response.status_code == 200

        response = client.get(
            f"/api/v1/finance-education/users/{student.user_id}/wallet",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert response.json()["id"] == wallet_id

        response = client.put(
            f"/api/v1/finance-education/wallets/{wallet_id}",
            headers=auth_headers,
            json={"monthly_income": "2000.00", "monthly_expenses": "1500.00"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["monthly_income"] == "2000.00"
        assert data["monthly_expenses"] == "1500.00"

    def test_wallet_transactions_deposit_and_insufficient_balance(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        wallet = client.post(
            "/api/v1/finance-education/wallets",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
            json={"starting_balance": "100.00"},
        ).json()

        # A deposit with metadata -- this exercises the response schema's
        # metadata/metadata_json reserved-name mapping end to end.
        response = client.post(
            "/api/v1/finance-education/transactions",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "wallet_id": wallet["id"],
                "transaction_type": "deposit",
                "amount": "50.00",
                "description": "Allowance",
                "category": "income",
                "metadata": {"source": "parent"},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["balance_after"] == "150.00"
        assert data["metadata"] == {"source": "parent"}

        # Withdrawal exceeding the balance is rejected with a clean 400.
        response = client.post(
            "/api/v1/finance-education/transactions",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "wallet_id": wallet["id"],
                "transaction_type": "withdrawal",
                "amount": "999.00",
            },
        )
        assert response.status_code == 400

        response = client.post(
            "/api/v1/finance-education/transactions",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "wallet_id": wallet["id"],
                "transaction_type": "expense",
                "amount": "20.00",
                "category": "food",
            },
        )
        assert response.status_code == 201
        assert response.json()["balance_after"] == "130.00"

        response = client.get(
            f"/api/v1/finance-education/wallets/{wallet['id']}/transactions",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # created_at has only second precision in MySQL (no fsp declared on
        # the column), so both transactions created within the same test
        # can tie on created_at -- assert membership rather than depending
        # on desc-ordering to break the tie a particular way.
        assert {t["transaction_type"] for t in data} == {"deposit", "expense"}

        response = client.get(
            f"/api/v1/finance-education/wallets/{wallet['id']}/transactions",
            headers=auth_headers,
            params={"category": "food"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_investment_simulation_and_portfolio_performance(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        wallet = client.post(
            "/api/v1/finance-education/wallets",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
            json={"starting_balance": "1000.00"},
        ).json()

        response = client.post(
            "/api/v1/finance-education/investments/simulate",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "investment_type": "stocks",
                "symbol": "ACME",
                "quantity": "2",
                "wallet_id": wallet["id"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # simulated price is a fixed $100.00 -> 2 * 100 = 200 invested
        assert data["new_balance"] == "800.00"
        assert data["holding"]["symbol"] == "ACME"
        holding_id = data["holding"]["id"]
        assert data["transaction"]["transaction_type"] == "investment"
        # metadata round-trips through the reserved-name mapping here too.
        assert data["transaction"]["metadata"]["symbol"] == "ACME"

        # Insufficient balance is reported, not raised as an error.
        response = client.post(
            "/api/v1/finance-education/investments/simulate",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "investment_type": "stocks",
                "symbol": "HUGE",
                "quantity": "1000",
                "wallet_id": wallet["id"],
            },
        )
        assert response.status_code == 200
        assert response.json()["success"] is False

        response = client.get(
            f"/api/v1/finance-education/wallets/{wallet['id']}/investments",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.get(
            f"/api/v1/finance-education/wallets/{wallet['id']}/portfolio-performance",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_value"] == "200.00"
        assert data["best_performer"]["symbol"] == "ACME"

        response = client.put(
            f"/api/v1/finance-education/investments/{holding_id}/update-price",
            headers=auth_headers,
            json={"new_price": "150.00"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["current_price"] == "150.00"
        assert data["total_value"] == "300.00"
        assert data["gain_loss"] == "100.00"

    def test_challenge_lifecycle_participation_and_leaderboard(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/finance-education/challenges",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "title": "Save $100 Challenge",
                "description": "Save $100 in a month",
                "challenge_type": "save_$100",
                "completion_criteria": {"target_amount": 100},
                "rewards": {"points": 50},
                "points_reward": 50,
                "max_participants": 5,
            },
        )
        assert response.status_code == 201
        challenge = response.json()
        challenge_id = challenge["id"]

        response = client.get(
            "/api/v1/finance-education/challenges",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert any(c["id"] == challenge_id for c in response.json())

        response = client.get(
            f"/api/v1/finance-education/challenges/{challenge_id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Save $100 Challenge"

        response = client.put(
            f"/api/v1/finance-education/challenges/{challenge_id}",
            headers=auth_headers,
            json={"points_reward": 75},
        )
        assert response.status_code == 200
        assert response.json()["points_reward"] == 75

        # A wallet is needed since completing a participation increments
        # wallet.total_challenges_completed.
        client.post(
            "/api/v1/finance-education/wallets",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
            json={},
        )

        response = client.post(
            f"/api/v1/finance-education/challenges/{challenge_id}/participate",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
        )
        assert response.status_code == 201
        participation = response.json()
        assert participation["status"] == "in_progress"
        participation_id = participation["id"]

        # Re-participating returns the existing row.
        response = client.post(
            f"/api/v1/finance-education/challenges/{challenge_id}/participate",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
        )
        assert response.status_code == 201
        assert response.json()["id"] == participation_id

        response = client.put(
            f"/api/v1/finance-education/participations/{participation_id}",
            headers=auth_headers,
            json={
                "status": "completed",
                "progress_percentage": "100.00",
                "metadata": {"note": "finished early"},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["points_earned"] == 75
        assert data["completed_at"] is not None
        # Regression check for the metadata/metadata_json reserved-name
        # shadowing bug: without mapping 'metadata' -> metadata_json in the
        # generic update loop, this would silently no-op instead of
        # persisting and round-tripping through the response schema.
        assert data["metadata"] == {"note": "finished early"}

        response = client.get(
            f"/api/v1/finance-education/users/{student.user_id}/challenge-participations",
            headers=auth_headers,
            params={"institution_id": institution.id, "status": "completed"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.get(
            f"/api/v1/finance-education/challenges/{challenge_id}/leaderboard",
            headers=auth_headers,
            params={"user_id": student.user_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_participants"] == 1
        assert data["current_user_rank"] == 1
        assert data["entries"][0]["score"] == 75

    def test_challenge_capacity_limit_enforced(
        self, client: TestClient, auth_headers: dict, institution: Institution, teacher: Teacher
    ):
        challenge = client.post(
            "/api/v1/finance-education/challenges",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "title": "Tiny Challenge",
                "description": "Only room for one",
                "challenge_type": "create_budget",
                "completion_criteria": {},
                "rewards": {},
                "max_participants": 1,
            },
        ).json()

        first = client.post(
            f"/api/v1/finance-education/challenges/{challenge['id']}/participate",
            headers=auth_headers,
            params={"user_id": teacher.user_id, "institution_id": institution.id},
        )
        assert first.status_code == 201

        # A different user hits the max_participants cap.
        second = client.post(
            f"/api/v1/finance-education/challenges/{challenge['id']}/participate",
            headers=auth_headers,
            params={"user_id": teacher.user_id + 999999, "institution_id": institution.id},
        )
        assert second.status_code == 400

    def test_assessment_creation_and_listing(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/finance-education/assessments",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
            json={
                "assessment_type": "comprehensive",
                "total_score": 80,
                "max_score": 100,
                "percentage_score": "80.00",
                "category_scores": {"budgeting": 85, "investing": 75},
                "strengths": ["Budgeting"],
                "weaknesses": ["Investing"],
                "recommendations": ["Take the investing module"],
                "questions_data": {"q1": "a"},
                "time_taken_minutes": 15,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["total_score"] == 80
        assert data["percentage_score"] == "80.00"

        response = client.get(
            f"/api/v1/finance-education/users/{student.user_id}/assessments",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_financial_health_and_progress_reports(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        # No wallet yet -> financial-health 404s.
        response = client.get(
            f"/api/v1/finance-education/users/{student.user_id}/financial-health",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 404

        client.post(
            "/api/v1/finance-education/wallets",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
            json={
                "starting_balance": "2000.00",
                "monthly_income": "3000.00",
                "monthly_expenses": "2000.00",
            },
        )

        response = client.get(
            f"/api/v1/finance-education/users/{student.user_id}/financial-health",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["balance"] == "2000.00"
        assert "Healthy cash reserves" in data["strengths"]

        module = client.post(
            "/api/v1/finance-education/modules",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "module_name": "credit_scores",
                "title": "Credit Scores 101",
                "lessons": [{"title": "Lesson 1"}],
            },
        ).json()
        client.post(
            f"/api/v1/finance-education/modules/{module['id']}/start",
            headers=auth_headers,
            params={"user_id": student.user_id, "institution_id": institution.id},
        )

        response = client.get(
            f"/api/v1/finance-education/users/{student.user_id}/financial-progress",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_modules"] >= 1
        assert data["modules_completed"] == 0
        assert data["wallet_balance"] == "2000.00"
