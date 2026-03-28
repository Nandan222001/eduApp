# Community Service Hours Tracking and Verification

This module provides comprehensive community service hours tracking and verification for students, including external organization verification, service portfolios, and graduation requirement tracking.

## Features

### 1. Service Activity Management
- Log community service activities with detailed information
- Track multiple activity types: volunteer, fundraising, environmental, tutoring, healthcare, and animal welfare
- Store activity details including organization info, contact person, hours, description, impact statement, and reflection essay
- Attach supporting documents (photos, letters, etc.)

### 2. External Organization Verification
- Send automated verification emails to organization contacts
- Unique verification links with 30-day expiration
- Organization contacts can verify hours via web portal (no account required)
- Optional digital signature collection
- Verification comments and feedback

### 3. Service Portfolio
- Automatic portfolio generation for each student
- Track total hours, verified hours, pending hours, and rejected hours
- Breakdown by activity type (volunteer, fundraising, environmental, etc.)
- Track number of organizations served
- Last activity date tracking
- Activity and organization breakdowns with percentages

### 4. Graduation Requirements
- Define community service hour requirements by grade level
- Set requirements by activity type (e.g., 10 hours of environmental service)
- Track student progress toward requirements
- Automatic progress calculation
- Completion status and percentage tracking
- Support for mandatory and optional requirements

### 5. Organization Contact Management
- Maintain database of verified organizations
- Store organization details: name, contact info, address, website, type
- Mark organizations as verified or active
- Search and filter organizations
- Reuse organization contacts for future activities

### 6. Certificates
- Generate certificates for college applications
- Include total verified hours
- Multiple certificate types (college application, scholarship, general)
- Digital signatures from school officials
- Certificate numbering system
- PDF generation support (when configured)

### 7. Reporting
- Individual student reports with activity breakdown
- Institution-wide reports with statistics
- Monthly trends analysis
- Top organizations by hours
- Export to CSV for external analysis
- Activity type distribution charts

## API Endpoints

### Service Activities
- `POST /api/v1/community-service/activities` - Log a new service activity
- `GET /api/v1/community-service/activities` - List activities with filters
- `GET /api/v1/community-service/activities/{id}` - Get activity details
- `PUT /api/v1/community-service/activities/{id}` - Update activity (pending only)
- `DELETE /api/v1/community-service/activities/{id}` - Delete activity (pending only)
- `POST /api/v1/community-service/verify-external` - External verification endpoint
- `POST /api/v1/community-service/activities/{id}/reject` - Reject activity (admin/teacher)

### Organization Contacts
- `POST /api/v1/community-service/organizations` - Create organization contact
- `GET /api/v1/community-service/organizations` - List organizations
- `PUT /api/v1/community-service/organizations/{id}` - Update organization

### Student Portfolio
- `GET /api/v1/community-service/portfolio/{student_id}` - Get student portfolio with details

### Graduation Requirements
- `POST /api/v1/community-service/requirements` - Create graduation requirement
- `GET /api/v1/community-service/requirements` - List requirements
- `PUT /api/v1/community-service/requirements/{id}` - Update requirement
- `GET /api/v1/community-service/graduation-status/{student_id}` - Get graduation status

### Certificates
- `POST /api/v1/community-service/certificates` - Generate certificate
- `GET /api/v1/community-service/certificates` - List certificates

### Reports
- `GET /api/v1/community-service/reports/student/{student_id}` - Student service report
- `GET /api/v1/community-service/reports/institution` - Institution-wide report
- `POST /api/v1/community-service/export` - Export data to CSV

## Data Models

### ServiceActivity
- Core activity tracking model
- Links to student and institution
- Contains organization contact information
- Tracks verification status and verification details
- Stores verification token for external verification
- Supports attachments and metadata

### OrganizationContact
- Master list of organization contacts
- Can be marked as verified
- Reusable across activities
- Stores organization type and details

### ServicePortfolio
- Aggregated student statistics
- Calculated from activities
- Updated automatically on activity changes
- One per student per institution

### GraduationRequirement
- Institution or grade-level requirements
- Can be specific to activity type or general
- Supports academic year scoping
- Mandatory or optional designation

### StudentGraduationProgress
- Tracks student progress on each requirement
- Automatically calculated
- Shows completion status and percentage
- Records completion date

### ServiceCertificate
- Official certificates for students
- Linked to academic year
- Digital signature support
- Multiple purposes (college, scholarship, etc.)

## Workflows

### 1. Logging Service Hours
1. Student creates service activity with organization details
2. System generates unique verification token
3. Automated email sent to organization contact with verification link
4. Activity status: PENDING

### 2. External Verification
1. Organization contact receives email with verification link
2. Contact clicks link (valid for 30 days)
3. Contact reviews activity details
4. Contact verifies hours and optionally adds signature/comments
5. Activity status: VERIFIED
6. Student portfolio automatically updated
7. Graduation progress recalculated

### 3. Admin Rejection
1. Teacher/admin reviews pending activity
2. If activity invalid, admin rejects with reason
3. Activity status: REJECTED
4. Rejection reason stored in metadata
5. Student notified of rejection

### 4. Graduation Requirement Tracking
1. School sets graduation requirements (e.g., 20 hours total, 5 hours environmental)
2. As students log and verify hours, progress automatically calculated
3. System tracks completion percentage
4. Students can view their progress toward requirements

### 5. Certificate Generation
1. Student or admin requests certificate
2. System validates verified hours exist
3. Certificate generated with unique number
4. Signed by authorized school official
5. Available for download/print

## Verification Email Template

When a service activity is logged, an email is sent to the organization contact:

**Subject:** Community Service Hour Verification Request - [Student Name]

**Content:**
- Student name and activity details
- Date and hours logged
- Description of service
- Verification button/link
- 30-day expiration notice
- Contact information

## Configuration

### Environment Variables
- `SENDGRID_API_KEY` - For sending verification emails
- `SENDER_EMAIL` - From email address
- `SENDER_NAME` - From name for emails

### Settings
- Verification token expiration: 30 days (configurable in code)
- Certificate number format: CS-{institution_id}-{student_id}-{timestamp}

## Security

- Verification tokens are cryptographically secure (using `secrets.token_urlsafe`)
- Tokens expire after 30 days
- One-time use tokens (status changes prevent reuse)
- Institution-scoped data access
- Role-based access control (teachers can reject, students can log)

## Best Practices

1. **Organization Contacts**: Maintain accurate organization contact database
2. **Verification**: Encourage timely verification to avoid token expiration
3. **Documentation**: Require impact statements and reflections for quality
4. **Requirements**: Set realistic and clear graduation requirements
5. **Certificates**: Generate certificates only after verification
6. **Reporting**: Regular monitoring of institution-wide participation

## Future Enhancements

1. SMS verification option
2. Mobile app for logging hours
3. Photo upload for activities
4. Integration with popular service organizations
5. Automatic hour calculation from check-in/check-out
6. Volunteer opportunity matching
7. Service hour leaderboards
8. Parent notification of logged hours
9. Multi-language support for verification emails
10. Integration with college application platforms (Common App, etc.)

## Database Schema

The module uses 6 main tables:
- `service_activities` - Individual service activities
- `organization_contacts` - Organization contact directory
- `service_portfolios` - Student aggregated statistics
- `graduation_requirements` - School/grade requirements
- `student_graduation_progress` - Individual student progress
- `service_certificates` - Generated certificates

See migration file `028_create_community_service_tables.py` for complete schema.

## Example Usage

### Logging Service Hours
```python
{
    "student_id": 123,
    "activity_name": "Beach Cleanup",
    "organization_name": "Ocean Conservation Society",
    "contact_person": "Jane Smith",
    "contact_email": "jane@oceanconservation.org",
    "contact_phone": "555-1234",
    "activity_type": "environmental",
    "date": "2024-01-15",
    "hours_logged": 4.5,
    "description": "Helped clean up beach and collect data on marine debris",
    "impact_statement": "Collected 50 lbs of trash and recycling from beach",
    "reflection_essay": "This experience taught me about ocean pollution..."
}
```

### Setting Graduation Requirements
```python
{
    "requirement_name": "Environmental Service",
    "required_hours": 5,
    "activity_type": "environmental",
    "is_mandatory": true,
    "description": "Students must complete 5 hours of environmental service",
    "grade_id": 12  # For senior class
}
```

### External Verification
```python
# Organization contact visits verification link
{
    "verification_token": "abc123...",
    "signature_url": "https://example.com/signatures/jane-smith.png",
    "comments": "Student was punctual and worked diligently throughout the event"
}
```
