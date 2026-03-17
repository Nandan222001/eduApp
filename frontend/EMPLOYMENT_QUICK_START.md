# Student Employment System - Quick Start Guide

## For Students

### Finding a Job
1. Navigate to **Student Dashboard** → **Employment** → **Job Board**
   - URL: `/student/employment/job-board`
2. Browse available positions or use search and filters
3. Click on a job to view full details
4. Click "Apply Now" and submit your application

### Getting a Work Permit
1. Go to **Employment** → **Work Permits**
   - URL: `/student/employment/work-permits`
2. Click "New Permit Application"
3. Complete the 4-step process:
   - Fill out application form
   - Get parent consent with digital signature
   - Review school authorization requirements
   - Submit application
4. Wait for career counselor approval (3-5 business days)

### Tracking Your Employment
1. Navigate to **Employment** → **My Employment**
   - URL: `/student/employment/my-employment`
2. Use the three tabs:
   - **Current Employment**: View active jobs and log hours
   - **Employment History**: Review past positions
   - **Skills & Experience**: Download work summary

### Logging Work Hours
1. On the **Current Employment** tab
2. Click "Log Hours" in the Timesheet Integration section
3. Enter date, hours worked, and description
4. Click "Log Hours" to save

### Monitoring Your Hours
1. Go to **Employment** → **Work Hours**
   - URL: `/student/employment/work-hours`
2. View your:
   - Current weekly hours
   - Maximum allowed hours
   - Active jobs breakdown
   - Compliance status

### Requesting References
1. In **My Employment**, find the job under Current or History
2. Click "Request Reference"
3. Edit the pre-filled message if needed
4. Click "Send Request"

## For Employers

### Posting a Job
1. Navigate to **Admin** → **Employment** → **Employer Portal**
   - URL: `/admin/employment/employer-portal`
2. Click "Post New Job"
3. Fill in job details:
   - Employer name and job title
   - Job type and location
   - Pay rate and hours
   - Description and requirements
4. Click "Post Job"
5. Wait for career counselor approval

### Managing Job Postings
1. Go to **Employer Portal**
2. View all your postings in the "My Job Postings" tab
3. Use the edit/delete icons to manage listings
4. Check application counts

### Getting Verified
1. In **Employer Portal**, go to "Employer Profile" tab
2. Click "Request Verification"
3. Contact school administration to complete verification
4. Verified employers get better visibility

## For Career Counselors

### Reviewing Job Postings
1. Navigate to **Teacher/Admin** → **Employment** → **Counselor Workflow**
   - URL: `/teacher/employment/counselor` or `/admin/employment/counselor`
2. Go to "Job Listing Reviews" tab
3. Review pending jobs:
   - Check age appropriateness score
   - Assess academic interference risk
   - Review job details
4. Click "Review" and either Approve or Reject with notes

### Verifying Employment
1. In **Counselor Workflow**, go to "Employment Verification" tab
2. Review student employment records
3. Verify details are accurate
4. Click "Verify" or "Reject" with notes

### Monitoring Work Hours
1. Go to "Work Hour Monitoring" tab
2. View students approaching or exceeding limits
3. Take action on concerning cases

## Quick Reference

### Student URLs
- Job Board: `/student/employment/job-board`
- Job Details: `/student/employment/jobs/:id`
- Work Permits: `/student/employment/work-permits`
- My Employment: `/student/employment/my-employment`
- Work Hours: `/student/employment/work-hours`

### Admin/Employer URLs
- Employer Portal: `/admin/employment/employer-portal`
- Counselor Workflow: `/admin/employment/counselor`

### Teacher URLs
- Counselor Workflow: `/teacher/employment/counselor`

## Common Tasks

### Student: Apply for First Job
1. Get work permit → Apply to job → Log hours → Request reference

### Employer: Post First Job
1. Create listing → Wait for approval → Review applications

### Counselor: Daily Tasks
1. Review new job postings → Verify employment records → Monitor hours

## Compliance Rules

### Maximum Hours
- Default: 20 hours/week (configurable by permit)
- Warning at 80% (16 hours)
- Alert at 100% (20 hours)

### Academic Interference Risk
- **Low**: ≤15 hours/week (Green)
- **Medium**: 16-25 hours/week (Yellow)
- **High**: >25 hours/week (Red)

### Age Appropriateness
- Score: 0-100%
- **Good**: ≥80% (Green)
- **Review**: 60-79% (Yellow)
- **Concern**: <60% (Red)

## Tips

### For Students
- ✅ Apply for work permit before applying to jobs
- ✅ Log hours weekly to stay accurate
- ✅ Monitor your total weekly hours
- ✅ Request references before leaving a job
- ✅ Keep employment records updated
- ✅ Download work summary for college apps

### For Employers
- ✅ Get verified for better visibility
- ✅ Be clear about requirements
- ✅ Update postings regularly
- ✅ Respond to applications promptly
- ✅ Respect student work hour limits

### For Counselors
- ✅ Review postings within 3-5 days
- ✅ Consider both safety and academics
- ✅ Monitor students near hour limits
- ✅ Verify employment for graduation
- ✅ Communicate with students and employers

## Troubleshooting

### "I can't apply for jobs"
- Ensure you have an active, approved work permit

### "My hours aren't updating"
- Log hours in the Timesheet Integration section
- Check that you're logging to the correct job

### "I'm over my hour limit"
- Contact your career counselor immediately
- Adjust your work schedule
- Update your work permit if needed

### "My job posting isn't visible"
- Check if it's been approved by career counselor
- Verify your employer account status
- Check expiry date

### "I need to update my work permit"
- Current permits can't be edited
- Apply for a new permit with updated information
- Old permit will be marked inactive

## Support

For technical issues:
- Check the main documentation: `STUDENT_EMPLOYMENT_SYSTEM.md`
- Review created files: `EMPLOYMENT_FILES_CREATED.md`
- Contact system administrator

For employment-related questions:
- Contact your career counselor
- Check with school administration
- Review work permit regulations

## Next Steps

After getting started:
1. Explore all features in the employment section
2. Set up your employment profile
3. Keep records updated
4. Use the system regularly for compliance
5. Download work summaries for applications
