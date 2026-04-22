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
    
    institutions = db.query(Institution).filter(Institution.is_active == True).all()

    if not institutions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No institutions found"
        )

    inst_ids = [i.id for i in institutions]

    # ── Batch queries (one round-trip each instead of N per-institution calls) ──

    # Latest subscription per institution
    latest_sub_sq = (
        db.query(Subscription.institution_id, func.max(Subscription.created_at).label("max_at"))
        .group_by(Subscription.institution_id)
        .subquery()
    )
    subscriptions_map = {
        row.institution_id: row
        for row in db.query(Subscription).join(
            latest_sub_sq,
            and_(
                Subscription.institution_id == latest_sub_sq.c.institution_id,
                Subscription.created_at == latest_sub_sq.c.max_at,
            ),
        ).all()
    }

    # User counts
    user_counts = dict(
        db.query(User.institution_id, func.count(User.id))
        .filter(User.institution_id.in_(inst_ids))
        .group_by(User.institution_id)
        .all()
    )

    # Attendance totals
    total_att = dict(
        db.query(Attendance.institution_id, func.count(Attendance.id))
        .filter(Attendance.institution_id.in_(inst_ids), Attendance.date >= start_date, Attendance.date <= end_date)
        .group_by(Attendance.institution_id)
        .all()
    )
    present_att = dict(
        db.query(Attendance.institution_id, func.count(Attendance.id))
        .filter(
            Attendance.institution_id.in_(inst_ids),
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.status == AttendanceStatus.PRESENT,
        )
        .group_by(Attendance.institution_id)
        .all()
    )

    # Exam results
    total_exam = dict(
        db.query(ExamResult.institution_id, func.count(ExamResult.id))
        .filter(ExamResult.institution_id.in_(inst_ids), ExamResult.generated_at >= start_date, ExamResult.generated_at <= end_date)
        .group_by(ExamResult.institution_id)
        .all()
    )
    passed_exam = dict(
        db.query(ExamResult.institution_id, func.count(ExamResult.id))
        .filter(
            ExamResult.institution_id.in_(inst_ids),
            ExamResult.generated_at >= start_date,
            ExamResult.generated_at <= end_date,
            ExamResult.is_pass == True,
        )
        .group_by(ExamResult.institution_id)
        .all()
    )
    avg_exam_scores = dict(
        db.query(ExamResult.institution_id, func.avg(ExamResult.percentage))
        .filter(ExamResult.institution_id.in_(inst_ids), ExamResult.generated_at >= start_date, ExamResult.generated_at <= end_date)
        .group_by(ExamResult.institution_id)
        .all()
    )

    # Student / teacher counts
    student_counts = dict(
        db.query(Student.institution_id, func.count(Student.id))
        .filter(Student.institution_id.in_(inst_ids), Student.is_active == True)
        .group_by(Student.institution_id)
        .all()
    )
    teacher_counts = dict(
        db.query(Teacher.institution_id, func.count(Teacher.id))
        .filter(Teacher.institution_id.in_(inst_ids))
        .group_by(Teacher.institution_id)
        .all()
    )

    # Assignment / submission data — wrapped because tables may not exist yet
    assign_counts: dict = {}
    total_sub_counts: dict = {}
    graded_sub_counts: dict = {}
    submitted_sub_counts: dict = {}
    avg_grading_times: dict = {}
    avg_points_map: dict = {}

    try:
        assign_counts = dict(
            db.query(Assignment.institution_id, func.count(Assignment.id))
            .filter(Assignment.institution_id.in_(inst_ids), Assignment.created_at >= start_date, Assignment.created_at <= end_date)
            .group_by(Assignment.institution_id)
            .all()
        )
        # Submission has no institution_id — join through Assignment
        total_sub_counts = dict(
            db.query(Assignment.institution_id, func.count(Submission.id))
            .join(Submission, Submission.assignment_id == Assignment.id)
            .filter(
                Assignment.institution_id.in_(inst_ids),
                Submission.submitted_at >= start_date,
                Submission.submitted_at <= end_date,
                Submission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED, SubmissionStatus.RETURNED]),
            )
            .group_by(Assignment.institution_id)
            .all()
        )
        graded_sub_counts = dict(
            db.query(Assignment.institution_id, func.count(Submission.id))
            .join(Submission, Submission.assignment_id == Assignment.id)
            .filter(
                Assignment.institution_id.in_(inst_ids),
                Submission.graded_at >= start_date,
                Submission.graded_at <= end_date,
                Submission.status == SubmissionStatus.GRADED,
            )
            .group_by(Assignment.institution_id)
            .all()
        )
        submitted_sub_counts = dict(
            db.query(Assignment.institution_id, func.count(Submission.id))
            .join(Submission, Submission.assignment_id == Assignment.id)
            .filter(
                Assignment.institution_id.in_(inst_ids),
                Submission.submitted_at >= start_date,
                Submission.submitted_at <= end_date,
            )
            .group_by(Assignment.institution_id)
            .all()
        )
        avg_grading_times = dict(
            db.query(
                Assignment.institution_id,
                func.avg(func.timestampdiff(
                    func.literal_column('DAY'),
                    Submission.submitted_at,
                    Submission.graded_at,
                )),
            )
            .join(Submission, Submission.assignment_id == Assignment.id)
            .filter(
                Assignment.institution_id.in_(inst_ids),
                Submission.graded_at.isnot(None),
                Submission.submitted_at.isnot(None),
                Submission.graded_at >= start_date,
            )
            .group_by(Assignment.institution_id)
            .all()
        )
        avg_points_map = dict(
            db.query(UserPoints.institution_id, func.avg(UserPoints.total_points))
            .filter(UserPoints.institution_id.in_(inst_ids))
            .group_by(UserPoints.institution_id)
            .all()
        )
    except (ProgrammingError, OperationalError):
        db.rollback()

    # ── Build per-institution metrics from pre-fetched dicts ──
    institution_metrics_list: List[InstitutionMetrics] = []

    for inst in institutions:
        subscription = subscriptions_map.get(inst.id)
        if plan and (not subscription or subscription.plan_name != plan):
            continue

        user_count = user_counts.get(inst.id, 0)
        inst_size = "small" if user_count < 100 else "large" if user_count > 500 else "medium"
        if size and inst_size != size:
            continue

        t_att = total_att.get(inst.id, 0)
        p_att = present_att.get(inst.id, 0)
        attendance_rate = (p_att / t_att * 100) if t_att > 0 else 0.0

        t_exam = total_exam.get(inst.id, 0)
        p_exam = passed_exam.get(inst.id, 0)
        exam_pass_rate = (p_exam / t_exam * 100) if t_exam > 0 else 0.0

        avg_exam_score = float(avg_exam_scores.get(inst.id) or 0)
        active_students = student_counts.get(inst.id, 0)

        total_assignments = assign_counts.get(inst.id, 0)
        total_submissions = total_sub_counts.get(inst.id, 0)
        graded_subs = graded_sub_counts.get(inst.id, 0)
        submitted_count = submitted_sub_counts.get(inst.id, 0)
        avg_grading_time_result = avg_grading_times.get(inst.id)
        avg_points = float(avg_points_map.get(inst.id) or 0)

        expected_submissions = total_assignments * active_students if active_students > 0 else 1
        submission_rate = (total_submissions / expected_submissions * 100) if expected_submissions > 0 else 0.0
        points_engagement = min((avg_points / 1000 * 100), 100)
        engagement_score = submission_rate * 0.6 + points_engagement * 0.4

        grading_rate = (graded_subs / submitted_count * 100) if submitted_count > 0 else 0.0
        avg_grading_time = float(avg_grading_time_result) if avg_grading_time_result else 7.0
        grading_speed_score = max(100 - (avg_grading_time * 10), 0)
        performance_contribution = min(avg_exam_score, 100) if avg_exam_score else 50.0
        teacher_effectiveness = grading_rate * 0.5 + grading_speed_score * 0.3 + performance_contribution * 0.2

        institution_metrics_list.append(InstitutionMetrics(
            institution_id=inst.id,
            institution_name=inst.name,
            region=region or "Unknown",
            subscription_plan=subscription.plan_name if subscription else "None",
            institution_size=inst_size,
            total_students=active_students,
            total_teachers=teacher_counts.get(inst.id, 0),
            average_attendance=round(attendance_rate, 2),
            exam_pass_rate=round(exam_pass_rate, 2),
            average_exam_score=round(avg_exam_score, 2),
            student_engagement_score=round(engagement_score, 2),
            teacher_effectiveness_score=round(teacher_effectiveness, 2),
            assignment_completion_rate=round(submission_rate, 2),
            average_grading_time_days=round(avg_grading_time, 2),
        ))
    
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
