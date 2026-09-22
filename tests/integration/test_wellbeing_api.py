import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.institution import Institution
from src.models.student import Student
from src.models.user import User


@pytest.mark.integration
class TestWellbeingAPI:
    """Integration tests for /api/v1/wellbeing/*, the real, mounted router
    (src/api/v1/wellbeing.py) backed by src/models/wellbeing.py and
    src/services/wellbeing_service.py. This router was JUST FIXED for the
    doubled-URL bug class in commit 58616fe (APIRouter(prefix="/wellbeing")
    -> APIRouter(tags=[...]), since it's double-mounted with a matching
    prefix in src/api/v1/__init__.py) -- tests here target the now-correct
    /api/v1/wellbeing/* paths. The router itself declares no auth
    dependency on any endpoint (institution_id/current_user_id are passed
    as plain query params, not derived from a JWT), so auth_headers is
    used for consistency with the rest of the suite but isn't required by
    the endpoints themselves.

    Sentiment analysis falls back to a deterministic keyword-based
    classifier whenever the content contains 1+ distress/crisis keywords
    (see WellbeingService._calculate_sentiment) -- only sentiment-neutral
    content reaches for the lazy-loaded HuggingFace
    distilbert-base-uncased-finetuned-sst-2-english pipeline, which
    requires a real network call to download model weights that this test
    environment can't make. Every sentiment test here uses keyword-bearing
    content specifically to stay on the deterministic path, so the ML
    download is never exercised (same "skip only the genuinely
    network-bound bit" approach as Razorpay/Printful in
    test_merchandise_api.py, just achieved by choosing inputs that avoid
    triggering it rather than a dedicated skip).
    """

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------
    def _grant_consent(self, client: TestClient, auth_headers: dict, institution_id: int, student_id: int) -> dict:
        response = client.post(
            "/api/v1/wellbeing/consents",
            headers=auth_headers,
            json={
                "institution_id": institution_id,
                "student_id": student_id,
                "consent_type": "monitoring",
                "data_access_level": "full",
                "granted_by_parent": True,
                "granted_by_student": True,
            },
        )
        assert response.status_code == 200, response.text
        return response.json()

    # ------------------------------------------------------------------
    # alerts: consent gating, create, get, list/filter
    # ------------------------------------------------------------------
    def test_alert_requires_consent_then_create_and_get(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student, admin_user: User
    ):
        # No consent on file yet -> creation is forbidden.
        payload = {
            "institution_id": institution.id,
            "student_id": student.id,
            "alert_type": "sentiment_distress",
            "severity": "high",
            "title": "Concerning language detected",
            "description": "Student communications show signs of distress.",
            "risk_score": 0.8,
            "detected_indicators": {"source": "chat"},
            "recommended_actions": ["Schedule check-in"],
            "metadata": {"origin": "unit-test"},
        }
        response = client.post("/api/v1/wellbeing/alerts", headers=auth_headers, json=payload)
        assert response.status_code == 403

        self._grant_consent(client, auth_headers, institution.id, student.id)

        response = client.post("/api/v1/wellbeing/alerts", headers=auth_headers, json=payload)
        assert response.status_code == 200, response.text
        data = response.json()
        # Regression check for the metadata/metadata_json reserved-name
        # shadowing bug: WellbeingAlert.metadata_json is mapped to the DB
        # column 'metadata', but the class also has a `metadata` class
        # attribute (SQLAlchemy's MetaData registry). Before the schema
        # fix (validation_alias='metadata_json'/serialization_alias=
        # 'metadata'), model_validate(alert) raised "Input should be a
        # valid dictionary" for every single alert response, and before
        # the router fix, `WellbeingAlert(**alert_data.model_dump())`
        # silently threw the caller's metadata away by shadowing the class
        # attribute on the instance instead of writing the real column.
        assert data["metadata"] == {"origin": "unit-test"}
        assert data["status"] == "pending"
        assert data["auto_detected"] is True
        alert_id = data["id"]

        response = client.get(
            f"/api/v1/wellbeing/alerts/{alert_id}",
            headers=auth_headers,
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
        )
        assert response.status_code == 200
        assert response.json()["metadata"] == {"origin": "unit-test"}

        response = client.get(
            f"/api/v1/wellbeing/alerts/999999",
            headers=auth_headers,
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
        )
        assert response.status_code == 404

    def test_alert_listing_filters(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        self._grant_consent(client, auth_headers, institution.id, student.id)

        def make_alert(severity, status_filter=None):
            payload = {
                "institution_id": institution.id,
                "student_id": student.id,
                "alert_type": "attendance_drop",
                "severity": severity,
                "title": f"{severity} alert",
                "description": "d",
                "risk_score": 0.5,
                "detected_indicators": {},
                "recommended_actions": [],
            }
            return client.post("/api/v1/wellbeing/alerts", headers=auth_headers, json=payload).json()

        low = make_alert("low")
        high = make_alert("high")

        response = client.get(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id, "severity": "high"},
        )
        assert response.status_code == 200
        ids = [a["id"] for a in response.json()]
        assert high["id"] in ids
        assert low["id"] not in ids

        response = client.get(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            params={"institution_id": institution.id, "status_filter": "pending"},
        )
        assert response.status_code == 200
        assert len(response.json()) >= 2

    def test_alert_status_workflow_and_notes(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student, admin_user: User
    ):
        self._grant_consent(client, auth_headers, institution.id, student.id)
        alert = client.post(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "alert_type": "grade_decline",
                "severity": "medium",
                "title": "Grades dropping",
                "description": "d",
                "risk_score": 0.4,
                "detected_indicators": {},
                "recommended_actions": [],
            },
        ).json()
        alert_id = alert["id"]

        response = client.patch(
            f"/api/v1/wellbeing/alerts/{alert_id}",
            headers=auth_headers,
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
            json={"status": "acknowledged"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "acknowledged"
        assert data["acknowledged_by"] == admin_user.id
        assert data["acknowledged_at"] is not None

        response = client.patch(
            f"/api/v1/wellbeing/alerts/{alert_id}",
            headers=auth_headers,
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
            json={"status": "resolved", "resolution_notes": "Handled via counseling."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "resolved"
        assert data["resolved_by"] == admin_user.id
        assert data["resolved_at"] is not None
        assert data["resolution_notes"] == "Handled via counseling."

        # Notes
        response = client.post(
            f"/api/v1/wellbeing/alerts/{alert_id}/notes",
            headers=auth_headers,
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
            json={"alert_id": alert_id, "content": "Spoke with student's homeroom teacher.", "is_confidential": True},
        )
        assert response.status_code == 200
        assert response.json()["created_by"] == admin_user.id

        response = client.get(
            f"/api/v1/wellbeing/alerts/{alert_id}/notes",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        # Once resolved, the student's wellbeing profile should reflect it.
        response = client.get(
            f"/api/v1/wellbeing/students/{student.id}/profile",
            headers=auth_headers,
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
        )
        assert response.status_code == 200
        profile = response.json()
        assert profile["total_alerts"] == 1
        assert profile["resolved_alerts"] == 1
        assert profile["active_alerts"] == 0

    # ------------------------------------------------------------------
    # sentiment + behavioral analysis
    # ------------------------------------------------------------------
    def test_sentiment_analysis_distress_and_crisis(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        request_body = {
            "content": "not really relevant yet",
            "source_type": "chat_message",
            "source_id": 1,
            "student_id": student.id,
        }
        response = client.post(
            "/api/v1/wellbeing/sentiment-analysis",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json=request_body,
        )
        assert response.status_code == 403

        self._grant_consent(client, auth_headers, institution.id, student.id)

        # 3+ distress keywords -> deterministic "distressed" category,
        # flagged for review, and an auto-generated alert.
        distress_body = {
            "content": "I feel so anxious and overwhelmed and hopeless about everything lately.",
            "source_type": "chat_message",
            "source_id": 1,
            "student_id": student.id,
        }
        response = client.post(
            "/api/v1/wellbeing/sentiment-analysis",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json=distress_body,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["sentiment_category"] == "distressed"
        assert data["flagged_for_review"] is True

        response = client.get(
            f"/api/v1/wellbeing/students/{student.id}/sentiments",
            headers=auth_headers,
            params={"institution_id": institution.id, "flagged_only": True},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        alerts = client.get(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id},
        ).json()
        assert any(a["alert_type"] == "sentiment_distress" for a in alerts)

        # Crisis keyword -> "crisis" category with a critical-severity alert.
        crisis_body = {
            "content": "Sometimes I think everyone would be better off dead and I want to say goodbye.",
            "source_type": "chat_message",
            "source_id": 2,
            "student_id": student.id,
        }
        response = client.post(
            "/api/v1/wellbeing/sentiment-analysis",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json=crisis_body,
        )
        assert response.status_code == 200
        assert response.json()["sentiment_category"] == "crisis"

        alerts = client.get(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id, "severity": "critical"},
        ).json()
        assert len(alerts) == 1

    def test_behavioral_analysis_requires_consent(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/wellbeing/behavioral-analysis",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"student_id": student.id, "analysis_period_days": 30},
        )
        assert response.status_code == 403

        self._grant_consent(client, auth_headers, institution.id, student.id)

        response = client.post(
            "/api/v1/wellbeing/behavioral-analysis",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"student_id": student.id, "analysis_period_days": 30},
        )
        # No attendance/submission/message history fixture data exists for
        # this student, so every pattern analyzer bails out with None --
        # this just exercises the consent gate + empty-result path.
        assert response.status_code == 200
        assert response.json() == []

    # ------------------------------------------------------------------
    # counselors + dashboard
    # ------------------------------------------------------------------
    def test_counselor_profile_and_dashboard(
        self, client: TestClient, auth_headers: dict, institution: Institution, admin_user: User, student: Student
    ):
        response = client.post(
            "/api/v1/wellbeing/counselors",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "user_id": admin_user.id,
                "license_number": "LIC-001",
                "specializations": ["anxiety", "crisis"],
                "can_handle_crisis": True,
            },
        )
        assert response.status_code == 200
        counselor = response.json()
        assert counselor["current_case_load"] == 0

        # Duplicate profile for the same user+institution is rejected.
        dup = client.post(
            "/api/v1/wellbeing/counselors",
            headers=auth_headers,
            json={"institution_id": institution.id, "user_id": admin_user.id},
        )
        assert dup.status_code == 400

        response = client.patch(
            f"/api/v1/wellbeing/counselors/{counselor['id']}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"bio": "Licensed school counselor.", "max_case_load": 30},
        )
        assert response.status_code == 200
        assert response.json()["bio"] == "Licensed school counselor."

        response = client.get(
            "/api/v1/wellbeing/counselors",
            headers=auth_headers,
            params={"institution_id": institution.id, "can_handle_crisis": True},
        )
        assert response.status_code == 200
        assert any(c["id"] == counselor["id"] for c in response.json())

        # Dashboard aggregate: create one active alert for this institution
        # and check the stats reflect it.
        self._grant_consent(client, auth_headers, institution.id, student.id)
        client.post(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "alert_type": "behavioral_change",
                "severity": "critical",
                "title": "Needs attention",
                "description": "d",
                "risk_score": 0.9,
                "detected_indicators": {},
                "recommended_actions": [],
            },
        )

        response = client.get(
            "/api/v1/wellbeing/dashboard/counselor",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        dashboard = response.json()
        assert dashboard["stats"]["active_alerts_count"] == 1
        assert dashboard["stats"]["critical_alerts_count"] == 1
        assert len(dashboard["active_alerts"]) == 1

    # ------------------------------------------------------------------
    # interventions
    # ------------------------------------------------------------------
    def test_intervention_create_update_and_filter(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student, admin_user: User
    ):
        self._grant_consent(client, auth_headers, institution.id, student.id)
        alert = client.post(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "alert_type": "grade_decline",
                "severity": "medium",
                "title": "t",
                "description": "d",
                "risk_score": 0.4,
                "detected_indicators": {},
                "recommended_actions": [],
            },
        ).json()

        response = client.post(
            "/api/v1/wellbeing/interventions",
            headers=auth_headers,
            json={
                "alert_id": alert["id"],
                "institution_id": institution.id,
                "student_id": student.id,
                "counselor_id": admin_user.id,
                "intervention_type": "counseling_session",
                "description": "Initial check-in session.",
                "action_taken": "Met with student for 30 minutes.",
                "follow_up_required": True,
            },
        )
        assert response.status_code == 200
        intervention = response.json()
        assert intervention["completed_at"] is None

        response = client.get(
            "/api/v1/wellbeing/interventions",
            headers=auth_headers,
            params={"institution_id": institution.id, "completed": False},
        )
        assert response.status_code == 200
        assert any(i["id"] == intervention["id"] for i in response.json())

        response = client.patch(
            f"/api/v1/wellbeing/interventions/{intervention['id']}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"outcome": "Student reported feeling better.", "completed_at": "2026-01-15T10:00:00"},
        )
        assert response.status_code == 200
        assert response.json()["completed_at"] is not None

        response = client.get(
            "/api/v1/wellbeing/interventions",
            headers=auth_headers,
            params={"institution_id": institution.id, "completed": True},
        )
        assert response.status_code == 200
        assert any(i["id"] == intervention["id"] for i in response.json())

    # ------------------------------------------------------------------
    # consents
    # ------------------------------------------------------------------
    def test_consent_lifecycle(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student, admin_user: User
    ):
        response = client.post(
            "/api/v1/wellbeing/consents",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "consent_type": "monitoring",
                "data_access_level": "basic",
                "granted_by_parent": False,
                "granted_by_student": False,
            },
        )
        assert response.status_code == 200
        pending = response.json()
        assert pending["status"] == "pending"
        assert pending["granted_at"] is None

        response = client.patch(
            f"/api/v1/wellbeing/consents/{pending['id']}",
            headers=auth_headers,
            params={"institution_id": institution.id, "current_user_id": admin_user.id},
            json={"status": "revoked"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "revoked"
        assert data["revoked_by"] == admin_user.id
        assert data["revoked_at"] is not None

        response = client.get(
            f"/api/v1/wellbeing/consents/student/{student.id}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    # ------------------------------------------------------------------
    # mood entries + weekly surveys
    # ------------------------------------------------------------------
    def test_mood_entries_create_and_list(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/wellbeing/mood-entries",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "mood_rating": 4,
                "mood_emoji": "🙂",
                "journal_entry": "Had a decent day.",
                "date": "2026-09-20",
            },
        )
        assert response.status_code == 200
        assert response.json()["mood_rating"] == 4

        response = client.get(
            "/api/v1/wellbeing/mood-entries",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id, "days": 30},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_weekly_survey_create_list_and_latest(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        response = client.post(
            "/api/v1/wellbeing/surveys",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "survey_type": "PHQ9",
                "responses": {"q1": 2, "q2": 1},
                "total_score": 3,
                "severity_level": "mild",
                "week_start_date": "2026-09-14",
            },
        )
        assert response.status_code == 200

        response = client.get(
            "/api/v1/wellbeing/surveys",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id, "survey_type": "PHQ9"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.get(
            "/api/v1/wellbeing/surveys/latest",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id, "survey_type": "PHQ9"},
        )
        assert response.status_code == 200
        assert response.json()["total_score"] == 3

        response = client.get(
            "/api/v1/wellbeing/surveys/latest",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id, "survey_type": "GAD7"},
        )
        assert response.status_code == 404

    # ------------------------------------------------------------------
    # anonymous reports
    # ------------------------------------------------------------------
    def test_anonymous_report_create_list_and_update(
        self, client: TestClient, auth_headers: dict, institution: Institution, admin_user: User
    ):
        response = client.post(
            "/api/v1/wellbeing/anonymous-reports",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "institution_id": institution.id,
                "report_type": "bullying",
                "description": "Witnessed repeated bullying near the lockers.",
                "severity": "high",
            },
        )
        assert response.status_code == 200
        report = response.json()
        assert report["status"] == "pending"

        response = client.get(
            "/api/v1/wellbeing/anonymous-reports",
            headers=auth_headers,
            params={"institution_id": institution.id, "status_filter": "pending"},
        )
        assert response.status_code == 200
        assert any(r["id"] == report["id"] for r in response.json())

        response = client.patch(
            f"/api/v1/wellbeing/anonymous-reports/{report['id']}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"status": "resolved", "assigned_to": admin_user.id, "resolution_notes": "Addressed with staff."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "resolved"
        assert data["resolved_at"] is not None

    # ------------------------------------------------------------------
    # mental health resources + referrals
    # ------------------------------------------------------------------
    def test_mental_health_resource_crud(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        response = client.post(
            "/api/v1/wellbeing/resources",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "institution_id": institution.id,
                "name": "Campus Counseling Center",
                "type": "counseling",
                "description": "On-site counseling services.",
                "contact_info": {"phone": "555-0100"},
                "is_emergency": False,
            },
        )
        assert response.status_code == 200
        resource = response.json()

        response = client.get(
            "/api/v1/wellbeing/resources",
            headers=auth_headers,
            params={"institution_id": institution.id, "type_filter": "counseling"},
        )
        assert response.status_code == 200
        assert any(r["id"] == resource["id"] for r in response.json())

        response = client.patch(
            f"/api/v1/wellbeing/resources/{resource['id']}",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={"availability": "Mon-Fri 9am-5pm"},
        )
        assert response.status_code == 200
        assert response.json()["availability"] == "Mon-Fri 9am-5pm"

        response = client.delete(
            f"/api/v1/wellbeing/resources/{resource['id']}",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200

        response = client.get(
            "/api/v1/wellbeing/resources",
            headers=auth_headers,
            params={"institution_id": institution.id},
        )
        assert response.status_code == 200
        assert all(r["id"] != resource["id"] for r in response.json())

    def test_referral_create_update_and_list(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student, admin_user: User
    ):
        resource = client.post(
            "/api/v1/wellbeing/resources",
            headers=auth_headers,
            params={"institution_id": institution.id},
            json={
                "institution_id": institution.id,
                "name": "External Therapist Network",
                "type": "therapy",
                "description": "Vetted external therapists.",
                "contact_info": {"phone": "555-0200"},
            },
        ).json()

        response = client.post(
            "/api/v1/wellbeing/referrals",
            headers=auth_headers,
            json={
                "student_id": student.id,
                "institution_id": institution.id,
                "resource_id": resource["id"],
                "counselor_id": admin_user.id,
                "referral_reason": "Needs ongoing support beyond school resources.",
                "priority": "high",
            },
        )
        assert response.status_code == 200
        referral = response.json()
        assert referral["status"] == "pending"

        response = client.patch(
            f"/api/v1/wellbeing/referrals/{referral['id']}",
            headers=auth_headers,
            json={"status": "scheduled", "appointment_date": "2026-10-01T09:00:00"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "scheduled"

        response = client.get(
            "/api/v1/wellbeing/referrals",
            headers=auth_headers,
            params={"institution_id": institution.id, "student_id": student.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    # ------------------------------------------------------------------
    # parent notifications
    # ------------------------------------------------------------------
    def test_parent_notification_send_list_and_acknowledge(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        self._grant_consent(client, auth_headers, institution.id, student.id)
        alert = client.post(
            "/api/v1/wellbeing/alerts",
            headers=auth_headers,
            json={
                "institution_id": institution.id,
                "student_id": student.id,
                "alert_type": "sentiment_distress",
                "severity": "high",
                "title": "t",
                "description": "d",
                "risk_score": 0.7,
                "detected_indicators": {},
                "recommended_actions": [],
            },
        ).json()

        response = client.post(
            "/api/v1/wellbeing/parent-notifications",
            headers=auth_headers,
            json={
                "alert_id": alert["id"],
                "student_id": student.id,
                "notification_type": "email",
                "severity_level": "high",
                "subject": "Wellbeing check-in needed",
                "message": "Please reach out to the school counselor.",
            },
        )
        assert response.status_code == 200
        notification = response.json()
        assert notification["acknowledged"] is False

        response = client.get(
            "/api/v1/wellbeing/parent-notifications",
            headers=auth_headers,
            params={"student_id": student.id},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.patch(
            f"/api/v1/wellbeing/parent-notifications/{notification['id']}/acknowledge",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["acknowledged"] is True
        assert data["acknowledged_at"] is not None

    # ------------------------------------------------------------------
    # stress levels + burnout risk
    # ------------------------------------------------------------------
    def test_stress_level_calculate_list_and_burnout_risk(
        self, client: TestClient, auth_headers: dict, institution: Institution, student: Student
    ):
        # High-stress inputs: long continuous study, little sleep, an exam
        # tomorrow, low activity, few breaks -> should land in a high
        # stress_category.
        response = client.post(
            "/api/v1/wellbeing/stress-levels",
            headers=auth_headers,
            params={
                "student_id": student.id,
                "institution_id": institution.id,
                "study_hours_continuous": 7,
                "sleep_hours": 3,
                "exam_proximity": 1,
                "activity_level": 1,
                "break_frequency": 0,
                "date_str": "2026-09-20",
            },
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["stress_category"] in ("high", "critical")
        assert data["factors"]["sleep_hours"] == 3

        response = client.get(
            f"/api/v1/wellbeing/stress-levels/student/{student.id}",
            headers=auth_headers,
            params={"days": 30},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

        response = client.get(
            f"/api/v1/wellbeing/burnout-risk/student/{student.id}",
            headers=auth_headers,
            params={"institution_id": institution.id, "days": 14},
        )
        assert response.status_code == 200
        risk = response.json()
        assert risk["student_id"] == student.id
        assert risk["risk_level"] in ("low", "moderate", "high", "critical")
        assert risk["recent_stress_count"] == 1
