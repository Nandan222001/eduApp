# ML Model Monitoring and Observability System

## Overview

This comprehensive ML model monitoring and observability system provides real-time tracking of model performance, drift detection, and automatic retraining capabilities for machine learning models in production.

## Features

### 1. Prediction Drift Detection

Monitors changes in prediction distributions over time by comparing recent predictions to baseline/training distributions.

**Metrics Used:**
- Kolmogorov-Smirnov (KS) Test
- Jensen-Shannon Divergence
- Population Stability Index (PSI)

**Example Usage:**
```python
from src.ml.model_monitoring import ModelMonitoringService

monitoring_service = ModelMonitoringService(db)
drift_result = monitoring_service.detect_prediction_drift(
    model_id=1,
    recent_days=7,
    use_baseline=True
)
```

### 2. Feature Drift Monitoring

Tracks drift in input feature distributions to identify data quality issues or concept drift.

**Features:**
- Per-feature drift scores
- KS statistics for each feature
- Mean shift detection
- Standard deviation changes

**Example Usage:**
```python
feature_drift = monitoring_service.detect_feature_drift(
    model_id=1,
    recent_days=7
)
```

### 3. Performance Degradation Detection

Monitors model performance metrics and compares against baseline to detect degradation.

**Metrics Tracked:**
- R² Score
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Confidence interval width

**Example Usage:**
```python
performance = monitoring_service.monitor_performance_degradation(
    model_id=1,
    recent_days=7,
    actual_values={student_id: actual_score, ...}
)
```

### 4. Confidence Trend Analysis

Analyzes trends in prediction confidence over time to identify model uncertainty issues.

**Insights:**
- Confidence interval width trends
- Daily average confidence
- Trend direction and slope
- Confidence drop detection

**Example Usage:**
```python
confidence_trends = monitoring_service.analyze_confidence_trends(
    model_id=1,
    days=30
)
```

### 5. Comprehensive Monitoring Reports

Generates unified reports combining all monitoring metrics with health scores and recommendations.

**Example Usage:**
```python
report = monitoring_service.comprehensive_monitoring_report(
    model_id=1,
    recent_days=7
)
```

### 6. Automatic Retraining Triggers

Automatically triggers model retraining when performance drops below thresholds.

**Trigger Conditions:**
- R² score drops by more than 15%
- MAE increases by more than 20%
- Overall drift score exceeds 0.25
- 3+ consecutive critical alerts

**Example Usage:**
```python
retraining_result = monitoring_service.trigger_automatic_retraining(
    model_id=1,
    deployed_by=user_id,
    auto_promote=True
)
```

## API Endpoints

### Monitoring Endpoints

#### Check Prediction Drift
```
GET /api/v1/ml-monitoring/models/{model_id}/drift/predictions
```

#### Check Feature Drift
```
GET /api/v1/ml-monitoring/models/{model_id}/drift/features
```

#### Check Performance Degradation
```
GET /api/v1/ml-monitoring/models/{model_id}/performance/degradation
```

#### Analyze Confidence Trends
```
GET /api/v1/ml-monitoring/models/{model_id}/confidence/trends
```

#### Get Comprehensive Report
```
GET /api/v1/ml-monitoring/models/{model_id}/report/comprehensive
```

#### Trigger Retraining
```
POST /api/v1/ml-monitoring/models/{model_id}/retraining/trigger
```

#### Get Institution Overview
```
GET /api/v1/ml-monitoring/institutions/{institution_id}/overview
```

#### Get Prediction Timeline
```
GET /api/v1/ml-monitoring/models/{model_id}/timeline/predictions
```

### Analytics Integration Endpoints

#### Get Unified Dashboard
```
GET /api/v1/ml-analytics/institutions/{institution_id}/unified-dashboard
```

#### Get Student ML Insights
```
GET /api/v1/ml-analytics/students/{student_id}/ml-insights
```

#### Get Model Performance Analytics
```
GET /api/v1/ml-analytics/models/{model_id}/performance-analytics
```

#### Analyze Prediction Accuracy
```
POST /api/v1/ml-analytics/models/{model_id}/accuracy-analysis
```

## Configuration

### Drift Thresholds

Default thresholds can be customized in `ModelMonitoringService`:

```python
self.drift_thresholds = {
    'prediction_drift': 0.15,    # 15% threshold for prediction drift
    'feature_drift': 0.20,        # 20% threshold for feature drift
    'performance_degradation': 0.10,  # 10% threshold for performance drop
    'confidence_drop': 0.15       # 15% threshold for confidence drop
}
```

### Retraining Thresholds

```python
self.retraining_thresholds = {
    'r2_drop': 0.15,              # 15% R² drop triggers retraining
    'mae_increase': 0.20,          # 20% MAE increase triggers retraining
    'drift_score': 0.25,           # Overall drift score threshold
    'consecutive_alerts': 3        # Number of consecutive alerts
}
```

### Monitoring Windows

```python
self.monitoring_window_days = 30    # Days for monitoring window
self.baseline_window_days = 90      # Days for baseline comparison
```

## Celery Tasks

### Scheduled Tasks

#### Daily Health Check
```python
from src.tasks.ml_monitoring_tasks import scheduled_monitoring_check_task

# Configure in celery beat schedule
scheduled_monitoring_check_task.delay()
```

#### Model-Specific Health Check
```python
from src.tasks.ml_monitoring_tasks import check_model_health_task

check_model_health_task.delay(model_id=1)
```

#### Institution-Wide Check
```python
from src.tasks.ml_monitoring_tasks import check_institution_models_task

check_institution_models_task.delay(institution_id=1)
```

#### Automatic Retraining
```python
from src.tasks.ml_monitoring_tasks import auto_retrain_model_task

auto_retrain_model_task.delay(
    model_id=1,
    deployed_by=user_id,
    auto_promote=True
)
```

## Health Scoring

Models are assigned health scores from 0-100 based on:

- **Excellent (90-100)**: No issues detected
- **Good (75-89)**: Minor drift within acceptable ranges
- **Fair (60-74)**: Some drift or performance concerns
- **Poor (40-59)**: Significant drift or degradation
- **Critical (0-39)**: Severe issues, retraining recommended

Health score calculation considers:
- Prediction drift penalties
- Feature drift penalties
- Performance degradation
- Confidence drop severity

## Alert Severity Levels

- **INFO**: Informational alerts, no action required
- **WARNING**: Moderate issues, monitoring recommended
- **CRITICAL**: Severe issues, immediate action required

## Integration with Analytics Service

The monitoring system integrates seamlessly with the existing analytics service:

```python
from src.services.ml_analytics_integration_service import MLAnalyticsIntegrationService

integration_service = MLAnalyticsIntegrationService(db, redis_client)

# Get unified dashboard
dashboard = integration_service.get_unified_institution_dashboard(
    institution_id=1,
    days=7
)

# Get student ML insights
insights = integration_service.get_student_ml_insights(
    institution_id=1,
    student_id=123,
    days=30
)

# Get model performance analytics
analytics = integration_service.get_model_performance_analytics(
    model_id=1,
    days=30
)
```

## Best Practices

1. **Regular Monitoring**: Run health checks daily or weekly
2. **Set Appropriate Thresholds**: Adjust thresholds based on your domain
3. **Monitor Drift Early**: Detect drift before it impacts performance
4. **Review Alerts**: Investigate warnings before they become critical
5. **Test Retraining**: Validate retrained models before auto-promotion
6. **Keep Historical Data**: Maintain prediction history for trend analysis
7. **Document Changes**: Track model versions and performance changes

## Troubleshooting

### Insufficient Data Warnings

If you receive "Insufficient data" warnings:
- Ensure enough predictions exist (minimum 10 for recent, 30 for baseline)
- Check the monitoring window configuration
- Verify predictions are being logged correctly

### High Drift Scores

If drift scores are consistently high:
- Review data quality and preprocessing
- Check for changes in input data distribution
- Consider retraining with recent data
- Adjust drift thresholds if appropriate

### False Retraining Triggers

If models retrain too frequently:
- Increase retraining thresholds
- Extend monitoring windows
- Review alert configuration
- Add manual approval step

## Examples

### Complete Monitoring Workflow

```python
from src.ml.model_monitoring import ModelMonitoringService
from src.database import SessionLocal

db = SessionLocal()
monitoring_service = ModelMonitoringService(db)

# 1. Generate comprehensive report
report = monitoring_service.comprehensive_monitoring_report(
    model_id=1,
    recent_days=7
)

# 2. Check if retraining is needed
if report['retraining_recommended']:
    print(f"Retraining recommended: {report['retraining_reasons']}")
    
    # 3. Trigger automatic retraining
    result = monitoring_service.trigger_automatic_retraining(
        model_id=1,
        auto_promote=True
    )
    
    print(f"Retraining status: {result['retraining_status']}")

# 4. Review health score
print(f"Model health: {report['health_status']} ({report['model_health_score']:.1f}/100)")
```

## License

This monitoring system is part of the FastAPI ML Platform.
