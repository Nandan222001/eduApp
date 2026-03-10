# Analytics API Quick Start Guide

## Installation

Add ReportLab to your dependencies:
```bash
poetry add reportlab
```

## Database Migration

Run the analytics migration:
```bash
alembic upgrade head
```

## Start Background Workers

Start Celery worker for analytics tasks:
```bash
celery -A src.celery_app worker --loglevel=info
```

Start Celery beat for scheduled tasks:
```bash
celery -A src.celery_app beat --loglevel=info
```

## API Endpoints Overview

### Student Analytics

**Get Student Metrics**
```http
GET /api/v1/analytics/student/{student_id}/metrics?date_range_type=MONTHLY
Authorization: Bearer {token}
```

**Compare Student Performance**
```http
GET /api/v1/analytics/student/{student_id}/comparison?date_range_type=MONTHLY
Authorization: Bearer {token}
```

**Get Student Trends**
```http
GET /api/v1/analytics/student/{student_id}/trends?date_range_type=YEARLY
Authorization: Bearer {token}
```

### Class Analytics

**Get Class Metrics**
```http
GET /api/v1/analytics/class/{section_id}/metrics?date_range_type=MONTHLY
Authorization: Bearer {token}
```

**Bulk Class Metrics**
```http
POST /api/v1/analytics/aggregation/class?date_range_type=MONTHLY
Authorization: Bearer {token}
Content-Type: application/json

[1, 2, 3, 4]
```

### Institution Analytics

**Get Institution Metrics**
```http
GET /api/v1/analytics/institution/metrics?date_range_type=MONTHLY
Authorization: Bearer {token}
```

**Year-over-Year Comparison**
```http
GET /api/v1/analytics/yoy-comparison?date_range_type=YEARLY
Authorization: Bearer {token}
```

### Exam Analytics

**Get Exam Analytics**
```http
GET /api/v1/analytics/exam/{exam_id}/analytics
Authorization: Bearer {token}
```

### Report Generation

**Generate Report**
```http
POST /api/v1/analytics/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "report_type": "STUDENT_PERFORMANCE",
  "report_title": "Monthly Performance Report",
  "report_description": "Student performance for January 2024",
  "parameters": {
    "date_range_type": "MONTHLY",
    "student_ids": [1, 2, 3],
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "format": "pdf",
  "include_charts": true
}
```

**List Reports**
```http
GET /api/v1/analytics/reports?limit=10&offset=0
Authorization: Bearer {token}
```

**Get Report Details**
```http
GET /api/v1/analytics/reports/{report_id}
Authorization: Bearer {token}
```

## Date Range Types

- `DAILY` - Single day
- `WEEKLY` - Current week
- `MONTHLY` - Current month
- `QUARTERLY` - Current quarter
- `YEARLY` - Current year
- `CUSTOM` - Custom range (requires start_date and end_date)

## Report Types

- `STUDENT_PERFORMANCE` - Individual student performance
- `CLASS_PERFORMANCE` - Class/section performance
- `INSTITUTION_PERFORMANCE` - Institution-wide metrics
- `EXAM_ANALYSIS` - Detailed exam analysis
- `YOY_COMPARISON` - Year-over-year comparison
- `ATTENDANCE_SUMMARY` - Attendance summary
- `ASSIGNMENT_SUMMARY` - Assignment summary
- `SUBJECT_ANALYSIS` - Subject-wise analysis

## Response Examples

### Student Metrics Response
```json
{
  "student_id": 123,
  "student_name": "John Doe",
  "total_exams": 5,
  "exams_appeared": 5,
  "exams_passed": 4,
  "average_percentage": 78.5,
  "average_grade_point": 3.2,
  "attendance_percentage": 92.5,
  "total_attendance_days": 40,
  "present_days": 37,
  "total_assignments": 10,
  "assignments_submitted": 9,
  "assignments_graded": 8,
  "average_assignment_score": 85.3,
  "rank_in_class": 5,
  "rank_in_grade": 12,
  "total_gamification_points": 1250,
  "badges_earned": 8,
  "study_streak_days": 15
}
```

### Class Metrics Response
```json
{
  "section_id": 10,
  "section_name": "10-A",
  "grade_name": "Grade 10",
  "total_students": 40,
  "active_students": 38,
  "average_exam_percentage": 75.2,
  "highest_exam_percentage": 95.5,
  "lowest_exam_percentage": 45.0,
  "median_exam_percentage": 76.0,
  "pass_percentage": 87.5,
  "average_attendance_percentage": 88.3,
  "highest_attendance_percentage": 98.5,
  "lowest_attendance_percentage": 65.0,
  "average_assignment_score": 80.5,
  "assignment_submission_rate": 85.0
}
```

### YoY Comparison Response
```json
[
  {
    "metric_name": "Average Percentage",
    "current_year_value": 78.5,
    "previous_year_value": 75.2,
    "change_percentage": 4.39,
    "trend": "improving"
  },
  {
    "metric_name": "Pass Percentage",
    "current_year_value": 92.0,
    "previous_year_value": 88.5,
    "change_percentage": 3.95,
    "trend": "improving"
  }
]
```

### Report Response
```json
{
  "id": 1,
  "institution_id": 1,
  "report_type": "STUDENT_PERFORMANCE",
  "report_title": "Monthly Performance Report",
  "report_description": "Generated on 2024-01-15 10:30:00",
  "status": "COMPLETED",
  "file_url": null,
  "file_size": 245678,
  "error_message": null,
  "started_at": "2024-01-15T10:30:00",
  "completed_at": "2024-01-15T10:30:15",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:15"
}
```

## Common Query Parameters

### Date Range Parameters
- `date_range_type` - Type of date range (DAILY, WEEKLY, MONTHLY, etc.)
- `start_date` - Start date for CUSTOM range (YYYY-MM-DD)
- `end_date` - End date for CUSTOM range (YYYY-MM-DD)

### Pagination Parameters
- `limit` - Number of items per page (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)

### Filter Parameters
- `report_type` - Filter reports by type
- `student_ids` - List of student IDs to include
- `section_ids` - List of section IDs to include
- `grade_ids` - List of grade IDs to include
- `subject_ids` - List of subject IDs to include

## Error Codes

- `404` - Resource not found (student, class, exam, report)
- `500` - Internal server error
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)

## Caching

Analytics data is cached to improve performance:
- Student metrics: 1 hour
- Class metrics: 30 minutes
- Institution metrics: 15 minutes
- Exam analytics: 2 hours

Cache is automatically invalidated on expiration.

## Background Tasks

### Manual Task Triggers

**Trigger Student Metrics Aggregation**
```python
from src.tasks.analytics_tasks import aggregate_student_metrics_task
aggregate_student_metrics_task.delay(institution_id=1, period_days=30)
```

**Trigger Class Metrics Aggregation**
```python
from src.tasks.analytics_tasks import aggregate_class_metrics_task
aggregate_class_metrics_task.delay(institution_id=1, period_days=30)
```

**Trigger Institution Metrics Aggregation**
```python
from src.tasks.analytics_tasks import aggregate_institution_metrics_task
aggregate_institution_metrics_task.delay(institution_id=1, period_days=30)
```

**Clean Expired Cache**
```python
from src.tasks.analytics_tasks import clean_expired_cache_task
clean_expired_cache_task.delay()
```

## Tips and Best Practices

1. **Use Appropriate Date Ranges**: Larger date ranges may take longer to compute
2. **Cache Awareness**: First request may be slower, subsequent requests will be cached
3. **Bulk Operations**: Use aggregation endpoints for multiple entities
4. **Background Processing**: Generate reports asynchronously for large datasets
5. **Monitor Performance**: Keep an eye on cache hit rates and query performance

## Troubleshooting

### Report Generation Fails
- Check Celery worker logs
- Verify report parameters are valid
- Ensure sufficient disk space for PDF files

### Slow Analytics Queries
- Check if cache is working properly
- Review database indexes
- Consider pre-aggregating metrics via scheduled tasks

### Cache Not Working
- Verify Redis connection
- Check cache TTL configuration
- Ensure cache keys are being generated correctly

## Integration Examples

### Python Client
```python
import requests

# Get student metrics
response = requests.get(
    "http://localhost:8000/api/v1/analytics/student/123/metrics",
    headers={"Authorization": f"Bearer {token}"},
    params={"date_range_type": "MONTHLY"}
)
metrics = response.json()
print(f"Average: {metrics['average_percentage']}%")

# Generate report
report_request = {
    "report_type": "STUDENT_PERFORMANCE",
    "report_title": "Performance Report",
    "parameters": {
        "date_range_type": "MONTHLY",
        "student_ids": [123]
    },
    "include_charts": True
}
response = requests.post(
    "http://localhost:8000/api/v1/analytics/reports/generate",
    headers={"Authorization": f"Bearer {token}"},
    json=report_request
)
report = response.json()
print(f"Report ID: {report['id']}, Status: {report['status']}")
```

### JavaScript/TypeScript Client
```typescript
// Get class metrics
const response = await fetch(
  `/api/v1/analytics/class/${sectionId}/metrics?date_range_type=MONTHLY`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const metrics = await response.json();
console.log(`Average: ${metrics.average_exam_percentage}%`);

// Generate report
const reportRequest = {
  report_type: 'CLASS_PERFORMANCE',
  report_title: 'Class Performance Report',
  parameters: {
    date_range_type: 'MONTHLY',
    section_ids: [10, 11, 12]
  },
  include_charts: true
};
const reportResponse = await fetch(
  '/api/v1/analytics/reports/generate',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reportRequest)
  }
);
const report = await reportResponse.json();
console.log(`Report generated: ${report.id}`);
```
