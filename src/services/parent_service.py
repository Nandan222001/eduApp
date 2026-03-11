from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from src.models.student import Student, Parent, StudentParent
from src.models.attendance import Attendance, AttendanceSummary, AttendanceStatus
from src.models.examination import ExamMarks, ExamSubject, Exam
from src.models.assignment import Assignment, Submission, SubmissionStatus
from src.models.goal import Goal, GoalStatus
from src.models.notification import Message
from src.models.academic import Subject, Section, Grade
from src.schemas.parent import (
    ParentDashboardResponse,
    ChildOverviewResponse,
    ChildBasicInfo,
    TodayAttendanceResponse,
    RecentGradeResponse,
    PendingAssignmentResponse,
    WeeklyProgressResponse,
    PerformanceComparisonResponse,
    AttendanceStats,
    SubjectPerformance,
    TermPerformance,
    GoalProgress,
    TeacherMessage,
)


class ParentService:
    def __init__(self, db: Session):
        self.db = db
    
    def _verify_parent_child_relationship(
        self,
        user_id: int,
        child_id: int,
        institution_id: int
    ) -> bool:
        """Verify that the user is a parent of the specified child"""
        parent = self.db.query(Parent).filter(
            Parent.user_id == user_id,
            Parent.institution_id == institution_id,
            Parent.is_active == True
        ).first()
        
        if not parent:
            return False
        
        student_parent = self.db.query(StudentParent).filter(
            StudentParent.parent_id == parent.id,
            StudentParent.student_id == child_id
        ).first()
        
        return student_parent is not None
    
    def get_parent_children(
        self,
        user_id: int,
        institution_id: int
    ) -> List[ChildBasicInfo]:
        """Get all children associated with a parent"""
        parent = self.db.query(Parent).filter(
            Parent.user_id == user_id,
            Parent.institution_id == institution_id,
            Parent.is_active == True
        ).first()
        
        if not parent:
            return []
        
        children = (
            self.db.query(Student)
            .join(StudentParent, StudentParent.student_id == Student.id)
            .outerjoin(Section, Section.id == Student.section_id)
            .outerjoin(Grade, Grade.id == Section.grade_id)
            .filter(
                StudentParent.parent_id == parent.id,
                Student.is_active == True
            )
            .all()
        )
        
        result = []
        for child in children:
            section_name = child.section.name if child.section else None
            grade_name = child.section.grade.name if child.section and child.section.grade else None
            
            result.append(ChildBasicInfo(
                id=child.id,
                first_name=child.first_name,
                last_name=child.last_name,
                admission_number=child.admission_number,
                photo_url=child.photo_url,
                section_name=section_name,
                grade_name=grade_name
            ))
        
        return result
    
    def get_child_overview(
        self,
        child_id: int,
        user_id: int,
        institution_id: int
    ) -> Optional[ChildOverviewResponse]:
        """Get detailed overview for a specific child"""
        if not self._verify_parent_child_relationship(user_id, child_id, institution_id):
            return None
        
        student = (
            self.db.query(Student)
            .outerjoin(Section, Section.id == Student.section_id)
            .outerjoin(Grade, Grade.id == Section.grade_id)
            .filter(Student.id == child_id)
            .first()
        )
        
        if not student:
            return None
        
        # Get attendance percentage
        attendance_summary = self.db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == child_id,
            AttendanceSummary.subject_id == None
        ).order_by(desc(AttendanceSummary.year), desc(AttendanceSummary.month)).first()
        
        attendance_percentage = float(attendance_summary.attendance_percentage) if attendance_summary else 0.0
        
        # Get current rank (from latest exam)
        latest_result = self.db.query(func.min(func.coalesce(
            func.nullif(Exam.id, 0), 0
        ))).filter(
            Exam.institution_id == institution_id
        ).scalar()
        
        current_rank = None
        if latest_result:
            from src.models.examination import ExamResult
            exam_result = self.db.query(ExamResult).filter(
                ExamResult.student_id == child_id,
                ExamResult.exam_id == latest_result
            ).first()
            current_rank = exam_result.rank_in_section if exam_result else None
        
        # Get average score from recent exams
        recent_marks = (
            self.db.query(
                func.avg(
                    (ExamMarks.theory_marks_obtained + 
                     func.coalesce(ExamMarks.practical_marks_obtained, 0)) /
                    (ExamSubject.theory_max_marks + 
                     func.coalesce(ExamSubject.practical_max_marks, 0)) * 100
                )
            )
            .join(ExamSubject, ExamSubject.id == ExamMarks.exam_subject_id)
            .filter(
                ExamMarks.student_id == child_id,
                ExamMarks.is_absent == False
            )
            .scalar()
        )
        
        average_score = float(recent_marks) if recent_marks else None
        
        # Get total students in section for context
        total_students = None
        if student.section_id:
            total_students = self.db.query(func.count(Student.id)).filter(
                Student.section_id == student.section_id,
                Student.is_active == True
            ).scalar()
        
        # Get today's attendance status
        today = date.today()
        today_attendance = self.db.query(Attendance).filter(
            Attendance.student_id == child_id,
            Attendance.date == today
        ).first()
        
        attendance_status = today_attendance.status.value if today_attendance else None
        
        section_name = student.section.name if student.section else None
        grade_name = student.section.grade.name if student.section and student.section.grade else None
        
        return ChildOverviewResponse(
            id=student.id,
            first_name=student.first_name,
            last_name=student.last_name,
            admission_number=student.admission_number,
            photo_url=student.photo_url,
            section_name=section_name,
            grade_name=grade_name,
            attendance_percentage=attendance_percentage,
            current_rank=current_rank,
            average_score=average_score,
            total_students=total_students,
            attendance_status=attendance_status
        )
    
    def get_today_attendance(
        self,
        child_id: int,
        user_id: int,
        institution_id: int
    ) -> TodayAttendanceResponse:
        """Get today's attendance status"""
        if not self._verify_parent_child_relationship(user_id, child_id, institution_id):
            raise ValueError("Not authorized to view this child's information")
        
        today = date.today()
        attendance = self.db.query(Attendance).filter(
            Attendance.student_id == child_id,
            Attendance.date == today
        ).first()
        
        if not attendance:
            return TodayAttendanceResponse(
                date=today,
                status=None,
                is_absent=False,
                is_present=False,
                is_late=False,
                is_half_day=False,
                alert_sent=False
            )
        
        return TodayAttendanceResponse(
            date=today,
            status=attendance.status.value,
            is_absent=attendance.status == AttendanceStatus.ABSENT,
            is_present=attendance.status == AttendanceStatus.PRESENT,
            is_late=attendance.status == AttendanceStatus.LATE,
            is_half_day=attendance.status == AttendanceStatus.HALF_DAY,
            alert_sent=attendance.status == AttendanceStatus.ABSENT,
            remarks=attendance.remarks
        )
    
    def get_recent_grades(
        self,
        child_id: int,
        user_id: int,
        institution_id: int,
        limit: int = 10
    ) -> List[RecentGradeResponse]:
        """Get recent grades for a child"""
        if not self._verify_parent_child_relationship(user_id, child_id, institution_id):
            return []
        
        marks = (
            self.db.query(ExamMarks, ExamSubject, Subject, Exam)
            .join(ExamSubject, ExamSubject.id == ExamMarks.exam_subject_id)
            .join(Subject, Subject.id == ExamSubject.subject_id)
            .join(Exam, Exam.id == ExamSubject.exam_id)
            .filter(
                ExamMarks.student_id == child_id,
                ExamMarks.is_absent == False
            )
            .order_by(desc(Exam.start_date))
            .limit(limit)
            .all()
        )
        
        result = []
        for exam_mark, exam_subject, subject, exam in marks:
            theory_marks = float(exam_mark.theory_marks_obtained or 0)
            practical_marks = float(exam_mark.practical_marks_obtained or 0)
            marks_obtained = theory_marks + practical_marks
            
            theory_max = float(exam_subject.theory_max_marks or 0)
            practical_max = float(exam_subject.practical_max_marks or 0)
            total_marks = theory_max + practical_max
            
            percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0
            
            # Calculate grade based on percentage (simple grading)
            grade = None
            if percentage >= 90:
                grade = "A+"
            elif percentage >= 80:
                grade = "A"
            elif percentage >= 70:
                grade = "B+"
            elif percentage >= 60:
                grade = "B"
            elif percentage >= 50:
                grade = "C"
            else:
                grade = "D"
            
            result.append(RecentGradeResponse(
                subject_name=subject.name,
                exam_name=exam.name,
                exam_type=exam.exam_type.value,
                marks_obtained=marks_obtained,
                total_marks=total_marks,
                percentage=percentage,
                grade=grade,
                exam_date=exam.start_date,
                rank=None
            ))
        
        return result
    
    def get_pending_assignments(
        self,
        child_id: int,
        user_id: int,
        institution_id: int
    ) -> List[PendingAssignmentResponse]:
        """Get pending assignments for a child"""
        if not self._verify_parent_child_relationship(user_id, child_id, institution_id):
            return []
        
        now = datetime.utcnow()
        
        # Get all assignments for the student's section
        student = self.db.query(Student).filter(Student.id == child_id).first()
        if not student or not student.section_id:
            return []
        
        assignments = (
            self.db.query(Assignment, Submission, Subject)
            .outerjoin(
                Submission,
                and_(
                    Submission.assignment_id == Assignment.id,
                    Submission.student_id == child_id
                )
            )
            .join(Subject, Subject.id == Assignment.subject_id)
            .filter(
                Assignment.section_id == student.section_id,
                Assignment.is_active == True,
                or_(
                    Submission.id == None,
                    Submission.status.in_([
                        SubmissionStatus.NOT_SUBMITTED,
                    ])
                )
            )
            .order_by(Assignment.due_date)
            .all()
        )
        
        result = []
        for assignment, submission, subject in assignments:
            if assignment.due_date:
                days_remaining = (assignment.due_date - now).days
                is_overdue = assignment.due_date < now
            else:
                days_remaining = 0
                is_overdue = False
            
            result.append(PendingAssignmentResponse(
                id=assignment.id,
                title=assignment.title,
                subject_name=subject.name,
                due_date=assignment.due_date,
                days_remaining=days_remaining,
                description=assignment.description,
                max_marks=float(assignment.max_marks),
                is_overdue=is_overdue
            ))
        
        return result
    
    def get_weekly_progress(
        self,
        child_id: int,
        user_id: int,
        institution_id: int
    ) -> WeeklyProgressResponse:
        """Get weekly progress summary"""
        if not self._verify_parent_child_relationship(user_id, child_id, institution_id):
            raise ValueError("Not authorized to view this child's information")
        
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Get attendance for the week
        attendance_records = self.db.query(Attendance).filter(
            Attendance.student_id == child_id,
            Attendance.date >= week_start,
            Attendance.date <= week_end
        ).all()
        
        attendance_days = len(attendance_records)
        present_days = sum(1 for a in attendance_records if a.status == AttendanceStatus.PRESENT)
        
        # Get assignments completed this week
        assignments_completed = self.db.query(func.count(Submission.id)).filter(
            Submission.student_id == child_id,
            Submission.submitted_at >= week_start,
            Submission.submitted_at <= datetime.combine(week_end, datetime.max.time()),
            Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED])
        ).scalar() or 0
        
        # Get pending assignments
        student = self.db.query(Student).filter(Student.id == child_id).first()
        assignments_pending = 0
        if student and student.section_id:
            assignments_pending = (
                self.db.query(func.count(Assignment.id))
                .outerjoin(
                    Submission,
                    and_(
                        Submission.assignment_id == Assignment.id,
                        Submission.student_id == child_id
                    )
                )
                .filter(
                    Assignment.section_id == student.section_id,
                    Assignment.is_active == True,
                    or_(
                        Submission.id == None,
                        Submission.status == SubmissionStatus.NOT_SUBMITTED
                    )
                )
                .scalar() or 0
            )
        
        # Get average score for assignments graded this week
        avg_score = (
            self.db.query(
                func.avg(Submission.marks_obtained / Assignment.max_marks * 100)
            )
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .filter(
                Submission.student_id == child_id,
                Submission.graded_at >= week_start,
                Submission.graded_at <= datetime.combine(week_end, datetime.max.time()),
                Submission.status == SubmissionStatus.GRADED
            )
            .scalar()
        )
        
        average_score = float(avg_score) if avg_score else None
        
        # Get subject-wise performance
        subject_performance = []
        if student and student.section_id:
            subjects = (
                self.db.query(Subject)
                .join(Assignment, Assignment.subject_id == Subject.id)
                .filter(Assignment.section_id == student.section_id)
                .distinct()
                .all()
            )
            
            for subject in subjects:
                # Average score for this subject
                subj_avg = (
                    self.db.query(
                        func.avg(Submission.marks_obtained / Assignment.max_marks * 100)
                    )
                    .join(Assignment, Assignment.id == Submission.assignment_id)
                    .filter(
                        Submission.student_id == child_id,
                        Assignment.subject_id == subject.id,
                        Submission.status == SubmissionStatus.GRADED
                    )
                    .scalar()
                )
                
                # Total and completed assignments
                total_subj_assignments = self.db.query(func.count(Assignment.id)).filter(
                    Assignment.subject_id == subject.id,
                    Assignment.section_id == student.section_id,
                    Assignment.is_active == True
                ).scalar() or 0
                
                completed_subj_assignments = (
                    self.db.query(func.count(Submission.id))
                    .join(Assignment, Assignment.id == Submission.assignment_id)
                    .filter(
                        Submission.student_id == child_id,
                        Assignment.subject_id == subject.id,
                        Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED])
                    )
                    .scalar() or 0
                )
                
                pending_subj_assignments = total_subj_assignments - completed_subj_assignments
                
                # Attendance for this subject
                subj_attendance = (
                    self.db.query(func.avg(AttendanceSummary.attendance_percentage))
                    .filter(
                        AttendanceSummary.student_id == child_id,
                        AttendanceSummary.subject_id == subject.id
                    )
                    .scalar()
                )
                
                subject_performance.append(SubjectPerformance(
                    subject_name=subject.name,
                    average_score=float(subj_avg) if subj_avg else 0.0,
                    total_assignments=total_subj_assignments,
                    completed_assignments=completed_subj_assignments,
                    pending_assignments=pending_subj_assignments,
                    attendance_percentage=float(subj_attendance) if subj_attendance else 0.0
                ))
        
        return WeeklyProgressResponse(
            week_start=week_start,
            week_end=week_end,
            attendance_days=attendance_days,
            present_days=present_days,
            assignments_completed=assignments_completed,
            assignments_pending=assignments_pending,
            average_score=average_score,
            subject_performance=subject_performance
        )
    
    def get_performance_comparison(
        self,
        child_id: int,
        user_id: int,
        institution_id: int
    ) -> Optional[PerformanceComparisonResponse]:
        """Get performance comparison between current and previous term"""
        if not self._verify_parent_child_relationship(user_id, child_id, institution_id):
            return None
        
        # Get latest two exams
        exams = (
            self.db.query(Exam)
            .filter(Exam.institution_id == institution_id)
            .order_by(desc(Exam.start_date))
            .limit(2)
            .all()
        )
        
        if len(exams) < 2:
            return None
        
        current_exam = exams[0]
        previous_exam = exams[1]
        
        # Get marks for current term
        current_marks = (
            self.db.query(ExamMarks, ExamSubject, Subject)
            .join(ExamSubject, ExamSubject.id == ExamMarks.exam_subject_id)
            .join(Subject, Subject.id == ExamSubject.subject_id)
            .filter(
                ExamSubject.exam_id == current_exam.id,
                ExamMarks.student_id == child_id,
                ExamMarks.is_absent == False
            )
            .all()
        )
        
        # Get marks for previous term
        previous_marks = (
            self.db.query(ExamMarks, ExamSubject, Subject)
            .join(ExamSubject, ExamSubject.id == ExamMarks.exam_subject_id)
            .join(Subject, Subject.id == ExamSubject.subject_id)
            .filter(
                ExamSubject.exam_id == previous_exam.id,
                ExamMarks.student_id == child_id,
                ExamMarks.is_absent == False
            )
            .all()
        )
        
        current_term_data = []
        for exam_mark, exam_subject, subject in current_marks:
            marks_obtained = float(exam_mark.theory_marks_obtained or 0) + float(exam_mark.practical_marks_obtained or 0)
            total_marks = float(exam_subject.theory_max_marks or 0) + float(exam_subject.practical_max_marks or 0)
            percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0
            
            grade = None
            if percentage >= 90:
                grade = "A+"
            elif percentage >= 80:
                grade = "A"
            elif percentage >= 70:
                grade = "B+"
            elif percentage >= 60:
                grade = "B"
            elif percentage >= 50:
                grade = "C"
            else:
                grade = "D"
            
            current_term_data.append(TermPerformance(
                term_name=current_exam.name,
                subject_name=subject.name,
                average_marks=marks_obtained,
                total_marks=total_marks,
                percentage=percentage,
                grade=grade
            ))
        
        previous_term_data = []
        for exam_mark, exam_subject, subject in previous_marks:
            marks_obtained = float(exam_mark.theory_marks_obtained or 0) + float(exam_mark.practical_marks_obtained or 0)
            total_marks = float(exam_subject.theory_max_marks or 0) + float(exam_subject.practical_max_marks or 0)
            percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0
            
            grade = None
            if percentage >= 90:
                grade = "A+"
            elif percentage >= 80:
                grade = "A"
            elif percentage >= 70:
                grade = "B+"
            elif percentage >= 60:
                grade = "B"
            elif percentage >= 50:
                grade = "C"
            else:
                grade = "D"
            
            previous_term_data.append(TermPerformance(
                term_name=previous_exam.name,
                subject_name=subject.name,
                average_marks=marks_obtained,
                total_marks=total_marks,
                percentage=percentage,
                grade=grade
            ))
        
        # Determine improvement/decline
        improvement_subjects = []
        declined_subjects = []
        
        subject_comparison = {}
        for perf in previous_term_data:
            subject_comparison[perf.subject_name] = perf.percentage
        
        total_improvement = 0
        comparison_count = 0
        
        for perf in current_term_data:
            if perf.subject_name in subject_comparison:
                diff = perf.percentage - subject_comparison[perf.subject_name]
                total_improvement += diff
                comparison_count += 1
                
                if diff > 5:
                    improvement_subjects.append(perf.subject_name)
                elif diff < -5:
                    declined_subjects.append(perf.subject_name)
        
        overall_improvement = total_improvement / comparison_count if comparison_count > 0 else 0
        
        return PerformanceComparisonResponse(
            current_term=current_exam.name,
            previous_term=previous_exam.name,
            current_term_data=current_term_data,
            previous_term_data=previous_term_data,
            improvement_subjects=improvement_subjects,
            declined_subjects=declined_subjects,
            overall_improvement=overall_improvement
        )
    
    def get_child_goals(
        self,
        child_id: int,
        user_id: int,
        institution_id: int
    ) -> Dict[str, Any]:
        """Get goal tracking for a child"""
        if not self._verify_parent_child_relationship(user_id, child_id, institution_id):
            return {"goals": [], "total": 0, "active": 0, "completed": 0}
        
        student = self.db.query(Student).filter(Student.id == child_id).first()
        if not student or not student.user_id:
            return {"goals": [], "total": 0, "active": 0, "completed": 0}
        
        goals = self.db.query(Goal).filter(
            Goal.user_id == student.user_id,
            Goal.institution_id == institution_id
        ).order_by(desc(Goal.created_at)).all()
        
        goal_list = []
        active_count = 0
        completed_count = 0
        
        for goal in goals:
            days_remaining = (goal.end_date - date.today()).days
            
            if goal.status == GoalStatus.ACTIVE:
                active_count += 1
            elif goal.status == GoalStatus.COMPLETED:
                completed_count += 1
            
            goal_list.append(GoalProgress(
                id=goal.id,
                title=goal.title,
                description=goal.description,
                goal_type=goal.goal_type.value,
                target_value=float(goal.target_value),
                current_value=float(goal.current_value),
                progress_percentage=float(goal.progress_percentage),
                status=goal.status.value,
                start_date=goal.start_date,
                end_date=goal.end_date,
                days_remaining=days_remaining
            ))
        
        return {
            "goals": goal_list,
            "total": len(goals),
            "active": active_count,
            "completed": completed_count
        }
    
    def get_parent_dashboard(
        self,
        user_id: int,
        institution_id: int,
        child_id: Optional[int] = None
    ) -> Optional[ParentDashboardResponse]:
        """Get comprehensive parent dashboard"""
        parent = self.db.query(Parent).filter(
            Parent.user_id == user_id,
            Parent.institution_id == institution_id,
            Parent.is_active == True
        ).first()
        
        if not parent:
            return None
        
        # Get all children
        children = self.get_parent_children(user_id, institution_id)
        
        if not children:
            return ParentDashboardResponse(
                parent_info={
                    "id": parent.id,
                    "first_name": parent.first_name,
                    "last_name": parent.last_name,
                    "email": parent.email,
                    "phone": parent.phone
                },
                children=[],
                selected_child=None,
                today_attendance=None,
                attendance_stats=None,
                recent_grades=[],
                pending_assignments=[],
                weekly_progress=None,
                goals=[],
                teacher_messages=[],
                performance_comparison=None
            )
        
        # Select child (first child if not specified)
        selected_child_id = child_id if child_id else children[0].id
        
        # Get selected child overview
        selected_child = self.get_child_overview(selected_child_id, user_id, institution_id)
        
        # Get today's attendance
        today_attendance = self.get_today_attendance(selected_child_id, user_id, institution_id)
        
        # Get attendance stats
        attendance_summary = self.db.query(AttendanceSummary).filter(
            AttendanceSummary.student_id == selected_child_id,
            AttendanceSummary.subject_id == None
        ).order_by(desc(AttendanceSummary.year), desc(AttendanceSummary.month)).first()
        
        attendance_stats = None
        if attendance_summary:
            attendance_stats = AttendanceStats(
                total_days=attendance_summary.total_days,
                present_days=attendance_summary.present_days,
                absent_days=attendance_summary.absent_days,
                late_days=attendance_summary.late_days,
                half_days=attendance_summary.half_days,
                attendance_percentage=float(attendance_summary.attendance_percentage)
            )
        
        # Get recent grades
        recent_grades = self.get_recent_grades(selected_child_id, user_id, institution_id, limit=10)
        
        # Get pending assignments
        pending_assignments = self.get_pending_assignments(selected_child_id, user_id, institution_id)
        
        # Get weekly progress
        weekly_progress = self.get_weekly_progress(selected_child_id, user_id, institution_id)
        
        # Get goals
        goals_data = self.get_child_goals(selected_child_id, user_id, institution_id)
        
        # Get teacher messages
        student = self.db.query(Student).filter(Student.id == selected_child_id).first()
        teacher_messages = []
        if student and student.user_id:
            messages = (
                self.db.query(Message)
                .filter(
                    Message.recipient_id == student.user_id,
                    Message.institution_id == institution_id
                )
                .order_by(desc(Message.created_at))
                .limit(10)
                .all()
            )
            
            for msg in messages:
                sender_name = "Teacher"
                if msg.sender:
                    sender_name = f"{msg.sender.first_name} {msg.sender.last_name}"
                
                teacher_messages.append(TeacherMessage(
                    id=msg.id,
                    teacher_name=sender_name,
                    subject=msg.subject,
                    content=msg.content,
                    created_at=msg.created_at,
                    is_read=msg.is_read
                ))
        
        # Get performance comparison
        performance_comparison = self.get_performance_comparison(selected_child_id, user_id, institution_id)
        
        return ParentDashboardResponse(
            parent_info={
                "id": parent.id,
                "first_name": parent.first_name,
                "last_name": parent.last_name,
                "email": parent.email,
                "phone": parent.phone,
                "photo_url": parent.photo_url
            },
            children=children,
            selected_child=selected_child,
            today_attendance=today_attendance,
            attendance_stats=attendance_stats,
            recent_grades=recent_grades,
            pending_assignments=pending_assignments,
            weekly_progress=weekly_progress,
            goals=goals_data.get("goals", []),
            teacher_messages=teacher_messages,
            performance_comparison=performance_comparison
        )
