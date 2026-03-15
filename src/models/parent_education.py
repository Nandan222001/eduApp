from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import relationship
from enum import Enum
from src.database import Base


class CourseCategory(str, Enum):
    CHILD_DEVELOPMENT = "child_development"
    HOMEWORK_HELP_SKILLS = "homework_help_skills"
    TECHNOLOGY_LITERACY = "technology_literacy"
    COLLEGE_PREP_101 = "college_prep_101"
    SPECIAL_EDUCATION = "special_education"
    MENTAL_HEALTH_AWARENESS = "mental_health_awareness"


class EnrollmentStatus(str, Enum):
    ENROLLED = "enrolled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DROPPED = "dropped"


class CourseBadgeType(str, Enum):
    COURSE_COMPLETION = "course_completion"
    QUIZ_MASTER = "quiz_master"
    ACTIVE_PARTICIPANT = "active_participant"
    CATEGORY_EXPERT = "category_expert"
    STREAK_LEARNER = "streak_learner"


class ParentCourse(Base):
    __tablename__ = "parent_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    course_title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(CourseCategory), nullable=False, index=True)
    thumbnail_url = Column(String(1000), nullable=True)
    instructor_name = Column(String(200), nullable=True)
    instructor_bio = Column(Text, nullable=True)
    instructor_avatar_url = Column(String(1000), nullable=True)
    
    lessons = Column(JSON, nullable=False)
    
    total_duration_minutes = Column(Integer, default=0, nullable=False)
    lesson_count = Column(Integer, default=0, nullable=False)
    enrollment_count = Column(Integer, default=0, nullable=False)
    completion_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    
    is_published = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    prerequisites = Column(JSON, nullable=True)
    learning_objectives = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    enrollments = relationship("ParentEnrollment", back_populates="course", cascade="all, delete-orphan")
    forums = relationship("CourseDiscussionThread", back_populates="course", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_parent_course_institution', 'institution_id'),
        Index('idx_parent_course_category', 'category'),
        Index('idx_parent_course_published', 'is_published'),
        Index('idx_parent_course_featured', 'is_featured'),
        Index('idx_parent_course_created', 'created_at'),
    )


class ParentEnrollment(Base):
    __tablename__ = "parent_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey('parent_courses.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED, nullable=False, index=True)
    progress_percentage = Column(Float, default=0.0, nullable=False)
    
    completed_lessons = Column(JSON, default=list, nullable=False)
    quiz_scores = Column(JSON, default=dict, nullable=False)
    
    total_time_spent_minutes = Column(Integer, default=0, nullable=False)
    last_accessed_lesson = Column(Integer, nullable=True)
    last_accessed_at = Column(DateTime, nullable=True)
    
    certificate_earned = Column(Boolean, default=False, nullable=False)
    certificate_url = Column(String(1000), nullable=True)
    completion_date = Column(DateTime, nullable=True)
    
    rating = Column(Integer, nullable=True)
    review = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    course = relationship("ParentCourse", back_populates="enrollments")
    user = relationship("User")
    badges = relationship("ParentCourseBadge", back_populates="enrollment", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('course_id', 'user_id', name='uq_course_user_enrollment'),
        Index('idx_parent_enrollment_institution', 'institution_id'),
        Index('idx_parent_enrollment_course', 'course_id'),
        Index('idx_parent_enrollment_user', 'user_id'),
        Index('idx_parent_enrollment_status', 'status'),
        Index('idx_parent_enrollment_certificate', 'certificate_earned'),
        Index('idx_parent_enrollment_enrolled', 'enrolled_at'),
    )


class ParentCourseBadge(Base):
    __tablename__ = "parent_course_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    enrollment_id = Column(Integer, ForeignKey('parent_enrollments.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    badge_type = Column(SQLEnum(CourseBadgeType), nullable=False, index=True)
    badge_name = Column(String(200), nullable=False)
    badge_description = Column(Text, nullable=True)
    badge_icon_url = Column(String(1000), nullable=True)
    
    metadata = Column(JSON, nullable=True)
    
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    enrollment = relationship("ParentEnrollment", back_populates="badges")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_course_badge_institution', 'institution_id'),
        Index('idx_course_badge_enrollment', 'enrollment_id'),
        Index('idx_course_badge_user', 'user_id'),
        Index('idx_course_badge_type', 'badge_type'),
        Index('idx_course_badge_earned', 'earned_at'),
    )


class CourseDiscussionThread(Base):
    __tablename__ = "course_discussion_threads"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey('parent_courses.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    
    lesson_number = Column(Integer, nullable=True, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    
    view_count = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    upvote_count = Column(Integer, default=0, nullable=False)
    
    tags = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    course = relationship("ParentCourse", back_populates="forums")
    user = relationship("User")
    replies = relationship("CourseDiscussionReply", back_populates="thread", cascade="all, delete-orphan")
    votes = relationship("CourseThreadVote", back_populates="thread", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_discussion_thread_institution', 'institution_id'),
        Index('idx_discussion_thread_course', 'course_id'),
        Index('idx_discussion_thread_user', 'user_id'),
        Index('idx_discussion_thread_lesson', 'lesson_number'),
        Index('idx_discussion_thread_pinned', 'is_pinned'),
        Index('idx_discussion_thread_created', 'created_at'),
        Index('idx_discussion_thread_activity', 'last_activity_at'),
    )


class CourseDiscussionReply(Base):
    __tablename__ = "course_discussion_replies"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    thread_id = Column(Integer, ForeignKey('course_discussion_threads.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_reply_id = Column(Integer, ForeignKey('course_discussion_replies.id', ondelete='CASCADE'), nullable=True, index=True)
    
    content = Column(Text, nullable=False)
    
    is_instructor_reply = Column(Boolean, default=False, nullable=False)
    is_answer = Column(Boolean, default=False, nullable=False)
    upvote_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    thread = relationship("CourseDiscussionThread", back_populates="replies")
    user = relationship("User")
    parent_reply = relationship("CourseDiscussionReply", remote_side=[id], backref="child_replies")
    votes = relationship("CourseReplyVote", back_populates="reply", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_discussion_reply_institution', 'institution_id'),
        Index('idx_discussion_reply_thread', 'thread_id'),
        Index('idx_discussion_reply_user', 'user_id'),
        Index('idx_discussion_reply_parent', 'parent_reply_id'),
        Index('idx_discussion_reply_created', 'created_at'),
        Index('idx_discussion_reply_answer', 'is_answer'),
    )


class CourseThreadVote(Base):
    __tablename__ = "course_thread_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    thread_id = Column(Integer, ForeignKey('course_discussion_threads.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    thread = relationship("CourseDiscussionThread", back_populates="votes")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('thread_id', 'user_id', name='uq_thread_user_vote'),
        Index('idx_thread_vote_institution', 'institution_id'),
        Index('idx_thread_vote_thread', 'thread_id'),
        Index('idx_thread_vote_user', 'user_id'),
    )


class CourseReplyVote(Base):
    __tablename__ = "course_reply_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    reply_id = Column(Integer, ForeignKey('course_discussion_replies.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    reply = relationship("CourseDiscussionReply", back_populates="votes")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('reply_id', 'user_id', name='uq_reply_user_vote'),
        Index('idx_reply_vote_institution', 'institution_id'),
        Index('idx_reply_vote_reply', 'reply_id'),
        Index('idx_reply_vote_user', 'user_id'),
    )


class ParentLearningActivity(Base):
    __tablename__ = "parent_learning_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True)
    enrollment_id = Column(Integer, ForeignKey('parent_enrollments.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey('parent_courses.id', ondelete='CASCADE'), nullable=False, index=True)
    
    lesson_number = Column(Integer, nullable=False)
    activity_type = Column(String(50), nullable=False)
    
    time_spent_minutes = Column(Integer, default=0, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    
    metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    institution = relationship("Institution")
    enrollment = relationship("ParentEnrollment")
    user = relationship("User")
    course = relationship("ParentCourse")
    
    __table_args__ = (
        Index('idx_learning_activity_institution', 'institution_id'),
        Index('idx_learning_activity_enrollment', 'enrollment_id'),
        Index('idx_learning_activity_user', 'user_id'),
        Index('idx_learning_activity_course', 'course_id'),
        Index('idx_learning_activity_lesson', 'lesson_number'),
        Index('idx_learning_activity_type', 'activity_type'),
        Index('idx_learning_activity_created', 'created_at'),
    )
