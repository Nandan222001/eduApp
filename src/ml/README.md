# ML Module

This module contains the machine learning components for student performance prediction.

## Structure

```
ml/
├── __init__.py                 # Module initialization
├── config.py                   # ML system configuration
├── data_pipeline.py            # Data extraction pipeline
├── data_preparation.py         # Data preprocessing and validation
├── feature_engineering.py      # Basic feature engineering
├── advanced_features.py        # Advanced feature engineering
├── ml_service.py              # Main ML service
├── prediction_service.py       # Prediction service with models
├── model_storage.py           # Model storage and versioning
└── utils.py                   # Utility functions
```

## Components

### Configuration (`config.py`)
Central configuration for ML system settings:
- Algorithm default parameters
- Cache TTL settings
- Feature engineering settings
- Prediction type configurations

### Data Pipeline (`data_pipeline.py`)
Extracts data from database:
- Student attendance records
- Assignment submissions
- Exam results
- Aggregates historical data

### Data Preparation (`data_preparation.py`)
Prepares data for training:
- Train/test splitting
- Data validation
- Missing value handling
- Feature normalization

### Feature Engineering (`feature_engineering.py`)
Basic feature extraction:
- Attendance statistics
- Assignment scores
- Exam performance
- Subject-wise metrics

### Advanced Features (`advanced_features.py`)
Advanced feature creation:
- Time-based features
- Rolling statistics
- Lag features
- Trend analysis
- Interaction features

### Prediction Service (`prediction_service.py`)
Core prediction functionality:
- Model training with cross-validation
- Performance predictions with confidence intervals
- What-if scenario analysis
- Model metrics retrieval

### Model Storage (`model_storage.py`)
Model persistence:
- Local file storage
- S3 cloud storage
- Version management
- Model loading/saving

### ML Service (`ml_service.py`)
High-level ML operations:
- Feature extraction
- Training data preparation
- Performance summaries
- At-risk student identification

## Usage

### Train a Model

```python
from src.ml.prediction_service import PerformancePredictionService
from src.database import SessionLocal

db = SessionLocal()
service = PerformancePredictionService(db)

model, version = service.train_model(
    institution_id=1,
    model_name="Performance Predictor",
    algorithm='random_forest'
)
```

### Make Predictions

```python
prediction = service.predict_performance(
    model_id=model.id,
    student_id=100,
    input_features={
        'attendance_percentage': 85.5,
        'avg_assignment_score': 78.2,
        'avg_exam_score': 82.0
    }
)
```

### Analyze Scenarios

```python
scenarios = service.analyze_what_if_scenarios(
    base_prediction_id=prediction.id,
    scenarios=[
        {
            'name': 'Improved Attendance',
            'modified_features': {'attendance_percentage': 95.0}
        }
    ]
)
```

## Supported Algorithms

1. **Random Forest** (recommended)
2. **Gradient Boosting**
3. **Linear Regression**
4. **Ridge Regression**
5. **Lasso Regression**

## Configuration

Edit `config.py` to customize:

```python
from src.ml.config import ml_config

# Modify cache settings
ml_config.CACHE_TTL_PREDICTION = 7200  # 2 hours

# Modify algorithm parameters
ml_config.RANDOM_FOREST_PARAMS['n_estimators'] = 200

# Modify feature engineering
ml_config.ROLLING_WINDOWS = [7, 14, 30]
```

## Features

### Extracted Features

#### Attendance
- Overall attendance percentage
- Subject-wise attendance
- Attendance categories (high/medium/low)

#### Assignments
- Average assignment score
- Completion rate
- Subject-wise scores
- Missing assignments

#### Exams
- Average exam score
- Exam count
- Performance trend
- Subject-wise scores

#### Composite
- Overall performance score
- Engagement score
- Performance consistency

### Advanced Features

- **Time-based**: Day of week, month, quarter
- **Rolling**: Moving averages, std dev
- **Lag**: Historical values
- **Trend**: Performance slope
- **Momentum**: Rate of change
- **Interaction**: Feature combinations

## Model Versioning

Models are versioned automatically:
- Format: `v{major}.{minor}.{timestamp}`
- Example: `v1.0.20240115120000`

Each version stores:
- Trained model file
- Scaler file
- Training metrics
- Feature importance
- Hyperparameters

## Performance

### Caching
- Predictions cached for 1 hour
- Model metrics cached for 30 minutes
- Model list cached for 10 minutes

### Storage
- Local: `ml_models/` directory
- Cloud: S3 bucket (optional)

## Testing

Run the example:
```bash
python examples/prediction_example.py
```

## Documentation

See main documentation files:
- `ML_PREDICTION_IMPLEMENTATION.md` - Complete guide
- `ML_PREDICTION_QUICK_START.md` - Quick start
- `ML_PREDICTION_SUMMARY.md` - Summary
