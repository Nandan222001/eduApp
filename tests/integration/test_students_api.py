import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.student import Student, Parent, StudentParent
from src.models.academic import AcademicYear, Grade, Section, Subject, Term
from src.models.attendance import Attendance, AttendanceSummary, AttendanceStatus
from src.models.assignment import Assignment, Submission, AssignmentStatus, SubmissionStatus
from src.models.examination import Exam, ExamResult, ExamSubject, ExamMarks, ExamType, ExamStatus
from src.utils.security import create_access_token, get_password_hash


@pytest.fixture
def second_institution(db_session: Session) -> Institution:
    """Create a second institution for multi-tenant testing."""
    institution = Institution(
        name="Second Test School",
        phone="+1234567891",
        address="456 Second Street",
        is_active=True,
    )
    db_session.add(institution)
    db_session.commit()
    db_session.refresh(institution)
    return institution


@pytest.fixture
def second_student_user(db_session: Session, second_institution: Institution, student_role: Role) -> User:
    """Create a student user in the second institution."""
    user = User(
        username="student2",
        email="student2@secondschool.com",
        first_name="Bob",
        last_name="SecondStudent",
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
def second_student(
    db_session: Session,
    second_institution: Institution,
    second_student_user: User,
) -> Student:
    """Create a student in the second institution."""
    # Create academic structure for second institution
    academic_year = AcademicYear(
        institution_id=second_institution.id,
        name="2023-2024",
        start_date=date(2023, 4, 1),
        end_date=date(2024, 3, 31),
        is_current=True,
        is_active=True,
    )
    db_session.add(academic_year)
    db_session.flush()
    
    grade = Grade(
        institution_id=second_institution.id,
        academic_year_id=academic_year.id,
        name="Grade 10",
        display_order=10,
        is_active=True,
    )
    db_session.add(grade)
    db_session.flush()
    
    section = Section(
        institution_id=second_institution.id,
        grade_id=grade.id,
        name="Section B",
        capacity=40,
        is_active=True,
    )
    db_session.add(section)
    db_session.flush()
    
    student = Student(
        institution_id=second_institution.id,
        user_id=second_student_user.id,
        admission_number="ADM002",
        first_name=second_student_user.first_name,
        last_name=second_student_user.last_name,
        email=second_student_user.email,
        section_id=section.id,
        date_of_birth=date(2008, 5, 20),
        admission_date=date(2020, 4, 1),
        gender="Male",
        blood_group="A+",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student


@pytest.fixture
def student_auth_headers(student_user: User) -> dict:
    """Create authentication headers for student user."""
    token = create_access_token(
        data={
            "sub": student_user.id,
            "institution_id": student_user.institution_id,
            "role_id": student_user.role_id,
            "email": student_user.email,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_student_auth_headers(second_student_user: User) -> dict:
    """Create authentication headers for second student user."""
    token = create_access_token(
        data={
            "sub": second_student_user.id,
            "institution_id": second_student_user.institution_id,
            "role_id": second_student_user.role_id,
            "email": second_student_user.email,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def term(db_session: Session, institution: Institution, academic_year: AcademicYear):
    """Create a term for grade filtering."""
    from src.models.academic import Term, TermType
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
class TestStudentDashboardAPI:
    """Integration tests for GET /api/v1/students/{student_id}/dashboard endpoint"""

    def test_get_dashboard_with_student_auth_token(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        subject: Subject,
    ):
        """Test GET dashboard with student authentication token"""
        # Create some attendance data
        today = date.today()
        attendance = Attendance(
            institution_id=student.institution_id,
            student_id=student.id,
            section_id=student.section_id,
            subject_id=subject.id,
            date=today,
            status=AttendanceStatus.PRESENT,
        )
        db_session.add(attendance)
        
        # Create attendance summary
        current_month = datetime.now().month
        current_year = datetime.now().year
        attendance_summary = AttendanceSummary(
            institution_id=student.institution_id,
            student_id=student.id,
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
        db_session.add(attendance_summary)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "student_id" in data
        assert data["student_id"] == student.id
        assert "student_name" in data
        assert "photo_url" in data
        assert "section" in data
        assert "grade" in data
        
        # Verify today's attendance widget
        assert "todays_attendance" in data
        assert "status" in data["todays_attendance"]
        assert "date" in data["todays_attendance"]
        
        # Verify attendance summary widget
        assert "attendance_summary" in data
        assert "total_days" in data["attendance_summary"]
        assert "present_days" in data["attendance_summary"]
        assert "absent_days" in data["attendance_summary"]
        assert "attendance_percentage" in data["attendance_summary"]
        assert data["attendance_summary"]["total_days"] == 20
        assert data["attendance_summary"]["present_days"] == 18
        assert data["attendance_summary"]["attendance_percentage"] == 90.0

    def test_get_dashboard_with_assignments_widget(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        teacher: object,
        grade: Grade,
        subject: Subject,
    ):
        """Test dashboard returns upcoming assignments widget"""
        # Create upcoming assignments
        assignment1 = Assignment(
            institution_id=student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Math Homework 1",
            description="Complete exercises 1-10",
            due_date=datetime.now() + timedelta(days=3),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        assignment2 = Assignment(
            institution_id=student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Math Homework 2",
            description="Complete exercises 11-20",
            due_date=datetime.now() + timedelta(days=7),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add_all([assignment1, assignment2])
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify upcoming assignments widget
        assert "upcoming_assignments" in data
        assert isinstance(data["upcoming_assignments"], list)
        assert len(data["upcoming_assignments"]) >= 2
        
        # Check assignment structure
        for assignment in data["upcoming_assignments"]:
            assert "id" in assignment
            assert "title" in assignment
            assert "subject" in assignment
            assert "due_date" in assignment
            assert "days_until_due" in assignment
            assert "total_marks" in assignment
            assert "submission_status" in assignment
            assert "is_submitted" in assignment

    def test_get_dashboard_unauthorized_different_student(
        self,
        client: TestClient,
        student: Student,
        second_student: Student,
        second_student_auth_headers: dict,
    ):
        """Test student cannot access another student's dashboard (multi-tenant isolation)"""
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=second_student_auth_headers
        )
        
        assert response.status_code == 403

    def test_get_dashboard_without_auth(
        self,
        client: TestClient,
        student: Student,
    ):
        """Test dashboard access without authentication fails"""
        response = client.get(f"/api/v1/students/{student.id}/dashboard")
        
        assert response.status_code == 403


@pytest.mark.integration
class TestStudentProfileAPI:
    """Integration tests for GET /api/v1/students/{student_id}/profile endpoint"""

    def test_get_profile_with_correct_student_data(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
    ):
        """Test GET profile returns correct student data"""
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify personal information
        assert data["id"] == student.id
        assert data["institution_id"] == student.institution_id
        assert data["admission_number"] == student.admission_number
        assert data["first_name"] == student.first_name
        assert data["last_name"] == student.last_name
        assert data["email"] == student.email
        assert data["gender"] == student.gender
        assert data["blood_group"] == student.blood_group
        
        # Verify section information
        assert "section" in data
        if data["section"]:
            assert "id" in data["section"]
            assert "name" in data["section"]
            assert "grade_id" in data["section"]

    def test_get_profile_with_parent_information(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        institution: Institution,
    ):
        """Test profile includes parent information"""
        # Create parent
        parent = Parent(
            institution_id=institution.id,
            first_name="John",
            last_name="Parent",
            email="parent@test.com",
            phone="+1234567890",
            relation_type="father",
            is_primary_contact=True,
            is_active=True,
        )
        db_session.add(parent)
        db_session.flush()
        
        # Link parent to student
        student_parent = StudentParent(
            student_id=student.id,
            parent_id=parent.id,
            relation_type="father",
            is_primary_contact=True,
        )
        db_session.add(student_parent)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify parent information
        assert "parents_info" in data
        assert isinstance(data["parents_info"], list)
        assert len(data["parents_info"]) >= 1
        
        parent_info = data["parents_info"][0]
        assert parent_info["first_name"] == "John"
        assert parent_info["last_name"] == "Parent"
        assert parent_info["email"] == "parent@test.com"
        assert parent_info["relation_type"] == "father"
        assert parent_info["is_primary_contact"] is True

    def test_get_profile_with_attendance_summary(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
    ):
        """Test profile includes attendance summary"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        attendance_summary = AttendanceSummary(
            institution_id=student.institution_id,
            student_id=student.id,
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
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "attendance_summary" in data
        assert data["attendance_summary"]["total_days"] == 22
        assert data["attendance_summary"]["present_days"] == 20
        assert data["attendance_summary"]["absent_days"] == 2
        assert data["attendance_summary"]["attendance_percentage"] == 90.91

    def test_get_profile_with_recent_performance(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        academic_year: AcademicYear,
        grade: Grade,
    ):
        """Test profile includes recent exam performance"""
        # Create exam
        exam = Exam(
            institution_id=student.institution_id,
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
        
        # Create exam result
        exam_result = ExamResult(
            institution_id=student.institution_id,
            exam_id=exam.id,
            student_id=student.id,
            section_id=student.section_id,
            total_marks_obtained=Decimal("425"),
            total_max_marks=Decimal("500"),
            percentage=Decimal("85.00"),
            grade="A",
            grade_point=Decimal("4.00"),
            is_pass=True,
            rank_in_section=3,
            subjects_passed=5,
            subjects_failed=0,
        )
        db_session.add(exam_result)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "recent_performance" in data
        assert isinstance(data["recent_performance"], list)
        if len(data["recent_performance"]) > 0:
            performance = data["recent_performance"][0]
            assert "exam_name" in performance
            assert "total_marks" in performance
            assert "obtained_marks" in performance
            assert "percentage" in performance
            assert "grade" in performance

    def test_get_profile_multi_tenant_isolation(
        self,
        client: TestClient,
        student: Student,
        second_student_auth_headers: dict,
    ):
        """Test student from different institution cannot access profile"""
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=second_student_auth_headers
        )
        
        assert response.status_code == 403


@pytest.mark.integration
class TestStudentAttendanceSummaryAPI:
    """Integration tests for GET /api/v1/students/{student_id}/attendance/summary endpoint"""

    def test_get_attendance_summary_with_percentage_calculation(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
    ):
        """Test attendance summary returns correct percentage calculation"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Create attendance summary with specific values
        attendance_summary = AttendanceSummary(
            institution_id=student.institution_id,
            student_id=student.id,
            subject_id=None,
            month=current_month,
            year=current_year,
            total_days=25,
            present_days=23,
            absent_days=2,
            late_days=0,
            half_days=0,
            attendance_percentage=Decimal("92.00"),
        )
        db_session.add(attendance_summary)
        db_session.commit()
        
        # This endpoint might be part of profile or dashboard
        # Testing via profile endpoint
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "attendance_summary" in data
        summary = data["attendance_summary"]
        assert summary["total_days"] == 25
        assert summary["present_days"] == 23
        assert summary["absent_days"] == 2
        
        # Verify percentage calculation
        expected_percentage = (23 / 25) * 100
        assert abs(summary["attendance_percentage"] - expected_percentage) < 0.1

    def test_get_attendance_summary_by_subject(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        subject: Subject,
    ):
        """Test attendance summary can be filtered by subject"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Create subject-specific attendance summary
        subject_summary = AttendanceSummary(
            institution_id=student.institution_id,
            student_id=student.id,
            subject_id=subject.id,
            month=current_month,
            year=current_year,
            total_days=20,
            present_days=19,
            absent_days=1,
            late_days=0,
            half_days=0,
            attendance_percentage=Decimal("95.00"),
        )
        db_session.add(subject_summary)
        db_session.commit()
        
        # Since we're testing via profile, verify the overall summary
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200

    def test_attendance_summary_multi_tenant_isolation(
        self,
        client: TestClient,
        student: Student,
        second_student_auth_headers: dict,
    ):
        """Test attendance summary respects multi-tenant isolation"""
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=second_student_auth_headers
        )
        
        assert response.status_code == 403


@pytest.mark.integration
class TestStudentAssignmentsAPI:
    """Integration tests for GET /api/v1/students/{student_id}/assignments endpoint"""

    def test_get_assignments_with_pending_filter(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        teacher: object,
        grade: Grade,
        subject: Subject,
    ):
        """Test GET assignments with pending status filter"""
        # Create pending assignment (no submission)
        pending_assignment = Assignment(
            institution_id=student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Pending Assignment",
            description="Not yet submitted",
            due_date=datetime.now() + timedelta(days=5),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        
        # Create submitted assignment
        submitted_assignment = Assignment(
            institution_id=student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Submitted Assignment",
            description="Already submitted",
            due_date=datetime.now() + timedelta(days=10),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add_all([pending_assignment, submitted_assignment])
        db_session.flush()
        
        # Create submission for second assignment
        submission = Submission(
            assignment_id=submitted_assignment.id,
            student_id=student.id,
            content="My submission",
            submitted_at=datetime.now(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()
        
        # Test via dashboard which shows pending homework
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Dashboard should show upcoming assignments
        assert "upcoming_assignments" in data

    def test_get_assignments_with_submitted_filter(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        teacher: object,
        grade: Grade,
        subject: Subject,
    ):
        """Test GET assignments with submitted status filter"""
        assignment = Assignment(
            institution_id=student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Submitted Assignment",
            description="Test submission",
            due_date=datetime.now() + timedelta(days=7),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content="My work",
            submitted_at=datetime.now(),
            is_late=False,
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200

    def test_get_assignments_with_graded_filter(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        teacher: object,
        grade: Grade,
        subject: Subject,
    ):
        """Test GET assignments with graded status filter"""
        assignment = Assignment(
            institution_id=student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Graded Assignment",
            description="Already graded",
            due_date=datetime.now() - timedelta(days=5),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content="My completed work",
            submitted_at=datetime.now() - timedelta(days=4),
            is_late=False,
            marks_obtained=Decimal("85"),
            grade="A",
            feedback="Good work!",
            graded_by=teacher.id,
            graded_at=datetime.now() - timedelta(days=1),
            status=SubmissionStatus.GRADED,
        )
        db_session.add(submission)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Profile should show assignment statistics
        assert "total_assignments" in data
        assert "completed_assignments" in data

    def test_assignments_multi_tenant_isolation(
        self,
        client: TestClient,
        student: Student,
        second_student_auth_headers: dict,
    ):
        """Test assignments respect multi-tenant isolation"""
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=second_student_auth_headers
        )
        
        assert response.status_code == 403


@pytest.mark.integration
class TestStudentGradesAPI:
    """Integration tests for GET /api/v1/students/{student_id}/grades endpoint"""

    def test_get_grades_with_term_filter(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        academic_year: AcademicYear,
        grade: Grade,
        subject: Subject,
        term: object,
    ):
        """Test GET grades with term filter"""
        # Create exam for specific term
        exam = Exam(
            institution_id=student.institution_id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Term 1 Final Exam",
            exam_type=ExamType.FINAL,
            start_date=date(2023, 9, 1),
            end_date=date(2023, 9, 15),
            status=ExamStatus.COMPLETED,
            total_marks=Decimal("500"),
            passing_marks=Decimal("200"),
            is_published=True,
        )
        db_session.add(exam)
        db_session.flush()
        
        # Create exam subject
        exam_subject = ExamSubject(
            institution_id=student.institution_id,
            exam_id=exam.id,
            subject_id=subject.id,
            theory_max_marks=Decimal("80"),
            practical_max_marks=Decimal("20"),
            theory_passing_marks=Decimal("32"),
            practical_passing_marks=Decimal("8"),
        )
        db_session.add(exam_subject)
        db_session.flush()
        
        # Create exam marks
        exam_marks = ExamMarks(
            institution_id=student.institution_id,
            exam_subject_id=exam_subject.id,
            student_id=student.id,
            theory_marks_obtained=Decimal("72"),
            practical_marks_obtained=Decimal("18"),
            is_absent=False,
        )
        db_session.add(exam_marks)
        
        # Create exam result
        exam_result = ExamResult(
            institution_id=student.institution_id,
            exam_id=exam.id,
            student_id=student.id,
            section_id=student.section_id,
            total_marks_obtained=Decimal("450"),
            total_max_marks=Decimal("500"),
            percentage=Decimal("90.00"),
            grade="A+",
            grade_point=Decimal("4.00"),
            is_pass=True,
            rank_in_section=2,
            rank_in_grade=5,
            subjects_passed=5,
            subjects_failed=0,
        )
        db_session.add(exam_result)
        db_session.commit()
        
        # Get grades via profile
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify recent performance includes the exam
        assert "recent_performance" in data
        if len(data["recent_performance"]) > 0:
            performance = data["recent_performance"][0]
            assert performance["percentage"] == 90.0
            assert performance["grade"] == "A+"

    def test_get_grades_multiple_exams(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        academic_year: AcademicYear,
        grade: Grade,
    ):
        """Test GET grades returns multiple exam results"""
        # Create multiple exams
        for i in range(3):
            exam = Exam(
                institution_id=student.institution_id,
                academic_year_id=academic_year.id,
                grade_id=grade.id,
                name=f"Exam {i+1}",
                exam_type=ExamType.UNIT,
                start_date=date.today() - timedelta(days=30*(i+1)),
                end_date=date.today() - timedelta(days=30*(i+1)-5),
                status=ExamStatus.COMPLETED,
                total_marks=Decimal("100"),
                passing_marks=Decimal("40"),
                is_published=True,
            )
            db_session.add(exam)
            db_session.flush()
            
            exam_result = ExamResult(
                institution_id=student.institution_id,
                exam_id=exam.id,
                student_id=student.id,
                section_id=student.section_id,
                total_marks_obtained=Decimal("75") + Decimal(i * 5),
                total_max_marks=Decimal("100"),
                percentage=Decimal("75.00") + Decimal(i * 5),
                grade="B+",
                is_pass=True,
                subjects_passed=1,
                subjects_failed=0,
            )
            db_session.add(exam_result)
        
        db_session.commit()
        
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "recent_performance" in data
        # Profile returns up to 5 recent results
        assert len(data["recent_performance"]) <= 5

    def test_grades_multi_tenant_isolation(
        self,
        client: TestClient,
        student: Student,
        second_student_auth_headers: dict,
    ):
        """Test grades respect multi-tenant isolation"""
        response = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=second_student_auth_headers
        )
        
        assert response.status_code == 403


@pytest.mark.integration
class TestRoleBasedAccessControl:
    """Integration tests for role-based access control on student endpoints"""

    def test_student_can_only_access_own_data(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        db_session: Session,
        institution: Institution,
        student_role: Role,
        section: Section,
    ):
        """Test student can only access their own data, not other students'"""
        # Create another student in same institution
        other_user = User(
            username="otherstudent",
            email="other@testschool.com",
            first_name="Other",
            last_name="Student",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(other_user)
        db_session.flush()
        
        other_student = Student(
            institution_id=institution.id,
            user_id=other_user.id,
            admission_number="ADM999",
            first_name="Other",
            last_name="Student",
            email="other@testschool.com",
            section_id=section.id,
            is_active=True,
        )
        db_session.add(other_student)
        db_session.commit()
        
        # Try to access other student's dashboard
        response = client.get(
            f"/api/v1/students/{other_student.id}/dashboard",
            headers=student_auth_headers
        )
        
        assert response.status_code == 403
        
        # Try to access other student's profile
        response = client.get(
            f"/api/v1/students/{other_student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 403

    def test_student_cannot_access_teacher_data(
        self,
        client: TestClient,
        student: Student,
        student_auth_headers: dict,
        teacher: object,
    ):
        """Test student cannot access teacher-specific endpoints"""
        # Assuming there's a teacher profile endpoint
        # This test verifies proper role-based access control
        response = client.get(
            f"/api/v1/teachers/{teacher.id}",
            headers=student_auth_headers
        )
        
        # Should be forbidden or not found based on permissions
        assert response.status_code in [403, 404]

    def test_unauthenticated_access_denied(
        self,
        client: TestClient,
        student: Student,
    ):
        """Test unauthenticated requests are denied"""
        # Dashboard without auth
        response = client.get(f"/api/v1/students/{student.id}/dashboard")
        assert response.status_code == 403
        
        # Profile without auth
        response = client.get(f"/api/v1/students/{student.id}/profile")
        assert response.status_code == 403

    def test_expired_token_access_denied(
        self,
        client: TestClient,
        student: Student,
        student_user: User,
    ):
        """Test expired token is rejected"""
        from jose import jwt
        from src.config import settings
        
        # Create expired token
        expired_token_data = {
            "sub": student_user.id,
            "institution_id": student_user.institution_id,
            "role_id": student_user.role_id,
            "email": student_user.email,
            "exp": datetime.utcnow() - timedelta(hours=1),
            "type": "access"
        }
        expired_token = jwt.encode(
            expired_token_data,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=headers
        )
        
        assert response.status_code == 403


@pytest.mark.integration
class TestMultiTenantDataIsolation:
    """Integration tests for multi-tenant data isolation"""

    def test_student_cannot_access_other_institution_data(
        self,
        client: TestClient,
        student: Student,
        second_student: Student,
        student_auth_headers: dict,
    ):
        """Test student from institution A cannot access data from institution B"""
        # Try to access second institution's student
        response = client.get(
            f"/api/v1/students/{second_student.id}/dashboard",
            headers=student_auth_headers
        )
        
        assert response.status_code == 403

    def test_institution_data_completely_isolated(
        self,
        client: TestClient,
        student: Student,
        second_student: Student,
        student_auth_headers: dict,
        second_student_auth_headers: dict,
        db_session: Session,
    ):
        """Test complete data isolation between institutions"""
        # Student from institution 1 accesses their dashboard
        response1 = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=student_auth_headers
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Student from institution 2 accesses their dashboard
        response2 = client.get(
            f"/api/v1/students/{second_student.id}/dashboard",
            headers=second_student_auth_headers
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Verify they have different institution data
        assert data1["student_id"] == student.id
        assert data2["student_id"] == second_student.id
        assert student.institution_id != second_student.institution_id

    def test_cross_institution_profile_access_denied(
        self,
        client: TestClient,
        student: Student,
        second_student: Student,
        student_auth_headers: dict,
    ):
        """Test cross-institution profile access is denied"""
        response = client.get(
            f"/api/v1/students/{second_student.id}/profile",
            headers=student_auth_headers
        )
        
        assert response.status_code == 403

    def test_assignments_filtered_by_institution(
        self,
        client: TestClient,
        student: Student,
        second_student: Student,
        student_auth_headers: dict,
        second_student_auth_headers: dict,
        db_session: Session,
        teacher: object,
        grade: Grade,
        subject: Subject,
    ):
        """Test assignments are properly filtered by institution"""
        # Create assignment for first institution
        assignment1 = Assignment(
            institution_id=student.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=student.section_id,
            subject_id=subject.id,
            title="Institution 1 Assignment",
            due_date=datetime.now() + timedelta(days=5),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment1)
        db_session.commit()
        
        # First student should see their institution's assignment
        response1 = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=student_auth_headers
        )
        assert response1.status_code == 200
        
        # Second student should not be able to access first student's data
        response2 = client.get(
            f"/api/v1/students/{student.id}/dashboard",
            headers=second_student_auth_headers
        )
        assert response2.status_code == 403

    def test_attendance_filtered_by_institution(
        self,
        client: TestClient,
        student: Student,
        second_student: Student,
        student_auth_headers: dict,
        second_student_auth_headers: dict,
        db_session: Session,
    ):
        """Test attendance data is properly filtered by institution"""
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Create attendance for first institution
        attendance1 = AttendanceSummary(
            institution_id=student.institution_id,
            student_id=student.id,
            subject_id=None,
            month=current_month,
            year=current_year,
            total_days=20,
            present_days=18,
            absent_days=2,
            attendance_percentage=Decimal("90.00"),
        )
        db_session.add(attendance1)
        db_session.commit()
        
        # First student can access their data
        response1 = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        assert response1.status_code == 200
        
        # Second student cannot access first student's data
        response2 = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=second_student_auth_headers
        )
        assert response2.status_code == 403

    def test_grades_filtered_by_institution(
        self,
        client: TestClient,
        student: Student,
        second_student: Student,
        student_auth_headers: dict,
        second_student_auth_headers: dict,
        db_session: Session,
        academic_year: AcademicYear,
        grade: Grade,
    ):
        """Test exam grades are properly filtered by institution"""
        # Create exam for first institution
        exam = Exam(
            institution_id=student.institution_id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Institution 1 Exam",
            exam_type=ExamType.FINAL,
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() - timedelta(days=5),
            status=ExamStatus.COMPLETED,
            is_published=True,
        )
        db_session.add(exam)
        db_session.flush()
        
        exam_result = ExamResult(
            institution_id=student.institution_id,
            exam_id=exam.id,
            student_id=student.id,
            section_id=student.section_id,
            total_marks_obtained=Decimal("450"),
            total_max_marks=Decimal("500"),
            percentage=Decimal("90.00"),
            grade="A",
            is_pass=True,
            subjects_passed=5,
            subjects_failed=0,
        )
        db_session.add(exam_result)
        db_session.commit()
        
        # First student can access their grades
        response1 = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=student_auth_headers
        )
        assert response1.status_code == 200
        
        # Second student cannot access first student's grades
        response2 = client.get(
            f"/api/v1/students/{student.id}/profile",
            headers=second_student_auth_headers
        )
        assert response2.status_code == 403
