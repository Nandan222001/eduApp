from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class CourseModuleBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    order_index: int


class CourseModuleCreate(CourseModuleBase):
    pass


class CourseModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class CourseModuleResponse(CourseModuleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    course_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CourseLessonBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    order_index: int
    content_type: str
    video_url: Optional[str] = None
    video_duration_seconds: Optional[int] = None
    article_content: Optional[str] = None
    pdf_url: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    external_links: Optional[List[Dict[str, str]]] = None
    is_preview: bool = False


class CourseLessonCreate(CourseLessonBase):
    module_id: int


class CourseLessonUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    order_index: Optional[int] = None
    content_type: Optional[str] = None
    video_url: Optional[str] = None
    video_duration_seconds: Optional[int] = None
    article_content: Optional[str] = None
    pdf_url: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    external_links: Optional[List[Dict[str, str]]] = None
    is_preview: Optional[bool] = None
    is_active: Optional[bool] = None


class CourseLessonResponse(CourseLessonBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    module_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ParentCourseBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    category: str
    level: str = "all_levels"
    thumbnail_url: Optional[str] = None
    duration_hours: Optional[Decimal] = None
    learning_objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    is_free: bool = True
    price: Optional[Decimal] = None
    certificate_enabled: bool = True
    passing_score: int = 70


class ParentCourseCreate(ParentCourseBase):
    instructor_id: Optional[int] = None


class ParentCourseUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    level: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_hours: Optional[Decimal] = None
    learning_objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    is_free: Optional[bool] = None
    price: Optional[Decimal] = None
    certificate_enabled: Optional[bool] = None
    passing_score: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class ParentCourseResponse(ParentCourseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    institution_id: int
    instructor_id: Optional[int] = None
    certificate_template_url: Optional[str] = None
    status: str
    total_enrollments: int
    total_completions: int
    average_rating: Optional[Decimal] = None
    total_reviews: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ParentCourseDetailResponse(ParentCourseResponse):
    modules: List[CourseModuleResponse] = []


class CourseEnrollmentBase(BaseModel):
    status: str = "enrolled"


class CourseEnrollmentCreate(BaseModel):
    course_id: int


class CourseEnrollmentUpdate(BaseModel):
    status: Optional[str] = None


class CourseEnrollmentResponse(CourseEnrollmentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    course_id: int
    parent_id: int
    progress_percentage: Decimal
    completed_lessons: int
    total_lessons: int
    completed_at: Optional[datetime] = None
    certificate_url: Optional[str] = None
    final_score: Optional[Decimal] = None
    last_accessed_at: Optional[datetime] = None
    total_time_spent_minutes: int
    enrolled_at: datetime
    created_at: datetime
    updated_at: datetime


class LessonProgressBase(BaseModel):
    is_completed: bool = False
    video_progress_seconds: int = 0
    video_watched_percentage: Decimal = Decimal("0.00")
    time_spent_minutes: int = 0


class LessonProgressCreate(LessonProgressBase):
    lesson_id: int


class LessonProgressUpdate(BaseModel):
    is_completed: Optional[bool] = None
    video_progress_seconds: Optional[int] = None
    video_watched_percentage: Optional[Decimal] = None
    time_spent_minutes: Optional[int] = None


class LessonProgressResponse(LessonProgressBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    enrollment_id: int
    lesson_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class QuizQuestionBase(BaseModel):
    question_text: str
    question_type: str
    order_index: int
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Dict[str, Any]
    explanation: Optional[str] = None
    points: int = 1


class QuizQuestionCreate(QuizQuestionBase):
    quiz_id: int


class QuizQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    order_index: Optional[int] = None
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    points: Optional[int] = None
    is_active: Optional[bool] = None


class QuizQuestionResponse(QuizQuestionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    quiz_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LessonQuizBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    passing_score: int = 70
    time_limit_minutes: Optional[int] = None


class LessonQuizCreate(LessonQuizBase):
    lesson_id: int


class LessonQuizUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    passing_score: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class LessonQuizResponse(LessonQuizBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    lesson_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class QuizAttemptBase(BaseModel):
    status: str = "not_started"


class QuizAttemptCreate(BaseModel):
    quiz_id: int


class QuizAttemptUpdate(BaseModel):
    status: Optional[str] = None
    score: Optional[Decimal] = None
    completed_at: Optional[datetime] = None


class QuizAttemptResponse(QuizAttemptBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    quiz_id: int
    enrollment_id: int
    score: Optional[Decimal] = None
    total_points: Optional[int] = None
    earned_points: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    time_spent_minutes: int
    is_passed: Optional[bool] = None
    created_at: datetime
    updated_at: datetime


class QuizResponseBase(BaseModel):
    selected_answer: Optional[Dict[str, Any]] = None


class QuizResponseCreate(QuizResponseBase):
    question_id: int


class QuizResponseUpdate(BaseModel):
    selected_answer: Optional[Dict[str, Any]] = None
    is_correct: Optional[bool] = None
    points_earned: Optional[int] = None


class QuizResponseResponse(QuizResponseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    attempt_id: int
    question_id: int
    is_correct: Optional[bool] = None
    points_earned: int
    created_at: datetime
    updated_at: datetime


class CourseReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None


class CourseReviewCreate(CourseReviewBase):
    course_id: int


class CourseReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review_text: Optional[str] = None


class CourseReviewResponse(CourseReviewBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    course_id: int
    parent_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DiscussionForumBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None


class DiscussionForumCreate(DiscussionForumBase):
    course_id: int


class DiscussionForumUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DiscussionForumResponse(DiscussionForumBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    course_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ForumPostBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: str


class ForumPostCreate(ForumPostBase):
    forum_id: int
    parent_post_id: Optional[int] = None


class ForumPostUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None


class ForumPostResponse(ForumPostBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    forum_id: int
    parent_id: int
    parent_post_id: Optional[int] = None
    upvotes: int
    downvotes: int
    is_pinned: bool
    is_locked: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CourseCatalogFilter(BaseModel):
    category: Optional[str] = None
    level: Optional[str] = None
    is_free: Optional[bool] = None
    min_rating: Optional[float] = None
    search: Optional[str] = None


class CourseStatistics(BaseModel):
    total_courses: int
    published_courses: int
    total_enrollments: int
    completion_rate: float
    average_rating: float
    popular_categories: Dict[str, int]
