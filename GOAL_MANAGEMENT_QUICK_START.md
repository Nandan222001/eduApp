# Goal Management - Quick Start Guide

## Installation

No additional dependencies needed - all required packages are already in the project.

## Database Setup

The goal models already exist in the database. No migrations needed unless the schema was modified.

```bash
# If needed, run migrations
alembic upgrade head
```

## Backend Setup

The API endpoints are automatically registered. Restart the backend server:

```bash
# Start backend
uvicorn src.main:app --reload
```

## Frontend Setup

No additional setup needed. Start the development server:

```bash
# Navigate to frontend directory
cd frontend

# Start development server
npm run dev
```

## Access the Feature

1. **Login** to the application
2. **Navigate** to Goals from the sidebar menu
3. **Create** your first goal using the "Create Goal" button

## Creating Your First Goal

### Step 1: Basic Information
- Enter a descriptive title
- Provide detailed description
- Select goal type (Performance/Behavioral/Skill)
- Set start and target dates

### Step 2: SMART Criteria
Fill in each section:
- **Specific**: What exactly do you want to accomplish?
- **Measurable**: How will you measure progress?
- **Achievable**: Is this realistic? What resources do you need?
- **Relevant**: Why is this important?
- **Time-Bound**: When will you achieve this?

### Step 3: Milestones (Optional)
- Click "Add Milestone"
- Enter milestone title
- Add description
- Set target date
- Add more milestones as needed

### Step 4: Submit
Click "Create Goal" to save

## Using the Dashboard

### View Goals
- All your goals appear as cards
- See progress, status, and days remaining
- Click on a card for detailed view

### Filter Goals
- Use search bar to find goals
- Filter by type (Performance/Behavioral/Skill)
- Filter by status (Not Started/In Progress/Completed/Overdue)

### Track Progress
1. Click on a goal card
2. View detailed information
3. Update milestone progress using sliders
4. Mark milestones complete with checkboxes
5. Goal progress updates automatically

## Viewing Analytics

1. Click the "Analytics" tab
2. View KPI cards at the top
3. Explore distribution charts
4. Check monthly trends
5. Review impact correlations

## Achievement Celebrations

When you complete a goal:
1. Automatic celebration modal appears
2. Confetti animation plays
3. View achievement statistics
4. Click "Celebrate & Continue"

## API Testing

### Create Goal
```bash
curl -X POST http://localhost:8000/api/v1/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Improve Math Score",
    "description": "Increase math test scores by 15%",
    "type": "performance",
    "specific": "Score 85% or higher in next math exam",
    "measurable": "Track test scores weekly",
    "achievable": "Study 2 hours daily, attend tutoring",
    "relevant": "Essential for college applications",
    "timeBound": "Achieve by end of semester (3 months)",
    "start_date": "2024-01-01",
    "target_date": "2024-03-31",
    "milestones": [
      {
        "title": "Complete Chapter 1-5",
        "description": "Review and practice all exercises",
        "target_date": "2024-01-31",
        "progress": 0
      }
    ]
  }'
```

### List Goals
```bash
curl -X GET http://localhost:8000/api/v1/goals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Analytics
```bash
curl -X GET http://localhost:8000/api/v1/goals/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## User Roles

### Students
- Create personal goals
- Track progress
- View analytics
- Celebrate achievements

### Teachers
- Create professional development goals
- Track teaching objectives
- Monitor progress
- Access analytics

### Admins
- Full access to goal management
- View all features
- Track institutional objectives

## Common Tasks

### Edit a Goal
1. Open goal detail view
2. Click "Edit" button
3. Modify fields
4. Save changes

### Delete a Goal
1. Open goal detail view
2. Click "Delete" button
3. Confirm deletion

### Update Milestone
1. Open goal detail view
2. Find milestone
3. Adjust progress slider
4. Or click checkbox to mark complete

### Search Goals
1. Type in search box
2. Results filter in real-time
3. Search matches title and description

## Tips & Best Practices

### Creating Effective Goals
- Be specific and clear
- Make them measurable
- Set realistic deadlines
- Break into smaller milestones
- Review and update regularly

### Milestone Strategy
- Create 3-5 milestones per goal
- Space them evenly
- Make each actionable
- Celebrate small wins

### Progress Tracking
- Update weekly
- Be honest about progress
- Adjust if needed
- Don't delete - mark as failed instead

### Using Analytics
- Review monthly
- Identify patterns
- Adjust strategy
- Celebrate completion rates

## Troubleshooting

### Goals Not Loading
- Check backend is running
- Verify authentication token
- Check browser console for errors

### Cannot Create Goal
- Verify all required fields
- Check date validation
- Ensure start date < target date

### Analytics Not Showing
- Ensure you have at least one goal
- Wait for data to load
- Refresh the page

### Celebration Not Appearing
- Ensure goal reached 100% progress
- Check if all milestones complete
- Clear browser cache

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Search goals (if implemented)
- `Esc` - Close modals
- `Tab` - Navigate form fields
- `Enter` - Submit forms

## Mobile Usage

The interface is fully responsive:
- Touch-friendly controls
- Mobile-optimized layouts
- Swipe gestures supported
- Works on all screen sizes

## Performance

Expected performance:
- Page load: < 1s
- Goal creation: < 500ms
- Progress update: < 300ms
- Analytics load: < 2s

## Support

For issues or questions:
1. Check this guide
2. Review implementation docs
3. Check API documentation
4. Contact development team

## What's Next?

After getting comfortable with basics:
1. Explore advanced features
2. Create goal templates
3. Link goals to courses
4. Integrate with other modules
5. Set up notifications

## Version History

- v1.0.0 - Initial release
  - Goal creation
  - Milestone tracking
  - Progress visualization
  - Analytics dashboard
  - Achievement celebrations
