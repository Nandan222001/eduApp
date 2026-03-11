# Student Management System

## Quick Navigation

- 📖 [Full Implementation Guide](STUDENT_MANAGEMENT_IMPLEMENTATION.md)
- 🚀 [Quick Start Guide](STUDENT_MANAGEMENT_QUICK_START.md)
- 📋 [Implementation Summary](STUDENT_MANAGEMENT_SUMMARY.md)
- ✅ [Implementation Checklist](STUDENT_MANAGEMENT_CHECKLIST.md)

## Overview

A comprehensive student management system with advanced features including:
- **Student Directory** - Advanced search and filtering
- **Student Profiles** - Complete academic and personal details
- **Enrollment** - Multi-step form with photo upload
- **Bulk Import** - CSV import with validation
- **Promotion/Transfer** - Batch student operations
- **ID Cards** - Digital ID card generation and PDF download

## Quick Start

### 1. Database Setup

```bash
# Run migrations
alembic upgrade head
```

### 2. Start Backend

```bash
# From project root
poetry run uvicorn src.main:app --reload
```

### 3. Start Frontend

```bash
# From frontend directory
cd frontend
npm run dev
```

## Key Features

### 🔍 Student Directory
- Advanced search across multiple fields
- Filter by grade, section, status, gender
- Real-time statistics dashboard
- Bulk actions support

### 👤 Student Profile
- Personal and academic information
- Parent/guardian details
- Attendance tracking with percentages
- Performance charts and trends
- Assignment completion tracking

### 📝 Student Enrollment
- 4-step guided form
- Photo upload integration
- Parent linking system
- Comprehensive field coverage

### 📊 Bulk Operations
- CSV import with template
- Real-time validation and preview
- Error handling and reporting
- Bulk promotion and transfer

### 🎫 ID Card Management
- Digital ID card preview
- PDF generation and download
- Institution branding support
- Print-ready format

## API Endpoints

### Students
```
GET    /api/v1/students/                     # List students
GET    /api/v1/students/statistics           # Get statistics
GET    /api/v1/students/{id}                 # Get student
GET    /api/v1/students/{id}/profile         # Get full profile
POST   /api/v1/students/                     # Create student
PUT    /api/v1/students/{id}                 # Update student
DELETE /api/v1/students/{id}                 # Delete student
```

### File Operations
```
POST   /api/v1/students/{id}/upload-photo    # Upload photo
POST   /api/v1/students/bulk-import/preview  # Preview CSV
POST   /api/v1/students/bulk-import          # Import CSV
```

### Batch Operations
```
POST   /api/v1/students/promote              # Promote students
POST   /api/v1/students/transfer             # Transfer student
```

### ID Cards
```
GET    /api/v1/students/{id}/id-card         # Get ID card data
GET    /api/v1/students/{id}/id-card/download # Download PDF
```

### Parent Management
```
POST   /api/v1/students/parents              # Create parent
POST   /api/v1/students/{id}/parents/link    # Link parent
DELETE /api/v1/students/{id}/parents/{pid}   # Unlink parent
```

## Frontend Routes

```
/students                    # Student directory
/students/new                # Add new student
/students/:id/edit          # Edit student
/students/:id/profile       # Student profile
/students/:id/id-card       # Student ID card
/students/bulk-import       # Bulk CSV import
/students/promotion         # Student promotion
```

## Database Schema

### New Tables

**parents**
- Stores parent/guardian information
- Linked to institutions
- Can be linked to multiple students

**student_parents**
- Many-to-many relationship
- Student-parent linking
- Relation type and primary contact flag

### Enhanced Tables

**students**
- Added: nationality, religion, caste, category, aadhar_number
- Support for multiple parents
- Enhanced personal information

**institutions**
- Added: logo_url for ID cards

## CSV Import Format

### Required Fields
- `first_name` - Student's first name
- `last_name` - Student's last name

### Optional Fields
```
admission_number, roll_number, email, phone, date_of_birth,
gender, blood_group, address, parent_name, parent_email,
parent_phone, admission_date, grade_name, section_name,
emergency_contact_name, emergency_contact_phone,
emergency_contact_relation, previous_school,
medical_conditions, nationality, religion, caste,
category, aadhar_number
```

### Date Format
All dates must be in `YYYY-MM-DD` format (e.g., `2010-05-15`)

## Configuration

### Backend (.env)
```bash
# AWS S3 for photo storage
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket

# Database
DATABASE_URL=postgresql://user:pass@localhost/db
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
```

## Security Features

- JWT authentication on all endpoints
- Institution-level data isolation
- File type and size validation
- SQL injection prevention (ORM)
- XSS protection
- Input validation (Pydantic)

## Performance

- Database indexing on key fields
- Pagination support (configurable)
- Eager loading of relationships
- Batch operations for efficiency
- CSV streaming for large files

## Technology Stack

### Backend
- FastAPI 0.109+
- SQLAlchemy 2.0
- PostgreSQL
- AWS S3
- ReportLab (PDF)
- Pydantic

### Frontend
- React with TypeScript
- Material-UI (MUI)
- Chart.js
- Axios
- React Router

## Common Tasks

### Add a Student
```javascript
const student = await studentsApi.createStudent({
  institution_id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  section_id: 1
});
```

### Bulk Import
```javascript
const file = event.target.files[0];
const preview = await studentsApi.previewBulkImport(file);
if (preview.invalid_rows === 0) {
  const result = await studentsApi.bulkImport(file);
}
```

### Upload Photo
```javascript
const file = event.target.files[0];
const result = await studentsApi.uploadPhoto(studentId, file);
```

### Download ID Card
```javascript
const blob = await studentsApi.downloadIDCard(studentId);
const url = window.URL.createObjectURL(blob);
// Create download link
```

## Troubleshooting

### Migration Errors
```bash
# Reset migrations
alembic downgrade base
alembic upgrade head
```

### Photo Upload Fails
- Verify AWS S3 credentials in .env
- Check file size (max 10MB)
- Ensure supported format (JPEG, PNG)

### CSV Import Fails
- Check UTF-8 encoding
- Verify date format (YYYY-MM-DD)
- Remove duplicate emails/admission numbers
- Ensure required columns present

### Statistics Not Loading
- Verify students have section assignments
- Check sections are linked to grades
- Ensure database relationships are intact

## Support

For detailed information, see:
- [Full Implementation Guide](STUDENT_MANAGEMENT_IMPLEMENTATION.md) - Complete technical details
- [Quick Start Guide](STUDENT_MANAGEMENT_QUICK_START.md) - API examples and code snippets
- [Summary](STUDENT_MANAGEMENT_SUMMARY.md) - High-level overview
- [Checklist](STUDENT_MANAGEMENT_CHECKLIST.md) - Implementation verification

## Status

✅ **IMPLEMENTATION COMPLETE**

All requested features have been fully implemented:
- ✅ Student directory with advanced search and filters
- ✅ Student profile page with comprehensive details
- ✅ Student enrollment form with photo upload and parent linking
- ✅ Bulk import CSV wizard with error handling and preview
- ✅ Promotion/transfer tools
- ✅ ID card preview/download feature

## License

This is part of the institution management system. Refer to the main project license.
