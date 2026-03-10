# Student Performance Prediction ML Implementation

## Overview

This implementation provides a complete machine learning system for predicting student performance using historical data. The system includes regression models, confidence intervals, what-if scenario analysis, model training pipelines with cross-validation, model versioning, and caching-enabled prediction APIs.

## Features

### 1. Regression Models for Performance Prediction
- **Supported Algorithms**:
  - Random Forest Regressor (default)
  - Gradient Boosting Regressor
  - Linear Regression
  - Ridge Regression
  - Lasso Regression

- **Target Predictions**:
  - Overall percentage prediction
  - Exam performance prediction
  - Subject-specific score prediction

### 2. Confidence Interval Calculation
- Confidence intervals computed for all predictions
- Configurable confidence levels (default 95%)
- Uses ensemble variance for Random Forest/Gradient Boosting
- Statistical margin calculation for linear models

### 3. What-If Scenario Analysis Engine
- Create multiple scenarios with modified features
- Compare predicted outcomes against baseline
- Get percentage change and value change metrics
- Automated recommendations based on scenarios

### 4. Model Training Pipeline with Cross-Validation
- K-fold cross-validation (default 5 folds)
- Automated train/test split
- Feature scaling and normalization
- Comprehensive metrics tracking:
  - R² score
  - Mean Absolute Error (MAE)
  - Root Mean Squared Error (RMSE)
  - Cross-validation scores

### 5. Model Versioning and Storage
- Local file storage for all models
- Optional S3 storage for production deployment
- Version tracking for all model iterations
- Metadata storage for model lineage
- Model deployment management

### 6. Prediction API Endpoints with Caching
- Redis-based caching for improved performance
- Configurable cache TTL per endpoint type
- Batch prediction support
- Historical prediction tracking

## Database Schema

### Tables Created

#### 1. `ml_models`
Stores ML model metadata and configuration.

**Columns**:
- `id`: Primary key
- `institution_id`: Institution reference
- `name`: Model name
- `description`: Model description
- `model_type`: Type (regression/classification/time_series)
- `prediction_type`: What it predicts
- `algorithm`: Algorithm used
- `hyperparameters`: JSON of hyperparameters
- `feature_names`: JSON array of feature names
- `target_column`: Target variable name
- `status`: Model status (training/active/deprecated/failed)
- `is_active`: Whether model is active
- `created_at`, `updated_at`: Timestamps

#### 2. `ml_model_versions`
Stores model versions and training metrics.

**Columns**:
- `id`: Primary key
- `model_id`: Reference to ml_models
- `version`: Version string
- `model_path`: Local file path
- `s3_key`: S3 storage key (optional)
- `scaler_path`: Scaler file path
- `scaler_s3_key`: Scaler S3 key (optional)
- `training_metrics`: JSON of training metrics
- `validation_metrics`: JSON of validation metrics
- `test_metrics`: JSON of test metrics
- `cross_validation_scores`: JSON of CV scores
- `feature_importance`: JSON of feature importances
- `training_samples`: Number of training samples
- `training_date`: When model was trained
- `is_deployed`: Whether version is deployed
- `deployed_at`, `deployed_by`: Deployment info
- `notes`: Version notes
- `created_at`: Timestamp

#### 3. `performance_predictions`
Stores all predictions made by models.

**Columns**:
- `id`: Primary key
- `institution_id`: Institution reference
- `model_id`: Model used
- `model_version_id`: Version used
- `student_id`: Student reference
- `predicted_value`: Predicted value
- `confidence_lower`: Lower confidence bound
- `confidence_upper`: Upper confidence bound
- `confidence_level`: Confidence level (e.g., 0.95)
- `input_features`: JSON of input features
- `feature_contributions`: JSON of feature contributions
- `prediction_context`: JSON of additional context
- `is_scenario`: Whether this is a scenario prediction
- `predicted_at`: When prediction was made
- `created_at`: Timestamp

#### 4. `prediction_scenarios`
Stores what-if scenario analyses.

**Columns**:
- `id`: Primary key
- `base_prediction_id`: Reference to base prediction
- `scenario_name`: Scenario name
- `scenario_description`: Scenario description
- `modified_features`: JSON of modified features
- `predicted_value`: Predicted value in scenario
- `confidence_lower`, `confidence_upper`: Confidence bounds
- `value_change`: Absolute change from baseline
- `percentage_change`: Percentage change from baseline
- `recommendations`: JSON of recommendations
- `created_at`: Timestamp

## API Endpoints

### 1. Train Model
**POST** `/api/v1/predictions/train`

Train a new prediction model.

**Request Body**:
```json
{
  "institution_id": 1,
  "model_name": "Student Performance Predictor v1",
  "algorithm": "random_forest",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 10
  },
  "target_column": "exam_percentage",
  "prediction_type": "overall_percentage",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "test_size": 0.2,
  "cv_folds": 5,
  "random_state": 42
}
```

**Response**:
```json
{
  "model_id": 1,
  "version": "v1.0.20240101120000",
  "training_metrics": {
    "r2_score": 0.85,
    "mae": 5.2,
    "rmse": 7.1,
    "samples": 800
  },
  "test_metrics": {
    "r2_score": 0.82,
    "mae": 5.8,
    "rmse": 7.5,
    "samples": 200
  },
  "cross_validation_scores": {
    "mean_cv_score": 0.83,
    "std_cv_score": 0.02,
    "cv_scores": [0.85, 0.82, 0.84, 0.81, 0.83]
  },
  "feature_importance": {
    "attendance_percentage": 0.25,
    "avg_assignment_score": 0.30,
    "avg_exam_score": 0.45
  },
  "training_samples": 800,
  "message": "Model trained successfully with R² score: 0.8200"
}
```

### 2. Predict Performance
**POST** `/api/v1/predictions/predict`

Make a performance prediction for a student.

**Request Body**:
```json
{
  "model_id": 1,
  "student_id": 100,
  "input_features": {
    "attendance_percentage": 85.5,
    "avg_assignment_score": 78.2,
    "avg_exam_score": 82.0,
    "total_assignments": 20,
    "completed_assignments": 18
  },
  "confidence_level": 0.95,
  "calculate_contributions": true
}
```

**Response**:
```json
{
  "prediction_id": 1,
  "student_id": 100,
  "predicted_value": 80.5,
  "confidence_lower": 75.2,
  "confidence_upper": 85.8,
  "confidence_level": 0.95,
  "feature_contributions": {
    "attendance_percentage": {
      "value": 85.5,
      "importance": 0.25,
      "contribution": 21.375
    },
    "avg_assignment_score": {
      "value": 78.2,
      "importance": 0.30,
      "contribution": 23.46
    },
    "avg_exam_score": {
      "value": 82.0,
      "importance": 0.45,
      "contribution": 36.9
    }
  },
  "predicted_at": "2024-01-15T10:30:00"
}
```

### 3. Batch Predict
**POST** `/api/v1/predictions/batch-predict`

Make predictions for multiple students.

**Request Body**:
```json
{
  "model_id": 1,
  "student_ids": [100, 101, 102, 103],
  "confidence_level": 0.95
}
```

**Response**:
```json
{
  "predictions": [
    {
      "student_id": 100,
      "predicted_value": 80.5,
      "confidence_lower": 75.2,
      "confidence_upper": 85.8
    },
    {
      "student_id": 101,
      "predicted_value": 72.3,
      "confidence_lower": 67.1,
      "confidence_upper": 77.5
    }
  ],
  "total_count": 2
}
```

### 4. What-If Scenario Analysis
**POST** `/api/v1/predictions/what-if`

Analyze what-if scenarios based on a prediction.

**Request Body**:
```json
{
  "base_prediction_id": 1,
  "scenarios": [
    {
      "name": "Improved Attendance",
      "description": "If student improves attendance to 95%",
      "modified_features": {
        "attendance_percentage": 95.0
      }
    },
    {
      "name": "Complete All Assignments",
      "description": "If student completes all assignments",
      "modified_features": {
        "completed_assignments": 20
      }
    }
  ]
}
```

**Response**:
```json
{
  "base_prediction": {
    "prediction_id": 1,
    "student_id": 100,
    "predicted_value": 80.5,
    "confidence_lower": 75.2,
    "confidence_upper": 85.8,
    "confidence_level": 0.95,
    "predicted_at": "2024-01-15T10:30:00"
  },
  "scenarios": [
    {
      "scenario_id": 1,
      "scenario_name": "Improved Attendance",
      "scenario_description": "If student improves attendance to 95%",
      "predicted_value": 83.2,
      "confidence_lower": 78.0,
      "confidence_upper": 88.4,
      "value_change": 2.7,
      "percentage_change": 3.35,
      "recommendations": [
        {
          "type": "positive_impact",
          "message": "This change could improve performance by 3.35%"
        },
        {
          "type": "attendance",
          "message": "Maintaining high attendance (>95.0%) is excellent for performance"
        }
      ]
    },
    {
      "scenario_id": 2,
      "scenario_name": "Complete All Assignments",
      "scenario_description": "If student completes all assignments",
      "predicted_value": 82.8,
      "confidence_lower": 77.5,
      "confidence_upper": 88.1,
      "value_change": 2.3,
      "percentage_change": 2.86,
      "recommendations": [
        {
          "type": "positive_impact",
          "message": "This change could improve performance by 2.86%"
        }
      ]
    }
  ],
  "total_scenarios": 2
}
```

### 5. Get Model Metrics
**GET** `/api/v1/predictions/models/{model_id}/metrics`

Get detailed metrics for a model.

**Response**:
```json
{
  "version": "v1.0.20240101120000",
  "training_metrics": {
    "r2_score": 0.85,
    "mae": 5.2,
    "rmse": 7.1,
    "samples": 800
  },
  "test_metrics": {
    "r2_score": 0.82,
    "mae": 5.8,
    "rmse": 7.5,
    "samples": 200
  },
  "cross_validation_scores": {
    "mean_cv_score": 0.83,
    "std_cv_score": 0.02,
    "cv_scores": [0.85, 0.82, 0.84, 0.81, 0.83]
  },
  "feature_importance": {
    "attendance_percentage": 0.25,
    "avg_assignment_score": 0.30,
    "avg_exam_score": 0.45
  },
  "training_samples": 800,
  "training_date": "2024-01-01T12:00:00"
}
```

### 6. List Models
**GET** `/api/v1/predictions/models?institution_id=1&status=active`

List all models for an institution.

**Query Parameters**:
- `institution_id` (required): Institution ID
- `status` (optional): Filter by status (training/active/deprecated/failed)
- `prediction_type` (optional): Filter by prediction type

**Response**:
```json
{
  "models": [
    {
      "id": 1,
      "name": "Student Performance Predictor v1",
      "algorithm": "random_forest",
      "model_type": "regression",
      "prediction_type": "overall_percentage",
      "status": "active",
      "is_active": true,
      "created_at": "2024-01-01T12:00:00"
    }
  ],
  "total_count": 1
}
```

### 7. Get Prediction History
**GET** `/api/v1/predictions/students/{student_id}/history?limit=10`

Get prediction history for a student.

**Query Parameters**:
- `limit` (optional): Number of predictions to return (default 10)

**Response**:
```json
{
  "student_id": 100,
  "predictions": [
    {
      "id": 5,
      "predicted_value": 82.3,
      "confidence_lower": 77.1,
      "confidence_upper": 87.5,
      "predicted_at": "2024-01-15T14:30:00"
    },
    {
      "id": 4,
      "predicted_value": 80.5,
      "confidence_lower": 75.2,
      "confidence_upper": 85.8,
      "predicted_at": "2024-01-15T10:30:00"
    }
  ],
  "total_count": 2
}
```

## Caching Strategy

### Cache Keys
- Predictions: `prediction:{hash(model_id, student_id, features)}`
- What-if scenarios: `what_if:{hash(base_prediction_id, scenarios)}`
- Model metrics: `model_metrics:{model_id}`
- Model list: `models_list:{hash(institution_id, status, prediction_type)}`
- History: `prediction_history:{student_id}:{limit}`

### Cache TTL
- Predictions: 3600 seconds (1 hour)
- Metrics: 1800 seconds (30 minutes)
- Model list: 600 seconds (10 minutes)

## Advanced Features

### Feature Engineering
The system includes advanced feature engineering:

1. **Time-based features**: Day of week, month, quarter, weekend indicators
2. **Rolling features**: Moving averages and statistics
3. **Lag features**: Historical values
4. **Trend features**: Performance trends over time
5. **Momentum features**: Rate of change in performance
6. **Interaction features**: Feature combinations
7. **Subject-specific features**: Subject performance analysis
8. **Attendance features**: Attendance categorization and transformations
9. **Assignment features**: Completion rates and consistency
10. **Composite features**: Combined performance metrics

### Model Storage
- **Local Storage**: All models stored in `ml_models/` directory
- **S3 Storage**: Optional cloud storage for production
- **Versioning**: Automatic version numbering
- **Metadata**: JSON metadata files for each model

## Usage Example

```python
from src.ml.prediction_service import PerformancePredictionService
from src.database import get_db

db = next(get_db())
prediction_service = PerformancePredictionService(db)

# Train a model
ml_model, model_version = prediction_service.train_model(
    institution_id=1,
    model_name="Performance Predictor",
    algorithm='random_forest',
    target_column='exam_percentage'
)

# Make a prediction
prediction = prediction_service.predict_performance(
    model_id=ml_model.id,
    student_id=100,
    input_features={
        'attendance_percentage': 85.5,
        'avg_assignment_score': 78.2,
        'avg_exam_score': 82.0
    }
)

# Analyze scenarios
scenarios = prediction_service.analyze_what_if_scenarios(
    base_prediction_id=prediction.id,
    scenarios=[
        {
            'name': 'Improved Attendance',
            'modified_features': {'attendance_percentage': 95.0}
        }
    ]
)
```

## Configuration

### Environment Variables
- `AWS_ACCESS_KEY_ID`: AWS access key for S3 storage
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region
- `S3_BUCKET_NAME`: S3 bucket for model storage
- `REDIS_HOST`: Redis host for caching
- `REDIS_PORT`: Redis port
- `REDIS_PASSWORD`: Redis password (optional)

## Migration

Run the migration to create the required tables:

```bash
alembic upgrade head
```

## Files Created/Modified

### New Files
1. `src/models/ml_prediction.py` - Database models
2. `src/ml/prediction_service.py` - Prediction service
3. `src/ml/model_storage.py` - Model storage service
4. `src/ml/advanced_features.py` - Advanced feature engineering
5. `src/schemas/prediction_schemas.py` - API schemas
6. `src/api/v1/predictions.py` - API endpoints
7. `alembic/versions/add_ml_prediction_tables.py` - Database migration

### Modified Files
1. `src/models/__init__.py` - Added ML model imports
2. `src/api/v1/__init__.py` - Added predictions router

## Performance Considerations

1. **Caching**: All predictions are cached in Redis for improved performance
2. **Batch Processing**: Batch prediction endpoint for multiple students
3. **Model Loading**: Models loaded once and reused
4. **Feature Extraction**: Optimized feature extraction from database
5. **Index Usage**: Database indexes on all foreign keys and frequently queried columns

## Future Enhancements

1. AutoML for hyperparameter tuning
2. Deep learning models (Neural Networks)
3. Time series forecasting for long-term predictions
4. Anomaly detection for at-risk students
5. A/B testing framework for model comparison
6. Model monitoring and drift detection
7. Explainable AI (SHAP values)
8. Real-time prediction streaming
