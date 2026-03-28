# Institution Management System - Implementation Guide

## Overview

This document provides a comprehensive guide to the Institution Management System implementation. The system provides complete CRUD operations for educational institutions, including academic structure, teacher and student management, and bulk import capabilities.

## Features

### 1. Institution Management
- Create, read, update, and delete institutions
- Track institution statistics (users, teachers, students, etc.)
- Filter and search institutions
- Pagination support

### 2. Academic Year Configuration
- Define academic years with start and end dates
- Mark current and active academic years
- Automatically handle current year transitions
- Link grades to academic years

### 3. Grade Management
- Create and manage grades/classes
- Assign display order for proper sorting
- Link grades to academic years
- Activate/deactivate grades

### 4. Section Management
- Create sections within grades
- Set capacity limits for sections
- Manage section assignments
- Track section status

### 5. Subject Management
- Create and manage subjects
- Assign subject codes
- Link subjects to grades
- Mark subjects as compulsory or optional
- Assign subjects to teachers

### 6. Teacher Management
- Comprehensive teacher profiles
- Employee ID tracking
- Qualification and specialization tracking
- Subject assignments
- CSV bulk import
- Search and filter capabilities

### 7. Student Management
- Detailed student profiles
- Admission number and roll number tracking
- Parent/guardian information
- Section assignments
- Blood group and medical information
- CSV bulk import
- Search and filter capabilities

### 8. User Profile Management
- Unified user profile view
- Linked teacher/student profiles
- Profile updates
- Security and authorization

## Database Schema

### Core Tables

#### academic_years
- Links: institution_id → institutions.id
- Manages academic year periods
- Tracks current and active status

#### grades
- Links: institution_id → institutions.id, academic_year_id → academic_years.id
- Represents grade levels (e.g., Grade 1, Grade 2)
- Ordered by display_order

#### sections
- Links: institution_id → institutions.id, grade_id → grades.id
- Represents sections within grades (e.g., Section A, Section B)
- Has capacity limits

#### subjects
- Links: institution_id → institutions.id
- Represents subjects taught at the institution
- Has unique codes within institution

#### grade_subjects
- Links: grade_id → grades.id, subject_id → subjects.id
- Many-to-many relationship between grades and subjects
- Marks subjects as compulsory or optional

#### teachers
- Links: institution_id → institutions.id, user_id → users.id (optional)
- Stores teacher profile information
- Can be linked to a user account

#### teacher_subjects
- Links: teacher_id → teachers.id, subject_id → subjects.id
- Many-to-many relationship between teachers and subjects
- Marks primary subject specialization

#### students
- Links: institution_id → institutions.id, user_id → users.id (optional), section_id → sections.id (optional)
- Stores student profile information
- Can be linked to a user account
- Assigned to sections

## API Endpoints

### Institution Endpoints
- `POST /api/v1/institutions/` - Create institution (superuser)
- `GET /api/v1/institutions/` - List institutions (superuser)
- `GET /api/v1/institutions/{id}` - Get institution
- `GET /api/v1/institutions/{id}/stats` - Get institution stats
- `PUT /api/v1/institutions/{id}` - Update institution
- `DELETE /api/v1/institutions/{id}` - Delete institution (superuser)

### Academic Year Endpoints
- `POST /api/v1/academic-years/` - Create academic year
- `GET /api/v1/academic-years/` - List academic years
- `GET /api/v1/academic-years/{id}` - Get academic year
- `PUT /api/v1/academic-years/{id}` - Update academic year
- `DELETE /api/v1/academic-years/{id}` - Delete academic year

### Grade Endpoints
- `POST /api/v1/grades/` - Create grade
- `GET /api/v1/grades/` - List grades
- `GET /api/v1/grades/{id}` - Get grade
- `PUT /api/v1/grades/{id}` - Update grade
- `DELETE /api/v1/grades/{id}` - Delete grade

### Section Endpoints
- `POST /api/v1/sections/` - Create section
- `GET /api/v1/sections/` - List sections
- `GET /api/v1/sections/{id}` - Get section
- `PUT /api/v1/sections/{id}` - Update section
- `DELETE /api/v1/sections/{id}` - Delete section

### Subject Endpoints
- `POST /api/v1/subjects/` - Create subject
- `GET /api/v1/subjects/` - List subjects
- `GET /api/v1/subjects/{id}` - Get subject
- `PUT /api/v1/subjects/{id}` - Update subject
- `DELETE /api/v1/subjects/{id}` - Delete subject
- `POST /api/v1/subjects/grade-subjects` - Assign subject to grade
- `DELETE /api/v1/subjects/grade-subjects/{grade_id}/{subject_id}` - Remove subject from grade
- `GET /api/v1/subjects/grades/{grade_id}/subjects` - Get grade subjects

### Teacher Endpoints
- `POST /api/v1/teachers/` - Create teacher
- `GET /api/v1/teachers/` - List teachers
- `GET /api/v1/teachers/{id}` - Get teacher
- `PUT /api/v1/teachers/{id}` - Update teacher
- `DELETE /api/v1/teachers/{id}` - Delete teacher
- `POST /api/v1/teachers/bulk-import` - Bulk import teachers
- `POST /api/v1/teachers/teacher-subjects` - Assign subject to teacher
- `DELETE /api/v1/teachers/teacher-subjects/{teacher_id}/{subject_id}` - Remove subject
- `GET /api/v1/teachers/{id}/subjects` - Get teacher subjects

### Student Endpoints
- `POST /api/v1/students/` - Create student
- `GET /api/v1/students/` - List students
- `GET /api/v1/students/{id}` - Get student
- `PUT /api/v1/students/{id}` - Update student
- `DELETE /api/v1/students/{id}` - Delete student
- `POST /api/v1/students/bulk-import` - Bulk import students

### Profile Endpoints
- `GET /api/v1/profile/me` - Get my profile
- `PUT /api/v1/profile/me` - Update my profile
- `GET /api/v1/profile/{user_id}` - Get user profile
- `PUT /api/v1/profile/{user_id}` - Update user profile

## Installation & Setup

### 1. Database Migration

Run the migration to create all necessary tables:

```bash
alembic upgrade head
```

### 2. Verify Models

Ensure all models are properly imported in `src/models/__init__.py`.

### 3. Test API Endpoints

Start the development server:

```bash
poetry run uvicorn src.main:app --reload
```

Visit `http://localhost:8000/docs` to access the interactive API documentation.

## Usage Examples

### Creating an Academic Structure

1. **Create Academic Year**
```bash
curl -X POST "http://localhost:8000/api/v1/academic-years/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "name": "2024-2025",
    "start_date": "2024-04-01",
    "end_date": "2025-03-31",
    "is_current": true,
    "is_active": true
  }'
```

2. **Create Grades**
```bash
curl -X POST "http://localhost:8000/api/v1/grades/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "academic_year_id": 1,
    "name": "Grade 10",
    "display_order": 10,
    "is_active": true
  }'
```

3. **Create Sections**
```bash
curl -X POST "http://localhost:8000/api/v1/sections/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "grade_id": 1,
    "name": "Section A",
    "capacity": 40,
    "is_active": true
  }'
```

4. **Create Subjects**
```bash
curl -X POST "http://localhost:8000/api/v1/subjects/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "name": "Mathematics",
    "code": "MATH101",
    "is_active": true
  }'
```

5. **Assign Subject to Grade**
```bash
curl -X POST "http://localhost:8000/api/v1/subjects/grade-subjects" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "grade_id": 1,
    "subject_id": 1,
    "is_compulsory": true
  }'
```

### Bulk Importing Teachers

1. **Prepare CSV file** (teachers.csv):
```csv
employee_id,first_name,last_name,email,phone,qualification,specialization
T001,John,Doe,john.doe@school.com,+1234567890,M.Ed.,Mathematics
T002,Jane,Smith,jane.smith@school.com,+1234567891,M.Sc.,Physics
```

2. **Upload CSV**:
```bash
curl -X POST "http://localhost:8000/api/v1/teachers/bulk-import" \
  -H "Authorization: Bearer <token>" \
  -F "file=@teachers.csv"
```

### Bulk Importing Students

1. **Prepare CSV file** (students.csv):
```csv
admission_number,first_name,last_name,email,grade_name,section_name,parent_email
S001,Alice,Williams,alice@student.com,Grade 10,Section A,parent1@email.com
S002,Bob,Brown,bob@student.com,Grade 10,Section A,parent2@email.com
```

2. **Upload CSV**:
```bash
curl -X POST "http://localhost:8000/api/v1/students/bulk-import" \
  -H "Authorization: Bearer <token>" \
  -F "file=@students.csv"
```

## Security & Authorization

### Role-Based Access Control

- **Superuser**: Full access to all institutions
- **Institution Admin**: Access to their own institution's data
- **Teacher**: Access to their profile and assigned data
- **Student**: Access to their profile

### Institution Isolation

All data is automatically filtered by institution_id to ensure data isolation between institutions.

### Permission Checks

Each endpoint verifies:
1. User authentication (valid JWT token)
2. User's institution matches resource's institution
3. User has required permissions for the operation

## Filtering & Pagination

### Pagination Parameters
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100, max: 100)

### Filtering Parameters
- `search`: Text search across relevant fields
- `is_active`: Filter by active status
- Entity-specific filters (grade_id, section_id, academic_year_id, etc.)

## Error Handling

The system provides detailed error messages:

- **400 Bad Request**: Validation errors, duplicate entries
- **401 Unauthorized**: Invalid or missing authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server errors

## Performance Considerations

### Indexing
- All foreign keys are indexed
- Search fields (email, name, etc.) are indexed
- Composite unique constraints ensure data integrity

### Eager Loading
- Related data is loaded using `joinedload` to reduce queries
- Optimized for common access patterns

### Caching
- Consider implementing Redis caching for:
  - Institution settings
  - Academic year lookups
  - Grade and section lists

## Best Practices

1. **Academic Structure Setup**
   - Create academic year first
   - Then create grades linked to academic year
   - Then create sections linked to grades
   - Finally assign subjects to grades

2. **Data Import**
   - Start with teachers (no dependencies)
   - Then import students (requires sections to exist)
   - Verify grade/section structure before student import

3. **Data Validation**
   - Validate CSV files before upload
   - Handle errors gracefully
   - Keep backup of original data

4. **Search & Filter**
   - Use search parameters to reduce data transfer
   - Implement pagination for large datasets
   - Cache frequently accessed data

5. **User Management**
   - Link teacher/student profiles to user accounts for login
   - Keep user_id optional for profiles not yet linked
   - Sync email addresses between user and profile

## Troubleshooting

### Common Issues

**Issue**: Duplicate email errors during import
- **Solution**: Check for existing records, clean CSV data

**Issue**: Section not found during student import
- **Solution**: Ensure grade and section exist, verify names match exactly

**Issue**: Permission denied errors
- **Solution**: Verify user's role and institution_id

**Issue**: Academic year conflicts
- **Solution**: Only one academic year should be marked as current

## Future Enhancements

Potential areas for expansion:

1. **Attendance System**: Track student and teacher attendance
2. **Timetable Management**: Schedule classes and assignments
3. **Grade Books**: Record and manage student grades
4. **Communication**: Parent-teacher messaging system
5. **Fee Management**: Track fee payments and dues
6. **Reports**: Generate various academic reports
7. **Analytics**: Dashboard with insights and trends
8. **Mobile App**: Mobile access for parents and students

## Support & Documentation

- API Documentation: `/docs` (Swagger UI)
- Alternative API Docs: `/redoc` (ReDoc)
- Bulk Import Templates: See `docs/bulk_import_templates.md`
- Full API Reference: See `docs/institution_management_api.md`

## License

This implementation is part of the FastAPI application and follows the same license terms.
