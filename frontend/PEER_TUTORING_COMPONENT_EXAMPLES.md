# Peer Tutoring Components - Usage Examples

## TutorProfileModal

Display detailed tutor information in a modal dialog.

```tsx
import { TutorProfileModal } from '@/components/peerTutoring';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>View Profile</Button>

      {selectedTutor && (
        <TutorProfileModal
          tutor={selectedTutor}
          open={open}
          onClose={() => setOpen(false)}
          onBook={() => {
            setOpen(false);
            // Handle booking
          }}
        />
      )}
    </>
  );
}
```

## BookingModal

Allow users to book a tutoring session with calendar integration.

```tsx
import { BookingModal } from '@/components/peerTutoring';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [tutor, setTutor] = useState<Tutor | null>(null);

  const handleBookingComplete = (session: TutoringSession) => {
    console.log('Session booked:', session);
    setOpen(false);
    // Navigate to session or show confirmation
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Book Session</Button>

      {tutor && (
        <BookingModal
          tutor={tutor}
          open={open}
          onClose={() => setOpen(false)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </>
  );
}
```

## TutoringSessionInterface

Full-featured session interface with video, whiteboard, and chat.

```tsx
import { TutoringSessionInterface } from '@/components/peerTutoring';

function MyComponent() {
  const [session, setSession] = useState<TutoringSession | null>(null);

  const handleComplete = () => {
    console.log('Session completed');
    setSession(null);
    // Navigate back or refresh data
  };

  return session ? (
    <TutoringSessionInterface session={session} onComplete={handleComplete} />
  ) : (
    <div>No active session</div>
  );
}
```

## TutorDashboard

Display tutor statistics and upcoming sessions.

```tsx
import { TutorDashboard } from '@/components/peerTutoring';

function TutorPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Tutoring Dashboard
      </Typography>
      <TutorDashboard />
    </Box>
  );
}
```

## StudentLearningHistory

Show student's learning history and progress.

```tsx
import { StudentLearningHistory } from '@/components/peerTutoring';

function StudentProgressPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Learning Journey
      </Typography>
      <StudentLearningHistory />
    </Box>
  );
}
```

## PeerTutoringMarketplace

Main marketplace page (already integrated in App.tsx).

```tsx
import PeerTutoringMarketplace from '@/pages/PeerTutoringMarketplace';

// In your routing:
<Route path="/peer-tutoring" element={<PeerTutoringMarketplace />} />;
```

## Custom Integration Examples

### Example 1: Embedding Tutor Cards

```tsx
import { useState, useEffect } from 'react';
import { peerTutoringApi, Tutor } from '@/api/peerTutoring';
import { Card, CardContent, Avatar, Rating, Button } from '@mui/material';

function TutorListWidget() {
  const [tutors, setTutors] = useState<Tutor[]>([]);

  useEffect(() => {
    peerTutoringApi.getTutors({ subjects: ['Mathematics'] }).then(setTutors);
  }, []);

  return (
    <div>
      {tutors.map((tutor) => (
        <Card key={tutor.id}>
          <CardContent>
            <Avatar src={tutor.photo_url}>{tutor.name[0]}</Avatar>
            <h3>{tutor.name}</h3>
            <Rating value={tutor.rating} readOnly />
            <p>{tutor.sessions_completed} sessions</p>
            <Button variant="contained">Book Now</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Example 2: Mini Session Widget

```tsx
import { useState } from 'react';
import { peerTutoringApi } from '@/api/peerTutoring';
import { Box, Typography, Button, Chip } from '@mui/material';

function UpcomingSessionWidget() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    peerTutoringApi.getTutorUpcomingSessions().then((data) => setSessions(data.slice(0, 3)));
  }, []);

  return (
    <Box>
      <Typography variant="h6">Upcoming Sessions</Typography>
      {sessions.map((session) => (
        <Box key={session.id} sx={{ p: 2, mb: 1, border: 1 }}>
          <Typography>{session.student_name}</Typography>
          <Chip label={session.subject} size="small" />
          <Typography variant="caption">
            {new Date(session.scheduled_at).toLocaleString()}
          </Typography>
          <Button size="small" href={session.meeting_link}>
            Join
          </Button>
        </Box>
      ))}
    </Box>
  );
}
```

### Example 3: Simple Booking Form

```tsx
import { useState } from 'react';
import { peerTutoringApi } from '@/api/peerTutoring';
import { TextField, Button, Select, MenuItem } from '@mui/material';

function QuickBookingForm({ tutorId }: { tutorId: string }) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async () => {
    const session = await peerTutoringApi.bookSession({
      tutor_id: tutorId,
      subject,
      topic,
      scheduled_at: new Date(date).toISOString(),
      duration_minutes: 60,
      meeting_platform: 'zoom',
    });
    console.log('Booked:', session);
  };

  return (
    <form>
      <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
        <MenuItem value="Math">Mathematics</MenuItem>
        <MenuItem value="Physics">Physics</MenuItem>
      </Select>
      <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <TextField type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button onClick={handleSubmit}>Book Session</Button>
    </form>
  );
}
```

### Example 4: Rating Display

```tsx
import { Rating, Typography, Box } from '@mui/material';

function TutorRatingDisplay({ rating, totalReviews }: { rating: number; totalReviews: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Rating value={rating} precision={0.1} readOnly size="small" />
      <Typography variant="body2" fontWeight={600}>
        {rating.toFixed(1)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        ({totalReviews} reviews)
      </Typography>
    </Box>
  );
}
```

### Example 5: Progress Card

```tsx
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';
import { LearningProgress } from '@/api/peerTutoring';

function SubjectProgressCard({ progress }: { progress: LearningProgress }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{progress.subject}</Typography>
        <Box sx={{ my: 2 }}>
          <Typography variant="h3" color="primary">
            {progress.total_sessions}
          </Typography>
          <Typography variant="caption">Sessions Completed</Typography>
        </Box>
        <Box>
          <Typography variant="body2">
            Average Rating: {progress.average_rating.toFixed(1)}/5
          </Typography>
          <LinearProgress variant="determinate" value={(progress.average_rating / 5) * 100} />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {progress.topics_covered.length} topics covered
        </Typography>
      </CardContent>
    </Card>
  );
}
```

### Example 6: Session Status Badge

```tsx
import { Chip } from '@mui/material';
import { CheckCircle, Cancel, Schedule } from '@mui/icons-material';

function SessionStatusBadge({ status }: { status: string }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { icon: <CheckCircle />, color: 'success', label: 'Completed' };
      case 'cancelled':
        return { icon: <Cancel />, color: 'error', label: 'Cancelled' };
      case 'scheduled':
        return { icon: <Schedule />, color: 'info', label: 'Scheduled' };
      default:
        return { icon: null, color: 'default', label: status };
    }
  };

  const config = getStatusConfig();

  return <Chip icon={config.icon} label={config.label} color={config.color as any} size="small" />;
}
```

### Example 7: API Usage Patterns

```tsx
// Fetch tutors with filters
const tutors = await peerTutoringApi.getTutors({
  subjects: ['Mathematics', 'Physics'],
  min_rating: 4.0,
});

// Get detailed profile
const profile = await peerTutoringApi.getTutorProfile('tutor-id-123');

// Book a session
const session = await peerTutoringApi.bookSession({
  tutor_id: 'tutor-id-123',
  subject: 'Mathematics',
  topic: 'Calculus',
  scheduled_at: new Date('2024-03-20T10:00:00').toISOString(),
  duration_minutes: 60,
  meeting_platform: 'zoom',
});

// Start session
await peerTutoringApi.startSession(session.id);

// Submit feedback
await peerTutoringApi.submitFeedback(session.id, {
  rating: 5,
  comment: 'Excellent session!',
  was_helpful: true,
  tutor_knowledge: 5,
  communication_skills: 5,
  punctuality: 5,
  would_recommend: true,
});

// Get student sessions
const sessions = await peerTutoringApi.getStudentSessions('completed');

// Get learning progress
const progress = await peerTutoringApi.getStudentLearningProgress();
```

## Props Reference

### TutorProfileModal Props

```typescript
{
  tutor: Tutor;           // Required: Tutor object
  open: boolean;          // Required: Dialog open state
  onClose: () => void;    // Required: Close handler
  onBook: () => void;     // Required: Book button handler
}
```

### BookingModal Props

```typescript
{
  tutor: Tutor;                               // Required: Tutor object
  open: boolean;                              // Required: Dialog open state
  onClose: () => void;                        // Required: Close handler
  onBookingComplete: (session: TutoringSession) => void;  // Required: Success handler
}
```

### TutoringSessionInterface Props

```typescript
{
  session: TutoringSession;  // Required: Active session object
  onComplete: () => void;     // Required: Completion handler
}
```

### TutorDashboard Props

```typescript
// No props - self-contained component
{
}
```

### StudentLearningHistory Props

```typescript
// No props - self-contained component
{
}
```

## Styling Customization

All components use Material-UI's theming system. Customize by wrapping in ThemeProvider:

```tsx
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <PeerTutoringMarketplace />
    </ThemeProvider>
  );
}
```

## Event Handling

Components emit events through callback props:

```tsx
<BookingModal
  tutor={tutor}
  open={open}
  onClose={() => {
    console.log('Modal closed');
    setOpen(false);
  }}
  onBookingComplete={(session) => {
    console.log('Booking completed:', session);
    // Show success message
    // Navigate to session
    // Update state
  }}
/>
```

## Error Handling

Components handle errors internally but you can catch them:

```tsx
try {
  const session = await peerTutoringApi.bookSession(bookingData);
  console.log('Success:', session);
} catch (error) {
  console.error('Booking failed:', error);
  // Show error message to user
}
```

## Testing Examples

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorProfileModal } from '@/components/peerTutoring';

test('renders tutor name', () => {
  const tutor = {
    id: '1',
    name: 'John Doe',
    rating: 4.5,
    // ... other required fields
  };

  render(<TutorProfileModal tutor={tutor} open={true} onClose={jest.fn()} onBook={jest.fn()} />);

  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

## Best Practices

1. **Always handle loading states**:

```tsx
const [loading, setLoading] = useState(true);
const [tutors, setTutors] = useState<Tutor[]>([]);

useEffect(() => {
  setLoading(true);
  peerTutoringApi
    .getTutors()
    .then(setTutors)
    .finally(() => setLoading(false));
}, []);
```

2. **Show error messages to users**:

```tsx
const [error, setError] = useState<string | null>(null);

try {
  await peerTutoringApi.bookSession(data);
} catch (err) {
  setError('Failed to book session. Please try again.');
}
```

3. **Clean up resources**:

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    // Refresh data
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

4. **Use proper TypeScript types**:

```tsx
import { Tutor, TutoringSession } from '@/api/peerTutoring';

const [tutor, setTutor] = useState<Tutor | null>(null);
const [session, setSession] = useState<TutoringSession | null>(null);
```
