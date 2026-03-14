from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.services.recommendation_service import IntelligentRecommendationService
from src.schemas.recommendation import (
    ComprehensiveRecommendationResponse,
    TopicRecommendationRequest,
    ContentEffectivenessResponse,
    SimilarStudentsResponse,
    StudentLearningPreferenceResponse,
    RecommendationFilters,
    LearningStyleProfile,
    DifficultyRecommendation
)
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.student import Student

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/comprehensive/{student_id}", response_model=ComprehensiveRecommendationResponse)
async def get_comprehensive_recommendations(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive study recommendations for a student including:
    - Personalized material recommendations based on learning style
    - External content from Khan Academy, YouTube EDU, OpenStax, etc.
    - Optimized study paths with prerequisite sequencing
    - Difficulty-appropriate resources
    - Peer success patterns
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    recommendations = service.generate_comprehensive_recommendations(
        institution_id=current_user.institution_id,
        student_id=student_id
    )
    
    return recommendations


@router.post("/topic", response_model=dict)
async def get_topic_recommendations(
    request: TopicRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get targeted recommendations for a specific topic including:
    - Internal study materials
    - External content libraries
    - Difficulty-appropriate resources
    - Learning style matches
    """
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    recommendations = service.get_recommendations_for_topic(
        institution_id=current_user.institution_id,
        student_id=student.id,
        topic_id=request.topic_id,
        include_external=request.include_external
    )
    
    return recommendations


@router.get("/learning-style/{student_id}", response_model=LearningStyleProfile)
async def get_learning_style_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get student's learning style profile (VARK model):
    - Visual (videos, diagrams)
    - Auditory (audio lectures, podcasts)
    - Reading/Writing (PDFs, documents)
    - Kinesthetic (interactive content, practice)
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    learning_style = service.multimodal_recommender.detect_learning_style(
        institution_id=current_user.institution_id,
        student_id=student_id
    )
    
    dominant_style = max(learning_style.items(), key=lambda x: x[1])[0]
    
    return LearningStyleProfile(
        visual_score=learning_style.get('visual', 0.25),
        auditory_score=learning_style.get('auditory', 0.25),
        reading_writing_score=learning_style.get('reading_writing', 0.25),
        kinesthetic_score=learning_style.get('kinesthetic', 0.25),
        dominant_style=dominant_style,
        confidence_level=learning_style.get(dominant_style, 0.25)
    )


@router.get("/difficulty-level/{student_id}", response_model=DifficultyRecommendation)
async def get_difficulty_recommendation(
    student_id: int,
    chapter_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recommended difficulty level for student based on current mastery.
    Helps suggest appropriate resources for optimal learning.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    difficulty_info = service.difficulty_detector.detect_student_difficulty_level(
        institution_id=current_user.institution_id,
        student_id=student_id,
        chapter_id=chapter_id
    )
    
    return DifficultyRecommendation(**difficulty_info)


@router.get("/similar-students/{student_id}", response_model=SimilarStudentsResponse)
async def find_similar_students(
    student_id: int,
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find students with similar performance patterns using collaborative filtering.
    Used to recommend materials that helped similar students succeed.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    similar_students = service.collaborative_engine.find_similar_students(
        institution_id=current_user.institution_id,
        student_id=student_id,
        limit=limit
    )
    
    result = []
    for peer_id, similarity_score in similar_students:
        peer = db.query(Student).filter(Student.id == peer_id).first()
        if peer and peer.user:
            result.append({
                'student_id': peer_id,
                'name': f"{peer.first_name} {peer.last_name}",
                'similarity_score': round(similarity_score, 3),
                'section': peer.section.name if peer.section else None
            })
    
    return SimilarStudentsResponse(
        student_id=student_id,
        similar_students=result,
        total_found=len(result)
    )


@router.get("/material-effectiveness/{material_id}", response_model=ContentEffectivenessResponse)
async def get_material_effectiveness(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get effectiveness score for a study material based on:
    - Student performance improvements after accessing
    - Assessment score correlations
    - Engagement metrics
    """
    service = IntelligentRecommendationService(db)
    
    effectiveness = service.effectiveness_engine.calculate_material_effectiveness(
        institution_id=current_user.institution_id,
        material_id=material_id
    )
    
    if not effectiveness:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found or no effectiveness data available"
        )
    
    return ContentEffectivenessResponse(**effectiveness)


@router.get("/study-path/{student_id}/{subject_id}", response_model=dict)
async def get_study_path(
    student_id: int,
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate personalized study path for a subject with:
    - Prerequisite-based sequencing
    - Optimal learning order
    - Difficulty progression
    - Time estimates
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    study_path = service.path_sequencer.generate_study_path(
        institution_id=current_user.institution_id,
        student_id=student_id,
        subject_id=subject_id
    )
    
    return study_path


@router.get("/external-content/{topic_id}", response_model=dict)
async def search_external_content(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search external content libraries for a topic:
    - Khan Academy
    - YouTube EDU
    - OpenStax
    - Coursera
    - MIT OpenCourseWare
    """
    from src.models.academic import Topic
    
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    subject_name = topic.chapter.subject.name if topic.chapter else "General"
    
    external_content = service.external_integrator.get_comprehensive_external_content(
        topic=topic.name,
        subject=subject_name
    )
    
    return {
        'topic_id': topic_id,
        'topic_name': topic.name,
        'subject': subject_name,
        'external_content': external_content
    }


@router.post("/filtered", response_model=dict)
async def get_filtered_recommendations(
    filters: RecommendationFilters,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recommendations with custom filters:
    - Subject/Chapter/Topic
    - Difficulty level
    - Material type
    - Learning style preference
    - External content inclusion
    """
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    if filters.topic_id:
        recommendations = service.get_recommendations_for_topic(
            institution_id=current_user.institution_id,
            student_id=student.id,
            topic_id=filters.topic_id,
            include_external=filters.include_external
        )
    else:
        recommendations = service.generate_comprehensive_recommendations(
            institution_id=current_user.institution_id,
            student_id=student.id
        )
    
    return recommendations


@router.get("/peer-success-materials/{student_id}", response_model=dict)
async def get_peer_success_materials(
    student_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get materials that helped similar high-performing students.
    Based on collaborative filtering and peer success patterns.
    """
    from src.models.study_planner import WeakArea
    
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    service = IntelligentRecommendationService(db)
    
    similar_students = service.collaborative_engine.find_similar_students(
        institution_id=current_user.institution_id,
        student_id=student_id,
        limit=20
    )
    
    weak_areas = db.query(WeakArea).filter(
        WeakArea.institution_id == current_user.institution_id,
        WeakArea.student_id == student_id,
        WeakArea.is_resolved == False
    ).all()
    
    weak_chapter_ids = [w.chapter_id for w in weak_areas if w.chapter_id]
    
    peer_materials = service.collaborative_engine.get_peer_success_materials(
        institution_id=current_user.institution_id,
        similar_students=similar_students,
        weak_chapter_ids=weak_chapter_ids,
        limit=limit
    )
    
    from src.models.study_material import StudyMaterial
    
    results = []
    for material_id, score, reason in peer_materials:
        material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
        if material:
            results.append({
                'material_id': material_id,
                'title': material.title,
                'material_type': material.material_type.value,
                'score': round(score, 3),
                'reason': reason,
                'view_count': material.view_count,
                'download_count': material.download_count
            })
    
    return {
        'student_id': student_id,
        'total_similar_peers': len(similar_students),
        'materials': results
    }
