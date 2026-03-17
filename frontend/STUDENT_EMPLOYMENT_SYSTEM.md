# Student Employment System

## Overview
The Student Employment System provides a comprehensive platform for managing student job opportunities, work permits, employment tracking, and career counseling workflows. The system ensures compliance with work permit regulations and helps students build professional portfolios for college applications.

## Features

### 1. Student Job Board (`/student/employment/job-board`)
- Browse age-appropriate job opportunities
- Filter jobs by type, pay range, location, and hours commitment
- View detailed job descriptions with requirements and employer information
- Apply to jobs with optional cover letter
- Bookmark favorite job listings
- External application link support

### 2. Job Detail Page (`/student/employment/jobs/:id`)
- Comprehensive job information display
- Employer details and verification status
- Requirements and responsibilities
- Pay rate and hours per week
- Location information
- Application submission

### 3. Work Permit Manager (`/student/employment/work-permits`)
- Multi-step work permit application process
  - Step 1: Application Form (employer, hours, dates)
  - Step 2: Parent Consent with digital signature
  - Step 3: School Authorization workflow information
  - Step 4: Review and submit
- Track permit status (pending, approved, denied, expired)
- Expiry reminders and alerts
- Parent consent collection with digital signature canvas
- Permit restrictions and notes

### 4. My Employment Dashboard (`/student/employment/my-employment`)
- Track current and past employment
- Three main tabs:
  - **Current Employment**: Active jobs with timesheet integration
  - **Employment History**: Past jobs with skills gained
  - **Skills & Experience**: Consolidated skills and downloadable summary

#### Timesheet Integration
- Log work hours manually
- Track weekly and total hours
- Import CSV timesheets
- Sync with external timesheet apps (placeholder)
- Visual hour tracking with statistics

#### Supervisor Reference System
- Request references from supervisors
- Pre-filled reference request messages
- Track reference status

#### Work Experience Summary
- Downloadable summary for college applications and resumes
- Skills gained tracking
- Verified employment records

### 5. Work Hour Monitoring (`/student/employment/work-hours`)
- Real-time tracking of weekly work hours
- Visual progress indicators
- Alerts when approaching maximum hours (80% threshold)
- Error alerts when exceeding limits
- Breakdown of hours by employer
- Work permit regulations display
- Compliance monitoring

### 6. Employer Portal (`/admin/employment/employer-portal`)
For verified local businesses to post student job opportunities:
- Post new job listings
- Manage active and expired postings
- View application counts
- Edit job details
- Verification status tracking
- Applications management (coming soon)

### 7. Career Counselor Workflow (`/teacher/employment/counselor` or `/admin/employment/counselor`)
Approval and monitoring system for career counselors:

#### Job Listing Reviews
- Review pending job postings
- Age appropriateness scoring algorithm
- Academic interference risk assessment
- Approve or deny job listings with notes
- Automated checks for:
  - Excessive hours
  - Prohibited keywords (hazardous, dangerous, etc.)
  - Employer verification status

#### Employment Verification
- Verify student employment for graduation requirements
- Review employment history
- Approve or reject verification requests
- Add verification notes

#### Work Hour Monitoring
- System-wide student hour tracking
- Identify students approaching or exceeding limits
- Compliance monitoring dashboard

## Components

### Reusable Components (`/components/employment/`)

1. **JobCard** - Displays job listing in card format
   - Job type badges
   - Employer verification indicator
   - Key details (pay, hours, location)
   - Bookmark functionality

2. **WorkPermitCard** - Shows work permit information
   - Status indicators
   - Expiry warnings
   - Consent status
   - Restrictions display

3. **EmploymentCard** - Displays employment record
   - Job details
   - Supervisor information
   - Verification status
   - Reference request button

4. **TimesheetIntegration** - Hours tracking interface
   - Manual hour entry
   - Weekly/total hour statistics
   - CSV import capability
   - Sync functionality

## Data Flow

### Job Application Process
1. Student browses job board
2. Views job details
3. Checks work permit requirements
4. Submits application with cover letter
5. Application tracked in system

### Work Permit Process
1. Student initiates permit application
2. Fills out application form
3. Parent provides digital signature and consent
4. System submits to career counselor
5. Counselor reviews for age-appropriateness and academic impact
6. Counselor approves or denies
7. Student receives notification
8. Permit becomes active/inactive

### Employment Tracking
1. Student adds employment record
2. Logs hours via timesheet integration
3. System monitors weekly hour totals
4. Alerts generated if approaching limits
5. Student can request supervisor reference
6. Career counselor verifies for graduation
7. Record added to work experience summary

## Validation & Compliance

### Work Hour Limits
- Configurable maximum weekly hours (default: 20)
- 80% threshold warning
- 100% threshold error
- Per-permit restrictions

### Age Appropriateness Checks
- Prohibited keyword detection
- Hour limit validation
- Job type restrictions
- Employer verification requirement

### Academic Interference Assessment
- Low risk: ≤15 hours/week
- Medium risk: 16-25 hours/week
- High risk: >25 hours/week

## API Integration

All components use the `employmentApi` from `/api/employment.ts`:

- `listJobListings()` - Get job listings with filters
- `getJobListing(id)` - Get single job details
- `createJobListing()` - Post new job (employer)
- `updateJobListing()` - Update job details
- `createJobApplication()` - Submit job application
- `createWorkPermit()` - Submit work permit application
- `getStudentWorkPermits()` - Get student's permits
- `authorizeWorkPermit()` - Approve/deny permit (counselor)
- `createEmployment()` - Add employment record
- `getStudentEmployments()` - Get employment history
- `getStudentEmploymentSummary()` - Get summary statistics
- `verifyEmploymentForGraduation()` - Verify for graduation

## Routes

### Student Routes
- `/student/employment/job-board` - Browse jobs
- `/student/employment/jobs/:id` - Job details
- `/student/employment/work-permits` - Manage permits
- `/student/employment/my-employment` - Employment dashboard
- `/student/employment/work-hours` - Hour monitoring

### Admin/Teacher Routes
- `/admin/employment/employer-portal` - Employer posting
- `/admin/employment/counselor` - Counselor workflow
- `/teacher/employment/counselor` - Counselor workflow

## Future Enhancements

1. **Email Notifications**
   - Permit expiry reminders
   - Application status updates
   - Hour limit warnings

2. **Advanced Timesheet Integration**
   - Direct integration with popular timesheet apps
   - Automatic hour syncing
   - Payroll integration

3. **Reference Management System**
   - Digital reference collection
   - Reference templates
   - Reference status tracking

4. **Job Matching Algorithm**
   - AI-powered job recommendations
   - Skills-based matching
   - Schedule compatibility checking

5. **Employer Dashboard Enhancements**
   - Application review interface
   - Interview scheduling
   - Candidate communication

6. **Reports and Analytics**
   - Employment trends
   - Student employment statistics
   - Graduation requirement tracking

## Usage Tips

### For Students
1. Apply for a work permit before applying to jobs
2. Keep your employment records updated
3. Log hours regularly for accurate tracking
4. Request references before leaving a position
5. Monitor your weekly hours to stay compliant

### For Employers
1. Complete verification process for better visibility
2. Be clear about job requirements
3. Keep job postings updated
4. Respond to applications promptly

### For Career Counselors
1. Review job postings within 3-5 business days
2. Consider both age-appropriateness and academic impact
3. Monitor students approaching hour limits
4. Verify employment records for graduation requirements
5. Maintain communication with students and employers
