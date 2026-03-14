from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime


class InstitutionMetricsSummary(BaseModel):
    total_institutions: int = Field(..., description="Total number of institutions")
    active_subscriptions: int = Field(..., description="Number of active subscriptions")
    mrr: float = Field(..., description="Monthly Recurring Revenue")
    arr: float = Field(..., description="Annual Recurring Revenue")
    institution_growth_trend: float = Field(..., description="Institution growth percentage")


class SubscriptionStatusDistribution(BaseModel):
    active: int = Field(default=0, description="Number of active subscriptions")
    trial: int = Field(default=0, description="Number of trial subscriptions")
    expired: int = Field(default=0, description="Number of expired subscriptions")
    cancelled: int = Field(default=0, description="Number of cancelled subscriptions")


class PlatformUsageStatistics(BaseModel):
    dau: int = Field(..., description="Daily Active Users")
    mau: int = Field(..., description="Monthly Active Users")
    total_users: int = Field(..., description="Total registered users")
    active_users: int = Field(..., description="Total active users")
    dau_mau_ratio: float = Field(..., description="DAU/MAU ratio as percentage")


class RevenueTrend(BaseModel):
    month: str = Field(..., description="Month label (e.g., 'Jan 2024')")
    mrr: float = Field(..., description="Monthly Recurring Revenue for this month")
    arr: float = Field(..., description="Annual Recurring Revenue for this month")
    total_revenue: float = Field(..., description="Total revenue collected in this month")


class RecentActivity(BaseModel):
    type: str = Field(..., description="Type of activity (institution, subscription, payment, alert)")
    title: str = Field(..., description="Activity title")
    description: str = Field(..., description="Activity description")
    time: str = Field(..., description="Time ago string (e.g., '2 hours ago')")
    institution_id: Optional[int] = Field(None, description="Related institution ID if applicable")


class InstitutionPerformanceComparison(BaseModel):
    id: int = Field(..., description="Institution ID")
    name: str = Field(..., description="Institution name")
    total_users: int = Field(..., description="Total number of users")
    active_users: int = Field(..., description="Number of active users")
    subscription_status: str = Field(..., description="Current subscription status")
    revenue: float = Field(..., description="Total revenue from this institution")
    last_activity: str = Field(..., description="Last activity timestamp")
    engagement: float = Field(..., description="Engagement percentage")


class QuickActionStats(BaseModel):
    trials_expiring_soon: int = Field(..., description="Number of trials expiring within 7 days")
    grace_period_ending: int = Field(..., description="Number of subscriptions with grace period ending soon")
    pending_onboarding: int = Field(..., description="Number of institutions pending onboarding")


class SuperAdminDashboardResponse(BaseModel):
    metrics_summary: InstitutionMetricsSummary
    subscription_distribution: SubscriptionStatusDistribution
    platform_usage: PlatformUsageStatistics
    revenue_trends: List[RevenueTrend]
    recent_activities: List[RecentActivity]
    institution_performance: List[InstitutionPerformanceComparison]
    quick_actions: QuickActionStats

    class Config:
        from_attributes = True


class InstitutionListItem(BaseModel):
    id: int
    name: str
    slug: str
    domain: Optional[str]
    is_active: bool
    max_users: Optional[int]
    created_at: datetime
    subscription_status: Optional[str]
    subscription_plan: Optional[str]
    total_users: int
    active_users: int
    total_revenue: float

    class Config:
        from_attributes = True


class InstitutionListResponse(BaseModel):
    items: List[InstitutionListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminUserCreate(BaseModel):
    email: EmailStr = Field(..., description="Admin user email")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8)


class SubscriptionPlanCreate(BaseModel):
    plan_name: str = Field(..., description="Plan name (e.g., Basic, Pro, Enterprise)")
    billing_cycle: str = Field(..., description="Billing cycle: monthly, quarterly, yearly")
    price: float = Field(..., gt=0, description="Subscription price")
    max_users: Optional[int] = Field(None, description="Maximum number of users allowed")
    max_storage_gb: Optional[int] = Field(None, description="Maximum storage in GB")
    features: Optional[str] = Field(None, description="JSON string of features")
    trial_days: Optional[int] = Field(None, description="Number of trial days")


class InstitutionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    max_users: Optional[int] = None
    admin_user: AdminUserCreate
    subscription: Optional[SubscriptionPlanCreate] = None


class InstitutionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = None


class SubscriptionUpdate(BaseModel):
    plan_name: Optional[str] = None
    billing_cycle: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    max_users: Optional[int] = None
    max_storage_gb: Optional[int] = None
    features: Optional[str] = None
    auto_renew: Optional[bool] = None


class BillingHistoryItem(BaseModel):
    id: int
    invoice_number: Optional[str] = None
    payment_id: Optional[int] = None
    amount: float
    status: str
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UsageMetric(BaseModel):
    metric_name: str
    current_value: float
    limit: Optional[float] = None
    percentage_used: Optional[float] = None
    period_start: datetime
    period_end: datetime


class InstitutionAnalytics(BaseModel):
    institution_id: int
    institution_name: str
    user_metrics: dict
    engagement_metrics: dict
    usage_trends: List[dict]
    revenue_metrics: dict


class InstitutionMetrics(BaseModel):
    institution_id: int = Field(..., description="Institution ID")
    institution_name: str = Field(..., description="Institution name")
    region: str = Field(..., description="Geographic region")
    subscription_plan: str = Field(..., description="Subscription plan name")
    institution_size: str = Field(..., description="Institution size category (small, medium, large)")
    total_students: int = Field(..., description="Total number of students")
    total_teachers: int = Field(..., description="Total number of teachers")
    average_attendance: float = Field(..., description="Average attendance rate percentage")
    exam_pass_rate: float = Field(..., description="Exam pass rate percentage")
    average_exam_score: float = Field(..., description="Average exam score percentage")
    student_engagement_score: float = Field(..., description="Student engagement score (0-100)")
    teacher_effectiveness_score: float = Field(..., description="Teacher effectiveness score (0-100)")
    assignment_completion_rate: float = Field(..., description="Assignment completion rate percentage")
    average_grading_time_days: float = Field(..., description="Average time to grade assignments in days")


class InstitutionBenchmark(BaseModel):
    average_attendance: float = Field(..., description="Average attendance across all institutions")
    median_attendance: float = Field(..., description="Median attendance")
    percentile_75_attendance: float = Field(..., description="75th percentile attendance")
    percentile_90_attendance: float = Field(..., description="90th percentile attendance")
    average_exam_pass_rate: float = Field(..., description="Average exam pass rate")
    median_exam_pass_rate: float = Field(..., description="Median exam pass rate")
    percentile_75_exam_pass_rate: float = Field(..., description="75th percentile exam pass rate")
    percentile_90_exam_pass_rate: float = Field(..., description="90th percentile exam pass rate")
    average_engagement_score: float = Field(..., description="Average engagement score")
    median_engagement_score: float = Field(..., description="Median engagement score")
    percentile_75_engagement_score: float = Field(..., description="75th percentile engagement")
    percentile_90_engagement_score: float = Field(..., description="90th percentile engagement")
    average_teacher_effectiveness: float = Field(..., description="Average teacher effectiveness")
    median_teacher_effectiveness: float = Field(..., description="Median teacher effectiveness")
    percentile_75_teacher_effectiveness: float = Field(..., description="75th percentile teacher effectiveness")
    percentile_90_teacher_effectiveness: float = Field(..., description="90th percentile teacher effectiveness")


class InstitutionRanking(BaseModel):
    institution_id: int = Field(..., description="Institution ID")
    institution_name: str = Field(..., description="Institution name")
    composite_score: float = Field(..., description="Composite performance score")
    attendance_rank: int = Field(..., description="Rank by attendance")
    exam_performance_rank: int = Field(..., description="Rank by exam performance")
    engagement_rank: int = Field(..., description="Rank by engagement")
    teacher_effectiveness_rank: int = Field(..., description="Rank by teacher effectiveness")
    overall_rank: int = Field(..., description="Overall rank")
    percentile: float = Field(..., description="Percentile placement (0-100)")


class PerformanceMetricTrend(BaseModel):
    period: str = Field(..., description="Time period (e.g., '2024-01')")
    average_attendance: float = Field(..., description="Average attendance for period")
    average_exam_pass_rate: float = Field(..., description="Average exam pass rate for period")
    average_engagement_score: float = Field(..., description="Average engagement score for period")
    institution_count: int = Field(..., description="Number of institutions in analysis")


class TrendAnalysis(BaseModel):
    monthly_trends: List[PerformanceMetricTrend] = Field(..., description="Monthly trend data")
    attendance_trend_percentage: float = Field(..., description="Attendance trend change percentage")
    exam_performance_trend_percentage: float = Field(..., description="Exam performance trend change percentage")
    engagement_trend_percentage: float = Field(..., description="Engagement trend change percentage")
    improving_institutions: int = Field(..., description="Number of institutions showing improvement")
    declining_institutions: int = Field(..., description="Number of institutions showing decline")


class AnomalyDetection(BaseModel):
    institution_id: int = Field(..., description="Institution ID")
    institution_name: str = Field(..., description="Institution name")
    metric_name: str = Field(..., description="Name of the metric with anomaly")
    expected_value: float = Field(..., description="Expected value based on benchmarks")
    actual_value: float = Field(..., description="Actual value observed")
    deviation_percentage: float = Field(..., description="Deviation from expected as percentage")
    severity: str = Field(..., description="Severity level (low, medium, high)")
    description: str = Field(..., description="Description of the anomaly")


class BestPractice(BaseModel):
    category: str = Field(..., description="Category (attendance, exam_performance, engagement, teacher_effectiveness)")
    institution_id: int = Field(..., description="Institution ID")
    institution_name: str = Field(..., description="Institution name")
    metric_value: float = Field(..., description="Performance metric value")
    description: str = Field(..., description="Description of the best practice")
    recommendation: str = Field(..., description="Recommendation for other institutions")
    impact_level: str = Field(..., description="Impact level (low, medium, high)")


class CohortAnalysisData(BaseModel):
    by_plan: List[dict] = Field(..., description="Analysis grouped by subscription plan")
    by_size: List[dict] = Field(..., description="Analysis grouped by institution size")
    by_region: List[dict] = Field(..., description="Analysis grouped by region")


class CrossInstitutionAnalyticsResponse(BaseModel):
    institution_metrics: List[InstitutionMetrics] = Field(..., description="Metrics for all institutions")
    benchmarks: InstitutionBenchmark = Field(..., description="Benchmark statistics")
    rankings: List[InstitutionRanking] = Field(..., description="Institution rankings")
    trends: TrendAnalysis = Field(..., description="Trend analysis")
    anomalies: List[AnomalyDetection] = Field(..., description="Detected anomalies")
    best_practices: List[BestPractice] = Field(..., description="Identified best practices")
    cohort_analysis: CohortAnalysisData = Field(..., description="Cohort analysis data")
    generated_at: datetime = Field(..., description="Timestamp of report generation")
    period_start: datetime = Field(..., description="Analysis period start")
    period_end: datetime = Field(..., description="Analysis period end")
    
    class Config:
        from_attributes = True


class ImpersonateUserRequest(BaseModel):
    user_id: int = Field(..., description="User ID to impersonate")
    reason: str = Field(..., min_length=10, max_length=500, description="Reason for impersonation")
    duration_minutes: Optional[int] = Field(60, ge=1, le=480, description="Duration in minutes (max 8 hours)")


class ImpersonateUserResponse(BaseModel):
    access_token: str = Field(..., description="Temporary access token")
    user_id: int = Field(..., description="Impersonated user ID")
    user_email: str = Field(..., description="Impersonated user email")
    user_name: str = Field(..., description="Impersonated user name")
    institution_id: int = Field(..., description="Institution ID")
    institution_name: str = Field(..., description="Institution name")
    role: str = Field(..., description="User role")
    expires_at: datetime = Field(..., description="Token expiration time")
    impersonation_log_id: int = Field(..., description="Impersonation log record ID")


class EndImpersonationRequest(BaseModel):
    impersonation_log_id: int = Field(..., description="Impersonation log record ID")


class ActivityLogItem(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    institution_id: Optional[int]
    activity_type: str
    activity_category: str
    endpoint: Optional[str]
    method: Optional[str]
    status_code: Optional[int]
    description: Optional[str]
    error_message: Optional[str]
    ip_address: Optional[str]
    duration_ms: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActivityLogFilters(BaseModel):
    user_id: Optional[int] = None
    institution_id: Optional[int] = None
    activity_category: Optional[str] = None
    activity_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    has_errors: Optional[bool] = None


class ActivityLogResponse(BaseModel):
    items: List[ActivityLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class SessionReplayEvent(BaseModel):
    timestamp: datetime
    event_type: str
    data: dict


class SessionReplayItem(BaseModel):
    id: int
    session_id: str
    user_id: Optional[int]
    user_email: Optional[str]
    institution_id: Optional[int]
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    page_count: int
    interaction_count: int
    error_count: int
    ip_address: Optional[str]
    
    class Config:
        from_attributes = True


class SessionReplayDetail(SessionReplayItem):
    events: List[dict]
    metadata: Optional[dict]


class SessionReplayFilters(BaseModel):
    user_id: Optional[int] = None
    institution_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    has_errors: Optional[bool] = None


class SessionReplayResponse(BaseModel):
    items: List[SessionReplayItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ExecuteSQLQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=5000, description="SQL query to execute (read-only)")
    limit: Optional[int] = Field(100, ge=1, le=1000, description="Maximum number of rows to return")


class ExecuteSQLQueryResponse(BaseModel):
    columns: List[str] = Field(..., description="Column names")
    rows: List[List[Any]] = Field(..., description="Query result rows")
    row_count: int = Field(..., description="Number of rows returned")
    execution_time_ms: float = Field(..., description="Query execution time in milliseconds")
    query: str = Field(..., description="Executed query")


class ImpersonationLogItem(BaseModel):
    id: int
    super_admin_id: Optional[int]
    super_admin_email: Optional[str]
    impersonated_user_id: Optional[int]
    impersonated_user_email: Optional[str]
    institution_id: Optional[int]
    institution_name: Optional[str]
    reason: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    is_active: bool
    duration_minutes: Optional[int]
    
    class Config:
        from_attributes = True


class ImpersonationLogResponse(BaseModel):
    items: List[ImpersonationLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class RecordSessionReplayRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    events: List[dict] = Field(..., description="Session events")
    metadata: Optional[dict] = Field(None, description="Additional metadata")
    started_at: datetime = Field(..., description="Session start time")
    ended_at: Optional[datetime] = Field(None, description="Session end time")
