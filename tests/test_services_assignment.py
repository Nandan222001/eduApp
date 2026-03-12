import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from src.services.assignment_service import AssignmentService
from src.models.assignment import Assignment, AssignmentStatus
from src.models.teacher import Teacher
from src.models.academic import Grade, Section, Subject
from src.schemas.assignment import AssignmentCreate, AssignmentUpdate


@pytest.mark.unit
class TestAssignmentService:
    """Test assignment service business logic."""

    @pytest.fixture
    def assignment_service(self, db_session: Session):
        """Create assignment service instance."""
        return AssignmentService(db_session)

    def test_create_assignment(
        self,
        assignment_service: AssignmentService,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test creating an assignment."""
        assignment_data = AssignmentCreate(
            institution_id=institution.id,
            title="Test Assignment",
            description="Complete exercises",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
        )

        assignment = assignment_service.create_assignment(assignment_data)

        assert assignment is not None
        assert assignment.title == "Test Assignment"
        assert assignment.total_marks == 100
        assert assignment.status == AssignmentStatus.ACTIVE

    def test_update_assignment(
        self,
        assignment_service: AssignmentService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test updating an assignment."""
        assignment = Assignment(
            institution_id=institution.id,
            title="Original Title",
            description="Original description",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        update_data = AssignmentUpdate(
            title="Updated Title",
            total_marks=150,
        )

        updated = assignment_service.update_assignment(assignment.id, update_data)

        assert updated.title == "Updated Title"
        assert updated.total_marks == 150

    def test_list_assignments_with_filters(
        self,
        assignment_service: AssignmentService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test listing assignments with filters."""
        for i in range(5):
            assignment = Assignment(
                institution_id=institution.id,
                title=f"Assignment {i}",
                description="Test",
                grade_id=grade.id,
                section_id=section.id,
                subject_id=subject.id,
                teacher_id=teacher.id,
                due_date=datetime.now() + timedelta(days=7),
                total_marks=100,
                status=AssignmentStatus.ACTIVE,
            )
            db_session.add(assignment)
        db_session.commit()

        assignments, total = assignment_service.list_assignments(
            institution_id=institution.id,
            grade_id=grade.id,
        )

        assert total == 5
        assert len(assignments) == 5

    def test_delete_assignment(
        self,
        assignment_service: AssignmentService,
        db_session: Session,
        institution,
        grade: Grade,
        section: Section,
        subject: Subject,
        teacher: Teacher,
    ):
        """Test deleting an assignment."""
        assignment = Assignment(
            institution_id=institution.id,
            title="To Delete",
            description="Test",
            grade_id=grade.id,
            section_id=section.id,
            subject_id=subject.id,
            teacher_id=teacher.id,
            due_date=datetime.now() + timedelta(days=7),
            total_marks=100,
            status=AssignmentStatus.ACTIVE,
        )
        db_session.add(assignment)
        db_session.commit()

        assignment_service.delete_assignment(assignment.id)

        deleted = db_session.query(Assignment).filter_by(id=assignment.id).first()
        assert deleted is None
