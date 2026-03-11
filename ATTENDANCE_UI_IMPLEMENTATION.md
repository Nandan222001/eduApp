# Attendance Management UI - Implementation Guide

## Overview

This document describes the comprehensive attendance management UI implementation for teachers, including all features for marking, viewing, and managing student attendance.

## Features Implemented

### 1. Attendance Overview Dashboard
**Location:** `/admin/attendance`
**File:** `frontend/src/pages/AttendanceOverviewPage.tsx`

Features:
- Quick statistics: Today's, Weekly, and Monthly attendance percentages
- Number of defaulters at a glance
- Quick action cards to navigate to:
  - Mark Attendance
  - Attendance Sheet
  - Defaulters Report
  - Corrections
- Attendance distribution pie chart
- Weekly attendance trend line chart

### 2. Attendance Marking Interface
**Location:** `/admin/attendance/mark`
**File:** `frontend/src/pages/AttendanceMarkingPage.tsx`

Features:
- **Date Picker:** Select any date for marking attendance (including historical dates)
- **Section Selection:** Choose class section
- **Subject Selection:** Optional subject-specific attendance
- **Class Roster:** Display all students with photos
- **Quick-Select Buttons:**
  - Mark All Present
  - Mark All Absent
- **Individual Status Toggle:** For each student with options:
  - Present ✓
  - Absent ✗
  - Late ⏰
  - Half-Day 🕐
- **Remarks Field:** Optional notes for each student
- **Visual Feedback:** Color-coded status indicators
- **Summary Display:** Real-time count of present, absent, late, and half-day
- **Bulk Submission:** Submit all attendance records at once
- **Confirmation Dialog:** Review before submitting

### 3. Attendance Sheet with Monthly Calendar Heatmap
**Location:** `/admin/attendance/sheet`
**File:** `frontend/src/pages/AttendanceSheetPage.tsx`

Features:
- **Month Selection:** Choose any month/year to view
- **Section & Subject Filters:** Filter by class and subject
- **Calendar Heatmap View:**
  - Each cell represents one day
  - Color-coded by status:
    - Green: Present
    - Red: Absent
    - Orange: Late
    - Blue: Half Day
    - Gray: No Data
    - Light Gray: Weekend
- **Student List:** All students with attendance percentage
- **Percentage Highlighting:** Below 75% highlighted in red
- **Summary Statistics:**
  - Average attendance percentage
  - Total students
  - Total classes
  - Days in month
- **Export Option:** Download attendance report (UI ready)

### 4. Defaulter Report
**Location:** `/admin/attendance/defaulters`
**File:** `frontend/src/pages/AttendanceDefaultersPage.tsx`

Features:
- **Date Range Selection:** Start and end date
- **Threshold Configuration:** Customize attendance threshold (default 75%)
- **Section & Subject Filters:** Filter by class and subject
- **Severity Categorization:**
  - Critical: Below 50% (Red)
  - High Risk: 50-65% (Orange)
  - Medium Risk: 65-75% (Yellow)
- **Detailed Table View:**
  - Student rank (by attendance)
  - Student name and admission number
  - Section
  - Total days, present days, absent days
  - Attendance percentage with progress bar
  - Severity level badge
- **Quick Statistics Cards:**
  - Total defaulters count
  - Critical cases count
  - High risk count
  - Medium risk count
- **Action Buttons:**
  - View student profile
  - Contact parent (email)

### 5. Attendance Correction Request
**Location:** `/admin/attendance/corrections`
**File:** `frontend/src/pages/AttendanceCorrectionPage.tsx`

Features:
- **Historical Correction:** Request changes for past attendance records
- **Date & Section Selection:** Find specific attendance records
- **Correction Request Dialog:**
  - View current status
  - Select new status
  - Provide detailed reason
- **Approval Workflow:** Requests sent to administrators for review
- **Recent Requests Panel:**
  - View all past correction requests
  - Status tracking (Pending, Approved, Rejected)
  - Review remarks display
- **Status Indicators:**
  - Pending (Orange)
  - Approved (Green)
  - Rejected (Red)

## API Integration

### Attendance API (`frontend/src/api/attendance.ts`)

Functions implemented:
- `bulkMarkAttendance()` - Submit attendance for multiple students
- `listAttendances()` - Get attendance records with filters
- `getAttendance()` - Get single attendance record
- `updateAttendance()` - Update existing attendance
- `requestCorrection()` - Submit correction request
- `listCorrections()` - Get correction requests
- `getSectionReport()` - Get section-wise attendance report
- `getStudentDetailedReport()` - Get student's detailed attendance
- `getDefaulters()` - Get list of students below threshold

### Data Models

**AttendanceStatus Enum:**
- PRESENT
- ABSENT
- LATE
- HALF_DAY

**CorrectionStatus Enum:**
- PENDING
- APPROVED
- REJECTED

## Navigation

The attendance system is integrated into the main navigation with the following structure:

```
Attendance
├── Overview (default)
├── Mark Attendance
├── Attendance Sheet
├── Defaulters Report
└── Corrections
```

## Routing

Routes configured in `frontend/src/App.tsx`:

```typescript
/admin/attendance              -> AttendanceOverviewPage
/admin/attendance/mark         -> AttendanceMarkingPage
/admin/attendance/sheet        -> AttendanceSheetPage
/admin/attendance/defaulters   -> AttendanceDefaultersPage
/admin/attendance/corrections  -> AttendanceCorrectionPage
```

## User Roles

The attendance management features are available to:
- **Admin:** Full access to all features
- **Teacher:** Full access to all features
- **Student:** View-only access (future implementation)

## UI Components Used

- Material-UI components for consistent design
- Date pickers from `@mui/x-date-pickers`
- Chart.js with react-chartjs-2 for visualizations
- Color-coded status indicators using theme palette
- Responsive grid layouts
- Confirmation dialogs for critical actions

## Visual Design

### Color Scheme
- **Present:** Green (`theme.palette.success.main`)
- **Absent:** Red (`theme.palette.error.main`)
- **Late:** Orange (`theme.palette.warning.main`)
- **Half Day:** Blue (`theme.palette.info.main`)

### Highlights
- Students with attendance below 75% are highlighted in red
- Critical defaulters (below 50%) have prominent red indicators
- Status changes are animated with smooth transitions
- Cards have hover effects for better interactivity

## Data Flow

1. **Marking Attendance:**
   - Select date, section, and optional subject
   - Load student roster
   - Mark individual statuses
   - Review summary
   - Submit bulk attendance
   - Confirmation with success/error feedback

2. **Viewing Attendance Sheet:**
   - Select month and section
   - Load attendance data
   - Display heatmap with daily status
   - Show aggregated statistics
   - Export option available

3. **Checking Defaulters:**
   - Set date range and threshold
   - Load student data
   - Calculate attendance percentages
   - Filter students below threshold
   - Display ranked list with severity

4. **Requesting Corrections:**
   - Select date and section
   - Find attendance record to correct
   - Submit correction request with reason
   - Track request status
   - View approval/rejection feedback

## Future Enhancements

1. **SMS/Email Notifications:**
   - Alert parents of absent students
   - Weekly attendance summaries
   - Defaulter alerts

2. **Biometric Integration:**
   - Automatic attendance marking
   - Real-time sync

3. **Student Portal:**
   - View own attendance
   - Request corrections
   - Attendance certificates

4. **Analytics:**
   - Attendance patterns analysis
   - Correlation with academic performance
   - Predictive alerts

5. **Bulk Operations:**
   - Import attendance from CSV
   - Export in multiple formats (PDF, Excel)
   - Batch correction approvals

6. **Leave Management:**
   - Request leave in advance
   - Leave approval workflow
   - Automatic attendance adjustment

## Testing Checklist

- [ ] Mark attendance for current date
- [ ] Mark attendance for historical date
- [ ] View monthly attendance sheet
- [ ] Filter by section and subject
- [ ] Check defaulter report with different thresholds
- [ ] Request attendance correction
- [ ] View correction request status
- [ ] Navigate between all pages
- [ ] Test responsive design on mobile
- [ ] Verify color coding for all statuses
- [ ] Test form validations
- [ ] Test error handling

## Known Limitations

1. Section and subject data are currently mocked; need to integrate with actual API
2. Export functionality UI is ready but backend integration pending
3. Email/SMS notifications require additional configuration
4. Biometric integration not yet implemented

## Deployment Notes

1. Ensure backend attendance API endpoints are properly configured
2. Verify date/time handling across timezones
3. Test with large datasets (100+ students)
4. Configure proper permissions for correction approvals
5. Set up scheduled jobs for attendance summaries

## Dependencies

- React 18+
- Material-UI 5+
- React Router 6+
- Chart.js 4+
- react-chartjs-2
- @mui/x-date-pickers
- date-fns (for date adapter)

## Backend Requirements

The following API endpoints must be implemented:

1. `POST /api/v1/attendance/bulk` - Bulk mark attendance
2. `GET /api/v1/attendance/` - List attendances with filters
3. `GET /api/v1/attendance/{id}` - Get single attendance
4. `PUT /api/v1/attendance/{id}` - Update attendance
5. `POST /api/v1/attendance/corrections` - Request correction
6. `GET /api/v1/attendance/corrections` - List corrections
7. `GET /api/v1/attendance/reports/section/{id}` - Section report
8. `GET /api/v1/attendance/reports/student/{id}` - Student report
9. `GET /api/v1/attendance/reports/defaulters` - Defaulters list

All endpoints are already implemented in the backend (see `src/api/v1/attendance.py`).

## Support

For issues or questions, refer to:
- Backend API: `src/api/v1/attendance.py`
- Service Layer: `src/services/attendance_service.py`
- Database Models: `src/models/attendance.py`
- Frontend API: `frontend/src/api/attendance.ts`
