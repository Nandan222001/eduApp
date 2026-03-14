# Student Wellbeing Monitoring System

## Overview

The Student Wellbeing Monitoring System is a comprehensive mental health and behavioral monitoring platform designed to detect early warning signs of student distress and enable proactive intervention by school counselors and mental health professionals.

## Features

### 1. Sentiment Analysis on Student Communications

The system performs Natural Language Processing (NLP) sentiment analysis on:
- Assignment submissions (text content)
- Forum/discussion posts
- Chat messages in study groups
- Direct messages

**Key Capabilities:**
- Detects distress signals using keyword matching and ML sentiment analysis
- Identifies crisis indicators (suicide, self-harm references)
- Tracks sentiment trends over time
- Flags concerning communications for counselor review
- Confidence scoring for each analysis

**Distress Detection:**
- Depression and anxiety indicators
- Isolation and helplessness language
- Crisis keywords (immediate escalation)
- Negative sentiment patterns

### 2. Behavioral Pattern Detection

Automated analysis of behavioral changes across multiple dimensions:

**Attendance Patterns:**
- Tracks attendance rate changes
- Compares current period vs. baseline
- Flags significant drops (>20% decline)

**Grade Performance:**
- Monitors assignment grades
- Detects declining performance trends
- Alerts on >15% grade drops

**Participation Monitoring:**
- Tracks forum/chat activity
- Monitors assignment submission rates
- Flags reduced engagement (>30% decline)

**Social Isolation Detection:**
- Monitors study group participation
- Tracks peer interaction frequency
- Detects withdrawal from social activities

### 3. Wellbeing Alerts System

**Alert Types:**
- `sentiment_distress`: Negative sentiment detected
- `attendance_drop`: Significant attendance decline
- `grade_decline`: Performance deterioration
- `participation_drop`: Reduced engagement
- `social_isolation`: Social withdrawal
- `behavioral_change`: General concerning changes
- `multiple_indicators`: Multiple risk factors

**Severity Levels:**
- `LOW`: Minor concerns, general monitoring
- `MEDIUM`: Notable changes requiring attention
- `HIGH`: Significant concerns, prompt intervention needed
- `CRITICAL`: Immediate crisis response required

**Alert Status Workflow:**
- `PENDING`: Newly detected, awaiting review
- `ACKNOWLEDGED`: Counselor notified
- `IN_PROGRESS`: Active intervention underway
- `RESOLVED`: Issue addressed successfully
- `DISMISSED`: False positive or resolved naturally

### 4. Counselor Dashboard

Comprehensive dashboard for mental health professionals:

**Dashboard Statistics:**
- Total students monitored
- Active alerts count
- Critical alerts requiring immediate attention
- High/medium risk student counts
- Pending interventions
- Overdue reviews

**Student Risk Prioritization:**
- Risk levels: Low, Medium, High, Critical
- Overall risk scoring (0.0 - 1.0)
- Trend indicators for each dimension
- Latest alert information
- Assigned counselor tracking

**Alert Management:**
- View all active alerts
- Filter by severity, status, student
- Assign counselors to cases
- Add confidential notes
- Track resolution progress

### 5. Integration with Mental Health Professionals

**Counselor Profiles:**
- License and qualification tracking
- Specialization areas
- Case load management (max capacity)
- Crisis handling capability
- Availability scheduling
- Contact information

**Intervention Tracking:**
- Document interventions taken
- Schedule follow-ups
- Record outcomes
- Track student progress
- Generate intervention reports

**Collaboration Features:**
- Multi-counselor support
- Case handoff capabilities
- Confidential note sharing
- Escalation pathways

### 6. FERPA/GDPR Compliance

**Parental Consent Management:**
- Explicit consent required for monitoring
- Parent and student consent tracking
- Consent status: Pending, Granted, Denied, Revoked
- Expiration date management
- Data access level controls

**Data Access Levels:**
- `NONE`: No monitoring permitted
- `BASIC`: General wellbeing monitoring
- `FULL`: Complete data access
- `EMERGENCY_ONLY`: Crisis situations only

**Privacy Controls:**
- Comprehensive audit logging
- Access purpose tracking
- IP address and user agent logging
- Data access restrictions
- Consent revocation support

**Data Retention:**
- Configurable retention periods
- Automatic data purging
- Export capabilities for compliance
- Right to be forgotten support

## Architecture

### Models

1. **WellbeingAlert**: Core alert system
2. **AlertNote**: Confidential counselor notes
3. **WellbeingIntervention**: Intervention tracking
4. **SentimentAnalysis**: NLP analysis results
5. **BehavioralPattern**: Behavioral change detection
6. **WellbeingConsent**: Consent management
7. **WellbeingDataAccess**: Audit logging
8. **CounselorProfile**: Counselor information
9. **StudentWellbeingProfile**: Student risk profiles

### Services

**WellbeingService** (`src/services/wellbeing_service.py`):
- Sentiment analysis engine
- Behavioral pattern detection
- Alert creation and management
- Risk scoring algorithms
- Consent verification
- Data access logging
- Dashboard data aggregation

### API Endpoints

```
POST   /api/v1/wellbeing/sentiment-analysis      - Analyze sentiment
POST   /api/v1/wellbeing/behavioral-analysis     - Analyze behavioral patterns
GET    /api/v1/wellbeing/alerts                   - List alerts
GET    /api/v1/wellbeing/alerts/{id}              - Get alert details
POST   /api/v1/wellbeing/alerts                   - Create alert
PATCH  /api/v1/wellbeing/alerts/{id}              - Update alert
POST   /api/v1/wellbeing/alerts/{id}/notes        - Add note to alert
GET    /api/v1/wellbeing/alerts/{id}/notes        - Get alert notes
POST   /api/v1/wellbeing/interventions            - Create intervention
PATCH  /api/v1/wellbeing/interventions/{id}       - Update intervention
GET    /api/v1/wellbeing/interventions            - List interventions
POST   /api/v1/wellbeing/consents                 - Create consent
PATCH  /api/v1/wellbeing/consents/{id}            - Update consent
GET    /api/v1/wellbeing/consents/student/{id}    - Get student consents
POST   /api/v1/wellbeing/counselors               - Create counselor profile
PATCH  /api/v1/wellbeing/counselors/{id}          - Update counselor
GET    /api/v1/wellbeing/counselors               - List counselors
GET    /api/v1/wellbeing/dashboard/counselor      - Counselor dashboard
GET    /api/v1/wellbeing/students/{id}/profile    - Student wellbeing profile
GET    /api/v1/wellbeing/students/{id}/sentiments - Student sentiment history
GET    /api/v1/wellbeing/students/{id}/patterns   - Student behavioral patterns
```

### Background Tasks

**Automated Monitoring** (`src/tasks/wellbeing_monitoring_task.py`):

1. `monitor_student_wellbeing`: Daily sentiment analysis on new communications
2. `analyze_behavioral_patterns_batch`: Weekly behavioral pattern analysis
3. `update_wellbeing_profiles`: Daily risk score updates
4. `notify_overdue_reviews`: Alert counselors about overdue reviews

## Usage

### 1. Setup Counselor Profile

```python
POST /api/v1/wellbeing/counselors
{
    "institution_id": 1,
    "user_id": 123,
    "license_number": "LPC-12345",
    "specializations": ["anxiety", "depression", "trauma"],
    "max_case_load": 50,
    "can_handle_crisis": true,
    "contact_email": "counselor@school.edu"
}
```

### 2. Obtain Parent Consent

```python
POST /api/v1/wellbeing/consents
{
    "institution_id": 1,
    "student_id": 456,
    "parent_id": 789,
    "consent_type": "wellbeing_monitoring",
    "data_access_level": "full",
    "granted_by_parent": true,
    "granted_by_student": true,
    "expires_at": "2025-06-30T00:00:00Z"
}
```

### 3. Analyze Student Communication

```python
POST /api/v1/wellbeing/sentiment-analysis
{
    "content": "I feel so overwhelmed and don't know what to do anymore...",
    "source_type": "assignment_submission",
    "source_id": 1234,
    "student_id": 456
}
```

### 4. Run Behavioral Analysis

```python
POST /api/v1/wellbeing/behavioral-analysis
{
    "student_id": 456,
    "analysis_period_days": 30
}
```

### 5. Access Counselor Dashboard

```python
GET /api/v1/wellbeing/dashboard/counselor?institution_id=1&counselor_id=123
```

### 6. Manage Alerts

```python
# Acknowledge an alert
PATCH /api/v1/wellbeing/alerts/789
{
    "status": "acknowledged",
    "assigned_counselor_id": 123
}

# Add confidential note
POST /api/v1/wellbeing/alerts/789/notes
{
    "content": "Scheduled meeting with student for tomorrow at 2pm",
    "is_confidential": true
}

# Resolve alert
PATCH /api/v1/wellbeing/alerts/789
{
    "status": "resolved",
    "resolution_notes": "Student connected with resources, will continue monitoring"
}
```

### 7. Create Intervention

```python
POST /api/v1/wellbeing/interventions
{
    "alert_id": 789,
    "institution_id": 1,
    "student_id": 456,
    "counselor_id": 123,
    "intervention_type": "individual_counseling",
    "description": "Weekly counseling sessions",
    "action_taken": "Scheduled 4 weekly sessions, provided coping strategies",
    "scheduled_at": "2024-01-20T14:00:00Z",
    "follow_up_required": true,
    "follow_up_date": "2024-02-15T14:00:00Z"
}
```

## Risk Scoring Algorithm

The system calculates an overall risk score (0.0 - 1.0) based on multiple factors:

```
Risk Score = min(sum of risk factors, 1.0)

Risk Factors:
- Sentiment trend < -0.5: +0.30
- Attendance decline > 20%: +0.25
- Grade decline > 15%: +0.20
- Participation decline > 30%: +0.15
- Social isolation > 50%: +0.10
```

**Risk Levels:**
- **Low**: 0.0 - 0.29
- **Medium**: 0.30 - 0.49
- **High**: 0.50 - 0.69
- **Critical**: 0.70 - 1.0

## Recommended Actions by Severity

### Critical Alerts
1. IMMEDIATE: Contact student and ensure safety
2. IMMEDIATE: Notify school counselor and administrator
3. IMMEDIATE: Contact parent/guardian
4. Consider emergency mental health services
5. Document all communications

### High Severity
1. Contact student within 24 hours
2. Schedule meeting with school counselor
3. Notify parent/guardian if consent allows
4. Monitor communications closely
5. Provide mental health resources

### Medium Severity
1. Monitor student communications
2. Consider informal check-in
3. Track sentiment trends
4. Provide general wellness resources

### Low Severity
1. Continue routine monitoring
2. Track trends over time
3. Ensure resources are accessible

## Best Practices

1. **Regular Review Cycles**: Weekly review of high-risk students, monthly for medium risk
2. **Multi-Factor Analysis**: Don't rely on single indicators
3. **Context Awareness**: Consider external factors (exams, holidays, etc.)
4. **Privacy First**: Only access data when necessary with documented purpose
5. **Timely Intervention**: Act quickly on critical alerts
6. **Follow-up**: Track intervention outcomes and adjust approach
7. **Parent Communication**: Keep parents informed per consent levels
8. **Professional Boundaries**: Refer to licensed professionals when needed

## Security & Privacy

- All wellbeing data is encrypted at rest
- Access requires explicit consent
- Complete audit trail of all data access
- Role-based access control (counselors only)
- Automatic consent expiration checks
- Data retention policies enforced
- FERPA and GDPR compliant
- Regular security audits

## Integration Points

The system integrates with:
- Assignment submission system
- Study group messaging
- Forum/discussion platforms
- Attendance tracking
- Grade management
- Notification system
- Parent portal

## Deployment

### Database Migration

```bash
alembic upgrade head
```

### Scheduled Tasks

Configure Celery beat schedule:

```python
# Daily monitoring
celery beat schedule add monitor-wellbeing \
    --task monitor_student_wellbeing \
    --args "[1]" \
    --schedule "0 2 * * *"  # 2 AM daily

# Weekly behavioral analysis
celery beat schedule add behavioral-analysis \
    --task analyze_behavioral_patterns_batch \
    --args "[1]" \
    --schedule "0 3 * * 0"  # 3 AM Sundays

# Daily profile updates
celery beat schedule add update-profiles \
    --task update_wellbeing_profiles \
    --args "[1]" \
    --schedule "0 4 * * *"  # 4 AM daily

# Overdue review notifications
celery beat schedule add notify-overdue \
    --task notify_overdue_reviews \
    --args "[1]" \
    --schedule "0 8 * * *"  # 8 AM daily
```

## Dependencies

- `transformers`: NLP sentiment analysis
- `torch`: ML model inference
- `sqlalchemy`: Database ORM
- `fastapi`: REST API framework
- `celery`: Background task processing

## Limitations & Considerations

1. **NLP Accuracy**: Sentiment analysis is not 100% accurate, human review required
2. **Cultural Context**: Keywords may not work across all languages/cultures
3. **Privacy Balance**: Monitoring vs. student privacy must be carefully balanced
4. **False Positives**: Some alerts may be false positives requiring counselor judgment
5. **Not a Substitute**: This system supports, but doesn't replace, human counselors
6. **Resource Intensive**: Real-time analysis requires computational resources

## Support & Resources

For students in crisis:
- National Suicide Prevention Lifeline: 1-800-273-8255
- Crisis Text Line: Text "HELLO" to 741741
- Emergency: 911

## License

This system handles sensitive student mental health data and must be deployed in accordance with:
- Family Educational Rights and Privacy Act (FERPA)
- General Data Protection Regulation (GDPR)
- Children's Online Privacy Protection Act (COPPA)
- Local education privacy regulations

Ensure legal review before deployment.
