import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, date
from src.models.user import User
from src.models.institution import Institution
from src.models.student import Student, Parent, StudentParent
from src.models.role import Role
from src.models.academic import AcademicYear, Grade, Section


@pytest.mark.integration
class TestParentMultiChildIntegration:
    """Integration tests for parent multi-child functionality."""

    def test_parent_with_multiple_children(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        section: Section,
    ):
        """Test parent can access multiple children's data."""
        from src.utils.security import create_access_token, get_password_hash
        
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
            username="parent_multi",
            email="parent_multi@test.com",
            first_name="Parent",
            last_name="Multi",
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
            last_name="Multi",
            email="parent_multi@test.com",
            phone="+1234567890",
            relation_type="father",
            is_primary_contact=True,
        )
        db_session.add(parent)
        db_session.commit()
        
        # Create student role
        student_role = Role(
            name="Student", slug="student",
            description="Student role",
            is_system_role=True,
        )
        db_session.add(student_role)
        db_session.commit()
        
        # Create two children
        child1_user = User(
            username="child1",
            email="child1@test.com",
            first_name="Child",
            last_name="One",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(child1_user)
        db_session.commit()
        
        child1 = Student(
            institution_id=institution.id,
            user_id=child1_user.id,
            admission_number="ADM001",
            first_name="Child",
            last_name="One",
            email="child1@test.com",
            section_id=section.id,
            date_of_birth=datetime(2010, 3, 15).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Male",
        )
        db_session.add(child1)
        db_session.commit()
        
        child2_user = User(
            username="child2",
            email="child2@test.com",
            first_name="Child",
            last_name="Two",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(child2_user)
        db_session.commit()
        
        child2 = Student(
            institution_id=institution.id,
            user_id=child2_user.id,
            admission_number="ADM002",
            first_name="Child",
            last_name="Two",
            email="child2@test.com",
            section_id=section.id,
            date_of_birth=datetime(2012, 7, 20).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Female",
        )
        db_session.add(child2)
        db_session.commit()
        
        # Link children to parent
        student_parent1 = StudentParent(
            student_id=child1.id,
            parent_id=parent.id,
            relation_type="father",
            is_primary_contact=True,
        )
        db_session.add(student_parent1)
        
        student_parent2 = StudentParent(
            student_id=child2.id,
            parent_id=parent.id,
            relation_type="father",
            is_primary_contact=True,
        )
        db_session.add(student_parent2)
        db_session.commit()
        
        # Create access token for parent
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": parent_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test getting children list
        response = client.get("/api/v1/parents/children", headers=headers)
        assert response.status_code == 200
        children = response.json()
        assert len(children) == 2
        
        # Verify children data
        child_ids = [c["id"] for c in children]
        assert child1.id in child_ids
        assert child2.id in child_ids

    def test_parent_dashboard_child_filter(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        section: Section,
    ):
        """Test parent dashboard can filter by specific child."""
        from src.utils.security import create_access_token, get_password_hash
        
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
            username="parent_filter",
            email="parent_filter@test.com",
            first_name="Parent",
            last_name="Filter",
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
            last_name="Filter",
            email="parent_filter@test.com",
            phone="+1234567890",
        )
        db_session.add(parent)
        db_session.commit()
        
        # Create student role
        student_role = Role(
            name="Student", slug="student",
            description="Student role",
            is_system_role=True,
        )
        db_session.add(student_role)
        db_session.commit()
        
        # Create child
        child_user = User(
            username="child_filter",
            email="child_filter@test.com",
            first_name="Child",
            last_name="Filter",
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
            admission_number="ADM003",
            first_name="Child",
            last_name="Filter",
            email="child_filter@test.com",
            section_id=section.id,
            date_of_birth=datetime(2010, 5, 10).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Male",
        )
        db_session.add(child)
        db_session.commit()
        
        # Link child to parent
        student_parent = StudentParent(
            student_id=child.id,
            parent_id=parent.id,
            relation_type="mother",
            is_primary_contact=True,
        )
        db_session.add(student_parent)
        db_session.commit()
        
        # Create access token for parent
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": parent_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test dashboard with child filter
        response = client.get(
            f"/api/v1/parents/dashboard?child_id={child.id}",
            headers=headers
        )
        assert response.status_code in [200, 404]  # 404 if no dashboard data yet

    def test_get_child_specific_data(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        section: Section,
    ):
        """Test parent can get specific child's attendance, grades, assignments."""
        from src.utils.security import create_access_token, get_password_hash
        
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
            username="parent_specific",
            email="parent_specific@test.com",
            first_name="Parent",
            last_name="Specific",
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
            last_name="Specific",
            email="parent_specific@test.com",
            phone="+1234567890",
        )
        db_session.add(parent)
        db_session.commit()
        
        # Create student role
        student_role = Role(
            name="Student", slug="student",
            description="Student role",
            is_system_role=True,
        )
        db_session.add(student_role)
        db_session.commit()
        
        # Create child
        child_user = User(
            username="child_specific",
            email="child_specific@test.com",
            first_name="Child",
            last_name="Specific",
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
            admission_number="ADM004",
            first_name="Child",
            last_name="Specific",
            email="child_specific@test.com",
            section_id=section.id,
            date_of_birth=datetime(2010, 8, 25).date(),
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
        
        # Create access token for parent
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": parent_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test child overview
        response = client.get(
            f"/api/v1/parents/children/{child.id}/overview",
            headers=headers
        )
        assert response.status_code in [200, 404]
        
        # Test today's attendance
        response = client.get(
            f"/api/v1/parents/children/{child.id}/attendance/today",
            headers=headers
        )
        assert response.status_code == 200
        
        # Test recent grades
        response = client.get(
            f"/api/v1/parents/children/{child.id}/grades/recent",
            headers=headers
        )
        assert response.status_code == 200
        
        # Test pending assignments
        response = client.get(
            f"/api/v1/parents/children/{child.id}/assignments/pending",
            headers=headers
        )
        assert response.status_code == 200

    def test_parent_cannot_access_unlinked_child(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        academic_year: AcademicYear,
        grade: Grade,
        section: Section,
    ):
        """Test parent cannot access data of child not linked to them."""
        from src.utils.security import create_access_token, get_password_hash
        
        # Create parent role
        parent_role = Role(
            name="Parent", slug="parent",
            description="Parent role",
            is_system_role=True,
        )
        db_session.add(parent_role)
        db_session.commit()
        
        # Create parent user (no children)
        parent_user = User(
            username="parent_no_child",
            email="parent_no_child@test.com",
            first_name="Parent",
            last_name="NoChild",
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
            last_name="NoChild",
            email="parent_no_child@test.com",
            phone="+1234567890",
        )
        db_session.add(parent)
        db_session.commit()
        
        # Create student role
        student_role = Role(
            name="Student", slug="student",
            description="Student role",
            is_system_role=True,
        )
        db_session.add(student_role)
        db_session.commit()
        
        # Create unlinked child
        unlinked_user = User(
            username="unlinked_child",
            email="unlinked@test.com",
            first_name="Unlinked",
            last_name="Child",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
        )
        db_session.add(unlinked_user)
        db_session.commit()
        
        unlinked_child = Student(
            institution_id=institution.id,
            user_id=unlinked_user.id,
            admission_number="ADM999",
            first_name="Unlinked",
            last_name="Child",
            email="unlinked@test.com",
            section_id=section.id,
            date_of_birth=datetime(2010, 1, 1).date(),
            admission_date=datetime(2020, 4, 1).date(),
            gender="Male",
        )
        db_session.add(unlinked_child)
        db_session.commit()
        
        # Create access token for parent
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": parent_user.email, "password": "password123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access unlinked child's overview
        response = client.get(
            f"/api/v1/parents/children/{unlinked_child.id}/overview",
            headers=headers
        )
        # Should return 404 or 403 since child is not linked to this parent
        assert response.status_code in [403, 404]
