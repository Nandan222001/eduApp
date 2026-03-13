import json
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from sentence_transformers import SentenceTransformer
import logging

from src.models.doubt import (
    DoubtPost, DoubtAnswer, DoubtSuggestedAnswer, DoubtEmbedding
)
from src.models.previous_year_papers import QuestionBank, QuestionEmbedding
from src.models.study_material import StudyMaterial
from src.services.doubt_semantic_search_service import DoubtSemanticSearchService

logger = logging.getLogger(__name__)


class DoubtAnswerSuggestionService:
    def __init__(self):
        self.semantic_search_service = DoubtSemanticSearchService()
        self.model = None
        
    def _load_model(self) -> SentenceTransformer:
        if self.model is None:
            self.model = self.semantic_search_service._load_model()
        return self.model
    
    def generate_answer_suggestions(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int
    ) -> List[Dict]:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return []
        
        suggestions = []
        
        similar_doubts_suggestions = self._get_suggestions_from_similar_doubts(
            db, doubt, institution_id
        )
        suggestions.extend(similar_doubts_suggestions)
        
        question_bank_suggestions = self._get_suggestions_from_question_bank(
            db, doubt, institution_id
        )
        suggestions.extend(question_bank_suggestions)
        
        study_material_suggestions = self._get_suggestions_from_study_materials(
            db, doubt, institution_id
        )
        suggestions.extend(study_material_suggestions)
        
        suggestions.sort(key=lambda x: x['confidence_score'], reverse=True)
        
        top_suggestions = suggestions[:10]
        
        for suggestion in top_suggestions:
            existing = db.query(DoubtSuggestedAnswer).filter(
                DoubtSuggestedAnswer.doubt_id == doubt_id,
                DoubtSuggestedAnswer.source_type == suggestion['source_type'],
                DoubtSuggestedAnswer.source_id == suggestion.get('source_id')
            ).first()
            
            if not existing:
                suggested_answer = DoubtSuggestedAnswer(
                    doubt_id=doubt_id,
                    institution_id=institution_id,
                    source_type=suggestion['source_type'],
                    source_id=suggestion.get('source_id'),
                    suggested_content=suggestion['content'],
                    confidence_score=suggestion['confidence_score'],
                    relevance_score=suggestion.get('relevance_score'),
                    source_metadata=json.dumps(suggestion.get('metadata', {}))
                )
                db.add(suggested_answer)
        
        doubt.has_suggested_answers = len(top_suggestions) > 0
        doubt.suggestion_count = len(top_suggestions)
        
        db.commit()
        
        return top_suggestions
    
    def _get_suggestions_from_similar_doubts(
        self,
        db: Session,
        doubt: DoubtPost,
        institution_id: int
    ) -> List[Dict]:
        similar_answered = self.semantic_search_service.get_similar_answered_doubts(
            db, doubt.id, institution_id, top_k=5
        )
        
        suggestions = []
        for similar in similar_answered:
            for answer in similar['top_answers']:
                confidence = similar['similarity_score'] * 0.9
                if answer['is_accepted']:
                    confidence *= 1.2
                confidence += (answer['upvote_count'] / 100) * 0.1
                confidence = min(confidence, 1.0)
                
                suggestions.append({
                    'source_type': 'similar_doubt',
                    'source_id': similar['doubt_id'],
                    'content': answer['content'],
                    'confidence_score': confidence,
                    'relevance_score': similar['similarity_score'],
                    'metadata': {
                        'doubt_title': similar['title'],
                        'answer_id': answer['id'],
                        'upvote_count': answer['upvote_count'],
                        'is_accepted': answer['is_accepted']
                    }
                })
        
        return suggestions
    
    def _get_suggestions_from_question_bank(
        self,
        db: Session,
        doubt: DoubtPost,
        institution_id: int
    ) -> List[Dict]:
        if not doubt.subject_id:
            return []
        
        model = self._load_model()
        query_text = f"{doubt.title} {doubt.description}"
        query_vector = model.encode(query_text, convert_to_numpy=True)
        
        query_filters = [
            QuestionBank.institution_id == institution_id,
            QuestionBank.subject_id == doubt.subject_id,
            QuestionBank.is_active == True,
            QuestionEmbedding.question_id.isnot(None)
        ]
        
        if doubt.chapter_id:
            query_filters.append(QuestionBank.chapter_id == doubt.chapter_id)
        
        questions_with_answers = db.query(
            QuestionBank,
            QuestionEmbedding
        ).join(
            QuestionEmbedding,
            QuestionBank.id == QuestionEmbedding.question_id
        ).filter(
            and_(*query_filters),
            QuestionBank.answer_text.isnot(None)
        ).limit(50).all()
        
        suggestions = []
        for question, embedding in questions_with_answers:
            try:
                question_vector = np.array(json.loads(embedding.embedding_vector))
                
                similarity = np.dot(query_vector, question_vector) / (
                    np.linalg.norm(query_vector) * np.linalg.norm(question_vector)
                )
                
                if similarity >= 0.7:
                    confidence = similarity * 0.85
                    
                    content = f"**Question:** {question.question_text}\n\n"
                    content += f"**Answer:** {question.answer_text}"
                    
                    if question.explanation:
                        content += f"\n\n**Explanation:** {question.explanation}"
                    
                    suggestions.append({
                        'source_type': 'question_bank',
                        'source_id': question.id,
                        'content': content,
                        'confidence_score': confidence,
                        'relevance_score': float(similarity),
                        'metadata': {
                            'question_type': question.question_type.value if question.question_type else None,
                            'difficulty_level': question.difficulty_level.value if question.difficulty_level else None,
                            'marks': question.marks
                        }
                    })
            except Exception as e:
                logger.warning(f"Error processing question {question.id}: {e}")
                continue
        
        return suggestions
    
    def _get_suggestions_from_study_materials(
        self,
        db: Session,
        doubt: DoubtPost,
        institution_id: int
    ) -> List[Dict]:
        if not doubt.subject_id:
            return []
        
        query_filters = [
            StudyMaterial.institution_id == institution_id,
            StudyMaterial.subject_id == doubt.subject_id,
            StudyMaterial.is_active == True,
            StudyMaterial.description.isnot(None)
        ]
        
        if doubt.chapter_id:
            query_filters.append(StudyMaterial.chapter_id == doubt.chapter_id)
        
        materials = db.query(StudyMaterial).filter(
            and_(*query_filters)
        ).limit(20).all()
        
        suggestions = []
        model = self._load_model()
        query_text = f"{doubt.title} {doubt.description}"
        query_vector = model.encode(query_text, convert_to_numpy=True)
        
        for material in materials:
            try:
                material_text = f"{material.title} {material.description}"
                material_vector = model.encode(material_text, convert_to_numpy=True)
                
                similarity = np.dot(query_vector, material_vector) / (
                    np.linalg.norm(query_vector) * np.linalg.norm(material_vector)
                )
                
                if similarity >= 0.65:
                    confidence = similarity * 0.7
                    
                    content = f"**Study Material:** {material.title}\n\n"
                    content += f"{material.description}"
                    
                    if material.file_url:
                        content += f"\n\n[View Material]({material.file_url})"
                    
                    suggestions.append({
                        'source_type': 'study_material',
                        'source_id': material.id,
                        'content': content,
                        'confidence_score': confidence,
                        'relevance_score': float(similarity),
                        'metadata': {
                            'material_type': material.material_type.value if material.material_type else None,
                            'file_url': material.file_url
                        }
                    })
            except Exception as e:
                logger.warning(f"Error processing material {material.id}: {e}")
                continue
        
        return suggestions
    
    def get_suggestions_for_doubt(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int,
        min_confidence: float = 0.5
    ) -> List[Dict]:
        suggestions = db.query(DoubtSuggestedAnswer).filter(
            DoubtSuggestedAnswer.doubt_id == doubt_id,
            DoubtSuggestedAnswer.institution_id == institution_id,
            DoubtSuggestedAnswer.confidence_score >= min_confidence
        ).order_by(
            desc(DoubtSuggestedAnswer.confidence_score)
        ).all()
        
        return [
            {
                'id': s.id,
                'source_type': s.source_type,
                'source_id': s.source_id,
                'content': s.suggested_content,
                'confidence_score': s.confidence_score,
                'relevance_score': s.relevance_score,
                'metadata': json.loads(s.source_metadata) if s.source_metadata else {},
                'is_helpful': s.is_helpful,
                'helpful_votes': s.helpful_votes
            }
            for s in suggestions
        ]
    
    def vote_suggestion_helpful(
        self,
        db: Session,
        suggestion_id: int,
        is_helpful: bool
    ) -> Optional[DoubtSuggestedAnswer]:
        suggestion = db.query(DoubtSuggestedAnswer).filter(
            DoubtSuggestedAnswer.id == suggestion_id
        ).first()
        
        if not suggestion:
            return None
        
        suggestion.is_helpful = is_helpful
        if is_helpful:
            suggestion.helpful_votes += 1
        
        db.commit()
        db.refresh(suggestion)
        
        return suggestion
