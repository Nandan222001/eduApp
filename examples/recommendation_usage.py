"""
Example usage of the Smart Content Recommendation Engine.
Demonstrates all major features and capabilities.
"""

from sqlalchemy.orm import Session
from src.services.recommendation_service import (
    IntelligentRecommendationService,
    CollaborativeFilteringEngine,
    ContentEffectivenessEngine,
    DifficultyLevelDetector,
    MultiModalContentRecommender,
    StudyPathSequencer,
    ExternalContentLibraryIntegrator
)


def example_comprehensive_recommendations(db: Session, institution_id: int, student_id: int):
    """
    Example: Generate comprehensive recommendations for a student
    """
    print("=" * 80)
    print("COMPREHENSIVE RECOMMENDATIONS")
    print("=" * 80)
    
    service = IntelligentRecommendationService(db)
    
    recommendations = service.generate_comprehensive_recommendations(
        institution_id=institution_id,
        student_id=student_id
    )
    
    print(f"\nStudent ID: {recommendations['student_id']}")
    print(f"Generated At: {recommendations['generated_at']}")
    
    print("\n--- Learning Style Profile ---")
    profile = recommendations['learning_style_profile']
    print(f"Visual: {profile['visual']:.2%}")
    print(f"Auditory: {profile['auditory']:.2%}")
    print(f"Reading/Writing: {profile['reading_writing']:.2%}")
    print(f"Kinesthetic: {profile['kinesthetic']:.2%}")
    
    print("\n--- Summary ---")
    summary = recommendations['summary']
    print(f"Total Weak Areas: {summary['total_weak_areas']}")
    print(f"Similar Peers Found: {summary['similar_peers_found']}")
    print(f"Materials Recommended: {summary['materials_recommended']}")
    print(f"External Sources: {summary['external_sources']}")
    print(f"Study Paths Generated: {summary['study_paths_generated']}")
    
    print("\n--- Top 5 Recommended Materials ---")
    for i, material in enumerate(recommendations['recommended_materials'][:5], 1):
        print(f"{i}. {material['material'].title}")
        print(f"   Type: {material['material'].material_type.value}")
        print(f"   Score: {material['score']:.3f}")
        print(f"   Reasons: {', '.join(material['sources'])}")
        print(f"   Explanation: {material['explanation'][:100]}...")
        print()
    
    print("\n--- External Content ---")
    for ext_content in recommendations['external_content'][:2]:
        print(f"\nTopic: {ext_content['topic']} ({ext_content['subject']})")
        for source, items in ext_content['content'].items():
            if items:
                print(f"  {source}: {len(items)} items")
                for item in items[:1]:
                    print(f"    - {item['title']}")
    
    print("\n--- Study Paths ---")
    for path in recommendations['study_paths']:
        print(f"\nSubject ID: {path['subject_id']}")
        print(f"Total Chapters: {path['total_chapters']}")
        print(f"Estimated Hours: {path['total_estimated_hours']:.1f}")
        print(f"\nTop 3 Priority Chapters:")
        for i, chapter in enumerate(path['path'][:3], 1):
            print(f"  {i}. {chapter['chapter_name']}")
            print(f"     Mastery: {chapter['mastery_score']:.1f}%")
            print(f"     Priority: {chapter['priority_score']:.1f}")
            print(f"     Estimated Hours: {chapter['estimated_hours']:.1f}")


def example_learning_style_detection(db: Session, institution_id: int, student_id: int):
    """
    Example: Detect student's learning style preferences
    """
    print("\n" + "=" * 80)
    print("LEARNING STYLE DETECTION (VARK Model)")
    print("=" * 80)
    
    service = IntelligentRecommendationService(db)
    
    learning_style = service.multimodal_recommender.detect_learning_style(
        institution_id=institution_id,
        student_id=student_id
    )
    
    print("\nLearning Style Scores:")
    for style, score in sorted(learning_style.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * int(score * 50)
        print(f"{style:20s}: {bar} {score:.2%}")
    
    dominant_style = max(learning_style.items(), key=lambda x: x[1])[0]
    print(f"\nDominant Learning Style: {dominant_style.upper()}")
    
    style_recommendations = {
        'visual': "Recommend: Videos, diagrams, infographics, presentations",
        'auditory': "Recommend: Audio lectures, podcasts, discussions",
        'reading_writing': "Recommend: PDFs, textbooks, articles, documents",
        'kinesthetic': "Recommend: Interactive content, practice exercises, hands-on activities"
    }
    
    print(f"\nRecommendation: {style_recommendations.get(dominant_style, '')}")


def example_collaborative_filtering(db: Session, institution_id: int, student_id: int):
    """
    Example: Find similar students and peer success materials
    """
    print("\n" + "=" * 80)
    print("COLLABORATIVE FILTERING - SIMILAR STUDENTS")
    print("=" * 80)
    
    engine = CollaborativeFilteringEngine(db)
    
    similar_students = engine.find_similar_students(
        institution_id=institution_id,
        student_id=student_id,
        limit=10
    )
    
    print(f"\nFound {len(similar_students)} similar students:")
    for i, (peer_id, similarity) in enumerate(similar_students[:5], 1):
        similarity_pct = similarity * 100
        print(f"{i}. Student ID {peer_id}: {similarity_pct:.1f}% similarity")
    
    if similar_students:
        print("\n--- Materials That Helped Similar Students ---")
        from src.models.study_planner import WeakArea
        
        weak_areas = db.query(WeakArea).filter(
            WeakArea.institution_id == institution_id,
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).all()
        
        weak_chapter_ids = [w.chapter_id for w in weak_areas if w.chapter_id]
        
        if weak_chapter_ids:
            peer_materials = engine.get_peer_success_materials(
                institution_id=institution_id,
                similar_students=similar_students,
                weak_chapter_ids=weak_chapter_ids,
                limit=5
            )
            
            for i, (material_id, score, reason) in enumerate(peer_materials, 1):
                print(f"{i}. Material ID {material_id}")
                print(f"   Score: {score:.3f}")
                print(f"   Reason: {reason}")


def example_content_effectiveness(db: Session, institution_id: int, material_id: int):
    """
    Example: Calculate material effectiveness score
    """
    print("\n" + "=" * 80)
    print("CONTENT EFFECTIVENESS SCORING")
    print("=" * 80)
    
    engine = ContentEffectivenessEngine(db)
    
    effectiveness = engine.calculate_material_effectiveness(
        institution_id=institution_id,
        material_id=material_id
    )
    
    if effectiveness:
        print(f"\nMaterial ID: {effectiveness['material_id']}")
        print(f"Total Accesses: {effectiveness['total_accesses']}")
        print(f"Unique Students: {effectiveness['unique_students']}")
        print(f"\nEffectiveness Metrics:")
        print(f"  Overall Score: {effectiveness['effectiveness_score']:.2%}")
        print(f"  Avg Improvement: {effectiveness['avg_improvement']:.1f}%")
        print(f"  Engagement Score: {effectiveness['engagement_score']:.2%}")
        print(f"  Performance Correlation: {effectiveness['performance_correlation']:.2%}")
        
        if effectiveness['effectiveness_score'] > 0.7:
            print("\n✓ HIGHLY EFFECTIVE - Strongly recommend to students")
        elif effectiveness['effectiveness_score'] > 0.5:
            print("\n~ MODERATELY EFFECTIVE - Good resource")
        else:
            print("\n✗ LOW EFFECTIVENESS - Consider alternatives")
    else:
        print("\nNo effectiveness data available for this material.")


def example_difficulty_detection(db: Session, institution_id: int, student_id: int, chapter_id: int = None):
    """
    Example: Detect appropriate difficulty level for student
    """
    print("\n" + "=" * 80)
    print("DIFFICULTY LEVEL DETECTION")
    print("=" * 80)
    
    detector = DifficultyLevelDetector(db)
    
    difficulty_info = detector.detect_student_difficulty_level(
        institution_id=institution_id,
        student_id=student_id,
        chapter_id=chapter_id
    )
    
    print(f"\nMastery Score: {difficulty_info['mastery_score']:.1f}%")
    print(f"Recommended Difficulty: {difficulty_info['recommended_difficulty'].upper()}")
    print(f"Confidence: {difficulty_info['confidence']:.0%}")
    print(f"\nReasoning: {difficulty_info['reasoning']}")
    print(f"\nAppropriate Difficulty Range:")
    for diff in difficulty_info['difficulty_range']:
        print(f"  • {diff}")
    
    print("\n--- Difficulty-Appropriate Materials ---")
    materials = detector.get_difficulty_appropriate_materials(
        institution_id=institution_id,
        student_id=student_id,
        chapter_id=chapter_id,
        limit=5
    )
    
    for i, rec in enumerate(materials[:5], 1):
        print(f"{i}. {rec['material'].title}")
        print(f"   Relevance: {rec['relevance_score']:.2%}")


def example_study_path_generation(db: Session, institution_id: int, student_id: int, subject_id: int):
    """
    Example: Generate personalized study path
    """
    print("\n" + "=" * 80)
    print("PERSONALIZED STUDY PATH SEQUENCING")
    print("=" * 80)
    
    sequencer = StudyPathSequencer(db)
    
    study_path = sequencer.generate_study_path(
        institution_id=institution_id,
        student_id=student_id,
        subject_id=subject_id
    )
    
    print(f"\nSubject ID: {study_path['subject_id']}")
    print(f"Student ID: {study_path['student_id']}")
    print(f"Total Chapters: {study_path['total_chapters']}")
    print(f"Total Estimated Hours: {study_path['total_estimated_hours']:.1f}")
    print(f"Generated At: {study_path['generated_at']}")
    
    print("\n--- Optimized Learning Sequence ---")
    for i, chapter in enumerate(study_path['path'], 1):
        status = "⚠️ WEAK AREA" if chapter['is_weak'] else "✓"
        print(f"\n{i}. {chapter['chapter_name']} {status}")
        print(f"   Current Mastery: {chapter['mastery_score']:.1f}%")
        print(f"   Priority Score: {chapter['priority_score']:.1f}")
        print(f"   Estimated Study Time: {chapter['estimated_hours']:.1f} hours")
        print(f"   Topics to Cover: {len(chapter['topics'])}")
        
        if i >= 5:
            print(f"\n   ... and {len(study_path['path']) - 5} more chapters")
            break


def example_external_content_search(db: Session, topic_name: str, subject_name: str):
    """
    Example: Search external content libraries
    """
    print("\n" + "=" * 80)
    print("EXTERNAL CONTENT LIBRARY INTEGRATION")
    print("=" * 80)
    
    integrator = ExternalContentLibraryIntegrator(db)
    
    print(f"\nSearching for: {topic_name} ({subject_name})")
    print("-" * 80)
    
    all_content = integrator.get_comprehensive_external_content(
        topic=topic_name,
        subject=subject_name
    )
    
    for source, items in all_content.items():
        print(f"\n{source.upper().replace('_', ' ')}")
        print("-" * 40)
        
        for item in items:
            print(f"Title: {item['title']}")
            print(f"Type: {item['type']}")
            print(f"URL: {item['url']}")
            if 'estimated_duration_minutes' in item:
                print(f"Duration: {item['estimated_duration_minutes']} minutes")
            print(f"Description: {item['description'][:100]}...")
            print()


def run_all_examples(db: Session):
    """
    Run all examples with sample data
    """
    print("\n" + "=" * 80)
    print("SMART CONTENT RECOMMENDATION ENGINE - COMPLETE DEMO")
    print("=" * 80)
    
    institution_id = 1
    student_id = 1
    subject_id = 1
    material_id = 1
    chapter_id = 1
    
    example_comprehensive_recommendations(db, institution_id, student_id)
    
    example_learning_style_detection(db, institution_id, student_id)
    
    example_collaborative_filtering(db, institution_id, student_id)
    
    example_content_effectiveness(db, institution_id, material_id)
    
    example_difficulty_detection(db, institution_id, student_id, chapter_id)
    
    example_study_path_generation(db, institution_id, student_id, subject_id)
    
    example_external_content_search(db, "Calculus", "Mathematics")
    
    print("\n" + "=" * 80)
    print("DEMO COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    from src.database import get_db
    
    db = next(get_db())
    
    try:
        run_all_examples(db)
    finally:
        db.close()
