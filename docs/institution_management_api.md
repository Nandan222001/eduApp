# Institution Management API Documentation

This document provides comprehensive information about the Institution Management API endpoints.

## Table of Contents

1. [Institutions](#institutions)
2. [Academic Years](#academic-years)
3. [Grades](#grades)
4. [Sections](#sections)
5. [Subjects](#subjects)
6. [Teachers](#teachers)
7. [Students](#students)
8. [User Profile](#user-profile)

---

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Institutions

### Create Institution
**POST** `/api/v1/institutions/`

Creates a new institution (superuser only).

**Request Body:**
```json
{
  "name": "ABC School",
  "slug": "abc-school",
  "domain": "abc-school.edu",
  "description": "A leading educational institution",
  "is_active": true,
  "max_users": 1000,
  "settings": "{\"timezone\": \"UTC\"}"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "ABC School",
  "slug": "abc-school",
  "domain": "abc-school.edu",
  "description": "A leading educational institution",
  "is_active": true,
  "max_users": 1000,
  "settings": "{\"timezone\": \"UTC\"}",
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T10:00:00"
}
```

### List Institutions
**GET** `/api/v1/institutions/`

Lists all institutions with filtering and pagination (superuser only).

**Query Parameters:**
- `skip` (int, default: 0): Number of records to skip
- `limit` (int, default: 100, max: 100): Number of records to return
- `search` (string, optional): Search by name, slug, or domain
- `is_active` (boolean, optional): Filter by active status

**Response:** `200 OK`
```json
{
  "items": [...],
  "total": 50,
  "skip": 0,
  "limit": 100
}
```

### Get Institution
**GET** `/api/v1/institutions/{institution_id}`

Retrieves a specific institution.

**Response:** `200 OK`

### Get Institution Stats
**GET** `/api/v1/institutions/{institution_id}/stats`

Retrieves statistics for an institution.

**Response:** `200 OK`
```json
{
  "total_users": 150,
  "active_users": 145,
  "total_teachers": 50,
  "active_teachers": 48,
  "total_students": 500,
  "active_students": 495,
  "total_academic_years": 5,
  "total_grades": 12,
  "total_sections": 36,
  "total_subjects": 25
}
```

### Update Institution
**PUT** `/api/v1/institutions/{institution_id}`

Updates an institution.

**Request Body:**
```json
{
  "name": "Updated School Name",
  "is_active": true
}
```

**Response:** `200 OK`

### Delete Institution
**DELETE** `/api/v1/institutions/{institution_id}`

Deletes an institution (superuser only).

**Response:** `204 No Content`

---

## Academic Years

### Create Academic Year
**POST** `/api/v1/academic-years/`

Creates a new academic year.

**Request Body:**
```json
{
  "institution_id": 1,
  "name": "2024-2025",
  "start_date": "2024-04-01",
  "end_date": "2025-03-31",
  "is_active": true,
  "is_current": true,
  "description": "Academic year 2024-2025"
}
```

**Response:** `201 Created`

### List Academic Years
**GET** `/api/v1/academic-years/`

Lists academic years for the current user's institution.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `is_active` (boolean, optional)
- `is_current` (boolean, optional)

**Response:** `200 OK`

### Get Academic Year
**GET** `/api/v1/academic-years/{academic_year_id}`

### Update Academic Year
**PUT** `/api/v1/academic-years/{academic_year_id}`

### Delete Academic Year
**DELETE** `/api/v1/academic-years/{academic_year_id}`

---

## Grades

### Create Grade
**POST** `/api/v1/grades/`

Creates a new grade.

**Request Body:**
```json
{
  "institution_id": 1,
  "academic_year_id": 1,
  "name": "Grade 10",
  "display_order": 10,
  "description": "Tenth grade",
  "is_active": true
}
```

**Response:** `201 Created`

### List Grades
**GET** `/api/v1/grades/`

Lists grades for the current user's institution.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `academic_year_id` (int, optional)
- `is_active` (boolean, optional)

**Response:** `200 OK`

### Get Grade
**GET** `/api/v1/grades/{grade_id}`

### Update Grade
**PUT** `/api/v1/grades/{grade_id}`

### Delete Grade
**DELETE** `/api/v1/grades/{grade_id}`

---

## Sections

### Create Section
**POST** `/api/v1/sections/`

Creates a new section.

**Request Body:**
```json
{
  "institution_id": 1,
  "grade_id": 1,
  "name": "Section A",
  "capacity": 40,
  "description": "Section A for Grade 10",
  "is_active": true
}
```

**Response:** `201 Created`

### List Sections
**GET** `/api/v1/sections/`

Lists sections for the current user's institution.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `grade_id` (int, optional)
- `is_active` (boolean, optional)

**Response:** `200 OK`

### Get Section
**GET** `/api/v1/sections/{section_id}`

### Update Section
**PUT** `/api/v1/sections/{section_id}`

### Delete Section
**DELETE** `/api/v1/sections/{section_id}`

---

## Subjects

### Create Subject
**POST** `/api/v1/subjects/`

Creates a new subject.

**Request Body:**
```json
{
  "institution_id": 1,
  "name": "Mathematics",
  "code": "MATH101",
  "description": "Advanced Mathematics",
  "is_active": true
}
```

**Response:** `201 Created`

### List Subjects
**GET** `/api/v1/subjects/`

Lists subjects for the current user's institution.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `search` (string, optional)
- `is_active` (boolean, optional)

**Response:** `200 OK`

### Get Subject
**GET** `/api/v1/subjects/{subject_id}`

### Update Subject
**PUT** `/api/v1/subjects/{subject_id}`

### Delete Subject
**DELETE** `/api/v1/subjects/{subject_id}`

### Assign Subject to Grade
**POST** `/api/v1/subjects/grade-subjects`

Assigns a subject to a grade.

**Request Body:**
```json
{
  "institution_id": 1,
  "grade_id": 1,
  "subject_id": 5,
  "is_compulsory": true
}
```

**Response:** `201 Created`

### Remove Subject from Grade
**DELETE** `/api/v1/subjects/grade-subjects/{grade_id}/{subject_id}`

### Get Grade Subjects
**GET** `/api/v1/subjects/grades/{grade_id}/subjects`

Returns all subjects assigned to a grade.

---

## Teachers

### Create Teacher
**POST** `/api/v1/teachers/`

Creates a new teacher.

**Request Body:**
```json
{
  "institution_id": 1,
  "user_id": null,
  "employee_id": "T001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@school.com",
  "phone": "+1234567890",
  "date_of_birth": "1985-05-15",
  "gender": "Male",
  "address": "123 Main St, City",
  "qualification": "M.Ed.",
  "specialization": "Mathematics",
  "joining_date": "2020-08-01",
  "is_active": true
}
```

**Response:** `201 Created`

### List Teachers
**GET** `/api/v1/teachers/`

Lists teachers for the current user's institution.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `search` (string, optional)
- `is_active` (boolean, optional)

**Response:** `200 OK`

### Get Teacher
**GET** `/api/v1/teachers/{teacher_id}`

### Update Teacher
**PUT** `/api/v1/teachers/{teacher_id}`

### Delete Teacher
**DELETE** `/api/v1/teachers/{teacher_id}`

### Bulk Import Teachers
**POST** `/api/v1/teachers/bulk-import`

Imports multiple teachers from a CSV file.

**Request:** Multipart form-data
- `file`: CSV file

**Response:** `200 OK`
```json
{
  "total": 100,
  "success": 95,
  "failed": 5,
  "errors": [
    {
      "row": 10,
      "email": "duplicate@school.com",
      "error": "Teacher with this email already exists"
    }
  ]
}
```

### Assign Subject to Teacher
**POST** `/api/v1/teachers/teacher-subjects`

**Request Body:**
```json
{
  "institution_id": 1,
  "teacher_id": 5,
  "subject_id": 10,
  "is_primary": true
}
```

### Remove Subject from Teacher
**DELETE** `/api/v1/teachers/teacher-subjects/{teacher_id}/{subject_id}`

### Get Teacher Subjects
**GET** `/api/v1/teachers/{teacher_id}/subjects`

---

## Students

### Create Student
**POST** `/api/v1/students/`

Creates a new student.

**Request Body:**
```json
{
  "institution_id": 1,
  "user_id": null,
  "section_id": 1,
  "admission_number": "S001",
  "roll_number": "1",
  "first_name": "Alice",
  "last_name": "Williams",
  "email": "alice.w@student.com",
  "phone": "+1234567893",
  "date_of_birth": "2010-04-12",
  "gender": "Female",
  "blood_group": "A+",
  "address": "321 Elm St, City",
  "parent_name": "Mary Williams",
  "parent_email": "mary.w@parent.com",
  "parent_phone": "+1234567894",
  "admission_date": "2023-06-15",
  "is_active": true
}
```

**Response:** `201 Created`

### List Students
**GET** `/api/v1/students/`

Lists students for the current user's institution.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `section_id` (int, optional)
- `search` (string, optional)
- `is_active` (boolean, optional)

**Response:** `200 OK`

### Get Student
**GET** `/api/v1/students/{student_id}`

### Update Student
**PUT** `/api/v1/students/{student_id}`

### Delete Student
**DELETE** `/api/v1/students/{student_id}`

### Bulk Import Students
**POST** `/api/v1/students/bulk-import`

Imports multiple students from a CSV file.

**Request:** Multipart form-data
- `file`: CSV file

**Response:** `200 OK`
```json
{
  "total": 500,
  "success": 490,
  "failed": 10,
  "errors": [
    {
      "row": 25,
      "admission_number": "S025",
      "error": "Student with this admission number already exists"
    }
  ]
}
```

---

## User Profile

### Get My Profile
**GET** `/api/v1/profile/me`

Retrieves the current user's complete profile including teacher or student profile if linked.

**Response:** `200 OK`
```json
{
  "id": 1,
  "institution_id": 1,
  "role_id": 2,
  "email": "user@school.com",
  "username": "user123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "is_active": true,
  "is_superuser": false,
  "email_verified": true,
  "last_login": "2024-01-15T10:00:00",
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-15T10:00:00",
  "institution": {
    "id": 1,
    "name": "ABC School",
    "slug": "abc-school"
  },
  "role": {
    "id": 2,
    "name": "Teacher",
    "slug": "teacher"
  },
  "teacher_profile": {
    "id": 5,
    "employee_id": "T001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@school.com",
    "phone": "+1234567890",
    "date_of_birth": "1985-05-15",
    "gender": "Male",
    "address": "123 Main St, City",
    "qualification": "M.Ed.",
    "specialization": "Mathematics",
    "joining_date": "2020-08-01",
    "is_active": true
  }
}
```

### Update My Profile
**PUT** `/api/v1/profile/me`

Updates the current user's profile.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response:** `200 OK`

### Get User Profile
**GET** `/api/v1/profile/{user_id}`

Retrieves a specific user's profile (own profile or superuser only).

### Update User Profile
**PUT** `/api/v1/profile/{user_id}`

Updates a specific user's profile (own profile or superuser only).

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

API requests may be rate-limited. Check response headers for rate limit information:
- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Pagination

List endpoints support pagination with the following parameters:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records to return (default: 100, max: 100)

Response includes pagination metadata:
```json
{
  "items": [...],
  "total": 500,
  "skip": 0,
  "limit": 100
}
```

---

## Filtering and Search

Many list endpoints support filtering and search:
- `search`: Full-text search across relevant fields
- `is_active`: Filter by active status
- Entity-specific filters (e.g., `grade_id`, `section_id`, `academic_year_id`)

---

## Best Practices

1. **Use Pagination**: Always use pagination for list endpoints to improve performance
2. **Filter Results**: Use filters to reduce data transfer and improve response times
3. **Handle Errors**: Implement proper error handling for all API responses
4. **Cache Responses**: Cache frequently accessed data where appropriate
5. **Batch Operations**: Use bulk import endpoints for large data uploads
6. **Validate Input**: Validate all input data before sending to the API
7. **Monitor Rate Limits**: Track rate limit headers to avoid throttling
