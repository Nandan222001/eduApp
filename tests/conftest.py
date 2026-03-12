import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from faker import Faker
from datetime import datetime, timedelta

from src.database import Base, get_db
from src.main import app
from src.redis_client import init_redis, close_redis, get_redis
from src.models.user import User
from src.models.role import Role
from src.models.permission import Permission
from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.utils.security import get_password_hash
from unittest.mock import AsyncMock

fake = Faker()

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create a new database session for a test."""
    Base.metadata.create_all(bind=engine)
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    # Mock Redis for testing
    async def mock_get_redis():
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None
        mock_redis.set.return_value = True
        mock_redis.delete.return_value = True
        mock_redis.exists.return_value = False
        return mock_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = mock_get_redis

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def institution(db_session: Session) -> Institution:
    """Create a test institution."""
    institution = Institution(
        name="Test School",
        short_name="TS",
        code="TEST001",
        email="admin@testschool.com",
        phone="+1234567890",
        address="123 Test Street",
        city="Test City",
        state="Test State",
        country="Test Country",
        postal_code="12345",
        website="https://testschool.com",
        is_active=True,
    )
    db_session.add(institution)
    db_session.commit()
    db_session.refresh(institution)
    return institution


@pytest.fixture
def admin_role(db_session: Session) -> Role:
    """Create admin role."""
    role = Role(
        name="Admin",
        description="Administrator role",
        is_system_role=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def teacher_role(db_session: Session) -> Role:
    """Create teacher role."""
    role = Role(
        name="Teacher",
        description="Teacher role",
        is_system_role=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def student_role(db_session: Session) -> Role:
    """Create student role."""
    role = Role(
        name="Student",
        description="Student role",
        is_system_role=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def admin_user(db_session: Session, institution: Institution, admin_role: Role) -> User:
    """Create an admin user for testing."""
    user = User(
        username="admin",
        email="admin@testschool.com",
        first_name="Admin",
        last_name="User",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=admin_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def teacher_user(db_session: Session, institution: Institution, teacher_role: Role) -> User:
    """Create a teacher user for testing."""
    user = User(
        username="teacher1",
        email="teacher1@testschool.com",
        first_name="John",
        last_name="Teacher",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=teacher_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def student_user(db_session: Session, institution: Institution, student_role: Role) -> User:
    """Create a student user for testing."""
    user = User(
        username="student1",
        email="student1@testschool.com",
        first_name="Jane",
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
def academic_year(db_session: Session, institution: Institution) -> AcademicYear:
    """Create an academic year."""
    year = AcademicYear(
        institution_id=institution.id,
        name="2023-2024",
        start_date=datetime(2023, 4, 1).date(),
        end_date=datetime(2024, 3, 31).date(),
        is_current=True,
        is_active=True,
    )
    db_session.add(year)
    db_session.commit()
    db_session.refresh(year)
    return year


@pytest.fixture
def grade(db_session: Session, institution: Institution, academic_year: AcademicYear) -> Grade:
    """Create a grade."""
    grade = Grade(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        name="Grade 10",
        display_order=10,
        is_active=True,
    )
    db_session.add(grade)
    db_session.commit()
    db_session.refresh(grade)
    return grade


@pytest.fixture
def section(db_session: Session, institution: Institution, grade: Grade) -> Section:
    """Create a section."""
    section = Section(
        institution_id=institution.id,
        grade_id=grade.id,
        name="Section A",
        capacity=40,
        is_active=True,
    )
    db_session.add(section)
    db_session.commit()
    db_session.refresh(section)
    return section


@pytest.fixture
def subject(db_session: Session, institution: Institution, grade: Grade) -> Subject:
    """Create a subject."""
    subject = Subject(
        institution_id=institution.id,
        grade_id=grade.id,
        name="Mathematics",
        code="MATH10",
        description="Mathematics for Grade 10",
        is_active=True,
    )
    db_session.add(subject)
    db_session.commit()
    db_session.refresh(subject)
    return subject


@pytest.fixture
def teacher(db_session: Session, institution: Institution, teacher_user: User) -> Teacher:
    """Create a teacher."""
    teacher = Teacher(
        institution_id=institution.id,
        user_id=teacher_user.id,
        employee_id="EMP001",
        first_name=teacher_user.first_name,
        last_name=teacher_user.last_name,
        email=teacher_user.email,
        phone="+1234567890",
        date_of_birth=datetime(1985, 5, 15).date(),
        date_of_joining=datetime(2020, 6, 1).date(),
        qualification="M.Sc Mathematics",
        specialization="Mathematics",
        is_active=True,
    )
    db_session.add(teacher)
    db_session.commit()
    db_session.refresh(teacher)
    return teacher


@pytest.fixture
def student(
    db_session: Session,
    institution: Institution,
    student_user: User,
    section: Section,
    academic_year: AcademicYear,
) -> Student:
    """Create a student."""
    student = Student(
        institution_id=institution.id,
        user_id=student_user.id,
        admission_number="ADM001",
        first_name=student_user.first_name,
        last_name=student_user.last_name,
        email=student_user.email,
        section_id=section.id,
        academic_year_id=academic_year.id,
        date_of_birth=datetime(2008, 3, 20).date(),
        date_of_admission=datetime(2020, 4, 1).date(),
        gender="Female",
        blood_group="O+",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def auth_headers(admin_user: User) -> dict:
    """Create authentication headers for testing."""
    from src.utils.security import create_access_token
    token = create_access_token(
        data={
            "sub": admin_user.id,
            "institution_id": admin_user.institution_id,
            "role_id": admin_user.role_id,
            "email": admin_user.email,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_s3_client(monkeypatch):
    """Mock S3 client for file upload tests."""
    from unittest.mock import MagicMock
    mock_s3 = MagicMock()
    mock_s3.upload_fileobj.return_value = None
    mock_s3.generate_presigned_url.return_value = "https://example.com/test-file.pdf"
    mock_s3.delete_object.return_value = None
    return mock_s3


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    mock = AsyncMock()
    mock.get.return_value = None
    mock.set.return_value = True
    mock.delete.return_value = True
    mock.exists.return_value = False
    mock.expire.return_value = True
    mock.ttl.return_value = 3600
    return mock
