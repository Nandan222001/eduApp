from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from src.database import get_db
from src.models.parent_education import (
    ParentCourse, ParentEnrollment, ParentCourseBadge, CourseDiscussionThread,
    CourseDiscussionReply, CourseThreadVote, CourseReplyVote, ParentLearningActivity,
    CourseCategory, EnrollmentStatus, CourseBadgeType
)
from src.models.user import User
from src.schemas.parent_education import (
    ParentCourseCreate, ParentCourseUpdate, ParentCourseResponse, ParentCourseListResponse,
    ParentEnrollmentCreate, ParentEnrollmentResponse, ParentEnrollmentWithCourse,
    LessonProgressUpdate, QuizSubmission, QuizResult, CourseReview,
    ParentCourseBadgeResponse, CourseDiscussionThreadCreate, CourseDiscussionThreadUpdate,
    CourseDiscussionThreadResponse, CourseDiscussionReplyCreate, CourseDiscussionReplyResponse,
    CertificateResponse, CourseProgressSummary, LearningActivityCreate,
    ParentLearningActivityResponse, EnrollmentStats
)

router = APIRouter()


@router.post("/courses", response_model=ParentCourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course: ParentCourseCreate,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    lesson_count = len(course.lessons)
    total_duration = sum(lesson.get('duration_minutes', 0) for lesson in course.lessons)
    
    db_course = ParentCourse(
        institution_id=institution_id,
        course_title=course.course_title,
        description=course.description,
        category=course.category,
        thumbnail_url=course.thumbnail_url,
        instructor_name=course.instructor_name,
        instructor_bio=course.instructor_bio,
        instructor_avatar_url=course.instructor_avatar_url,
        lessons=course.lessons,
        total_duration_minutes=total_duration,
        lesson_count=lesson_count,
        prerequisites=course.prerequisites,
        learning_objectives=course.learning_objectives,
        tags=course.tags,
        is_published=course.is_published,
        is_featured=course.is_featured
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.get("/courses", response_model=List[ParentCourseListResponse])
def list_courses(
    institution_id: int = Query(...),
    category: Optional[CourseCategory] = Query(None),
    search: Optional[str] = Query(None),
    is_featured: Optional[bool] = Query(None),
    is_published: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(ParentCourse).filter(
        ParentCourse.institution_id == institution_id
    )
    
    if is_published is not None:
        query = query.filter(ParentCourse.is_published == is_published)
    
    if category:
        query = query.filter(ParentCourse.category == category)
    
    if is_featured is not None:
        query = query.filter(ParentCourse.is_featured == is_featured)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                ParentCourse.course_title.ilike(search_pattern),
                ParentCourse.description.ilike(search_pattern)
            )
        )
    
    query = query.order_by(
        ParentCourse.is_featured.desc(),
        ParentCourse.created_at.desc()
    )
    
    courses = query.offset(skip).limit(limit).all()
    return courses


@router.get("/courses/{course_id}", response_model=ParentCourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = db.query(ParentCourse).filter(ParentCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.put("/courses/{course_id}", response_model=ParentCourseResponse)
def update_course(
    course_id: int,
    course: ParentCourseUpdate,
    db: Session = Depends(get_db)
):
    db_course = db.query(ParentCourse).filter(ParentCourse.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_data = course.model_dump(exclude_unset=True)
    
    if 'lessons' in update_data:
        update_data['lesson_count'] = len(update_data['lessons'])
        update_data['total_duration_minutes'] = sum(
            lesson.get('duration_minutes', 0) for lesson in update_data['lessons']
        )
    
    for field, value in update_data.items():
        setattr(db_course, field, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    db_course = db.query(ParentCourse).filter(ParentCourse.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(db_course)
    db.commit()
    return None


@router.post("/enrollments", response_model=ParentEnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    enrollment: ParentEnrollmentCreate,
    user_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    course = db.query(ParentCourse).filter(
        ParentCourse.id == enrollment.course_id,
        ParentCourse.institution_id == institution_id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not course.is_published:
        raise HTTPException(status_code=400, detail="Course is not published")
    
    existing = db.query(ParentEnrollment).filter(
        ParentEnrollment.course_id == enrollment.course_id,
        ParentEnrollment.user_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    db_enrollment = ParentEnrollment(
        institution_id=institution_id,
        course_id=enrollment.course_id,
        user_id=user_id,
        status=EnrollmentStatus.ENROLLED,
        completed_lessons=[],
        quiz_scores={}
    )
    
    db.add(db_enrollment)
    course.enrollment_count = course.enrollment_count + 1
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


@router.get("/enrollments", response_model=List[ParentEnrollmentWithCourse])
def list_enrollments(
    user_id: int = Query(...),
    institution_id: int = Query(...),
    status_filter: Optional[EnrollmentStatus] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ParentEnrollment).filter(
        ParentEnrollment.user_id == user_id,
        ParentEnrollment.institution_id == institution_id
    )
    
    if status_filter:
        query = query.filter(ParentEnrollment.status == status_filter)
    
    query = query.order_by(ParentEnrollment.enrolled_at.desc())
    enrollments = query.all()
    
    results = []
    for enrollment in enrollments:
        course = db.query(ParentCourse).filter(ParentCourse.id == enrollment.course_id).first()
        enrollment_dict = ParentEnrollmentResponse.model_validate(enrollment).model_dump()
        enrollment_dict['course'] = ParentCourseListResponse.model_validate(course).model_dump()
        results.append(enrollment_dict)
    
    return results


@router.get("/enrollments/{enrollment_id}", response_model=ParentEnrollmentResponse)
def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db)
):
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    return enrollment


@router.post("/enrollments/{enrollment_id}/progress", response_model=ParentEnrollmentResponse)
def update_lesson_progress(
    enrollment_id: int,
    progress: LessonProgressUpdate,
    db: Session = Depends(get_db)
):
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    course = db.query(ParentCourse).filter(
        ParentCourse.id == enrollment.course_id
    ).first()
    
    if progress.completed and progress.lesson_number not in enrollment.completed_lessons:
        enrollment.completed_lessons = enrollment.completed_lessons + [progress.lesson_number]
        enrollment.progress_percentage = (len(enrollment.completed_lessons) / course.lesson_count) * 100
        
        if enrollment.progress_percentage >= 100:
            enrollment.status = EnrollmentStatus.COMPLETED
            enrollment.completion_date = datetime.utcnow()
            enrollment.certificate_earned = True
            enrollment.certificate_url = f"/certificates/{enrollment.id}"
            
            course.completion_count = course.completion_count + 1
            
            award_badge(
                db, enrollment.id, enrollment.user_id, enrollment.institution_id,
                CourseBadgeType.COURSE_COMPLETION,
                "Course Completed",
                f"Completed {course.course_title}",
                {"course_id": course.id, "course_title": course.course_title}
            )
    
    enrollment.total_time_spent_minutes += progress.time_spent_minutes
    enrollment.last_accessed_lesson = progress.lesson_number
    enrollment.last_accessed_at = datetime.utcnow()
    
    if enrollment.status == EnrollmentStatus.ENROLLED:
        enrollment.status = EnrollmentStatus.IN_PROGRESS
    
    activity = ParentLearningActivity(
        institution_id=enrollment.institution_id,
        enrollment_id=enrollment.id,
        user_id=enrollment.user_id,
        course_id=enrollment.course_id,
        lesson_number=progress.lesson_number,
        activity_type="lesson_view",
        time_spent_minutes=progress.time_spent_minutes,
        completed=progress.completed
    )
    db.add(activity)
    
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.post("/enrollments/{enrollment_id}/quiz", response_model=QuizResult)
def submit_quiz(
    enrollment_id: int,
    submission: QuizSubmission,
    db: Session = Depends(get_db)
):
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    course = db.query(ParentCourse).filter(
        ParentCourse.id == enrollment.course_id
    ).first()
    
    if submission.lesson_number >= len(course.lessons):
        raise HTTPException(status_code=400, detail="Invalid lesson number")
    
    lesson = course.lessons[submission.lesson_number]
    quiz = lesson.get('quiz')
    
    if not quiz:
        raise HTTPException(status_code=400, detail="No quiz found for this lesson")
    
    questions = quiz.get('questions', [])
    total_questions = len(questions)
    correct_answers = 0
    
    for question in questions:
        question_id = question.get('id')
        correct_answer = question.get('correct_answer')
        user_answer = submission.answers.get(question_id)
        
        if user_answer == correct_answer:
            correct_answers += 1
    
    score = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    passing_score = quiz.get('passing_score', 70)
    passed = score >= passing_score
    
    enrollment.quiz_scores[str(submission.lesson_number)] = {
        'score': score,
        'correct_answers': correct_answers,
        'total_questions': total_questions,
        'passed': passed,
        'submitted_at': datetime.utcnow().isoformat()
    }
    
    if passed and score >= 90:
        award_badge(
            db, enrollment.id, enrollment.user_id, enrollment.institution_id,
            CourseBadgeType.QUIZ_MASTER,
            "Quiz Master",
            f"Scored {score}% on lesson {submission.lesson_number + 1} quiz",
            {"lesson_number": submission.lesson_number, "score": score}
        )
    
    activity = ParentLearningActivity(
        institution_id=enrollment.institution_id,
        enrollment_id=enrollment.id,
        user_id=enrollment.user_id,
        course_id=enrollment.course_id,
        lesson_number=submission.lesson_number,
        activity_type="quiz_submission",
        completed=passed,
        metadata={'score': score, 'passed': passed}
    )
    db.add(activity)
    
    db.commit()
    db.refresh(enrollment)
    
    return QuizResult(
        lesson_number=submission.lesson_number,
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        passed=passed
    )


@router.post("/enrollments/{enrollment_id}/review", response_model=ParentEnrollmentResponse)
def submit_review(
    enrollment_id: int,
    review: CourseReview,
    db: Session = Depends(get_db)
):
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if enrollment.status != EnrollmentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed courses")
    
    enrollment.rating = review.rating
    enrollment.review = review.review
    enrollment.reviewed_at = datetime.utcnow()
    
    course = db.query(ParentCourse).filter(
        ParentCourse.id == enrollment.course_id
    ).first()
    
    avg_rating = db.query(func.avg(ParentEnrollment.rating)).filter(
        ParentEnrollment.course_id == course.id,
        ParentEnrollment.rating.isnot(None)
    ).scalar()
    
    course.average_rating = float(avg_rating) if avg_rating else 0.0
    
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/enrollments/{enrollment_id}/certificate", response_model=CertificateResponse)
def get_certificate(
    enrollment_id: int,
    db: Session = Depends(get_db)
):
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if not enrollment.certificate_earned:
        raise HTTPException(status_code=400, detail="Certificate not earned yet")
    
    course = db.query(ParentCourse).filter(
        ParentCourse.id == enrollment.course_id
    ).first()
    
    user = db.query(User).filter(User.id == enrollment.user_id).first()
    
    user_name = f"{user.first_name} {user.last_name}" if user.first_name else user.username
    
    return CertificateResponse(
        enrollment_id=enrollment.id,
        user_id=enrollment.user_id,
        course_id=course.id,
        course_title=course.course_title,
        certificate_url=enrollment.certificate_url,
        completion_date=enrollment.completion_date,
        user_name=user_name
    )


@router.get("/enrollments/{enrollment_id}/progress", response_model=CourseProgressSummary)
def get_progress_summary(
    enrollment_id: int,
    db: Session = Depends(get_db)
):
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.id == enrollment_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    course = db.query(ParentCourse).filter(
        ParentCourse.id == enrollment.course_id
    ).first()
    
    badges = db.query(ParentCourseBadge).filter(
        ParentCourseBadge.enrollment_id == enrollment.id
    ).all()
    
    return CourseProgressSummary(
        enrollment_id=enrollment.id,
        course_id=course.id,
        course_title=course.course_title,
        category=course.category,
        progress_percentage=enrollment.progress_percentage,
        completed_lessons=enrollment.completed_lessons,
        total_lessons=course.lesson_count,
        total_time_spent_minutes=enrollment.total_time_spent_minutes,
        quiz_scores=enrollment.quiz_scores,
        badges_earned=[ParentCourseBadgeResponse.model_validate(b) for b in badges],
        status=enrollment.status,
        enrolled_at=enrollment.enrolled_at,
        last_accessed_at=enrollment.last_accessed_at
    )


@router.get("/users/{user_id}/badges", response_model=List[ParentCourseBadgeResponse])
def get_user_badges(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    badges = db.query(ParentCourseBadge).filter(
        ParentCourseBadge.user_id == user_id,
        ParentCourseBadge.institution_id == institution_id
    ).order_by(ParentCourseBadge.earned_at.desc()).all()
    
    return badges


@router.get("/users/{user_id}/stats", response_model=EnrollmentStats)
def get_user_stats(
    user_id: int,
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    enrollments = db.query(ParentEnrollment).filter(
        ParentEnrollment.user_id == user_id,
        ParentEnrollment.institution_id == institution_id
    ).all()
    
    total_enrollments = len(enrollments)
    active_enrollments = sum(1 for e in enrollments if e.status == EnrollmentStatus.IN_PROGRESS)
    completed_enrollments = sum(1 for e in enrollments if e.status == EnrollmentStatus.COMPLETED)
    total_time_spent = sum(e.total_time_spent_minutes for e in enrollments)
    certificates_earned = sum(1 for e in enrollments if e.certificate_earned)
    
    total_badges = db.query(func.count(ParentCourseBadge.id)).filter(
        ParentCourseBadge.user_id == user_id,
        ParentCourseBadge.institution_id == institution_id
    ).scalar()
    
    courses_by_category = {}
    for enrollment in enrollments:
        course = db.query(ParentCourse).filter(
            ParentCourse.id == enrollment.course_id
        ).first()
        if course:
            category_name = course.category.value
            courses_by_category[category_name] = courses_by_category.get(category_name, 0) + 1
    
    return EnrollmentStats(
        total_enrollments=total_enrollments,
        active_enrollments=active_enrollments,
        completed_enrollments=completed_enrollments,
        total_courses_completed=completed_enrollments,
        total_time_spent_minutes=total_time_spent,
        total_badges_earned=total_badges or 0,
        certificates_earned=certificates_earned,
        courses_by_category=courses_by_category
    )


@router.post("/discussions", response_model=CourseDiscussionThreadResponse, status_code=status.HTTP_201_CREATED)
def create_discussion_thread(
    thread: CourseDiscussionThreadCreate,
    user_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.course_id == thread.course_id,
        ParentEnrollment.user_id == user_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=400, detail="Must be enrolled to create discussion")
    
    db_thread = CourseDiscussionThread(
        institution_id=institution_id,
        course_id=thread.course_id,
        user_id=user_id,
        title=thread.title,
        content=thread.content,
        lesson_number=thread.lesson_number,
        tags=thread.tags
    )
    
    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)
    
    award_badge(
        db, enrollment.id, user_id, institution_id,
        CourseBadgeType.ACTIVE_PARTICIPANT,
        "Active Participant",
        "Started a discussion",
        {"thread_id": db_thread.id}
    )
    
    return db_thread


@router.get("/discussions/course/{course_id}", response_model=List[CourseDiscussionThreadResponse])
def list_course_discussions(
    course_id: int,
    lesson_number: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.course_id == course_id
    )
    
    if lesson_number is not None:
        query = query.filter(CourseDiscussionThread.lesson_number == lesson_number)
    
    query = query.order_by(
        CourseDiscussionThread.is_pinned.desc(),
        CourseDiscussionThread.last_activity_at.desc()
    )
    
    threads = query.offset(skip).limit(limit).all()
    return threads


@router.get("/discussions/{thread_id}", response_model=CourseDiscussionThreadResponse)
def get_discussion_thread(
    thread_id: int,
    db: Session = Depends(get_db)
):
    thread = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.id == thread_id
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    thread.view_count += 1
    db.commit()
    db.refresh(thread)
    
    return thread


@router.put("/discussions/{thread_id}", response_model=CourseDiscussionThreadResponse)
def update_discussion_thread(
    thread_id: int,
    thread_update: CourseDiscussionThreadUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    thread = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.id == thread_id
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this thread")
    
    if thread.is_locked:
        raise HTTPException(status_code=400, detail="Thread is locked")
    
    update_data = thread_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(thread, field, value)
    
    db.commit()
    db.refresh(thread)
    return thread


@router.delete("/discussions/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discussion_thread(
    thread_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    thread = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.id == thread_id
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this thread")
    
    db.delete(thread)
    db.commit()
    return None


@router.post("/discussions/{thread_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_thread(
    thread_id: int,
    user_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    thread = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.id == thread_id
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    existing_vote = db.query(CourseThreadVote).filter(
        CourseThreadVote.thread_id == thread_id,
        CourseThreadVote.user_id == user_id
    ).first()
    
    if existing_vote:
        db.delete(existing_vote)
        thread.upvote_count = max(0, thread.upvote_count - 1)
        db.commit()
        return {"message": "Vote removed", "upvote_count": thread.upvote_count}
    
    vote = CourseThreadVote(
        institution_id=institution_id,
        thread_id=thread_id,
        user_id=user_id
    )
    
    db.add(vote)
    thread.upvote_count += 1
    db.commit()
    
    return {"message": "Vote added", "upvote_count": thread.upvote_count}


@router.post("/replies", response_model=CourseDiscussionReplyResponse, status_code=status.HTTP_201_CREATED)
def create_reply(
    reply: CourseDiscussionReplyCreate,
    user_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    thread = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.id == reply.thread_id
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread.is_locked:
        raise HTTPException(status_code=400, detail="Thread is locked")
    
    enrollment = db.query(ParentEnrollment).filter(
        ParentEnrollment.course_id == thread.course_id,
        ParentEnrollment.user_id == user_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=400, detail="Must be enrolled to reply")
    
    db_reply = CourseDiscussionReply(
        institution_id=institution_id,
        thread_id=reply.thread_id,
        user_id=user_id,
        parent_reply_id=reply.parent_reply_id,
        content=reply.content
    )
    
    db.add(db_reply)
    thread.reply_count += 1
    thread.last_activity_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_reply)
    
    return db_reply


@router.get("/discussions/{thread_id}/replies", response_model=List[CourseDiscussionReplyResponse])
def list_thread_replies(
    thread_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db)
):
    replies = db.query(CourseDiscussionReply).filter(
        CourseDiscussionReply.thread_id == thread_id
    ).order_by(
        CourseDiscussionReply.is_answer.desc(),
        CourseDiscussionReply.upvote_count.desc(),
        CourseDiscussionReply.created_at.asc()
    ).offset(skip).limit(limit).all()
    
    return replies


@router.put("/replies/{reply_id}", response_model=CourseDiscussionReplyResponse)
def update_reply(
    reply_id: int,
    content: str,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    reply = db.query(CourseDiscussionReply).filter(
        CourseDiscussionReply.id == reply_id
    ).first()
    
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    if reply.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this reply")
    
    reply.content = content
    db.commit()
    db.refresh(reply)
    return reply


@router.delete("/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reply(
    reply_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    reply = db.query(CourseDiscussionReply).filter(
        CourseDiscussionReply.id == reply_id
    ).first()
    
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    if reply.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reply")
    
    thread = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.id == reply.thread_id
    ).first()
    
    if thread:
        thread.reply_count = max(0, thread.reply_count - 1)
    
    db.delete(reply)
    db.commit()
    return None


@router.post("/replies/{reply_id}/vote", status_code=status.HTTP_200_OK)
def vote_on_reply(
    reply_id: int,
    user_id: int = Query(...),
    institution_id: int = Query(...),
    db: Session = Depends(get_db)
):
    reply = db.query(CourseDiscussionReply).filter(
        CourseDiscussionReply.id == reply_id
    ).first()
    
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    existing_vote = db.query(CourseReplyVote).filter(
        CourseReplyVote.reply_id == reply_id,
        CourseReplyVote.user_id == user_id
    ).first()
    
    if existing_vote:
        db.delete(existing_vote)
        reply.upvote_count = max(0, reply.upvote_count - 1)
        db.commit()
        return {"message": "Vote removed", "upvote_count": reply.upvote_count}
    
    vote = CourseReplyVote(
        institution_id=institution_id,
        reply_id=reply_id,
        user_id=user_id
    )
    
    db.add(vote)
    reply.upvote_count += 1
    db.commit()
    
    return {"message": "Vote added", "upvote_count": reply.upvote_count}


@router.post("/replies/{reply_id}/mark-answer", status_code=status.HTTP_200_OK)
def mark_as_answer(
    reply_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    reply = db.query(CourseDiscussionReply).filter(
        CourseDiscussionReply.id == reply_id
    ).first()
    
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    thread = db.query(CourseDiscussionThread).filter(
        CourseDiscussionThread.id == reply.thread_id
    ).first()
    
    if thread.user_id != user_id:
        raise HTTPException(status_code=403, detail="Only thread creator can mark answers")
    
    reply.is_answer = not reply.is_answer
    db.commit()
    
    return {"message": "Answer status updated", "is_answer": reply.is_answer}


def award_badge(
    db: Session,
    enrollment_id: int,
    user_id: int,
    institution_id: int,
    badge_type: CourseBadgeType,
    badge_name: str,
    badge_description: str,
    metadata: dict = None
):
    existing_badge = db.query(ParentCourseBadge).filter(
        ParentCourseBadge.enrollment_id == enrollment_id,
        ParentCourseBadge.badge_type == badge_type,
        ParentCourseBadge.badge_name == badge_name
    ).first()
    
    if existing_badge:
        return existing_badge
    
    badge = ParentCourseBadge(
        institution_id=institution_id,
        enrollment_id=enrollment_id,
        user_id=user_id,
        badge_type=badge_type,
        badge_name=badge_name,
        badge_description=badge_description,
        metadata=metadata
    )
    
    db.add(badge)
    db.commit()
    db.refresh(badge)
    return badge


@router.get("/activities/{enrollment_id}", response_model=List[ParentLearningActivityResponse])
def get_learning_activities(
    enrollment_id: int,
    db: Session = Depends(get_db)
):
    activities = db.query(ParentLearningActivity).filter(
        ParentLearningActivity.enrollment_id == enrollment_id
    ).order_by(ParentLearningActivity.created_at.desc()).all()
    
    return activities
