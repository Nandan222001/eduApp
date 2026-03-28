# Volunteer Hours Tracking System

## Overview
The Volunteer Hours Tracking System allows schools to track, verify, and manage parent volunteer contributions throughout the academic year. The system includes hour logging, teacher verification workflows, leaderboards, milestone badges, and certificate generation.

## Features

### 1. Hour Logging
Parents can log volunteer hours with the following information:
- Activity name and description
- Activity type (classroom_help, event_support, fundraising, field_trip_chaperone, committee_work)
- Date and hours logged
- Location
- Supervisor teacher
- Attachments (photos, documents)

### 2. Verification Workflow
- Teachers can verify, approve, or reject volunteer hour submissions
- Bulk verification support for processing multiple logs at once
- Verification notes for feedback
- Automatic summary recalculation upon verification

### 3. Hour Accumulation by Academic Year
- Hours are tracked per academic year
- Automatic summary calculation including:
  - Total hours, approved hours, pending hours, rejected hours
  - Breakdown by activity type
  - Current rank and last activity date

### 4. Leaderboards
- School-wide leaderboards
- Grade-specific leaderboards
- Real-time rank tracking with change indicators
- Percentile calculation
- User's personal rank display

### 5. Milestone Badges
Default badge tiers:
- Bronze: 10 hours
- Silver: 25 hours
- Gold: 50 hours
- Platinum: 100 hours

Custom badges can be created by administrators.

### 6. Certificate Generation
- Automated certificate generation for volunteer hours
- Tax-deductible certificate support with tax year tracking
- Certificate numbering system
- Signer attribution (principal, coordinator, etc.)
- PDF generation ready

### 7. Reports and Analytics
- Parent-specific reports with activity breakdown
- Grade-level reports
- School-wide reports
- Monthly trends
- Activity type distribution
- Top contributors

### 8. Export Capabilities
- CSV export for reporting
- Tax deduction export with estimated monetary value
- Filtering by date range, grade, parent, status

## API Endpoints

### Hour Logging
- `POST /api/v1/volunteer-hours/logs` - Create a new hour log
- `GET /api/v1/volunteer-hours/logs` - Get hour logs (with filters)
- `GET /api/v1/volunteer-hours/logs/{log_id}` - Get specific log
- `PUT /api/v1/volunteer-hours/logs/{log_id}` - Update log (pending only)
- `DELETE /api/v1/volunteer-hours/logs/{log_id}` - Delete log (pending only)

### Verification
- `POST /api/v1/volunteer-hours/logs/{log_id}/verify` - Verify single log
- `POST /api/v1/volunteer-hours/logs/verify-bulk` - Bulk verify logs

### Summaries & Reports
- `GET /api/v1/volunteer-hours/summary` - Get hour summaries
- `GET /api/v1/volunteer-hours/reports/parent/{parent_id}` - Parent report
- `GET /api/v1/volunteer-hours/reports/grade/{grade_id}` - Grade report
- `GET /api/v1/volunteer-hours/reports/school-wide` - School-wide report

### Leaderboards
- `GET /api/v1/volunteer-hours/leaderboard` - Get leaderboard

### Badges
- `POST /api/v1/volunteer-hours/badges` - Create badge
- `GET /api/v1/volunteer-hours/badges` - List badges
- `GET /api/v1/volunteer-hours/badges/parent/{parent_id}` - Get parent badges

### Certificates
- `POST /api/v1/volunteer-hours/certificates/generate` - Generate certificate
- `GET /api/v1/volunteer-hours/certificates` - List certificates

### Export
- `GET /api/v1/volunteer-hours/export/tax-deduction` - Tax deduction export
- `POST /api/v1/volunteer-hours/export` - General export

### Statistics
- `GET /api/v1/volunteer-hours/statistics` - Get statistics

## Models

### VolunteerHourLog
Main model for individual hour entries.

### VolunteerHourSummary
Aggregated summary per parent per academic year.

### VolunteerBadge
Badge definitions with hour requirements.

### ParentVolunteerBadge
Parent's earned badges.

### VolunteerLeaderboard
Ranking information per academic year.

### VolunteerCertificate
Generated certificates with tracking.

## Workflows

### Parent Workflow
1. Log volunteer hours
2. Wait for teacher verification
3. View summary and badges
4. Check leaderboard position
5. Request certificate

### Teacher Workflow
1. Review pending volunteer hour submissions
2. Verify or reject with notes
3. View reports for their supervised activities

### Administrator Workflow
1. Create/manage badge definitions
2. Generate certificates
3. View school-wide reports
4. Export data for reporting
5. Initialize default badges for new academic year

## Initialization

To initialize default badges for an institution:

```python
from src.services.volunteer_service import initialize_default_badges
from src.database import get_db

db = next(get_db())
initialize_default_badges(db, institution_id=1)
```

## Tax Deduction Support

The system supports tax deduction documentation:
- Mark certificates as tax-deductible
- Specify tax year
- Export detailed activity logs
- Calculate estimated value (default: $25/hour)

## Security Considerations

- Parents can only view/edit their own logs
- Teachers can verify any logs in their institution
- Only pending logs can be edited/deleted
- Verified logs are immutable
- All operations are institution-scoped
