# Study Planner Implementation Guide

## Overview

The AI-powered Study Planner is a comprehensive system that generates personalized study schedules based on student weak areas, exam dates, and available time. It includes adaptive rescheduling logic, topic prioritization algorithms, and calendar integration.

## Features

### 1. Personalized Study Plan Generation
- **AI-Driven Schedule Creation**: Automatically generates optimized study plans based on:
  - Student weak areas identified from exam performance
  - Target exam dates and deadlines
  - Available study time per day
  - Subject weightage and importance
  
### 2. Weak Area Identification
- **Automatic Detection**: Identifies weak areas from exam marks
- **Scoring System**: Weakness score (0-100) based on performance
- **Multi-Level Tracking**: Subject, chapter, and topic-level weak areas
- **Resolution Tracking**: Monitors when weak areas are resolved

### 3. Topic Prioritization Algorithm
- **Formula**: Priority Score = (Probability × 0.4) + (Weakness × 0.35) + (Weightage × 0.25)
  - **Probability**: Likelihood of topic appearing in exam (0-1)
  - **Weakness**: Student's weakness score (0-100)
  - **Weightage**: Subject importance percentage (0-100)
- **Ranking**: Topics ranked by priority score for optimal study order

### 4. Daily Task Generation
- **Automated Scheduling**: Breaks down study plan into daily tasks
- **Smart Distribution**: Distributes topics across available days
- **Time Management**: Allocates optimal session duration (max 2 hours per session)
- **Priority Mapping**: Maps priority scores to task priorities (Critical/High/Medium/Low)

### 5. Adaptive Rescheduling
- **Dynamic Adjustment**: Automatically reschedules pending tasks
- **Reason Tracking**: Records why tasks were rescheduled
- **Smart Redistribution**: Redistributes tasks across remaining available days
- **Progress Preservation**: Maintains study progress history

### 6. Calendar Integration
- **Multi-Provider Support**: Google Calendar, Outlook, iCal
- **Event Sync**: Syncs study tasks as calendar events
- **Deadline Integration**: Integrates exam dates and submission deadlines
- **Real-time Updates**: Updates calendar when tasks are rescheduled

### 7. Progress Tracking
- **Daily Metrics**: Tracks completion rate, adherence score, productivity
- **Task Completion**: Records actual vs estimated study time
- **Performance Analysis**: Calculates adherence and productivity scores
- **Historical Data**: Maintains progress history for analytics

## API Endpoints

### Study Plans

#### Create Study Plan
```
POST /api/v1/study-planner/plans
Body: {
  "institution_id": 1,
  "student_id": 1,
  "name": "Final Exam Preparation",
  "target_exam_id": 5,
  "start_date": "2024-02-01",
  "end_date": "2024-03-15",
  "hours_per_day": 4.0
}
```

#### Generate AI Study Plan
```
POST /api/v1/study-planner/plans/generate?institution_id=1
Body: {
  "student_id": 1,
  "target_exam_id": 5,
  "start_date": "2024-02-01",
  "end_date": "2024-03-15",
  "hours_per_day": 4.0,
  "include_weekends": true,
  "excluded_dates": ["2024-02-14"]
}
```

#### List Study Plans
```
GET /api/v1/study-planner/plans?institution_id=1&student_id=1&status=ACTIVE
```

#### Update Study Plan
```
PATCH /api/v1/study-planner/plans/{plan_id}?institution_id=1
Body: {
  "status": "COMPLETED",
  "end_date": "2024-03-20"
}
```

### Weak Areas

#### Identify Weak Areas from Exam
```
POST /api/v1/study-planner/weak-areas/identify-from-exam?institution_id=1
Body: {
  "student_id": 1,
  "exam_id": 5,
  "weakness_threshold": 60.0
}
```

#### List Weak Areas
```
GET /api/v1/study-planner/weak-areas?institution_id=1&student_id=1&is_resolved=false
```

#### Update Weak Area
```
PATCH /api/v1/study-planner/weak-areas/{weak_area_id}?institution_id=1
Body: {
  "weakness_score": 30.0,
  "is_resolved": true
}
```

### Topic Prioritization

#### Prioritize Topics
```
POST /api/v1/study-planner/topics/prioritize?institution_id=1
Body: {
  "student_id": 1,
  "exam_id": 5,
  "include_weak_areas_only": true
}
Response: {
  "priorities": [
    {
      "topic_id": 10,
      "topic_name": "Calculus Integration",
      "subject_id": 2,
      "subject_name": "Mathematics",
      "priority_score": 85.5,
      "importance_probability": 0.8,
      "weakness_score": 75.0,
      "subject_weightage": 30.0,
      "recommended_hours": 5.2,
      "rank": 1
    }
  ],
  "total_topics": 15,
  "total_recommended_hours": 45.5
}
```

### Daily Tasks

#### Get Daily Tasks
```
POST /api/v1/study-planner/tasks/daily?institution_id=1
Body: {
  "student_id": 1,
  "study_plan_id": 1,
  "date": "2024-02-01"
}
```

#### Complete Task
```
POST /api/v1/study-planner/tasks/complete?institution_id=1
Body: {
  "task_id": 100,
  "actual_duration_minutes": 90,
  "completion_percentage": 100
}
```

#### Reschedule Task
```
POST /api/v1/study-planner/tasks/reschedule?institution_id=1
Body: {
  "task_id": 100,
  "new_date": "2024-02-03",
  "reason": "Unexpected event"
}
```

#### Adaptive Rescheduling
```
POST /api/v1/study-planner/tasks/adaptive-reschedule?institution_id=1
Body: {
  "study_plan_id": 1,
  "reason": "Fell behind schedule",
  "consider_pending_tasks": true,
  "redistribute_hours": true
}
```

### Progress Tracking

#### Get Study Progress
```
GET /api/v1/study-planner/progress?institution_id=1&study_plan_id=1&start_date=2024-02-01&end_date=2024-02-28
```

### Calendar Sync

#### Sync with Calendar
```
POST /api/v1/study-planner/calendar/sync?institution_id=1
Body: {
  "study_plan_id": 1,
  "calendar_provider": "google",
  "sync_url": "https://calendar.google.com/..."
}
```

## Database Schema

### Tables

1. **study_plans**: Main study plan records
2. **weak_areas**: Student weak areas identified from performance
3. **daily_study_tasks**: Individual daily study tasks
4. **topic_assignments**: Topic-level assignments within study plans
5. **study_progress**: Daily progress tracking records

### Key Relationships

- Study Plan → Student (many-to-one)
- Study Plan → Exam (many-to-one, optional target exam)
- Weak Area → Student, Subject, Chapter, Topic
- Daily Study Task → Study Plan, Student, Subject
- Topic Assignment → Study Plan, Subject, Chapter, Topic
- Study Progress → Study Plan, Student

## Algorithm Details

### Priority Score Calculation

```python
def calculate_priority_score(importance_probability, weakness_score, subject_weightage):
    # Weights
    probability_weight = 0.4
    weakness_weight = 0.35
    weightage_weight = 0.25
    
    # Normalize values
    normalized_probability = importance_probability / 1.0
    normalized_weakness = weakness_score / 100.0
    normalized_weightage = subject_weightage / 100.0
    
    # Calculate priority score
    priority_score = (
        (normalized_probability * probability_weight) +
        (normalized_weakness * weakness_weight) +
        (normalized_weightage * weightage_weight)
    ) * 100
    
    return priority_score
```

### Recommended Hours Calculation

```python
def calculate_recommended_hours(weakness_score, subject_weightage):
    base_hours = 2.0
    
    weakness_multiplier = weakness_score / 100.0
    weightage_multiplier = subject_weightage / 100.0
    
    recommended_hours = base_hours * (
        1.0 + weakness_multiplier + (weightage_multiplier * 0.5)
    )
    
    return min(recommended_hours, 10.0)  # Cap at 10 hours
```

### Task Priority Mapping

- **Critical**: Priority Score >= 80
- **High**: Priority Score >= 60
- **Medium**: Priority Score >= 40
- **Low**: Priority Score < 40

## Usage Example

### Complete Workflow

1. **Student takes an exam**
2. **Marks are entered** by teacher
3. **Identify weak areas** automatically:
   ```python
   POST /weak-areas/identify-from-exam
   {
     "student_id": 1,
     "exam_id": 5,
     "weakness_threshold": 60.0
   }
   ```

4. **Generate study plan**:
   ```python
   POST /plans/generate
   {
     "student_id": 1,
     "target_exam_id": 6,
     "start_date": "2024-02-01",
     "end_date": "2024-03-15",
     "hours_per_day": 4.0
   }
   ```

5. **Student views daily tasks**:
   ```python
   POST /tasks/daily
   {
     "student_id": 1,
     "date": "2024-02-01"
   }
   ```

6. **Complete tasks throughout the day**:
   ```python
   POST /tasks/complete
   {
     "task_id": 100,
     "actual_duration_minutes": 120
   }
   ```

7. **If student falls behind, adaptive reschedule**:
   ```python
   POST /tasks/adaptive-reschedule
   {
     "study_plan_id": 1,
     "reason": "Unexpected events"
   }
   ```

8. **Sync with calendar** for reminders:
   ```python
   POST /calendar/sync
   {
     "study_plan_id": 1,
     "calendar_provider": "google"
   }
   ```

## Best Practices

1. **Regular Weak Area Updates**: Update weak areas after each assessment
2. **Realistic Time Allocation**: Set achievable hours_per_day values
3. **Enable Adaptive Rescheduling**: Keep adaptive_rescheduling_enabled = true
4. **Track Progress Daily**: Complete tasks and update progress regularly
5. **Calendar Integration**: Sync with calendar for better adherence
6. **Review and Adjust**: Periodically review priority scores and adjust

## Performance Considerations

- Weak area identification runs O(n) where n = number of exam subjects
- Topic prioritization sorts by priority score: O(n log n)
- Daily task generation is optimized with batch inserts
- Progress calculation queries are indexed on date ranges
- Calendar sync is asynchronous to avoid blocking

## Future Enhancements

1. Machine learning for better probability predictions
2. Integration with learning analytics
3. Collaborative study groups
4. Gamification of study progress
5. Mobile app notifications
6. AI-powered study recommendations based on learning patterns
7. Integration with online resources and materials
