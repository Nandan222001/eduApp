from datetime import datetime, date, date as date_type
from typing import Optional, List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, validator
from src.models.volunteer_hours import ActivityType, VerificationStatus, BadgeTier


class VolunteerHourLogBase(BaseModel):
    activity_name: str = Field(..., max_length=255)
    activity_type: ActivityType
    date: date
    hours_logged: Decimal = Field(..., ge=0, le=24)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    supervisor_teacher_id: Optional[int] = None
    attachments: Optional[List[Dict[str, str]]] = None


class VolunteerHourLogCreate(VolunteerHourLogBase):
    academic_year_id: int


class VolunteerHourLogUpdate(BaseModel):
    activity_name: Optional[str] = Field(None, max_length=255)
    activity_type: Optional[ActivityType] = None
    # Aliased import: see the identical comment in
    # src/schemas/community_service.py's ServiceActivityUpdate for why a
    # field literally named `date` needs Optional[date_type] here, not
    # Optional[date] -- the latter resolves to NoneType under pydantic v2.
    date: Optional[date_type] = None
    hours_logged: Optional[Decimal] = Field(None, ge=0, le=24)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    supervisor_teacher_id: Optional[int] = None
    attachments: Optional[List[Dict[str, str]]] = None


class VolunteerHourLogResponse(VolunteerHourLogBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    academic_year_id: int
    verification_status: VerificationStatus
    verification_notes: Optional[str]
    verified_at: Optional[datetime]
    verified_by: Optional[int]
    # The ORM attribute is `metadata_json` (SQLAlchemy reserves `metadata` on
    # declarative model instances for its own MetaData object), so reading
    # this field via from_attributes must pull from `metadata_json` while
    # still round-tripping over the wire as `metadata`.
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias='metadata_json', serialization_alias='metadata')
    created_at: datetime
    updated_at: datetime
    parent_name: Optional[str] = None
    supervisor_name: Optional[str] = None
    verifier_name: Optional[str] = None


class VerificationRequest(BaseModel):
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None


class BulkVerificationRequest(BaseModel):
    log_ids: List[int]
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None


class VolunteerHourSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    academic_year_id: int
    total_hours: Decimal
    approved_hours: Decimal
    pending_hours: Decimal
    rejected_hours: Decimal
    classroom_help_hours: Decimal
    event_support_hours: Decimal
    fundraising_hours: Decimal
    field_trip_hours: Decimal
    committee_work_hours: Decimal
    current_rank: Optional[int]
    last_activity_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    parent_name: Optional[str] = None
    academic_year_name: Optional[str] = None


class ActivityTypeBreakdown(BaseModel):
    activity_type: str
    hours: Decimal
    percentage: Decimal


class HoursByMonth(BaseModel):
    month: int
    year: int
    hours: Decimal
    log_count: int


class ParentHoursReport(BaseModel):
    parent_id: int
    parent_name: str
    academic_year_id: int
    academic_year_name: str
    total_hours: Decimal
    approved_hours: Decimal
    pending_hours: Decimal
    rejected_hours: Decimal
    activity_breakdown: List[ActivityTypeBreakdown]
    monthly_breakdown: List[HoursByMonth]
    current_rank: Optional[int]
    total_parents: int
    percentile: Optional[Decimal]
    badges_earned: List[str]
    recent_logs: List[VolunteerHourLogResponse]


class GradeHoursReport(BaseModel):
    grade_id: int
    grade_name: str
    academic_year_id: int
    academic_year_name: str
    total_parents: int
    total_hours: Decimal
    average_hours_per_parent: Decimal
    top_contributors: List[Dict[str, Any]]
    activity_breakdown: List[ActivityTypeBreakdown]


class SchoolWideReport(BaseModel):
    institution_id: int
    academic_year_id: int
    academic_year_name: str
    total_parents: int
    active_parents: int
    total_hours: Decimal
    approved_hours: Decimal
    pending_hours: Decimal
    average_hours_per_parent: Decimal
    activity_breakdown: List[ActivityTypeBreakdown]
    grade_breakdown: List[GradeHoursReport]
    monthly_trends: List[HoursByMonth]
    top_contributors: List[Dict[str, Any]]


class VolunteerBadgeBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    badge_tier: BadgeTier
    hours_required: Decimal = Field(..., ge=0)
    icon_url: Optional[str] = Field(None, max_length=500)
    color_code: Optional[str] = Field(None, max_length=7)


class VolunteerBadgeCreate(VolunteerBadgeBase):
    institution_id: int


class VolunteerBadgeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    badge_tier: Optional[BadgeTier] = None
    hours_required: Optional[Decimal] = Field(None, ge=0)
    icon_url: Optional[str] = Field(None, max_length=500)
    color_code: Optional[str] = Field(None, max_length=7)
    is_active: Optional[bool] = None


class VolunteerBadgeResponse(VolunteerBadgeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ParentVolunteerBadgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    badge_id: int
    academic_year_id: int
    earned_at: datetime
    hours_at_earning: Decimal
    # See VolunteerHourLogResponse.metadata for why this needs an alias.
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias='metadata_json', serialization_alias='metadata')
    created_at: datetime
    badge_name: Optional[str] = None
    badge_tier: Optional[str] = None
    badge_icon_url: Optional[str] = None


class LeaderboardEntryResponse(BaseModel):
    rank: int
    parent_id: int
    parent_name: str
    total_hours: Decimal
    previous_rank: Optional[int]
    rank_change: Optional[int]
    percentile: Optional[Decimal]
    badges_count: int
    recent_activity: Optional[str]


class LeaderboardResponse(BaseModel):
    academic_year_id: int
    academic_year_name: str
    scope: str
    grade_id: Optional[int]
    grade_name: Optional[str]
    total_entries: int
    entries: List[LeaderboardEntryResponse]
    user_entry: Optional[LeaderboardEntryResponse]


class VolunteerCertificateBase(BaseModel):
    is_tax_deductible: bool = False
    tax_year: Optional[int] = None
    notes: Optional[str] = None


class VolunteerCertificateCreate(VolunteerCertificateBase):
    parent_id: int
    academic_year_id: int
    signed_by: Optional[int] = None


class VolunteerCertificateResponse(VolunteerCertificateBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    academic_year_id: int
    certificate_number: str
    total_hours: Decimal
    issue_date: date
    certificate_url: Optional[str]
    pdf_path: Optional[str]
    signed_by: Optional[int]
    # See VolunteerHourLogResponse.metadata for why this needs an alias.
    metadata: Optional[Dict[str, Any]] = Field(None, validation_alias='metadata_json', serialization_alias='metadata')
    created_at: datetime
    updated_at: datetime
    parent_name: Optional[str] = None
    academic_year_name: Optional[str] = None
    signer_name: Optional[str] = None


class CertificateGenerationRequest(BaseModel):
    parent_id: int
    academic_year_id: int
    is_tax_deductible: bool = False
    tax_year: Optional[int] = None
    signed_by: Optional[int] = None
    notes: Optional[str] = None


class BulkCertificateRequest(BaseModel):
    academic_year_id: int
    parent_ids: Optional[List[int]] = None
    minimum_hours: Optional[Decimal] = None
    is_tax_deductible: bool = False
    tax_year: Optional[int] = None
    signed_by: Optional[int] = None


class TaxDeductionExport(BaseModel):
    parent_id: int
    parent_name: str
    parent_email: Optional[str]
    tax_year: int
    total_hours: Decimal
    estimated_value: Decimal
    certificate_number: Optional[str]
    activities: List[Dict[str, Any]]


class ExportRequest(BaseModel):
    academic_year_id: int
    parent_id: Optional[int] = None
    grade_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    format: str = Field("csv", pattern="^(csv|pdf|excel)$")
    include_pending: bool = False


class StatisticsResponse(BaseModel):
    total_logs: int
    total_hours: Decimal
    approved_hours: Decimal
    pending_hours: Decimal
    rejected_hours: Decimal
    unique_parents: int
    average_hours_per_parent: Decimal
    most_common_activity: str
    verification_rate: Decimal
    badge_distribution: Dict[str, int]
