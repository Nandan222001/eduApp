from celery import Task
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from src.celery_app import celery_app
from src.database import SessionLocal
from src.ml.model_monitoring import ModelMonitoringService
from src.models.ml_prediction import MLModel
from src.services.ml_analytics_integration_service import MLAnalyticsIntegrationService

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    """Base task with database session management"""
    _db = None
    
    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db
    
    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="ml_monitoring.check_model_health")
def check_model_health_task(self, model_id: int) -> Dict[str, Any]:
    """
    Celery task to check health of a specific ML model
    """
    logger.info(f"Starting health check for model {model_id}")
    
    try:
        monitoring_service = ModelMonitoringService(self.db)
        
        report = monitoring_service.comprehensive_monitoring_report(
            model_id=model_id,
            recent_days=7
        )
        
        if report['retraining_recommended']:
            logger.warning(
                f"Model {model_id} requires retraining. Reasons: {report['retraining_reasons']}"
            )
            
            if report['model_health_score'] < 40:
                logger.critical(
                    f"Model {model_id} health is critical ({report['model_health_score']:.1f})"
                )
        
        return {
            'status': 'success',
            'model_id': model_id,
            'health_score': report['model_health_score'],
            'retraining_recommended': report['retraining_recommended'],
            'checked_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check failed for model {model_id}: {str(e)}")
        return {
            'status': 'failed',
            'model_id': model_id,
            'error': str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="ml_monitoring.check_institution_models")
def check_institution_models_task(self, institution_id: int) -> Dict[str, Any]:
    """
    Celery task to check health of all models in an institution
    """
    logger.info(f"Starting health checks for institution {institution_id}")
    
    try:
        integration_service = MLAnalyticsIntegrationService(self.db)
        
        result = integration_service.schedule_monitoring_checks(
            institution_id=institution_id
        )
        
        if result['models_needing_retraining']:
            logger.warning(
                f"Institution {institution_id} has {len(result['models_needing_retraining'])} "
                f"models needing retraining"
            )
        
        return {
            'status': 'success',
            'institution_id': institution_id,
            'total_models_checked': result['total_models_checked'],
            'models_needing_retraining': len(result['models_needing_retraining']),
            'checked_at': result['checked_at']
        }
        
    except Exception as e:
        logger.error(f"Health checks failed for institution {institution_id}: {str(e)}")
        return {
            'status': 'failed',
            'institution_id': institution_id,
            'error': str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="ml_monitoring.auto_retrain_model")
def auto_retrain_model_task(
    self, 
    model_id: int, 
    deployed_by: int = None,
    auto_promote: bool = True
) -> Dict[str, Any]:
    """
    Celery task to automatically retrain a model
    """
    logger.info(f"Starting automatic retraining for model {model_id}")
    
    try:
        monitoring_service = ModelMonitoringService(self.db)
        
        result = monitoring_service.trigger_automatic_retraining(
            model_id=model_id,
            deployed_by=deployed_by,
            auto_promote=auto_promote
        )
        
        if result['retraining_status'] == 'success':
            logger.info(f"Model {model_id} successfully retrained")
            
            if result.get('promotion_result', {}).get('auto_promoted', False):
                logger.info(f"Model {model_id} new version auto-promoted to champion")
        else:
            logger.error(f"Model {model_id} retraining failed: {result.get('error')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Auto-retraining failed for model {model_id}: {str(e)}")
        return {
            'retraining_status': 'failed',
            'model_id': model_id,
            'error': str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="ml_monitoring.detect_prediction_drift")
def detect_prediction_drift_task(
    self,
    model_id: int,
    recent_days: int = 7
) -> Dict[str, Any]:
    """
    Celery task to detect prediction drift
    """
    logger.info(f"Checking prediction drift for model {model_id}")
    
    try:
        monitoring_service = ModelMonitoringService(self.db)
        
        result = monitoring_service.detect_prediction_drift(
            model_id=model_id,
            recent_days=recent_days
        )
        
        if result['drift_detected']:
            logger.warning(
                f"Prediction drift detected for model {model_id}. "
                f"Score: {result['drift_score']:.3f}, Severity: {result['severity']}"
            )
        
        return {
            'status': 'success',
            'model_id': model_id,
            'drift_result': result
        }
        
    except Exception as e:
        logger.error(f"Drift detection failed for model {model_id}: {str(e)}")
        return {
            'status': 'failed',
            'model_id': model_id,
            'error': str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="ml_monitoring.detect_feature_drift")
def detect_feature_drift_task(
    self,
    model_id: int,
    recent_days: int = 7
) -> Dict[str, Any]:
    """
    Celery task to detect feature drift
    """
    logger.info(f"Checking feature drift for model {model_id}")
    
    try:
        monitoring_service = ModelMonitoringService(self.db)
        
        result = monitoring_service.detect_feature_drift(
            model_id=model_id,
            recent_days=recent_days
        )
        
        if result['drift_detected']:
            logger.warning(
                f"Feature drift detected for model {model_id}. "
                f"Drifted features: {result['drifted_features']}, "
                f"Severity: {result['severity']}"
            )
        
        return {
            'status': 'success',
            'model_id': model_id,
            'drift_result': result
        }
        
    except Exception as e:
        logger.error(f"Feature drift detection failed for model {model_id}: {str(e)}")
        return {
            'status': 'failed',
            'model_id': model_id,
            'error': str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="ml_monitoring.scheduled_monitoring_check")
def scheduled_monitoring_check_task(self) -> Dict[str, Any]:
    """
    Scheduled task to run monitoring checks on all active models
    
    This task should be configured to run periodically (e.g., daily)
    """
    logger.info("Starting scheduled monitoring check for all active models")
    
    try:
        models = self.db.query(MLModel).filter(
            MLModel.is_active == True
        ).all()
        
        results = []
        models_needing_attention = []
        
        for model in models:
            try:
                monitoring_service = ModelMonitoringService(self.db)
                
                report = monitoring_service.comprehensive_monitoring_report(
                    model_id=model.id,
                    recent_days=7
                )
                
                results.append({
                    'model_id': model.id,
                    'institution_id': model.institution_id,
                    'health_score': report['model_health_score'],
                    'retraining_recommended': report['retraining_recommended']
                })
                
                if report['retraining_recommended']:
                    models_needing_attention.append({
                        'model_id': model.id,
                        'model_name': model.name,
                        'institution_id': model.institution_id,
                        'health_score': report['model_health_score'],
                        'reasons': report['retraining_reasons']
                    })
                
                if report['model_health_score'] < 40:
                    auto_retrain_model_task.delay(
                        model_id=model.id,
                        auto_promote=True
                    )
                    logger.info(f"Triggered auto-retraining for critical model {model.id}")
                    
            except Exception as e:
                logger.error(f"Failed to check model {model.id}: {str(e)}")
                results.append({
                    'model_id': model.id,
                    'error': str(e)
                })
        
        logger.info(
            f"Scheduled monitoring check completed. "
            f"Checked {len(models)} models, {len(models_needing_attention)} need attention"
        )
        
        return {
            'status': 'success',
            'total_models_checked': len(models),
            'models_needing_attention': models_needing_attention,
            'all_results': results,
            'checked_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Scheduled monitoring check failed: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        }


@celery_app.task(base=DatabaseTask, bind=True, name="ml_monitoring.cleanup_old_predictions")
def cleanup_old_predictions_task(self, days_to_keep: int = 180) -> Dict[str, Any]:
    """
    Cleanup old prediction records to manage database size
    
    Keeps predictions from the last N days and removes older ones
    """
    logger.info(f"Starting cleanup of predictions older than {days_to_keep} days")
    
    try:
        from src.models.ml_prediction import PerformancePrediction
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        deleted_count = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.predicted_at < cutoff_date,
            PerformancePrediction.is_scenario == False
        ).delete()
        
        self.db.commit()
        
        logger.info(f"Cleaned up {deleted_count} old prediction records")
        
        return {
            'status': 'success',
            'deleted_count': deleted_count,
            'cutoff_date': cutoff_date.isoformat(),
            'cleaned_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        self.db.rollback()
        logger.error(f"Cleanup failed: {str(e)}")
        return {
            'status': 'failed',
            'error': str(e)
        }
