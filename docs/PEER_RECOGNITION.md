# Peer Recognition and Appreciation System

## Overview

The Peer Recognition system enables students to recognize and appreciate their peers for positive behaviors and achievements. It includes gamification features, badges, points, and analytics to foster a positive school culture.

## Features

### 1. Recognition Types
- **Kindness** - Recognizing compassionate and caring behavior
- **Academic Help** - Acknowledging peer tutoring and study assistance
- **Teamwork** - Celebrating collaborative efforts
- **Leadership** - Highlighting leadership qualities
- **Creativity** - Appreciating creative thinking and innovation
- **Perseverance** - Recognizing determination and resilience
- **Sportsmanship** - Acknowledging fair play and good conduct

### 2. Daily Recognition Limits
- Students can send up to 10 recognitions per day (configurable)
- Prevents spam and ensures meaningful recognitions
- Limit resets daily at midnight

### 3. Recognition Badges
Students earn badges based on the number of recognitions received:
- **Bronze**: 5-9 recognitions (50 points)
- **Silver**: 10-24 recognitions (100 points)
- **Gold**: 25-49 recognitions (200 points)
- **Platinum**: 50-99 recognitions (300 points)
- **Diamond**: 100+ recognitions (500 points)

### 4. Gamification Integration
- Recognition recipients earn points based on recognition type
- Points contribute to overall gamification system
- Points are automatically added to user's gamification profile

### 5. Appreciation Wall
- Public feed of all recognitions (unless marked private)
- Like/unlike functionality
- Real-time updates
- Paginated for performance

### 6. Trending Recognitions
- Algorithm-based trending score
- Considers recency and engagement (likes)
- Highlights popular recognitions

### 7. Analytics
- **Positivity Index**: Measures overall school positivity
- **Most Recognized Students**: Leaderboard of top recipients
- **Daily Analytics**: Tracks recognitions, unique participants, and trends
- **Student Stats**: Individual recognition statistics

## API Endpoints

### Send Recognition
```
POST /api/v1/peer-recognition/recognitions
Query Parameters:
  - institution_id: int
  - from_student_id: int
Body:
  {
    "to_student_id": int,
    "recognition_type": "kindness|academic_help|teamwork|leadership|creativity|perseverance|sportsmanship",
    "message": "string (max 500 chars)",
    "is_public": boolean (default: true)
  }
```

### Get Received Recognitions
```
GET /api/v1/peer-recognition/recognitions/received
Query Parameters:
  - institution_id: int
  - student_id: int
  - skip: int (default: 0)
  - limit: int (default: 50, max: 100)
```

### Appreciation Wall
```
GET /api/v1/peer-recognition/appreciation-wall
Query Parameters:
  - institution_id: int
  - page: int (default: 1)
  - page_size: int (default: 20, max: 100)
  - current_student_id: int (optional, for like status)
```

### Toggle Like
```
POST /api/v1/peer-recognition/recognitions/{recognition_id}/like
Query Parameters:
  - student_id: int
```

### Trending Recognitions
```
GET /api/v1/peer-recognition/trending
Query Parameters:
  - institution_id: int
  - limit: int (default: 10, max: 50)
  - days: int (default: 7, max: 30)
```

### Positivity Index
```
GET /api/v1/peer-recognition/analytics/positivity-index
Query Parameters:
  - institution_id: int
  - period: "day"|"week"|"month" (default: "week")
```

### Most Recognized Students
```
GET /api/v1/peer-recognition/analytics/most-recognized
Query Parameters:
  - institution_id: int
  - limit: int (default: 10, max: 50)
  - days: int (optional, filters by date range)
```

### Student Recognition Stats
```
GET /api/v1/peer-recognition/students/{student_id}/stats
Query Parameters:
  - institution_id: int
```

### Student Badges
```
GET /api/v1/peer-recognition/students/{student_id}/badges
Query Parameters:
  - institution_id: int
```

### Daily Limit Status
```
GET /api/v1/peer-recognition/students/{student_id}/daily-limit
Query Parameters:
  - institution_id: int
```

### Update Analytics
```
POST /api/v1/peer-recognition/analytics/update
Query Parameters:
  - institution_id: int
  - analytics_date: date (optional, defaults to today)
```

### Get Daily Analytics
```
GET /api/v1/peer-recognition/analytics/daily
Query Parameters:
  - institution_id: int
  - analytics_date: date (optional, defaults to today)
```

### Get Recognition Types
```
GET /api/v1/peer-recognition/recognition-types
Returns list of available recognition types with points
```

## Database Models

### PeerRecognition
- Stores individual recognition instances
- Tracks sender, recipient, type, message, and visibility
- Maintains like count

### RecognitionLike
- Tracks likes on recognitions
- Unique constraint: one like per student per recognition

### RecognitionBadge
- Stores earned badges
- Tracks recognition count and points awarded

### DailyRecognitionLimit
- Enforces daily sending limits
- Resets daily

### RecognitionNotification
- Links recognitions to notifications
- Triggers feel-good notifications to recipients

### RecognitionAnalytics
- Daily aggregated analytics per institution
- Tracks positivity index and trends

## Background Tasks

### Daily Analytics Update
```python
from src.tasks.peer_recognition_tasks import update_daily_analytics_task

# Update all institutions
update_daily_analytics_task.delay()

# Update specific institution
update_daily_analytics_task.delay(institution_id=1)

# Update specific date
update_daily_analytics_task.delay(
    institution_id=1, 
    analytics_date="2024-01-15"
)
```

### Historical Analytics Update
```python
from src.tasks.peer_recognition_tasks import update_historical_analytics_task

# Update last 30 days
update_historical_analytics_task.delay(institution_id=1, days=30)
```

## Notifications

When a student receives a recognition:
- In-app notification is created automatically
- Notification includes sender name, recognition type, and message
- Notification type: "peer_recognition"
- Notification group: "social"
- Priority: "medium"

## Points System

Recognition points by type:
- Kindness: 10 points
- Academic Help: 15 points
- Teamwork: 12 points
- Leadership: 20 points
- Creativity: 15 points
- Perseverance: 18 points
- Sportsmanship: 12 points

Points are automatically added to the gamification system for the recipient.

## Positivity Index Calculation

```
Positivity Index = (Total Recognitions × 10) + (Unique Participants × 5) + Total Likes
```

The index measures overall engagement and positive interactions within the institution.

## Best Practices

1. **Meaningful Messages**: Encourage students to write specific, meaningful messages
2. **Regular Monitoring**: Review analytics to identify trends and issues
3. **Celebrate Milestones**: Acknowledge students who earn badges
4. **Privacy Settings**: Respect student privacy preferences
5. **Moderation**: Implement content moderation if needed
6. **Analytics Review**: Use positivity index to track school culture trends

## Migration

To add the peer recognition tables to your database:

```bash
# Create migration
alembic revision --autogenerate -m "Add peer recognition system"

# Apply migration
alembic upgrade head
```

## Testing

Example test scenarios:
1. Send recognition within daily limit
2. Attempt to exceed daily limit (should fail with 429)
3. Try to recognize self (should fail with 400)
4. Like/unlike recognition
5. View appreciation wall
6. Check badge awards at thresholds (5, 10, 25, 50, 100)
7. Verify points integration
8. Test analytics calculations
