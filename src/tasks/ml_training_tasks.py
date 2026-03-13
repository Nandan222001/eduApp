from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging
from celery import Task

from src.celery_app import celery_app
from src.database import SessionLocal
from src.ml.training_pipeline import MLTrainingPipeline, TrainingJobConfig
from src.models.ml_prediction import MLModel, MLModelVersion, PredictionType
from src.models.ml_training import MLTrainingJob, ModelPromotionLog, TrainingStatus, TrainingJobType
from src.models.institution import Institution
from src.models.user import User

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
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


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="ml_training.train_model",
    time_limit=3600,
    soft_time_limit=3300
)
def train_model_task(
    self,
    institution_id: int,
    model_name: str,
    prediction_type: str,
    algorithm: str = 'random_forest',
    hyperparameters: Dict[str, Any] = None,
    target_column: str = 'exam_percentage',
    start_date: str = None,
    end_date: str = None,
    test_size: float = 0.2,
    val_size: float = 0.1,
    cv_folds: int = 5,
    random_state: int = 42,
    auto_promote: bool = True,
    promotion_threshold: float = 0.02,
    deployed_by: int = None,
    notify_admins: bool = True
) -> Dict[str, Any]:
    training_job = None
    try:
        logger.info(
            f"Starting training task for institution {institution_id}, "
            f"model: {model_name}"
        )
        
        from datetime import date
        
        parsed_start_date = date.fromisoformat(start_date) if start_date else None
        parsed_end_date = date.fromisoformat(end_date) if end_date else None
        
        training_job = MLTrainingJob(
            institution_id=institution_id,
            model_name=model_name,
            algorithm=algorithm,
            prediction_type=prediction_type,
            hyperparameters=hyperparameters,
            job_type=TrainingJobType.MANUAL,
            status=TrainingStatus.RUNNING,
            celery_task_id=self.request.id,
            started_at=datetime.utcnow(),
            auto_promoted=auto_promote,
            promotion_threshold=promotion_threshold,
            triggered_by=deployed_by,
            training_config={
                'target_column': target_column,
                'test_size': test_size,
                'val_size': val_size,
                'cv_folds': cv_folds,
                'random_state': random_state
            }
        )
        self.db.add(training_job)
        self.db.commit()
        self.db.refresh(training_job)
        
        config = TrainingJobConfig(
            institution_id=institution_id,
            model_name=model_name,
            prediction_type=PredictionType(prediction_type),
            algorithm=algorithm,
            hyperparameters=hyperparameters or {},
            target_column=target_column,
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            test_size=test_size,
            val_size=val_size,
            cv_folds=cv_folds,
            random_state=random_state,
            auto_promote=auto_promote,
            promotion_threshold=promotion_threshold
        )
        
        pipeline = MLTrainingPipeline(self.db)
        
        result = pipeline.train_new_model(config)
        
        training_job.model_id = result['model_id']
        training_job.model_version_id = result['model_version_id']
        training_job.status = TrainingStatus.COMPLETED
        training_job.completed_at = datetime.utcnow()
        training_job.duration_seconds = result['training_duration_seconds']
        training_job.training_samples = result['training_samples']
        training_job.test_r2_score = result['test_metrics'].get('r2_score')
        training_job.validation_r2_score = result['validation_metrics'].get('r2_score')
        
        if auto_promote:
            promotion_result = pipeline.auto_promote_if_better(
                model_id=result['model_id'],
                new_version_id=result['model_version_id'],
                threshold=promotion_threshold,
                deployed_by=deployed_by
            )
            result['promotion'] = promotion_result
            
            if promotion_result.get('auto_promoted'):
                training_job.auto_promoted = True
                
                promotion_log = ModelPromotionLog(
                    model_id=result['model_id'],
                    previous_version_id=promotion_result.get('previous_version_id'),
                    new_version_id=result['model_version_id'],
                    previous_r2_score=promotion_result.get('previous_r2_score'),
                    new_r2_score=result['test_metrics'].get('r2_score'),
                    improvement=promotion_result.get('improvement'),
                    promotion_type='automatic',
                    reason=f"Improvement {promotion_result.get('improvement', 0):.4f} exceeded threshold {promotion_threshold}",
                    promoted_by=deployed_by
                )
                self.db.add(promotion_log)
        
        self.db.commit()
        
        if notify_admins:
            send_training_notification.delay(
                institution_id=institution_id,
                training_result=result,
                status=TrainingStatus.COMPLETED.value
            )
        
        logger.info(
            f"Training task completed for model {result['model_id']}, "
            f"version {result['version']}"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Training task failed: {str(e)}")
        
        if training_job:
            training_job.status = TrainingStatus.FAILED
            training_job.completed_at = datetime.utcnow()
            training_job.error_message = str(e)
            import traceback
            training_job.error_traceback = traceback.format_exc()
            self.db.commit()
        
        if notify_admins:
            send_training_notification.delay(
                institution_id=institution_id,
                training_result={'error': str(e)},
                status=TrainingStatus.FAILED.value
            )
        
        raise


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="ml_training.scheduled_training"
)
def scheduled_training_task(self) -> Dict[str, Any]:
    try:
        logger.info("Running scheduled training task for all institutions")
        
        now = datetime.utcnow()
        
        institutions = self.db.query(Institution).filter(
            Institution.is_active == True
        ).all()
        
        total_trained = 0
        total_failed = 0
        
        for institution in institutions:
            try:
                settings = institution.settings
                if settings:
                    import json
                    settings_dict = json.loads(settings) if isinstance(settings, str) else settings
                    
                    ml_settings = settings_dict.get('ml_training', {})
                    enabled = ml_settings.get('enabled', False)
                    frequency_days = ml_settings.get('frequency_days', 7)
                    model_name = ml_settings.get('model_name', 'performance_predictor')
                    
                    if not enabled:
                        continue
                    
                    last_training = self.db.query(MLModelVersion).join(MLModel).filter(
                        MLModel.institution_id == institution.id,
                        MLModel.name == model_name
                    ).order_by(MLModelVersion.training_date.desc()).first()
                    
                    if last_training:
                        days_since_training = (now - last_training.training_date).days
                        if days_since_training < frequency_days:
                            logger.info(
                                f"Skipping institution {institution.id}: "
                                f"Last trained {days_since_training} days ago"
                            )
                            continue
                    
                    train_model_task.delay(
                        institution_id=institution.id,
                        model_name=model_name,
                        prediction_type=ml_settings.get('prediction_type', 'overall_percentage'),
                        algorithm=ml_settings.get('algorithm', 'random_forest'),
                        hyperparameters=ml_settings.get('hyperparameters'),
                        auto_promote=ml_settings.get('auto_promote', True),
                        promotion_threshold=ml_settings.get('promotion_threshold', 0.02),
                        notify_admins=True
                    )
                    
                    total_trained += 1
                    
            except Exception as e:
                logger.error(
                    f"Error processing scheduled training for institution {institution.id}: {str(e)}"
                )
                total_failed += 1
        
        return {
            'total_institutions': len(institutions),
            'total_trained': total_trained,
            'total_failed': total_failed,
            'timestamp': now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Scheduled training task failed: {str(e)}")
        return {
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="ml_training.send_training_notification"
)
def send_training_notification(
    self,
    institution_id: int,
    training_result: Dict[str, Any],
    status: str
) -> Dict[str, Any]:
    try:
        from src.models.user import User
        from src.services.notification_service import NotificationService
        
        admins = self.db.query(User).filter(
            User.institution_id == institution_id,
            User.role.in_(['super_admin', 'institution_admin'])
        ).all()
        
        notification_service = NotificationService(self.db)
        
        if status == TrainingStatus.COMPLETED.value:
            title = "ML Model Training Completed"
            message = (
                f"Model {training_result.get('model_id')} training completed successfully. "
                f"Version: {training_result.get('version')}. "
                f"R² Score: {training_result.get('test_metrics', {}).get('r2_score', 0):.4f}"
            )
            
            if training_result.get('promotion', {}).get('auto_promoted'):
                message += f" Model has been automatically promoted to champion."
        else:
            title = "ML Model Training Failed"
            message = (
                f"Model training failed for institution {institution_id}. "
                f"Error: {training_result.get('error', 'Unknown error')}"
            )
        
        sent = 0
        for admin in admins:
            try:
                notification = notification_service.create_notification(
                    institution_id=institution_id,
                    user_id=admin.id,
                    title=title,
                    message=message,
                    notification_type='ml_training',
                    channel='app',
                    priority='medium',
                    data={
                        'training_result': training_result,
                        'status': status
                    }
                )
                sent += 1
            except Exception as e:
                logger.error(f"Error sending notification to admin {admin.id}: {str(e)}")
        
        return {
            'sent': sent,
            'total_admins': len(admins),
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending training notifications: {str(e)}")
        return {
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="ml_training.cleanup_old_model_versions"
)
def cleanup_old_model_versions(
    self,
    keep_latest: int = 5,
    days_to_keep: int = 90
) -> Dict[str, Any]:
    try:
        import os
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        all_models = self.db.query(MLModel).all()
        
        total_deleted = 0
        total_files_deleted = 0
        
        for model in all_models:
            versions = self.db.query(MLModelVersion).filter(
                MLModelVersion.model_id == model.id,
                MLModelVersion.is_deployed == False,
                MLModelVersion.training_date < cutoff_date
            ).order_by(MLModelVersion.training_date.desc()).all()
            
            if len(versions) > keep_latest:
                versions_to_delete = versions[keep_latest:]
                
                for version in versions_to_delete:
                    try:
                        if version.model_path and os.path.exists(version.model_path):
                            os.remove(version.model_path)
                            total_files_deleted += 1
                        
                        if version.scaler_path and os.path.exists(version.scaler_path):
                            os.remove(version.scaler_path)
                            total_files_deleted += 1
                        
                        self.db.delete(version)
                        total_deleted += 1
                        
                    except Exception as e:
                        logger.error(
                            f"Error deleting version {version.id}: {str(e)}"
                        )
        
        self.db.commit()
        
        return {
            'total_deleted': total_deleted,
            'total_files_deleted': total_files_deleted,
            'cutoff_date': cutoff_date.isoformat(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up old model versions: {str(e)}")
        self.db.rollback()
        return {
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="ml_training.compare_and_promote"
)
def compare_and_promote_task(
    self,
    model_id: int,
    champion_version_id: int,
    challenger_version_id: int,
    promotion_threshold: float = 0.02,
    deployed_by: int = None,
    notify_admins: bool = True
) -> Dict[str, Any]:
    try:
        pipeline = MLTrainingPipeline(self.db)
        
        comparison = pipeline.compare_model_versions(
            champion_version_id=champion_version_id,
            challenger_version_id=challenger_version_id
        )
        
        improvement = comparison['improvement']['r2_improvement']
        
        result = {
            'comparison': comparison,
            'promoted': False
        }
        
        if improvement > promotion_threshold:
            promotion_result = pipeline.promote_model_version(
                model_version_id=challenger_version_id,
                deployed_by=deployed_by
            )
            result['promotion'] = promotion_result
            result['promoted'] = True
            
            if notify_admins:
                model = self.db.query(MLModel).filter(MLModel.id == model_id).first()
                if model:
                    send_training_notification.delay(
                        institution_id=model.institution_id,
                        training_result=promotion_result,
                        status='promoted'
                    )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in compare and promote task: {str(e)}")
        raise
