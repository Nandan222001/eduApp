from celery import Task
from sqlalchemy.orm import Session
from src.celery_app import celery_app
from src.database import SessionLocal
from src.services.doubt_intelligence_service import DoubtIntelligenceService
from src.services.doubt_semantic_search_service import DoubtSemanticSearchService
from src.services.doubt_answer_suggestion_service import DoubtAnswerSuggestionService
from src.services.doubt_tagging_service import DoubtTaggingService
from src.services.doubt_priority_service import DoubtPriorityService
from src.services.doubt_teacher_assignment_service import DoubtTeacherAssignmentService
import logging

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    _db: Session = None
    
    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db
    
    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="process_doubt_with_intelligence")
def process_doubt_with_intelligence_task(
    self,
    doubt_id: int,
    institution_id: int,
    enable_auto_assignment: bool = True
):
    logger.info(f"Processing doubt {doubt_id} with intelligence features")
    
    try:
        service = DoubtIntelligenceService()
        result = service.process_new_doubt(
            self.db, doubt_id, institution_id, enable_auto_assignment
        )
        
        logger.info(f"Successfully processed doubt {doubt_id}")
        return result
    except Exception as e:
        logger.error(f"Error processing doubt {doubt_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="generate_doubt_embedding")
def generate_doubt_embedding_task(self, doubt_id: int):
    logger.info(f"Generating embedding for doubt {doubt_id}")
    
    try:
        service = DoubtSemanticSearchService()
        embedding = service.generate_doubt_embedding(self.db, doubt_id)
        
        if embedding:
            logger.info(f"Successfully generated embedding for doubt {doubt_id}")
            return {'success': True, 'embedding_id': embedding.id}
        else:
            return {'success': False, 'message': 'Failed to generate embedding'}
    except Exception as e:
        logger.error(f"Error generating embedding for doubt {doubt_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="find_similar_doubts")
def find_similar_doubts_task(
    self,
    doubt_id: int,
    institution_id: int,
    top_k: int = 10
):
    logger.info(f"Finding similar doubts for doubt {doubt_id}")
    
    try:
        service = DoubtSemanticSearchService()
        similar_doubts = service.find_similar_doubts(
            self.db, doubt_id, institution_id, top_k
        )
        
        logger.info(f"Found {len(similar_doubts)} similar doubts for doubt {doubt_id}")
        return {
            'success': True,
            'count': len(similar_doubts),
            'similar_doubts': [
                {'doubt_id': s['doubt_id'], 'similarity_score': s['similarity_score']}
                for s in similar_doubts
            ]
        }
    except Exception as e:
        logger.error(f"Error finding similar doubts for doubt {doubt_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="generate_answer_suggestions")
def generate_answer_suggestions_task(
    self,
    doubt_id: int,
    institution_id: int
):
    logger.info(f"Generating answer suggestions for doubt {doubt_id}")
    
    try:
        service = DoubtAnswerSuggestionService()
        suggestions = service.generate_answer_suggestions(
            self.db, doubt_id, institution_id
        )
        
        logger.info(f"Generated {len(suggestions)} suggestions for doubt {doubt_id}")
        return {
            'success': True,
            'count': len(suggestions),
            'suggestions': [
                {
                    'source_type': s['source_type'],
                    'confidence_score': s['confidence_score']
                }
                for s in suggestions
            ]
        }
    except Exception as e:
        logger.error(f"Error generating suggestions for doubt {doubt_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="auto_tag_doubt")
def auto_tag_doubt_task(self, doubt_id: int):
    logger.info(f"Auto-tagging doubt {doubt_id}")
    
    try:
        service = DoubtTaggingService()
        result = service.auto_tag_doubt(self.db, doubt_id)
        
        logger.info(f"Successfully auto-tagged doubt {doubt_id}")
        return result
    except Exception as e:
        logger.error(f"Error auto-tagging doubt {doubt_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="calculate_doubt_priority")
def calculate_doubt_priority_task(self, doubt_id: int):
    logger.info(f"Calculating priority for doubt {doubt_id}")
    
    try:
        service = DoubtPriorityService()
        result = service.calculate_priority_score(self.db, doubt_id)
        
        logger.info(f"Successfully calculated priority for doubt {doubt_id}")
        return result
    except Exception as e:
        logger.error(f"Error calculating priority for doubt {doubt_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="assign_teacher_to_doubt")
def assign_teacher_to_doubt_task(
    self,
    doubt_id: int,
    institution_id: int,
    auto_assign: bool = True
):
    logger.info(f"Assigning teacher to doubt {doubt_id}")
    
    try:
        service = DoubtTeacherAssignmentService()
        result = service.assign_teacher_to_doubt(
            self.db, doubt_id, institution_id, auto_assign
        )
        
        logger.info(f"Successfully assigned teacher to doubt {doubt_id}")
        return result
    except Exception as e:
        logger.error(f"Error assigning teacher to doubt {doubt_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="batch_generate_embeddings")
def batch_generate_embeddings_task(
    self,
    institution_id: int,
    batch_size: int = 50
):
    logger.info(f"Batch generating embeddings for institution {institution_id}")
    
    try:
        service = DoubtSemanticSearchService()
        result = service.batch_generate_embeddings(
            self.db, institution_id, batch_size
        )
        
        logger.info(f"Batch generated {result['successful']} embeddings for institution {institution_id}")
        return result
    except Exception as e:
        logger.error(f"Error batch generating embeddings for institution {institution_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="batch_auto_tag_doubts")
def batch_auto_tag_doubts_task(
    self,
    institution_id: int,
    batch_size: int = 50
):
    logger.info(f"Batch auto-tagging doubts for institution {institution_id}")
    
    try:
        service = DoubtTaggingService()
        result = service.batch_auto_tag_doubts(
            self.db, institution_id, batch_size
        )
        
        logger.info(f"Batch auto-tagged {result['successful']} doubts for institution {institution_id}")
        return result
    except Exception as e:
        logger.error(f"Error batch auto-tagging doubts for institution {institution_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="batch_recalculate_priorities")
def batch_recalculate_priorities_task(
    self,
    institution_id: int,
    batch_size: int = 100
):
    logger.info(f"Batch recalculating priorities for institution {institution_id}")
    
    try:
        service = DoubtPriorityService()
        result = service.recalculate_priorities(
            self.db, institution_id, batch_size
        )
        
        logger.info(f"Batch recalculated {result['successful']} priorities for institution {institution_id}")
        return result
    except Exception as e:
        logger.error(f"Error batch recalculating priorities for institution {institution_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="batch_auto_assign_teachers")
def batch_auto_assign_teachers_task(
    self,
    institution_id: int,
    batch_size: int = 50
):
    logger.info(f"Batch auto-assigning teachers for institution {institution_id}")
    
    try:
        service = DoubtTeacherAssignmentService()
        result = service.auto_assign_pending_doubts(
            self.db, institution_id, batch_size
        )
        
        logger.info(f"Batch auto-assigned {result['successful']} teachers for institution {institution_id}")
        return result
    except Exception as e:
        logger.error(f"Error batch auto-assigning teachers for institution {institution_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="batch_process_doubts")
def batch_process_doubts_task(
    self,
    institution_id: int,
    batch_size: int = 50,
    enable_auto_assignment: bool = True
):
    logger.info(f"Batch processing doubts for institution {institution_id}")
    
    try:
        service = DoubtIntelligenceService()
        result = service.batch_process_doubts(
            self.db, institution_id, batch_size, enable_auto_assignment
        )
        
        logger.info(f"Batch processed {result['successful']} doubts for institution {institution_id}")
        return result
    except Exception as e:
        logger.error(f"Error batch processing doubts for institution {institution_id}: {str(e)}")
        raise


@celery_app.task(base=DatabaseTask, bind=True, name="periodic_doubt_intelligence_update")
def periodic_doubt_intelligence_update_task(self, institution_id: int):
    logger.info(f"Running periodic doubt intelligence update for institution {institution_id}")
    
    try:
        results = {}
        
        embeddings_result = batch_generate_embeddings_task.apply(
            args=[institution_id, 50]
        ).get()
        results['embeddings'] = embeddings_result
        
        tagging_result = batch_auto_tag_doubts_task.apply(
            args=[institution_id, 50]
        ).get()
        results['tagging'] = tagging_result
        
        priorities_result = batch_recalculate_priorities_task.apply(
            args=[institution_id, 100]
        ).get()
        results['priorities'] = priorities_result
        
        assignment_result = batch_auto_assign_teachers_task.apply(
            args=[institution_id, 50]
        ).get()
        results['assignments'] = assignment_result
        
        logger.info(f"Completed periodic doubt intelligence update for institution {institution_id}")
        return results
    except Exception as e:
        logger.error(f"Error in periodic doubt intelligence update for institution {institution_id}: {str(e)}")
        raise
