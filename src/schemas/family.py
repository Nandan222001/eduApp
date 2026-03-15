from datetime import datetime, date
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class FamilyGroupBase(BaseModel):
    name: Optional[str] = None


class FamilyGroupCreate(FamilyGroupBase):
    institution_id: int
    parent_id: int


class FamilyGroupMemberCreate(BaseModel):
    student_id: int
    display_color: Optional[str] = None


class FamilyGroupMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    student_id: int
    display_color: Optional[str]
    added_at: datetime


class FamilyGroupResponse(FamilyGroupBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ChildOverview(BaseModel):
    student_id: int
    student_name: str
    grade: str
    section: Optional[str]
    display_color: Optional[str]
    attendance_percentage: Optional[Decimal]
    average_grade: Optional[Decimal]
    pending_assignments: int
    upcoming_exams: int


class FamilyDashboardResponse(BaseModel):
    family_group: FamilyGroupResponse
    children: List[ChildOverview]
    upcoming_events_count: int
    total_pending_assignments: int
    total_upcoming_exams: int
    unread_notifications: int
    outstanding_fees: Decimal
    recent_updates: List[Dict[str, Any]]


class FamilyCalendarEventBase(BaseModel):
    event_type: str
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class FamilyCalendarEventCreate(FamilyCalendarEventBase):
    family_group_id: int
    student_id: int
    event_id: Optional[int] = None


class FamilyCalendarEventResponse(FamilyCalendarEventBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    family_group_id: int
    student_id: int
    student_name: Optional[str] = None
    student_color: Optional[str] = None
    event_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class FamilyCalendarResponse(BaseModel):
    month: int
    year: int
    events: List[FamilyCalendarEventResponse]
    children_colors: Dict[int, str]


class SiblingComparisonMetric(BaseModel):
    student_id: int
    student_name: str
    value: Decimal
    rank: Optional[int] = None
    trend: Optional[str] = None


class SiblingComparisonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    family_group_id: int
    metric_type: str
    period_start: date
    period_end: date
    comparison_data: Dict[str, Any]
    insights: Optional[Dict[str, Any]]
    privacy_level: str
    generated_at: datetime


class PerformanceComparisonResponse(BaseModel):
    metric_type: str
    period: str
    students: List[SiblingComparisonMetric]
    average: Optional[Decimal]
    insights: List[str]


class AttendanceComparisonResponse(BaseModel):
    students: List[Dict[str, Any]]
    period_start: date
    period_end: date
    family_average: Decimal


class BehaviorComparisonResponse(BaseModel):
    students: List[Dict[str, Any]]
    period_start: date
    period_end: date
    metrics: List[str]


class FamilyNotificationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    student_id: int
    student_name: Optional[str] = None
    notification_type: str
    title: str
    message: str
    priority: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime


class FamilyNotificationBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    family_group_id: int
    batch_date: date
    notification_count: int
    summary: Dict[str, Any]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    items: List[FamilyNotificationItemResponse]


class SharedExpenseBase(BaseModel):
    expense_type: str
    title: str
    description: Optional[str] = None
    total_amount: Decimal = Field(..., ge=0)
    split_type: str = "equal"
    due_date: Optional[date] = None


class SharedExpenseCreate(SharedExpenseBase):
    institution_id: int
    family_group_id: int
    student_ids: List[int]
    custom_splits: Optional[Dict[int, Decimal]] = None


class ExpenseSplitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    student_id: int
    student_name: Optional[str] = None
    amount: Decimal
    weight: Optional[Decimal]
    is_paid: bool
    paid_at: Optional[datetime]


class SharedExpenseResponse(SharedExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    family_group_id: int
    is_paid: bool
    paid_at: Optional[datetime]
    payment_method: Optional[str]
    transaction_id: Optional[str]
    receipt_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    splits: List[ExpenseSplitResponse]


class BulkPaymentRequest(BaseModel):
    expense_ids: List[int]
    payment_method: str
    transaction_id: Optional[str] = None


class BulkPaymentResponse(BaseModel):
    total_amount: Decimal
    paid_expenses: int
    failed_expenses: List[int]
    receipt_urls: List[str]


class BulkDownloadRequest(BaseModel):
    student_ids: List[int]
    document_type: str
    academic_year_id: Optional[int] = None


class BulkDownloadResponse(BaseModel):
    download_url: str
    file_count: int
    expires_at: datetime


class BulkRSVPRequest(BaseModel):
    event_ids: List[int]
    student_ids: List[int]
    rsvp_status: str


class BulkRSVPResponse(BaseModel):
    updated_count: int
    failed_events: List[int]
    confirmations: List[Dict[str, Any]]


class SiblingSelector(BaseModel):
    student_id: int
    selected: bool


class ChildDataToggleRequest(BaseModel):
    student_ids: List[int]


class ChildDataToggleResponse(BaseModel):
    active_students: List[int]
    data_summary: Dict[int, Dict[str, Any]]
