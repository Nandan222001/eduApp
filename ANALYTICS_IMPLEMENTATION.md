# Analytics and Reporting Backend Implementation

## Overview

This document describes the comprehensive analytics and reporting backend system that provides powerful insights into student, class, and institution performance with advanced caching, PDF report generation, and customizable analytics queries.

## Features Implemented

### 1. Aggregation Pipelines

#### Student Metrics Aggregation
- **Exam Performance**: Total exams, pass rate, average percentage, grade points, ranks
- **Attendance Tracking**: Attendance percentage, present/absent days
- **Assignment Metrics**: Submission rate, grading status, average scores
- **Gamification Data**: Points, badges, study streaks

#### Class/Section Metrics Aggregation
- **Performance Statistics**: Average, highest, lowest, median percentages
- **Pass Percentage**: Overall class pass rate
- **Attendance Analytics**: Class-wide attendance trends
- **Assignment Analytics**: Submission rates, average scores

#### Institution Metrics Aggregation
- **Overall Statistics**: Total students, teachers, classes
- **Performance Overview**: Institution-wide averages and pass rates
- **Resource Utilization**: Exams conducted, assignments created
- **Engagement Metrics**: Overall submission and attendance rates

### 2. Performance Comparison Logic

#### Student vs Class Comparison
- Individual student metrics compared to class averages
- Percentile calculations within class and grade
- Identification of strength and weak subjects
- Relative performance indicators

#### Year-over-Year (YoY) Trends
- Compare current year metrics with previous year
- Calculate percentage change for key metrics
- Trend identification (improving, declining, stable)
- Multi-metric historical analysis

### 3. Report Generation Service

#### PDF Report Features
- **Professional Layout**: Using ReportLab for high-quality PDFs
- **Multiple Report Types**:
  - Student Performance Reports
  - Class Performance Reports
  - Institution Performance Reports
  - Exam Analysis Reports
  - Year-over-Year Comparison Reports
  - Attendance Summary Reports
  - Assignment Summary Reports

#### Report Components
- Executive summaries with key metrics
- Detailed data tables with styling
- Visual charts and graphs (bar charts, line charts, pie charts)
- Comparative analysis sections
- Trend visualizations

### 4. Caching Strategy

#### Multi-Level Caching
1. **Redis Cache**: Fast in-memory caching for frequently accessed data
2. **Database Cache Table**: Long-term cache storage with expiration
3. **Cache Key Generation**: MD5 hashing for unique identification

#### Cache TTL Configuration
- Student metrics: 3600 seconds (1 hour)
- Class metrics: 1800 seconds (30 minutes)
- Institution metrics: 900 seconds (15 minutes)
- Exam analytics: 7200 seconds (2 hours)

#### Cache Management
- Automatic expiration handling
- Cache invalidation on data updates
- Scheduled cleanup tasks via Celery

### 5. Analytics API Endpoints

#### Core Endpoints

**Student Metrics**
```
GET /api/v1/analytics/student/{student_id}/metrics
- Query params: date_range_type, start_date, end_date
- Returns: Comprehensive student performance metrics
```

**Class Metrics**
```
GET /api/v1/analytics/class/{section_id}/metrics
- Query params: date_range_type, start_date, end_date
- Returns: Class-wide performance statistics
```

**Institution Metrics**
```
GET /api/v1/analytics/institution/metrics
- Query params: date_range_type, start_date, end_date
- Returns: Institution-wide performance overview
```

**Exam Analytics**
```
GET /api/v1/analytics/exam/{exam_id}/analytics
- Returns: Detailed exam analysis with subject breakdowns
```

**YoY Comparison**
```
GET /api/v1/analytics/yoy-comparison
- Query params: date_range_type, start_date, end_date
- Returns: Year-over-year performance comparison
```

**Student Performance Comparison**
```
GET /api/v1/analytics/student/{student_id}/comparison
- Query params: date_range_type, start_date, end_date
- Returns: Student performance vs class/grade averages
```

**Performance Trends**
```
GET /api/v1/analytics/student/{student_id}/trends
- Query params: date_range_type, start_date, end_date
- Returns: Time-series performance data
```

**Report Generation**
```
POST /api/v1/analytics/reports/generate
- Body: ReportGenerationRequest
- Returns: Report metadata with generation status
```

**List Reports**
```
GET /api/v1/analytics/reports
- Query params: report_type, limit, offset
- Returns: List of generated reports
```

**Get Report**
```
GET /api/v1/analytics/reports/{report_id}
- Returns: Specific report details and download link
```

**Bulk Aggregations**
```
POST /api/v1/analytics/aggregation/student
- Body: List of student IDs
- Returns: Aggregated metrics for multiple students

POST /api/v1/analytics/aggregation/class
- Body: List of section IDs
- Returns: Aggregated metrics for multiple classes
```

### 6. Customizable Date Ranges and Grouping

#### Date Range Types
- **DAILY**: Single day analysis
- **WEEKLY**: Week-long analysis
- **MONTHLY**: Month-long analysis
- **QUARTERLY**: Quarter analysis
- **YEARLY**: Annual analysis
- **CUSTOM**: User-defined date range

#### Grouping Options
- By student
- By class/section
- By subject
- By grade
- By exam
- By month

#### Metric Types
- Exam performance
- Attendance
- Assignment
- Overall (combined metrics)

## Database Schema

### Analytics Models

#### AnalyticsCache
- Stores cached analytics data
- Supports expiration and cleanup
- Indexed for fast retrieval

#### StudentPerformanceMetrics
- Pre-aggregated student metrics
- Time-series data support
- Comprehensive performance tracking

#### ClassPerformanceMetrics
- Pre-aggregated class statistics
- Comparative analysis data
- Trend tracking

#### InstitutionPerformanceMetrics
- Institution-wide statistics
- High-level overview metrics
- Historical data storage

#### GeneratedReport
- Report metadata and status
- File storage information
- Generation tracking

## Background Tasks

### Celery Tasks

#### Analytics Aggregation Tasks
1. **aggregate_student_metrics_task**: Daily student metrics calculation
2. **aggregate_class_metrics_task**: Daily class metrics calculation
3. **aggregate_institution_metrics_task**: Daily institution metrics calculation
4. **clean_expired_cache_task**: Hourly cache cleanup
5. **daily_aggregation_task**: Master task for daily aggregation

### Scheduled Tasks (Celery Beat)
- **Daily Analytics Aggregation**: Runs once per day (86400 seconds)
- **Cache Cleanup**: Runs every hour (3600 seconds)

## Usage Examples

### Get Student Metrics for Last Month
```python
GET /api/v1/analytics/student/123/metrics?date_range_type=MONTHLY
```

### Generate Student Performance Report
```python
POST /api/v1/analytics/reports/generate
{
  "report_type": "STUDENT_PERFORMANCE",
  "report_title": "Monthly Student Report",
  "parameters": {
    "date_range_type": "MONTHLY",
    "student_ids": [123, 124, 125]
  },
  "include_charts": true
}
```

### Get Year-over-Year Comparison
```python
GET /api/v1/analytics/yoy-comparison?date_range_type=YEARLY
```

### Bulk Student Metrics
```python
POST /api/v1/analytics/aggregation/student?date_range_type=MONTHLY
[123, 124, 125, 126]
```

## Performance Optimization

### Caching Strategy
1. **First Request**: Compute metrics and cache result
2. **Subsequent Requests**: Return cached data if not expired
3. **Cache Invalidation**: Automatic on TTL expiration or manual on data updates
4. **Background Updates**: Pre-compute metrics via scheduled tasks

### Database Indexing
- Comprehensive indexes on all analytics tables
- Composite indexes for common query patterns
- Foreign key indexes for joins

### Query Optimization
- Efficient aggregation queries using SQLAlchemy
- Batch processing for multiple entities
- Pre-aggregated metrics tables for fast retrieval

## Error Handling

### API Error Responses
- 404: Resource not found (student, class, exam)
- 500: Server error with detailed message
- Validation errors for invalid parameters

### Background Task Error Handling
- Individual task failure doesn't affect others
- Error logging and tracking
- Retry mechanisms for transient failures

## Security Considerations

- Authentication required for all endpoints
- Institution-level data isolation
- User permission checks
- Secure file storage for generated reports

## File Storage

### Report Files
- Stored in `/reports/{institution_id}/` directory
- Filename format: `report_{report_id}_{timestamp}.pdf`
- Automatic directory creation
- Optional S3 integration support

## Future Enhancements

1. **Advanced Visualizations**: Interactive charts in reports
2. **Custom Report Templates**: User-defined report layouts
3. **Email Delivery**: Automatic report distribution
4. **Real-time Analytics**: WebSocket-based live updates
5. **Predictive Analytics**: ML-based performance predictions
6. **Excel Export**: Additional export format support
7. **Scheduled Reports**: Automatic periodic report generation
8. **Benchmark Comparisons**: Compare with similar institutions

## Configuration

### Dependencies Added
```toml
reportlab = "^4.0.0"  # PDF generation
```

### Environment Variables
All existing configuration from `.env` applies. No additional environment variables required.

## Testing Recommendations

1. **Unit Tests**: Test individual metric calculations
2. **Integration Tests**: Test API endpoints with sample data
3. **Performance Tests**: Load testing for analytics queries
4. **Report Tests**: Validate PDF generation and content
5. **Cache Tests**: Verify caching behavior and expiration

## Maintenance

### Regular Tasks
1. Monitor cache hit rates
2. Review and optimize slow queries
3. Clean up old report files
4. Monitor background task execution
5. Update indexes based on query patterns

### Monitoring
- Track API response times
- Monitor cache effectiveness
- Watch background task success rates
- Alert on report generation failures
