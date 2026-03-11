from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from datetime import datetime
from src.models.assignment import (
    Assignment, AssignmentFile, Submission, SubmissionFile, 
    AssignmentStatus, SubmissionStatus, RubricCriteria, RubricLevel, SubmissionGrade
)


class AssignmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Assignment:
        assignment = Assignment(**kwargs)
        self.db.add(assignment)
        self.db.flush()
        return assignment

    def get_by_id(self, assignment_id: int) -> Optional[Assignment]:
        return self.db.query(Assignment).filter(Assignment.id == assignment_id).first()

    def get_with_files(self, assignment_id: int) -> Optional[Assignment]:
        return self.db.query(Assignment).options(
            joinedload(Assignment.attachment_files)
        ).filter(Assignment.id == assignment_id).first()

    def list_by_institution(
        self,
        institution_id: int,
        skip: int = 0,
        limit: int = 100,
        grade_id: Optional[int] = None,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        teacher_id: Optional[int] = None,
        status: Optional[AssignmentStatus] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[Assignment]:
        query = self.db.query(Assignment).filter(
            Assignment.institution_id == institution_id
        )

        if grade_id:
            query = query.filter(Assignment.grade_id == grade_id)

        if section_id:
            query = query.filter(Assignment.section_id == section_id)

        if subject_id:
            query = query.filter(Assignment.subject_id == subject_id)

        if teacher_id:
            query = query.filter(Assignment.teacher_id == teacher_id)

        if status:
            query = query.filter(Assignment.status == status)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Assignment.title.ilike(search_pattern),
                    Assignment.description.ilike(search_pattern)
                )
            )

        if is_active is not None:
            query = query.filter(Assignment.is_active == is_active)

        return query.order_by(Assignment.due_date.desc()).offset(skip).limit(limit).all()

    def count_by_institution(
        self,
        institution_id: int,
        grade_id: Optional[int] = None,
        section_id: Optional[int] = None,
        subject_id: Optional[int] = None,
        teacher_id: Optional[int] = None,
        status: Optional[AssignmentStatus] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> int:
        query = self.db.query(Assignment).filter(
            Assignment.institution_id == institution_id
        )

        if grade_id:
            query = query.filter(Assignment.grade_id == grade_id)

        if section_id:
            query = query.filter(Assignment.section_id == section_id)

        if subject_id:
            query = query.filter(Assignment.subject_id == subject_id)

        if teacher_id:
            query = query.filter(Assignment.teacher_id == teacher_id)

        if status:
            query = query.filter(Assignment.status == status)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Assignment.title.ilike(search_pattern),
                    Assignment.description.ilike(search_pattern)
                )
            )

        if is_active is not None:
            query = query.filter(Assignment.is_active == is_active)

        return query.count()

    def update(self, assignment: Assignment, **kwargs) -> Assignment:
        for key, value in kwargs.items():
            setattr(assignment, key, value)
        self.db.flush()
        return assignment

    def delete(self, assignment: Assignment) -> None:
        self.db.delete(assignment)
        self.db.flush()


class AssignmentFileRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> AssignmentFile:
        file = AssignmentFile(**kwargs)
        self.db.add(file)
        self.db.flush()
        return file

    def get_by_id(self, file_id: int) -> Optional[AssignmentFile]:
        return self.db.query(AssignmentFile).filter(AssignmentFile.id == file_id).first()

    def list_by_assignment(self, assignment_id: int) -> List[AssignmentFile]:
        return self.db.query(AssignmentFile).filter(
            AssignmentFile.assignment_id == assignment_id
        ).all()

    def delete(self, file: AssignmentFile) -> None:
        self.db.delete(file)
        self.db.flush()


class SubmissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Submission:
        submission = Submission(**kwargs)
        self.db.add(submission)
        self.db.flush()
        return submission

    def get_by_id(self, submission_id: int) -> Optional[Submission]:
        return self.db.query(Submission).filter(Submission.id == submission_id).first()

    def get_with_files(self, submission_id: int) -> Optional[Submission]:
        return self.db.query(Submission).options(
            joinedload(Submission.submission_files)
        ).filter(Submission.id == submission_id).first()

    def get_by_assignment_and_student(
        self,
        assignment_id: int,
        student_id: int
    ) -> Optional[Submission]:
        return self.db.query(Submission).filter(
            Submission.assignment_id == assignment_id,
            Submission.student_id == student_id
        ).first()

    def list_by_assignment(
        self,
        assignment_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[SubmissionStatus] = None,
        is_late: Optional[bool] = None
    ) -> List[Submission]:
        query = self.db.query(Submission).filter(
            Submission.assignment_id == assignment_id
        )

        if status:
            query = query.filter(Submission.status == status)

        if is_late is not None:
            query = query.filter(Submission.is_late == is_late)

        return query.order_by(Submission.submitted_at.desc()).offset(skip).limit(limit).all()

    def list_by_student(
        self,
        student_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[SubmissionStatus] = None
    ) -> List[Submission]:
        query = self.db.query(Submission).filter(
            Submission.student_id == student_id
        )

        if status:
            query = query.filter(Submission.status == status)

        return query.order_by(Submission.created_at.desc()).offset(skip).limit(limit).all()

    def count_by_assignment(
        self,
        assignment_id: int,
        status: Optional[SubmissionStatus] = None,
        is_late: Optional[bool] = None
    ) -> int:
        query = self.db.query(Submission).filter(
            Submission.assignment_id == assignment_id
        )

        if status:
            query = query.filter(Submission.status == status)

        if is_late is not None:
            query = query.filter(Submission.is_late == is_late)

        return query.count()

    def get_submission_statistics(self, assignment_id: int) -> Dict[str, Any]:
        total = self.db.query(func.count(Submission.id)).filter(
            Submission.assignment_id == assignment_id
        ).scalar() or 0

        submitted = self.db.query(func.count(Submission.id)).filter(
            Submission.assignment_id == assignment_id,
            Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.LATE_SUBMITTED, SubmissionStatus.GRADED, SubmissionStatus.RETURNED])
        ).scalar() or 0

        late = self.db.query(func.count(Submission.id)).filter(
            Submission.assignment_id == assignment_id,
            Submission.is_late == True
        ).scalar() or 0

        graded = self.db.query(func.count(Submission.id)).filter(
            Submission.assignment_id == assignment_id,
            Submission.status.in_([SubmissionStatus.GRADED, SubmissionStatus.RETURNED])
        ).scalar() or 0

        avg_marks = self.db.query(func.avg(Submission.marks_obtained)).filter(
            Submission.assignment_id == assignment_id,
            Submission.marks_obtained.isnot(None)
        ).scalar()

        highest_marks = self.db.query(func.max(Submission.marks_obtained)).filter(
            Submission.assignment_id == assignment_id,
            Submission.marks_obtained.isnot(None)
        ).scalar()

        lowest_marks = self.db.query(func.min(Submission.marks_obtained)).filter(
            Submission.assignment_id == assignment_id,
            Submission.marks_obtained.isnot(None)
        ).scalar()

        return {
            'total_submissions': total,
            'submitted_count': submitted,
            'late_submissions': late,
            'graded_count': graded,
            'pending_count': submitted - graded,
            'average_marks': avg_marks,
            'highest_marks': highest_marks,
            'lowest_marks': lowest_marks
        }

    def update(self, submission: Submission, **kwargs) -> Submission:
        for key, value in kwargs.items():
            setattr(submission, key, value)
        self.db.flush()
        return submission

    def delete(self, submission: Submission) -> None:
        self.db.delete(submission)
        self.db.flush()


class SubmissionFileRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> SubmissionFile:
        file = SubmissionFile(**kwargs)
        self.db.add(file)
        self.db.flush()
        return file

    def get_by_id(self, file_id: int) -> Optional[SubmissionFile]:
        return self.db.query(SubmissionFile).filter(SubmissionFile.id == file_id).first()

    def list_by_submission(self, submission_id: int) -> List[SubmissionFile]:
        return self.db.query(SubmissionFile).filter(
            SubmissionFile.submission_id == submission_id
        ).all()

    def delete(self, file: SubmissionFile) -> None:
        self.db.delete(file)
        self.db.flush()


class RubricCriteriaRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> RubricCriteria:
        criteria = RubricCriteria(**kwargs)
        self.db.add(criteria)
        self.db.flush()
        return criteria

    def get_by_id(self, criteria_id: int) -> Optional[RubricCriteria]:
        return self.db.query(RubricCriteria).filter(RubricCriteria.id == criteria_id).first()

    def get_with_levels(self, criteria_id: int) -> Optional[RubricCriteria]:
        return self.db.query(RubricCriteria).options(
            joinedload(RubricCriteria.levels)
        ).filter(RubricCriteria.id == criteria_id).first()

    def list_by_assignment(self, assignment_id: int) -> List[RubricCriteria]:
        return self.db.query(RubricCriteria).options(
            joinedload(RubricCriteria.levels)
        ).filter(
            RubricCriteria.assignment_id == assignment_id
        ).order_by(RubricCriteria.order).all()

    def update(self, criteria: RubricCriteria, **kwargs) -> RubricCriteria:
        for key, value in kwargs.items():
            setattr(criteria, key, value)
        self.db.flush()
        return criteria

    def delete(self, criteria: RubricCriteria) -> None:
        self.db.delete(criteria)
        self.db.flush()


class RubricLevelRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> RubricLevel:
        level = RubricLevel(**kwargs)
        self.db.add(level)
        self.db.flush()
        return level

    def get_by_id(self, level_id: int) -> Optional[RubricLevel]:
        return self.db.query(RubricLevel).filter(RubricLevel.id == level_id).first()

    def update(self, level: RubricLevel, **kwargs) -> RubricLevel:
        for key, value in kwargs.items():
            setattr(level, key, value)
        self.db.flush()
        return level

    def delete(self, level: RubricLevel) -> None:
        self.db.delete(level)
        self.db.flush()


class SubmissionGradeRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> SubmissionGrade:
        grade = SubmissionGrade(**kwargs)
        self.db.add(grade)
        self.db.flush()
        return grade

    def get_by_id(self, grade_id: int) -> Optional[SubmissionGrade]:
        return self.db.query(SubmissionGrade).filter(SubmissionGrade.id == grade_id).first()

    def get_by_submission_and_criteria(
        self,
        submission_id: int,
        criteria_id: int
    ) -> Optional[SubmissionGrade]:
        return self.db.query(SubmissionGrade).filter(
            SubmissionGrade.submission_id == submission_id,
            SubmissionGrade.criteria_id == criteria_id
        ).first()

    def list_by_submission(self, submission_id: int) -> List[SubmissionGrade]:
        return self.db.query(SubmissionGrade).filter(
            SubmissionGrade.submission_id == submission_id
        ).all()

    def update(self, grade: SubmissionGrade, **kwargs) -> SubmissionGrade:
        for key, value in kwargs.items():
            setattr(grade, key, value)
        self.db.flush()
        return grade

    def delete(self, grade: SubmissionGrade) -> None:
        self.db.delete(grade)
        self.db.flush()
