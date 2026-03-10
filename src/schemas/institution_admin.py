from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field


class InstitutionOverview(BaseModel):
    student_count: int = Field(..., description="Total number of active students")
    teacher_count: int = Field(..., description="Total number of active teachers")
    total_users: int = Field(..., description="Total users (students + teachers)")


class TodayAttendanceSummary(BaseModel):
    date: date = Field(..., description="Date of attendance")
    total_students: int = Field(..., description="Total students marked")
    present: int = Field(..., description="Students present")
    absent: int = Field(..., description="Students absent")
    late: int = Field(..., description="Students late")
    percentage: float = Field(..., description="Attendance percentage")


class RecentExamResult(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: str
    date: date
    total_students: int
    passed_students: int
    average_percentage: float


class UpcomingEvent(BaseModel):
    id: int
    title: str
    event_type: str = Field(..., description="Type of event: exam, assignment, etc.")
    date: date
    description: str


class PendingTask(BaseModel):
    id: str
    task_type: str = Field(..., description="Type of task: grading, attendance, exam_results")
    title: str
    description: str
    count: int = Field(..., description="Number of items pending")
    priority: str = Field(..., description="Priority level: low, medium, high")
    due_date: Optional[date] = None


class PerformanceTrend(BaseModel):
    month: str = Field(..., description="Month name and year")
    average_score: float = Field(..., description="Average exam score")
    attendance_rate: float = Field(..., description="Average attendance rate")
    student_count: int = Field(..., description="Number of students")


class QuickStatistic(BaseModel):
    label: str
    value: str
    trend: Optional[str] = Field(None, description="Trend indicator: up, down, or None")
    icon: str = Field(..., description="Icon identifier")


class DashboardResponse(BaseModel):
    overview: InstitutionOverview
    attendance_summary: TodayAttendanceSummary
    recent_exam_results: List[RecentExamResult]
    upcoming_events: List[UpcomingEvent]
    pending_tasks: List[PendingTask]
    performance_trends: List[PerformanceTrend]
    quick_statistics: List[QuickStatistic]
