from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from decimal import Decimal

from src.models.parent_roi import ParentROIReport
from src.models.student import Parent, StudentParent, Student
from src.models.assignment import Submission, SubmissionStatus
from src.models.examination import ExamResult
from src.models.attendance import Attendance, AttendanceStatus
from src.models.doubt import DoubtPost
from src.models.study_planner import StudyPlan
from src.models.fee import FeePayment
from src.models.user import User


class ParentROIService:
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_roi_report(
        self,
        parent_id: int,
        institution_id: int,
        academic_year: str
    ) -> ParentROIReport:
        """Generate comprehensive ROI report for a parent"""
        
        # Get parent's children
        children = self.db.query(Student).join(StudentParent).filter(
            and_(
                StudentParent.parent_id == parent_id,
                Student.institution_id == institution_id,
                Student.is_active == True
            )
        ).all()
        
        if not children:
            raise ValueError("No active children found for this parent")
        
        # Calculate performance improvements
        performance_improvement = self._calculate_performance_improvement(children, academic_year)
        
        # Calculate time savings
        time_saved_hours = self._calculate_time_savings(parent_id, children, academic_year)
        
        # Calculate money saved and tuition cost avoidance
        money_saved, tuition_cost_avoidance = self._calculate_cost_savings(
            children, academic_year
        )
        
        # Calculate fees paid
        fees_paid = self._calculate_fees_paid(parent_id, institution_id, academic_year)
        
        # Calculate feature usage and engagement
        features_used = self._calculate_feature_usage(parent_id, children, academic_year)
        engagement_score = self._calculate_engagement_score(features_used)
        
        # Calculate ROI percentage
        total_value = float(money_saved) + float(tuition_cost_avoidance) + (time_saved_hours * 50)
        fees_paid_float = float(fees_paid) if fees_paid > 0 else 1.0
        roi_percentage = ((total_value - fees_paid_float) / fees_paid_float) * 100
        
        # Create or update report
        existing_report = self.db.query(ParentROIReport).filter(
            and_(
                ParentROIReport.parent_id == parent_id,
                ParentROIReport.academic_year == academic_year
            )
        ).first()
        
        if existing_report:
            existing_report.fees_paid = fees_paid
            existing_report.performance_improvement = performance_improvement
            existing_report.time_saved_hours = time_saved_hours
            existing_report.money_saved = Decimal(str(money_saved))
            existing_report.tuition_cost_avoidance = Decimal(str(tuition_cost_avoidance))
            existing_report.features_used = features_used
            existing_report.engagement_score = engagement_score
            existing_report.roi_percentage = roi_percentage
            existing_report.report_generated_at = datetime.utcnow()
            existing_report.updated_at = datetime.utcnow()
            report = existing_report
        else:
            report = ParentROIReport(
                institution_id=institution_id,
                parent_id=parent_id,
                academic_year=academic_year,
                fees_paid=fees_paid,
                performance_improvement=performance_improvement,
                time_saved_hours=time_saved_hours,
                money_saved=Decimal(str(money_saved)),
                tuition_cost_avoidance=Decimal(str(tuition_cost_avoidance)),
                features_used=features_used,
                engagement_score=engagement_score,
                roi_percentage=roi_percentage
            )
            self.db.add(report)
        
        self.db.commit()
        self.db.refresh(report)
        return report
    
    def _calculate_performance_improvement(
        self,
        children: List[Student],
        academic_year: str
    ) -> Dict[str, Any]:
        """Calculate academic performance deltas for each child"""
        improvements = {}
        
        for child in children:
            child_data = {
                'student_id': child.id,
                'student_name': f"{child.first_name} {child.last_name}",
                'metrics': {}
            }
            
            # Get date range for academic year
            year_start, year_end = self._get_academic_year_dates(academic_year)
            
            # Calculate grade improvement
            grade_delta = self._calculate_grade_delta(child.id, year_start, year_end)
            child_data['metrics']['grade_improvement'] = grade_delta
            
            # Calculate attendance improvement
            attendance_delta = self._calculate_attendance_delta(child.id, year_start, year_end)
            child_data['metrics']['attendance_improvement'] = attendance_delta
            
            # Calculate submission rate
            submission_rate = self._calculate_submission_rate(child.id, year_start, year_end)
            child_data['metrics']['submission_rate'] = submission_rate
            
            # Overall improvement score
            overall = (
                (grade_delta * 0.5) + 
                (attendance_delta * 0.3) + 
                (submission_rate * 0.2)
            )
            child_data['overall_improvement'] = round(overall, 2)
            
            improvements[str(child.id)] = child_data
        
        return improvements
    
    def _calculate_time_savings(
        self,
        parent_id: int,
        children: List[Student],
        academic_year: str
    ) -> float:
        """Calculate time saved using platform vs traditional methods"""
        year_start, year_end = self._get_academic_year_dates(academic_year)
        
        total_time_saved = 0.0
        
        for child in children:
            # Doubt resolution time saved (vs in-person tutoring)
            doubts_count = self.db.query(DoubtPost).filter(
                and_(
                    DoubtPost.user_id == child.user_id,
                    DoubtPost.created_at >= year_start,
                    DoubtPost.created_at <= year_end,
                    DoubtPost.status == 'resolved'
                )
            ).count()
            # Assume 1 hour saved per doubt vs scheduling/traveling to tutor
            total_time_saved += doubts_count * 1.0
            
            # Assignment submission time saved (digital vs physical)
            submissions_count = self.db.query(Submission).filter(
                and_(
                    Submission.student_id == child.id,
                    Submission.submitted_at >= year_start,
                    Submission.submitted_at <= year_end
                )
            ).count()
            # Assume 0.25 hours saved per submission
            total_time_saved += submissions_count * 0.25
            
            # Study planning time saved
            study_plans = self.db.query(StudyPlan).filter(
                and_(
                    StudyPlan.student_id == child.id,
                    StudyPlan.created_at >= year_start,
                    StudyPlan.created_at <= year_end
                )
            ).count()
            # Assume 2 hours saved per study plan created
            total_time_saved += study_plans * 2.0
        
        # Parent portal time saved (checking grades, attendance, etc.)
        # Assume 1 hour per week saved vs traditional school visits/calls
        weeks_in_year = 40
        total_time_saved += weeks_in_year * 1.0
        
        return round(total_time_saved, 2)
    
    def _calculate_cost_savings(
        self,
        children: List[Student],
        academic_year: str
    ) -> tuple:
        """Calculate money saved and tuition cost avoidance"""
        year_start, year_end = self._get_academic_year_dates(academic_year)
        
        money_saved = 0.0
        tuition_cost_avoidance = 0.0
        
        for child in children:
            # Doubt resolution cost avoidance (vs private tutoring)
            doubts_resolved = self.db.query(DoubtPost).filter(
                and_(
                    DoubtPost.user_id == child.user_id,
                    DoubtPost.created_at >= year_start,
                    DoubtPost.created_at <= year_end,
                    DoubtPost.status == 'resolved'
                )
            ).count()
            # Assume $30 per tutoring session avoided
            tuition_cost_avoidance += doubts_resolved * 30.0
            
            # Study materials cost avoidance
            # Assume platform materials save $200 per year per child
            money_saved += 200.0
            
            # Communication cost savings (vs phone calls, transport for meetings)
            # Assume $100 per year per child
            money_saved += 100.0
        
        # Additional savings from platform features
        # Digital resources, automatic reminders, etc.
        money_saved += len(children) * 150.0
        
        return round(money_saved, 2), round(tuition_cost_avoidance, 2)
    
    def _calculate_fees_paid(
        self,
        parent_id: int,
        institution_id: int,
        academic_year: str
    ) -> Decimal:
        """Calculate total fees paid by parent for the academic year"""
        year_start, year_end = self._get_academic_year_dates(academic_year)
        
        # Get all fee payments for this parent's children
        children_ids = self.db.query(Student.id).join(StudentParent).filter(
            StudentParent.parent_id == parent_id
        ).all()
        children_ids = [c[0] for c in children_ids]
        
        total_fees = self.db.query(func.sum(FeePayment.amount_paid)).filter(
            and_(
                FeePayment.student_id.in_(children_ids),
                FeePayment.payment_date >= year_start.date(),
                FeePayment.payment_date <= year_end.date(),
                FeePayment.status == 'completed'
            )
        ).scalar()
        
        return Decimal(str(total_fees)) if total_fees else Decimal('0.00')
    
    def _calculate_feature_usage(
        self,
        parent_id: int,
        children: List[Student],
        academic_year: str
    ) -> Dict[str, Any]:
        """Track which platform features were used"""
        year_start, year_end = self._get_academic_year_dates(academic_year)
        
        features = {
            'doubt_resolution': 0,
            'assignment_tracking': 0,
            'attendance_monitoring': 0,
            'grade_tracking': 0,
            'study_planning': 0,
            'parent_portal_logins': 0
        }
        
        for child in children:
            # Doubt resolution usage
            features['doubt_resolution'] += self.db.query(DoubtPost).filter(
                and_(
                    DoubtPost.user_id == child.user_id,
                    DoubtPost.created_at >= year_start,
                    DoubtPost.created_at <= year_end
                )
            ).count()
            
            # Assignment tracking
            features['assignment_tracking'] += self.db.query(Submission).filter(
                and_(
                    Submission.student_id == child.id,
                    Submission.submitted_at >= year_start,
                    Submission.submitted_at <= year_end
                )
            ).count()
            
            # Attendance monitoring
            features['attendance_monitoring'] += self.db.query(Attendance).filter(
                and_(
                    Attendance.student_id == child.id,
                    Attendance.date >= year_start.date(),
                    Attendance.date <= year_end.date()
                )
            ).count()
            
            # Grade tracking
            features['grade_tracking'] += self.db.query(ExamResult).filter(
                and_(
                    ExamResult.student_id == child.id,
                    ExamResult.created_at >= year_start,
                    ExamResult.created_at <= year_end
                )
            ).count()
            
            # Study planning
            features['study_planning'] += self.db.query(StudyPlan).filter(
                and_(
                    StudyPlan.student_id == child.id,
                    StudyPlan.created_at >= year_start,
                    StudyPlan.created_at <= year_end
                )
            ).count()
        
        # Parent portal logins (approximate from user activity)
        parent = self.db.query(Parent).filter(Parent.id == parent_id).first()
        if parent and parent.user_id:
            # This would ideally track actual logins from an activity log
            # For now, estimate based on engagement
            features['parent_portal_logins'] = 100  # Placeholder
        
        return features
    
    def _calculate_engagement_score(self, features_used: Dict[str, Any]) -> float:
        """Calculate overall engagement score based on feature usage"""
        # Weights for different features
        weights = {
            'doubt_resolution': 0.20,
            'assignment_tracking': 0.20,
            'attendance_monitoring': 0.15,
            'grade_tracking': 0.15,
            'study_planning': 0.15,
            'parent_portal_logins': 0.15
        }
        
        # Normalize each feature (cap at reasonable max values)
        max_values = {
            'doubt_resolution': 50,
            'assignment_tracking': 100,
            'attendance_monitoring': 200,
            'grade_tracking': 50,
            'study_planning': 20,
            'parent_portal_logins': 150
        }
        
        score = 0.0
        for feature, weight in weights.items():
            normalized = min(features_used.get(feature, 0) / max_values[feature], 1.0)
            score += normalized * weight
        
        # Convert to 0-100 scale
        return round(score * 100, 2)
    
    def _calculate_grade_delta(
        self,
        student_id: int,
        year_start: datetime,
        year_end: datetime
    ) -> float:
        """Calculate grade improvement percentage"""
        # Get first quarter and last quarter exam results
        first_quarter_end = year_start + timedelta(days=90)
        last_quarter_start = year_end - timedelta(days=90)
        
        first_quarter_results = self.db.query(ExamResult).filter(
            and_(
                ExamResult.student_id == student_id,
                ExamResult.created_at >= year_start,
                ExamResult.created_at <= first_quarter_end,
                ExamResult.marks_obtained.isnot(None)
            )
        ).all()
        
        last_quarter_results = self.db.query(ExamResult).filter(
            and_(
                ExamResult.student_id == student_id,
                ExamResult.created_at >= last_quarter_start,
                ExamResult.created_at <= year_end,
                ExamResult.marks_obtained.isnot(None)
            )
        ).all()
        
        if not first_quarter_results or not last_quarter_results:
            return 0.0
        
        first_avg = sum(float(r.marks_obtained) for r in first_quarter_results) / len(first_quarter_results)
        last_avg = sum(float(r.marks_obtained) for r in last_quarter_results) / len(last_quarter_results)
        
        if first_avg == 0:
            return 0.0
        
        improvement = ((last_avg - first_avg) / first_avg) * 100
        return round(improvement, 2)
    
    def _calculate_attendance_delta(
        self,
        student_id: int,
        year_start: datetime,
        year_end: datetime
    ) -> float:
        """Calculate attendance improvement percentage"""
        first_quarter_end = year_start + timedelta(days=90)
        last_quarter_start = year_end - timedelta(days=90)
        
        # First quarter attendance
        first_quarter_total = self.db.query(Attendance).filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date >= year_start.date(),
                Attendance.date <= first_quarter_end.date()
            )
        ).count()
        
        first_quarter_present = self.db.query(Attendance).filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date >= year_start.date(),
                Attendance.date <= first_quarter_end.date(),
                Attendance.status == AttendanceStatus.PRESENT
            )
        ).count()
        
        # Last quarter attendance
        last_quarter_total = self.db.query(Attendance).filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date >= last_quarter_start.date(),
                Attendance.date <= year_end.date()
            )
        ).count()
        
        last_quarter_present = self.db.query(Attendance).filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date >= last_quarter_start.date(),
                Attendance.date <= year_end.date(),
                Attendance.status == AttendanceStatus.PRESENT
            )
        ).count()
        
        if first_quarter_total == 0 or last_quarter_total == 0:
            return 0.0
        
        first_rate = (first_quarter_present / first_quarter_total) * 100
        last_rate = (last_quarter_present / last_quarter_total) * 100
        
        improvement = last_rate - first_rate
        return round(improvement, 2)
    
    def _calculate_submission_rate(
        self,
        student_id: int,
        year_start: datetime,
        year_end: datetime
    ) -> float:
        """Calculate assignment submission rate"""
        # This would ideally compare assigned vs submitted
        # For now, calculate based on submitted assignments
        total_submissions = self.db.query(Submission).filter(
            and_(
                Submission.student_id == student_id,
                Submission.submitted_at >= year_start,
                Submission.submitted_at <= year_end
            )
        ).count()
        
        # Assume average of 2 assignments per week, 40 weeks
        expected_submissions = 80
        
        rate = (total_submissions / expected_submissions) * 100 if expected_submissions > 0 else 0.0
        return min(round(rate, 2), 100.0)  # Cap at 100%
    
    def _get_academic_year_dates(self, academic_year: str) -> tuple:
        """Convert academic year string to date range"""
        # Assume format like "2023-2024"
        try:
            start_year = int(academic_year.split('-')[0])
            year_start = datetime(start_year, 4, 1)  # April 1st
            year_end = datetime(start_year + 1, 3, 31, 23, 59, 59)  # March 31st next year
        except:
            # Fallback to current year
            now = datetime.utcnow()
            if now.month >= 4:
                year_start = datetime(now.year, 4, 1)
                year_end = datetime(now.year + 1, 3, 31, 23, 59, 59)
            else:
                year_start = datetime(now.year - 1, 4, 1)
                year_end = datetime(now.year, 3, 31, 23, 59, 59)
        
        return year_start, year_end
    
    def get_roi_report(
        self,
        parent_id: int,
        institution_id: int,
        academic_year: str
    ) -> Optional[ParentROIReport]:
        """Retrieve existing ROI report, scoped to the caller's own institution."""
        return self.db.query(ParentROIReport).filter(
            and_(
                ParentROIReport.parent_id == parent_id,
                ParentROIReport.institution_id == institution_id,
                ParentROIReport.academic_year == academic_year
            )
        ).first()

    def get_roi_report_by_id(
        self,
        report_id: int,
        institution_id: int
    ) -> Optional[ParentROIReport]:
        """Retrieve a specific ROI report by id, scoped to the caller's own institution."""
        return self.db.query(ParentROIReport).filter(
            and_(
                ParentROIReport.id == report_id,
                ParentROIReport.institution_id == institution_id
            )
        ).first()
    
    def list_roi_reports(
        self,
        institution_id: int,
        academic_year: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ParentROIReport]:
        """List all ROI reports for an institution"""
        query = self.db.query(ParentROIReport).filter(
            ParentROIReport.institution_id == institution_id
        )
        
        if academic_year:
            query = query.filter(ParentROIReport.academic_year == academic_year)
        
        return query.order_by(
            desc(ParentROIReport.roi_percentage)
        ).offset(skip).limit(limit).all()
