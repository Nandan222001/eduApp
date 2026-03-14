# Institution Health Monitoring System

## Overview

The Institution Health Monitoring System is an AI-powered solution that provides comprehensive health scoring, predictive churn detection, and automated alerting for institutions on the platform.

## Features

### 1. Multi-Dimensional Health Scoring

The system calculates health scores across five key dimensions:

- **Payment Health Score (30% weight)**: Analyzes subscription status, payment history, failed payments, grace period status
- **User Activity Score (25% weight)**: Measures daily/weekly/monthly active users, engagement patterns, login frequency
- **Support Ticket Score (15% weight)**: Evaluates doubt post volume, resolution rates, urgent ticket handling
- **Feature Adoption Score (20% weight)**: Tracks usage of core platform features (assignments, attendance, doubts, etc.)
- **Data Quality Score (10% weight)**: Assesses completeness of institution and user profiles

### 2. AI-Powered Churn Prediction

- **Machine Learning Model**: Uses Gradient Boosting Classifier to predict churn probability
- **Features**: Analyzes 10+ features including subscription metrics, payment history, user engagement
- **Risk Levels**: Categorizes institutions as Critical, High, Medium, or Low risk
- **Key Factors**: Identifies top factors contributing to churn risk
- **Model Performance Tracking**: Monitors accuracy, precision, recall, and F1 score

### 3. Automated Alert System

Automatically generates alerts for:
- Critical health scores (< 40)
- Payment failures and subscription issues
- Low user engagement (< 25% activity score)
- High churn risk (> 70% probability)

### 4. Health Score Dashboard

The super admin dashboard provides:
- Institution health scores overview
- Risk level distribution
- Active alerts summary
- Detailed institution health reports
- Historical trend analysis
- Recommended interventions

## API Endpoints

### Dashboard & Overview

```
GET /api/v1/institution-health/dashboard
```
Get health scores for all institutions with optional filtering.

Query Parameters:
- `risk_level`: Filter by risk level (critical, high, medium, low)
- `min_churn_prob`: Filter by minimum churn probability
- `sort_by`: Sort field (churn_risk_score, overall_health_score, last_calculated_at)

### Institution Details

```
GET /api/v1/institution-health/institutions/{institution_id}
```
Get detailed health information including:
- Health score breakdown
- Active alerts
- Historical trends
- Metrics data
- Risk factors
- Recommended actions

### Calculate Health Scores

```
POST /api/v1/institution-health/institutions/{institution_id}/calculate
```
Manually trigger health score calculation for a specific institution.

```
POST /api/v1/institution-health/calculate-all
```
Calculate health scores for all active institutions.

### Alerts Management

```
GET /api/v1/institution-health/alerts
```
Get all health alerts with filtering options.

```
PUT /api/v1/institution-health/alerts/{alert_id}/resolve
```
Resolve a health alert.

```
POST /api/v1/institution-health/alerts
```
Manually create a health alert.

### Churn Predictions

```
GET /api/v1/institution-health/churn-predictions
```
Get churn predictions for at-risk institutions.

Query Parameters:
- `min_probability`: Minimum churn probability threshold (default: 0.5)
- `limit`: Maximum number of results (default: 50)

### Trend Analysis

```
GET /api/v1/institution-health/trends/{institution_id}
```
Get health trend analysis including:
- Trend direction (improving, declining, stable)
- Score changes over 7, 30, 90 days
- Predicted score for next 30 days

### ML Model Management

```
POST /api/v1/institution-health/ml-model/train
```
Train or retrain the churn prediction model.

Request Body:
```json
{
  "validation_split": 0.2,
  "hyperparameters": {
    "n_estimators": 100,
    "learning_rate": 0.1,
    "max_depth": 5
  }
}
```

```
GET /api/v1/institution-health/ml-model/performance
```
Get performance metrics of the active ML model.

## Frontend Component

### InstitutionHealthMonitor.tsx

Location: `frontend/src/pages/SuperAdmin/InstitutionHealthMonitor.tsx`

Features:
- Real-time health score visualization
- Risk level distribution cards
- Filterable institution table
- Detailed health breakdown modal
- Interactive charts (Radar, Line, Bar)
- Alert management
- Risk factor identification
- Recommended actions display
- Historical trend visualization

## Health Score Calculation

### Overall Score Formula

```
overall_score = (
    payment_score * 0.30 +
    activity_score * 0.25 +
    support_score * 0.15 +
    adoption_score * 0.20 +
    quality_score * 0.10
)
```

### Risk Level Classification

- **Critical**: Churn probability > 70%
- **High**: Churn probability 50-70%
- **Medium**: Churn probability 30-50%
- **Low**: Churn probability < 30%

## Recommended Actions

The system automatically generates intervention recommendations based on identified risk factors:

### Payment Issues
- Contact institution about payment challenges
- Offer flexible payment options
- Priority: Urgent

### Low Engagement
- Schedule engagement campaign
- Launch targeted communication
- Priority: High

### High Support Volume
- Provide dedicated support escalation
- Resolve pending doubts
- Priority: High

### Low Feature Adoption
- Conduct feature training sessions
- Schedule demonstration webinars
- Priority: Medium

### Poor Data Quality
- Guide data cleanup initiative
- Complete user profiles
- Priority: Medium

## Database Schema

### institution_health_scores
Stores current health scores for each institution.

### institution_health_alerts
Tracks active and resolved alerts.

### institution_health_history
Maintains historical health scores for trend analysis.

### churn_prediction_models
Stores ML model versions and performance metrics.

## Usage Example

### Calculate Health Scores for All Institutions

```bash
curl -X POST http://localhost:8000/api/v1/institution-health/calculate-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get High-Risk Institutions

```bash
curl -X GET "http://localhost:8000/api/v1/institution-health/dashboard?risk_level=critical" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Train New ML Model

```bash
curl -X POST http://localhost:8000/api/v1/institution-health/ml-model/train \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "validation_split": 0.2,
    "hyperparameters": {
      "n_estimators": 150,
      "learning_rate": 0.05,
      "max_depth": 6
    }
  }'
```

## Automated Monitoring

### Scheduled Tasks (Recommended)

Set up Celery tasks to:
1. Calculate health scores daily (e.g., 2 AM)
2. Send alert notifications for critical issues
3. Retrain ML model weekly/monthly based on new data

Example Celery task:

```python
@celery_app.task
def calculate_all_health_scores():
    db = SessionLocal()
    service = InstitutionHealthService(db)
    
    institutions = db.query(Institution).filter(
        Institution.is_active == True
    ).all()
    
    for institution in institutions:
        service.calculate_health_score(institution.id)
    
    db.close()
```

## Best Practices

1. **Regular Calculations**: Run health score calculations daily to maintain up-to-date metrics
2. **Model Retraining**: Retrain the ML model monthly as new churn patterns emerge
3. **Alert Response**: Review and act on critical alerts within 24 hours
4. **Trend Monitoring**: Check historical trends weekly to identify deteriorating institutions early
5. **Intervention Tracking**: Document all interventions and their outcomes to improve recommendations

## Limitations

- ML model requires minimum 10 institutions to train
- Churn prediction accuracy depends on data quality and volume
- Rule-based fallback used when ML model unavailable
- Historical trends require at least 7 days of data

## Future Enhancements

- Real-time streaming health scores
- Automated intervention workflows
- A/B testing for intervention strategies
- Integration with CRM systems
- Mobile app notifications
- Predictive health score forecasting (90+ days)
- Custom health score weights per subscription tier
