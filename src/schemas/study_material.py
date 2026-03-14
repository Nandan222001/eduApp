from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from src.models.study_material import MaterialType, ExternalContentSource


class MaterialTagBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)


class MaterialTagCreate(MaterialTagBase):
    pass


class MaterialTagUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)


class MaterialTagResponse(MaterialTagBase):
    id: int
    institution_id: int
    usage_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudyMaterialBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    grade_id: Optional[int] = None
    tags: Optional[List[str]] = []
    is_public: bool = False


class StudyMaterialCreate(StudyMaterialBase):
    file_path: str = Field(..., max_length=1000)
    file_name: str = Field(..., max_length=500)
    file_size: int
    material_type: MaterialType
    mime_type: Optional[str] = Field(None, max_length=200)
    thumbnail_path: Optional[str] = Field(None, max_length=1000)
    preview_path: Optional[str] = Field(None, max_length=1000)


class StudyMaterialUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    grade_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None


class StudyMaterialResponse(StudyMaterialBase):
    id: int
    institution_id: int
    uploaded_by: Optional[int]
    file_path: str
    file_name: str
    file_size: int
    material_type: MaterialType
    mime_type: Optional[str]
    thumbnail_path: Optional[str]
    preview_path: Optional[str]
    view_count: int
    download_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    uploader_name: Optional[str] = None
    subject_name: Optional[str] = None
    chapter_name: Optional[str] = None
    topic_name: Optional[str] = None
    grade_name: Optional[str] = None
    is_bookmarked: Optional[bool] = False
    is_favorite: Optional[bool] = False

    class Config:
        from_attributes = True


class MaterialBookmarkBase(BaseModel):
    notes: Optional[str] = None
    is_favorite: bool = False


class MaterialBookmarkCreate(MaterialBookmarkBase):
    material_id: int


class MaterialBookmarkUpdate(BaseModel):
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None


class MaterialBookmarkResponse(MaterialBookmarkBase):
    id: int
    institution_id: int
    material_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    material: Optional[StudyMaterialResponse] = None

    class Config:
        from_attributes = True


class MaterialAccessLogResponse(BaseModel):
    id: int
    institution_id: int
    material_id: int
    user_id: int
    action: str
    accessed_at: datetime

    class Config:
        from_attributes = True


class MaterialShareBase(BaseModel):
    message: Optional[str] = None
    expires_at: Optional[datetime] = None


class MaterialShareCreate(MaterialShareBase):
    material_id: int
    shared_with: Optional[int] = None


class MaterialShareResponse(MaterialShareBase):
    id: int
    institution_id: int
    material_id: int
    shared_by: int
    shared_with: Optional[int]
    share_token: str
    is_active: bool
    created_at: datetime
    
    material: Optional[StudyMaterialResponse] = None

    class Config:
        from_attributes = True


class MaterialSearchFilters(BaseModel):
    query: Optional[str] = None
    material_type: Optional[MaterialType] = None
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    topic_id: Optional[int] = None
    grade_id: Optional[int] = None
    tags: Optional[List[str]] = None
    uploaded_by: Optional[int] = None
    is_public: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class MaterialHierarchyNode(BaseModel):
    id: int
    name: str
    type: str  # subject, chapter, topic
    material_count: int
    children: Optional[List['MaterialHierarchyNode']] = []

    class Config:
        from_attributes = True


class MaterialUploadResponse(BaseModel):
    material: StudyMaterialResponse
    message: str = "Material uploaded successfully"


class MaterialStatsResponse(BaseModel):
    total_materials: int
    total_views: int
    total_downloads: int
    materials_by_type: dict
    recent_uploads: List[StudyMaterialResponse]
    popular_materials: List[StudyMaterialResponse]
    bookmarked_count: int = 0


class AutocompleteResponse(BaseModel):
    suggestions: List[str]
    tags: List[str]
    subjects: List[dict]


class RecentlyAccessedResponse(BaseModel):
    materials: List[StudyMaterialResponse]
    last_accessed: List[datetime]


MaterialHierarchyNode.model_rebuild()


class ContentEffectivenessScoreResponse(BaseModel):
    id: int
    institution_id: int
    material_id: Optional[int]
    external_content_id: Optional[int]
    effectiveness_score: Decimal
    avg_improvement: Decimal
    engagement_score: Decimal
    performance_correlation: Decimal
    unique_students: int
    total_accesses: int
    positive_outcomes: int
    last_calculated_at: datetime

    class Config:
        from_attributes = True
