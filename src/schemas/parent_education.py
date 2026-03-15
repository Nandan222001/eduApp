from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from src.models.parent_education import (
    CourseCategory, EnrollmentStatus, CourseBadgeType
)


class LessonContent(BaseModel):
    lesson_number: int
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    reading_materials: Optional[List[str]] = None
    activities: Optional[List[Dict[str, Any]]] = None
    duration_minutes: int = 0
    quiz: Optional[Dict[str, Any]] = None


class ParentCourseBase(BaseModel):
    course_title: str = Field(..., max_length=500)
    description: Optional[str] = None
    category: CourseCategory
    thumbnail_url: Optional[str] = Field(None, max_length=1000)
    instructor_name: Optional[str] = Field(None, max_length=200)
    instructor_bio: Optional[str] = None
    instructor_avatar_url: Optional[str] = Field(None, max_length=1000)
    lessons: List[Dict[str, Any]]
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_published: bool = False
    is_featured: bool = False


class ParentCourseCreate(ParentCourseBase):
    pass


class ParentCourseUpdate(BaseModel):
    course_title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    category: Optional[CourseCategory] = None
    thumbnail_url: Optional[str] = Field(None, max_length=1000)
    instructor_name: Optional[str] = Field(None, max_length=200)
    instructor_bio: Optional[str] = None
    instructor_avatar_url: Optional[str] = Field(None, max_length=1000)
    lessons: Optional[List[Dict[str, Any]]] = None
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None


class ParentCourseResponse(ParentCourseBase):
    id: int
    institution_id: int
    total_duration_minutes: int
    lesson_count: int
    enrollment_count: int
    completion_count: int
    average_rating: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParentCourseListResponse(BaseModel):
    id: int
    institution_id: int
    course_title: str
    description: Optional[str] = None
    category: CourseCategory
    thumbnail_url: Optional[str] = None
    instructor_name: Optional[str] = None
    total_duration_minutes: int
    lesson_count: int
    enrollment_count: int
    completion_count: int
    average_rating: float
    is_featured: bool
    tags: Optional[List[str]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParentEnrollmentBase(BaseModel):
    course_id: int


class ParentEnrollmentCreate(ParentEnrollmentBase):
    pass


class ParentEnrollmentResponse(BaseModel):
    id: int
    institution_id: int
    course_id: int
    user_id: int
    status: EnrollmentStatus
    progress_percentage: float
    completed_lessons: List[int]
    quiz_scores: Dict[str, Any]
    total_time_spent_minutes: int
    last_accessed_lesson: Optional[int] = None
    last_accessed_at: Optional[datetime] = None
    certificate_earned: bool
    certificate_url: Optional[str] = None
    completion_date: Optional[datetime] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    enrolled_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParentEnrollmentWithCourse(ParentEnrollmentResponse):
    course: ParentCourseListResponse


class LessonProgressUpdate(BaseModel):
    lesson_number: int
    time_spent_minutes: int = 0
    completed: bool = False


class QuizSubmission(BaseModel):
    lesson_number: int
    answers: Dict[str, Any]


class QuizResult(BaseModel):
    lesson_number: int
    score: float
    total_questions: int
    correct_answers: int
    passed: bool
    feedback: Optional[Dict[str, Any]] = None


class CourseReview(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None


class ParentCourseBadgeResponse(BaseModel):
    id: int
    institution_id: int
    enrollment_id: int
    user_id: int
    badge_type: CourseBadgeType
    badge_name: str
    badge_description: Optional[str] = None
    badge_icon_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    earned_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseDiscussionThreadBase(BaseModel):
    title: str = Field(..., max_length=500)
    content: str
    lesson_number: Optional[int] = None
    tags: Optional[List[str]] = None


class CourseDiscussionThreadCreate(CourseDiscussionThreadBase):
    course_id: int


class CourseDiscussionThreadUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class CourseDiscussionThreadResponse(CourseDiscussionThreadBase):
    id: int
    institution_id: int
    course_id: int
    user_id: int
    is_pinned: bool
    is_locked: bool
    view_count: int
    reply_count: int
    upvote_count: int
    created_at: datetime
    updated_at: datetime
    last_activity_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseDiscussionReplyBase(BaseModel):
    content: str


class CourseDiscussionReplyCreate(CourseDiscussionReplyBase):
    thread_id: int
    parent_reply_id: Optional[int] = None


class CourseDiscussionReplyResponse(CourseDiscussionReplyBase):
    id: int
    institution_id: int
    thread_id: int
    user_id: int
    parent_reply_id: Optional[int] = None
    is_instructor_reply: bool
    is_answer: bool
    upvote_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CertificateResponse(BaseModel):
    enrollment_id: int
    user_id: int
    course_id: int
    course_title: str
    certificate_url: str
    completion_date: datetime
    user_name: str


class CourseProgressSummary(BaseModel):
    enrollment_id: int
    course_id: int
    course_title: str
    category: CourseCategory
    progress_percentage: float
    completed_lessons: List[int]
    total_lessons: int
    total_time_spent_minutes: int
    quiz_scores: Dict[str, Any]
    badges_earned: List[ParentCourseBadgeResponse]
    status: EnrollmentStatus
    enrolled_at: datetime
    last_accessed_at: Optional[datetime] = None


class CourseCatalogFilter(BaseModel):
    category: Optional[CourseCategory] = None
    search: Optional[str] = None
    is_featured: Optional[bool] = None
    min_duration: Optional[int] = None
    max_duration: Optional[int] = None


class LearningActivityCreate(BaseModel):
    lesson_number: int
    activity_type: str
    time_spent_minutes: int = 0
    completed: bool = False
    metadata: Optional[Dict[str, Any]] = None


class ParentLearningActivityResponse(BaseModel):
    id: int
    institution_id: int
    enrollment_id: int
    user_id: int
    course_id: int
    lesson_number: int
    activity_type: str
    time_spent_minutes: int
    completed: bool
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EnrollmentStats(BaseModel):
    total_enrollments: int
    active_enrollments: int
    completed_enrollments: int
    total_courses_completed: int
    total_time_spent_minutes: int
    total_badges_earned: int
    certificates_earned: int
    courses_by_category: Dict[str, int]
