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
- **DBMS:** PostgreSQL 14+
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Charset:** UTF-8
- **Timezone:** UTC (all timestamps)

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
    id SERIAL PRIMARY KEY,
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
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_institutions_slug ON institutions(slug);
CREATE INDEX idx_institutions_is_active ON institutions(is_active);
```

**Columns:**
- `id`: Primary key
- `slug`: URL-friendly unique identifier
- `settings`: JSON configuration (theme, features enabled, etc.)
- `deleted_at`: Soft delete timestamp

### users

Core user authentication and profile table.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url TEXT,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(institution_id, email)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);
```

**Columns:**
- `password_hash`: Bcrypt hashed password
- `is_verified`: Email verification status
- `last_login_at`: Last successful login timestamp

### roles

Role-based access control.

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
```

**Example Permissions:**
- `students:view`, `students:create`, `students:edit`, `students:delete`
- `grades:view`, `grades:edit`
- `assignments:create`, `assignments:grade`

### audit_logs

Comprehensive audit trail.

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_institution ON audit_logs(institution_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

**Actions:** `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `VIEW`, `EXPORT`

---

## 4. Academic Tables

### academic_years

Academic year periods.

```sql
CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, name)
);

CREATE INDEX idx_academic_years_current ON academic_years(institution_id, is_current);
```

### grades

Class/Grade levels (e.g., Grade 10, Class 12).

```sql
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_grades_institution ON grades(institution_id);
CREATE INDEX idx_grades_level ON grades(level);
```

### sections

Divisions within a grade (e.g., Section A, Section B).

```sql
CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    name VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 40,
    class_teacher_id INTEGER REFERENCES teachers(id),
    room_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(grade_id, name)
);

CREATE INDEX idx_sections_grade ON sections(grade_id);
CREATE INDEX idx_sections_teacher ON sections(class_teacher_id);
```

### subjects

Subjects taught in the institution.

```sql
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    credit_hours INTEGER DEFAULT 0,
    is_elective BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subjects_institution ON subjects(institution_id);
CREATE INDEX idx_subjects_code ON subjects(code);
```

### grade_subjects

Many-to-many relationship between grades and subjects.

```sql
CREATE TABLE grade_subjects (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    is_mandatory BOOLEAN DEFAULT TRUE,
    weekly_periods INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grade_id, subject_id)
);
```

### chapters

Subject chapters/units.

```sql
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    name VARCHAR(200) NOT NULL,
    chapter_number INTEGER NOT NULL,
    description TEXT,
    estimated_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chapters_subject ON chapters(subject_id);
```

### topics

Topics within chapters.

```sql
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id),
    name VARCHAR(200) NOT NULL,
    topic_number NUMERIC(5,2),
    description TEXT,
    learning_outcomes TEXT[],
    difficulty_level VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topics_chapter ON topics(chapter_id);
```

---

## 5. Assessment Tables

### teachers

Teacher profiles.

```sql
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100),
    qualification VARCHAR(255),
    specialization TEXT,
    joining_date DATE,
    experience_years INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(institution_id, employee_id)
);

CREATE INDEX idx_teachers_user ON teachers(user_id);
CREATE INDEX idx_teachers_institution ON teachers(institution_id);
```

### teacher_subjects

Subjects assigned to teachers.

```sql
CREATE TABLE teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    grade_id INTEGER REFERENCES grades(id),
    section_id INTEGER REFERENCES sections(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, subject_id, grade_id, section_id, academic_year_id)
);
```

### students

Student profiles.

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) NOT NULL,
    roll_number VARCHAR(50),
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    section_id INTEGER NOT NULL REFERENCES sections(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(institution_id, admission_number)
);

CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_grade_section ON students(grade_id, section_id);
CREATE INDEX idx_students_admission ON students(admission_number);
```

### assignments

Homework and assignments.

```sql
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    assigned_by INTEGER NOT NULL REFERENCES teachers(id),
    published_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    late_penalty_percent NUMERIC(5,2) DEFAULT 0,
    allow_resubmission BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    rubric JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_assignments_subject ON assignments(subject_id);
CREATE INDEX idx_assignments_grade ON assignments(grade_id);
CREATE INDEX idx_assignments_teacher ON assignments(assigned_by);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);
```

**Status Values:** `draft`, `published`, `closed`, `graded`

### assignment_files

Files attached to assignments.

```sql
CREATE TABLE assignment_files (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignment_files_assignment ON assignment_files(assignment_id);
```

### submissions

Student assignment submissions.

```sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    marks_obtained NUMERIC(5,2),
    feedback TEXT,
    graded_by INTEGER REFERENCES teachers(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'submitted',
    comments TEXT,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id, attempt_number)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
```

**Status Values:** `submitted`, `grading`, `graded`, `returned`

### submission_files

Files submitted by students.

```sql
CREATE TABLE submission_files (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submission_files_submission ON submission_files(submission_id);
```

### exams

Examinations and tests.

```sql
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
    grade_id INTEGER NOT NULL REFERENCES grades(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_exams_grade ON exams(grade_id);
CREATE INDEX idx_exams_academic_year ON exams(academic_year_id);
CREATE INDEX idx_exams_status ON exams(status);
```

**Exam Types:** `unit_test`, `mid_term`, `final`, `board`, `mock`  
**Status:** `scheduled`, `ongoing`, `completed`, `cancelled`

### exam_subjects

Subjects included in an exam.

```sql
CREATE TABLE exam_subjects (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    max_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    exam_date DATE,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    room_number VARCHAR(20),
    invigilator_id INTEGER REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, subject_id)
);

CREATE INDEX idx_exam_subjects_exam ON exam_subjects(exam_id);
CREATE INDEX idx_exam_subjects_subject ON exam_subjects(subject_id);
```

### exam_marks

Marks obtained by students in exams.

```sql
CREATE TABLE exam_marks (
    id SERIAL PRIMARY KEY,
    exam_subject_id INTEGER NOT NULL REFERENCES exam_subjects(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    marks_obtained NUMERIC(5,2) NOT NULL,
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    entered_by INTEGER REFERENCES teachers(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_subject_id, student_id)
);

CREATE INDEX idx_exam_marks_exam_subject ON exam_marks(exam_subject_id);
CREATE INDEX idx_exam_marks_student ON exam_marks(student_id);
```

### attendance

Daily attendance records.

```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    student_id INTEGER NOT NULL REFERENCES students(id),
    date DATE NOT NULL,
    section_id INTEGER REFERENCES sections(id),
    subject_id INTEGER REFERENCES subjects(id),
    period INTEGER,
    status VARCHAR(20) NOT NULL,
    marked_by INTEGER REFERENCES teachers(id),
    reason TEXT,
    minutes_late INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date, subject_id, period)
);

CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_section_date ON attendance(section_id, date);
CREATE INDEX idx_attendance_status ON attendance(status);
```

**Status Values:** `present`, `absent`, `late`, `excused`, `medical_leave`

---

## 6. Communication Tables

### notifications

System and user notifications.

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

**Types:** `assignment`, `grade`, `attendance`, `exam`, `announcement`, `message`  
**Priority:** `low`, `medium`, `high`, `urgent`

### announcements

Institution-wide or class-specific announcements.

```sql
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    audience_type VARCHAR(50) NOT NULL,
    target_grade_id INTEGER REFERENCES grades(id),
    target_section_id INTEGER REFERENCES sections(id),
    priority VARCHAR(20) DEFAULT 'medium',
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    attachment_urls TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_institution ON announcements(institution_id);
CREATE INDEX idx_announcements_published ON announcements(published_at DESC);
CREATE INDEX idx_announcements_audience ON announcements(audience_type);
```

**Audience Types:** `all`, `students`, `teachers`, `parents`, `grade`, `section`

### messages

Direct messaging between users.

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    recipient_id INTEGER NOT NULL REFERENCES users(id),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    parent_message_id INTEGER REFERENCES messages(id),
    attachment_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_thread ON messages(parent_message_id);
```

---

## 7. Gamification Tables

### badges

Achievement badges.

```sql
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    badge_type VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common',
    criteria JSONB,
    points_value INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_type ON badges(badge_type);
```

**Badge Types:** `academic`, `attendance`, `participation`, `leadership`, `special`  
**Rarity:** `common`, `uncommon`, `rare`, `epic`, `legendary`

### user_badges

Badges earned by users.

```sql
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    badge_id INTEGER NOT NULL REFERENCES badges(id),
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    awarded_by INTEGER REFERENCES users(id),
    reason TEXT,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
```

### user_points

Gamification points.

```sql
CREATE TABLE user_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_level_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_points_user ON user_points(user_id);
```

### point_history

Point transaction history.

```sql
CREATE TABLE point_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    points INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_point_history_user ON point_history(user_id);
CREATE INDEX idx_point_history_created ON point_history(created_at DESC);
```

**Event Types:** `assignment_completion`, `perfect_attendance`, `exam_excellence`, `helping_peer`, `streak_bonus`

---

## 8. Analytics Tables

### analytics_cache

Cached analytics data for performance.

```sql
CREATE TABLE analytics_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_type ON analytics_cache(cache_type);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
```

### student_performance_metrics

Aggregated student performance data.

```sql
CREATE TABLE student_performance_metrics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
    subject_id INTEGER REFERENCES subjects(id),
    average_score NUMERIC(5,2),
    highest_score NUMERIC(5,2),
    lowest_score NUMERIC(5,2),
    attendance_percentage NUMERIC(5,2),
    assignments_completed INTEGER,
    assignments_total INTEGER,
    rank_in_class INTEGER,
    rank_in_grade INTEGER,
    trend VARCHAR(20),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year_id, subject_id)
);

CREATE INDEX idx_perf_metrics_student ON student_performance_metrics(student_id);
CREATE INDEX idx_perf_metrics_subject ON student_performance_metrics(subject_id);
```

### ml_predictions

Machine learning prediction results.

```sql
CREATE TABLE ml_predictions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    prediction_type VARCHAR(50) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id),
    predicted_score NUMERIC(5,2),
    confidence NUMERIC(5,4),
    factors JSONB,
    recommendations TEXT[],
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_student ON ml_predictions(student_id);
CREATE INDEX idx_predictions_type ON ml_predictions(prediction_type);
```

---

## 9. Optional Module Tables

### study_materials

Learning resources and materials.

```sql
CREATE TABLE study_materials (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INTEGER REFERENCES subjects(id),
    grade_id INTEGER REFERENCES grades(id),
    chapter_id INTEGER REFERENCES chapters(id),
    material_type VARCHAR(50) NOT NULL,
    file_url TEXT,
    file_size BIGINT,
    thumbnail_url TEXT,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    downloads_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_materials_subject ON study_materials(subject_id);
CREATE INDEX idx_materials_grade ON study_materials(grade_id);
CREATE INDEX idx_materials_type ON study_materials(material_type);
CREATE INDEX idx_materials_tags ON study_materials USING GIN(tags);
```

**Material Types:** `notes`, `presentation`, `video`, `worksheet`, `textbook`, `reference`

### fee_structures

Fee management.

```sql
CREATE TABLE fee_structures (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id),
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
    grade_id INTEGER REFERENCES grades(id),
    fee_category VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fee_structures_grade ON fee_structures(grade_id);
CREATE INDEX idx_fee_structures_category ON fee_structures(fee_category);
```

### fee_payments

Student fee payments.

```sql
CREATE TABLE fee_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    fee_structure_id INTEGER NOT NULL REFERENCES fee_structures(id),
    amount_paid NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(50) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_student ON fee_payments(student_id);
CREATE INDEX idx_payments_status ON fee_payments(payment_status);
CREATE INDEX idx_payments_receipt ON fee_payments(receipt_number);
```

---

## 10. Indexes and Constraints

### Performance Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_students_grade_section_active 
    ON students(grade_id, section_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_assignments_subject_grade_status 
    ON assignments(subject_id, grade_id, status);

CREATE INDEX idx_attendance_student_date_range 
    ON attendance(student_id, date DESC);

CREATE INDEX idx_notifications_user_unread 
    ON notifications(user_id) 
    WHERE is_read = FALSE;

-- JSONB indexes
CREATE INDEX idx_institutions_settings 
    ON institutions USING GIN(settings);

CREATE INDEX idx_analytics_cache_data 
    ON analytics_cache USING GIN(data);
```

### Foreign Key Constraints

All foreign keys include appropriate ON DELETE actions:

- `CASCADE`: For dependent records (e.g., submission_files → submissions)
- `SET NULL`: For optional references (e.g., sections → class_teacher)
- `RESTRICT`: For critical references (e.g., students → institution)

### Check Constraints

```sql
ALTER TABLE exam_marks 
    ADD CONSTRAINT ck_exam_marks_valid_marks 
    CHECK (marks_obtained >= 0 AND marks_obtained <= 
        (SELECT max_marks FROM exam_subjects WHERE id = exam_subject_id));

ALTER TABLE students 
    ADD CONSTRAINT ck_students_valid_dob 
    CHECK (date_of_birth < CURRENT_DATE);

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
createdb edu_platform_dev

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
pg_dump edu_platform_prod > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump edu_platform_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Schema only
pg_dump --schema-only edu_platform_prod > schema_$(date +%Y%m%d).sql

# Restore
psql edu_platform_dev < backup_20240115.sql
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
WHERE s.id = $1 AND s.deleted_at IS NULL;

-- Get class performance summary (using analytics table)
SELECT 
    spm.subject_id,
    s.name as subject_name,
    AVG(spm.average_score) as class_average,
    MAX(spm.highest_score) as class_highest
FROM student_performance_metrics spm
JOIN subjects s ON spm.subject_id = s.id
WHERE spm.academic_year_id = $1
GROUP BY spm.subject_id, s.name;
```

---

## Maintenance

### Regular Tasks

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim storage
VACUUM;

-- Full vacuum (requires downtime)
VACUUM FULL;

-- Reindex for performance
REINDEX DATABASE edu_platform_dev;
```

### Monitoring Queries

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

---

This database schema documentation provides a comprehensive overview of the Educational SaaS Platform's data structure. Regular updates should be made as the schema evolves.
