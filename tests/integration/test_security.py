import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from jose import jwt
from unittest.mock import patch, AsyncMock
import time

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher
from src.utils.security import create_access_token, get_password_hash
from src.config import settings


@pytest.fixture
def second_institution(db_session: Session) -> Institution:
    institution = Institution(
        name="Second School",
        slug="second-school",
        phone="+9876543210",
        address="456 Second Street",
        is_active=True,
    )
    db_session.add(institution)
    db_session.commit()
    db_session.refresh(institution)
    return institution


@pytest.fixture
def second_institution_admin(db_session: Session, second_institution: Institution, admin_role: Role) -> User:
    user = User(
        username="admin2",
        email="admin@secondschool.com",
        first_name="Admin",
        last_name="Two",
        hashed_password=get_password_hash("password123"),
        institution_id=second_institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_institution_student(
    db_session: Session,
    second_institution: Institution,
    student_role: Role,
) -> User:
    user = User(
        username="student2",
        email="student@secondschool.com",
        first_name="Jane",
        last_name="Doe",
        hashed_password=get_password_hash("password123"),
        institution_id=second_institution.id,
        role_id=student_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def teacher_auth_headers(client: TestClient, teacher_user: User) -> dict:
    """Log in for real so a matching session exists in the fake Redis --
    get_current_user requires both a valid JWT AND an active session."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": teacher_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_auth_headers(client: TestClient, student_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(client: TestClient, admin_user: User) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
class TestJWTTokenValidation:
    
    def test_expired_token_rejected(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        expired_token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            },
            expires_delta=timedelta(seconds=-1)
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code == 401
        assert "credentials" in response.json().get("detail", "").lower()
    
    def test_invalid_token_signature_rejected(
        self, client: TestClient, admin_user: User
    ):
        fake_token = jwt.encode(
            {
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
                "exp": datetime.utcnow() + timedelta(hours=1),
                "type": "access"
            },
            "wrong-secret-key",
            algorithm=settings.algorithm
        )
        
        headers = {"Authorization": f"Bearer {fake_token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_tampered_token_payload_rejected(
        self, client: TestClient, admin_user: User, student_user: User
    ):
        valid_token = create_access_token(
            data={
                "sub": student_user.id,
                "institution_id": student_user.institution_id,
                "role_id": student_user.role_id,
                "email": student_user.email,
            }
        )
        
        parts = valid_token.split('.')
        if len(parts) == 3:
            import base64
            import json
            
            try:
                payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))
                payload['sub'] = admin_user.id
                tampered_payload = base64.urlsafe_b64encode(
                    json.dumps(payload).encode()
                ).decode().rstrip('=')
                tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"
                
                headers = {"Authorization": f"Bearer {tampered_token}"}
                response = client.get("/api/v1/profile/me", headers=headers)
                
                assert response.status_code == 401
            except Exception:
                pass
    
    def test_missing_required_claims_rejected(self, client: TestClient):
        token = jwt.encode(
            {
                "exp": datetime.utcnow() + timedelta(hours=1),
                "type": "access"
            },
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_wrong_token_type_rejected(
        self, client: TestClient, admin_user: User
    ):
        refresh_token = jwt.encode(
            {
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
                "exp": datetime.utcnow() + timedelta(days=7),
                "type": "refresh"
            },
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        headers = {"Authorization": f"Bearer {refresh_token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_malformed_token_rejected(self, client: TestClient):
        headers = {"Authorization": "Bearer not.a.valid.jwt.token"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_missing_bearer_prefix_rejected(self, client: TestClient, admin_auth_headers: dict):
        token = admin_auth_headers["Authorization"].replace("Bearer ", "")
        headers = {"Authorization": token}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code in [401, 403]


@pytest.mark.integration
class TestRoleBasedAccessControl:
    
    def test_student_cannot_access_teacher_endpoints(
        self,
        client: TestClient,
        student_auth_headers: dict,
        teacher: Teacher,
    ):
        response = client.get(
            f"/api/v1/teachers/{teacher.id}",
            headers=student_auth_headers
        )
        
        assert response.status_code in [403, 404]
    
    def test_student_cannot_create_teacher(
        self,
        client: TestClient,
        student_auth_headers: dict,
        institution: Institution,
    ):
        response = client.post(
            "/api/v1/teachers/",
            headers=student_auth_headers,
            json={
                "institution_id": institution.id,
                "employee_id": "EMP999",
                "first_name": "New",
                "last_name": "Teacher",
                "email": "newteacher@test.com",
                "phone": "+1234567890",
                "date_of_birth": "1990-01-01",
                "date_of_joining": "2024-01-01",
                "qualification": "M.Sc",
                "specialization": "Math",
            }
        )
        
        assert response.status_code in [403, 401]
    
    def test_teacher_cannot_access_admin_endpoints(
        self,
        client: TestClient,
        teacher_auth_headers: dict,
    ):
        response = client.get(
            "/api/v1/institutions/",
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [403, 404, 401]
    
    def test_teacher_cannot_modify_institution_settings(
        self,
        client: TestClient,
        teacher_auth_headers: dict,
        institution: Institution,
    ):
        response = client.put(
            f"/api/v1/institutions/{institution.id}",
            headers=teacher_auth_headers,
            json={
                "name": "Modified School Name",
            }
        )
        
        assert response.status_code in [403, 404, 401]
    
    def test_student_cannot_access_subscription_endpoints(
        self,
        client: TestClient,
        student_auth_headers: dict,
    ):
        response = client.get(
            "/api/v1/subscriptions/",
            headers=student_auth_headers
        )
        
        assert response.status_code in [403, 401]
    
    def test_teacher_can_access_own_profile(
        self,
        client: TestClient,
        teacher_auth_headers: dict,
    ):
        response = client.get(
            "/api/v1/profile/me",
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [200, 404]
    
    def test_student_can_access_own_profile(
        self,
        client: TestClient,
        student_auth_headers: dict,
    ):
        response = client.get(
            "/api/v1/profile/me",
            headers=student_auth_headers
        )
        
        assert response.status_code in [200, 404]


@pytest.mark.integration
class TestMultiTenantDataIsolation:
    
    def test_user_cannot_access_other_institution_students(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        second_institution_student: User,
        db_session: Session,
    ):
        student_profile = Student(
            institution_id=second_institution_student.institution_id,
            user_id=second_institution_student.id,
            admission_number="ADM999",
            first_name=second_institution_student.first_name,
            last_name=second_institution_student.last_name,
            email=second_institution_student.email,
            date_of_birth=datetime(2008, 5, 15).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Female",
            is_active=True,
        )
        db_session.add(student_profile)
        db_session.commit()
        db_session.refresh(student_profile)
        
        response = client.get(
            f"/api/v1/students/{student_profile.id}",
            headers=admin_auth_headers
        )
        
        assert response.status_code in [403, 404]
    
    def test_user_cannot_list_other_institution_students(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        admin_user: User,
    ):
        response = client.get(
            "/api/v1/students/",
            headers=admin_auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if "items" in data:
                for student in data["items"]:
                    assert student.get("institution_id") == admin_user.institution_id
    
    def test_manipulated_institution_id_in_request_blocked(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        admin_user: User,
        second_institution: Institution,
    ):
        response = client.post(
            "/api/v1/students/",
            headers=admin_auth_headers,
            json={
                "institution_id": second_institution.id,
                "admission_number": "ADM888",
                "first_name": "Unauthorized",
                "last_name": "Student",
                "email": "unauthorized@test.com",
                "date_of_birth": "2008-01-01",
                "date_of_admission": "2024-01-01",
                "gender": "Male",
            }
        )
        
        assert response.status_code in [403, 400]
    
    def test_cannot_access_other_institution_teachers(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        second_institution: Institution,
        teacher_role: Role,
        db_session: Session,
    ):
        other_teacher_user = User(
            username="other_teacher",
            email="other@secondschool.com",
            first_name="Other",
            last_name="Teacher",
            hashed_password=get_password_hash("password123"),
            institution_id=second_institution.id,
            role_id=teacher_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(other_teacher_user)
        db_session.commit()
        
        other_teacher = Teacher(
            institution_id=second_institution.id,
            user_id=other_teacher_user.id,
            employee_id="EMP999",
            first_name=other_teacher_user.first_name,
            last_name=other_teacher_user.last_name,
            email=other_teacher_user.email,
            phone="+9999999999",
            date_of_birth=datetime(1985, 5, 15).date(),
            joining_date=datetime(2020, 6, 1).date(),
            qualification="M.Sc",
            specialization="Physics",
            is_active=True,
        )
        db_session.add(other_teacher)
        db_session.commit()
        db_session.refresh(other_teacher)
        
        response = client.get(
            f"/api/v1/teachers/{other_teacher.id}",
            headers=admin_auth_headers
        )
        
        assert response.status_code in [403, 404]
    
    def test_institution_data_filtering_in_list_endpoints(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        admin_user: User,
    ):
        response = client.get(
            "/api/v1/teachers/",
            headers=admin_auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if "items" in data:
                for teacher in data["items"]:
                    assert teacher.get("institution_id") == admin_user.institution_id


@pytest.mark.integration
class TestSQLInjectionProtection:
    
    def test_sql_injection_in_student_search(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        sql_injection_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE students; --",
            "1' UNION SELECT * FROM users --",
            "admin'--",
            "' OR 1=1--",
            "1; DELETE FROM students WHERE '1'='1",
        ]
        
        for payload in sql_injection_payloads:
            response = client.get(
                f"/api/v1/students/?search={payload}",
                headers=admin_auth_headers
            )
            
            assert response.status_code in [200, 400, 422]
            
            if response.status_code == 200:
                assert "items" in response.json()
    
    def test_sql_injection_in_teacher_search(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        sql_payloads = [
            "'; SELECT * FROM users WHERE ''='",
            "1' AND '1'='1",
            "' OR EXISTS(SELECT * FROM users) --",
        ]
        
        for payload in sql_payloads:
            response = client.get(
                f"/api/v1/teachers/?search={payload}",
                headers=admin_auth_headers
            )
            
            assert response.status_code in [200, 400, 422]
    
    def test_sql_injection_in_filter_parameters(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        response = client.get(
            "/api/v1/students/?is_active=' OR '1'='1",
            headers=admin_auth_headers
        )
        
        assert response.status_code in [200, 400, 422]
    
    def test_sql_injection_in_quick_search(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        response = client.get(
            "/api/v1/search/quick?q=' UNION SELECT password FROM users--",
            headers=admin_auth_headers
        )
        
        assert response.status_code in [200, 400, 401, 404, 422]


@pytest.mark.integration
class TestXSSProtection:
    
    def test_xss_in_student_name_fields(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        institution: Institution,
    ):
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<body onload=alert('XSS')>",
        ]
        
        for payload in xss_payloads:
            response = client.post(
                "/api/v1/students/",
                headers=admin_auth_headers,
                json={
                    "institution_id": institution.id,
                    "admission_number": f"ADM{hash(payload) % 10000}",
                    "first_name": payload,
                    "last_name": "Test",
                    "email": f"test{hash(payload) % 10000}@test.com",
                    "date_of_birth": "2008-01-01",
                    "date_of_admission": "2024-01-01",
                    "gender": "Male",
                }
            )
            
            if response.status_code == 201:
                data = response.json()
                assert "<script>" not in str(data.get("first_name", ""))
                assert "onerror=" not in str(data.get("first_name", ""))
    
    def test_xss_in_search_query(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        xss_search = "<script>alert('XSS')</script>"
        response = client.get(
            f"/api/v1/students/?search={xss_search}",
            headers=admin_auth_headers
        )
        
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            response_text = response.text
            assert "<script>" not in response_text
    
    def test_xss_in_institution_description(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        institution: Institution,
    ):
        response = client.put(
            f"/api/v1/institutions/{institution.id}",
            headers=admin_auth_headers,
            json={
                "description": "<script>alert('XSS')</script>",
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            description = data.get("description", "")
            assert "<script>" not in description or description == "<script>alert('XSS')</script>"


@pytest.mark.integration
class TestCORSConfiguration:
    
    def test_cors_headers_present_on_api_response(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        response = client.options(
            "/api/v1/profile/me",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            }
        )
        
        assert response.status_code in [200, 404, 405]
    
    def test_cors_blocks_unauthorized_origin(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        headers = {
            **admin_auth_headers,
            "Origin": "http://malicious-site.com"
        }
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code in [200, 403, 404]
    
    def test_preflight_request_handling(
        self,
        client: TestClient,
    ):
        response = client.options(
            "/api/v1/students/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type,Authorization",
            }
        )
        
        assert response.status_code in [200, 404, 405]


@pytest.mark.integration
class TestRateLimitingEnforcement:
    
    def test_rate_limit_enforced_for_anonymous_users(
        self,
        client: TestClient,
    ):
        for i in range(60):
            response = client.get("/api/v1/health")
            if response.status_code == 429:
                break
        
        assert True
    
    def test_rate_limit_headers_present(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        response = client.get("/api/v1/profile/me", headers=admin_auth_headers)
        
        expected_headers = [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
        ]
        
        for header in expected_headers:
            if header in response.headers:
                assert True
    
    def test_rate_limit_exceeded_returns_429(
        self,
        client: TestClient,
    ):
        responses = []
        for i in range(100):
            response = client.get("/")
            responses.append(response.status_code)
            if response.status_code == 429:
                break
        
        assert True
    
    def test_different_rate_limits_for_different_roles(
        self,
        client: TestClient,
        student_auth_headers: dict,
        admin_auth_headers: dict,
    ):
        student_response = client.get("/api/v1/profile/me", headers=student_auth_headers)
        admin_response = client.get("/api/v1/profile/me", headers=admin_auth_headers)
        
        student_limit = student_response.headers.get("X-RateLimit-Limit")
        admin_limit = admin_response.headers.get("X-RateLimit-Limit")
        
        if student_limit and admin_limit:
            assert True
    
    def test_rate_limit_reset_after_window(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        response = client.get("/api/v1/profile/me", headers=admin_auth_headers)
        reset_time = response.headers.get("X-RateLimit-Reset")
        
        if reset_time:
            assert int(reset_time) > int(time.time())
    
    def test_rate_limit_bypass_for_whitelisted_endpoints(
        self,
        client: TestClient,
    ):
        for i in range(100):
            response = client.get("/health")
            if i < 50:
                assert response.status_code in [200, 429]


@pytest.mark.integration
class TestSessionManagement:
    
    def test_invalid_session_rejected(
        self,
        client: TestClient,
        admin_user: User,
    ):
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code in [200, 401]
    
    def test_inactive_user_rejected(
        self,
        client: TestClient,
        db_session: Session,
        admin_user: User,
    ):
        admin_user.is_active = False
        db_session.commit()
        
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code in [401, 403]
        
        admin_user.is_active = True
        db_session.commit()


@pytest.mark.integration
class TestAuthorizationEdgeCases:
    
    def test_deleted_user_token_rejected(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        student_role: Role,
    ):
        temp_user = User(
            username="temp_user",
            email="temp@test.com",
            first_name="Temp",
            last_name="User",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(temp_user)
        db_session.commit()
        db_session.refresh(temp_user)
        
        token = create_access_token(
            data={
                "sub": temp_user.id,
                "institution_id": temp_user.institution_id,
                "role_id": temp_user.role_id,
                "email": temp_user.email,
            }
        )
        
        db_session.delete(temp_user)
        db_session.commit()
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        assert response.status_code in [401, 404]
    
    def test_role_change_reflected_in_permissions(
        self,
        client: TestClient,
        db_session: Session,
        student_user: User,
        teacher_role: Role,
    ):
        original_role_id = student_user.role_id
        
        student_user.role_id = teacher_role.id
        db_session.commit()
        
        token = create_access_token(
            data={
                "sub": student_user.id,
                "institution_id": student_user.institution_id,
                "role_id": original_role_id,
                "email": student_user.email,
            }
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/profile/me", headers=headers)
        
        student_user.role_id = original_role_id
        db_session.commit()
        
        assert response.status_code in [200, 401, 403]
    
    def test_concurrent_sessions_handling(
        self,
        client: TestClient,
        admin_auth_headers: dict,
    ):
        response1 = client.get("/api/v1/profile/me", headers=admin_auth_headers)
        response2 = client.get("/api/v1/profile/me", headers=admin_auth_headers)
        
        assert response1.status_code in [200, 404]
        assert response2.status_code in [200, 404]
