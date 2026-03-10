# Study Planner - Quick Start Guide

## Setup

### 1. Run Database Migration
```bash
alembic upgrade head
```

This creates the following tables:
- `study_plans`
- `weak_areas`
- `daily_study_tasks`
- `topic_assignments`
- `study_progress`

### 2. Verify API Endpoints
The Study Planner API is automatically registered at `/api/v1/study-planner/*`

## Quick Usage Guide

### Step 1: Identify Weak Areas

After a student completes an exam, identify their weak areas:

```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/weak-areas/identify-from-exam?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "exam_id": 5,
    "weakness_threshold": 60.0
  }'
```

### Step 2: Generate AI Study Plan

Create a personalized study plan:

```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/plans/generate?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "target_exam_id": 6,
    "target_exam_date": "2024-03-15",
    "start_date": "2024-02-01",
    "end_date": "2024-03-15",
    "hours_per_day": 4.0,
    "include_weekends": true,
    "preferred_start_time": "14:00:00"
  }'
```

Response includes:
- Study plan details
- Topic assignments with priority scores
- Daily tasks for each day
- Summary statistics

### Step 3: View Daily Tasks

Get tasks for a specific day:

```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/tasks/daily?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "study_plan_id": 1,
    "date": "2024-02-01"
  }'
```

### Step 4: Complete a Task

Mark a task as completed:

```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/tasks/complete?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 100,
    "actual_duration_minutes": 120,
    "completion_percentage": 100,
    "notes": "Completed all practice problems"
  }'
```

### Step 5: Adaptive Rescheduling

If student falls behind, use adaptive rescheduling:

```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/tasks/adaptive-reschedule?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "study_plan_id": 1,
    "reason": "Fell behind due to illness",
    "consider_pending_tasks": true,
    "redistribute_hours": true
  }'
```

### Step 6: Sync with Calendar

Integrate with external calendar:

```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/calendar/sync?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "study_plan_id": 1,
    "calendar_provider": "google",
    "sync_url": "https://calendar.google.com/..."
  }'
```

### Step 7: Track Progress

View study progress over time:

```bash
curl -X GET "http://localhost:8000/api/v1/study-planner/progress?institution_id=1&study_plan_id=1&start_date=2024-02-01&end_date=2024-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Concepts

### Priority Score Formula
```
Priority Score = (Probability × 0.4) + (Weakness × 0.35) + (Weightage × 0.25)
```

- **Probability** (0-1): Likelihood of topic appearing in exam
- **Weakness** (0-100): Student's weakness in that topic
- **Weightage** (0-100): Subject importance percentage

### Task Statuses
- **PENDING**: Not started
- **IN_PROGRESS**: Currently working on
- **COMPLETED**: Finished
- **SKIPPED**: Intentionally skipped
- **RESCHEDULED**: Moved to another date

### Task Priorities
- **CRITICAL**: Priority Score >= 80
- **HIGH**: Priority Score >= 60
- **MEDIUM**: Priority Score >= 40
- **LOW**: Priority Score < 40

## Common Operations

### List All Study Plans for a Student
```bash
curl -X GET "http://localhost:8000/api/v1/study-planner/plans?institution_id=1&student_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Topic Priorities
```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/topics/prioritize?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "exam_id": 6,
    "include_weak_areas_only": true
  }'
```

### Reschedule Single Task
```bash
curl -X POST "http://localhost:8000/api/v1/study-planner/tasks/reschedule?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 100,
    "new_date": "2024-02-05",
    "reason": "Conflicting appointment"
  }'
```

### List Weak Areas
```bash
curl -X GET "http://localhost:8000/api/v1/study-planner/weak-areas?institution_id=1&student_id=1&is_resolved=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Weak Area
```bash
curl -X PATCH "http://localhost:8000/api/v1/study-planner/weak-areas/1?institution_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weakness_score": 35.0,
    "notes": "Improved after practice"
  }'
```

## Tips for Best Results

1. **Regular Updates**: Identify weak areas after every exam
2. **Realistic Goals**: Set achievable daily study hours
3. **Consistent Completion**: Mark tasks complete daily
4. **Use Adaptive Rescheduling**: Don't let pending tasks accumulate
5. **Enable Calendar Sync**: Get automatic reminders
6. **Review Progress**: Check progress metrics weekly

## Troubleshooting

### No Weak Areas Detected
- Check that exam marks are entered
- Lower the `weakness_threshold` parameter
- Verify subject weightages are set

### Study Plan Not Generating
- Ensure weak areas exist for the student
- Check date range is valid (start < end)
- Verify target exam exists and has subjects

### Tasks Not Created
- Check that topic assignments were created
- Verify available days calculation
- Ensure hours_per_day > 0

### Calendar Sync Failing
- Verify calendar provider is supported
- Check sync URL is valid
- Ensure calendar_sync_enabled is true

## Integration with Existing Features

### With Examinations
- Weak areas auto-identified from exam marks
- Target exam dates drive schedule generation
- Subject weightages from exam_subjects table

### With Gamification
- Task completion earns points
- Study streaks tracked
- Achievements for consistency

### With Notifications
- Daily task reminders
- Deadline approaching alerts
- Progress milestone notifications

## Next Steps

1. Explore the full API documentation
2. Integrate with your frontend application
3. Set up automated weak area identification
4. Configure calendar sync for your institution
5. Customize priority score weights if needed

For detailed API reference, see `STUDY_PLANNER_IMPLEMENTATION.md`
