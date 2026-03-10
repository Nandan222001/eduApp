# Gamification System Quick Start Guide

## Setup

### 1. Run Migration
```bash
alembic upgrade head
```

### 2. Create Initial Badges (Optional)
```python
# Example: Create attendance badges
POST /api/v1/gamification/badges?institution_id=1
{
    "name": "Perfect Week",
    "description": "Attended all classes for a week",
    "badge_type": "attendance",
    "rarity": "common",
    "points_required": 50,
    "criteria": {
        "attendance_count": 5,
        "status": "present"
    },
    "auto_award": true,
    "is_active": true
}
```

### 3. Create Achievements
```python
POST /api/v1/gamification/achievements?institution_id=1
{
    "name": "Point Master",
    "description": "Earn 10,000 points",
    "achievement_type": "points",
    "points_reward": 500,
    "requirements": {
        "points": 10000
    },
    "is_secret": false,
    "is_repeatable": false,
    "is_active": true
}
```

### 4. Create Leaderboards
```python
POST /api/v1/gamification/leaderboards?institution_id=1
{
    "name": "Monthly Champions",
    "description": "Top performers this month",
    "leaderboard_type": "global",
    "period": "monthly",
    "is_public": true,
    "show_full_names": true,
    "max_entries": 50,
    "is_active": true
}
```

## Integration Examples

### Award Points for Attendance
```python
from src.services.gamification_service import GamificationService
from src.models.attendance import AttendanceStatus

# When marking attendance
result = GamificationService.process_attendance_points(
    db=db,
    user_id=student.user_id,
    institution_id=1,
    attendance_status=AttendanceStatus.PRESENT,
    attendance_id=attendance.id
)

print(f"Points awarded: {result.points_awarded}")
print(f"Level up: {result.level_up}")
print(f"Badges earned: {len(result.badges_earned)}")
```

### Award Points for Assignment Submission
```python
# When student submits assignment
result = GamificationService.process_assignment_submission_points(
    db=db,
    user_id=student.user_id,
    institution_id=1,
    submission_id=submission.id
)
```

### Award Points for Assignment Grades
```python
# When teacher grades assignment
result = GamificationService.process_assignment_grade_points(
    db=db,
    user_id=student.user_id,
    institution_id=1,
    submission_id=submission.id,
    marks_obtained=85.0,
    max_marks=100.0
)
```

### Award Points for Goal Completion
```python
# When goal is completed
result = GamificationService.process_goal_completion_points(
    db=db,
    user_id=goal.user_id,
    institution_id=1,
    goal_id=goal.id,
    goal=goal
)
```

## Common API Calls

### Get User Points and Stats
```bash
GET /api/v1/gamification/users/123/points?institution_id=1
```

Response:
```json
{
    "id": 1,
    "institution_id": 1,
    "user_id": 123,
    "total_points": 2500,
    "level": 6,
    "experience_points": 2500,
    "current_streak": 15,
    "longest_streak": 30,
    "last_activity_date": "2024-01-19T10:00:00",
    "last_login_date": "2024-01-19T09:00:00"
}
```

### Get Point History
```bash
GET /api/v1/gamification/users/123/point-history?institution_id=1&limit=20
```

### Get User Badges
```bash
GET /api/v1/gamification/users/123/badges?institution_id=1
```

### Get Leaderboard
```bash
GET /api/v1/gamification/leaderboard?institution_id=1&limit=50&current_user_id=123
```

### Get User Showcase (Profile)
```bash
GET /api/v1/gamification/users/123/showcase?institution_id=1
```

Response includes:
- User info
- Total points and level
- Current and longest streaks
- Top badges
- Top achievements
- Recent activities
- Current rank

### Record Daily Login
```bash
POST /api/v1/gamification/users/123/daily-login?institution_id=1
```

Response:
```json
{
    "message": "Daily login recorded",
    "streak": 16,
    "points_earned": 5,
    "result": {
        "points_awarded": 5,
        "level_up": false,
        "new_level": 6,
        "badges_earned": [],
        "achievements_unlocked": []
    }
}
```

### Get User Achievements
```bash
GET /api/v1/gamification/users/123/achievements?institution_id=1
```

### Regenerate Leaderboard
```bash
POST /api/v1/gamification/leaderboards/1/regenerate
```

## Points Values Reference

### Attendance
- Present: 5 points
- Late: 3 points
- Half Day: 4 points
- Absent: 0 points

### Assignments
- Submit: 10 points
- Grade >= 90%: 50 points
- Grade >= 75%: 30 points
- Grade >= 60%: 20 points
- Grade >= 40%: 10 points

### Exams
- Pass (>= 60%): 100 points
- Excellent (>= 90%): 200 points

### Goals
- Complete: 150 points (or custom)
- Milestone: 50 points

### Streaks
- Daily Login: 5 points
- Weekly Bonus (7 days): 25 points
- Monthly Bonus (30 days): 100 points

### Levels
- 500 points per level
- Level = (total_points // 500) + 1

## Badge Criteria Examples

### Attendance Badge
```json
{
    "name": "Attendance Champion",
    "badge_type": "attendance",
    "criteria": {
        "attendance_count": 100,
        "status": "present"
    },
    "auto_award": true
}
```

### Assignment Badge
```json
{
    "name": "Assignment Pro",
    "badge_type": "assignment",
    "criteria": {
        "submission_count": 50,
        "min_grade": 80
    },
    "auto_award": true
}
```

### Streak Badge
```json
{
    "name": "30-Day Warrior",
    "badge_type": "streak",
    "criteria": {
        "streak_count": 30
    },
    "auto_award": true
}
```

### Milestone Badge
```json
{
    "name": "10K Club",
    "badge_type": "milestone",
    "criteria": {
        "total_points": 10000
    },
    "auto_award": true
}
```

## Achievement Requirements Examples

### Points Achievement
```json
{
    "name": "Point Collector",
    "achievement_type": "points",
    "requirements": {
        "points": 5000
    }
}
```

### Streak Achievement
```json
{
    "name": "Consistency King",
    "achievement_type": "streak",
    "requirements": {
        "streak": 60
    }
}
```

### Level Achievement
```json
{
    "name": "Level Master",
    "achievement_type": "level",
    "requirements": {
        "level": 20
    }
}
```

## Scheduled Tasks (Recommendations)

### Daily Tasks
1. Reset daily leaderboards
2. Check and break expired streaks
3. Award daily login bonuses

### Weekly Tasks
1. Reset weekly leaderboards
2. Award weekly streak bonuses
3. Generate weekly achievement reports

### Monthly Tasks
1. Reset monthly leaderboards
2. Award monthly streak bonuses
3. Generate monthly performance reports
4. Archive old point history (optional)

## Background Job Example (Celery)

```python
from celery import shared_task
from src.database import SessionLocal
from src.services.gamification_service import GamificationService

@shared_task
def regenerate_all_leaderboards():
    db = SessionLocal()
    try:
        leaderboards = GamificationService.get_leaderboards(db, institution_id=1)
        for leaderboard in leaderboards:
            GamificationService.regenerate_leaderboard_entries(db, leaderboard.id)
    finally:
        db.close()

# Schedule in beat.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'regenerate-leaderboards-daily': {
        'task': 'tasks.regenerate_all_leaderboards',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
}
```

## Tips for Success

### 1. Balance Points
- Start conservative
- Monitor engagement
- Adjust based on feedback
- Avoid point inflation

### 2. Design Meaningful Badges
- Clear criteria
- Achievable goals
- Visual appeal
- Celebrate milestones

### 3. Maintain Fair Leaderboards
- Multiple categories
- Time-based resets
- Privacy options
- Equal opportunities

### 4. Track Streaks Effectively
- Be consistent
- Allow recovery options
- Reward persistence
- Celebrate milestones

### 5. Monitor Performance
- Query optimization
- Caching strategies
- Background processing
- Regular maintenance

## Troubleshooting

### Points Not Awarding
1. Check user_points record exists
2. Verify event_type is valid
3. Check institution_id matches
4. Review point_history logs

### Badges Not Auto-Awarding
1. Verify auto_award is true
2. Check criteria format
3. Ensure badge is active
4. Review badge criteria logic

### Leaderboard Issues
1. Regenerate leaderboard entries
2. Check period configuration
3. Verify filters (grade, section)
4. Review max_entries setting

### Streak Breaking Unexpectedly
1. Check timezone settings
2. Verify last_activity_date
3. Review streak update logic
4. Consider grace periods

## Support

For detailed documentation, see GAMIFICATION_IMPLEMENTATION.md
