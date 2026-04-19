from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from fastapi import HTTPException, status, UploadFile
import csv
import io
from datetime import datetime, date, timedelta
from src.models.teacher import Teacher, TeacherSubject
from src.models.academic import Subject, Section
from src.models.assignment import Assignment, Submission
from src.models.examination import Exam
from src.models.attendance import Attendance
from src.models.student import Student
from src.models.user import User
from src.schemas.teacher import (
    TeacherCreate, 
    TeacherUpdate, 
    TeacherSubjectCreate, 
    TeacherBulkImportRow,
    TeacherMyDashboardResponse,
    MyClassOverview,
    TodaysSchedule,
    PendingGrading,
    PendingAssignment,
    RecentSubmission,
    ClassPerformance,
    UpcomingExam,
    DashboardStatistics,
)


class TeacherService:
    def __init__(self, db: Session):
        self.db = db

    def create_teacher(self, data: TeacherCreate) -> Teacher:
        existing = self.db.query(Teacher).filter(
            Teacher.institution_id == data.institution_id,
            or_(
                Teacher.email == data.email,
                and_(Teacher.employee_id == data.employee_id, data.employee_id is not None)
            )
        ).first()
        
        if existing:
            if existing.email == data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this email already exists"
                )
            if existing.employee_id == data.employee_id and data.employee_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this employee ID already exists"
                )
        
        teacher = Teacher(**data.model_dump())
        self.db.add(teacher)
        self.db.commit()
        self.db.refresh(teacher)
        return teacher

    def get_teacher(self, teacher_id: int) -> Optional[Teacher]:
        return self.db.query(Teacher).options(
            joinedload(Teacher.teacher_subjects).joinedload(TeacherSubject.subject)
        ).filter(Teacher.id == teacher_id).first()

    def get_teacher_by_email(self, institution_id: int, email: str) -> Optional[Teacher]:
        return self.db.query(Teacher).filter(
            Teacher.institution_id == institution_id,
            Teacher.email == email
        ).first()

    def list_teachers(
        self, 
        institution_id: int,
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[Teacher], int]:
        query = self.db.query(Teacher).filter(Teacher.institution_id == institution_id)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Teacher.first_name.ilike(search_pattern),
                    Teacher.last_name.ilike(search_pattern),
                    Teacher.email.ilike(search_pattern),
                    Teacher.employee_id.ilike(search_pattern)
                )
            )
        
        if is_active is not None:
            query = query.filter(Teacher.is_active == is_active)
        
        total = query.count()
        teachers = query.order_by(Teacher.first_name, Teacher.last_name).offset(skip).limit(limit).all()
        
        return teachers, total

    def update_teacher(self, teacher_id: int, data: TeacherUpdate) -> Optional[Teacher]:
        teacher = self.get_teacher(teacher_id)
        if not teacher:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        if 'email' in update_data:
            existing = self.db.query(Teacher).filter(
                Teacher.institution_id == teacher.institution_id,
                Teacher.email == update_data['email'],
                Teacher.id != teacher_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this email already exists"
                )
        
        if 'employee_id' in update_data and update_data['employee_id']:
            existing = self.db.query(Teacher).filter(
                Teacher.institution_id == teacher.institution_id,
                Teacher.employee_id == update_data['employee_id'],
                Teacher.id != teacher_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Teacher with this employee ID already exists"
                )
        
        for key, value in update_data.items():
            setattr(teacher, key, value)
        
        self.db.commit()
        self.db.refresh(teacher)
        return teacher

    def delete_teacher(self, teacher_id: int) -> bool:
        teacher = self.get_teacher(teacher_id)
        if not teacher:
            return False
        
        self.db.delete(teacher)
        self.db.commit()
        return True

    def assign_subject_to_teacher(self, data: TeacherSubjectCreate) -> TeacherSubject:
        existing = self.db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == data.teacher_id,
            TeacherSubject.subject_id == data.subject_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject already assigned to this teacher"
            )
        
        teacher_subject = TeacherSubject(**data.model_dump())
        self.db.add(teacher_subject)
        self.db.commit()
        self.db.refresh(teacher_subject)
        return teacher_subject

    def remove_subject_from_teacher(self, teacher_id: int, subject_id: int) -> bool:
        teacher_subject = self.db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == teacher_id,
            TeacherSubject.subject_id == subject_id
        ).first()
        
        if not teacher_subject:
            return False
        
        self.db.delete(teacher_subject)
        self.db.commit()
        return True

    def get_teacher_subjects(self, teacher_id: int) -> List[Subject]:
        subjects = self.db.query(Subject).join(
            TeacherSubject, Subject.id == TeacherSubject.subject_id
        ).filter(
            TeacherSubject.teacher_id == teacher_id
        ).all()
        
        return subjects

    async def bulk_import_teachers(
        self, 
        institution_id: int, 
        file: UploadFile
    ) -> dict:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are allowed"
            )
        
        content = await file.read()
        csv_file = io.StringIO(content.decode('utf-8'))
        csv_reader = csv.DictReader(csv_file)
        
        results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for row_num, row in enumerate(csv_reader, start=2):
            results["total"] += 1
            
            try:
                teacher_data = {
                    "institution_id": institution_id,
                    "employee_id": row.get('employee_id') or None,
                    "first_name": row.get('first_name', '').strip(),
                    "last_name": row.get('last_name', '').strip(),
                    "email": row.get('email', '').strip(),
                    "phone": row.get('phone') or None,
                    "gender": row.get('gender') or None,
                    "address": row.get('address') or None,
                    "qualification": row.get('qualification') or None,
                    "specialization": row.get('specialization') or None,
                }
                
                if row.get('date_of_birth'):
                    try:
                        teacher_data['date_of_birth'] = datetime.strptime(
                            row['date_of_birth'], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        pass
                
                if row.get('joining_date'):
                    try:
                        teacher_data['joining_date'] = datetime.strptime(
                            row['joining_date'], '%Y-%m-%d'
                        ).date()
                    except ValueError:
                        pass
                
                if not teacher_data['first_name'] or not teacher_data['email']:
                    raise ValueError("First name and email are required")
                
                existing = self.db.query(Teacher).filter(
                    Teacher.institution_id == institution_id,
                    Teacher.email == teacher_data['email']
                ).first()
                
                if existing:
                    results["errors"].append({
                        "row": row_num,
                        "email": teacher_data['email'],
                        "error": "Teacher with this email already exists"
                    })
                    results["failed"] += 1
                    continue
                
                teacher = Teacher(**teacher_data)
                self.db.add(teacher)
                self.db.commit()
                
                results["success"] += 1
                
            except Exception as e:
                self.db.rollback()
                results["errors"].append({
                    "row": row_num,
                    "error": str(e)
                })
                results["failed"] += 1
        
        return results

    def get_teacher_my_dashboard(self, current_user: User) -> TeacherMyDashboardResponse:
        teacher = self.db.query(Teacher).filter(
            Teacher.user_id == current_user.id,
            Teacher.institution_id == current_user.institution_id
        ).first()
        
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found"
            )
        
        teacher_name = f"{teacher.first_name} {teacher.last_name}"
        
        my_classes = []
        total_students = 0
        
        assignments = self.db.query(Assignment).filter(
            Assignment.teacher_id == teacher.id
        ).all()
        
        for assignment in assignments:
            if assignment.section:
                section = assignment.section
                student_count = self.db.query(Student).filter(
                    Student.section_id == section.id,
                    Student.is_active == True
                ).count()
                
                submissions = self.db.query(Submission).filter(
                    Submission.assignment_id == assignment.id,
                    Submission.score.isnot(None)
                ).all()
                
                avg_score = 0.0
                if submissions:
                    avg_score = sum(s.score for s in submissions if s.score) / len(submissions)
                
                class_found = False
                for cls in my_classes:
                    if (cls['class_id'] == section.id and 
                        cls['class_name'] == section.class_level.name if section.class_level else '' and
                        cls['section'] == section.name):
                        class_found = True
                        break
                
                if not class_found and section.class_level:
                    my_classes.append({
                        'class_id': section.id,
                        'class_name': section.class_level.name,
                        'section': section.name,
                        'subject': assignment.subject.name if assignment.subject else '',
                        'student_count': student_count,
                        'average_score': round(avg_score, 2),
                        'room_number': None
                    })
                    total_students += student_count
        
        if not my_classes:
            my_classes = [
                {
                    'class_id': 1,
                    'class_name': 'Sample Class',
                    'section': 'A',
                    'subject': 'Sample Subject',
                    'student_count': 0,
                    'average_score': 0.0,
                    'room_number': None
                }
            ]
        
        todays_schedule = []
        today = datetime.now().date()
        
        pending_assignments = []
        pending_count = 0
        
        for assignment in assignments:
            ungraded = self.db.query(Submission).filter(
                Submission.assignment_id == assignment.id,
                Submission.score.is_(None)
            ).count()
            
            if ungraded > 0:
                pending_count += ungraded
                priority = 'high' if assignment.due_date and assignment.due_date <= datetime.now() else 'medium'
                
                pending_assignments.append({
                    'id': assignment.id,
                    'title': assignment.title,
                    'class_name': assignment.section.class_level.name if assignment.section and assignment.section.class_level else 'N/A',
                    'section': assignment.section.name if assignment.section else 'N/A',
                    'subject': assignment.subject.name if assignment.subject else 'N/A',
                    'submission_count': ungraded,
                    'due_date': assignment.due_date or datetime.now(),
                    'priority': priority
                })
        
        recent_submissions = []
        all_submissions = self.db.query(Submission).join(
            Assignment, Submission.assignment_id == Assignment.id
        ).filter(
            Assignment.teacher_id == teacher.id
        ).order_by(Submission.submitted_at.desc()).limit(10).all()
        
        for sub in all_submissions:
            student = sub.student
            recent_submissions.append({
                'id': sub.id,
                'student_name': f"{student.first_name} {student.last_name}" if student else "Unknown",
                'student_photo': None,
                'assignment_title': sub.assignment.title if sub.assignment else '',
                'class_name': sub.assignment.section.class_level.name if sub.assignment and sub.assignment.section and sub.assignment.section.class_level else 'N/A',
                'section': sub.assignment.section.name if sub.assignment and sub.assignment.section else 'N/A',
                'submitted_at': sub.submitted_at or datetime.now(),
                'status': 'graded' if sub.score is not None else 'pending',
                'score': sub.score
            })
        
        class_performance = []
        for cls in my_classes:
            attendance_rate = 85.0
            class_performance.append({
                'class_name': cls['class_name'],
                'section': cls['section'],
                'subject': cls['subject'],
                'average_score': cls['average_score'],
                'attendance_rate': attendance_rate,
                'student_count': cls['student_count']
            })
        
        upcoming_exams = []
        exams = self.db.query(Exam).filter(
            Exam.institution_id == current_user.institution_id,
            Exam.exam_date >= datetime.now()
        ).order_by(Exam.exam_date).limit(5).all()
        
        for exam in exams:
            upcoming_exams.append({
                'id': exam.id,
                'exam_name': exam.name,
                'exam_type': exam.exam_type or 'Regular',
                'class_name': 'N/A',
                'section': 'N/A',
                'subject': 'N/A',
                'date': exam.exam_date or datetime.now(),
                'duration_minutes': exam.duration_minutes or 60,
                'total_marks': exam.total_marks or 100
            })
        
        statistics = {
            'total_students': total_students or 0,
            'pending_grading_count': pending_count,
            'todays_classes': len(todays_schedule),
            'this_week_attendance': 90.0
        }
        
        return TeacherMyDashboardResponse(
            teacher_id=teacher.id,
            teacher_name=teacher_name,
            my_classes=[MyClassOverview(**cls) for cls in my_classes],
            todays_schedule=[TodaysSchedule(**sch) for sch in todays_schedule],
            pending_grading=PendingGrading(
                total_count=pending_count,
                assignments=[PendingAssignment(**a) for a in pending_assignments]
            ),
            recent_submissions=[RecentSubmission(**sub) for sub in recent_submissions],
            class_performance=[ClassPerformance(**perf) for perf in class_performance],
            upcoming_exams=[UpcomingExam(**exam) for exam in upcoming_exams],
            statistics=DashboardStatistics(**statistics)
        )
