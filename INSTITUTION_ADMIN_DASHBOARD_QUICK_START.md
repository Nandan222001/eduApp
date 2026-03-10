# Institution Admin Dashboard - Quick Start Guide

## What Was Built

A comprehensive dashboard for institution administrators with:
- **Overview Cards**: Student/teacher counts, today's attendance, pending tasks
- **Attendance Summary**: Detailed breakdown with visual indicators
- **Recent Exam Results**: Table showing last 5 published exams
- **Upcoming Events**: Timeline of events in next 30 days
- **Pending Tasks**: Prioritized task list (grading, attendance, results)
- **Performance Trends**: 6-month chart showing scores and attendance
- **Quick Statistics**: Grid of key metrics
- **Announcement Shortcut**: Quick access button to create announcements

## Quick Access

### URLs
- **Dashboard**: http://localhost:5173/admin
- **Alternative**: http://localhost:5173/admin/dashboard
- **API Endpoint**: http://localhost:8000/api/v1/institution-admin/dashboard

### Requirements
- User must have `admin` role
- User must be logged in
- Email verification required

## Files Created/Modified

### Backend (3 files)
```
src/api/v1/institution_admin.py          (NEW - API endpoint)
src/schemas/institution_admin.py         (NEW - Data schemas)
src/api/v1/__init__.py                   (MODIFIED - Router added)
```

### Frontend (3 files)
```
frontend/src/pages/InstitutionAdminDashboard.tsx  (NEW - Dashboard page)
frontend/src/api/institutionAdmin.ts               (NEW - API client)
frontend/src/App.tsx                               (MODIFIED - Route added)
```

### Documentation (3 files)
```
INSTITUTION_ADMIN_DASHBOARD.md              (NEW - Full documentation)
INSTITUTION_ADMIN_DASHBOARD_SUMMARY.md      (NEW - Implementation summary)
INSTITUTION_ADMIN_DASHBOARD_QUICK_START.md  (NEW - This file)
```

## Installation & Setup

### 1. Install Dependencies (if needed)

**Backend:**
```bash
cd <project-root>
poetry install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start Services

**Backend (Terminal 1):**
```bash
uvicorn src.main:app --reload
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

### 3. Access Dashboard

1. Open browser: http://localhost:5173
2. Login with admin credentials
3. Navigate to `/admin` (should redirect automatically if admin)
4. Dashboard loads with all components

## Component Overview

### 1. Overview Cards (Top Row)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Students   │   Teachers   │  Attendance  │   Pending    │
│     1,234    │      89      │    95.8%     │  Tasks: 5    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### 2. Attendance Summary & Quick Stats
```
┌─────────────────────────────────┬──────────────────┐
│    Today's Attendance Summary   │  Quick Stats     │
│  Present: 1150  Absent: 30      │  ┌──────┬──────┐ │
│  Late: 20      Total: 1200      │  │ 42   │  78  │ │
│  ████████████░░ 95.8%          │  └──────┴──────┘ │
└─────────────────────────────────┴──────────────────┘
```

### 3. Exam Results & Upcoming Events
```
┌────────────────────────────┬────────────────────────┐
│  Recent Exam Results       │  Upcoming Events       │
│  ┌──────────────────────┐  │  • Science Final       │
│  │ Math Mid-Term  78.5% │  │    Jan 25, 2024        │
│  │ English Quiz   82.1% │  │  • Math Assignment Due │
│  └──────────────────────┘  │    Jan 20, 2024        │
└────────────────────────────┴────────────────────────┘
```

### 4. Performance Trends & Pending Tasks
```
┌─────────────────────────────────┬──────────────────┐
│     Performance Trends          │  Pending Tasks   │
│  ╱╲                             │  🔴 Attendance   │
│ ╱  ╲    Average Score           │  🟠 Grading (45) │
│     ╲  ╱  Attendance            │  🟠 Results (3)  │
└─────────────────────────────────┴──────────────────┘
```

## API Response Example

```json
{
  "overview": {
    "student_count": 1234,
    "teacher_count": 89,
    "total_users": 1323
  },
  "attendance_summary": {
    "date": "2024-01-15",
    "total_students": 1200,
    "present": 1150,
    "absent": 30,
    "late": 20,
    "percentage": 95.83
  },
  "recent_exam_results": [...],
  "upcoming_events": [...],
  "pending_tasks": [...],
  "performance_trends": [...],
  "quick_statistics": [...]
}
```

## Testing the Dashboard

### Manual Test Steps

1. **Load Dashboard**
   - ✓ Page loads without errors
   - ✓ Loading spinner shows briefly
   - ✓ All sections render

2. **Check Overview Cards**
   - ✓ Student count displays
   - ✓ Teacher count displays
   - ✓ Attendance percentage shows
   - ✓ Pending tasks count appears
   - ✓ Cards have hover effect

3. **Verify Attendance Summary**
   - ✓ Today's date shown
   - ✓ Present/Absent/Late numbers display
   - ✓ Progress bar renders
   - ✓ Percentage matches data

4. **Review Exam Results**
   - ✓ Table populates with exams
   - ✓ Average percentages show
   - ✓ Pass rates display
   - ✓ Colors indicate performance

5. **Check Upcoming Events**
   - ✓ Events list appears
   - ✓ Dates formatted correctly
   - ✓ Descriptions show

6. **Validate Pending Tasks**
   - ✓ Tasks listed with counts
   - ✓ Priority colors correct
   - ✓ Due dates shown if applicable

7. **Test Performance Chart**
   - ✓ Chart renders
   - ✓ Both lines display
   - ✓ Tooltips work on hover
   - ✓ Legend shows

8. **Quick Stats Grid**
   - ✓ All 4 stats display
   - ✓ Values are correct
   - ✓ Layout responsive

9. **Announcement Button**
   - ✓ Button visible in header
   - ✓ Clicking navigates correctly

### API Testing

**Test endpoint with curl:**
```bash
# Get auth token first
TOKEN="your_jwt_token_here"

# Test dashboard endpoint
curl -X GET \
  "http://localhost:8000/api/v1/institution-admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:** 200 OK with JSON data

## Common Issues & Solutions

### Issue: Dashboard shows "Failed to load dashboard data"
**Solution:**
- Check if backend is running
- Verify user is logged in
- Confirm user has admin role
- Check browser console for errors

### Issue: Charts not rendering
**Solution:**
- Verify Chart.js is installed: `npm list chart.js react-chartjs-2`
- Clear browser cache
- Check for JavaScript errors in console

### Issue: No data displayed
**Solution:**
- Ensure institution has data in database
- Check if students/teachers exist
- Verify attendance records for today
- Confirm exams are published

### Issue: Attendance shows 0%
**Solution:**
- Mark attendance for today
- Check if students are assigned to sections
- Verify attendance records in database

## Key Features Checklist

- ✅ Real-time data loading
- ✅ Responsive design (mobile-friendly)
- ✅ Interactive charts
- ✅ Color-coded statistics
- ✅ Priority-based task sorting
- ✅ Loading states
- ✅ Error handling
- ✅ Role-based access
- ✅ Institution-scoped data
- ✅ Quick action buttons

## Customization Options

### Change Colors
Edit theme colors in `frontend/src/theme.ts`

### Modify Layout
Edit grid sizes in `InstitutionAdminDashboard.tsx`:
```typescript
<Grid item xs={12} md={6} lg={4}>  // Adjust grid sizes
```

### Add More Stats
Extend the API endpoint in `src/api/v1/institution_admin.py`

### Change Date Range
Modify the query filters in the backend API

## Performance Tips

1. **Caching**: Consider adding Redis caching for dashboard data
2. **Pagination**: Limit result sets in lists and tables
3. **Lazy Loading**: Load chart data after initial render
4. **Debouncing**: Add refresh rate limiting
5. **Indexing**: Ensure database indexes on queried columns

## Next Steps

1. **Add Filters**: Date range selectors, grade filters
2. **Export**: Add PDF/Excel export functionality
3. **Refresh**: Auto-refresh data periodically
4. **Notifications**: Add real-time notifications
5. **Drill-down**: Link to detailed views
6. **Customization**: Allow widget rearrangement
7. **Comparisons**: Add year-over-year comparisons
8. **Predictions**: Integrate ML predictions

## Support & Documentation

- **Full Documentation**: See `INSTITUTION_ADMIN_DASHBOARD.md`
- **Implementation Details**: See `INSTITUTION_ADMIN_DASHBOARD_SUMMARY.md`
- **API Docs**: http://localhost:8000/docs (when running)

## Status: ✅ COMPLETE

All requested features have been implemented:
- ✅ Institutional overview with student/teacher count cards
- ✅ Today's attendance summary with percentage indicator
- ✅ Recent exam results table
- ✅ Upcoming events timeline
- ✅ Pending tasks list (grading, attendance marking)
- ✅ Performance trend charts (monthly)
- ✅ Quick statistics widgets
- ✅ Announcement composer shortcut

The dashboard is ready for use and testing!
