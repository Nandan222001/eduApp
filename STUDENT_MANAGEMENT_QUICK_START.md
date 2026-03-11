# Student Management - Quick Start Guide

## Quick Setup

### 1. Run Database Migrations

```bash
# Run migrations to create parent tables and add new fields
alembic upgrade head
```

### 2. Start Backend Server

```bash
# From project root
poetry run uvicorn src.main:app --reload
```

### 3. Start Frontend Development Server

```bash
# From frontend directory
cd frontend
npm run dev
```

## Quick API Reference

### Student Management Endpoints

```
# List students with filters
GET /api/v1/students/?search=john&grade_id=1&status=active

# Get student statistics
GET /api/v1/students/statistics

# Get student profile
GET /api/v1/students/{id}/profile

# Create student
POST /api/v1/students/
Body: {
  "institution_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "parent_ids": [1, 2]
}

# Update student
PUT /api/v1/students/{id}
Body: { "first_name": "Jane" }

# Upload photo
POST /api/v1/students/{id}/upload-photo
Body: FormData with 'file'

# Bulk import preview
POST /api/v1/students/bulk-import/preview
Body: FormData with CSV file

# Bulk import
POST /api/v1/students/bulk-import
Body: FormData with CSV file

# Promote students
POST /api/v1/students/promote
Body: {
  "student_ids": [1, 2, 3],
  "target_grade_id": 2,
  "target_section_id": 5
}

# Transfer student
POST /api/v1/students/transfer
Body: {
  "student_id": 1,
  "target_section_id": 3
}

# Get ID card data
GET /api/v1/students/{id}/id-card

# Download ID card PDF
GET /api/v1/students/{id}/id-card/download
```

### Parent Management Endpoints

```
# Create parent
POST /api/v1/students/parents
Body: {
  "institution_id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "phone": "1234567890",
  "relation_type": "mother"
}

# Link parent to student
POST /api/v1/students/{student_id}/parents/link
Body: {
  "parent_id": 1,
  "relation_type": "mother",
  "is_primary_contact": true
}

# Unlink parent from student
DELETE /api/v1/students/{student_id}/parents/{parent_id}
```

## CSV Template Format

### Required Columns
- `first_name` - Student's first name (required)
- `last_name` - Student's last name (required)

### Optional Columns
```csv
admission_number,roll_number,email,phone,date_of_birth,gender,blood_group,
address,parent_name,parent_email,parent_phone,admission_date,grade_name,
section_name,emergency_contact_name,emergency_contact_phone,
emergency_contact_relation,previous_school,medical_conditions,nationality,
religion,caste,category,aadhar_number
```

### Example CSV

```csv
first_name,last_name,email,admission_number,gender,date_of_birth,grade_name,section_name,parent_name,parent_phone
John,Doe,john.doe@example.com,ADM001,male,2010-05-15,Grade 6,A,Jane Doe,1234567890
Alice,Smith,alice.smith@example.com,ADM002,female,2010-08-20,Grade 6,B,Bob Smith,0987654321
```

### Date Format
- Always use `YYYY-MM-DD` format
- Example: `2010-05-15`

## Frontend Routes

```
/students                    - Student directory
/students/new                - Add new student
/students/:id/edit          - Edit student
/students/:id/profile       - Student profile
/students/:id/id-card       - Student ID card
/students/bulk-import       - Bulk CSV import
/students/promotion         - Student promotion tool
```

## Common Operations

### 1. Add a Student

```javascript
// Frontend
const studentData = {
  institution_id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  section_id: 1,
  gender: "male",
  date_of_birth: "2010-05-15"
};

const student = await studentsApi.createStudent(studentData);
```

```python
# Backend
from src.schemas.student import StudentCreate
from src.services.student_service import StudentService

student_data = StudentCreate(
    institution_id=1,
    first_name="John",
    last_name="Doe",
    email="john@example.com",
    section_id=1,
    gender="male"
)

service = StudentService(db)
student = service.create_student(student_data)
```

### 2. Search Students

```javascript
// Frontend
const result = await studentsApi.listStudents({
  search: "john",
  grade_id: 1,
  status: "active",
  skip: 0,
  limit: 10
});

console.log(result.items); // Array of students
console.log(result.total); // Total count
```

### 3. Upload Photo

```javascript
// Frontend
const file = event.target.files[0];
const result = await studentsApi.uploadPhoto(studentId, file);
console.log(result.photo_url); // URL of uploaded photo
```

### 4. Bulk Import

```javascript
// Frontend
const file = event.target.files[0];

// Preview first
const preview = await studentsApi.previewBulkImport(file);
console.log(`Valid: ${preview.valid_rows}, Invalid: ${preview.invalid_rows}`);

// Import if validation passes
if (preview.invalid_rows === 0) {
  const result = await studentsApi.bulkImport(file);
  console.log(`Imported: ${result.success}, Failed: ${result.failed}`);
}
```

### 5. Promote Students

```javascript
// Frontend
const promotionData = {
  student_ids: [1, 2, 3],
  target_grade_id: 7,
  target_section_id: 2,
  effective_date: "2024-04-01"
};

const result = await studentsApi.promoteStudents(promotionData);
console.log(`Promoted: ${result.promoted}, Failed: ${result.failed}`);
```

### 6. Download ID Card

```javascript
// Frontend
const blob = await studentsApi.downloadIDCard(studentId);

// Create download link
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `student_${studentId}_id_card.pdf`;
link.click();
```

## Database Queries

### Get Students with Filters

```python
from src.services.student_service import StudentService

service = StudentService(db)
students, total = service.list_students(
    institution_id=1,
    grade_id=1,
    section_id=2,
    status="active",
    gender="male",
    search="john",
    skip=0,
    limit=10
)
```

### Get Student Profile

```python
service = StudentService(db)
profile = service.get_student_profile(student_id=1)

# Profile includes:
# - Basic student info
# - Section and grade info
# - Parent information
# - Attendance summary
# - Recent performance
# - Assignment stats
```

### Get Statistics

```python
service = StudentService(db)
stats = service.get_statistics(institution_id=1)

# Returns:
# - total_students
# - active_students
# - male_students, female_students
# - students_by_grade (dict)
# - students_by_status (dict)
```

## Validation Rules

### Student Creation
- `first_name` and `last_name` are required
- `email` must be unique per institution (if provided)
- `admission_number` must be unique per institution (if provided)
- `date_of_birth` must be in YYYY-MM-DD format
- `gender` must be one of: male, female, other
- `status` must be one of: active, inactive, graduated, transferred

### Photo Upload
- Allowed formats: JPEG, PNG
- Maximum file size: 10MB
- Recommended size: 500x500 pixels

### CSV Import
- File must be UTF-8 encoded
- First row must contain column headers
- Required columns: first_name, last_name
- Dates must be in YYYY-MM-DD format
- No duplicate emails or admission numbers

## Troubleshooting

### Issue: Migration Error
```bash
# Solution: Reset and rerun migrations
alembic downgrade base
alembic upgrade head
```

### Issue: Photo Upload Fails
```python
# Check S3 configuration in .env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
```

### Issue: CSV Import Fails
- Verify UTF-8 encoding
- Check for required columns
- Validate date formats
- Remove duplicate emails/admission numbers

### Issue: Statistics Not Loading
```python
# Ensure students have proper relationships
# Check that students are linked to sections
# Verify sections are linked to grades
```

## Performance Tips

1. **Use Pagination**: Always use skip/limit for large datasets
2. **Batch Operations**: Use bulk import for multiple students
3. **Lazy Loading**: Load related data only when needed
4. **Caching**: Cache statistics and frequently accessed data
5. **Indexing**: Database indexes are already configured

## Security Best Practices

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Check institution_id matches user's institution
3. **File Validation**: Validate file types and sizes before upload
4. **Input Sanitization**: All inputs are validated via Pydantic
5. **SQL Injection**: Prevented by using ORM (SQLAlchemy)

## Next Steps

1. Explore the full implementation in `STUDENT_MANAGEMENT_IMPLEMENTATION.md`
2. Check API documentation at `/docs` (Swagger UI)
3. Review database models in `src/models/student.py`
4. Test endpoints using the provided Postman collection
5. Customize forms and validations as needed
