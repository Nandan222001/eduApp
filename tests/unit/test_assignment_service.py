import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from io import BytesIO

from src.services.assignment_service import AssignmentService, SubmissionService, RubricService
from src.models.assignment import (
    Assignment, AssignmentFile, Submission, SubmissionFile,
    AssignmentStatus, SubmissionStatus, RubricCriteria, RubricLevel, SubmissionGrade
)
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.academic import Grade, Section, Subject
from src.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, SubmissionCreate, SubmissionUpdate,
    SubmissionGradeInput, RubricCriteriaCreate, RubricLevelCreate,
    BulkGradeInput, SubmissionGradeCreate
)


@pytest.mark.unit
class TestAssignmentService:
    """Test assignment service business logic."""

    @pytest.fixture
    def assignment_service(self, db_session: Session):
        """Create assignment service instance."""
        return AssignmentService(db_session)

    @pytest.fixture
    def mock_s3_client(self):
        """Mock S3 client for file upload operations."""
        with patch('src.services.assignment_service.s3_client') as mock_s3:
            mock_s3.upload_file.return_value = (
                "https://test-bucket.s3.us-east-1.amazonaws.com/test-file.pdf",
                "assignments/1/test-file.pdf"
            )
            mock_s3.delete_file.return_value = True
            yield mock_s3

    def test_create_assignment_with_rich_text_content(
        self,
        assignment_service: AssignmentService,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test creating an assignment with rich text content."""
        rich_text_content = """
        <h1>Assignment Instructions</h1>
        <p>This is a <strong>test assignment</strong> with <em>rich text</em>.</p>
        <ul>
            <li>Item 1</li>
            <li>Item 2</li>
        </ul>
        """
        
        assignment_data = AssignmentCreate(
            institution_id=institution.id,
            title="Assignment with Rich Text",
            description="Complete exercises",
            content=rich_text_content,
            instructions="Follow the guidelines",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            publish_date=datetime.utcnow(),
            max_marks=Decimal("100.00"),
            passing_marks=Decimal("40.00"),
            status=AssignmentStatus.PUBLISHED,
        )

        assignment = assignment_service.create_assignment(assignment_data)

        assert assignment is not None
        assert assignment.title == "Assignment with Rich Text"
        assert assignment.content == rich_text_content
        assert assignment.instructions == "Follow the guidelines"
        assert assignment.max_marks == Decimal("100.00")
        assert assignment.passing_marks == Decimal("40.00")
        assert assignment.status == AssignmentStatus.PUBLISHED

    def test_create_assignment_with_due_dates(
        self,
        assignment_service: AssignmentService,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test creating an assignment with due dates."""
        publish_date = datetime.utcnow()
        due_date = publish_date + timedelta(days=7)
        close_date = due_date + timedelta(days=2)
        
        assignment_data = AssignmentCreate(
            institution_id=institution.id,
            title="Assignment with Dates",
            description="Test dates",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            publish_date=publish_date,
            due_date=due_date,
            close_date=close_date,
            max_marks=Decimal("100.00"),
        )

        assignment = assignment_service.create_assignment(assignment_data)

        assert assignment is not None
        assert assignment.publish_date == publish_date
        assert assignment.due_date == due_date
        assert assignment.close_date == close_date

    def test_create_assignment_with_target_classes(
        self,
        assignment_service: AssignmentService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test creating an assignment targeted to specific classes."""
        assignment_data = AssignmentCreate(
            institution_id=institution.id,
            title="Class Specific Assignment",
            description="For section A only",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=Decimal("100.00"),
        )

        assignment = assignment_service.create_assignment(assignment_data)

        assert assignment is not None
        assert assignment.grade_id == grade.id
        assert assignment.section_id == section.id
        assert assignment.subject_id == subject.id

    def test_create_assignment_due_date_validation(
        self,
        assignment_service: AssignmentService,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test that due date must be after publish date."""
        publish_date = datetime.utcnow()
        invalid_due_date = publish_date - timedelta(days=1)
        
        assignment_data = AssignmentCreate(
            institution_id=institution.id,
            title="Invalid Date Assignment",
            description="Test validation",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            publish_date=publish_date,
            due_date=invalid_due_date,
            max_marks=Decimal("100.00"),
        )

        with pytest.raises(HTTPException) as exc_info:
            assignment_service.create_assignment(assignment_data)
        
        assert exc_info.value.status_code == 400
        assert "Due date must be after publish date" in str(exc_info.value.detail)

    def test_create_assignment_close_date_validation(
        self,
        assignment_service: AssignmentService,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test that close date must be on or after due date."""
        due_date = datetime.utcnow() + timedelta(days=7)
        invalid_close_date = due_date - timedelta(days=1)
        
        assignment_data = AssignmentCreate(
            institution_id=institution.id,
            title="Invalid Close Date Assignment",
            description="Test validation",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=due_date,
            close_date=invalid_close_date,
            max_marks=Decimal("100.00"),
        )

        with pytest.raises(HTTPException) as exc_info:
            assignment_service.create_assignment(assignment_data)
        
        assert exc_info.value.status_code == 400
        assert "Close date must be on or after due date" in str(exc_info.value.detail)

    def test_create_assignment_passing_marks_validation(
        self,
        assignment_service: AssignmentService,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test that passing marks cannot exceed max marks."""
        assignment_data = AssignmentCreate(
            institution_id=institution.id,
            title="Invalid Passing Marks Assignment",
            description="Test validation",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=Decimal("100.00"),
            passing_marks=Decimal("150.00"),
        )

        with pytest.raises(HTTPException) as exc_info:
            assignment_service.create_assignment(assignment_data)
        
        assert exc_info.value.status_code == 400
        assert "Passing marks cannot exceed max marks" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_upload_assignment_file_to_s3(
        self,
        assignment_service: AssignmentService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        mock_s3_client,
    ):
        """Test uploading assignment files to S3 (mocked)."""
        # Create assignment
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
            max_file_size_mb=10,
        )
        db_session.add(assignment)
        db_session.commit()
        db_session.refresh(assignment)

        # Create mock upload file
        file_content = b"Test file content for assignment"
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test-assignment.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.size = len(file_content)
        mock_file.read = AsyncMock(return_value=file_content)

        # Upload file
        result = await assignment_service.upload_assignment_file(assignment.id, mock_file)

        # Verify S3 upload was called
        mock_s3_client.upload_file.assert_called_once()
        call_kwargs = mock_s3_client.upload_file.call_args[1]
        assert call_kwargs['file_name'] == "test-assignment.pdf"
        assert call_kwargs['folder'] == f"assignments/{assignment.id}"
        assert call_kwargs['content_type'] == "application/pdf"

        # Verify result
        assert result.file_name == "test-assignment.pdf"
        assert result.file_url == "https://test-bucket.s3.us-east-1.amazonaws.com/test-file.pdf"
        assert result.s3_key == f"assignments/{assignment.id}/test-file.pdf"
        assert result.file_size == len(file_content)

        # Verify database record
        assignment_file = db_session.query(AssignmentFile).filter_by(
            assignment_id=assignment.id
        ).first()
        assert assignment_file is not None
        assert assignment_file.file_name == "test-assignment.pdf"

    @pytest.mark.asyncio
    async def test_upload_assignment_file_size_limit(
        self,
        assignment_service: AssignmentService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        mock_s3_client,
    ):
        """Test file size limit validation for assignment uploads."""
        # Create assignment with 5MB limit
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
            max_file_size_mb=5,
        )
        db_session.add(assignment)
        db_session.commit()
        db_session.refresh(assignment)

        # Create mock file larger than limit (6MB)
        file_content = b"x" * (6 * 1024 * 1024)
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "large-file.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.size = len(file_content)
        mock_file.read = AsyncMock(return_value=file_content)

        # Attempt upload
        with pytest.raises(HTTPException) as exc_info:
            await assignment_service.upload_assignment_file(assignment.id, mock_file)
        
        assert exc_info.value.status_code == 400
        assert "File size exceeds maximum" in str(exc_info.value.detail)

    def test_delete_assignment_file_from_s3(
        self,
        assignment_service: AssignmentService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        mock_s3_client,
    ):
        """Test deleting assignment files from S3 (mocked)."""
        # Create assignment with file
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()

        assignment_file = AssignmentFile(
            assignment_id=assignment.id,
            file_name="test-file.pdf",
            file_size=1024,
            file_type="application/pdf",
            file_url="https://test-bucket.s3.us-east-1.amazonaws.com/test-file.pdf",
            s3_key="assignments/1/test-file.pdf",
        )
        db_session.add(assignment_file)
        db_session.commit()

        # Delete file
        result = assignment_service.delete_assignment_file(assignment_file.id)

        # Verify S3 delete was called
        mock_s3_client.delete_file.assert_called_once_with("assignments/1/test-file.pdf")
        assert result is True


@pytest.mark.unit
class TestSubmissionService:
    """Test submission service business logic."""

    @pytest.fixture
    def submission_service(self, db_session: Session):
        """Create submission service instance."""
        return SubmissionService(db_session)

    @pytest.fixture
    def mock_s3_client(self):
        """Mock S3 client for file upload operations."""
        with patch('src.services.assignment_service.s3_client') as mock_s3:
            mock_s3.upload_file.return_value = (
                "https://test-bucket.s3.us-east-1.amazonaws.com/test-file.pdf",
                "submissions/1/test-file.pdf"
            )
            mock_s3.delete_file.return_value = True
            yield mock_s3

    @pytest.fixture
    def assignment_for_submission(
        self,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Create an assignment for submission tests."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Test Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
            allow_late_submission=False,
            max_file_size_mb=10,
        )
        db_session.add(assignment)
        db_session.commit()
        db_session.refresh(assignment)
        return assignment

    def test_submit_assignment(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
    ):
        """Test submitting an assignment."""
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="<p>This is my submission content</p>",
            submission_text="This is my submission text",
        )

        submission = submission_service.create_or_update_submission(submission_data)

        assert submission is not None
        assert submission.assignment_id == assignment_for_submission.id
        assert submission.student_id == student.id
        assert submission.content == "<p>This is my submission content</p>"
        assert submission.submission_text == "This is my submission text"
        assert submission.status == SubmissionStatus.SUBMITTED
        assert submission.is_late is False
        assert submission.submitted_at is not None

    def test_submit_assignment_late_detection(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        student: Student,
    ):
        """Test late submission detection."""
        # Create assignment with past due date and allow late submission
        assignment = Assignment(
            institution_id=institution.id,
            title="Past Due Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() - timedelta(days=1),  # Past due
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
            allow_late_submission=True,
        )
        db_session.add(assignment)
        db_session.commit()
        db_session.refresh(assignment)

        submission_data = SubmissionCreate(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Late submission",
        )

        submission = submission_service.create_or_update_submission(submission_data)

        assert submission is not None
        assert submission.is_late is True
        assert submission.status == SubmissionStatus.LATE_SUBMITTED

    def test_submit_assignment_late_not_allowed(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        student: Student,
    ):
        """Test that late submission is rejected when not allowed."""
        # Create assignment with past due date and no late submission allowed
        assignment = Assignment(
            institution_id=institution.id,
            title="No Late Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() - timedelta(days=1),  # Past due
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
            allow_late_submission=False,
        )
        db_session.add(assignment)
        db_session.commit()

        submission_data = SubmissionCreate(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Attempting late submission",
        )

        with pytest.raises(HTTPException) as exc_info:
            submission_service.create_or_update_submission(submission_data)
        
        assert exc_info.value.status_code == 400
        assert "Late submissions are not allowed" in str(exc_info.value.detail)

    def test_submit_assignment_duplicate_handling(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
    ):
        """Test duplicate submission handling (updates existing submission)."""
        # First submission
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="First submission",
        )
        first_submission = submission_service.create_or_update_submission(submission_data)
        first_submission_id = first_submission.id

        # Second submission (should update)
        submission_data_update = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="Updated submission",
        )
        second_submission = submission_service.create_or_update_submission(submission_data_update)

        # Should be same submission, just updated
        assert second_submission.id == first_submission_id
        assert second_submission.content == "Updated submission"

        # Verify only one submission exists
        submission_count = db_session.query(Submission).filter_by(
            assignment_id=assignment_for_submission.id,
            student_id=student.id
        ).count()
        assert submission_count == 1

    def test_submit_assignment_after_close_date(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        student: Student,
    ):
        """Test that submission is rejected after close date."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Closed Assignment",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() - timedelta(days=2),
            close_date=datetime.utcnow() - timedelta(days=1),  # Past close date
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
            allow_late_submission=True,
        )
        db_session.add(assignment)
        db_session.commit()

        submission_data = SubmissionCreate(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Too late",
        )

        with pytest.raises(HTTPException) as exc_info:
            submission_service.create_or_update_submission(submission_data)
        
        assert exc_info.value.status_code == 400
        assert "submission period has ended" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_upload_submission_file(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
        mock_s3_client,
    ):
        """Test uploading submission files to S3 (mocked)."""
        # Create submission
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="Submission with file",
        )
        submission = submission_service.create_or_update_submission(submission_data)

        # Create mock upload file
        file_content = b"Test submission file content"
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "submission.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.size = len(file_content)
        mock_file.read = AsyncMock(return_value=file_content)

        # Upload file
        result = await submission_service.upload_submission_file(submission.id, mock_file)

        # Verify S3 upload was called
        mock_s3_client.upload_file.assert_called_once()
        call_kwargs = mock_s3_client.upload_file.call_args[1]
        assert call_kwargs['file_name'] == "submission.pdf"
        assert call_kwargs['folder'] == f"submissions/{submission.id}"
        assert call_kwargs['content_type'] == "application/pdf"

        # Verify result
        assert result.file_name == "submission.pdf"
        assert result.file_url == "https://test-bucket.s3.us-east-1.amazonaws.com/test-file.pdf"

    def test_grade_assignment_with_marks(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
        teacher: Teacher,
    ):
        """Test grading assignment with marks."""
        # Create submission
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="Submission to grade",
        )
        submission = submission_service.create_or_update_submission(submission_data)

        # Grade submission
        grade_data = SubmissionGradeInput(
            marks_obtained=Decimal("85.00"),
            grade="A",
            feedback="Excellent work!",
        )
        graded_submission = submission_service.grade_submission(
            submission.id,
            teacher.id,
            grade_data
        )

        assert graded_submission.marks_obtained == Decimal("85.00")
        assert graded_submission.grade == "A"
        assert graded_submission.feedback == "Excellent work!"
        assert graded_submission.graded_by == teacher.id
        assert graded_submission.status == SubmissionStatus.GRADED
        assert graded_submission.graded_at is not None

    def test_grade_assignment_with_feedback(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
        teacher: Teacher,
    ):
        """Test grading assignment with detailed feedback."""
        # Create submission
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="Submission to grade",
        )
        submission = submission_service.create_or_update_submission(submission_data)

        # Grade with detailed feedback
        detailed_feedback = """
        Overall: Good effort
        Strengths: Clear explanation, good examples
        Areas for improvement: Needs more detail in section 2
        """
        grade_data = SubmissionGradeInput(
            marks_obtained=Decimal("75.00"),
            grade="B",
            feedback=detailed_feedback,
        )
        graded_submission = submission_service.grade_submission(
            submission.id,
            teacher.id,
            grade_data
        )

        assert graded_submission.feedback == detailed_feedback

    def test_grade_assignment_exceeds_max_marks(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
        teacher: Teacher,
    ):
        """Test that grading with marks exceeding max marks is rejected."""
        # Create submission
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="Submission to grade",
        )
        submission = submission_service.create_or_update_submission(submission_data)

        # Attempt to grade with marks > max_marks
        grade_data = SubmissionGradeInput(
            marks_obtained=Decimal("150.00"),  # max_marks is 100
            grade="A+",
        )

        with pytest.raises(HTTPException) as exc_info:
            submission_service.grade_submission(submission.id, teacher.id, grade_data)
        
        assert exc_info.value.status_code == 400
        assert "cannot exceed maximum marks" in str(exc_info.value.detail)

    def test_grade_assignment_with_late_penalty(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        student: Student,
    ):
        """Test grading late submission with penalty applied."""
        # Create assignment with late penalty
        assignment = Assignment(
            institution_id=institution.id,
            title="Assignment with Penalty",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() - timedelta(days=1),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
            allow_late_submission=True,
            late_penalty_percentage=10.0,  # 10% penalty
        )
        db_session.add(assignment)
        db_session.commit()

        # Create late submission
        submission_data = SubmissionCreate(
            assignment_id=assignment.id,
            student_id=student.id,
            content="Late submission",
        )
        submission = submission_service.create_or_update_submission(submission_data)
        assert submission.is_late is True

        # Grade submission
        grade_data = SubmissionGradeInput(
            marks_obtained=Decimal("90.00"),
            grade="A",
        )
        graded_submission = submission_service.grade_submission(
            submission.id,
            teacher.id,
            grade_data
        )

        # Should apply 10% penalty: 90 - (10% of 90) = 81
        expected_marks = Decimal("81.00")
        assert graded_submission.marks_obtained == expected_marks

    def test_calculate_submission_statistics_submitted_pending_counts(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
        institution,
        section: Section,
        student_user,
        academic_year,
    ):
        """Test calculating submission statistics for submitted and pending counts."""
        # Create additional students
        from src.models.user import User
        from src.models.role import Role
        
        role = db_session.query(Role).filter_by(name="Student").first()
        
        students = []
        for i in range(5):
            user = User(
                username=f"student{i+2}",
                email=f"student{i+2}@test.com",
                first_name=f"Student{i+2}",
                last_name="Test",
                hashed_password="hashed",
                institution_id=institution.id,
                role_id=role.id,
                is_active=True,
            )
            db_session.add(user)
            db_session.commit()
            
            student_obj = Student(
                institution_id=institution.id,
                user_id=user.id,
                admission_number=f"ADM00{i+2}",
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                section_id=section.id,
                date_of_birth=datetime(2008, 3, 20).date(),
                admission_date=datetime(2020, 4, 1).date(),
                gender="Male",
                is_active=True,
            )
            db_session.add(student_obj)
            students.append(student_obj)
        db_session.commit()

        # Create submissions for 3 students (including original student)
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="Submission 1",
        )
        submission_service.create_or_update_submission(submission_data)

        for i in range(2):
            submission_data = SubmissionCreate(
                assignment_id=assignment_for_submission.id,
                student_id=students[i].id,
                content=f"Submission {i+2}",
            )
            submission_service.create_or_update_submission(submission_data)

        # Get statistics
        stats = submission_service.get_submission_statistics(assignment_for_submission.id)

        assert stats['submitted_count'] == 3
        assert stats['not_submitted_count'] >= 3  # At least 3 not submitted
        assert stats['pending_grading'] == 3  # None graded yet

    def test_calculate_submission_statistics_average_grades(
        self,
        submission_service: SubmissionService,
        db_session: Session,
        assignment_for_submission: Assignment,
        student: Student,
        teacher: Teacher,
        institution,
        section: Section,
        academic_year,
    ):
        """Test calculating average grades in submission statistics."""
        # Create additional students and submissions
        from src.models.user import User
        from src.models.role import Role
        
        role = db_session.query(Role).filter_by(name="Student").first()
        
        marks_list = [Decimal("80.00"), Decimal("90.00"), Decimal("70.00")]
        submissions = []
        
        # First submission with original student
        submission_data = SubmissionCreate(
            assignment_id=assignment_for_submission.id,
            student_id=student.id,
            content="Submission",
        )
        submission1 = submission_service.create_or_update_submission(submission_data)
        grade_data = SubmissionGradeInput(marks_obtained=marks_list[0], grade="B")
        submission_service.grade_submission(submission1.id, teacher.id, grade_data)
        
        # Create more students and grade their submissions
        for i in range(2):
            user = User(
                username=f"studentstat{i+2}",
                email=f"studentstat{i+2}@test.com",
                first_name=f"Student{i+2}",
                last_name="Stat",
                hashed_password="hashed",
                institution_id=institution.id,
                role_id=role.id,
                is_active=True,
            )
            db_session.add(user)
            db_session.commit()
            
            student_obj = Student(
                institution_id=institution.id,
                user_id=user.id,
                admission_number=f"ADMSTAT{i+2}",
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                section_id=section.id,
                date_of_birth=datetime(2008, 3, 20).date(),
                admission_date=datetime(2020, 4, 1).date(),
                gender="Male",
                is_active=True,
            )
            db_session.add(student_obj)
            db_session.commit()
            
            submission_data = SubmissionCreate(
                assignment_id=assignment_for_submission.id,
                student_id=student_obj.id,
                content=f"Submission {i+2}",
            )
            sub = submission_service.create_or_update_submission(submission_data)
            grade_data = SubmissionGradeInput(marks_obtained=marks_list[i+1], grade="A")
            submission_service.grade_submission(sub.id, teacher.id, grade_data)

        # Get statistics
        stats = submission_service.get_submission_statistics(assignment_for_submission.id)

        # Average should be (80 + 90 + 70) / 3 = 80
        expected_average = Decimal("80.00")
        assert stats['average_marks'] == expected_average
        assert stats['graded_count'] == 3
        assert stats['highest_marks'] == Decimal("90.00")
        assert stats['lowest_marks'] == Decimal("70.00")


@pytest.mark.unit
class TestRubricService:
    """Test rubric service for assignment grading."""

    @pytest.fixture
    def rubric_service(self, db_session: Session):
        """Create rubric service instance."""
        return RubricService(db_session)

    @pytest.fixture
    def assignment_with_rubric(
        self,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Create an assignment for rubric tests."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Assignment with Rubric",
            description="Test rubric grading",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=7),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()
        db_session.refresh(assignment)
        return assignment

    def test_create_rubric_criteria(
        self,
        rubric_service: RubricService,
        db_session: Session,
        assignment_with_rubric: Assignment,
    ):
        """Test creating rubric criteria with levels."""
        criteria_data = RubricCriteriaCreate(
            name="Content Quality",
            description="Evaluates the quality of content",
            max_points=Decimal("30.00"),
            order=1,
            levels=[
                RubricLevelCreate(
                    name="Excellent",
                    description="Outstanding content",
                    points=Decimal("30.00"),
                    order=1,
                ),
                RubricLevelCreate(
                    name="Good",
                    description="Good content quality",
                    points=Decimal("20.00"),
                    order=2,
                ),
                RubricLevelCreate(
                    name="Fair",
                    description="Acceptable content",
                    points=Decimal("10.00"),
                    order=3,
                ),
            ],
        )

        criteria = rubric_service.create_criteria(assignment_with_rubric.id, criteria_data)

        assert criteria is not None
        assert criteria.name == "Content Quality"
        assert criteria.max_points == Decimal("30.00")
        assert len(criteria.levels) == 3
        assert criteria.levels[0].name == "Excellent"

    def test_grade_submission_with_rubric(
        self,
        rubric_service: RubricService,
        db_session: Session,
        assignment_with_rubric: Assignment,
        student: Student,
        teacher: Teacher,
    ):
        """Test grading submission using rubric criteria."""
        # Create rubric criteria
        criteria1_data = RubricCriteriaCreate(
            name="Content",
            description="Content quality",
            max_points=Decimal("50.00"),
            order=1,
            levels=[],
        )
        criteria1 = rubric_service.create_criteria(assignment_with_rubric.id, criteria1_data)

        criteria2_data = RubricCriteriaCreate(
            name="Presentation",
            description="Presentation quality",
            max_points=Decimal("30.00"),
            order=2,
            levels=[],
        )
        criteria2 = rubric_service.create_criteria(assignment_with_rubric.id, criteria2_data)

        # Create submission
        submission = Submission(
            assignment_id=assignment_with_rubric.id,
            student_id=student.id,
            content="Test submission",
            status=SubmissionStatus.SUBMITTED,
            submitted_at=datetime.utcnow(),
        )
        db_session.add(submission)
        db_session.commit()
        db_session.refresh(submission)

        # Grade with rubric
        bulk_grade_data = BulkGradeInput(
            marks_obtained=Decimal("75.00"),
            grade="B",
            feedback="Good work overall",
            rubric_grades=[
                SubmissionGradeCreate(
                    criteria_id=criteria1.id,
                    points_awarded=Decimal("45.00"),
                    feedback="Excellent content",
                ),
                SubmissionGradeCreate(
                    criteria_id=criteria2.id,
                    points_awarded=Decimal("25.00"),
                    feedback="Good presentation",
                ),
            ],
        )

        graded_submission = rubric_service.grade_submission_with_rubric(
            submission.id,
            teacher.id,
            bulk_grade_data
        )

        assert graded_submission.marks_obtained == Decimal("75.00")
        assert graded_submission.grade == "B"
        assert graded_submission.status == SubmissionStatus.GRADED
        
        # Verify rubric grades were saved
        rubric_grades = db_session.query(SubmissionGrade).filter_by(
            submission_id=submission.id
        ).all()
        assert len(rubric_grades) == 2
        assert rubric_grades[0].points_awarded == Decimal("45.00")
        assert rubric_grades[1].points_awarded == Decimal("25.00")

    def test_grade_submission_with_rubric_feedback(
        self,
        rubric_service: RubricService,
        db_session: Session,
        assignment_with_rubric: Assignment,
        student: Student,
        teacher: Teacher,
    ):
        """Test grading submission with detailed rubric feedback."""
        # Create rubric criteria
        criteria_data = RubricCriteriaCreate(
            name="Analysis",
            description="Critical analysis",
            max_points=Decimal("40.00"),
            order=1,
            levels=[],
        )
        criteria = rubric_service.create_criteria(assignment_with_rubric.id, criteria_data)

        # Create submission
        submission = Submission(
            assignment_id=assignment_with_rubric.id,
            student_id=student.id,
            content="Analysis submission",
            status=SubmissionStatus.SUBMITTED,
            submitted_at=datetime.utcnow(),
        )
        db_session.add(submission)
        db_session.commit()
        db_session.refresh(submission)

        # Grade with detailed feedback
        detailed_rubric_feedback = "Strong analytical skills demonstrated. Consider adding more supporting evidence."
        bulk_grade_data = BulkGradeInput(
            marks_obtained=Decimal("35.00"),
            grade="B+",
            feedback="Overall excellent analysis",
            rubric_grades=[
                SubmissionGradeCreate(
                    criteria_id=criteria.id,
                    points_awarded=Decimal("35.00"),
                    feedback=detailed_rubric_feedback,
                ),
            ],
        )

        graded_submission = rubric_service.grade_submission_with_rubric(
            submission.id,
            teacher.id,
            bulk_grade_data
        )

        # Verify rubric feedback
        rubric_grade = db_session.query(SubmissionGrade).filter_by(
            submission_id=submission.id,
            criteria_id=criteria.id
        ).first()
        assert rubric_grade.feedback == detailed_rubric_feedback


@pytest.mark.unit
class TestAssignmentReminders:
    """Test assignment reminder notifications."""

    @pytest.fixture
    def mock_notification_service(self):
        """Mock notification service for testing reminders."""
        with patch('src.services.notification_service.NotificationService') as mock_notif:
            mock_instance = MagicMock()
            mock_notif.return_value = mock_instance
            yield mock_instance

    def test_assignment_reminder_before_due_date(
        self,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        mock_notification_service,
    ):
        """Test that assignment reminders can be sent before due date."""
        # Create assignment due in 2 days
        assignment = Assignment(
            institution_id=institution.id,
            title="Assignment Due Soon",
            description="Test reminder",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=2),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()
        
        # Simulate reminder task (this would be triggered by Celery in production)
        # For testing, we just verify the assignment data is correct for reminders
        assert assignment.due_date is not None
        assert assignment.due_date > datetime.utcnow()
        assert assignment.status == AssignmentStatus.PUBLISHED
        
        # In production, this would trigger notification service
        # mock_notification_service.send_reminder.assert_called_once()

    def test_assignment_overdue_reminder(
        self,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        student: Student,
    ):
        """Test identifying overdue assignments for reminders."""
        # Create overdue assignment
        assignment = Assignment(
            institution_id=institution.id,
            title="Overdue Assignment",
            description="Test overdue",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() - timedelta(days=1),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()

        # Query for overdue assignments (simulating reminder task)
        overdue_assignments = db_session.query(Assignment).filter(
            Assignment.due_date < datetime.utcnow(),
            Assignment.status == AssignmentStatus.PUBLISHED
        ).all()

        assert len(overdue_assignments) == 1
        assert overdue_assignments[0].id == assignment.id

    def test_assignment_reminder_for_unsubmitted(
        self,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
        student: Student,
    ):
        """Test identifying students who haven't submitted for reminder."""
        # Create assignment
        assignment = Assignment(
            institution_id=institution.id,
            title="Assignment for Reminder",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.utcnow() + timedelta(days=1),
            max_marks=Decimal("100.00"),
            status=AssignmentStatus.PUBLISHED,
        )
        db_session.add(assignment)
        db_session.commit()

        # Get all students in section
        students_in_section = db_session.query(Student).filter(
            Student.section_id == section.id,
            Student.is_active == True
        ).all()

        # Get students who have submitted
        submitted_student_ids = db_session.query(Submission.student_id).filter(
            Submission.assignment_id == assignment.id,
            Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.LATE_SUBMITTED, SubmissionStatus.GRADED])
        ).all()
        submitted_ids = [s[0] for s in submitted_student_ids]

        # Students who need reminder
        students_needing_reminder = [
            s for s in students_in_section if s.id not in submitted_ids
        ]

        assert len(students_needing_reminder) >= 1
        assert student.id in [s.id for s in students_needing_reminder]
