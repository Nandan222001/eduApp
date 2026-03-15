from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from src.models.yearbook import PublicationStatus, YearbookSection, SubmissionStatus


class YearbookEditionBase(BaseModel):
    academic_year: str = Field(..., max_length=20)
    theme: Optional[str] = Field(None, max_length=255)
    cover_design_url: Optional[str] = Field(None, max_length=500)
    dedication_text: Optional[str] = None
    editor_students: Optional[List[int]] = None
    publication_status: str = PublicationStatus.DRAFT.value
    digital_flip_book_url: Optional[str] = Field(None, max_length=500)
    pdf_url: Optional[str] = Field(None, max_length=500)
    is_public: bool = False


class YearbookEditionCreate(YearbookEditionBase):
    institution_id: int


class YearbookEditionUpdate(BaseModel):
    theme: Optional[str] = Field(None, max_length=255)
    cover_design_url: Optional[str] = Field(None, max_length=500)
    dedication_text: Optional[str] = None
    editor_students: Optional[List[int]] = None
    publication_status: Optional[str] = None
    digital_flip_book_url: Optional[str] = Field(None, max_length=500)
    pdf_url: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None


class YearbookEditionResponse(YearbookEditionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    print_order_count: int
    published_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class YearbookEditionWithStats(YearbookEditionResponse):
    total_pages: int = 0
    total_signatures: int = 0
    pending_submissions: int = 0
    approved_submissions: int = 0


class PhotoWithCaption(BaseModel):
    photo_url: str
    caption: Optional[str] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None


class TextContentItem(BaseModel):
    text: str
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    font_family: Optional[str] = None
    font_size: Optional[int] = None
    color: Optional[str] = None


class YearbookPageBase(BaseModel):
    page_number: int = Field(..., ge=1)
    section: str
    layout_template: Optional[str] = Field(None, max_length=100)
    photos: Optional[List[Dict[str, Any]]] = None
    text_content: Optional[List[Dict[str, Any]]] = None
    background_color: Optional[str] = Field(None, max_length=20)
    background_image_url: Optional[str] = Field(None, max_length=500)
    is_double_page: bool = False
    is_locked: bool = False


class YearbookPageCreate(YearbookPageBase):
    edition_id: int


class YearbookPageUpdate(BaseModel):
    page_number: Optional[int] = Field(None, ge=1)
    section: Optional[str] = None
    layout_template: Optional[str] = Field(None, max_length=100)
    photos: Optional[List[Dict[str, Any]]] = None
    text_content: Optional[List[Dict[str, Any]]] = None
    background_color: Optional[str] = Field(None, max_length=20)
    background_image_url: Optional[str] = Field(None, max_length=500)
    is_double_page: Optional[bool] = None
    is_locked: Optional[bool] = None


class YearbookPageResponse(YearbookPageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    edition_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class YearbookSignatureBase(BaseModel):
    message: str
    stickers: Optional[List[str]] = None
    emojis: Optional[List[str]] = None
    page_location: Optional[int] = None
    font_style: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    is_public: bool = True


class YearbookSignatureCreate(YearbookSignatureBase):
    edition_id: int
    to_student_id: int


class YearbookSignatureUpdate(BaseModel):
    message: Optional[str] = None
    stickers: Optional[List[str]] = None
    emojis: Optional[List[str]] = None
    page_location: Optional[int] = None
    font_style: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    is_public: Optional[bool] = None


class YearbookSignatureResponse(YearbookSignatureBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    edition_id: int
    from_student_id: int
    to_student_id: int
    created_at: datetime
    updated_at: datetime


class YearbookSignatureWithStudents(YearbookSignatureResponse):
    from_student_name: str
    to_student_name: str
    from_student_photo: Optional[str] = None
    to_student_photo: Optional[str] = None


class YearbookPhotoSubmissionBase(BaseModel):
    photo_url: str = Field(..., max_length=500)
    s3_key: str = Field(..., max_length=500)
    caption: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    suggested_section: Optional[str] = Field(None, max_length=50)


class YearbookPhotoSubmissionCreate(YearbookPhotoSubmissionBase):
    edition_id: int


class YearbookPhotoSubmissionUpdate(BaseModel):
    caption: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    suggested_section: Optional[str] = Field(None, max_length=50)


class YearbookPhotoSubmissionReview(BaseModel):
    status: str
    review_notes: Optional[str] = None
    page_id: Optional[int] = None


class YearbookPhotoSubmissionResponse(YearbookPhotoSubmissionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    edition_id: int
    student_id: int
    status: str
    reviewed_by: Optional[int] = None
    review_notes: Optional[str] = None
    page_id: Optional[int] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None


class YearbookPhotoSubmissionWithStudent(YearbookPhotoSubmissionResponse):
    student_name: str
    student_email: Optional[str] = None


class YearbookQuoteSubmissionBase(BaseModel):
    quote_text: str
    category: Optional[str] = Field(None, max_length=100)


class YearbookQuoteSubmissionCreate(YearbookQuoteSubmissionBase):
    edition_id: int


class YearbookQuoteSubmissionUpdate(BaseModel):
    quote_text: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)


class YearbookQuoteSubmissionReview(BaseModel):
    status: str
    review_notes: Optional[str] = None
    page_id: Optional[int] = None


class YearbookQuoteSubmissionResponse(YearbookQuoteSubmissionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    edition_id: int
    student_id: int
    status: str
    reviewed_by: Optional[int] = None
    review_notes: Optional[str] = None
    page_id: Optional[int] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None


class YearbookQuoteSubmissionWithStudent(YearbookQuoteSubmissionResponse):
    student_name: str
    student_email: Optional[str] = None


class YearbookMemorySubmissionBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str
    associated_event: Optional[str] = Field(None, max_length=255)
    tags: Optional[List[str]] = None


class YearbookMemorySubmissionCreate(YearbookMemorySubmissionBase):
    edition_id: int


class YearbookMemorySubmissionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    associated_event: Optional[str] = Field(None, max_length=255)
    tags: Optional[List[str]] = None


class YearbookMemorySubmissionReview(BaseModel):
    status: str
    review_notes: Optional[str] = None
    page_id: Optional[int] = None


class YearbookMemorySubmissionResponse(YearbookMemorySubmissionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    edition_id: int
    student_id: int
    status: str
    reviewed_by: Optional[int] = None
    review_notes: Optional[str] = None
    page_id: Optional[int] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None


class YearbookMemorySubmissionWithStudent(YearbookMemorySubmissionResponse):
    student_name: str
    student_email: Optional[str] = None


class FlipBookPageView(BaseModel):
    page_number: int
    section: str
    layout_template: Optional[str] = None
    photos: Optional[List[Dict[str, Any]]] = None
    text_content: Optional[List[Dict[str, Any]]] = None
    background_color: Optional[str] = None
    background_image_url: Optional[str] = None
    is_double_page: bool = False


class YearbookArchiveItem(BaseModel):
    id: int
    academic_year: str
    theme: Optional[str] = None
    cover_design_url: Optional[str] = None
    publication_status: str
    digital_flip_book_url: Optional[str] = None
    pdf_url: Optional[str] = None
    published_at: Optional[datetime] = None
    total_pages: int = 0


class YearbookPrintOrder(BaseModel):
    edition_id: int
    quantity: int = Field(..., ge=1)
    delivery_address: str
    contact_name: str
    contact_phone: str
    contact_email: str
    special_instructions: Optional[str] = None


class YearbookPrintOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    order_id: str
    edition_id: int
    quantity: int
    status: str
    estimated_delivery: Optional[datetime] = None
    total_cost: float
    created_at: datetime
