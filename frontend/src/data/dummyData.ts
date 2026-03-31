/**
 * @fileoverview Demo Data for Testing and Development
 *
 * This file contains comprehensive demo data for all user roles and features in the platform.
 * It provides realistic, pre-populated data for testing purposes without requiring a backend connection.
 *
 * @module dummyData
 *
 * Demo User Credentials:
 * - Student: student@demo.com (or demo@example.com) / Demo@123
 * - Teacher: teacher@demo.com / Demo@123
 * - Parent: parent@demo.com / Demo@123
 * - Admin: admin@demo.com / Demo@123
 * - SuperAdmin: superadmin@demo.com / Demo@123
 *
 * Data Structure:
 * - Authentication data (users, tokens, credentials)
 * - Student data (profiles, attendance, assignments, exams)
 * - Teacher data (classes, students, grading, schedules)
 * - Parent data (children, monitoring, communication)
 * - Admin data (institution overview, statistics, management)
 * - SuperAdmin data (platform metrics, institutions, subscriptions)
 * - Gamification data (badges, points, leaderboards)
 * - Study tools data (flashcards, quizzes, pomodoro)
 * - Communication data (messages, announcements, notifications)
 * - Study materials (previous papers, library books)
 *
 * @see frontend/src/data/DEMO_USERS.md for detailed documentation
 */

import { AuthUser, AuthTokens, AuthResponse, UserRole } from '@/types/auth';
import { Assignment, AssignmentStatus, Submission, SubmissionStatus } from '@/types/assignment';
import {
  Badge,
  UserBadge,
  UserPoints,
  PointHistory,
  LeaderboardEntry,
  EventType,
  BadgeType,
  BadgeRarity,
} from '@/types/gamification';
import { Goal, GoalType, GoalStatus } from '@/types/goals';
import { ExamResult } from '@/types/examination';
import { StudentProfile, AttendanceSummary, ParentInfo } from '@/api/students';
import { Teacher, Subject, TeacherMyDashboardData } from '@/api/teachers';
import {
  TopicProbabilityRanking,
  FocusAreaRecommendation,
  StudyTimeAllocation,
  MarksDistribution,
} from '@/api/aiPredictionDashboard';
import { MonthlyAttendanceData, AttendanceStatus } from '@/api/attendance';
import { ParentDashboard } from '@/types/parent';
import { DashboardResponse as InstitutionAdminDashboard } from '@/api/institutionAdmin';
import { SuperAdminDashboardResponse } from '@/api/superAdmin';
import {
  FlashcardDeck,
  Flashcard,
  FlashcardDeckVisibility,
  FlashcardDeckStats,
} from '@/types/flashcard';
import {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizType,
  QuizStatus,
  QuestionType,
  QuizAttemptStatus,
  QuizLeaderboardEntry,
} from '@/types/quiz';
import { PomodoroSession, PomodoroSettings, PomodoroAnalytics } from '@/types/pomodoro';
import {
  UserProfile,
  NotificationPreferences,
  ThemeSettings,
  PrivacySettings,
  UserSettings,
  ConnectedDevice,
} from '@/types/settings';
import {
  Credential,
  CredentialType,
  CredentialSubType,
  CredentialStatus,
} from '@/types/credential';
import { Certificate, CertificateTemplate } from '@/api/schoolAdmin';

/**
 * Demo credentials for student user
 * @type {{email: string, password: string}}
 */
export const DEMO_CREDENTIALS = {
  email: 'demo@example.com',
  password: 'Demo@123',
};

/**
 * Demo credentials for teacher user
 * @type {{email: string, password: string}}
 */
export const TEACHER_CREDENTIALS = {
  email: 'teacher@demo.com',
  password: 'Demo@123',
};

/**
 * Demo credentials for parent user
 * @type {{email: string, password: string}}
 */
export const PARENT_CREDENTIALS = {
  email: 'parent@demo.com',
  password: 'Demo@123',
};

/**
 * Demo credentials for institution admin user
 * @type {{email: string, password: string}}
 */
export const ADMIN_CREDENTIALS = {
  email: 'admin@demo.com',
  password: 'Demo@123',
};

/**
 * Demo credentials for super admin user
 * @type {{email: string, password: string}}
 */
export const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin@demo.com',
  password: 'Demo@123',
};

/**
 * Demo authentication tokens for simulating JWT-based authentication
 * @type {AuthTokens}
 */
export const demoAuthTokens: AuthTokens = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_access_token',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_refresh_token',
  expiresIn: 3600,
  tokenType: 'Bearer',
};

/**
 * Demo student user profile (Alex Johnson - 10th Grade)
 * Primary demo account for student role testing
 * @type {AuthUser}
 */
export const demoAuthUser: AuthUser = {
  id: '1001',
  email: DEMO_CREDENTIALS.email,
  firstName: 'Alex',
  lastName: 'Johnson',
  fullName: 'Alex Johnson',
  role: 'student' as UserRole,
  avatar: 'https://i.pravatar.cc/150?img=12',
  isActive: true,
  emailVerified: true,
  isSuperuser: false,
  institution_id: 1,
  createdAt: '2023-09-01T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

/**
 * Demo teacher user profile (Dr. Emily Carter - Mathematics Teacher)
 * Primary demo account for teacher role testing
 * @type {AuthUser}
 */
export const teacherAuthUser: AuthUser = {
  id: '2001',
  email: TEACHER_CREDENTIALS.email,
  firstName: 'Emily',
  lastName: 'Carter',
  fullName: 'Dr. Emily Carter',
  role: 'teacher' as UserRole,
  avatar: 'https://i.pravatar.cc/150?img=47',
  isActive: true,
  emailVerified: true,
  isSuperuser: false,
  institution_id: 1,
  createdAt: '2015-08-01T09:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

/**
 * Demo parent user profile (Robert Williams)
 * Primary demo account for parent role testing
 * @type {AuthUser}
 */
export const parentAuthUser: AuthUser = {
  id: '5001',
  email: PARENT_CREDENTIALS.email,
  firstName: 'Robert',
  lastName: 'Williams',
  fullName: 'Robert Williams',
  role: 'parent' as UserRole,
  avatar: 'https://i.pravatar.cc/150?img=60',
  isActive: true,
  emailVerified: true,
  isSuperuser: false,
  institution_id: 1,
  createdAt: '2023-04-01T09:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

/**
 * Demo institution admin user profile (Michael Anderson)
 * Primary demo account for institution admin role testing
 * @type {AuthUser}
 */
export const adminAuthUser: AuthUser = {
  id: '3001',
  email: ADMIN_CREDENTIALS.email,
  firstName: 'Michael',
  lastName: 'Anderson',
  fullName: 'Michael Anderson',
  role: 'institution_admin' as UserRole,
  avatar: 'https://i.pravatar.cc/150?img=68',
  isActive: true,
  emailVerified: true,
  isSuperuser: false,
  institution_id: 1,
  createdAt: '2020-01-15T09:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

/**
 * Demo super admin user profile (Sarah Thompson)
 * Primary demo account for super admin role testing - has platform-wide access
 * @type {AuthUser}
 */
export const superadminAuthUser: AuthUser = {
  id: '9001',
  email: SUPERADMIN_CREDENTIALS.email,
  firstName: 'Sarah',
  lastName: 'Thompson',
  fullName: 'Sarah Thompson',
  role: 'superadmin' as UserRole,
  avatar: 'https://i.pravatar.cc/150?img=44',
  isActive: true,
  emailVerified: true,
  isSuperuser: true,
  institution_id: 0,
  createdAt: '2019-01-01T09:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

export const demoAuthResponse: AuthResponse = {
  user: demoAuthUser,
  tokens: demoAuthTokens,
};

export const teacherAuthResponse: AuthResponse = {
  user: teacherAuthUser,
  tokens: demoAuthTokens,
};

export const parentAuthResponse: AuthResponse = {
  user: parentAuthUser,
  tokens: demoAuthTokens,
};

export const adminAuthResponse: AuthResponse = {
  user: adminAuthUser,
  tokens: demoAuthTokens,
};

export const superadminAuthResponse: AuthResponse = {
  user: superadminAuthUser,
  tokens: demoAuthTokens,
};

/**
 * Demo parent information for student Alex Johnson
 * Contains contact details for both parents
 * @type {ParentInfo[]}
 */
export const demoParentInfo: ParentInfo[] = [
  {
    id: 501,
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'robert.johnson@example.com',
    phone: '+1-555-0101',
    relation_type: 'father',
    is_primary_contact: true,
  },
  {
    id: 502,
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-0102',
    relation_type: 'mother',
    is_primary_contact: false,
  },
];

/**
 * Demo attendance summary for student Alex Johnson
 * Shows overall attendance statistics
 * @type {AttendanceSummary}
 */
export const demoAttendanceSummary: AttendanceSummary = {
  total_days: 150,
  present_days: 120,
  absent_days: 15,
  late_days: 10,
  half_days: 5,
  attendance_percentage: 80.0,
};

/**
 * Demo monthly attendance records for January 2024
 * Shows day-by-day attendance status (Present/Absent/Late/Half Day)
 * @type {MonthlyAttendanceData[]}
 */
export const demoMonthlyAttendance: MonthlyAttendanceData[] = [
  { date: '2024-01-02', status: AttendanceStatus.PRESENT },
  { date: '2024-01-03', status: AttendanceStatus.PRESENT },
  { date: '2024-01-04', status: AttendanceStatus.LATE },
  { date: '2024-01-05', status: AttendanceStatus.PRESENT },
  { date: '2024-01-08', status: AttendanceStatus.PRESENT },
  { date: '2024-01-09', status: AttendanceStatus.ABSENT },
  { date: '2024-01-10', status: AttendanceStatus.PRESENT },
  { date: '2024-01-11', status: AttendanceStatus.PRESENT },
  { date: '2024-01-12', status: AttendanceStatus.PRESENT },
  { date: '2024-01-15', status: AttendanceStatus.PRESENT },
  { date: '2024-01-16', status: AttendanceStatus.LATE },
  { date: '2024-01-17', status: AttendanceStatus.PRESENT },
  { date: '2024-01-18', status: AttendanceStatus.PRESENT },
  { date: '2024-01-19', status: AttendanceStatus.PRESENT },
  { date: '2024-01-22', status: AttendanceStatus.PRESENT },
  { date: '2024-01-23', status: AttendanceStatus.PRESENT },
  { date: '2024-01-24', status: AttendanceStatus.PRESENT },
  { date: '2024-01-25', status: AttendanceStatus.HALF_DAY },
  { date: '2024-01-26', status: AttendanceStatus.PRESENT },
  { date: '2024-01-29', status: AttendanceStatus.PRESENT },
  { date: '2024-01-30', status: AttendanceStatus.PRESENT },
  { date: '2024-01-31', status: AttendanceStatus.PRESENT },
];

/**
 * Demo student profile for Alex Johnson
 * Complete student information including personal details, section, parents, and academic stats
 * @type {StudentProfile}
 */
export const demoStudentProfile: StudentProfile = {
  id: 1001,
  institution_id: 1,
  user_id: 1001,
  section_id: 101,
  admission_number: 'STD2023001',
  roll_number: '12',
  first_name: 'Alex',
  last_name: 'Johnson',
  email: DEMO_CREDENTIALS.email,
  phone: '+1-555-1001',
  date_of_birth: '2008-05-15',
  gender: 'Male',
  blood_group: 'O+',
  address: '123 Maple Street, Springfield, IL 62701',
  parent_name: 'Robert Johnson',
  parent_email: 'robert.johnson@example.com',
  parent_phone: '+1-555-0101',
  admission_date: '2023-04-01',
  photo_url: 'https://i.pravatar.cc/150?img=12',
  emergency_contact_name: 'Sarah Johnson',
  emergency_contact_phone: '+1-555-0102',
  emergency_contact_relation: 'Mother',
  previous_school: 'Lincoln Elementary School',
  medical_conditions: 'None',
  nationality: 'American',
  religion: 'Christian',
  status: 'active',
  is_active: true,
  created_at: '2023-04-01T09:00:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  section: {
    id: 101,
    name: 'A',
    grade_id: 10,
    grade: {
      id: 10,
      name: '10th Grade',
    },
  },
  parents_info: demoParentInfo,
  attendance_summary: demoAttendanceSummary,
  total_assignments: 25,
  completed_assignments: 20,
  pending_assignments: 5,
};

/**
 * Demo subjects for 10th grade
 * List of all subjects taught in the curriculum
 * @type {Subject[]}
 */
export const demoSubjects: Subject[] = [
  { id: 1, name: 'Mathematics', code: 'MATH10', is_primary: true },
  { id: 2, name: 'Physics', code: 'PHY10', is_primary: false },
  { id: 3, name: 'Chemistry', code: 'CHEM10', is_primary: false },
  { id: 4, name: 'English', code: 'ENG10', is_primary: false },
  { id: 5, name: 'History', code: 'HIST10', is_primary: false },
];

/**
 * Demo teachers database
 * Contains profiles for all teachers teaching 10th grade subjects
 * @type {Teacher[]}
 */
export const demoTeachers: Teacher[] = [
  {
    id: 201,
    institution_id: 1,
    user_id: 2001,
    employee_id: 'T001',
    first_name: 'Dr. Emily',
    last_name: 'Carter',
    email: 'emily.carter@school.edu',
    phone: '+1-555-2001',
    gender: 'Female',
    qualification: 'Ph.D. in Mathematics',
    specialization: 'Algebra and Calculus',
    joining_date: '2015-08-01',
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=47',
    created_at: '2015-08-01T09:00:00Z',
    updated_at: '2024-01-10T14:00:00Z',
    subjects: [{ id: 1, name: 'Mathematics', code: 'MATH10', is_primary: true }],
  },
  {
    id: 202,
    institution_id: 1,
    user_id: 2002,
    employee_id: 'T002',
    first_name: 'Prof. James',
    last_name: 'Wilson',
    email: 'james.wilson@school.edu',
    phone: '+1-555-2002',
    gender: 'Male',
    qualification: 'M.Sc. in Physics',
    specialization: 'Quantum Mechanics',
    joining_date: '2017-07-15',
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=33',
    created_at: '2017-07-15T09:00:00Z',
    updated_at: '2024-01-10T14:00:00Z',
    subjects: [{ id: 2, name: 'Physics', code: 'PHY10', is_primary: true }],
  },
  {
    id: 203,
    institution_id: 1,
    user_id: 2003,
    employee_id: 'T003',
    first_name: 'Dr. Maria',
    last_name: 'Rodriguez',
    email: 'maria.rodriguez@school.edu',
    phone: '+1-555-2003',
    gender: 'Female',
    qualification: 'Ph.D. in Chemistry',
    specialization: 'Organic Chemistry',
    joining_date: '2016-09-01',
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=45',
    created_at: '2016-09-01T09:00:00Z',
    updated_at: '2024-01-10T14:00:00Z',
    subjects: [{ id: 3, name: 'Chemistry', code: 'CHEM10', is_primary: true }],
  },
  {
    id: 204,
    institution_id: 1,
    user_id: 2004,
    employee_id: 'T004',
    first_name: 'Mr. David',
    last_name: 'Thompson',
    email: 'david.thompson@school.edu',
    phone: '+1-555-2004',
    gender: 'Male',
    qualification: 'M.A. in English Literature',
    specialization: 'Contemporary Literature',
    joining_date: '2018-06-01',
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=52',
    created_at: '2018-06-01T09:00:00Z',
    updated_at: '2024-01-10T14:00:00Z',
    subjects: [{ id: 4, name: 'English', code: 'ENG10', is_primary: true }],
  },
  {
    id: 205,
    institution_id: 1,
    user_id: 2005,
    employee_id: 'T005',
    first_name: 'Ms. Jennifer',
    last_name: 'Lee',
    email: 'jennifer.lee@school.edu',
    phone: '+1-555-2005',
    gender: 'Female',
    qualification: 'M.A. in History',
    specialization: 'Modern World History',
    joining_date: '2019-08-15',
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=48',
    created_at: '2019-08-15T09:00:00Z',
    updated_at: '2024-01-10T14:00:00Z',
    subjects: [{ id: 5, name: 'History', code: 'HIST10', is_primary: true }],
  },
];

/**
 * Demo assignments for 10th grade across all subjects
 * Includes published assignments with various due dates and statuses
 * @type {Assignment[]}
 */
export const demoAssignments: Assignment[] = [
  {
    id: 1,
    institution_id: 1,
    teacher_id: 201,
    grade_id: 10,
    section_id: 101,
    subject_id: 1,
    title: 'Quadratic Equations Problem Set',
    description: 'Solve all problems from Chapter 4',
    instructions: 'Show all work and provide detailed solutions',
    due_date: '2024-02-05T23:59:59Z',
    publish_date: '2024-01-20T08:00:00Z',
    max_marks: 100,
    passing_marks: 40,
    allow_late_submission: true,
    late_penalty_percentage: 10,
    max_file_size_mb: 5,
    allowed_file_types: 'pdf,doc,docx',
    status: AssignmentStatus.PUBLISHED,
    is_active: true,
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    teacher_id: 202,
    grade_id: 10,
    section_id: 101,
    subject_id: 2,
    title: "Newton's Laws Lab Report",
    description: "Complete lab report on Newton's laws experiment",
    instructions: 'Include hypothesis, methodology, results, and conclusion',
    due_date: '2024-02-10T23:59:59Z',
    publish_date: '2024-01-25T08:00:00Z',
    max_marks: 50,
    passing_marks: 25,
    allow_late_submission: false,
    max_file_size_mb: 10,
    allowed_file_types: 'pdf,docx',
    status: AssignmentStatus.PUBLISHED,
    is_active: true,
    created_at: '2024-01-25T08:00:00Z',
    updated_at: '2024-01-25T08:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    teacher_id: 203,
    grade_id: 10,
    section_id: 101,
    subject_id: 3,
    title: 'Chemical Bonding Essay',
    description: 'Write an essay on types of chemical bonds',
    instructions: 'Minimum 1000 words with proper citations',
    due_date: '2024-01-28T23:59:59Z',
    publish_date: '2024-01-15T08:00:00Z',
    max_marks: 75,
    passing_marks: 30,
    allow_late_submission: true,
    late_penalty_percentage: 15,
    max_file_size_mb: 5,
    allowed_file_types: 'pdf,doc,docx',
    status: AssignmentStatus.PUBLISHED,
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    teacher_id: 204,
    grade_id: 10,
    section_id: 101,
    subject_id: 4,
    title: 'Shakespeare Analysis',
    description: 'Analyze themes in Macbeth Act 1-3',
    instructions: 'Focus on character development and symbolism',
    due_date: '2024-02-15T23:59:59Z',
    publish_date: '2024-01-30T08:00:00Z',
    max_marks: 80,
    passing_marks: 35,
    allow_late_submission: true,
    late_penalty_percentage: 5,
    max_file_size_mb: 5,
    allowed_file_types: 'pdf,docx',
    status: AssignmentStatus.PUBLISHED,
    is_active: true,
    created_at: '2024-01-30T08:00:00Z',
    updated_at: '2024-01-30T08:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    teacher_id: 205,
    grade_id: 10,
    section_id: 101,
    subject_id: 5,
    title: 'World War II Timeline Project',
    description: 'Create a detailed timeline of major WWII events',
    instructions: 'Include dates, descriptions, and significance of each event',
    due_date: '2024-02-20T23:59:59Z',
    publish_date: '2024-02-01T08:00:00Z',
    max_marks: 60,
    passing_marks: 30,
    allow_late_submission: true,
    late_penalty_percentage: 10,
    max_file_size_mb: 15,
    allowed_file_types: 'pdf,ppt,pptx',
    status: AssignmentStatus.PUBLISHED,
    is_active: true,
    created_at: '2024-02-01T08:00:00Z',
    updated_at: '2024-02-01T08:00:00Z',
  },
];

/**
 * Demo assignment submissions for student Alex Johnson
 * Shows various submission states: graded, submitted, and not submitted
 * @type {Submission[]}
 */
export const demoSubmissions: Submission[] = [
  {
    id: 101,
    assignment_id: 1,
    student_id: 1001,
    submission_text: 'Completed all 20 problems with detailed solutions',
    submitted_at: '2024-02-03T18:30:00Z',
    is_late: false,
    marks_obtained: 92,
    grade: 'A',
    feedback: 'Excellent work! Clear understanding of quadratic equations.',
    graded_by: 201,
    graded_at: '2024-02-04T10:00:00Z',
    status: SubmissionStatus.GRADED,
    created_at: '2024-02-03T18:30:00Z',
    updated_at: '2024-02-04T10:00:00Z',
  },
  {
    id: 102,
    assignment_id: 2,
    student_id: 1001,
    submission_text: 'Lab report with all sections completed',
    submitted_at: '2024-02-09T20:15:00Z',
    is_late: false,
    marks_obtained: 45,
    grade: 'A',
    feedback: 'Great experimental methodology and analysis.',
    graded_by: 202,
    graded_at: '2024-02-11T09:30:00Z',
    status: SubmissionStatus.GRADED,
    created_at: '2024-02-09T20:15:00Z',
    updated_at: '2024-02-11T09:30:00Z',
  },
  {
    id: 103,
    assignment_id: 3,
    student_id: 1001,
    submission_text: '1200-word essay on chemical bonding types',
    submitted_at: '2024-01-27T22:00:00Z',
    is_late: false,
    marks_obtained: 68,
    grade: 'B+',
    feedback: 'Good content but could use more specific examples.',
    graded_by: 203,
    graded_at: '2024-01-29T14:00:00Z',
    status: SubmissionStatus.GRADED,
    created_at: '2024-01-27T22:00:00Z',
    updated_at: '2024-01-29T14:00:00Z',
  },
  {
    id: 104,
    assignment_id: 4,
    student_id: 1001,
    submission_text: 'Macbeth analysis focusing on themes and characters',
    submitted_at: '2024-02-14T19:45:00Z',
    is_late: false,
    status: SubmissionStatus.SUBMITTED,
    created_at: '2024-02-14T19:45:00Z',
    updated_at: '2024-02-14T19:45:00Z',
  },
  {
    id: 105,
    assignment_id: 5,
    student_id: 1001,
    submitted_at: undefined,
    is_late: false,
    status: SubmissionStatus.NOT_SUBMITTED,
    created_at: '2024-02-01T08:00:00Z',
    updated_at: '2024-02-01T08:00:00Z',
  },
];

/**
 * Demo exam results for student Alex Johnson
 * Contains detailed exam results with subject-wise breakdown across multiple exams
 * @type {ExamResult[]}
 */
export const demoExamResults: ExamResult[] = [
  {
    id: 301,
    institution_id: 1,
    exam_id: 1,
    student_id: 1001,
    student_name: 'Alex Johnson',
    student_roll_number: '12',
    section_id: 101,
    total_marks_obtained: 432,
    total_max_marks: 500,
    percentage: 86.4,
    grade: 'A',
    grade_point: 9.0,
    section_rank: 3,
    grade_rank: 5,
    is_pass: true,
    subjects_passed: 5,
    subjects_failed: 0,
    created_at: '2023-12-20T10:00:00Z',
    updated_at: '2023-12-20T10:00:00Z',
    subject_results: [
      {
        subject_id: 1,
        subject_name: 'Mathematics',
        theory_marks: 88,
        practical_marks: 0,
        total_marks: 88,
        max_marks: 100,
        percentage: 88.0,
        grade: 'A',
        is_pass: true,
      },
      {
        subject_id: 2,
        subject_name: 'Physics',
        theory_marks: 75,
        practical_marks: 18,
        total_marks: 93,
        max_marks: 100,
        percentage: 93.0,
        grade: 'A+',
        is_pass: true,
      },
      {
        subject_id: 3,
        subject_name: 'Chemistry',
        theory_marks: 70,
        practical_marks: 15,
        total_marks: 85,
        max_marks: 100,
        percentage: 85.0,
        grade: 'A',
        is_pass: true,
      },
      {
        subject_id: 4,
        subject_name: 'English',
        theory_marks: 82,
        practical_marks: 0,
        total_marks: 82,
        max_marks: 100,
        percentage: 82.0,
        grade: 'A',
        is_pass: true,
      },
      {
        subject_id: 5,
        subject_name: 'History',
        theory_marks: 84,
        practical_marks: 0,
        total_marks: 84,
        max_marks: 100,
        percentage: 84.0,
        grade: 'A',
        is_pass: true,
      },
    ],
  },
  {
    id: 302,
    institution_id: 1,
    exam_id: 2,
    student_id: 1001,
    student_name: 'Alex Johnson',
    student_roll_number: '12',
    section_id: 101,
    total_marks_obtained: 385,
    total_max_marks: 450,
    percentage: 85.6,
    grade: 'A',
    grade_point: 8.8,
    section_rank: 4,
    grade_rank: 7,
    is_pass: true,
    subjects_passed: 5,
    subjects_failed: 0,
    created_at: '2023-10-15T10:00:00Z',
    updated_at: '2023-10-15T10:00:00Z',
    subject_results: [
      {
        subject_id: 1,
        subject_name: 'Mathematics',
        theory_marks: 85,
        practical_marks: 0,
        total_marks: 85,
        max_marks: 90,
        percentage: 94.4,
        grade: 'A+',
        is_pass: true,
      },
      {
        subject_id: 2,
        subject_name: 'Physics',
        theory_marks: 68,
        practical_marks: 16,
        total_marks: 84,
        max_marks: 90,
        percentage: 93.3,
        grade: 'A+',
        is_pass: true,
      },
      {
        subject_id: 3,
        subject_name: 'Chemistry',
        theory_marks: 62,
        practical_marks: 14,
        total_marks: 76,
        max_marks: 90,
        percentage: 84.4,
        grade: 'A',
        is_pass: true,
      },
      {
        subject_id: 4,
        subject_name: 'English',
        theory_marks: 70,
        practical_marks: 0,
        total_marks: 70,
        max_marks: 90,
        percentage: 77.8,
        grade: 'B+',
        is_pass: true,
      },
      {
        subject_id: 5,
        subject_name: 'History',
        theory_marks: 70,
        practical_marks: 0,
        total_marks: 70,
        max_marks: 90,
        percentage: 77.8,
        grade: 'B+',
        is_pass: true,
      },
    ],
  },
  {
    id: 303,
    institution_id: 1,
    exam_id: 3,
    student_id: 1001,
    student_name: 'Alex Johnson',
    student_roll_number: '12',
    section_id: 101,
    total_marks_obtained: 268,
    total_max_marks: 300,
    percentage: 89.3,
    grade: 'A+',
    grade_point: 9.2,
    section_rank: 2,
    grade_rank: 3,
    is_pass: true,
    subjects_passed: 3,
    subjects_failed: 0,
    created_at: '2023-08-25T10:00:00Z',
    updated_at: '2023-08-25T10:00:00Z',
    subject_results: [
      {
        subject_id: 1,
        subject_name: 'Mathematics',
        theory_marks: 92,
        practical_marks: 0,
        total_marks: 92,
        max_marks: 100,
        percentage: 92.0,
        grade: 'A+',
        is_pass: true,
      },
      {
        subject_id: 2,
        subject_name: 'Physics',
        theory_marks: 78,
        practical_marks: 19,
        total_marks: 97,
        max_marks: 100,
        percentage: 97.0,
        grade: 'A+',
        is_pass: true,
      },
      {
        subject_id: 3,
        subject_name: 'Chemistry',
        theory_marks: 68,
        practical_marks: 11,
        total_marks: 79,
        max_marks: 100,
        percentage: 79.0,
        grade: 'B+',
        is_pass: true,
      },
    ],
  },
];

/**
 * Demo gamification badges available to earn
 * Different badge types (attendance, assignment, exam, streak, goal) with various rarities
 * @type {Badge[]}
 */
export const demoBadges: Badge[] = [
  {
    id: 1,
    institution_id: 1,
    name: 'Perfect Attendance',
    description: '100% attendance for a month',
    badge_type: BadgeType.ATTENDANCE,
    rarity: BadgeRarity.RARE,
    icon_url: '🎯',
    points_required: 50,
    criteria: { attendance_percentage: 100, days: 30 },
    auto_award: true,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    name: 'Assignment Master',
    description: 'Submitted 20 assignments on time',
    badge_type: BadgeType.ASSIGNMENT,
    rarity: BadgeRarity.EPIC,
    icon_url: '📝',
    points_required: 100,
    criteria: { on_time_submissions: 20 },
    auto_award: true,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    name: 'Top Performer',
    description: 'Scored above 90% in an exam',
    badge_type: BadgeType.EXAM,
    rarity: BadgeRarity.LEGENDARY,
    icon_url: '🏆',
    points_required: 150,
    criteria: { exam_percentage: 90 },
    auto_award: true,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    name: '7-Day Streak',
    description: 'Logged in for 7 consecutive days',
    badge_type: BadgeType.STREAK,
    rarity: BadgeRarity.COMMON,
    icon_url: '🔥',
    points_required: 30,
    criteria: { streak_days: 7 },
    auto_award: true,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    name: 'Goal Achiever',
    description: 'Completed 3 academic goals',
    badge_type: BadgeType.GOAL,
    rarity: BadgeRarity.RARE,
    icon_url: '⭐',
    points_required: 80,
    criteria: { completed_goals: 3 },
    auto_award: true,
    is_active: true,
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2023-09-01T00:00:00Z',
  },
];

/**
 * Demo badges earned by student Alex Johnson
 * Shows earned badges with points awarded and metadata
 * @type {UserBadge[]}
 */
export const demoUserBadges: UserBadge[] = [
  {
    id: 1001,
    institution_id: 1,
    user_id: 1001,
    badge_id: 2,
    earned_at: '2024-01-15T10:00:00Z',
    points_awarded: 100,
    metadata: { assignments_count: 20 },
    created_at: '2024-01-15T10:00:00Z',
    badge: demoBadges[1],
  },
  {
    id: 1002,
    institution_id: 1,
    user_id: 1001,
    badge_id: 4,
    earned_at: '2024-01-10T09:00:00Z',
    points_awarded: 30,
    metadata: { streak_days: 7 },
    created_at: '2024-01-10T09:00:00Z',
    badge: demoBadges[3],
  },
  {
    id: 1003,
    institution_id: 1,
    user_id: 1001,
    badge_id: 3,
    earned_at: '2023-12-22T12:00:00Z',
    points_awarded: 150,
    metadata: { exam_id: 1, percentage: 93.0 },
    created_at: '2023-12-22T12:00:00Z',
    badge: demoBadges[2],
  },
  {
    id: 1004,
    institution_id: 1,
    user_id: 1001,
    badge_id: 5,
    earned_at: '2024-01-20T15:30:00Z',
    points_awarded: 80,
    metadata: { goals_completed: 3 },
    created_at: '2024-01-20T15:30:00Z',
    badge: demoBadges[4],
  },
];

/**
 * Demo user points and level data for student Alex Johnson
 * Tracks total points, level, experience, and login streaks
 * @type {UserPoints}
 */
export const demoUserPoints: UserPoints = {
  id: 1,
  institution_id: 1,
  user_id: 1001,
  total_points: 2450,
  level: 8,
  experience_points: 450,
  current_streak: 12,
  longest_streak: 18,
  last_activity_date: '2024-02-15T08:30:00Z',
  last_login_date: '2024-02-15T08:00:00Z',
  created_at: '2023-09-01T00:00:00Z',
  updated_at: '2024-02-15T08:30:00Z',
};

/**
 * Demo point earning history for student Alex Johnson
 * Shows how points were earned through various activities (assignments, badges, streaks)
 * @type {PointHistory[]}
 */
export const demoPointHistory: PointHistory[] = [
  {
    id: 1,
    institution_id: 1,
    user_points_id: 1,
    event_type: EventType.ASSIGNMENT_GRADE,
    points: 50,
    description: 'Received A grade on Quadratic Equations assignment',
    reference_id: 1,
    reference_type: 'assignment',
    metadata: { grade: 'A', marks: 92 },
    created_at: '2024-02-04T10:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    user_points_id: 1,
    event_type: EventType.DAILY_LOGIN,
    points: 10,
    description: 'Daily login bonus',
    reference_id: null,
    reference_type: null,
    metadata: null,
    created_at: '2024-02-15T08:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    user_points_id: 1,
    event_type: EventType.ASSIGNMENT_SUBMIT,
    points: 25,
    description: 'Submitted assignment on time',
    reference_id: 2,
    reference_type: 'assignment',
    metadata: { on_time: true },
    created_at: '2024-02-09T20:15:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    user_points_id: 1,
    event_type: EventType.BADGE_EARN,
    points: 150,
    description: 'Earned Top Performer badge',
    reference_id: 3,
    reference_type: 'badge',
    metadata: { badge_name: 'Top Performer' },
    created_at: '2023-12-22T12:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    user_points_id: 1,
    event_type: EventType.STREAK,
    points: 30,
    description: '7-day login streak achieved',
    reference_id: null,
    reference_type: null,
    metadata: { streak_days: 7 },
    created_at: '2024-01-10T09:00:00Z',
  },
];

/**
 * Demo leaderboard entries showing top students by points
 * Alex Johnson is ranked 3rd with 2,450 points
 * @type {LeaderboardEntry[]}
 */
export const demoLeaderboardEntries: LeaderboardEntry[] = [
  {
    id: 1,
    institution_id: 1,
    leaderboard_id: 1,
    user_id: 1005,
    rank: 1,
    score: 3200,
    previous_rank: 2,
    metadata: null,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    user: {
      id: 1005,
      username: 'emma.wilson',
      first_name: 'Emma',
      last_name: 'Wilson',
      email: 'emma.wilson@school.edu',
    },
  },
  {
    id: 2,
    institution_id: 1,
    leaderboard_id: 1,
    user_id: 1003,
    rank: 2,
    score: 2890,
    previous_rank: 1,
    metadata: null,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    user: {
      id: 1003,
      username: 'michael.chen',
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@school.edu',
    },
  },
  {
    id: 3,
    institution_id: 1,
    leaderboard_id: 1,
    user_id: 1001,
    rank: 3,
    score: 2450,
    previous_rank: 4,
    metadata: null,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    user: {
      id: 1001,
      username: 'alex.johnson',
      first_name: 'Alex',
      last_name: 'Johnson',
      email: DEMO_CREDENTIALS.email,
    },
  },
  {
    id: 4,
    institution_id: 1,
    leaderboard_id: 1,
    user_id: 1007,
    rank: 4,
    score: 2280,
    previous_rank: 3,
    metadata: null,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    user: {
      id: 1007,
      username: 'sophia.martinez',
      first_name: 'Sophia',
      last_name: 'Martinez',
      email: 'sophia.martinez@school.edu',
    },
  },
  {
    id: 5,
    institution_id: 1,
    leaderboard_id: 1,
    user_id: 1009,
    rank: 5,
    score: 2150,
    previous_rank: 5,
    metadata: null,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    user: {
      id: 1009,
      username: 'oliver.davis',
      first_name: 'Oliver',
      last_name: 'Davis',
      email: 'oliver.davis@school.edu',
    },
  },
];

/**
 * Demo goals for student Alex Johnson
 * SMART goals for academic performance, attendance, and skill development with progress tracking
 * @type {Goal[]}
 */
export const demoGoals: Goal[] = [
  {
    id: '1',
    title: 'Improve Mathematics Grade to A+',
    description: 'Work on advanced calculus problems and practice regularly',
    type: 'performance' as GoalType,
    status: 'in_progress' as GoalStatus,
    specific: 'Achieve 95%+ in next mathematics exam',
    measurable: 'Track scores on practice tests weekly',
    achievable: 'Dedicate 2 hours daily to math practice',
    relevant: 'Mathematics is crucial for engineering career',
    timeBound: 'Complete by end of March 2024',
    startDate: '2024-01-15',
    targetDate: '2024-03-31',
    progress: 65,
    milestones: [
      {
        id: 'm1',
        title: 'Complete Chapter 5-6',
        description: 'Finish calculus chapters with all exercises',
        targetDate: '2024-02-15',
        completedDate: '2024-02-14',
        progress: 100,
        status: 'completed',
      },
      {
        id: 'm2',
        title: 'Score 90%+ on Mock Test',
        description: 'Take practice exam and score above 90%',
        targetDate: '2024-03-01',
        progress: 75,
        status: 'in_progress',
      },
      {
        id: 'm3',
        title: 'Complete Advanced Problem Sets',
        description: 'Solve all advanced level problems',
        targetDate: '2024-03-20',
        progress: 40,
        status: 'in_progress',
      },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-15T14:30:00Z',
  },
  {
    id: '2',
    title: 'Maintain 95% Attendance',
    description: 'Stay consistent with school attendance throughout the term',
    type: 'behavioral' as GoalType,
    status: 'in_progress' as GoalStatus,
    specific: 'Attend at least 95% of all classes',
    measurable: 'Track daily attendance percentage',
    achievable: 'Plan ahead for any necessary absences',
    relevant: 'Good attendance improves overall performance',
    timeBound: 'Maintain through end of semester - June 2024',
    startDate: '2024-01-01',
    targetDate: '2024-06-30',
    progress: 80,
    milestones: [
      {
        id: 'm4',
        title: 'Zero absences in January',
        description: 'Perfect attendance for January',
        targetDate: '2024-01-31',
        completedDate: '2024-01-31',
        progress: 100,
        status: 'completed',
      },
      {
        id: 'm5',
        title: 'Maintain >90% in Q1',
        description: 'Keep attendance above 90% in first quarter',
        targetDate: '2024-03-31',
        progress: 85,
        status: 'in_progress',
      },
    ],
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
  },
  {
    id: '3',
    title: 'Master Physics Lab Techniques',
    description: 'Develop proficiency in all physics laboratory experiments',
    type: 'skill' as GoalType,
    status: 'in_progress' as GoalStatus,
    specific: 'Successfully complete all 15 physics lab experiments',
    measurable: 'Complete lab reports with A grade',
    achievable: 'Attend all lab sessions and seek teacher guidance',
    relevant: 'Lab skills essential for science stream',
    timeBound: 'Complete by April 2024',
    startDate: '2024-01-20',
    targetDate: '2024-04-30',
    progress: 53,
    milestones: [
      {
        id: 'm6',
        title: 'Complete 5 basic experiments',
        description: 'Finish introductory lab experiments',
        targetDate: '2024-02-15',
        completedDate: '2024-02-12',
        progress: 100,
        status: 'completed',
      },
      {
        id: 'm7',
        title: 'Complete 5 intermediate experiments',
        description: 'Finish intermediate difficulty labs',
        targetDate: '2024-03-20',
        progress: 60,
        status: 'in_progress',
      },
      {
        id: 'm8',
        title: 'Complete 5 advanced experiments',
        description: 'Finish advanced lab experiments',
        targetDate: '2024-04-25',
        progress: 0,
        status: 'pending',
      },
    ],
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-02-15T16:45:00Z',
  },
];

export const demoTopicProbabilities: TopicProbabilityRanking[] = [
  {
    topic_name: 'Quadratic Equations',
    chapter_name: 'Algebra',
    probability_score: 95,
    star_rating: 5,
    confidence_level: 'Very High',
    frequency_count: 18,
    last_appeared_year: 2023,
    years_since_last_appearance: 0,
    is_due: true,
    priority_tag: 'Critical',
    expected_marks: 12,
    study_hours_recommended: 8,
  },
  {
    topic_name: 'Trigonometric Identities',
    chapter_name: 'Trigonometry',
    probability_score: 88,
    star_rating: 4,
    confidence_level: 'High',
    frequency_count: 15,
    last_appeared_year: 2022,
    years_since_last_appearance: 1,
    is_due: true,
    priority_tag: 'High',
    expected_marks: 10,
    study_hours_recommended: 6,
  },
  {
    topic_name: 'Circle Theorems',
    chapter_name: 'Geometry',
    probability_score: 82,
    star_rating: 4,
    confidence_level: 'High',
    frequency_count: 14,
    last_appeared_year: 2023,
    years_since_last_appearance: 0,
    is_due: true,
    priority_tag: 'High',
    expected_marks: 8,
    study_hours_recommended: 5,
  },
  {
    topic_name: 'Probability Distributions',
    chapter_name: 'Statistics',
    probability_score: 75,
    star_rating: 4,
    confidence_level: 'Moderate',
    frequency_count: 12,
    last_appeared_year: 2021,
    years_since_last_appearance: 2,
    is_due: true,
    priority_tag: 'Medium',
    expected_marks: 6,
    study_hours_recommended: 4,
  },
  {
    topic_name: 'Differential Calculus',
    chapter_name: 'Calculus',
    probability_score: 70,
    star_rating: 3,
    confidence_level: 'Moderate',
    frequency_count: 10,
    last_appeared_year: 2022,
    years_since_last_appearance: 1,
    is_due: false,
    priority_tag: 'Medium',
    expected_marks: 8,
    study_hours_recommended: 6,
  },
];

export const demoFocusAreas: FocusAreaRecommendation[] = [
  {
    topic_name: 'Quadratic Equations - Word Problems',
    chapter_name: 'Algebra',
    priority: 'Critical',
    priority_score: 98,
    reason: 'High probability topic with recent weak performance',
    expected_impact: 'Can improve score by 10-12 marks',
    study_hours_needed: 6,
    resources: [
      'Chapter 4 Exercise 4.5-4.7',
      'Previous year papers 2020-2023',
      'Khan Academy: Quadratic Applications',
    ],
    difficulty_level: 'Medium',
  },
  {
    topic_name: 'Trigonometric Identities Proofs',
    chapter_name: 'Trigonometry',
    priority: 'High',
    priority_score: 85,
    reason: 'Frequent exam topic, needs more practice',
    expected_impact: 'Can improve score by 8-10 marks',
    study_hours_needed: 5,
    resources: [
      'Chapter 8 Exercise 8.3-8.4',
      'Identity proof practice sheets',
      'YouTube: Trigonometric Proof Techniques',
    ],
    difficulty_level: 'Hard',
  },
  {
    topic_name: 'Circle Geometry Properties',
    chapter_name: 'Geometry',
    priority: 'High',
    priority_score: 80,
    reason: 'Core concept for multiple question types',
    expected_impact: 'Can improve score by 6-8 marks',
    study_hours_needed: 4,
    resources: [
      'Chapter 10 All exercises',
      'Geometry theorem summary sheet',
      'Practice: Circle property problems',
    ],
    difficulty_level: 'Medium',
  },
];

export const demoStudyTimeAllocation: StudyTimeAllocation[] = [
  {
    category: 'High Priority Topics',
    hours: 15,
    percentage: 40,
    color: '#ef4444',
    description: 'Focus on Quadratic Equations, Trigonometry, Circle Theorems',
  },
  {
    category: 'Medium Priority Topics',
    hours: 10,
    percentage: 27,
    color: '#f59e0b',
    description: 'Probability, Calculus basics, Statistics',
  },
  {
    category: 'Revision & Practice',
    hours: 8,
    percentage: 21,
    color: '#3b82f6',
    description: 'Previous year papers and mock tests',
  },
  {
    category: 'Weak Areas',
    hours: 5,
    percentage: 12,
    color: '#8b5cf6',
    description: 'Personal weak topics identified from past performance',
  },
];

export const demoMarksDistribution: MarksDistribution[] = [
  {
    category: 'Algebra',
    marks: 30,
    percentage: 30,
    color: '#3b82f6',
  },
  {
    category: 'Trigonometry',
    marks: 20,
    percentage: 20,
    color: '#8b5cf6',
  },
  {
    category: 'Geometry',
    marks: 20,
    percentage: 20,
    color: '#10b981',
  },
  {
    category: 'Calculus',
    marks: 15,
    percentage: 15,
    color: '#f59e0b',
  },
  {
    category: 'Statistics',
    marks: 15,
    percentage: 15,
    color: '#ef4444',
  },
];

export const demoUpcomingAssignments = demoAssignments
  .filter((a) => new Date(a.due_date || '') > new Date())
  .map((assignment) => {
    const daysUntilDue = Math.ceil(
      (new Date(assignment.due_date || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const subject = demoSubjects.find((s) => s.id === assignment.subject_id);
    const submission = demoSubmissions.find((s) => s.assignment_id === assignment.id);

    return {
      id: assignment.id,
      title: assignment.title,
      subject: subject?.name || 'Unknown',
      due_date: assignment.due_date || '',
      days_until_due: daysUntilDue,
      total_marks: assignment.max_marks,
      submission_status: submission?.status || SubmissionStatus.NOT_SUBMITTED,
      is_submitted: submission?.status !== SubmissionStatus.NOT_SUBMITTED,
    };
  });

export const demoRecentGrades = demoSubmissions
  .filter((s) => s.marks_obtained !== undefined)
  .map((submission) => {
    const assignment = demoAssignments.find((a) => a.id === submission.assignment_id);
    const subject = demoSubjects.find((s) => s.id === assignment?.subject_id);

    return {
      exam_name: assignment?.title || 'Unknown',
      subject: subject?.name,
      marks_obtained: submission.marks_obtained || 0,
      max_marks: assignment?.max_marks || 100,
      percentage: ((submission.marks_obtained || 0) / (assignment?.max_marks || 100)) * 100,
      grade: submission.grade,
      trend: 'up' as const,
    };
  });

export const demoPerformanceAnalytics = {
  overall_average: 86.8,
  attendance_rate: 80.0,
  assignment_completion_rate: 80.0,
  rank_in_class: 3,
  total_students: 45,
  subjects_performance: demoExamResults[0].subject_results?.map((sr) => ({
    subject: sr.subject_name,
    average_score: sr.percentage,
    trend: sr.percentage >= 85 ? 'improving' : 'stable',
  })),
};

/**
 * Demo flashcard decks for study
 * Includes private, institution, and public decks across different subjects
 * @type {FlashcardDeck[]}
 */
export const demoFlashcardDecks: FlashcardDeck[] = [
  {
    id: 1,
    institution_id: 1,
    creator_id: 1001,
    grade_id: 10,
    subject_id: 1,
    chapter_id: 1,
    title: 'Quadratic Equations - Key Concepts',
    description: 'Master the fundamentals of quadratic equations with these flashcards',
    thumbnail_url: '📐',
    visibility: FlashcardDeckVisibility.PRIVATE,
    tags: 'math,algebra,equations',
    total_cards: 15,
    is_active: true,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-02-15T14:30:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    creator_id: 1001,
    grade_id: 10,
    subject_id: 2,
    chapter_id: 2,
    title: 'Physics Formulas - Mechanics',
    description: 'Important physics formulas for mechanics',
    thumbnail_url: '⚛️',
    visibility: FlashcardDeckVisibility.INSTITUTION,
    tags: 'physics,mechanics,formulas',
    total_cards: 20,
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-15T14:30:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    creator_id: 201,
    grade_id: 10,
    subject_id: 3,
    chapter_id: 3,
    title: 'Organic Chemistry Reactions',
    description: 'Common organic chemistry reactions and mechanisms',
    thumbnail_url: '🧪',
    visibility: FlashcardDeckVisibility.PUBLIC,
    tags: 'chemistry,organic,reactions',
    total_cards: 25,
    is_active: true,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-02-15T14:30:00Z',
  },
];

export const demoFlashcards: Flashcard[] = [
  {
    id: 1,
    deck_id: 1,
    front_content: 'What is the quadratic formula?',
    back_content: 'x = (-b ± √(b² - 4ac)) / 2a',
    hint: 'Think about solving ax² + bx + c = 0',
    tags: 'formula,quadratic',
    order_index: 1,
    is_active: true,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 2,
    deck_id: 1,
    front_content: 'What is the discriminant of a quadratic equation?',
    back_content: 'b² - 4ac (determines the nature of roots)',
    hint: 'Part of the quadratic formula under the square root',
    tags: 'discriminant,roots',
    order_index: 2,
    is_active: true,
    created_at: '2024-01-10T10:05:00Z',
    updated_at: '2024-01-10T10:05:00Z',
  },
  {
    id: 3,
    deck_id: 1,
    front_content: 'What does a positive discriminant indicate?',
    back_content: 'Two distinct real roots',
    tags: 'discriminant,roots',
    order_index: 3,
    is_active: true,
    created_at: '2024-01-10T10:10:00Z',
    updated_at: '2024-01-10T10:10:00Z',
  },
];

export const demoFlashcardDeckStats: FlashcardDeckStats = {
  total_cards: 15,
  cards_studied: 12,
  cards_mastered: 8,
  study_time_minutes: 45,
  average_accuracy: 85.5,
  cards_due_today: 5,
};

/**
 * Demo quizzes available for students
 * Includes practice, graded, and competitive quizzes across subjects
 * @type {Quiz[]}
 */
export const demoQuizzes: Quiz[] = [
  {
    id: 1,
    institution_id: 1,
    creator_id: 201,
    grade_id: 10,
    section_id: 101,
    subject_id: 1,
    chapter_id: 1,
    title: 'Quadratic Equations - Quick Quiz',
    description: 'Test your understanding of quadratic equations',
    instructions: 'Answer all questions to the best of your ability',
    quiz_type: QuizType.PRACTICE,
    status: QuizStatus.PUBLISHED,
    time_limit_minutes: 30,
    passing_percentage: 60,
    total_marks: 50,
    shuffle_questions: true,
    shuffle_options: true,
    show_correct_answers: true,
    enable_leaderboard: true,
    allow_retake: true,
    max_attempts: 3,
    available_from: '2024-02-01T00:00:00Z',
    available_until: '2024-03-31T23:59:59Z',
    is_active: true,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-02-15T14:30:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    creator_id: 202,
    grade_id: 10,
    section_id: 101,
    subject_id: 2,
    chapter_id: 2,
    title: 'Physics - Motion and Forces',
    description: "Graded quiz on Newton's laws and motion",
    instructions: 'This is a graded assessment. You have one attempt.',
    quiz_type: QuizType.GRADED,
    status: QuizStatus.PUBLISHED,
    time_limit_minutes: 45,
    passing_percentage: 70,
    total_marks: 100,
    shuffle_questions: false,
    shuffle_options: true,
    show_correct_answers: false,
    enable_leaderboard: false,
    allow_retake: false,
    max_attempts: 1,
    available_from: '2024-02-10T00:00:00Z',
    available_until: '2024-02-25T23:59:59Z',
    is_active: true,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-15T14:30:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    creator_id: 203,
    grade_id: 10,
    subject_id: 3,
    title: 'Chemistry Challenge - Reactions',
    description: 'Competitive quiz on chemical reactions',
    instructions: 'Race against your classmates!',
    quiz_type: QuizType.COMPETITIVE,
    status: QuizStatus.PUBLISHED,
    time_limit_minutes: 20,
    passing_percentage: 50,
    total_marks: 75,
    shuffle_questions: true,
    shuffle_options: true,
    show_correct_answers: true,
    enable_leaderboard: true,
    allow_retake: true,
    available_from: '2024-02-05T00:00:00Z',
    available_until: '2024-02-28T23:59:59Z',
    is_active: true,
    created_at: '2024-01-30T10:00:00Z',
    updated_at: '2024-02-15T14:30:00Z',
  },
];

export const demoQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    quiz_id: 1,
    question_type: QuestionType.MCQ,
    question_text: 'What is the quadratic formula?',
    explanation: 'The quadratic formula is used to find roots of ax² + bx + c = 0',
    marks: 5,
    order_index: 1,
    options: [
      { id: '1', text: 'x = (-b ± √(b² - 4ac)) / 2a', is_correct: true },
      { id: '2', text: 'x = (-b ± √(b² + 4ac)) / 2a', is_correct: false },
      { id: '3', text: 'x = (b ± √(b² - 4ac)) / 2a', is_correct: false },
      { id: '4', text: 'x = (-b ± √(b² - 4ac)) / a', is_correct: false },
    ],
    is_active: true,
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z',
  },
  {
    id: 2,
    quiz_id: 1,
    question_type: QuestionType.TRUE_FALSE,
    question_text: 'A quadratic equation always has two real roots.',
    explanation: 'False. The discriminant determines the nature of roots.',
    marks: 3,
    order_index: 2,
    options: [
      { id: '1', text: 'True', is_correct: false },
      { id: '2', text: 'False', is_correct: true },
    ],
    is_active: true,
    created_at: '2024-01-25T10:05:00Z',
    updated_at: '2024-01-25T10:05:00Z',
  },
];

export const demoQuizAttempts: QuizAttempt[] = [
  {
    id: 1,
    quiz_id: 1,
    user_id: 1001,
    attempt_number: 1,
    status: QuizAttemptStatus.COMPLETED,
    score: 42,
    percentage: 84,
    total_questions: 10,
    correct_answers: 8,
    incorrect_answers: 2,
    unanswered: 0,
    time_taken_seconds: 1200,
    started_at: '2024-02-14T15:00:00Z',
    completed_at: '2024-02-14T15:20:00Z',
    created_at: '2024-02-14T15:00:00Z',
    updated_at: '2024-02-14T15:20:00Z',
  },
  {
    id: 2,
    quiz_id: 3,
    user_id: 1001,
    attempt_number: 1,
    status: QuizAttemptStatus.COMPLETED,
    score: 65,
    percentage: 86.7,
    total_questions: 15,
    correct_answers: 13,
    incorrect_answers: 2,
    unanswered: 0,
    time_taken_seconds: 900,
    started_at: '2024-02-10T14:00:00Z',
    completed_at: '2024-02-10T14:15:00Z',
    created_at: '2024-02-10T14:00:00Z',
    updated_at: '2024-02-10T14:15:00Z',
  },
];

export const demoQuizLeaderboard: QuizLeaderboardEntry[] = [
  {
    id: 1,
    quiz_id: 1,
    user_id: 1005,
    user_name: 'Emma Wilson',
    best_score: 48,
    best_percentage: 96,
    best_time_seconds: 1050,
    total_attempts: 2,
    rank: 1,
    updated_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 2,
    quiz_id: 1,
    user_id: 1003,
    user_name: 'Michael Chen',
    best_score: 45,
    best_percentage: 90,
    best_time_seconds: 1150,
    total_attempts: 1,
    rank: 2,
    updated_at: '2024-02-14T18:00:00Z',
  },
  {
    id: 3,
    quiz_id: 1,
    user_id: 1001,
    user_name: 'Alex Johnson',
    best_score: 42,
    best_percentage: 84,
    best_time_seconds: 1200,
    total_attempts: 1,
    rank: 3,
    updated_at: '2024-02-14T15:20:00Z',
  },
];

export const demoPomodoroSettings: PomodoroSettings = {
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  sessions_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_work: false,
  sound_enabled: true,
  notification_enabled: true,
};

export const demoPomodoroSessions: PomodoroSession[] = [
  {
    id: 1,
    student_id: 1001,
    subject_id: 1,
    subject_name: 'Mathematics',
    session_type: 'work',
    duration_minutes: 25,
    start_time: '2024-02-15T10:00:00Z',
    end_time: '2024-02-15T10:25:00Z',
    completed: true,
    interrupted: false,
    created_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 2,
    student_id: 1001,
    subject_id: 1,
    subject_name: 'Mathematics',
    session_type: 'short_break',
    duration_minutes: 5,
    start_time: '2024-02-15T10:25:00Z',
    end_time: '2024-02-15T10:30:00Z',
    completed: true,
    interrupted: false,
    created_at: '2024-02-15T10:25:00Z',
  },
  {
    id: 3,
    student_id: 1001,
    subject_id: 2,
    subject_name: 'Physics',
    session_type: 'work',
    duration_minutes: 25,
    start_time: '2024-02-15T10:30:00Z',
    end_time: '2024-02-15T10:55:00Z',
    completed: true,
    interrupted: false,
    created_at: '2024-02-15T10:30:00Z',
  },
  {
    id: 4,
    student_id: 1001,
    subject_id: 3,
    subject_name: 'Chemistry',
    session_type: 'work',
    duration_minutes: 25,
    start_time: '2024-02-14T14:00:00Z',
    end_time: '2024-02-14T14:18:00Z',
    completed: false,
    interrupted: true,
    created_at: '2024-02-14T14:00:00Z',
  },
];

export const demoPomodoroAnalytics: PomodoroAnalytics = {
  total_focus_time_minutes: 450,
  total_sessions: 25,
  completed_sessions: 22,
  interrupted_sessions: 3,
  current_streak: 5,
  longest_streak: 12,
  subject_distribution: [
    {
      subject_id: 1,
      subject_name: 'Mathematics',
      total_minutes: 180,
      session_count: 10,
      percentage: 40,
      color: '#3b82f6',
    },
    {
      subject_id: 2,
      subject_name: 'Physics',
      total_minutes: 150,
      session_count: 8,
      percentage: 33.3,
      color: '#8b5cf6',
    },
    {
      subject_id: 3,
      subject_name: 'Chemistry',
      total_minutes: 120,
      session_count: 7,
      percentage: 26.7,
      color: '#10b981',
    },
  ],
  hourly_productivity: [
    { hour: 8, focus_minutes: 50, session_count: 2, average_focus_score: 85 },
    { hour: 9, focus_minutes: 75, session_count: 3, average_focus_score: 90 },
    { hour: 10, focus_minutes: 100, session_count: 4, average_focus_score: 88 },
    { hour: 14, focus_minutes: 75, session_count: 3, average_focus_score: 82 },
    { hour: 15, focus_minutes: 50, session_count: 2, average_focus_score: 80 },
    { hour: 16, focus_minutes: 100, session_count: 4, average_focus_score: 85 },
  ],
  daily_focus_time: [
    { date: '2024-02-10', total_minutes: 125, session_count: 5, completed_sessions: 5 },
    { date: '2024-02-11', total_minutes: 100, session_count: 4, completed_sessions: 4 },
    { date: '2024-02-12', total_minutes: 150, session_count: 6, completed_sessions: 6 },
    { date: '2024-02-13', total_minutes: 75, session_count: 3, completed_sessions: 2 },
    { date: '2024-02-14', total_minutes: 100, session_count: 4, completed_sessions: 3 },
    { date: '2024-02-15', total_minutes: 125, session_count: 5, completed_sessions: 5 },
  ],
  weekly_summary: {
    current_week_minutes: 675,
    previous_week_minutes: 550,
    change_percentage: 22.7,
    average_daily_minutes: 96.4,
    most_productive_day: 'Tuesday',
  },
};

export const demoUserProfile: UserProfile = {
  id: '1001',
  email: DEMO_CREDENTIALS.email,
  username: 'alex.johnson',
  firstName: 'Alex',
  lastName: 'Johnson',
  fullName: 'Alex Johnson',
  phone: '+1-555-1001',
  avatar: 'https://i.pravatar.cc/150?img=12',
  bio: 'High school student passionate about mathematics and science',
  role: 'student',
  institution_id: 1,
  timezone: 'America/New_York',
  language: 'en',
  isActive: true,
  emailVerified: true,
  createdAt: '2023-09-01T08:00:00Z',
  updatedAt: '2024-02-15T10:30:00Z',
};

export const demoNotificationPreferences: NotificationPreferences = {
  assignment_created: { email: true, push: true, sms: false, inApp: true },
  assignment_graded: { email: true, push: true, sms: false, inApp: true },
  exam_scheduled: { email: true, push: true, sms: true, inApp: true },
  exam_result_published: { email: true, push: true, sms: true, inApp: true },
  announcement_posted: { email: true, push: true, sms: false, inApp: true },
  message_received: { email: false, push: true, sms: false, inApp: true },
  goal_achieved: { email: true, push: true, sms: false, inApp: true },
  badge_earned: { email: false, push: true, sms: false, inApp: true },
  attendance_marked: { email: false, push: false, sms: false, inApp: true },
  fee_due: { email: true, push: true, sms: true, inApp: true },
  material_shared: { email: true, push: true, sms: false, inApp: true },
  doubt_answered: { email: true, push: true, sms: false, inApp: true },
};

export const demoThemeSettings: ThemeSettings = {
  mode: 'auto',
  primaryColor: '#3b82f6',
  fontSize: 'medium',
  compactMode: false,
};

export const demoPrivacySettings: PrivacySettings = {
  profilePublic: true,
  showInLeaderboard: true,
  showEmail: false,
  showPhone: false,
  allowMessages: true,
  showOnlineStatus: true,
};

export const demoConnectedDevices: ConnectedDevice[] = [
  {
    id: '1',
    deviceName: 'Chrome on Windows',
    deviceType: 'web',
    browser: 'Chrome 121',
    os: 'Windows 11',
    ipAddress: '192.168.1.100',
    location: 'New York, US',
    lastActive: '2024-02-15T10:30:00Z',
    isCurrent: true,
  },
  {
    id: '2',
    deviceName: 'Safari on iPhone',
    deviceType: 'mobile',
    browser: 'Safari',
    os: 'iOS 17.3',
    ipAddress: '192.168.1.101',
    location: 'New York, US',
    lastActive: '2024-02-14T18:45:00Z',
    isCurrent: false,
  },
];

export const demoUserSettings: UserSettings = {
  notifications: demoNotificationPreferences,
  theme: demoThemeSettings,
  privacy: demoPrivacySettings,
  language: 'en',
  timezone: 'America/New_York',
};

export interface ClassRosterStudent {
  id: number;
  admission_number: string;
  roll_number: string;
  name: string;
  photo_url?: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'half_day' | 'not_marked';
  attendance_percentage: number;
  recent_performance: number;
}

export interface StudentSubmissionDetail {
  id: number;
  student_id: number;
  student_name: string;
  student_photo?: string;
  admission_number: string;
  submission_id?: number;
  submitted_at?: string;
  is_late: boolean;
  status: 'submitted' | 'graded' | 'not_submitted';
  marks_obtained?: number;
  grade?: string;
  feedback?: string;
}

export interface ExamMarkEntry {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  theory_marks?: number;
  practical_marks?: number;
  total_marks?: number;
  is_absent: boolean;
  remarks?: string;
}

export interface ParentMessage {
  id: number;
  parent_id: number;
  parent_name: string;
  student_id: number;
  student_name: string;
  subject: string;
  message: string;
  sent_at: string;
  is_read: boolean;
  priority: 'high' | 'medium' | 'low';
  reply?: string;
  replied_at?: string;
}

export interface StudentPerformanceMetric {
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  photo_url?: string;
  average_score: number;
  attendance_percentage: number;
  assignments_completed: number;
  total_assignments: number;
  rank: number;
  trend: 'improving' | 'stable' | 'declining';
  weak_subjects: string[];
  strong_subjects: string[];
}

export const demoClassRoster: ClassRosterStudent[] = [
  {
    id: 1001,
    admission_number: 'STD2023001',
    roll_number: '12',
    name: 'Alex Johnson',
    photo_url: 'https://i.pravatar.cc/150?img=12',
    attendance_status: 'present',
    attendance_percentage: 92.5,
    recent_performance: 88.4,
  },
  {
    id: 1005,
    admission_number: 'STD2023005',
    roll_number: '8',
    name: 'Emma Wilson',
    photo_url: 'https://i.pravatar.cc/150?img=5',
    attendance_status: 'present',
    attendance_percentage: 96.2,
    recent_performance: 94.8,
  },
  {
    id: 1003,
    admission_number: 'STD2023003',
    roll_number: '15',
    name: 'Michael Chen',
    photo_url: 'https://i.pravatar.cc/150?img=13',
    attendance_status: 'absent',
    attendance_percentage: 88.7,
    recent_performance: 91.2,
  },
  {
    id: 1007,
    admission_number: 'STD2023007',
    roll_number: '21',
    name: 'Sophia Martinez',
    photo_url: 'https://i.pravatar.cc/150?img=9',
    attendance_status: 'late',
    attendance_percentage: 90.3,
    recent_performance: 86.5,
  },
  {
    id: 1009,
    admission_number: 'STD2023009',
    roll_number: '5',
    name: 'Oliver Davis',
    photo_url: 'https://i.pravatar.cc/150?img=11',
    attendance_status: 'present',
    attendance_percentage: 94.1,
    recent_performance: 89.7,
  },
  {
    id: 1011,
    admission_number: 'STD2023011',
    roll_number: '18',
    name: 'Isabella Garcia',
    photo_url: 'https://i.pravatar.cc/150?img=10',
    attendance_status: 'present',
    attendance_percentage: 95.8,
    recent_performance: 92.3,
  },
  {
    id: 1013,
    admission_number: 'STD2023013',
    roll_number: '3',
    name: 'Ethan Brown',
    photo_url: 'https://i.pravatar.cc/150?img=14',
    attendance_status: 'present',
    attendance_percentage: 91.4,
    recent_performance: 85.6,
  },
  {
    id: 1015,
    admission_number: 'STD2023015',
    roll_number: '27',
    name: 'Mia Taylor',
    photo_url: 'https://i.pravatar.cc/150?img=16',
    attendance_status: 'not_marked',
    attendance_percentage: 93.2,
    recent_performance: 90.1,
  },
];

export const demoStudentSubmissions: StudentSubmissionDetail[] = [
  {
    id: 1,
    student_id: 1001,
    student_name: 'Alex Johnson',
    student_photo: 'https://i.pravatar.cc/150?img=12',
    admission_number: 'STD2023001',
    submission_id: 101,
    submitted_at: '2024-02-03T18:30:00Z',
    is_late: false,
    status: 'graded',
    marks_obtained: 92,
    grade: 'A',
    feedback: 'Excellent work! Clear understanding of quadratic equations.',
  },
  {
    id: 2,
    student_id: 1005,
    student_name: 'Emma Wilson',
    student_photo: 'https://i.pravatar.cc/150?img=5',
    admission_number: 'STD2023005',
    submission_id: 201,
    submitted_at: '2024-02-14T18:30:00Z',
    is_late: false,
    status: 'submitted',
  },
  {
    id: 3,
    student_id: 1003,
    student_name: 'Michael Chen',
    student_photo: 'https://i.pravatar.cc/150?img=13',
    admission_number: 'STD2023003',
    submission_id: 202,
    submitted_at: '2024-02-14T17:15:00Z',
    is_late: false,
    status: 'submitted',
  },
  {
    id: 4,
    student_id: 1007,
    student_name: 'Sophia Martinez',
    student_photo: 'https://i.pravatar.cc/150?img=9',
    admission_number: 'STD2023007',
    submission_id: 203,
    submitted_at: '2024-02-14T16:45:00Z',
    is_late: false,
    status: 'graded',
    marks_obtained: 88,
    grade: 'A',
    feedback: 'Good effort. Pay attention to detail in problem solving.',
  },
  {
    id: 5,
    student_id: 1009,
    student_name: 'Oliver Davis',
    student_photo: 'https://i.pravatar.cc/150?img=11',
    admission_number: 'STD2023009',
    is_late: false,
    status: 'not_submitted',
  },
  {
    id: 6,
    student_id: 1011,
    student_name: 'Isabella Garcia',
    student_photo: 'https://i.pravatar.cc/150?img=10',
    admission_number: 'STD2023011',
    submission_id: 204,
    submitted_at: '2024-02-05T10:00:00Z',
    is_late: true,
    status: 'graded',
    marks_obtained: 78,
    grade: 'B+',
    feedback: 'Late submission. Good understanding but needs more practice.',
  },
  {
    id: 7,
    student_id: 1013,
    student_name: 'Ethan Brown',
    student_photo: 'https://i.pravatar.cc/150?img=14',
    admission_number: 'STD2023013',
    submission_id: 205,
    submitted_at: '2024-02-04T22:00:00Z',
    is_late: false,
    status: 'graded',
    marks_obtained: 85,
    grade: 'A',
    feedback: 'Well done! Keep up the good work.',
  },
  {
    id: 8,
    student_id: 1015,
    student_name: 'Mia Taylor',
    student_photo: 'https://i.pravatar.cc/150?img=16',
    admission_number: 'STD2023015',
    is_late: false,
    status: 'not_submitted',
  },
];

export const demoExamMarksEntries: ExamMarkEntry[] = [
  {
    id: 1,
    student_id: 1001,
    student_name: 'Alex Johnson',
    admission_number: 'STD2023001',
    roll_number: '12',
    theory_marks: 88,
    practical_marks: undefined,
    total_marks: 88,
    is_absent: false,
  },
  {
    id: 2,
    student_id: 1005,
    student_name: 'Emma Wilson',
    admission_number: 'STD2023005',
    roll_number: '8',
    theory_marks: 95,
    practical_marks: undefined,
    total_marks: 95,
    is_absent: false,
  },
  {
    id: 3,
    student_id: 1003,
    student_name: 'Michael Chen',
    admission_number: 'STD2023003',
    roll_number: '15',
    theory_marks: 90,
    practical_marks: undefined,
    total_marks: 90,
    is_absent: false,
  },
  {
    id: 4,
    student_id: 1007,
    student_name: 'Sophia Martinez',
    admission_number: 'STD2023007',
    roll_number: '21',
    is_absent: true,
    remarks: 'Medical leave',
  },
  {
    id: 5,
    student_id: 1009,
    student_name: 'Oliver Davis',
    admission_number: 'STD2023009',
    roll_number: '5',
    theory_marks: 86,
    practical_marks: undefined,
    total_marks: 86,
    is_absent: false,
  },
  {
    id: 6,
    student_id: 1011,
    student_name: 'Isabella Garcia',
    admission_number: 'STD2023011',
    roll_number: '18',
    theory_marks: 92,
    practical_marks: undefined,
    total_marks: 92,
    is_absent: false,
  },
  {
    id: 7,
    student_id: 1013,
    student_name: 'Ethan Brown',
    admission_number: 'STD2023013',
    roll_number: '3',
    theory_marks: 82,
    practical_marks: undefined,
    total_marks: 82,
    is_absent: false,
  },
  {
    id: 8,
    student_id: 1015,
    student_name: 'Mia Taylor',
    admission_number: 'STD2023015',
    roll_number: '27',
    theory_marks: undefined,
    practical_marks: undefined,
    is_absent: false,
  },
];

export const demoParentMessages: ParentMessage[] = [
  {
    id: 1,
    parent_id: 501,
    parent_name: 'Robert Johnson',
    student_id: 1001,
    student_name: 'Alex Johnson',
    subject: 'Question about upcoming exam',
    message:
      'Hello Dr. Carter, I wanted to ask about the syllabus coverage for the upcoming mid-term exam. Could you please share the topics that will be covered?',
    sent_at: '2024-02-14T10:30:00Z',
    is_read: false,
    priority: 'medium',
  },
  {
    id: 2,
    parent_id: 503,
    parent_name: 'Sarah Wilson',
    student_id: 1005,
    student_name: 'Emma Wilson',
    subject: 'Thank you for extra help',
    message:
      'Dear Dr. Carter, I wanted to thank you for the extra time you spent helping Emma with quadratic equations. She has shown great improvement!',
    sent_at: '2024-02-13T14:15:00Z',
    is_read: true,
    priority: 'low',
    reply: "You're very welcome! Emma is a dedicated student and it's a pleasure to help her.",
    replied_at: '2024-02-13T16:00:00Z',
  },
  {
    id: 3,
    parent_id: 505,
    parent_name: 'David Chen',
    student_id: 1003,
    student_name: 'Michael Chen',
    subject: 'Concern about recent grades',
    message:
      "Hello, I noticed Michael's recent assignment grades have dropped slightly. Is there anything we should be concerned about? How can we help him improve?",
    sent_at: '2024-02-12T09:45:00Z',
    is_read: true,
    priority: 'high',
    reply:
      "Thank you for reaching out. Michael is doing well overall, but I've noticed he rushes through problems. I recommend practicing more slowly and checking his work. We can schedule a meeting to discuss strategies.",
    replied_at: '2024-02-12T15:30:00Z',
  },
  {
    id: 4,
    parent_id: 507,
    parent_name: 'Maria Martinez',
    student_id: 1007,
    student_name: 'Sophia Martinez',
    subject: 'Request for makeup assignment',
    message:
      'Dr. Carter, Sophia was sick last week and missed the assignment deadline. Would it be possible for her to submit it late? We have a medical note.',
    sent_at: '2024-02-11T11:20:00Z',
    is_read: true,
    priority: 'high',
    reply:
      'Of course. Please have Sophia submit the assignment by this Friday. I hope she feels better!',
    replied_at: '2024-02-11T13:00:00Z',
  },
  {
    id: 5,
    parent_id: 509,
    parent_name: 'Jennifer Davis',
    student_id: 1009,
    student_name: 'Oliver Davis',
    subject: 'Question about homework',
    message:
      'Hi Dr. Carter, Oliver is confused about problem #15 in the latest homework. Could you provide some guidance?',
    sent_at: '2024-02-10T18:30:00Z',
    is_read: true,
    priority: 'medium',
    reply:
      "I'll post a clarification on the class portal. The key is to remember to use the quadratic formula when the equation can't be factored easily.",
    replied_at: '2024-02-10T20:00:00Z',
  },
  {
    id: 6,
    parent_id: 511,
    parent_name: 'Thomas Garcia',
    student_id: 1011,
    student_name: 'Isabella Garcia',
    subject: 'Parent-Teacher Conference',
    message:
      "Hello, I would like to schedule a parent-teacher conference to discuss Isabella's progress. When would be a good time for you?",
    sent_at: '2024-02-09T08:00:00Z',
    is_read: true,
    priority: 'medium',
    reply:
      "I'm available next Tuesday or Thursday after 3 PM. Please let me know which works best for you.",
    replied_at: '2024-02-09T10:30:00Z',
  },
  {
    id: 7,
    parent_id: 513,
    parent_name: 'Amanda Brown',
    student_id: 1013,
    student_name: 'Ethan Brown',
    subject: 'Tutoring recommendation',
    message:
      "Dear Dr. Carter, do you think Ethan needs additional tutoring? We want to ensure he's keeping up with the class.",
    sent_at: '2024-02-15T09:15:00Z',
    is_read: false,
    priority: 'medium',
  },
];

export const demoStudentPerformanceMetrics: StudentPerformanceMetric[] = [
  {
    student_id: 1005,
    student_name: 'Emma Wilson',
    admission_number: 'STD2023005',
    roll_number: '8',
    photo_url: 'https://i.pravatar.cc/150?img=5',
    average_score: 94.8,
    attendance_percentage: 96.2,
    assignments_completed: 24,
    total_assignments: 25,
    rank: 1,
    trend: 'improving',
    weak_subjects: [],
    strong_subjects: ['Mathematics', 'Physics', 'Chemistry'],
  },
  {
    student_id: 1011,
    student_name: 'Isabella Garcia',
    admission_number: 'STD2023011',
    roll_number: '18',
    photo_url: 'https://i.pravatar.cc/150?img=10',
    average_score: 92.3,
    attendance_percentage: 95.8,
    assignments_completed: 24,
    total_assignments: 25,
    rank: 2,
    trend: 'stable',
    weak_subjects: [],
    strong_subjects: ['Mathematics', 'English'],
  },
  {
    student_id: 1003,
    student_name: 'Michael Chen',
    admission_number: 'STD2023003',
    roll_number: '15',
    photo_url: 'https://i.pravatar.cc/150?img=13',
    average_score: 91.2,
    attendance_percentage: 88.7,
    assignments_completed: 22,
    total_assignments: 25,
    rank: 3,
    trend: 'declining',
    weak_subjects: ['English'],
    strong_subjects: ['Mathematics', 'Physics'],
  },
  {
    student_id: 1015,
    student_name: 'Mia Taylor',
    admission_number: 'STD2023015',
    roll_number: '27',
    photo_url: 'https://i.pravatar.cc/150?img=16',
    average_score: 90.1,
    attendance_percentage: 93.2,
    assignments_completed: 23,
    total_assignments: 25,
    rank: 4,
    trend: 'improving',
    weak_subjects: ['Chemistry'],
    strong_subjects: ['Mathematics', 'English'],
  },
  {
    student_id: 1009,
    student_name: 'Oliver Davis',
    admission_number: 'STD2023009',
    roll_number: '5',
    photo_url: 'https://i.pravatar.cc/150?img=11',
    average_score: 89.7,
    attendance_percentage: 94.1,
    assignments_completed: 23,
    total_assignments: 25,
    rank: 5,
    trend: 'stable',
    weak_subjects: ['Physics'],
    strong_subjects: ['Mathematics', 'Chemistry'],
  },
  {
    student_id: 1001,
    student_name: 'Alex Johnson',
    admission_number: 'STD2023001',
    roll_number: '12',
    photo_url: 'https://i.pravatar.cc/150?img=12',
    average_score: 88.4,
    attendance_percentage: 92.5,
    assignments_completed: 20,
    total_assignments: 25,
    rank: 6,
    trend: 'stable',
    weak_subjects: ['Chemistry'],
    strong_subjects: ['Mathematics', 'Physics'],
  },
  {
    student_id: 1007,
    student_name: 'Sophia Martinez',
    admission_number: 'STD2023007',
    roll_number: '21',
    photo_url: 'https://i.pravatar.cc/150?img=9',
    average_score: 86.5,
    attendance_percentage: 90.3,
    assignments_completed: 21,
    total_assignments: 25,
    rank: 7,
    trend: 'improving',
    weak_subjects: ['Mathematics'],
    strong_subjects: ['English', 'History'],
  },
  {
    student_id: 1013,
    student_name: 'Ethan Brown',
    admission_number: 'STD2023013',
    roll_number: '3',
    photo_url: 'https://i.pravatar.cc/150?img=14',
    average_score: 85.6,
    attendance_percentage: 91.4,
    assignments_completed: 22,
    total_assignments: 25,
    rank: 8,
    trend: 'stable',
    weak_subjects: ['Physics', 'Chemistry'],
    strong_subjects: ['English'],
  },
];

export const demoCommunicationData = {
  announcements: [
    {
      id: 1,
      institution_id: 1,
      created_by: 3001,
      title: 'Mid-Term Examinations Schedule Released',
      content:
        'Dear Students and Parents, The mid-term examination schedule for all grades has been released. Please check the academic calendar section for detailed timings. All exams will commence from March 15th, 2024.',
      audience_type: 'all' as const,
      priority: 'high' as const,
      channels: ['in_app', 'email', 'sms'] as const,
      is_published: true,
      published_at: '2024-02-14T09:00:00Z',
      created_at: '2024-02-14T08:30:00Z',
      updated_at: '2024-02-14T09:00:00Z',
    },
    {
      id: 2,
      institution_id: 1,
      created_by: 3001,
      title: 'School Sports Day - February 25th',
      content:
        'We are excited to announce our annual Sports Day on February 25th. All students are encouraged to participate. Registration forms are available in the sports office.',
      audience_type: 'all' as const,
      priority: 'medium' as const,
      channels: ['in_app', 'email'] as const,
      is_published: true,
      published_at: '2024-02-10T10:00:00Z',
      created_at: '2024-02-10T09:30:00Z',
      updated_at: '2024-02-10T10:00:00Z',
    },
    {
      id: 3,
      institution_id: 1,
      created_by: 201,
      title: 'Mathematics Remedial Classes',
      content:
        '10th grade students who need additional support in Mathematics can attend remedial classes every Saturday at 9 AM in Room 201.',
      audience_type: 'grade' as const,
      audience_filter: { grade_ids: [10] },
      priority: 'medium' as const,
      channels: ['in_app', 'email'] as const,
      is_published: true,
      published_at: '2024-02-12T14:00:00Z',
      created_at: '2024-02-12T13:30:00Z',
      updated_at: '2024-02-12T14:00:00Z',
    },
    {
      id: 4,
      institution_id: 1,
      created_by: 3001,
      title: 'Library Extended Hours During Exams',
      content:
        'The school library will have extended hours from 7 AM to 8 PM during the examination period (March 15-30) to facilitate student preparation.',
      audience_type: 'all' as const,
      priority: 'low' as const,
      channels: ['in_app'] as const,
      is_published: true,
      published_at: '2024-02-13T11:00:00Z',
      created_at: '2024-02-13T10:30:00Z',
      updated_at: '2024-02-13T11:00:00Z',
    },
    {
      id: 5,
      institution_id: 1,
      created_by: 3001,
      title: 'Parent-Teacher Meeting - March 5th',
      content:
        'We invite all parents for a parent-teacher meeting on March 5th from 2 PM to 6 PM. Please schedule your appointments with respective class teachers.',
      audience_type: 'all' as const,
      priority: 'high' as const,
      channels: ['in_app', 'email', 'sms'] as const,
      is_published: true,
      published_at: '2024-02-08T09:00:00Z',
      created_at: '2024-02-08T08:30:00Z',
      updated_at: '2024-02-08T09:00:00Z',
    },
  ],
  messages: [
    {
      id: 1,
      institution_id: 1,
      sender_id: 201,
      recipient_id: 1001,
      subject: 'Great Progress in Mathematics',
      content:
        'Hi Alex, I wanted to commend you on your recent performance in quadratic equations. Your understanding has improved significantly. Keep up the excellent work!',
      is_read: false,
      is_deleted_by_sender: false,
      is_deleted_by_recipient: false,
      created_at: '2024-02-15T10:30:00Z',
      updated_at: '2024-02-15T10:30:00Z',
      sender: {
        id: 201,
        first_name: 'Dr. Emily',
        last_name: 'Carter',
        email: 'emily.carter@school.edu',
      },
    },
    {
      id: 2,
      institution_id: 1,
      sender_id: 1001,
      recipient_id: 201,
      subject: 'Question about Assignment 4',
      content:
        'Dear Dr. Carter, I have a question about problem #15 in Assignment 4. Could you provide some guidance on the approach?',
      is_read: true,
      read_at: '2024-02-14T16:00:00Z',
      is_deleted_by_sender: false,
      is_deleted_by_recipient: false,
      created_at: '2024-02-14T15:30:00Z',
      updated_at: '2024-02-14T16:00:00Z',
      recipient: {
        id: 201,
        first_name: 'Dr. Emily',
        last_name: 'Carter',
        email: 'emily.carter@school.edu',
      },
    },
    {
      id: 3,
      institution_id: 1,
      sender_id: 202,
      recipient_id: 1001,
      subject: 'Physics Lab Report Feedback',
      content:
        'Alex, your physics lab report was well-structured. However, please include more detailed observations in the results section for future reports.',
      is_read: true,
      read_at: '2024-02-12T14:00:00Z',
      is_deleted_by_sender: false,
      is_deleted_by_recipient: false,
      created_at: '2024-02-12T11:00:00Z',
      updated_at: '2024-02-12T14:00:00Z',
      sender: {
        id: 202,
        first_name: 'Prof. James',
        last_name: 'Wilson',
        email: 'james.wilson@school.edu',
      },
    },
    {
      id: 4,
      institution_id: 1,
      sender_id: 3001,
      recipient_id: 1001,
      subject: 'Library Book Overdue Reminder',
      content:
        'This is a reminder that the book "Advanced Calculus" is overdue. Please return it to the library at your earliest convenience to avoid late fees.',
      is_read: false,
      is_deleted_by_sender: false,
      is_deleted_by_recipient: false,
      created_at: '2024-02-11T09:00:00Z',
      updated_at: '2024-02-11T09:00:00Z',
      sender: {
        id: 3001,
        first_name: 'Michael',
        last_name: 'Anderson',
        email: 'admin@school.edu',
      },
    },
  ],
  conversations: [
    {
      other_user: {
        id: 201,
        first_name: 'Dr. Emily',
        last_name: 'Carter',
        email: 'emily.carter@school.edu',
      },
      last_message: {
        id: 1,
        institution_id: 1,
        sender_id: 201,
        recipient_id: 1001,
        subject: 'Great Progress in Mathematics',
        content: 'Hi Alex, I wanted to commend you on your recent performance...',
        is_read: false,
        is_deleted_by_sender: false,
        is_deleted_by_recipient: false,
        created_at: '2024-02-15T10:30:00Z',
        updated_at: '2024-02-15T10:30:00Z',
      },
      unread_count: 1,
    },
    {
      other_user: {
        id: 202,
        first_name: 'Prof. James',
        last_name: 'Wilson',
        email: 'james.wilson@school.edu',
      },
      last_message: {
        id: 3,
        institution_id: 1,
        sender_id: 202,
        recipient_id: 1001,
        subject: 'Physics Lab Report Feedback',
        content: 'Alex, your physics lab report was well-structured...',
        is_read: true,
        read_at: '2024-02-12T14:00:00Z',
        is_deleted_by_sender: false,
        is_deleted_by_recipient: false,
        created_at: '2024-02-12T11:00:00Z',
        updated_at: '2024-02-12T14:00:00Z',
      },
      unread_count: 0,
    },
  ],
  notifications: [
    {
      id: 1,
      institution_id: 1,
      user_id: 1001,
      title: 'Assignment Graded',
      message: 'Your assignment "Quadratic Equations Problem Set" has been graded. Score: 92/100',
      notification_type: 'grade' as const,
      priority: 'medium' as const,
      channel: 'in_app' as const,
      status: 'sent' as const,
      sent_at: '2024-02-04T10:00:00Z',
      created_at: '2024-02-04T10:00:00Z',
      updated_at: '2024-02-04T10:00:00Z',
    },
    {
      id: 2,
      institution_id: 1,
      user_id: 1001,
      title: 'New Assignment Posted',
      message: 'Dr. Emily Carter posted a new assignment: "World War II Timeline Project"',
      notification_type: 'assignment' as const,
      priority: 'high' as const,
      channel: 'in_app' as const,
      status: 'sent' as const,
      read_at: '2024-02-01T09:00:00Z',
      sent_at: '2024-02-01T08:00:00Z',
      created_at: '2024-02-01T08:00:00Z',
      updated_at: '2024-02-01T09:00:00Z',
    },
    {
      id: 3,
      institution_id: 1,
      user_id: 1001,
      title: 'Attendance Marked - Present',
      message: 'Your attendance has been marked as Present for today',
      notification_type: 'attendance' as const,
      priority: 'low' as const,
      channel: 'in_app' as const,
      status: 'sent' as const,
      read_at: '2024-02-15T09:00:00Z',
      sent_at: '2024-02-15T08:30:00Z',
      created_at: '2024-02-15T08:30:00Z',
      updated_at: '2024-02-15T09:00:00Z',
    },
    {
      id: 4,
      institution_id: 1,
      user_id: 1001,
      title: 'Badge Earned',
      message: 'Congratulations! You earned the "Assignment Master" badge',
      notification_type: 'system' as const,
      priority: 'low' as const,
      channel: 'in_app' as const,
      status: 'sent' as const,
      sent_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 5,
      institution_id: 1,
      user_id: 1001,
      title: 'New Message',
      message: 'You have a new message from Dr. Emily Carter',
      notification_type: 'message' as const,
      priority: 'medium' as const,
      channel: 'in_app' as const,
      status: 'sent' as const,
      sent_at: '2024-02-15T10:30:00Z',
      created_at: '2024-02-15T10:30:00Z',
      updated_at: '2024-02-15T10:30:00Z',
    },
  ],
};

export const demoSearchData = {
  students: [
    {
      id: 1001,
      first_name: 'Liam',
      last_name: 'Anderson',
      admission_number: 'STU2023001',
      email: 'liam.anderson@school.edu',
      grade: '10th Grade',
      section: 'A',
    },
  ],
  teachers: demoTeachers,
  assignments: demoAssignments,
  announcements: demoCommunicationData.announcements,
};

export const demoStudyMaterialsData = {
  previousYearPapers: [
    {
      id: 1,
      institution_id: 1,
      title: 'CBSE 10th Grade Mathematics - 2023',
      description: 'Complete question paper with solutions',
      board: 'cbse' as const,
      year: 2023,
      exam_month: 'March',
      grade_id: 10,
      subject_id: 1,
      total_marks: 80,
      duration_minutes: 180,
      pdf_file_name: 'cbse_math_10_2023.pdf',
      pdf_file_size: 2500000,
      pdf_file_url: 'https://example.com/papers/cbse_math_10_2023.pdf',
      ocr_processed: true,
      ocr_processed_at: '2024-01-15T10:00:00Z',
      tags: 'cbse,mathematics,10th,2023',
      view_count: 1250,
      download_count: 430,
      is_active: true,
      uploaded_by: 201,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 2,
      institution_id: 1,
      title: 'CBSE 10th Grade Physics - 2023',
      description: 'Physics board exam paper 2023 with marking scheme',
      board: 'cbse' as const,
      year: 2023,
      exam_month: 'March',
      grade_id: 10,
      subject_id: 2,
      total_marks: 70,
      duration_minutes: 180,
      pdf_file_name: 'cbse_physics_10_2023.pdf',
      pdf_file_size: 2800000,
      pdf_file_url: 'https://example.com/papers/cbse_physics_10_2023.pdf',
      ocr_processed: true,
      ocr_processed_at: '2024-01-16T10:00:00Z',
      tags: 'cbse,physics,10th,2023',
      view_count: 980,
      download_count: 325,
      is_active: true,
      uploaded_by: 202,
      created_at: '2024-01-11T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 3,
      institution_id: 1,
      title: 'CBSE 10th Grade Chemistry - 2022',
      description: 'Complete chemistry board exam paper with solutions',
      board: 'cbse' as const,
      year: 2022,
      exam_month: 'March',
      grade_id: 10,
      subject_id: 3,
      total_marks: 70,
      duration_minutes: 180,
      pdf_file_name: 'cbse_chemistry_10_2022.pdf',
      pdf_file_size: 3100000,
      pdf_file_url: 'https://example.com/papers/cbse_chemistry_10_2022.pdf',
      ocr_processed: true,
      ocr_processed_at: '2024-01-17T10:00:00Z',
      tags: 'cbse,chemistry,10th,2022',
      view_count: 875,
      download_count: 290,
      is_active: true,
      uploaded_by: 203,
      created_at: '2024-01-12T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 4,
      institution_id: 1,
      title: 'CBSE 10th Grade English - 2023',
      description: 'English language and literature board exam 2023',
      board: 'cbse' as const,
      year: 2023,
      exam_month: 'March',
      grade_id: 10,
      subject_id: 4,
      total_marks: 80,
      duration_minutes: 180,
      pdf_file_name: 'cbse_english_10_2023.pdf',
      pdf_file_size: 2200000,
      pdf_file_url: 'https://example.com/papers/cbse_english_10_2023.pdf',
      ocr_processed: true,
      ocr_processed_at: '2024-01-18T10:00:00Z',
      tags: 'cbse,english,10th,2023',
      view_count: 1450,
      download_count: 520,
      is_active: true,
      uploaded_by: 204,
      created_at: '2024-01-13T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 5,
      institution_id: 1,
      title: 'CBSE 10th Grade Social Studies - 2023',
      description: 'Social studies board exam with map work',
      board: 'cbse' as const,
      year: 2023,
      exam_month: 'March',
      grade_id: 10,
      subject_id: 5,
      total_marks: 80,
      duration_minutes: 180,
      pdf_file_name: 'cbse_social_10_2023.pdf',
      pdf_file_size: 3500000,
      pdf_file_url: 'https://example.com/papers/cbse_social_10_2023.pdf',
      ocr_processed: true,
      ocr_processed_at: '2024-01-19T10:00:00Z',
      tags: 'cbse,social studies,10th,2023',
      view_count: 1120,
      download_count: 385,
      is_active: true,
      uploaded_by: 205,
      created_at: '2024-01-14T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
  ],
  bookCategories: [
    {
      id: 1,
      institution_id: 1,
      name: 'Fiction',
      description: 'Novels, short stories, and other fictional works',
      code: 'FIC',
      is_active: true,
      created_at: '2023-09-01T09:00:00Z',
      updated_at: '2023-09-01T09:00:00Z',
    },
    {
      id: 2,
      institution_id: 1,
      name: 'Science & Technology',
      description: 'Science textbooks, technology guides, and research materials',
      code: 'SCI',
      is_active: true,
      created_at: '2023-09-01T09:00:00Z',
      updated_at: '2023-09-01T09:00:00Z',
    },
    {
      id: 3,
      institution_id: 1,
      name: 'Mathematics',
      description: 'Math textbooks, problem sets, and reference books',
      code: 'MAT',
      is_active: true,
      created_at: '2023-09-01T09:00:00Z',
      updated_at: '2023-09-01T09:00:00Z',
    },
    {
      id: 4,
      institution_id: 1,
      name: 'History & Geography',
      description: 'Historical texts, geography books, and atlases',
      code: 'HIS',
      is_active: true,
      created_at: '2023-09-01T09:00:00Z',
      updated_at: '2023-09-01T09:00:00Z',
    },
    {
      id: 5,
      institution_id: 1,
      name: 'Reference',
      description: 'Encyclopedias, dictionaries, and other reference materials',
      code: 'REF',
      is_active: true,
      created_at: '2023-09-01T09:00:00Z',
      updated_at: '2023-09-01T09:00:00Z',
    },
  ],
  libraryBooks: [
    {
      id: 1,
      institution_id: 1,
      category_id: 3,
      title: 'Advanced Calculus',
      author: 'James Stewart',
      isbn: '978-1285741550',
      publisher: 'Cengage Learning',
      publication_year: 2015,
      edition: '8th Edition',
      accession_number: 'MAT-2023-001',
      call_number: '515.STE',
      total_copies: 5,
      available_copies: 3,
      description: 'Comprehensive calculus textbook for advanced students',
      language: 'English',
      pages: 1368,
      price: 250,
      location: 'Main Library',
      rack_number: 'A-12',
      status: 'available',
      cover_image_url: 'https://images.example.com/books/calculus.jpg',
      is_reference_only: false,
      is_active: true,
      created_at: '2023-09-05T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 2,
      institution_id: 1,
      category_id: 2,
      title: 'Concepts of Physics',
      author: 'H.C. Verma',
      isbn: '978-8177092325',
      publisher: 'Bharti Bhawan',
      publication_year: 2018,
      edition: 'Revised Edition',
      accession_number: 'SCI-2023-015',
      call_number: '530.VER',
      total_copies: 10,
      available_copies: 7,
      description: 'Comprehensive physics textbook for high school students',
      language: 'English',
      pages: 462,
      price: 180,
      location: 'Main Library',
      rack_number: 'B-05',
      status: 'available',
      is_reference_only: false,
      is_active: true,
      created_at: '2023-09-06T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 3,
      institution_id: 1,
      category_id: 1,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0061120084',
      publisher: 'HarperCollins',
      publication_year: 2006,
      edition: 'Reprint',
      accession_number: 'FIC-2023-045',
      call_number: '813.LEE',
      total_copies: 8,
      available_copies: 5,
      description: 'Classic American novel about racial injustice',
      language: 'English',
      pages: 324,
      price: 120,
      location: 'Main Library',
      rack_number: 'C-18',
      status: 'available',
      is_reference_only: false,
      is_active: true,
      created_at: '2023-09-07T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 4,
      institution_id: 1,
      category_id: 5,
      title: 'Oxford English Dictionary',
      author: 'Oxford University Press',
      isbn: '978-0199571123',
      publisher: 'Oxford University Press',
      publication_year: 2010,
      edition: '2nd Edition',
      accession_number: 'REF-2023-001',
      call_number: '423.OXF',
      total_copies: 2,
      available_copies: 2,
      description: 'Comprehensive English language dictionary',
      language: 'English',
      pages: 21728,
      price: 500,
      location: 'Reference Section',
      rack_number: 'REF-01',
      status: 'available',
      is_reference_only: true,
      is_active: true,
      created_at: '2023-09-01T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
    {
      id: 5,
      institution_id: 1,
      category_id: 2,
      title: 'Organic Chemistry',
      author: 'Morrison and Boyd',
      isbn: '978-0136436690',
      publisher: 'Prentice Hall',
      publication_year: 1992,
      edition: '6th Edition',
      accession_number: 'SCI-2023-032',
      call_number: '547.MOR',
      total_copies: 6,
      available_copies: 4,
      description: 'Comprehensive organic chemistry textbook',
      language: 'English',
      pages: 1283,
      price: 280,
      location: 'Main Library',
      rack_number: 'B-08',
      status: 'available',
      is_reference_only: false,
      is_active: true,
      created_at: '2023-09-08T09:00:00Z',
      updated_at: '2024-02-15T14:30:00Z',
    },
  ],
  myIssuedBooks: [
    {
      id: 1,
      institution_id: 1,
      book_id: 1,
      student_id: 1001,
      issue_date: '2024-01-25',
      due_date: '2024-02-15',
      status: 'issued',
      fine_amount: 0,
      fine_paid: false,
      issued_by: 3001,
      created_at: '2024-01-25T10:00:00Z',
      updated_at: '2024-01-25T10:00:00Z',
      book_title: 'Advanced Calculus',
      book_author: 'James Stewart',
      days_overdue: 0,
    },
    {
      id: 2,
      institution_id: 1,
      book_id: 2,
      student_id: 1001,
      issue_date: '2024-02-05',
      due_date: '2024-02-26',
      status: 'issued',
      fine_amount: 0,
      fine_paid: false,
      issued_by: 3001,
      created_at: '2024-02-05T10:00:00Z',
      updated_at: '2024-02-05T10:00:00Z',
      book_title: 'Concepts of Physics',
      book_author: 'H.C. Verma',
      days_overdue: 0,
    },
  ],
};

export const parentAttendanceMonitorData = {
  child1: {
    child_id: 1101,
    child_name: 'Emma Williams',
    current_month_attendance: [
      { date: '2024-02-01', status: 'present' },
      { date: '2024-02-02', status: 'present' },
      { date: '2024-02-05', status: 'present' },
      { date: '2024-02-06', status: 'late' },
      { date: '2024-02-07', status: 'present' },
      { date: '2024-02-08', status: 'present' },
      { date: '2024-02-09', status: 'present' },
      { date: '2024-02-12', status: 'present' },
      { date: '2024-02-13', status: 'present' },
      { date: '2024-02-14', status: 'present' },
      { date: '2024-02-15', status: 'present' },
    ],
    attendance_history_by_month: [
      { month: 'Sep 2023', present: 20, absent: 1, late: 1, total: 22, percentage: 90.9 },
      { month: 'Oct 2023', present: 22, absent: 0, late: 1, total: 23, percentage: 95.7 },
      { month: 'Nov 2023', present: 21, absent: 1, late: 0, total: 22, percentage: 95.5 },
      { month: 'Dec 2023', present: 15, absent: 0, late: 1, total: 16, percentage: 93.8 },
      { month: 'Jan 2024', present: 21, absent: 1, late: 1, total: 23, percentage: 91.3 },
      { month: 'Feb 2024', present: 11, absent: 0, late: 1, total: 12, percentage: 91.7 },
    ],
    subject_wise_attendance: [
      { subject: 'Mathematics', present: 145, total: 155, percentage: 93.5 },
      { subject: 'Science', present: 148, total: 155, percentage: 95.5 },
      { subject: 'English', present: 150, total: 155, percentage: 96.8 },
      { subject: 'Social Studies', present: 142, total: 155, percentage: 91.6 },
      { subject: 'Physical Education', present: 144, total: 155, percentage: 92.9 },
    ],
  },
  child2: {
    child_id: 1102,
    child_name: 'Noah Williams',
    current_month_attendance: [
      { date: '2024-02-01', status: 'absent' },
      { date: '2024-02-02', status: 'present' },
      { date: '2024-02-05', status: 'late' },
      { date: '2024-02-06', status: 'absent' },
      { date: '2024-02-07', status: 'present' },
      { date: '2024-02-08', status: 'late' },
      { date: '2024-02-09', status: 'absent' },
      { date: '2024-02-12', status: 'present' },
      { date: '2024-02-13', status: 'present' },
      { date: '2024-02-14', status: 'late' },
      { date: '2024-02-15', status: 'absent' },
    ],
    attendance_history_by_month: [
      { month: 'Sep 2023', present: 16, absent: 4, late: 2, total: 22, percentage: 72.7 },
      { month: 'Oct 2023', present: 17, absent: 4, late: 2, total: 23, percentage: 73.9 },
      { month: 'Nov 2023', present: 16, absent: 5, late: 1, total: 22, percentage: 72.7 },
      { month: 'Dec 2023', present: 13, absent: 2, late: 1, total: 16, percentage: 81.3 },
      { month: 'Jan 2024', present: 18, absent: 3, late: 2, total: 23, percentage: 78.3 },
      { month: 'Feb 2024', present: 7, absent: 4, late: 1, total: 12, percentage: 58.3 },
    ],
    subject_wise_attendance: [
      { subject: 'Mathematics', present: 118, total: 155, percentage: 76.1 },
      { subject: 'Science', present: 120, total: 155, percentage: 77.4 },
      { subject: 'English', present: 122, total: 155, percentage: 78.7 },
      { subject: 'Social Studies', present: 115, total: 155, percentage: 74.2 },
      { subject: 'Physical Education', present: 125, total: 155, percentage: 80.6 },
    ],
  },
};

export const parentGradesMonitorData = {
  child1: {
    child_id: 1101,
    child_name: 'Emma Williams',
    recent_grades: [
      {
        subject_name: 'Mathematics',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 92,
        total_marks: 100,
        percentage: 92.0,
        grade: 'A+',
        exam_date: '2024-02-10T00:00:00Z',
        rank: 3,
      },
      {
        subject_name: 'Science',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 88,
        total_marks: 100,
        percentage: 88.0,
        grade: 'A',
        exam_date: '2024-02-08T00:00:00Z',
        rank: 7,
      },
      {
        subject_name: 'English',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 85,
        total_marks: 100,
        percentage: 85.0,
        grade: 'A',
        exam_date: '2024-02-07T00:00:00Z',
        rank: 5,
      },
      {
        subject_name: 'Social Studies',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 90,
        total_marks: 100,
        percentage: 90.0,
        grade: 'A+',
        exam_date: '2024-02-05T00:00:00Z',
        rank: 4,
      },
      {
        subject_name: 'Mathematics',
        exam_name: 'Mid-Term Exam',
        exam_type: 'Mid-Term',
        marks_obtained: 85,
        total_marks: 100,
        percentage: 85.0,
        grade: 'A',
        exam_date: '2024-01-20T00:00:00Z',
        rank: 6,
      },
    ],
    grade_trends: [
      { month: 'Sep 2023', average_percentage: 82.5 },
      { month: 'Oct 2023', average_percentage: 84.2 },
      { month: 'Nov 2023', average_percentage: 85.8 },
      { month: 'Dec 2023', average_percentage: 86.5 },
      { month: 'Jan 2024', average_percentage: 87.2 },
      { month: 'Feb 2024', average_percentage: 88.8 },
    ],
    subject_performance: [
      {
        subject: 'Mathematics',
        current_average: 88.5,
        previous_average: 85.0,
        trend: 'improving',
        highest_score: 92,
        lowest_score: 78,
      },
      {
        subject: 'Science',
        current_average: 87.3,
        previous_average: 86.5,
        trend: 'stable',
        highest_score: 90,
        lowest_score: 82,
      },
      {
        subject: 'English',
        current_average: 86.0,
        previous_average: 88.0,
        trend: 'declining',
        highest_score: 90,
        lowest_score: 80,
      },
      {
        subject: 'Social Studies',
        current_average: 89.5,
        previous_average: 87.0,
        trend: 'improving',
        highest_score: 94,
        lowest_score: 84,
      },
    ],
  },
  child2: {
    child_id: 1102,
    child_name: 'Noah Williams',
    recent_grades: [
      {
        subject_name: 'Mathematics',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 68,
        total_marks: 100,
        percentage: 68.0,
        grade: 'C+',
        exam_date: '2024-02-10T00:00:00Z',
        rank: 32,
      },
      {
        subject_name: 'Science',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 72,
        total_marks: 100,
        percentage: 72.0,
        grade: 'B',
        exam_date: '2024-02-08T00:00:00Z',
        rank: 28,
      },
      {
        subject_name: 'English',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 75,
        total_marks: 100,
        percentage: 75.0,
        grade: 'B',
        exam_date: '2024-02-07T00:00:00Z',
        rank: 25,
      },
      {
        subject_name: 'Social Studies',
        exam_name: 'Unit Test 3',
        exam_type: 'Unit Test',
        marks_obtained: 74,
        total_marks: 100,
        percentage: 74.0,
        grade: 'B',
        exam_date: '2024-02-05T00:00:00Z',
        rank: 26,
      },
      {
        subject_name: 'Mathematics',
        exam_name: 'Mid-Term Exam',
        exam_type: 'Mid-Term',
        marks_obtained: 65,
        total_marks: 100,
        percentage: 65.0,
        grade: 'C',
        exam_date: '2024-01-20T00:00:00Z',
        rank: 35,
      },
    ],
    grade_trends: [
      { month: 'Sep 2023', average_percentage: 75.5 },
      { month: 'Oct 2023', average_percentage: 74.2 },
      { month: 'Nov 2023', average_percentage: 73.8 },
      { month: 'Dec 2023', average_percentage: 72.5 },
      { month: 'Jan 2024', average_percentage: 71.2 },
      { month: 'Feb 2024', average_percentage: 72.3 },
    ],
    subject_performance: [
      {
        subject: 'Mathematics',
        current_average: 67.5,
        previous_average: 70.0,
        trend: 'declining',
        highest_score: 75,
        lowest_score: 58,
      },
      {
        subject: 'Science',
        current_average: 71.3,
        previous_average: 72.5,
        trend: 'declining',
        highest_score: 78,
        lowest_score: 62,
      },
      {
        subject: 'English',
        current_average: 74.0,
        previous_average: 73.0,
        trend: 'stable',
        highest_score: 80,
        lowest_score: 68,
      },
      {
        subject: 'Social Studies',
        current_average: 73.5,
        previous_average: 75.0,
        trend: 'declining',
        highest_score: 82,
        lowest_score: 65,
      },
    ],
  },
};

export const parentCommunicationData = {
  teacher_messages: [
    {
      id: 1,
      teacher_name: 'Dr. Smith',
      teacher_photo: 'https://i.pravatar.cc/150?img=33',
      subject: 'Mathematics',
      child_name: 'Emma Williams',
      content: 'Emma is doing excellent work in algebra. Keep it up!',
      created_at: '2024-02-14T10:30:00Z',
      is_read: false,
      priority: 'low',
    },
    {
      id: 2,
      teacher_name: 'Ms. Johnson',
      teacher_photo: 'https://i.pravatar.cc/150?img=45',
      subject: 'Science',
      child_name: 'Emma Williams',
      content: 'Please remind Emma to submit her project by Friday.',
      created_at: '2024-02-13T14:15:00Z',
      is_read: true,
      priority: 'medium',
    },
    {
      id: 3,
      teacher_name: 'Mr. Anderson',
      teacher_photo: 'https://i.pravatar.cc/150?img=52',
      subject: 'Mathematics',
      child_name: 'Noah Williams',
      content:
        "I'm concerned about Noah's recent performance. He seems distracted in class. Can we schedule a meeting?",
      created_at: '2024-02-12T09:45:00Z',
      is_read: false,
      priority: 'high',
    },
    {
      id: 4,
      teacher_name: 'Mrs. Davis',
      teacher_photo: 'https://i.pravatar.cc/150?img=47',
      subject: 'English',
      child_name: 'Noah Williams',
      content: 'Noah has missed several homework submissions. Please ensure he completes them.',
      created_at: '2024-02-11T11:20:00Z',
      is_read: true,
      priority: 'high',
    },
    {
      id: 5,
      teacher_name: 'Ms. Parker',
      teacher_photo: 'https://i.pravatar.cc/150?img=48',
      subject: 'Science',
      child_name: 'Emma Williams',
      content: "Great job on Emma's recent presentation. She showed excellent research skills!",
      created_at: '2024-02-10T16:00:00Z',
      is_read: true,
      priority: 'low',
    },
  ],
  announcements: [
    {
      id: 1,
      title: 'Parent-Teacher Conference Scheduled',
      content:
        'The quarterly parent-teacher conference is scheduled for March 15th, 2024. Please confirm your attendance.',
      type: 'event',
      priority: 'high',
      created_at: '2024-02-14T08:00:00Z',
      is_read: false,
      applies_to: 'all',
    },
    {
      id: 2,
      title: 'Mid-Term Exam Schedule Released',
      content:
        'The mid-term examination schedule has been released. Please check the student portal for details.',
      type: 'academic',
      priority: 'high',
      created_at: '2024-02-12T10:00:00Z',
      is_read: true,
      applies_to: 'all',
    },
    {
      id: 3,
      title: 'Science Fair Registration Open',
      content:
        'Registration for the annual science fair is now open. Deadline for registration is February 25th.',
      type: 'event',
      priority: 'medium',
      created_at: '2024-02-10T09:00:00Z',
      is_read: true,
      applies_to: 'grade_8',
    },
    {
      id: 4,
      title: 'School Holiday Notice',
      content: 'School will be closed on February 20th for a staff development day.',
      type: 'holiday',
      priority: 'medium',
      created_at: '2024-02-08T14:00:00Z',
      is_read: true,
      applies_to: 'all',
    },
    {
      id: 5,
      title: 'After-School Tutoring Program',
      content:
        'Free after-school tutoring is available for Mathematics and Science. Sessions are Monday-Thursday, 3:30-5:00 PM.',
      type: 'academic',
      priority: 'low',
      created_at: '2024-02-05T11:00:00Z',
      is_read: true,
      applies_to: 'all',
    },
  ],
  sent_messages: [
    {
      id: 101,
      to_teacher: 'Dr. Smith',
      subject: 'Mathematics',
      child_name: 'Emma Williams',
      content: 'Thank you for your encouragement. Emma really enjoys your class!',
      sent_at: '2024-02-14T15:00:00Z',
      is_replied: true,
      teacher_reply: "You're welcome! Emma is a dedicated student and a pleasure to teach.",
      replied_at: '2024-02-14T16:30:00Z',
    },
    {
      id: 102,
      to_teacher: 'Mr. Anderson',
      subject: 'Mathematics',
      child_name: 'Noah Williams',
      content:
        "I'd like to schedule a meeting to discuss Noah's performance. When would be a good time?",
      sent_at: '2024-02-12T18:00:00Z',
      is_replied: true,
      teacher_reply:
        'I am available Tuesday and Thursday after 3 PM. Please let me know which works for you.',
      replied_at: '2024-02-13T09:00:00Z',
    },
    {
      id: 103,
      to_teacher: 'Ms. Johnson',
      subject: 'Science',
      child_name: 'Emma Williams',
      content: 'Emma will submit the project by Friday. Thank you for the reminder.',
      sent_at: '2024-02-13T16:00:00Z',
      is_replied: false,
    },
  ],
};

export const demoEnquiries = [
  {
    id: 1,
    institution_id: 1,
    student_name: 'Rahul Sharma',
    parent_name: 'Rajesh Sharma',
    parent_phone: '+91-9876543210',
    parent_email: 'rajesh.sharma@email.com',
    grade_interested: 'Grade 9',
    source: 'Website',
    enquiry_date: '2024-02-10',
    status: 'new' as const,
    notes: 'Interested in admission for academic year 2024-25',
    follow_up_date: '2024-02-17',
    created_at: '2024-02-10T09:30:00Z',
    updated_at: '2024-02-10T09:30:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    student_name: 'Priya Patel',
    parent_name: 'Amit Patel',
    parent_phone: '+91-9876543211',
    parent_email: 'amit.patel@email.com',
    grade_interested: 'Grade 10',
    source: 'Walk-in',
    enquiry_date: '2024-02-12',
    status: 'contacted' as const,
    notes: 'Very interested. Visited campus on 2024-02-12',
    follow_up_date: '2024-02-19',
    created_at: '2024-02-12T11:00:00Z',
    updated_at: '2024-02-13T14:30:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    student_name: 'Ananya Reddy',
    parent_name: 'Suresh Reddy',
    parent_phone: '+91-9876543212',
    parent_email: 'suresh.reddy@email.com',
    grade_interested: 'Grade 11',
    source: 'Referral',
    enquiry_date: '2024-02-08',
    status: 'visited' as const,
    notes: 'Referred by existing parent. Took campus tour',
    follow_up_date: '2024-02-20',
    created_at: '2024-02-08T10:15:00Z',
    updated_at: '2024-02-14T16:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    student_name: 'Arjun Kumar',
    parent_name: 'Vijay Kumar',
    parent_phone: '+91-9876543213',
    parent_email: 'vijay.kumar@email.com',
    grade_interested: 'Grade 8',
    source: 'Phone',
    enquiry_date: '2024-02-14',
    status: 'converted' as const,
    notes: 'Admission completed. Starting from April 2024',
    follow_up_date: null,
    created_at: '2024-02-14T15:20:00Z',
    updated_at: '2024-02-15T11:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    student_name: 'Sneha Gupta',
    parent_name: 'Ramesh Gupta',
    parent_phone: '+91-9876543214',
    parent_email: 'ramesh.gupta@email.com',
    grade_interested: 'Grade 7',
    source: 'Social Media',
    enquiry_date: '2024-02-05',
    status: 'closed' as const,
    notes: 'Decided to join another school',
    follow_up_date: null,
    created_at: '2024-02-05T13:45:00Z',
    updated_at: '2024-02-11T10:00:00Z',
  },
  {
    id: 6,
    institution_id: 1,
    student_name: 'Kavya Singh',
    parent_name: 'Rakesh Singh',
    parent_phone: '+91-9876543215',
    parent_email: 'rakesh.singh@email.com',
    grade_interested: 'Grade 6',
    source: 'Email',
    enquiry_date: '2024-02-16',
    status: 'new' as const,
    notes: 'Looking for admission in science stream',
    follow_up_date: '2024-02-23',
    created_at: '2024-02-16T10:00:00Z',
    updated_at: '2024-02-16T10:00:00Z',
  },
  {
    id: 7,
    institution_id: 1,
    student_name: 'Rohan Mehta',
    parent_name: 'Kiran Mehta',
    parent_phone: '+91-9876543216',
    parent_email: 'kiran.mehta@email.com',
    grade_interested: 'Grade 12',
    source: 'Referral',
    enquiry_date: '2024-02-15',
    status: 'follow_up' as const,
    notes: 'Needs scholarship information. Scheduled follow-up call',
    follow_up_date: '2024-02-22',
    created_at: '2024-02-15T14:30:00Z',
    updated_at: '2024-02-18T09:00:00Z',
  },
  {
    id: 8,
    institution_id: 1,
    student_name: 'Isha Desai',
    parent_name: 'Nitin Desai',
    parent_phone: '+91-9876543217',
    parent_email: 'nitin.desai@email.com',
    grade_interested: 'Grade 5',
    source: 'Website',
    enquiry_date: '2024-02-11',
    status: 'contacted' as const,
    notes: 'Parent interested in extracurricular activities. Sent brochure',
    follow_up_date: '2024-02-18',
    created_at: '2024-02-11T11:20:00Z',
    updated_at: '2024-02-13T16:45:00Z',
  },
  {
    id: 9,
    institution_id: 1,
    student_name: 'Aditya Joshi',
    parent_name: 'Prashant Joshi',
    parent_phone: '+91-9876543218',
    parent_email: 'prashant.joshi@email.com',
    grade_interested: 'Grade 9',
    source: 'Walk-in',
    enquiry_date: '2024-02-09',
    status: 'visited' as const,
    notes: 'Completed campus tour. Very impressed with facilities',
    follow_up_date: '2024-02-16',
    created_at: '2024-02-09T15:00:00Z',
    updated_at: '2024-02-12T10:30:00Z',
  },
  {
    id: 10,
    institution_id: 1,
    student_name: 'Meera Nair',
    parent_name: 'Sunil Nair',
    parent_phone: '+91-9876543219',
    parent_email: 'sunil.nair@email.com',
    grade_interested: 'Grade 11',
    source: 'Phone',
    enquiry_date: '2024-02-07',
    status: 'follow_up' as const,
    notes: 'Awaiting transfer certificate from previous school',
    follow_up_date: '2024-02-21',
    created_at: '2024-02-07T12:15:00Z',
    updated_at: '2024-02-14T14:00:00Z',
  },
];

export const demoSMSTemplates = [
  {
    id: 1,
    institution_id: 1,
    name: 'Attendance Reminder',
    template_type: 'attendance',
    message_template:
      'Dear {{parent_name}}, your child {{student_name}} from {{grade}} was absent on {{date}}. Please contact the school if this is an error. - {{institution_name}}',
    variables: ['parent_name', 'student_name', 'grade', 'date', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    name: 'Fee Reminder',
    template_type: 'fee_reminder',
    message_template:
      'Dear {{parent_name}}, fee payment of Rs. {{amount}} for {{student_name}} ({{grade}}) is due on {{date}}. Please pay at the earliest. - {{institution_name}}',
    variables: ['parent_name', 'student_name', 'grade', 'amount', 'date', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    name: 'Exam Notification',
    template_type: 'exam_notification',
    message_template:
      'Dear {{parent_name}}, {{student_name}} has an exam for {{subject}} on {{date}} at {{time}}. Please ensure they are well-prepared. - {{institution_name}}',
    variables: ['parent_name', 'student_name', 'subject', 'date', 'time', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    name: 'Result Published',
    template_type: 'result_notification',
    message_template:
      'Dear {{parent_name}}, exam results for {{student_name}} ({{grade}}) have been published. {{student_name}} scored {{marks}}%. Check the portal for details. - {{institution_name}}',
    variables: ['parent_name', 'student_name', 'grade', 'marks', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    name: 'Parent Meeting Invitation',
    template_type: 'meeting_invitation',
    message_template:
      'Dear {{parent_name}}, you are invited to a parent-teacher meeting on {{date}} at {{time}}. Please confirm your attendance. - {{institution_name}}',
    variables: ['parent_name', 'date', 'time', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 6,
    institution_id: 1,
    name: 'Homework Reminder',
    template_type: 'homework_reminder',
    message_template:
      'Dear {{parent_name}}, {{student_name}} has pending homework for {{subject}} due on {{date}}. Please ensure timely completion. - {{institution_name}}',
    variables: ['parent_name', 'student_name', 'subject', 'date', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 7,
    institution_id: 1,
    name: 'Birthday Wishes',
    template_type: 'birthday',
    message_template:
      'Happy Birthday {{student_name}}! Wishing you a wonderful year ahead filled with success and happiness. - {{institution_name}}',
    variables: ['student_name', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 8,
    institution_id: 1,
    name: 'Event Reminder',
    template_type: 'event_reminder',
    message_template:
      'Reminder: {{institution_name}} is organizing an event on {{date}} at {{time}}. Your presence is highly appreciated. - {{institution_name}}',
    variables: ['date', 'time', 'institution_name'],
    is_active: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 9,
    institution_id: 1,
    name: 'Achievement Congratulations',
    template_type: 'achievement',
    message_template:
      'Congratulations {{student_name}}! You have achieved {{marks}}% in {{subject}}. We are proud of your excellence. Keep it up! - {{institution_name}}',
    variables: ['student_name', 'marks', 'subject', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 10,
    institution_id: 1,
    name: 'Holiday Notification',
    template_type: 'holiday',
    message_template:
      'Dear Parents, the school will remain closed on {{date}} due to holiday. Classes will resume on the next working day. - {{institution_name}}',
    variables: ['date', 'institution_name'],
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

/**
 * Demo certificate templates for different certificate types
 *
 * Contains HTML templates with variable placeholders for generating certificates.
 * Each template can be customized by institution admins and supports dynamic data insertion.
 *
 * Available Certificate Types:
 * - transfer_certificate: Issued when student transfers to another institution
 * - character_certificate: Certifies student's conduct and character
 * - bonafide_certificate: Certifies student enrollment (for bank, scholarship, etc.)
 * - study_certificate: Certifies enrollment and academic progress
 * - completion_certificate: Awarded upon course/program completion
 *
 * Template Variables Supported:
 * - {{student_name}}, {{grade}}, {{admission_number}}
 * - {{admission_date}}, {{leaving_date}}, {{issue_date}}
 * - {{certificate_number}}, {{institution_name}}, {{principal_name}}
 * - {{reason}}, {{purpose}}, {{conduct}}, {{course_name}}
 *
 * @type {Array<{
 *   id: number,
 *   institution_id: number,
 *   certificate_type: string,
 *   template_name: string,
 *   template_content: string,
 *   is_active: boolean,
 *   created_at: string,
 *   updated_at: string
 * }>}
 */
export const demoCertificateTemplates: CertificateTemplate[] = [
  {
    id: 1,
    institution_id: 1,
    name: 'Standard Transfer Certificate',
    certificate_type: 'TC',
    template_config: {
      header: 'TRANSFER CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}}, admission number {{admission_number}}, was a bonafide student of this institution from {{admission_date}} to {{leaving_date}}. The reason for leaving is {{reason_for_leaving}}.',
      footer_text: 'Issued by the Principal',
      custom_fields: [
        { key: 'reason_for_leaving', label: 'Reason for Leaving', placeholder: 'Enter reason' },
      ],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    name: 'Leaving Certificate',
    certificate_type: 'LC',
    template_config: {
      header: 'LEAVING CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}}, Roll No. {{roll_number}}, Class {{class}}-{{section}}, is leaving this institution. The student has cleared all dues.',
      footer_text: 'Signed by Principal',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    name: 'Standard Bonafide Certificate',
    certificate_type: 'Bonafide',
    template_config: {
      header: 'BONAFIDE CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}}, bearing admission number {{admission_number}}, is a bonafide student of this institution, currently studying in Class {{class}}-{{section}}.',
      footer_text: 'Principal Signature and Seal',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    name: 'Character Certificate',
    certificate_type: 'Character',
    template_config: {
      header: 'CHARACTER CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}}, admission number {{admission_number}}, has been a student of this institution. During their tenure, the student has displayed excellent character and conduct.',
      footer_text: 'Principal',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    name: 'Study Certificate',
    certificate_type: 'Study',
    template_config: {
      header: 'STUDY CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}} is a regular student of Class {{class}}-{{section}} in this institution for the academic year {{academic_year}}.',
      footer_text: 'Issued by Administration',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 6,
    institution_id: 1,
    name: 'Conduct Certificate',
    certificate_type: 'Conduct',
    template_config: {
      header: 'CONDUCT CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}} has maintained excellent conduct and discipline during their time at this institution.',
      footer_text: 'Principal',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 7,
    institution_id: 1,
    name: 'Migration Certificate',
    certificate_type: 'Migration',
    template_config: {
      header: 'MIGRATION CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}} has migrated from this institution to pursue further studies elsewhere. All dues have been cleared.',
      footer_text: 'Registrar',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 8,
    institution_id: 1,
    name: 'Fee Clearance Certificate',
    certificate_type: 'Fee',
    template_config: {
      header: 'FEE CLEARANCE CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}}, admission number {{admission_number}}, has cleared all fee dues up to {{current_date}}.',
      footer_text: 'Accounts Department',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 9,
    institution_id: 1,
    name: 'No Dues Certificate',
    certificate_type: 'No Dues',
    template_config: {
      header: 'NO DUES CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}}, admission number {{admission_number}}, has no outstanding dues to the institution including library, laboratory, and fee payments.',
      footer_text: 'Administrative Office',
      custom_fields: [],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 10,
    institution_id: 1,
    name: 'Sports Achievement Certificate',
    certificate_type: 'Sports',
    template_config: {
      header: 'SPORTS CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}} has actively participated in sports activities and has represented the institution in {{sport_name}}.',
      footer_text: 'Sports Coordinator',
      custom_fields: [{ key: 'sport_name', label: 'Sport Name', placeholder: 'Enter sport name' }],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 11,
    institution_id: 1,
    name: 'Merit Certificate',
    certificate_type: 'Merit',
    template_config: {
      header: 'MERIT CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}} has achieved outstanding academic performance with {{percentage}}% marks and is awarded this merit certificate.',
      footer_text: 'Principal',
      custom_fields: [{ key: 'percentage', label: 'Percentage', placeholder: 'Enter percentage' }],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 12,
    institution_id: 1,
    name: 'Event Participation Certificate',
    certificate_type: 'Participation',
    template_config: {
      header: 'PARTICIPATION CERTIFICATE',
      body_text:
        'This is to certify that {{student_name}} has actively participated in {{event_name}} held on {{event_date}}.',
      footer_text: 'Event Coordinator',
      custom_fields: [
        { key: 'event_name', label: 'Event Name', placeholder: 'Enter event name' },
        { key: 'event_date', label: 'Event Date', placeholder: 'Enter event date' },
      ],
    },
    is_default: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

/**
 * Demo issued certificates for students
 *
 * Contains sample certificates of all types that have been issued to students.
 * Each certificate has a unique certificate number and tracks issuer and issue date.
 *
 * Certificate Structure:
 * - id: Unique identifier for the certificate record
 * - institution_id: The institution that issued the certificate
 * - student_id: The student who received the certificate
 * - certificate_type: Type of certificate (transfer/character/bonafide/study/completion)
 * - certificate_number: Unique certificate number (format: TYPE-YYYY-XXX)
 * - issue_date: Date when certificate was issued
 * - data: Type-specific certificate data (student info, grades, dates, etc.)
 * - issued_by: User ID of the admin/teacher who issued the certificate
 *
 * Sample Certificates:
 * - Alex Johnson (1001): Transfer Certificate (TC-2024-001), Completion Certificate (COMP-2024-001)
 * - Emma Wilson (1005): Character Certificate (CC-2024-001)
 * - Michael Brown (1002): Bonafide Certificate (BC-2024-001)
 * - Sophia Davis (1003): Study Certificate (SC-2024-001)
 *
 * @type {Array<{
 *   id: number,
 *   institution_id: number,
 *   student_id: number,
 *   certificate_type: string,
 *   certificate_number: string,
 *   issue_date: string,
 *   data: object,
 *   issued_by: number,
 *   created_at: string,
 *   updated_at: string
 * }>}
 */
export const demoCertificates: Certificate[] = [
  {
    id: 1,
    institution_id: 1,
    student_id: 1001,
    student_name: 'Alex Johnson',
    certificate_type: 'TC',
    serial_number: 'TC-2024-0001',
    issue_date: '2024-02-10',
    template_id: 1,
    remarks: 'Parent relocation to another city',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    student_id: 1005,
    student_name: 'Emma Wilson',
    certificate_type: 'Character',
    serial_number: 'CH-2024-0001',
    issue_date: '2024-01-20',
    template_id: 4,
    remarks: 'Excellent student with outstanding conduct',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-01-20T14:00:00Z',
    updated_at: '2024-01-20T14:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    student_id: 1002,
    student_name: 'Liam Anderson',
    certificate_type: 'Bonafide',
    serial_number: 'BO-2024-0001',
    issue_date: '2024-02-05',
    template_id: 3,
    remarks: 'For bank account opening purpose',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-02-05T11:00:00Z',
    updated_at: '2024-02-05T11:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    student_id: 1003,
    student_name: 'Noah Martinez',
    certificate_type: 'Study',
    serial_number: 'ST-2024-0001',
    issue_date: '2024-01-25',
    template_id: 5,
    remarks: 'Regular student for academic year 2023-2024',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-01-25T09:30:00Z',
    updated_at: '2024-01-25T09:30:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    student_id: 1007,
    student_name: 'Sophia Martinez',
    certificate_type: 'Merit',
    serial_number: 'ME-2024-0001',
    issue_date: '2024-01-30',
    template_id: 11,
    remarks: 'Outstanding academic performance - 95.5%',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-01-30T11:00:00Z',
    updated_at: '2024-01-30T11:00:00Z',
  },
  {
    id: 6,
    institution_id: 1,
    student_id: 1009,
    student_name: 'Oliver Davis',
    certificate_type: 'Sports',
    serial_number: 'SP-2024-0001',
    issue_date: '2024-02-01',
    template_id: 10,
    remarks: 'Represented school in Basketball district championship',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-02-01T14:00:00Z',
    updated_at: '2024-02-01T14:00:00Z',
  },
  {
    id: 7,
    institution_id: 1,
    student_id: 1005,
    student_name: 'Emma Wilson',
    certificate_type: 'Participation',
    serial_number: 'PA-2024-0001',
    issue_date: '2024-01-15',
    template_id: 12,
    remarks: 'Active participation in Science Fair 2024',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 8,
    institution_id: 1,
    student_id: 1001,
    student_name: 'Alex Johnson',
    certificate_type: 'No Dues',
    serial_number: 'ND-2024-0001',
    issue_date: '2024-02-08',
    template_id: 9,
    remarks: 'All library books returned, no pending fees',
    issued_by_id: 3001,
    issued_by_name: 'Michael Anderson',
    is_revoked: false,
    created_at: '2024-02-08T16:00:00Z',
    updated_at: '2024-02-08T16:00:00Z',
  },
];

/**
 * Demo ID card templates with different design styles
 *
 * Provides three template variations for student ID cards with different visual styles,
 * color schemes, and feature sets (photo, barcode, QR code).
 *
 * Template Types:
 *
 * 1. Standard Template (Blue) - Template ID: 1
 *    - Classic blue background with white text
 *    - Includes: Student photo, barcode
 *    - Use case: Basic daily school identification
 *
 * 2. Premium Template (Green) - Template ID: 2
 *    - Professional green background with white text
 *    - Includes: Student photo, barcode, QR code
 *    - Use case: Enhanced security with dual verification (barcode + QR)
 *
 * 3. Minimal Template (White) - Template ID: 3
 *    - Clean white background with black text
 *    - Includes: Student photo, QR code only
 *    - Use case: Modern, minimalist design for senior students
 *
 * Template Features:
 * - Customizable colors (background and text)
 * - Optional student photo display
 * - Optional barcode for traditional scanning
 * - Optional QR code for digital verification
 * - All templates support bulk generation
 * - Print-ready format support
 *
 * @type {Array<{
 *   id: number,
 *   institution_id: number,
 *   template_name: string,
 *   template_design: 'standard' | 'premium' | 'minimal',
 *   background_color: string,
 *   text_color: string,
 *   include_photo: boolean,
 *   include_barcode: boolean,
 *   include_qr_code: boolean,
 *   is_active: boolean,
 *   created_at: string,
 *   updated_at: string
 * }>}
 */
export const demoIDCardTemplates = [
  {
    id: 1,
    institution_id: 1,
    template_name: 'Standard Student ID Card',
    template_design: 'standard',
    background_color: '#1976d2',
    text_color: '#ffffff',
    include_photo: true,
    include_barcode: true,
    include_qr_code: false,
    is_active: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    template_name: 'Premium Student ID Card',
    template_design: 'premium',
    background_color: '#2e7d32',
    text_color: '#ffffff',
    include_photo: true,
    include_barcode: true,
    include_qr_code: true,
    is_active: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    template_name: 'Minimal Student ID Card',
    template_design: 'minimal',
    background_color: '#ffffff',
    text_color: '#000000',
    include_photo: true,
    include_barcode: false,
    include_qr_code: true,
    is_active: true,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

/**
 * Demo issued ID card data for students
 *
 * Contains sample ID cards that have been generated for students.
 * Each ID card includes student information, photo, barcode/QR code, and validity dates.
 *
 * ID Card Structure:
 * - id: Unique identifier for the ID card record
 * - student_id: Reference to the student
 * - institution_id: Reference to the institution
 * - card_number: Unique card number (format: ID-YYYY-XXXX)
 * - student_name: Full name of the student
 * - grade: Student's current grade/class
 * - section: Student's section
 * - admission_number: Student's admission number
 * - photo_url: URL to student's photo
 * - blood_group: Student's blood group (for emergency)
 * - emergency_contact: Emergency contact number
 * - valid_from: Start date of card validity
 * - valid_until: End date of card validity
 * - barcode_data: Data encoded in barcode (typically admission number)
 * - qr_code_data: Data encoded in QR code (verification URL)
 * - template_id: Reference to the template used
 * - issued_at: Timestamp when card was issued
 *
 * Sample ID Cards:
 * - Alex Johnson (1001): Standard Template (Blue) with barcode - ID-2024-1001
 * - Emma Wilson (1005): Premium Template (Green) with barcode and QR code - ID-2024-1005
 *
 * Features:
 * - Each card has unique card number
 * - Barcode encodes admission number for quick scanning
 * - QR code contains verification URL for digital validation
 * - Emergency contact and blood group for safety
 * - Valid from/until dates for annual renewal tracking
 *
 * @type {Array<{
 *   id: number,
 *   student_id: number,
 *   institution_id: number,
 *   card_number: string,
 *   student_name: string,
 *   grade: string,
 *   section: string,
 *   admission_number: string,
 *   photo_url: string,
 *   blood_group: string,
 *   emergency_contact: string,
 *   valid_from: string,
 *   valid_until: string,
 *   barcode_data: string,
 *   qr_code_data: string,
 *   template_id: number,
 *   issued_at: string
 * }>}
 */
export const demoIDCardData = [
  {
    id: 1,
    student_id: 1001,
    institution_id: 1,
    card_number: 'ID-2024-1001',
    student_name: 'Alex Johnson',
    grade: '10th Grade',
    section: 'A',
    admission_number: 'STD2023001',
    photo_url: 'https://i.pravatar.cc/150?img=12',
    blood_group: 'O+',
    emergency_contact: '+1-555-0101',
    valid_from: '2023-04-01',
    valid_until: '2024-03-31',
    barcode_data: 'STD2023001',
    qr_code_data: 'https://school.edu/verify/STD2023001',
    template_id: 1,
    issued_at: '2023-04-01T09:00:00Z',
  },
  {
    id: 2,
    student_id: 1005,
    institution_id: 1,
    card_number: 'ID-2024-1005',
    student_name: 'Emma Wilson',
    grade: '10th Grade',
    section: 'A',
    admission_number: 'STD2023005',
    photo_url: 'https://i.pravatar.cc/150?img=44',
    blood_group: 'A+',
    emergency_contact: '+1-555-0105',
    valid_from: '2023-04-01',
    valid_until: '2024-03-31',
    barcode_data: 'STD2023005',
    qr_code_data: 'https://school.edu/verify/STD2023005',
    template_id: 2,
    issued_at: '2023-04-01T09:00:00Z',
  },
];

export const bulkIDCardGeneration = [
  {
    job_id: 'JOB-2024-001',
    template_id: 1,
    generation_date: '2024-02-01T10:00:00Z',
    student_count: 45,
    status: 'completed',
    students_list: [
      {
        student_id: 1001,
        student_name: 'Alex Johnson',
        admission_number: 'STD2023001',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023001.pdf',
      },
      {
        student_id: 1005,
        student_name: 'Emma Wilson',
        admission_number: 'STD2023005',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023005.pdf',
      },
      {
        student_id: 1003,
        student_name: 'Michael Chen',
        admission_number: 'STD2023003',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023003.pdf',
      },
      {
        student_id: 1007,
        student_name: 'Sophia Martinez',
        admission_number: 'STD2023007',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023007.pdf',
      },
      {
        student_id: 1009,
        student_name: 'Oliver Davis',
        admission_number: 'STD2023009',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023009.pdf',
      },
    ],
    created_by: 'Michael Anderson',
    created_at: '2024-02-01T10:00:00Z',
    completed_at: '2024-02-01T10:15:00Z',
  },
  {
    job_id: 'JOB-2024-002',
    template_id: 2,
    generation_date: '2024-02-10T14:30:00Z',
    student_count: 38,
    status: 'completed',
    students_list: [
      {
        student_id: 1011,
        student_name: 'Isabella Garcia',
        admission_number: 'STD2023011',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023011.pdf',
      },
      {
        student_id: 1013,
        student_name: 'Ethan Brown',
        admission_number: 'STD2023013',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023013.pdf',
      },
      {
        student_id: 1015,
        student_name: 'Mia Taylor',
        admission_number: 'STD2023015',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023015.pdf',
      },
    ],
    created_by: 'Michael Anderson',
    created_at: '2024-02-10T14:30:00Z',
    completed_at: '2024-02-10T14:42:00Z',
  },
  {
    job_id: 'JOB-2024-003',
    template_id: 1,
    generation_date: '2024-02-14T09:00:00Z',
    student_count: 52,
    status: 'in_progress',
    students_list: [
      {
        student_id: 1020,
        student_name: 'Lucas Anderson',
        admission_number: 'STD2023020',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023020.pdf',
      },
      {
        student_id: 1021,
        student_name: 'Ava Thompson',
        admission_number: 'STD2023021',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023021.pdf',
      },
    ],
    created_by: 'Michael Anderson',
    created_at: '2024-02-14T09:00:00Z',
    completed_at: null,
  },
  {
    job_id: 'JOB-2024-004',
    template_id: 3,
    generation_date: '2024-01-25T11:00:00Z',
    student_count: 42,
    status: 'completed',
    students_list: [
      {
        student_id: 1030,
        student_name: 'Noah Walker',
        admission_number: 'STD2023030',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023030.pdf',
      },
      {
        student_id: 1031,
        student_name: 'Charlotte White',
        admission_number: 'STD2023031',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023031.pdf',
      },
      {
        student_id: 1032,
        student_name: 'Liam Harris',
        admission_number: 'STD2023032',
        generated_card_url: 'https://storage.example.com/idcards/2024/STD2023032.pdf',
      },
    ],
    created_by: 'Michael Anderson',
    created_at: '2024-01-25T11:00:00Z',
    completed_at: '2024-01-25T11:18:00Z',
  },
  {
    job_id: 'JOB-2024-005',
    template_id: 2,
    generation_date: '2024-01-15T15:30:00Z',
    student_count: 28,
    status: 'failed',
    students_list: [],
    created_by: 'Michael Anderson',
    created_at: '2024-01-15T15:30:00Z',
    completed_at: null,
    error_message: 'Template rendering failed due to missing student photos',
  },
];

/**
 * Demo digital credentials (blockchain-verified certificates and badges)
 *
 * Modern blockchain-verified digital credentials that students can share on professional platforms.
 * Each credential is stored on blockchain for tamper-proof verification and includes a public
 * verification URL that employers/institutions can use to validate authenticity.
 *
 * Credential Types:
 *
 * 1. Academic Certificates (credential_type: 'certificate', sub_type: 'academic')
 *    - Course completion certificates with grades and scores
 *    - Blockchain-verified for authenticity
 *    - Example: Mathematics Excellence Certificate (95% score)
 *
 * 2. Skill-Based Certificates (credential_type: 'certificate', sub_type: 'skill_based')
 *    - Certifies specific competencies and skills
 *    - Linked to competition results or achievements
 *    - Example: English Debate Champion Certificate
 *
 * 3. Digital Badges (credential_type: 'digital_badge')
 *    - Micro-credentials for specific achievements
 *    - Sub-types: skill_based, participation, achievement
 *    - Example: Coding Champion Badge, Science Fair Participant Badge
 *
 * Structure:
 * - id: Unique credential identifier
 * - credential_type: 'certificate' or 'digital_badge'
 * - sub_type: 'academic', 'skill_based', 'participation', 'achievement'
 * - title: Display name of the credential
 * - description: Detailed description of the achievement
 * - certificate_number: Unique certificate number (e.g., CERT-MATH-2024-001)
 * - skills: Array of skills associated with the credential
 * - metadata: Additional contextual information (course name, rank, competition, etc.)
 * - blockchain_hash: Ethereum-style hash for blockchain verification
 * - blockchain_credential_id: Unique blockchain credential identifier
 * - blockchain_status: 'verified', 'pending', or 'failed'
 * - verification_url: Public URL for credential verification
 * - qr_code_url: QR code image URL for mobile verification
 * - verification_count: Number of times credential has been verified
 * - share_count: Number of times credential has been shared
 *
 * Features:
 * - Blockchain verification ensures authenticity and prevents tampering
 * - Public verification URLs allow anyone to validate credentials
 * - QR codes enable easy mobile verification
 * - Share functionality for LinkedIn, email, and social media
 * - Analytics tracking (verification count, share count)
 * - Skills tagging for searchability
 * - Issuer information for credibility
 *
 * Sample Credentials for Alex Johnson (student_id: 1001):
 * 1. Mathematics Excellence Certificate - 95% score (CERT-MATH-2024-001)
 * 2. Physics Laboratory Excellence - 93% score (CERT-PHY-2024-002)
 * 3. Coding Champion Badge - 1st place (BADGE-CODE-2024-001)
 * 4. Science Fair Participant Badge (BADGE-SCIF-2024-001)
 * 5. English Debate Champion Certificate (CERT-ENG-2024-003)
 *
 * Usage:
 * ```javascript
 * // Get all credentials for a student
 * const studentCredentials = demoCredentials.filter(c => c.recipient_id === 1001);
 *
 * // Verify a credential
 * const cert = demoCredentials.find(c => c.certificate_number === 'CERT-MATH-2024-001');
 * console.log(cert.verification_url); // Open for public verification
 * console.log(cert.blockchain_status); // Check if verified on blockchain
 *
 * // Get only digital badges
 * const badges = demoCredentials.filter(c => c.credential_type === 'digital_badge');
 * ```
 *
 * @type {Credential[]}
 */
export const demoCredentials: Credential[] = [
  {
    id: 1,
    institution_id: 1,
    recipient_id: 1001,
    issuer_id: 201,
    credential_type: CredentialType.CERTIFICATE,
    sub_type: CredentialSubType.ACADEMIC,
    title: 'Mathematics Excellence Certificate',
    description:
      'Awarded for outstanding performance in Advanced Mathematics course with 95% score',
    certificate_number: 'CERT-MATH-2024-001',
    skills: ['Calculus', 'Algebra', 'Geometry', 'Problem Solving'],
    metadata: {
      course_name: 'Advanced Mathematics',
      grade_obtained: 'A+',
      issuer_designation: 'Head of Mathematics Department',
    },
    blockchain_hash: '0x8f3b2a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    blockchain_credential_id: 'bc-cred-001',
    blockchain_status: 'verified',
    verification_url: 'https://verify.edusystem.com/cert/CERT-MATH-2024-001',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CERT-MATH-2024-001',
    issued_at: '2024-01-15T10:00:00Z',
    expires_at: undefined,
    status: CredentialStatus.ACTIVE,
    course_id: 1,
    grade: 'A+',
    score: 95,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    recipient_name: 'Alex Johnson',
    recipient_email: 'demo@example.com',
    issuer_name: 'Dr. Emily Carter',
    institution_name: 'Springfield High School',
    verification_count: 12,
    share_count: 5,
  },
  {
    id: 2,
    institution_id: 1,
    recipient_id: 1001,
    issuer_id: 202,
    credential_type: CredentialType.CERTIFICATE,
    sub_type: CredentialSubType.ACADEMIC,
    title: 'Physics Laboratory Excellence',
    description: 'Completed all advanced physics laboratory experiments with distinction',
    certificate_number: 'CERT-PHY-2024-002',
    skills: ['Experimental Design', 'Data Analysis', 'Scientific Method', 'Laboratory Safety'],
    metadata: {
      course_name: 'Physics Laboratory',
      experiments_completed: 15,
      issuer_designation: 'Physics Department Head',
    },
    blockchain_hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    blockchain_credential_id: 'bc-cred-002',
    blockchain_status: 'verified',
    verification_url: 'https://verify.edusystem.com/cert/CERT-PHY-2024-002',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CERT-PHY-2024-002',
    issued_at: '2024-02-01T10:00:00Z',
    expires_at: undefined,
    status: CredentialStatus.ACTIVE,
    course_id: 2,
    grade: 'A',
    score: 93,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
    recipient_name: 'Alex Johnson',
    recipient_email: 'demo@example.com',
    issuer_name: 'Prof. James Wilson',
    institution_name: 'Springfield High School',
    verification_count: 8,
    share_count: 3,
  },
  {
    id: 3,
    institution_id: 1,
    recipient_id: 1001,
    issuer_id: 3001,
    credential_type: CredentialType.DIGITAL_BADGE,
    sub_type: CredentialSubType.SKILL_BASED,
    title: 'Coding Champion',
    description: 'Winner of the School Programming Competition 2024',
    certificate_number: 'BADGE-CODE-2024-001',
    skills: ['Python', 'Algorithm Design', 'Competitive Programming', 'Problem Solving'],
    metadata: {
      competition_name: 'Springfield Coding Competition 2024',
      rank: 1,
      total_participants: 50,
    },
    blockchain_hash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    blockchain_credential_id: 'bc-badge-001',
    blockchain_status: 'verified',
    verification_url: 'https://verify.edusystem.com/badge/BADGE-CODE-2024-001',
    qr_code_url:
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BADGE-CODE-2024-001',
    issued_at: '2023-12-20T10:00:00Z',
    expires_at: undefined,
    status: CredentialStatus.ACTIVE,
    created_at: '2023-12-20T10:00:00Z',
    updated_at: '2023-12-20T10:00:00Z',
    recipient_name: 'Alex Johnson',
    recipient_email: 'demo@example.com',
    issuer_name: 'Michael Anderson',
    institution_name: 'Springfield High School',
    verification_count: 25,
    share_count: 15,
  },
  {
    id: 4,
    institution_id: 1,
    recipient_id: 1001,
    issuer_id: 3001,
    credential_type: CredentialType.DIGITAL_BADGE,
    sub_type: CredentialSubType.PARTICIPATION,
    title: 'Science Fair Participant',
    description:
      'Participated in the Regional Science Fair 2024 with a project on renewable energy',
    certificate_number: 'BADGE-SCIF-2024-001',
    skills: ['Research', 'Scientific Presentation', 'Renewable Energy', 'Teamwork'],
    metadata: {
      event_name: 'Regional Science Fair 2024',
      project_title: 'Solar Energy Optimization',
      award: 'Certificate of Participation',
    },
    blockchain_hash: '0x7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d',
    blockchain_credential_id: 'bc-badge-002',
    blockchain_status: 'verified',
    verification_url: 'https://verify.edusystem.com/badge/BADGE-SCIF-2024-001',
    qr_code_url:
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BADGE-SCIF-2024-001',
    issued_at: '2024-01-30T10:00:00Z',
    expires_at: undefined,
    status: CredentialStatus.ACTIVE,
    created_at: '2024-01-30T10:00:00Z',
    updated_at: '2024-01-30T10:00:00Z',
    recipient_name: 'Alex Johnson',
    recipient_email: 'demo@example.com',
    issuer_name: 'Michael Anderson',
    institution_name: 'Springfield High School',
    verification_count: 6,
    share_count: 2,
  },
  {
    id: 5,
    institution_id: 1,
    recipient_id: 1001,
    issuer_id: 204,
    credential_type: CredentialType.CERTIFICATE,
    sub_type: CredentialSubType.SKILL_BASED,
    title: 'English Debate Champion',
    description: 'First place in Inter-School English Debate Championship',
    certificate_number: 'CERT-ENG-2024-003',
    skills: ['Public Speaking', 'Argumentation', 'Critical Thinking', 'Communication'],
    metadata: {
      competition_name: 'Inter-School Debate Championship 2024',
      topic: 'Technology and Education',
      position: 'Winner',
    },
    blockchain_hash: '0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c',
    blockchain_credential_id: 'bc-cred-003',
    blockchain_status: 'verified',
    verification_url: 'https://verify.edusystem.com/cert/CERT-ENG-2024-003',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CERT-ENG-2024-003',
    issued_at: '2023-11-15T10:00:00Z',
    expires_at: undefined,
    status: CredentialStatus.ACTIVE,
    created_at: '2023-11-15T10:00:00Z',
    updated_at: '2023-11-15T10:00:00Z',
    recipient_name: 'Alex Johnson',
    recipient_email: 'demo@example.com',
    issuer_name: 'Mr. David Thompson',
    institution_name: 'Springfield High School',
    verification_count: 18,
    share_count: 8,
  },
];

export const demoStaffMembers = [
  {
    id: 1,
    institution_id: 1,
    employee_id: 'EMP001',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@school.edu',
    phone: '+1-555-3001',
    role: 'Principal',
    department: 'Administration',
    joining_date: '2015-06-01',
    qualification: 'M.Ed.',
    salary: 85000,
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=70',
    created_at: '2015-06-01T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    employee_id: 'EMP002',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@school.edu',
    phone: '+1-555-3002',
    role: 'Vice Principal',
    department: 'Administration',
    joining_date: '2016-08-15',
    qualification: 'M.Ed.',
    salary: 75000,
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=71',
    created_at: '2016-08-15T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    employee_id: 'EMP003',
    first_name: 'David',
    last_name: 'Williams',
    email: 'david.williams@school.edu',
    phone: '+1-555-3003',
    role: 'Office Manager',
    department: 'Administration',
    joining_date: '2018-01-10',
    qualification: 'MBA',
    salary: 55000,
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=72',
    created_at: '2018-01-10T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    employee_id: 'EMP004',
    first_name: 'Maria',
    last_name: 'Garcia',
    email: 'maria.garcia@school.edu',
    phone: '+1-555-3004',
    role: 'Accountant',
    department: 'Finance',
    joining_date: '2017-03-20',
    qualification: 'B.Com, CA',
    salary: 60000,
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=73',
    created_at: '2017-03-20T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    employee_id: 'EMP005',
    first_name: 'Robert',
    last_name: 'Martinez',
    email: 'robert.martinez@school.edu',
    phone: '+1-555-3005',
    role: 'Librarian',
    department: 'Library',
    joining_date: '2019-07-01',
    qualification: 'M.Lib.Sc.',
    salary: 45000,
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=74',
    created_at: '2019-07-01T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 6,
    institution_id: 1,
    employee_id: 'EMP006',
    first_name: 'Lisa',
    last_name: 'Anderson',
    email: 'lisa.anderson@school.edu',
    phone: '+1-555-3006',
    role: 'IT Manager',
    department: 'IT',
    joining_date: '2018-09-15',
    qualification: 'B.Tech (CS)',
    salary: 65000,
    is_active: true,
    photo_url: 'https://i.pravatar.cc/150?img=75',
    created_at: '2018-09-15T09:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const demoPayrollRecords = [
  {
    id: 1,
    institution_id: 1,
    staff_id: 1,
    month: '2024-02',
    basic_salary: 85000,
    allowances: 15000,
    deductions: 8000,
    net_salary: 92000,
    payment_date: '2024-02-28',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer',
    created_at: '2024-02-25T10:00:00Z',
    updated_at: '2024-02-28T15:00:00Z',
  },
  {
    id: 2,
    institution_id: 1,
    staff_id: 2,
    month: '2024-02',
    basic_salary: 75000,
    allowances: 12000,
    deductions: 7000,
    net_salary: 80000,
    payment_date: '2024-02-28',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer',
    created_at: '2024-02-25T10:00:00Z',
    updated_at: '2024-02-28T15:00:00Z',
  },
  {
    id: 3,
    institution_id: 1,
    staff_id: 3,
    month: '2024-02',
    basic_salary: 55000,
    allowances: 8000,
    deductions: 5500,
    net_salary: 57500,
    payment_date: '2024-02-28',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer',
    created_at: '2024-02-25T10:00:00Z',
    updated_at: '2024-02-28T15:00:00Z',
  },
  {
    id: 4,
    institution_id: 1,
    staff_id: 4,
    month: '2024-02',
    basic_salary: 60000,
    allowances: 10000,
    deductions: 6000,
    net_salary: 64000,
    payment_date: '2024-02-28',
    payment_status: 'paid' as const,
    payment_method: 'bank_transfer',
    created_at: '2024-02-25T10:00:00Z',
    updated_at: '2024-02-28T15:00:00Z',
  },
  {
    id: 5,
    institution_id: 1,
    staff_id: 5,
    month: '2024-02',
    basic_salary: 45000,
    allowances: 7000,
    deductions: 4500,
    net_salary: 47500,
    payment_date: null,
    payment_status: 'pending' as const,
    payment_method: 'bank_transfer',
    created_at: '2024-02-25T10:00:00Z',
    updated_at: '2024-02-25T10:00:00Z',
  },
  {
    id: 6,
    institution_id: 1,
    staff_id: 6,
    month: '2024-02',
    basic_salary: 65000,
    allowances: 11000,
    deductions: 6500,
    net_salary: 69500,
    payment_date: null,
    payment_status: 'pending' as const,
    payment_method: 'bank_transfer',
    created_at: '2024-02-25T10:00:00Z',
    updated_at: '2024-02-25T10:00:00Z',
  },
];

export const demoData = {
  credentials: DEMO_CREDENTIALS,
  auth: {
    user: demoAuthUser,
    tokens: demoAuthTokens,
    response: demoAuthResponse,
  },
  student: {
    profile: demoStudentProfile,
    attendance: {
      summary: demoAttendanceSummary,
      monthly: demoMonthlyAttendance,
    },
    parents: demoParentInfo,
  },
  academics: {
    subjects: demoSubjects,
    teachers: demoTeachers,
    assignments: demoAssignments,
    submissions: demoSubmissions,
    examResults: demoExamResults,
    upcomingAssignments: demoUpcomingAssignments,
    recentGrades: demoRecentGrades,
  },
  teacher: {
    classRoster: demoClassRoster,
    studentSubmissions: demoStudentSubmissions,
    examMarksEntries: demoExamMarksEntries,
    parentMessages: demoParentMessages,
    studentPerformanceMetrics: demoStudentPerformanceMetrics,
  },
  gamification: {
    badges: demoBadges,
    userBadges: demoUserBadges,
    userPoints: demoUserPoints,
    pointHistory: demoPointHistory,
    leaderboard: demoLeaderboardEntries,
  },
  goals: demoGoals,
  aiPrediction: {
    topicProbabilities: demoTopicProbabilities,
    focusAreas: demoFocusAreas,
    studyTimeAllocation: demoStudyTimeAllocation,
    marksDistribution: demoMarksDistribution,
  },
  analytics: demoPerformanceAnalytics,
  flashcards: {
    decks: demoFlashcardDecks,
    cards: demoFlashcards,
    stats: demoFlashcardDeckStats,
  },
  quizzes: {
    quizzes: demoQuizzes,
    questions: demoQuizQuestions,
    attempts: demoQuizAttempts,
    leaderboard: demoQuizLeaderboard,
  },
  pomodoro: {
    settings: demoPomodoroSettings,
    sessions: demoPomodoroSessions,
    analytics: demoPomodoroAnalytics,
  },
  settings: {
    profile: demoUserProfile,
    notifications: demoNotificationPreferences,
    theme: demoThemeSettings,
    privacy: demoPrivacySettings,
    userSettings: demoUserSettings,
    connectedDevices: demoConnectedDevices,
  },
  parent: {
    attendanceMonitor: parentAttendanceMonitorData,
    gradesMonitor: parentGradesMonitorData,
    communication: parentCommunicationData,
  },
  communications: demoCommunicationData,
  search: demoSearchData,
  studyMaterials: demoStudyMaterialsData,
  enquiries: demoEnquiries,
  smsTemplates: demoSMSTemplates,
  certificates: demoCertificates,
  digitalCredentials: demoCredentials,
  staff: demoStaffMembers,
  payroll: demoPayrollRecords,
  idCard: {
    templates: demoIDCardTemplates,
    data: demoIDCardData,
    bulkGeneration: bulkIDCardGeneration,
  },
};

/**
 * Demo teacher dashboard data for Dr. Emily Carter
 * Contains all data displayed on the teacher dashboard including classes, schedule, grading, and analytics
 * @type {TeacherMyDashboardData}
 */
export const teacherDashboardData: TeacherMyDashboardData = {
  teacher_id: 201,
  teacher_name: 'Dr. Emily Carter',
  my_classes: [
    {
      class_id: 1,
      class_name: '10th Grade',
      section: 'A',
      subject: 'Mathematics',
      student_count: 45,
      average_score: 82.5,
      room_number: 'R-201',
    },
    {
      class_id: 2,
      class_name: '10th Grade',
      section: 'B',
      subject: 'Mathematics',
      student_count: 42,
      average_score: 78.3,
      room_number: 'R-201',
    },
    {
      class_id: 3,
      class_name: '9th Grade',
      section: 'A',
      subject: 'Mathematics',
      student_count: 38,
      average_score: 85.1,
      room_number: 'R-202',
    },
  ],
  todays_schedule: [
    {
      id: 1,
      time_slot: '08:00 - 09:00',
      start_time: '08:00',
      end_time: '09:00',
      class_name: '10th Grade',
      section: 'A',
      subject: 'Mathematics',
      room_number: 'R-201',
      status: 'completed',
    },
    {
      id: 2,
      time_slot: '10:00 - 11:00',
      start_time: '10:00',
      end_time: '11:00',
      class_name: '9th Grade',
      section: 'A',
      subject: 'Mathematics',
      room_number: 'R-202',
      status: 'ongoing',
    },
    {
      id: 3,
      time_slot: '14:00 - 15:00',
      start_time: '14:00',
      end_time: '15:00',
      class_name: '10th Grade',
      section: 'B',
      subject: 'Mathematics',
      room_number: 'R-201',
      status: 'upcoming',
    },
  ],
  pending_grading: {
    total_count: 28,
    assignments: [
      {
        id: 1,
        title: 'Quadratic Equations Problem Set',
        class_name: '10th Grade',
        section: 'A',
        subject: 'Mathematics',
        submission_count: 12,
        due_date: '2024-02-05T23:59:59Z',
        priority: 'high',
      },
      {
        id: 6,
        title: 'Algebra Test - Chapter 5',
        class_name: '10th Grade',
        section: 'B',
        subject: 'Mathematics',
        submission_count: 10,
        due_date: '2024-02-08T23:59:59Z',
        priority: 'high',
      },
      {
        id: 7,
        title: 'Geometry Problems',
        class_name: '9th Grade',
        section: 'A',
        subject: 'Mathematics',
        submission_count: 6,
        due_date: '2024-02-12T23:59:59Z',
        priority: 'medium',
      },
    ],
  },
  recent_submissions: [
    {
      id: 201,
      student_name: 'Emma Wilson',
      student_photo: 'https://i.pravatar.cc/150?img=5',
      assignment_title: 'Quadratic Equations Problem Set',
      class_name: '10th Grade',
      section: 'A',
      submitted_at: '2024-02-14T18:30:00Z',
      status: 'pending',
    },
    {
      id: 202,
      student_name: 'Michael Chen',
      student_photo: 'https://i.pravatar.cc/150?img=13',
      assignment_title: 'Quadratic Equations Problem Set',
      class_name: '10th Grade',
      section: 'A',
      submitted_at: '2024-02-14T17:15:00Z',
      status: 'pending',
    },
    {
      id: 203,
      student_name: 'Sophia Martinez',
      student_photo: 'https://i.pravatar.cc/150?img=9',
      assignment_title: 'Algebra Test - Chapter 5',
      class_name: '10th Grade',
      section: 'B',
      submitted_at: '2024-02-14T16:45:00Z',
      status: 'graded',
      score: 88,
    },
  ],
  class_performance: [
    {
      class_name: '10th Grade',
      section: 'A',
      subject: 'Mathematics',
      average_score: 82.5,
      attendance_rate: 92.3,
      student_count: 45,
    },
    {
      class_name: '10th Grade',
      section: 'B',
      subject: 'Mathematics',
      average_score: 78.3,
      attendance_rate: 88.7,
      student_count: 42,
    },
    {
      class_name: '9th Grade',
      section: 'A',
      subject: 'Mathematics',
      average_score: 85.1,
      attendance_rate: 94.5,
      student_count: 38,
    },
  ],
  upcoming_exams: [
    {
      id: 301,
      exam_name: 'Mid-Term Examination',
      exam_type: 'Mid-Term',
      class_name: '10th Grade',
      section: 'A',
      subject: 'Mathematics',
      date: '2024-03-15T09:00:00Z',
      duration_minutes: 180,
      total_marks: 100,
    },
    {
      id: 302,
      exam_name: 'Mid-Term Examination',
      exam_type: 'Mid-Term',
      class_name: '10th Grade',
      section: 'B',
      subject: 'Mathematics',
      date: '2024-03-15T09:00:00Z',
      duration_minutes: 180,
      total_marks: 100,
    },
  ],
  statistics: {
    total_students: 125,
    pending_grading_count: 28,
    todays_classes: 3,
    this_week_attendance: 91.8,
  },
};

/**
 * Demo parent dashboard data for Robert Williams
 * Contains all data for monitoring children's academic performance, attendance, and communication
 * Includes data for two children: Emma Williams (8th grade) and Noah Williams (6th grade)
 * @type {ParentDashboard}
 */
export const parentDashboardData: ParentDashboard = {
  parent_info: {
    id: 5001,
    first_name: 'Robert',
    last_name: 'Williams',
    email: PARENT_CREDENTIALS.email,
    phone: '+1-555-5001',
    photo_url: 'https://i.pravatar.cc/150?img=60',
  },
  children: [
    {
      id: 1101,
      first_name: 'Emma',
      last_name: 'Williams',
      admission_number: 'STD2022045',
      photo_url: 'https://i.pravatar.cc/150?img=5',
      section_name: 'A',
      grade_name: '8th Grade',
      attendance_percentage: 94.5,
      current_rank: 5,
      average_score: 88.2,
      total_students: 48,
      attendance_status: 'present',
    },
    {
      id: 1102,
      first_name: 'Noah',
      last_name: 'Williams',
      admission_number: 'STD2023067',
      photo_url: 'https://i.pravatar.cc/150?img=13',
      section_name: 'B',
      grade_name: '6th Grade',
      attendance_percentage: 78.5,
      current_rank: 28,
      average_score: 72.4,
      total_students: 42,
      attendance_status: 'absent',
    },
  ],
  selected_child: {
    id: 1101,
    first_name: 'Emma',
    last_name: 'Williams',
    admission_number: 'STD2022045',
    photo_url: 'https://i.pravatar.cc/150?img=5',
    section_name: 'A',
    grade_name: '8th Grade',
    attendance_percentage: 94.5,
    current_rank: 5,
    average_score: 88.2,
    total_students: 48,
    attendance_status: 'present',
  },
  today_attendance: {
    date: '2024-02-15',
    status: 'present',
    is_absent: false,
    is_present: true,
    is_late: false,
    is_half_day: false,
    alert_sent: false,
  },
  attendance_stats: {
    total_days: 160,
    present_days: 151,
    absent_days: 5,
    late_days: 3,
    half_days: 1,
    attendance_percentage: 94.5,
  },
  recent_grades: [
    {
      subject_name: 'Mathematics',
      exam_name: 'Unit Test 3',
      exam_type: 'Unit Test',
      marks_obtained: 92,
      total_marks: 100,
      percentage: 92.0,
      grade: 'A+',
      exam_date: '2024-02-10T00:00:00Z',
      rank: 3,
    },
    {
      subject_name: 'Science',
      exam_name: 'Unit Test 3',
      exam_type: 'Unit Test',
      marks_obtained: 88,
      total_marks: 100,
      percentage: 88.0,
      grade: 'A',
      exam_date: '2024-02-08T00:00:00Z',
      rank: 7,
    },
    {
      subject_name: 'English',
      exam_name: 'Unit Test 3',
      exam_type: 'Unit Test',
      marks_obtained: 85,
      total_marks: 100,
      percentage: 85.0,
      grade: 'A',
      exam_date: '2024-02-07T00:00:00Z',
      rank: 5,
    },
    {
      subject_name: 'Social Studies',
      exam_name: 'Unit Test 3',
      exam_type: 'Unit Test',
      marks_obtained: 90,
      total_marks: 100,
      percentage: 90.0,
      grade: 'A+',
      exam_date: '2024-02-05T00:00:00Z',
      rank: 4,
    },
  ],
  pending_assignments: [
    {
      id: 201,
      title: 'Algebra Problem Set - Chapter 8',
      subject_name: 'Mathematics',
      due_date: '2024-02-18T23:59:59Z',
      days_remaining: 3,
      description: 'Complete all exercises from Chapter 8',
      max_marks: 50,
      is_overdue: false,
    },
    {
      id: 202,
      title: 'Science Project: Solar System Model',
      subject_name: 'Science',
      due_date: '2024-02-22T23:59:59Z',
      days_remaining: 7,
      description: 'Create a detailed model of the solar system',
      max_marks: 100,
      is_overdue: false,
    },
    {
      id: 203,
      title: 'English Essay: My Favorite Book',
      subject_name: 'English',
      due_date: '2024-02-25T23:59:59Z',
      days_remaining: 10,
      description: 'Write a 500-word essay about your favorite book',
      max_marks: 50,
      is_overdue: false,
    },
  ],
  weekly_progress: {
    week_start: '2024-02-12',
    week_end: '2024-02-18',
    attendance_days: 5,
    present_days: 5,
    assignments_completed: 3,
    assignments_pending: 3,
    average_score: 88.7,
    subject_performance: [
      {
        subject_name: 'Mathematics',
        average_score: 90.5,
        total_assignments: 2,
        completed_assignments: 2,
        pending_assignments: 1,
        attendance_percentage: 100,
      },
      {
        subject_name: 'Science',
        average_score: 88.0,
        total_assignments: 2,
        completed_assignments: 1,
        pending_assignments: 1,
        attendance_percentage: 100,
      },
    ],
  },
  goals: [
    {
      id: 10,
      title: 'Achieve 95% in Mathematics',
      description: 'Focus on algebra and geometry',
      goal_type: 'academic',
      target_value: 95,
      current_value: 90,
      progress_percentage: 94.7,
      status: 'in_progress',
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      days_remaining: 45,
    },
    {
      id: 11,
      title: 'Improve Attendance to 98%',
      description: 'Maintain consistent attendance',
      goal_type: 'behavioral',
      target_value: 98,
      current_value: 94.5,
      progress_percentage: 96.4,
      status: 'in_progress',
      start_date: '2024-01-01',
      end_date: '2024-06-30',
      days_remaining: 135,
    },
  ],
  teacher_messages: [
    {
      id: 1,
      teacher_name: 'Dr. Smith',
      subject: 'Mathematics',
      content: 'Emma is doing excellent work in algebra. Keep it up!',
      created_at: '2024-02-14T10:30:00Z',
      is_read: false,
    },
    {
      id: 2,
      teacher_name: 'Ms. Johnson',
      subject: 'Science',
      content: 'Please remind Emma to submit her project by Friday.',
      created_at: '2024-02-13T14:15:00Z',
      is_read: true,
    },
  ],
  performance_comparison: {
    current_term: 'Term 2',
    previous_term: 'Term 1',
    current_term_data: [
      {
        term_name: 'Term 2',
        subject_name: 'Mathematics',
        average_marks: 90,
        total_marks: 100,
        percentage: 90.0,
        grade: 'A+',
      },
      {
        term_name: 'Term 2',
        subject_name: 'Science',
        average_marks: 88,
        total_marks: 100,
        percentage: 88.0,
        grade: 'A',
      },
    ],
    previous_term_data: [
      {
        term_name: 'Term 1',
        subject_name: 'Mathematics',
        average_marks: 85,
        total_marks: 100,
        percentage: 85.0,
        grade: 'A',
      },
      {
        term_name: 'Term 1',
        subject_name: 'Science',
        average_marks: 82,
        total_marks: 100,
        percentage: 82.0,
        grade: 'A',
      },
    ],
    improvement_subjects: ['Mathematics', 'Science'],
    declined_subjects: [],
    overall_improvement: 5.5,
  },
};

/**
 * Demo institution admin dashboard data
 * Contains institution-wide metrics, statistics, and pending tasks for admin management
 * @type {InstitutionAdminDashboard}
 */
export const adminDashboardData: InstitutionAdminDashboard = {
  overview: {
    student_count: 1250,
    teacher_count: 85,
    total_users: 1450,
  },
  attendance_summary: {
    date: '2024-02-15',
    total_students: 1250,
    present: 1150,
    absent: 75,
    late: 25,
    percentage: 92.0,
  },
  recent_exam_results: [
    {
      exam_id: 1,
      exam_name: 'Mid-Term Examination',
      exam_type: 'Mid-Term',
      date: '2024-02-10',
      total_students: 450,
      passed_students: 425,
      average_percentage: 82.5,
    },
    {
      exam_id: 2,
      exam_name: 'Unit Test 3',
      exam_type: 'Unit Test',
      date: '2024-02-08',
      total_students: 380,
      passed_students: 365,
      average_percentage: 78.3,
    },
  ],
  upcoming_events: [
    {
      id: 1,
      title: 'Annual Sports Day',
      event_type: 'sports',
      date: '2024-03-20',
      description: 'Annual inter-school sports competition',
    },
    {
      id: 2,
      title: 'Science Fair',
      event_type: 'academic',
      date: '2024-03-25',
      description: 'Student science project exhibition',
    },
    {
      id: 3,
      title: 'Parent-Teacher Meeting',
      event_type: 'meeting',
      date: '2024-03-15',
      description: 'Quarterly parent-teacher conference',
    },
  ],
  pending_tasks: [
    {
      id: '1',
      task_type: 'approval',
      title: 'Pending Leave Requests',
      description: 'Review and approve pending leave requests',
      count: 12,
      priority: 'high',
      due_date: '2024-02-18',
    },
    {
      id: '2',
      task_type: 'review',
      title: 'New Admissions',
      description: 'Process new admission applications',
      count: 25,
      priority: 'medium',
      due_date: '2024-02-22',
    },
    {
      id: '3',
      task_type: 'payment',
      title: 'Fee Collection',
      description: 'Follow up on pending fee payments',
      count: 45,
      priority: 'high',
      due_date: '2024-02-20',
    },
  ],
  performance_trends: [
    {
      month: 'Sep 2023',
      average_score: 75.5,
      attendance_rate: 88.2,
      student_count: 1200,
    },
    {
      month: 'Oct 2023',
      average_score: 77.2,
      attendance_rate: 89.5,
      student_count: 1215,
    },
    {
      month: 'Nov 2023',
      average_score: 78.8,
      attendance_rate: 90.1,
      student_count: 1230,
    },
    {
      month: 'Dec 2023',
      average_score: 80.5,
      attendance_rate: 91.3,
      student_count: 1235,
    },
    {
      month: 'Jan 2024',
      average_score: 81.2,
      attendance_rate: 91.8,
      student_count: 1245,
    },
    {
      month: 'Feb 2024',
      average_score: 82.0,
      attendance_rate: 92.0,
      student_count: 1250,
    },
  ],
  quick_statistics: [
    {
      label: 'Active Students',
      value: '1,250',
      trend: '+2.5%',
      icon: 'users',
    },
    {
      label: 'Average Attendance',
      value: '92%',
      trend: '+0.8%',
      icon: 'calendar-check',
    },
    {
      label: 'Total Revenue',
      value: '$485,000',
      trend: '+5.2%',
      icon: 'dollar-sign',
    },
    {
      label: 'Pass Rate',
      value: '94.4%',
      trend: '+1.2%',
      icon: 'award',
    },
  ],
  recent_bulk_id_card_generation: [
    {
      job_id: 'JOB-2024-003',
      template_name: 'Standard Student ID Card',
      generation_date: '2024-02-14T09:00:00Z',
      student_count: 52,
      status: 'in_progress',
      created_by: 'Michael Anderson',
    },
    {
      job_id: 'JOB-2024-002',
      template_name: 'Premium Student ID Card',
      generation_date: '2024-02-10T14:30:00Z',
      student_count: 38,
      status: 'completed',
      created_by: 'Michael Anderson',
      completed_at: '2024-02-10T14:42:00Z',
    },
    {
      job_id: 'JOB-2024-001',
      template_name: 'Standard Student ID Card',
      generation_date: '2024-02-01T10:00:00Z',
      student_count: 45,
      status: 'completed',
      created_by: 'Michael Anderson',
      completed_at: '2024-02-01T10:15:00Z',
    },
  ],
};

/**
 * Demo super admin dashboard data
 * Platform-wide analytics including all institutions, subscriptions, revenue, and usage metrics
 * @type {SuperAdminDashboardResponse}
 */
export const superadminDashboardData: SuperAdminDashboardResponse = {
  metrics_summary: {
    total_institutions: 125,
    active_subscriptions: 98,
    mrr: 145000,
    arr: 1740000,
    institution_growth_trend: 8.5,
  },
  subscription_distribution: {
    active: 98,
    trial: 15,
    expired: 8,
    cancelled: 4,
  },
  platform_usage: {
    dau: 45000,
    mau: 125000,
    total_users: 185000,
    active_users: 140000,
    dau_mau_ratio: 0.36,
  },
  revenue_trends: [
    {
      month: 'Sep 2023',
      mrr: 125000,
      arr: 1500000,
      total_revenue: 125000,
    },
    {
      month: 'Oct 2023',
      mrr: 130000,
      arr: 1560000,
      total_revenue: 130000,
    },
    {
      month: 'Nov 2023',
      mrr: 135000,
      arr: 1620000,
      total_revenue: 135000,
    },
    {
      month: 'Dec 2023',
      mrr: 138000,
      arr: 1656000,
      total_revenue: 138000,
    },
    {
      month: 'Jan 2024',
      mrr: 142000,
      arr: 1704000,
      total_revenue: 142000,
    },
    {
      month: 'Feb 2024',
      mrr: 145000,
      arr: 1740000,
      total_revenue: 145000,
    },
  ],
  recent_activities: [
    {
      type: 'new_institution',
      title: 'New Institution Onboarded',
      description: 'Green Valley School joined the platform',
      time: '2024-02-15T10:30:00Z',
      institution_id: 126,
    },
    {
      type: 'subscription_upgrade',
      title: 'Subscription Upgraded',
      description: 'Riverside Academy upgraded to Premium plan',
      time: '2024-02-14T15:20:00Z',
      institution_id: 45,
    },
    {
      type: 'payment_received',
      title: 'Payment Received',
      description: 'Monthly payment received from 15 institutions',
      time: '2024-02-14T09:00:00Z',
    },
    {
      type: 'trial_expiring',
      title: 'Trial Expiring Soon',
      description: '5 institutions have trials expiring in 3 days',
      time: '2024-02-13T08:00:00Z',
    },
  ],
  institution_performance: [
    {
      id: 1,
      name: 'Springfield High School',
      total_users: 2500,
      active_users: 2350,
      subscription_status: 'active',
      revenue: 2500,
      last_activity: '2024-02-15T14:30:00Z',
      engagement: 94.0,
    },
    {
      id: 2,
      name: 'Riverside Academy',
      total_users: 1800,
      active_users: 1680,
      subscription_status: 'active',
      revenue: 3500,
      last_activity: '2024-02-15T12:15:00Z',
      engagement: 93.3,
    },
    {
      id: 3,
      name: 'Oakwood Institute',
      total_users: 3200,
      active_users: 2950,
      subscription_status: 'active',
      revenue: 4000,
      last_activity: '2024-02-15T11:45:00Z',
      engagement: 92.2,
    },
    {
      id: 4,
      name: 'Maple Leaf School',
      total_users: 1500,
      active_users: 1350,
      subscription_status: 'trial',
      revenue: 0,
      last_activity: '2024-02-15T10:20:00Z',
      engagement: 90.0,
    },
    {
      id: 5,
      name: 'Cedar Grove Academy',
      total_users: 2200,
      active_users: 1980,
      subscription_status: 'active',
      revenue: 2800,
      last_activity: '2024-02-15T09:30:00Z',
      engagement: 90.0,
    },
  ],
  quick_actions: {
    trials_expiring_soon: 5,
    grace_period_ending: 3,
    pending_onboarding: 2,
  },
};

/**
 * Main demo data export
 * Comprehensive collection of all demo data organized by feature/module
 * This is the primary export used throughout the application for testing and demo purposes
 *
 * @type {Object}
 * @property {Object} credentials - Demo login credentials
 * @property {Object} auth - Authentication data (users, tokens, responses)
 * @property {Object} student - Student-specific data (profile, attendance, parents)
 * @property {Object} academics - Academic data (subjects, teachers, assignments, exams)
 * @property {Object} teacher - Teacher-specific data (classes, submissions, messages)
 * @property {Object} gamification - Gamification data (badges, points, leaderboards)
 * @property {Array} goals - Student goals and progress tracking
 * @property {Object} aiPrediction - AI prediction and recommendation data
 * @property {Object} analytics - Performance analytics
 * @property {Object} flashcards - Flashcard decks and study data
 * @property {Object} quizzes - Quiz data (quizzes, questions, attempts)
 * @property {Object} pomodoro - Pomodoro timer settings and analytics
 * @property {Object} settings - User settings and preferences
 * @property {Object} parent - Parent dashboard and monitoring data
 * @property {Object} communications - Messages, announcements, notifications
 * @property {Object} search - Search data for students, teachers, assignments
 * @property {Object} studyMaterials - Previous papers and library books
 */
export default demoData;
