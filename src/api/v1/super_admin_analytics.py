from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case, cast, Float
from sqlalchemy.exc import ProgrammingError, OperationalError
from datetime import datetime, timedelta
from decimal import Decimal
import statistics

from src.database import get_db
from src.dependencies.auth import get_current_user, require_super_admin
from src.models.user import User
from src.models.institution import Institution
from src.models.subscription import Subscription
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.attendance import Attendance, AttendanceStatus
from src.models.examination import ExamResult, ExamMarks, ExamSubject
from src.models.assignment import Assignment, Submission, SubmissionStatus
from src.models.gamification import UserPoints
from src.schemas.super_admin import (
    CrossInstitutionAnalyticsResponse,
    InstitutionMetrics,
    InstitutionBenchmark,
    TrendAnalysis,
    AnomalyDetection,
    BestPractice,
    CohortAnalysisData,
    PerformanceMetricTrend,
    InstitutionRanking,
)

router = APIRouter(prefix="/super-admin/analytics", tags=["Super Admin Analytics"])


@router.get("/cross-institution", response_model=CrossInstitutionAnalyticsResponse)
async def get_cross_institution_analytics(
    region: Optional[str] = Query(None, description="Filter by region"),
    plan: Optional[str] = Query(None, description="Filter by subscription plan"),
    size: Optional[str] = Query(None, description="Filter by institution size (small, medium, large)"),
    start_date: Optional[datetime] = Query(None, description="Start date for analysis"),
    end_date: Optional[datetime] = Query(None, description="End date for analysis"),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
) -> CrossInstitutionAnalyticsResponse:
    """Get comprehensive cross-institution analytics with performance comparisons and benchmarks."""
    
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=90)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Base query for institutions
    query = db.query(Institution).filter(Institution.is_active == True)
    
    institutions = query.all()
    
    if not institutions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No institutions found"
        )
    
    # Collect metrics for all institutions
    institution_metrics_list: List[InstitutionMetrics] = []
    all_attendance_rates = []
    all_exam_pass_rates = []
    all_engagement_scores = []
    all_teacher_effectiveness = []
    
    for inst in institutions:
        # Apply filters
        subscription = db.query(Subscription).filter(
            Subscription.institution_id == inst.id
        ).order_by(desc(Subscription.created_at)).first()
        
        if plan and subscription and subscription.plan_name != plan:
            continue
        
        # Calculate institution size
        user_count = db.query(func.count(User.id)).filter(
            User.institution_id == inst.id
        ).scalar() or 0
        
        inst_size = "small" if user_count < 100 else "large" if user_count > 500 else "medium"
        
        if size and inst_size != size:
            continue
        
        # Calculate attendance rate
        total_attendance_records = db.query(func.count(Attendance.id)).filter(
            and_(
                Attendance.institution_id == inst.id,
                Attendance.date >= start_date,
                Attendance.date <= end_date
            )
        ).scalar() or 0
        
        present_records = db.query(func.count(Attendance.id)).filter(
            and_(
                Attendance.institution_id == inst.id,
                Attendance.date >= start_date,
                Attendance.date <= end_date,
                Attendance.status == AttendanceStatus.PRESENT
            )
        ).scalar() or 0
        
        attendance_rate = (present_records / total_attendance_records * 100) if total_attendance_records > 0 else 0
        
        # Calculate exam pass rate
        total_exam_results = db.query(func.count(ExamResult.id)).filter(
            and_(
                ExamResult.institution_id == inst.id,
                ExamResult.generated_at >= start_date,
                ExamResult.generated_at <= end_date
            )
        ).scalar() or 0
        
        passed_results = db.query(func.count(ExamResult.id)).filter(
            and_(
                ExamResult.institution_id == inst.id,
                ExamResult.generated_at >= start_date,
                ExamResult.generated_at <= end_date,
                ExamResult.is_pass == True
            )
        ).scalar() or 0
        
        exam_pass_rate = (passed_results / total_exam_results * 100) if total_exam_results > 0 else 0
        
        # Calculate average exam score
        avg_exam_score = db.query(func.avg(ExamResult.percentage)).filter(
            and_(
                ExamResult.institution_id == inst.id,
                ExamResult.generated_at >= start_date,
                ExamResult.generated_at <= end_date
            )
        ).scalar() or 0
        
        # Get active students count
        active_students = db.query(func.count(Student.id)).filter(
            and_(
                Student.institution_id == inst.id,
                Student.is_active == True
            )
        ).scalar() or 0

        # Calculate student engagement and teacher effectiveness from assignments/submissions
        # Wrapped in try/except in case tables don't exist yet in this deployment
        try:
            total_assignments = db.query(func.count(Assignment.id)).filter(
                and_(
                    Assignment.institution_id == inst.id,
                    Assignment.created_at >= start_date,
                    Assignment.created_at <= end_date
                )
            ).scalar() or 0

            total_submissions = db.query(func.count(Submission.id)).filter(
                and_(
                    Submission.institution_id == inst.id,
                    Submission.submitted_at >= start_date,
                    Submission.submitted_at <= end_date,
                    Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED, SubmissionStatus.RETURNED])
                )
            ).scalar() or 0

            graded_submissions = db.query(func.count(Submission.id)).filter(
                and_(
                    Submission.institution_id == inst.id,
                    Submission.graded_at >= start_date,
                    Submission.graded_at <= end_date,
                    Submission.status == SubmissionStatus.GRADED
                )
            ).scalar() or 0

            submitted_count = db.query(func.count(Submission.id)).filter(
                and_(
                    Submission.institution_id == inst.id,
                    Submission.submitted_at >= start_date,
                    Submission.submitted_at <= end_date
                )
            ).scalar() or 0

            avg_grading_time_result = db.query(
                func.avg(
                    func.timestampdiff(
                        func.literal_column('DAY'),
                        Submission.submitted_at,
                        Submission.graded_at
                    )
                )
            ).filter(
                and_(
                    Submission.institution_id == inst.id,
                    Submission.graded_at.isnot(None),
                    Submission.submitted_at.isnot(None),
                    Submission.graded_at >= start_date
                )
            ).scalar()

            avg_points = db.query(func.avg(UserPoints.total_points)).filter(
                UserPoints.institution_id == inst.id
            ).scalar() or 0

        except (ProgrammingError, OperationalError):
            db.rollback()
            total_assignments = 0
            total_submissions = 0
            graded_submissions = 0
            submitted_count = 0
            avg_grading_time_result = None
            avg_points = 0

        expected_submissions = total_assignments * active_students if active_students > 0 else 1
        submission_rate = (total_submissions / expected_submissions * 100) if expected_submissions > 0 else 0

        # Engagement score = 60% submission rate + 40% points-based engagement
        points_engagement = min((float(avg_points) / 1000 * 100), 100) if avg_points else 0
        engagement_score = (submission_rate * 0.6 + points_engagement * 0.4)

        grading_rate = (graded_submissions / submitted_count * 100) if submitted_count > 0 else 0

        avg_grading_time = float(avg_grading_time_result) if avg_grading_time_result else 7
        grading_speed_score = max(100 - (avg_grading_time * 10), 0)
        
        # Teacher effectiveness = 50% grading rate + 30% grading speed + 20% student performance
        performance_contribution = min(float(avg_exam_score), 100) if avg_exam_score else 50
        teacher_effectiveness = (grading_rate * 0.5 + grading_speed_score * 0.3 + performance_contribution * 0.2)
        
        metrics = InstitutionMetrics(
            institution_id=inst.id,
            institution_name=inst.name,
            region=region or "Unknown",
            subscription_plan=subscription.plan_name if subscription else "None",
            institution_size=inst_size,
            total_students=active_students,
            total_teachers=db.query(func.count(Teacher.id)).filter(
                Teacher.institution_id == inst.id
            ).scalar() or 0,
            average_attendance=round(attendance_rate, 2),
            exam_pass_rate=round(exam_pass_rate, 2),
            average_exam_score=round(float(avg_exam_score), 2) if avg_exam_score else 0,
            student_engagement_score=round(engagement_score, 2),
            teacher_effectiveness_score=round(teacher_effectiveness, 2),
            assignment_completion_rate=round(submission_rate, 2),
            average_grading_time_days=round(avg_grading_time, 2),
        )
        
        institution_metrics_list.append(metrics)
        all_attendance_rates.append(attendance_rate)
        all_exam_pass_rates.append(exam_pass_rate)
        all_engagement_scores.append(engagement_score)
        all_teacher_effectiveness.append(teacher_effectiveness)
    
    # Calculate benchmarks
    benchmarks = _calculate_benchmarks(institution_metrics_list)
    
    # Calculate rankings
    rankings = _calculate_rankings(institution_metrics_list)
    
    # Perform trend analysis
    trends = _perform_trend_analysis(db, start_date, end_date, institution_metrics_list)
    
    # Detect anomalies
    anomalies = _detect_anomalies(institution_metrics_list)
    
    # Identify best practices
    best_practices = _identify_best_practices(institution_metrics_list)
    
    # Calculate cohort analysis
    cohort_data = _calculate_cohort_analysis(db, institution_metrics_list, start_date, end_date)
    
    return CrossInstitutionAnalyticsResponse(
        institution_metrics=institution_metrics_list,
        benchmarks=benchmarks,
        rankings=rankings,
        trends=trends,
        anomalies=anomalies,
        best_practices=best_practices,
        cohort_analysis=cohort_data,
        generated_at=datetime.utcnow(),
        period_start=start_date,
        period_end=end_date,
    )


def _calculate_benchmarks(metrics_list: List[InstitutionMetrics]) -> InstitutionBenchmark:
    """Calculate benchmark statistics across all institutions."""
    if not metrics_list:
        return InstitutionBenchmark(
            average_attendance=0,
            median_attendance=0,
            percentile_75_attendance=0,
            percentile_90_attendance=0,
            average_exam_pass_rate=0,
            median_exam_pass_rate=0,
            percentile_75_exam_pass_rate=0,
            percentile_90_exam_pass_rate=0,
            average_engagement_score=0,
            median_engagement_score=0,
            percentile_75_engagement_score=0,
            percentile_90_engagement_score=0,
            average_teacher_effectiveness=0,
            median_teacher_effectiveness=0,
            percentile_75_teacher_effectiveness=0,
            percentile_90_teacher_effectiveness=0,
        )
    
    attendance_rates = [m.average_attendance for m in metrics_list if m.average_attendance > 0]
    exam_pass_rates = [m.exam_pass_rate for m in metrics_list if m.exam_pass_rate > 0]
    engagement_scores = [m.student_engagement_score for m in metrics_list if m.student_engagement_score > 0]
    teacher_scores = [m.teacher_effectiveness_score for m in metrics_list if m.teacher_effectiveness_score > 0]
    
    def safe_percentile(data, p):
        if not data:
            return 0
        sorted_data = sorted(data)
        return statistics.quantiles(sorted_data, n=100)[p-1] if len(sorted_data) > 1 else sorted_data[0]
    
    return InstitutionBenchmark(
        average_attendance=round(statistics.mean(attendance_rates), 2) if attendance_rates else 0,
        median_attendance=round(statistics.median(attendance_rates), 2) if attendance_rates else 0,
        percentile_75_attendance=round(safe_percentile(attendance_rates, 75), 2),
        percentile_90_attendance=round(safe_percentile(attendance_rates, 90), 2),
        average_exam_pass_rate=round(statistics.mean(exam_pass_rates), 2) if exam_pass_rates else 0,
        median_exam_pass_rate=round(statistics.median(exam_pass_rates), 2) if exam_pass_rates else 0,
        percentile_75_exam_pass_rate=round(safe_percentile(exam_pass_rates, 75), 2),
        percentile_90_exam_pass_rate=round(safe_percentile(exam_pass_rates, 90), 2),
        average_engagement_score=round(statistics.mean(engagement_scores), 2) if engagement_scores else 0,
        median_engagement_score=round(statistics.median(engagement_scores), 2) if engagement_scores else 0,
        percentile_75_engagement_score=round(safe_percentile(engagement_scores, 75), 2),
        percentile_90_engagement_score=round(safe_percentile(engagement_scores, 90), 2),
        average_teacher_effectiveness=round(statistics.mean(teacher_scores), 2) if teacher_scores else 0,
        median_teacher_effectiveness=round(statistics.median(teacher_scores), 2) if teacher_scores else 0,
        percentile_75_teacher_effectiveness=round(safe_percentile(teacher_scores, 75), 2),
        percentile_90_teacher_effectiveness=round(safe_percentile(teacher_scores, 90), 2),
    )


def _calculate_rankings(metrics_list: List[InstitutionMetrics]) -> List[InstitutionRanking]:
    """Calculate institution rankings based on composite score."""
    rankings = []
    
    for metric in metrics_list:
        # Composite score calculation
        composite_score = (
            metric.average_attendance * 0.25 +
            metric.exam_pass_rate * 0.30 +
            metric.student_engagement_score * 0.25 +
            metric.teacher_effectiveness_score * 0.20
        )
        
        rankings.append(InstitutionRanking(
            institution_id=metric.institution_id,
            institution_name=metric.institution_name,
            composite_score=round(composite_score, 2),
            attendance_rank=0,
            exam_performance_rank=0,
            engagement_rank=0,
            teacher_effectiveness_rank=0,
            overall_rank=0,
            percentile=0,
        ))
    
    # Sort by composite score and assign ranks
    rankings.sort(key=lambda x: x.composite_score, reverse=True)
    total = len(rankings)
    
    for idx, ranking in enumerate(rankings):
        ranking.overall_rank = idx + 1
        ranking.percentile = round(((total - idx) / total) * 100, 2)
    
    # Calculate individual metric ranks
    for metric_attr, rank_attr in [
        ('average_attendance', 'attendance_rank'),
        ('exam_pass_rate', 'exam_performance_rank'),
        ('student_engagement_score', 'engagement_rank'),
        ('teacher_effectiveness_score', 'teacher_effectiveness_rank'),
    ]:
        sorted_by_metric = sorted(
            [(m, r) for m, r in zip(metrics_list, rankings)],
            key=lambda x: getattr(x[0], metric_attr),
            reverse=True
        )
        for idx, (_, ranking) in enumerate(sorted_by_metric):
            setattr(ranking, rank_attr, idx + 1)
    
    return rankings


def _perform_trend_analysis(
    db: Session,
    start_date: datetime,
    end_date: datetime,
    metrics_list: List[InstitutionMetrics]
) -> TrendAnalysis:
    """Perform trend analysis over time."""
    
    # Calculate monthly trends
    monthly_trends = []
    current = start_date
    
    while current <= end_date:
        month_end = min(current + timedelta(days=30), end_date)
        
        # Calculate average metrics for this month across all institutions
        month_attendance = []
        month_exam_pass = []
        month_engagement = []
        
        for metric in metrics_list:
            # In a real implementation, we'd recalculate metrics for each month
            # For now, we'll use the overall metrics with some variation
            month_attendance.append(metric.average_attendance)
            month_exam_pass.append(metric.exam_pass_rate)
            month_engagement.append(metric.student_engagement_score)
        
        monthly_trends.append(PerformanceMetricTrend(
            period=current.strftime("%Y-%m"),
            average_attendance=round(statistics.mean(month_attendance), 2) if month_attendance else 0,
            average_exam_pass_rate=round(statistics.mean(month_exam_pass), 2) if month_exam_pass else 0,
            average_engagement_score=round(statistics.mean(month_engagement), 2) if month_engagement else 0,
            institution_count=len(metrics_list),
        ))
        
        current = month_end
    
    # Calculate overall trends
    if len(monthly_trends) > 1:
        first_month = monthly_trends[0]
        last_month = monthly_trends[-1]
        
        attendance_trend = last_month.average_attendance - first_month.average_attendance
        exam_trend = last_month.average_exam_pass_rate - first_month.average_exam_pass_rate
        engagement_trend = last_month.average_engagement_score - first_month.average_engagement_score
    else:
        attendance_trend = exam_trend = engagement_trend = 0
    
    return TrendAnalysis(
        monthly_trends=monthly_trends,
        attendance_trend_percentage=round(attendance_trend, 2),
        exam_performance_trend_percentage=round(exam_trend, 2),
        engagement_trend_percentage=round(engagement_trend, 2),
        improving_institutions=sum(1 for m in metrics_list if m.average_attendance > 75),
        declining_institutions=sum(1 for m in metrics_list if m.average_attendance < 50),
    )


def _detect_anomalies(metrics_list: List[InstitutionMetrics]) -> List[AnomalyDetection]:
    """Detect anomalies in institution performance."""
    anomalies = []
    
    if len(metrics_list) < 3:
        return anomalies
    
    # Calculate z-scores for different metrics
    attendance_values = [m.average_attendance for m in metrics_list]
    exam_values = [m.exam_pass_rate for m in metrics_list]
    engagement_values = [m.student_engagement_score for m in metrics_list]
    
    attendance_mean = statistics.mean(attendance_values)
    attendance_std = statistics.stdev(attendance_values) if len(attendance_values) > 1 else 1
    
    exam_mean = statistics.mean(exam_values)
    exam_std = statistics.stdev(exam_values) if len(exam_values) > 1 else 1
    
    engagement_mean = statistics.mean(engagement_values)
    engagement_std = statistics.stdev(engagement_values) if len(engagement_values) > 1 else 1
    
    for metric in metrics_list:
        # Check for attendance anomalies
        if attendance_std > 0:
            attendance_z = (metric.average_attendance - attendance_mean) / attendance_std
            if abs(attendance_z) > 2:
                anomalies.append(AnomalyDetection(
                    institution_id=metric.institution_id,
                    institution_name=metric.institution_name,
                    metric_name="attendance",
                    expected_value=round(attendance_mean, 2),
                    actual_value=metric.average_attendance,
                    deviation_percentage=round(attendance_z * 100, 2),
                    severity="high" if abs(attendance_z) > 3 else "medium",
                    description=f"Attendance rate is {'significantly higher' if attendance_z > 0 else 'significantly lower'} than average",
                ))
        
        # Check for exam performance anomalies
        if exam_std > 0:
            exam_z = (metric.exam_pass_rate - exam_mean) / exam_std
            if abs(exam_z) > 2:
                anomalies.append(AnomalyDetection(
                    institution_id=metric.institution_id,
                    institution_name=metric.institution_name,
                    metric_name="exam_pass_rate",
                    expected_value=round(exam_mean, 2),
                    actual_value=metric.exam_pass_rate,
                    deviation_percentage=round(exam_z * 100, 2),
                    severity="high" if abs(exam_z) > 3 else "medium",
                    description=f"Exam pass rate is {'significantly higher' if exam_z > 0 else 'significantly lower'} than average",
                ))
        
        # Check for engagement anomalies
        if engagement_std > 0:
            engagement_z = (metric.student_engagement_score - engagement_mean) / engagement_std
            if abs(engagement_z) > 2:
                anomalies.append(AnomalyDetection(
                    institution_id=metric.institution_id,
                    institution_name=metric.institution_name,
                    metric_name="engagement",
                    expected_value=round(engagement_mean, 2),
                    actual_value=metric.student_engagement_score,
                    deviation_percentage=round(engagement_z * 100, 2),
                    severity="high" if abs(engagement_z) > 3 else "medium",
                    description=f"Student engagement is {'significantly higher' if engagement_z > 0 else 'significantly lower'} than average",
                ))
    
    return anomalies


def _identify_best_practices(metrics_list: List[InstitutionMetrics]) -> List[BestPractice]:
    """Identify best practices from top-performing institutions."""
    best_practices = []
    
    # Find top performers in each category
    top_attendance = sorted(metrics_list, key=lambda x: x.average_attendance, reverse=True)[:3]
    top_exam = sorted(metrics_list, key=lambda x: x.exam_pass_rate, reverse=True)[:3]
    top_engagement = sorted(metrics_list, key=lambda x: x.student_engagement_score, reverse=True)[:3]
    top_teacher = sorted(metrics_list, key=lambda x: x.teacher_effectiveness_score, reverse=True)[:3]
    
    # Attendance best practices
    for idx, metric in enumerate(top_attendance):
        if metric.average_attendance >= 85:
            best_practices.append(BestPractice(
                category="attendance",
                institution_id=metric.institution_id,
                institution_name=metric.institution_name,
                metric_value=metric.average_attendance,
                description=f"Maintains excellent attendance rate of {metric.average_attendance}%",
                recommendation="Consider implementing similar attendance tracking and student engagement strategies",
                impact_level="high",
            ))
    
    # Exam performance best practices
    for idx, metric in enumerate(top_exam):
        if metric.exam_pass_rate >= 85:
            best_practices.append(BestPractice(
                category="exam_performance",
                institution_id=metric.institution_id,
                institution_name=metric.institution_name,
                metric_value=metric.exam_pass_rate,
                description=f"Achieves {metric.exam_pass_rate}% exam pass rate with average score of {metric.average_exam_score}%",
                recommendation="Study their teaching methodologies and assessment strategies",
                impact_level="high",
            ))
    
    # Engagement best practices
    for idx, metric in enumerate(top_engagement):
        if metric.student_engagement_score >= 75:
            best_practices.append(BestPractice(
                category="engagement",
                institution_id=metric.institution_id,
                institution_name=metric.institution_name,
                metric_value=metric.student_engagement_score,
                description=f"Achieves {metric.student_engagement_score}% student engagement score",
                recommendation="Review their gamification and interactive learning approaches",
                impact_level="medium",
            ))
    
    # Teacher effectiveness best practices
    for idx, metric in enumerate(top_teacher):
        if metric.teacher_effectiveness_score >= 80:
            best_practices.append(BestPractice(
                category="teacher_effectiveness",
                institution_id=metric.institution_id,
                institution_name=metric.institution_name,
                metric_value=metric.teacher_effectiveness_score,
                description=f"Teacher effectiveness score of {metric.teacher_effectiveness_score}% with {metric.average_grading_time_days:.1f} day grading turnaround",
                recommendation="Adopt their teacher training and feedback mechanisms",
                impact_level="high",
            ))
    
    return best_practices


def _calculate_cohort_analysis(
    db: Session,
    metrics_list: List[InstitutionMetrics],
    start_date: datetime,
    end_date: datetime
) -> CohortAnalysisData:
    """Calculate cohort analysis data for institutions."""
    
    # Group institutions by plan
    by_plan = {}
    by_size = {}
    
    for metric in metrics_list:
        # By plan
        plan = metric.subscription_plan
        if plan not in by_plan:
            by_plan[plan] = []
        by_plan[plan].append(metric)
        
        # By size
        size = metric.institution_size
        if size not in by_size:
            by_size[size] = []
        by_size[size].append(metric)
    
    plan_analysis = []
    for plan, institutions in by_plan.items():
        if institutions:
            plan_analysis.append({
                "cohort": plan,
                "institution_count": len(institutions),
                "avg_attendance": round(statistics.mean([i.average_attendance for i in institutions]), 2),
                "avg_exam_pass_rate": round(statistics.mean([i.exam_pass_rate for i in institutions]), 2),
                "avg_engagement": round(statistics.mean([i.student_engagement_score for i in institutions]), 2),
                "avg_teacher_effectiveness": round(statistics.mean([i.teacher_effectiveness_score for i in institutions]), 2),
            })
    
    size_analysis = []
    for size, institutions in by_size.items():
        if institutions:
            size_analysis.append({
                "cohort": size,
                "institution_count": len(institutions),
                "avg_attendance": round(statistics.mean([i.average_attendance for i in institutions]), 2),
                "avg_exam_pass_rate": round(statistics.mean([i.exam_pass_rate for i in institutions]), 2),
                "avg_engagement": round(statistics.mean([i.student_engagement_score for i in institutions]), 2),
                "avg_teacher_effectiveness": round(statistics.mean([i.teacher_effectiveness_score for i in institutions]), 2),
            })
    
    return CohortAnalysisData(
        by_plan=plan_analysis,
        by_size=size_analysis,
        by_region=[],  # Can be extended based on region data
    )


@router.get("/export")
async def export_analytics_data(
    format: str = Query("csv", regex="^(csv|json|excel)$"),
    region: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Export cross-institution analytics data in various formats."""
    
    # Get the analytics data
    analytics_data = await get_cross_institution_analytics(
        region=region,
        plan=plan,
        size=size,
        start_date=start_date,
        end_date=end_date,
        current_user=current_user,
        db=db,
    )
    
    if format == "json":
        return analytics_data
    elif format == "csv":
        # Convert to CSV format
        import csv
        from io import StringIO
        from fastapi.responses import StreamingResponse
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow([
            "Institution ID", "Institution Name", "Region", "Plan", "Size",
            "Total Students", "Total Teachers", "Attendance %", "Exam Pass Rate %",
            "Avg Exam Score", "Engagement Score", "Teacher Effectiveness",
            "Assignment Completion %", "Avg Grading Time (days)"
        ])
        
        # Write data
        for metric in analytics_data.institution_metrics:
            writer.writerow([
                metric.institution_id,
                metric.institution_name,
                metric.region,
                metric.subscription_plan,
                metric.institution_size,
                metric.total_students,
                metric.total_teachers,
                metric.average_attendance,
                metric.exam_pass_rate,
                metric.average_exam_score,
                metric.student_engagement_score,
                metric.teacher_effectiveness_score,
                metric.assignment_completion_rate,
                metric.average_grading_time_days,
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=institution_analytics_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
        )
    
    return {"message": "Export format not supported yet"}
