from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.services.weakness_detection_service import (
    WeaknessDetectionEngine,
    ChapterPerformanceAnalyzer,
    SmartQuestionRecommender,
    FocusAreaPrioritizer,
    PersonalizedInsightGenerator
)
from src.schemas.weakness_detection import (
    ChapterPerformanceResponse,
    QuestionRecommendationResponse,
    QuestionRecommendationUpdate,
    FocusAreaResponse,
    FocusAreaUpdate,
    PersonalizedInsightResponse,
    PersonalizedInsightUpdate,
    AnalysisRequest,
    ComprehensiveAnalysisResponse,
    RecommendationListRequest,
    FocusAreaListRequest,
    InsightListRequest
)
from src.models.study_planner import (
    ChapterPerformance,
    QuestionRecommendation,
    FocusArea,
    PersonalizedInsight
)

router = APIRouter(prefix="/weakness-detection", tags=["Weakness Detection"])


@router.post("/analyze", response_model=ComprehensiveAnalysisResponse)
def run_comprehensive_analysis(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    engine = WeaknessDetectionEngine(db)
    
    result = engine.run_comprehensive_analysis(
        institution_id=current_user.institution_id,
        student_id=request.student_id,
        target_exam_date=request.target_exam_date,
        generate_recommendations=request.generate_recommendations
    )
    
    return ComprehensiveAnalysisResponse(
        summary=result['summary'],
        chapter_performances=[
            ChapterPerformanceResponse.model_validate(cp) 
            for cp in result['chapter_performances']
        ],
        weak_areas=result['weak_areas'],
        focus_areas=[
            FocusAreaResponse.model_validate(fa) 
            for fa in result['focus_areas']
        ],
        question_recommendations=[
            QuestionRecommendationResponse.model_validate(qr) 
            for qr in result['question_recommendations']
        ],
        personalized_insights=[
            PersonalizedInsightResponse.model_validate(pi) 
            for pi in result['personalized_insights']
        ]
    )


@router.get("/chapter-performance/{student_id}", response_model=List[ChapterPerformanceResponse])
def get_chapter_performance(
    student_id: int,
    subject_id: Optional[int] = None,
    chapter_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analyzer = ChapterPerformanceAnalyzer(db)
    
    performances = analyzer.analyze_chapter_performance(
        institution_id=current_user.institution_id,
        student_id=student_id,
        subject_id=subject_id,
        chapter_id=chapter_id
    )
    
    return [ChapterPerformanceResponse.model_validate(p) for p in performances]


@router.get("/weak-chapters/{student_id}", response_model=List[ChapterPerformanceResponse])
def get_weak_chapters(
    student_id: int,
    mastery_threshold: float = 60.0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analyzer = ChapterPerformanceAnalyzer(db)
    
    weak_chapters = analyzer.get_weak_chapters(
        institution_id=current_user.institution_id,
        student_id=student_id,
        mastery_threshold=mastery_threshold,
        limit=limit
    )
    
    return [ChapterPerformanceResponse.model_validate(wc) for wc in weak_chapters]


@router.get("/question-recommendations", response_model=List[QuestionRecommendationResponse])
def get_question_recommendations(
    student_id: int,
    limit: int = 20,
    include_completed: bool = False,
    due_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(QuestionRecommendation).filter(
        QuestionRecommendation.institution_id == current_user.institution_id,
        QuestionRecommendation.student_id == student_id
    )
    
    if not include_completed:
        query = query.filter(QuestionRecommendation.is_completed == False)
    
    if due_only:
        from datetime import date
        query = query.filter(
            QuestionRecommendation.next_review_date <= date.today()
        )
    
    recommendations = query.order_by(
        QuestionRecommendation.priority_rank.asc()
    ).limit(limit).all()
    
    return [QuestionRecommendationResponse.model_validate(r) for r in recommendations]


@router.put("/question-recommendations/{recommendation_id}", response_model=QuestionRecommendationResponse)
def update_question_recommendation(
    recommendation_id: int,
    update_data: QuestionRecommendationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recommender = SmartQuestionRecommender(db)

    # `update_spaced_repetition` raises a plain `ValueError` for an unknown
    # (or cross-institution) recommendation id -- uncaught, that reaches
    # Starlette's default handler as an unhandled 500 instead of a clean
    # 404 (same shape as this session's `ml_monitoring.py`/`question_nlp.py`
    # insufficient-data ValueError-miscategorization bugs).
    try:
        updated = recommender.update_spaced_repetition(
            recommendation_id=recommendation_id,
            performance_score=float(update_data.performance_score),
            institution_id=current_user.institution_id
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question recommendation not found"
        )

    return QuestionRecommendationResponse.model_validate(updated)


@router.get("/focus-areas", response_model=List[FocusAreaResponse])
def get_focus_areas(
    student_id: int,
    status: Optional[str] = None,
    focus_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FocusArea).filter(
        FocusArea.institution_id == current_user.institution_id,
        FocusArea.student_id == student_id
    )
    
    if status:
        query = query.filter(FocusArea.status == status)
    
    if focus_type:
        query = query.filter(FocusArea.focus_type == focus_type)
    
    focus_areas = query.order_by(
        FocusArea.combined_priority.desc()
    ).limit(limit).all()
    
    return [FocusAreaResponse.model_validate(fa) for fa in focus_areas]


@router.put("/focus-areas/{focus_area_id}", response_model=FocusAreaResponse)
def update_focus_area(
    focus_area_id: int,
    update_data: FocusAreaUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    focus_area = db.query(FocusArea).filter(
        FocusArea.id == focus_area_id,
        FocusArea.institution_id == current_user.institution_id
    ).first()
    
    if not focus_area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus area not found"
        )
    
    if update_data.status is not None:
        focus_area.status = update_data.status
    
    if update_data.started_at is not None:
        focus_area.started_at = update_data.started_at
    
    if update_data.completed_at is not None:
        focus_area.completed_at = update_data.completed_at
    
    db.commit()
    db.refresh(focus_area)
    
    return FocusAreaResponse.model_validate(focus_area)


@router.get("/personalized-insights", response_model=List[PersonalizedInsightResponse])
def get_personalized_insights(
    student_id: int,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PersonalizedInsight).filter(
        PersonalizedInsight.institution_id == current_user.institution_id,
        PersonalizedInsight.student_id == student_id
    )
    
    if category:
        query = query.filter(PersonalizedInsight.category == category)
    
    if severity:
        query = query.filter(PersonalizedInsight.severity == severity)
    
    if is_resolved is not None:
        query = query.filter(PersonalizedInsight.is_resolved == is_resolved)
    
    insights = query.order_by(
        PersonalizedInsight.priority.asc()
    ).limit(limit).all()
    
    return [PersonalizedInsightResponse.model_validate(i) for i in insights]


@router.put("/personalized-insights/{insight_id}", response_model=PersonalizedInsightResponse)
def update_personalized_insight(
    insight_id: int,
    update_data: PersonalizedInsightUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insight = db.query(PersonalizedInsight).filter(
        PersonalizedInsight.id == insight_id,
        PersonalizedInsight.institution_id == current_user.institution_id
    ).first()
    
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found"
        )
    
    if update_data.is_acknowledged is not None:
        insight.is_acknowledged = update_data.is_acknowledged
    
    if update_data.acknowledged_at is not None:
        insight.acknowledged_at = update_data.acknowledged_at
    
    if update_data.is_resolved is not None:
        insight.is_resolved = update_data.is_resolved
    
    if update_data.resolved_at is not None:
        insight.resolved_at = update_data.resolved_at
    
    db.commit()
    db.refresh(insight)
    
    return PersonalizedInsightResponse.model_validate(insight)


@router.get("/insights/summary/{student_id}")
def get_insights_summary(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insights = db.query(PersonalizedInsight).filter(
        PersonalizedInsight.institution_id == current_user.institution_id,
        PersonalizedInsight.student_id == student_id,
        PersonalizedInsight.is_resolved == False
    ).all()
    
    summary = {
        'total_insights': len(insights),
        'critical': sum(1 for i in insights if i.severity == 'critical'),
        'high': sum(1 for i in insights if i.severity == 'high'),
        'medium': sum(1 for i in insights if i.severity == 'medium'),
        'info': sum(1 for i in insights if i.severity == 'info'),
        'acknowledged': sum(1 for i in insights if i.is_acknowledged),
        'unacknowledged': sum(1 for i in insights if not i.is_acknowledged),
        'actionable': sum(1 for i in insights if i.is_actionable),
        'categories': {}
    }
    
    for insight in insights:
        if insight.category not in summary['categories']:
            summary['categories'][insight.category] = 0
        summary['categories'][insight.category] += 1
    
    return summary
