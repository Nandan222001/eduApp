from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Search query text")
    search_types: Optional[List[str]] = Field(default=None, description="Filter by entity types")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Additional filters")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum results per category")
    offset: int = Field(default=0, ge=0, description="Pagination offset")


class StudentSearchResult(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    admission_number: Optional[str]
    roll_number: Optional[str]
    section_name: Optional[str]
    grade_name: Optional[str]
    photo_url: Optional[str]
    status: str
    
    class Config:
        from_attributes = True


class TeacherSearchResult(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    employee_id: Optional[str]
    phone: Optional[str]
    specialization: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class AssignmentSearchResult(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    status: str
    subject_name: Optional[str]
    grade_name: Optional[str]
    section_name: Optional[str]
    teacher_name: Optional[str]
    max_marks: float
    
    class Config:
        from_attributes = True


class PaperSearchResult(BaseModel):
    id: int
    title: str
    description: Optional[str]
    board: str
    year: int
    exam_month: Optional[str]
    subject_name: Optional[str]
    grade_name: Optional[str]
    total_marks: Optional[int]
    tags: Optional[str]
    view_count: int
    
    class Config:
        from_attributes = True


class AnnouncementSearchResult(BaseModel):
    id: int
    title: str
    content: str
    priority: str
    audience_type: str
    is_published: bool
    published_at: Optional[datetime]
    expires_at: Optional[datetime]
    creator_name: Optional[str]
    
    class Config:
        from_attributes = True


class SearchResults(BaseModel):
    query: str
    total_results: int
    students: List[StudentSearchResult] = []
    teachers: List[TeacherSearchResult] = []
    assignments: List[AssignmentSearchResult] = []
    papers: List[PaperSearchResult] = []
    announcements: List[AnnouncementSearchResult] = []
    search_time_ms: float


class QuickSearchResult(BaseModel):
    type: str
    id: int
    title: str
    subtitle: Optional[str]
    metadata: Optional[Dict[str, Any]]
    url: str


class QuickSearchResults(BaseModel):
    query: str
    results: List[QuickSearchResult]
    total: int
    search_time_ms: float


class SearchHistoryItem(BaseModel):
    id: int
    query: str
    search_type: Optional[str]
    results_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class SearchHistoryResponse(BaseModel):
    items: List[SearchHistoryItem]
    total: int


class SearchSuggestion(BaseModel):
    query: str
    type: str
    count: Optional[int]


class SearchSuggestionsResponse(BaseModel):
    suggestions: List[SearchSuggestion]
    popular: List[SearchSuggestion]


class SearchFilterOptions(BaseModel):
    grades: List[Dict[str, Any]] = []
    subjects: List[Dict[str, Any]] = []
    sections: List[Dict[str, Any]] = []
    statuses: List[str] = []
    boards: List[str] = []
    years: List[int] = []
