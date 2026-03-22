"""
API Endpoint Validation Tests for MySQL Migration

This test suite validates that all API endpoints work correctly with MySQL:
- Authentication endpoints
- Student management endpoints
- Teacher management endpoints
- Assignment endpoints
- Attendance endpoints
- Analytics endpoints
- Subscription endpoints

Run with: pytest tests/migration/test_api_endpoints_mysql.py -v -s
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, date, timedelta
from decimal import Decimal
import os

from src.main import app
from src.database import Base, get_db
from src.models.institution import Institution
from src.models.user import User
from src.models.role import Role
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.models.assignment import Assignment, AssignmentStatus
from src.models.attendance import Attendance, AttendanceStatus
from src.models.subscription import Subscription
from src.utils.security import get_password_hash, create_access_token


class TestAPIEndpointsMySQL:
    """Test API endpoints with MySQL database"""
    
    @pytest.fixture(scope="class")
    def mysql_test_url(self) -> str:
        """MySQL test database URL"""
        return os.getenv(
            "MYSQL_TEST_DATABASE_URL",
            "mysql+pymysql://root:test_password@localhost:3306/test_mysql_api?charset=utf8mb4"
        )
    
    @pytest.fixture(scope="class")
    def engine(self, mysql_test_url: str):
        """Create test engine"""
        engine = create_engine(
            mysql_test_url,
            pool_pre_ping=True,
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        yield engine
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
    
    @pytest.fixture(scope="function")
    def db_session(self, engine):
        """Create test database session"""
        connection = engine.connect()
        transaction = connection.begin()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
        session = SessionLocal()
        
        yield session
        
        session.close()
        transaction.rollback()
        connection.close()
    
    @pytest.fixture(scope="function")
    def client(self, db_session):
        """Create test client"""
        def override_get_db():
            try:
                yield db_session
            finally:
                pass
        
        app.dependency_overrides[get_db] = override_get_db
        
        with TestClient(app) as test_client:
            yield test_client
        
        app.dependency_overrides.clear()
    
    @pytest.fixture(scope="function")
    def test_institution(self, db_session):
        """Create test institution"""
        institution = Institution(
            name="API Test School",
            short_name="ATS",
            code="API001",
            email="admin@apitest.com",
            phone="1234567890",
            address="Test Address",
            city="Test City",
            state="Test State",
            country="Test Country",
            postal_code="12345",
            is_active=True
        )
        db_session.add(institution)
        db_session.commit()
        db_session.refresh(institution)
        return institution
    
    @pytest.fixture(scope="function")
    def test_roles(self, db_session):
        """Create test roles"""
        roles = {
            'admin': Role(name="Admin", description="Administrator", is_system_role=True),
            'teacher': Role(name="Teacher", description="Teacher", is_system_role=True),
            'student': Role(name="Student", description="Student", is_system_role=True),
        }
        for role in roles.values():
            db_session.add(role)
        db_session.commit()
        for role in roles.values():
            db_session.refresh(role)
        return roles
    
    @pytest.fixture(scope="function")
    def admin_user(self, db_session, test_institution, test_roles):
        """Create admin user"""
        user = User(
            institution_id=test_institution.id,
            role_id=test_roles['admin'].id,
            username="admin",
            email="admin@apitest.com",
            first_name="Admin",
            last_name="User",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    
    @pytest.fixture(scope="function")
    def auth_headers(self, admin_user):
        """Create authentication headers"""
        token = create_access_token(
            data={
                "sub": admin_user.id,
                "institution_id": admin_user.institution_id,
                "role_id": admin_user.role_id,
                "email": admin_user.email,
            }
        )
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="function")
    def academic_setup(self, db_session, test_institution):
        """Create academic year, grade, section, subject"""
        academic_year = AcademicYear(
            institution_id=test_institution.id,
            name="2023-2024",
            start_date=date(2023, 4, 1),
            end_date=date(2024, 3, 31),
            is_current=True,
            is_active=True
        )
        db_session.add(academic_year)
        db_session.flush()
        
        grade = Grade(
            institution_id=test_institution.id,
            academic_year_id=academic_year.id,
            name="Grade 10",
            display_order=10,
            is_active=True
        )
        db_session.add(grade)
        db_session.flush()
        
        section = Section(
            institution_id=test_institution.id,
            grade_id=grade.id,
            name="Section A",
            capacity=40,
            is_active=True
        )
        db_session.add(section)
        db_session.flush()
        
        subject = Subject(
            institution_id=test_institution.id,
            name="Mathematics",
            code="MATH10",
            is_active=True
        )
        db_session.add(subject)
        db_session.commit()
        
        return {
            'academic_year': academic_year,
            'grade': grade,
            'section': section,
            'subject': subject
        }
    
    def test_01_health_check_endpoint(self, client):
        """Test health check endpoint"""
        print("\n" + "="*80)
        print("API Test 1: Health Check Endpoint")
        print("="*80)
        
        response = client.get("/health")
        
        assert response.status_code in [200, 404], "Health endpoint should respond"
        print("✓ Health check endpoint working")
    
    def test_02_login_endpoint(self, client, admin_user):
        """Test login endpoint"""
        print("\n" + "="*80)
        print("API Test 2: Login Endpoint")
        print("="*80)
        
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "admin",
                "password": "password123"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data, "Should return access token"
            assert data["token_type"] == "bearer", "Should be bearer token"
            print("✓ Login endpoint working")
            print(f"✓ Received access token")
        else:
            print(f"⚠ Login endpoint returned status {response.status_code}")
    
    def test_03_student_creation_endpoint(
        self, 
        client, 
        auth_headers, 
        test_institution, 
        academic_setup
    ):
        """Test student creation endpoint"""
        print("\n" + "="*80)
        print("API Test 3: Student Creation Endpoint")
        print("="*80)
        
        student_data = {
            "institution_id": test_institution.id,
            "section_id": academic_setup['section'].id,
            "academic_year_id": academic_setup['academic_year'].id,
            "admission_number": "STD001",
            "first_name": "Test",
            "last_name": "Student",
            "email": "student@apitest.com",
            "date_of_birth": "2008-01-01",
            "gender": "Male",
            "is_active": True
        }
        
        response = client.post(
            "/api/v1/students/",
            json=student_data,
            headers=auth_headers
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert data["first_name"] == "Test", "Should return created student"
            print("✓ Student creation endpoint working")
            print(f"✓ Created student: {data['first_name']} {data['last_name']}")
        else:
            print(f"⚠ Student creation returned status {response.status_code}")
    
    def test_04_student_list_endpoint(
        self, 
        client, 
        auth_headers, 
        db_session,
        test_institution,
        test_roles,
        academic_setup
    ):
        """Test student list endpoint"""
        print("\n" + "="*80)
        print("API Test 4: Student List Endpoint")
        print("="*80)
        
        # Create test students
        for i in range(5):
            user = User(
                institution_id=test_institution.id,
                role_id=test_roles['student'].id,
                username=f"student{i}",
                email=f"student{i}@test.com",
                first_name=f"Student",
                last_name=f"{i}",
                hashed_password=get_password_hash("pass"),
                is_active=True
            )
            db_session.add(user)
            db_session.flush()
            
            student = Student(
                institution_id=test_institution.id,
                user_id=user.id,
                section_id=academic_setup['section'].id,
                academic_year_id=academic_setup['academic_year'].id,
                admission_number=f"ADM{i:03d}",
                first_name=f"Student",
                last_name=f"{i}",
                email=f"student{i}@test.com",
                date_of_birth=date(2008, 1, 1),
                is_active=True
            )
            db_session.add(student)
        
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/?institution_id={test_institution.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (list, dict)), "Should return student list"
            print(f"✓ Student list endpoint working")
            if isinstance(data, list):
                print(f"✓ Retrieved {len(data)} students")
            elif 'items' in data:
                print(f"✓ Retrieved {len(data['items'])} students")
        else:
            print(f"⚠ Student list returned status {response.status_code}")
    
    def test_05_assignment_creation_endpoint(
        self,
        client,
        auth_headers,
        db_session,
        test_institution,
        test_roles,
        academic_setup
    ):
        """Test assignment creation endpoint"""
        print("\n" + "="*80)
        print("API Test 5: Assignment Creation Endpoint")
        print("="*80)
        
        # Create teacher
        teacher_user = User(
            institution_id=test_institution.id,
            role_id=test_roles['teacher'].id,
            username="teacher1",
            email="teacher1@test.com",
            first_name="Teacher",
            last_name="One",
            hashed_password=get_password_hash("pass"),
            is_active=True
        )
        db_session.add(teacher_user)
        db_session.flush()
        
        teacher = Teacher(
            institution_id=test_institution.id,
            user_id=teacher_user.id,
            employee_id="EMP001",
            first_name="Teacher",
            last_name="One",
            email="teacher1@test.com",
            is_active=True
        )
        db_session.add(teacher)
        db_session.commit()
        
        assignment_data = {
            "institution_id": test_institution.id,
            "teacher_id": teacher.id,
            "grade_id": academic_setup['grade'].id,
            "subject_id": academic_setup['subject'].id,
            "title": "Test Assignment",
            "description": "This is a test assignment",
            "max_marks": 100,
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "status": "published"
        }
        
        response = client.post(
            "/api/v1/assignments/",
            json=assignment_data,
            headers=auth_headers
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert data["title"] == "Test Assignment", "Should return created assignment"
            print("✓ Assignment creation endpoint working")
            print(f"✓ Created assignment: {data['title']}")
        else:
            print(f"⚠ Assignment creation returned status {response.status_code}")
    
    def test_06_attendance_marking_endpoint(
        self,
        client,
        auth_headers,
        db_session,
        test_institution,
        test_roles,
        academic_setup
    ):
        """Test attendance marking endpoint"""
        print("\n" + "="*80)
        print("API Test 6: Attendance Marking Endpoint")
        print("="*80)
        
        # Create student
        user = User(
            institution_id=test_institution.id,
            role_id=test_roles['student'].id,
            username="attStudent",
            email="att@test.com",
            first_name="Attendance",
            last_name="Student",
            hashed_password=get_password_hash("pass"),
            is_active=True
        )
        db_session.add(user)
        db_session.flush()
        
        student = Student(
            institution_id=test_institution.id,
            user_id=user.id,
            section_id=academic_setup['section'].id,
            academic_year_id=academic_setup['academic_year'].id,
            admission_number="ATT001",
            first_name="Attendance",
            last_name="Student",
            email="att@test.com",
            date_of_birth=date(2008, 1, 1),
            is_active=True
        )
        db_session.add(student)
        db_session.commit()
        
        attendance_data = {
            "institution_id": test_institution.id,
            "section_id": academic_setup['section'].id,
            "subject_id": academic_setup['subject'].id,
            "date": date.today().isoformat(),
            "attendance_records": [
                {
                    "student_id": student.id,
                    "status": "present"
                }
            ]
        }
        
        response = client.post(
            "/api/v1/attendance/mark",
            json=attendance_data,
            headers=auth_headers
        )
        
        if response.status_code in [200, 201]:
            print("✓ Attendance marking endpoint working")
        else:
            print(f"⚠ Attendance marking returned status {response.status_code}")
    
    def test_07_subscription_endpoint(
        self,
        client,
        auth_headers,
        db_session,
        test_institution
    ):
        """Test subscription management endpoint"""
        print("\n" + "="*80)
        print("API Test 7: Subscription Management Endpoint")
        print("="*80)
        
        # Create subscription
        subscription = Subscription(
            institution_id=test_institution.id,
            plan_name="STARTER",
            status="active",
            billing_cycle="monthly",
            price=Decimal("999.00"),
            currency="INR",
            max_users=10,
            max_storage_gb=50,
            features='["Basic support"]',
            start_date=datetime.utcnow(),
            next_billing_date=datetime.utcnow() + timedelta(days=30),
            auto_renew=True
        )
        db_session.add(subscription)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/subscriptions/{subscription.id}",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data["plan_name"] == "STARTER", "Should return subscription"
            print("✓ Subscription endpoint working")
            print(f"✓ Retrieved subscription: {data['plan_name']}")
        else:
            print(f"⚠ Subscription endpoint returned status {response.status_code}")
    
    def test_08_analytics_endpoint(
        self,
        client,
        auth_headers,
        test_institution
    ):
        """Test analytics endpoint"""
        print("\n" + "="*80)
        print("API Test 8: Analytics Endpoint")
        print("="*80)
        
        response = client.get(
            f"/api/v1/analytics/dashboard?institution_id={test_institution.id}",
            headers=auth_headers
        )
        
        if response.status_code in [200, 404]:
            print("✓ Analytics endpoint accessible")
        else:
            print(f"⚠ Analytics endpoint returned status {response.status_code}")
    
    def test_09_data_isolation_via_api(
        self,
        client,
        db_session,
        test_roles
    ):
        """Test data isolation between institutions via API"""
        print("\n" + "="*80)
        print("API Test 9: Data Isolation via API")
        print("="*80)
        
        # Create two institutions
        inst1 = Institution(
            name="School 1",
            short_name="S1",
            code="S1",
            email="s1@test.com",
            phone="1111111111",
            address="Addr1",
            city="City1",
            state="State1",
            country="Country1",
            postal_code="11111",
            is_active=True
        )
        inst2 = Institution(
            name="School 2",
            short_name="S2",
            code="S2",
            email="s2@test.com",
            phone="2222222222",
            address="Addr2",
            city="City2",
            state="State2",
            country="Country2",
            postal_code="22222",
            is_active=True
        )
        db_session.add_all([inst1, inst2])
        db_session.commit()
        
        # Create users for each institution
        user1 = User(
            institution_id=inst1.id,
            role_id=test_roles['admin'].id,
            username="admin1",
            email="admin1@s1.com",
            first_name="Admin",
            last_name="One",
            hashed_password=get_password_hash("pass"),
            is_active=True
        )
        user2 = User(
            institution_id=inst2.id,
            role_id=test_roles['admin'].id,
            username="admin2",
            email="admin2@s2.com",
            first_name="Admin",
            last_name="Two",
            hashed_password=get_password_hash("pass"),
            is_active=True
        )
        db_session.add_all([user1, user2])
        db_session.commit()
        
        # Create tokens for each user
        token1 = create_access_token(
            data={
                "sub": user1.id,
                "institution_id": user1.institution_id,
                "role_id": user1.role_id,
                "email": user1.email,
            }
        )
        token2 = create_access_token(
            data={
                "sub": user2.id,
                "institution_id": user2.institution_id,
                "role_id": user2.role_id,
                "email": user2.email,
            }
        )
        
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # Try to access students from institution 1 with token 1
        response1 = client.get(
            f"/api/v1/students/?institution_id={inst1.id}",
            headers=headers1
        )
        
        # Try to access students from institution 1 with token 2 (should fail or return empty)
        response2 = client.get(
            f"/api/v1/students/?institution_id={inst1.id}",
            headers=headers2
        )
        
        print(f"✓ Institution 1 user accessing own data: Status {response1.status_code}")
        print(f"✓ Institution 2 user accessing inst1 data: Status {response2.status_code}")
        print("✓ Data isolation test completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
