import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from faker import Faker
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
import boto3
from moto import mock_aws

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
from src.models.subscription import Subscription, Payment, Invoice
from src.utils.security import get_password_hash
from src.utils.session import SessionManager

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
        mock_redis.expire.return_value = True
        mock_redis.ttl.return_value = 3600
        mock_redis.keys.return_value = []
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
def subscription(db_session: Session, institution: Institution) -> Subscription:
    """Create a test subscription."""
    subscription = Subscription(
        institution_id=institution.id,
        plan_name="STARTER",
        status="active",
        billing_cycle="monthly",
        price=Decimal("999.00"),
        currency="INR",
        max_users=10,
        max_storage_gb=50,
        features='["Basic support", "Email notifications"]',
        start_date=datetime.utcnow(),
        next_billing_date=datetime.utcnow() + timedelta(days=30),
        auto_renew=True,
    )
    db_session.add(subscription)
    db_session.commit()
    db_session.refresh(subscription)
    return subscription


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
def mock_redis():
    """Mock Redis client for testing."""
    mock = AsyncMock()
    mock.get.return_value = None
    mock.set.return_value = True
    mock.delete.return_value = True
    mock.exists.return_value = False
    mock.expire.return_value = True
    mock.ttl.return_value = 3600
    mock.keys.return_value = []
    mock.hset.return_value = True
    mock.hget.return_value = None
    mock.hdel.return_value = True
    return mock


@pytest.fixture
def mock_session_manager(mock_redis):
    """Mock SessionManager for testing."""
    return SessionManager(mock_redis)


@pytest.fixture
def mock_sendgrid():
    """Mock SendGrid client for testing."""
    with patch('sendgrid.SendGridAPIClient') as mock_sg:
        mock_client = MagicMock()
        mock_client.send.return_value = MagicMock(status_code=202)
        mock_sg.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_s3():
    """Mock S3 client for testing."""
    with mock_aws():
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_client.create_bucket(Bucket='test-bucket')
        yield s3_client


@pytest.fixture
def mock_razorpay():
    """Mock Razorpay client for testing."""
    mock = MagicMock()
    mock.order.create.return_value = {
        'id': 'order_test123',
        'amount': 99900,
        'currency': 'INR',
        'status': 'created'
    }
    mock.payment.fetch.return_value = {
        'id': 'pay_test123',
        'order_id': 'order_test123',
        'status': 'captured',
        'amount': 99900
    }
    return mock


@pytest.fixture
def parent_role(db_session: Session) -> Role:
    """Create parent role."""
    role = Role(
        name="Parent",
        description="Parent role",
        is_system_role=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def parent_user(db_session: Session, institution: Institution, parent_role: Role) -> User:
    """Create a parent user for testing."""
    from src.models.student import Parent
    
    user = User(
        username="parent1",
        email="parent@testschool.com",
        first_name="John",
        last_name="Parent",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=parent_role.id,
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create parent profile
    parent = Parent(
        institution_id=institution.id,
        user_id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone="+1234567890",
        relation_type="father",
        is_primary_contact=True,
        is_active=True,
    )
    db_session.add(parent)
    db_session.commit()
    db_session.refresh(parent)
    
    return user


@pytest.fixture
def user_factory():
    """Factory for creating User objects."""
    from tests.factories import UserFactory
    return UserFactory


@pytest.fixture
def institution_factory():
    """Factory for creating Institution objects."""
    from tests.factories import InstitutionFactory
    return InstitutionFactory


@pytest.fixture
def student_factory():
    """Factory for creating Student objects."""
    from tests.factories import StudentFactory
    return StudentFactory


@pytest.fixture
def teacher_factory():
    """Factory for creating Teacher objects."""
    from tests.factories import TeacherFactory
    return TeacherFactory


@pytest.fixture
def assignment_factory():
    """Factory for creating Assignment objects."""
    from tests.factories import AssignmentFactory
    return AssignmentFactory


@pytest.fixture
def attendance_factory():
    """Factory for creating Attendance objects."""
    from tests.factories import AttendanceFactory
    return AttendanceFactory


@pytest.fixture
def exam_factory():
    """Factory for creating Exam objects."""
    from tests.factories import ExamFactory
    return ExamFactory


@pytest.fixture
def subscription_factory():
    """Factory for creating Subscription objects."""
    from tests.factories import SubscriptionFactory
    return SubscriptionFactory


@pytest.fixture
def role_factory():
    """Factory for creating Role objects."""
    from tests.factories import RoleFactory
    return RoleFactory


@pytest.fixture
def academic_year_factory():
    """Factory for creating AcademicYear objects."""
    from tests.factories import AcademicYearFactory
    return AcademicYearFactory


@pytest.fixture
def grade_factory():
    """Factory for creating Grade objects."""
    from tests.factories import GradeFactory
    return GradeFactory


@pytest.fixture
def section_factory():
    """Factory for creating Section objects."""
    from tests.factories import SectionFactory
    return SectionFactory


@pytest.fixture
def subject_factory():
    """Factory for creating Subject objects."""
    from tests.factories import SubjectFactory
    return SubjectFactory


@pytest.fixture
def generate_class_with_students(db_session: Session):
    """Helper fixture for generating a complete class setup."""
    from tests.factories import generate_class_with_students as _generate_class
    
    def _wrapper(institution_id: int, academic_year_id: int, **kwargs):
        return _generate_class(db_session, institution_id, academic_year_id, **kwargs)
    
    return _wrapper


@pytest.fixture
def generate_complete_academic_setup(db_session: Session):
    """Helper fixture for generating a complete academic setup."""
    from tests.factories import generate_complete_academic_setup as _generate_setup
    
    def _wrapper(institution_id: int, **kwargs):
        return _generate_setup(db_session, institution_id, **kwargs)
    
    return _wrapper


@pytest.fixture
def generate_exam_with_schedule(db_session: Session):
    """Helper fixture for generating an exam with complete schedule."""
    from tests.factories import generate_exam_with_schedule as _generate_exam
    
    def _wrapper(institution_id: int, academic_year_id: int, grade_id: int, subject_ids, **kwargs):
        return _generate_exam(db_session, institution_id, academic_year_id, grade_id, subject_ids, **kwargs)
    
    return _wrapper


@pytest.fixture
def generate_student_attendance_history(db_session: Session):
    """Helper fixture for generating attendance history."""
    from tests.factories import generate_student_attendance_history as _generate_attendance
    
    def _wrapper(institution_id: int, student_id: int, section_id: int, subject_id: int, **kwargs):
        return _generate_attendance(db_session, institution_id, student_id, section_id, subject_id, **kwargs)
    
    return _wrapper


@pytest.fixture
def create_bulk_students(db_session: Session):
    """Helper fixture for creating bulk students."""
    from tests.factories import create_bulk_students as _create_bulk
    
    def _wrapper(institution_id: int, section_id: int, count: int = 10):
        return _create_bulk(db_session, institution_id, section_id, count)
    
    return _wrapper


@pytest.fixture
def create_bulk_teachers(db_session: Session):
    """Helper fixture for creating bulk teachers."""
    from tests.factories import create_bulk_teachers as _create_bulk
    
    def _wrapper(institution_id: int, count: int = 5):
        return _create_bulk(db_session, institution_id, count)
    
    return _wrapper


@pytest.fixture
def create_bulk_assignments(db_session: Session):
    """Helper fixture for creating bulk assignments."""
    from tests.factories import create_bulk_assignments as _create_bulk
    
    def _wrapper(institution_id: int, teacher_id: int, grade_id: int, subject_id: int, count: int = 5):
        return _create_bulk(db_session, institution_id, teacher_id, grade_id, subject_id, count)
    
    return _wrapper
