from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.services.learning_styles_service import LearningStylesService
from src.services.learning_content_recommendation_service import LearningContentRecommendationService
from src.services.adaptive_learning_service import AdaptiveLearningService
from src.schemas.learning_styles import (
    LearningStyleProfileCreate, LearningStyleProfileUpdate, LearningStyleProfileResponse,
    LearningStyleAssessmentCreate, LearningStyleAssessmentResponse,
    AssessmentResponseSubmit, ContentTagCreate, ContentTagUpdate, ContentTagResponse,
    AdaptiveContentRecommendationResponse, PersonalizedContentFeedResponse,
    GenerateRecommendationsRequest, GenerateFeedRequest,
    AdaptiveLearningSessionCreate, AdaptiveLearningSessionResponse,
    PerformanceMetricsUpdate, EngagementMetricsUpdate,
    LearningStyleEffectivenessCreate, LearningStyleEffectivenessResponse,
    EffectivenessAnalyticsResponse, StudentPerformanceTrendResponse,
    ContentDeliveryFormat
)

router = APIRouter(prefix="/learning-styles", tags=["Learning Styles"])


@router.post("/profiles", response_model=LearningStyleProfileResponse)
def create_learning_style_profile(
    profile_data: LearningStyleProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    profile = service.create_profile(profile_data, current_user.institution_id)
    return profile


@router.get("/profiles/{student_id}", response_model=LearningStyleProfileResponse)
def get_learning_style_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    profile = service.get_profile(student_id, current_user.institution_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning style profile not found"
        )
    
    return profile


@router.put("/profiles/{student_id}", response_model=LearningStyleProfileResponse)
def update_learning_style_profile(
    student_id: int,
    profile_data: LearningStyleProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    profile = service.update_profile(student_id, current_user.institution_id, profile_data)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning style profile not found"
        )
    
    return profile


@router.post("/assessments", response_model=LearningStyleAssessmentResponse)
def create_assessment(
    assessment_data: LearningStyleAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    assessment = service.create_assessment(assessment_data, current_user.institution_id)
    return assessment


@router.post("/assessments/{assessment_id}/start", response_model=LearningStyleAssessmentResponse)
def start_assessment(
    assessment_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    assessment = service.start_assessment(assessment_id, student_id)
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    return assessment


@router.post("/assessments/submit", response_model=LearningStyleAssessmentResponse)
def submit_assessment(
    submission: AssessmentResponseSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    student_id = current_user.student_profile.id if current_user.student_profile else None
    
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )
    
    assessment = service.submit_assessment(submission, student_id)
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    return assessment


@router.get("/assessments/student/{student_id}", response_model=List[LearningStyleAssessmentResponse])
def get_student_assessments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    assessments = service.get_student_assessments(student_id, current_user.institution_id)
    return assessments


@router.post("/content-tags", response_model=ContentTagResponse)
def create_content_tag(
    tag_data: ContentTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.create_content_tag(tag_data, current_user.institution_id, current_user.id)
    return tag


@router.put("/content-tags/{content_type}/{content_id}", response_model=ContentTagResponse)
def update_content_tag(
    content_type: str,
    content_id: int,
    tag_data: ContentTagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.update_content_tag(content_type, content_id, tag_data)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content tag not found"
        )
    
    return tag


@router.get("/content-tags/{content_type}/{content_id}", response_model=ContentTagResponse)
def get_content_tag(
    content_type: str,
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.get_content_tag(content_type, content_id)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content tag not found"
        )
    
    return tag


@router.post("/content-tags/{content_type}/{content_id}/auto-tag", response_model=ContentTagResponse)
def auto_tag_content(
    content_type: str,
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningStylesService(db)
    tag = service.auto_tag_content(content_type, content_id, current_user.institution_id)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to auto-tag content"
        )
    
    return tag


@router.post("/recommendations/generate", response_model=List[AdaptiveContentRecommendationResponse])
def generate_recommendations(
    request: GenerateRecommendationsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    recommendations = service.generate_recommendations(
        student_id=request.student_id,
        institution_id=current_user.institution_id,
        subject_id=request.subject_id,
        chapter_id=request.chapter_id,
        topic_id=request.topic_id,
        limit=request.limit
    )
    return recommendations


@router.post("/feed/generate", response_model=List[PersonalizedContentFeedResponse])
def generate_personalized_feed(
    request: GenerateFeedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    feed = service.generate_personalized_feed(
        student_id=request.student_id,
        institution_id=current_user.institution_id,
        subject_id=request.subject_id,
        limit=request.limit
    )
    return feed


@router.get("/feed/{student_id}", response_model=List[PersonalizedContentFeedResponse])
def get_personalized_feed(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    feed = service.get_active_feed(student_id, current_user.institution_id)
    return feed


@router.post("/feed/{feed_id}/interact")
def record_feed_interaction(
    feed_id: int,
    time_spent_seconds: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.student_profile.id if current_user.student_profile else None
    
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a student profile"
        )
    
    service = LearningContentRecommendationService(db)
    service.record_feed_interaction(feed_id, student_id, time_spent_seconds)
    
    return {"message": "Interaction recorded successfully"}


@router.get("/recommendations/effectiveness/{student_id}")
def get_recommendation_effectiveness(
    student_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = LearningContentRecommendationService(db)
    effectiveness = service.get_recommendation_effectiveness(
        student_id, current_user.institution_id, days
    )
    return effectiveness


@router.post("/adaptive-sessions", response_model=AdaptiveLearningSessionResponse)
def create_adaptive_session(
    session_data: AdaptiveLearningSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    session = service.create_learning_session(
        student_id=session_data.student_id,
        institution_id=current_user.institution_id,
        content_type=session_data.content_type,
        content_id=session_data.content_id,
        initial_format=session_data.initial_format,
        initial_difficulty=session_data.initial_difficulty
    )
    return session


@router.post("/adaptive-sessions/{session_id}/adjust-difficulty")
def adjust_session_difficulty(
    session_id: int,
    performance_metrics: PerformanceMetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    result = service.adjust_content_difficulty(
        session_id=session_id,
        performance_metrics=performance_metrics.model_dump()
    )
    return result


@router.post("/adaptive-sessions/{session_id}/adjust-format")
def adjust_session_format(
    session_id: int,
    engagement_metrics: EngagementMetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    result = service.adjust_content_format(
        session_id=session_id,
        engagement_metrics=engagement_metrics.model_dump()
    )
    return result


@router.post("/adaptive-sessions/{session_id}/real-time-adjust")
def get_real_time_adjustments(
    session_id: int,
    performance_metrics: PerformanceMetricsUpdate,
    engagement_metrics: EngagementMetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    adjustments = service.get_real_time_adjustments(
        session_id=session_id,
        performance_metrics=performance_metrics.model_dump(),
        engagement_metrics=engagement_metrics.model_dump()
    )
    return adjustments


@router.post("/adaptive-sessions/{session_id}/update-performance")
def update_session_performance(
    session_id: int,
    performance_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    service.update_session_performance(session_id, performance_data)
    return {"message": "Performance data updated successfully"}


@router.post("/adaptive-sessions/{session_id}/end", response_model=AdaptiveLearningSessionResponse)
def end_adaptive_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    session = service.end_learning_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session


@router.get("/adaptive-sessions/performance-trend/{student_id}", response_model=StudentPerformanceTrendResponse)
def get_performance_trend(
    student_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    trend = service.get_student_performance_trend(
        student_id, current_user.institution_id, days
    )
    return trend


@router.post("/effectiveness", response_model=LearningStyleEffectivenessResponse)
def record_effectiveness(
    effectiveness_data: LearningStyleEffectivenessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    effectiveness = service.record_effectiveness(
        student_id=effectiveness_data.student_id,
        institution_id=current_user.institution_id,
        content_type=effectiveness_data.content_type,
        content_id=effectiveness_data.content_id,
        delivery_format=effectiveness_data.delivery_format,
        metrics=effectiveness_data.model_dump()
    )
    return effectiveness


@router.get("/effectiveness/analysis/{student_id}")
def get_format_effectiveness_analysis(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AdaptiveLearningService(db)
    analysis = service.get_format_effectiveness_analysis(
        student_id, current_user.institution_id
    )
    return analysis


@router.get("/analytics/effectiveness/{student_id}", response_model=EffectivenessAnalyticsResponse)
def get_effectiveness_analytics(
    student_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from src.models.learning_styles import LearningStyleEffectiveness
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    effectiveness_records = db.query(LearningStyleEffectiveness).filter(
        and_(
            LearningStyleEffectiveness.student_id == student_id,
            LearningStyleEffectiveness.institution_id == current_user.institution_id,
            LearningStyleEffectiveness.created_at >= cutoff_date
        )
    ).all()
    
    by_format = {}
    by_learning_style = {}
    
    for record in effectiveness_records:
        fmt = record.delivery_format.value
        if fmt not in by_format:
            by_format[fmt] = {
                "count": 0,
                "avg_engagement": 0,
                "avg_improvement": 0,
                "total_time": 0
            }
        
        by_format[fmt]["count"] += 1
        by_format[fmt]["avg_engagement"] += float(record.engagement_score or 0)
        by_format[fmt]["avg_improvement"] += float(record.improvement or 0)
        by_format[fmt]["total_time"] += record.time_spent_seconds
    
    for fmt in by_format:
        count = by_format[fmt]["count"]
        by_format[fmt]["avg_engagement"] = round(by_format[fmt]["avg_engagement"] / count, 2)
        by_format[fmt]["avg_improvement"] = round(by_format[fmt]["avg_improvement"] / count, 2)
        by_format[fmt]["avg_time"] = round(by_format[fmt]["total_time"] / count, 2)
    
    total_records = len(effectiveness_records)
    overall_engagement = sum(float(r.engagement_score or 0) for r in effectiveness_records)
    overall_improvement = sum(float(r.improvement or 0) for r in effectiveness_records if r.improvement)
    
    overall_metrics = {
        "total_records": total_records,
        "avg_engagement": round(overall_engagement / total_records, 2) if total_records > 0 else 0,
        "avg_improvement": round(overall_improvement / len([r for r in effectiveness_records if r.improvement]), 2) if any(r.improvement for r in effectiveness_records) else 0
    }
    
    recommendations = []
    if by_format:
        best_format = max(by_format.items(), key=lambda x: x[1]["avg_engagement"])[0]
        recommendations.append(f"Focus on {best_format} format for better engagement")
    
    return EffectivenessAnalyticsResponse(
        total_records=total_records,
        by_format=by_format,
        by_learning_style=by_learning_style,
        overall_metrics=overall_metrics,
        recommendations=recommendations
    )


@router.get("/default-assessment-questions")
def get_default_assessment_questions():
    questions = [
        {
            "id": 1,
            "question_text": "When learning something new, I prefer to:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "Watch a video or demonstration"},
                {"id": "b", "text": "Listen to someone explain it"},
                {"id": "c", "text": "Try it out hands-on"},
                {"id": "d", "text": "Read about it"}
            ],
            "style_weights": {
                "a": {"visual": 1.0},
                "b": {"auditory": 1.0},
                "c": {"kinesthetic": 1.0},
                "d": {"reading_writing": 1.0}
            }
        },
        {
            "id": 2,
            "question_text": "I remember things best when I:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "See pictures or diagrams"},
                {"id": "b", "text": "Hear them explained"},
                {"id": "c", "text": "Do them myself"},
                {"id": "d", "text": "Write them down"}
            ],
            "style_weights": {
                "a": {"visual": 1.0},
                "b": {"auditory": 1.0},
                "c": {"kinesthetic": 1.0},
                "d": {"reading_writing": 1.0}
            }
        },
        {
            "id": 3,
            "question_text": "When studying, I prefer to:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "Study alone"},
                {"id": "b", "text": "Study with others"}
            ],
            "style_weights": {
                "a": {"social": 0.0},
                "b": {"social": 1.0}
            }
        },
        {
            "id": 4,
            "question_text": "I learn best when information is presented:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "Step by step in order"},
                {"id": "b", "text": "As a big picture overview"}
            ],
            "style_weights": {
                "a": {"sequential": 1.0},
                "b": {"sequential": 0.0}
            }
        },
        {
            "id": 5,
            "question_text": "When given directions, I prefer:",
            "question_type": "multiple_choice",
            "options": [
                {"id": "a", "text": "A map or diagram"},
                {"id": "b", "text": "Verbal instructions"},
                {"id": "c", "text": "To follow someone"},
                {"id": "d", "text": "Written directions"}
            ],
            "style_weights": {
                "a": {"visual": 1.0},
                "b": {"auditory": 1.0},
                "c": {"kinesthetic": 1.0},
                "d": {"reading_writing": 1.0}
            }
        }
    ]
    
    return {"questions": questions}


@router.get("/questions")
def get_assessment_questions():
    """Get enhanced assessment questions with scenarios, preferences, and cognitive tasks"""
    questions = [
        {
            "id": 1,
            "type": "scenario",
            "category": "visual",
            "question": "How would you prefer to learn about this topic?",
            "scenario": "You need to learn how to assemble a new piece of furniture.",
            "options": [
                {"id": "a", "text": "Watch a step-by-step video tutorial", "value": 100, "category": "visual"},
                {"id": "b", "text": "Listen to audio instructions", "value": 100, "category": "auditory"},
                {"id": "c", "text": "Follow written manual with diagrams", "value": 100, "category": "reading_writing"},
                {"id": "d", "text": "Try assembling it by experimenting", "value": 100, "category": "kinesthetic"}
            ]
        },
        {
            "id": 2,
            "type": "preference",
            "category": "visual",
            "question": "Rate your preference for learning methods",
            "sliderConfig": {
                "min": 0,
                "max": 100,
                "leftLabel": "Visual (Charts/Videos)",
                "rightLabel": "Auditory (Discussion/Audio)",
                "categories": [
                    {"position": 0, "category": "visual"},
                    {"position": 100, "category": "auditory"}
                ]
            }
        },
        {
            "id": 3,
            "type": "cognitive",
            "category": "visual",
            "question": "Complete this pattern recognition task",
            "cognitiveTask": {
                "taskType": "pattern_recognition",
                "data": {},
                "timeLimit": 60
            }
        },
        {
            "id": 4,
            "type": "scenario",
            "category": "auditory",
            "question": "When studying for an exam, what helps you most?",
            "scenario": "You have an important test tomorrow and need to review the material.",
            "options": [
                {"id": "a", "text": "Create colorful flashcards and mind maps", "value": 100, "category": "visual"},
                {"id": "b", "text": "Explain concepts out loud or discuss with others", "value": 100, "category": "auditory"},
                {"id": "c", "text": "Write detailed notes and summaries", "value": 100, "category": "reading_writing"},
                {"id": "d", "text": "Practice with hands-on examples", "value": 100, "category": "kinesthetic"}
            ]
        },
        {
            "id": 5,
            "type": "preference",
            "category": "kinesthetic",
            "question": "Rate your comfort with different study materials",
            "sliderConfig": {
                "min": 0,
                "max": 100,
                "leftLabel": "Hands-on/Active",
                "rightLabel": "Reading/Writing",
                "categories": [
                    {"position": 0, "category": "kinesthetic"},
                    {"position": 100, "category": "reading_writing"}
                ]
            }
        },
        {
            "id": 6,
            "type": "cognitive",
            "category": "auditory",
            "question": "Complete this memory recall task",
            "cognitiveTask": {
                "taskType": "memory_recall",
                "data": {},
                "timeLimit": 60
            }
        },
        {
            "id": 7,
            "type": "scenario",
            "category": "reading_writing",
            "question": "How do you prefer to take notes during class?",
            "scenario": "Your teacher is explaining a new concept in class.",
            "options": [
                {"id": "a", "text": "Draw diagrams and use highlighters", "value": 100, "category": "visual"},
                {"id": "b", "text": "Record the lecture to listen later", "value": 100, "category": "auditory"},
                {"id": "c", "text": "Write detailed notes in your own words", "value": 100, "category": "reading_writing"},
                {"id": "d", "text": "Prefer live demonstrations", "value": 100, "category": "kinesthetic"}
            ]
        },
        {
            "id": 8,
            "type": "cognitive",
            "category": "kinesthetic",
            "question": "Complete this spatial reasoning task",
            "cognitiveTask": {
                "taskType": "spatial_reasoning",
                "data": {},
                "timeLimit": 60
            }
        }
    ]
    return questions


@router.post("/students/{student_id}/assessment")
def submit_student_assessment(
    student_id: int,
    answers: List[Dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit assessment answers and generate learning style profile"""
    # Calculate scores from answers
    scores = {
        "visual": 0,
        "auditory": 0,
        "kinesthetic": 0,
        "reading_writing": 0
    }
    
    for answer in answers:
        if "category_impact" in answer:
            for category, score in answer["category_impact"].items():
                if category in scores:
                    scores[category] += score
    
    # Normalize scores to a 0-1 fraction (visual_score/etc. are Numeric(5, 4)
    # columns constrained to the 0-1 range, matching
    # LearningStyleProfileBase's Field(ge=0, le=1) in the schema and the
    # normalization LearningStylesService._calculate_assessment_scores does
    # for the other scoring path -- NOT a 0-100 percentage, which overflows
    # Numeric(5, 4) (max 9.9999) on every non-trivial score and 500s.
    total = sum(scores.values())
    if total > 0:
        scores = {k: (v / total) for k, v in scores.items()}
    
    # Determine primary and secondary styles
    sorted_styles = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary_style = sorted_styles[0][0]
    secondary_style = sorted_styles[1][0] if len(sorted_styles) > 1 else None
    
    # Create or update profile
    from src.models.learning_styles import LearningStyleProfile
    
    profile = db.query(LearningStyleProfile).filter(
        LearningStyleProfile.student_id == student_id
    ).first()
    
    if profile:
        profile.visual_score = scores["visual"]
        profile.auditory_score = scores["auditory"]
        profile.kinesthetic_score = scores["kinesthetic"]
        profile.reading_writing_score = scores["reading_writing"]
        profile.primary_style = primary_style
        profile.secondary_style = secondary_style
        profile.completed_at = datetime.utcnow()
        profile.updated_at = datetime.utcnow()
    else:
        profile = LearningStyleProfile(
            student_id=student_id,
            institution_id=current_user.institution_id,
            visual_score=scores["visual"],
            auditory_score=scores["auditory"],
            kinesthetic_score=scores["kinesthetic"],
            reading_writing_score=scores["reading_writing"],
            primary_style=primary_style,
            secondary_style=secondary_style,
            preferences={
                "preferred_formats": _get_preferred_formats(primary_style),
                "study_environment": _get_study_environment(primary_style),
                "interaction_preference": _get_interaction_preference(primary_style)
            },
            completed_at=datetime.utcnow()
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    
    return profile


@router.get("/students/{student_id}/content")
def get_student_adaptive_content(
    student_id: int,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get adaptive content recommendations for student"""
    # Mock data - in production, would query from database
    content = [
        {
            "id": 1,
            "title": "Introduction to Algebra",
            "description": "Learn the basics of algebraic expressions and equations",
            "subject": "Mathematics",
            "topic": "Algebra",
            "formats": {
                "video": {"id": "v1", "url": "/content/video/1", "duration": 15, "type": "video"},
                "article": {"id": "a1", "url": "/content/article/1", "pages": 5, "type": "article"},
                "audio": {"id": "au1", "url": "/content/audio/1", "duration": 12, "type": "audio"},
                "activity": {"id": "ac1", "url": "/content/activity/1", "type": "activity"}
            },
            "recommended_for": ["visual", "reading_writing"],
            "difficulty_level": 1,
            "estimated_time": 30,
            "tags": ["algebra", "mathematics", "beginner"],
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": 2,
            "title": "Photosynthesis Process",
            "description": "Understanding how plants convert light into energy",
            "subject": "Science",
            "topic": "Biology",
            "formats": {
                "video": {"id": "v2", "url": "/content/video/2", "duration": 20, "type": "video"},
                "activity": {"id": "ac2", "url": "/content/activity/2", "type": "activity"}
            },
            "recommended_for": ["visual", "kinesthetic"],
            "difficulty_level": 2,
            "estimated_time": 45,
            "tags": ["biology", "plants", "science"],
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    # Filter by parameters
    if subject:
        content = [c for c in content if c["subject"] == subject]
    if topic:
        content = [c for c in content if c["topic"] == topic]
    if difficulty:
        content = [c for c in content if c["difficulty_level"] == difficulty]
    
    return content


@router.get("/students/{student_id}/effectiveness")
def get_student_content_effectiveness(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get content effectiveness tracking for student"""
    # Mock data - in production, would query from database
    effectiveness = [
        {
            "student_id": student_id,
            "content_id": 1,
            "format": "video",
            "completion_rate": 85,
            "time_spent": 1200,
            "quiz_score": 90,
            "engagement_score": 88,
            "last_accessed": datetime.utcnow().isoformat()
        },
        {
            "student_id": student_id,
            "content_id": 1,
            "format": "article",
            "completion_rate": 70,
            "time_spent": 900,
            "quiz_score": 75,
            "engagement_score": 65,
            "last_accessed": datetime.utcnow().isoformat()
        }
    ]
    return effectiveness


@router.get("/classes/{class_id}/distribution")
def get_class_learning_style_distribution(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get learning style distribution for a class"""
    # Mock data - in production, would query from database
    distribution = {
        "class_id": class_id,
        "class_name": "Class 10-A",
        "total_students": 30,
        "distribution": {
            "visual": 12,
            "auditory": 8,
            "kinesthetic": 6,
            "reading_writing": 4
        },
        "recommendations": [
            "Use a mix of visual aids (diagrams, videos) to reach the majority of students",
            "Incorporate discussions and audio materials for auditory learners",
            "Include hands-on activities and experiments for kinesthetic learners",
            "Provide written materials and encourage note-taking for reading/writing learners",
            "Consider rotating teaching methods to engage all learning styles"
        ]
    }
    return distribution


@router.get("/students/{student_id}/parent-guide")
def get_parent_learning_guide(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get parent guide for student's learning style"""
    from src.models.learning_styles import LearningStyleProfile
    
    profile = db.query(LearningStyleProfile).filter(
        LearningStyleProfile.student_id == student_id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning style profile not found"
        )
    
    guide = {
        "student_id": student_id,
        "student_name": "Student Name",  # Would fetch from student model
        "primary_style": profile.primary_style,
        "secondary_style": profile.secondary_style,
        "strengths": _get_strengths(profile.primary_style),
        "challenges": _get_challenges(profile.primary_style),
        "home_strategies": _get_home_strategies(profile.primary_style),
        "environment_setup": _get_environment_setup(profile.primary_style),
        "communication_tips": _get_communication_tips(profile.primary_style)
    }
    
    return guide


@router.get("/study-tips/{learning_style}")
def get_study_tips_for_style(
    learning_style: str,
    db: Session = Depends(get_db)
):
    """Get study tips for a specific learning style"""
    all_tips = {
        "visual": [
            {
                "id": 1,
                "learning_style": "visual",
                "category": "Study Techniques",
                "title": "Use Color Coding",
                "description": "Organize your notes with different colors for different topics or concepts",
                "examples": ["Highlighters for key points", "Colored pens for categories", "Mind maps with colors"]
            },
            {
                "id": 2,
                "learning_style": "visual",
                "category": "Study Materials",
                "title": "Create Visual Aids",
                "description": "Make diagrams, charts, and infographics to visualize information",
                "examples": ["Flowcharts", "Concept maps", "Timelines"]
            }
        ],
        "auditory": [
            {
                "id": 3,
                "learning_style": "auditory",
                "category": "Study Techniques",
                "title": "Read Aloud",
                "description": "Speak concepts out loud to reinforce learning",
                "examples": ["Record yourself explaining topics", "Discuss with study groups", "Use text-to-speech"]
            }
        ],
        "kinesthetic": [
            {
                "id": 4,
                "learning_style": "kinesthetic",
                "category": "Study Techniques",
                "title": "Hands-On Practice",
                "description": "Learn by doing and experimenting",
                "examples": ["Lab experiments", "Building models", "Role-playing scenarios"]
            }
        ],
        "reading_writing": [
            {
                "id": 5,
                "learning_style": "reading_writing",
                "category": "Study Techniques",
                "title": "Take Detailed Notes",
                "description": "Write comprehensive notes in your own words",
                "examples": ["Cornell note-taking", "Summaries", "Outlines"]
            }
        ]
    }
    
    if learning_style == "all":
        return [tip for tips in all_tips.values() for tip in tips]
    
    return all_tips.get(learning_style, [])


def _get_preferred_formats(style: str) -> List[str]:
    formats = {
        "visual": ["video", "article"],
        "auditory": ["audio", "video"],
        "kinesthetic": ["activity", "video"],
        "reading_writing": ["article", "audio"]
    }
    return formats.get(style, ["video"])


def _get_study_environment(style: str) -> str:
    envs = {
        "visual": "Bright, organized space with minimal clutter",
        "auditory": "Quiet or with background music, good for discussions",
        "kinesthetic": "Space to move around, hands-on materials available",
        "reading_writing": "Quiet library-like setting with writing materials"
    }
    return envs.get(style, "Comfortable and focused environment")


def _get_interaction_preference(style: str) -> str:
    prefs = {
        "visual": "Visual demonstrations and presentations",
        "auditory": "Group discussions and verbal explanations",
        "kinesthetic": "Interactive activities and experiments",
        "reading_writing": "Independent reading and written assignments"
    }
    return prefs.get(style, "Varied learning interactions")


def _get_strengths(style: str) -> List[str]:
    strengths = {
        "visual": [
            "Good at remembering faces and places",
            "Strong spatial awareness",
            "Excellent at reading body language",
            "Can visualize concepts easily"
        ],
        "auditory": [
            "Good listening skills",
            "Strong verbal communication",
            "Remembers conversations well",
            "Learns well from discussions"
        ],
        "kinesthetic": [
            "Excellent hand-eye coordination",
            "Learns by doing",
            "Good at physical activities",
            "Practical problem solver"
        ],
        "reading_writing": [
            "Strong written communication",
            "Good at research",
            "Organized note-taker",
            "Learns well from reading"
        ]
    }
    return strengths.get(style, [])


def _get_challenges(style: str) -> List[str]:
    challenges = {
        "visual": [
            "May struggle with verbal-only instructions",
            "Can be distracted by visual clutter",
            "May need to see something to understand it"
        ],
        "auditory": [
            "May struggle with silent reading",
            "Can be distracted by noise",
            "May need to hear things to remember them"
        ],
        "kinesthetic": [
            "May find it hard to sit still for long periods",
            "Can struggle with abstract concepts",
            "May need hands-on experience to understand"
        ],
        "reading_writing": [
            "May struggle with oral presentations",
            "Can miss visual cues",
            "May prefer working alone"
        ]
    }
    return challenges.get(style, [])


def _get_home_strategies(style: str) -> List[Dict[str, Any]]:
    strategies = {
        "visual": [
            {
                "category": "Study Materials",
                "strategies": [
                    "Create colorful flashcards",
                    "Use highlighters and colored pens",
                    "Draw diagrams and mind maps",
                    "Watch educational videos"
                ]
            },
            {
                "category": "Study Techniques",
                "strategies": [
                    "Use visual timers",
                    "Create visual study schedules",
                    "Use posters and charts",
                    "Take breaks to look at nature"
                ]
            }
        ],
        "auditory": [
            {
                "category": "Study Materials",
                "strategies": [
                    "Record lectures and lessons",
                    "Use audio books",
                    "Create verbal mnemonics",
                    "Discuss topics with family"
                ]
            },
            {
                "category": "Study Techniques",
                "strategies": [
                    "Read aloud while studying",
                    "Use music for memorization",
                    "Explain concepts verbally",
                    "Join study groups"
                ]
            }
        ],
        "kinesthetic": [
            {
                "category": "Study Materials",
                "strategies": [
                    "Use manipulatives and models",
                    "Create hands-on projects",
                    "Use physical flashcards",
                    "Build or draw concepts"
                ]
            },
            {
                "category": "Study Techniques",
                "strategies": [
                    "Take frequent movement breaks",
                    "Study while walking",
                    "Use gestures to remember",
                    "Practice with real objects"
                ]
            }
        ],
        "reading_writing": [
            {
                "category": "Study Materials",
                "strategies": [
                    "Keep detailed notebooks",
                    "Use textbooks and guides",
                    "Create written summaries",
                    "Make lists and outlines"
                ]
            },
            {
                "category": "Study Techniques",
                "strategies": [
                    "Rewrite notes in own words",
                    "Create study guides",
                    "Write practice essays",
                    "Keep a learning journal"
                ]
            }
        ]
    }
    return strategies.get(style, [])


def _get_environment_setup(style: str) -> Dict[str, Any]:
    setups = {
        "visual": {
            "lighting": "Bright, natural lighting preferred",
            "noise": "Quiet environment, minimal auditory distractions",
            "workspace": "Clean, organized desk with visual aids on walls",
            "materials": ["Colored pens", "Highlighters", "Charts", "Whiteboards"]
        },
        "auditory": {
            "lighting": "Moderate lighting, not too bright",
            "noise": "Can work with background music or sounds",
            "workspace": "Comfortable space for discussion and verbal practice",
            "materials": ["Audio recorder", "Headphones", "Music player"]
        },
        "kinesthetic": {
            "lighting": "Good lighting for activities",
            "noise": "Some background noise okay",
            "workspace": "Open space with room to move",
            "materials": ["Manipulatives", "Models", "Building tools", "Stress balls"]
        },
        "reading_writing": {
            "lighting": "Good reading light",
            "noise": "Very quiet, library-like",
            "workspace": "Comfortable desk with plenty of writing space",
            "materials": ["Notebooks", "Pens", "Reference books", "Computer"]
        }
    }
    return setups.get(style, {})


def _get_communication_tips(style: str) -> List[str]:
    tips = {
        "visual": [
            "Show examples when explaining",
            "Use visual demonstrations",
            "Draw pictures or diagrams together",
            "Watch educational content together"
        ],
        "auditory": [
            "Have verbal discussions",
            "Listen to their explanations",
            "Use storytelling",
            "Discuss topics during car rides"
        ],
        "kinesthetic": [
            "Do activities together",
            "Use real-world examples",
            "Encourage movement while talking",
            "Practice concepts through action"
        ],
        "reading_writing": [
            "Exchange written notes",
            "Encourage journaling",
            "Read together",
            "Provide written instructions"
        ]
    }
    return tips.get(style, [])
