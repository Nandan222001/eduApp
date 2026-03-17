from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.database import get_db
from src.models.user import User
from src.models.student import Parent
from src.models.parent_education import (
    ParentCourse, CourseModule, CourseLesson, CourseEnrollment,
    LessonProgress, LessonQuiz, QuizAttempt, QuizResponse,
    CourseReview, DiscussionForum, ForumPost
)
from src.dependencies.auth import get_current_user
from src.schemas.parent_education import (
    ParentCourseCreate, ParentCourseUpdate, ParentCourseResponse, ParentCourseDetailResponse,
    CourseModuleCreate, CourseModuleUpdate, CourseModuleResponse,
    CourseLessonCreate, CourseLessonUpdate, CourseLessonResponse,
    CourseEnrollmentCreate, CourseEnrollmentUpdate, CourseEnrollmentResponse,
    LessonProgressCreate, LessonProgressUpdate, LessonProgressResponse,
    LessonQuizCreate, LessonQuizUpdate, LessonQuizResponse,
    QuizAttemptCreate, QuizAttemptUpdate, QuizAttemptResponse,
    QuizResponseCreate, QuizResponseUpdate, QuizResponseResponse,
    CourseReviewCreate, CourseReviewUpdate, CourseReviewResponse,
    DiscussionForumCreate, DiscussionForumUpdate, DiscussionForumResponse,
    ForumPostCreate, ForumPostUpdate, ForumPostResponse,
    CourseCatalogFilter, CourseStatistics,
)
from datetime import datetime
from decimal import Decimal

router = APIRouter()


@router.get("/courses", response_model=List[ParentCourseResponse])
async def list_courses(
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    is_free: Optional[bool] = Query(None),
    min_rating: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List available courses with filters"""
    query = db.query(ParentCourse).filter(
        ParentCourse.institution_id == current_user.institution_id,
        ParentCourse.status == 'published',
        ParentCourse.is_active == True
    )
    
    if category:
        query = query.filter(ParentCourse.category == category)
    if level:
        query = query.filter(ParentCourse.level == level)
    if is_free is not None:
        query = query.filter(ParentCourse.is_free == is_free)
    if min_rating:
        query = query.filter(ParentCourse.average_rating >= min_rating)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (ParentCourse.title.ilike(search_term)) |
            (ParentCourse.description.ilike(search_term))
        )
    
    courses = query.offset(skip).limit(limit).all()
    return courses


@router.get("/courses/{course_id}", response_model=ParentCourseDetailResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get course details with modules and lessons"""
    course = db.query(ParentCourse).filter(
        ParentCourse.id == course_id,
        ParentCourse.institution_id == current_user.institution_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    return course


@router.post("/courses", response_model=ParentCourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: ParentCourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new course (admin/instructor only)"""
    course = ParentCourse(
        institution_id=current_user.institution_id,
        instructor_id=course_data.instructor_id or current_user.id,
        **course_data.model_dump(exclude={'instructor_id'})
    )
    
    db.add(course)
    db.commit()
    db.refresh(course)
    
    return course


@router.patch("/courses/{course_id}", response_model=ParentCourseResponse)
async def update_course(
    course_id: int,
    course_data: ParentCourseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update course details"""
    course = db.query(ParentCourse).filter(ParentCourse.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    if course.instructor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    for field, value in course_data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    
    db.commit()
    db.refresh(course)
    
    return course


@router.post("/enrollments", response_model=CourseEnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    enrollment_data: CourseEnrollmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enroll in a course"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    # Check if already enrolled
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == enrollment_data.course_id,
        CourseEnrollment.parent_id == parent_profile.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already enrolled")
    
    # Get course to count total lessons
    course = db.query(ParentCourse).filter(ParentCourse.id == enrollment_data.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    total_lessons = db.query(func.count(CourseLesson.id)).join(CourseModule).filter(
        CourseModule.course_id == course.id
    ).scalar()
    
    enrollment = CourseEnrollment(
        course_id=enrollment_data.course_id,
        parent_id=parent_profile.id,
        total_lessons=total_lessons or 0,
        enrolled_at=datetime.utcnow(),
    )
    
    db.add(enrollment)
    
    # Update course enrollment count
    course.total_enrollments += 1
    
    db.commit()
    db.refresh(enrollment)
    
    return enrollment


@router.get("/enrollments", response_model=List[CourseEnrollmentResponse])
async def list_enrollments(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's course enrollments"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    query = db.query(CourseEnrollment).filter(
        CourseEnrollment.parent_id == parent_profile.id
    )
    
    if status:
        query = query.filter(CourseEnrollment.status == status)
    
    enrollments = query.all()
    return enrollments


@router.get("/enrollments/{enrollment_id}", response_model=CourseEnrollmentResponse)
async def get_enrollment(
    enrollment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get enrollment details"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.id == enrollment_id,
        CourseEnrollment.parent_id == parent_profile.id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    
    return enrollment


@router.post("/progress", response_model=LessonProgressResponse, status_code=status.HTTP_201_CREATED)
async def update_lesson_progress(
    progress_data: LessonProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update lesson progress"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    # Find enrollment
    lesson = db.query(CourseLesson).filter(CourseLesson.id == progress_data.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    
    module = db.query(CourseModule).filter(CourseModule.id == lesson.module_id).first()
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == module.course_id,
        CourseEnrollment.parent_id == parent_profile.id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    
    # Update or create progress
    progress = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.lesson_id == progress_data.lesson_id
    ).first()
    
    if not progress:
        progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=progress_data.lesson_id,
            **progress_data.model_dump(exclude={'lesson_id'})
        )
        db.add(progress)
    else:
        for field, value in progress_data.model_dump(exclude={'lesson_id'}, exclude_unset=True).items():
            setattr(progress, field, value)
    
    if progress_data.is_completed and not progress.completed_at:
        progress.completed_at = datetime.utcnow()
        enrollment.completed_lessons += 1
    
    # Update enrollment progress
    enrollment.progress_percentage = Decimal((enrollment.completed_lessons / enrollment.total_lessons * 100) if enrollment.total_lessons > 0 else 0)
    enrollment.last_accessed_at = datetime.utcnow()
    
    # Check if course completed
    if enrollment.completed_lessons >= enrollment.total_lessons:
        enrollment.status = 'completed'
        enrollment.completed_at = datetime.utcnow()
        
        # Update course completion count
        course = db.query(ParentCourse).filter(ParentCourse.id == enrollment.course_id).first()
        if course:
            course.total_completions += 1
    
    db.commit()
    db.refresh(progress)
    
    return progress


@router.post("/quizzes/attempts", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
async def start_quiz_attempt(
    attempt_data: QuizAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new quiz attempt"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    # Find enrollment
    quiz = db.query(LessonQuiz).filter(LessonQuiz.id == attempt_data.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    lesson = db.query(CourseLesson).filter(CourseLesson.id == quiz.lesson_id).first()
    module = db.query(CourseModule).filter(CourseModule.id == lesson.module_id).first()
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == module.course_id,
        CourseEnrollment.parent_id == parent_profile.id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    
    attempt = QuizAttempt(
        quiz_id=attempt_data.quiz_id,
        enrollment_id=enrollment.id,
        status='in_progress',
        started_at=datetime.utcnow(),
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return attempt


@router.post("/quizzes/attempts/{attempt_id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit and grade a quiz attempt"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.id == attempt.enrollment_id,
        CourseEnrollment.parent_id == parent_profile.id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Calculate score
    responses = db.query(QuizResponse).filter(QuizResponse.attempt_id == attempt_id).all()
    total_points = sum(r.points_earned for r in responses)
    
    quiz = db.query(LessonQuiz).filter(LessonQuiz.id == attempt.quiz_id).first()
    
    attempt.status = 'completed'
    attempt.completed_at = datetime.utcnow()
    attempt.earned_points = total_points
    attempt.total_points = len(responses)
    attempt.score = Decimal((total_points / len(responses) * 100) if len(responses) > 0 else 0)
    attempt.is_passed = attempt.score >= quiz.passing_score
    
    db.commit()
    db.refresh(attempt)
    
    return attempt


@router.post("/reviews", response_model=CourseReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: CourseReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a course review"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    # Check if enrolled
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == review_data.course_id,
        CourseEnrollment.parent_id == parent_profile.id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must be enrolled to review")
    
    review = CourseReview(
        course_id=review_data.course_id,
        parent_id=parent_profile.id,
        rating=review_data.rating,
        review_text=review_data.review_text,
    )
    
    db.add(review)
    
    # Update course rating
    course = db.query(ParentCourse).filter(ParentCourse.id == review_data.course_id).first()
    if course:
        course.total_reviews += 1
        avg_rating = db.query(func.avg(CourseReview.rating)).filter(
            CourseReview.course_id == review_data.course_id,
            CourseReview.is_active == True
        ).scalar()
        course.average_rating = Decimal(str(avg_rating)) if avg_rating else None
    
    db.commit()
    db.refresh(review)
    
    return review


@router.post("/forums/{forum_id}/posts", response_model=ForumPostResponse, status_code=status.HTTP_201_CREATED)
async def create_forum_post(
    forum_id: int,
    post_data: ForumPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a forum post"""
    parent_profile = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent profile not found")
    
    forum = db.query(DiscussionForum).filter(DiscussionForum.id == forum_id).first()
    if not forum:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forum not found")
    
    post = ForumPost(
        forum_id=forum_id,
        parent_id=parent_profile.id,
        parent_post_id=post_data.parent_post_id,
        title=post_data.title,
        content=post_data.content,
    )
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    return post


@router.get("/forums/{forum_id}/posts", response_model=List[ForumPostResponse])
async def list_forum_posts(
    forum_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List forum posts"""
    posts = db.query(ForumPost).filter(
        ForumPost.forum_id == forum_id,
        ForumPost.is_active == True,
        ForumPost.parent_post_id.is_(None)
    ).order_by(ForumPost.is_pinned.desc(), ForumPost.created_at.desc()).offset(skip).limit(limit).all()
    
    return posts


@router.get("/statistics", response_model=CourseStatistics)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get course statistics"""
    total_courses = db.query(func.count(ParentCourse.id)).filter(
        ParentCourse.institution_id == current_user.institution_id,
        ParentCourse.is_active == True
    ).scalar()
    
    published_courses = db.query(func.count(ParentCourse.id)).filter(
        ParentCourse.institution_id == current_user.institution_id,
        ParentCourse.status == 'published',
        ParentCourse.is_active == True
    ).scalar()
    
    total_enrollments = db.query(func.count(CourseEnrollment.id)).join(ParentCourse).filter(
        ParentCourse.institution_id == current_user.institution_id
    ).scalar()
    
    completed_enrollments = db.query(func.count(CourseEnrollment.id)).join(ParentCourse).filter(
        ParentCourse.institution_id == current_user.institution_id,
        CourseEnrollment.status == 'completed'
    ).scalar()
    
    completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
    
    avg_rating = db.query(func.avg(ParentCourse.average_rating)).filter(
        ParentCourse.institution_id == current_user.institution_id,
        ParentCourse.average_rating.isnot(None)
    ).scalar()
    
    # Popular categories
    category_counts = db.query(
        ParentCourse.category,
        func.count(ParentCourse.id)
    ).filter(
        ParentCourse.institution_id == current_user.institution_id,
        ParentCourse.status == 'published'
    ).group_by(ParentCourse.category).all()
    
    popular_categories = {cat: count for cat, count in category_counts}
    
    return CourseStatistics(
        total_courses=total_courses or 0,
        published_courses=published_courses or 0,
        total_enrollments=total_enrollments or 0,
        completion_rate=completion_rate,
        average_rating=float(avg_rating) if avg_rating else 0.0,
        popular_categories=popular_categories,
    )
