# Goal Setting and Gamification System

## Overview

This module provides a comprehensive goal setting and tracking system with gamification features including points, badges, leaderboards, and analytics.

## Features

### Goal Management
- **SMART Framework Support**: Goals can be defined with Specific, Measurable, Achievable, Relevant, and Time-bound criteria
- **Goal Types**: Attendance, Assignment, Exam, Grade, Subject, and Custom goals
- **Milestone Tracking**: Break down goals into smaller milestones with individual progress tracking
- **Automatic Progress Calculation**: System automatically calculates progress based on performance data
- **Status Management**: Goals can be Draft, Active, Paused, Completed, Failed, or Cancelled
- **Goal Templates**: Reusable templates for common goals

### Gamification
- **Points System**: Users earn points for various activities
- **Levels**: Automatic level calculation based on total points
- **Badges**: Create and award badges with different rarities (Common, Rare, Epic, Legendary)
- **Streaks**: Track daily login and activity streaks
- **Leaderboards**: Institution-wide leaderboards with ranking

### Analytics
- **Goal Analytics**: Track completion rates, average progress, and trends
- **Progress Logs**: Detailed history of goal progress changes
- **Performance Reports**: Comprehensive reports with projections and milestone tracking

## API Endpoints

### Gamification Endpoints

#### Badges
- `POST /api/v1/gamification/badges` - Create a badge
- `GET /api/v1/gamification/badges` - List all badges
- `GET /api/v1/gamification/badges/{badge_id}` - Get badge details
- `PUT /api/v1/gamification/badges/{badge_id}` - Update badge
- `POST /api/v1/gamification/badges/award` - Award badge to user

#### Points
- `GET /api/v1/gamification/users/{user_id}/points` - Get user points
- `POST /api/v1/gamification/points/add` - Add points to user
- `GET /api/v1/gamification/users/{user_id}/point-history` - Get point history

#### Leaderboard
- `GET /api/v1/gamification/leaderboard` - Get leaderboard
- `GET /api/v1/gamification/users/{user_id}/stats` - Get user gamification stats

### Goal Endpoints

#### Goal Templates
- `POST /api/v1/goals/templates` - Create goal template
- `GET /api/v1/goals/templates` - List goal templates
- `PUT /api/v1/goals/templates/{template_id}` - Update goal template

#### Goals
- `POST /api/v1/goals` - Create goal
- `GET /api/v1/goals` - List goals (with filters)
- `GET /api/v1/goals/{goal_id}` - Get goal details
- `PUT /api/v1/goals/{goal_id}` - Update goal
- `DELETE /api/v1/goals/{goal_id}` - Delete goal
- `PUT /api/v1/goals/{goal_id}/progress` - Update goal progress
- `PUT /api/v1/goals/{goal_id}/status` - Update goal status
- `POST /api/v1/goals/{goal_id}/calculate-progress` - Calculate progress from data
- `GET /api/v1/goals/{goal_id}/report` - Get progress report
- `GET /api/v1/goals/{goal_id}/progress-logs` - Get progress logs

#### Milestones
- `POST /api/v1/goals/{goal_id}/milestones` - Create milestone
- `PUT /api/v1/goals/milestones/{milestone_id}` - Update milestone

#### Analytics
- `GET /api/v1/goals/analytics/user/{user_id}` - Get user analytics
- `GET /api/v1/goals/summary` - Get goals summary
- `PUT /api/v1/goals/bulk/status` - Bulk update goal status

## Usage Examples

### Creating a Goal with Milestones

```python
goal_data = {
    "title": "Achieve 90% Attendance",
    "description": "Maintain 90% or higher attendance for the semester",
    "goal_type": "attendance",
    "category": "Academic Performance",
    "specific": "Attend at least 90% of all classes",
    "measurable": "Track attendance percentage",
    "achievable": "Based on current 85% attendance, this is achievable",
    "relevant": "Good attendance is required for semester completion",
    "time_bound": "Complete by end of semester",
    "target_value": 90.0,
    "unit": "percentage",
    "start_date": "2024-01-01",
    "end_date": "2024-05-31",
    "points_reward": 100,
    "milestones": [
        {
            "title": "Reach 85% Attendance",
            "description": "First milestone",
            "target_value": 85.0,
            "order": 1,
            "points_reward": 20
        },
        {
            "title": "Reach 87.5% Attendance",
            "description": "Mid-point milestone",
            "target_value": 87.5,
            "order": 2,
            "points_reward": 30
        },
        {
            "title": "Reach 90% Attendance",
            "description": "Final milestone",
            "target_value": 90.0,
            "order": 3,
            "points_reward": 50
        }
    ]
}
```

### Automatic Progress Updates

Goals with types `attendance`, `exam`, `assignment`, or `grade` can be automatically updated:

```python
# Trigger automatic progress calculation
POST /api/v1/goals/{goal_id}/calculate-progress
```

The system will:
1. Query relevant performance data (attendance records, exam results, etc.)
2. Calculate current progress
3. Update goal progress percentage
4. Update milestone statuses
5. Award points for completed milestones
6. Check if goal is completed and award points if applicable

### Creating Badges

```python
badge_data = {
    "name": "Perfect Attendance",
    "description": "Achieved 100% attendance for a month",
    "badge_type": "attendance",
    "rarity": "rare",
    "icon_url": "/badges/perfect-attendance.png",
    "points_required": 500,
    "criteria": "100% attendance for 30 consecutive days",
    "is_active": true
}
```

### Awarding Points

```python
points_data = {
    "user_id": 123,
    "points": 50,
    "event_type": "assignment_submit",
    "description": "Submitted assignment on time",
    "reference_id": 456,
    "reference_type": "assignment"
}
```

## Background Tasks

The system includes Celery tasks for automated operations:

- `update_all_active_goals_progress()` - Updates progress for all active goals
- `check_expired_goals()` - Marks expired goals as failed
- `calculate_user_goal_analytics()` - Recalculates analytics for a user
- `recalculate_all_analytics()` - Recalculates analytics for all users

## Database Models

### Gamification Models
- `Badge` - Badge definitions
- `UserBadge` - User badge awards
- `UserPoints` - User points and levels
- `PointHistory` - Point transaction history

### Goal Models
- `GoalTemplate` - Reusable goal templates
- `Goal` - User goals
- `GoalMilestone` - Goal milestones
- `GoalProgressLog` - Progress change history
- `GoalAnalytics` - User goal analytics

## Integration with Performance Data

The system integrates with:
- **Attendance System**: Calculates attendance-based goal progress
- **Exam System**: Tracks exam performance goals
- **Assignment System**: Monitors assignment submission and grades
- **Grading System**: Tracks overall grade improvements

## Best Practices

1. **Set Realistic Goals**: Use SMART criteria to ensure goals are achievable
2. **Break Down Large Goals**: Use milestones to make progress more manageable
3. **Regular Progress Updates**: Schedule automated progress calculations
4. **Meaningful Rewards**: Assign appropriate points and badges for achievements
5. **Monitor Analytics**: Use analytics to track student engagement and goal completion
6. **Template Reuse**: Create templates for common goals to save time

## Migration

To create database tables, run:
```bash
alembic revision --autogenerate -m "Add goal and gamification tables"
alembic upgrade head
```
