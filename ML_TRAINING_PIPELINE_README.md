# ML Model Training Pipeline

This document describes the automated ML model training pipeline service with scheduled training jobs, model versioning, A/B testing, and champion/challenger model promotion logic.

## Features

### 1. Automated Training Pipeline
- **Scheduled Training**: Automatic model training based on configurable frequency per institution
- **Data Pipeline Integration**: Leverages existing student performance data pipeline
- **Feature Engineering**: Automatic feature extraction and engineering
- **Model Training**: Support for multiple algorithms (Random Forest, Gradient Boosting, Ridge, Lasso, Decision Tree)
- **Cross-Validation**: Built-in k-fold cross-validation for robust model evaluation

### 2. Model Versioning
- **Automatic Versioning**: Each training run creates a new version with timestamp
- **Version History**: Complete history of all trained model versions
- **Metrics Tracking**: Training, validation, and test metrics for each version
- **Model Storage**: Models and scalers saved to filesystem with version tracking

### 3. Champion/Challenger Pattern
- **Champion Model**: Currently deployed production model
- **Challenger Models**: Newly trained models waiting for evaluation
- **Automatic Comparison**: Compare performance metrics between versions
- **Promotion Logic**: Automatic or manual promotion based on performance improvement

### 4. A/B Testing
- **Traffic Split**: Configure percentage of traffic for challenger model
- **Parallel Evaluation**: Run champion and challenger in production simultaneously
- **Performance Monitoring**: Track metrics for both models in real-time
- **Safe Rollback**: Easy rollback to champion if challenger underperforms

### 5. Admin Notifications
- **Training Status**: Notifications when training completes or fails
- **Promotion Alerts**: Notifications when models are promoted
- **Error Alerts**: Immediate notifications for training failures

## Architecture

### Core Components

#### 1. Training Pipeline (`src/ml/training_pipeline.py`)
Main orchestrator for model training workflow:
- `MLTrainingPipeline`: Core training pipeline class
- `TrainingJobConfig`: Configuration for training jobs
- Model comparison and promotion logic
- A/B test configuration management

#### 2. Celery Tasks (`src/tasks/ml_training_tasks.py`)
Async task execution for long-running operations:
- `train_model_task`: Execute model training
- `scheduled_training_task`: Daily scheduled training for all institutions
- `compare_and_promote_task`: Compare and optionally promote models
- `cleanup_old_model_versions`: Clean up old model versions
- `send_training_notification`: Send notifications to admins

#### 3. API Endpoints (`src/api/v1/ml_training.py`)
REST API for managing training:
- `POST /ml-training/train`: Trigger manual training
- `GET /ml-training/history/{model_id}`: View training history
- `GET /ml-training/version/{version_id}`: Get version details
- `POST /ml-training/compare`: Compare model versions
- `POST /ml-training/promote`: Promote model to champion
- `GET /ml-training/ab-test/{model_id}`: Get A/B test status
- `GET /ml-training/schedule/{institution_id}`: Get training schedule
- `PUT /ml-training/schedule/{institution_id}`: Update training schedule

#### 4. Database Models
Extended existing models in `src/models/ml_prediction.py`:
- `MLModel`: Base model configuration
- `MLModelVersion`: Individual trained model versions
- Institution settings store training configuration

## Configuration

### Institution-Level Configuration

Training can be configured per institution via the settings endpoint:

```json
{
  "ml_training": {
    "enabled": true,
    "frequency_days": 7,
    "model_name": "performance_predictor",
    "prediction_type": "overall_percentage",
    "algorithm": "random_forest",
    "hyperparameters": {
      "n_estimators": 100,
      "max_depth": 10,
      "random_state": 42
    },
    "auto_promote": true,
    "promotion_threshold": 0.02,
    "ab_test_enabled": false,
    "ab_test_traffic_split": 0.2
  }
}
```

### Configuration Parameters

- **enabled**: Enable/disable scheduled training
- **frequency_days**: Training frequency (e.g., 7 = weekly)
- **model_name**: Name for the model
- **prediction_type**: Type of prediction (overall_percentage, subject_score, etc.)
- **algorithm**: ML algorithm (random_forest, gradient_boosting, ridge, lasso, decision_tree)
- **hyperparameters**: Algorithm-specific parameters
- **auto_promote**: Automatically promote better models
- **promotion_threshold**: Minimum R² improvement required (e.g., 0.02 = 2% improvement)
- **ab_test_enabled**: Enable A/B testing
- **ab_test_traffic_split**: Percentage of traffic for challenger (e.g., 0.2 = 20%)

## Usage Examples

### 1. Manual Training

Trigger a manual training job:

```python
POST /api/v1/ml-training/train?institution_id=1
{
  "model_name": "performance_predictor",
  "prediction_type": "overall_percentage",
  "algorithm": "random_forest",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 10
  },
  "auto_promote": true,
  "promotion_threshold": 0.02,
  "notify_admins": true
}
```

Response:
```json
{
  "task_id": "abc123-def456-ghi789",
  "message": "Training task initiated for model 'performance_predictor'",
  "status": "pending"
}
```

### 2. Check Task Status

Monitor training progress:

```python
GET /api/v1/ml-training/task/abc123-def456-ghi789
```

Response:
```json
{
  "task_id": "abc123-def456-ghi789",
  "status": "SUCCESS",
  "result": {
    "model_id": 1,
    "version": "v20240115_120000",
    "test_metrics": {
      "r2_score": 0.87,
      "rmse": 8.5,
      "mae": 6.2
    },
    "promotion": {
      "auto_promoted": true,
      "improvement": 0.03
    }
  }
}
```

### 3. View Training History

Get training history for a model:

```python
GET /api/v1/ml-training/history/1?limit=10
```

Response:
```json
{
  "model_id": 1,
  "model_name": "performance_predictor",
  "history": [
    {
      "version_id": 5,
      "version": "v20240115_120000",
      "training_date": "2024-01-15T12:00:00Z",
      "training_samples": 1000,
      "test_metrics": {
        "r2_score": 0.87,
        "rmse": 8.5
      },
      "is_deployed": true,
      "deployed_at": "2024-01-15T12:05:00Z"
    }
  ],
  "total_count": 5
}
```

### 4. Compare Model Versions

Compare champion vs challenger:

```python
POST /api/v1/ml-training/compare
{
  "champion_version_id": 4,
  "challenger_version_id": 5
}
```

Response:
```json
{
  "comparison": {
    "champion": {
      "version": "v20240108_120000",
      "test_metrics": {"r2_score": 0.84}
    },
    "challenger": {
      "version": "v20240115_120000",
      "test_metrics": {"r2_score": 0.87}
    }
  },
  "improvement": {
    "r2_improvement": 0.03,
    "r2_improvement_percentage": 3.57
  },
  "recommendation": "promote",
  "promote_challenger": true
}
```

### 5. Promote Model

Manually promote a model version:

```python
POST /api/v1/ml-training/promote?deployed_by=123
{
  "model_version_id": 5
}
```

Response:
```json
{
  "promoted_version": "v20240115_120000",
  "model_id": 1,
  "previous_champion": "v20240108_120000",
  "promoted_at": "2024-01-15T12:10:00Z",
  "test_r2_score": 0.87,
  "message": "Model version v20240115_120000 promoted to champion"
}
```

### 6. Configure Training Schedule

Update training schedule for an institution:

```python
PUT /api/v1/ml-training/schedule/1
{
  "config": {
    "enabled": true,
    "frequency_days": 7,
    "model_name": "performance_predictor",
    "algorithm": "random_forest",
    "auto_promote": true,
    "promotion_threshold": 0.02,
    "ab_test_enabled": true,
    "ab_test_traffic_split": 0.2
  }
}
```

### 7. Get A/B Test Status

Check A/B test configuration:

```python
GET /api/v1/ml-training/ab-test/1
```

Response:
```json
{
  "model_id": 1,
  "champion": {
    "version_id": 4,
    "version": "v20240108_120000",
    "test_metrics": {"r2_score": 0.84}
  },
  "challenger": {
    "version_id": 5,
    "version": "v20240115_120000",
    "test_metrics": {"r2_score": 0.87}
  },
  "ab_test_enabled": true,
  "traffic_split": 0.2
}
```

## Celery Scheduled Tasks

### Daily Tasks

**Scheduled Training** (runs daily at midnight):
```python
"scheduled-ml-training": {
    "task": "ml_training.scheduled_training",
    "schedule": 86400.0,  # 24 hours
}
```

Checks all institutions with enabled scheduled training and triggers training jobs based on configured frequency.

### Weekly Tasks

**Cleanup Old Versions** (runs weekly):
```python
"cleanup-old-model-versions": {
    "task": "ml_training.cleanup_old_model_versions",
    "schedule": 604800.0,  # 7 days
}
```

Removes old model versions (keeps latest 5, deletes versions older than 90 days).

## Champion/Challenger Promotion Logic

### Automatic Promotion

When `auto_promote` is enabled:

1. New model is trained
2. Compare against current champion using R² score
3. If improvement > `promotion_threshold`:
   - Demote current champion
   - Promote new model to champion
   - Send notification to admins
4. If improvement < threshold:
   - Keep current champion
   - New model becomes challenger for A/B testing

### Manual Promotion

Admins can manually promote any version:

1. Compare models manually
2. Review metrics and improvement
3. Explicitly promote chosen version
4. Notification sent to all admins

## A/B Testing Workflow

### Setup

1. Enable A/B testing in configuration
2. Set traffic split (e.g., 20% to challenger)
3. Champion serves 80% of requests
4. Challenger serves 20% of requests

### Monitoring

- Track metrics for both models
- Compare performance in production
- Adjust traffic split if needed
- Promote challenger when ready

### Implementation

When making predictions with A/B testing enabled:

```python
import random

def get_model_for_prediction(model_id, student_id):
    ab_test_status = get_ab_test_status(model_id)
    
    if not ab_test_status['ab_test_enabled']:
        return ab_test_status['champion']
    
    # Use student_id for consistent routing
    if hash(student_id) % 100 < (ab_test_status['traffic_split'] * 100):
        return ab_test_status['challenger']
    else:
        return ab_test_status['champion']
```

## Notifications

### Training Completed

```
Title: ML Model Training Completed
Message: Model 1 training completed successfully. 
         Version: v20240115_120000. 
         R² Score: 0.87
         Model has been automatically promoted to champion.
```

### Training Failed

```
Title: ML Model Training Failed
Message: Model training failed for institution 1. 
         Error: Insufficient training data
```

### Model Promoted

```
Title: ML Model Promoted
Message: Model version v20240115_120000 has been promoted to champion.
         Previous champion: v20240108_120000
         R² Score improvement: 0.03 (3.57%)
```

## Best Practices

### 1. Training Frequency
- Start with weekly training (7 days)
- Adjust based on data change rate
- More frequent for rapidly changing data
- Less frequent for stable patterns

### 2. Promotion Threshold
- Start with 2% improvement (0.02)
- Higher threshold for critical systems
- Lower threshold for experimental models
- Monitor false positive promotions

### 3. A/B Testing
- Start with 10-20% traffic split
- Run for at least one week
- Monitor both models closely
- Increase split gradually

### 4. Model Cleanup
- Keep 5 most recent versions
- Keep all deployed versions
- Clean up after 90 days
- Store metrics before deletion

### 5. Monitoring
- Track R² score trends
- Monitor training duration
- Watch for data quality issues
- Set up alerts for failures

## Troubleshooting

### Training Fails
- Check data availability
- Verify feature engineering
- Review hyperparameters
- Check logs for errors

### Poor Model Performance
- Increase training data
- Adjust hyperparameters
- Try different algorithms
- Add more features

### Promotion Not Working
- Check improvement threshold
- Verify auto_promote setting
- Review comparison metrics
- Check admin permissions

### A/B Test Issues
- Verify traffic split configuration
- Check model loading
- Monitor prediction latency
- Review routing logic

## API Reference

Full API documentation available at `/api/v1/docs` after starting the server.

### Endpoints Summary

- **POST /ml-training/train** - Trigger manual training
- **GET /ml-training/task/{task_id}** - Get task status
- **GET /ml-training/history/{model_id}** - Get training history
- **GET /ml-training/history** - Get all training history
- **GET /ml-training/version/{version_id}** - Get version details
- **POST /ml-training/compare** - Compare model versions
- **POST /ml-training/promote** - Promote model version
- **POST /ml-training/compare-and-promote** - Compare and auto-promote
- **GET /ml-training/ab-test/{model_id}** - Get A/B test status
- **GET /ml-training/metrics/summary** - Get metrics summary
- **GET /ml-training/schedule/{institution_id}** - Get training schedule
- **PUT /ml-training/schedule/{institution_id}** - Update training schedule
- **POST /ml-training/cleanup/old-versions** - Cleanup old versions

## Database Schema

### MLModel
- institution_id, name, algorithm, prediction_type
- status (training, active, deprecated, failed)
- is_active (boolean)

### MLModelVersion
- model_id, version, model_path, scaler_path
- training/validation/test metrics
- feature_importance, cross_validation_scores
- is_deployed, deployed_at, deployed_by
- training_samples, training_date

### Institution Settings (JSON)
```json
{
  "ml_training": {
    "enabled": true,
    "frequency_days": 7,
    ...
  }
}
```

## Performance Considerations

- Training jobs run asynchronously via Celery
- Model loading cached in memory
- Prediction API uses Redis caching
- Old versions cleaned up automatically
- Large models stored on filesystem/S3

## Security

- Admin-only access to training endpoints
- Institution-scoped data access
- Audit logging for promotions
- Secure model storage
- API authentication required
