# Peer Tutoring Marketplace

## Overview

The Peer Tutoring Marketplace is a comprehensive platform that connects students seeking academic help with qualified peer tutors. It features intelligent matching algorithms, gamification elements, reputation systems, and robust moderation tools to ensure quality and safety.

## Key Features

### 1. Tutor Profile Management
- **Comprehensive Profiles**: Tutors create detailed profiles including subjects, expertise levels, availability, and teaching style
- **Verification System**: Background checks and verification status for enhanced trust
- **Rich Media**: Profile photos and video introductions
- **Multi-subject Support**: Tutors can teach multiple subjects with varying expertise levels
- **Flexible Availability**: JSON-based availability scheduling

### 2. Intelligent Matching Algorithm
The matching system scores tutors based on multiple factors:
- **Subject Expertise** (40% weight): Matches student needs with tutor subject knowledge
- **Availability** (25% weight): Considers preferred time slots and scheduling flexibility
- **Rating Score** (25% weight): Incorporates average rating and review count
- **Compatibility** (10% weight): Factors in language preferences, learning styles, and previous interactions

### 3. Session Management
- **Multiple Session Types**: One-on-one, group sessions, and workshops
- **Video Integration**: Supports various video platforms with meeting links and credentials
- **Session Recording**: Optional recording capabilities with URL storage
- **Real-time Tracking**: Start time, end time, and duration tracking
- **Materials Sharing**: JSON-based storage for shared resources

### 4. Gamification System

#### Points System
- Base points per session: 10 points
- Duration bonuses: 1 point per 15 minutes
- Quality bonuses:
  - Materials shared: +5 points
  - Tutor notes provided: +3 points
- Automatic level calculation: Level = (Total Points / 100) + 1

#### Badges
Automatically awarded based on achievements:
- **Session Count Badges**:
  - First 10 Sessions (50 points, common)
  - Experienced Tutor - 50 sessions (200 points, rare)
  - Master Tutor - 100 sessions (500 points, epic)
- **Rating Badges**:
  - Excellence Award - 4.5+ rating with 10+ reviews (300 points, epic)
- **Streak Badges**:
  - Weekly Warrior - 7-day session streak (100 points, rare)

#### Leaderboard
Three time periods: weekly, monthly, yearly
Score calculation:
```
Score = Total Points + (Sessions × 10) + (Hours Tutored × 5) + (Average Rating × 20)
```

### 5. Reputation System

#### Student Reviews
Multi-dimensional ratings:
- Overall rating (1-5 stars)
- Knowledge rating
- Communication rating
- Patience rating
- Helpfulness rating
- Punctuality rating
- Text review
- Anonymous option available

#### Teacher Endorsements
Teachers can endorse tutors with:
- Weighted endorsements (teacher endorsements worth 3x regular endorsements)
- Subject-specific endorsements
- Verification status
- Multiple endorsement types:
  - Subject expertise
  - Teaching quality
  - Communication skills
  - Reliability
  - Patience

### 6. Moderation Tools

#### Automated Flagging
Sessions can be automatically flagged based on:
- Quality scores
- Safety scores
- Report patterns

#### Moderation Actions
- Warning
- Session review
- Temporary suspension
- Permanent suspension
- Cleared status

#### Moderation Logs
Track all moderation activities with:
- Moderator information
- Action type and reason
- Quality and safety scores
- Resolution tracking
- Detailed notes

### 7. Incentive Program

#### Service Hours
- Tracked automatically based on completed sessions
- Award at 20+ hours milestone
- Accumulates over time

#### Certificates
Eligibility criteria:
- 50+ completed sessions
- 4.0+ average rating
- Outstanding Peer Tutor Certificate of Excellence

#### Priority Course Registration
- Available to top 5 tutors monthly
- 180-day validity period
- Based on leaderboard ranking

#### Recognition Programs
- Scholarship opportunities
- Special recognition status
- Custom metadata support

### 8. Matching Preferences

Students can customize matching with:
- Preferred subjects
- Preferred tutors list
- Blocked tutors list
- Learning style preferences
- Preferred session duration
- Preferred time slots
- Language preferences
- Special requirements
- Auto-match toggle

## API Endpoints

### Tutor Management
- `POST /api/v1/peer-tutoring/tutors` - Create tutor profile
- `GET /api/v1/peer-tutoring/tutors` - List all tutors (with filters)
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}` - Get tutor details
- `GET /api/v1/peer-tutoring/tutors/user/{user_id}` - Get tutor by user
- `PUT /api/v1/peer-tutoring/tutors/{tutor_id}` - Update tutor profile
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}/stats` - Get tutor statistics

### Session Management
- `POST /api/v1/peer-tutoring/sessions` - Create session
- `GET /api/v1/peer-tutoring/sessions` - List sessions (with filters)
- `GET /api/v1/peer-tutoring/sessions/{session_id}` - Get session details
- `PUT /api/v1/peer-tutoring/sessions/{session_id}` - Update session
- `POST /api/v1/peer-tutoring/sessions/{session_id}/start` - Start session
- `POST /api/v1/peer-tutoring/sessions/{session_id}/complete` - Complete session
- `POST /api/v1/peer-tutoring/sessions/{session_id}/cancel` - Cancel session
- `POST /api/v1/peer-tutoring/sessions/{session_id}/flag` - Flag session
- `GET /api/v1/peer-tutoring/sessions/{session_id}/participants` - Get participants

### Reviews & Endorsements
- `POST /api/v1/peer-tutoring/reviews` - Create review
- `GET /api/v1/peer-tutoring/reviews` - List reviews
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}/reviews` - Get tutor reviews
- `POST /api/v1/peer-tutoring/endorsements` - Create endorsement
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}/endorsements` - Get endorsements

### Gamification
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}/badges` - Get tutor badges
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}/incentives` - Get incentives
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}/points-history` - Get points history
- `GET /api/v1/peer-tutoring/tutors/{tutor_id}/incentive-eligibility` - Check eligibility
- `POST /api/v1/peer-tutoring/incentives/{incentive_id}/redeem` - Redeem incentive

### Leaderboard
- `GET /api/v1/peer-tutoring/leaderboard` - Get leaderboard (weekly/monthly/yearly)
- `POST /api/v1/peer-tutoring/leaderboard/update` - Update leaderboard

### Matching System
- `POST /api/v1/peer-tutoring/matching-preferences` - Create preferences
- `GET /api/v1/peer-tutoring/matching-preferences/{student_id}` - Get preferences
- `PUT /api/v1/peer-tutoring/matching-preferences/{preference_id}` - Update preferences
- `POST /api/v1/peer-tutoring/match` - Find matching tutors

### Moderation
- `POST /api/v1/peer-tutoring/moderation` - Create moderation log
- `GET /api/v1/peer-tutoring/moderation` - List moderation logs
- `PUT /api/v1/peer-tutoring/moderation/{log_id}/resolve` - Resolve moderation issue

## Database Models

### Core Models
1. **TutorProfile** - Main tutor information and statistics
2. **TutoringSession** - Individual tutoring sessions
3. **SessionParticipant** - Group session participants
4. **TutorReview** - Student reviews and ratings
5. **TutorEndorsement** - Teacher and peer endorsements
6. **TutorBadge** - Achievement badges
7. **TutorIncentive** - Rewards and incentives
8. **TutorPointHistory** - Points transaction log
9. **SessionModerationLog** - Moderation activities
10. **TutorLeaderboard** - Ranking and scores
11. **MatchingPreference** - Student matching preferences

### Enumerations
- TutorStatus: pending, active, inactive, suspended
- SessionStatus: scheduled, in_progress, completed, cancelled, no_show
- SessionType: one_on_one, group, workshop
- ReviewStatus: pending, approved, flagged, removed
- EndorsementType: subject_expertise, teaching_quality, communication, reliability, patience
- IncentiveType: service_hours, certificate, priority_registration, scholarship, recognition
- BadgeCategory: session_count, rating, subject_mastery, streak, student_impact, special
- ModerationActionType: warning, session_review, temporary_suspension, permanent_suspension, cleared

## Usage Examples

### Creating a Tutor Profile
```python
tutor_data = TutorProfileCreate(
    user_id=123,
    student_id=456,
    bio="Passionate about mathematics and helping peers succeed",
    subjects={
        "1": {"level": 9, "sessions": 0},  # Math
        "3": {"level": 8, "sessions": 0}   # Physics
    },
    availability={
        "monday": ["14:00-16:00", "18:00-20:00"],
        "wednesday": ["14:00-16:00"],
        "friday": ["16:00-19:00"]
    },
    languages=["English", "Spanish"],
    accepts_group_sessions=True,
    max_students_per_session=3
)
```

### Finding Matching Tutors
```python
match_request = TutorMatchRequest(
    student_id=789,
    subject_id=1,
    preferred_time=datetime(2024, 1, 15, 15, 0),
    session_duration=60,
    session_type=SessionType.ONE_ON_ONE
)
```

### Creating a Review
```python
review_data = TutorReviewCreate(
    session_id=101,
    rating=5,
    review_text="Excellent tutor! Very patient and knowledgeable.",
    knowledge_rating=5,
    communication_rating=5,
    patience_rating=5,
    helpfulness_rating=5,
    punctuality_rating=5,
    is_anonymous=False
)
```

## Security & Safety

1. **Verification**: Background checks for tutors
2. **Moderation**: Automated and manual moderation tools
3. **Privacy**: Anonymous review options
4. **Reporting**: Session flagging capabilities
5. **Access Control**: Institution-based data isolation
6. **Review Moderation**: Teacher/admin review of student feedback

## Performance Considerations

1. **Indexed Fields**: All frequently queried fields are indexed
2. **JSON Storage**: Flexible JSON fields for subjects and availability
3. **Caching**: Leaderboard caching recommended for large institutions
4. **Batch Operations**: Bulk updates for leaderboard generation
5. **Query Optimization**: Joins optimized for common query patterns

## Future Enhancements

1. Real-time chat integration
2. AI-powered session recommendations
3. Automated session scheduling
4. Mobile app notifications
5. Advanced analytics dashboard
6. Parent/guardian monitoring tools
7. Integration with learning management systems
8. Peer tutor training modules
