from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class TeacherBase(BaseModel):
    employee_id: Optional[str] = Field(None, max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    qualification: Optional[str] = Field(None, max_length=255)
    specialization: Optional[str] = Field(None, max_length=255)
    joining_date: Optional[date] = None
    is_active: bool = True


class TeacherCreate(TeacherBase):
    institution_id: int
    user_id: Optional[int] = None


class TeacherUpdate(BaseModel):
    employee_id: Optional[str] = Field(None, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    qualification: Optional[str] = Field(None, max_length=255)
    specialization: Optional[str] = Field(None, max_length=255)
    joining_date: Optional[date] = None
    is_active: Optional[bool] = None


class TeacherResponse(TeacherBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class TeacherSubjectBase(BaseModel):
    teacher_id: int
    subject_id: int
    is_primary: bool = False


class TeacherSubjectCreate(TeacherSubjectBase):
    institution_id: int


class TeacherSubjectResponse(TeacherSubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime


class TeacherBulkImportRow(BaseModel):
    employee_id: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    joining_date: Optional[str] = None


class BulkImportResult(BaseModel):
    total: int
    success: int
    failed: int
    errors: List[dict] = []


class MyClassOverview(BaseModel):
    class_id: int
    class_name: str
    section: str
    subject: str
    student_count: int
    average_score: float
    room_number: Optional[str] = None


class TodaysSchedule(BaseModel):
    id: int
    time_slot: str
    start_time: str
    end_time: str
    class_name: str
    section: str
    subject: str
    room_number: Optional[str] = None
    status: str


class PendingAssignment(BaseModel):
    id: int
    title: str
    class_name: str
    section: str
    subject: str
    submission_count: int
    due_date: datetime
    priority: str


class PendingGrading(BaseModel):
    total_count: int
    assignments: List[PendingAssignment]


class RecentSubmission(BaseModel):
    id: int
    student_name: str
    student_photo: Optional[str] = None
    assignment_title: str
    class_name: str
    section: str
    submitted_at: datetime
    status: str
    score: Optional[float] = None


class ClassPerformance(BaseModel):
    class_name: str
    section: str
    subject: str
    average_score: float
    attendance_rate: float
    student_count: int


class UpcomingExam(BaseModel):
    id: int
    exam_name: str
    exam_type: str
    class_name: str
    section: str
    subject: str
    date: datetime
    duration_minutes: int
    total_marks: int


class DashboardStatistics(BaseModel):
    total_students: int
    pending_grading_count: int
    todays_classes: int
    this_week_attendance: float


class TeacherMyDashboardResponse(BaseModel):
    teacher_id: int
    teacher_name: str
    my_classes: List[MyClassOverview]
    todays_schedule: List[TodaysSchedule]
    pending_grading: PendingGrading
    recent_submissions: List[RecentSubmission]
    class_performance: List[ClassPerformance]
    upcoming_exams: List[UpcomingExam]
    statistics: DashboardStatistics
