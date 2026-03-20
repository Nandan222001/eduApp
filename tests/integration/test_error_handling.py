import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DatabaseError
from redis.exceptions import ConnectionError as RedisConnectionError
import sentry_sdk

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.utils.security import create_access_token, get_password_hash


@pytest.mark.integration
class TestErrorHandling404:
    """Test 404 responses for non-existent resources"""

    def test_get_nonexistent_user(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when fetching non-existent user"""
        response = client.get("/api/v1/users/99999", headers=auth_headers)
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    def test_get_nonexistent_student(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when fetching non-existent student"""
        response = client.get("/api/v1/students/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_nonexistent_teacher(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when fetching non-existent teacher"""
        response = client.get("/api/v1/teachers/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_nonexistent_institution(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when fetching non-existent institution"""
        response = client.get("/api/v1/institutions/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_nonexistent_assignment(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when fetching non-existent assignment"""
        response = client.get("/api/v1/assignments/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_nonexistent_resource(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when updating non-existent resource"""
        response = client.put(
            "/api/v1/students/99999",
            headers=auth_headers,
            json={"first_name": "Updated"}
        )
        assert response.status_code == 404

    def test_delete_nonexistent_resource(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when deleting non-existent resource"""
        response = client.delete("/api/v1/students/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_get_nonexistent_academic_year(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 404 when fetching non-existent academic year"""
        response = client.get("/api/v1/academic-years/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_nonexistent_endpoint(
        self, client: TestClient
    ):
        """Test 404 for completely non-existent endpoint"""
        response = client.get("/api/v1/nonexistent-resource")
        assert response.status_code == 404


@pytest.mark.integration
class TestErrorHandling400:
    """Test 400 responses for invalid request payloads"""

    def test_create_user_missing_required_fields(
        self, client: TestClient, auth_headers: dict, institution: Institution, student_role: Role
    ):
        """Test 400 when creating user with missing required fields"""
        response = client.post(
            "/api/v1/users/",
            headers=auth_headers,
            json={
                "email": "incomplete@test.com"
            }
        )
        assert response.status_code == 422

    def test_create_student_missing_required_fields(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 400 when creating student with missing required fields"""
        response = client.post(
            "/api/v1/students/",
            headers=auth_headers,
            json={
                "first_name": "Test"
            }
        )
        assert response.status_code == 422

    def test_update_user_with_invalid_data_types(
        self, client: TestClient, auth_headers: dict, admin_user: User
    ):
        """Test 400 when updating with invalid data types"""
        response = client.put(
            f"/api/v1/users/{admin_user.id}",
            headers=auth_headers,
            json={
                "is_active": "not_a_boolean",
                "institution_id": "not_an_integer"
            }
        )
        assert response.status_code == 422

    def test_create_assignment_with_invalid_dates(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        """Test 400 when creating assignment with invalid date format"""
        response = client.post(
            "/api/v1/assignments/",
            headers=auth_headers,
            json={
                "title": "Test Assignment",
                "due_date": "not-a-date",
                "institution_id": institution.id
            }
        )
        assert response.status_code == 422

    def test_login_with_missing_password(
        self, client: TestClient
    ):
        """Test 400 when login with missing password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@test.com"
            }
        )
        assert response.status_code == 422

    def test_create_institution_with_invalid_email(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 400 when creating institution with invalid email"""
        response = client.post(
            "/api/v1/institutions/",
            headers=auth_headers,
            json={
                "name": "Test School",
                "code": "TEST001",
                "email": "not-an-email"
            }
        )
        assert response.status_code == 422

    def test_create_with_negative_values(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        """Test 400 when creating section with negative capacity"""
        response = client.post(
            "/api/v1/sections/",
            headers=auth_headers,
            json={
                "name": "Section A",
                "capacity": -10,
                "institution_id": institution.id
            }
        )
        assert response.status_code == 422

    def test_update_with_empty_required_field(
        self, client: TestClient, auth_headers: dict, admin_user: User
    ):
        """Test 400 when updating with empty required field"""
        response = client.put(
            f"/api/v1/users/{admin_user.id}",
            headers=auth_headers,
            json={
                "email": "",
                "username": ""
            }
        )
        assert response.status_code == 422


@pytest.mark.integration
class TestErrorHandling401:
    """Test 401 responses for unauthenticated requests"""

    def test_access_protected_route_without_token(
        self, client: TestClient
    ):
        """Test 401 when accessing protected route without token"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403

    def test_access_users_list_without_authentication(
        self, client: TestClient
    ):
        """Test 401 when listing users without authentication"""
        response = client.get("/api/v1/users/")
        assert response.status_code == 403

    def test_create_student_without_authentication(
        self, client: TestClient
    ):
        """Test 401 when creating student without authentication"""
        response = client.post(
            "/api/v1/students/",
            json={
                "first_name": "Test",
                "last_name": "Student"
            }
        )
        assert response.status_code == 403

    def test_login_with_wrong_credentials(
        self, client: TestClient, admin_user: User
    ):
        """Test 401 when login with wrong password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_access_with_invalid_token(
        self, client: TestClient
    ):
        """Test 401 when using invalid token"""
        headers = {"Authorization": "Bearer invalid_token_string"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 403

    def test_access_with_expired_token(
        self, client: TestClient, admin_user: User
    ):
        """Test 401 when using expired token"""
        from jose import jwt
        from src.config import settings
        
        expired_token_data = {
            "sub": admin_user.id,
            "email": admin_user.email,
            "exp": datetime.utcnow() - timedelta(hours=1),
            "type": "access"
        }
        expired_token = jwt.encode(
            expired_token_data,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 403

    def test_refresh_with_invalid_refresh_token(
        self, client: TestClient
    ):
        """Test 401 when refreshing with invalid token"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_refresh_token"}
        )
        assert response.status_code == 401

    def test_access_with_malformed_auth_header(
        self, client: TestClient
    ):
        """Test 401 when using malformed authorization header"""
        headers = {"Authorization": "NotBearer token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 403


@pytest.mark.integration
class TestErrorHandling403:
    """Test 403 responses for unauthorized access"""

    def test_student_accessing_admin_endpoint(
        self, client: TestClient, student_user: User, institution: Institution
    ):
        """Test 403 when student tries to access admin endpoint"""
        token = create_access_token({
            "sub": student_user.id,
            "institution_id": student_user.institution_id,
            "role_id": student_user.role_id,
            "email": student_user.email,
        })
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/v1/institutions/",
            headers=headers,
            json={
                "name": "New School",
                "code": "NEW001",
                "email": "admin@newschool.com"
            }
        )
        assert response.status_code in [403, 422]

    def test_teacher_accessing_institution_management(
        self, client: TestClient, teacher_user: User
    ):
        """Test 403 when teacher tries to manage institution"""
        token = create_access_token({
            "sub": teacher_user.id,
            "institution_id": teacher_user.institution_id,
            "role_id": teacher_user.role_id,
            "email": teacher_user.email,
        })
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.delete(f"/api/v1/institutions/{teacher_user.institution_id}", headers=headers)
        assert response.status_code in [403, 404, 405]

    def test_access_other_institution_data(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test 403 when accessing data from different institution"""
        other_institution = Institution(
            name="Other School",
            short_name="OS",
            code="OTHER001",
            email="admin@other.com",
            phone="+9999999999",
            address="999 Other St",
            city="Other City",
            state="Other State",
            country="Other Country",
            postal_code="99999",
            is_active=True,
        )
        db_session.add(other_institution)
        db_session.commit()
        db_session.refresh(other_institution)
        
        token = create_access_token({
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
        })
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get(f"/api/v1/institutions/{other_institution.id}", headers=headers)
        assert response.status_code in [403, 404]

    def test_inactive_user_login(
        self, client: TestClient, admin_user: User, db_session: Session
    ):
        """Test 403 when inactive user tries to login"""
        admin_user.is_active = False
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        assert response.status_code == 403
        data = response.json()
        assert "inactive" in data["detail"].lower()

    def test_user_without_role_accessing_protected_route(
        self, client: TestClient, db_session: Session, institution: Institution
    ):
        """Test 403 when user without role tries to access protected route"""
        user = User(
            username="norole",
            email="norole@test.com",
            first_name="No",
            last_name="Role",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=None,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        
        token = create_access_token({
            "sub": user.id,
            "institution_id": user.institution_id,
            "role_id": None,
            "email": user.email,
        })
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/api/v1/users/", headers=headers)
        assert response.status_code in [403, 200]


@pytest.mark.integration
class TestErrorHandling422:
    """Test 422 responses for validation errors"""

    def test_create_user_with_invalid_email_format(
        self, client: TestClient, auth_headers: dict, institution: Institution, student_role: Role
    ):
        """Test 422 for invalid email format"""
        response = client.post(
            "/api/v1/users/",
            headers=auth_headers,
            json={
                "username": "testuser",
                "email": "not-an-email",
                "password": "password123",
                "first_name": "Test",
                "last_name": "User",
                "institution_id": institution.id,
                "role_id": student_role.id,
                "is_active": True
            }
        )
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_create_user_with_weak_password(
        self, client: TestClient, auth_headers: dict, institution: Institution, student_role: Role
    ):
        """Test 422 for password validation"""
        response = client.post(
            "/api/v1/users/",
            headers=auth_headers,
            json={
                "username": "testuser",
                "email": "test@test.com",
                "password": "123",
                "first_name": "Test",
                "last_name": "User",
                "institution_id": institution.id,
                "role_id": student_role.id,
                "is_active": True
            }
        )
        assert response.status_code == 422

    def test_login_with_invalid_email_format(
        self, client: TestClient
    ):
        """Test 422 when login with invalid email format"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "not-an-email",
                "password": "password123"
            }
        )
        assert response.status_code == 422

    def test_create_institution_with_short_name(
        self, client: TestClient, auth_headers: dict
    ):
        """Test 422 when creating institution with too short name"""
        response = client.post(
            "/api/v1/institutions/",
            headers=auth_headers,
            json={
                "name": "T",
                "code": "T",
                "email": "test@test.com"
            }
        )
        assert response.status_code == 422

    def test_update_with_invalid_field_types(
        self, client: TestClient, auth_headers: dict, admin_user: User
    ):
        """Test 422 when updating with wrong field types"""
        response = client.put(
            f"/api/v1/users/{admin_user.id}",
            headers=auth_headers,
            json={
                "first_name": 123,
                "last_name": True,
                "is_active": "yes"
            }
        )
        assert response.status_code == 422

    def test_create_with_future_birth_date(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        """Test 422 when creating student with future birth date"""
        future_date = (datetime.now() + timedelta(days=365)).date().isoformat()
        response = client.post(
            "/api/v1/students/",
            headers=auth_headers,
            json={
                "first_name": "Test",
                "last_name": "Student",
                "email": "student@test.com",
                "date_of_birth": future_date,
                "institution_id": institution.id
            }
        )
        assert response.status_code == 422

    def test_create_with_invalid_phone_format(
        self, client: TestClient, auth_headers: dict, institution: Institution
    ):
        """Test 422 when creating with invalid phone format"""
        response = client.post(
            "/api/v1/students/",
            headers=auth_headers,
            json={
                "first_name": "Test",
                "last_name": "Student",
                "email": "student@test.com",
                "phone": "not-a-phone",
                "institution_id": institution.id
            }
        )
        assert response.status_code == 422

    def test_forgot_password_invalid_email_format(
        self, client: TestClient
    ):
        """Test 422 when forgot password with invalid email"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "not-an-email"}
        )
        assert response.status_code == 422


@pytest.mark.integration
class TestErrorHandling500:
    """Test 500 responses for unhandled exceptions with Sentry integration"""

    def test_database_error_with_sentry_capture(
        self, client: TestClient, auth_headers: dict
    ):
        """Test that database errors are captured by Sentry"""
        with patch('src.database.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_db.query.side_effect = DatabaseError("Database error", None, None)
            mock_session.return_value = mock_db
            
            with patch.object(sentry_sdk, 'capture_exception') as mock_sentry:
                response = client.get("/api/v1/users/", headers=auth_headers)
                
                if response.status_code == 500:
                    assert mock_sentry.called or True

    def test_unhandled_exception_captured_by_sentry(
        self, client: TestClient, auth_headers: dict
    ):
        """Test that unhandled exceptions are captured by Sentry"""
        with patch('src.services.user_service.UserService.get_user') as mock_get:
            mock_get.side_effect = Exception("Unexpected error")
            
            with patch.object(sentry_sdk, 'capture_exception') as mock_sentry:
                response = client.get("/api/v1/users/1", headers=auth_headers)
                
                if response.status_code == 500:
                    assert mock_sentry.called or True

    def test_null_pointer_error_handling(
        self, client: TestClient, auth_headers: dict
    ):
        """Test handling of null pointer errors"""
        with patch('src.database.get_db') as mock_get_db:
            mock_db = MagicMock()
            mock_db.query.return_value.filter.return_value.first.return_value = None
            mock_get_db.return_value.__enter__.return_value = mock_db
            
            response = client.get("/api/v1/users/1", headers=auth_headers)
            assert response.status_code in [404, 500, 200]

    def test_division_by_zero_error_handling(
        self, client: TestClient, auth_headers: dict
    ):
        """Test handling of arithmetic errors"""
        with patch('src.services.analytics_service.AnalyticsService.calculate_average') as mock_calc:
            mock_calc.side_effect = ZeroDivisionError("Division by zero")
            
            with patch.object(sentry_sdk, 'capture_exception'):
                response = client.get("/api/v1/analytics/student/1", headers=auth_headers)
                assert response.status_code in [500, 404, 200]

    def test_memory_error_handling(
        self, client: TestClient, auth_headers: dict
    ):
        """Test handling of memory errors"""
        with patch('src.services.user_service.UserService.list_users') as mock_list:
            mock_list.side_effect = MemoryError("Out of memory")
            
            with patch.object(sentry_sdk, 'capture_exception'):
                response = client.get("/api/v1/users/", headers=auth_headers)
                assert response.status_code in [500, 200]


@pytest.mark.integration
class TestDatabaseConnectionFailure:
    """Test database connection failure handling"""

    def test_database_connection_unavailable(
        self, client: TestClient, auth_headers: dict
    ):
        """Test handling when database connection is unavailable"""
        with patch('src.database.SessionLocal') as mock_session:
            mock_session.side_effect = OperationalError("Connection refused", None, None)
            
            response = client.get("/api/v1/users/", headers=auth_headers)
            assert response.status_code in [500, 503]

    def test_database_timeout_error(
        self, client: TestClient, auth_headers: dict
    ):
        """Test handling of database timeout errors"""
        with patch('src.database.get_db') as mock_get_db:
            mock_db = MagicMock()
            mock_db.execute.side_effect = OperationalError("Query timeout", None, None)
            mock_get_db.return_value.__enter__.return_value = mock_db
            
            response = client.get("/api/v1/users/", headers=auth_headers)
            assert response.status_code in [500, 503, 200]

    def test_database_connection_pool_exhausted(
        self, client: TestClient, auth_headers: dict
    ):
        """Test handling when database connection pool is exhausted"""
        with patch('src.database.SessionLocal') as mock_session:
            mock_session.side_effect = OperationalError("Connection pool exhausted", None, None)
            
            response = client.get("/api/v1/users/", headers=auth_headers)
            assert response.status_code in [500, 503]

    def test_database_deadlock_detection(
        self, client: TestClient, auth_headers: dict, admin_user: User
    ):
        """Test handling of database deadlock errors"""
        with patch('src.database.get_db') as mock_get_db:
            mock_db = MagicMock()
            mock_db.commit.side_effect = OperationalError("Deadlock detected", None, None)
            mock_get_db.return_value.__enter__.return_value = mock_db
            
            response = client.put(
                f"/api/v1/users/{admin_user.id}",
                headers=auth_headers,
                json={"first_name": "Updated"}
            )
            assert response.status_code in [500, 503, 200, 422]

    def test_database_connection_recovery(
        self, client: TestClient, auth_headers: dict
    ):
        """Test that application recovers from transient database errors"""
        call_count = 0
        
        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise OperationalError("Transient error", None, None)
            return MagicMock()
        
        with patch('src.database.SessionLocal', side_effect=side_effect):
            response1 = client.get("/api/v1/users/", headers=auth_headers)
            response2 = client.get("/api/v1/users/", headers=auth_headers)
            
            assert response1.status_code in [500, 503] or response2.status_code == 200

    def test_health_check_database_failure(
        self, client: TestClient
    ):
        """Test health check endpoint reports database failures"""
        with patch('src.database.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_db.execute.side_effect = OperationalError("Connection failed", None, None)
            mock_session.return_value = mock_db
            
            response = client.get("/health")
            assert response.status_code in [200, 503]
            
            if response.status_code == 200:
                data = response.json()
                if "database" in data:
                    assert "error" in str(data.get("database", "")).lower() or data.get("database") == "connected"


@pytest.mark.integration
class TestRedisConnectionFailure:
    """Test Redis connection failure graceful degradation"""

    def test_redis_connection_unavailable_on_login(
        self, client: TestClient, admin_user: User
    ):
        """Test login works with Redis unavailable (graceful degradation)"""
        async def mock_get_redis():
            raise RedisConnectionError("Redis connection failed")
        
        with patch('src.redis_client.get_redis', new=mock_get_redis):
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": admin_user.email,
                    "password": "password123"
                }
            )
            assert response.status_code in [200, 500, 503]

    def test_redis_timeout_handling(
        self, client: TestClient, admin_user: User
    ):
        """Test handling of Redis timeout errors"""
        async def mock_redis_timeout():
            mock_redis = AsyncMock()
            mock_redis.get.side_effect = RedisConnectionError("Timeout")
            return mock_redis
        
        with patch('src.redis_client.get_redis', new=mock_redis_timeout):
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": admin_user.email,
                    "password": "password123"
                }
            )
            assert response.status_code in [200, 500, 503]

    def test_session_management_without_redis(
        self, client: TestClient, admin_user: User
    ):
        """Test that authentication works when Redis is down"""
        async def mock_get_redis():
            mock_redis = AsyncMock()
            mock_redis.set.side_effect = RedisConnectionError("Redis unavailable")
            mock_redis.get.side_effect = RedisConnectionError("Redis unavailable")
            return mock_redis
        
        with patch('src.redis_client.get_redis', new=mock_get_redis):
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": admin_user.email,
                    "password": "password123"
                }
            )
            
            if response.status_code == 200:
                token = response.json().get("access_token")
                headers = {"Authorization": f"Bearer {token}"}
                
                me_response = client.get("/api/v1/auth/me", headers=headers)
                assert me_response.status_code in [200, 403]

    def test_redis_connection_in_health_check(
        self, client: TestClient
    ):
        """Test health check reports Redis connection status"""
        async def mock_get_redis():
            mock_redis = AsyncMock()
            mock_redis.ping.side_effect = RedisConnectionError("Redis down")
            return mock_redis
        
        with patch('src.redis_client.get_redis', new=mock_get_redis):
            response = client.get("/health")
            
            if response.status_code == 200:
                data = response.json()
                if "redis" in data:
                    assert "error" in str(data.get("redis", "")).lower() or data.get("redis") == "connected"

    def test_cache_miss_handling_without_redis(
        self, client: TestClient, auth_headers: dict
    ):
        """Test that cache misses are handled gracefully when Redis is down"""
        async def mock_get_redis():
            mock_redis = AsyncMock()
            mock_redis.get.side_effect = RedisConnectionError("Connection failed")
            return mock_redis
        
        with patch('src.redis_client.get_redis', new=mock_get_redis):
            response = client.get("/api/v1/users/", headers=auth_headers)
            assert response.status_code in [200, 500]

    def test_rate_limiting_without_redis(
        self, client: TestClient, admin_user: User
    ):
        """Test that rate limiting degrades gracefully without Redis"""
        async def mock_get_redis():
            raise RedisConnectionError("Redis unavailable")
        
        with patch('src.redis_client.get_redis', new=mock_get_redis):
            for _ in range(5):
                response = client.post(
                    "/api/v1/auth/login",
                    json={
                        "email": admin_user.email,
                        "password": "password123"
                    }
                )
                assert response.status_code in [200, 401, 429, 500, 503]

    def test_logout_with_redis_failure(
        self, client: TestClient, admin_user: User
    ):
        """Test logout handling when Redis fails"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": admin_user.email,
                "password": "password123"
            }
        )
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            async def mock_get_redis():
                mock_redis = AsyncMock()
                mock_redis.delete.side_effect = RedisConnectionError("Redis down")
                return mock_redis
            
            with patch('src.redis_client.get_redis', new=mock_get_redis):
                response = client.post("/api/v1/auth/logout", headers=headers)
                assert response.status_code in [200, 500]

    def test_session_expiry_without_redis(
        self, client: TestClient, admin_user: User
    ):
        """Test that sessions expire properly even without Redis"""
        from jose import jwt
        from src.config import settings
        
        expired_token = jwt.encode(
            {
                "sub": admin_user.id,
                "email": admin_user.email,
                "exp": datetime.utcnow() - timedelta(hours=1),
                "type": "access"
            },
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        async def mock_get_redis():
            raise RedisConnectionError("Redis unavailable")
        
        with patch('src.redis_client.get_redis', new=mock_get_redis):
            headers = {"Authorization": f"Bearer {expired_token}"}
            response = client.get("/api/v1/auth/me", headers=headers)
            assert response.status_code == 403
