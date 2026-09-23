from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case
from decimal import Decimal
import numpy as np

from src.models.learning_styles import (
    LearningStyleProfile, LearningStyleAssessment, ContentTag,
    AdaptiveContentRecommendation, PersonalizedContentFeed,
    ContentDeliveryFormat, ProcessingStyle, SocialPreference, AssessmentStatus
)
from src.models.study_material import StudyMaterial, MaterialType, MaterialAccessLog
from src.models.examination import ExamMarks
from src.models.assignment import Submission
from src.schemas.learning_styles import (
    LearningStyleProfileCreate, LearningStyleProfileUpdate,
    LearningStyleAssessmentCreate, AssessmentResponseSubmit,
    ContentTagCreate, ContentTagUpdate
)


class LearningStylesService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_profile(
        self,
        profile_data: LearningStyleProfileCreate,
        institution_id: int
    ) -> LearningStyleProfile:
        existing = self.db.query(LearningStyleProfile).filter(
            LearningStyleProfile.student_id == profile_data.student_id
        ).first()
        
        if existing:
            return existing
        
        dominant_style = self._determine_dominant_style(
            profile_data.visual_score,
            profile_data.auditory_score,
            profile_data.kinesthetic_score,
            profile_data.reading_writing_score
        )
        
        profile = LearningStyleProfile(
            institution_id=institution_id,
            student_id=profile_data.student_id,
            visual_score=profile_data.visual_score,
            auditory_score=profile_data.auditory_score,
            kinesthetic_score=profile_data.kinesthetic_score,
            reading_writing_score=profile_data.reading_writing_score,
            social_vs_solitary=profile_data.social_vs_solitary,
            social_score=profile_data.social_score,
            sequential_vs_global=profile_data.sequential_vs_global,
            sequential_score=profile_data.sequential_score,
            cognitive_strengths=profile_data.cognitive_strengths,
            dominant_style=dominant_style
        )
        
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        
        return profile
    
    def get_profile(
        self,
        student_id: int,
        institution_id: int
    ) -> Optional[LearningStyleProfile]:
        return self.db.query(LearningStyleProfile).filter(
            and_(
                LearningStyleProfile.student_id == student_id,
                LearningStyleProfile.institution_id == institution_id
            )
        ).first()
    
    def update_profile(
        self,
        student_id: int,
        institution_id: int,
        profile_data: LearningStyleProfileUpdate
    ) -> Optional[LearningStyleProfile]:
        profile = self.get_profile(student_id, institution_id)
        
        if not profile:
            return None
        
        update_dict = profile_data.model_dump(exclude_unset=True)
        
        for key, value in update_dict.items():
            setattr(profile, key, value)
        
        if any(key in update_dict for key in ['visual_score', 'auditory_score', 'kinesthetic_score', 'reading_writing_score']):
            profile.dominant_style = self._determine_dominant_style(
                profile.visual_score,
                profile.auditory_score,
                profile.kinesthetic_score,
                profile.reading_writing_score
            )
        
        self.db.commit()
        self.db.refresh(profile)
        
        return profile
    
    def _determine_dominant_style(
        self,
        visual: Decimal,
        auditory: Decimal,
        kinesthetic: Decimal,
        reading_writing: Decimal
    ) -> str:
        scores = {
            "visual": float(visual),
            "auditory": float(auditory),
            "kinesthetic": float(kinesthetic),
            "reading_writing": float(reading_writing)
        }
        
        return max(scores.items(), key=lambda x: x[1])[0]
    
    def create_assessment(
        self,
        assessment_data: LearningStyleAssessmentCreate,
        institution_id: int
    ) -> LearningStyleAssessment:
        profile = self.get_profile(assessment_data.student_id, institution_id)
        
        if not profile:
            profile_create = LearningStyleProfileCreate(student_id=assessment_data.student_id)
            profile = self.create_profile(profile_create, institution_id)
        
        assessment = LearningStyleAssessment(
            institution_id=institution_id,
            profile_id=profile.id,
            student_id=assessment_data.student_id,
            assessment_type=assessment_data.assessment_type,
            questions=assessment_data.questions,
            status=AssessmentStatus.PENDING
        )
        
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        
        return assessment
    
    def start_assessment(
        self,
        assessment_id: int,
        student_id: int
    ) -> Optional[LearningStyleAssessment]:
        assessment = self.db.query(LearningStyleAssessment).filter(
            and_(
                LearningStyleAssessment.id == assessment_id,
                LearningStyleAssessment.student_id == student_id
            )
        ).first()
        
        if assessment and assessment.status == AssessmentStatus.PENDING:
            assessment.status = AssessmentStatus.IN_PROGRESS
            assessment.started_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(assessment)
        
        return assessment
    
    def submit_assessment(
        self,
        submission: AssessmentResponseSubmit,
        student_id: int
    ) -> Optional[LearningStyleAssessment]:
        assessment = self.db.query(LearningStyleAssessment).filter(
            and_(
                LearningStyleAssessment.id == submission.assessment_id,
                LearningStyleAssessment.student_id == student_id
            )
        ).first()
        
        if not assessment:
            return None
        
        assessment.responses = submission.responses
        assessment.completed_at = datetime.utcnow()
        assessment.status = AssessmentStatus.COMPLETED
        
        if assessment.started_at:
            time_taken = (assessment.completed_at - assessment.started_at).total_seconds()
            assessment.time_taken_seconds = int(time_taken)
        
        scores = self._calculate_assessment_scores(assessment.questions, submission.responses)
        
        assessment.visual_score = Decimal(str(scores['visual']))
        assessment.auditory_score = Decimal(str(scores['auditory']))
        assessment.kinesthetic_score = Decimal(str(scores['kinesthetic']))
        assessment.reading_writing_score = Decimal(str(scores['reading_writing']))
        assessment.social_score = Decimal(str(scores.get('social', 0.5)))
        assessment.sequential_score = Decimal(str(scores.get('sequential', 0.5)))
        
        assessment.cognitive_analysis = self._perform_cognitive_analysis(scores)
        assessment.recommendations = self._generate_recommendations(scores)
        
        profile = self.db.query(LearningStyleProfile).filter(
            LearningStyleProfile.id == assessment.profile_id
        ).first()
        
        if profile:
            profile.visual_score = assessment.visual_score
            profile.auditory_score = assessment.auditory_score
            profile.kinesthetic_score = assessment.kinesthetic_score
            profile.reading_writing_score = assessment.reading_writing_score
            profile.social_score = assessment.social_score
            profile.sequential_score = assessment.sequential_score
            
            profile.dominant_style = self._determine_dominant_style(
                profile.visual_score,
                profile.auditory_score,
                profile.kinesthetic_score,
                profile.reading_writing_score
            )
            
            profile.last_assessment_date = datetime.utcnow()
            profile.total_assessments += 1
            profile.assessment_results = scores
        
        self.db.commit()
        self.db.refresh(assessment)
        
        return assessment
    
    def _calculate_assessment_scores(
        self,
        questions: List[Dict[str, Any]],
        responses: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        scores = {
            'visual': 0.0,
            'auditory': 0.0,
            'kinesthetic': 0.0,
            'reading_writing': 0.0,
            'social': 0.0,
            'sequential': 0.0
        }
        
        response_map = {r.get('question_id'): r.get('answer') for r in responses}
        
        for question in questions:
            question_id = question.get('id')
            answer = response_map.get(question_id)
            
            if answer and 'style_weights' in question:
                weights = question['style_weights']
                for style, weight in weights.items():
                    if style in scores:
                        scores[style] += float(weight)
        
        total = sum(scores[k] for k in ['visual', 'auditory', 'kinesthetic', 'reading_writing'])
        if total > 0:
            scores['visual'] = scores['visual'] / total
            scores['auditory'] = scores['auditory'] / total
            scores['kinesthetic'] = scores['kinesthetic'] / total
            scores['reading_writing'] = scores['reading_writing'] / total
        else:
            scores['visual'] = 0.25
            scores['auditory'] = 0.25
            scores['kinesthetic'] = 0.25
            scores['reading_writing'] = 0.25
        
        return scores
    
    def _perform_cognitive_analysis(self, scores: Dict[str, float]) -> Dict[str, Any]:
        analysis = {
            "dominant_modality": max(
                [(k, v) for k, v in scores.items() if k in ['visual', 'auditory', 'kinesthetic', 'reading_writing']],
                key=lambda x: x[1]
            )[0],
            "learning_preferences": [],
            "strengths": [],
            "development_areas": []
        }
        
        if scores['visual'] > 0.3:
            analysis["learning_preferences"].append("Prefers charts, diagrams, and visual aids")
            analysis["strengths"].append("Strong visual processing")
        
        if scores['auditory'] > 0.3:
            analysis["learning_preferences"].append("Benefits from lectures and discussions")
            analysis["strengths"].append("Strong auditory processing")
        
        if scores['kinesthetic'] > 0.3:
            analysis["learning_preferences"].append("Learns best through hands-on activities")
            analysis["strengths"].append("Strong kinesthetic learning")
        
        if scores['reading_writing'] > 0.3:
            analysis["learning_preferences"].append("Prefers text-based learning")
            analysis["strengths"].append("Strong reading/writing skills")
        
        min_score = min(scores[k] for k in ['visual', 'auditory', 'kinesthetic', 'reading_writing'])
        for style, score in scores.items():
            if style in ['visual', 'auditory', 'kinesthetic', 'reading_writing'] and score == min_score:
                analysis["development_areas"].append(f"Could develop {style} learning skills")
        
        return analysis
    
    def _generate_recommendations(self, scores: Dict[str, float]) -> Dict[str, Any]:
        recommendations = {
            "content_formats": [],
            "study_strategies": [],
            "tools_and_resources": []
        }
        
        sorted_scores = sorted(
            [(k, v) for k, v in scores.items() if k in ['visual', 'auditory', 'kinesthetic', 'reading_writing']],
            key=lambda x: x[1],
            reverse=True
        )
        
        top_style = sorted_scores[0][0]
        
        if top_style == "visual":
            recommendations["content_formats"] = ["Videos", "Infographics", "Mind maps", "Diagrams"]
            recommendations["study_strategies"] = ["Use color coding", "Create visual summaries", "Watch educational videos"]
            recommendations["tools_and_resources"] = ["Concept mapping software", "Visual note-taking apps"]
        elif top_style == "auditory":
            recommendations["content_formats"] = ["Podcasts", "Audio lectures", "Discussion groups"]
            recommendations["study_strategies"] = ["Record and listen to notes", "Participate in discussions", "Use verbal repetition"]
            recommendations["tools_and_resources"] = ["Audio recording apps", "Text-to-speech tools"]
        elif top_style == "kinesthetic":
            recommendations["content_formats"] = ["Interactive simulations", "Hands-on activities", "Lab experiments"]
            recommendations["study_strategies"] = ["Take frequent breaks", "Use physical objects", "Practice through doing"]
            recommendations["tools_and_resources"] = ["Interactive learning platforms", "Virtual labs"]
        elif top_style == "reading_writing":
            recommendations["content_formats"] = ["Textbooks", "Articles", "Written summaries"]
            recommendations["study_strategies"] = ["Take detailed notes", "Rewrite information", "Create lists and outlines"]
            recommendations["tools_and_resources"] = ["Note-taking apps", "Writing tools"]
        
        return recommendations
    
    def get_student_assessments(
        self,
        student_id: int,
        institution_id: int
    ) -> List[LearningStyleAssessment]:
        return self.db.query(LearningStyleAssessment).filter(
            and_(
                LearningStyleAssessment.student_id == student_id,
                LearningStyleAssessment.institution_id == institution_id
            )
        ).order_by(desc(LearningStyleAssessment.created_at)).all()
    
    def create_content_tag(
        self,
        tag_data: ContentTagCreate,
        institution_id: int,
        user_id: Optional[int] = None
    ) -> ContentTag:
        existing = self.db.query(ContentTag).filter(
            and_(
                ContentTag.content_type == tag_data.content_type,
                ContentTag.content_id == tag_data.content_id
            )
        ).first()
        
        if existing:
            return existing
        
        tag = ContentTag(
            institution_id=institution_id,
            content_type=tag_data.content_type,
            content_id=tag_data.content_id,
            visual_suitability=tag_data.visual_suitability,
            auditory_suitability=tag_data.auditory_suitability,
            kinesthetic_suitability=tag_data.kinesthetic_suitability,
            reading_writing_suitability=tag_data.reading_writing_suitability,
            delivery_format=tag_data.delivery_format,
            difficulty_level=tag_data.difficulty_level,
            supports_social_learning=tag_data.supports_social_learning,
            supports_solitary_learning=tag_data.supports_solitary_learning,
            sequential_flow=tag_data.sequential_flow,
            holistic_approach=tag_data.holistic_approach,
            metadata_json=tag_data.metadata,
            tagged_by=user_id,
            auto_tagged=tag_data.auto_tagged
        )
        
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        
        return tag
    
    def update_content_tag(
        self,
        content_type: str,
        content_id: int,
        tag_data: ContentTagUpdate
    ) -> Optional[ContentTag]:
        tag = self.db.query(ContentTag).filter(
            and_(
                ContentTag.content_type == content_type,
                ContentTag.content_id == content_id
            )
        ).first()
        
        if not tag:
            return None
        
        update_dict = tag_data.model_dump(exclude_unset=True)
        
        for key, value in update_dict.items():
            setattr(tag, key, value)
        
        self.db.commit()
        self.db.refresh(tag)
        
        return tag
    
    def get_content_tag(
        self,
        content_type: str,
        content_id: int
    ) -> Optional[ContentTag]:
        return self.db.query(ContentTag).filter(
            and_(
                ContentTag.content_type == content_type,
                ContentTag.content_id == content_id
            )
        ).first()
    
    def auto_tag_content(
        self,
        content_type: str,
        content_id: int,
        institution_id: int
    ) -> ContentTag:
        if content_type == "study_material":
            material = self.db.query(StudyMaterial).filter(
                StudyMaterial.id == content_id
            ).first()
            
            if not material:
                return None
            
            suitability_scores = self._infer_suitability_from_material_type(material.material_type)
            delivery_format = self._map_material_type_to_format(material.material_type)
            
            tag_data = ContentTagCreate(
                content_type=content_type,
                content_id=content_id,
                visual_suitability=Decimal(str(suitability_scores['visual'])),
                auditory_suitability=Decimal(str(suitability_scores['auditory'])),
                kinesthetic_suitability=Decimal(str(suitability_scores['kinesthetic'])),
                reading_writing_suitability=Decimal(str(suitability_scores['reading_writing'])),
                delivery_format=delivery_format,
                auto_tagged=True
            )
            
            return self.create_content_tag(tag_data, institution_id)
        
        return None
    
    def _infer_suitability_from_material_type(self, material_type: MaterialType) -> Dict[str, float]:
        type_mappings = {
            MaterialType.VIDEO: {'visual': 0.9, 'auditory': 0.8, 'kinesthetic': 0.3, 'reading_writing': 0.2},
            MaterialType.AUDIO: {'visual': 0.1, 'auditory': 0.95, 'kinesthetic': 0.2, 'reading_writing': 0.1},
            MaterialType.PDF: {'visual': 0.6, 'auditory': 0.1, 'kinesthetic': 0.2, 'reading_writing': 0.9},
            MaterialType.DOCUMENT: {'visual': 0.5, 'auditory': 0.1, 'kinesthetic': 0.2, 'reading_writing': 0.9},
            MaterialType.PRESENTATION: {'visual': 0.85, 'auditory': 0.4, 'kinesthetic': 0.3, 'reading_writing': 0.6},
            MaterialType.IMAGE: {'visual': 0.95, 'auditory': 0.1, 'kinesthetic': 0.2, 'reading_writing': 0.3},
        }
        
        return type_mappings.get(material_type, {'visual': 0.5, 'auditory': 0.5, 'kinesthetic': 0.5, 'reading_writing': 0.5})
    
    def _map_material_type_to_format(self, material_type: MaterialType) -> ContentDeliveryFormat:
        mappings = {
            MaterialType.VIDEO: ContentDeliveryFormat.VIDEO,
            MaterialType.AUDIO: ContentDeliveryFormat.AUDIO,
            MaterialType.PDF: ContentDeliveryFormat.TEXT,
            MaterialType.DOCUMENT: ContentDeliveryFormat.TEXT,
            MaterialType.PRESENTATION: ContentDeliveryFormat.VIDEO,
            MaterialType.IMAGE: ContentDeliveryFormat.VIDEO,
        }
        
        return mappings.get(material_type, ContentDeliveryFormat.TEXT)
