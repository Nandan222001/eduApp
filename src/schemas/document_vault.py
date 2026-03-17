from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DocumentFolderBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=50)
    icon: Optional[str] = Field(None, max_length=100)


class DocumentFolderCreate(DocumentFolderBase):
    parent_folder_id: Optional[int] = None


class DocumentFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=50)
    icon: Optional[str] = Field(None, max_length=100)
    parent_folder_id: Optional[int] = None


class DocumentFolderResponse(DocumentFolderBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    parent_folder_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class FamilyDocumentBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    document_type: str
    student_id: Optional[int] = None
    folder_id: Optional[int] = None
    tags: Optional[List[str]] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    is_sensitive: bool = True


class FamilyDocumentCreate(FamilyDocumentBase):
    file_name: str
    file_size: int
    file_type: str
    mime_type: Optional[str] = None


class FamilyDocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    document_type: Optional[str] = None
    student_id: Optional[int] = None
    folder_id: Optional[int] = None
    tags: Optional[List[str]] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[str] = None
    is_sensitive: Optional[bool] = None


class FamilyDocumentResponse(FamilyDocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    parent_id: int
    file_name: str
    file_size: int
    file_type: str
    mime_type: Optional[str] = None
    encrypted_file_url: str
    ocr_text: Optional[str] = None
    extracted_metadata: Optional[Dict[str, Any]] = None
    ferpa_compliant: bool
    access_log_enabled: bool
    status: str
    is_verified: bool
    verified_by_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DocumentShareBase(BaseModel):
    permission: str = "view"
    expires_at: Optional[datetime] = None


class DocumentShareCreate(DocumentShareBase):
    document_id: int
    shared_with_user_id: int


class DocumentShareUpdate(BaseModel):
    permission: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class DocumentShareResponse(DocumentShareBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    shared_with_user_id: int
    shared_by_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DocumentAccessLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    document_id: int
    user_id: int
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class DocumentUploadRequest(BaseModel):
    title: str
    description: Optional[str] = None
    document_type: str
    student_id: Optional[int] = None
    folder_id: Optional[int] = None
    tags: Optional[List[str]] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None


class DocumentUploadResponse(BaseModel):
    document_id: int
    upload_url: str
    encryption_key: str


class OCRResult(BaseModel):
    text: str
    confidence: float
    detected_type: Optional[str] = None
    metadata: Dict[str, Any]


class DocumentStatistics(BaseModel):
    total_documents: int
    documents_by_type: Dict[str, int]
    total_storage_mb: float
    documents_by_status: Dict[str, int]
    recent_uploads: int
    expiring_soon: int
