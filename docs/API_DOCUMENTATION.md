# API Documentation - Educational SaaS Platform

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Endpoints](#api-endpoints)

## Overview

The Educational SaaS Platform provides a comprehensive RESTful API built with FastAPI, offering complete functionality for managing educational institutions, users, courses, assignments, exams, and more.

**Version:** 0.1.0  
**API Type:** REST  
**Data Format:** JSON  
**Authentication:** JWT Bearer Token

## Authentication

All API requests (except login and registration) require authentication using JWT tokens.

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "teacher"
  }
}
```

### Using Authentication Token
Include the token in the Authorization header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Base URL

**Production:** `https://api.yourplatform.com`  
**Staging:** `https://staging-api.yourplatform.com`  
**Local Development:** `http://localhost:8000`

All endpoints are prefixed with `/api/v1`

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Example"
  },
  "message": "Operation successful"
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "size": 20,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

## Error Handling

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting

- **Default Rate:** 100 requests per minute per IP
- **Authenticated Rate:** 1000 requests per minute per user
- Rate limit headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## API Endpoints

## 1. Authentication & Authorization

### 1.1 User Registration
```http
POST /api/v1/auth/register
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "full_name": "Jane Smith",
  "institution_id": 1,
  "role": "teacher"
}
```

**Response (201):**
```json
{
  "id": 5,
  "email": "newuser@example.com",
  "full_name": "Jane Smith",
  "role": "teacher",
  "institution_id": 1,
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 1.2 Password Reset Request
```http
POST /api/v1/auth/password-reset-request
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

### 1.3 Password Reset Confirm
```http
POST /api/v1/auth/password-reset-confirm
```

**Request:**
```json
{
  "token": "reset-token-here",
  "new_password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password successfully reset"
}
```

---

## 2. Institution Management

### 2.1 Create Institution
```http
POST /api/v1/institutions
```

**Request:**
```json
{
  "name": "Green Valley High School",
  "slug": "green-valley-hs",
  "email": "admin@greenvalley.edu",
  "phone": "+1234567890",
  "address": "123 Education Street",
  "city": "Springfield",
  "state": "IL",
  "country": "USA",
  "postal_code": "62701",
  "timezone": "America/Chicago",
  "logo_url": "https://cdn.example.com/logo.png"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Green Valley High School",
  "slug": "green-valley-hs",
  "email": "admin@greenvalley.edu",
  "phone": "+1234567890",
  "address": "123 Education Street",
  "city": "Springfield",
  "state": "IL",
  "country": "USA",
  "postal_code": "62701",
  "timezone": "America/Chicago",
  "logo_url": "https://cdn.example.com/logo.png",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2.2 Get Institution Details
```http
GET /api/v1/institutions/{institution_id}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Green Valley High School",
  "slug": "green-valley-hs",
  "email": "admin@greenvalley.edu",
  "phone": "+1234567890",
  "address": "123 Education Street",
  "statistics": {
    "total_students": 1250,
    "total_teachers": 85,
    "total_classes": 45
  }
}
```

---

## 3. Student Management

### 3.1 Create Student
```http
POST /api/v1/students
```

**Request:**
```json
{
  "user": {
    "email": "student@example.com",
    "password": "StudentPass123!",
    "full_name": "Alex Johnson"
  },
  "admission_number": "2024001",
  "roll_number": "101",
  "grade_id": 10,
  "section_id": 2,
  "date_of_birth": "2010-05-15",
  "gender": "male",
  "blood_group": "O+",
  "parent_phone": "+1234567890",
  "parent_email": "parent@example.com",
  "address": "456 Student Lane"
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 10,
  "admission_number": "2024001",
  "roll_number": "101",
  "grade_id": 10,
  "section_id": 2,
  "full_name": "Alex Johnson",
  "email": "student@example.com",
  "date_of_birth": "2010-05-15",
  "gender": "male",
  "blood_group": "O+",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 3.2 List Students
```http
GET /api/v1/students?page=1&size=20&grade_id=10&section_id=2
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `size` (integer): Items per page (default: 20, max: 100)
- `grade_id` (integer): Filter by grade
- `section_id` (integer): Filter by section
- `search` (string): Search by name or admission number

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "admission_number": "2024001",
      "full_name": "Alex Johnson",
      "grade": "Grade 10",
      "section": "A",
      "email": "student@example.com"
    }
  ],
  "total": 45,
  "page": 1,
  "size": 20,
  "pages": 3
}
```

### 3.3 Bulk Import Students
```http
POST /api/v1/students/bulk-import
Content-Type: multipart/form-data
```

**Request:**
```
file: students.csv
```

**CSV Format:**
```csv
admission_number,full_name,email,grade,section,date_of_birth,gender
2024001,John Doe,john@example.com,10,A,2010-05-15,male
2024002,Jane Smith,jane@example.com,10,A,2010-06-20,female
```

**Response (200):**
```json
{
  "success_count": 45,
  "error_count": 2,
  "errors": [
    {
      "row": 5,
      "error": "Invalid email format"
    }
  ]
}
```

---

## 4. Teacher Management

### 4.1 Create Teacher
```http
POST /api/v1/teachers
```

**Request:**
```json
{
  "user": {
    "email": "teacher@example.com",
    "password": "TeacherPass123!",
    "full_name": "Dr. Sarah Williams"
  },
  "employee_id": "EMP001",
  "department": "Mathematics",
  "qualification": "PhD in Mathematics",
  "specialization": "Algebra, Calculus",
  "joining_date": "2020-08-01",
  "subjects": [1, 2, 5]
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 15,
  "employee_id": "EMP001",
  "full_name": "Dr. Sarah Williams",
  "email": "teacher@example.com",
  "department": "Mathematics",
  "qualification": "PhD in Mathematics",
  "subjects": [
    {
      "id": 1,
      "name": "Algebra"
    },
    {
      "id": 2,
      "name": "Calculus"
    }
  ],
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 5. Assignment Management

### 5.1 Create Assignment
```http
POST /api/v1/assignments
```

**Request:**
```json
{
  "title": "Algebra Chapter 5 Practice",
  "description": "Complete exercises 1-20 from chapter 5",
  "subject_id": 1,
  "grade_id": 10,
  "section_ids": [1, 2],
  "assigned_by": 15,
  "due_date": "2024-02-01T23:59:59Z",
  "total_marks": 50,
  "instructions": "Show all work. Partial credit available.",
  "attachment_urls": [
    "https://cdn.example.com/assignment.pdf"
  ]
}
```

**Response (201):**
```json
{
  "id": 1,
  "title": "Algebra Chapter 5 Practice",
  "description": "Complete exercises 1-20 from chapter 5",
  "subject": {
    "id": 1,
    "name": "Algebra"
  },
  "grade": {
    "id": 10,
    "name": "Grade 10"
  },
  "assigned_by": {
    "id": 15,
    "name": "Dr. Sarah Williams"
  },
  "due_date": "2024-02-01T23:59:59Z",
  "total_marks": 50,
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 5.2 Submit Assignment
```http
POST /api/v1/assignments/{assignment_id}/submit
Content-Type: multipart/form-data
```

**Request:**
```
student_id: 1
comments: "Completed all exercises"
files: [submission.pdf, calculations.jpg]
```

**Response (201):**
```json
{
  "id": 1,
  "assignment_id": 1,
  "student_id": 1,
  "submitted_at": "2024-01-20T14:30:00Z",
  "status": "submitted",
  "files": [
    {
      "id": 1,
      "filename": "submission.pdf",
      "url": "https://cdn.example.com/submissions/1/submission.pdf"
    }
  ],
  "comments": "Completed all exercises"
}
```

### 5.3 Grade Submission
```http
POST /api/v1/assignments/submissions/{submission_id}/grade
```

**Request:**
```json
{
  "marks_obtained": 45,
  "feedback": "Excellent work! Minor error in question 15.",
  "graded_by": 15
}
```

**Response (200):**
```json
{
  "id": 1,
  "marks_obtained": 45,
  "total_marks": 50,
  "percentage": 90.0,
  "feedback": "Excellent work! Minor error in question 15.",
  "graded_by": {
    "id": 15,
    "name": "Dr. Sarah Williams"
  },
  "graded_at": "2024-01-22T10:00:00Z",
  "status": "graded"
}
```

---

## 6. Attendance Management

### 6.1 Mark Attendance
```http
POST /api/v1/attendance
```

**Request:**
```json
{
  "date": "2024-01-15",
  "section_id": 1,
  "subject_id": 2,
  "period": 1,
  "attendance_records": [
    {
      "student_id": 1,
      "status": "present"
    },
    {
      "student_id": 2,
      "status": "absent",
      "reason": "Sick leave"
    },
    {
      "student_id": 3,
      "status": "late",
      "minutes_late": 15
    }
  ]
}
```

**Response (201):**
```json
{
  "date": "2024-01-15",
  "section_id": 1,
  "subject_id": 2,
  "period": 1,
  "total_students": 45,
  "present": 42,
  "absent": 2,
  "late": 1,
  "records": [...]
}
```

### 6.2 Get Attendance Summary
```http
GET /api/v1/attendance/summary?student_id=1&start_date=2024-01-01&end_date=2024-01-31
```

**Response (200):**
```json
{
  "student_id": 1,
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "statistics": {
    "total_days": 20,
    "present_days": 18,
    "absent_days": 2,
    "late_days": 1,
    "attendance_percentage": 90.0
  },
  "by_subject": [
    {
      "subject": "Mathematics",
      "present": 19,
      "absent": 1,
      "percentage": 95.0
    }
  ]
}
```

---

## 7. Examination Management

### 7.1 Create Exam
```http
POST /api/v1/exams
```

**Request:**
```json
{
  "name": "First Term Final Exam",
  "exam_type": "final",
  "academic_year_id": 1,
  "grade_id": 10,
  "start_date": "2024-03-01",
  "end_date": "2024-03-10",
  "description": "Final examination for first term",
  "subjects": [
    {
      "subject_id": 1,
      "max_marks": 100,
      "passing_marks": 40,
      "exam_date": "2024-03-01",
      "start_time": "09:00:00",
      "end_time": "12:00:00",
      "duration_minutes": 180
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "First Term Final Exam",
  "exam_type": "final",
  "academic_year_id": 1,
  "grade_id": 10,
  "start_date": "2024-03-01",
  "end_date": "2024-03-10",
  "status": "scheduled",
  "subjects": [...],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 7.2 Enter Exam Marks
```http
POST /api/v1/exams/{exam_id}/marks
```

**Request:**
```json
{
  "exam_subject_id": 1,
  "marks_entries": [
    {
      "student_id": 1,
      "marks_obtained": 85,
      "remarks": "Excellent performance"
    },
    {
      "student_id": 2,
      "marks_obtained": 72,
      "remarks": "Good effort"
    }
  ]
}
```

**Response (201):**
```json
{
  "success_count": 2,
  "failed_count": 0,
  "results": [
    {
      "student_id": 1,
      "marks_obtained": 85,
      "grade": "A",
      "status": "pass"
    }
  ]
}
```

### 7.3 Get Exam Results
```http
GET /api/v1/exams/{exam_id}/results/{student_id}
```

**Response (200):**
```json
{
  "exam_id": 1,
  "exam_name": "First Term Final Exam",
  "student_id": 1,
  "student_name": "Alex Johnson",
  "subjects": [
    {
      "subject_name": "Mathematics",
      "marks_obtained": 85,
      "max_marks": 100,
      "percentage": 85.0,
      "grade": "A",
      "status": "pass"
    }
  ],
  "total_marks_obtained": 425,
  "total_max_marks": 500,
  "overall_percentage": 85.0,
  "overall_grade": "A",
  "rank": 5,
  "result_status": "pass"
}
```

---

## 8. Gamification

### 8.1 Get User Points
```http
GET /api/v1/gamification/points/{user_id}
```

**Response (200):**
```json
{
  "user_id": 1,
  "total_points": 1250,
  "level": 5,
  "current_level_points": 250,
  "next_level_points": 500,
  "progress_percentage": 50.0
}
```

### 8.2 Award Points
```http
POST /api/v1/gamification/points/award
```

**Request:**
```json
{
  "user_id": 1,
  "points": 50,
  "event_type": "assignment_completion",
  "description": "Completed algebra assignment",
  "reference_id": 123
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "points": 50,
  "event_type": "assignment_completion",
  "description": "Completed algebra assignment",
  "awarded_at": "2024-01-15T10:30:00Z",
  "new_total": 1300
}
```

### 8.3 Get Leaderboard
```http
GET /api/v1/gamification/leaderboard?grade_id=10&period=month&limit=10
```

**Response (200):**
```json
{
  "period": "month",
  "grade_id": 10,
  "updated_at": "2024-01-15T10:30:00Z",
  "entries": [
    {
      "rank": 1,
      "user_id": 1,
      "user_name": "Alex Johnson",
      "points": 1500,
      "badges_earned": 8,
      "achievements": 12
    },
    {
      "rank": 2,
      "user_id": 2,
      "user_name": "Jane Smith",
      "points": 1450,
      "badges_earned": 7,
      "achievements": 11
    }
  ]
}
```

### 8.4 Award Badge
```http
POST /api/v1/gamification/badges/award
```

**Request:**
```json
{
  "user_id": 1,
  "badge_id": 5,
  "reason": "Perfect attendance for the month"
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "badge": {
    "id": 5,
    "name": "Perfect Attendance",
    "description": "Maintained 100% attendance",
    "icon_url": "https://cdn.example.com/badges/attendance.png",
    "rarity": "rare"
  },
  "awarded_at": "2024-01-15T10:30:00Z"
}
```

---

## 9. Analytics & Reporting

### 9.1 Get Student Performance Analytics
```http
GET /api/v1/analytics/student/{student_id}?start_date=2024-01-01&end_date=2024-01-31
```

**Response (200):**
```json
{
  "student_id": 1,
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "overall_performance": {
    "average_score": 85.5,
    "attendance_percentage": 95.0,
    "assignments_completed": 12,
    "assignments_pending": 1,
    "rank_in_class": 5
  },
  "subject_performance": [
    {
      "subject": "Mathematics",
      "average_score": 88.0,
      "highest_score": 95,
      "lowest_score": 75,
      "trend": "improving"
    }
  ],
  "strengths": ["Algebra", "Geometry"],
  "weaknesses": ["Statistics"]
}
```

### 9.2 Generate Performance Report
```http
POST /api/v1/analytics/reports/generate
```

**Request:**
```json
{
  "report_type": "student_progress",
  "student_id": 1,
  "academic_year_id": 1,
  "format": "pdf",
  "include_graphs": true
}
```

**Response (202):**
```json
{
  "report_id": "rpt_12345",
  "status": "processing",
  "message": "Report generation started",
  "estimated_completion": "2024-01-15T10:35:00Z"
}
```

### 9.3 Get Report Status
```http
GET /api/v1/analytics/reports/{report_id}
```

**Response (200):**
```json
{
  "report_id": "rpt_12345",
  "status": "completed",
  "download_url": "https://cdn.example.com/reports/rpt_12345.pdf",
  "expires_at": "2024-01-22T10:30:00Z",
  "generated_at": "2024-01-15T10:35:00Z"
}
```

---

## 10. Study Materials

### 10.1 Upload Study Material
```http
POST /api/v1/study-materials
Content-Type: multipart/form-data
```

**Request:**
```
title: "Chapter 5: Quadratic Equations"
description: "Comprehensive notes and examples"
subject_id: 1
grade_id: 10
material_type: "notes"
file: chapter5_notes.pdf
tags: ["algebra", "equations", "practice"]
```

**Response (201):**
```json
{
  "id": 1,
  "title": "Chapter 5: Quadratic Equations",
  "description": "Comprehensive notes and examples",
  "subject_id": 1,
  "grade_id": 10,
  "material_type": "notes",
  "file_url": "https://cdn.example.com/materials/chapter5_notes.pdf",
  "file_size": 2548621,
  "uploaded_by": {
    "id": 15,
    "name": "Dr. Sarah Williams"
  },
  "tags": ["algebra", "equations", "practice"],
  "downloads": 0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 10.2 Search Study Materials
```http
GET /api/v1/study-materials/search?q=quadratic&subject_id=1&grade_id=10
```

**Response (200):**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Chapter 5: Quadratic Equations",
      "material_type": "notes",
      "subject": "Mathematics",
      "grade": "Grade 10",
      "relevance_score": 0.95,
      "downloads": 125
    }
  ],
  "total": 1
}
```

---

## 11. Notifications

### 11.1 Send Notification
```http
POST /api/v1/notifications
```

**Request:**
```json
{
  "title": "Assignment Due Reminder",
  "message": "Your algebra assignment is due tomorrow",
  "notification_type": "assignment_reminder",
  "priority": "high",
  "recipient_ids": [1, 2, 3],
  "channels": ["in_app", "email"],
  "scheduled_at": "2024-01-31T08:00:00Z"
}
```

**Response (201):**
```json
{
  "id": 1,
  "title": "Assignment Due Reminder",
  "message": "Your algebra assignment is due tomorrow",
  "notification_type": "assignment_reminder",
  "priority": "high",
  "status": "scheduled",
  "scheduled_at": "2024-01-31T08:00:00Z",
  "recipients_count": 3,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 11.2 Get User Notifications
```http
GET /api/v1/notifications/user/{user_id}?page=1&size=20&unread_only=true
```

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Assignment Due Reminder",
      "message": "Your algebra assignment is due tomorrow",
      "notification_type": "assignment_reminder",
      "priority": "high",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "unread_count": 8,
  "page": 1,
  "size": 20
}
```

### 11.3 Mark as Read
```http
PUT /api/v1/notifications/{notification_id}/read
```

**Response (200):**
```json
{
  "id": 1,
  "is_read": true,
  "read_at": "2024-01-15T11:00:00Z"
}
```

---

## 12. AI & ML Features

### 12.1 Get Performance Prediction
```http
POST /api/v1/predictions/student/{student_id}
```

**Request:**
```json
{
  "prediction_type": "board_exam",
  "subject_id": 1,
  "target_exam_date": "2024-06-15"
}
```

**Response (200):**
```json
{
  "student_id": 1,
  "subject_id": 1,
  "prediction_type": "board_exam",
  "predicted_score": 85.5,
  "confidence": 0.87,
  "score_range": {
    "min": 80,
    "max": 90
  },
  "factors": [
    {
      "factor": "current_performance",
      "impact": "high",
      "value": 82.0
    },
    {
      "factor": "attendance",
      "impact": "medium",
      "value": 0.95
    }
  ],
  "recommendations": [
    "Focus more on Statistics topics",
    "Maintain current study schedule"
  ],
  "generated_at": "2024-01-15T10:30:00Z"
}
```

### 12.2 Generate Study Plan
```http
POST /api/v1/study-planner/generate
```

**Request:**
```json
{
  "student_id": 1,
  "target_exam_id": 5,
  "start_date": "2024-01-15",
  "end_date": "2024-03-01",
  "study_hours_per_day": 4,
  "weak_subjects": [1, 3]
}
```

**Response (201):**
```json
{
  "id": 1,
  "student_id": 1,
  "target_exam_id": 5,
  "start_date": "2024-01-15",
  "end_date": "2024-03-01",
  "total_study_hours": 180,
  "daily_tasks": [
    {
      "date": "2024-01-15",
      "tasks": [
        {
          "subject": "Mathematics",
          "topic": "Quadratic Equations",
          "duration_minutes": 120,
          "priority": "high",
          "resources": [...]
        }
      ]
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 13. WebSocket Events

### 13.1 Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws?token=YOUR_JWT_TOKEN');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### 13.2 Real-time Event Types

**New Assignment:**
```json
{
  "event": "assignment_created",
  "data": {
    "assignment_id": 1,
    "title": "Algebra Chapter 5 Practice",
    "due_date": "2024-02-01T23:59:59Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Grade Published:**
```json
{
  "event": "grade_published",
  "data": {
    "submission_id": 1,
    "assignment_id": 1,
    "marks_obtained": 45,
    "total_marks": 50
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Notification:**
```json
{
  "event": "notification",
  "data": {
    "notification_id": 1,
    "title": "New Message",
    "message": "You have a new message from Dr. Williams"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Appendix

### A. Data Models

**User Roles:**
- `super_admin`: Full system access
- `institution_admin`: Institution-wide access
- `teacher`: Teaching and grading capabilities
- `student`: Learning and submission capabilities
- `parent`: View-only access to student data

**Assignment Status:**
- `draft`: Not yet published
- `active`: Published and accepting submissions
- `closed`: Past due date
- `graded`: All submissions graded

**Attendance Status:**
- `present`: Student was present
- `absent`: Student was absent
- `late`: Student arrived late
- `excused`: Absent with valid reason

### B. Webhooks

Register webhooks to receive real-time notifications:

```http
POST /api/v1/webhooks/register
```

**Request:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["assignment_created", "grade_published"],
  "secret": "your_webhook_secret"
}
```

### C. SDK Examples

**Python SDK:**
```python
from edu_platform_sdk import Client

client = Client(api_key='your_api_key')
students = client.students.list(grade_id=10)
```

**JavaScript SDK:**
```javascript
import { EduPlatformClient } from 'edu-platform-sdk';

const client = new EduPlatformClient({ apiKey: 'your_api_key' });
const students = await client.students.list({ gradeId: 10 });
```

---

## Support

For API support, please contact:
- Email: api-support@yourplatform.com
- Documentation: https://docs.yourplatform.com
- Status Page: https://status.yourplatform.com
