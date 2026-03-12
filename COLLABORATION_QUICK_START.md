# Student Collaboration Features - Quick Start Guide

## Quick Setup

### 1. Run Database Migration

```bash
alembic upgrade head
```

This creates all collaboration tables.

### 2. API Endpoints Available

All endpoints are under `/api/v1/collaboration/`

## Common Use Cases

### Study Buddy Matching

**Step 1: Create Profile**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/study-buddy/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjects": [1, 2, 3],
    "performance_level": "good",
    "learning_style": "visual",
    "availability_days": ["monday", "wednesday", "friday"]
  }'
```

**Step 2: Find Matches**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/study-buddy/find-matches \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject_ids": [1, 2],
    "max_matches": 10
  }'
```

**Step 3: Send Match Request**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/study-buddy/matches/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Study Sessions

**Create Session**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Math Study Group",
    "subject_id": 1,
    "scheduled_start": "2024-01-20T14:00:00Z",
    "scheduled_end": "2024-01-20T16:00:00Z",
    "video_platform": "zoom",
    "max_participants": 10
  }'
```

**Join Session**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/sessions/1/join \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Start Session**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/sessions/1/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video_room_id": "zoom-room-123"}'
```

### Collaborative Notes

**Create Note**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chapter 5 Notes",
    "content": "# Key Points\n\n1. First concept...",
    "subject_id": 1,
    "is_public": true
  }'
```

**Add Editor**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/notes/1/editors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 456,
    "can_edit": true
  }'
```

**Update Note (Creates New Revision)**
```bash
curl -X PUT http://localhost:8000/api/v1/collaboration/notes/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Updated Content\n\n...",
    "change_description": "Added more examples"
  }'
```

### Peer Tutoring

**Become a Tutor**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/tutoring/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expertise_subjects": [1, 2],
    "hourly_rate": 15.00,
    "bio": "Experienced math tutor"
  }'
```

**Search for Tutors**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/tutoring/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": 1,
    "min_rating": 4.0,
    "max_rate": 20.00
  }'
```

**Request Tutoring**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/tutoring/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": 1,
    "topic": "Calculus Help",
    "description": "Need help with derivatives",
    "duration_minutes": 60,
    "offered_rate": 15.00
  }'
```

### Analytics

**Generate Group Analytics**
```bash
curl -X POST http://localhost:8000/api/v1/collaboration/analytics/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": 1,
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-31T23:59:59Z"
  }'
```

**Get Group Analytics**
```bash
curl -X GET "http://localhost:8000/api/v1/collaboration/analytics/group/1?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Features

### 1. Study Buddy Matching
- **Algorithm**: 0-100 point scoring system
- **Criteria**: Subjects (40pts), Performance (20pts), Learning Style (15pts), Availability (15pts), Times (10pts)
- **Threshold**: Minimum 20 points for match

### 2. Study Sessions
- **Video Integration**: Zoom, Teams, Meet, Jitsi
- **Tracking**: Join/leave times, duration, participant count
- **Lifecycle**: Scheduled → In Progress → Completed

### 3. Collaborative Notes
- **Versioning**: Automatic version tracking
- **Permissions**: Creator + invited editors
- **History**: Full revision history with descriptions

### 4. Peer Tutoring
- **Marketplace**: Browse tutors by subject, rating, rate
- **Ratings**: 1-5 star system with feedback
- **Earnings**: Automatic tracking for tutors

### 5. Analytics
- **Metrics**: Study hours, sessions, attendance
- **Scores**: Engagement, collaboration, overall performance
- **Distribution**: Member and subject analytics

## Status Values

### Match Status
- `pending`: Awaiting response
- `accepted`: Match confirmed
- `declined`: Match rejected
- `expired`: Request timed out

### Session Status
- `scheduled`: Not yet started
- `in_progress`: Currently active
- `completed`: Finished
- `cancelled`: Cancelled

### Tutor Request Status
- `open`: Looking for tutor
- `matched`: Tutor assigned
- `completed`: Session finished
- `cancelled`: Request cancelled

## Performance Levels
- `excellent`: Top performers
- `good`: Above average
- `average`: Standard level
- `needs_improvement`: Below average

## Learning Styles
- `visual`: Learn through images/diagrams
- `auditory`: Learn through listening
- `kinesthetic`: Learn through doing
- `reading_writing`: Learn through text

## Video Platforms
- `zoom`: Zoom meetings
- `teams`: Microsoft Teams
- `meet`: Google Meet
- `jitsi`: Jitsi Meet (open source)

## Response Format

All endpoints return JSON with appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found

## Pagination

List endpoints support pagination:
```bash
GET /api/v1/collaboration/sessions?limit=20&offset=0
```

## Filtering

Most GET endpoints support filtering:
```bash
GET /api/v1/collaboration/sessions?status=scheduled&group_id=1
GET /api/v1/collaboration/notes?subject_id=1&is_public=true
```

## Authentication

All endpoints require authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Common Errors

### "User must have a student profile"
- Only students can use buddy matching and tutoring
- Ensure user has a linked student profile

### "Access denied"
- Note is private and user is not an editor
- Check permissions with note creator

### "Session is full"
- Maximum participants reached
- Check `max_participants` and `participant_count`

### "Unauthorized to respond to this match"
- Only matched student can respond
- Verify you're the recipient of the match request

## Best Practices

1. **Create Profile First**: Before finding matches or becoming a tutor
2. **Set Realistic Limits**: Don't set `max_participants` too high
3. **Update Availability**: Keep your profile current
4. **Use Descriptive Titles**: For sessions and notes
5. **Track Versions**: Use change descriptions in notes
6. **Provide Feedback**: Rate tutoring sessions
7. **Generate Analytics**: Regularly track group performance

## Next Steps

1. Review full API documentation: `COLLABORATION_FEATURES_IMPLEMENTATION.md`
2. Test endpoints with your authentication token
3. Create study buddy profile and find matches
4. Schedule your first study session
5. Create collaborative notes
6. Set up peer tutoring (if applicable)
7. Generate analytics for your study groups

## Support

For detailed information:
- API Schema: Check `/docs` endpoint (FastAPI auto-documentation)
- Models: Review `src/models/study_group.py`
- Service Logic: See `src/services/collaboration_service.py`
- Complete Guide: `COLLABORATION_FEATURES_IMPLEMENTATION.md`
