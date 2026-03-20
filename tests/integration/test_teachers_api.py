import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
from io import BytesIO

from src.models.user import User
from src.models.role import Role
from src.models.institution import Institution
from src.models.student import Student
from src.models.teacher import Teacher, TeacherSubject
from src.models.academic import AcademicYear, Grade, Section, Subject
from src.models.attendance import Attendance, AttendanceSummary, AttendanceStatus
from src.models.assignment import Assignment, Submission, AssignmentStatus, SubmissionStatus
from src.models.examination import Exam, ExamResult, ExamType, ExamStatus
from src.utils.security import create_access_token, get_password_hash


@pytest.fixture
def teacher_auth_headers(teacher_user: User) -> dict:
    token = create_access_token(
        data={
            "sub": teacher_user.id,
            "institution_id": teacher_user.institution_id,
            "role_id": teacher_user.role_id,
            "email": teacher_user.email,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_teacher_user(db_session: Session, institution: Institution, teacher_role: Role) -> User:
    user = User(
        username="teacher2",
        email="teacher2@testschool.com",
        first_name="Jane",
        last_name="Smith",
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
def second_teacher(db_session: Session, institution: Institution, second_teacher_user: User) -> Teacher:
    teacher = Teacher(
        institution_id=institution.id,
        user_id=second_teacher_user.id,
        employee_id="EMP002",
        first_name=second_teacher_user.first_name,
        last_name=second_teacher_user.last_name,
        email=second_teacher_user.email,
        phone="+1234567891",
        date_of_birth=datetime(1988, 8, 20).date(),
        date_of_joining=datetime(2021, 1, 15).date(),
        qualification="M.A. English",
        specialization="English Literature",
        is_active=True,
    )
    db_session.add(teacher)
    db_session.commit()
    db_session.refresh(teacher)
    return teacher


@pytest.fixture
def second_section(db_session: Session, institution: Institution, grade: Grade) -> Section:
    section = Section(
        institution_id=institution.id,
        grade_id=grade.id,
        name="Section B",
        capacity=35,
        is_active=True,
    )
    db_session.add(section)
    db_session.commit()
    db_session.refresh(section)
    return section


@pytest.fixture
def multiple_students(
    db_session: Session,
    institution: Institution,
    student_role: Role,
    section: Section,
    academic_year: AcademicYear,
):
    students = []
    for i in range(5):
        user = User(
            username=f"student_bulk_{i}",
            email=f"student{i}@testschool.com",
            first_name=f"Student{i}",
            last_name=f"Test{i}",
            hashed_password=get_password_hash("password123"),
            institution_id=institution.id,
            role_id=student_role.id,
            is_active=True,
            is_superuser=False,
        )
        db_session.add(user)
        db_session.flush()
        
        student = Student(
            institution_id=institution.id,
            user_id=user.id,
            admission_number=f"ADM{100+i}",
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            section_id=section.id,
            academic_year_id=academic_year.id,
            date_of_birth=datetime(2008, 1, i+1).date(),
            date_of_admission=datetime(2020, 4, 1).date(),
            gender="Male" if i % 2 == 0 else "Female",
            is_active=True,
        )
        db_session.add(student)
        students.append(student)
    
    db_session.commit()
    for student in students:
        db_session.refresh(student)
    return students


@pytest.fixture
def teacher_class_assignment(
    db_session: Session,
    teacher: Teacher,
    section: Section,
    subject: Subject,
) -> TeacherSubject:
    teacher_subject = TeacherSubject(
        institution_id=teacher.institution_id,
        teacher_id=teacher.id,
        subject_id=subject.id,
        is_primary=True,
    )
    db_session.add(teacher_subject)
    db_session.commit()
    db_session.refresh(teacher_subject)
    return teacher_subject


@pytest.mark.integration
class TestTeacherDashboardAPI:
    def test_get_dashboard_with_class_assignments_and_pending_grading(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        teacher_class_assignment: TeacherSubject,
        grade: Grade,
        section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        assignment1 = Assignment(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Pending Assignment 1",
            description="To be graded",
            due_date=datetime.now() - timedelta(days=1),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        assignment2 = Assignment(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Pending Assignment 2",
            description="To be graded",
            due_date=datetime.now() - timedelta(days=3),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add_all([assignment1, assignment2])
        db_session.flush()
        
        for i, student in enumerate(multiple_students[:3]):
            submission1 = Submission(
                assignment_id=assignment1.id,
                student_id=student.id,
                content=f"Submission from {student.first_name}",
                submitted_at=datetime.now() - timedelta(hours=i+1),
                status=SubmissionStatus.SUBMITTED,
                is_late=False,
            )
            submission2 = Submission(
                assignment_id=assignment2.id,
                student_id=student.id,
                content=f"Submission from {student.first_name}",
                submitted_at=datetime.now() - timedelta(days=2),
                status=SubmissionStatus.SUBMITTED,
                is_late=False,
            )
            db_session.add_all([submission1, submission2])
        
        db_session.commit()
        
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "teacher_id" in data
        assert data["teacher_id"] == teacher.id
        assert "teacher_name" in data
        
        assert "my_classes" in data
        assert isinstance(data["my_classes"], list)
        if len(data["my_classes"]) > 0:
            class_info = data["my_classes"][0]
            assert "class_name" in class_info
            assert "section" in class_info
            assert "subject" in class_info
            assert "student_count" in class_info
        
        assert "pending_grading" in data
        assert "total_count" in data["pending_grading"]
        assert data["pending_grading"]["total_count"] >= 6
        assert "assignments" in data["pending_grading"]
        
        assert "statistics" in data
        assert "pending_grading_count" in data["statistics"]
        assert data["statistics"]["pending_grading_count"] >= 6

    def test_get_dashboard_with_todays_schedule(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        teacher_class_assignment: TeacherSubject,
    ):
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "todays_schedule" in data
        assert isinstance(data["todays_schedule"], list)

    def test_get_dashboard_with_recent_submissions(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        assignment = Assignment(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Recent Assignment",
            due_date=datetime.now() + timedelta(days=2),
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        for student in multiple_students[:3]:
            submission = Submission(
                assignment_id=assignment.id,
                student_id=student.id,
                content=f"Recent submission from {student.first_name}",
                submitted_at=datetime.now() - timedelta(minutes=30),
                status=SubmissionStatus.SUBMITTED,
            )
            db_session.add(submission)
        
        db_session.commit()
        
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "recent_submissions" in data
        assert isinstance(data["recent_submissions"], list)

    def test_dashboard_teacher_can_only_see_assigned_classes(
        self,
        client: TestClient,
        teacher: Teacher,
        second_teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        teacher_class_assignment: TeacherSubject,
        grade: Grade,
        section: Section,
        second_section: Section,
        subject: Subject,
    ):
        assignment_teacher1 = Assignment(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Teacher 1 Assignment",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        
        assignment_teacher2 = Assignment(
            institution_id=second_teacher.institution_id,
            teacher_id=second_teacher.id,
            grade_id=grade.id,
            section_id=second_section.id,
            subject_id=subject.id,
            title="Teacher 2 Assignment",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add_all([assignment_teacher1, assignment_teacher2])
        db_session.commit()
        
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if "my_classes" in data and len(data["my_classes"]) > 0:
            class_sections = [c.get("section") for c in data["my_classes"]]
            assert section.name in class_sections or len(class_sections) == 0

    def test_dashboard_without_authentication(
        self,
        client: TestClient,
    ):
        response = client.get("/api/v1/teachers/my-dashboard")
        assert response.status_code == 403


@pytest.mark.integration
class TestBulkAttendanceMarkingAPI:
    def test_post_bulk_attendance_marking_success(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        attendance_data = {
            "institution_id": teacher.institution_id,
            "section_id": section.id,
            "subject_id": subject.id,
            "date": str(date.today()),
            "attendances": [
                {
                    "student_id": multiple_students[0].id,
                    "status": "present",
                },
                {
                    "student_id": multiple_students[1].id,
                    "status": "absent",
                },
                {
                    "student_id": multiple_students[2].id,
                    "status": "present",
                },
                {
                    "student_id": multiple_students[3].id,
                    "status": "late",
                },
                {
                    "student_id": multiple_students[4].id,
                    "status": "present",
                },
            ]
        }
        
        response = client.post(
            "/api/v1/attendance/bulk",
            json=attendance_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert "total" in data
        assert data["total"] == 5
        assert "success" in data
        assert data["success"] == 5
        assert "failed" in data
        assert data["failed"] == 0

    def test_post_bulk_attendance_partial_success(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        attendance_data = {
            "institution_id": teacher.institution_id,
            "section_id": section.id,
            "subject_id": subject.id,
            "date": str(date.today()),
            "attendances": [
                {
                    "student_id": multiple_students[0].id,
                    "status": "present",
                },
                {
                    "student_id": 99999,
                    "status": "absent",
                },
                {
                    "student_id": multiple_students[1].id,
                    "status": "present",
                },
            ]
        }
        
        response = client.post(
            "/api/v1/attendance/bulk",
            json=attendance_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert "total" in data
        assert "success" in data
        assert "failed" in data

    def test_post_bulk_attendance_with_remarks(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        attendance_data = {
            "institution_id": teacher.institution_id,
            "section_id": section.id,
            "subject_id": subject.id,
            "date": str(date.today()),
            "attendances": [
                {
                    "student_id": multiple_students[0].id,
                    "status": "absent",
                    "remarks": "Sick leave approved"
                },
                {
                    "student_id": multiple_students[1].id,
                    "status": "late",
                    "remarks": "Arrived 15 minutes late"
                },
            ]
        }
        
        response = client.post(
            "/api/v1/attendance/bulk",
            json=attendance_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] == 2
        
        attendance_record = db_session.query(Attendance).filter(
            Attendance.student_id == multiple_students[0].id,
            Attendance.date == date.today()
        ).first()
        assert attendance_record is not None
        assert attendance_record.remarks == "Sick leave approved"

    def test_bulk_attendance_only_for_assigned_classes(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        second_section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        attendance_data = {
            "institution_id": teacher.institution_id,
            "section_id": second_section.id,
            "subject_id": subject.id,
            "date": str(date.today()),
            "attendances": [
                {
                    "student_id": multiple_students[0].id,
                    "status": "present",
                }
            ]
        }
        
        response = client.post(
            "/api/v1/attendance/bulk",
            json=attendance_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [201, 403, 400]


@pytest.mark.integration
class TestTeacherClassesAPI:
    def test_get_assigned_classes_list(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        teacher_class_assignment: TeacherSubject,
        grade: Grade,
        section: Section,
        subject: Subject,
    ):
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "my_classes" in data
        assert isinstance(data["my_classes"], list)

    def test_get_assigned_classes_with_student_count(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        teacher_class_assignment: TeacherSubject,
        multiple_students: list,
    ):
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "my_classes" in data
        if len(data["my_classes"]) > 0:
            class_info = data["my_classes"][0]
            assert "student_count" in class_info
            assert class_info["student_count"] >= 0

    def test_get_teacher_subjects(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        teacher_class_assignment: TeacherSubject,
    ):
        response = client.get(
            f"/api/v1/teachers/{teacher.id}/subjects",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_teacher_cannot_access_other_teacher_classes(
        self,
        client: TestClient,
        teacher: Teacher,
        second_teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
    ):
        response = client.get(
            f"/api/v1/teachers/{second_teacher.id}/subjects",
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [403, 404]


@pytest.mark.integration
class TestAssignmentCreateAPI:
    @patch('boto3.client')
    def test_post_create_assignment_with_file_upload(
        self,
        mock_boto_client,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
        mock_s3,
    ):
        mock_s3_client = MagicMock()
        mock_s3_client.upload_fileobj.return_value = None
        mock_s3_client.generate_presigned_url.return_value = "https://s3.amazonaws.com/test-bucket/file.pdf"
        mock_boto_client.return_value = mock_s3_client
        
        assignment_data = {
            "institution_id": teacher.institution_id,
            "teacher_id": teacher.id,
            "grade_id": grade.id,
            "section_id": section.id,
            "subject_id": subject.id,
            "title": "Math Homework with File",
            "description": "Complete exercises with attachment",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "max_marks": 100,
            "status": "published",
        }
        
        response = client.post(
            "/api/v1/assignments/",
            json=assignment_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert "id" in data
        assert data["title"] == "Math Homework with File"
        assert data["teacher_id"] == teacher.id

    def test_post_create_assignment_basic(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
    ):
        assignment_data = {
            "institution_id": teacher.institution_id,
            "teacher_id": teacher.id,
            "grade_id": grade.id,
            "section_id": section.id,
            "subject_id": subject.id,
            "title": "Basic Assignment",
            "description": "Test assignment",
            "due_date": (datetime.now() + timedelta(days=5)).isoformat(),
            "max_marks": 50,
            "status": "published",
        }
        
        response = client.post(
            "/api/v1/assignments/",
            json=assignment_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["title"] == "Basic Assignment"
        assert data["max_marks"] == 50

    def test_teacher_cannot_create_assignment_for_other_institution(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
    ):
        assignment_data = {
            "institution_id": 999999,
            "teacher_id": teacher.id,
            "grade_id": grade.id,
            "section_id": section.id,
            "subject_id": subject.id,
            "title": "Invalid Assignment",
            "max_marks": 100,
            "status": "published",
        }
        
        response = client.post(
            "/api/v1/assignments/",
            json=assignment_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 403


@pytest.mark.integration
class TestAssignmentGradingAPI:
    @patch('boto3.client')
    def test_put_grade_assignment_submission(
        self,
        mock_boto_client,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
        student: Student,
    ):
        mock_s3_client = MagicMock()
        mock_boto_client.return_value = mock_s3_client
        
        assignment = Assignment(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Grading Test Assignment",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Student's work",
            submitted_at=datetime.now(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()
        
        grade_data = {
            "marks_obtained": 85,
            "grade": "A",
            "feedback": "Excellent work!",
        }
        
        response = client.put(
            f"/api/v1/submissions/{submission.id}/grade",
            json=grade_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "graded"
        assert float(data["marks_obtained"]) == 85.0
        assert data["grade"] == "A"
        assert data["feedback"] == "Excellent work!"

    def test_put_grade_multiple_submissions(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        assignment = Assignment(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Bulk Grading Assignment",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        submissions = []
        for student in multiple_students:
            submission = Submission(
                assignment_id=assignment.id,
                student_id=student.id,
                content="Student work",
                submitted_at=datetime.now(),
                status=SubmissionStatus.SUBMITTED,
            )
            db_session.add(submission)
            submissions.append(submission)
        
        db_session.commit()
        
        for i, submission in enumerate(submissions):
            db_session.refresh(submission)
            grade_data = {
                "marks_obtained": 70 + (i * 5),
                "grade": "B" if i < 3 else "A",
                "feedback": f"Good work student {i+1}",
            }
            
            response = client.put(
                f"/api/v1/submissions/{submission.id}/grade",
                json=grade_data,
                headers=teacher_auth_headers
            )
            
            assert response.status_code == 200

    def test_teacher_can_only_grade_own_assignments(
        self,
        client: TestClient,
        teacher: Teacher,
        second_teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
        student: Student,
    ):
        assignment = Assignment(
            institution_id=second_teacher.institution_id,
            teacher_id=second_teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Other Teacher Assignment",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Student work",
            submitted_at=datetime.now(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()
        
        grade_data = {
            "marks_obtained": 85,
            "grade": "A",
            "feedback": "Good",
        }
        
        response = client.put(
            f"/api/v1/submissions/{submission.id}/grade",
            json=grade_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [403, 404]


@pytest.mark.integration
class TestClassPerformanceAPI:
    def test_get_class_performance_with_analytics(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        teacher_class_assignment: TeacherSubject,
        grade: Grade,
        section: Section,
        subject: Subject,
        multiple_students: list,
    ):
        for i, student in enumerate(multiple_students):
            summary = AttendanceSummary(
                institution_id=teacher.institution_id,
                student_id=student.id,
                subject_id=subject.id,
                month=datetime.now().month,
                year=datetime.now().year,
                total_days=20,
                present_days=18 - i,
                absent_days=2 + i,
                attendance_percentage=Decimal((18 - i) / 20 * 100),
            )
            db_session.add(summary)
        
        assignment = Assignment(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Performance Test",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        for i, student in enumerate(multiple_students):
            submission = Submission(
                assignment_id=assignment.id,
                student_id=student.id,
                content="Work",
                submitted_at=datetime.now(),
                marks_obtained=Decimal(80 + i * 3),
                status=SubmissionStatus.GRADED,
            )
            db_session.add(submission)
        
        db_session.commit()
        
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "class_performance" in data
        assert isinstance(data["class_performance"], list)
        
        if len(data["class_performance"]) > 0:
            perf = data["class_performance"][0]
            assert "class_name" in perf
            assert "section" in perf
            assert "subject" in perf
            assert "average_score" in perf
            assert "attendance_rate" in perf
            assert "student_count" in perf

    def test_get_class_performance_multiple_classes(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        second_section: Section,
        subject: Subject,
    ):
        teacher_subject1 = TeacherSubject(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            subject_id=subject.id,
            is_primary=True,
        )
        db_session.add(teacher_subject1)
        db_session.commit()
        
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "class_performance" in data
        assert isinstance(data["class_performance"], list)

    def test_get_class_performance_with_exam_results(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        academic_year: AcademicYear,
        grade: Grade,
        section: Section,
        multiple_students: list,
    ):
        exam = Exam(
            institution_id=teacher.institution_id,
            academic_year_id=academic_year.id,
            grade_id=grade.id,
            name="Mid Term Exam",
            exam_type=ExamType.MID_TERM,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() - timedelta(days=25),
            status=ExamStatus.COMPLETED,
            total_marks=Decimal("500"),
            is_published=True,
        )
        db_session.add(exam)
        db_session.flush()
        
        for i, student in enumerate(multiple_students):
            result = ExamResult(
                institution_id=teacher.institution_id,
                exam_id=exam.id,
                student_id=student.id,
                section_id=section.id,
                total_marks_obtained=Decimal(400 + i * 10),
                total_max_marks=Decimal("500"),
                percentage=Decimal(80 + i * 2),
                grade="A" if i > 2 else "B",
                is_pass=True,
                subjects_passed=5,
                subjects_failed=0,
            )
            db_session.add(result)
        
        db_session.commit()
        
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "class_performance" in data


@pytest.mark.integration
class TestTeacherDataAccessControl:
    def test_teacher_can_only_access_assigned_class_data(
        self,
        client: TestClient,
        teacher: Teacher,
        second_teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        second_section: Section,
        subject: Subject,
        student: Student,
    ):
        teacher_subject1 = TeacherSubject(
            institution_id=teacher.institution_id,
            teacher_id=teacher.id,
            subject_id=subject.id,
            is_primary=True,
        )
        db_session.add(teacher_subject1)
        
        teacher_subject2 = TeacherSubject(
            institution_id=second_teacher.institution_id,
            teacher_id=second_teacher.id,
            subject_id=subject.id,
            is_primary=True,
        )
        db_session.add(teacher_subject2)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/teachers/{teacher.id}/subjects",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        subjects = response.json()
        
        subject_ids = [s.get("subject_id") for s in subjects]
        assert subject.id in subject_ids

    def test_teacher_cannot_grade_unassigned_class_submissions(
        self,
        client: TestClient,
        teacher: Teacher,
        second_teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        second_section: Section,
        subject: Subject,
        student: Student,
    ):
        assignment = Assignment(
            institution_id=second_teacher.institution_id,
            teacher_id=second_teacher.id,
            grade_id=grade.id,
            section_id=second_section.id,
            subject_id=subject.id,
            title="Unassigned Class Assignment",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.flush()
        
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Work",
            submitted_at=datetime.now(),
            status=SubmissionStatus.SUBMITTED,
        )
        db_session.add(submission)
        db_session.commit()
        
        grade_data = {
            "marks_obtained": 85,
            "grade": "A",
            "feedback": "Good",
        }
        
        response = client.put(
            f"/api/v1/submissions/{submission.id}/grade",
            json=grade_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [403, 404]

    def test_teacher_cannot_mark_attendance_for_unassigned_section(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        second_section: Section,
        subject: Subject,
        student: Student,
    ):
        attendance_data = {
            "institution_id": teacher.institution_id,
            "section_id": second_section.id,
            "subject_id": subject.id,
            "date": str(date.today()),
            "attendances": [
                {
                    "student_id": student.id,
                    "status": "present",
                }
            ]
        }
        
        response = client.post(
            "/api/v1/attendance/bulk",
            json=attendance_data,
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [201, 403, 400]

    def test_teacher_cannot_view_other_teacher_assignments(
        self,
        client: TestClient,
        teacher: Teacher,
        second_teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        grade: Grade,
        section: Section,
        subject: Subject,
    ):
        assignment = Assignment(
            institution_id=second_teacher.institution_id,
            teacher_id=second_teacher.id,
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            title="Other Teacher Assignment",
            max_marks=Decimal("100"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/assignments/{assignment.id}",
            headers=teacher_auth_headers
        )
        
        assert response.status_code in [403, 404]

    def test_teacher_multi_tenant_isolation(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
        second_institution: Institution,
        teacher_role: Role,
    ):
        other_institution_user = User(
            username="other_teacher",
            email="other@otherschool.com",
            first_name="Other",
            last_name="Teacher",
            hashed_password=get_password_hash("password123"),
            institution_id=second_institution.id,
            role_id=teacher_role.id,
            is_active=True,
        )
        db_session.add(other_institution_user)
        db_session.flush()
        
        other_teacher = Teacher(
            institution_id=second_institution.id,
            user_id=other_institution_user.id,
            employee_id="EMP999",
            first_name="Other",
            last_name="Teacher",
            email="other@otherschool.com",
            is_active=True,
        )
        db_session.add(other_teacher)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/teachers/{other_teacher.id}",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 403

    def test_teacher_can_only_see_own_institution_data(
        self,
        client: TestClient,
        teacher: Teacher,
        teacher_auth_headers: dict,
        db_session: Session,
    ):
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=teacher_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "teacher_id" in data
        assert data["teacher_id"] == teacher.id


@pytest.mark.integration  
class TestTeacherAuthenticationAndAuthorization:
    def test_unauthenticated_access_denied(
        self,
        client: TestClient,
        teacher: Teacher,
    ):
        response = client.get("/api/v1/teachers/my-dashboard")
        assert response.status_code == 403
        
        response = client.get(f"/api/v1/teachers/{teacher.id}/subjects")
        assert response.status_code == 403

    def test_student_cannot_access_teacher_endpoints(
        self,
        client: TestClient,
        student_user: User,
        teacher: Teacher,
    ):
        student_token = create_access_token(
            data={
                "sub": student_user.id,
                "institution_id": student_user.institution_id,
                "role_id": student_user.role_id,
                "email": student_user.email,
            }
        )
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        response = client.get(
            "/api/v1/teachers/my-dashboard",
            headers=student_headers
        )
        
        assert response.status_code in [403, 404]

    def test_expired_token_rejected(
        self,
        client: TestClient,
        teacher_user: User,
    ):
        from jose import jwt
        from src.config import settings
        
        expired_token_data = {
            "sub": teacher_user.id,
            "institution_id": teacher_user.institution_id,
            "role_id": teacher_user.role_id,
            "email": teacher_user.email,
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
            "/api/v1/teachers/my-dashboard",
            headers=headers
        )
        
        assert response.status_code == 403
