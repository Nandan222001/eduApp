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
  type ClassRosterStudent,
  type StudentSubmissionDetail,
  type ExamMarkEntry,
  type ParentMessage,
  type StudentPerformanceMetric,
} from '@/data/dummyData';
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
import type {
  UserProfile,
  NotificationPreferences,
  ThemeSettings,
  PrivacySettings,
  UserSettings,
  ConnectedDevice,
} from '@/types/settings';

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
          icon_url: ub.badge!.icon_url,
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

  getUserStats: async (_userId: number, _institutionId: number) => {
    return Promise.resolve({
      total_points: demoData.gamification.userPoints.total_points,
      level: demoData.gamification.userPoints.level,
      badges_earned: demoData.gamification.userBadges.length,
      achievements_unlocked: 0,
      current_streak: demoData.gamification.userPoints.current_streak,
      rank: 3,
    });
  },

  getUserShowcase: async (userId: number, institutionId: number) => {
    return Promise.resolve({
      user_id: userId,
      institution_id: institutionId,
      featured_badges: demoData.gamification.userBadges.slice(0, 3),
      top_achievements: [],
      stats_summary: {
        total_points: demoData.gamification.userPoints.total_points,
        level: demoData.gamification.userPoints.level,
        rank: 3,
      },
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
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    return Promise.resolve({
      id: String(demoData.goals.length + 1),
      ...data,
      progress: 0,
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Goal);
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
        total_assigned: 25,
        submitted: 20,
        pending: 5,
        submission_rate: 80,
        average_score: 86.8,
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
    examId: number,
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
};

export const demoInstitutionAdminApi = {
  getDashboard: async (): Promise<InstitutionAdminDashboardResponse> => {
    return Promise.resolve(adminDashboardData);
  },
};

export const demoSuperAdminApi = {
  getDashboard: async (): Promise<SuperAdminDashboardResponse> => {
    return Promise.resolve(superadminDashboardData);
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

export const demoSettingsApi = {
  getProfile: async (): Promise<UserProfile> => {
    return Promise.resolve(demoData.settings.profile);
  },

  updateProfile: async (data: Record<string, unknown>): Promise<UserProfile> => {
    return Promise.resolve({
      ...demoData.settings.profile,
      ...data,
      updatedAt: new Date().toISOString(),
    } as UserProfile);
  },

  uploadAvatar: async (_file: File): Promise<{ avatarUrl: string }> => {
    return Promise.resolve({
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    });
  },

  deleteAvatar: async (): Promise<void> => {
    return Promise.resolve();
  },

  changePassword: async (_data: Record<string, unknown>): Promise<{ message: string }> => {
    return Promise.resolve({
      message: 'Password changed successfully',
    });
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    return Promise.resolve(demoData.settings.notifications);
  },

  updateNotificationPreferences: async (
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> => {
    return Promise.resolve(preferences);
  },

  getThemeSettings: async (): Promise<ThemeSettings> => {
    return Promise.resolve(demoData.settings.theme);
  },

  updateThemeSettings: async (settings: ThemeSettings): Promise<ThemeSettings> => {
    return Promise.resolve(settings);
  },

  getPrivacySettings: async (): Promise<PrivacySettings> => {
    return Promise.resolve(demoData.settings.privacy);
  },

  updatePrivacySettings: async (settings: PrivacySettings): Promise<PrivacySettings> => {
    return Promise.resolve(settings);
  },

  getAllSettings: async (): Promise<UserSettings> => {
    return Promise.resolve(demoData.settings.userSettings);
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    return Promise.resolve({
      ...demoData.settings.userSettings,
      ...settings,
    });
  },

  getConnectedDevices: async (): Promise<ConnectedDevice[]> => {
    return Promise.resolve(demoData.settings.connectedDevices);
  },

  logoutDevice: async (_deviceId: string): Promise<{ message: string }> => {
    return Promise.resolve({
      message: 'Device logged out successfully',
    });
  },

  logoutAllDevices: async (): Promise<{ message: string }> => {
    return Promise.resolve({
      message: 'All devices logged out successfully',
    });
  },

  requestAccountDeletion: async (
    _data: Record<string, unknown>
  ): Promise<{ message: string; requestId: string }> => {
    return Promise.resolve({
      message: 'Account deletion request submitted',
      requestId: '12345',
    });
  },

  cancelAccountDeletion: async (): Promise<{ message: string }> => {
    return Promise.resolve({
      message: 'Account deletion request cancelled',
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
};

export type {
  ClassRosterStudent,
  StudentSubmissionDetail,
  ExamMarkEntry,
  ParentMessage,
  StudentPerformanceMetric,
};
