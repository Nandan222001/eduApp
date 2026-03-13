from typing import Dict, List, Optional
from sqlalchemy.orm import Session
import logging

from src.models.doubt import DoubtPost
from src.services.doubt_semantic_search_service import DoubtSemanticSearchService
from src.services.doubt_answer_suggestion_service import DoubtAnswerSuggestionService
from src.services.doubt_tagging_service import DoubtTaggingService
from src.services.doubt_priority_service import DoubtPriorityService
from src.services.doubt_teacher_assignment_service import DoubtTeacherAssignmentService

logger = logging.getLogger(__name__)


class DoubtIntelligenceService:
    def __init__(self):
        self.semantic_search = DoubtSemanticSearchService()
        self.answer_suggestion = DoubtAnswerSuggestionService()
        self.tagging = DoubtTaggingService()
        self.priority = DoubtPriorityService()
        self.teacher_assignment = DoubtTeacherAssignmentService()
    
    def process_new_doubt(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int,
        enable_auto_assignment: bool = True
    ) -> Dict:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return {'success': False, 'message': 'Doubt not found'}
        
        results = {
            'doubt_id': doubt_id,
            'processing_steps': {}
        }
        
        try:
            logger.info(f"Processing doubt {doubt_id}: Auto-tagging")
            tagging_result = self.tagging.auto_tag_doubt(db, doubt_id)
            results['processing_steps']['tagging'] = tagging_result
        except Exception as e:
            logger.error(f"Auto-tagging failed for doubt {doubt_id}: {e}")
            results['processing_steps']['tagging'] = {'success': False, 'error': str(e)}
        
        try:
            logger.info(f"Processing doubt {doubt_id}: Generating embeddings")
            embedding = self.semantic_search.generate_doubt_embedding(db, doubt_id)
            results['processing_steps']['embedding'] = {
                'success': embedding is not None,
                'embedding_id': embedding.id if embedding else None
            }
        except Exception as e:
            logger.error(f"Embedding generation failed for doubt {doubt_id}: {e}")
            results['processing_steps']['embedding'] = {'success': False, 'error': str(e)}
        
        try:
            logger.info(f"Processing doubt {doubt_id}: Finding similar doubts")
            similar_doubts = self.semantic_search.find_similar_doubts(
                db, doubt_id, institution_id, top_k=10
            )
            results['processing_steps']['similar_doubts'] = {
                'success': True,
                'count': len(similar_doubts),
                'top_similarities': [
                    {
                        'doubt_id': s['doubt_id'],
                        'similarity_score': s['similarity_score']
                    }
                    for s in similar_doubts[:5]
                ]
            }
        except Exception as e:
            logger.error(f"Similar doubts search failed for doubt {doubt_id}: {e}")
            results['processing_steps']['similar_doubts'] = {'success': False, 'error': str(e)}
        
        try:
            logger.info(f"Processing doubt {doubt_id}: Generating answer suggestions")
            suggestions = self.answer_suggestion.generate_answer_suggestions(
                db, doubt_id, institution_id
            )
            results['processing_steps']['answer_suggestions'] = {
                'success': True,
                'count': len(suggestions),
                'top_suggestions': [
                    {
                        'source_type': s['source_type'],
                        'confidence_score': s['confidence_score']
                    }
                    for s in suggestions[:3]
                ]
            }
        except Exception as e:
            logger.error(f"Answer suggestion failed for doubt {doubt_id}: {e}")
            results['processing_steps']['answer_suggestions'] = {'success': False, 'error': str(e)}
        
        try:
            logger.info(f"Processing doubt {doubt_id}: Calculating priority")
            priority_result = self.priority.calculate_priority_score(db, doubt_id)
            results['processing_steps']['priority'] = priority_result
        except Exception as e:
            logger.error(f"Priority calculation failed for doubt {doubt_id}: {e}")
            results['processing_steps']['priority'] = {'success': False, 'error': str(e)}
        
        if enable_auto_assignment:
            try:
                logger.info(f"Processing doubt {doubt_id}: Auto-assigning teacher")
                assignment_result = self.teacher_assignment.assign_teacher_to_doubt(
                    db, doubt_id, institution_id, auto_assign=True
                )
                results['processing_steps']['teacher_assignment'] = assignment_result
            except Exception as e:
                logger.error(f"Teacher assignment failed for doubt {doubt_id}: {e}")
                results['processing_steps']['teacher_assignment'] = {'success': False, 'error': str(e)}
        
        results['success'] = True
        results['message'] = 'Doubt processed with AI intelligence features'
        
        return results
    
    def get_doubt_intelligence_summary(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int
    ) -> Dict:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return {'success': False, 'message': 'Doubt not found'}
        
        similar_doubts = self.semantic_search.find_similar_doubts(
            db, doubt_id, institution_id, top_k=5
        )
        
        suggestions = self.answer_suggestion.get_suggestions_for_doubt(
            db, doubt_id, institution_id
        )
        
        suggested_tags = self.tagging.suggest_tags(db, doubt_id, institution_id)
        
        teacher_info = None
        if doubt.assigned_teacher_id:
            workload = self.teacher_assignment.get_teacher_workload(
                db, doubt.assigned_teacher_id, institution_id
            )
            teacher_info = {
                'teacher_id': doubt.assigned_teacher_id,
                'teacher': doubt.assigned_teacher,
                'auto_assigned': doubt.auto_assigned,
                'assignment_score': doubt.assignment_score,
                'workload': workload
            }
        
        return {
            'success': True,
            'doubt': {
                'id': doubt.id,
                'title': doubt.title,
                'status': doubt.status.value,
                'priority': doubt.priority.value if doubt.priority else None,
                'difficulty': doubt.difficulty.value if doubt.difficulty else None,
                'priority_score': doubt.priority_score,
                'urgency_score': doubt.urgency_score,
                'difficulty_score': doubt.difficulty_score
            },
            'tagging': {
                'tags': doubt.tags or [],
                'auto_generated_tags': doubt.auto_generated_tags or [],
                'suggested_tags': suggested_tags,
                'subject_id': doubt.subject_id,
                'chapter_id': doubt.chapter_id
            },
            'similar_doubts': [
                {
                    'doubt_id': s['doubt_id'],
                    'similarity_score': s['similarity_score'],
                    'title': s['doubt'].title,
                    'status': s['doubt'].status.value,
                    'answer_count': s['doubt'].answer_count
                }
                for s in similar_doubts
            ],
            'answer_suggestions': suggestions,
            'teacher_assignment': teacher_info
        }
    
    def batch_process_doubts(
        self,
        db: Session,
        institution_id: int,
        batch_size: int = 50,
        enable_auto_assignment: bool = True
    ) -> Dict[str, int]:
        unprocessed_doubts = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.priority_score == 0.0
        ).limit(batch_size).all()
        
        successful = 0
        failed = 0
        
        for doubt in unprocessed_doubts:
            try:
                result = self.process_new_doubt(
                    db, doubt.id, institution_id, enable_auto_assignment
                )
                if result['success']:
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Failed to process doubt {doubt.id}: {e}")
                failed += 1
                continue
        
        return {
            'successful': successful,
            'failed': failed,
            'total_processed': successful + failed
        }
    
    def reprocess_doubt(
        self,
        db: Session,
        doubt_id: int,
        institution_id: int,
        steps: Optional[List[str]] = None
    ) -> Dict:
        doubt = db.query(DoubtPost).filter(
            DoubtPost.id == doubt_id,
            DoubtPost.institution_id == institution_id
        ).first()
        
        if not doubt:
            return {'success': False, 'message': 'Doubt not found'}
        
        if steps is None:
            steps = ['tagging', 'embedding', 'similar_doubts', 'suggestions', 'priority']
        
        results = {
            'doubt_id': doubt_id,
            'reprocessing_steps': {}
        }
        
        if 'tagging' in steps:
            try:
                tagging_result = self.tagging.auto_tag_doubt(db, doubt_id)
                results['reprocessing_steps']['tagging'] = tagging_result
            except Exception as e:
                results['reprocessing_steps']['tagging'] = {'success': False, 'error': str(e)}
        
        if 'embedding' in steps:
            try:
                embedding = self.semantic_search.generate_doubt_embedding(db, doubt_id)
                results['reprocessing_steps']['embedding'] = {
                    'success': embedding is not None
                }
            except Exception as e:
                results['reprocessing_steps']['embedding'] = {'success': False, 'error': str(e)}
        
        if 'similar_doubts' in steps:
            try:
                similar_doubts = self.semantic_search.find_similar_doubts(
                    db, doubt_id, institution_id, top_k=10
                )
                results['reprocessing_steps']['similar_doubts'] = {
                    'success': True,
                    'count': len(similar_doubts)
                }
            except Exception as e:
                results['reprocessing_steps']['similar_doubts'] = {'success': False, 'error': str(e)}
        
        if 'suggestions' in steps:
            try:
                suggestions = self.answer_suggestion.generate_answer_suggestions(
                    db, doubt_id, institution_id
                )
                results['reprocessing_steps']['suggestions'] = {
                    'success': True,
                    'count': len(suggestions)
                }
            except Exception as e:
                results['reprocessing_steps']['suggestions'] = {'success': False, 'error': str(e)}
        
        if 'priority' in steps:
            try:
                priority_result = self.priority.calculate_priority_score(db, doubt_id)
                results['reprocessing_steps']['priority'] = priority_result
            except Exception as e:
                results['reprocessing_steps']['priority'] = {'success': False, 'error': str(e)}
        
        results['success'] = True
        
        return results
    
    def get_intelligence_analytics(
        self,
        db: Session,
        institution_id: int
    ) -> Dict:
        total_doubts = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id
        ).count()
        
        doubts_with_embeddings = db.query(DoubtPost).join(
            DoubtPost.embeddings
        ).filter(
            DoubtPost.institution_id == institution_id
        ).count()
        
        doubts_with_suggestions = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.has_suggested_answers == True
        ).count()
        
        doubts_auto_assigned = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.auto_assigned == True
        ).count()
        
        doubts_with_auto_tags = db.query(DoubtPost).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.auto_generated_tags.isnot(None)
        ).count()
        
        priority_distribution = db.query(
            DoubtPost.priority,
            db.query(DoubtPost).filter(
                DoubtPost.institution_id == institution_id
            ).count()
        ).filter(
            DoubtPost.institution_id == institution_id
        ).group_by(DoubtPost.priority).all()
        
        return {
            'total_doubts': total_doubts,
            'intelligence_coverage': {
                'embeddings': {
                    'count': doubts_with_embeddings,
                    'percentage': round(doubts_with_embeddings / total_doubts * 100, 2) if total_doubts > 0 else 0
                },
                'suggestions': {
                    'count': doubts_with_suggestions,
                    'percentage': round(doubts_with_suggestions / total_doubts * 100, 2) if total_doubts > 0 else 0
                },
                'auto_assignment': {
                    'count': doubts_auto_assigned,
                    'percentage': round(doubts_auto_assigned / total_doubts * 100, 2) if total_doubts > 0 else 0
                },
                'auto_tagging': {
                    'count': doubts_with_auto_tags,
                    'percentage': round(doubts_with_auto_tags / total_doubts * 100, 2) if total_doubts > 0 else 0
                }
            },
            'priority_distribution': [
                {
                    'priority': p[0].value if p[0] else 'unknown',
                    'count': p[1]
                }
                for p in priority_distribution
            ]
        }
