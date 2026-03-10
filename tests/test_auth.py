import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.database import Base, get_db
from src.redis_client import get_redis
from src.models import User, Role, Institution, Permission
from src.utils.security import get_password_hash
from unittest.mock import AsyncMock, MagicMock

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


mock_redis = AsyncMock()
mock_redis.setex = AsyncMock()
mock_redis.get = AsyncMock(return_value=None)
mock_redis.delete = AsyncMock()
mock_redis.exists = AsyncMock(return_value=1)
mock_redis.scan = AsyncMock(return_value=(0, []))


async def override_get_redis():
    return mock_redis


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_redis] = override_get_redis

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    institution = Institution(
        id=1,
        name="Test Institution",
        slug="test-institution",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(institution)

    permission1 = Permission(
        id=1,
        name="Read Users",
        slug="users:read",
        resource="users",
        action="read",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    permission2 = Permission(
        id=2,
        name="Create Users",
        slug="users:create",
        resource="users",
        action="create",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(permission1)
    db.add(permission2)

    role = Role(
        id=1,
        name="Test Role",
        slug="test-role",
        is_system_role=True,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(role)
    db.commit()

    role.permissions.append(permission1)
    role.permissions.append(permission2)

    user = User(
        id=1,
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="User",
        institution_id=1,
        role_id=1,
        is_active=True,
        is_superuser=False,
        email_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


def test_login_success():
    mock_redis.get.return_value = None

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_login_nonexistent_user():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 401


def test_forgot_password():
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "test@example.com"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_forgot_password_nonexistent_email():
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent@example.com"},
    )

    assert response.status_code == 200


def test_get_current_user_info():
    mock_redis.get.return_value = '{"user_id": 1, "institution_id": 1, "role_id": 1}'

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "permissions" in data
    assert "role" in data
    assert "institution" in data


def test_protected_endpoint_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403


def test_protected_endpoint_with_invalid_token():
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
