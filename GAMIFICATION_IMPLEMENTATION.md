# Gamification System Implementation

## Overview
A comprehensive gamification system for educational institutions that includes points, badges, achievements, leaderboards, and streak tracking to motivate and engage students.

## Database Tables

### 1. Badges Table
Stores badge definitions that can be awarded to users.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `name`: Badge name (max 100 chars)
- `description`: Detailed description
- `badge_type`: ENUM (attendance, assignment, exam, goal, streak, milestone, special)
- `rarity`: ENUM (common, rare, epic, legendary)
- `icon_url`: URL to badge icon
- `points_required`: Points required to earn badge
- `criteria`: JSON field with criteria for auto-awarding
- `auto_award`: Boolean flag for automatic awarding
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- institution_id, badge_type, is_active, auto_award

### 2. User Badges Table
Tracks badges earned by users.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `user_id`: Foreign key to users
- `badge_id`: Foreign key to badges
- `earned_at`: Timestamp when earned
- `points_awarded`: Points awarded with badge
- `metadata`: JSON field for additional data
- `created_at`: Timestamp

**Indexes:**
- institution_id, user_id, badge_id, earned_at

### 3. User Points Table
Stores accumulated points and streaks for users.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `user_id`: Foreign key to users
- `total_points`: Total accumulated points
- `level`: Calculated level based on points
- `experience_points`: Points toward next level
- `current_streak`: Current daily activity streak
- `longest_streak`: All-time longest streak
- `last_activity_date`: Last activity timestamp
- `last_login_date`: Last login timestamp
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- institution_id, user_id, total_points, level, current_streak

**Unique Constraint:**
- (institution_id, user_id)

### 4. Point History Table (Points Log)
Records all point transactions.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `user_points_id`: Foreign key to user_points
- `event_type`: ENUM (attendance, assignment_submit, assignment_grade, exam_pass, exam_excellent, goal_complete, milestone_achieve, daily_login, streak, badge_earn)
- `points`: Points awarded (can be negative)
- `description`: Human-readable description
- `reference_id`: ID of related entity (attendance, assignment, etc.)
- `reference_type`: Type of related entity
- `metadata`: JSON field for additional data
- `created_at`: Timestamp

**Indexes:**
- institution_id, user_points_id, event_type, (reference_type, reference_id), created_at

### 5. Achievements Table
Defines achievements users can unlock.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `name`: Achievement name (max 100 chars)
- `description`: Detailed description
- `achievement_type`: ENUM (attendance, assignment, exam, goal, streak, level, points, social)
- `icon_url`: URL to achievement icon
- `points_reward`: Points awarded on completion
- `requirements`: JSON field with achievement requirements
- `is_secret`: Whether achievement is hidden until unlocked
- `is_repeatable`: Whether achievement can be earned multiple times
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- institution_id, achievement_type, is_active

**Unique Constraint:**
- (institution_id, name)

### 6. User Achievements Table
Tracks user progress on achievements.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `user_id`: Foreign key to users
- `achievement_id`: Foreign key to achievements
- `progress`: Progress percentage (0-100)
- `is_completed`: Completion status
- `completed_at`: Completion timestamp
- `times_completed`: Number of times completed (for repeatable)
- `metadata`: JSON field for additional data
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- institution_id, user_id, achievement_id, is_completed, (user_id, achievement_id)

### 7. Leaderboards Table
Defines different leaderboard configurations.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `name`: Leaderboard name (max 100 chars)
- `description`: Detailed description
- `leaderboard_type`: ENUM (global, grade, section, subject, custom)
- `period`: ENUM (all_time, yearly, monthly, weekly, daily)
- `grade_id`: Foreign key to grades (optional)
- `section_id`: Foreign key to sections (optional)
- `subject_id`: Foreign key to subjects (optional)
- `start_date`, `end_date`: Custom date range (optional)
- `is_public`: Public visibility flag
- `show_full_names`: Privacy control for names
- `max_entries`: Maximum number of entries
- `is_active`: Active status
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- institution_id, leaderboard_type, period, grade_id, section_id, subject_id, is_active

### 8. Leaderboard Entries Table
Stores current leaderboard rankings.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `leaderboard_id`: Foreign key to leaderboards
- `user_id`: Foreign key to users
- `rank`: Current rank
- `score`: Current score
- `previous_rank`: Previous rank (for tracking changes)
- `metadata`: JSON field for additional data
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- institution_id, leaderboard_id, user_id, rank, score

**Unique Constraint:**
- (leaderboard_id, user_id)

### 9. Streak Trackers Table
Tracks different types of streaks separately.

**Fields:**
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `user_id`: Foreign key to users
- `streak_type`: Type of streak (e.g., 'daily_login', 'attendance', 'assignments')
- `current_streak`: Current streak count
- `longest_streak`: All-time longest streak
- `last_activity_date`: Last activity timestamp
- `metadata`: JSON field for additional data
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- institution_id, user_id, streak_type, current_streak

**Unique Constraint:**
- (institution_id, user_id, streak_type)

## Points Calculation Engine

### Points Configuration

```python
POINTS_CONFIG = {
    'attendance': {
        'present': 5,
        'late': 3,
        'half_day': 4,
    },
    'assignment': {
        'submit': 10,
        'grade_excellent': 50,    # >= 90%
        'grade_good': 30,         # >= 75%
        'grade_average': 20,      # >= 60%
        'grade_below_average': 10,# >= 40%
    },
    'exam': {
        'pass': 100,              # >= 60%
        'excellent': 200,         # >= 90%
    },
    'goal': {
        'complete': 150,
        'milestone': 50,
    },
    'streak': {
        'daily_login': 5,
        'weekly_bonus': 25,       # Every 7 days
        'monthly_bonus': 100,     # Every 30 days
    },
    'level': {
        'points_per_level': 500,
    }
}
```

### Activity Points Processing

#### 1. Attendance Points
```python
process_attendance_points(
    user_id, 
    institution_id, 
    attendance_status, 
    attendance_id
)
```
- Calculates points based on attendance status
- Awards 5 points for present, 3 for late, 4 for half day
- Records in point_history with reference to attendance record

#### 2. Assignment Submission Points
```python
process_assignment_submission_points(
    user_id,
    institution_id,
    submission_id
)
```
- Awards 10 points for submitting assignment
- Recorded immediately on submission

#### 3. Assignment Grade Points
```python
process_assignment_grade_points(
    user_id,
    institution_id,
    submission_id,
    marks_obtained,
    max_marks
)
```
- Calculates points based on grade percentage
- Awards 10-50 points based on performance
- Includes grade level in metadata

#### 4. Goal Completion Points
```python
process_goal_completion_points(
    user_id,
    institution_id,
    goal_id,
    goal
)
```
- Awards points based on goal configuration
- Uses goal.points_reward if set, otherwise 150 points default

### Level Calculation
```python
level = max(1, (total_points // 500) + 1)
```
- Every 500 points = 1 level
- Starts at level 1
- Level up triggers badge checks

### Streak Tracking
```python
update_streak(user_points):
    if last_activity was yesterday:
        current_streak += 1
        if current_streak > longest_streak:
            longest_streak = current_streak
    elif last_activity was not today:
        current_streak = 1
```

## Badge Awarding Logic

### Auto-Award System
Badges with `auto_award=True` are checked after each point transaction.

### Badge Criteria Format
```json
{
    "attendance_count": 100,
    "status": "present",
    "submission_count": 50,
    "min_grade": 80,
    "streak_count": 30,
    "total_points": 5000
}
```

### Badge Types and Criteria

#### 1. Attendance Badges
```json
{
    "attendance_count": 100,
    "status": "present"
}
```
Example: "Perfect Attendance" - 100 present days

#### 2. Assignment Badges
```json
{
    "submission_count": 50,
    "min_grade": 80
}
```
Example: "Assignment Master" - 50 graded assignments

#### 3. Streak Badges
```json
{
    "streak_count": 30
}
```
Example: "30-Day Warrior" - 30-day activity streak

#### 4. Milestone Badges
```json
{
    "total_points": 10000
}
```
Example: "Point Collector" - 10,000 total points

### Badge Awarding Process
1. After each activity, check all auto-award badges
2. Evaluate criteria against user's current stats
3. Award badge if criteria met and not already owned
4. Award badge points (if configured)
5. Record in user_badges table
6. Add entry to point_history

## Leaderboard System

### Leaderboard Types

#### 1. Global Leaderboard
- All users in institution
- Ranked by total points
- No filters applied

#### 2. Grade Leaderboard
- Users in specific grade
- Filtered by grade_id
- Competitive within grade level

#### 3. Section Leaderboard
- Users in specific section
- Filtered by section_id
- Class-based competition

#### 4. Subject Leaderboard
- Performance in specific subject
- Filtered by subject_id
- Subject-specific rankings

### Leaderboard Periods

#### 1. All-Time
- Ranks based on total_points
- Never resets

#### 2. Yearly
- Resets January 1st
- Tracks points for current year

#### 3. Monthly
- Resets 1st of each month
- Monthly competition

#### 4. Weekly
- Resets every Monday
- Short-term motivation

#### 5. Daily
- Resets daily
- Immediate feedback

### Privacy Controls

#### 1. is_public
- `true`: Visible to all users
- `false`: Only visible to authorized users

#### 2. show_full_names
- `true`: Display full names
- `false`: Display usernames only or anonymized

### Leaderboard Generation
```python
regenerate_leaderboard_entries(leaderboard_id):
    1. Delete existing entries
    2. Query user_points filtered by leaderboard criteria
    3. Apply period filter if not all_time
    4. Order by total_points descending
    5. Limit to max_entries
    6. Create new leaderboard_entry records with ranks
```

## API Endpoints

### Badge Management

#### Create Badge
```
POST /api/v1/gamification/badges?institution_id={id}
Body: BadgeCreate
Response: BadgeResponse
```

#### List Badges
```
GET /api/v1/gamification/badges?institution_id={id}&skip=0&limit=100
Response: List[BadgeResponse]
```

#### Get Badge
```
GET /api/v1/gamification/badges/{badge_id}
Response: BadgeResponse
```

#### Update Badge
```
PUT /api/v1/gamification/badges/{badge_id}
Body: BadgeUpdate
Response: BadgeResponse
```

#### Award Badge
```
POST /api/v1/gamification/badges/award?institution_id={id}
Body: AwardBadgeRequest
Response: UserBadgeResponse
```

#### Get User Badges
```
GET /api/v1/gamification/users/{user_id}/badges?institution_id={id}
Response: List[UserBadgeResponse]
```

### Points Management

#### Get User Points
```
GET /api/v1/gamification/users/{user_id}/points?institution_id={id}
Response: UserPointsResponse
```

#### Add Points
```
POST /api/v1/gamification/points/add?institution_id={id}
Body: AddPointsRequest
Response: PointsCalculationResult
```

#### Get Point History
```
GET /api/v1/gamification/users/{user_id}/point-history?institution_id={id}&limit=50
Response: List[PointHistoryResponse]
```

### Achievements

#### Create Achievement
```
POST /api/v1/gamification/achievements?institution_id={id}
Body: AchievementCreate
Response: AchievementResponse
```

#### List Achievements
```
GET /api/v1/gamification/achievements?institution_id={id}&skip=0&limit=100
Response: List[AchievementResponse]
```

#### Get User Achievements
```
GET /api/v1/gamification/users/{user_id}/achievements?institution_id={id}
Response: List[UserAchievementResponse]
```

### Leaderboards

#### Create Leaderboard
```
POST /api/v1/gamification/leaderboards?institution_id={id}
Body: LeaderboardCreate
Response: LeaderboardDBResponse
```

#### List Leaderboards
```
GET /api/v1/gamification/leaderboards?institution_id={id}
Response: List[LeaderboardDBResponse]
```

#### Get Leaderboard with Entries
```
GET /api/v1/gamification/leaderboards/{leaderboard_id}
Response: LeaderboardWithEntriesResponse
```

#### Update Leaderboard
```
PUT /api/v1/gamification/leaderboards/{leaderboard_id}
Body: LeaderboardUpdate
Response: LeaderboardDBResponse
```

#### Regenerate Leaderboard
```
POST /api/v1/gamification/leaderboards/{leaderboard_id}/regenerate
Response: {"message": "...", "entries_count": 0}
```

#### Get Dynamic Leaderboard
```
GET /api/v1/gamification/leaderboard?institution_id={id}&limit=50&current_user_id={id}
Response: LeaderboardResponse
```

### User Statistics

#### Get User Stats
```
GET /api/v1/gamification/users/{user_id}/stats?institution_id={id}
Response: UserGamificationStats
```

#### Get User Showcase
```
GET /api/v1/gamification/users/{user_id}/showcase?institution_id={id}
Response: UserShowcaseResponse
```

#### Get User Streaks
```
GET /api/v1/gamification/users/{user_id}/streaks?institution_id={id}
Response: List[StreakTrackerResponse]
```

#### Record Daily Login
```
POST /api/v1/gamification/users/{user_id}/daily-login?institution_id={id}
Response: {"message": "...", "streak": 0, "points_earned": 0}
```

## Integration with Activities

### Attendance Integration
When attendance is marked:
```python
from src.services.gamification_service import GamificationService

result = GamificationService.process_attendance_points(
    db=db,
    user_id=student.user_id,
    institution_id=institution_id,
    attendance_status=attendance.status,
    attendance_id=attendance.id
)
```

### Assignment Submission Integration
When assignment is submitted:
```python
result = GamificationService.process_assignment_submission_points(
    db=db,
    user_id=student.user_id,
    institution_id=institution_id,
    submission_id=submission.id
)
```

### Assignment Grading Integration
When assignment is graded:
```python
result = GamificationService.process_assignment_grade_points(
    db=db,
    user_id=student.user_id,
    institution_id=institution_id,
    submission_id=submission.id,
    marks_obtained=submission.marks_obtained,
    max_marks=assignment.max_marks
)
```

### Goal Completion Integration
When goal is completed:
```python
result = GamificationService.process_goal_completion_points(
    db=db,
    user_id=goal.user_id,
    institution_id=institution_id,
    goal_id=goal.id,
    goal=goal
)
```

## Response Models

### PointsCalculationResult
```json
{
    "points_awarded": 50,
    "level_up": true,
    "new_level": 5,
    "badges_earned": [...],
    "achievements_unlocked": [...]
}
```

### UserShowcaseResponse
```json
{
    "user_id": 1,
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "total_points": 5000,
    "level": 11,
    "current_streak": 15,
    "longest_streak": 30,
    "badges": [...],
    "achievements": [...],
    "recent_activities": [...],
    "rank": 5
}
```

## Best Practices

### 1. Points Configuration
- Regularly review and adjust points values
- Balance points to avoid inflation
- Make high-effort activities more rewarding

### 2. Badge Design
- Create meaningful, achievable badges
- Use clear, motivating descriptions
- Set appropriate rarity levels
- Include visual icons for engagement

### 3. Achievement Design
- Set realistic requirements
- Use secret achievements sparingly
- Make repeatable achievements for long-term engagement
- Align with educational goals

### 4. Leaderboard Management
- Regenerate leaderboards periodically (use cron jobs)
- Consider privacy implications
- Offer multiple leaderboard types
- Reset periodic leaderboards on schedule

### 5. Streak Tracking
- Be lenient with streaks (consider weekends)
- Provide streak recovery options
- Celebrate milestone streaks
- Award bonus points for long streaks

## Performance Considerations

### 1. Caching
- Cache leaderboard results
- Cache user stats for frequently accessed profiles
- Invalidate cache on point changes

### 2. Batch Operations
- Process points in batches for bulk imports
- Regenerate leaderboards during off-peak hours
- Use background jobs for heavy calculations

### 3. Indexing
- Ensure proper indexes on all foreign keys
- Index frequently queried fields (points, level, rank)
- Use composite indexes for complex queries

### 4. Archiving
- Archive old point_history records
- Keep aggregated stats for historical analysis
- Implement data retention policies

## Migration

Run migration:
```bash
alembic upgrade head
```

Rollback:
```bash
alembic downgrade -1
```

## Testing

### 1. Unit Tests
- Test points calculation engine
- Test badge criteria evaluation
- Test streak logic
- Test level calculation

### 2. Integration Tests
- Test points awarding with activities
- Test badge auto-awarding
- Test leaderboard generation
- Test achievement progress tracking

### 3. Load Tests
- Test leaderboard queries with large datasets
- Test concurrent point additions
- Test badge checking performance

## Future Enhancements

1. **Team Challenges**: Group competitions and collaborative goals
2. **Rewards Marketplace**: Redeem points for real rewards
3. **Social Features**: Share achievements, challenge friends
4. **Customizable Avatars**: Unlock avatar items with points
5. **Seasonal Events**: Limited-time challenges and badges
6. **Parent Portal**: Parents can view child's gamification progress
7. **Teacher Dashboard**: Monitor class engagement through gamification metrics
8. **AI Recommendations**: Suggest personalized goals and achievements
