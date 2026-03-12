from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from src.models.fee import FeeCategory, PaymentMethod, PaymentStatus


class FeeStructureBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: str
    amount: Decimal = Field(..., ge=0)
    is_mandatory: bool = True
    is_recurring: bool = False
    recurrence_period: Optional[str] = None
    due_date: Optional[date] = None
    late_fee_applicable: bool = False
    late_fee_amount: Optional[Decimal] = Field(None, ge=0)
    late_fee_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    is_active: bool = True


class FeeStructureCreate(FeeStructureBase):
    institution_id: int
    academic_year_id: int
    grade_id: int


class FeeStructureUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    is_mandatory: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_period: Optional[str] = None
    due_date: Optional[date] = None
    late_fee_applicable: Optional[bool] = None
    late_fee_amount: Optional[Decimal] = Field(None, ge=0)
    late_fee_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None


class FeeStructureResponse(FeeStructureBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    academic_year_id: int
    grade_id: int
    created_at: datetime
    updated_at: datetime


class FeePaymentBase(BaseModel):
    payment_date: date
    amount_paid: Decimal = Field(..., ge=0)
    late_fee: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_method: str
    transaction_id: Optional[str] = None
    remarks: Optional[str] = None


class FeePaymentCreate(FeePaymentBase):
    institution_id: int
    student_id: int
    fee_structure_id: int


class FeePaymentUpdate(BaseModel):
    payment_date: Optional[date] = None
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    late_fee: Optional[Decimal] = Field(None, ge=0)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    transaction_id: Optional[str] = None
    remarks: Optional[str] = None


class FeePaymentResponse(FeePaymentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    fee_structure_id: int
    receipt_number: str
    total_amount: Decimal
    payment_status: str
    collected_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class FeeWaiverBase(BaseModel):
    waiver_percentage: Decimal = Field(..., ge=0, le=100)
    waiver_amount: Decimal = Field(..., ge=0)
    reason: str
    valid_from: date
    valid_until: Optional[date] = None
    is_active: bool = True


class FeeWaiverCreate(FeeWaiverBase):
    institution_id: int
    student_id: int
    fee_structure_id: int


class FeeWaiverUpdate(BaseModel):
    waiver_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    waiver_amount: Optional[Decimal] = Field(None, ge=0)
    reason: Optional[str] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_active: Optional[bool] = None


class FeeWaiverResponse(FeeWaiverBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    student_id: int
    fee_structure_id: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class StudentOutstandingDues(BaseModel):
    student_id: int
    student_name: str
    grade_name: str
    total_fees: Decimal
    amount_paid: Decimal
    outstanding_amount: Decimal
    overdue_amount: Decimal


class FeeReceiptData(BaseModel):
    receipt_number: str
    payment_date: date
    student_name: str
    grade_name: str
    fee_structure_name: str
    amount_paid: Decimal
    late_fee: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    payment_method: str
    collected_by_name: Optional[str] = None
