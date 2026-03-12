from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from src.models.library import BookStatus, IssueStatus


class BookCategoryBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    code: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class BookCategoryCreate(BookCategoryBase):
    institution_id: int


class BookCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    code: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class BookCategoryResponse(BookCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class BookBase(BaseModel):
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=255)
    isbn: Optional[str] = Field(None, max_length=50)
    publisher: Optional[str] = Field(None, max_length=255)
    publication_year: Optional[int] = None
    edition: Optional[str] = Field(None, max_length=100)
    accession_number: str = Field(..., max_length=100)
    call_number: Optional[str] = Field(None, max_length=100)
    total_copies: int = Field(default=1, ge=1)
    description: Optional[str] = None
    language: Optional[str] = Field(None, max_length=50)
    pages: Optional[int] = Field(None, ge=0)
    price: Optional[Decimal] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    rack_number: Optional[str] = Field(None, max_length=50)
    is_reference_only: bool = False
    is_active: bool = True
    cover_image_url: Optional[str] = None


class BookCreate(BookBase):
    institution_id: int
    category_id: Optional[int] = None


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=255)
    isbn: Optional[str] = Field(None, max_length=50)
    publisher: Optional[str] = Field(None, max_length=255)
    publication_year: Optional[int] = None
    edition: Optional[str] = Field(None, max_length=100)
    call_number: Optional[str] = Field(None, max_length=100)
    category_id: Optional[int] = None
    total_copies: Optional[int] = Field(None, ge=1)
    description: Optional[str] = None
    language: Optional[str] = Field(None, max_length=50)
    pages: Optional[int] = Field(None, ge=0)
    price: Optional[Decimal] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    rack_number: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = None
    is_reference_only: Optional[bool] = None
    is_active: Optional[bool] = None
    cover_image_url: Optional[str] = None


class BookResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    category_id: Optional[int] = None
    available_copies: int
    status: str
    created_at: datetime
    updated_at: datetime


class BookIssueBase(BaseModel):
    issue_date: date
    due_date: date
    remarks: Optional[str] = None


class BookIssueCreate(BookIssueBase):
    institution_id: int
    book_id: int
    student_id: int


class BookReturnInput(BaseModel):
    return_date: date
    fine_paid: bool = False
    remarks: Optional[str] = None


class BookIssueUpdate(BaseModel):
    due_date: Optional[date] = None
    return_date: Optional[date] = None
    status: Optional[str] = None
    fine_amount: Optional[Decimal] = Field(None, ge=0)
    fine_paid: Optional[bool] = None
    fine_payment_date: Optional[date] = None
    remarks: Optional[str] = None


class BookIssueResponse(BookIssueBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    book_id: int
    student_id: int
    return_date: Optional[date] = None
    status: str
    fine_amount: Decimal
    fine_paid: bool
    fine_payment_date: Optional[date] = None
    issued_by: Optional[int] = None
    returned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class BookIssueWithDetails(BookIssueResponse):
    book_title: str
    book_author: Optional[str] = None
    student_name: str
    student_roll_number: Optional[str] = None
    days_overdue: int = 0


class LibrarySettingsBase(BaseModel):
    max_books_per_student: int = Field(default=3, ge=1)
    issue_duration_days: int = Field(default=14, ge=1)
    fine_per_day: Decimal = Field(default=Decimal("1.00"), ge=0)
    max_fine_amount: Optional[Decimal] = Field(None, ge=0)
    allow_renewals: bool = True
    max_renewals: int = Field(default=2, ge=0)
    working_days: str = "mon,tue,wed,thu,fri"


class LibrarySettingsCreate(LibrarySettingsBase):
    institution_id: int


class LibrarySettingsUpdate(BaseModel):
    max_books_per_student: Optional[int] = Field(None, ge=1)
    issue_duration_days: Optional[int] = Field(None, ge=1)
    fine_per_day: Optional[Decimal] = Field(None, ge=0)
    max_fine_amount: Optional[Decimal] = Field(None, ge=0)
    allow_renewals: Optional[bool] = None
    max_renewals: Optional[int] = Field(None, ge=0)
    working_days: Optional[str] = None


class LibrarySettingsResponse(LibrarySettingsBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    created_at: datetime
    updated_at: datetime


class OverdueBookReport(BaseModel):
    issue_id: int
    student_id: int
    student_name: str
    book_title: str
    issue_date: date
    due_date: date
    days_overdue: int
    fine_amount: Decimal
