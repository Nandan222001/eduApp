# ML Training Pipeline - Quick Start Guide

## Overview

Automated ML model training pipeline with scheduled jobs, model versioning, A/B testing, and champion/challenger promotion.

## Quick Setup

### 1. Start Celery Workers

```bash
# Start Celery worker
celery -A src.celery_app worker --loglevel=info

# Start Celery beat (scheduler)
celery -A src.celery_app beat --loglevel=info
```

### 2. Configure Institution Training Schedule

```bash
curl -X PUT "http://localhost:8000/api/v1/ml-training/schedule/1" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "enabled": true,
      "frequency_days": 7,
      "model_name": "performance_predictor",
      "algorithm": "random_forest",
      "auto_promote": true,
      "promotion_threshold": 0.02
    }
  }'
```

### 3. Trigger Manual Training

```bash
curl -X POST "http://localhost:8000/api/v1/ml-training/train?institution_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "performance_predictor",
    "algorithm": "random_forest",
    "auto_promote": true,
    "notify_admins": true
  }'
```

Response:
```json
{
  "task_id": "abc123-def456",
  "message": "Training task initiated",
  "status": "pending"
}
```

### 4. Check Training Status

```bash
curl "http://localhost:8000/api/v1/ml-training/task/abc123-def456"
```

### 5. View Training History

```bash
curl "http://localhost:8000/api/v1/ml-training/history/1"
```

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ml-training/train` | POST | Trigger manual training |
| `/ml-training/task/{task_id}` | GET | Check task status |
| `/ml-training/history/{model_id}` | GET | View training history |
| `/ml-training/compare` | POST | Compare model versions |
| `/ml-training/promote` | POST | Promote model to champion |
| `/ml-training/schedule/{id}` | GET/PUT | Manage training schedule |

## Features

✅ **Scheduled Training**: Automatic training based on configurable frequency  
✅ **Model Versioning**: Complete history with metrics tracking  
✅ **Champion/Challenger**: Automatic promotion based on performance  
✅ **A/B Testing**: Safe testing of new models in production  
✅ **Admin Notifications**: Alerts for training completion and failures  

## Configuration Options

- **frequency_days**: Training interval (e.g., 7 for weekly)
- **algorithm**: random_forest, gradient_boosting, ridge, lasso
- **auto_promote**: Automatically promote better models
- **promotion_threshold**: Minimum improvement required (e.g., 0.02 = 2%)
- **ab_test_enabled**: Enable A/B testing
- **ab_test_traffic_split**: Traffic percentage for challenger (e.g., 0.2 = 20%)

## Scheduled Tasks

- **Daily**: Scheduled training check (runs at midnight)
- **Weekly**: Cleanup old model versions (keeps latest 5)

## Next Steps

1. Configure training schedule for your institutions
2. Monitor training history and metrics
3. Set up A/B testing for production validation
4. Review promotion logs and model performance

For detailed documentation, see [ML_TRAINING_PIPELINE_README.md](ML_TRAINING_PIPELINE_README.md)
