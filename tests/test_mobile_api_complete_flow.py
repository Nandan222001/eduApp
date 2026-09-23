import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime
from src.models.user import User
from src.models.institution import Institution
from src.models.student import Student
from src.models.academic import AcademicYear, Grade, Section


@pytest.mark.integration
class TestMobileAPICompleteFlow:
    """Integration tests for complete mobile API user flows."""

    def test_student_complete_mobile_workflow(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        section: Section,
    ):
        """
        Test complete student mobile workflow:
        1. Login
        2. Register device
        3. Access dashboard
        4. Create study session
        5. Upload homework
        6. Logout
        """
        from src.utils.security import get_password_hash
        from src.models.role import Role
        from io import BytesIO
        
        # Setup: Create student role and user
        student_role = Role(
            name="Student", slug="student",
            description="Student role",
            is_system_role=True,
        )
        db_session.add(student_role)
        db_session.commit()
        
        student_user = User(
            username="mobile_student",
            email="mobile_student@test.com",
            first_name="Mobile",
            last_name="Student",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(student_user)
        db_session.commit()
        
        student = Student(
            institution_id=institution.id,
            user_id=student_user.id,
            admission_number="MOBILE001",
            first_name="Mobile",
            last_name="Student",
            email="mobile_student@test.com",
            section_id=section.id,
            date_of_birth=datetime(2008, 5, 15).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Male",
        )
        db_session.add(student)
        db_session.commit()
        
        # Link student profile to user
        student_user.student_profile = student
        db_session.commit()
        
        # Step 1: Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "mobile_student@test.com",
                "password": "password123",
                "institution_id": institution.id,
            },
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        
        access_token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 2: Register device
        device_response = client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": "ExponentPushToken[mobile_workflow_test]",
                "platform": "ios",
                "device_name": "iPhone Test",
                "os_version": "16.0",
                "app_version": "1.0.0",
                "topics": ["assignments", "grades", "attendance"]
            },
        )
        assert device_response.status_code == 200
        device_data = device_response.json()
        assert device_data["platform"] == "ios"
        assert device_data["user_id"] == student_user.id
        
        # Step 3: Access dashboard
        dashboard_response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=headers,
        )
        assert dashboard_response.status_code == 200
        dashboard_data = dashboard_response.json()
        assert isinstance(dashboard_data, dict)
        
        # Step 4: Create study buddy session
        session_response = client.post(
            "/api/v1/study-buddy/sessions",
            headers=headers,
            json={
                "student_id": student.id,
                "session_title": "Complete Workflow Test Session",
                "context": {"subject": "mathematics"}
            },
        )
        assert session_response.status_code == 201
        session_data = session_response.json()
        assert session_data["student_id"] == student.id
        assert session_data["is_active"] == True
        
        # Step 5: Chat with study buddy
        chat_response = client.post(
            "/api/v1/study-buddy/chat",
            headers=headers,
            json={
                "message": "Help me with algebra",
                "context": {"subject": "mathematics"}
            },
        )
        assert chat_response.status_code == 200
        
        # Step 6: Upload homework (may fail without OCR, but should accept upload)
        image_content = b"fake image content for testing"
        files = {
            "file": ("homework_workflow.jpg", BytesIO(image_content), "image/jpeg")
        }
        data = {
            "student_id": str(student.id),
            "scan_title": "Workflow Test Homework"
        }
        
        homework_response = client.post(
            "/api/v1/homework-scanner/scans",
            headers=headers,
            files=files,
            data=data,
        )
        # May succeed or fail depending on OCR service
        assert homework_response.status_code in [201, 500]
        
        # Step 7: Get user devices
        devices_response = client.get(
            "/api/v1/notifications/devices",
            headers=headers,
        )
        assert devices_response.status_code == 200
        devices = devices_response.json()
        assert len(devices) >= 1
        
        # Step 8: Logout
        logout_response = client.post(
            "/api/v1/auth/logout",
            headers=headers,
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert logout_response.status_code in [200, 204]

    def test_parent_complete_mobile_workflow(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        section: Section,
    ):
        """
        Test complete parent mobile workflow:
        1. Login
        2. Register device
        3. Get children list
        4. View child dashboard
        5. Check attendance
        6. View assignments
        """
        from src.utils.security import get_password_hash
        from src.models.role import Role
        from src.models.student import Parent, StudentParent
        
        # Setup: Create parent role
        parent_role = Role(
            name="Parent", slug="parent",
            description="Parent role",
            is_system_role=True,
        )
        db_session.add(parent_role)
        db_session.commit()
        
        # Create parent user
        parent_user = User(
            username="mobile_parent",
            email="mobile_parent@test.com",
            first_name="Mobile",
            last_name="Parent",
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
            first_name="Mobile",
            last_name="Parent",
            email="mobile_parent@test.com",
            phone="+1234567890",
            relation_type="father",
        )
        db_session.add(parent)
        db_session.commit()
        
        # Create student role and child
        student_role = Role(
            name="Student", slug="student",
            description="Student role",
            is_system_role=True,
        )
        db_session.add(student_role)
        db_session.commit()
        
        child_user = User(
            username="parent_child",
            email="parent_child@test.com",
            first_name="Child",
            last_name="Test",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(child_user)
        db_session.commit()
        
        child = Student(
            institution_id=institution.id,
            user_id=child_user.id,
            admission_number="CHILD001",
            first_name="Child",
            last_name="Test",
            email="parent_child@test.com",
            section_id=section.id,
            date_of_birth=datetime(2010, 3, 20).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Female",
        )
        db_session.add(child)
        db_session.commit()
        
        # Link child to parent
        student_parent = StudentParent(
            student_id=child.id,
            parent_id=parent.id,
            relation_type="father",
            is_primary_contact=True,
        )
        db_session.add(student_parent)
        db_session.commit()
        
        # Step 1: Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "mobile_parent@test.com",
                "password": "password123",
                "institution_id": institution.id,
            },
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        access_token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 2: Register device
        device_response = client.post(
            "/api/v1/notifications/register-device",
            headers=headers,
            json={
                "token": "ExponentPushToken[parent_workflow]",
                "platform": "android",
                "device_name": "Parent Phone",
                "topics": ["attendance", "grades", "announcements"]
            },
        )
        assert device_response.status_code == 200
        
        # Step 3: Get children list
        children_response = client.get(
            "/api/v1/parents/children",
            headers=headers,
        )
        assert children_response.status_code == 200
        children = children_response.json()
        assert len(children) >= 1
        assert any(c["id"] == child.id for c in children)
        
        # Step 4: View parent dashboard
        dashboard_response = client.get(
            "/api/v1/parents/dashboard",
            headers=headers,
        )
        assert dashboard_response.status_code in [200, 404]
        
        # Step 5: Check child's today attendance
        attendance_response = client.get(
            f"/api/v1/parents/children/{child.id}/attendance/today",
            headers=headers,
        )
        assert attendance_response.status_code == 200
        
        # Step 6: View pending assignments
        assignments_response = client.get(
            f"/api/v1/parents/children/{child.id}/assignments/pending",
            headers=headers,
        )
        assert assignments_response.status_code == 200
        
        # Step 7: View recent grades
        grades_response = client.get(
            f"/api/v1/parents/children/{child.id}/grades/recent",
            headers=headers,
        )
        assert grades_response.status_code == 200

    def test_authentication_and_authorization_flow(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
    ):
        """Test authentication flows and authorization checks."""
        from src.utils.security import get_password_hash
        from src.models.role import Role
        
        # Create student role
        student_role = Role(
            name="Student", slug="student",
            description="Student role",
            is_system_role=True,
        )
        db_session.add(student_role)
        db_session.commit()
        
        # Create user
        user = User(
            username="auth_test",
            email="auth_test@test.com",
            first_name="Auth",
            last_name="Test",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        
        # Test 1: Login with correct credentials
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "auth_test@test.com",
                "password": "password123",
                "institution_id": institution.id,
            },
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        
        # Test 2: Access protected endpoint with token
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        me_response = client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200
        user_data = me_response.json()
        assert user_data["email"] == "auth_test@test.com"
        
        # Test 3: Access protected endpoint without token
        # FastAPI's HTTPBearer(auto_error=True) returns 403, not 401, when no
        # Authorization header is present at all (401 is reserved for an
        # invalid/expired token) -- matches the convention used throughout
        # the rest of the test suite (see test_error_handling.py).
        no_auth_response = client.get("/api/v1/notifications/devices")
        assert no_auth_response.status_code == 403
        
        # Test 4: Refresh token
        refresh_response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        assert "access_token" in new_tokens
        
        # Test 5: Login with wrong password
        wrong_password_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "auth_test@test.com",
                "password": "wrong_password",
                "institution_id": institution.id,
            },
        )
        assert wrong_password_response.status_code == 401
        
        # Test 6: Logout
        logout_response = client.post(
            "/api/v1/auth/logout",
            headers=headers,
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert logout_response.status_code in [200, 204]
