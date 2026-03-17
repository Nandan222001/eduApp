# Virtual Olympics - Quick Start Guide

## For Developers

### File Locations

**API**: `frontend/src/api/olympics.ts`
**Components**: `frontend/src/components/olympics/`
**Pages**:

- `frontend/src/pages/VirtualOlympics.tsx`
- `frontend/src/pages/OlympicsDetailPage.tsx`
- `frontend/src/pages/OlympicsCompetitionPage.tsx`

### Routes

- `/student/olympics` - Main hub
- `/student/olympics/:competitionId` - Competition details
- `/student/olympics/event/:eventId` - Active participation

### Key Components

#### LiveLeaderboard

```tsx
import { LiveLeaderboard } from '@/components/olympics';

<LiveLeaderboard competitionId={123} currentUserId={456} />;
```

#### CompetitionCard

```tsx
import { CompetitionCard } from '@/components/olympics';

<CompetitionCard
  competition={competitionData}
  onViewDetails={(id) => navigate(`/olympics/${id}`)}
/>;
```

#### TeamFormation

```tsx
import { TeamFormation } from '@/components/olympics';

<TeamFormation
  competitionId={123}
  teamSize={4}
  currentTeam={teamData}
  onTeamCreated={(team) => handleTeamCreated(team)}
  onTeamJoined={(team) => handleTeamJoined(team)}
/>;
```

#### PrizeShowcase

```tsx
import { PrizeShowcase } from '@/components/olympics';

<PrizeShowcase prizes={prizesList} />;
```

## For Users

### How to Participate

1. **Navigate to Olympics**
   - Click "Virtual Olympics" in sidebar
   - Or go to `/student/olympics`

2. **Browse Competitions**
   - View Upcoming, Active, or Past competitions
   - Click on a competition card to see details

3. **Join a Competition**
   - For individual: Just click "Join Now"
   - For team: Create or join a team first

4. **Create a Team**
   - Click "Create New Team"
   - Enter team name
   - Select teammates
   - Share team code with others

5. **Join a Team**
   - Click "Join Existing Team"
   - Enter team code from captain
   - Confirm to join

6. **Participate in Events**
   - Click "Start Event" when active
   - Answer questions within time limit
   - Submit and move to next question
   - View results after completion

7. **Track Progress**
   - Check live leaderboard for rankings
   - See your rank and rank changes
   - View team contributions
   - Check prizes you can win

## Features at a Glance

### Competition Types

- **Individual**: Compete solo
- **Team**: Form teams and compete together
- **School**: School vs school competition

### Event Types

- **Quiz**: Timed multiple choice questions
- **Challenge**: Special problem-solving tasks
- **Project**: Long-form submissions

### Question Types

- Multiple Choice (MCQ)
- True/False
- Short Answer

### Leaderboards

- **School Rankings**: Compare schools
- **Individual Rankings**: Top students
- **Team Rankings**: Best teams

### Prizes

- Trophies
- Medals (Gold, Silver, Bronze)
- Certificates
- Rewards and recognition

## WebSocket Events

### Client → Server

```typescript
socket.emit('join_competition', { competition_id: 123 });
socket.emit('leave_competition', { competition_id: 123 });
```

### Server → Client

```typescript
socket.on('leaderboard_update', (data) => {
  // data.type: 'school' | 'individual' | 'team'
  // data.rankings: Array of ranking objects
  // data.updated_at: Timestamp
});
```

## Common Customizations

### Change Timer Warning Threshold

In `OlympicsCompetitionPage.tsx`:

```tsx
<Typography color={timeRemaining < 60 ? 'error' : 'primary'}>
  {formatTime(timeRemaining)}
</Typography>
```

### Customize Rank Colors

In `LiveLeaderboard.tsx`:

```tsx
const getRankColor = (rank: number): string => {
  if (rank === 1) return '#FFD700'; // Gold
  if (rank === 2) return '#C0C0C0'; // Silver
  if (rank === 3) return '#CD7F32'; // Bronze
  return 'inherit';
};
```

### Add More Question Types

In `OlympicsCompetitionPage.tsx`, add new question type rendering:

```tsx
{currentQuestion.question_type === 'new_type' && (
  // Your custom question UI
)}
```

## Troubleshooting

### Leaderboard not updating

- Check WebSocket connection in browser console
- Verify VITE_WS_URL environment variable
- Ensure backend WebSocket server is running

### Questions not loading

- Check API endpoint responses
- Verify authentication token
- Check browser console for errors

### Team code not working

- Ensure team code is 6 characters
- Check if team is full
- Verify competition allows teams

## Environment Variables

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8000
```

## Backend Requirements

### Database Models Needed

- Competition
- CompetitionEvent
- Team
- TeamMember
- ParticipationSession
- Question
- Answer
- Prize
- Certificate
- Ranking (School, Individual, Team)

### Required Endpoints

See `frontend/src/api/olympics.ts` for complete list

### WebSocket Server

- Join/leave competition rooms
- Broadcast leaderboard updates
- Handle real-time scoring
