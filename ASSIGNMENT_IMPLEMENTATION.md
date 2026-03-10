# Assignment and Homework Management Implementation

## Overview
Complete implementation of assignment and homework management system with file upload support to S3, rich text content storage, due date tracking, late submission detection, grading workflow, submission statistics calculation, and comprehensive endpoints.

## Features Implemented

### 1. Assignment Management
- **CRUD Operations**: Create, read, update, and delete assignments
- **Rich Text Support**: Store assignment content, description, and instructions
- **Date Management**: 
  - Publish date (when assignment becomes visible)
  - Due date (deadline for submissions)
  - Close date (when assignment stops accepting submissions)
- **Status Tracking**: Draft, Published, Closed, Archived
- **Grading Configuration**:
  - Maximum marks
  - Passing marks
  - Late submission policy
  - Late penalty percentage
- **File Attachments**: S3-based file upload for assignment resources

### 2. Submission Management
- **Student Submissions**: Create/update submissions for assignments
- **Automatic Late Detection**: System automatically marks submissions as late
- **Submission Status**: Not Submitted, Submitted, Late Submitted, Graded, Returned
- **File Uploads**: S3-based file upload for submission files
- **Rich Text Content**: Support for formatted submission text

### 3. Grading Workflow
- **Teacher Grading**: Teachers can grade submissions
- **Marks Assignment**: Numeric marks with automatic late penalty application
- **Letter Grade Support**: Optional letter grade assignment
- **Feedback System**: Rich text feedback on submissions
- **Grading Tracking**: Track who graded and when

### 4. Statistics & Analytics
- **Submission Statistics**:
  - Total students
  - Submitted count
  - Not submitted count
  - Late submissions
  - Graded count
  - Pending grading
  - Average/highest/lowest marks
  - Pass rate

- **Assignment Analytics**:
  - Submission rate
  - On-time vs late submissions
  - Pass/fail counts
  - Average performance

### 5. File Management (S3 Integration)
- **Upload Support**: File upload to AWS S3
- **File Validation**: Size and type validation
- **Secure Storage**: Files stored with unique keys
- **Delete Support**: Clean removal from S3
- **Presigned URLs**: Generate temporary access URLs

## Database Models

### Assignment Model
```python
- id: Primary key
- institution_id: Foreign key to institutions
- teacher_id: Foreign key to teachers
- grade_id: Foreign key to grades
- section_id: Optional foreign key to sections
- subject_id: Foreign key to subjects
- chapter_id: Optional foreign key to chapters
- title: Assignment title
- description: Brief description
- content: Rich text content
- instructions: Assignment instructions
- due_date: Submission deadline
- publish_date: When to make visible
- close_date: When to stop accepting submissions
- max_marks: Maximum achievable marks
- passing_marks: Minimum passing marks
- allow_late_submission: Boolean flag
- late_penalty_percentage: Penalty for late submissions
- max_file_size_mb: Maximum file size limit
- allowed_file_types: Comma-separated file types
- status: Assignment status enum
- is_active: Active flag
- timestamps: created_at, updated_at
```

### AssignmentFile Model
```python
- id: Primary key
- assignment_id: Foreign key to assignments
- file_name: Original file name
- file_size: File size in bytes
- file_type: MIME type
- file_url: S3 file URL
- s3_key: S3 object key
- uploaded_at: Upload timestamp
```

### Submission Model
```python
- id: Primary key
- assignment_id: Foreign key to assignments
- student_id: Foreign key to students
- content: Rich text content
- submission_text: Additional text
- submitted_at: Submission timestamp
- is_late: Late submission flag
- marks_obtained: Awarded marks
- grade: Letter grade
- feedback: Teacher feedback
- graded_by: Foreign key to teachers
- graded_at: Grading timestamp
- status: Submission status enum
- timestamps: created_at, updated_at
- Unique constraint: (assignment_id, student_id)
```

### SubmissionFile Model
```python
- id: Primary key
- submission_id: Foreign key to submissions
- file_name: Original file name
- file_size: File size in bytes
- file_type: MIME type
- file_url: S3 file URL
- s3_key: S3 object key
- uploaded_at: Upload timestamp
```

## API Endpoints

### Assignment Endpoints (`/api/v1/assignments`)

#### 1. Create Assignment
- **POST** `/`
- **Body**: AssignmentCreate schema
- **Response**: AssignmentResponse
- **Validations**:
  - Due date must be after publish date
  - Close date must be on or after due date
  - Passing marks cannot exceed max marks

#### 2. List Assignments
- **GET** `/`
- **Query Parameters**:
  - skip: Pagination offset (default: 0)
  - limit: Page size (default: 100, max: 100)
  - grade_id: Filter by grade
  - section_id: Filter by section
  - subject_id: Filter by subject
  - teacher_id: Filter by teacher
  - status: Filter by status
  - search: Search in title/description
  - is_active: Filter by active status
- **Response**: Paginated list with total count

#### 3. Get Assignment
- **GET** `/{assignment_id}`
- **Response**: AssignmentWithFilesResponse (includes attachment files)

#### 4. Update Assignment
- **PUT** `/{assignment_id}`
- **Body**: AssignmentUpdate schema
- **Response**: AssignmentResponse

#### 5. Delete Assignment
- **DELETE** `/{assignment_id}`
- **Response**: 204 No Content
- **Side Effect**: Deletes all files from S3

#### 6. Upload Assignment File
- **POST** `/{assignment_id}/files`
- **Body**: Multipart file upload
- **Response**: FileUploadResponse
- **Validations**: File size limit

#### 7. Delete Assignment File
- **DELETE** `/{assignment_id}/files/{file_id}`
- **Response**: 204 No Content

#### 8. List Submissions
- **GET** `/{assignment_id}/submissions`
- **Query Parameters**:
  - skip, limit: Pagination
  - status: Filter by submission status
  - is_late: Filter late submissions
- **Response**: Paginated submissions

#### 9. Get Statistics
- **GET** `/{assignment_id}/statistics`
- **Response**: SubmissionStatistics
- **Includes**:
  - Total/submitted/not submitted counts
  - Late submission count
  - Graded/pending counts
  - Average/highest/lowest marks
  - Pass rate

#### 10. Get Analytics
- **GET** `/{assignment_id}/analytics`
- **Response**: AssignmentAnalytics
- **Includes**:
  - Submission rate
  - On-time vs late breakdown
  - Grading progress
  - Pass/fail analysis

### Submission Endpoints (`/api/v1/submissions`)

#### 1. Create/Update Submission
- **POST** `/`
- **Body**: SubmissionCreate schema
- **Response**: SubmissionResponse
- **Features**:
  - Creates new or updates existing submission
  - Automatically detects late submissions
  - Validates against assignment deadlines
  - Checks if late submissions are allowed

#### 2. Get Submission
- **GET** `/{submission_id}`
- **Response**: SubmissionWithFilesResponse

#### 3. Get Student Submission
- **GET** `/assignment/{assignment_id}/student/{student_id}`
- **Response**: SubmissionWithFilesResponse

#### 4. Grade Submission
- **POST** `/{submission_id}/grade`
- **Body**: SubmissionGradeInput
- **Response**: SubmissionResponse
- **Features**:
  - Applies late penalty if applicable
  - Records grader and timestamp
  - Updates submission status to GRADED

#### 5. Upload Submission File
- **POST** `/{submission_id}/files`
- **Body**: Multipart file upload
- **Response**: FileUploadResponse

#### 6. Delete Submission File
- **DELETE** `/{submission_id}/files/{file_id}`
- **Response**: 204 No Content

## Configuration

### Environment Variables Added
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
S3_UPLOAD_MAX_SIZE=10485760  # 10MB default
```

### Settings Class Updated
- Added S3 configuration fields
- Default max file size: 10MB
- Default region: us-east-1

## Dependencies Added

### pyproject.toml
```toml
boto3 = "^1.34.0"  # AWS SDK for S3 operations
```

## Service Layer

### AssignmentService
- **create_assignment**: Create with validations
- **get_assignment**: Retrieve single assignment
- **get_assignment_with_files**: Retrieve with attached files
- **list_assignments**: Paginated listing with filters
- **update_assignment**: Update with validations
- **delete_assignment**: Delete with S3 cleanup
- **upload_assignment_file**: S3 file upload
- **delete_assignment_file**: S3 file deletion

### SubmissionService
- **create_or_update_submission**: Smart create/update with late detection
- **get_submission**: Retrieve single submission
- **get_submission_with_files**: Retrieve with files
- **get_student_submission**: Get specific student's submission
- **list_assignment_submissions**: Paginated listing
- **grade_submission**: Grade with penalty calculation
- **upload_submission_file**: S3 file upload
- **delete_submission_file**: S3 file deletion
- **get_submission_statistics**: Calculate comprehensive stats
- **get_assignment_analytics**: Generate analytics

## Repository Layer

### AssignmentRepository
- Standard CRUD operations
- Advanced filtering and searching
- Count queries for pagination

### AssignmentFileRepository
- File CRUD operations
- List files by assignment

### SubmissionRepository
- Standard CRUD operations
- Advanced filtering
- Statistics aggregation
- Student-specific queries

### SubmissionFileRepository
- File CRUD operations
- List files by submission

## S3 Client Utility

### Features
- **upload_file**: Upload with unique naming
- **delete_file**: Remove from S3
- **generate_presigned_url**: Temporary access URLs
- **file_exists**: Check file existence
- **Error handling**: Comprehensive error management

### File Naming Convention
```
{folder}/{timestamp}_{uuid}_{original_filename}
```

## Key Features

### 1. Late Submission Detection
- Automatic comparison with due date
- Flag submissions as late
- Prevent late submissions if not allowed
- Stop submissions after close date

### 2. Late Penalty Application
- Automatic calculation during grading
- Percentage-based deduction
- Ensures marks don't go below zero

### 3. Rich Text Support
- Content field for HTML/Markdown
- Instructions field for detailed guidelines
- Feedback field for grading comments

### 4. File Upload Security
- Size validation per assignment
- Type validation support
- Unique S3 keys to prevent collisions
- Clean deletion on record removal

### 5. Multi-level Authorization
- Institution-level access control
- Teacher-student role validation
- Assignment ownership verification

### 6. Comprehensive Statistics
- Real-time calculation
- Multi-dimensional analysis
- Performance metrics
- Participation tracking

## Model Relationships Updated

### Institution
- Added `assignments` relationship

### Teacher
- Added `assignments` relationship
- Added `graded_submissions` relationship

### Student
- Added `submissions` relationship

### Grade
- Added `assignments` relationship

### Section
- Added `assignments` relationship

### Subject
- Added `assignments` relationship

### Chapter
- Added `assignments` relationship

## Validation Rules

### Assignment Creation
1. Due date > Publish date
2. Close date >= Due date
3. Passing marks <= Max marks
4. Valid institution access

### Assignment Update
- Same date validations as creation
- Maintains data integrity

### Submission Creation
1. Assignment must exist and be open
2. Not closed or archived
3. Within deadline or late allowed
4. Before close date
5. File size within limits

### Grading
1. Submission must exist
2. Marks <= Max marks
3. Only teachers can grade
4. Automatic late penalty application

## Usage Examples

### Create Assignment
```python
POST /api/v1/assignments
{
  "institution_id": 1,
  "teacher_id": 1,
  "grade_id": 1,
  "subject_id": 1,
  "title": "Math Homework 1",
  "description": "Chapter 1 exercises",
  "content": "<p>Complete exercises 1-10</p>",
  "due_date": "2024-01-15T23:59:59",
  "max_marks": 100,
  "passing_marks": 40,
  "allow_late_submission": true,
  "late_penalty_percentage": 10,
  "status": "published"
}
```

### Submit Assignment
```python
POST /api/v1/submissions
{
  "assignment_id": 1,
  "student_id": 1,
  "content": "<p>My submission content</p>",
  "submission_text": "Additional notes"
}
```

### Grade Submission
```python
POST /api/v1/submissions/1/grade
{
  "marks_obtained": 85,
  "grade": "A",
  "feedback": "Excellent work!"
}
```

### Get Statistics
```python
GET /api/v1/assignments/1/statistics
Response:
{
  "assignment_id": 1,
  "total_students": 30,
  "submitted_count": 28,
  "not_submitted_count": 2,
  "late_submissions": 3,
  "graded_count": 25,
  "pending_grading": 3,
  "average_marks": 75.5,
  "highest_marks": 95,
  "lowest_marks": 45,
  "pass_rate": 92.0
}
```

## Migration Required

A new Alembic migration must be created to add the following tables:
- `assignments`
- `assignment_files`
- `submissions`
- `submission_files`

Run:
```bash
alembic revision --autogenerate -m "Add assignment and submission tables"
alembic upgrade head
```

## Testing Considerations

### Unit Tests Needed
- Assignment CRUD operations
- Submission CRUD operations
- Late detection logic
- Penalty calculation
- Statistics calculation
- File upload/delete

### Integration Tests Needed
- End-to-end submission flow
- Grading workflow
- S3 integration
- Authorization checks

## Security Considerations

1. **File Upload**: Size and type validation
2. **Authorization**: Institution-level access control
3. **S3 Keys**: Unique, unpredictable naming
4. **File Cleanup**: Automatic deletion on record removal
5. **Input Validation**: Pydantic schema validation
6. **SQL Injection**: Protected by SQLAlchemy ORM

## Performance Optimizations

1. **Pagination**: All list endpoints support pagination
2. **Eager Loading**: Used for file relationships
3. **Indexed Fields**: Institution, teacher, student, dates, status
4. **Aggregation**: Database-level statistics calculation
5. **Unique Constraints**: Prevent duplicate submissions

## Future Enhancements

1. **Notification System**: Email/push notifications for deadlines
2. **Plagiarism Detection**: Integration with plagiarism checkers
3. **Peer Review**: Student peer review functionality
4. **Rubric-based Grading**: Detailed grading criteria
5. **Batch Operations**: Bulk grading capabilities
6. **Export Features**: Download submissions in bulk
7. **Version History**: Track submission revisions
8. **Comments**: Inline comments on submissions
