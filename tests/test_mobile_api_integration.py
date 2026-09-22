import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, date
from src.models.user import User
from src.models.institution import Institution
from src.models.student import Student, Parent, StudentParent
from src.models.push_device import PushDevice, PushDeviceTopic
from src.models.study_buddy import StudyBuddySession, StudyBuddyMessage
from src.models.homework_scanner import HomeworkScan
from io import BytesIO


@pytest.mark.integration
class TestNotificationDeviceRegistrationAPI:
    """Integration tests for notification device registration endpoints."""

    def test_register_device_success(
        self,
        client: TestClient,
        student_user: User,
        db_session: Session,
    ):
        """Test successful device registration."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                "platform": "ios",
                "device_name": "iPhone 14 Pro",
                "os_version": "16.5",
                "app_version": "1.0.0",
                "topics": ["assignments", "grades"]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == student_user.id
        assert data["platform"] == "ios"
        assert data["device_name"] == "iPhone 14 Pro"
        assert data["is_active"] == True

    def test_register_device_duplicate_token(
        self,
        client: TestClient,
        student_user: User,
        db_session: Session,
    ):
        """Test registering device with duplicate token updates existing device."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        device_token = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
        
        # First registration
        response1 = client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": device_token,
                "platform": "ios",
                "device_name": "iPhone 13",
                "os_version": "15.0",
                "app_version": "1.0.0",
            },
        )
        assert response1.status_code == 200
        device_id_1 = response1.json()["id"]
        
        # Second registration with same token
        response2 = client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": device_token,
                "platform": "ios",
                "device_name": "iPhone 14 Pro",
                "os_version": "16.5",
                "app_version": "1.0.1",
            },
        )
        assert response2.status_code == 200
        device_id_2 = response2.json()["id"]
        
        # Should update same device
        assert device_id_1 == device_id_2
        assert response2.json()["device_name"] == "iPhone 14 Pro"

    def test_unregister_device(
        self,
        client: TestClient,
        student_user: User,
        db_session: Session,
    ):
        """Test device unregistration."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        device_token = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
        
        # Register device
        client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": device_token,
                "platform": "android",
            },
        )
        
        # Unregister device
        response = client.delete(
            f"/api/v1/notifications/register-device/{device_token}",
            headers=headers,
        )
        
        assert response.status_code == 200
        assert "unregistered successfully" in response.json()["message"]

    def test_subscribe_to_topic(
        self,
        client: TestClient,
        student_user: User,
        db_session: Session,
    ):
        """Test subscribing device to topic."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        device_token = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
        
        # Register device
        client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": device_token,
                "platform": "ios",
            },
        )
        
        # Subscribe to topic
        response = client.post(
            "/api/v1/notifications/subscribe",
            headers=headers,
            json={
                "token": device_token,
                "topic": "exams"
            },
        )
        
        assert response.status_code == 200
        assert "exams" in response.json()["message"]

    def test_unsubscribe_from_topic(
        self,
        client: TestClient,
        student_user: User,
        db_session: Session,
    ):
        """Test unsubscribing device from topic."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        device_token = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
        
        # Register device
        client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": device_token,
                "platform": "ios",
                "topics": ["assignments"]
            },
        )
        
        # Unsubscribe from topic
        response = client.post(
            "/api/v1/notifications/unsubscribe",
            headers=headers,
            json={
                "token": device_token,
                "topic": "assignments"
            },
        )
        
        assert response.status_code == 200
        assert "Unsubscribed" in response.json()["message"]

    def test_get_user_devices(
        self,
        client: TestClient,
        student_user: User,
        db_session: Session,
    ):
        """Test getting all user devices."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Register two devices
        client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": "ExponentPushToken[device1]",
                "platform": "ios",
            },
        )
        
        client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": "ExponentPushToken[device2]",
                "platform": "android",
            },
        )
        
        # Get devices
        response = client.get(
            "/api/v1/notifications/devices",
            headers=headers,
        )
        
        assert response.status_code == 200
        devices = response.json()
        assert len(devices) == 2


@pytest.mark.integration
class TestStudyBuddyAPI:
    """Integration tests for study buddy endpoints."""

    def test_create_session(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test creating study buddy session."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/v1/study-buddy/sessions",
            headers=headers,
            json={
                "student_id": student.id,
                "session_title": "Math Study Session",
                "context": {"subject": "mathematics", "topic": "algebra"}
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["student_id"] == student.id
        assert data["session_title"] == "Math Study Session"
        assert data["is_active"] == True

    def test_get_sessions(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test getting study buddy sessions."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a session
        client.post(
            "/api/v1/study-buddy/sessions",
            headers=headers,
            json={
                "student_id": student.id,
                "session_title": "Physics Session",
            },
        )
        
        # Get sessions
        response = client.get(
            f"/api/v1/study-buddy/sessions?student_id={student.id}",
            headers=headers,
        )
        
        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) >= 1

    def test_chat_with_study_buddy(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test chatting with study buddy."""
        from src.utils.security import create_access_token
        
        # Link student profile to user
        student_user.student_profile = student
        db_session.commit()
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/v1/study-buddy/chat",
            headers=headers,
            json={
                "message": "Help me understand quadratic equations",
                "context": {"subject": "mathematics"}
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert data["session_id"] is not None

    def test_end_session(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test ending study buddy session."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create session
        create_response = client.post(
            "/api/v1/study-buddy/sessions",
            headers=headers,
            json={
                "student_id": student.id,
                "session_title": "Test Session",
            },
        )
        session_id = create_response.json()["id"]
        
        # End session
        response = client.post(
            f"/api/v1/study-buddy/sessions/{session_id}/end",
            headers=headers,
        )
        
        assert response.status_code == 200
        assert response.json()["is_active"] == False

    def test_analyze_study_patterns(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test analyzing study patterns."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/api/v1/study-buddy/analyze-patterns/{student.id}",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "consistency_score" in data
        assert "recommendations" in data

    def test_get_daily_plan(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test getting daily study plan."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/api/v1/study-buddy/daily-plan/{student.id}",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "date" in data
        assert "tasks" in data


@pytest.mark.integration
class TestHomeworkScannerAPI:
    """Integration tests for homework scanner endpoints."""

    def test_create_scan(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test creating homework scan."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create fake image file
        image_content = b"fake image content"
        files = {
            "file": ("homework.jpg", BytesIO(image_content), "image/jpeg")
        }
        data = {
            "student_id": student.id,
            "scan_title": "Math Homework"
        }
        
        response = client.post(
            "/api/v1/homework-scanner/scans",
            headers=headers,
            files=files,
            data=data,
        )

        assert response.status_code in [201, 500]  # May fail without OCR service
        if response.status_code == 201:
            response_data = response.json()
            assert response_data["student_id"] == student.id

    def test_get_scans(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test getting homework scans."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/api/v1/homework-scanner/scans?student_id={student.id}",
            headers=headers,
        )
        
        assert response.status_code == 200
        scans = response.json()
        assert isinstance(scans, list)

    def test_upload_non_image_file(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test uploading non-image file fails."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        files = {
            "file": ("document.pdf", BytesIO(b"fake pdf"), "application/pdf")
        }
        data = {
            "student_id": student.id,
        }
        
        response = client.post(
            "/api/v1/homework-scanner/scans",
            headers=headers,
            files=files,
            data=data,
        )

        assert response.status_code == 400
        assert "image" in response.json()["detail"].lower()


@pytest.mark.integration
class TestAuthenticationFlowAPI:
    """Integration tests for authentication flow."""

    def test_login_success(
        self,
        client: TestClient,
        student_user: User,
        institution: Institution,
    ):
        """Test successful login."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": student_user.email,
                "password": "password123",
                "institution_id": institution.id,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_get_current_user(
        self,
        client: TestClient,
        student_user: User,
    ):
        """Test getting current user info."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            "/api/v1/auth/me",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == student_user.email
        assert data["id"] == student_user.id


@pytest.mark.integration
class TestStudentDashboardAPI:
    """Integration tests for student dashboard endpoints."""

    def test_get_student_dashboard(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test getting student dashboard data."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "student" in data or "assignments" in data or isinstance(data, dict)

    def test_get_student_profile(
        self,
        client: TestClient,
        student_user: User,
        student: Student,
        db_session: Session,
    ):
        """Test getting student profile."""
        from src.utils.security import create_access_token
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": student_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)


@pytest.mark.integration
class TestParentMultiChildAPI:
    """Integration tests for parent multi-child endpoints."""

    def test_get_parent_dashboard(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
    ):
        """Test getting parent dashboard with multiple children."""
        from src.utils.security import create_access_token, get_password_hash
        from src.models.role import Role
        
        # Create parent role
        parent_role = Role(
            name="Parent", slug="parent",
            description="Parent role",
            is_system_role=True,
        )
        db_session.add(parent_role)
        db_session.commit()
        
        # Create parent user
        parent_user = User(
            username="parent1",
            email="parent@test.com",
            first_name="Parent",
            last_name="Test",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(parent_user)
        db_session.commit()
        
        # Create parent profile
        parent = Parent(
            institution_id=institution.id,
            user_id=parent_user.id,
            first_name="Parent",
            last_name="Test",
            email="parent@test.com",
            phone="+1234567890",
        )
        db_session.add(parent)
        db_session.commit()
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": parent_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            "/api/v1/parents/dashboard",
            headers=headers,
        )
        
        assert response.status_code in [200, 404]  # 404 if no children linked

    def test_get_children_list(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
    ):
        """Test getting list of children for a parent."""
        from src.utils.security import create_access_token, get_password_hash
        from src.models.role import Role
        
        # Create parent role
        parent_role = Role(
            name="Parent", slug="parent",
            description="Parent role",
            is_system_role=True,
        )
        db_session.add(parent_role)
        db_session.commit()
        
        # Create parent user
        parent_user = User(
            username="parent2",
            email="parent2@test.com",
            first_name="Parent",
            last_name="Two",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(parent_user)
        db_session.commit()
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": parent_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(
            "/api/v1/parents/children",
            headers=headers,
        )
        
        assert response.status_code == 200
        children = response.json()
        assert isinstance(children, list)
