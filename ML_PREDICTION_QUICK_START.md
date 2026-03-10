# ML Prediction Quick Start Guide

## Setup

### 1. Run Database Migration

```bash
alembic upgrade head
```

This creates the following tables:
- `ml_models`
- `ml_model_versions`
- `performance_predictions`
- `prediction_scenarios`

### 2. Ensure Dependencies

All required dependencies are already in `pyproject.toml`:
- scikit-learn
- pandas
- numpy
- joblib
- scipy

## Quick Usage Examples

### Example 1: Train Your First Model

```bash
curl -X POST "http://localhost:8000/api/v1/predictions/train" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "model_name": "Student Performance Predictor",
    "algorithm": "random_forest",
    "target_column": "exam_percentage",
    "prediction_type": "overall_percentage",
    "test_size": 0.2,
    "cv_folds": 5
  }'
```

**Expected Response**:
```json
{
  "model_id": 1,
  "version": "v1.0.20240115120000",
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
  "message": "Model trained successfully with R² score: 0.8200"
}
```

### Example 2: Make a Prediction

```bash
curl -X POST "http://localhost:8000/api/v1/predictions/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": 1,
    "student_id": 100,
    "input_features": {
      "attendance_percentage": 85.5,
      "avg_assignment_score": 78.2,
      "avg_exam_score": 82.0,
      "total_assignments": 20,
      "completed_assignments": 18
    },
    "confidence_level": 0.95
  }'
```

**Expected Response**:
```json
{
  "prediction_id": 1,
  "student_id": 100,
  "predicted_value": 80.5,
  "confidence_lower": 75.2,
  "confidence_upper": 85.8,
  "confidence_level": 0.95,
  "predicted_at": "2024-01-15T10:30:00"
}
```

### Example 3: What-If Scenario Analysis

```bash
curl -X POST "http://localhost:8000/api/v1/predictions/what-if" \
  -H "Content-Type: application/json" \
  -d '{
    "base_prediction_id": 1,
    "scenarios": [
      {
        "name": "Improved Attendance",
        "description": "If attendance improves to 95%",
        "modified_features": {
          "attendance_percentage": 95.0
        }
      },
      {
        "name": "All Assignments Completed",
        "modified_features": {
          "completed_assignments": 20
        }
      }
    ]
  }'
```

### Example 4: Get Model Metrics

```bash
curl -X GET "http://localhost:8000/api/v1/predictions/models/1/metrics"
```

### Example 5: List All Models

```bash
curl -X GET "http://localhost:8000/api/v1/predictions/models?institution_id=1&status=active"
```

### Example 6: Get Student Prediction History

```bash
curl -X GET "http://localhost:8000/api/v1/predictions/students/100/history?limit=10"
```

## Python SDK Examples

### Train a Model

```python
from src.ml.prediction_service import PerformancePredictionService
from src.database import get_db

db = next(get_db())
service = PerformancePredictionService(db)

# Train model
model, version = service.train_model(
    institution_id=1,
    model_name="Performance Predictor v1",
    algorithm='random_forest',
    target_column='exam_percentage'
)

print(f"Model ID: {model.id}")
print(f"Version: {version.version}")
print(f"Test R²: {version.test_metrics['r2_score']:.4f}")
```

### Make a Prediction

```python
# Make prediction
prediction = service.predict_performance(
    model_id=1,
    student_id=100,
    input_features={
        'attendance_percentage': 85.5,
        'avg_assignment_score': 78.2,
        'avg_exam_score': 82.0
    },
    confidence_level=0.95
)

print(f"Predicted: {prediction.predicted_value:.2f}")
print(f"Range: {prediction.confidence_lower:.2f} - {prediction.confidence_upper:.2f}")
```

### Analyze What-If Scenarios

```python
scenarios = service.analyze_what_if_scenarios(
    base_prediction_id=1,
    scenarios=[
        {
            'name': 'Better Attendance',
            'modified_features': {'attendance_percentage': 95.0}
        },
        {
            'name': 'Complete Assignments',
            'modified_features': {'completed_assignments': 20}
        }
    ]
)

for scenario in scenarios:
    print(f"{scenario.scenario_name}:")
    print(f"  Predicted: {scenario.predicted_value:.2f}")
    print(f"  Change: {scenario.percentage_change:.2f}%")
```

## Available Algorithms

### 1. Random Forest (Recommended)
```python
algorithm='random_forest'
hyperparameters={
    'n_estimators': 100,
    'max_depth': 10,
    'min_samples_split': 5
}
```

### 2. Gradient Boosting
```python
algorithm='gradient_boosting'
hyperparameters={
    'n_estimators': 100,
    'learning_rate': 0.1,
    'max_depth': 5
}
```

### 3. Linear Regression
```python
algorithm='linear_regression'
```

### 4. Ridge Regression
```python
algorithm='ridge'
hyperparameters={'alpha': 1.0}
```

### 5. Lasso Regression
```python
algorithm='lasso'
hyperparameters={'alpha': 1.0}
```

## Common Features Used

The system automatically extracts these features from student data:

### Attendance Features
- `attendance_percentage`: Overall attendance
- `attendance_high/medium/low`: Attendance categories
- `subject_attendance_*`: Subject-wise attendance

### Assignment Features
- `avg_assignment_score`: Average assignment score
- `total_assignments`: Total assignments
- `completed_assignments`: Completed assignments
- `assignment_completion_rate`: Completion percentage
- `subject_avg_assignment_score_*`: Subject-wise scores

### Exam Features
- `avg_exam_score`: Average exam score
- `exam_count`: Number of exams taken
- `exam_trend_slope`: Performance trend
- `subject_avg_exam_score_*`: Subject-wise scores

### Composite Features
- `overall_performance_score`: Combined performance
- `engagement_score`: Attendance + Assignment score
- `performance_consistency`: Variance in performance

## Prediction Types

1. **overall_percentage**: Predict overall student percentage
2. **exam_performance**: Predict next exam performance
3. **subject_score**: Predict subject-specific scores
4. **pass_fail**: Predict pass/fail outcome (classification)

## Interpreting Results

### R² Score
- **0.8 - 1.0**: Excellent model
- **0.6 - 0.8**: Good model
- **0.4 - 0.6**: Moderate model
- **< 0.4**: Poor model (retrain with more data)

### MAE (Mean Absolute Error)
- Average prediction error
- Lower is better
- Unit: Same as target (e.g., percentage points)

### RMSE (Root Mean Squared Error)
- Standard deviation of errors
- Penalizes large errors more than MAE
- Lower is better

### Confidence Intervals
- 95% confidence: 95% chance actual value is in range
- Wider intervals = less certain predictions
- Narrower intervals = more confident predictions

## Troubleshooting

### Issue: "No data available for the specified criteria"
**Solution**: Ensure there's historical data for students in the institution. Check:
- Exam results exist
- Attendance records exist
- Assignment submissions exist

### Issue: Low R² score (< 0.4)
**Solution**:
- Add more training data
- Try different algorithm (gradient_boosting)
- Adjust hyperparameters
- Check data quality

### Issue: Predictions not cached
**Solution**: Ensure Redis is running:
```bash
docker-compose up -d redis
```

### Issue: Model file not found
**Solution**: Check `ml_models/` directory exists and has write permissions:
```bash
mkdir -p ml_models
chmod 755 ml_models
```

## Best Practices

### 1. Training Data
- Use at least 100 students for training
- Include data from multiple exam cycles
- Ensure data represents different performance levels

### 2. Model Selection
- Start with Random Forest (best for most cases)
- Use Gradient Boosting for slightly better accuracy
- Use Linear Regression for interpretability

### 3. Cross-Validation
- Use 5-10 folds for robust validation
- More folds = better estimate, slower training

### 4. Feature Selection
- Include attendance, assignments, and exam history
- More features generally improve predictions
- Remove highly correlated features

### 5. Prediction Confidence
- Use 95% confidence for standard predictions
- Use 90% for wider acceptable ranges
- Use 99% for critical decisions

### 6. What-If Scenarios
- Test realistic changes (e.g., 5-10% improvement)
- Compare multiple scenarios
- Use recommendations for student guidance

## Next Steps

1. **Train your first model** with institutional data
2. **Make predictions** for current students
3. **Analyze scenarios** to guide interventions
4. **Monitor model performance** over time
5. **Retrain models** quarterly with new data

## Support

For issues or questions:
1. Check the full implementation guide: `ML_PREDICTION_IMPLEMENTATION.md`
2. Review API documentation: `/docs` endpoint
3. Check logs in `logs/` directory
