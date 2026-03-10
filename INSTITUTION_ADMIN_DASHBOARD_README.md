# Institution Admin Dashboard

> A comprehensive dashboard for institution administrators with real-time statistics, attendance tracking, exam results, and performance analytics.

## 🎯 Features

- ✅ **Institutional Overview** - Student and teacher count cards with real-time data
- ✅ **Today's Attendance Summary** - Detailed breakdown with visual percentage indicator
- ✅ **Recent Exam Results** - Table showing last 5 published exams with performance metrics
- ✅ **Upcoming Events** - Timeline of events scheduled in the next 30 days
- ✅ **Pending Tasks** - Prioritized list of grading, attendance, and result publishing tasks
- ✅ **Performance Trends** - 6-month chart showing average scores and attendance rates
- ✅ **Quick Statistics** - Grid of key metrics (assignments, exams, attendance, announcements)
- ✅ **Announcement Shortcut** - Quick access button to create announcements

## 📁 Documentation

### Quick Links

| Document | Purpose |
|----------|---------|
| **[Quick Start Guide](INSTITUTION_ADMIN_DASHBOARD_QUICK_START.md)** | Get started in 5 minutes |
| **[Implementation Guide](INSTITUTION_ADMIN_DASHBOARD_IMPLEMENTATION.md)** | Complete technical documentation |
| **[Summary](INSTITUTION_ADMIN_DASHBOARD_SUMMARY.md)** | High-level overview |
| **[Checklist](INSTITUTION_ADMIN_DASHBOARD_CHECKLIST.md)** | Feature implementation status |
| **[Full Documentation](INSTITUTION_ADMIN_DASHBOARD.md)** | Detailed feature documentation |

### Choose Your Path

**🚀 I want to use it:**
→ Read the [Quick Start Guide](INSTITUTION_ADMIN_DASHBOARD_QUICK_START.md)

**🔧 I want to understand the code:**
→ Read the [Implementation Guide](INSTITUTION_ADMIN_DASHBOARD_IMPLEMENTATION.md)

**📊 I want to see what was built:**
→ Read the [Summary](INSTITUTION_ADMIN_DASHBOARD_SUMMARY.md)

**✅ I want to verify completeness:**
→ Check the [Checklist](INSTITUTION_ADMIN_DASHBOARD_CHECKLIST.md)

**📚 I want all the details:**
→ Read the [Full Documentation](INSTITUTION_ADMIN_DASHBOARD.md)

## 🚀 Quick Start

### Access the Dashboard

1. **Start the application:**
   ```bash
   # Backend
   uvicorn src.main:app --reload
   
   # Frontend (in separate terminal)
   cd frontend && npm run dev
   ```

2. **Login** as admin user at `http://localhost:5173/login`

3. **View dashboard** at `http://localhost:5173/admin`

### Requirements

- User role: `admin`
- Email verification: Required
- Institution association: Required

## 📸 Screenshots

### Dashboard Overview
```
┌─────────────────────────────────────────────────────────────┐
│  Institution Dashboard                    [New Announcement] │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Students │ │ Teachers │ │Attendance│ │ Pending  │        │
│ │  1,234   │ │    89    │ │  95.8%   │ │ Tasks: 5 │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│ Today's Attendance Summary    │  Quick Statistics           │
│ Present: 1150  Absent: 30     │  ┌────────┬────────┐       │
│ ████████████░░ 95.8%         │  │ Assign │ Exams  │       │
│                               │  └────────┴────────┘       │
├─────────────────────────────────────────────────────────────┤
│ Recent Exam Results           │  Upcoming Events            │
│ ┌───────────────────────┐    │  • Science Final (Jan 25)   │
│ │ Math Mid-Term  78.5%  │    │  • Math Assignment (Jan 20) │
│ └───────────────────────┘    │                             │
├─────────────────────────────────────────────────────────────┤
│ Performance Trends            │  Pending Tasks              │
│ [LINE CHART: 6 months]        │  🔴 Attendance marking      │
│                               │  🟠 Grading (45 items)      │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI 0.109+
- SQLAlchemy 2.0
- PostgreSQL
- Python 3.11

**Frontend:**
- React 18
- TypeScript
- Material-UI v5
- Chart.js + react-chartjs-2

### Files Created

**Backend (3 files):**
- `src/api/v1/institution_admin.py` - Dashboard API endpoint
- `src/schemas/institution_admin.py` - Pydantic schemas
- `src/api/v1/__init__.py` - Router registration (modified)

**Frontend (3 files):**
- `frontend/src/pages/InstitutionAdminDashboard.tsx` - Dashboard page
- `frontend/src/api/institutionAdmin.ts` - API client
- `frontend/src/App.tsx` - Route configuration (modified)

## 🔗 API Endpoint

**URL:** `GET /api/v1/institution-admin/dashboard`

**Authentication:** Bearer token required

**Response:**
```json
{
  "overview": { "student_count": 1234, "teacher_count": 89, ... },
  "attendance_summary": { "date": "2024-01-15", "percentage": 95.83, ... },
  "recent_exam_results": [...],
  "upcoming_events": [...],
  "pending_tasks": [...],
  "performance_trends": [...],
  "quick_statistics": [...]
}
```

## 🎨 Key Features Detail

### 1. Overview Cards
Four metric cards with hover animations showing:
- Total active students
- Total active teachers
- Today's attendance percentage
- Pending tasks count

### 2. Attendance Summary
Detailed breakdown with:
- Present, absent, late student counts
- Visual progress bar
- Color-coded statistics
- Percentage indicator

### 3. Exam Results Table
Last 5 published exams with:
- Exam name and date
- Exam type badge
- Average percentage (color-coded)
- Pass rate statistics

### 4. Upcoming Events
Timeline showing:
- Events in next 30 days
- Formatted dates
- Event descriptions
- Calendar icons

### 5. Pending Tasks
Prioritized task list with:
- Grading tasks (medium priority, orange)
- Attendance marking (high priority, red)
- Result publishing (medium priority, orange)
- Count badges and due dates

### 6. Performance Trends
Line chart displaying:
- 6-month historical data
- Average exam scores
- Attendance rates
- Interactive tooltips

### 7. Quick Statistics
2x2 grid showing:
- Active assignments
- Total exams
- 30-day average attendance
- Pending announcements

### 8. Announcement Button
Quick-access button for:
- Creating new announcements
- Prominent header placement
- One-click navigation

## 🧪 Testing

### Manual Testing
```bash
# 1. Start services
uvicorn src.main:app --reload
cd frontend && npm run dev

# 2. Login as admin
http://localhost:5173/login

# 3. Navigate to dashboard
http://localhost:5173/admin

# 4. Verify all components load
```

### API Testing
```bash
# Get token
TOKEN="your_jwt_token"

# Test endpoint
curl -X GET "http://localhost:8000/api/v1/institution-admin/dashboard" \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Dashboard not loading | Check backend is running, verify auth token |
| No data displayed | Ensure institution has data, check database |
| Charts not rendering | Verify Chart.js installation, check console |
| Permission denied | Verify admin role, check email verification |

## 📊 Data Sources

The dashboard queries the following tables:
- `students` - Student records
- `teachers` - Teacher records
- `attendances` - Daily attendance
- `exams` & `exam_results` - Exam data
- `assignments` & `submissions` - Assignment data
- `announcements` - Announcement data

## 🎯 Status

✅ **COMPLETE** - All requested features implemented and documented

### Implementation Checklist
- ✅ Institutional overview with count cards
- ✅ Today's attendance summary with percentage
- ✅ Recent exam results table
- ✅ Upcoming events timeline
- ✅ Pending tasks list (grading, attendance, results)
- ✅ Performance trend charts (6-month)
- ✅ Quick statistics widgets
- ✅ Announcement composer shortcut

## 🚀 Future Enhancements

**Planned for Phase 2:**
- Real-time updates via WebSockets
- Customizable widgets
- Export to PDF/Excel
- Advanced filters
- Predictive analytics
- Mobile app

## 📞 Support

### Resources
- **API Documentation**: `http://localhost:8000/docs`
- **Quick Start**: [INSTITUTION_ADMIN_DASHBOARD_QUICK_START.md](INSTITUTION_ADMIN_DASHBOARD_QUICK_START.md)
- **Full Docs**: [INSTITUTION_ADMIN_DASHBOARD.md](INSTITUTION_ADMIN_DASHBOARD.md)

### Issues
For bugs or questions:
1. Check troubleshooting section in documentation
2. Review API documentation
3. Check application logs
4. Contact development team

## 📝 License

Part of the institutional management system.

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2024

---

## Quick Navigation

- [Quick Start Guide →](INSTITUTION_ADMIN_DASHBOARD_QUICK_START.md)
- [Implementation Guide →](INSTITUTION_ADMIN_DASHBOARD_IMPLEMENTATION.md)
- [Feature Summary →](INSTITUTION_ADMIN_DASHBOARD_SUMMARY.md)
- [Checklist →](INSTITUTION_ADMIN_DASHBOARD_CHECKLIST.md)
- [Full Documentation →](INSTITUTION_ADMIN_DASHBOARD.md)
