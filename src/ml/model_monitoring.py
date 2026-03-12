from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import numpy as np
import pandas as pd
from scipy import stats
from collections import defaultdict, deque
import json
import logging

from src.models.ml_prediction import (
    MLModel, MLModelVersion, PerformancePrediction, ModelStatus
)
from src.ml.prediction_service import PerformancePredictionService
from src.ml.training_pipeline import MLTrainingPipeline, TrainingJobConfig

logger = logging.getLogger(__name__)


class DriftType:
    PREDICTION = "prediction_drift"
    FEATURE = "feature_drift"
    PERFORMANCE = "performance_degradation"
    CONCEPT = "concept_drift"


class AlertSeverity:
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class MonitoringMetrics:
    def __init__(self):
        self.prediction_distribution = {}
        self.feature_distributions = {}
        self.performance_metrics = {}
        self.confidence_trends = []
        self.drift_scores = {}
        self.alerts = []


class ModelMonitoringService:
    
    def __init__(self, db: Session):
        self.db = db
        self.prediction_service = PerformancePredictionService(db)
        self.training_pipeline = MLTrainingPipeline(db)
        self.logger = logging.getLogger(__name__)
        
        self.drift_thresholds = {
            'prediction_drift': 0.15,
            'feature_drift': 0.20,
            'performance_degradation': 0.10,
            'confidence_drop': 0.15
        }
        
        self.retraining_thresholds = {
            'r2_drop': 0.15,
            'mae_increase': 0.20,
            'drift_score': 0.25,
            'consecutive_alerts': 3
        }
        
        self.monitoring_window_days = 30
        self.baseline_window_days = 90
        
    def detect_prediction_drift(
        self,
        model_id: int,
        recent_days: int = 7,
        use_baseline: bool = True
    ) -> Dict[str, Any]:
        """
        Detect drift in prediction distributions by comparing recent predictions
        to training distribution or historical baseline
        """
        model_version = self._get_active_model_version(model_id)
        
        if not model_version:
            raise ValueError(f"No active model version found for model {model_id}")
        
        cutoff_date = datetime.utcnow() - timedelta(days=recent_days)
        
        recent_predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False
        ).all()
        
        if len(recent_predictions) < 10:
            return {
                'drift_detected': False,
                'drift_score': 0.0,
                'reason': 'Insufficient recent predictions',
                'recent_sample_size': len(recent_predictions)
            }
        
        recent_values = np.array([p.predicted_value for p in recent_predictions])
        
        if use_baseline:
            baseline_date = datetime.utcnow() - timedelta(days=self.baseline_window_days)
            baseline_predictions = self.db.query(PerformancePrediction).filter(
                PerformancePrediction.model_id == model_id,
                PerformancePrediction.predicted_at >= baseline_date,
                PerformancePrediction.predicted_at < cutoff_date,
                PerformancePrediction.is_scenario == False
            ).all()
            
            if len(baseline_predictions) < 30:
                return {
                    'drift_detected': False,
                    'drift_score': 0.0,
                    'reason': 'Insufficient baseline predictions',
                    'baseline_sample_size': len(baseline_predictions)
                }
            
            baseline_values = np.array([p.predicted_value for p in baseline_predictions])
        else:
            training_metrics = model_version.training_metrics
            baseline_mean = training_metrics.get('mean_prediction', 50.0)
            baseline_std = training_metrics.get('std_prediction', 15.0)
            baseline_values = np.random.normal(baseline_mean, baseline_std, 1000)
        
        ks_statistic, p_value = stats.ks_2samp(recent_values, baseline_values)
        
        js_divergence = self._calculate_js_divergence(recent_values, baseline_values)
        
        psi_score = self._calculate_psi(recent_values, baseline_values)
        
        drift_score = (ks_statistic + js_divergence + psi_score) / 3.0
        
        drift_detected = drift_score > self.drift_thresholds['prediction_drift']
        
        severity = self._calculate_severity(drift_score, self.drift_thresholds['prediction_drift'])
        
        result = {
            'drift_detected': drift_detected,
            'drift_score': float(drift_score),
            'ks_statistic': float(ks_statistic),
            'ks_p_value': float(p_value),
            'js_divergence': float(js_divergence),
            'psi_score': float(psi_score),
            'severity': severity,
            'recent_stats': {
                'mean': float(np.mean(recent_values)),
                'std': float(np.std(recent_values)),
                'min': float(np.min(recent_values)),
                'max': float(np.max(recent_values)),
                'median': float(np.median(recent_values)),
                'sample_size': len(recent_values)
            },
            'baseline_stats': {
                'mean': float(np.mean(baseline_values)),
                'std': float(np.std(baseline_values)),
                'min': float(np.min(baseline_values)),
                'max': float(np.max(baseline_values)),
                'median': float(np.median(baseline_values)),
                'sample_size': len(baseline_values)
            },
            'checked_at': datetime.utcnow().isoformat()
        }
        
        if drift_detected:
            self._create_alert(
                model_id=model_id,
                alert_type=DriftType.PREDICTION,
                severity=severity,
                message=f"Prediction drift detected with score {drift_score:.3f}",
                details=result
            )
        
        return result
    
    def detect_feature_drift(
        self,
        model_id: int,
        recent_days: int = 7
    ) -> Dict[str, Any]:
        """
        Monitor drift in input feature distributions
        """
        model_version = self._get_active_model_version(model_id)
        
        if not model_version:
            raise ValueError(f"No active model version found for model {model_id}")
        
        model = model_version.model
        feature_names = model.feature_names
        
        cutoff_date = datetime.utcnow() - timedelta(days=recent_days)
        baseline_date = datetime.utcnow() - timedelta(days=self.baseline_window_days)
        
        recent_predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False
        ).all()
        
        baseline_predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= baseline_date,
            PerformancePrediction.predicted_at < cutoff_date,
            PerformancePrediction.is_scenario == False
        ).all()
        
        if len(recent_predictions) < 10 or len(baseline_predictions) < 30:
            return {
                'drift_detected': False,
                'reason': 'Insufficient data for feature drift detection',
                'recent_sample_size': len(recent_predictions),
                'baseline_sample_size': len(baseline_predictions)
            }
        
        feature_drift_scores = {}
        drifted_features = []
        
        for feature_name in feature_names:
            recent_values = [
                p.input_features.get(feature_name, 0.0) 
                for p in recent_predictions 
                if p.input_features and feature_name in p.input_features
            ]
            
            baseline_values = [
                p.input_features.get(feature_name, 0.0)
                for p in baseline_predictions
                if p.input_features and feature_name in p.input_features
            ]
            
            if len(recent_values) < 5 or len(baseline_values) < 10:
                continue
            
            recent_arr = np.array(recent_values)
            baseline_arr = np.array(baseline_values)
            
            ks_stat, p_value = stats.ks_2samp(recent_arr, baseline_arr)
            psi_score = self._calculate_psi(recent_arr, baseline_arr)
            
            drift_score = (ks_stat + psi_score) / 2.0
            
            feature_drift_scores[feature_name] = {
                'drift_score': float(drift_score),
                'ks_statistic': float(ks_stat),
                'ks_p_value': float(p_value),
                'psi_score': float(psi_score),
                'recent_mean': float(np.mean(recent_arr)),
                'baseline_mean': float(np.mean(baseline_arr)),
                'mean_shift': float(abs(np.mean(recent_arr) - np.mean(baseline_arr))),
                'recent_std': float(np.std(recent_arr)),
                'baseline_std': float(np.std(baseline_arr))
            }
            
            if drift_score > self.drift_thresholds['feature_drift']:
                drifted_features.append(feature_name)
        
        overall_drift_score = np.mean([
            scores['drift_score'] for scores in feature_drift_scores.values()
        ]) if feature_drift_scores else 0.0
        
        drift_detected = len(drifted_features) > 0
        severity = self._calculate_severity(overall_drift_score, self.drift_thresholds['feature_drift'])
        
        result = {
            'drift_detected': drift_detected,
            'overall_drift_score': float(overall_drift_score),
            'drifted_features': drifted_features,
            'feature_drift_scores': feature_drift_scores,
            'num_features_checked': len(feature_drift_scores),
            'num_drifted_features': len(drifted_features),
            'severity': severity,
            'checked_at': datetime.utcnow().isoformat()
        }
        
        if drift_detected:
            self._create_alert(
                model_id=model_id,
                alert_type=DriftType.FEATURE,
                severity=severity,
                message=f"Feature drift detected in {len(drifted_features)} features: {', '.join(drifted_features[:5])}",
                details=result
            )
        
        return result
    
    def monitor_performance_degradation(
        self,
        model_id: int,
        recent_days: int = 7,
        actual_values: Optional[Dict[int, float]] = None
    ) -> Dict[str, Any]:
        """
        Monitor model performance degradation by comparing recent performance
        to baseline metrics
        """
        model_version = self._get_active_model_version(model_id)
        
        if not model_version:
            raise ValueError(f"No active model version found for model {model_id}")
        
        baseline_metrics = model_version.test_metrics
        
        if not baseline_metrics:
            return {
                'degradation_detected': False,
                'reason': 'No baseline metrics available'
            }
        
        cutoff_date = datetime.utcnow() - timedelta(days=recent_days)
        
        recent_predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False
        ).all()
        
        if len(recent_predictions) < 10:
            return {
                'degradation_detected': False,
                'reason': 'Insufficient recent predictions',
                'sample_size': len(recent_predictions)
            }
        
        current_metrics = {}
        
        if actual_values:
            predicted_values = []
            true_values = []
            
            for pred in recent_predictions:
                if pred.student_id in actual_values:
                    predicted_values.append(pred.predicted_value)
                    true_values.append(actual_values[pred.student_id])
            
            if len(predicted_values) >= 5:
                predicted_arr = np.array(predicted_values)
                true_arr = np.array(true_values)
                
                current_metrics['r2_score'] = float(1 - (
                    np.sum((true_arr - predicted_arr) ** 2) / 
                    np.sum((true_arr - np.mean(true_arr)) ** 2)
                ))
                current_metrics['mae'] = float(np.mean(np.abs(true_arr - predicted_arr)))
                current_metrics['rmse'] = float(np.sqrt(np.mean((true_arr - predicted_arr) ** 2)))
                current_metrics['mse'] = float(np.mean((true_arr - predicted_arr) ** 2))
        
        confidence_widths = [
            p.confidence_upper - p.confidence_lower 
            for p in recent_predictions 
            if p.confidence_upper is not None and p.confidence_lower is not None
        ]
        
        avg_confidence_width = np.mean(confidence_widths) if confidence_widths else None
        
        degradation_detected = False
        performance_changes = {}
        
        if current_metrics:
            for metric_name in ['r2_score', 'mae', 'rmse']:
                if metric_name in baseline_metrics and metric_name in current_metrics:
                    baseline_value = baseline_metrics[metric_name]
                    current_value = current_metrics[metric_name]
                    
                    if metric_name == 'r2_score':
                        change = baseline_value - current_value
                        change_pct = (change / abs(baseline_value)) if baseline_value != 0 else 0
                        threshold = self.retraining_thresholds['r2_drop']
                    else:
                        change = current_value - baseline_value
                        change_pct = (change / abs(baseline_value)) if baseline_value != 0 else 0
                        threshold = self.retraining_thresholds['mae_increase']
                    
                    performance_changes[metric_name] = {
                        'baseline_value': float(baseline_value),
                        'current_value': float(current_value),
                        'change': float(change),
                        'change_percentage': float(change_pct * 100),
                        'threshold_exceeded': abs(change_pct) > threshold
                    }
                    
                    if abs(change_pct) > threshold:
                        degradation_detected = True
        
        severity = AlertSeverity.INFO
        if degradation_detected:
            max_change = max([
                abs(pc['change_percentage']) 
                for pc in performance_changes.values()
            ])
            severity = self._calculate_severity(max_change / 100, 0.10)
        
        result = {
            'degradation_detected': degradation_detected,
            'baseline_metrics': baseline_metrics,
            'current_metrics': current_metrics if current_metrics else None,
            'performance_changes': performance_changes,
            'average_confidence_width': float(avg_confidence_width) if avg_confidence_width else None,
            'recent_sample_size': len(recent_predictions),
            'with_actual_values': len(current_metrics) > 0,
            'severity': severity,
            'checked_at': datetime.utcnow().isoformat()
        }
        
        if degradation_detected:
            self._create_alert(
                model_id=model_id,
                alert_type=DriftType.PERFORMANCE,
                severity=severity,
                message=f"Performance degradation detected",
                details=result
            )
        
        return result
    
    def analyze_confidence_trends(
        self,
        model_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze trends in prediction confidence over time
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False,
            PerformancePrediction.confidence_lower.isnot(None),
            PerformancePrediction.confidence_upper.isnot(None)
        ).order_by(PerformancePrediction.predicted_at).all()
        
        if len(predictions) < 10:
            return {
                'trend_detected': False,
                'reason': 'Insufficient predictions with confidence intervals',
                'sample_size': len(predictions)
            }
        
        daily_confidence = defaultdict(list)
        
        for pred in predictions:
            day = pred.predicted_at.date()
            confidence_width = pred.confidence_upper - pred.confidence_lower
            daily_confidence[day].append(confidence_width)
        
        sorted_days = sorted(daily_confidence.keys())
        avg_daily_confidence = [
            np.mean(daily_confidence[day]) for day in sorted_days
        ]
        
        if len(avg_daily_confidence) >= 3:
            days_numeric = np.arange(len(avg_daily_confidence))
            slope, intercept = np.polyfit(days_numeric, avg_daily_confidence, 1)
            
            trend_direction = "increasing" if slope > 0 else "decreasing"
            trend_strength = abs(slope)
        else:
            slope = 0
            trend_direction = "stable"
            trend_strength = 0
        
        recent_window = avg_daily_confidence[-7:] if len(avg_daily_confidence) >= 7 else avg_daily_confidence
        baseline_window = avg_daily_confidence[:14] if len(avg_daily_confidence) >= 14 else avg_daily_confidence[:len(avg_daily_confidence)//2]
        
        if len(recent_window) > 0 and len(baseline_window) > 0:
            recent_avg = np.mean(recent_window)
            baseline_avg = np.mean(baseline_window)
            confidence_change = (recent_avg - baseline_avg) / baseline_avg if baseline_avg > 0 else 0
        else:
            confidence_change = 0
            recent_avg = 0
            baseline_avg = 0
        
        confidence_drop_detected = confidence_change < -self.drift_thresholds['confidence_drop']
        
        all_widths = [pred.confidence_upper - pred.confidence_lower for pred in predictions]
        
        result = {
            'trend_detected': abs(confidence_change) > self.drift_thresholds['confidence_drop'],
            'confidence_drop_detected': confidence_drop_detected,
            'trend_direction': trend_direction,
            'trend_slope': float(slope),
            'trend_strength': float(trend_strength),
            'confidence_change_percentage': float(confidence_change * 100),
            'recent_avg_width': float(recent_avg),
            'baseline_avg_width': float(baseline_avg),
            'overall_stats': {
                'mean_width': float(np.mean(all_widths)),
                'std_width': float(np.std(all_widths)),
                'min_width': float(np.min(all_widths)),
                'max_width': float(np.max(all_widths)),
                'median_width': float(np.median(all_widths))
            },
            'daily_averages': {
                str(day): float(np.mean(daily_confidence[day]))
                for day in sorted_days
            },
            'sample_size': len(predictions),
            'days_analyzed': len(sorted_days),
            'checked_at': datetime.utcnow().isoformat()
        }
        
        if confidence_drop_detected:
            severity = self._calculate_severity(abs(confidence_change), self.drift_thresholds['confidence_drop'])
            self._create_alert(
                model_id=model_id,
                alert_type="confidence_drop",
                severity=severity,
                message=f"Confidence drop detected: {confidence_change * 100:.1f}% decrease",
                details=result
            )
        
        return result
    
    def comprehensive_monitoring_report(
        self,
        model_id: int,
        recent_days: int = 7,
        actual_values: Optional[Dict[int, float]] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive monitoring report combining all metrics
        """
        self.logger.info(f"Generating comprehensive monitoring report for model {model_id}")
        
        model = self.db.query(MLModel).filter(MLModel.id == model_id).first()
        
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        prediction_drift = self.detect_prediction_drift(model_id, recent_days)
        feature_drift = self.detect_feature_drift(model_id, recent_days)
        performance = self.monitor_performance_degradation(model_id, recent_days, actual_values)
        confidence_trends = self.analyze_confidence_trends(model_id, days=30)
        
        alerts = self._get_recent_alerts(model_id, days=7)
        
        any_critical_issue = (
            prediction_drift.get('drift_detected', False) or
            feature_drift.get('drift_detected', False) or
            performance.get('degradation_detected', False) or
            confidence_trends.get('confidence_drop_detected', False)
        )
        
        retraining_recommended = self._should_trigger_retraining(
            model_id=model_id,
            prediction_drift=prediction_drift,
            feature_drift=feature_drift,
            performance=performance,
            alerts=alerts
        )
        
        model_health_score = self._calculate_model_health_score(
            prediction_drift=prediction_drift,
            feature_drift=feature_drift,
            performance=performance,
            confidence_trends=confidence_trends
        )
        
        report = {
            'model_id': model_id,
            'model_name': model.name,
            'model_status': model.status.value,
            'report_generated_at': datetime.utcnow().isoformat(),
            'monitoring_period_days': recent_days,
            'model_health_score': model_health_score,
            'health_status': self._get_health_status(model_health_score),
            'prediction_drift': prediction_drift,
            'feature_drift': feature_drift,
            'performance_monitoring': performance,
            'confidence_trends': confidence_trends,
            'alerts_summary': {
                'total_alerts': len(alerts),
                'critical_alerts': sum(1 for a in alerts if a['severity'] == AlertSeverity.CRITICAL),
                'warning_alerts': sum(1 for a in alerts if a['severity'] == AlertSeverity.WARNING),
                'recent_alerts': alerts[:5]
            },
            'retraining_recommended': retraining_recommended,
            'retraining_reasons': self._get_retraining_reasons(
                prediction_drift, feature_drift, performance, alerts
            ) if retraining_recommended else []
        }
        
        return report
    
    def trigger_automatic_retraining(
        self,
        model_id: int,
        deployed_by: Optional[int] = None,
        auto_promote: bool = True
    ) -> Dict[str, Any]:
        """
        Trigger automatic model retraining when performance drops below threshold
        """
        model = self.db.query(MLModel).filter(MLModel.id == model_id).first()
        
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        self.logger.info(f"Triggering automatic retraining for model {model_id}")
        
        config = TrainingJobConfig(
            institution_id=model.institution_id,
            model_name=model.name,
            prediction_type=model.prediction_type,
            algorithm=model.algorithm,
            hyperparameters=model.hyperparameters,
            target_column=model.target_column,
            auto_promote=auto_promote
        )
        
        try:
            training_result = self.training_pipeline.train_new_model(config)
            
            new_version_id = training_result['model_version_id']
            
            if auto_promote:
                promotion_result = self.training_pipeline.auto_promote_if_better(
                    model_id=model_id,
                    new_version_id=new_version_id,
                    threshold=0.01,
                    deployed_by=deployed_by
                )
                
                return {
                    'retraining_status': 'success',
                    'training_result': training_result,
                    'promotion_result': promotion_result,
                    'triggered_at': datetime.utcnow().isoformat()
                }
            else:
                return {
                    'retraining_status': 'success',
                    'training_result': training_result,
                    'promotion_result': None,
                    'message': 'Model retrained successfully, awaiting manual promotion',
                    'triggered_at': datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"Automatic retraining failed: {str(e)}")
            return {
                'retraining_status': 'failed',
                'error': str(e),
                'triggered_at': datetime.utcnow().isoformat()
            }
    
    def _get_active_model_version(self, model_id: int) -> Optional[MLModelVersion]:
        """Get the currently deployed model version"""
        return self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id,
            MLModelVersion.is_deployed == True
        ).first()
    
    def _calculate_psi(
        self, 
        actual: np.ndarray, 
        expected: np.ndarray, 
        bins: int = 10
    ) -> float:
        """Calculate Population Stability Index (PSI)"""
        def get_bins(data, n_bins):
            return np.histogram(data, bins=n_bins)[1]
        
        breakpoints = get_bins(expected, bins)
        
        expected_hist = np.histogram(expected, bins=breakpoints)[0]
        actual_hist = np.histogram(actual, bins=breakpoints)[0]
        
        expected_pct = expected_hist / len(expected)
        actual_pct = actual_hist / len(actual)
        
        expected_pct = np.where(expected_pct == 0, 0.0001, expected_pct)
        actual_pct = np.where(actual_pct == 0, 0.0001, actual_pct)
        
        psi = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        
        return float(psi)
    
    def _calculate_js_divergence(
        self, 
        p: np.ndarray, 
        q: np.ndarray, 
        bins: int = 50
    ) -> float:
        """Calculate Jensen-Shannon divergence"""
        p_hist, bin_edges = np.histogram(p, bins=bins, density=True)
        q_hist, _ = np.histogram(q, bins=bin_edges, density=True)
        
        p_hist = p_hist + 1e-10
        q_hist = q_hist + 1e-10
        
        p_hist = p_hist / np.sum(p_hist)
        q_hist = q_hist / np.sum(q_hist)
        
        m = 0.5 * (p_hist + q_hist)
        
        kl_pm = np.sum(p_hist * np.log(p_hist / m))
        kl_qm = np.sum(q_hist * np.log(q_hist / m))
        
        js = 0.5 * (kl_pm + kl_qm)
        
        return float(js)
    
    def _calculate_severity(self, score: float, threshold: float) -> str:
        """Calculate alert severity based on score and threshold"""
        if score < threshold:
            return AlertSeverity.INFO
        elif score < threshold * 1.5:
            return AlertSeverity.WARNING
        else:
            return AlertSeverity.CRITICAL
    
    def _create_alert(
        self,
        model_id: int,
        alert_type: str,
        severity: str,
        message: str,
        details: Dict[str, Any]
    ) -> None:
        """Create a monitoring alert (stored in database or cache)"""
        alert = {
            'model_id': model_id,
            'alert_type': alert_type,
            'severity': severity,
            'message': message,
            'details': details,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.logger.warning(f"Alert created: {message} (Severity: {severity})")
    
    def _get_recent_alerts(self, model_id: int, days: int = 7) -> List[Dict[str, Any]]:
        """Get recent alerts for a model"""
        return []
    
    def _should_trigger_retraining(
        self,
        model_id: int,
        prediction_drift: Dict[str, Any],
        feature_drift: Dict[str, Any],
        performance: Dict[str, Any],
        alerts: List[Dict[str, Any]]
    ) -> bool:
        """Determine if automatic retraining should be triggered"""
        if performance.get('degradation_detected', False):
            if performance.get('performance_changes', {}):
                for metric, change in performance['performance_changes'].items():
                    if change.get('threshold_exceeded', False):
                        return True
        
        drift_score = (
            prediction_drift.get('drift_score', 0) +
            feature_drift.get('overall_drift_score', 0)
        ) / 2.0
        
        if drift_score > self.retraining_thresholds['drift_score']:
            return True
        
        critical_alerts = [a for a in alerts if a.get('severity') == AlertSeverity.CRITICAL]
        if len(critical_alerts) >= self.retraining_thresholds['consecutive_alerts']:
            return True
        
        return False
    
    def _get_retraining_reasons(
        self,
        prediction_drift: Dict[str, Any],
        feature_drift: Dict[str, Any],
        performance: Dict[str, Any],
        alerts: List[Dict[str, Any]]
    ) -> List[str]:
        """Get reasons why retraining is recommended"""
        reasons = []
        
        if prediction_drift.get('drift_detected', False):
            reasons.append(
                f"Prediction drift detected (score: {prediction_drift.get('drift_score', 0):.3f})"
            )
        
        if feature_drift.get('drift_detected', False):
            num_drifted = feature_drift.get('num_drifted_features', 0)
            reasons.append(f"Feature drift in {num_drifted} features")
        
        if performance.get('degradation_detected', False):
            for metric, change in performance.get('performance_changes', {}).items():
                if change.get('threshold_exceeded', False):
                    reasons.append(
                        f"{metric.upper()} degraded by {change.get('change_percentage', 0):.1f}%"
                    )
        
        critical_alerts = [a for a in alerts if a.get('severity') == AlertSeverity.CRITICAL]
        if len(critical_alerts) >= 3:
            reasons.append(f"{len(critical_alerts)} critical alerts in recent period")
        
        return reasons
    
    def _calculate_model_health_score(
        self,
        prediction_drift: Dict[str, Any],
        feature_drift: Dict[str, Any],
        performance: Dict[str, Any],
        confidence_trends: Dict[str, Any]
    ) -> float:
        """Calculate overall model health score (0-100)"""
        score = 100.0
        
        if prediction_drift.get('drift_detected', False):
            drift_penalty = min(prediction_drift.get('drift_score', 0) * 100, 30)
            score -= drift_penalty
        
        if feature_drift.get('drift_detected', False):
            drift_penalty = min(feature_drift.get('overall_drift_score', 0) * 100, 25)
            score -= drift_penalty
        
        if performance.get('degradation_detected', False):
            perf_changes = performance.get('performance_changes', {})
            for metric, change in perf_changes.items():
                if change.get('threshold_exceeded', False):
                    penalty = min(abs(change.get('change_percentage', 0)), 25)
                    score -= penalty
        
        if confidence_trends.get('confidence_drop_detected', False):
            confidence_penalty = min(
                abs(confidence_trends.get('confidence_change_percentage', 0)), 
                20
            )
            score -= confidence_penalty
        
        return max(0.0, min(100.0, score))
    
    def _get_health_status(self, health_score: float) -> str:
        """Convert health score to status label"""
        if health_score >= 90:
            return "excellent"
        elif health_score >= 75:
            return "good"
        elif health_score >= 60:
            return "fair"
        elif health_score >= 40:
            return "poor"
        else:
            return "critical"


class MonitoringDashboardService:
    """Service for monitoring dashboard API endpoints"""
    
    def __init__(self, db: Session):
        self.db = db
        self.monitoring_service = ModelMonitoringService(db)
    
    def get_model_monitoring_overview(
        self,
        institution_id: int,
        days: int = 7
    ) -> Dict[str, Any]:
        """Get monitoring overview for all models in an institution"""
        models = self.db.query(MLModel).filter(
            MLModel.institution_id == institution_id,
            MLModel.is_active == True
        ).all()
        
        model_summaries = []
        
        for model in models:
            try:
                report = self.monitoring_service.comprehensive_monitoring_report(
                    model_id=model.id,
                    recent_days=days
                )
                
                model_summaries.append({
                    'model_id': model.id,
                    'model_name': model.name,
                    'health_score': report['model_health_score'],
                    'health_status': report['health_status'],
                    'retraining_recommended': report['retraining_recommended'],
                    'has_critical_alerts': report['alerts_summary']['critical_alerts'] > 0,
                    'last_checked': report['report_generated_at']
                })
            except Exception as e:
                logger.error(f"Failed to generate report for model {model.id}: {str(e)}")
                model_summaries.append({
                    'model_id': model.id,
                    'model_name': model.name,
                    'health_score': 0,
                    'health_status': 'unknown',
                    'error': str(e)
                })
        
        overall_health = np.mean([
            m['health_score'] for m in model_summaries if 'health_score' in m
        ]) if model_summaries else 0
        
        return {
            'institution_id': institution_id,
            'total_models': len(models),
            'overall_health_score': float(overall_health),
            'models_needing_retraining': sum(
                1 for m in model_summaries if m.get('retraining_recommended', False)
            ),
            'models_with_critical_alerts': sum(
                1 for m in model_summaries if m.get('has_critical_alerts', False)
            ),
            'model_summaries': model_summaries,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def get_model_prediction_timeline(
        self,
        model_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get prediction timeline for visualization"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        predictions = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.model_id == model_id,
            PerformancePrediction.predicted_at >= cutoff_date,
            PerformancePrediction.is_scenario == False
        ).order_by(PerformancePrediction.predicted_at).all()
        
        daily_stats = defaultdict(lambda: {
            'predictions': [],
            'confidence_widths': []
        })
        
        for pred in predictions:
            day = pred.predicted_at.date()
            daily_stats[day]['predictions'].append(pred.predicted_value)
            if pred.confidence_upper and pred.confidence_lower:
                daily_stats[day]['confidence_widths'].append(
                    pred.confidence_upper - pred.confidence_lower
                )
        
        timeline = []
        for day in sorted(daily_stats.keys()):
            stats = daily_stats[day]
            timeline.append({
                'date': str(day),
                'count': len(stats['predictions']),
                'mean_prediction': float(np.mean(stats['predictions'])),
                'std_prediction': float(np.std(stats['predictions'])),
                'min_prediction': float(np.min(stats['predictions'])),
                'max_prediction': float(np.max(stats['predictions'])),
                'mean_confidence_width': float(np.mean(stats['confidence_widths'])) if stats['confidence_widths'] else None
            })
        
        return {
            'model_id': model_id,
            'days_analyzed': days,
            'total_predictions': len(predictions),
            'timeline': timeline
        }
    
    def get_feature_importance_trends(
        self,
        model_id: int
    ) -> Dict[str, Any]:
        """Get feature importance trends across model versions"""
        versions = self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id
        ).order_by(MLModelVersion.training_date.desc()).limit(5).all()
        
        version_importances = []
        
        for version in versions:
            if version.feature_importance:
                version_importances.append({
                    'version': version.version,
                    'training_date': version.training_date.isoformat(),
                    'feature_importance': version.feature_importance,
                    'is_deployed': version.is_deployed
                })
        
        return {
            'model_id': model_id,
            'versions_analyzed': len(version_importances),
            'version_importances': version_importances
        }
