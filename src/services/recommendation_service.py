from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, case
from collections import defaultdict
from decimal import Decimal
import math

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


class CollaborativeFilteringEngine:
    """Collaborative filtering for peer-based recommendations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def find_similar_students(
        self,
        institution_id: int,
        student_id: int,
        limit: int = 20
    ) -> List[Tuple[int, float]]:
        """Find similar students based on performance patterns"""
        target_performances = self._get_student_performance_vector(
            institution_id, student_id
        )
        
        if not target_performances:
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
                similarity = self._calculate_cosine_similarity(
                    target_performances, peer_performances
                )
                
                if similarity > 0.5:
                    similarities.append((peer.id, similarity))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
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
        """Calculate cosine similarity between two vectors"""
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
        """Get materials that helped similar students with similar weaknesses"""
        student_ids = [s[0] for s in similar_students]
        similarity_map = {s[0]: s[1] for s in similar_students}
        
        material_scores = defaultdict(lambda: {'score': 0.0, 'reason': ''})
        
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
                score = similarity * min(access_count / 10.0, 1.0)
                
                material_scores[material_id]['score'] += score
                material_scores[material_id]['reason'] = f"Used by {len([s for s in student_ids if s in similarity_map])} similar high-performing peers"
        
        sorted_materials = sorted(
            material_scores.items(),
            key=lambda x: x[1]['score'],
            reverse=True
        )
        
        return [
            (mat_id, data['score'], data['reason'])
            for mat_id, data in sorted_materials[:limit]
        ]


class ContentBasedRecommendationEngine:
    """Content-based filtering using item features and student preferences"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def recommend_study_materials(
        self,
        institution_id: int,
        student_id: int,
        weak_areas: List[WeakArea],
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """Recommend study materials based on weak areas and learning preferences"""
        recommendations = []
        
        student = self.db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()
        
        if not student:
            return []
        
        learning_preferences = self._get_learning_preferences(
            institution_id, student_id
        )
        
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
            
            if weak_area.topic_id:
                materials = materials.filter(
                    StudyMaterial.topic_id == weak_area.topic_id
                )
            
            materials = materials.all()
            
            for material in materials:
                score = self._calculate_material_relevance_score(
                    material,
                    weak_area,
                    learning_preferences
                )
                
                if score > 0.3:
                    explanation = self._generate_material_explanation(
                        material,
                        weak_area,
                        learning_preferences
                    )
                    
                    recommendations.append({
                        'material_id': material.id,
                        'material': material,
                        'weak_area_id': weak_area.id,
                        'relevance_score': score,
                        'explanation': explanation,
                        'type': material.material_type.value,
                        'title': material.title
                    })
        
        recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
        return recommendations[:limit]
    
    def _get_learning_preferences(
        self,
        institution_id: int,
        student_id: int
    ) -> Dict[str, Any]:
        """Infer learning preferences from past material access patterns"""
        access_logs = self.db.query(
            MaterialAccessLog.material_id,
            func.count(MaterialAccessLog.id).label('access_count')
        ).join(User).join(Student, Student.user_id == User.id).filter(
            MaterialAccessLog.institution_id == institution_id,
            Student.id == student_id
        ).group_by(MaterialAccessLog.material_id).all()
        
        material_type_counts = defaultdict(int)
        
        for log in access_logs:
            material = self.db.query(StudyMaterial).filter(
                StudyMaterial.id == log.material_id
            ).first()
            
            if material:
                material_type_counts[material.material_type.value] += log.access_count
        
        total_accesses = sum(material_type_counts.values())
        
        preferences = {
            'preferred_types': material_type_counts,
            'video_preference': material_type_counts.get(MaterialType.VIDEO.value, 0) / max(total_accesses, 1),
            'pdf_preference': material_type_counts.get(MaterialType.PDF.value, 0) / max(total_accesses, 1),
            'total_accesses': total_accesses
        }
        
        return preferences
    
    def _calculate_material_relevance_score(
        self,
        material: StudyMaterial,
        weak_area: WeakArea,
        preferences: Dict[str, Any]
    ) -> float:
        """Calculate how relevant a material is for a weak area"""
        score = 0.0
        
        if material.chapter_id == weak_area.chapter_id:
            score += 0.4
        
        if material.topic_id == weak_area.topic_id:
            score += 0.3
        
        if material.subject_id == weak_area.subject_id:
            score += 0.1
        
        type_preference = preferences['preferred_types'].get(
            material.material_type.value, 0
        )
        preference_score = min(type_preference / max(preferences['total_accesses'], 1), 0.2)
        score += preference_score
        
        popularity_score = min(material.view_count / 100.0, 0.1)
        score += popularity_score
        
        return min(score, 1.0)
    
    def _generate_material_explanation(
        self,
        material: StudyMaterial,
        weak_area: WeakArea,
        preferences: Dict[str, Any]
    ) -> str:
        """Generate explanation for why material was recommended"""
        reasons = []
        
        if material.topic_id == weak_area.topic_id:
            reasons.append(f"Covers your weak topic: {material.topic.name if material.topic else 'this topic'}")
        elif material.chapter_id == weak_area.chapter_id:
            reasons.append(f"Covers your weak chapter: {material.chapter.name if material.chapter else 'this chapter'}")
        
        if material.material_type.value in preferences['preferred_types']:
            reasons.append(f"Matches your preferred learning format ({material.material_type.value})")
        
        if material.view_count > 50:
            reasons.append(f"Popular resource (viewed {material.view_count} times)")
        
        return "; ".join(reasons) if reasons else "Relevant to your learning needs"


class PracticeQuestionRecommender:
    """Recommend practice questions targeting specific skill gaps"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def recommend_questions(
        self,
        institution_id: int,
        student_id: int,
        weak_areas: List[WeakArea],
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Recommend practice questions with optimal difficulty levels"""
        recommendations = []
        
        student_ability = self._estimate_student_ability(
            institution_id, student_id
        )
        
        for weak_area in weak_areas[:10]:
            optimal_difficulty = self._calculate_optimal_difficulty(
                weak_area, student_ability
            )
            
            questions = self.db.query(QuestionBank).filter(
                QuestionBank.institution_id == institution_id,
                QuestionBank.subject_id == weak_area.subject_id,
                QuestionBank.is_active == True
            )
            
            if weak_area.chapter_id:
                questions = questions.filter(
                    QuestionBank.chapter_id == weak_area.chapter_id
                )
            
            if weak_area.topic_id:
                questions = questions.filter(
                    QuestionBank.topic_id == weak_area.topic_id
                )
            
            questions = questions.all()
            
            for question in questions:
                difficulty_match = self._calculate_difficulty_match(
                    question.difficulty_level,
                    optimal_difficulty
                )
                
                if difficulty_match > 0.5:
                    explanation = self._generate_question_explanation(
                        question,
                        weak_area,
                        optimal_difficulty,
                        student_ability
                    )
                    
                    recommendations.append({
                        'question_id': question.id,
                        'question': question,
                        'weak_area_id': weak_area.id,
                        'difficulty_match_score': difficulty_match,
                        'optimal_difficulty': optimal_difficulty,
                        'explanation': explanation,
                        'skill_gap_coverage': float(weak_area.weakness_score)
                    })
        
        recommendations.sort(key=lambda x: x['difficulty_match_score'], reverse=True)
        return recommendations[:limit]
    
    def _estimate_student_ability(
        self,
        institution_id: int,
        student_id: int
    ) -> float:
        """Estimate student's overall ability level (0-1 scale)"""
        performances = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.institution_id == institution_id,
            ChapterPerformance.student_id == student_id
        ).all()
        
        if not performances:
            return 0.5
        
        avg_mastery = sum(float(p.mastery_score) for p in performances) / len(performances)
        return avg_mastery / 100.0
    
    def _calculate_optimal_difficulty(
        self,
        weak_area: WeakArea,
        student_ability: float
    ) -> str:
        """Calculate optimal difficulty level for a weak area"""
        avg_score = float(weak_area.average_score or 50) / 100.0
        
        combined_ability = (student_ability * 0.4) + (avg_score * 0.6)
        
        if combined_ability < 0.3:
            return DifficultyLevel.VERY_EASY.value
        elif combined_ability < 0.5:
            return DifficultyLevel.EASY.value
        elif combined_ability < 0.7:
            return DifficultyLevel.MEDIUM.value
        elif combined_ability < 0.85:
            return DifficultyLevel.HARD.value
        else:
            return DifficultyLevel.VERY_HARD.value
    
    def _calculate_difficulty_match(
        self,
        question_difficulty: DifficultyLevel,
        optimal_difficulty: str
    ) -> float:
        """Calculate how well question difficulty matches optimal difficulty"""
        difficulty_map = {
            DifficultyLevel.VERY_EASY.value: 1,
            DifficultyLevel.EASY.value: 2,
            DifficultyLevel.MEDIUM.value: 3,
            DifficultyLevel.HARD.value: 4,
            DifficultyLevel.VERY_HARD.value: 5
        }
        
        question_level = difficulty_map.get(question_difficulty.value, 3)
        optimal_level = difficulty_map.get(optimal_difficulty, 3)
        
        diff = abs(question_level - optimal_level)
        
        if diff == 0:
            return 1.0
        elif diff == 1:
            return 0.8
        elif diff == 2:
            return 0.5
        else:
            return 0.2
    
    def _generate_question_explanation(
        self,
        question: QuestionBank,
        weak_area: WeakArea,
        optimal_difficulty: str,
        student_ability: float
    ) -> str:
        """Generate explanation for question recommendation"""
        reasons = []
        
        reasons.append(f"Targets your weak area: {weak_area.subject.name}")
        
        if question.topic_id == weak_area.topic_id:
            reasons.append("Covers the specific topic you're struggling with")
        
        reasons.append(f"Difficulty level ({question.difficulty_level.value}) matches your current ability")
        
        if student_ability < 0.5:
            reasons.append("Designed to build foundational understanding")
        else:
            reasons.append("Challenges you to strengthen mastery")
        
        return "; ".join(reasons)


class StudyGroupRecommender:
    """Recommend study groups based on learning styles and schedules"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def recommend_study_groups(
        self,
        institution_id: int,
        student_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Recommend study groups matching learning style and schedule"""
        recommendations = []
        
        student = self.db.query(Student).filter(
            Student.id == student_id,
            Student.institution_id == institution_id
        ).first()
        
        if not student:
            return []
        
        weak_areas = self.db.query(WeakArea).filter(
            WeakArea.institution_id == institution_id,
            WeakArea.student_id == student_id,
            WeakArea.is_resolved == False
        ).all()
        
        weak_subject_ids = list(set([w.subject_id for w in weak_areas]))
        
        study_groups = self.db.query(StudyGroup).filter(
            StudyGroup.institution_id == institution_id,
            StudyGroup.is_public == True,
            or_(
                StudyGroup.max_members.is_(None),
                StudyGroup.member_count < StudyGroup.max_members
            )
        ).all()
        
        for group in study_groups:
            is_member = self.db.query(GroupMember).filter(
                GroupMember.group_id == group.id,
                GroupMember.user_id == student.user_id
            ).first()
            
            if is_member:
                continue
            
            compatibility_score = self._calculate_group_compatibility(
                group, student, weak_subject_ids
            )
            
            if compatibility_score > 0.3:
                explanation = self._generate_group_explanation(
                    group, student, weak_subject_ids, compatibility_score
                )
                
                recommendations.append({
                    'group_id': group.id,
                    'group': group,
                    'compatibility_score': compatibility_score,
                    'explanation': explanation,
                    'member_count': group.member_count,
                    'subject': group.subject.name if group.subject else "Multi-subject"
                })
        
        recommendations.sort(key=lambda x: x['compatibility_score'], reverse=True)
        return recommendations[:limit]
    
    def _calculate_group_compatibility(
        self,
        group: StudyGroup,
        student: Student,
        weak_subject_ids: List[int]
    ) -> float:
        """Calculate compatibility between student and study group"""
        score = 0.0
        
        if group.subject_id in weak_subject_ids:
            score += 0.5
        
        members = self.db.query(GroupMember).filter(
            GroupMember.group_id == group.id
        ).all()
        
        same_section_count = 0
        for member in members:
            member_student = self.db.query(Student).filter(
                Student.user_id == member.user_id
            ).first()
            
            if member_student and member_student.section_id == student.section_id:
                same_section_count += 1
        
        if same_section_count > 0:
            score += 0.2
        
        if group.member_count >= 3 and group.member_count <= 8:
            score += 0.15
        
        activity_score = min(group.resource_count / 20.0, 0.15)
        score += activity_score
        
        return min(score, 1.0)
    
    def _generate_group_explanation(
        self,
        group: StudyGroup,
        student: Student,
        weak_subject_ids: List[int],
        compatibility_score: float
    ) -> str:
        """Generate explanation for group recommendation"""
        reasons = []
        
        if group.subject_id in weak_subject_ids:
            reasons.append(f"Focuses on {group.subject.name}, which you're working to improve")
        
        if group.member_count >= 3 and group.member_count <= 8:
            reasons.append(f"Optimal group size ({group.member_count} members) for effective collaboration")
        
        if group.resource_count > 5:
            reasons.append(f"Active group with {group.resource_count} shared resources")
        
        members = self.db.query(GroupMember).filter(
            GroupMember.group_id == group.id
        ).all()
        
        same_section_count = sum(
            1 for m in members
            if self.db.query(Student).filter(
                Student.user_id == m.user_id,
                Student.section_id == student.section_id
            ).first()
        )
        
        if same_section_count > 0:
            reasons.append(f"{same_section_count} classmate(s) already in this group")
        
        return "; ".join(reasons) if reasons else "Matches your learning needs"


class VideoResourceRecommender:
    """Recommend video/resources based on chapter progress and preferences"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def recommend_videos(
        self,
        institution_id: int,
        student_id: int,
        chapter_progress: Dict[int, float],
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """Recommend videos based on chapter progress and learning preferences"""
        recommendations = []
        
        weak_chapters = [
            chapter_id for chapter_id, progress in chapter_progress.items()
            if progress < 70.0
        ]
        
        learning_preferences = self._get_learning_preferences(
            institution_id, student_id
        )
        
        videos = self.db.query(StudyMaterial).filter(
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.material_type == MaterialType.VIDEO,
            StudyMaterial.is_active == True
        )
        
        if weak_chapters:
            videos = videos.filter(
                StudyMaterial.chapter_id.in_(weak_chapters)
            )
        
        videos = videos.all()
        
        for video in videos:
            relevance_score = self._calculate_video_relevance(
                video, chapter_progress, learning_preferences
            )
            
            if relevance_score > 0.3:
                explanation = self._generate_video_explanation(
                    video, chapter_progress
                )
                
                recommendations.append({
                    'material_id': video.id,
                    'video': video,
                    'relevance_score': relevance_score,
                    'explanation': explanation,
                    'chapter': video.chapter.name if video.chapter else "General",
                    'view_count': video.view_count
                })
        
        recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
        return recommendations[:limit]
    
    def _get_learning_preferences(
        self,
        institution_id: int,
        student_id: int
    ) -> Dict[str, Any]:
        """Get student's video learning preferences"""
        access_logs = self.db.query(MaterialAccessLog).join(
            StudyMaterial
        ).join(User).join(
            Student, Student.user_id == User.id
        ).filter(
            MaterialAccessLog.institution_id == institution_id,
            Student.id == student_id,
            StudyMaterial.material_type == MaterialType.VIDEO
        ).all()
        
        watched_chapters = defaultdict(int)
        for log in access_logs:
            if log.material.chapter_id:
                watched_chapters[log.material.chapter_id] += 1
        
        return {
            'watched_chapters': watched_chapters,
            'total_videos_watched': len(access_logs)
        }
    
    def _calculate_video_relevance(
        self,
        video: StudyMaterial,
        chapter_progress: Dict[int, float],
        preferences: Dict[str, Any]
    ) -> float:
        """Calculate video relevance score"""
        score = 0.0
        
        if video.chapter_id in chapter_progress:
            progress = chapter_progress[video.chapter_id]
            if progress < 70:
                score += 0.5 * (1 - progress / 100.0)
        
        if video.chapter_id in preferences['watched_chapters']:
            score += 0.2
        
        popularity_score = min(video.view_count / 100.0, 0.2)
        score += popularity_score
        
        if video.tags:
            score += 0.1
        
        return min(score, 1.0)
    
    def _generate_video_explanation(
        self,
        video: StudyMaterial,
        chapter_progress: Dict[int, float]
    ) -> str:
        """Generate explanation for video recommendation"""
        reasons = []
        
        if video.chapter_id in chapter_progress:
            progress = chapter_progress[video.chapter_id]
            if progress < 50:
                reasons.append(f"Helps build foundation in {video.chapter.name}")
            elif progress < 70:
                reasons.append(f"Strengthens understanding of {video.chapter.name}")
        
        if video.view_count > 50:
            reasons.append(f"Popular video resource ({video.view_count} views)")
        
        if video.description:
            reasons.append("Comprehensive coverage of the topic")
        
        return "; ".join(reasons) if reasons else "Relevant video resource for your learning"


class RecommendationExplanationSystem:
    """Generate comprehensive explanations for recommendations"""
    
    @staticmethod
    def explain_study_material_recommendation(
        material: StudyMaterial,
        weak_area: WeakArea,
        peer_success: bool = False,
        similarity_score: float = 0.0
    ) -> Dict[str, Any]:
        """Generate detailed explanation for study material recommendation"""
        explanation = {
            'material_title': material.title,
            'material_type': material.material_type.value,
            'primary_reason': '',
            'supporting_reasons': [],
            'peer_insights': None,
            'effectiveness_indicators': [],
            'recommended_action': ''
        }
        
        if material.topic_id == weak_area.topic_id:
            explanation['primary_reason'] = f"Directly addresses your weak topic: {material.topic.name if material.topic else 'this topic'}"
        elif material.chapter_id == weak_area.chapter_id:
            explanation['primary_reason'] = f"Covers your weak chapter: {material.chapter.name if material.chapter else 'this chapter'}"
        else:
            explanation['primary_reason'] = f"Relevant to {weak_area.subject.name}"
        
        explanation['supporting_reasons'].append(
            f"Your current performance: {float(weak_area.average_score or 0):.1f}%"
        )
        
        if peer_success:
            explanation['peer_insights'] = {
                'message': f"Similar high-performing students found this helpful",
                'similarity_score': round(similarity_score * 100, 1)
            }
        
        if material.view_count > 50:
            explanation['effectiveness_indicators'].append(
                f"Highly accessed resource ({material.view_count} views)"
            )
        
        if material.download_count > 20:
            explanation['effectiveness_indicators'].append(
                f"Frequently downloaded ({material.download_count} downloads)"
            )
        
        explanation['recommended_action'] = f"Study this {material.material_type.value} to improve your understanding of the weak area"
        
        return explanation
    
    @staticmethod
    def explain_question_recommendation(
        question: QuestionBank,
        weak_area: WeakArea,
        difficulty_match_score: float,
        student_ability: float
    ) -> Dict[str, Any]:
        """Generate detailed explanation for question recommendation"""
        explanation = {
            'question_info': {
                'difficulty': question.difficulty_level.value,
                'type': question.question_type.value,
                'marks': question.marks
            },
            'why_recommended': '',
            'difficulty_reasoning': '',
            'skill_development': [],
            'expected_outcome': ''
        }
        
        explanation['why_recommended'] = f"Targets your weak area in {weak_area.subject.name}"
        
        if difficulty_match_score > 0.8:
            explanation['difficulty_reasoning'] = "Perfect difficulty match for your current ability level"
        elif difficulty_match_score > 0.6:
            explanation['difficulty_reasoning'] = "Good difficulty match to challenge you appropriately"
        else:
            explanation['difficulty_reasoning'] = "Slightly challenging to promote growth"
        
        if student_ability < 0.5:
            explanation['skill_development'].append("Builds foundational understanding")
            explanation['expected_outcome'] = "Strengthens basic concepts and improves confidence"
        else:
            explanation['skill_development'].append("Enhances advanced problem-solving skills")
            explanation['expected_outcome'] = "Deepens mastery and prepares for complex scenarios"
        
        if question.bloom_taxonomy_level:
            explanation['skill_development'].append(
                f"Develops {question.bloom_taxonomy_level.value} level thinking"
            )
        
        return explanation
    
    @staticmethod
    def explain_study_group_recommendation(
        group: StudyGroup,
        compatibility_score: float,
        matching_subjects: bool,
        peer_count: int
    ) -> Dict[str, Any]:
        """Generate detailed explanation for study group recommendation"""
        explanation = {
            'group_name': group.name,
            'group_focus': group.subject.name if group.subject else "Multi-subject",
            'compatibility_score': round(compatibility_score * 100, 1),
            'key_benefits': [],
            'group_dynamics': {},
            'recommendation_strength': ''
        }
        
        if matching_subjects:
            explanation['key_benefits'].append(
                "Group focuses on subjects you're working to improve"
            )
        
        explanation['group_dynamics'] = {
            'member_count': group.member_count,
            'size_rating': 'Optimal' if 3 <= group.member_count <= 8 else 'Good',
            'activity_level': 'Active' if group.resource_count > 5 else 'Moderate'
        }
        
        if peer_count > 0:
            explanation['key_benefits'].append(
                f"{peer_count} of your classmates are already members"
            )
        
        if group.resource_count > 5:
            explanation['key_benefits'].append(
                f"Active resource sharing ({group.resource_count} resources)"
            )
        
        if compatibility_score > 0.7:
            explanation['recommendation_strength'] = "Highly Recommended"
        elif compatibility_score > 0.5:
            explanation['recommendation_strength'] = "Recommended"
        else:
            explanation['recommendation_strength'] = "Consider Joining"
        
        return explanation


class IntelligentRecommendationService:
    """Main service coordinating all recommendation engines"""
    
    def __init__(self, db: Session):
        self.db = db
        self.collaborative_engine = CollaborativeFilteringEngine(db)
        self.content_engine = ContentBasedRecommendationEngine(db)
        self.question_recommender = PracticeQuestionRecommender(db)
        self.group_recommender = StudyGroupRecommender(db)
        self.video_recommender = VideoResourceRecommender(db)
        self.explanation_system = RecommendationExplanationSystem()
    
    def generate_comprehensive_recommendations(
        self,
        institution_id: int,
        student_id: int
    ) -> Dict[str, Any]:
        """Generate all types of recommendations with explanations"""
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
        
        content_materials = self.content_engine.recommend_study_materials(
            institution_id, student_id, weak_areas, limit=15
        )
        
        material_recommendations = self._merge_material_recommendations(
            content_materials, peer_materials
        )
        
        question_recommendations = self.question_recommender.recommend_questions(
            institution_id, student_id, weak_areas, limit=20
        )
        
        group_recommendations = self.group_recommender.recommend_study_groups(
            institution_id, student_id, limit=10
        )
        
        chapter_progress = self._get_chapter_progress(institution_id, student_id)
        
        video_recommendations = self.video_recommender.recommend_videos(
            institution_id, student_id, chapter_progress, limit=15
        )
        
        return {
            'student_id': student_id,
            'generated_at': datetime.utcnow().isoformat(),
            'summary': {
                'total_weak_areas': len(weak_areas),
                'similar_peers_found': len(similar_students),
                'materials_recommended': len(material_recommendations),
                'questions_recommended': len(question_recommendations),
                'groups_recommended': len(group_recommendations),
                'videos_recommended': len(video_recommendations)
            },
            'study_materials': material_recommendations[:15],
            'practice_questions': question_recommendations[:20],
            'study_groups': group_recommendations[:10],
            'video_resources': video_recommendations[:15],
            'weak_areas_summary': [
                {
                    'id': w.id,
                    'subject': w.subject.name,
                    'chapter': w.chapter.name if w.chapter else None,
                    'topic': w.topic.name if w.topic else None,
                    'weakness_score': float(w.weakness_score),
                    'average_score': float(w.average_score or 0)
                }
                for w in weak_areas[:10]
            ]
        }
    
    def _merge_material_recommendations(
        self,
        content_materials: List[Dict[str, Any]],
        peer_materials: List[Tuple[int, float, str]]
    ) -> List[Dict[str, Any]]:
        """Merge content-based and collaborative filtering results"""
        merged = {}
        
        for rec in content_materials:
            material_id = rec['material_id']
            merged[material_id] = {
                'material_id': material_id,
                'material': rec['material'],
                'score': rec['relevance_score'],
                'explanation': rec['explanation'],
                'from_peers': False,
                'peer_score': 0.0
            }
        
        for material_id, peer_score, peer_reason in peer_materials:
            if material_id in merged:
                merged[material_id]['score'] += peer_score * 0.3
                merged[material_id]['from_peers'] = True
                merged[material_id]['peer_score'] = peer_score
                merged[material_id]['explanation'] += f"; {peer_reason}"
            else:
                material = self.db.query(StudyMaterial).filter(
                    StudyMaterial.id == material_id
                ).first()
                
                if material:
                    merged[material_id] = {
                        'material_id': material_id,
                        'material': material,
                        'score': peer_score,
                        'explanation': peer_reason,
                        'from_peers': True,
                        'peer_score': peer_score
                    }
        
        result = list(merged.values())
        result.sort(key=lambda x: x['score'], reverse=True)
        
        return result
    
    def _get_chapter_progress(
        self,
        institution_id: int,
        student_id: int
    ) -> Dict[int, float]:
        """Get chapter-wise progress for student"""
        performances = self.db.query(ChapterPerformance).filter(
            ChapterPerformance.institution_id == institution_id,
            ChapterPerformance.student_id == student_id
        ).all()
        
        return {
            p.chapter_id: float(p.mastery_score)
            for p in performances
        }
    
    def get_recommendation_with_explanation(
        self,
        institution_id: int,
        student_id: int,
        recommendation_type: str,
        item_id: int
    ) -> Dict[str, Any]:
        """Get detailed explanation for a specific recommendation"""
        if recommendation_type == 'material':
            material = self.db.query(StudyMaterial).filter(
                StudyMaterial.id == item_id,
                StudyMaterial.institution_id == institution_id
            ).first()
            
            if not material:
                return {'error': 'Material not found'}
            
            weak_areas = self.db.query(WeakArea).filter(
                WeakArea.institution_id == institution_id,
                WeakArea.student_id == student_id,
                or_(
                    WeakArea.chapter_id == material.chapter_id,
                    WeakArea.topic_id == material.topic_id
                )
            ).first()
            
            if weak_areas:
                return self.explanation_system.explain_study_material_recommendation(
                    material, weak_areas
                )
        
        elif recommendation_type == 'question':
            question = self.db.query(QuestionBank).filter(
                QuestionBank.id == item_id,
                QuestionBank.institution_id == institution_id
            ).first()
            
            if not question:
                return {'error': 'Question not found'}
            
            weak_areas = self.db.query(WeakArea).filter(
                WeakArea.institution_id == institution_id,
                WeakArea.student_id == student_id,
                WeakArea.chapter_id == question.chapter_id
            ).first()
            
            if weak_areas:
                student_ability = self.question_recommender._estimate_student_ability(
                    institution_id, student_id
                )
                
                return self.explanation_system.explain_question_recommendation(
                    question, weak_areas, 0.8, student_ability
                )
        
        elif recommendation_type == 'group':
            group = self.db.query(StudyGroup).filter(
                StudyGroup.id == item_id,
                StudyGroup.institution_id == institution_id
            ).first()
            
            if not group:
                return {'error': 'Group not found'}
            
            student = self.db.query(Student).filter(
                Student.id == student_id
            ).first()
            
            weak_subject_ids = [
                w.subject_id for w in self.db.query(WeakArea).filter(
                    WeakArea.student_id == student_id,
                    WeakArea.is_resolved == False
                ).all()
            ]
            
            compatibility = self.group_recommender._calculate_group_compatibility(
                group, student, weak_subject_ids
            )
            
            return self.explanation_system.explain_study_group_recommendation(
                group, compatibility, group.subject_id in weak_subject_ids, 0
            )
        
        return {'error': 'Invalid recommendation type'}
