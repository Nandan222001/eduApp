# Assignment Management API Reference

## Base URL
All endpoints are prefixed with `/api/v1`

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Assignment Endpoints

### 1. Create Assignment
**POST** `/assignments`

Create a new assignment.

**Request Body:**
```json
{
  "institution_id": 1,
  "teacher_id": 1,
  "grade_id": 1,
  "section_id": 1,
  "subject_id": 1,
  "chapter_id": 1,
  "title": "Math Homework - Chapter 1",
  "description": "Complete exercises from chapter 1",
  "content": "<p>Detailed assignment content in HTML</p>",
  "instructions": "<p>Follow these instructions...</p>",
  "due_date": "2024-01-31T23:59:59Z",
  "publish_date": "2024-01-15T00:00:00Z",
  "close_date": "2024-02-05T23:59:59Z",
  "max_marks": 100,
  "passing_marks": 40,
  "allow_late_submission": true,
  "late_penalty_percentage": 10,
  "max_file_size_mb": 10,
  "allowed_file_types": "pdf,doc,docx,txt",
  "status": "published"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "institution_id": 1,
  "teacher_id": 1,
  "grade_id": 1,
  "section_id": 1,
  "subject_id": 1,
  "chapter_id": 1,
  "title": "Math Homework - Chapter 1",
  "description": "Complete exercises from chapter 1",
  "content": "<p>Detailed assignment content in HTML</p>",
  "instructions": "<p>Follow these instructions...</p>",
  "due_date": "2024-01-31T23:59:59Z",
  "publish_date": "2024-01-15T00:00:00Z",
  "close_date": "2024-02-05T23:59:59Z",
  "max_marks": 100.0,
  "passing_marks": 40.0,
  "allow_late_submission": true,
  "late_penalty_percentage": 10.0,
  "max_file_size_mb": 10,
  "allowed_file_types": "pdf,doc,docx,txt",
  "status": "published",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

---

### 2. List Assignments
**GET** `/assignments`

Get a paginated list of assignments with optional filters.

**Query Parameters:**
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Number of records to return (default: 100, max: 100)
- `grade_id` (integer, optional): Filter by grade
- `section_id` (integer, optional): Filter by section
- `subject_id` (integer, optional): Filter by subject
- `teacher_id` (integer, optional): Filter by teacher
- `status` (string, optional): Filter by status (draft, published, closed, archived)
- `search` (string, optional): Search in title and description
- `is_active` (boolean, optional): Filter by active status

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "title": "Math Homework - Chapter 1",
      // ... other fields
    }
  ],
  "total": 25,
  "skip": 0,
  "limit": 100
}
```

---

### 3. Get Assignment
**GET** `/assignments/{assignment_id}`

Get a single assignment with its attachment files.

**Response:** `200 OK`
```json
{
  "id": 1,
  "institution_id": 1,
  // ... other assignment fields
  "attachment_files": [
    {
      "id": 1,
      "assignment_id": 1,
      "file_name": "instructions.pdf",
      "file_size": 102400,
      "file_type": "application/pdf",
      "file_url": "https://bucket.s3.region.amazonaws.com/path/to/file",
      "s3_key": "assignments/1/20240115_abc123_instructions.pdf",
      "uploaded_at": "2024-01-15T10:05:00Z"
    }
  ]
}
```

---

### 4. Update Assignment
**PUT** `/assignments/{assignment_id}`

Update an existing assignment.

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "due_date": "2024-02-15T23:59:59Z",
  "status": "published"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  // ... updated assignment fields
}
```

---

### 5. Delete Assignment
**DELETE** `/assignments/{assignment_id}`

Delete an assignment and all its associated files from S3.

**Response:** `204 No Content`

---

### 6. Upload Assignment File
**POST** `/assignments/{assignment_id}/files`

Upload an attachment file for an assignment.

**Request:** Multipart form data
- `file`: The file to upload

**Response:** `200 OK`
```json
{
  "file_name": "instructions.pdf",
  "file_url": "https://bucket.s3.region.amazonaws.com/path/to/file",
  "s3_key": "assignments/1/20240115_abc123_instructions.pdf",
  "file_size": 102400,
  "file_type": "application/pdf"
}
```

---

### 7. Delete Assignment File
**DELETE** `/assignments/{assignment_id}/files/{file_id}`

Delete an attachment file from an assignment.

**Response:** `204 No Content`

---

### 8. List Submissions
**GET** `/assignments/{assignment_id}/submissions`

Get all submissions for an assignment.

**Query Parameters:**
- `skip` (integer, optional): Pagination offset
- `limit` (integer, optional): Page size
- `status` (string, optional): Filter by submission status
- `is_late` (boolean, optional): Filter late submissions

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "assignment_id": 1,
      "student_id": 1,
      "submitted_at": "2024-01-30T15:30:00Z",
      "is_late": false,
      "marks_obtained": 85.0,
      "grade": "A",
      "feedback": "Excellent work!",
      "status": "graded",
      // ... other fields
    }
  ],
  "total": 30,
  "skip": 0,
  "limit": 100
}
```

---

### 9. Get Submission Statistics
**GET** `/assignments/{assignment_id}/statistics`

Get comprehensive statistics for an assignment.

**Response:** `200 OK`
```json
{
  "assignment_id": 1,
  "total_students": 30,
  "submitted_count": 28,
  "not_submitted_count": 2,
  "late_submissions": 3,
  "graded_count": 25,
  "pending_grading": 3,
  "average_marks": 75.5,
  "highest_marks": 95.0,
  "lowest_marks": 45.0,
  "pass_rate": 92.0
}
```

---

### 10. Get Assignment Analytics
**GET** `/assignments/{assignment_id}/analytics`

Get detailed analytics for an assignment.

**Response:** `200 OK`
```json
{
  "assignment_id": 1,
  "title": "Math Homework - Chapter 1",
  "total_submissions": 28,
  "submission_rate": 93.33,
  "average_marks": 75.5,
  "on_time_submissions": 25,
  "late_submissions": 3,
  "graded_count": 25,
  "pending_count": 3,
  "pass_count": 23,
  "fail_count": 2
}
```

---

## Submission Endpoints

### 1. Create/Update Submission
**POST** `/submissions`

Create a new submission or update an existing one for a student.

**Request Body:**
```json
{
  "assignment_id": 1,
  "student_id": 1,
  "content": "<p>My submission content</p>",
  "submission_text": "Additional notes or text"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "assignment_id": 1,
  "student_id": 1,
  "content": "<p>My submission content</p>",
  "submission_text": "Additional notes or text",
  "submitted_at": "2024-01-30T15:30:00Z",
  "is_late": false,
  "marks_obtained": null,
  "grade": null,
  "feedback": null,
  "graded_by": null,
  "graded_at": null,
  "status": "submitted",
  "created_at": "2024-01-30T15:30:00Z",
  "updated_at": "2024-01-30T15:30:00Z"
}
```

**Features:**
- Automatically detects if submission is late
- Creates new submission or updates existing one
- Validates against assignment deadlines
- Checks if late submissions are allowed

---

### 2. Get Submission
**GET** `/submissions/{submission_id}`

Get a single submission with its files.

**Response:** `200 OK`
```json
{
  "id": 1,
  "assignment_id": 1,
  "student_id": 1,
  // ... other submission fields
  "submission_files": [
    {
      "id": 1,
      "submission_id": 1,
      "file_name": "answer_sheet.pdf",
      "file_size": 256000,
      "file_type": "application/pdf",
      "file_url": "https://bucket.s3.region.amazonaws.com/path/to/file",
      "s3_key": "submissions/1/20240130_xyz789_answer_sheet.pdf",
      "uploaded_at": "2024-01-30T15:35:00Z"
    }
  ]
}
```

---

### 3. Get Student Submission
**GET** `/submissions/assignment/{assignment_id}/student/{student_id}`

Get a specific student's submission for an assignment.

**Response:** `200 OK`
```json
{
  "id": 1,
  "assignment_id": 1,
  "student_id": 1,
  // ... submission fields with files
}
```

---

### 4. Grade Submission
**POST** `/submissions/{submission_id}/grade`

Grade a student's submission.

**Request Body:**
```json
{
  "marks_obtained": 85,
  "grade": "A",
  "feedback": "<p>Excellent work! Great understanding of the concepts.</p>"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "assignment_id": 1,
  "student_id": 1,
  "marks_obtained": 85.0,
  "grade": "A",
  "feedback": "<p>Excellent work! Great understanding of the concepts.</p>",
  "graded_by": 1,
  "graded_at": "2024-02-01T10:00:00Z",
  "status": "graded",
  // ... other fields
}
```

**Features:**
- Automatically applies late penalty if applicable
- Records grader and grading timestamp
- Updates submission status to "graded"

---

### 5. Upload Submission File
**POST** `/submissions/{submission_id}/files`

Upload a file for a submission.

**Request:** Multipart form data
- `file`: The file to upload

**Response:** `200 OK`
```json
{
  "file_name": "answer_sheet.pdf",
  "file_url": "https://bucket.s3.region.amazonaws.com/path/to/file",
  "s3_key": "submissions/1/20240130_xyz789_answer_sheet.pdf",
  "file_size": 256000,
  "file_type": "application/pdf"
}
```

---

### 6. Delete Submission File
**DELETE** `/submissions/{submission_id}/files/{file_id}`

Delete a file from a submission.

**Response:** `204 No Content`

---

## Status Enums

### Assignment Status
- `draft` - Assignment is in draft state
- `published` - Assignment is published and visible to students
- `closed` - Assignment is closed for submissions
- `archived` - Assignment is archived

### Submission Status
- `not_submitted` - Student has not submitted yet
- `submitted` - Student has submitted on time
- `late_submitted` - Student submitted after the due date
- `graded` - Submission has been graded
- `returned` - Graded submission returned to student

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Due date must be after publish date"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized to access this assignment"
}
```

### 404 Not Found
```json
{
  "detail": "Assignment not found"
}
```

---

## Common Validation Rules

### Assignments
1. Due date must be after publish date
2. Close date must be on or after due date
3. Passing marks cannot exceed max marks
4. File size must be within configured limits

### Submissions
1. Assignment must be published
2. Assignment must not be closed or archived
3. Late submissions only allowed if configured
4. Submissions not allowed after close date
5. File size must be within assignment's max_file_size_mb

### Grading
1. Marks cannot exceed max_marks
2. Only teachers can grade submissions
3. Late penalty automatically applied if configured

---

## Best Practices

1. **File Uploads**: Always check file size before uploading
2. **Status Management**: Transition assignments through proper status flow
3. **Late Submissions**: Configure late submission policy before publishing
4. **Grading**: Provide detailed feedback for better student learning
5. **Statistics**: Use statistics endpoint for dashboard displays
6. **Analytics**: Use analytics endpoint for reports and insights
7. **Pagination**: Always use pagination for large result sets
8. **Search**: Use search parameter for quick filtering
