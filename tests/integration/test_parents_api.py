import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.student import Student, Parent, StudentParent
from src.models.academic import AcademicYear, Grade, Section, Subject, Term, TermType
from src.models.attendance import Attendance, AttendanceSummary, AttendanceStatus
from src.models.assignment import Assignment, Submission, AssignmentStatus, SubmissionStatus
from src.models.examination import Exam, ExamResult, ExamSubject, ExamMarks, ExamType, ExamStatus
from src.models.teacher import Teacher
from src.utils.security import create_access_token, get_password_hash


@pytest.fixture
def parent_user_with_profile(
    db_session: Session,
    institution: Institution,
    parent_role: Role
) -> tuple[User, Parent]:
    user = User(
        username="test_parent",
        email="testparent@test.com",
        first_name="Test",
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
    
    return user, parent


@pytest.fixture
def parent_auth_headers(parent_user_with_profile: tuple[User, Parent]) -> dict:
    user, _ = parent_user_with_profile
    token = create_access_token(
        data={
            "sub": user.id,
            "institution_id": user.institution_id,
            "role_id": user.role_id,
            "email": user.email,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def child_student(
    db_session: Session,
    institution: Institution,
    student_role: Role,
    section: Section,
    academic_year: AcademicYear,
    parent_user_with_profile: tuple[User, Parent],
) -> Student:
    _, parent = parent_user_with_profile
    
    user = User(
        username="child_student",
        email="childstudent@test.com",
        first_name="Child",
        last_name="Student",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=student_role.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    student = Student(
        institution_id=institution.id,
        user_id=user.id,
        admission_number="CHD001",
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        section_id=section.id,
        date_of_birth=date(2010, 5, 15),
        date_of_admission=date(2020, 4, 1),
        gender="Male",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    
    student_parent = StudentParent(
        student_id=student.id,
        parent_id=parent.id,
        relation_type="father",
        is_primary_contact=True,
    )
    db_session.add(student_parent)
    db_session.commit()
    
    return student


@pytest.fixture
def second_child_student(
    db_session: Session,
    institution: Institution,
    student_role: Role,
    section: Section,
    academic_year: AcademicYear,
    parent_user_with_profile: tuple[User, Parent],
) -> Student:
    _, parent = parent_user_with_profile
    
    user = User(
        username="second_child",
        email="secondchild@test.com",
        first_name="Second",
        last_name="Child",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=student_role.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    student = Student(
        institution_id=institution.id,
        user_id=user.id,
        admission_number="CHD002",
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        section_id=section.id,
        date_of_birth=date(2012, 8, 20),
        date_of_admission=date(2020, 4, 1),
        gender="Female",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    
    student_parent = StudentParent(
        student_id=student.id,
        parent_id=parent.id,
        relation_type="father",
        is_primary_contact=True,
    )
    db_session.add(student_parent)
    db_session.commit()
    
    return student


@pytest.fixture
def unrelated_student(
    db_session: Session,
    institution: Institution,
    student_role: Role,
    section: Section,
) -> Student:
    user = User(
        username="unrelated_student",
        email="unrelated@test.com",
        first_name="Unrelated",
        last_name="Student",
        hashed_password=get_password_hash("password123"),
        institution_id=institution.id,
        role_id=student_role.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    student = Student(
        institution_id=institution.id,
        user_id=user.id,
        admission_number="UNR001",
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        section_id=section.id,
        date_of_birth=date(2010, 1, 10),
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    
    return student


@pytest.fixture
def term_fixture(
    db_session: Session,
    institution: Institution,
    academic_year: AcademicYear
) -> Term:
    term = Term(
        institution_id=institution.id,
        academic_year_id=academic_year.id,
        name="Term 1",
        term_type=TermType.SEMESTER,
        start_date=date(2023, 4, 1),
        end_date=date(2023, 9, 30),
        is_active=True,
    )
    db_session.add(term)
    db_session.commit()
    db_session.refresh(term)
    return term


@pytest.mark.integration
class TestParentDashboardAPI:
    """Integration tests for GET /api/v1/parents/dashboard"""

    def test_get_dashboard_with_single_child(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        db_session: Session,
    ):
        response = client.get(
            "/api/v1/parents/dashboard",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "parent_info" in data
        assert "children" in data
        assert isinstance(data["children"], list)
        assert len(data["children"]) >= 1

    def test_get_dashboard_with_multi_child_data_aggregation(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        second_child_student: Student,
        db_session: Session,
        subject: Subject,
    ):
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        attendance_child1 = AttendanceSummary(
            institution_id=child_student.institution_id,
            student_id=child_student.id,
            subject_id=None,
            month=current_month,
            year=current_year,
            total_days=20,
            present_days=18,
            absent_days=2,
            late_days=0,
            half_days=0,
            attendance_percentage=Decimal("90.00"),
        )
        db_session.add(attendance_child1)
        
        attendance_child2 = AttendanceSummary(
            institution_id=second_child_student.institution_id,
            student_id=second_child_student.id,
            subject_id=None,
            month=current_month,
            year=current_year,
            total_days=20,
            present_days=19,
            absent_days=1,
            late_days=0,
            half_days=0,
            attendance_percentage=Decimal("95.00"),
        )
        db_session.add(attendance_child2)
        db_session.commit()
        
        response = client.get(
            "/api/v1/parents/dashboard",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["children"]) == 2
        child_ids = [c["id"] for c in data["children"]]
        assert child_student.id in child_ids
        assert second_child_student.id in child_ids

    def test_get_dashboard_filter_by_specific_child(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        second_child_student: Student,
    ):
        response = client.get(
            f"/api/v1/parents/dashboard?child_id={child_student.id}",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "selected_child" in data
        if data["selected_child"]:
            assert data["selected_child"]["id"] == child_student.id

    def test_dashboard_without_authentication(
        self,
        client: TestClient,
    ):
        response = client.get("/api/v1/parents/dashboard")
        assert response.status_code == 403


@pytest.mark.integration
class TestParentChildrenListAPI:
    """Integration tests for GET /api/v1/parents/children"""

    def test_get_children_with_child_list(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        second_child_student: Student,
    ):
        response = client.get(
            "/api/v1/parents/children",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 2
        
        for child_data in data:
            assert "id" in child_data
            assert "first_name" in child_data
            assert "last_name" in child_data
            assert "admission_number" in child_data
            assert "section_name" in child_data
            assert "grade_name" in child_data

    def test_get_children_returns_only_parent_children(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        unrelated_student: Student,
    ):
        response = client.get(
            "/api/v1/parents/children",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        child_ids = [c["id"] for c in data]
        assert child_student.id in child_ids
        assert unrelated_student.id not in child_ids

    def test_get_children_without_authentication(
        self,
        client: TestClient,
    ):
        response = client.get("/api/v1/parents/children")
        assert response.status_code == 403


@pytest.mark.integration
class TestChildOverviewAPI:
    """Integration tests for GET /api/v1/parents/children/{childId}/overview"""

    def test_get_child_overview_with_attendance_grades_assignments(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        db_session: Session,
        academic_year: AcademicYear,
        grade: Grade,
        subject: Subject,
        teacher: Teacher,
    ):
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        attendance_summary = AttendanceSummary(
            institution_id=child_student.institution_id,
            student_id=child_student.id,
            subject_id=None,
            month=current_month,
            year=current_year,
            total_days=22,
            present_days=20,
            absent_days=2,
            late_days=0,
            half_days=0,
            attendance_percentage=Decimal("90.91"),
        )
        db_session.add(attendance_summary)
        
        exam = Exam(
            institution_id=child_student.institution_id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Mid Term Exam",
            exam_type=ExamType.MID_TERM,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() - timedelta(days=25),
            status=ExamStatus.COMPLETED,
            total_marks=Decimal("500"),
            passing_marks=Decimal("200"),
            is_published=True,
        )
        db_session.add(exam)
        db_session.flush()
        
        exam_subject = ExamSubject(
            institution_id=child_student.institution_id,
            exam_id=exam.id,
            subject_id=subject.id,
            theory_max_marks=Decimal("80"),
            practical_max_marks=Decimal("20"),
            theory_passing_marks=Decimal("32"),
            practical_passing_marks=Decimal("8"),
        )
        db_session.add(exam_subject)
        db_session.flush()
        
        exam_marks = ExamMarks(
            institution_id=child_student.institution_id,
            exam_subject_id=exam_subject.id,
            student_id=child_student.id,
            theory_marks_obtained=Decimal("72"),
            practical_marks_obtained=Decimal("18"),
            is_absent=False,
        )
        db_session.add(exam_marks)
        
        exam_result = ExamResult(
            institution_id=child_student.institution_id,
            exam_id=exam.id,
            student_id=child_student.id,
            section_id=child_student.section_id,
            total_marks_obtained=Decimal("450"),
            total_max_marks=Decimal("500"),
            percentage=Decimal("90.00"),
            grade="A",
            grade_point=Decimal("4.00"),
            is_pass=True,
            rank_in_section=3,
            subjects_passed=5,
            subjects_failed=0,
        )
        db_session.add(exam_result)
        
        assignment = Assignment(
            institution_id=child_student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=child_student.section_id,
            subject_id=subject.id,
            title="Math Assignment",
            description="Complete exercises",
            due_date=datetime.now() + timedelta(days=5),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/parents/children/{child_student.id}/overview",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == child_student.id
        assert "attendance_percentage" in data
        assert data["attendance_percentage"] == 90.91
        assert "average_score" in data
        assert "current_rank" in data

    def test_get_child_overview_parent_cannot_access_unrelated_child(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        unrelated_student: Student,
    ):
        response = client.get(
            f"/api/v1/parents/children/{unrelated_student.id}/overview",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 404


@pytest.mark.integration
class TestChildAttendanceAPI:
    """Integration tests for GET /api/v1/parents/children/{childId}/attendance"""

    def test_get_child_attendance_with_monthly_data(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        db_session: Session,
        subject: Subject,
    ):
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        for day in range(1, 21):
            attendance_date = date(current_year, current_month, day) if day <= 28 else date.today() - timedelta(days=30-day)
            status = AttendanceStatus.PRESENT if day % 5 != 0 else AttendanceStatus.ABSENT
            
            attendance = Attendance(
                institution_id=child_student.institution_id,
                student_id=child_student.id,
                section_id=child_student.section_id,
                subject_id=subject.id,
                date=attendance_date,
                status=status,
            )
            db_session.add(attendance)
        
        attendance_summary = AttendanceSummary(
            institution_id=child_student.institution_id,
            student_id=child_student.id,
            subject_id=None,
            month=current_month,
            year=current_year,
            total_days=20,
            present_days=16,
            absent_days=4,
            late_days=0,
            half_days=0,
            attendance_percentage=Decimal("80.00"),
        )
        db_session.add(attendance_summary)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/parents/children/{child_student.id}/attendance/today",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "date" in data
        assert "status" in data

    def test_get_attendance_multi_tenant_isolation(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        unrelated_student: Student,
    ):
        response = client.get(
            f"/api/v1/parents/children/{unrelated_student.id}/attendance/today",
            headers=parent_auth_headers
        )
        
        assert response.status_code in [403, 404]


@pytest.mark.integration
class TestChildGradesAPI:
    """Integration tests for GET /api/v1/parents/children/{childId}/grades"""

    def test_get_child_grades_with_term_wise_results(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        db_session: Session,
        academic_year: AcademicYear,
        grade: Grade,
        subject: Subject,
        term_fixture: Term,
    ):
        exam1 = Exam(
            institution_id=child_student.institution_id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Term 1 Exam",
            exam_type=ExamType.MID_TERM,
            start_date=term_fixture.start_date,
            end_date=term_fixture.start_date + timedelta(days=10),
            status=ExamStatus.COMPLETED,
            total_marks=Decimal("500"),
            passing_marks=Decimal("200"),
            is_published=True,
        )
        db_session.add(exam1)
        db_session.flush()
        
        exam_subject1 = ExamSubject(
            institution_id=child_student.institution_id,
            exam_id=exam1.id,
            subject_id=subject.id,
            theory_max_marks=Decimal("80"),
            practical_max_marks=Decimal("20"),
            theory_passing_marks=Decimal("32"),
            practical_passing_marks=Decimal("8"),
        )
        db_session.add(exam_subject1)
        db_session.flush()
        
        exam_marks1 = ExamMarks(
            institution_id=child_student.institution_id,
            exam_subject_id=exam_subject1.id,
            student_id=child_student.id,
            theory_marks_obtained=Decimal("70"),
            practical_marks_obtained=Decimal("18"),
            is_absent=False,
        )
        db_session.add(exam_marks1)
        
        result1 = ExamResult(
            institution_id=child_student.institution_id,
            exam_id=exam1.id,
            student_id=child_student.id,
            section_id=child_student.section_id,
            total_marks_obtained=Decimal("440"),
            total_max_marks=Decimal("500"),
            percentage=Decimal("88.00"),
            grade="A",
            is_pass=True,
            rank_in_section=2,
            subjects_passed=5,
            subjects_failed=0,
        )
        db_session.add(result1)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/parents/children/{child_student.id}/grades/recent",
            headers=parent_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            grade_data = data[0]
            assert "subject_name" in grade_data
            assert "exam_name" in grade_data
            assert "marks_obtained" in grade_data
            assert "total_marks" in grade_data
            assert "percentage" in grade_data

    def test_get_grades_parent_cannot_access_unrelated_child(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        unrelated_student: Student,
    ):
        response = client.get(
            f"/api/v1/parents/children/{unrelated_student.id}/grades/recent",
            headers=parent_auth_headers
        )
        
        assert response.status_code in [403, 404]


@pytest.mark.integration
class TestParentDataAccessControl:
    """Integration tests for parent data access control"""

    def test_parents_can_only_access_their_children_data(
        self,
        client: TestClient,
        parent_auth_headers: dict,
        child_student: Student,
        unrelated_student: Student,
    ):
        response_allowed = client.get(
            f"/api/v1/parents/children/{child_student.id}/overview",
            headers=parent_auth_headers
        )
        assert response_allowed.status_code == 200
        
        response_denied = client.get(
            f"/api/v1/parents/children/{unrelated_student.id}/overview",
            headers=parent_auth_headers
        )
        assert response_denied.status_code == 404

    def test_parent_cannot_access_other_parent_children(
        self,
        client: TestClient,
        db_session: Session,
        institution: Institution,
        parent_role: Role,
        student_role: Role,
        section: Section,
        child_student: Student,
    ):
        other_parent_user = User(
            username="other_parent",
            email="otherparent@test.com",
            first_name="Other",
            last_name="Parent",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(other_parent_user)
        db_session.commit()
        
        other_parent = Parent(
            institution_id=institution.id,
            user_id=other_parent_user.id,
            first_name="Other",
            last_name="Parent",
            email="otherparent@test.com",
            is_active=True,
        )
        db_session.add(other_parent)
        db_session.commit()
        
        other_parent_token = create_access_token(
            data={
                "sub": other_parent_user.id,
                "institution_id": other_parent_user.institution_id,
                "role_id": other_parent_user.role_id,
                "email": other_parent_user.email,
            }
        )
        other_parent_headers = {"Authorization": f"Bearer {other_parent_token}"}
        
        response = client.get(
            f"/api/v1/parents/children/{child_student.id}/overview",
            headers=other_parent_headers
        )
        
        assert response.status_code == 404


@pytest.mark.integration
class TestParentStudentLinkRelationship:
    """Integration tests for ParentStudentLink relationship integrity"""

    def test_parent_student_link_creation_and_integrity(
        self,
        db_session: Session,
        institution: Institution,
        parent_role: Role,
        student_role: Role,
        section: Section,
    ):
        parent_user = User(
            username="link_parent",
            email="linkparent@test.com",
            first_name="Link",
            last_name="Parent",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(parent_user)
        db_session.commit()
        
        parent = Parent(
            institution_id=institution.id,
            user_id=parent_user.id,
            first_name="Link",
            last_name="Parent",
            email="linkparent@test.com",
            is_active=True,
        )
        db_session.add(parent)
        db_session.commit()
        
        student_user = User(
            username="link_student",
            email="linkstudent@test.com",
            first_name="Link",
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
            admission_number="LINK001",
            first_name="Link",
            last_name="Student",
            email="linkstudent@test.com",
            section_id=section.id,
            is_active=True,
        )
        db_session.add(student)
        db_session.commit()
        
        student_parent_link = StudentParent(
            student_id=student.id,
            parent_id=parent.id,
            relation_type="mother",
            is_primary_contact=True,
        )
        db_session.add(student_parent_link)
        db_session.commit()
        
        retrieved_link = db_session.query(StudentParent).filter(
            StudentParent.student_id == student.id,
            StudentParent.parent_id == parent.id
        ).first()
        
        assert retrieved_link is not None
        assert retrieved_link.relation_type == "mother"
        assert retrieved_link.is_primary_contact is True
        assert retrieved_link.student.id == student.id
        assert retrieved_link.parent.id == parent.id

    def test_parent_student_link_unique_constraint(
        self,
        db_session: Session,
        parent_user_with_profile: tuple[User, Parent],
        child_student: Student,
    ):
        from sqlalchemy.exc import IntegrityError
        
        _, parent = parent_user_with_profile
        
        duplicate_link = StudentParent(
            student_id=child_student.id,
            parent_id=parent.id,
            relation_type="father",
            is_primary_contact=False,
        )
        db_session.add(duplicate_link)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
        
        db_session.rollback()

    def test_parent_student_link_cascading_delete(
        self,
        db_session: Session,
        institution: Institution,
        parent_role: Role,
        student_role: Role,
        section: Section,
    ):
        parent_user = User(
            username="cascade_parent",
            email="cascadeparent@test.com",
            first_name="Cascade",
            last_name="Parent",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(parent_user)
        db_session.commit()
        
        parent = Parent(
            institution_id=institution.id,
            user_id=parent_user.id,
            first_name="Cascade",
            last_name="Parent",
            email="cascadeparent@test.com",
            is_active=True,
        )
        db_session.add(parent)
        db_session.commit()
        
        student_user = User(
            username="cascade_student",
            email="cascadestudent@test.com",
            first_name="Cascade",
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
            admission_number="CAS001",
            first_name="Cascade",
            last_name="Student",
            email="cascadestudent@test.com",
            section_id=section.id,
            is_active=True,
        )
        db_session.add(student)
        db_session.commit()
        
        student_parent_link = StudentParent(
            student_id=student.id,
            parent_id=parent.id,
            relation_type="father",
            is_primary_contact=True,
        )
        db_session.add(student_parent_link)
        db_session.commit()
        
        link_id = student_parent_link.id
        parent_id = parent.id
        
        db_session.delete(parent)
        db_session.commit()
        
        deleted_link = db_session.query(StudentParent).filter(
            StudentParent.id == link_id
        ).first()
        
        assert deleted_link is None

    def test_multiple_parents_for_single_student(
        self,
        db_session: Session,
        institution: Institution,
        parent_role: Role,
        student_role: Role,
        section: Section,
    ):
        student_user = User(
            username="multi_parent_student",
            email="multiparentstudent@test.com",
            first_name="Multi",
            last_name="ParentStudent",
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
            admission_number="MPS001",
            first_name="Multi",
            last_name="ParentStudent",
            email="multiparentstudent@test.com",
            section_id=section.id,
            is_active=True,
        )
        db_session.add(student)
        db_session.commit()
        
        father_user = User(
            username="father",
            email="father@test.com",
            first_name="Father",
            last_name="Parent",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(father_user)
        db_session.commit()
        
        father = Parent(
            institution_id=institution.id,
            user_id=father_user.id,
            first_name="Father",
            last_name="Parent",
            email="father@test.com",
            relation_type="father",
            is_active=True,
        )
        db_session.add(father)
        db_session.commit()
        
        mother_user = User(
            username="mother",
            email="mother@test.com",
            first_name="Mother",
            last_name="Parent",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=parent_role.id,
            is_active=True,
        )
        db_session.add(mother_user)
        db_session.commit()
        
        mother = Parent(
            institution_id=institution.id,
            user_id=mother_user.id,
            first_name="Mother",
            last_name="Parent",
            email="mother@test.com",
            relation_type="mother",
            is_active=True,
        )
        db_session.add(mother)
        db_session.commit()
        
        father_link = StudentParent(
            student_id=student.id,
            parent_id=father.id,
            relation_type="father",
            is_primary_contact=True,
        )
        db_session.add(father_link)
        
        mother_link = StudentParent(
            student_id=student.id,
            parent_id=mother.id,
            relation_type="mother",
            is_primary_contact=False,
        )
        db_session.add(mother_link)
        db_session.commit()
        
        links = db_session.query(StudentParent).filter(
            StudentParent.student_id == student.id
        ).all()
        
        assert len(links) == 2
        relation_types = [link.relation_type for link in links]
        assert "father" in relation_types
        assert "mother" in relation_types
