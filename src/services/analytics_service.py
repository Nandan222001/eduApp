from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import func, and_, or_, case, distinct, cast, Numeric
from sqlalchemy.orm import Session
import json
import hashlib

from src.models.student import Student
from src.models.academic import Section, Subject, Grade, AcademicYear
from src.models.examination import (
    Exam,
    ExamResult,
    ExamMarks,
    ExamSubject,
    ExamPerformanceAnalytics,
)
from src.models.attendance import Attendance, AttendanceSummary, AttendanceStatus
from src.models.assignment import Assignment, Submission, SubmissionStatus
from src.models.gamification import UserPoints, Badge, UserBadge
from src.models.analytics import (
    AnalyticsCache,
    StudentPerformanceMetrics,
    ClassPerformanceMetrics,
    InstitutionPerformanceMetrics,
)
from src.schemas.analytics import (
    AnalyticsQueryParams,
    StudentMetrics,
    ClassMetrics,
    InstitutionMetrics,
    ExamAnalytics,
    SubjectPerformance,
    YoYComparison,
    StudentPerformanceComparison,
    DateRangeType,
    MetricType,
    StudentPerformanceTrend,
)


class AnalyticsService:
    def __init__(self, db: Session, redis_client: Any = None):
        self.db = db
        self.redis_client = redis_client
        self.cache_ttl = {
            "student_metrics": 3600,
            "class_metrics": 1800,
            "institution_metrics": 900,
            "exam_analytics": 7200,
        }

    def _generate_cache_key(
        self, prefix: str, institution_id: int, **kwargs: Any
    ) -> str:
        params_str = json.dumps(kwargs, sort_keys=True, default=str)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()
        return f"{prefix}:{institution_id}:{params_hash}"

    async def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        if not self.redis_client:
            return None
        try:
            cached_data = await self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass
        return None

    async def _set_cache(
        self, cache_key: str, data: Dict[str, Any], ttl: int
    ) -> None:
        if not self.redis_client:
            return
        try:
            await self.redis_client.setex(
                cache_key, ttl, json.dumps(data, default=str)
            )
        except Exception:
            pass

    def _get_date_range(
        self, date_range_type: DateRangeType, start_date: Optional[date], end_date: Optional[date]
    ) -> Tuple[date, date]:
        today = date.today()

        if date_range_type == DateRangeType.CUSTOM:
            if not start_date or not end_date:
                raise ValueError("start_date and end_date required for CUSTOM range")
            return start_date, end_date

        elif date_range_type == DateRangeType.DAILY:
            return today, today

        elif date_range_type == DateRangeType.WEEKLY:
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            return start, end

        elif date_range_type == DateRangeType.MONTHLY:
            start = today.replace(day=1)
            next_month = start.replace(day=28) + timedelta(days=4)
            end = next_month - timedelta(days=next_month.day)
            return start, end

        elif date_range_type == DateRangeType.QUARTERLY:
            quarter = (today.month - 1) // 3
            start = today.replace(month=quarter * 3 + 1, day=1)
            end_month = start.month + 2
            end = start.replace(month=end_month, day=1) + timedelta(days=32)
            end = end.replace(day=1) - timedelta(days=1)
            return start, end

        elif date_range_type == DateRangeType.YEARLY:
            start = today.replace(month=1, day=1)
            end = today.replace(month=12, day=31)
            return start, end

        return today, today

    async def get_student_metrics(
        self,
        institution_id: int,
        student_id: int,
        params: AnalyticsQueryParams,
    ) -> StudentMetrics:
        cache_key = self._generate_cache_key(
            "student_metrics", institution_id, student_id=student_id, params=params.dict()
        )
        cached = await self._get_from_cache(cache_key)
        if cached:
            return StudentMetrics(**cached)

        start_date, end_date = self._get_date_range(
            params.date_range_type, params.start_date, params.end_date
        )

        student = self.db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()

        if not student:
            raise ValueError("Student not found")

        exam_metrics = self._calculate_student_exam_metrics(
            student_id, institution_id, start_date, end_date
        )
        attendance_metrics = self._calculate_student_attendance_metrics(
            student_id, institution_id, start_date, end_date
        )
        assignment_metrics = self._calculate_student_assignment_metrics(
            student_id, institution_id, start_date, end_date
        )
        gamification_metrics = self._calculate_student_gamification_metrics(
            student_id, institution_id
        )

        metrics = StudentMetrics(
            student_id=student_id,
            student_name=f"{student.first_name} {student.last_name}",
            **exam_metrics,
            **attendance_metrics,
            **assignment_metrics,
            **gamification_metrics,
        )

        await self._set_cache(
            cache_key, metrics.dict(), self.cache_ttl["student_metrics"]
        )
        return metrics

    def _calculate_student_exam_metrics(
        self, student_id: int, institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        exam_results = (
            self.db.query(ExamResult)
            .join(Exam)
            .filter(
                ExamResult.student_id == student_id,
                ExamResult.institution_id == institution_id,
                Exam.start_date >= start_date,
                Exam.end_date <= end_date,
            )
            .all()
        )

        total_exams = len(exam_results)
        exams_appeared = sum(1 for r in exam_results if not self._is_student_absent(r))
        exams_passed = sum(1 for r in exam_results if r.is_pass)

        avg_percentage = 0.0
        avg_grade_point = None
        rank_in_class = None
        rank_in_grade = None

        if exam_results:
            avg_percentage = float(
                sum(float(r.percentage) for r in exam_results) / len(exam_results)
            )
            grades_with_points = [
                float(r.grade_point) for r in exam_results if r.grade_point
            ]
            if grades_with_points:
                avg_grade_point = sum(grades_with_points) / len(grades_with_points)

            latest_result = max(exam_results, key=lambda r: r.generated_at)
            rank_in_class = latest_result.rank_in_section
            rank_in_grade = latest_result.rank_in_grade

        return {
            "total_exams": total_exams,
            "exams_appeared": exams_appeared,
            "exams_passed": exams_passed,
            "average_percentage": round(avg_percentage, 2),
            "average_grade_point": round(avg_grade_point, 2) if avg_grade_point else None,
            "rank_in_class": rank_in_class,
            "rank_in_grade": rank_in_grade,
        }

    def _is_student_absent(self, exam_result: ExamResult) -> bool:
        exam_marks = (
            self.db.query(ExamMarks)
            .join(ExamSubject)
            .filter(
                ExamSubject.exam_id == exam_result.exam_id,
                ExamMarks.student_id == exam_result.student_id,
            )
            .all()
        )
        return all(mark.is_absent for mark in exam_marks)

    def _calculate_student_attendance_metrics(
        self, student_id: int, institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        attendances = (
            self.db.query(Attendance)
            .filter(
                Attendance.student_id == student_id,
                Attendance.institution_id == institution_id,
                Attendance.date >= start_date,
                Attendance.date <= end_date,
            )
            .all()
        )

        total_days = len(attendances)
        present_days = sum(
            1
            for a in attendances
            if a.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.HALF_DAY]
        )

        attendance_percentage = 0.0
        if total_days > 0:
            attendance_percentage = (present_days / total_days) * 100

        return {
            "attendance_percentage": round(attendance_percentage, 2),
            "total_attendance_days": total_days,
            "present_days": present_days,
        }

    def _calculate_student_assignment_metrics(
        self, student_id: int, institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        assignments = (
            self.db.query(Assignment)
            .filter(
                Assignment.institution_id == institution_id,
                Assignment.due_date >= start_date,
                Assignment.due_date <= end_date,
            )
            .all()
        )

        assignment_ids = [a.id for a in assignments]
        submissions = (
            self.db.query(Submission)
            .filter(
                Submission.student_id == student_id,
                Submission.assignment_id.in_(assignment_ids),
            )
            .all()
        )

        total_assignments = len(assignments)
        assignments_submitted = sum(
            1
            for s in submissions
            if s.status
            in [
                SubmissionStatus.SUBMITTED,
                SubmissionStatus.LATE_SUBMITTED,
                SubmissionStatus.GRADED,
                SubmissionStatus.RETURNED,
            ]
        )
        assignments_graded = sum(
            1
            for s in submissions
            if s.status in [SubmissionStatus.GRADED, SubmissionStatus.RETURNED]
        )

        avg_score = None
        graded_submissions = [
            s for s in submissions if s.marks_obtained is not None
        ]
        if graded_submissions:
            total_marks = sum(float(s.marks_obtained) for s in graded_submissions)
            max_marks = sum(
                float(a.max_marks)
                for a in assignments
                if a.id in [s.assignment_id for s in graded_submissions]
            )
            if max_marks > 0:
                avg_score = (total_marks / max_marks) * 100

        return {
            "total_assignments": total_assignments,
            "assignments_submitted": assignments_submitted,
            "assignments_graded": assignments_graded,
            "average_assignment_score": round(avg_score, 2) if avg_score else None,
        }

    def _calculate_student_gamification_metrics(
        self, student_id: int, institution_id: int
    ) -> Dict[str, Any]:
        try:
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if not student or not student.user_id:
                return {
                    "total_gamification_points": 0,
                    "badges_earned": 0,
                    "study_streak_days": 0,
                }

            user_points = (
                self.db.query(UserPoints)
                .filter(
                    UserPoints.user_id == student.user_id,
                    UserPoints.institution_id == institution_id,
                )
                .first()
            )

            badges_count = (
                self.db.query(func.count(UserBadge.id))
                .filter(UserBadge.user_id == student.user_id)
                .scalar()
                or 0
            )

            return {
                "total_gamification_points": user_points.total_points if user_points else 0,
                "badges_earned": badges_count,
                "study_streak_days": user_points.current_streak if user_points else 0,
            }
        except Exception:
            return {
                "total_gamification_points": 0,
                "badges_earned": 0,
                "study_streak_days": 0,
            }

    async def get_class_metrics(
        self,
        institution_id: int,
        section_id: int,
        params: AnalyticsQueryParams,
    ) -> ClassMetrics:
        cache_key = self._generate_cache_key(
            "class_metrics", institution_id, section_id=section_id, params=params.dict()
        )
        cached = await self._get_from_cache(cache_key)
        if cached:
            return ClassMetrics(**cached)

        start_date, end_date = self._get_date_range(
            params.date_range_type, params.start_date, params.end_date
        )

        section = (
            self.db.query(Section)
            .join(Grade)
            .filter(
                Section.id == section_id, Section.institution_id == institution_id
            )
            .first()
        )

        if not section:
            raise ValueError("Section not found")

        students = (
            self.db.query(Student)
            .filter(
                Student.section_id == section_id,
                Student.institution_id == institution_id,
            )
            .all()
        )

        student_ids = [s.id for s in students]

        exam_metrics = self._calculate_class_exam_metrics(
            student_ids, institution_id, start_date, end_date
        )
        attendance_metrics = self._calculate_class_attendance_metrics(
            student_ids, institution_id, start_date, end_date
        )
        assignment_metrics = self._calculate_class_assignment_metrics(
            student_ids, institution_id, start_date, end_date
        )

        metrics = ClassMetrics(
            section_id=section_id,
            section_name=section.name,
            grade_name=section.grade.name,
            total_students=len(students),
            active_students=sum(1 for s in students if s.is_active),
            **exam_metrics,
            **attendance_metrics,
            **assignment_metrics,
        )

        await self._set_cache(cache_key, metrics.dict(), self.cache_ttl["class_metrics"])
        return metrics

    def _calculate_class_exam_metrics(
        self, student_ids: List[int], institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        if not student_ids:
            return {
                "average_exam_percentage": 0.0,
                "highest_exam_percentage": None,
                "lowest_exam_percentage": None,
                "median_exam_percentage": None,
                "pass_percentage": 0.0,
            }

        exam_results = (
            self.db.query(ExamResult)
            .join(Exam)
            .filter(
                ExamResult.student_id.in_(student_ids),
                ExamResult.institution_id == institution_id,
                Exam.start_date >= start_date,
                Exam.end_date <= end_date,
            )
            .all()
        )

        if not exam_results:
            return {
                "average_exam_percentage": 0.0,
                "highest_exam_percentage": None,
                "lowest_exam_percentage": None,
                "median_exam_percentage": None,
                "pass_percentage": 0.0,
            }

        percentages = [float(r.percentage) for r in exam_results]
        avg_percentage = sum(percentages) / len(percentages)
        highest = max(percentages)
        lowest = min(percentages)

        sorted_percentages = sorted(percentages)
        n = len(sorted_percentages)
        median = (
            sorted_percentages[n // 2]
            if n % 2 != 0
            else (sorted_percentages[n // 2 - 1] + sorted_percentages[n // 2]) / 2
        )

        passed = sum(1 for r in exam_results if r.is_pass)
        pass_percentage = (passed / len(exam_results)) * 100

        return {
            "average_exam_percentage": round(avg_percentage, 2),
            "highest_exam_percentage": round(highest, 2),
            "lowest_exam_percentage": round(lowest, 2),
            "median_exam_percentage": round(median, 2),
            "pass_percentage": round(pass_percentage, 2),
        }

    def _calculate_class_attendance_metrics(
        self, student_ids: List[int], institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        if not student_ids:
            return {
                "average_attendance_percentage": 0.0,
                "highest_attendance_percentage": None,
                "lowest_attendance_percentage": None,
            }

        attendance_percentages = []
        for student_id in student_ids:
            metrics = self._calculate_student_attendance_metrics(
                student_id, institution_id, start_date, end_date
            )
            attendance_percentages.append(metrics["attendance_percentage"])

        if not attendance_percentages:
            return {
                "average_attendance_percentage": 0.0,
                "highest_attendance_percentage": None,
                "lowest_attendance_percentage": None,
            }

        avg = sum(attendance_percentages) / len(attendance_percentages)
        highest = max(attendance_percentages)
        lowest = min(attendance_percentages)

        return {
            "average_attendance_percentage": round(avg, 2),
            "highest_attendance_percentage": round(highest, 2),
            "lowest_attendance_percentage": round(lowest, 2),
        }

    def _calculate_class_assignment_metrics(
        self, student_ids: List[int], institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        if not student_ids:
            return {
                "average_assignment_score": None,
                "assignment_submission_rate": 0.0,
            }

        assignments = (
            self.db.query(Assignment)
            .filter(
                Assignment.institution_id == institution_id,
                Assignment.due_date >= start_date,
                Assignment.due_date <= end_date,
            )
            .all()
        )

        if not assignments:
            return {
                "average_assignment_score": None,
                "assignment_submission_rate": 0.0,
            }

        assignment_ids = [a.id for a in assignments]
        submissions = (
            self.db.query(Submission)
            .filter(
                Submission.student_id.in_(student_ids),
                Submission.assignment_id.in_(assignment_ids),
            )
            .all()
        )

        total_expected = len(assignments) * len(student_ids)
        total_submitted = sum(
            1
            for s in submissions
            if s.status
            in [
                SubmissionStatus.SUBMITTED,
                SubmissionStatus.LATE_SUBMITTED,
                SubmissionStatus.GRADED,
                SubmissionStatus.RETURNED,
            ]
        )

        submission_rate = (
            (total_submitted / total_expected) * 100 if total_expected > 0 else 0.0
        )

        graded_submissions = [
            s for s in submissions if s.marks_obtained is not None
        ]
        avg_score = None
        if graded_submissions:
            scores = []
            for submission in graded_submissions:
                assignment = next(
                    (a for a in assignments if a.id == submission.assignment_id), None
                )
                if assignment and float(assignment.max_marks) > 0:
                    score = (float(submission.marks_obtained) / float(assignment.max_marks)) * 100
                    scores.append(score)
            if scores:
                avg_score = sum(scores) / len(scores)

        return {
            "average_assignment_score": round(avg_score, 2) if avg_score else None,
            "assignment_submission_rate": round(submission_rate, 2),
        }

    async def get_institution_metrics(
        self,
        institution_id: int,
        params: AnalyticsQueryParams,
    ) -> InstitutionMetrics:
        cache_key = self._generate_cache_key(
            "institution_metrics", institution_id, params=params.dict()
        )
        cached = await self._get_from_cache(cache_key)
        if cached:
            return InstitutionMetrics(**cached)

        start_date, end_date = self._get_date_range(
            params.date_range_type, params.start_date, params.end_date
        )

        students = (
            self.db.query(Student)
            .filter(Student.institution_id == institution_id)
            .all()
        )
        student_ids = [s.id for s in students]

        sections_count = (
            self.db.query(func.count(Section.id))
            .filter(Section.institution_id == institution_id, Section.is_active == True)
            .scalar()
            or 0
        )

        teachers_count = (
            self.db.query(func.count(distinct(self.db.query(Assignment.teacher_id))))
            .filter(Assignment.institution_id == institution_id)
            .scalar()
            or 0
        )

        exam_metrics = self._calculate_institution_exam_metrics(
            student_ids, institution_id, start_date, end_date
        )
        attendance_metrics = self._calculate_institution_attendance_metrics(
            student_ids, institution_id, start_date, end_date
        )
        assignment_metrics = self._calculate_institution_assignment_metrics(
            institution_id, start_date, end_date
        )

        metrics = InstitutionMetrics(
            total_students=len(students),
            active_students=sum(1 for s in students if s.is_active),
            total_teachers=teachers_count,
            total_classes=sections_count,
            **exam_metrics,
            **attendance_metrics,
            **assignment_metrics,
        )

        await self._set_cache(
            cache_key, metrics.dict(), self.cache_ttl["institution_metrics"]
        )
        return metrics

    def _calculate_institution_exam_metrics(
        self, student_ids: List[int], institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        if not student_ids:
            return {
                "overall_average_percentage": 0.0,
                "overall_pass_percentage": 0.0,
                "total_exams_conducted": 0,
            }

        exams_count = (
            self.db.query(func.count(Exam.id))
            .filter(
                Exam.institution_id == institution_id,
                Exam.start_date >= start_date,
                Exam.end_date <= end_date,
            )
            .scalar()
            or 0
        )

        exam_results = (
            self.db.query(ExamResult)
            .join(Exam)
            .filter(
                ExamResult.student_id.in_(student_ids),
                ExamResult.institution_id == institution_id,
                Exam.start_date >= start_date,
                Exam.end_date <= end_date,
            )
            .all()
        )

        if not exam_results:
            return {
                "overall_average_percentage": 0.0,
                "overall_pass_percentage": 0.0,
                "total_exams_conducted": exams_count,
            }

        avg_percentage = sum(float(r.percentage) for r in exam_results) / len(
            exam_results
        )
        passed = sum(1 for r in exam_results if r.is_pass)
        pass_percentage = (passed / len(exam_results)) * 100

        return {
            "overall_average_percentage": round(avg_percentage, 2),
            "overall_pass_percentage": round(pass_percentage, 2),
            "total_exams_conducted": exams_count,
        }

    def _calculate_institution_attendance_metrics(
        self, student_ids: List[int], institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        if not student_ids:
            return {"overall_attendance_percentage": 0.0}

        total_records = (
            self.db.query(func.count(Attendance.id))
            .filter(
                Attendance.student_id.in_(student_ids),
                Attendance.institution_id == institution_id,
                Attendance.date >= start_date,
                Attendance.date <= end_date,
            )
            .scalar()
            or 0
        )

        if total_records == 0:
            return {"overall_attendance_percentage": 0.0}

        present_records = (
            self.db.query(func.count(Attendance.id))
            .filter(
                Attendance.student_id.in_(student_ids),
                Attendance.institution_id == institution_id,
                Attendance.date >= start_date,
                Attendance.date <= end_date,
                Attendance.status.in_([
                    AttendanceStatus.PRESENT,
                    AttendanceStatus.LATE,
                    AttendanceStatus.HALF_DAY,
                ]),
            )
            .scalar()
            or 0
        )

        percentage = (present_records / total_records) * 100

        return {"overall_attendance_percentage": round(percentage, 2)}

    def _calculate_institution_assignment_metrics(
        self, institution_id: int, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        assignments = (
            self.db.query(Assignment)
            .filter(
                Assignment.institution_id == institution_id,
                Assignment.due_date >= start_date,
                Assignment.due_date <= end_date,
            )
            .all()
        )

        if not assignments:
            return {
                "total_assignments_created": 0,
                "assignment_submission_rate": 0.0,
            }

        assignment_ids = [a.id for a in assignments]
        total_submissions = (
            self.db.query(func.count(Submission.id))
            .filter(Submission.assignment_id.in_(assignment_ids))
            .scalar()
            or 0
        )

        submitted_count = (
            self.db.query(func.count(Submission.id))
            .filter(
                Submission.assignment_id.in_(assignment_ids),
                Submission.status.in_([
                    SubmissionStatus.SUBMITTED,
                    SubmissionStatus.LATE_SUBMITTED,
                    SubmissionStatus.GRADED,
                    SubmissionStatus.RETURNED,
                ]),
            )
            .scalar()
            or 0
        )

        submission_rate = (
            (submitted_count / total_submissions) * 100 if total_submissions > 0 else 0.0
        )

        return {
            "total_assignments_created": len(assignments),
            "assignment_submission_rate": round(submission_rate, 2),
        }

    async def get_exam_analytics(
        self, institution_id: int, exam_id: int
    ) -> ExamAnalytics:
        cache_key = self._generate_cache_key(
            "exam_analytics", institution_id, exam_id=exam_id
        )
        cached = await self._get_from_cache(cache_key)
        if cached:
            return ExamAnalytics(**cached)

        exam = (
            self.db.query(Exam)
            .filter(Exam.id == exam_id, Exam.institution_id == institution_id)
            .first()
        )

        if not exam:
            raise ValueError("Exam not found")

        exam_results = (
            self.db.query(ExamResult)
            .filter(
                ExamResult.exam_id == exam_id,
                ExamResult.institution_id == institution_id,
            )
            .all()
        )

        total_students = len(set(r.student_id for r in exam_results))
        students_appeared = sum(1 for r in exam_results if not self._is_student_absent(r))
        students_passed = sum(1 for r in exam_results if r.is_pass)

        percentages = [float(r.percentage) for r in exam_results]
        avg_marks = sum(float(r.total_marks_obtained) for r in exam_results) / len(
            exam_results
        ) if exam_results else 0
        highest_marks = max(float(r.total_marks_obtained) for r in exam_results) if exam_results else 0
        lowest_marks = min(float(r.total_marks_obtained) for r in exam_results) if exam_results else 0

        sorted_percentages = sorted(percentages)
        n = len(sorted_percentages)
        median = None
        if n > 0:
            median = (
                sorted_percentages[n // 2]
                if n % 2 != 0
                else (sorted_percentages[n // 2 - 1] + sorted_percentages[n // 2]) / 2
            )

        std_dev = None
        if len(percentages) > 1:
            mean = sum(percentages) / len(percentages)
            variance = sum((x - mean) ** 2 for x in percentages) / len(percentages)
            std_dev = variance ** 0.5

        pass_percentage = (students_passed / total_students * 100) if total_students > 0 else 0

        subject_performances = self._get_subject_performances(exam_id, institution_id)

        analytics = ExamAnalytics(
            exam_id=exam_id,
            exam_name=exam.name,
            exam_type=exam.exam_type.value,
            total_students=total_students,
            students_appeared=students_appeared,
            students_passed=students_passed,
            pass_percentage=round(pass_percentage, 2),
            average_marks=round(avg_marks, 2),
            highest_marks=round(highest_marks, 2),
            lowest_marks=round(lowest_marks, 2),
            median_marks=round(median, 2) if median else None,
            standard_deviation=round(std_dev, 2) if std_dev else None,
            subjects=subject_performances,
        )

        await self._set_cache(
            cache_key, analytics.dict(), self.cache_ttl["exam_analytics"]
        )
        return analytics

    def _get_subject_performances(
        self, exam_id: int, institution_id: int
    ) -> List[SubjectPerformance]:
        exam_subjects = (
            self.db.query(ExamSubject)
            .join(Subject)
            .filter(
                ExamSubject.exam_id == exam_id,
                ExamSubject.institution_id == institution_id,
            )
            .all()
        )

        performances = []
        for exam_subject in exam_subjects:
            marks = (
                self.db.query(ExamMarks)
                .filter(ExamMarks.exam_subject_id == exam_subject.id)
                .all()
            )

            if not marks:
                continue

            total_students = len(marks)
            total_marks_list = []
            students_passed = 0

            for mark in marks:
                if mark.is_absent:
                    continue

                theory = float(mark.theory_marks_obtained or 0)
                practical = float(mark.practical_marks_obtained or 0)
                total = theory + practical
                total_marks_list.append(total)

                max_marks = float(exam_subject.theory_max_marks or 0) + float(
                    exam_subject.practical_max_marks or 0
                )
                passing_marks = float(exam_subject.theory_passing_marks or 0) + float(
                    exam_subject.practical_passing_marks or 0
                )

                if total >= passing_marks:
                    students_passed += 1

            if total_marks_list:
                avg_marks = sum(total_marks_list) / len(total_marks_list)
                highest = max(total_marks_list)
                lowest = min(total_marks_list)
                pass_pct = (students_passed / total_students) * 100

                performances.append(
                    SubjectPerformance(
                        subject_id=exam_subject.subject_id,
                        subject_name=exam_subject.subject.name,
                        average_marks=round(avg_marks, 2),
                        highest_marks=round(highest, 2),
                        lowest_marks=round(lowest, 2),
                        pass_percentage=round(pass_pct, 2),
                        total_students=total_students,
                        students_passed=students_passed,
                        students_failed=total_students - students_passed,
                    )
                )

        return performances

    async def get_yoy_comparison(
        self, institution_id: int, params: AnalyticsQueryParams
    ) -> List[YoYComparison]:
        current_start, current_end = self._get_date_range(
            params.date_range_type, params.start_date, params.end_date
        )

        previous_start = date(current_start.year - 1, current_start.month, current_start.day)
        previous_end = date(current_end.year - 1, current_end.month, current_end.day)

        current_params = AnalyticsQueryParams(
            date_range_type=DateRangeType.CUSTOM,
            start_date=current_start,
            end_date=current_end,
        )
        previous_params = AnalyticsQueryParams(
            date_range_type=DateRangeType.CUSTOM,
            start_date=previous_start,
            end_date=previous_end,
        )

        current_metrics = await self.get_institution_metrics(
            institution_id, current_params
        )
        previous_metrics = await self.get_institution_metrics(
            institution_id, previous_params
        )

        comparisons = []

        metrics_to_compare = [
            ("Total Students", "total_students"),
            ("Average Percentage", "overall_average_percentage"),
            ("Pass Percentage", "overall_pass_percentage"),
            ("Attendance Percentage", "overall_attendance_percentage"),
            ("Assignment Submission Rate", "assignment_submission_rate"),
        ]

        for metric_name, attr in metrics_to_compare:
            current_value = getattr(current_metrics, attr)
            previous_value = getattr(previous_metrics, attr)

            change_pct = None
            trend = "stable"
            if previous_value and previous_value > 0:
                change_pct = ((current_value - previous_value) / previous_value) * 100
                if change_pct > 0:
                    trend = "improving"
                elif change_pct < 0:
                    trend = "declining"

            comparisons.append(
                YoYComparison(
                    metric_name=metric_name,
                    current_year_value=float(current_value),
                    previous_year_value=float(previous_value) if previous_value else None,
                    change_percentage=round(change_pct, 2) if change_pct else None,
                    trend=trend,
                )
            )

        return comparisons

    async def get_student_performance_comparison(
        self, institution_id: int, student_id: int, params: AnalyticsQueryParams
    ) -> StudentPerformanceComparison:
        student_metrics = await self.get_student_metrics(
            institution_id, student_id, params
        )

        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student or not student.section_id:
            raise ValueError("Student or section not found")

        class_metrics = await self.get_class_metrics(
            institution_id, student.section_id, params
        )

        class_average = {
            "exam_percentage": class_metrics.average_exam_percentage,
            "attendance_percentage": class_metrics.average_attendance_percentage,
            "assignment_score": class_metrics.average_assignment_score or 0,
        }

        grade_students = (
            self.db.query(Student)
            .join(Section)
            .filter(
                Section.grade_id == student.section.grade_id,
                Student.institution_id == institution_id,
            )
            .all()
        )

        grade_student_ids = [s.id for s in grade_students]
        start_date, end_date = self._get_date_range(
            params.date_range_type, params.start_date, params.end_date
        )
        grade_exam_metrics = self._calculate_class_exam_metrics(
            grade_student_ids, institution_id, start_date, end_date
        )

        grade_average = {
            "exam_percentage": grade_exam_metrics["average_exam_percentage"],
            "attendance_percentage": 0.0,
            "assignment_score": 0.0,
        }

        return StudentPerformanceComparison(
            student_metrics=student_metrics,
            class_average=class_average,
            grade_average=grade_average,
            percentile_in_class=self._calculate_percentile(
                student_metrics.average_percentage, class_metrics.average_exam_percentage
            ),
            percentile_in_grade=self._calculate_percentile(
                student_metrics.average_percentage,
                grade_exam_metrics["average_exam_percentage"],
            ),
            strength_subjects=await self._identify_strength_subjects(
                student_id, institution_id, start_date, end_date
            ),
            weak_subjects=await self._identify_weak_subjects(
                student_id, institution_id, start_date, end_date
            ),
        )

    def _calculate_percentile(
        self, student_value: float, class_average: float
    ) -> Optional[float]:
        if class_average == 0:
            return None
        percentile = (student_value / class_average) * 50
        return round(min(percentile, 100), 2)

    async def _identify_strength_subjects(
        self, student_id: int, institution_id: int, start_date: date, end_date: date
    ) -> List[str]:
        exam_marks = (
            self.db.query(ExamMarks, Subject.name)
            .join(ExamSubject)
            .join(Subject)
            .join(Exam)
            .filter(
                ExamMarks.student_id == student_id,
                ExamMarks.institution_id == institution_id,
                Exam.start_date >= start_date,
                Exam.end_date <= end_date,
            )
            .all()
        )

        subject_scores = {}
        for mark, subject_name in exam_marks:
            if mark.is_absent:
                continue

            exam_subject = (
                self.db.query(ExamSubject)
                .filter(ExamSubject.id == mark.exam_subject_id)
                .first()
            )

            if not exam_subject:
                continue

            total_marks = float(mark.theory_marks_obtained or 0) + float(
                mark.practical_marks_obtained or 0
            )
            max_marks = float(exam_subject.theory_max_marks or 0) + float(
                exam_subject.practical_max_marks or 0
            )

            if max_marks > 0:
                percentage = (total_marks / max_marks) * 100
                if subject_name not in subject_scores:
                    subject_scores[subject_name] = []
                subject_scores[subject_name].append(percentage)

        avg_scores = {
            subject: sum(scores) / len(scores)
            for subject, scores in subject_scores.items()
        }

        sorted_subjects = sorted(
            avg_scores.items(), key=lambda x: x[1], reverse=True
        )
        return [subject for subject, _ in sorted_subjects[:3]]

    async def _identify_weak_subjects(
        self, student_id: int, institution_id: int, start_date: date, end_date: date
    ) -> List[str]:
        exam_marks = (
            self.db.query(ExamMarks, Subject.name)
            .join(ExamSubject)
            .join(Subject)
            .join(Exam)
            .filter(
                ExamMarks.student_id == student_id,
                ExamMarks.institution_id == institution_id,
                Exam.start_date >= start_date,
                Exam.end_date <= end_date,
            )
            .all()
        )

        subject_scores = {}
        for mark, subject_name in exam_marks:
            if mark.is_absent:
                continue

            exam_subject = (
                self.db.query(ExamSubject)
                .filter(ExamSubject.id == mark.exam_subject_id)
                .first()
            )

            if not exam_subject:
                continue

            total_marks = float(mark.theory_marks_obtained or 0) + float(
                mark.practical_marks_obtained or 0
            )
            max_marks = float(exam_subject.theory_max_marks or 0) + float(
                exam_subject.practical_max_marks or 0
            )

            if max_marks > 0:
                percentage = (total_marks / max_marks) * 100
                if subject_name not in subject_scores:
                    subject_scores[subject_name] = []
                subject_scores[subject_name].append(percentage)

        avg_scores = {
            subject: sum(scores) / len(scores)
            for subject, scores in subject_scores.items()
        }

        sorted_subjects = sorted(avg_scores.items(), key=lambda x: x[1])
        return [subject for subject, _ in sorted_subjects[:3]]

    async def get_student_performance_trends(
        self, institution_id: int, student_id: int, params: AnalyticsQueryParams
    ) -> List[StudentPerformanceTrend]:
        start_date, end_date = self._get_date_range(
            params.date_range_type, params.start_date, params.end_date
        )

        trends = []
        current_date = start_date

        while current_date <= end_date:
            next_date = current_date + timedelta(days=30)
            if next_date > end_date:
                next_date = end_date

            monthly_params = AnalyticsQueryParams(
                date_range_type=DateRangeType.CUSTOM,
                start_date=current_date,
                end_date=next_date,
            )

            metrics = await self.get_student_metrics(
                institution_id, student_id, monthly_params
            )

            trends.append(
                StudentPerformanceTrend(
                    date=current_date,
                    average_percentage=metrics.average_percentage,
                    attendance_percentage=metrics.attendance_percentage,
                    assignment_score=metrics.average_assignment_score,
                )
            )

            current_date = next_date + timedelta(days=1)

        return trends
