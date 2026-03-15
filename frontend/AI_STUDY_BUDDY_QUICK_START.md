# AI Study Buddy - Quick Start Guide

## Accessing the Feature

### Desktop

1. Log in as a student
2. Click "AI Study Buddy" in the left sidebar (with NEW badge)
3. The interface loads with three main sections

### Mobile

1. Log in as a student
2. Tap "AI Buddy" in the bottom navigation bar
3. Scroll through the stacked layout

## Route

```
/student/study-buddy
```

## Interface Sections

### 1. Daily Briefing (Left Column)

**What it shows:**

- Morning/Afternoon/Evening greeting
- Today's date
- Motivational quote
- Schedule preview (next 4 items)
- Focus areas (weak topics)
- Exam readiness scores

**How to use:**

- Review at start of day for overview
- Check exam readiness percentages
- Identify which subjects need attention
- View upcoming classes/exams/assignments

### 2. Chat Interface (Center Column)

**What it shows:**

- Bot messages with SmartToy avatar
- User messages with Person avatar
- Timestamps for each message
- Voice input indicator when listening

**How to use:**

- Type questions in the text field
- Press Enter or click Send button
- Click Microphone icon for voice input (if supported)
- Ask about:
  - Study schedule
  - Weak topics
  - Exam readiness
  - Study tips
  - Motivation

**Sample Questions:**

```
"Help me with my weak topics"
"Am I ready for the exam?"
"I'm feeling tired"
"Create a study plan for integration"
```

### 3. Study Plan (Right Column)

**What it shows:**

- Progress bar (completed/total minutes)
- Productivity percentage
- List of study tasks with:
  - Task emoji (📖 📚 ✍️ 📝)
  - Subject and duration
  - Time slot
  - Priority indicator (color dot)
  - Checkbox for completion
  - Start button

**How to use:**

- Check off tasks as you complete them
- Click Start button to begin a task (triggers timer message)
- Watch progress bar fill as you complete tasks
- Earn achievements for milestones:
  - First task: "First Step! 🎯" (+10 points)
  - All tasks: "Task Master! 🏆" (+50 points)

### 4. Mood Check-In (Left Column, below Briefing)

**What it shows:**

- 6 mood emoji options:
  - 😰 Stressed
  - 😴 Tired
  - 😕 Confused
  - 😐 Neutral
  - 😊 Happy
  - 🤩 Excited

**How to use:**

1. Click "How are you feeling today?" card
2. Select your current mood emoji
3. (Optional) Adjust energy level slider
4. (Optional) Adjust focus level slider
5. (Optional) Add notes
6. Click "Submit Check-in"
7. Bot responds with personalized message
8. Study plan adjusts based on energy/focus levels

### 5. Weekly Review (Bottom, Full Width)

**What it shows:**

- Week date range
- Total study hours
- 4 stat cards:
  - Day Streak 🔥
  - Achievements 🏆
  - Top Subjects ⭐
  - Avg Hours/Day ⏱️
- Study hours trend chart (7-day line graph)
- Performance delta by subject with trend arrows
- Top performing subjects (green chips)
- Areas to improve (orange chips)

**How to use:**

- Review at end of week
- Compare daily study hours in chart
- Track performance changes
- Celebrate achievements and streaks
- Identify subjects needing more attention

## Achievement System

### When Achievements Trigger:

1. **First Task Completion**: Complete your first study task of the day
2. **All Tasks Completion**: Complete all scheduled tasks for the day

### Achievement Notification:

- Confetti animation covers screen
- Floating notification appears bottom-right
- Shows: Title, Description, Points earned
- Auto-dismisses after 5 seconds
- Confetti stops after 5 seconds

## Voice Input

### Browser Support:

- Chrome/Edge: ✅ Fully supported
- Safari: ✅ Supported (webkit prefix)
- Firefox: ❌ Not supported

### How to Use:

1. Click microphone icon
2. Speak your question/message
3. Real-time transcript appears as chip
4. Click microphone again to stop
5. Message auto-populates in text field
6. Click Send or press Enter

### Visual Indicators:

- Microphone icon turns red when listening
- Background becomes light red
- Transcript chip shows with pulsing animation
- MicOff icon displayed while recording

## Chat Bot Responses

### Bot understands:

- **Help requests**: "help", "how can you help"
  - Lists all capabilities
- **Weak topics**: "weak", "struggle", "difficult"
  - Analyzes your weak topics
  - Suggests focused study plans
- **Exam readiness**: "ready", "exam", "prepared"
  - Shows readiness percentages
  - Recommends practice areas
- **Motivation**: "motivate", "tired", "stressed"
  - Provides encouragement
  - Highlights achievements
  - Suggests breaks

### Bot features:

- Friendly, supportive tone
- Personalized responses
- Study recommendations
- Performance insights
- Motivational messages

## Mock Data (Current Implementation)

### Daily Briefing:

- 4 schedule items (Math, Physics, Chemistry, English)
- 3 weak topics with trends
- 3 exam readiness scores (85%, 72%, 68%)
- Motivational quote

### Study Plan:

- 4 tasks totaling 180 minutes
- Mix of high/medium priority
- Various task types
- 85% productivity score

### Weekly Review:

- 24.5 total study hours
- 12-day streak
- 5 achievements earned
- 4 subjects tracked
- 7-day session history

## Tips for Best Experience

1. **Start Your Day**: Check Daily Briefing first thing
2. **Check Mood**: Submit mood check-in to get personalized recommendations
3. **Follow Study Plan**: Complete tasks in order for best flow
4. **Use Voice Input**: Hands-free while studying
5. **Chat Regularly**: Ask questions as they arise
6. **Review Weekly**: End of week review for insights
7. **Celebrate Achievements**: Watch for confetti celebrations!

## Component Integration

### With Other Features:

- **Pomodoro Timer**: Start Task → triggers timer message
- **Gamification**: Achievement points integrate with rewards system
- **Calendar**: Schedule items link to calendar events
- **Analytics**: Performance data feeds into analytics dashboard

## Customization (Future)

The current implementation uses mock data. Future versions will:

- Pull real schedule from calendar
- Calculate actual weak topics from grades
- Generate personalized study plans with AI
- Track real mood history
- Provide AI-powered chat responses
- Sync achievements with gamification system
