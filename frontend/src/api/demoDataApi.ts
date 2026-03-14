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
} from '@/data/dummyData';
import type { StudentProfile, StudentDashboardData } from './students';
import type { AssignmentListParams } from '@/types/assignment';
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
import type { ParentDashboard, ChildOverview, TodayAttendance, RecentGrade } from '@/types/parent';
import type { DashboardResponse as InstitutionAdminDashboardResponse } from './institutionAdmin';
import type { SuperAdminDashboardResponse } from './superAdmin';

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
        last_activity: demoData.gamification.userPoints.last_activity_date,
      },
      points_and_rank: {
        total_points: demoData.gamification.userPoints.total_points,
        level: demoData.gamification.userPoints.level,
        rank: 3,
      },
      badges: demoData.gamification.userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon_url: ub.badge.icon_url,
        badge_type: ub.badge.badge_type,
        rarity: ub.badge.rarity,
        earned_at: ub.earned_at,
      })),
      todays_tasks: [],
      quick_links: [],
    });
  },
};

export const demoAssignmentsApi = {
  list: async (_params?: AssignmentListParams) => {
    return Promise.resolve({
      items: demoData.academics.assignments,
      total: demoData.academics.assignments.length,
      skip: 0,
      limit: 50,
    });
  },

  get: async (id: number) => {
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

  listSubmissions: async (assignmentId: number, _params?: Record<string, unknown>) => {
    const submissions = demoData.academics.submissions.filter(
      (s) => s.assignment_id === assignmentId
    );
    return Promise.resolve({
      items: submissions,
      total: submissions.length,
      skip: 0,
      limit: 50,
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
    board: string,
    gradeId: number,
    subjectId: number,
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
    const notStartedGoals = demoData.goals.filter(
      (g) => g.status === 'not_started' || g.status === 'pending'
    ).length;

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
    _periodStart?: string,
    _periodEnd?: string
  ) => {
    return Promise.resolve({
      class_id: classId,
      total_students: 45,
      average_performance: 85.5,
      subject_averages: [],
      top_performers: [],
      students_needing_help: [],
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
};

export const demoParentsApi = {
  getDashboard: async (_childId?: number): Promise<ParentDashboard> => {
    return Promise.resolve(parentDashboardData);
  },

  getChildren: async (): Promise<ChildOverview[]> => {
    return Promise.resolve(parentDashboardData.children);
  },

  getChildOverview: async (childId: number): Promise<ChildOverview> => {
    const child = parentDashboardData.children.find((c) => c.id === childId);
    return Promise.resolve(child || parentDashboardData.children[0]);
  },

  getTodayAttendance: async (_childId: number): Promise<TodayAttendance> => {
    return Promise.resolve(parentDashboardData.today_attendance);
  },

  getRecentGrades: async (_childId: number, limit = 10): Promise<RecentGrade[]> => {
    return Promise.resolve(parentDashboardData.recent_grades.slice(0, limit));
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
};
