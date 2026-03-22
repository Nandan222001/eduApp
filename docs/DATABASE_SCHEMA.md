# Database Schema Documentation

Complete database schema documentation with ER diagrams and table descriptions for the Educational SaaS Platform.

## Table of Contents
1. [Overview](#overview)
2. [ER Diagrams](#er-diagrams)
3. [Core Tables](#core-tables)
4. [Academic Tables](#academic-tables)
5. [Assessment Tables](#assessment-tables)
6. [Communication Tables](#communication-tables)
7. [Gamification Tables](#gamification-tables)
8. [Analytics Tables](#analytics-tables)
9. [Optional Module Tables](#optional-module-tables)
10. [Indexes and Constraints](#indexes-and-constraints)
11. [Database Relationships](#database-relationships)

---

## 1. Overview

### Database Technology
- **DBMS:** MySQL 8.0+
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Charset:** UTF-8 (utf8mb4)
- **Timezone:** UTC (all timestamps)
- **Storage Engine:** InnoDB

### Design Principles
- Multi-tenant architecture with institution isolation
- Soft deletes for audit trail
- Timestamps on all tables
- Foreign key constraints enabled
- Cascading deletes where appropriate
- Indexed columns for query performance

### Naming Conventions
- Tables: plural, snake_case (e.g., `users`, `student_grades`)
- Columns: snake_case (e.g., `created_at`, `full_name`)
- Indexes: `idx_tablename_columnname`
- Foreign Keys: `fk_tablename_referencedtable`
- Constraints: `ck_tablename_constraint`

---

## 2. ER Diagrams

### High-Level System Architecture

```
┌─────────────────┐
│   Institution   │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┬─────────────────┐
         │                 │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │  Users  │      │Academic │      │ Billing │      │Settings │
    │  & Auth │      │Structure│      │   &     │      │   &     │
    │         │      │         │      │  Subs   │      │ Config  │
    └────┬────┘      └────┬────┘      └─────────┘      └─────────┘
         │                │
    ┌────┴────┬──────────┼──────────┬─────────┬─────────┐
    │         │          │          │         │         │
┌───▼──┐  ┌──▼──┐   ┌───▼───┐  ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Teachers│ │Students│ │Sections│ │Subjects││Courses│ │ Exams │
└───┬──┘  └──┬───┘  └───────┘  └───────┘ └───────┘ └───┬───┘
    │        │                                           │
    │        └──────────┬──────────────┬────────────────┘
    │                   │              │
    │            ┌──────▼─────┐  ┌─────▼──────┐
    │            │Assignments │  │Attendance  │
    │            └──────┬─────┘  └─────┬──────┘
    │                   │              │
    └───────────────────┴──────────────┴──────────────────┐
                                                           │
                                    ┌──────────────────────▼────┐
                                    │  Grades & Performance    │
                                    │  Analytics & Reports     │
                                    │  Notifications           │
                                    │  Gamification            │
                                    └──────────────────────────┘
```

### Core Entity Relationships

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Institution  │1       *│    Users     │*       1│     Role     │
│──────────────│─────────│──────────────│─────────│──────────────│
│ id           │         │ id           │         │ id           │
│ name         │         │ email        │         │ name         │
│ slug         │         │ full_name    │         │ permissions  │
└──────────────┘         │ institution  │         └──────────────┘
                         │ role_id      │
                         └──────┬───────┘
                                │
                   ┌────────────┴────────────┐
                   │                         │
           ┌───────▼────────┐       ┌───────▼────────┐
           │    Teacher     │       │    Student     │
           │────────────────│       │────────────────│
           │ id             │       │ id             │
           │ user_id        │       │ user_id        │
           │ employee_id    │       │ admission_no   │
           │ department     │       │ roll_number    │
           └────────────────┘       │ grade_id       │
                                    │ section_id     │
                                    └────────────────┘
```

### Academic Structure

```
┌────────────────┐
│ AcademicYear   │
│────────────────│
│ id             │
│ name           │
│ start_date     │
│ end_date       │
│ is_current     │
└────────┬───────┘
         │
         │1
         │
         │*
┌────────▼───────┐         ┌──────────────┐
│     Grade      │1       *│   Section    │
│────────────────│─────────│──────────────│
│ id             │         │ id           │
│ name           │         │ name         │
│ level          │         │ grade_id     │
└────────┬───────┘         │ capacity     │
         │                 └──────────────┘
         │1
         │
         │*
┌────────▼───────┐         ┌──────────────┐
│   Subject      │*       *│   Chapter    │
│────────────────│─────────│──────────────│
│ id             │         │ id           │
│ name           │         │ subject_id   │
│ code           │         │ name         │
│ credit_hours   │         │ chapter_num  │
└────────────────┘         └──────┬───────┘
                                  │
                                  │1
                                  │
                                  │*
                           ┌──────▼───────┐
                           │    Topic     │
                           │──────────────│
                           │ id           │
                           │ chapter_id   │
                           │ name         │
                           │ topic_num    │
                           └──────────────┘
```

### Assignment & Submission Flow

```
┌──────────────┐
│  Teacher     │
└──────┬───────┘
       │ creates
       │
       ▼
┌──────────────────┐
│   Assignment     │
│──────────────────│
│ id               │
│ title            │
│ subject_id       │
│ due_date         │
│ total_marks      │
└────────┬─────────┘
         │1
         │
         │*
┌────────▼─────────┐       ┌──────────────┐
│ AssignmentFile   │       │   Student    │
│──────────────────│       └──────┬───────┘
│ id               │              │ submits
│ assignment_id    │              │
│ file_url         │              ▼
└──────────────────┘       ┌──────────────────┐
                           │   Submission     │
                           │──────────────────│
                           │ id               │
                           │ assignment_id    │
                           │ student_id       │
                           │ submitted_at     │
                           │ marks_obtained   │
                           │ status           │
                           └────────┬─────────┘
                                    │1
                                    │
                                    │*
                             ┌──────▼───────────┐
                             │ SubmissionFile   │
                             │──────────────────│
                             │ id               │
                             │ submission_id    │
                             │ file_url         │
                             └──────────────────┘
```

---

## 3. Core Tables

### institutions

Multi-tenant base table for educational institutions.

```sql
CREATE TABLE institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_institutions_slug (slug),
    INDEX idx_institutions_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
- `id`: Primary key (auto-increment)
- `slug`: URL-friendly unique identifier
- `settings`: JSON configuration (theme, features enabled, etc.)
- `deleted_at`: Soft delete timestamp

### users

Core user authentication and profile table.

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url TEXT,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    UNIQUE KEY unique_institution_email (institution_id, email),
    INDEX idx_users_email (email),
    INDEX idx_users_institution (institution_id),
    INDEX idx_users_role (role_id),
    INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns:**
- `password_hash`: Bcrypt hashed password
- `is_verified`: Email verification status
- `last_login_at`: Last successful login timestamp

### roles

Role-based access control.

```sql
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data
INSERT INTO roles (name, display_name, is_system) VALUES
    ('super_admin', 'Super Administrator', TRUE),
    ('institution_admin', 'Institution Administrator', TRUE),
    ('teacher', 'Teacher', TRUE),
    ('student', 'Student', TRUE),
    ('parent', 'Parent', TRUE);
```

### permissions

Granular permission system.

```sql
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Example Permissions:**
- `students:view`, `students:create`, `students:edit`, `students:delete`
- `grades:view`, `grades:edit`
- `assignments:create`, `assignments:grade`

### audit_logs

Comprehensive audit trail.

```sql
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_logs_institution (institution_id),
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_resource (resource_type, resource_id),
    INDEX idx_audit_logs_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Actions:** `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `VIEW`, `EXPORT`

---

## 4. Academic Tables

### academic_years

Academic year periods.

```sql
CREATE TABLE academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    UNIQUE KEY unique_institution_name (institution_id, name),
    INDEX idx_academic_years_current (institution_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### grades

Class/Grade levels (e.g., Grade 10, Class 12).

```sql
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    academic_year_id INT,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    INDEX idx_grades_institution (institution_id),
    INDEX idx_grades_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### sections

Divisions within a grade (e.g., Section A, Section B).

```sql
CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    grade_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 40,
    class_teacher_id INT,
    room_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (class_teacher_id) REFERENCES teachers(id),
    UNIQUE KEY unique_grade_name (grade_id, name),
    INDEX idx_sections_grade (grade_id),
    INDEX idx_sections_teacher (class_teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### subjects

Subjects taught in the institution.

```sql
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    credit_hours INT DEFAULT 0,
    is_elective BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    INDEX idx_subjects_institution (institution_id),
    INDEX idx_subjects_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### grade_subjects

Many-to-many relationship between grades and subjects.

```sql
CREATE TABLE grade_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_id INT NOT NULL,
    subject_id INT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    weekly_periods INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    UNIQUE KEY unique_grade_subject (grade_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### chapters

Subject chapters/units.

```sql
CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    chapter_number INT NOT NULL,
    description TEXT,
    estimated_hours INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    INDEX idx_chapters_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### topics

Topics within chapters.

```sql
CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    topic_number DECIMAL(5,2),
    description TEXT,
    learning_outcomes JSON,
    difficulty_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id),
    INDEX idx_topics_chapter (chapter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Assessment Tables

### teachers

Teacher profiles.

```sql
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    user_id INT NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100),
    qualification VARCHAR(255),
    specialization TEXT,
    joining_date DATE,
    experience_years INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_institution_employee (institution_id, employee_id),
    INDEX idx_teachers_user (user_id),
    INDEX idx_teachers_institution (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### teacher_subjects

Subjects assigned to teachers.

```sql
CREATE TABLE teacher_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    grade_id INT,
    section_id INT,
    academic_year_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    UNIQUE KEY unique_teacher_assignment (teacher_id, subject_id, grade_id, section_id, academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### students

Student profiles.

```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    user_id INT NOT NULL,
    admission_number VARCHAR(50) NOT NULL,
    roll_number VARCHAR(50),
    grade_id INT NOT NULL,
    section_id INT NOT NULL,
    academic_year_id INT,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(5),
    address TEXT,
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    emergency_contact VARCHAR(20),
    admission_date DATE,
    previous_school VARCHAR(255),
    medical_conditions TEXT,
    special_needs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    UNIQUE KEY unique_institution_admission (institution_id, admission_number),
    INDEX idx_students_user (user_id),
    INDEX idx_students_grade_section (grade_id, section_id),
    INDEX idx_students_admission (admission_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### assignments

Homework and assignments.

```sql
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT NOT NULL,
    grade_id INT NOT NULL,
    assigned_by INT NOT NULL,
    published_date TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    total_marks INT NOT NULL,
    passing_marks INT,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    late_penalty_percent DECIMAL(5,2) DEFAULT 0,
    allow_resubmission BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    rubric JSON,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (assigned_by) REFERENCES teachers(id),
    INDEX idx_assignments_subject (subject_id),
    INDEX idx_assignments_grade (grade_id),
    INDEX idx_assignments_teacher (assigned_by),
    INDEX idx_assignments_due_date (due_date),
    INDEX idx_assignments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Status Values:** `draft`, `published`, `closed`, `graded`

### assignment_files

Files attached to assignments.

```sql
CREATE TABLE assignment_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    INDEX idx_assignment_files_assignment (assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### submissions

Student assignment submissions.

```sql
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    marks_obtained DECIMAL(5,2),
    feedback TEXT,
    graded_by INT,
    graded_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'submitted',
    comments TEXT,
    attempt_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (graded_by) REFERENCES teachers(id),
    UNIQUE KEY unique_assignment_student_attempt (assignment_id, student_id, attempt_number),
    INDEX idx_submissions_assignment (assignment_id),
    INDEX idx_submissions_student (student_id),
    INDEX idx_submissions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Status Values:** `submitted`, `grading`, `graded`, `returned`

### submission_files

Files submitted by students.

```sql
CREATE TABLE submission_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    INDEX idx_submission_files_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### exams

Examinations and tests.

```sql
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    academic_year_id INT NOT NULL,
    grade_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    INDEX idx_exams_grade (grade_id),
    INDEX idx_exams_academic_year (academic_year_id),
    INDEX idx_exams_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Exam Types:** `unit_test`, `mid_term`, `final`, `board`, `mock`  
**Status:** `scheduled`, `ongoing`, `completed`, `cancelled`

### exam_subjects

Subjects included in an exam.

```sql
CREATE TABLE exam_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    subject_id INT NOT NULL,
    max_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    exam_date DATE,
    start_time TIME,
    end_time TIME,
    duration_minutes INT,
    room_number VARCHAR(20),
    invigilator_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (invigilator_id) REFERENCES teachers(id),
    UNIQUE KEY unique_exam_subject (exam_id, subject_id),
    INDEX idx_exam_subjects_exam (exam_id),
    INDEX idx_exam_subjects_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### exam_marks

Marks obtained by students in exams.

```sql
CREATE TABLE exam_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_subject_id INT NOT NULL,
    student_id INT NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    entered_by INT,
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (entered_by) REFERENCES teachers(id),
    UNIQUE KEY unique_exam_subject_student (exam_subject_id, student_id),
    INDEX idx_exam_marks_exam_subject (exam_subject_id),
    INDEX idx_exam_marks_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### attendance

Daily attendance records.

```sql
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    section_id INT,
    subject_id INT,
    period INT,
    status VARCHAR(20) NOT NULL,
    marked_by INT,
    reason TEXT,
    minutes_late INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (marked_by) REFERENCES teachers(id),
    UNIQUE KEY unique_student_date_subject_period (student_id, date, subject_id, period),
    INDEX idx_attendance_student_date (student_id, date),
    INDEX idx_attendance_section_date (section_id, date),
    INDEX idx_attendance_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Status Values:** `present`, `absent`, `late`, `excused`, `medical_leave`

---

## 6. Communication Tables

### notifications

System and user notifications.

```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    data JSON,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notifications_user (user_id, is_read),
    INDEX idx_notifications_type (notification_type),
    INDEX idx_notifications_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Types:** `assignment`, `grade`, `attendance`, `exam`, `announcement`, `message`  
**Priority:** `low`, `medium`, `high`, `urgent`

### announcements

Institution-wide or class-specific announcements.

```sql
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INT NOT NULL,
    audience_type VARCHAR(50) NOT NULL,
    target_grade_id INT,
    target_section_id INT,
    priority VARCHAR(20) DEFAULT 'medium',
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    attachment_urls JSON,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (target_grade_id) REFERENCES grades(id),
    FOREIGN KEY (target_section_id) REFERENCES sections(id),
    INDEX idx_announcements_institution (institution_id),
    INDEX idx_announcements_published (published_at DESC),
    INDEX idx_announcements_audience (audience_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Audience Types:** `all`, `students`, `teachers`, `parents`, `grade`, `section`

### messages

Direct messaging between users.

```sql
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    parent_message_id INT,
    attachment_urls JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (parent_message_id) REFERENCES messages(id),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_recipient (recipient_id, is_read),
    INDEX idx_messages_thread (parent_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. Gamification Tables

### badges

Achievement badges.

```sql
CREATE TABLE badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    badge_type VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common',
    criteria JSON,
    points_value INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    INDEX idx_badges_type (badge_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Badge Types:** `academic`, `attendance`, `participation`, `leadership`, `special`  
**Rarity:** `common`, `uncommon`, `rare`, `epic`, `legendary`

### user_badges

Badges earned by users.

```sql
CREATE TABLE user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    awarded_by INT,
    reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id),
    FOREIGN KEY (awarded_by) REFERENCES users(id),
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_badges_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### user_points

Gamification points.

```sql
CREATE TABLE user_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    current_level_points INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user (user_id),
    INDEX idx_user_points_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### point_history

Point transaction history.

```sql
CREATE TABLE point_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_point_history_user (user_id),
    INDEX idx_point_history_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Event Types:** `assignment_completion`, `perfect_attendance`, `exam_excellence`, `helping_peer`, `streak_bonus`

---

## 8. Analytics Tables

### analytics_cache

Cached analytics data for performance.

```sql
CREATE TABLE analytics_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_type VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analytics_cache_key (cache_key),
    INDEX idx_analytics_cache_type (cache_type),
    INDEX idx_analytics_cache_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### student_performance_metrics

Aggregated student performance data.

```sql
CREATE TABLE student_performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    subject_id INT,
    average_score DECIMAL(5,2),
    highest_score DECIMAL(5,2),
    lowest_score DECIMAL(5,2),
    attendance_percentage DECIMAL(5,2),
    assignments_completed INT,
    assignments_total INT,
    rank_in_class INT,
    rank_in_grade INT,
    trend VARCHAR(20),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    UNIQUE KEY unique_student_year_subject (student_id, academic_year_id, subject_id),
    INDEX idx_perf_metrics_student (student_id),
    INDEX idx_perf_metrics_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### ml_predictions

Machine learning prediction results.

```sql
CREATE TABLE ml_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    subject_id INT,
    predicted_score DECIMAL(5,2),
    confidence DECIMAL(5,4),
    factors JSON,
    recommendations JSON,
    target_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    INDEX idx_predictions_student (student_id),
    INDEX idx_predictions_type (prediction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 9. Optional Module Tables

### study_materials

Learning resources and materials.

```sql
CREATE TABLE study_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT,
    grade_id INT,
    chapter_id INT,
    material_type VARCHAR(50) NOT NULL,
    file_url TEXT,
    file_size BIGINT,
    thumbnail_url TEXT,
    uploaded_by INT NOT NULL,
    downloads_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_materials_subject (subject_id),
    INDEX idx_materials_grade (grade_id),
    INDEX idx_materials_type (material_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Material Types:** `notes`, `presentation`, `video`, `worksheet`, `textbook`, `reference`

### fee_structures

Fee management.

```sql
CREATE TABLE fee_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    grade_id INT,
    fee_category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    INDEX idx_fee_structures_grade (grade_id),
    INDEX idx_fee_structures_category (fee_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### fee_payments

Student fee payments.

```sql
CREATE TABLE fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(50) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id),
    INDEX idx_payments_student (student_id),
    INDEX idx_payments_status (payment_status),
    INDEX idx_payments_receipt (receipt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 10. Indexes and Constraints

### Performance Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_students_grade_section_active 
    ON students(grade_id, section_id, deleted_at);

CREATE INDEX idx_assignments_subject_grade_status 
    ON assignments(subject_id, grade_id, status);

CREATE INDEX idx_attendance_student_date_range 
    ON attendance(student_id, date DESC);

CREATE INDEX idx_notifications_user_unread 
    ON notifications(user_id, is_read);
```

### Foreign Key Constraints

All foreign keys include appropriate ON DELETE actions:

- `CASCADE`: For dependent records (e.g., submission_files → submissions)
- `SET NULL`: For optional references (e.g., sections → class_teacher)
- `RESTRICT`: For critical references (e.g., students → institution - default behavior)

### Check Constraints

```sql
ALTER TABLE students 
    ADD CONSTRAINT ck_students_valid_dob 
    CHECK (date_of_birth < CURDATE());

ALTER TABLE assignments 
    ADD CONSTRAINT ck_assignments_valid_dates 
    CHECK (due_date > published_date);
```

---

## 11. Database Relationships

### One-to-Many Relationships

1. Institution → Users
2. Institution → Students
3. Institution → Teachers
4. Grade → Sections
5. Subject → Chapters
6. Chapter → Topics
7. Assignment → Submissions
8. Student → Submissions
9. Teacher → Assignments

### Many-to-Many Relationships

1. Roles ↔ Permissions (via role_permissions)
2. Grades ↔ Subjects (via grade_subjects)
3. Teachers ↔ Subjects (via teacher_subjects)
4. Students ↔ Parents (via student_parents)

### Self-Referencing Relationships

1. Messages → parent_message (threading)
2. Topics → parent_topic (hierarchical topics)

---

## Migration Strategy

### Initial Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE edu_platform_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run all migrations
alembic upgrade head
```

### Seed Data

```sql
-- Create default institution
INSERT INTO institutions (name, slug, email) 
VALUES ('Demo School', 'demo-school', 'admin@demo.school');

-- Create roles
INSERT INTO roles (name, display_name, is_system) VALUES
    ('super_admin', 'Super Administrator', true),
    ('institution_admin', 'Institution Administrator', true),
    ('teacher', 'Teacher', true),
    ('student', 'Student', true),
    ('parent', 'Parent', true);

-- Create academic year
INSERT INTO academic_years (institution_id, name, start_date, end_date, is_current)
VALUES (1, '2024-2025', '2024-06-01', '2025-05-31', true);
```

### Backup Strategy

```bash
# Full backup
mysqldump -u username -p --single-transaction --routines --triggers edu_platform_prod > backup_$(date +%Y%m%d).sql

# Compressed backup
mysqldump -u username -p --single-transaction --routines --triggers edu_platform_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Schema only
mysqldump -u username -p --no-data --routines --triggers edu_platform_prod > schema_$(date +%Y%m%d).sql

# Restore
mysql -u username -p edu_platform_dev < backup_20240115.sql
```

---

## Performance Considerations

### Query Optimization

1. **Use Appropriate Indexes**: Create indexes on frequently queried columns
2. **Avoid N+1 Queries**: Use JOINs or eager loading
3. **Limit Result Sets**: Always use pagination
4. **Cache Aggregations**: Store computed values in analytics tables
5. **Use Database Views**: For complex repeated queries

### Sample Optimized Queries

```sql
-- Get student with all related data (optimized)
SELECT 
    s.*,
    u.email, u.full_name,
    g.name as grade_name,
    sec.name as section_name
FROM students s
JOIN users u ON s.user_id = u.id
JOIN grades g ON s.grade_id = g.id
JOIN sections sec ON s.section_id = sec.id
WHERE s.id = ? AND s.deleted_at IS NULL;

-- Get class performance summary (using analytics table)
SELECT 
    spm.subject_id,
    s.name as subject_name,
    AVG(spm.average_score) as class_average,
    MAX(spm.highest_score) as class_highest
FROM student_performance_metrics spm
JOIN subjects s ON spm.subject_id = s.id
WHERE spm.academic_year_id = ?
GROUP BY spm.subject_id, s.name;
```

---

## Maintenance

### Regular Tasks

```sql
-- Optimize tables
OPTIMIZE TABLE users, students, assignments;

-- Analyze tables for query optimization
ANALYZE TABLE users, students, assignments;

-- Check table status
SHOW TABLE STATUS WHERE Name = 'users';
```

### Monitoring Queries

```sql
-- Check table sizes
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'edu_platform_dev'
ORDER BY (data_length + index_length) DESC;

-- Check index usage
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'edu_platform_dev'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Check for missing indexes on foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_SCHEMA = 'edu_platform_dev';
```

---

This database schema documentation provides a comprehensive overview of the Educational SaaS Platform's data structure. Regular updates should be made as the schema evolves.
