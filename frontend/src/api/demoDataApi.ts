import { useAuthStore } from '@/store/useAuthStore';
import {
  DEMO_CREDENTIALS,
  TEACHER_CREDENTIALS,
  PARENT_CREDENTIALS,
  ADMIN_CREDENTIALS,
  SUPERADMIN_CREDENTIALS,
  demoData,
  teacherDashboardData,
  parentDashboardData,
  adminDashboardData,
  superadminDashboardData,
  demoCertificateTemplates,
  demoCertificates,
  type ClassRosterStudent,
  type StudentSubmissionDetail,
  type ExamMarkEntry,
  type ParentMessage,
  type StudentPerformanceMetric,
} from '@/data/dummyData';
import type { Certificate, CertificateTemplate as SchoolCertificateTemplate } from './schoolAdmin';
import type { StudentProfile, StudentDashboardData } from './students';
import type { AssignmentListParams, Assignment } from '@/types/assignment';
import type { AttendanceListResponse, StudentAttendanceDetail } from './attendance';
import type { ExamListParams, ExamListResponse } from './examinations';
import type { ExamResult } from '@/types/examination';
import type { AIPredictionDashboardResponse } from './aiPredictionDashboard';
import type {
  UserBadge,
  UserPoints,
  PointHistory,
  LeaderboardEntry,
  Badge,
} from '@/types/gamification';
import type { Goal, GoalAnalytics } from '@/types/goals';
import type { StudentPerformanceAnalytics } from '@/types/analytics';
import type { Teacher, TeacherMyDashboardData, ClassAssignment } from './teachers';
import type {
  ParentDashboard,
  ChildOverview,
  TodayAttendance,
  RecentGrade,
  PendingAssignment,
  WeeklyProgress,
  PerformanceComparison,
  GoalProgress,
  BulkFeePaymentRequest,
  BulkEventRSVPRequest,
  SharedFamilyInfo,
  SiblingLinkRequest,
  PrivacySettings,
} from '@/types/parent';
import type { DashboardResponse as InstitutionAdminDashboardResponse } from './institutionAdmin';
import type { SuperAdminDashboardResponse } from './superAdmin';
import type {
  FlashcardDeck,
  Flashcard,
  FlashcardDeckStats,
  FlashcardStudyProgress,
  FlashcardDeckShare,
} from '@/types/flashcard';
import type {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizLeaderboardEntry,
  QuizDetailedAnalytics,
} from '@/types/quiz';
import type {
  PomodoroSession,
  PomodoroSettings,
  PomodoroAnalytics,
  Subject as PomodoroSubject,
} from '@/types/pomodoro';
import type { UserSettings } from '@/types/settings';
import type {
  DocumentSearchFilters,
  DocumentUploadRequest,
  DocumentVerificationRequest,
  DocumentShareRequest,
  DocumentRequest,
} from '@/types/documentVault';

export const isDemoUser = (email?: string): boolean => {
  const userEmail = email || useAuthStore.getState().user?.email;
  return (
    userEmail === DEMO_CREDENTIALS.email ||
    userEmail === TEACHER_CREDENTIALS.email ||
    userEmail === PARENT_CREDENTIALS.email ||
    userEmail === ADMIN_CREDENTIALS.email ||
    userEmail === SUPERADMIN_CREDENTIALS.email
  );
};

const firstNames = [
  'Emma',
  'Liam',
  'Olivia',
  'Noah',
  'Ava',
  'Elijah',
  'Sophia',
  'James',
  'Isabella',
  'William',
  'Mia',
  'Benjamin',
  'Charlotte',
  'Lucas',
  'Amelia',
  'Henry',
  'Harper',
  'Alexander',
  'Evelyn',
  'Sebastian',
  'Abigail',
  'Michael',
  'Emily',
  'Ethan',
  'Elizabeth',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Wilson',
  'Anderson',
  'Taylor',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Thompson',
  'Moore',
  'Lee',
  'Walker',
  'Hall',
  'Allen',
  'Young',
];

export const generateDemoStudents = (count: number) => {
  const students = [];
  const grades = [6, 7, 8, 9, 10, 11, 12];
  const sections = [101, 102, 103, 104, 105];
  const statuses = ['active', 'inactive', 'graduated', 'transferred'];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const gradeId = grades[i % grades.length];
    const sectionId = sections[i % sections.length];
    const studentId = 1000 + i;

    students.push({
      id: studentId,
      institution_id: 1,
      user_id: studentId,
      section_id: sectionId,
      grade_id: gradeId,
      admission_number: `STD2023${String(i + 1).padStart(3, '0')}`,
      roll_number: String((i % 45) + 1),
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.edu`,
      phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
      date_of_birth: `200${8 + (i % 5)}-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][i % 8],
      address: `${i + 100} Main Street, Springfield, IL 62701`,
      parent_name: `Parent ${lastName}`,
      parent_email: `parent.${lastName.toLowerCase()}@example.com`,
      parent_phone: `+1-555-${String(2000 + i).padStart(4, '0')}`,
      admission_date: `202${2 + (i % 2)}-0${(i % 9) + 1}-01`,
      photo_url: `https://i.pravatar.cc/150?img=${i + 1}`,
      status: statuses[i % 10 < 8 ? 0 : i % statuses.length],
      is_active: i % 10 < 8,
      created_at: `202${2 + (i % 2)}-0${(i % 9) + 1}-01T09:00:00Z`,
      updated_at: '2024-01-15T10:30:00Z',
      section: {
        id: sectionId,
        name: String.fromCharCode(65 + (i % 5)),
        grade_id: gradeId,
        grade: {
          id: gradeId,
          name: `${gradeId}th Grade`,
        },
      },
      attendance_percentage: 70 + (i % 30),
      average_score: 60 + (i % 40),
    });
  }

  return students;
};

export const generateDemoTeachers = (count: number) => {
  const teachers = [];
  const subjects = demoData.academics.subjects;

  for (let i = 0; i < count; i++) {
    const firstName =
      i % 2 === 0
        ? `Dr. ${firstNames[i % firstNames.length]}`
        : `Mr. ${firstNames[i % firstNames.length]}`;
    const lastName = lastNames[i % lastNames.length];
    const teacherId = 200 + i;

    teachers.push({
      id: teacherId,
      institution_id: 1,
      user_id: 2000 + i,
      employee_id: `T${String(i + 1).padStart(3, '0')}`,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase().replace('. ', '')}.${lastName.toLowerCase()}@school.edu`,
      phone: `+1-555-${String(3000 + i).padStart(4, '0')}`,
      gender: i % 2 === 0 ? 'Female' : 'Male',
      qualification: i % 3 === 0 ? 'Ph.D.' : i % 3 === 1 ? 'M.Sc.' : 'M.A.',
      specialization: subjects[i % subjects.length].name,
      joining_date: `201${5 + (i % 5)}-0${(i % 9) + 1}-01`,
      is_active: i % 10 < 9,
      photo_url: `https://i.pravatar.cc/150?img=${30 + i}`,
      created_at: `201${5 + (i % 5)}-0${(i % 9) + 1}-01T09:00:00Z`,
      updated_at: '2024-01-10T14:00:00Z',
      subjects: [subjects[i % subjects.length]],
    });
  }

  return teachers;
};

export const generateDemoExams = (count: number) => {
  const exams = [];
  const examTypes = ['Mid-Term', 'Final', 'Unit Test', 'Monthly Test', 'Quiz'];
  const grades = [6, 7, 8, 9, 10, 11, 12];
  const subjects = demoData.academics.subjects;

  for (let i = 0; i < count; i++) {
    const examType = examTypes[i % examTypes.length];
    const gradeId = grades[i % grades.length];
    const subjectId = (i % subjects.length) + 1;
    const examId = 300 + i;

    exams.push({
      id: examId,
      institution_id: 1,
      exam_name: `${examType} - ${subjects[i % subjects.length].name}`,
      exam_type: examType,
      grade_id: gradeId,
      subject_id: subjectId,
      date: `2024-0${(i % 5) + 2}-${String((i % 28) + 1).padStart(2, '0')}`,
      start_time: '09:00:00',
      end_time: '12:00:00',
      duration_minutes: 180,
      total_marks: 100,
      passing_marks: 40,
      status: i % 4 < 3 ? 'completed' : 'scheduled',
      is_active: true,
      created_at: `2024-0${(i % 5) + 1}-01T09:00:00Z`,
      updated_at: '2024-02-01T10:30:00Z',
    });
  }

  return exams;
};

export const demoStudentsApi = {
  getStudentProfile: async (_id: number): Promise<StudentProfile> => {
    return Promise.resolve(demoData.student.profile);
  },

  getStudentDashboard: async (_id: number): Promise<StudentDashboardData> => {
    return Promise.resolve({
      student_id: demoData.student.profile.id,
      student_name: `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`,
      photo_url: demoData.student.profile.photo_url,
      section: demoData.student.profile.section?.name,
      grade: demoData.student.profile.section?.grade?.name,
      todays_attendance: {
        status: 'present',
        date: new Date().toISOString().split('T')[0],
      },
      attendance_summary: {
        total_days: demoData.student.attendance.summary.total_days,
        present_days: demoData.student.attendance.summary.present_days,
        absent_days: demoData.student.attendance.summary.absent_days,
        attendance_percentage: demoData.student.attendance.summary.attendance_percentage,
      },
      upcoming_assignments: demoData.academics.upcomingAssignments,
      pending_homework: [],
      recent_grades: demoData.academics.recentGrades,
      ai_prediction: undefined,
      weak_areas: [],
      study_streak: {
        current_streak: demoData.gamification.userPoints.current_streak,
        longest_streak: demoData.gamification.userPoints.longest_streak,
        last_activity: demoData.gamification.userPoints.last_activity_date || undefined,
      },
      points_and_rank: {
        total_points: demoData.gamification.userPoints.total_points,
        level: demoData.gamification.userPoints.level,
        rank: 3,
      },
      badges: demoData.gamification.userBadges
        .filter((ub) => ub.badge)
        .map((ub) => ({
          id: ub.badge!.id,
          name: ub.badge!.name,
          description: ub.badge!.description,
          icon_url: ub.badge!.icon_url || undefined,
          badge_type: ub.badge!.badge_type,
          rarity: ub.badge!.rarity,
          earned_at: ub.earned_at,
        })),
      todays_tasks: [],
      quick_links: [],
    });
  },
};

export const demoAssignmentsApi = {
  list: async (params?: AssignmentListParams) => {
    let filteredAssignments = [...demoData.academics.assignments];

    if (params?.grade_id) {
      filteredAssignments = filteredAssignments.filter((a) => a.grade_id === params.grade_id);
    }
    if (params?.section_id) {
      filteredAssignments = filteredAssignments.filter((a) => a.section_id === params.section_id);
    }
    if (params?.subject_id) {
      filteredAssignments = filteredAssignments.filter((a) => a.subject_id === params.subject_id);
    }
    if (params?.teacher_id) {
      filteredAssignments = filteredAssignments.filter((a) => a.teacher_id === params.teacher_id);
    }
    if (params?.status) {
      filteredAssignments = filteredAssignments.filter((a) => a.status === params.status);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredAssignments = filteredAssignments.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower)
      );
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedAssignments = filteredAssignments.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedAssignments,
      total: filteredAssignments.length,
      skip,
      limit,
    });
  },

  get: async (id: number): Promise<Assignment> => {
    const assignment = demoData.academics.assignments.find((a) => a.id === id);
    return Promise.resolve(assignment || demoData.academics.assignments[0]);
  },

  getWithRubric: async (id: number) => {
    const assignment = demoData.academics.assignments.find((a) => a.id === id);
    return Promise.resolve({
      ...(assignment || demoData.academics.assignments[0]),
      rubric_criteria: [],
    });
  },

  create: async (data: Record<string, unknown>): Promise<Assignment> => {
    const newAssignment: Assignment = {
      id: demoData.academics.assignments.length + 1,
      institution_id: data.institution_id as number,
      teacher_id: data.teacher_id as number,
      grade_id: data.grade_id as number,
      section_id: data.section_id as number | undefined,
      subject_id: data.subject_id as number,
      title: data.title as string,
      description: data.description as string | undefined,
      instructions: data.instructions as string | undefined,
      due_date: data.due_date as string | undefined,
      publish_date: data.publish_date as string | undefined,
      max_marks: data.max_marks as number,
      passing_marks: data.passing_marks as number | undefined,
      allow_late_submission: data.allow_late_submission as boolean,
      late_penalty_percentage: data.late_penalty_percentage as number | undefined,
      max_file_size_mb: data.max_file_size_mb as number,
      allowed_file_types: data.allowed_file_types as string | undefined,
      status: data.status as Assignment['status'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newAssignment);
  },

  update: async (id: number, data: Record<string, unknown>): Promise<Assignment> => {
    const assignment = demoData.academics.assignments.find((a) => a.id === id);
    return Promise.resolve({
      ...(assignment || demoData.academics.assignments[0]),
      ...data,
      updated_at: new Date().toISOString(),
    } as Assignment);
  },

  delete: async (_id: number): Promise<void> => {
    return Promise.resolve();
  },

  listSubmissions: async (assignmentId: number, params?: Record<string, unknown>) => {
    let submissions = demoData.academics.submissions.filter(
      (s) => s.assignment_id === assignmentId
    );

    if (params?.status) {
      submissions = submissions.filter((s) => s.status === params.status);
    }
    if (params?.is_late !== undefined) {
      submissions = submissions.filter((s) => s.is_late === params.is_late);
    }

    const skip = (params?.skip as number) || 0;
    const limit = (params?.limit as number) || 50;
    const paginatedSubmissions = submissions.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedSubmissions,
      total: submissions.length,
      skip,
      limit,
    });
  },

  getStatistics: async (assignmentId: number) => {
    const submissions = demoData.academics.submissions.filter(
      (s) => s.assignment_id === assignmentId
    );
    const graded = submissions.filter((s) => s.marks_obtained !== undefined);

    return Promise.resolve({
      total_submissions: submissions.length,
      graded_submissions: graded.length,
      pending_submissions: submissions.length - graded.length,
      average_marks:
        graded.length > 0
          ? graded.reduce((sum, s) => sum + (s.marks_obtained || 0), 0) / graded.length
          : 0,
      highest_marks: graded.length > 0 ? Math.max(...graded.map((s) => s.marks_obtained || 0)) : 0,
      lowest_marks: graded.length > 0 ? Math.min(...graded.map((s) => s.marks_obtained || 0)) : 0,
    });
  },

  getAnalytics: async (assignmentId: number) => {
    return Promise.resolve({
      assignment_id: assignmentId,
      grade_distribution: {
        A: 2,
        'B+': 1,
      },
      submission_timeline: [],
      performance_by_section: [],
    });
  },

  uploadFile: async (_id: number, _file: File) => {
    return Promise.resolve({
      id: 1,
      assignment_id: _id,
      file_name: _file.name,
      file_size: _file.size,
      file_type: _file.type,
      file_url: 'https://example.com/file.pdf',
      s3_key: 'assignments/1/file.pdf',
      uploaded_at: new Date().toISOString(),
    });
  },

  deleteFile: async (_assignmentId: number, _fileId: number): Promise<void> => {
    return Promise.resolve();
  },

  createRubricCriteria: async (_assignmentId: number, _criteria: Record<string, unknown>) => {
    return Promise.resolve({
      id: 1,
      assignment_id: _assignmentId,
      ..._criteria,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  bulkDownloadSubmissions: async (_assignmentId: number): Promise<Blob> => {
    return Promise.resolve(new Blob(['Demo submissions'], { type: 'application/zip' }));
  },
};

export const demoSubmissionsApi = {
  get: async (id: number) => {
    const submission = demoData.academics.submissions.find((s) => s.id === id);
    return Promise.resolve(submission || demoData.academics.submissions[0]);
  },

  grade: async (id: number, data: Record<string, unknown>) => {
    const submission = demoData.academics.submissions.find((s) => s.id === id);
    return Promise.resolve({
      ...(submission || demoData.academics.submissions[0]),
      ...data,
    });
  },
};

export const demoAttendanceApi = {
  listAttendances: async (params: {
    start_date?: string;
    end_date?: string;
    section_id?: number;
    subject_id?: number;
    student_id?: number;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<AttendanceListResponse> => {
    return Promise.resolve({
      items: [],
      total: 0,
      skip: params.skip || 0,
      limit: params.limit || 50,
    });
  },

  getStudentDetailedReport: async (
    studentId: number,
    _startDate: string,
    _endDate: string,
    _subjectId?: number
  ): Promise<StudentAttendanceDetail> => {
    return Promise.resolve({
      student_id: studentId,
      student_name: `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`,
      admission_number: demoData.student.profile.admission_number,
      attendances: demoData.student.attendance.monthly.map((a) => ({
        date: a.date,
        status: a.status,
        subject_id: undefined,
        subject_name: undefined,
        marked_by_id: undefined,
        remarks: undefined,
      })),
      total_days: demoData.student.attendance.summary.total_days,
      present_days: demoData.student.attendance.summary.present_days,
      absent_days: demoData.student.attendance.summary.absent_days,
      late_days: demoData.student.attendance.summary.late_days,
      half_days: demoData.student.attendance.summary.half_days,
      attendance_percentage: demoData.student.attendance.summary.attendance_percentage,
    });
  },

  getSectionReport: async (
    _sectionId: number,
    _startDate: string,
    _endDate: string,
    _subjectId?: number
  ) => {
    return Promise.resolve([
      {
        student_id: demoData.student.profile.id,
        student_name: `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`,
        admission_number: demoData.student.profile.admission_number,
        total_days: demoData.student.attendance.summary.total_days,
        present_days: demoData.student.attendance.summary.present_days,
        absent_days: demoData.student.attendance.summary.absent_days,
        late_days: demoData.student.attendance.summary.late_days,
        half_days: demoData.student.attendance.summary.half_days,
        attendance_percentage: demoData.student.attendance.summary.attendance_percentage,
      },
    ]);
  },

  getDefaulters: async (
    _startDate: string,
    _endDate: string,
    _thresholdPercentage: number = 75.0,
    _sectionId?: number,
    _subjectId?: number
  ) => {
    return Promise.resolve([]);
  },

  bulkMarkAttendance: async (_data: Record<string, unknown>) => {
    const attendances = _data.attendances as unknown[] | undefined;
    return Promise.resolve({
      success: attendances?.length || 0,
      failed: 0,
      errors: [],
    });
  },
};

export const demoExaminationsApi = {
  listExams: async (params: ExamListParams): Promise<ExamListResponse> => {
    return Promise.resolve({
      items: [],
      total: 0,
      skip: params.skip || 0,
      limit: params.limit || 50,
    });
  },

  getStudentResult: async (
    examId: number,
    _studentId: number,
    _institutionId: number
  ): Promise<ExamResult> => {
    const result = demoData.academics.examResults.find((r) => r.exam_id === examId);
    return Promise.resolve(result || demoData.academics.examResults[0]);
  },

  listResults: async (
    examId: number,
    _institutionId: number,
    _sectionId?: number
  ): Promise<ExamResult[]> => {
    const results = demoData.academics.examResults.filter((r) => r.exam_id === examId);
    return Promise.resolve(results.length > 0 ? results : [demoData.academics.examResults[0]]);
  },
};

export const demoAIPredictionDashboardApi = {
  getDashboard: async (
    board: string,
    gradeId: number,
    subjectId: number
  ): Promise<AIPredictionDashboardResponse> => {
    const subject = demoData.academics.subjects.find((s) => s.id === subjectId);
    return Promise.resolve({
      board,
      grade_id: gradeId,
      subject_id: subjectId,
      subject_name: subject?.name || 'Mathematics',
      generated_at: new Date().toISOString(),
      topic_rankings: demoData.aiPrediction.topicProbabilities,
      predicted_blueprint: {
        total_marks: 100,
        duration_minutes: 180,
        sections: [],
        topic_coverage: {},
        difficulty_breakdown: {},
      },
      marks_distribution: demoData.aiPrediction.marksDistribution,
      focus_areas: demoData.aiPrediction.focusAreas,
      study_time_allocation: demoData.aiPrediction.studyTimeAllocation,
      overall_prediction: {},
    });
  },

  generateStudyPlan: async (request: Record<string, unknown>) => {
    return Promise.resolve({
      exam_date: request.exam_date,
      days_until_exam: Math.ceil(
        (new Date(request.exam_date as string).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      total_study_hours: (request.available_hours_per_day as number) * 30,
      weeks: [],
      completion_percentage: 0,
      milestone_dates: {},
    });
  },

  simulateWhatIfScenario: async (_request: Record<string, unknown>) => {
    return Promise.resolve({
      current_predicted_score: 85,
      projected_score: 90,
      score_improvement: 5,
      confidence_level: 'High',
      prediction_changes: [],
      recommended_adjustments: [],
      risk_factors: [],
    });
  },

  activateCrashCourseMode: async (
    _board: string,
    _gradeId: number,
    _subjectId: number,
    daysUntilExam: number
  ) => {
    return Promise.resolve({
      days_until_exam: daysUntilExam,
      mode_activated: true,
      priority_topics: [],
      daily_schedule: [],
      quick_wins: [],
      topics_to_skip: [],
      estimated_coverage: 85,
      expected_score_range: {
        min: 80,
        max: 95,
      },
    });
  },
};

export const demoGamificationApi = {
  getUserPoints: async (_userId: number, _institutionId: number): Promise<UserPoints> => {
    return Promise.resolve(demoData.gamification.userPoints);
  },

  getPointHistory: async (
    _userId: number,
    _institutionId: number,
    limit = 50
  ): Promise<PointHistory[]> => {
    return Promise.resolve(demoData.gamification.pointHistory.slice(0, limit));
  },

  getUserBadges: async (_userId: number, _institutionId: number): Promise<UserBadge[]> => {
    return Promise.resolve(demoData.gamification.userBadges);
  },

  getBadges: async (_institutionId: number): Promise<Badge[]> => {
    return Promise.resolve(demoData.gamification.badges);
  },

  getUserAchievements: async (_userId: number, _institutionId: number) => {
    return Promise.resolve([]);
  },

  getAchievements: async (_institutionId: number) => {
    return Promise.resolve([]);
  },

  getLeaderboards: async (_institutionId: number) => {
    return Promise.resolve([]);
  },

  getLeaderboardWithEntries: async (leaderboardId: number) => {
    return Promise.resolve({
      id: leaderboardId,
      institution_id: 1,
      name: 'Monthly Points Leaderboard',
      description: 'Top students by points this month',
      period_type: 'monthly',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entries: demoData.gamification.leaderboard,
    });
  },

  getDynamicLeaderboard: async (
    _institutionId: number,
    _filter: Record<string, unknown>,
    _currentUserId?: number,
    limit = 50
  ): Promise<LeaderboardEntry[]> => {
    return Promise.resolve(demoData.gamification.leaderboard.slice(0, limit));
  },

  getUserStreaks: async (userId: number, institutionId: number) => {
    return Promise.resolve([
      {
        id: 1,
        institution_id: institutionId,
        user_id: userId,
        streak_type: 'daily_login',
        current_streak: demoData.gamification.userPoints.current_streak,
        longest_streak: demoData.gamification.userPoints.longest_streak,
        last_activity_date: demoData.gamification.userPoints.last_activity_date,
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  },

  recordDailyLogin: async (_userId: number, _institutionId: number) => {
    return Promise.resolve({
      message: 'Daily login recorded',
      streak: demoData.gamification.userPoints.current_streak,
      points_earned: 10,
    });
  },

  getUserStats: async (userId: number, _institutionId: number) => {
    return Promise.resolve({
      user_id: userId,
      total_points: demoData.gamification.userPoints.total_points,
      level: demoData.gamification.userPoints.level,
      current_streak: demoData.gamification.userPoints.current_streak,
      longest_streak: demoData.gamification.userPoints.longest_streak,
      badges_count: demoData.gamification.userBadges.length,
      achievements_count: 0,
      rank: 3,
      points_to_next_level: 200,
      level_progress_percentage: 75,
    });
  },

  getUserShowcase: async (userId: number, _institutionId: number) => {
    return Promise.resolve({
      user_id: userId,
      username: 'liam.anderson',
      first_name: 'Liam',
      last_name: 'Anderson',
      total_points: demoData.gamification.userPoints.total_points,
      level: demoData.gamification.userPoints.level,
      current_streak: demoData.gamification.userPoints.current_streak,
      longest_streak: demoData.gamification.userPoints.longest_streak,
      badges: demoData.gamification.userBadges.slice(0, 3),
      achievements: [],
      recent_activities: [],
      rank: 3,
    });
  },

  getRewards: async (_institutionId: number) => {
    return Promise.resolve([]);
  },

  getUserRedemptions: async (_userId: number, _institutionId: number) => {
    return Promise.resolve([]);
  },

  redeemReward: async (userId: number, rewardId: number, institutionId: number) => {
    return Promise.resolve({
      id: 1,
      institution_id: institutionId,
      user_id: userId,
      reward_id: rewardId,
      points_spent: 100,
      status: 'pending' as const,
      redeemed_at: new Date().toISOString(),
      processed_at: null,
      notes: null,
    });
  },
};

export const demoGoalsApi = {
  getGoals: async (): Promise<Goal[]> => {
    return Promise.resolve(demoData.goals);
  },

  getGoal: async (id: string): Promise<Goal> => {
    const goal = demoData.goals.find((g) => g.id === id);
    return Promise.resolve(goal || demoData.goals[0]);
  },

  createGoal: async (data: Record<string, unknown>): Promise<Goal> => {
    const goalData = data as Partial<Goal>;
    return Promise.resolve({
      id: String(demoData.goals.length + 1),
      title: goalData.title || 'New Goal',
      description: goalData.description || '',
      type: (goalData.type as Goal['type']) || 'performance',
      status: 'not_started',
      specific: goalData.specific || '',
      measurable: goalData.measurable || '',
      achievable: goalData.achievable || '',
      relevant: goalData.relevant || '',
      timeBound: goalData.timeBound || '',
      startDate: goalData.startDate || new Date().toISOString(),
      targetDate: goalData.targetDate || new Date().toISOString(),
      progress: 0,
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  updateGoal: async (id: string, data: Record<string, unknown>): Promise<Goal> => {
    const goal = demoData.goals.find((g) => g.id === id);
    return Promise.resolve({
      ...(goal || demoData.goals[0]),
      ...data,
      updatedAt: new Date().toISOString(),
    } as Goal);
  },

  deleteGoal: async (_id: string): Promise<void> => {
    return Promise.resolve();
  },

  updateMilestoneProgress: async (
    goalId: string,
    _milestoneId: string,
    _progress: number
  ): Promise<Goal> => {
    const goal = demoData.goals.find((g) => g.id === goalId);
    return Promise.resolve(goal || demoData.goals[0]);
  },

  completeMilestone: async (goalId: string, _milestoneId: string): Promise<Goal> => {
    const goal = demoData.goals.find((g) => g.id === goalId);
    return Promise.resolve(goal || demoData.goals[0]);
  },

  getAnalytics: async (): Promise<GoalAnalytics> => {
    const totalGoals = demoData.goals.length;
    const completedGoals = demoData.goals.filter((g) => g.status === 'completed').length;
    const inProgressGoals = demoData.goals.filter((g) => g.status === 'in_progress').length;
    const notStartedGoals = demoData.goals.filter((g) => g.status === 'not_started').length;

    return Promise.resolve({
      totalGoals,
      completedGoals,
      completionRate: (completedGoals / totalGoals) * 100,
      averageProgress: demoData.goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals,
      goalsByType: {
        performance: demoData.goals.filter((g) => g.type === 'performance').length,
        behavioral: demoData.goals.filter((g) => g.type === 'behavioral').length,
        skill: demoData.goals.filter((g) => g.type === 'skill').length,
      },
      goalsByStatus: {
        not_started: notStartedGoals,
        in_progress: inProgressGoals,
        completed: completedGoals,
        overdue: 0,
      },
      impactCorrelation: {
        academicPerformance: 0.75,
        attendanceRate: 0.82,
        assignmentCompletion: 0.68,
      },
      monthlyProgress: [],
    });
  },
};

export const demoAnalyticsApi = {
  getDashboardStats: async (_institutionId?: string) => {
    return Promise.resolve({
      total_users: 1500,
      active_users_today: 350,
      active_users_week: 1200,
      active_users_month: 1450,
      total_sessions: 5000,
      avg_session_duration: 1800,
      total_page_views: 25000,
      avg_pages_per_session: 5,
    });
  },

  getFeatureAdoption: async (_institutionId?: string, _limit = 20) => {
    return Promise.resolve([]);
  },

  getUserFlow: async (_institutionId?: string, _limit = 10) => {
    return Promise.resolve({
      nodes: [],
      total_sessions: 0,
    });
  },

  getRetentionCohorts: async (_institutionId?: string, _cohortDays = 30) => {
    return Promise.resolve([]);
  },

  getTopEvents: async (_institutionId?: string, _limit = 20) => {
    return Promise.resolve([]);
  },

  getPerformanceStats: async (_metricName?: string, _days = 7) => {
    return Promise.resolve([]);
  },

  getClassPerformanceAnalytics: async (
    classId: number,
    periodStart?: string,
    periodEnd?: string
  ) => {
    return Promise.resolve({
      class_id: classId,
      grade: '10th Grade',
      section: 'A',
      teacher_id: 1,
      teacher_name: 'John Smith',
      period_start: periodStart || '2024-01-01',
      period_end: periodEnd || new Date().toISOString(),
      total_students: 45,
      score_trends: [],
      student_distribution: [],
      subject_difficulty: [],
      top_performers: [],
      bottom_performers: [],
      class_statistics: {
        averageScore: 85.5,
        medianScore: 84.0,
        attendanceRate: 92.3,
        assignmentCompletionRate: 88.7,
      },
    });
  },

  getInstitutionAnalytics: async (
    institutionId: number,
    _periodStart?: string,
    _periodEnd?: string
  ) => {
    return Promise.resolve({
      institution_id: institutionId,
      total_students: 1200,
      total_teachers: 80,
      overall_performance: 82.3,
      department_performance: [],
      grade_performance: [],
      trends: [],
    });
  },

  getStudentPerformanceAnalytics: async (
    studentId: number,
    periodStart?: string,
    periodEnd?: string
  ): Promise<StudentPerformanceAnalytics> => {
    return Promise.resolve({
      student_id: studentId,
      student_name: `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`,
      grade: demoData.student.profile.section?.grade?.name || '10th Grade',
      section: demoData.student.profile.section?.name || 'A',
      period_start: periodStart || '2024-01-01',
      period_end: periodEnd || '2024-12-31',
      subject_trends: [],
      attendance_calendar: [],
      assignment_stats: {
        submitted: 20,
        pending: 5,
        late: 3,
        total: 25,
        submissionRate: 80,
      },
      exam_comparisons: [],
      chapter_mastery: [],
      overall_performance: {
        averageScore: demoData.analytics.overall_average,
        trend: 'improving',
        rank: demoData.analytics.rank_in_class,
        totalStudents: demoData.analytics.total_students,
      },
    });
  },

  generateCustomReport: async (filters: Record<string, unknown>) => {
    return Promise.resolve({
      report_id: '1',
      title: 'Custom Report',
      generated_at: new Date().toISOString(),
      filters,
      data: {},
    });
  },

  exportReportToPDF: async (_reportData: Record<string, unknown>): Promise<Blob> => {
    return Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' }));
  },

  exportReportToExcel: async (_reportData: Record<string, unknown>): Promise<Blob> => {
    return Promise.resolve(new Blob(['Excel content'], { type: 'application/vnd.ms-excel' }));
  },
};

export const demoTeachersApi = {
  getTeacherProfile: async (teacherId: number): Promise<Teacher> => {
    const teacher = demoData.academics.teachers.find((t) => t.id === teacherId);
    return Promise.resolve(teacher || demoData.academics.teachers[0]);
  },

  getTeacherDashboard: async (_teacherId: number): Promise<TeacherMyDashboardData> => {
    return Promise.resolve(teacherDashboardData);
  },

  getClassAssignments: async (_teacherId: number): Promise<ClassAssignment[]> => {
    return Promise.resolve(
      teacherDashboardData.my_classes.map((c) => ({
        id: c.class_id,
        class_name: c.class_name,
        section: c.section,
        subject: c.subject,
        student_count: c.student_count,
      }))
    );
  },

  getPendingGrading: async (_teacherId: number) => {
    return Promise.resolve(teacherDashboardData.pending_grading);
  },

  getClassRoster: async (
    _classId: number,
    _sectionId?: number,
    _date?: string
  ): Promise<{
    class_name: string;
    section: string;
    subject: string;
    date: string;
    students: typeof demoData.teacher.classRoster;
  }> => {
    return Promise.resolve({
      class_name: '10th Grade',
      section: 'A',
      subject: 'Mathematics',
      date: _date || new Date().toISOString().split('T')[0],
      students: demoData.teacher.classRoster,
    });
  },

  markAttendance: async (
    _classId: number,
    _date: string,
    _attendanceData: Array<{ student_id: number; status: string; remarks?: string }>
  ): Promise<{ message: string; marked_count: number }> => {
    return Promise.resolve({
      message: 'Attendance marked successfully',
      marked_count: _attendanceData.length,
    });
  },

  getAssignmentSubmissions: async (
    assignmentId: number,
    params?: {
      status?: string;
      section_id?: number;
      skip?: number;
      limit?: number;
    }
  ): Promise<{
    assignment: (typeof demoData.academics.assignments)[0];
    submissions: typeof demoData.teacher.studentSubmissions;
    total: number;
    graded: number;
    pending: number;
  }> => {
    const assignment = demoData.academics.assignments.find((a) => a.id === assignmentId);
    let submissions = [...demoData.teacher.studentSubmissions];

    if (params?.status) {
      submissions = submissions.filter((s) => s.status === params.status);
    }

    const graded = submissions.filter((s) => s.status === 'graded').length;
    const pending = submissions.filter((s) => s.status === 'submitted').length;

    return Promise.resolve({
      assignment: assignment || demoData.academics.assignments[0],
      submissions,
      total: submissions.length,
      graded,
      pending,
    });
  },

  gradeSubmission: async (
    _submissionId: number,
    data: {
      marks_obtained: number;
      grade?: string;
      feedback?: string;
    }
  ): Promise<{ message: string; submission: (typeof demoData.teacher.studentSubmissions)[0] }> => {
    const submission = demoData.teacher.studentSubmissions.find(
      (s) => s.submission_id === _submissionId
    );
    const updatedSubmission = {
      ...(submission || demoData.teacher.studentSubmissions[0]),
      ...data,
      status: 'graded' as const,
    };

    return Promise.resolve({
      message: 'Submission graded successfully',
      submission: updatedSubmission,
    });
  },

  bulkGradeSubmissions: async (
    _assignmentId: number,
    _grades: Array<{
      submission_id: number;
      marks_obtained: number;
      grade?: string;
      feedback?: string;
    }>
  ): Promise<{ message: string; graded_count: number }> => {
    return Promise.resolve({
      message: 'Submissions graded successfully',
      graded_count: _grades.length,
    });
  },

  getExamMarksEntry: async (
    examId: number,
    _sectionId?: number
  ): Promise<{
    exam_id: number;
    exam_name: string;
    subject: string;
    max_marks: number;
    has_practical: boolean;
    students: typeof demoData.teacher.examMarksEntries;
  }> => {
    return Promise.resolve({
      exam_id: examId,
      exam_name: 'Mid-Term Examination',
      subject: 'Mathematics',
      max_marks: 100,
      has_practical: false,
      students: demoData.teacher.examMarksEntries,
    });
  },

  submitExamMarks: async (
    _examId: number,
    _marks: Array<{
      student_id: number;
      theory_marks?: number;
      practical_marks?: number;
      is_absent: boolean;
      remarks?: string;
    }>
  ): Promise<{ message: string; submitted_count: number }> => {
    return Promise.resolve({
      message: 'Exam marks submitted successfully',
      submitted_count: _marks.length,
    });
  },

  updateExamMarks: async (
    _examResultId: number,
    _data: {
      theory_marks?: number;
      practical_marks?: number;
      is_absent?: boolean;
      remarks?: string;
    }
  ): Promise<{ message: string }> => {
    return Promise.resolve({
      message: 'Exam marks updated successfully',
    });
  },

  getParentMessages: async (params?: {
    is_read?: boolean;
    priority?: string;
    student_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<{
    messages: typeof demoData.teacher.parentMessages;
    total: number;
    unread_count: number;
  }> => {
    let messages = [...demoData.teacher.parentMessages];

    if (params?.is_read !== undefined) {
      messages = messages.filter((m) => m.is_read === params.is_read);
    }

    if (params?.priority) {
      messages = messages.filter((m) => m.priority === params.priority);
    }

    if (params?.student_id) {
      messages = messages.filter((m) => m.student_id === params.student_id);
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedMessages = messages.slice(skip, skip + limit);

    const unread_count = demoData.teacher.parentMessages.filter((m) => !m.is_read).length;

    return Promise.resolve({
      messages: paginatedMessages,
      total: messages.length,
      unread_count,
    });
  },

  getParentMessage: async (
    messageId: number
  ): Promise<(typeof demoData.teacher.parentMessages)[0]> => {
    const message = demoData.teacher.parentMessages.find((m) => m.id === messageId);
    return Promise.resolve(message || demoData.teacher.parentMessages[0]);
  },

  replyToParentMessage: async (
    messageId: number,
    reply: string
  ): Promise<{
    message: string;
    updated_message: (typeof demoData.teacher.parentMessages)[0];
  }> => {
    const message = demoData.teacher.parentMessages.find((m) => m.id === messageId);
    const updatedMessage = {
      ...(message || demoData.teacher.parentMessages[0]),
      reply,
      replied_at: new Date().toISOString(),
      is_read: true,
    };

    return Promise.resolve({
      message: 'Reply sent successfully',
      updated_message: updatedMessage,
    });
  },

  markMessageAsRead: async (_messageId: number): Promise<{ message: string }> => {
    return Promise.resolve({
      message: 'Message marked as read',
    });
  },

  sendMessageToParent: async (data: {
    parent_id: number;
    student_id: number;
    subject: string;
    message: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<{
    message: string;
    sent_message: (typeof demoData.teacher.parentMessages)[0];
  }> => {
    const newMessage = {
      id: demoData.teacher.parentMessages.length + 1,
      parent_id: data.parent_id,
      parent_name: 'Parent Name',
      student_id: data.student_id,
      student_name: 'Student Name',
      subject: data.subject,
      message: data.message,
      sent_at: new Date().toISOString(),
      is_read: true,
      priority: data.priority || 'medium',
    };

    return Promise.resolve({
      message: 'Message sent successfully',
      sent_message: newMessage,
    });
  },

  getClassPerformanceAnalytics: async (
    classId: number,
    _sectionId?: number,
    params?: {
      start_date?: string;
      end_date?: string;
      subject_id?: number;
    }
  ): Promise<{
    class_id: number;
    class_name: string;
    section: string;
    subject: string;
    period_start: string;
    period_end: string;
    total_students: number;
    average_score: number;
    average_attendance: number;
    students: typeof demoData.teacher.studentPerformanceMetrics;
    subject_performance: Array<{
      subject: string;
      average_score: number;
      highest_score: number;
      lowest_score: number;
      pass_rate: number;
    }>;
    performance_distribution: {
      excellent: number;
      good: number;
      average: number;
      below_average: number;
      poor: number;
    };
    attendance_trends: Array<{
      week: string;
      attendance_percentage: number;
    }>;
    top_performers: typeof demoData.teacher.studentPerformanceMetrics;
    students_needing_attention: typeof demoData.teacher.studentPerformanceMetrics;
  }> => {
    const students = demoData.teacher.studentPerformanceMetrics;
    const avgScore = students.reduce((sum, s) => sum + s.average_score, 0) / students.length;
    const avgAttendance =
      students.reduce((sum, s) => sum + s.attendance_percentage, 0) / students.length;

    return Promise.resolve({
      class_id: classId,
      class_name: '10th Grade',
      section: 'A',
      subject: 'Mathematics',
      period_start: params?.start_date || '2024-01-01',
      period_end: params?.end_date || '2024-02-15',
      total_students: students.length,
      average_score: avgScore,
      average_attendance: avgAttendance,
      students,
      subject_performance: [
        {
          subject: 'Mathematics',
          average_score: 89.2,
          highest_score: 98,
          lowest_score: 75,
          pass_rate: 95,
        },
        {
          subject: 'Physics',
          average_score: 86.5,
          highest_score: 96,
          lowest_score: 72,
          pass_rate: 92,
        },
        {
          subject: 'Chemistry',
          average_score: 87.3,
          highest_score: 94,
          lowest_score: 70,
          pass_rate: 93,
        },
      ],
      performance_distribution: {
        excellent: 3,
        good: 3,
        average: 2,
        below_average: 0,
        poor: 0,
      },
      attendance_trends: [
        { week: 'Week 1', attendance_percentage: 92.5 },
        { week: 'Week 2', attendance_percentage: 94.2 },
        { week: 'Week 3', attendance_percentage: 91.8 },
        { week: 'Week 4', attendance_percentage: 93.7 },
        { week: 'Week 5', attendance_percentage: 95.1 },
        { week: 'Week 6', attendance_percentage: 92.9 },
      ],
      top_performers: students.slice(0, 3),
      students_needing_attention: students.filter(
        (s) => s.average_score < 87 || s.attendance_percentage < 92
      ),
    });
  },

  getStudentPerformanceDetail: async (
    studentId: number,
    _params?: {
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{
    student: (typeof demoData.teacher.studentPerformanceMetrics)[0];
    subject_breakdown: Array<{
      subject: string;
      average_score: number;
      trend: 'improving' | 'stable' | 'declining';
      assignments_completed: number;
      total_assignments: number;
      attendance_percentage: number;
    }>;
    recent_grades: Array<{
      assignment_name: string;
      subject: string;
      marks_obtained: number;
      max_marks: number;
      date: string;
    }>;
    attendance_history: Array<{
      date: string;
      status: string;
    }>;
  }> => {
    const student = demoData.teacher.studentPerformanceMetrics.find(
      (s) => s.student_id === studentId
    );

    return Promise.resolve({
      student: student || demoData.teacher.studentPerformanceMetrics[0],
      subject_breakdown: [
        {
          subject: 'Mathematics',
          average_score: 92.0,
          trend: 'improving',
          assignments_completed: 8,
          total_assignments: 8,
          attendance_percentage: 95.0,
        },
        {
          subject: 'Physics',
          average_score: 88.5,
          trend: 'stable',
          assignments_completed: 7,
          total_assignments: 8,
          attendance_percentage: 93.0,
        },
        {
          subject: 'Chemistry',
          average_score: 85.0,
          trend: 'declining',
          assignments_completed: 6,
          total_assignments: 9,
          attendance_percentage: 91.0,
        },
      ],
      recent_grades: [
        {
          assignment_name: 'Quadratic Equations',
          subject: 'Mathematics',
          marks_obtained: 92,
          max_marks: 100,
          date: '2024-02-10',
        },
        {
          assignment_name: "Newton's Laws",
          subject: 'Physics',
          marks_obtained: 88,
          max_marks: 100,
          date: '2024-02-08',
        },
        {
          assignment_name: 'Chemical Bonding',
          subject: 'Chemistry',
          marks_obtained: 85,
          max_marks: 100,
          date: '2024-02-05',
        },
      ],
      attendance_history: demoData.student.attendance.monthly.map((a) => ({
        date: a.date,
        status: a.status,
      })),
    });
  },

  exportClassPerformanceReport: async (
    _classId: number,
    _sectionId?: number,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<Blob> => {
    const content = format === 'pdf' ? 'PDF Report Content' : 'Excel Report Content';
    const mimeType =
      format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return Promise.resolve(new Blob([content], { type: mimeType }));
  },
};

export const demoParentsApi = {
  getDashboard: async (childId?: number): Promise<ParentDashboard> => {
    if (childId) {
      const child = parentDashboardData.children.find((c) => c.id === childId);
      if (child) {
        const childKey = childId === 1101 ? 'child1' : 'child2';
        const gradesData =
          demoData.parent.gradesMonitor[childKey as keyof typeof demoData.parent.gradesMonitor];

        return Promise.resolve({
          ...parentDashboardData,
          selected_child: child as ChildOverview,
          recent_grades: gradesData.recent_grades,
          today_attendance:
            childId === 1101
              ? parentDashboardData.today_attendance
              : {
                  date: '2024-02-15',
                  status: 'absent',
                  is_absent: true,
                  is_present: false,
                  is_late: false,
                  is_half_day: false,
                  alert_sent: true,
                },
        });
      }
    }
    return Promise.resolve(parentDashboardData);
  },

  getChildren: async (): Promise<ChildOverview[]> => {
    return Promise.resolve(parentDashboardData.children as ChildOverview[]);
  },

  getChildOverview: async (childId: number): Promise<ChildOverview> => {
    const child = parentDashboardData.children.find((c) => c.id === childId);
    return Promise.resolve((child || parentDashboardData.children[0]) as ChildOverview);
  },

  getTodayAttendance: async (childId: number): Promise<TodayAttendance> => {
    if (childId === 1102) {
      return Promise.resolve({
        date: '2024-02-15',
        status: 'absent',
        is_absent: true,
        is_present: false,
        is_late: false,
        is_half_day: false,
        alert_sent: true,
      });
    }
    return Promise.resolve(
      parentDashboardData.today_attendance || {
        date: '2024-02-15',
        status: 'present',
        is_absent: false,
        is_present: true,
        is_late: false,
        is_half_day: false,
        alert_sent: false,
      }
    );
  },

  getRecentGrades: async (childId: number, limit = 10): Promise<RecentGrade[]> => {
    const childKey = childId === 1101 ? 'child1' : 'child2';
    const gradesData =
      demoData.parent.gradesMonitor[childKey as keyof typeof demoData.parent.gradesMonitor];
    return Promise.resolve(gradesData.recent_grades.slice(0, limit));
  },

  getPendingAssignments: async (childId: number): Promise<PendingAssignment[]> => {
    if (childId === 1102) {
      return Promise.resolve([
        {
          id: 211,
          title: 'Math Homework - Fractions',
          subject_name: 'Mathematics',
          due_date: '2024-02-17T23:59:59Z',
          days_remaining: 2,
          description: 'Complete exercises 1-20 from the textbook',
          max_marks: 50,
          is_overdue: false,
        },
        {
          id: 212,
          title: 'Science Lab Report',
          subject_name: 'Science',
          due_date: '2024-02-20T23:59:59Z',
          days_remaining: 5,
          description: 'Write a lab report on the water cycle experiment',
          max_marks: 75,
          is_overdue: false,
        },
        {
          id: 213,
          title: 'English Reading Comprehension',
          subject_name: 'English',
          due_date: '2024-02-14T23:59:59Z',
          days_remaining: -1,
          description: 'Answer questions from Chapter 5',
          max_marks: 40,
          is_overdue: true,
        },
      ]);
    }
    return Promise.resolve(parentDashboardData.pending_assignments);
  },

  getWeeklyProgress: async (childId: number): Promise<WeeklyProgress> => {
    if (childId === 1102) {
      return Promise.resolve({
        week_start: '2024-02-12',
        week_end: '2024-02-18',
        attendance_days: 5,
        present_days: 3,
        assignments_completed: 1,
        assignments_pending: 5,
        average_score: 70.5,
        subject_performance: [
          {
            subject_name: 'Mathematics',
            average_score: 68.5,
            total_assignments: 3,
            completed_assignments: 1,
            pending_assignments: 2,
            attendance_percentage: 60.0,
          },
          {
            subject_name: 'Science',
            average_score: 72.0,
            total_assignments: 2,
            completed_assignments: 1,
            pending_assignments: 1,
            attendance_percentage: 80.0,
          },
        ],
      });
    }
    return Promise.resolve(
      parentDashboardData.weekly_progress || {
        week_start: '2024-02-12',
        week_end: '2024-02-18',
        attendance_days: 5,
        present_days: 5,
        assignments_completed: 3,
        assignments_pending: 3,
        average_score: 88.7,
        subject_performance: [],
      }
    );
  },

  getPerformanceComparison: async (childId: number): Promise<PerformanceComparison> => {
    if (childId === 1102) {
      return Promise.resolve({
        current_term: 'Term 2',
        previous_term: 'Term 1',
        current_term_data: [
          {
            term_name: 'Term 2',
            subject_name: 'Mathematics',
            average_marks: 68,
            total_marks: 100,
            percentage: 68.0,
            grade: 'C+',
          },
          {
            term_name: 'Term 2',
            subject_name: 'Science',
            average_marks: 72,
            total_marks: 100,
            percentage: 72.0,
            grade: 'B',
          },
        ],
        previous_term_data: [
          {
            term_name: 'Term 1',
            subject_name: 'Mathematics',
            average_marks: 70,
            total_marks: 100,
            percentage: 70.0,
            grade: 'B',
          },
          {
            term_name: 'Term 1',
            subject_name: 'Science',
            average_marks: 75,
            total_marks: 100,
            percentage: 75.0,
            grade: 'B',
          },
        ],
        improvement_subjects: [],
        declined_subjects: ['Mathematics', 'Science'],
        overall_improvement: -3.5,
      });
    }
    return Promise.resolve(
      parentDashboardData.performance_comparison || {
        current_term: 'Term 2',
        previous_term: 'Term 1',
        current_term_data: [],
        previous_term_data: [],
        improvement_subjects: [],
        declined_subjects: [],
        overall_improvement: 0,
      }
    );
  },

  getChildGoals: async (
    childId: number
  ): Promise<{ goals: GoalProgress[]; total: number; active: number; completed: number }> => {
    if (childId === 1102) {
      const goals = [
        {
          id: 20,
          title: 'Improve Math Grade to B',
          description: 'Focus on homework completion and test preparation',
          goal_type: 'academic',
          target_value: 75,
          current_value: 68,
          progress_percentage: 90.7,
          status: 'in_progress',
          start_date: '2024-01-01',
          end_date: '2024-03-31',
          days_remaining: 45,
        },
        {
          id: 21,
          title: 'Improve Attendance to 85%',
          description: 'Better attendance is critical for academic success',
          goal_type: 'behavioral',
          target_value: 85,
          current_value: 78.5,
          progress_percentage: 92.4,
          status: 'at_risk',
          start_date: '2024-01-01',
          end_date: '2024-06-30',
          days_remaining: 135,
        },
      ];
      return Promise.resolve({
        goals,
        total: goals.length,
        active: goals.filter((g) => g.status === 'in_progress' || g.status === 'at_risk').length,
        completed: 0,
      });
    }

    const goals = parentDashboardData.goals;
    return Promise.resolve({
      goals,
      total: goals.length,
      active: goals.filter((g) => g.status === 'in_progress').length,
      completed: goals.filter((g) => g.status === 'completed').length,
    });
  },

  getFamilyOverviewMetrics: async () => {
    const children = parentDashboardData.children as ChildOverview[];
    return Promise.resolve({
      total_children: children.length,
      total_assignments_due: 5,
      upcoming_events_count: 3,
      average_attendance:
        children.reduce((sum, c) => sum + (c.attendance_percentage || 0), 0) / children.length,
      children_metrics: children.map((c) => ({
        child_id: c.id,
        child_name: `${c.first_name} ${c.last_name}`,
        assignments_due: c.id === 1101 ? 2 : 3,
        attendance_percentage: c.attendance_percentage || 0,
        average_score: c.average_score || 0,
      })),
    });
  },

  getFamilyCalendarEvents: async (_startDate: string, _endDate: string, childIds?: number[]) => {
    const events = [
      {
        id: 1,
        child_id: 1101,
        child_name: 'Emma Williams',
        title: 'Math Assignment Due',
        event_type: 'assignment' as const,
        start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Chapter 5 problems',
        color: '#1976d2',
      },
      {
        id: 2,
        child_id: 1102,
        child_name: 'Noah Williams',
        title: 'Science Project Due',
        event_type: 'assignment' as const,
        start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Solar system model',
        color: '#9c27b0',
      },
      {
        id: 3,
        child_id: 1101,
        child_name: 'Emma Williams',
        title: 'Parent-Teacher Conference',
        event_type: 'meeting' as const,
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Room 204',
        color: '#1976d2',
      },
      {
        id: 4,
        child_id: 1102,
        child_name: 'Noah Williams',
        title: 'Mid-term Exam',
        event_type: 'exam' as const,
        start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'English Literature',
        color: '#9c27b0',
      },
    ];

    return Promise.resolve(
      events.filter((e) => !childIds || childIds.length === 0 || childIds.includes(e.child_id))
    );
  },

  getComparativePerformance: async () => {
    return Promise.resolve([
      {
        child_id: 1101,
        child_name: 'Emma Williams',
        subjects: [
          {
            subject_name: 'Mathematics',
            average_score: 88,
            assignments_completed: 15,
            attendance_percentage: 95,
          },
          {
            subject_name: 'Science',
            average_score: 92,
            assignments_completed: 12,
            attendance_percentage: 94,
          },
          {
            subject_name: 'English',
            average_score: 85,
            assignments_completed: 14,
            attendance_percentage: 96,
          },
          {
            subject_name: 'History',
            average_score: 90,
            assignments_completed: 10,
            attendance_percentage: 93,
          },
        ],
      },
      {
        child_id: 1102,
        child_name: 'Noah Williams',
        subjects: [
          {
            subject_name: 'Mathematics',
            average_score: 68,
            assignments_completed: 10,
            attendance_percentage: 78,
          },
          {
            subject_name: 'Science',
            average_score: 72,
            assignments_completed: 9,
            attendance_percentage: 80,
          },
          {
            subject_name: 'English',
            average_score: 75,
            assignments_completed: 11,
            attendance_percentage: 76,
          },
          {
            subject_name: 'History',
            average_score: 70,
            assignments_completed: 8,
            attendance_percentage: 79,
          },
        ],
      },
    ]);
  },

  getFamilyNotificationDigest: async () => {
    return Promise.resolve({
      date: new Date().toISOString(),
      notifications: [
        {
          id: 1,
          child_id: 1101,
          child_name: 'Emma Williams',
          notification_type: 'assignment',
          title: 'New Assignment Posted',
          message: 'Math homework for Chapter 5 has been posted',
          priority: 'medium',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_read: false,
        },
        {
          id: 2,
          child_id: 1102,
          child_name: 'Noah Williams',
          notification_type: 'attendance',
          title: 'Absence Alert',
          message: 'Noah was absent from school today',
          priority: 'high',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          is_read: false,
        },
        {
          id: 3,
          child_id: 1101,
          child_name: 'Emma Williams',
          notification_type: 'grade',
          title: 'Grade Updated',
          message: 'Science test grade has been posted: 92%',
          priority: 'low',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          is_read: true,
        },
      ],
      summary: {
        total_count: 3,
        by_child: { 1101: 2, 1102: 1 },
        by_type: { assignment: 1, attendance: 1, grade: 1 },
        unread_count: 2,
      },
    });
  },

  bulkPayFees: async (request: BulkFeePaymentRequest) => {
    return Promise.resolve({
      successful_payments: request.student_ids,
      failed_payments: [],
      total_amount: request.amount * request.student_ids.length,
      transaction_ids: request.student_ids.map((id: number) => `TXN${id}${Date.now()}`),
    });
  },

  bulkDownloadReportCards: async (_studentIds: number[]) => {
    return Promise.resolve(new Blob(['Demo report cards data'], { type: 'application/zip' }));
  },

  bulkRSVPEvents: async (_request: BulkEventRSVPRequest) => {
    return Promise.resolve();
  },

  updateSharedFamilyInfo: async (info: SharedFamilyInfo) => {
    return Promise.resolve(info);
  },

  getSharedFamilyInfo: async () => {
    return Promise.resolve({
      address: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      postal_code: '62701',
      country: 'USA',
      emergency_contact_name: 'Jane Williams',
      emergency_contact_phone: '+1-555-1234',
      emergency_contact_relationship: 'Mother',
    });
  },

  linkSiblings: async (_request: SiblingLinkRequest) => {
    return Promise.resolve();
  },

  getPrivacySettings: async () => {
    return Promise.resolve({
      id: 1,
      parent_id: 5001,
      disable_sibling_comparisons: false,
      hide_performance_rankings: false,
      hide_attendance_from_siblings: false,
      allow_data_sharing: true,
      updated_at: new Date().toISOString(),
    });
  },

  updatePrivacySettings: async (settings: Partial<PrivacySettings>) => {
    return Promise.resolve({
      id: 1,
      parent_id: 5001,
      ...settings,
      updated_at: new Date().toISOString(),
    });
  },
};

export const demoInstitutionAdminApi = {
  getDashboard: async (): Promise<InstitutionAdminDashboardResponse> => {
    return Promise.resolve(adminDashboardData);
  },

  getStudentList: async (params?: {
    skip?: number;
    limit?: number;
    grade_id?: number;
    section_id?: number;
    search?: string;
    status?: string;
  }) => {
    const demoStudents = generateDemoStudents(25);
    let filteredStudents = [...demoStudents];

    if (params?.grade_id) {
      filteredStudents = filteredStudents.filter((s) => s.grade_id === params.grade_id);
    }
    if (params?.section_id) {
      filteredStudents = filteredStudents.filter((s) => s.section_id === params.section_id);
    }
    if (params?.status) {
      filteredStudents = filteredStudents.filter((s) => s.status === params.status);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredStudents = filteredStudents.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchLower) ||
          s.last_name.toLowerCase().includes(searchLower) ||
          s.admission_number.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower)
      );
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedStudents = filteredStudents.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedStudents,
      total: filteredStudents.length,
      skip,
      limit,
    });
  },

  getTeacherList: async (params?: {
    skip?: number;
    limit?: number;
    subject_id?: number;
    search?: string;
    status?: string;
  }) => {
    const demoTeachers = generateDemoTeachers(10);
    let filteredTeachers = [...demoTeachers];

    if (params?.subject_id) {
      filteredTeachers = filteredTeachers.filter((t) =>
        t.subjects?.some((s) => s.id === params.subject_id)
      );
    }
    if (params?.status) {
      filteredTeachers = filteredTeachers.filter((t) =>
        params.status === 'active' ? t.is_active : !t.is_active
      );
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredTeachers = filteredTeachers.filter(
        (t) =>
          t.first_name.toLowerCase().includes(searchLower) ||
          t.last_name.toLowerCase().includes(searchLower) ||
          t.employee_id.toLowerCase().includes(searchLower) ||
          t.email.toLowerCase().includes(searchLower)
      );
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedTeachers = filteredTeachers.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedTeachers,
      total: filteredTeachers.length,
      skip,
      limit,
    });
  },

  getExamList: async (params?: {
    skip?: number;
    limit?: number;
    exam_type?: string;
    grade_id?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
  }) => {
    const demoExams = generateDemoExams(12);
    let filteredExams = [...demoExams];

    if (params?.exam_type) {
      filteredExams = filteredExams.filter((e) => e.exam_type === params.exam_type);
    }
    if (params?.grade_id) {
      filteredExams = filteredExams.filter((e) => e.grade_id === params.grade_id);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredExams = filteredExams.filter((e) => e.exam_name.toLowerCase().includes(searchLower));
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedExams = filteredExams.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedExams,
      total: filteredExams.length,
      skip,
      limit,
    });
  },

  getSubscriptionBilling: async () => {
    return Promise.resolve({
      current_plan: {
        plan_name: 'Professional',
        plan_type: 'monthly',
        price: 2500,
        currency: 'USD',
        billing_cycle: 'monthly',
        next_billing_date: '2024-03-15',
        auto_renew: true,
        features: [
          'Up to 2000 students',
          'Up to 150 teachers',
          'Unlimited assignments',
          'Advanced analytics',
          'API access',
          'Priority support',
          'Custom branding',
        ],
      },
      usage: {
        students: {
          used: 1250,
          limit: 2000,
          percentage: 62.5,
        },
        teachers: {
          used: 85,
          limit: 150,
          percentage: 56.7,
        },
        storage: {
          used: 45.5,
          limit: 100,
          unit: 'GB',
          percentage: 45.5,
        },
      },
      billing_history: [
        {
          id: '1',
          invoice_number: 'INV-2024-002',
          date: '2024-02-15',
          amount: 2500,
          currency: 'USD',
          status: 'paid',
          payment_method: 'Credit Card',
          description: 'Monthly subscription - February 2024',
        },
        {
          id: '2',
          invoice_number: 'INV-2024-001',
          date: '2024-01-15',
          amount: 2500,
          currency: 'USD',
          status: 'paid',
          payment_method: 'Credit Card',
          description: 'Monthly subscription - January 2024',
        },
        {
          id: '3',
          invoice_number: 'INV-2023-012',
          date: '2023-12-15',
          amount: 2500,
          currency: 'USD',
          status: 'paid',
          payment_method: 'Credit Card',
          description: 'Monthly subscription - December 2023',
        },
        {
          id: '4',
          invoice_number: 'INV-2023-011',
          date: '2023-11-15',
          amount: 2500,
          currency: 'USD',
          status: 'paid',
          payment_method: 'Credit Card',
          description: 'Monthly subscription - November 2023',
        },
        {
          id: '5',
          invoice_number: 'INV-2023-010',
          date: '2023-10-15',
          amount: 2500,
          currency: 'USD',
          status: 'paid',
          payment_method: 'Credit Card',
          description: 'Monthly subscription - October 2023',
        },
      ],
      payment_methods: [
        {
          id: '1',
          type: 'credit_card',
          card_brand: 'Visa',
          last_four: '4242',
          expiry_month: 12,
          expiry_year: 2025,
          is_default: true,
        },
        {
          id: '2',
          type: 'credit_card',
          card_brand: 'Mastercard',
          last_four: '5555',
          expiry_month: 8,
          expiry_year: 2026,
          is_default: false,
        },
      ],
      available_plans: [
        {
          plan_name: 'Basic',
          plan_type: 'monthly',
          price: 999,
          currency: 'USD',
          student_limit: 500,
          teacher_limit: 50,
          features: ['Up to 500 students', 'Up to 50 teachers', 'Basic analytics', 'Email support'],
        },
        {
          plan_name: 'Professional',
          plan_type: 'monthly',
          price: 2500,
          currency: 'USD',
          student_limit: 2000,
          teacher_limit: 150,
          features: [
            'Up to 2000 students',
            'Up to 150 teachers',
            'Advanced analytics',
            'Priority support',
            'API access',
          ],
        },
        {
          plan_name: 'Enterprise',
          plan_type: 'monthly',
          price: 5000,
          currency: 'USD',
          student_limit: 10000,
          teacher_limit: 500,
          features: [
            'Up to 10000 students',
            'Up to 500 teachers',
            'Advanced analytics',
            'Dedicated support',
            'API access',
            'Custom integrations',
            'White-label option',
          ],
        },
      ],
    });
  },

  getInstitutionAnalytics: async (_params?: { start_date?: string; end_date?: string }) => {
    return Promise.resolve({
      overview: {
        total_students: 1250,
        total_teachers: 85,
        total_classes: 42,
        average_attendance: 92.0,
        average_performance: 82.3,
      },
      performance_by_grade: [
        {
          grade_id: 6,
          grade_name: '6th Grade',
          student_count: 180,
          average_score: 79.5,
          attendance_rate: 91.2,
          pass_rate: 92.8,
        },
        {
          grade_id: 7,
          grade_name: '7th Grade',
          student_count: 195,
          average_score: 80.8,
          attendance_rate: 90.8,
          pass_rate: 94.1,
        },
        {
          grade_id: 8,
          grade_name: '8th Grade',
          student_count: 205,
          average_score: 82.3,
          attendance_rate: 92.5,
          pass_rate: 95.6,
        },
        {
          grade_id: 9,
          grade_name: '9th Grade',
          student_count: 215,
          average_score: 83.1,
          attendance_rate: 91.9,
          pass_rate: 93.5,
        },
        {
          grade_id: 10,
          grade_name: '10th Grade',
          student_count: 220,
          average_score: 84.5,
          attendance_rate: 93.2,
          pass_rate: 96.8,
        },
        {
          grade_id: 11,
          grade_name: '11th Grade',
          student_count: 120,
          average_score: 85.2,
          attendance_rate: 94.1,
          pass_rate: 97.5,
        },
        {
          grade_id: 12,
          grade_name: '12th Grade',
          student_count: 115,
          average_score: 86.8,
          attendance_rate: 95.3,
          pass_rate: 98.3,
        },
      ],
      performance_by_subject: [
        {
          subject_id: 1,
          subject_name: 'Mathematics',
          average_score: 81.5,
          highest_score: 98,
          lowest_score: 45,
          pass_rate: 92.3,
          student_count: 1250,
        },
        {
          subject_id: 2,
          subject_name: 'Physics',
          average_score: 79.8,
          highest_score: 96,
          lowest_score: 42,
          pass_rate: 90.1,
          student_count: 670,
        },
        {
          subject_id: 3,
          subject_name: 'Chemistry',
          average_score: 80.5,
          highest_score: 95,
          lowest_score: 48,
          pass_rate: 91.5,
          student_count: 670,
        },
        {
          subject_id: 4,
          subject_name: 'English',
          average_score: 84.2,
          highest_score: 99,
          lowest_score: 52,
          pass_rate: 95.8,
          student_count: 1250,
        },
        {
          subject_id: 5,
          subject_name: 'History',
          average_score: 82.7,
          highest_score: 97,
          lowest_score: 50,
          pass_rate: 93.6,
          student_count: 1250,
        },
        {
          subject_id: 6,
          subject_name: 'Biology',
          average_score: 83.5,
          highest_score: 98,
          lowest_score: 49,
          pass_rate: 94.2,
          student_count: 670,
        },
      ],
      attendance_trends: [
        {
          date: '2024-02-01',
          total_students: 1250,
          present: 1145,
          absent: 80,
          late: 25,
          percentage: 91.6,
        },
        {
          date: '2024-02-02',
          total_students: 1250,
          present: 1155,
          absent: 70,
          late: 25,
          percentage: 92.4,
        },
        {
          date: '2024-02-05',
          total_students: 1250,
          present: 1160,
          absent: 65,
          late: 25,
          percentage: 92.8,
        },
        {
          date: '2024-02-06',
          total_students: 1250,
          present: 1150,
          absent: 75,
          late: 25,
          percentage: 92.0,
        },
        {
          date: '2024-02-07',
          total_students: 1250,
          present: 1165,
          absent: 60,
          late: 25,
          percentage: 93.2,
        },
        {
          date: '2024-02-08',
          total_students: 1250,
          present: 1155,
          absent: 70,
          late: 25,
          percentage: 92.4,
        },
        {
          date: '2024-02-09',
          total_students: 1250,
          present: 1140,
          absent: 85,
          late: 25,
          percentage: 91.2,
        },
        {
          date: '2024-02-12',
          total_students: 1250,
          present: 1150,
          absent: 75,
          late: 25,
          percentage: 92.0,
        },
        {
          date: '2024-02-13',
          total_students: 1250,
          present: 1160,
          absent: 65,
          late: 25,
          percentage: 92.8,
        },
        {
          date: '2024-02-14',
          total_students: 1250,
          present: 1155,
          absent: 70,
          late: 25,
          percentage: 92.4,
        },
        {
          date: '2024-02-15',
          total_students: 1250,
          present: 1150,
          absent: 75,
          late: 25,
          percentage: 92.0,
        },
      ],
      performance_trends: [
        {
          month: 'Sep 2023',
          average_score: 75.5,
          attendance_rate: 88.2,
          pass_rate: 90.5,
        },
        {
          month: 'Oct 2023',
          average_score: 77.2,
          attendance_rate: 89.5,
          pass_rate: 91.8,
        },
        {
          month: 'Nov 2023',
          average_score: 78.8,
          attendance_rate: 90.1,
          pass_rate: 92.5,
        },
        {
          month: 'Dec 2023',
          average_score: 80.5,
          attendance_rate: 91.3,
          pass_rate: 93.8,
        },
        {
          month: 'Jan 2024',
          average_score: 81.2,
          attendance_rate: 91.8,
          pass_rate: 94.2,
        },
        {
          month: 'Feb 2024',
          average_score: 82.3,
          attendance_rate: 92.0,
          pass_rate: 94.5,
        },
      ],
      teacher_performance: [
        {
          teacher_id: 201,
          teacher_name: 'Dr. Emily Carter',
          subject: 'Mathematics',
          total_students: 125,
          average_class_score: 85.5,
          attendance_rate: 94.2,
          student_satisfaction: 4.8,
        },
        {
          teacher_id: 202,
          teacher_name: 'Prof. James Wilson',
          subject: 'Physics',
          total_students: 95,
          average_class_score: 82.3,
          attendance_rate: 92.1,
          student_satisfaction: 4.6,
        },
        {
          teacher_id: 203,
          teacher_name: 'Dr. Maria Rodriguez',
          subject: 'Chemistry',
          total_students: 98,
          average_class_score: 83.8,
          attendance_rate: 93.5,
          student_satisfaction: 4.7,
        },
        {
          teacher_id: 204,
          teacher_name: 'Mr. David Thompson',
          subject: 'English',
          total_students: 135,
          average_class_score: 87.2,
          attendance_rate: 95.1,
          student_satisfaction: 4.9,
        },
        {
          teacher_id: 205,
          teacher_name: 'Ms. Jennifer Lee',
          subject: 'History',
          total_students: 128,
          average_class_score: 84.5,
          attendance_rate: 93.8,
          student_satisfaction: 4.7,
        },
      ],
      top_performers: [
        {
          student_id: 1005,
          student_name: 'Emma Wilson',
          grade: '10th Grade',
          average_score: 94.8,
          attendance_percentage: 96.2,
          rank: 1,
        },
        {
          student_id: 1011,
          student_name: 'Isabella Garcia',
          grade: '10th Grade',
          average_score: 92.3,
          attendance_percentage: 95.8,
          rank: 2,
        },
        {
          student_id: 1003,
          student_name: 'Michael Chen',
          grade: '10th Grade',
          average_score: 91.2,
          attendance_percentage: 88.7,
          rank: 3,
        },
        {
          student_id: 1015,
          student_name: 'Mia Taylor',
          grade: '10th Grade',
          average_score: 90.1,
          attendance_percentage: 93.2,
          rank: 4,
        },
        {
          student_id: 1009,
          student_name: 'Oliver Davis',
          grade: '10th Grade',
          average_score: 89.7,
          attendance_percentage: 94.1,
          rank: 5,
        },
      ],
      students_needing_attention: [
        {
          student_id: 1050,
          student_name: 'Jacob Anderson',
          grade: '9th Grade',
          average_score: 62.5,
          attendance_percentage: 78.5,
          concerns: ['Low attendance', 'Declining grades'],
        },
        {
          student_id: 1051,
          student_name: 'Olivia Thomas',
          grade: '8th Grade',
          average_score: 68.2,
          attendance_percentage: 82.3,
          concerns: ['Frequent absences', 'Missing assignments'],
        },
        {
          student_id: 1052,
          student_name: 'Noah Jackson',
          grade: '7th Grade',
          average_score: 65.8,
          attendance_percentage: 80.1,
          concerns: ['Low performance', 'Behavioral issues'],
        },
      ],
    });
  },
};

export const demoCommunicationsApi = {
  getAnnouncements: async (params?: {
    skip?: number;
    limit?: number;
    priority?: string;
    is_published?: boolean;
  }) => {
    let announcements = [...demoData.communications.announcements];

    if (params?.priority) {
      announcements = announcements.filter((a) => a.priority === params.priority);
    }

    if (params?.is_published !== undefined) {
      announcements = announcements.filter((a) => a.is_published === params.is_published);
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;

    return Promise.resolve({
      items: announcements.slice(skip, skip + limit),
      total: announcements.length,
      skip,
      limit,
    });
  },

  getAnnouncement: async (id: number) => {
    const announcement = demoData.communications.announcements.find((a) => a.id === id);
    return Promise.resolve(announcement || demoData.communications.announcements[0]);
  },

  markAnnouncementAsRead: async (_announcementId: number) => {
    return Promise.resolve({ message: 'Announcement marked as read' });
  },

  getMessages: async (params?: { skip?: number; limit?: number; is_read?: boolean }) => {
    let messages = [...demoData.communications.messages];

    if (params?.is_read !== undefined) {
      messages = messages.filter((m) => m.is_read === params.is_read);
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;

    return Promise.resolve({
      items: messages.slice(skip, skip + limit),
      total: messages.length,
      skip,
      limit,
      unread_count: demoData.communications.messages.filter((m) => !m.is_read).length,
    });
  },

  getMessage: async (id: number) => {
    const message = demoData.communications.messages.find((m) => m.id === id);
    return Promise.resolve(message || demoData.communications.messages[0]);
  },

  sendMessage: async (data: { recipient_id: number; subject?: string; content: string }) => {
    return Promise.resolve({
      id: demoData.communications.messages.length + 1,
      institution_id: 1,
      sender_id: 1001,
      recipient_id: data.recipient_id,
      subject: data.subject,
      content: data.content,
      is_read: false,
      is_deleted_by_sender: false,
      is_deleted_by_recipient: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  markMessageAsRead: async (_messageId: number) => {
    return Promise.resolve({ message: 'Message marked as read' });
  },

  getConversations: async () => {
    return Promise.resolve(demoData.communications.conversations);
  },

  getNotifications: async (params?: {
    skip?: number;
    limit?: number;
    type?: string;
    is_read?: boolean;
  }) => {
    let notifications = [...demoData.communications.notifications];

    if (params?.type) {
      notifications = notifications.filter((n) => n.notification_type === params.type);
    }

    if (params?.is_read !== undefined) {
      notifications = notifications.filter((n) => (params.is_read ? !!n.read_at : !n.read_at));
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;

    return Promise.resolve({
      items: notifications.slice(skip, skip + limit),
      total: notifications.length,
      skip,
      limit,
      unread_count: notifications.filter((n) => !n.read_at).length,
    });
  },

  markNotificationAsRead: async (_notificationId: number) => {
    return Promise.resolve({ message: 'Notification marked as read' });
  },

  markAllNotificationsAsRead: async () => {
    return Promise.resolve({ message: 'All notifications marked as read' });
  },
};

export const demoSearchApi = {
  search: async (params: { query: string; types?: string[]; skip?: number; limit?: number }) => {
    const query = params.query.toLowerCase();
    const results = {
      students: [] as typeof demoData.search.students,
      teachers: [] as typeof demoData.search.teachers,
      assignments: [] as typeof demoData.search.assignments,
      announcements: [] as typeof demoData.search.announcements,
      total: 0,
    };

    if (!params.types || params.types.includes('students')) {
      results.students = demoData.search.students.filter(
        (s) =>
          s.first_name.toLowerCase().includes(query) ||
          s.last_name.toLowerCase().includes(query) ||
          s.admission_number.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query)
      );
    }

    if (!params.types || params.types.includes('teachers')) {
      results.teachers = demoData.search.teachers.filter(
        (t) =>
          t.first_name.toLowerCase().includes(query) ||
          t.last_name.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query) ||
          t.subjects?.some((s) => s.name.toLowerCase().includes(query))
      );
    }

    if (!params.types || params.types.includes('assignments')) {
      results.assignments = demoData.search.assignments.filter(
        (a) => a.title.toLowerCase().includes(query) || a.description?.toLowerCase().includes(query)
      );
    }

    if (!params.types || params.types.includes('announcements')) {
      results.announcements = demoData.search.announcements.filter(
        (a) => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query)
      );
    }

    results.total =
      results.students.length +
      results.teachers.length +
      results.assignments.length +
      results.announcements.length;

    return Promise.resolve(results);
  },
};

export const demoSettingsApi = {
  getUserSettings: async (_userId: number) => {
    return Promise.resolve(demoData.settings.userSettings);
  },

  updateUserSettings: async (_userId: number, settings: Partial<UserSettings>) => {
    return Promise.resolve({
      ...demoData.settings.userSettings,
      ...settings,
    });
  },

  getConnectedDevices: async (_userId: number) => {
    return Promise.resolve(demoData.settings.connectedDevices);
  },

  revokeDevice: async (_userId: number, _deviceId: string) => {
    return Promise.resolve({ message: 'Device revoked successfully' });
  },

  changePassword: async (_userId: number, _oldPassword: string, _newPassword: string) => {
    return Promise.resolve({ message: 'Password changed successfully' });
  },

  enable2FA: async (_userId: number) => {
    return Promise.resolve({
      secret: 'DEMO2FASECRET',
      qr_code_url: 'https://example.com/qr-code.png',
    });
  },

  verify2FA: async (_userId: number, _code: string) => {
    return Promise.resolve({ message: '2FA enabled successfully' });
  },

  disable2FA: async (_userId: number, _code: string) => {
    return Promise.resolve({ message: '2FA disabled successfully' });
  },
};

export const demoStudyMaterialsApi = {
  getPreviousYearPapers: async (params?: {
    board?: string;
    year?: number;
    grade_id?: number;
    subject_id?: number;
    skip?: number;
    limit?: number;
  }) => {
    let papers = [...demoData.studyMaterials.previousYearPapers];

    if (params?.board) {
      papers = papers.filter((p) => p.board === params.board);
    }
    if (params?.year) {
      papers = papers.filter((p) => p.year === params.year);
    }
    if (params?.grade_id) {
      papers = papers.filter((p) => p.grade_id === params.grade_id);
    }
    if (params?.subject_id) {
      papers = papers.filter((p) => p.subject_id === params.subject_id);
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;

    return Promise.resolve({
      items: papers.slice(skip, skip + limit),
      total: papers.length,
      skip,
      limit,
    });
  },

  getPreviousYearPaper: async (id: number) => {
    const paper = demoData.studyMaterials.previousYearPapers.find((p) => p.id === id);
    return Promise.resolve(paper || demoData.studyMaterials.previousYearPapers[0]);
  },

  incrementPaperView: async (_paperId: number) => {
    return Promise.resolve({ message: 'View count incremented' });
  },

  incrementPaperDownload: async (_paperId: number) => {
    return Promise.resolve({ message: 'Download count incremented' });
  },

  getLibraryBooks: async (params?: {
    category_id?: number;
    search?: string;
    skip?: number;
    limit?: number;
  }) => {
    let books = [...demoData.studyMaterials.libraryBooks];

    if (params?.category_id) {
      books = books.filter((b) => b.category_id === params.category_id);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.author?.toLowerCase().includes(searchLower) ||
          b.isbn?.toLowerCase().includes(searchLower)
      );
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;

    return Promise.resolve({
      items: books.slice(skip, skip + limit),
      total: books.length,
      skip,
      limit,
    });
  },

  getLibraryBook: async (id: number) => {
    const book = demoData.studyMaterials.libraryBooks.find((b) => b.id === id);
    return Promise.resolve(book || demoData.studyMaterials.libraryBooks[0]);
  },

  getMyIssuedBooks: async (_studentId: number) => {
    return Promise.resolve(demoData.studyMaterials.myIssuedBooks);
  },

  getBookCategories: async () => {
    return Promise.resolve(demoData.studyMaterials.bookCategories);
  },
};

export const demoSuperAdminApi = {
  getDashboard: async (): Promise<SuperAdminDashboardResponse> => {
    return Promise.resolve(superadminDashboardData);
  },

  listInstitutions: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    plan?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    // Get institutions from dashboard data
    let institutions = superadminDashboardData.institution_performance.map((inst) => ({
      id: inst.id,
      name: inst.name,
      slug: inst.name.toLowerCase().replace(/\s+/g, '-'),
      domain: `${inst.name.toLowerCase().replace(/\s+/g, '')}.edu` || null,
      is_active: inst.subscription_status === 'active',
      max_users: inst.total_users + 100,
      created_at: '2023-01-15T09:00:00Z',
      subscription_status: inst.subscription_status,
      subscription_plan: inst.subscription_status === 'active' ? 'Professional' : null,
      total_users: inst.total_users,
      active_users: inst.active_users,
      total_revenue: inst.revenue,
    }));

    // Apply filters
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      institutions = institutions.filter(
        (inst) =>
          inst.name.toLowerCase().includes(searchLower) ||
          inst.slug.toLowerCase().includes(searchLower)
      );
    }

    if (params.status && params.status !== 'all') {
      institutions = institutions.filter((inst) =>
        params.status === 'active' ? inst.is_active : !inst.is_active
      );
    }

    if (params.plan && params.plan !== 'all') {
      institutions = institutions.filter((inst) => inst.subscription_plan === params.plan);
    }

    // Apply sorting
    if (params.sort_by) {
      institutions.sort((a, b) => {
        const aVal = a[params.sort_by as keyof typeof a];
        const bVal = b[params.sort_by as keyof typeof b];
        const order = params.sort_order === 'desc' ? -1 : 1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return order * aVal.localeCompare(bVal);
        }
        return order * ((aVal as number) - (bVal as number));
      });
    }

    const page = params.page || 1;
    const pageSize = params.page_size || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return Promise.resolve({
      items: institutions.slice(start, end),
      total: institutions.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(institutions.length / pageSize),
    });
  },

  getInstitutionDetails: async (institutionId: number) => {
    const inst = superadminDashboardData.institution_performance.find(
      (i) => i.id === institutionId
    );

    if (!inst) {
      return Promise.reject(new Error('Institution not found'));
    }

    return Promise.resolve({
      institution: {
        id: inst.id,
        name: inst.name,
        slug: inst.name.toLowerCase().replace(/\s+/g, '-'),
        domain: `${inst.name.toLowerCase().replace(/\s+/g, '')}.edu`,
        description: `${inst.name} is a leading educational institution.`,
        is_active: inst.subscription_status === 'active',
        max_users: inst.total_users + 100,
        created_at: '2023-01-15T09:00:00Z',
        updated_at: '2024-02-15T10:30:00Z',
      },
      subscription:
        inst.subscription_status === 'active'
          ? {
              id: 1,
              plan_name: 'Professional',
              status: 'active',
              billing_cycle: 'monthly',
              price: inst.revenue,
              start_date: '2024-01-01T00:00:00Z',
              end_date: '2024-12-31T23:59:59Z',
              trial_end_date: '2024-01-15T23:59:59Z',
            }
          : null,
      stats: {
        total_users: inst.total_users,
        active_users: inst.active_users,
        student_count: Math.floor(inst.total_users * 0.85),
        teacher_count: Math.floor(inst.total_users * 0.15),
        total_revenue: inst.revenue,
      },
      recent_usage: [
        {
          metric_name: 'daily_active_users',
          metric_value: Math.floor(inst.active_users * 0.6),
          recorded_at: '2024-02-15T00:00:00Z',
        },
        {
          metric_name: 'assignments_created',
          metric_value: 45,
          recorded_at: '2024-02-15T00:00:00Z',
        },
      ],
    });
  },

  createInstitution: async (data: Record<string, unknown>) => {
    return Promise.resolve({
      id: 999,
      name: data.name as string,
      slug: data.slug as string,
      message: 'Institution created successfully (demo mode)',
    });
  },

  updateInstitution: async (institutionId: number, data: Record<string, unknown>) => {
    return Promise.resolve({
      id: institutionId,
      name: data.name as string,
      message: 'Institution updated successfully (demo mode)',
    });
  },

  updateSubscription: async (institutionId: number, data: Record<string, unknown>) => {
    return Promise.resolve({
      id: institutionId,
      plan_name: data.plan_name as string,
      status: 'active',
      message: 'Subscription updated successfully (demo mode)',
    });
  },

  getBillingHistory: async (_institutionId: number) => {
    return Promise.resolve({
      billing_history: [
        {
          id: 1,
          invoice_number: 'INV-2024-001',
          payment_id: 12345,
          amount: 2500,
          status: 'paid',
          payment_method: 'Credit Card',
          paid_at: '2024-02-01T10:00:00Z',
          created_at: '2024-02-01T09:00:00Z',
        },
        {
          id: 2,
          invoice_number: 'INV-2024-002',
          payment_id: 12346,
          amount: 2500,
          status: 'paid',
          payment_method: 'Credit Card',
          paid_at: '2024-01-01T10:00:00Z',
          created_at: '2024-01-01T09:00:00Z',
        },
        {
          id: 3,
          payment_id: 12347,
          amount: 2500,
          status: 'pending',
          created_at: '2024-03-01T09:00:00Z',
        },
      ],
    });
  },

  getInstitutionAnalytics: async (institutionId: number, days: number = 30) => {
    const inst = superadminDashboardData.institution_performance.find(
      (i) => i.id === institutionId
    );

    if (!inst) {
      return Promise.reject(new Error('Institution not found'));
    }

    // Generate usage trends data
    const usageTrends = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      usageTrends.push({
        date: date.toISOString().split('T')[0],
        active_users: Math.floor(inst.active_users * (0.7 + Math.random() * 0.3)),
      });
    }

    return Promise.resolve({
      institution_id: institutionId,
      institution_name: inst.name,
      user_metrics: {
        total_users: inst.total_users,
        active_users: inst.active_users,
        new_users: Math.floor(inst.total_users * 0.05),
        students: Math.floor(inst.total_users * 0.85),
        teachers: Math.floor(inst.total_users * 0.15),
      },
      engagement_metrics: {
        daily_active_users: Math.floor(inst.active_users * 0.6),
        weekly_active_users: Math.floor(inst.active_users * 0.85),
        monthly_active_users: inst.active_users,
        engagement_rate: inst.engagement,
      },
      usage_trends: usageTrends,
      revenue_metrics: {
        total_revenue: inst.revenue,
        recent_revenue: Math.floor(inst.revenue * 0.3),
        currency: '₹',
      },
    });
  },
};

export const demoFlashcardsApi = {
  listDecks: async (params?: {
    skip?: number;
    limit?: number;
    institution_id?: number;
    creator_id?: number;
    grade_id?: number;
    subject_id?: number;
    visibility?: string;
    search?: string;
  }) => {
    let filteredDecks = [...demoData.flashcards.decks];

    if (params?.creator_id) {
      filteredDecks = filteredDecks.filter((d) => d.creator_id === params.creator_id);
    }
    if (params?.grade_id) {
      filteredDecks = filteredDecks.filter((d) => d.grade_id === params.grade_id);
    }
    if (params?.subject_id) {
      filteredDecks = filteredDecks.filter((d) => d.subject_id === params.subject_id);
    }
    if (params?.visibility) {
      filteredDecks = filteredDecks.filter((d) => d.visibility === params.visibility);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredDecks = filteredDecks.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower)
      );
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedDecks = filteredDecks.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedDecks,
      total: filteredDecks.length,
      skip,
      limit,
    });
  },

  getDeck: async (deckId: number): Promise<FlashcardDeck> => {
    const deck = demoData.flashcards.decks.find((d) => d.id === deckId);
    return Promise.resolve(deck || demoData.flashcards.decks[0]);
  },

  createDeck: async (data: Record<string, unknown>): Promise<FlashcardDeck> => {
    return Promise.resolve({
      id: demoData.flashcards.decks.length + 1,
      ...data,
      total_cards: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as FlashcardDeck);
  },

  createDeckWithCards: async (data: Record<string, unknown>) => {
    const flashcards = data.flashcards as Record<string, unknown>[];
    return Promise.resolve({
      deck: {
        id: demoData.flashcards.decks.length + 1,
        ...(data.deck as Record<string, unknown>),
        total_cards: flashcards.length,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      flashcards: flashcards.map((card, index) => ({
        id: demoData.flashcards.cards.length + index + 1,
        ...card,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    });
  },

  updateDeck: async (deckId: number, updates: Record<string, unknown>): Promise<FlashcardDeck> => {
    const deck = demoData.flashcards.decks.find((d) => d.id === deckId);
    return Promise.resolve({
      ...(deck || demoData.flashcards.decks[0]),
      ...updates,
      updated_at: new Date().toISOString(),
    } as FlashcardDeck);
  },

  deleteDeck: async (_deckId: number): Promise<void> => {
    return Promise.resolve();
  },

  listDeckCards: async (deckId: number): Promise<Flashcard[]> => {
    const cards = demoData.flashcards.cards.filter((c) => c.deck_id === deckId);
    return Promise.resolve(cards);
  },

  getCard: async (cardId: number): Promise<Flashcard> => {
    const card = demoData.flashcards.cards.find((c) => c.id === cardId);
    return Promise.resolve(card || demoData.flashcards.cards[0]);
  },

  createCard: async (data: Record<string, unknown>): Promise<Flashcard> => {
    return Promise.resolve({
      id: demoData.flashcards.cards.length + 1,
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Flashcard);
  },

  updateCard: async (cardId: number, updates: Record<string, unknown>): Promise<Flashcard> => {
    const card = demoData.flashcards.cards.find((c) => c.id === cardId);
    return Promise.resolve({
      ...(card || demoData.flashcards.cards[0]),
      ...updates,
      updated_at: new Date().toISOString(),
    } as Flashcard);
  },

  deleteCard: async (_cardId: number): Promise<void> => {
    return Promise.resolve();
  },

  shareDeck: async (deckId: number, shareData: Record<string, unknown>) => {
    return Promise.resolve({
      id: 1,
      deck_id: deckId,
      ...shareData,
      shared_at: new Date().toISOString(),
    });
  },

  listDeckShares: async (_deckId: number): Promise<FlashcardDeckShare[]> => {
    return Promise.resolve([]);
  },

  unshareDeck: async (_shareId: number): Promise<void> => {
    return Promise.resolve();
  },

  getStudyProgress: async (_deckId: number, _userId: number): Promise<FlashcardStudyProgress> => {
    return Promise.resolve({
      id: 1,
      deck_id: _deckId,
      user_id: _userId,
      cards_studied: 12,
      cards_mastered: 8,
      total_study_time_minutes: 45,
      last_studied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  getDeckStats: async (_deckId: number, _userId: number): Promise<FlashcardDeckStats> => {
    return Promise.resolve(demoData.flashcards.stats);
  },

  updateStudySession: async (
    _cardId: number,
    _userId: number,
    _update: Record<string, unknown>
  ) => {
    return Promise.resolve({
      message: 'Study session updated',
    });
  },

  getDueCards: async (deckId: number, _userId: number): Promise<Flashcard[]> => {
    const cards = demoData.flashcards.cards.filter((c) => c.deck_id === deckId);
    return Promise.resolve(cards.slice(0, 5));
  },
};

export const demoQuizzesApi = {
  listQuizzes: async (params?: {
    skip?: number;
    limit?: number;
    institution_id?: number;
    creator_id?: number;
    grade_id?: number;
    subject_id?: number;
    quiz_type?: string;
    status?: string;
    search?: string;
  }) => {
    let filteredQuizzes = [...demoData.quizzes.quizzes];

    if (params?.creator_id) {
      filteredQuizzes = filteredQuizzes.filter((q) => q.creator_id === params.creator_id);
    }
    if (params?.grade_id) {
      filteredQuizzes = filteredQuizzes.filter((q) => q.grade_id === params.grade_id);
    }
    if (params?.subject_id) {
      filteredQuizzes = filteredQuizzes.filter((q) => q.subject_id === params.subject_id);
    }
    if (params?.quiz_type) {
      filteredQuizzes = filteredQuizzes.filter((q) => q.quiz_type === params.quiz_type);
    }
    if (params?.status) {
      filteredQuizzes = filteredQuizzes.filter((q) => q.status === params.status);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredQuizzes = filteredQuizzes.filter(
        (q) =>
          q.title.toLowerCase().includes(searchLower) ||
          q.description?.toLowerCase().includes(searchLower)
      );
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedQuizzes = filteredQuizzes.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedQuizzes,
      total: filteredQuizzes.length,
      skip,
      limit,
    });
  },

  getQuiz: async (quizId: number): Promise<Quiz> => {
    const quiz = demoData.quizzes.quizzes.find((q) => q.id === quizId);
    return Promise.resolve(quiz || demoData.quizzes.quizzes[0]);
  },

  getQuizForStudent: async (quizId: number): Promise<Quiz> => {
    const quiz = demoData.quizzes.quizzes.find((q) => q.id === quizId);
    return Promise.resolve(quiz || demoData.quizzes.quizzes[0]);
  },

  createQuiz: async (data: Record<string, unknown>): Promise<Quiz> => {
    return Promise.resolve({
      id: demoData.quizzes.quizzes.length + 1,
      ...data,
      total_marks: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Quiz);
  },

  createQuizWithQuestions: async (data: Record<string, unknown>) => {
    const questions = data.questions as Record<string, unknown>[];
    const totalMarks = questions.reduce((sum, q) => sum + ((q.marks as number) || 0), 0);
    return Promise.resolve({
      quiz: {
        id: demoData.quizzes.quizzes.length + 1,
        ...(data.quiz as Record<string, unknown>),
        total_marks: totalMarks,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      questions: questions.map((question, index) => ({
        id: demoData.quizzes.questions.length + index + 1,
        ...question,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    });
  },

  updateQuiz: async (quizId: number, updates: Record<string, unknown>): Promise<Quiz> => {
    const quiz = demoData.quizzes.quizzes.find((q) => q.id === quizId);
    return Promise.resolve({
      ...(quiz || demoData.quizzes.quizzes[0]),
      ...updates,
      updated_at: new Date().toISOString(),
    } as Quiz);
  },

  deleteQuiz: async (_quizId: number): Promise<void> => {
    return Promise.resolve();
  },

  publishQuiz: async (quizId: number): Promise<Quiz> => {
    const quiz = demoData.quizzes.quizzes.find((q) => q.id === quizId);
    return Promise.resolve({
      ...(quiz || demoData.quizzes.quizzes[0]),
      status: 'published' as Quiz['status'],
      updated_at: new Date().toISOString(),
    } as Quiz);
  },

  listQuestions: async (quizId: number): Promise<QuizQuestion[]> => {
    const questions = demoData.quizzes.questions.filter((q) => q.quiz_id === quizId);
    return Promise.resolve(questions);
  },

  createQuestion: async (_quizId: number, question: Record<string, unknown>) => {
    return Promise.resolve({
      id: demoData.quizzes.questions.length + 1,
      ...question,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  updateQuestion: async (questionId: number, updates: Record<string, unknown>) => {
    const question = demoData.quizzes.questions.find((q) => q.id === questionId);
    return Promise.resolve({
      ...(question || demoData.quizzes.questions[0]),
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  deleteQuestion: async (_questionId: number): Promise<void> => {
    return Promise.resolve();
  },

  startAttempt: async (quizId: number, userId: number): Promise<QuizAttempt> => {
    return Promise.resolve({
      id: demoData.quizzes.attempts.length + 1,
      quiz_id: quizId,
      user_id: userId,
      attempt_number: 1,
      status: 'in_progress' as QuizAttempt['status'],
      score: 0,
      percentage: 0,
      total_questions: 10,
      correct_answers: 0,
      incorrect_answers: 0,
      unanswered: 10,
      time_taken_seconds: 0,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  getAttempt: async (attemptId: number): Promise<QuizAttempt> => {
    const attempt = demoData.quizzes.attempts.find((a) => a.id === attemptId);
    return Promise.resolve(attempt || demoData.quizzes.attempts[0]);
  },

  submitQuiz: async (_submission: Record<string, unknown>): Promise<QuizAttempt> => {
    return Promise.resolve({
      id: _submission.attempt_id as number,
      quiz_id: 1,
      user_id: 1001,
      attempt_number: 1,
      status: 'completed' as QuizAttempt['status'],
      score: 42,
      percentage: 84,
      total_questions: 10,
      correct_answers: 8,
      incorrect_answers: 2,
      unanswered: 0,
      time_taken_seconds: _submission.time_taken_seconds as number,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  getAttemptResponses: async (_attemptId: number) => {
    return Promise.resolve([]);
  },

  getLeaderboard: async (quizId: number, limit = 100): Promise<QuizLeaderboardEntry[]> => {
    const leaderboard = demoData.quizzes.leaderboard.filter((l) => l.quiz_id === quizId);
    return Promise.resolve(leaderboard.slice(0, limit));
  },

  getAnalytics: async (quizId: number): Promise<QuizDetailedAnalytics> => {
    return Promise.resolve({
      quiz_analytics: {
        quiz_id: quizId,
        total_attempts: 15,
        completed_attempts: 12,
        average_score: 38.5,
        average_percentage: 77,
        average_time_seconds: 1100,
        highest_score: 48,
        lowest_score: 25,
        pass_rate: 80,
        question_difficulty: {},
      },
      question_analytics: [],
      score_distribution: {
        'A (90-100)': 3,
        'B (80-89)': 5,
        'C (70-79)': 3,
        'D (60-69)': 1,
        'F (0-59)': 3,
      },
      time_distribution: {
        '<15 min': 2,
        '15-20 min': 8,
        '20-25 min': 4,
        '>25 min': 1,
      },
    });
  },
};

export const demoPomodoroApi = {
  getSettings: async (_studentId: number): Promise<PomodoroSettings> => {
    return Promise.resolve(demoData.pomodoro.settings);
  },

  updateSettings: async (
    _studentId: number,
    settings: Partial<PomodoroSettings>
  ): Promise<PomodoroSettings> => {
    return Promise.resolve({
      ...demoData.pomodoro.settings,
      ...settings,
    });
  },

  startSession: async (
    _studentId: number,
    data: Record<string, unknown>
  ): Promise<PomodoroSession> => {
    return Promise.resolve({
      id: demoData.pomodoro.sessions.length + 1,
      student_id: _studentId,
      subject_id: data.subject_id as number | undefined,
      subject_name: data.subject_name as string | undefined,
      session_type: data.session_type as 'work' | 'short_break' | 'long_break',
      duration_minutes: data.duration_minutes as number,
      start_time: new Date().toISOString(),
      completed: false,
      interrupted: false,
      created_at: new Date().toISOString(),
    });
  },

  completeSession: async (_studentId: number, sessionId: number): Promise<PomodoroSession> => {
    const session = demoData.pomodoro.sessions.find((s) => s.id === sessionId);
    return Promise.resolve({
      ...(session || demoData.pomodoro.sessions[0]),
      end_time: new Date().toISOString(),
      completed: true,
    });
  },

  interruptSession: async (_studentId: number, sessionId: number): Promise<PomodoroSession> => {
    const session = demoData.pomodoro.sessions.find((s) => s.id === sessionId);
    return Promise.resolve({
      ...(session || demoData.pomodoro.sessions[0]),
      end_time: new Date().toISOString(),
      interrupted: true,
    });
  },

  getSessions: async (
    _studentId: number,
    params?: {
      start_date?: string;
      end_date?: string;
      subject_id?: number;
      limit?: number;
    }
  ): Promise<PomodoroSession[]> => {
    let sessions = [...demoData.pomodoro.sessions];

    if (params?.subject_id) {
      sessions = sessions.filter((s) => s.subject_id === params.subject_id);
    }

    const limit = params?.limit || 50;
    return Promise.resolve(sessions.slice(0, limit));
  },

  getAnalytics: async (
    _studentId: number,
    _params?: {
      start_date?: string;
      end_date?: string;
    }
  ): Promise<PomodoroAnalytics> => {
    return Promise.resolve(demoData.pomodoro.analytics);
  },

  getSubjects: async (_studentId: number): Promise<PomodoroSubject[]> => {
    return Promise.resolve(
      demoData.academics.subjects.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.id === 1 ? '#3b82f6' : s.id === 2 ? '#8b5cf6' : '#10b981',
      }))
    );
  },
};

const demoDocumentVaultApi = {
  getVaultStats: async () => ({
    total_documents: 24,
    pending_verification: 3,
    expiring_soon: 5,
    pending_requests: 2,
    total_children: 2,
    storage_used_mb: 15.7,
  }),

  getFolders: async () => [
    {
      child_id: 1,
      child_name: 'Emma Johnson',
      total_documents: 12,
      document_types: [
        { type: 'immunization_record' as const, count: 3, last_updated: '2024-01-15T10:00:00Z' },
        { type: 'medical_record' as const, count: 2, last_updated: '2024-02-20T14:30:00Z' },
        { type: 'birth_certificate' as const, count: 1, last_updated: '2023-09-01T09:00:00Z' },
        { type: 'permission_slip' as const, count: 4, last_updated: '2024-03-10T11:00:00Z' },
        { type: 'report_card' as const, count: 2, last_updated: '2024-01-25T16:00:00Z' },
      ],
    },
    {
      child_id: 2,
      child_name: 'Liam Johnson',
      total_documents: 12,
      document_types: [
        { type: 'immunization_record' as const, count: 3, last_updated: '2024-01-15T10:00:00Z' },
        { type: 'medical_record' as const, count: 1, last_updated: '2024-02-15T14:00:00Z' },
        { type: 'birth_certificate' as const, count: 1, last_updated: '2023-09-01T09:00:00Z' },
        { type: 'permission_slip' as const, count: 5, last_updated: '2024-03-12T10:00:00Z' },
        { type: 'id_card' as const, count: 1, last_updated: '2024-01-10T13:00:00Z' },
        { type: 'attendance_excuse' as const, count: 1, last_updated: '2024-03-05T08:00:00Z' },
      ],
    },
  ],

  getDocuments: async (filters?: DocumentSearchFilters) => {
    const allDocs = [
      {
        id: 1,
        child_id: 1,
        child_name: 'Emma Johnson',
        document_type: 'immunization_record' as const,
        title: 'COVID-19 Vaccination Card',
        description: 'Proof of COVID-19 vaccination',
        file_url: 'https://via.placeholder.com/800x600/4CAF50/FFFFFF?text=Vaccination+Card',
        thumbnail_url: 'https://via.placeholder.com/200x150/4CAF50/FFFFFF?text=Vaccine',
        file_name: 'covid_vaccine_card.pdf',
        file_size: 524288,
        mime_type: 'application/pdf',
        status: 'verified' as const,
        upload_date: '2024-01-15T10:00:00Z',
        expiry_date: '2025-01-15T00:00:00Z',
        verified_by: 'School Nurse',
        verified_date: '2024-01-16T09:00:00Z',
        tags: ['vaccination', 'covid-19', 'required'],
        access_log_count: 5,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T09:00:00Z',
      },
      {
        id: 2,
        child_id: 1,
        child_name: 'Emma Johnson',
        document_type: 'medical_record' as const,
        title: 'Allergy Information',
        description: 'List of known allergies',
        file_url: 'https://via.placeholder.com/800x600/FF9800/FFFFFF?text=Medical+Record',
        thumbnail_url: 'https://via.placeholder.com/200x150/FF9800/FFFFFF?text=Medical',
        file_name: 'allergy_info.pdf',
        file_size: 342016,
        mime_type: 'application/pdf',
        status: 'verified' as const,
        upload_date: '2024-02-20T14:30:00Z',
        verified_by: 'School Nurse',
        verified_date: '2024-02-21T10:00:00Z',
        tags: ['medical', 'allergies', 'important'],
        access_log_count: 8,
        created_at: '2024-02-20T14:30:00Z',
        updated_at: '2024-02-21T10:00:00Z',
      },
      {
        id: 3,
        child_id: 1,
        child_name: 'Emma Johnson',
        document_type: 'permission_slip' as const,
        title: 'Field Trip Permission - Science Museum',
        description: 'Permission for March 25 field trip',
        file_url: 'https://via.placeholder.com/800x600/2196F3/FFFFFF?text=Permission+Slip',
        thumbnail_url: 'https://via.placeholder.com/200x150/2196F3/FFFFFF?text=Permission',
        file_name: 'field_trip_permission.pdf',
        file_size: 256000,
        mime_type: 'application/pdf',
        status: 'pending' as const,
        upload_date: '2024-03-10T11:00:00Z',
        expiry_date: '2024-03-25T00:00:00Z',
        tags: ['field-trip', 'permission'],
        access_log_count: 2,
        created_at: '2024-03-10T11:00:00Z',
        updated_at: '2024-03-10T11:00:00Z',
      },
      {
        id: 4,
        child_id: 2,
        child_name: 'Liam Johnson',
        document_type: 'immunization_record' as const,
        title: 'Flu Shot 2024',
        description: 'Annual flu vaccination',
        file_url: 'https://via.placeholder.com/800x600/4CAF50/FFFFFF?text=Flu+Shot',
        thumbnail_url: 'https://via.placeholder.com/200x150/4CAF50/FFFFFF?text=Flu',
        file_name: 'flu_shot_2024.jpg',
        file_size: 1048576,
        mime_type: 'image/jpeg',
        status: 'verified' as const,
        upload_date: '2024-01-15T10:00:00Z',
        expiry_date: '2024-12-31T00:00:00Z',
        verified_by: 'School Nurse',
        verified_date: '2024-01-16T11:00:00Z',
        tags: ['vaccination', 'flu', 'annual'],
        access_log_count: 3,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T11:00:00Z',
      },
      {
        id: 5,
        child_id: 2,
        child_name: 'Liam Johnson',
        document_type: 'attendance_excuse' as const,
        title: 'Doctor Appointment Excuse',
        description: 'Excused absence for dental appointment',
        file_url: 'https://via.placeholder.com/800x600/9C27B0/FFFFFF?text=Doctor+Note',
        thumbnail_url: 'https://via.placeholder.com/200x150/9C27B0/FFFFFF?text=Note',
        file_name: 'doctor_excuse_march.pdf',
        file_size: 180224,
        mime_type: 'application/pdf',
        status: 'verified' as const,
        upload_date: '2024-03-05T08:00:00Z',
        verified_by: 'Attendance Officer',
        verified_date: '2024-03-05T14:00:00Z',
        tags: ['absence', 'medical'],
        access_log_count: 4,
        created_at: '2024-03-05T08:00:00Z',
        updated_at: '2024-03-05T14:00:00Z',
      },
    ];

    return allDocs.filter((doc) => {
      if (filters?.child_id && doc.child_id !== filters.child_id) return false;
      if (filters?.document_type && doc.document_type !== filters.document_type) return false;
      if (filters?.status && doc.status !== filters.status) return false;
      if (filters?.search_query) {
        const query = filters.search_query.toLowerCase();
        return (
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  },

  getDocument: async (documentId: number) => {
    const docs = await demoDocumentVaultApi.getDocuments();
    return docs.find((d) => d.id === documentId)!;
  },

  uploadDocument: async (data: DocumentUploadRequest) => ({
    id: Math.floor(Math.random() * 1000),
    child_id: data.child_id,
    child_name: 'Demo Child',
    document_type: data.document_type,
    title: data.title,
    description: data.description,
    file_url: 'https://via.placeholder.com/800x600',
    file_name: data.file.name,
    file_size: data.file.size,
    mime_type: data.file.type,
    status: 'pending',
    upload_date: new Date().toISOString(),
    expiry_date: data.expiry_date,
    tags: data.tags || [],
    access_log_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  performOCR: async (_file: File) => ({
    document_type: 'immunization_record',
    confidence: 0.92,
    detected_text: 'Vaccination Record for COVID-19',
    detected_dates: ['2024-01-15'],
    detected_names: ['Emma Johnson'],
  }),

  verifyDocument: async (documentId: number, data: DocumentVerificationRequest) => {
    const doc = await demoDocumentVaultApi.getDocument(documentId);
    return {
      ...doc,
      status: data.status,
      rejection_reason: data.rejection_reason,
      verified_by: 'Demo Admin',
      verified_date: new Date().toISOString(),
    };
  },

  shareDocument: async (documentId: number, data: DocumentShareRequest) =>
    data.recipient_ids.map((id: number) => ({
      id: Math.floor(Math.random() * 1000),
      document_id: documentId,
      recipient_id: id,
      recipient_name: 'Demo Recipient',
      recipient_role: 'teacher',
      shared_by: 'Parent',
      shared_date: new Date().toISOString(),
      expiry_date: data.expiry_date,
      access_count: 0,
      message: data.message,
    })),

  getDocumentShares: async (documentId: number) => [
    {
      id: 1,
      document_id: documentId,
      recipient_id: 1,
      recipient_name: 'Ms. Sarah Smith',
      recipient_role: 'teacher',
      shared_by: 'Parent',
      shared_date: '2024-03-01T10:00:00Z',
      expiry_date: '2024-12-31T23:59:59Z',
      access_count: 3,
      last_accessed: '2024-03-10T14:30:00Z',
      message: 'For reference during parent-teacher conference',
    },
    {
      id: 2,
      document_id: documentId,
      recipient_id: 2,
      recipient_name: 'School Nurse Johnson',
      recipient_role: 'nurse',
      shared_by: 'Parent',
      shared_date: '2024-02-15T09:00:00Z',
      access_count: 5,
      last_accessed: '2024-03-12T11:00:00Z',
    },
  ],

  revokeShare: async (_shareId: number) => {},

  downloadDocument: async (_documentId: number) =>
    new Blob(['Demo document content'], { type: 'application/pdf' }),

  getAccessLogs: async (documentId: number) => [
    {
      id: 1,
      document_id: documentId,
      accessed_by: 'Ms. Sarah Smith',
      accessed_by_role: 'teacher',
      access_type: 'view',
      accessed_date: '2024-03-10T14:30:00Z',
      ip_address: '192.168.1.100',
    },
    {
      id: 2,
      document_id: documentId,
      accessed_by: 'School Nurse Johnson',
      accessed_by_role: 'nurse',
      access_type: 'download',
      accessed_date: '2024-03-12T11:00:00Z',
      ip_address: '192.168.1.101',
    },
    {
      id: 3,
      document_id: documentId,
      accessed_by: 'Admin Davis',
      accessed_by_role: 'admin',
      access_type: 'view',
      accessed_date: '2024-03-13T09:15:00Z',
      ip_address: '192.168.1.102',
    },
  ],

  getDocumentRequests: async () => [
    {
      id: 1,
      child_id: 1,
      child_name: 'Emma Johnson',
      document_type: 'immunization_record',
      title: 'Updated Immunization Record',
      description:
        'Please upload the most recent immunization record including any new vaccinations.',
      requested_by: 'School Nurse Johnson',
      requested_by_role: 'nurse',
      requested_date: '2024-03-01T10:00:00Z',
      due_date: '2024-03-20T23:59:59Z',
      status: 'requested',
    },
    {
      id: 2,
      child_id: 2,
      child_name: 'Liam Johnson',
      document_type: 'permission_slip',
      title: 'Swimming Permission Form',
      description: 'Permission form required for upcoming swimming lessons.',
      requested_by: 'Coach Williams',
      requested_by_role: 'teacher',
      requested_date: '2024-03-05T14:00:00Z',
      due_date: '2024-03-18T23:59:59Z',
      status: 'requested',
    },
    {
      id: 3,
      child_id: 1,
      child_name: 'Emma Johnson',
      document_type: 'report_card',
      title: 'Mid-term Report Card',
      description: 'Mid-term progress report',
      requested_by: 'Ms. Sarah Smith',
      requested_by_role: 'teacher',
      requested_date: '2024-02-10T10:00:00Z',
      status: 'verified',
      uploaded_document_id: 1,
      response_date: '2024-02-15T14:00:00Z',
    },
  ],

  createDocumentRequest: async (
    data: Omit<DocumentRequest, 'id' | 'requested_date' | 'status'>
  ) => ({
    id: Math.floor(Math.random() * 1000),
    ...data,
    requested_date: new Date().toISOString(),
    status: 'requested',
  }),

  respondToRequest: async (requestId: number, documentId: number, notes?: string) => ({
    id: requestId,
    status: 'uploaded',
    uploaded_document_id: documentId,
    response_date: new Date().toISOString(),
    notes,
  }),

  getExpiryReminders: async () => [
    {
      id: 1,
      document_id: 1,
      document_title: 'COVID-19 Vaccination Card',
      document_type: 'immunization_record',
      child_name: 'Emma Johnson',
      expiry_date: '2025-01-15T00:00:00Z',
      days_until_expiry: 300,
      reminded_date: '2024-03-10T10:00:00Z',
    },
    {
      id: 2,
      document_id: 3,
      document_title: 'Field Trip Permission - Science Museum',
      document_type: 'permission_slip',
      child_name: 'Emma Johnson',
      expiry_date: '2024-03-25T00:00:00Z',
      days_until_expiry: 10,
    },
    {
      id: 3,
      document_id: 4,
      document_title: 'Flu Shot 2024',
      document_type: 'immunization_record',
      child_name: 'Liam Johnson',
      expiry_date: '2024-12-31T00:00:00Z',
      days_until_expiry: 290,
    },
  ],

  getShareRecipients: async () => [
    {
      id: 1,
      name: 'Ms. Sarah Smith',
      role: 'teacher',
      email: 'sarah.smith@school.edu',
      department: 'Grade 5',
    },
    {
      id: 2,
      name: 'School Nurse Johnson',
      role: 'nurse',
      email: 'nurse.johnson@school.edu',
      department: 'Health Services',
    },
    {
      id: 3,
      name: 'Principal Anderson',
      role: 'admin',
      email: 'principal@school.edu',
      department: 'Administration',
    },
    {
      id: 4,
      name: 'Counselor Davis',
      role: 'counselor',
      email: 'counselor@school.edu',
      department: 'Guidance',
    },
    {
      id: 5,
      name: 'Coach Williams',
      role: 'teacher',
      email: 'coach@school.edu',
      department: 'Physical Education',
    },
  ],
};

const demoOlympicsApi = {
  getCompetitions: async (_status?: string) => [],
  getCompetition: async (_competitionId: number) => ({}) as Record<string, unknown>,
  getCompetitionEvents: async (_competitionId: number) => [],
  getEvent: async (_eventId: number) => ({}) as Record<string, unknown>,
  startEvent: async (_eventId: number, _teamId?: number) => ({}) as Record<string, unknown>,
  getSession: async (_sessionId: number) => ({}) as Record<string, unknown>,
  getQuestions: async (_eventId: number) => [],
  submitAnswer: async (_sessionId: number, _questionId: number, _answer: string) =>
    ({}) as Record<string, unknown>,
  completeSession: async (_sessionId: number) => ({}) as Record<string, unknown>,
  getTeams: async (_competitionId: number) => [],
  createTeam: async (_competitionId: number, _name: string, _memberIds: number[]) =>
    ({}) as Record<string, unknown>,
  joinTeam: async (_teamCode: string) => ({}) as Record<string, unknown>,
  getSchoolRankings: async (_competitionId: number) => [],
  getIndividualRankings: async (_competitionId: number) => [],
  getTeamRankings: async (_competitionId: number) => [],
  getPrizes: async (_competitionId: number) => [],
  getCertificates: async (_userId: number) => [],
};

export interface CertificateTemplate extends Omit<
  SchoolCertificateTemplate,
  'template_name' | 'template_content' | 'is_active'
> {
  template_name?: string;
  template_content?: string;
  is_active?: boolean;
}

export type IssuedCertificate = Certificate;

export interface CertificatePreviewData {
  template_id: number;
  student_data: Record<string, unknown>;
  preview_html: string;
  generated_at: string;
}

export interface IDCardTemplate {
  id: number;
  institution_id: number;
  template_name: string;
  template_design: string;
  background_color: string;
  text_color: string;
  include_photo: boolean;
  include_barcode: boolean;
  include_qr_code: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentIDCardData {
  id: number;
  student_id: number;
  institution_id: number;
  card_number: string;
  student_name: string;
  grade: string;
  section: string;
  admission_number: string;
  photo_url: string;
  blood_group: string;
  emergency_contact: string;
  valid_from: string;
  valid_until: string;
  barcode_data: string;
  qr_code_data: string;
  template_id: number;
  issued_at: string;
}

export interface IDCardGenerationResult {
  success: boolean;
  card_data: StudentIDCardData;
  message: string;
}

export interface BulkIDCardGenerationResult {
  successful: number[];
  failed: number[];
  total_processed: number;
  cards_generated: StudentIDCardData[];
}

export const demoCertificatesApi = {
  getCertificateTemplates: async (certificate_type?: string): Promise<CertificateTemplate[]> => {
    let templates = [...demoCertificateTemplates];

    if (certificate_type) {
      templates = templates.filter((t) => t.certificate_type === certificate_type);
    }

    return Promise.resolve(templates);
  },

  getIssuedCertificates: async (student_id: number): Promise<IssuedCertificate[]> => {
    const certificates = demoCertificates.filter((c) => c.student_id === student_id);
    return Promise.resolve(certificates);
  },

  getCertificateById: async (id: number): Promise<IssuedCertificate | undefined> => {
    const certificate = demoCertificates.find((c) => c.id === id);
    return Promise.resolve(certificate);
  },

  downloadCertificatePDF: async (id: number): Promise<Blob> => {
    const certificate = demoCertificates.find((c) => c.id === id);
    const content = certificate
      ? `Certificate PDF - ${certificate.serial_number || 'Unknown'}`
      : 'Certificate PDF content';
    return Promise.resolve(new Blob([content], { type: 'application/pdf' }));
  },

  previewCertificateTemplate: async (
    template_id: number,
    student_data: object
  ): Promise<CertificatePreviewData> => {
    const template = demoCertificateTemplates.find((t) => t.id === template_id);
    const previewHtml = template
      ? `<html><body><h1>${template.template_config.header}</h1><p>${template.template_config.body_text}</p><footer>${template.template_config.footer_text}</footer></body></html>`
      : '<html><body>Certificate Preview</body></html>';
    return Promise.resolve({
      template_id,
      student_data: student_data as Record<string, unknown>,
      preview_html: previewHtml,
      generated_at: new Date().toISOString(),
    });
  },

  list: async (params?: { student_id?: number; certificate_type?: string }) => {
    let certificates = [...demoCertificates];

    if (params?.student_id) {
      certificates = certificates.filter((c) => c.student_id === params.student_id);
    }
    if (params?.certificate_type) {
      certificates = certificates.filter((c) => c.certificate_type === params.certificate_type);
    }

    return Promise.resolve(certificates);
  },

  generate: async (data: Record<string, unknown>) => {
    const newCertificate = {
      id: demoCertificates.length + 1,
      institution_id: 1,
      student_id: data.student_id as number,
      certificate_type: data.certificate_type as string,
      serial_number: `${(data.certificate_type as string).toUpperCase().substring(0, 2)}-2024-${String(demoCertificates.length + 1).padStart(3, '0')}`,
      issue_date: new Date().toISOString().split('T')[0],
      data: data.data as Record<string, unknown>,
      issued_by: 3001,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newCertificate);
  },

  download: async (_certificateId: number): Promise<Blob> => {
    return Promise.resolve(new Blob(['Certificate PDF content'], { type: 'application/pdf' }));
  },

  issue: async (data: Record<string, unknown>): Promise<Certificate> => {
    const now = new Date();
    const certificateType = data.certificate_type as string;
    const studentId = data.student_id as number;

    const newCertificate: Certificate = {
      id: demoCertificates.length + 1,
      institution_id: 1,
      student_id: studentId,
      student_name:
        ((data.data as Record<string, unknown>)?.student_name as string) || 'Student Name',
      certificate_type: certificateType as Certificate['certificate_type'],
      serial_number: `${certificateType.toUpperCase().substring(0, 2)}-${now.getFullYear()}-${String(demoCertificates.length + 1).padStart(4, '0')}`,
      issue_date: now.toISOString().split('T')[0],
      template_id: data.template_id as number | undefined,
      remarks: data.remarks as string | undefined,
      issued_by_id: 3001,
      issued_by_name: 'Michael Anderson',
      is_revoked: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    return Promise.resolve(newCertificate);
  },
};

export const demoIDCardsApi = {
  getIDCardTemplates: async (): Promise<IDCardTemplate[]> => {
    return Promise.resolve(demoIDCardTemplates);
  },

  getStudentIDCardData: async (student_id: number): Promise<StudentIDCardData | undefined> => {
    const cardData = demoIDCardData.find((card) => card.student_id === student_id);
    return Promise.resolve(cardData);
  },

  generateIDCard: async (
    student_id: number,
    template_id: number
  ): Promise<IDCardGenerationResult> => {
    const template = demoIDCardTemplates.find((t) => t.id === template_id);
    const student = demoData.student.profile;

    if (!template) {
      return Promise.resolve({
        success: false,
        card_data: {} as StudentIDCardData,
        message: 'Template not found',
      });
    }

    const newCard: StudentIDCardData = {
      id: demoIDCardData.length + 1,
      student_id,
      institution_id: 1,
      card_number: `ID-2024-${student_id}`,
      student_name:
        student_id === student.id ? `${student.first_name} ${student.last_name}` : 'Student Name',
      grade:
        student_id === student.id ? student.section?.grade?.name || '10th Grade' : '10th Grade',
      section: student_id === student.id ? student.section?.name || 'A' : 'A',
      admission_number:
        student_id === student.id
          ? student.admission_number
          : `STD2023${String(student_id).padStart(3, '0')}`,
      photo_url:
        student_id === student.id
          ? student.photo_url || 'https://i.pravatar.cc/150?img=12'
          : 'https://i.pravatar.cc/150?img=12',
      blood_group: student_id === student.id ? student.blood_group || 'O+' : 'O+',
      emergency_contact:
        student_id === student.id ? student.parent_phone || '+1-555-0000' : '+1-555-0000',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0],
      barcode_data:
        student_id === student.id
          ? student.admission_number
          : `STD2023${String(student_id).padStart(3, '0')}`,
      qr_code_data: `https://school.edu/verify/${student_id === student.id ? student.admission_number : `STD2023${String(student_id).padStart(3, '0')}`}`,
      template_id,
      issued_at: new Date().toISOString(),
    };

    return Promise.resolve({
      success: true,
      card_data: newCard,
      message: 'ID card generated successfully',
    });
  },

  bulkGenerateIDCards: async (
    student_ids: number[],
    template_id: number
  ): Promise<BulkIDCardGenerationResult> => {
    const successful: number[] = [];
    const failed: number[] = [];
    const cards_generated: StudentIDCardData[] = [];

    for (const student_id of student_ids) {
      try {
        const result = await demoIDCardsApi.generateIDCard(student_id, template_id);
        if (result.success) {
          successful.push(student_id);
          cards_generated.push(result.card_data);
        } else {
          failed.push(student_id);
        }
      } catch {
        failed.push(student_id);
      }
    }

    return Promise.resolve({
      successful,
      failed,
      total_processed: student_ids.length,
      cards_generated,
    });
  },
};

export const demoStaffApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    department?: string;
    search?: string;
  }) => {
    let staff = [...demoData.staff];

    if (params?.department) {
      staff = staff.filter((s) => s.department === params.department);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      staff = staff.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchLower) ||
          s.last_name.toLowerCase().includes(searchLower) ||
          s.employee_id.toLowerCase().includes(searchLower)
      );
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedStaff = staff.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedStaff,
      total: staff.length,
      skip,
      limit,
    });
  },

  get: async (staffId: number) => {
    const staff = demoData.staff.find((s) => s.id === staffId);
    return Promise.resolve(staff || demoData.staff[0]);
  },

  create: async (data: Record<string, unknown>) => {
    const newStaff = {
      id: demoData.staff.length + 1,
      institution_id: 1,
      employee_id: `EMP${String(demoData.staff.length + 1).padStart(3, '0')}`,
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newStaff);
  },

  update: async (staffId: number, data: Record<string, unknown>) => {
    const staff = demoData.staff.find((s) => s.id === staffId);
    return Promise.resolve({
      ...(staff || demoData.staff[0]),
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  delete: async (_staffId: number): Promise<void> => {
    return Promise.resolve();
  },
};

export const demoPayrollApi = {
  list: async (params?: { skip?: number; limit?: number; month?: string; staff_id?: number }) => {
    let payroll = [...demoData.payroll];

    if (params?.month) {
      payroll = payroll.filter((p) => p.month === params.month);
    }
    if (params?.staff_id) {
      payroll = payroll.filter((p) => p.staff_id === params.staff_id);
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedPayroll = payroll.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedPayroll,
      total: payroll.length,
      skip,
      limit,
    });
  },

  get: async (payrollId: number) => {
    const payroll = demoData.payroll.find((p) => p.id === payrollId);
    return Promise.resolve(payroll || demoData.payroll[0]);
  },

  generate: async (data: Record<string, unknown>) => {
    const newPayroll = {
      id: demoData.payroll.length + 1,
      institution_id: 1,
      ...data,
      payment_status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newPayroll);
  },

  processPayment: async (payrollId: number) => {
    const payroll = demoData.payroll.find((p) => p.id === payrollId);
    return Promise.resolve({
      ...(payroll || demoData.payroll[0]),
      payment_status: 'paid' as const,
      payment_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    });
  },

  downloadPayslip: async (_payrollId: number): Promise<Blob> => {
    return Promise.resolve(new Blob(['Payslip PDF content'], { type: 'application/pdf' }));
  },
};

export const demoEnquiriesApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    grade_interested?: string;
    from_date?: string;
  }) => {
    let enquiries = [...demoData.enquiries];

    if (params?.status) {
      enquiries = enquiries.filter((e) => e.status === params.status);
    }
    if (params?.grade_interested) {
      enquiries = enquiries.filter((e) => e.grade_interested === params.grade_interested);
    }
    if (params?.from_date) {
      enquiries = enquiries.filter((e) => e.enquiry_date >= params.from_date!);
    }

    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    const paginatedEnquiries = enquiries.slice(skip, skip + limit);

    return Promise.resolve({
      items: paginatedEnquiries,
      total: enquiries.length,
      skip,
      limit,
    });
  },

  get: async (enquiryId: number) => {
    const enquiry = demoData.enquiries.find((e) => e.id === enquiryId);
    return Promise.resolve(enquiry || demoData.enquiries[0]);
  },

  create: async (data: Record<string, unknown>) => {
    const newEnquiry = {
      id: demoData.enquiries.length + 1,
      institution_id: 1,
      enquiry_date: new Date().toISOString().split('T')[0],
      status: 'new' as const,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newEnquiry);
  },

  update: async (enquiryId: number, data: Record<string, unknown>) => {
    const enquiry = demoData.enquiries.find((e) => e.id === enquiryId);
    return Promise.resolve({
      ...(enquiry || demoData.enquiries[0]),
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  delete: async (_enquiryId: number): Promise<void> => {
    return Promise.resolve();
  },
};

export const demoSMSTemplatesApi = {
  list: async () => {
    return Promise.resolve(demoData.smsTemplates);
  },

  get: async (templateId: number) => {
    const template = demoData.smsTemplates.find((t) => t.id === templateId);
    return Promise.resolve(template || demoData.smsTemplates[0]);
  },

  create: async (data: Record<string, unknown>) => {
    const newTemplate = {
      id: demoData.smsTemplates.length + 1,
      institution_id: 1,
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newTemplate);
  },

  update: async (templateId: number, data: Record<string, unknown>) => {
    const template = demoData.smsTemplates.find((t) => t.id === templateId);
    return Promise.resolve({
      ...(template || demoData.smsTemplates[0]),
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  delete: async (_templateId: number): Promise<void> => {
    return Promise.resolve();
  },

  sendSMS: async (_data: Record<string, unknown>) => {
    return Promise.resolve({
      message: 'SMS sent successfully',
      sent_count: 1,
      failed_count: 0,
    });
  },

  sendTestSMS: async (_templateId: number, _phone: string) => {
    return Promise.resolve({
      message: 'Test SMS sent successfully',
      status: 'sent',
    });
  },
};

export const demoCredentialsApi = {
  getMyCredentials: async (_skip = 0, _limit = 100) => {
    return Promise.resolve(demoData.digitalCredentials);
  },

  getCredentialById: async (id: number) => {
    const credential = demoData.digitalCredentials.find((c) => c.id === id);
    return Promise.resolve(credential || demoData.digitalCredentials[0]);
  },

  getCredentialStatistics: async () => {
    const credentials = demoData.digitalCredentials;
    return Promise.resolve({
      total_issued: credentials.length,
      active_credentials: credentials.filter((c) => c.status === 'active').length,
      revoked_credentials: 0,
      expired_credentials: 0,
      pending_credentials: 0,
      by_type: {
        certificate: credentials.filter((c) => c.credential_type === 'certificate').length,
        digital_badge: credentials.filter((c) => c.credential_type === 'digital_badge').length,
      },
      by_subtype: {
        academic: credentials.filter((c) => c.sub_type === 'academic').length,
        skill_based: credentials.filter((c) => c.sub_type === 'skill_based').length,
        participation: credentials.filter((c) => c.sub_type === 'participation').length,
      },
      recent_issuances: credentials.slice(0, 5),
    });
  },

  createShareLink: async (credentialId: number, _data: Record<string, unknown>) => {
    const shareToken = `share-${Math.random().toString(36).substring(7)}`;
    return Promise.resolve({
      id: Math.floor(Math.random() * 1000),
      credential_id: credentialId,
      share_token: shareToken,
      share_url: `${window.location.origin}/credentials/shared/${shareToken}`,
      is_active: true,
      view_count: 0,
      created_at: new Date().toISOString(),
    });
  },

  verifyCredential: async (_request: Record<string, unknown>) => {
    return Promise.resolve({
      valid: true,
      message: 'Credential verified successfully',
      verified_at: new Date().toISOString(),
      blockchain_verified: true,
    });
  },

  verifyByCertificateNumber: async (certificateNumber: string) => {
    const credential = demoData.digitalCredentials.find(
      (c) => c.certificate_number === certificateNumber
    );
    return Promise.resolve({
      valid: !!credential,
      credential: credential || undefined,
      message: credential ? 'Credential verified successfully' : 'Credential not found',
      verified_at: new Date().toISOString(),
      blockchain_verified: !!credential?.blockchain_status,
    });
  },

  getSharedCredential: async (_shareToken: string) => {
    return Promise.resolve(demoData.digitalCredentials[0]);
  },

  downloadCredentialAsJSON: async (credential: Record<string, unknown>) => {
    const dataStr = JSON.stringify(credential, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `credential-${credential.certificate_number}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    return Promise.resolve();
  },

  downloadCredentialAsPDF: async (credentialId: number): Promise<void> => {
    const credential = demoData.digitalCredentials.find((c) => c.id === credentialId);
    const blob = new Blob([`Demo PDF for ${credential?.title || 'Credential'}`], {
      type: 'application/pdf',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `credential-${credentialId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return Promise.resolve();
  },

  getBlockchainHistory: async (certificateNumber: string) => {
    const credential = demoData.digitalCredentials.find(
      (c) => c.certificate_number === certificateNumber
    );
    return Promise.resolve({
      certificate_number: certificateNumber,
      blockchain_credential_id: credential?.blockchain_credential_id || 'N/A',
      blockchain_hash: credential?.blockchain_hash || 'N/A',
      verified: !!credential?.blockchain_status,
      history: [
        {
          action: 'Credential Issued',
          timestamp: credential?.issued_at || new Date().toISOString(),
          transaction_hash: credential?.blockchain_hash,
        },
        {
          action: 'Blockchain Verification',
          timestamp: credential?.issued_at || new Date().toISOString(),
          transaction_hash: credential?.blockchain_hash,
        },
      ],
    });
  },
};

export const demoDataApi = {
  students: demoStudentsApi,
  assignments: demoAssignmentsApi,
  submissions: demoSubmissionsApi,
  attendance: demoAttendanceApi,
  examinations: demoExaminationsApi,
  aiPredictionDashboard: demoAIPredictionDashboardApi,
  gamification: demoGamificationApi,
  goals: demoGoalsApi,
  analytics: demoAnalyticsApi,
  teachers: demoTeachersApi,
  parents: demoParentsApi,
  institutionAdmin: demoInstitutionAdminApi,
  superAdmin: demoSuperAdminApi,
  flashcards: demoFlashcardsApi,
  quizzes: demoQuizzesApi,
  pomodoro: demoPomodoroApi,
  settings: demoSettingsApi,
  search: demoSearchApi,
  communications: demoCommunicationsApi,
  studyMaterials: demoStudyMaterialsApi,
  documentVault: demoDocumentVaultApi,
  olympics: demoOlympicsApi,
  certificates: demoCertificatesApi,
  idCards: demoIDCardsApi,
  credentials: demoCredentialsApi,
  staff: demoStaffApi,
  payroll: demoPayrollApi,
  enquiries: demoEnquiriesApi,
  smsTemplates: demoSMSTemplatesApi,
};

export type {
  ClassRosterStudent,
  StudentSubmissionDetail,
  ExamMarkEntry,
  ParentMessage,
  StudentPerformanceMetric,
};
