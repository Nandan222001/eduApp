from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class CollegeVisitBase(BaseModel):
    college_name: str = Field(..., max_length=255)
    visit_date: date
    visit_type: str
    notes: Optional[str] = None
    photos: Optional[List[Dict[str, Any]]] = None
    rating: Optional[int] = Field(None, ge=1, le=10)
    impression_score: Optional[Decimal] = Field(None, ge=0, le=100)
    pros_cons: Optional[Dict[str, List[str]]] = None
    follow_up_actions: Optional[List[Dict[str, Any]]] = None


class CollegeVisitCreate(CollegeVisitBase):
    student_id: int
    institution_id: int


class CollegeVisitUpdate(BaseModel):
    college_name: Optional[str] = Field(None, max_length=255)
    visit_date: Optional[date] = None
    visit_type: Optional[str] = None
    notes: Optional[str] = None
    photos: Optional[List[Dict[str, Any]]] = None
    rating: Optional[int] = Field(None, ge=1, le=10)
    impression_score: Optional[Decimal] = Field(None, ge=0, le=100)
    pros_cons: Optional[Dict[str, List[str]]] = None
    follow_up_actions: Optional[List[Dict[str, Any]]] = None


class CollegeVisitResponse(CollegeVisitBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CollegeApplicationBase(BaseModel):
    college_name: str = Field(..., max_length=255)
    application_type: str
    deadline: date
    application_portal_url: Optional[str] = Field(None, max_length=500)
    application_status: str = "not_started"
    decision_outcome: Optional[str] = None
    financial_aid_offered: Optional[Decimal] = None
    scholarship_amount: Optional[Decimal] = None
    deposit_deadline: Optional[date] = None
    common_app_essay: bool = False
    supplemental_essays: Optional[List[Dict[str, Any]]] = None
    recommendation_letters: Optional[List[Dict[str, Any]]] = None
    test_scores: Optional[Dict[str, Any]] = None
    transcript_requested: bool = False
    notes: Optional[str] = None


class CollegeApplicationCreate(CollegeApplicationBase):
    student_id: int
    institution_id: int


class CollegeApplicationUpdate(BaseModel):
    college_name: Optional[str] = Field(None, max_length=255)
    application_type: Optional[str] = None
    deadline: Optional[date] = None
    application_portal_url: Optional[str] = Field(None, max_length=500)
    application_status: Optional[str] = None
    decision_outcome: Optional[str] = None
    financial_aid_offered: Optional[Decimal] = None
    scholarship_amount: Optional[Decimal] = None
    deposit_deadline: Optional[date] = None
    common_app_essay: Optional[bool] = None
    supplemental_essays: Optional[List[Dict[str, Any]]] = None
    recommendation_letters: Optional[List[Dict[str, Any]]] = None
    test_scores: Optional[Dict[str, Any]] = None
    transcript_requested: Optional[bool] = None
    notes: Optional[str] = None


class CollegeApplicationResponse(CollegeApplicationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ApplicationChecklistUpdate(BaseModel):
    common_app_essay: Optional[bool] = None
    supplemental_essays: Optional[List[Dict[str, Any]]] = None
    recommendation_letters: Optional[List[Dict[str, Any]]] = None
    test_scores: Optional[Dict[str, Any]] = None
    transcript_requested: Optional[bool] = None


class DecisionNotificationRequest(BaseModel):
    application_id: int
    decision_outcome: str
    financial_aid_offered: Optional[Decimal] = None
    scholarship_amount: Optional[Decimal] = None
    deposit_deadline: Optional[date] = None


class CounselorCollaborationRequest(BaseModel):
    student_id: int
    counselor_user_id: int
    message: str
    application_id: Optional[int] = None
