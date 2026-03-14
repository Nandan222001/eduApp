from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, case, cast, Float
from collections import defaultdict
from decimal import Decimal
import math
import logging
import hashlib

from src.models.study_planner import (
    WeakArea, ChapterPerformance, QuestionRecommendation, FocusArea
)
from src.models.study_material import StudyMaterial, MaterialAccessLog, MaterialType
from src.models.study_group import StudyGroup, GroupMember, GroupMemberRole
from src.models.academic import Subject, Chapter, Topic
from src.models.student import Student
from src.models.user import User
from src.models.previous_year_papers import QuestionBank, DifficultyLevel
from src.models.quiz import Quiz, QuizAttempt, QuizResponse
from src.models.examination import ExamMarks, ExamSubject

logger = logging.getLogger(__name__)


class LearningStyle:
    VISUAL = "visual"
    AUDITORY = "auditory"
    READING_WRITING = "reading_writing"
    KINESTHETIC = "kinesthetic"


class ContentSource:
    INTERNAL = "internal"
    KHAN_ACADEMY = "khan_academy"
    YOUTUBE_EDU = "youtube_edu"
    OPENSTAX = "openstax"
    COURSERA = "coursera"
    MIT_OCW = "mit_ocw"


class CollaborativeFilteringEngine:
    """
    Collaborative filtering for peer-based recommendations.
    Recommends study materials based on what similar students found helpful.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.similarity_threshold = 0.5
        self.min_common_chapters = 3
    
    def find_similar_students(
        self,
        institution_id: int,
        student_id: int,
        limit: int = 20
    ) -> List[Tuple[int, float]]:
        """
        Find similar students based on performance patterns using cosine similarity.
        Returns list of (student_id, similarity_score) tuples.
        """
        target_performances = self._get_student_performance_vector(
            institution_id, student_id
        )
        
        if not target_performances:
            logger.info(f"No performance data found for student {student_id}")
            return []
        
        same_grade_students = self.db.query(Student).filter(
            Student.institution_id == institution_id,
            Student.id != student_id,
            Student.is_active == True,
            Student.section_id.isnot(None)
        ).all()
        
        similarities = []
        for peer in same_grade_students:
            peer_performances = self._get_student_performance_vector(
                institution_id, peer.id
            )
            
            if peer_performances:
                common_chapters = set(target_performances.keys()) & set(peer_performances.keys())
                
                if len(common_chapters) >= self.min_common_chapters:
                    similarity = self._calculate_cosine_similarity(
                        target_performances, peer_performances
                    )
                    
                    if similarity > self.similarity_threshold:
                        similarities.append((peer.id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        logger.info(f"Found {len(similarities)} similar students for student {student_id}")
        return similarities[:limit]
    
    def _get_student_performance_vector(
        self,
        institution_id: int,
        student_id: int
    ) -> Dict[int, float]:
        """Get student performance vector indexed by chapter_id"""
        performances = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.institution_id == institution_id,
            ChapterPerformance.student_id == student_id
        ).all()
        
        return {
            p.chapter_id: float(p.mastery_score)
            for p in performances
        }
    
    def _calculate_cosine_similarity(
        self,
        vec1: Dict[int, float],
        vec2: Dict[int, float]
    ) -> float:
        """Calculate cosine similarity between two performance vectors"""
        common_keys = set(vec1.keys()) & set(vec2.keys())
        
        if not common_keys:
            return 0.0
        
        dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
        magnitude1 = math.sqrt(sum(v**2 for v in vec1.values()))
        magnitude2 = math.sqrt(sum(v**2 for v in vec2.values()))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    def get_peer_success_materials(
        self,
        institution_id: int,
        similar_students: List[Tuple[int, float]],
        weak_chapter_ids: List[int],
        limit: int = 10
    ) -> List[Tuple[int, float, str]]:
        """
        Get materials that helped similar students improve in weak areas.
        Returns list of (material_id, weighted_score, reason) tuples.
        """
        if not similar_students:
            return []
            
        student_ids = [s[0] for s in similar_students]
        similarity_map = {s[0]: s[1] for s in similar_students}
        
        material_scores = defaultdict(lambda: {'score': 0.0, 'reason': '', 'users': set()})
        
        access_logs = self.db.query(
            MaterialAccessLog.material_id,
            MaterialAccessLog.user_id,
            func.count(MaterialAccessLog.id).label('access_count')
        ).join(User).join(Student, Student.user_id == User.id).filter(
            MaterialAccessLog.institution_id == institution_id,
            Student.id.in_(student_ids)
        ).group_by(
            MaterialAccessLog.material_id,
            MaterialAccessLog.user_id
        ).all()
        
        for log in access_logs:
            material_id = log.material_id
            student_user_id = log.user_id
            access_count = log.access_count
            
            student = self.db.query(Student).filter(
                Student.user_id == student_user_id
            ).first()
            
            if student and student.id in similarity_map:
                similarity = similarity_map[student.id]
                engagement_score = min(access_count / 10.0, 1.0)
                score = similarity * engagement_score
                
                material_scores[material_id]['score'] += score
                material_scores[material_id]['users'].add(student.id)
        
        for material_id in material_scores:
            user_count = len(material_scores[material_id]['users'])
            material_scores[material_id]['reason'] = (
                f"Used by {user_count} similar high-performing peers"
            )
        
        sorted_materials = sorted(
            material_scores.items(),
            key=lambda x: x[1]['score'],
            reverse=True
        )
        
        return [
            (mat_id, data['score'], data['reason'])
            for mat_id, data in sorted_materials[:limit]
        ]


class ContentEffectivenessEngine:
    """
    Track and score content effectiveness based on student performance improvements.
    Identifies which materials lead to better assessment outcomes.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.improvement_window_days = 30
    
    def calculate_material_effectiveness(
        self,
        institution_id: int,
        material_id: int
    ) -> Dict[str, Any]:
        """
        Calculate effectiveness score for a study material based on:
        - Student performance improvements after accessing
        - Assessment score correlations
        - Engagement metrics
        """
        material = self.db.query(StudyMaterial).filter(
            StudyMaterial.id == material_id,
            StudyMaterial.institution_id == institution_id
        ).first()
        
        if not material:
            return None
        
        access_logs = self.db.query(MaterialAccessLog).filter(
            MaterialAccessLog.material_id == material_id,
            MaterialAccessLog.institution_id == institution_id
        ).all()
        
        effectiveness_data = {
            'material_id': material_id,
            'total_accesses': len(access_logs),
            'unique_students': len(set(log.user_id for log in access_logs)),
            'avg_improvement': 0.0,
            'effectiveness_score': 0.0,
            'engagement_score': 0.0,
            'performance_correlation': 0.0
        }
        
        if not access_logs:
            return effectiveness_data
        
        improvements = []
        for log in access_logs:
            student = self.db.query(Student).filter(
                Student.user_id == log.user_id
            ).first()
            
            if student and material.chapter_id:
                improvement = self._calculate_student_improvement(
                    institution_id,
                    student.id,
                    material.chapter_id,
                    log.accessed_at
                )
                if improvement is not None:
                    improvements.append(improvement)
        
        if improvements:
            effectiveness_data['avg_improvement'] = sum(improvements) / len(improvements)
            effectiveness_data['performance_correlation'] = self._calculate_correlation_score(
                improvements
            )
        
        effectiveness_data['engagement_score'] = self._calculate_engagement_score(
            material.view_count,
            material.download_count,
            len(access_logs)
        )
        
        effectiveness_data['effectiveness_score'] = self._compute_overall_effectiveness(
            effectiveness_data['avg_improvement'],
            effectiveness_data['engagement_score'],
            effectiveness_data['performance_correlation']
        )
        
        return effectiveness_data
    
    def _calculate_student_improvement(
        self,
        institution_id: int,
        student_id: int,
        chapter_id: int,
        access_date: datetime
    ) -> Optional[float]:
        """Calculate performance improvement before and after material access"""
        before_performance = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.institution_id == institution_id,
            ChapterPerformance.student_id == student_id,
            ChapterPerformance.chapter_id == chapter_id,
            ChapterPerformance.updated_at < access_date
        ).first()
        
        after_date = access_date + timedelta(days=self.improvement_window_days)
        after_performance = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.institution_id == institution_id,
            ChapterPerformance.student_id == student_id,
            ChapterPerformance.chapter_id == chapter_id,
            ChapterPerformance.updated_at >= access_date,
            ChapterPerformance.updated_at <= after_date
        ).first()
        
        if before_performance and after_performance:
            before_score = float(before_performance.mastery_score)
            after_score = float(after_performance.mastery_score)
            return after_score - before_score
        
        return None
    
    def _calculate_correlation_score(self, improvements: List[float]) -> float:
        """Calculate how consistently the material leads to improvements"""
        if not improvements:
            return 0.0
        
        positive_improvements = sum(1 for imp in improvements if imp > 0)
        return positive_improvements / len(improvements)
    
    def _calculate_engagement_score(
        self,
        view_count: int,
        download_count: int,
        access_count: int
    ) -> float:
        """Calculate engagement score based on usage metrics"""
        view_score = min(view_count / 100.0, 0.4)
        download_score = min(download_count / 50.0, 0.3)
        access_score = min(access_count / 50.0, 0.3)
        
        return view_score + download_score + access_score
    
    def _compute_overall_effectiveness(
        self,
        avg_improvement: float,
        engagement_score: float,
        correlation: float
    ) -> float:
        """Compute weighted overall effectiveness score"""
        improvement_weight = 0.5
        engagement_weight = 0.2
        correlation_weight = 0.3
        
        normalized_improvement = max(0, min(avg_improvement / 20.0, 1.0))
        
        score = (
            normalized_improvement * improvement_weight +
            engagement_score * engagement_weight +
            correlation * correlation_weight
        )
        
        return min(score, 1.0)


class DifficultyLevelDetector:
    """
    Detect appropriate difficulty levels for students based on mastery levels.
    Suggests resources matching current ability for optimal learning.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def detect_student_difficulty_level(
        self,
        institution_id: int,
        student_id: int,
        chapter_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Detect appropriate difficulty level for student.
        Returns recommended difficulty and confidence score.
        """
        if chapter_id:
            performance = self.db.query(ChapterPerformance).filter(
                ChapterPerformance.institution_id == institution_id,
                ChapterPerformance.student_id == student_id,
                ChapterPerformance.chapter_id == chapter_id
            ).first()
            
            mastery_score = float(performance.mastery_score) if performance else 50.0
        else:
            performances = self.db.query(ChapterPerformance).filter(
                ChapterPerformance.institution_id == institution_id,
                ChapterPerformance.student_id == student_id
            ).all()
            
            if performances:
                mastery_score = sum(float(p.mastery_score) for p in performances) / len(performances)
            else:
                mastery_score = 50.0
        
        difficulty_mapping = self._map_mastery_to_difficulty(mastery_score)
        
        return {
            'mastery_score': mastery_score,
            'recommended_difficulty': difficulty_mapping['level'],
            'difficulty_range': difficulty_mapping['range'],
            'confidence': difficulty_mapping['confidence'],
            'reasoning': difficulty_mapping['reasoning']
        }
    
    def _map_mastery_to_difficulty(self, mastery_score: float) -> Dict[str, Any]:
        """Map mastery score to appropriate difficulty level"""
        if mastery_score < 30:
            return {
                'level': DifficultyLevel.VERY_EASY.value,
                'range': [DifficultyLevel.VERY_EASY.value],
                'confidence': 0.9,
                'reasoning': 'Building foundational understanding required'
            }
        elif mastery_score < 50:
            return {
                'level': DifficultyLevel.EASY.value,
                'range': [DifficultyLevel.VERY_EASY.value, DifficultyLevel.EASY.value],
                'confidence': 0.85,
                'reasoning': 'Developing basic concepts with gradual progression'
            }
        elif mastery_score < 70:
            return {
                'level': DifficultyLevel.MEDIUM.value,
                'range': [DifficultyLevel.EASY.value, DifficultyLevel.MEDIUM.value],
                'confidence': 0.8,
                'reasoning': 'Ready for moderate challenges to strengthen skills'
            }
        elif mastery_score < 85:
            return {
                'level': DifficultyLevel.HARD.value,
                'range': [DifficultyLevel.MEDIUM.value, DifficultyLevel.HARD.value],
                'confidence': 0.85,
                'reasoning': 'Advanced problem-solving to achieve mastery'
            }
        else:
            return {
                'level': DifficultyLevel.VERY_HARD.value,
                'range': [DifficultyLevel.HARD.value, DifficultyLevel.VERY_HARD.value],
                'confidence': 0.9,
                'reasoning': 'Expert-level challenges for deep mastery'
            }
    
    def get_difficulty_appropriate_materials(
        self,
        institution_id: int,
        student_id: int,
        chapter_id: Optional[int] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get materials appropriate for student's current difficulty level"""
        difficulty_info = self.detect_student_difficulty_level(
            institution_id, student_id, chapter_id
        )
        
        allowed_difficulties = difficulty_info['difficulty_range']
        
        query = self.db.query(StudyMaterial).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.is_active == True
        )
        
        if chapter_id:
            query = query.filter(StudyMaterial.chapter_id == chapter_id)
        
        materials = query.all()
        
        recommendations = []
        for material in materials:
            relevance_score = self._calculate_difficulty_relevance(
                material,
                difficulty_info
            )
            
            if relevance_score > 0.3:
                recommendations.append({
                    'material': material,
                    'material_id': material.id,
                    'relevance_score': relevance_score,
                    'difficulty_match': difficulty_info['recommended_difficulty'],
                    'reasoning': difficulty_info['reasoning']
                })
        
        recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
        return recommendations[:limit]
    
    def _calculate_difficulty_relevance(
        self,
        material: StudyMaterial,
        difficulty_info: Dict[str, Any]
    ) -> float:
        """Calculate how well material matches student's difficulty level"""
        base_score = 0.5
        
        if material.view_count > 50:
            base_score += 0.2
        
        if material.download_count > 20:
            base_score += 0.1
        
        if material.tags and any('beginner' in tag.lower() for tag in material.tags):
            if difficulty_info['recommended_difficulty'] in [DifficultyLevel.VERY_EASY.value, DifficultyLevel.EASY.value]:
                base_score += 0.2
        
        return min(base_score, 1.0)


class MultiModalContentRecommender:
    """
    Recommend content based on learning styles (VARK model).
    - Visual learners: videos, diagrams, infographics
    - Auditory learners: audio lectures, podcasts
    - Reading/Writing learners: PDFs, documents, texts
    - Kinesthetic learners: interactive simulations, practice
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def detect_learning_style(
        self,
        institution_id: int,
        student_id: int
    ) -> Dict[str, float]:
        """
        Detect student's learning style preferences based on material access patterns.
        Returns VARK scores (Visual, Auditory, Reading, Kinesthetic).
        """
        access_logs = self.db.query(
            MaterialAccessLog
        ).join(
            StudyMaterial
        ).join(
            User
        ).join(
            Student, Student.user_id == User.id
        ).filter(
            MaterialAccessLog.institution_id == institution_id,
            Student.id == student_id
        ).all()
        
        style_scores = {
            LearningStyle.VISUAL: 0.0,
            LearningStyle.AUDITORY: 0.0,
            LearningStyle.READING_WRITING: 0.0,
            LearningStyle.KINESTHETIC: 0.0
        }
        
        for log in access_logs:
            material = log.material
            if material.material_type == MaterialType.VIDEO:
                style_scores[LearningStyle.VISUAL] += 1.0
            elif material.material_type == MaterialType.AUDIO:
                style_scores[LearningStyle.AUDITORY] += 1.0
            elif material.material_type in [MaterialType.PDF, MaterialType.DOCUMENT]:
                style_scores[LearningStyle.READING_WRITING] += 1.0
            elif material.material_type == MaterialType.PRESENTATION:
                style_scores[LearningStyle.VISUAL] += 0.5
                style_scores[LearningStyle.READING_WRITING] += 0.5
        
        quiz_attempts = self.db.query(QuizAttempt).join(
            User
        ).join(
            Student, Student.user_id == User.id
        ).filter(
            Student.id == student_id
        ).count()
        
        style_scores[LearningStyle.KINESTHETIC] += quiz_attempts * 0.5
        
        total = sum(style_scores.values())
        if total > 0:
            return {k: v / total for k, v in style_scores.items()}
        
        return {k: 0.25 for k in style_scores}
    
    def recommend_by_learning_style(
        self,
        institution_id: int,
        student_id: int,
        weak_areas: List[WeakArea],
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """Recommend materials matching student's learning style"""
        learning_style = self.detect_learning_style(institution_id, student_id)
        
        dominant_style = max(learning_style.items(), key=lambda x: x[1])[0]
        
        recommendations = []
        
        for weak_area in weak_areas[:10]:
            materials = self.db.query(StudyMaterial).filter(
                StudyMaterial.institution_id == institution_id,
                StudyMaterial.subject_id == weak_area.subject_id,
                StudyMaterial.is_active == True
            )
            
            if weak_area.chapter_id:
                materials = materials.filter(
                    StudyMaterial.chapter_id == weak_area.chapter_id
                )
            
            materials = materials.all()
            
            for material in materials:
                style_match_score = self._calculate_style_match(
                    material, learning_style
                )
                
                if style_match_score > 0.3:
                    recommendations.append({
                        'material_id': material.id,
                        'material': material,
                        'weak_area_id': weak_area.id,
                        'style_match_score': style_match_score,
                        'dominant_style': dominant_style,
                        'learning_style_scores': learning_style,
                        'explanation': self._generate_style_explanation(
                            material, dominant_style
                        )
                    })
        
        recommendations.sort(key=lambda x: x['style_match_score'], reverse=True)
        return recommendations[:limit]
    
    def _calculate_style_match(
        self,
        material: StudyMaterial,
        learning_style: Dict[str, float]
    ) -> float:
        """Calculate how well material matches learning style"""
        material_type = material.material_type
        
        if material_type == MaterialType.VIDEO:
            return learning_style[LearningStyle.VISUAL] * 1.0
        elif material_type == MaterialType.AUDIO:
            return learning_style[LearningStyle.AUDITORY] * 1.0
        elif material_type in [MaterialType.PDF, MaterialType.DOCUMENT]:
            return learning_style[LearningStyle.READING_WRITING] * 1.0
        elif material_type == MaterialType.PRESENTATION:
            return (
                learning_style[LearningStyle.VISUAL] * 0.5 +
                learning_style[LearningStyle.READING_WRITING] * 0.5
            )
        else:
            return 0.3
    
    def _generate_style_explanation(
        self,
        material: StudyMaterial,
        dominant_style: str
    ) -> str:
        """Generate explanation for learning style match"""
        style_descriptions = {
            LearningStyle.VISUAL: "visual learning preference (videos, diagrams)",
            LearningStyle.AUDITORY: "auditory learning preference (audio, lectures)",
            LearningStyle.READING_WRITING: "reading/writing preference (texts, documents)",
            LearningStyle.KINESTHETIC: "hands-on learning preference (interactive content)"
        }
        
        return f"Matches your {style_descriptions.get(dominant_style, 'learning style')}"


class StudyPathSequencer:
    """
    Create personalized study paths by sequencing content based on:
    - Prerequisite relationships between topics
    - Optimal learning order
    - Difficulty progression
    - Knowledge dependencies
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_study_path(
        self,
        institution_id: int,
        student_id: int,
        subject_id: int,
        target_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Generate optimized study path for a subject"""
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.institution_id == institution_id,
            WeakArea.student_id == student_id,
            WeakArea.subject_id == subject_id,
            WeakArea.is_resolved == False
        ).order_by(WeakArea.weakness_score.desc()).all()
        
        chapters = self.db.query(Chapter).filter(
            Chapter.subject_id == subject_id,
            Chapter.is_active == True
        ).order_by(Chapter.sequence_number).all()
        
        chapter_performances = {
            cp.chapter_id: cp
            for cp in self.db.query(ChapterPerformance).filter(
                ChapterPerformance.institution_id == institution_id,
                ChapterPerformance.student_id == student_id,
                ChapterPerformance.subject_id == subject_id
            ).all()
        }
        
        sequenced_path = []
        
        for chapter in chapters:
            performance = chapter_performances.get(chapter.id)
            mastery = float(performance.mastery_score) if performance else 0.0
            
            is_weak = any(
                wa.chapter_id == chapter.id for wa in weak_areas
            )
            
            priority_score = self._calculate_chapter_priority(
                chapter, mastery, is_weak
            )
            
            topics = self.db.query(Topic).filter(
                Topic.chapter_id == chapter.id,
                Topic.is_active == True
            ).order_by(Topic.sequence_number).all()
            
            sequenced_path.append({
                'chapter_id': chapter.id,
                'chapter_name': chapter.name,
                'sequence': chapter.sequence_number,
                'mastery_score': mastery,
                'is_weak': is_weak,
                'priority_score': priority_score,
                'topics': [
                    {
                        'topic_id': topic.id,
                        'topic_name': topic.name,
                        'sequence': topic.sequence_number
                    }
                    for topic in topics
                ],
                'estimated_hours': self._estimate_study_hours(mastery, len(topics))
            })
        
        sequenced_path.sort(key=lambda x: (-x['priority_score'], x['sequence']))
        
        return {
            'subject_id': subject_id,
            'student_id': student_id,
            'path': sequenced_path,
            'total_chapters': len(sequenced_path),
            'total_estimated_hours': sum(item['estimated_hours'] for item in sequenced_path),
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _calculate_chapter_priority(
        self,
        chapter: Chapter,
        mastery_score: float,
        is_weak: bool
    ) -> float:
        """Calculate priority score for chapter in study path"""
        priority = 0.0
        
        if is_weak:
            priority += 50.0
        
        priority += (100.0 - mastery_score) * 0.3
        
        priority += chapter.sequence_number * 0.1
        
        return priority
    
    def _estimate_study_hours(self, mastery_score: float, topic_count: int) -> float:
        """Estimate required study hours for chapter"""
        base_hours = topic_count * 2.0
        
        mastery_multiplier = 1.0 + ((100.0 - mastery_score) / 100.0)
        
        return base_hours * mastery_multiplier


class ExternalContentLibraryIntegrator:
    """
    Integrate with external content libraries:
    - Khan Academy
    - YouTube EDU
    - OpenStax
    - Coursera
    - MIT OpenCourseWare
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def search_khan_academy(
        self,
        topic: str,
        subject: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search Khan Academy for educational content.
        In production, this would call Khan Academy API.
        """
        base_url = "https://www.khanacademy.org"
        
        content_items = [
            {
                'source': ContentSource.KHAN_ACADEMY,
                'title': f"{topic} - Khan Academy",
                'url': f"{base_url}/search?query={topic.replace(' ', '+')}",
                'type': 'video_playlist',
                'subject': subject,
                'topic': topic,
                'description': f"Comprehensive video lessons on {topic}",
                'estimated_duration_minutes': 45,
                'difficulty': 'beginner_to_intermediate',
                'language': 'en'
            }
        ]
        
        return content_items[:limit]
    
    def search_youtube_edu(
        self,
        topic: str,
        subject: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search YouTube EDU for educational videos.
        In production, this would call YouTube Data API.
        """
        base_url = "https://www.youtube.com"
        
        search_query = f"{topic} {subject} educational"
        
        content_items = [
            {
                'source': ContentSource.YOUTUBE_EDU,
                'title': f"{topic} Tutorial - Educational Video",
                'url': f"{base_url}/results?search_query={search_query.replace(' ', '+')}",
                'type': 'video',
                'subject': subject,
                'topic': topic,
                'description': f"Video tutorial on {topic}",
                'estimated_duration_minutes': 20,
                'channel': 'Educational Channels',
                'language': 'en'
            }
        ]
        
        return content_items[:limit]
    
    def search_openstax(
        self,
        topic: str,
        subject: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search OpenStax for free textbooks and resources.
        In production, this would call OpenStax API.
        """
        base_url = "https://openstax.org"
        
        content_items = [
            {
                'source': ContentSource.OPENSTAX,
                'title': f"{subject} Textbook - {topic}",
                'url': f"{base_url}/subjects/{subject.lower().replace(' ', '-')}",
                'type': 'textbook',
                'subject': subject,
                'topic': topic,
                'description': f"Free textbook covering {topic}",
                'format': 'pdf',
                'pages': 'varies',
                'license': 'CC-BY',
                'language': 'en'
            }
        ]
        
        return content_items[:limit]
    
    def search_coursera(
        self,
        topic: str,
        subject: str,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """Search Coursera for courses"""
        base_url = "https://www.coursera.org"
        
        content_items = [
            {
                'source': ContentSource.COURSERA,
                'title': f"{topic} - Online Course",
                'url': f"{base_url}/search?query={topic.replace(' ', '+')}",
                'type': 'course',
                'subject': subject,
                'topic': topic,
                'description': f"Structured course on {topic}",
                'provider': 'Top Universities',
                'duration_weeks': 4,
                'effort_hours_per_week': 5,
                'language': 'en'
            }
        ]
        
        return content_items[:limit]
    
    def search_mit_ocw(
        self,
        topic: str,
        subject: str,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """Search MIT OpenCourseWare"""
        base_url = "https://ocw.mit.edu"
        
        content_items = [
            {
                'source': ContentSource.MIT_OCW,
                'title': f"{topic} - MIT OpenCourseWare",
                'url': f"{base_url}/search/?q={topic.replace(' ', '+')}",
                'type': 'course_materials',
                'subject': subject,
                'topic': topic,
                'description': f"MIT lecture notes and materials on {topic}",
                'includes': ['lecture_notes', 'assignments', 'exams'],
                'level': 'undergraduate',
                'language': 'en'
            }
        ]
        
        return content_items[:limit]
    
    def get_comprehensive_external_content(
        self,
        topic: str,
        subject: str
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Get content from all external sources"""
        return {
            'khan_academy': self.search_khan_academy(topic, subject),
            'youtube_edu': self.search_youtube_edu(topic, subject),
            'openstax': self.search_openstax(topic, subject),
            'coursera': self.search_coursera(topic, subject),
            'mit_ocw': self.search_mit_ocw(topic, subject)
        }


class IntelligentRecommendationService:
    """
    Main orchestration service integrating all recommendation engines.
    Provides comprehensive, personalized study recommendations.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.collaborative_engine = CollaborativeFilteringEngine(db)
        self.effectiveness_engine = ContentEffectivenessEngine(db)
        self.difficulty_detector = DifficultyLevelDetector(db)
        self.multimodal_recommender = MultiModalContentRecommender(db)
        self.path_sequencer = StudyPathSequencer(db)
        self.external_integrator = ExternalContentLibraryIntegrator(db)
    
    def generate_comprehensive_recommendations(
        self,
        institution_id: int,
        student_id: int
    ) -> Dict[str, Any]:
        """
        Generate comprehensive recommendations using all engines.
        Returns personalized study recommendations with explanations.
        """
        logger.info(f"Generating comprehensive recommendations for student {student_id}")
        
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.institution_id == institution_id,
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).order_by(WeakArea.weakness_score.desc()).all()
        
        similar_students = self.collaborative_engine.find_similar_students(
            institution_id, student_id, limit=20
        )
        
        weak_chapter_ids = [w.chapter_id for w in weak_areas if w.chapter_id]
        
        peer_materials = self.collaborative_engine.get_peer_success_materials(
            institution_id, similar_students, weak_chapter_ids, limit=10
        )
        
        learning_style_recommendations = self.multimodal_recommender.recommend_by_learning_style(
            institution_id, student_id, weak_areas, limit=15
        )
        
        difficulty_recommendations = self.difficulty_detector.get_difficulty_appropriate_materials(
            institution_id, student_id, limit=10
        )
        
        material_recommendations = self._merge_all_recommendations(
            learning_style_recommendations,
            difficulty_recommendations,
            peer_materials
        )
        
        external_content = []
        for weak_area in weak_areas[:3]:
            topic_name = weak_area.topic.name if weak_area.topic else weak_area.chapter.name
            subject_name = weak_area.subject.name
            
            external = self.external_integrator.get_comprehensive_external_content(
                topic_name, subject_name
            )
            
            external_content.append({
                'weak_area_id': weak_area.id,
                'topic': topic_name,
                'subject': subject_name,
                'content': external
            })
        
        study_paths = []
        unique_subjects = set(wa.subject_id for wa in weak_areas)
        for subject_id in list(unique_subjects)[:3]:
            path = self.path_sequencer.generate_study_path(
                institution_id, student_id, subject_id
            )
            study_paths.append(path)
        
        learning_style_profile = self.multimodal_recommender.detect_learning_style(
            institution_id, student_id
        )
        
        return {
            'student_id': student_id,
            'generated_at': datetime.utcnow().isoformat(),
            'learning_style_profile': learning_style_profile,
            'summary': {
                'total_weak_areas': len(weak_areas),
                'similar_peers_found': len(similar_students),
                'materials_recommended': len(material_recommendations),
                'external_sources': len(external_content),
                'study_paths_generated': len(study_paths)
            },
            'recommended_materials': material_recommendations[:20],
            'external_content': external_content,
            'study_paths': study_paths,
            'weak_areas_summary': [
                {
                    'id': wa.id,
                    'subject': wa.subject.name,
                    'chapter': wa.chapter.name if wa.chapter else None,
                    'topic': wa.topic.name if wa.topic else None,
                    'weakness_score': float(wa.weakness_score),
                    'average_score': float(wa.average_score or 0),
                    'difficulty_recommendation': self.difficulty_detector.detect_student_difficulty_level(
                        institution_id, student_id, wa.chapter_id
                    ) if wa.chapter_id else None
                }
                for wa in weak_areas[:10]
            ]
        }
    
    def _merge_all_recommendations(
        self,
        style_recs: List[Dict[str, Any]],
        difficulty_recs: List[Dict[str, Any]],
        peer_recs: List[Tuple[int, float, str]]
    ) -> List[Dict[str, Any]]:
        """Merge recommendations from all sources with weighted scoring"""
        merged = {}
        
        for rec in style_recs:
            material_id = rec['material_id']
            merged[material_id] = {
                'material_id': material_id,
                'material': rec['material'],
                'score': rec['style_match_score'] * 0.4,
                'reasons': [rec['explanation']],
                'sources': ['learning_style']
            }
        
        for rec in difficulty_recs:
            material_id = rec['material_id']
            if material_id in merged:
                merged[material_id]['score'] += rec['relevance_score'] * 0.3
                merged[material_id]['reasons'].append(rec['reasoning'])
                merged[material_id]['sources'].append('difficulty_match')
            else:
                merged[material_id] = {
                    'material_id': material_id,
                    'material': rec['material'],
                    'score': rec['relevance_score'] * 0.3,
                    'reasons': [rec['reasoning']],
                    'sources': ['difficulty_match']
                }
        
        for material_id, peer_score, peer_reason in peer_recs:
            if material_id in merged:
                merged[material_id]['score'] += peer_score * 0.3
                merged[material_id]['reasons'].append(peer_reason)
                merged[material_id]['sources'].append('peer_success')
            else:
                material = self.db.query(StudyMaterial).filter(
                    StudyMaterial.id == material_id
                ).first()
                
                if material:
                    merged[material_id] = {
                        'material_id': material_id,
                        'material': material,
                        'score': peer_score * 0.3,
                        'reasons': [peer_reason],
                        'sources': ['peer_success']
                    }
        
        result = []
        for mat_id, data in merged.items():
            effectiveness = self.effectiveness_engine.calculate_material_effectiveness(
                data['material'].institution_id,
                mat_id
            )
            
            if effectiveness:
                data['score'] += effectiveness['effectiveness_score'] * 0.2
                if effectiveness['effectiveness_score'] > 0.7:
                    data['reasons'].append(
                        f"Highly effective (avg improvement: {effectiveness['avg_improvement']:.1f}%)"
                    )
            
            data['explanation'] = ' | '.join(data['reasons'])
            result.append(data)
        
        result.sort(key=lambda x: x['score'], reverse=True)
        return result
    
    def get_recommendations_for_topic(
        self,
        institution_id: int,
        student_id: int,
        topic_id: int,
        include_external: bool = True
    ) -> Dict[str, Any]:
        """Get targeted recommendations for specific topic"""
        topic = self.db.query(Topic).filter(Topic.id == topic_id).first()
        
        if not topic:
            return {'error': 'Topic not found'}
        
        difficulty_info = self.difficulty_detector.detect_student_difficulty_level(
            institution_id, student_id, topic.chapter_id
        )
        
        materials = self.db.query(StudyMaterial).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.topic_id == topic_id,
            StudyMaterial.is_active == True
        ).all()
        
        learning_style = self.multimodal_recommender.detect_learning_style(
            institution_id, student_id
        )
        
        recommendations = []
        for material in materials:
            style_match = self.multimodal_recommender._calculate_style_match(
                material, learning_style
            )
            effectiveness = self.effectiveness_engine.calculate_material_effectiveness(
                institution_id, material.id
            )
            
            score = style_match * 0.5 + (effectiveness['effectiveness_score'] * 0.5 if effectiveness else 0)
            
            recommendations.append({
                'material_id': material.id,
                'material': material,
                'score': score,
                'style_match': style_match,
                'effectiveness': effectiveness
            })
        
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        result = {
            'topic_id': topic_id,
            'topic_name': topic.name,
            'chapter_name': topic.chapter.name if topic.chapter else None,
            'subject_name': topic.chapter.subject.name if topic.chapter else None,
            'difficulty_recommendation': difficulty_info,
            'learning_style_profile': learning_style,
            'internal_materials': recommendations,
        }
        
        if include_external:
            result['external_content'] = self.external_integrator.get_comprehensive_external_content(
                topic.name,
                topic.chapter.subject.name if topic.chapter else 'General'
            )
        
        return result
