from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from datetime import datetime
from decimal import Decimal
import io
import zipfile
from src.models.assignment import (
    Assignment, AssignmentFile, Submission, SubmissionFile, 
    AssignmentStatus, SubmissionStatus, RubricCriteria
)
from src.models.student import Student
from src.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionGradeInput,
    FileUploadResponse,
    RubricCriteriaCreate,
    RubricCriteriaUpdate,
    BulkGradeInput
)
from src.repositories.assignment_repository import (
    AssignmentRepository,
    AssignmentFileRepository,
    SubmissionRepository,
    SubmissionFileRepository,
    RubricCriteriaRepository,
    RubricLevelRepository,
    SubmissionGradeRepository
)
from src.utils.s3_client import s3_client
from src.config import settings


class AssignmentService:
    def __init__(self, db: Session):
        self.db = db
        self.assignment_repo = AssignmentRepository(db)
        self.file_repo = AssignmentFileRepository(db)

    def create_assignment(self, data: AssignmentCreate) -> Assignment:
        if data.due_date and data.publish_date:
            if data.due_date <= data.publish_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Due date must be after publish date"
                )

        if data.close_date and data.due_date:
            if data.close_date < data.due_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Close date must be on or after due date"
                )

        if data.passing_marks and data.passing_marks > data.max_marks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passing marks cannot exceed max marks"
            )

        assignment = self.assignment_repo.create(**data.model_dump())
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def get_assignment(self, assignment_id: int) -> Optional[Assignment]:
        return self.assignment_repo.get_by_id(assignment_id)

    def get_assignment_with_files(self, assignment_id: int) -> Optional[Assignment]:
        return self.assignment_repo.get_with_files(assignment_id)

    def list_assignments(
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
    ) -> Tuple[List[Assignment], int]:
        assignments = self.assignment_repo.list_by_institution(
            institution_id=institution_id,
            skip=skip,
            limit=limit,
            grade_id=grade_id,
            section_id=section_id,
            subject_id=subject_id,
            teacher_id=teacher_id,
            status=status,
            search=search,
            is_active=is_active
        )

        total = self.assignment_repo.count_by_institution(
            institution_id=institution_id,
            grade_id=grade_id,
            section_id=section_id,
            subject_id=subject_id,
            teacher_id=teacher_id,
            status=status,
            search=search,
            is_active=is_active
        )

        return assignments, total

    def update_assignment(
        self,
        assignment_id: int,
        data: AssignmentUpdate
    ) -> Optional[Assignment]:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return None

        update_data = data.model_dump(exclude_unset=True)

        if 'due_date' in update_data or 'publish_date' in update_data:
            due_date = update_data.get('due_date', assignment.due_date)
            publish_date = update_data.get('publish_date', assignment.publish_date)
            if due_date and publish_date and due_date <= publish_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Due date must be after publish date"
                )

        if 'close_date' in update_data or 'due_date' in update_data:
            close_date = update_data.get('close_date', assignment.close_date)
            due_date = update_data.get('due_date', assignment.due_date)
            if close_date and due_date and close_date < due_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Close date must be on or after due date"
                )

        if 'passing_marks' in update_data or 'max_marks' in update_data:
            passing_marks = update_data.get('passing_marks', assignment.passing_marks)
            max_marks = update_data.get('max_marks', assignment.max_marks)
            if passing_marks and passing_marks > max_marks:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Passing marks cannot exceed max marks"
                )

        updated_assignment = self.assignment_repo.update(assignment, **update_data)
        self.db.commit()
        self.db.refresh(updated_assignment)
        return updated_assignment

    def delete_assignment(self, assignment_id: int) -> bool:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return False

        for file in assignment.attachment_files:
            try:
                s3_client.delete_file(file.s3_key)
            except Exception:
                pass

        self.assignment_repo.delete(assignment)
        self.db.commit()
        return True

    async def upload_assignment_file(
        self,
        assignment_id: int,
        file: UploadFile
    ) -> FileUploadResponse:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        if file.size and file.size > assignment.max_file_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {assignment.max_file_size_mb}MB"
            )

        file_content = await file.read()
        file_size = len(file_content)

        from io import BytesIO
        file_obj = BytesIO(file_content)

        file_url, s3_key = s3_client.upload_file(
            file_obj=file_obj,
            file_name=file.filename,
            folder=f"assignments/{assignment_id}",
            content_type=file.content_type
        )

        assignment_file = self.file_repo.create(
            assignment_id=assignment_id,
            file_name=file.filename,
            file_size=file_size,
            file_type=file.content_type or "application/octet-stream",
            file_url=file_url,
            s3_key=s3_key
        )

        self.db.commit()
        self.db.refresh(assignment_file)

        return FileUploadResponse(
            file_name=assignment_file.file_name,
            file_url=assignment_file.file_url,
            s3_key=assignment_file.s3_key,
            file_size=assignment_file.file_size,
            file_type=assignment_file.file_type
        )

    def delete_assignment_file(self, file_id: int) -> bool:
        file = self.file_repo.get_by_id(file_id)
        if not file:
            return False

        try:
            s3_client.delete_file(file.s3_key)
        except Exception:
            pass

        self.file_repo.delete(file)
        self.db.commit()
        return True


class SubmissionService:
    def __init__(self, db: Session):
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self.file_repo = SubmissionFileRepository(db)
        self.assignment_repo = AssignmentRepository(db)

    def create_or_update_submission(
        self,
        data: SubmissionCreate
    ) -> Submission:
        assignment = self.assignment_repo.get_by_id(data.assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        if assignment.status == AssignmentStatus.CLOSED or assignment.status == AssignmentStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment is closed for submissions"
            )

        existing_submission = self.submission_repo.get_by_assignment_and_student(
            assignment_id=data.assignment_id,
            student_id=data.student_id
        )

        now = datetime.utcnow()
        is_late = False

        if assignment.due_date and now > assignment.due_date:
            if not assignment.allow_late_submission:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Late submissions are not allowed for this assignment"
                )
            is_late = True

        if assignment.close_date and now > assignment.close_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment submission period has ended"
            )

        if existing_submission:
            update_data = data.model_dump(exclude={'assignment_id', 'student_id'})
            submission = self.submission_repo.update(
                existing_submission,
                **update_data,
                submitted_at=now,
                is_late=is_late,
                status=SubmissionStatus.LATE_SUBMITTED if is_late else SubmissionStatus.SUBMITTED
            )
        else:
            submission = self.submission_repo.create(
                **data.model_dump(),
                submitted_at=now,
                is_late=is_late,
                status=SubmissionStatus.LATE_SUBMITTED if is_late else SubmissionStatus.SUBMITTED
            )

        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_submission(self, submission_id: int) -> Optional[Submission]:
        return self.submission_repo.get_by_id(submission_id)

    def get_submission_with_files(self, submission_id: int) -> Optional[Submission]:
        return self.submission_repo.get_with_files(submission_id)

    def get_student_submission(
        self,
        assignment_id: int,
        student_id: int
    ) -> Optional[Submission]:
        return self.submission_repo.get_by_assignment_and_student(
            assignment_id=assignment_id,
            student_id=student_id
        )

    def list_assignment_submissions(
        self,
        assignment_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[SubmissionStatus] = None,
        is_late: Optional[bool] = None
    ) -> Tuple[List[Submission], int]:
        submissions = self.submission_repo.list_by_assignment(
            assignment_id=assignment_id,
            skip=skip,
            limit=limit,
            status=status,
            is_late=is_late
        )

        total = self.submission_repo.count_by_assignment(
            assignment_id=assignment_id,
            status=status,
            is_late=is_late
        )

        return submissions, total

    def grade_submission(
        self,
        submission_id: int,
        grader_id: int,
        grade_data: SubmissionGradeInput
    ) -> Submission:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )

        assignment = self.assignment_repo.get_by_id(submission.assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        if grade_data.marks_obtained > assignment.max_marks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Marks cannot exceed maximum marks of {assignment.max_marks}"
            )

        marks = grade_data.marks_obtained
        if submission.is_late and assignment.late_penalty_percentage:
            penalty = (assignment.late_penalty_percentage / 100) * marks
            marks = marks - Decimal(str(penalty))
            marks = max(marks, Decimal("0"))

        updated_submission = self.submission_repo.update(
            submission,
            marks_obtained=marks,
            grade=grade_data.grade,
            feedback=grade_data.feedback,
            graded_by=grader_id,
            graded_at=datetime.utcnow(),
            status=SubmissionStatus.GRADED
        )

        self.db.commit()
        self.db.refresh(updated_submission)
        return updated_submission

    async def upload_submission_file(
        self,
        submission_id: int,
        file: UploadFile
    ) -> FileUploadResponse:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )

        assignment = self.assignment_repo.get_by_id(submission.assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        if file.size and file.size > assignment.max_file_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {assignment.max_file_size_mb}MB"
            )

        file_content = await file.read()
        file_size = len(file_content)

        from io import BytesIO
        file_obj = BytesIO(file_content)

        file_url, s3_key = s3_client.upload_file(
            file_obj=file_obj,
            file_name=file.filename,
            folder=f"submissions/{submission_id}",
            content_type=file.content_type
        )

        submission_file = self.file_repo.create(
            submission_id=submission_id,
            file_name=file.filename,
            file_size=file_size,
            file_type=file.content_type or "application/octet-stream",
            file_url=file_url,
            s3_key=s3_key
        )

        self.db.commit()
        self.db.refresh(submission_file)

        return FileUploadResponse(
            file_name=submission_file.file_name,
            file_url=submission_file.file_url,
            s3_key=submission_file.s3_key,
            file_size=submission_file.file_size,
            file_type=submission_file.file_type
        )

    def delete_submission_file(self, file_id: int) -> bool:
        file = self.file_repo.get_by_id(file_id)
        if not file:
            return False

        try:
            s3_client.delete_file(file.s3_key)
        except Exception:
            pass

        self.file_repo.delete(file)
        self.db.commit()
        return True

    def get_submission_statistics(self, assignment_id: int) -> Dict[str, Any]:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        stats = self.submission_repo.get_submission_statistics(assignment_id)

        total_students = 0
        if assignment.section_id:
            total_students = self.db.query(Student).filter(
                Student.section_id == assignment.section_id,
                Student.is_active == True
            ).count()
        else:
            from src.models.academic import Section
            section_ids = self.db.query(Section.id).filter(
                Section.grade_id == assignment.grade_id,
                Section.is_active == True
            ).all()
            section_ids = [s[0] for s in section_ids]
            if section_ids:
                total_students = self.db.query(Student).filter(
                    Student.section_id.in_(section_ids),
                    Student.is_active == True
                ).count()

        not_submitted = total_students - stats['submitted_count']

        pass_count = 0
        if assignment.passing_marks:
            pass_count = self.db.query(Submission).filter(
                Submission.assignment_id == assignment_id,
                Submission.marks_obtained >= assignment.passing_marks
            ).count()

        pass_rate = None
        if stats['graded_count'] > 0:
            pass_rate = (pass_count / stats['graded_count']) * 100

        return {
            'assignment_id': assignment_id,
            'total_students': total_students,
            'submitted_count': stats['submitted_count'],
            'not_submitted_count': not_submitted,
            'late_submissions': stats['late_submissions'],
            'graded_count': stats['graded_count'],
            'pending_grading': stats['pending_count'],
            'average_marks': stats['average_marks'],
            'highest_marks': stats['highest_marks'],
            'lowest_marks': stats['lowest_marks'],
            'pass_rate': pass_rate
        }

    def get_assignment_analytics(self, assignment_id: int) -> Dict[str, Any]:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )

        stats = self.submission_repo.get_submission_statistics(assignment_id)

        total_students = 0
        if assignment.section_id:
            total_students = self.db.query(Student).filter(
                Student.section_id == assignment.section_id,
                Student.is_active == True
            ).count()
        else:
            from src.models.academic import Section
            section_ids = self.db.query(Section.id).filter(
                Section.grade_id == assignment.grade_id,
                Section.is_active == True
            ).all()
            section_ids = [s[0] for s in section_ids]
            if section_ids:
                total_students = self.db.query(Student).filter(
                    Student.section_id.in_(section_ids),
                    Student.is_active == True
                ).count()

        submission_rate = 0
        if total_students > 0:
            submission_rate = (stats['submitted_count'] / total_students) * 100

        on_time = stats['submitted_count'] - stats['late_submissions']

        pass_count = 0
        fail_count = 0
        if assignment.passing_marks:
            pass_count = self.db.query(Submission).filter(
                Submission.assignment_id == assignment_id,
                Submission.marks_obtained >= assignment.passing_marks,
                Submission.marks_obtained.isnot(None)
            ).count()
            fail_count = self.db.query(Submission).filter(
                Submission.assignment_id == assignment_id,
                Submission.marks_obtained < assignment.passing_marks,
                Submission.marks_obtained.isnot(None)
            ).count()

        return {
            'assignment_id': assignment_id,
            'title': assignment.title,
            'total_submissions': stats['submitted_count'],
            'submission_rate': submission_rate,
            'average_marks': stats['average_marks'],
            'on_time_submissions': on_time,
            'late_submissions': stats['late_submissions'],
            'graded_count': stats['graded_count'],
            'pending_count': stats['pending_count'],
            'pass_count': pass_count,
            'fail_count': fail_count
        }

    async def bulk_download_submissions(self, assignment_id: int) -> io.BytesIO:
        import requests
        
        submissions = self.submission_repo.list_by_assignment(
            assignment_id=assignment_id,
            skip=0,
            limit=1000,
            status=SubmissionStatus.SUBMITTED
        )
        
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for submission in submissions:
                student = submission.student
                student_name = f"{student.user.first_name}_{student.user.last_name}".replace(" ", "_")
                
                if submission.submission_text:
                    text_filename = f"{student_name}_submission.txt"
                    zip_file.writestr(text_filename, submission.submission_text)
                
                for file in submission.submission_files:
                    try:
                        response = requests.get(file.file_url)
                        if response.status_code == 200:
                            file_filename = f"{student_name}_{file.file_name}"
                            zip_file.writestr(file_filename, response.content)
                    except Exception:
                        pass
        
        zip_buffer.seek(0)
        return zip_buffer


class RubricService:
    def __init__(self, db: Session):
        self.db = db
        self.criteria_repo = RubricCriteriaRepository(db)
        self.level_repo = RubricLevelRepository(db)
        self.grade_repo = SubmissionGradeRepository(db)
        self.submission_repo = SubmissionRepository(db)
        self.assignment_repo = AssignmentRepository(db)

    def create_criteria(
        self,
        assignment_id: int,
        data: RubricCriteriaCreate
    ) -> RubricCriteria:
        criteria_data = data.model_dump(exclude={'levels'})
        criteria = self.criteria_repo.create(
            assignment_id=assignment_id,
            **criteria_data
        )
        
        for level_data in data.levels:
            self.level_repo.create(
                criteria_id=criteria.id,
                **level_data.model_dump()
            )
        
        self.db.commit()
        self.db.refresh(criteria)
        return criteria

    def update_criteria(
        self,
        criteria_id: int,
        data: RubricCriteriaUpdate
    ) -> Optional[RubricCriteria]:
        criteria = self.criteria_repo.get_by_id(criteria_id)
        if not criteria:
            return None

        update_data = data.model_dump(exclude_unset=True)
        updated_criteria = self.criteria_repo.update(criteria, **update_data)
        self.db.commit()
        self.db.refresh(updated_criteria)
        return updated_criteria

    def delete_criteria(self, criteria_id: int) -> bool:
        criteria = self.criteria_repo.get_by_id(criteria_id)
        if not criteria:
            return False

        self.criteria_repo.delete(criteria)
        self.db.commit()
        return True

    def grade_submission_with_rubric(
        self,
        submission_id: int,
        grader_id: int,
        grade_data: BulkGradeInput
    ) -> Submission:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )

        for rubric_grade in grade_data.rubric_grades:
            existing_grade = self.grade_repo.get_by_submission_and_criteria(
                submission_id=submission_id,
                criteria_id=rubric_grade.criteria_id
            )
            
            if existing_grade:
                self.grade_repo.update(
                    existing_grade,
                    points_awarded=rubric_grade.points_awarded,
                    feedback=rubric_grade.feedback,
                    graded_at=datetime.utcnow()
                )
            else:
                self.grade_repo.create(
                    submission_id=submission_id,
                    criteria_id=rubric_grade.criteria_id,
                    points_awarded=rubric_grade.points_awarded,
                    feedback=rubric_grade.feedback
                )

        updated_submission = self.submission_repo.update(
            submission,
            marks_obtained=grade_data.marks_obtained,
            grade=grade_data.grade,
            feedback=grade_data.feedback,
            graded_by=grader_id,
            graded_at=datetime.utcnow(),
            status=SubmissionStatus.GRADED
        )

        self.db.commit()
        self.db.refresh(updated_submission)
        return updated_submission
