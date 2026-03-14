from celery import shared_task
from src.database import SessionLocal
from src.services.institution_health_service import InstitutionHealthService
from src.models.institution import Institution
from src.models.institution_health import InstitutionHealthAlert
from src.models.user import User
from src.models.role import Role
from src.services.notification_service import NotificationService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@shared_task(name="calculate_institution_health_scores")
def calculate_all_institution_health_scores():
    """
    Celery task to calculate health scores for all active institutions.
    Recommended schedule: Daily at 2 AM
    """
    db = SessionLocal()
    
    try:
        logger.info("Starting institution health score calculation")
        
        service = InstitutionHealthService(db)
        
        institutions = db.query(Institution).filter(
            Institution.is_active == True
        ).all()
        
        total = len(institutions)
        calculated = 0
        failed = 0
        
        for institution in institutions:
            try:
                service.calculate_health_score(institution.id)
                calculated += 1
                logger.info(f"Calculated health score for institution {institution.id}: {institution.name}")
            except Exception as e:
                failed += 1
                logger.error(f"Failed to calculate health score for institution {institution.id}: {str(e)}")
        
        logger.info(f"Health score calculation complete. Total: {total}, Calculated: {calculated}, Failed: {failed}")
        
        return {
            "status": "completed",
            "total_institutions": total,
            "calculated": calculated,
            "failed": failed,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in health score calculation task: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    finally:
        db.close()


@shared_task(name="send_health_alert_notifications")
def send_health_alert_notifications():
    """
    Celery task to send notifications for unnotified health alerts.
    Recommended schedule: Every hour
    """
    db = SessionLocal()
    
    try:
        logger.info("Starting health alert notification sending")
        
        notification_service = NotificationService(db)
        
        unnotified_alerts = db.query(InstitutionHealthAlert).filter(
            InstitutionHealthAlert.is_resolved == False,
            InstitutionHealthAlert.notification_sent == False
        ).all()
        
        total = len(unnotified_alerts)
        sent = 0
        failed = 0
        
        for alert in unnotified_alerts:
            try:
                institution = alert.institution
                
                admin_users = db.query(User).join(Role).filter(
                    User.institution_id == institution.id,
                    Role.name == "institution_admin",
                    User.is_active == True
                ).all()
                
                for admin in admin_users:
                    notification_service.create_notification(
                        user_id=admin.id,
                        institution_id=institution.id,
                        title=f"Institution Health Alert: {alert.title}",
                        message=alert.description,
                        notification_type="health_alert",
                        priority="high" if alert.severity in ["critical", "urgent"] else "medium",
                        channel="in_app",
                        data={
                            "alert_id": alert.id,
                            "alert_type": alert.alert_type,
                            "severity": alert.severity,
                            "metric_name": alert.metric_name,
                            "current_value": alert.current_value,
                            "threshold_value": alert.threshold_value
                        }
                    )
                
                alert.notification_sent = True
                alert.notification_sent_at = datetime.utcnow()
                sent += 1
                
            except Exception as e:
                failed += 1
                logger.error(f"Failed to send notification for alert {alert.id}: {str(e)}")
        
        db.commit()
        
        logger.info(f"Alert notification sending complete. Total: {total}, Sent: {sent}, Failed: {failed}")
        
        return {
            "status": "completed",
            "total_alerts": total,
            "sent": sent,
            "failed": failed,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in health alert notification task: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    finally:
        db.close()


@shared_task(name="retrain_churn_prediction_model")
def retrain_churn_prediction_model(validation_split: float = 0.2):
    """
    Celery task to retrain the churn prediction ML model.
    Recommended schedule: Weekly or monthly
    """
    db = SessionLocal()
    
    try:
        logger.info("Starting churn prediction model retraining")
        
        service = InstitutionHealthService(db)
        
        result = service.train_churn_prediction_model(
            validation_split=validation_split
        )
        
        if "error" in result:
            logger.error(f"Model retraining failed: {result['error']}")
            return {
                "status": "error",
                "error": result["error"],
                "timestamp": datetime.utcnow().isoformat()
            }
        
        logger.info(f"Model retraining completed successfully. Accuracy: {result.get('accuracy', 'N/A')}")
        
        return {
            "status": "completed",
            "model_version": result.get("model_version"),
            "accuracy": result.get("accuracy"),
            "precision": result.get("precision"),
            "recall": result.get("recall"),
            "f1_score": result.get("f1_score"),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in model retraining task: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    finally:
        db.close()


@shared_task(name="cleanup_resolved_alerts")
def cleanup_resolved_alerts(days_old: int = 30):
    """
    Celery task to archive or clean up old resolved alerts.
    Recommended schedule: Daily
    """
    db = SessionLocal()
    
    try:
        logger.info(f"Starting cleanup of resolved alerts older than {days_old} days")
        
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        old_alerts = db.query(InstitutionHealthAlert).filter(
            InstitutionHealthAlert.is_resolved == True,
            InstitutionHealthAlert.resolved_at < cutoff_date
        ).all()
        
        total = len(old_alerts)
        
        for alert in old_alerts:
            db.delete(alert)
        
        db.commit()
        
        logger.info(f"Cleanup complete. Deleted {total} old resolved alerts")
        
        return {
            "status": "completed",
            "deleted_count": total,
            "cutoff_date": cutoff_date.isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in alert cleanup task: {str(e)}")
        db.rollback()
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    finally:
        db.close()
