# Peer Tutoring Platform - Quick Start Guide

## Access Points

### Students

- URL: `/student/peer-tutoring`
- Available tabs:
  1. **Find Tutors** - Search and book sessions
  2. **Active Session** - Join ongoing session
  3. **Learning History** - View past sessions and progress

### Teachers/Tutors

- URL: `/teacher/peer-tutoring`
- Available tabs:
  1. **Find Tutors** - Browse marketplace
  2. **My Dashboard** - View statistics and manage sessions
  3. **Active Session** - Conduct tutoring sessions
  4. **Learning History** - Track teaching history

## Quick Actions

### Book a Session

1. Go to "Find Tutors" tab
2. Search by name or subject
3. Click "View Profile" for details
4. Click "Book Now"
5. Fill in:
   - Subject
   - Topic
   - Date & Time
   - Duration
   - Meeting Platform (Zoom/Google Meet)
6. Submit booking

### Join a Session

1. Go to "Active Session" tab
2. Session opens automatically at scheduled time
3. Use controls:
   - 🎥 Toggle video
   - 🎤 Toggle audio
   - 🖥️ Share screen
   - ✏️ Show/hide whiteboard
   - 💬 Toggle chat
   - 📞 End session

### Provide Feedback

1. End session using red phone button
2. Rate session (1-5 stars)
3. Rate specific aspects:
   - Knowledge
   - Communication
   - Punctuality
4. Add written feedback
5. Submit

### View Learning Progress

1. Go to "Learning History" tab
2. Switch between tabs:
   - All Sessions
   - Upcoming
   - Completed
   - Progress by Subject
3. View charts and statistics

## Features at a Glance

### Search & Filters

- Text search (name, subject, keywords)
- Subject filter (multiple selection)
- Minimum rating slider
- Clear filters button

### Tutor Card Info

- Profile photo with verified badge
- Name and grade
- Rating and review count
- Subjects taught (with "show more")
- Session statistics
- Achievement badges
- Availability status
- Action buttons (View Profile, Book)

### Session Interface

- Video chat area
- Control buttons:
  - Video on/off
  - Audio on/off
  - Screen share
  - Whiteboard toggle
  - Chat toggle
  - End session
- Whiteboard tools:
  - Draw with mouse
  - Clear canvas
  - Save whiteboard
- Session notes field
- Real-time chat panel

### Dashboard Metrics (Tutors)

- Total sessions & hours
- Average rating
- Upcoming sessions count
- Retention & cancellation rates
- Earnings (optional)
- Charts:
  - Rating trend
  - Sessions by subject
  - Student satisfaction
  - Peak hours

### Learning History (Students)

- Summary cards:
  - Total sessions
  - Total hours
  - Average rating
  - Subjects learning
- Session cards with:
  - Tutor info
  - Subject & topic
  - Date & duration
  - Status
  - Session notes
  - Shared materials
  - Recording link
  - Feedback button
- Progress cards per subject:
  - Session count
  - Hours spent
  - Rating
  - Topics covered
  - Improvement score

## API Structure

### Base URL

All endpoints use: `/api/peer-tutoring/`

### Key Endpoints

- `GET /tutors` - List tutors
- `GET /tutors/:id` - Get tutor profile
- `POST /sessions` - Book session
- `GET /sessions/:id` - Get session
- `POST /sessions/:id/start` - Start session
- `POST /sessions/:id/end` - End session
- `POST /sessions/:id/feedback` - Submit feedback
- `GET /tutor/stats` - Tutor statistics
- `GET /tutor/sessions/upcoming` - Upcoming sessions
- `GET /student/sessions` - Student sessions
- `GET /student/progress` - Learning progress

## Component Hierarchy

```
PeerTutoringMarketplace (Main Page)
├── TutorCard (Repeated for each tutor)
├── TutorProfileModal (Dialog)
├── BookingModal (Dialog)
├── TutoringSessionInterface
│   ├── Video Area
│   ├── Control Buttons
│   ├── Whiteboard Canvas
│   ├── Chat Panel
│   └── Feedback Dialog
├── TutorDashboard
│   ├── Stat Cards
│   ├── Upcoming Sessions List
│   ├── Charts (Line, Bar, Doughnut)
│   └── Performance Metrics
└── StudentLearningHistory
    ├── Summary Cards
    ├── Session Cards
    ├── Progress Cards
    └── Charts
```

## Status Indicators

### Session Status

- 🔵 **scheduled** - Session is booked
- 🟢 **in_progress** - Session is active
- ✅ **completed** - Session finished
- 🔴 **cancelled** - Session was cancelled

### Availability Status

- ✅ Available - Can book now
- ❌ Unavailable - Currently not accepting bookings

### Verification Badge

- ✓ Blue checkmark - Verified tutor

## Tips

1. **For Best Results**:
   - Book sessions at least 24 hours in advance
   - Test your video/audio before joining
   - Prepare topics and questions beforehand
   - Use whiteboard for visual explanations
   - Save important whiteboard drawings
   - Take notes during the session

2. **Performance**:
   - Charts lazy-load on tab switch
   - Session history paginated automatically
   - Whiteboard saves to server periodically

3. **Accessibility**:
   - All controls have keyboard shortcuts
   - Screen reader compatible
   - High contrast mode supported
   - Minimum 44px touch targets

## Troubleshooting

### Video Not Working

- Check browser permissions
- Use external meeting link (Zoom/Meet)
- Refresh page and rejoin

### Whiteboard Not Saving

- Ensure stable internet connection
- Manually click "Save" button
- Check console for errors

### Session Not Starting

- Verify scheduled time is correct
- Check session status
- Contact tutor directly

### Can't Find Tutors

- Clear all filters
- Try broader search terms
- Check subject selection

## Next Steps

After implementing backend:

1. Configure Zoom/Google Meet API keys
2. Set up WebRTC server for video
3. Implement WebSocket for real-time chat
4. Add payment gateway integration
5. Configure notification service
6. Set up recording storage (S3/cloud)
7. Add email confirmations
8. Implement calendar sync
