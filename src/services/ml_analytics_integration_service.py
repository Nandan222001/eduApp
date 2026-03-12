from typing import Dict, List, Optional, Any
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import json
import logging

from src.services.analytics_service import AnalyticsService
from src.ml.model_monitoring import ModelMonitoringService, MonitoringDashboardService
from src.models.ml_prediction import MLModel, PerformancePrediction

logger = logging.getLogger(__name__)


class MLAnalyticsIntegrationService:
    """
    Integration service that combines traditional analytics with ML model monitoring
    to provide unified insights across the platform
    """
    
    def __init__(self, db: Session, redis_client: Any = None):
        self.db = db
        self.analytics_service = AnalyticsService(db, redis_client)
        self.monitoring_service = ModelMonitoringService(db)
        self.dashboard_service = MonitoringDashboardService(db)
        self.logger = logging.getLogger(__name__)
    
    def get_unified_institution_dashboard(
        self,
        institution_id: int,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get unified dashboard combining traditional analytics with ML monitoring
        """
        from src.schemas.analytics import AnalyticsQueryParams, DateRangeType
        
        params = AnalyticsQueryParams(
            date_range_type=DateRangeType.CUSTOM,
            start_date=date.today() - timedelta(days=days),
            end_date=date.today()
        )
        
        traditional_analytics = None
        try:
            import asyncio
            traditional_analytics = asyncio.run(
                self.analytics_service.get_institution_metrics(institution_id, params)
            )
        except Exception as e:
            self.logger.error(f"Failed to fetch traditional analytics: {str(e)}")
        
        ml_monitoring = None
        try:
            ml_monitoring = self.dashboard_service.get_model_monitoring_overview(
                institution_id=institution_id,
                days=days
            )
        except Exception as e:
            self.logger.error(f"Failed to fetch ML monitoring: {str(e)}")
        
        models = self.db.query(MLModel).filter(
            MLModel.institution_id == institution_id
        ).all()
        
        total_predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.institution_id == institution_id,
            PerformancePrediction.predicted_at >= datetime.utcnow() - timedelta(days=days),
            PerformancePrediction.is_scenario == False
        ).count()
        
        return {
            'institution_id': institution_id,
            'traditional_analytics': {
                'total_students': traditional_analytics.total_students if traditional_analytics else 0,
                'active_students': traditional_analytics.active_students if traditional_analytics else 0,
                'overall_average_percentage': traditional_analytics.overall_average_percentage if traditional_analytics else 0.0,
                'overall_attendance_percentage': traditional_analytics.overall_attendance_percentage if traditional_analytics else 0.0,
                'total_exams_conducted': traditional_analytics.total_exams_conducted if traditional_analytics else 0
            } if traditional_analytics else None,
            'ml_monitoring': {
                'total_ml_models': ml_monitoring.get('total_models', 0) if ml_monitoring else 0,
                'overall_model_health': ml_monitoring.get('overall_health_score', 0) if ml_monitoring else 0,
                'models_needing_retraining': ml_monitoring.get('models_needing_retraining', 0) if ml_monitoring else 0,
                'models_with_alerts': ml_monitoring.get('models_with_critical_alerts', 0) if ml_monitoring else 0,
                'total_predictions_period': total_predictions
            } if ml_monitoring else None,
            'ml_models_summary': [
                {
                    'id': model.id,
                    'name': model.name,
                    'status': model.status.value,
                    'is_active': model.is_active,
                    'algorithm': model.algorithm
                } for model in models
            ],
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def get_student_ml_insights(
        self,
        institution_id: int,
        student_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get ML insights for a specific student including predictions and trends
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.student_id == student_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False
        ).order_by(PerformancePrediction.predicted_at.desc()).all()
        
        if not predictions:
            return {
                'student_id': student_id,
                'has_predictions': False,
                'message': 'No predictions available for this student'
            }
        
        latest_prediction = predictions[0]
        
        prediction_history = [
            {
                'predicted_value': p.predicted_value,
                'confidence_lower': p.confidence_lower,
                'confidence_upper': p.confidence_upper,
                'predicted_at': p.predicted_at.isoformat(),
                'model_name': p.model.name if p.model else None
            } for p in predictions
        ]
        
        prediction_trend = self._analyze_prediction_trend(predictions)
        
        return {
            'student_id': student_id,
            'has_predictions': True,
            'latest_prediction': {
                'predicted_value': latest_prediction.predicted_value,
                'confidence_lower': latest_prediction.confidence_lower,
                'confidence_upper': latest_prediction.confidence_upper,
                'model_name': latest_prediction.model.name,
                'predicted_at': latest_prediction.predicted_at.isoformat()
            },
            'prediction_trend': prediction_trend,
            'total_predictions': len(predictions),
            'prediction_history': prediction_history[:10],
            'feature_contributions': latest_prediction.feature_contributions,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def get_model_performance_analytics(
        self,
        model_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get detailed performance analytics for a specific ML model
        """
        model = self.db.query(MLModel).filter(MLModel.id == model_id).first()
        
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        monitoring_report = self.monitoring_service.comprehensive_monitoring_report(
            model_id=model_id,
            recent_days=days
        )
        
        timeline = self.dashboard_service.get_model_prediction_timeline(
            model_id=model_id,
            days=days
        )
        
        importance_trends = self.dashboard_service.get_feature_importance_trends(
            model_id=model_id
        )
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        recent_predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False
        ).all()
        
        unique_students = len(set(p.student_id for p in recent_predictions))
        
        return {
            'model_id': model_id,
            'model_name': model.name,
            'model_algorithm': model.algorithm,
            'model_status': model.status.value,
            'monitoring_report': monitoring_report,
            'prediction_timeline': timeline,
            'feature_importance_trends': importance_trends,
            'usage_statistics': {
                'total_predictions': len(recent_predictions),
                'unique_students': unique_students,
                'avg_predictions_per_day': len(recent_predictions) / days if days > 0 else 0,
                'period_days': days
            },
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def get_prediction_accuracy_analysis(
        self,
        model_id: int,
        actual_results: Dict[int, float],
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze prediction accuracy by comparing predictions with actual results
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False
        ).all()
        
        matched_predictions = []
        errors = []
        within_confidence = 0
        
        for pred in predictions:
            if pred.student_id in actual_results:
                actual = actual_results[pred.student_id]
                predicted = pred.predicted_value
                error = abs(actual - predicted)
                
                matched_predictions.append({
                    'student_id': pred.student_id,
                    'predicted': predicted,
                    'actual': actual,
                    'error': error,
                    'percentage_error': (error / actual * 100) if actual > 0 else 0
                })
                
                errors.append(error)
                
                if (pred.confidence_lower is not None and 
                    pred.confidence_upper is not None and
                    pred.confidence_lower <= actual <= pred.confidence_upper):
                    within_confidence += 1
        
        if not errors:
            return {
                'model_id': model_id,
                'analysis_available': False,
                'message': 'No matching actual results available'
            }
        
        import numpy as np
        
        mae = float(np.mean(errors))
        rmse = float(np.sqrt(np.mean([e**2 for e in errors])))
        
        confidence_coverage = (within_confidence / len(matched_predictions) * 100) if matched_predictions else 0
        
        return {
            'model_id': model_id,
            'analysis_available': True,
            'accuracy_metrics': {
                'mae': mae,
                'rmse': rmse,
                'mean_absolute_percentage_error': float(np.mean([
                    mp['percentage_error'] for mp in matched_predictions
                ])),
                'confidence_coverage_percentage': confidence_coverage
            },
            'sample_size': len(matched_predictions),
            'predictions_analyzed': matched_predictions[:20],
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _analyze_prediction_trend(self, predictions: List[PerformancePrediction]) -> Dict[str, Any]:
        """Analyze trend in predictions over time"""
        if len(predictions) < 2:
            return {
                'trend': 'insufficient_data',
                'direction': None,
                'slope': 0.0
            }
        
        import numpy as np
        
        sorted_predictions = sorted(predictions, key=lambda p: p.predicted_at)
        values = [p.predicted_value for p in sorted_predictions]
        
        x = np.arange(len(values))
        slope, intercept = np.polyfit(x, values, 1)
        
        if slope > 0.5:
            direction = 'improving'
        elif slope < -0.5:
            direction = 'declining'
        else:
            direction = 'stable'
        
        return {
            'trend': 'analyzed',
            'direction': direction,
            'slope': float(slope),
            'first_value': values[0],
            'last_value': values[-1],
            'change': values[-1] - values[0],
            'change_percentage': ((values[-1] - values[0]) / values[0] * 100) if values[0] > 0 else 0
        }
    
    def schedule_monitoring_checks(
        self,
        institution_id: int
    ) -> Dict[str, Any]:
        """
        Schedule routine monitoring checks for all active models in an institution
        """
        models = self.db.query(MLModel).filter(
            MLModel.institution_id == institution_id,
            MLModel.is_active == True
        ).all()
        
        results = []
        models_needing_retraining = []
        
        for model in models:
            try:
                report = self.monitoring_service.comprehensive_monitoring_report(
                    model_id=model.id,
                    recent_days=7
                )
                
                results.append({
                    'model_id': model.id,
                    'model_name': model.name,
                    'health_score': report['model_health_score'],
                    'retraining_recommended': report['retraining_recommended']
                })
                
                if report['retraining_recommended']:
                    models_needing_retraining.append({
                        'model_id': model.id,
                        'model_name': model.name,
                        'reasons': report['retraining_reasons']
                    })
                    
            except Exception as e:
                self.logger.error(f"Monitoring check failed for model {model.id}: {str(e)}")
                results.append({
                    'model_id': model.id,
                    'model_name': model.name,
                    'error': str(e)
                })
        
        return {
            'institution_id': institution_id,
            'total_models_checked': len(results),
            'models_needing_retraining': models_needing_retraining,
            'check_results': results,
            'checked_at': datetime.utcnow().isoformat()
        }
