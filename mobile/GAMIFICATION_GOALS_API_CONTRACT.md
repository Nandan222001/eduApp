# Gamification and Goals API Contract

This document defines the expected API contract for the backend to support the Gamification and Goals mobile features.

## Gamification API Endpoints

### Get Points
**Endpoint:** `GET /api/v1/gamification/points`  
**Query Parameters:**
- `studentId` (optional, number): For parent viewing child's points

**Response:**
```json
{
  "totalPoints": 1250,
  "currentLevel": 5,
  "levelName": "Scholar",
  "pointsToNextLevel": 250,
  "pointsInCurrentLevel": 250,
  "pointsRequiredForNextLevel": 500,
  "recentActivities": [
    {
      "id": 1,
      "activityType": "assignment_completed",
      "description": "Completed Math Assignment #5",
      "pointsEarned": 50,
      "timestamp": "2024-01-15T10:30:00Z",
      "metadata": {}
    }
  ]
}
```

### Get Badges
**Endpoint:** `GET /api/v1/gamification/badges`  
**Query Parameters:**
- `studentId` (optional, number): For parent viewing child's badges

**Response:**
```json
[
  {
    "id": 1,
    "name": "Perfect Attendance",
    "description": "Attended all classes for a month",
    "icon": "calendar-check",
    "iconUrl": null,
    "category": "attendance",
    "rarity": "rare",
    "earnedAt": "2024-01-10T00:00:00Z",
    "isEarned": true,
    "progress": null,
    "criteria": "Attend all classes for 30 consecutive days"
  },
  {
    "id": 2,
    "name": "Study Master",
    "description": "Complete 100 assignments",
    "icon": "book-open-page-variant",
    "iconUrl": null,
    "category": "academic",
    "rarity": "epic",
    "earnedAt": null,
    "isEarned": false,
    "progress": {
      "current": 75,
      "target": 100,
      "percentage": 75
    },
    "criteria": "Complete 100 assignments with passing grades"
  }
]
```

### Get Leaderboard
**Endpoint:** `GET /api/v1/gamification/leaderboard`  
**Query Parameters:**
- `timeframe` (optional): "daily" | "weekly" | "monthly" | "all_time" (default: "weekly")
- `classId` (optional, number): Filter by class

**Response:**
```json
{
  "timeframe": "weekly",
  "myRank": 5,
  "myPoints": 850,
  "totalParticipants": 120,
  "topRankers": [
    {
      "rank": 1,
      "studentId": 101,
      "studentName": "John Doe",
      "profilePhoto": "https://...",
      "points": 1500,
      "level": 10,
      "badgeCount": 15,
      "trend": "up"
    }
  ],
  "nearbyRankers": [
    {
      "rank": 4,
      "studentId": 102,
      "studentName": "Jane Smith",
      "profilePhoto": "https://...",
      "points": 900,
      "level": 8,
      "badgeCount": 12,
      "trend": "same"
    }
  ]
}
```

### Get Achievements
**Endpoint:** `GET /api/v1/gamification/achievements`  
**Query Parameters:**
- `studentId` (optional, number): For parent viewing child's achievements

**Response:**
```json
[
  {
    "id": 1,
    "title": "First Goal Completed",
    "description": "Completed your first academic goal",
    "category": "goals",
    "pointsEarned": 100,
    "badgeEarned": {
      "id": 5,
      "name": "Goal Starter",
      "icon": "target"
    },
    "achievedAt": "2024-01-15T12:00:00Z",
    "isNew": true
  }
]
```

### Get Stats
**Endpoint:** `GET /api/v1/gamification/stats`  
**Query Parameters:**
- `studentId` (optional, number): For parent viewing child's stats

**Response:**
```json
{
  "totalPoints": 1250,
  "totalBadges": 8,
  "totalAchievements": 15,
  "currentLevel": 5,
  "rank": 5,
  "totalStudents": 120,
  "nextLevelPoints": 250,
  "badges": [],
  "streaks": [
    {
      "currentStreak": 15,
      "longestStreak": 20,
      "streakType": "daily_login",
      "lastActivityDate": "2024-01-15",
      "isActive": true,
      "nextMilestone": 30
    }
  ],
  "recentAchievements": []
}
```

### Get Rewards
**Endpoint:** `GET /api/v1/gamification/rewards`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Extra Study Time",
    "description": "Get 2 extra hours in the library",
    "icon": "book-clock",
    "pointsCost": 500,
    "available": true,
    "category": "privileges",
    "imageUrl": "https://...",
    "expiresAt": "2024-12-31T23:59:59Z",
    "claimed": false,
    "claimedAt": null
  }
]
```

### Claim Reward
**Endpoint:** `POST /api/v1/gamification/rewards/{rewardId}/claim`

**Response:** `204 No Content`

### Get Streaks
**Endpoint:** `GET /api/v1/gamification/streaks`  
**Query Parameters:**
- `studentId` (optional, number): For parent viewing child's streaks

**Response:**
```json
[
  {
    "currentStreak": 15,
    "longestStreak": 20,
    "streakType": "daily_login",
    "lastActivityDate": "2024-01-15",
    "isActive": true,
    "nextMilestone": 30
  },
  {
    "currentStreak": 5,
    "longestStreak": 10,
    "streakType": "assignment_submission",
    "lastActivityDate": "2024-01-15",
    "isActive": true,
    "nextMilestone": 10
  }
]
```

### Mark Achievement as Viewed
**Endpoint:** `POST /api/v1/gamification/achievements/{achievementId}/viewed`

**Response:** `204 No Content`

## Goals API Endpoints

### Get Goals
**Endpoint:** `GET /api/v1/goals`  
**Query Parameters:**
- `status` (optional): "active" | "completed" | "paused" | "abandoned"

**Response:**
```json
[
  {
    "id": 1,
    "title": "Master Algebra",
    "description": "Complete all algebra assignments with A grades",
    "category": "academic",
    "status": "active",
    "priority": "high",
    "startDate": "2024-01-01T00:00:00Z",
    "targetDate": "2024-06-30T00:00:00Z",
    "completedDate": null,
    "progress": 65,
    "milestones": [
      {
        "id": 1,
        "title": "Complete Chapter 1-5",
        "description": "Finish all assignments in chapters 1 through 5",
        "targetDate": "2024-03-01T00:00:00Z",
        "completed": true,
        "completedAt": "2024-02-28T15:30:00Z",
        "order": 1
      }
    ],
    "specific": "Achieve an A grade in all algebra assignments",
    "measurable": "Maintain 90%+ average on assignments",
    "achievable": "I have the study materials and support",
    "relevant": "Essential for my college preparation",
    "timeBound": "Complete by end of school year",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

### Get Goal by ID
**Endpoint:** `GET /api/v1/goals/{goalId}`

**Response:** Same as single goal object above

### Create Goal
**Endpoint:** `POST /api/v1/goals`

**Request Body:**
```json
{
  "title": "Master Algebra",
  "description": "Complete all algebra assignments with A grades",
  "category": "academic",
  "priority": "high",
  "targetDate": "2024-06-30",
  "specific": "Achieve an A grade in all algebra assignments",
  "measurable": "Maintain 90%+ average on assignments",
  "achievable": "I have the study materials and support",
  "relevant": "Essential for my college preparation",
  "timeBound": "Complete by end of school year",
  "milestones": [
    {
      "title": "Complete Chapter 1-5",
      "description": "Finish all assignments in chapters 1 through 5",
      "targetDate": "2024-03-01",
      "order": 1
    }
  ]
}
```

**Response:** Goal object (same as Get Goal response)

### Update Goal
**Endpoint:** `PATCH /api/v1/goals/{goalId}`

**Request Body:**
```json
{
  "title": "Master Algebra (Updated)",
  "progress": 75,
  "status": "active"
}
```

**Response:** Updated goal object

### Delete Goal
**Endpoint:** `DELETE /api/v1/goals/{goalId}`

**Response:** `204 No Content`

### Complete Milestone
**Endpoint:** `POST /api/v1/goals/{goalId}/milestones/{milestoneId}/complete`

**Response:** Updated milestone object
```json
{
  "id": 1,
  "title": "Complete Chapter 1-5",
  "description": "Finish all assignments in chapters 1 through 5",
  "targetDate": "2024-03-01T00:00:00Z",
  "completed": true,
  "completedAt": "2024-02-28T15:30:00Z",
  "order": 1
}
```

### Update Milestone
**Endpoint:** `PATCH /api/v1/goals/{goalId}/milestones/{milestoneId}`

**Request Body:**
```json
{
  "completed": true
}
```

**Response:** Updated milestone object

### Get Achievements
**Endpoint:** `GET /api/v1/goals/achievements`

**Response:**
```json
[
  {
    "id": 1,
    "goalId": 1,
    "goalTitle": "Master Algebra",
    "completedAt": "2024-06-30T10:00:00Z",
    "category": "academic",
    "points": 200,
    "badge": "academic_excellence"
  }
]
```

### Share Goal
**Endpoint:** `POST /api/v1/goals/{goalId}/share`

**Request Body:**
```json
{
  "shareWith": ["parent", "teacher"]
}
```

**Response:** `204 No Content`

### Get Shared Goals
**Endpoint:** `GET /api/v1/goals/shared`

**Response:** Array of goal objects

### Get Child Goals (Parent Only)
**Endpoint:** `GET /api/v1/goals/child/{childId}`  
**Query Parameters:**
- `status` (optional): "active" | "completed" | "paused" | "abandoned"

**Response:** Array of goal objects

## Authentication

All endpoints require authentication via Bearer token:
```
Authorization: Bearer <access_token>
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "title": ["Title is required"],
    "targetDate": ["Target date must be in the future"]
  }
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

Consider implementing rate limiting:
- 100 requests per minute per user for read operations
- 30 requests per minute per user for write operations

## Caching Headers

Recommend using appropriate cache headers:
- Stats/Points: `Cache-Control: max-age=300` (5 minutes)
- Badges: `Cache-Control: max-age=3600` (1 hour)
- Goals: `Cache-Control: no-cache` (always fresh)

## Pagination

For endpoints returning lists (e.g., leaderboard, achievements), consider implementing pagination:

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response Headers:**
```
X-Total-Count: 150
X-Total-Pages: 8
X-Current-Page: 1
X-Per-Page: 20
```

## Sorting and Filtering

**Leaderboard sorting:**
- Default: by points descending
- Support `sortBy=name|points|level`
- Support `order=asc|desc`

**Goals filtering:**
- By status: `status=active|completed|paused|abandoned`
- By category: `category=academic|skill|personal|career`
- By priority: `priority=high|medium|low`

## Webhooks/Events

Consider implementing webhooks for real-time updates:
- `gamification.points.earned`
- `gamification.badge.unlocked`
- `gamification.achievement.unlocked`
- `goals.created`
- `goals.updated`
- `goals.completed`
- `goals.milestone.completed`

## Notes for Backend Implementation

1. **Permissions**: Ensure parents can only access their children's data
2. **Validation**: Validate all dates, ensure target dates are in the future
3. **Atomicity**: Use transactions for operations that update multiple records
4. **Denormalization**: Consider caching leaderboard positions for performance
5. **Background Jobs**: Calculate streaks and update leaderboards asynchronously
6. **Notifications**: Trigger push notifications on achievements and milestones
7. **Analytics**: Log events for gamification and goals for analytics purposes
8. **Data Retention**: Define policies for completed goals and old achievements
