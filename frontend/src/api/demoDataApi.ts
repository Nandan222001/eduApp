import { useAuthStore } from '@/store/useAuthStore';
import { DEMO_CREDENTIALS, demoData } from '@/data/dummyData';
import type { StudentListParams, StudentProfile, StudentDashboardData } from './students';
import type { AssignmentListParams } from '@/types/assignment';
import type { AttendanceListResponse, MonthlyAttendanceData, StudentAttendanceDetail } from './attendance';
import type { ExamListParams, ExamListResponse } from './examinations';
import type { ExamResult } from '@/types/examination';
import type { AIPredictionDashboardResponse } from './aiPredictionDashboard';
import type { UserBadge, UserPoints, PointHistory, LeaderboardEntry, Badge } from '@/types/gamification';
import type { Goal, GoalAnalytics } from '@/types/goals';
import type { StudentPerformanceAnalytics } from '@/types/analytics';

export const isDemoUser = (): boolean => {
  const user = useAuthStore.getState().user;
  return user?.email === DEMO_CREDENTIALS.email;
};

export const demoStudentsApi = {
  getStudentProfile: async (id: number): Promise<StudentProfile> => {
    return Promise.resolve(demoData.student.profile);
  },

  getStudentDashboard: async (id: number): Promise<StudentDashboardData> => {
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
      badges: demoData.gamification.userBadges.map(ub => ({
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
  list: async (params?: AssignmentListParams) => {
    return Promise.resolve({
      items: demoData.academics.assignments,
      total: demoData.academics.assignments.length,
      skip: 0,
      limit: 50,
    });
  },

  get: async (id: number) => {
    const assignment = demoData.academics.assignments.find(a => a.id === id);
    return Promise.resolve(assignment || demoData.academics.assignments[0]);
  },

  getWithRubric: async (id: number) => {
    const assignment = demoData.academics.assignments.find(a => a.id === id);
    return Promise.resolve({
      ...(assignment || demoData.academics.assignments[0]),
      rubric_criteria: [],
    });
  },

  listSubmissions: async (assignmentId: number, params?: any) => {
    const submissions = demoData.academics.submissions.filter(s => s.assignment_id === assignmentId);
    return Promise.resolve({
      items: submissions,
      total: submissions.length,
      skip: 0,
      limit: 50,
    });
  },

  getStatistics: async (assignmentId: number) => {
    const submissions = demoData.academics.submissions.filter(s => s.assignment_id === assignmentId);
    const graded = submissions.filter(s => s.marks_obtained !== undefined);
    
    return Promise.resolve({
      total_submissions: submissions.length,
      graded_submissions: graded.length,
      pending_submissions: submissions.length - graded.length,
      average_marks: graded.length > 0 
        ? graded.reduce((sum, s) => sum + (s.marks_obtained || 0), 0) / graded.length 
        : 0,
      highest_marks: graded.length > 0 
        ? Math.max(...graded.map(s => s.marks_obtained || 0)) 
        : 0,
      lowest_marks: graded.length > 0 
        ? Math.min(...graded.map(s => s.marks_obtained || 0)) 
        : 0,
    });
  },

  getAnalytics: async (assignmentId: number) => {
    return Promise.resolve({
      assignment_id: assignmentId,
      grade_distribution: {
        'A': 2,
        'B+': 1,
      },
      submission_timeline: [],
      performance_by_section: [],
    });
  },
};

export const demoSubmissionsApi = {
  get: async (id: number) => {
    const submission = demoData.academics.submissions.find(s => s.id === id);
    return Promise.resolve(submission || demoData.academics.submissions[0]);
  },

  grade: async (id: number, data: any) => {
    const submission = demoData.academics.submissions.find(s => s.id === id);
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
    status?: any;
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
    startDate: string,
    endDate: string,
    subjectId?: number
  ): Promise<StudentAttendanceDetail> => {
    return Promise.resolve({
      student_id: studentId,
      student_name: `${demoData.student.profile.first_name} ${demoData.student.profile.last_name}`,
      admission_number: demoData.student.profile.admission_number,
      attendances: demoData.student.attendance.monthly.map(a => ({
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
    sectionId: number,
    startDate: string,
    endDate: string,
    subjectId?: number
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
    startDate: string,
    endDate: string,
    thresholdPercentage: number = 75.0,
    sectionId?: number,
    subjectId?: number
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
    studentId: number,
    institutionId: number
  ): Promise<ExamResult> => {
    const result = demoData.academics.examResults.find(r => r.exam_id === examId);
    return Promise.resolve(result || demoData.academics.examResults[0]);
  },

  listResults: async (
    examId: number,
    institutionId: number,
    sectionId?: number
  ): Promise<ExamResult[]> => {
    const results = demoData.academics.examResults.filter(r => r.exam_id === examId);
    return Promise.resolve(results.length > 0 ? results : [demoData.academics.examResults[0]]);
  },
};

export const demoAIPredictionDashboardApi = {
  getDashboard: async (
    board: string,
    gradeId: number,
    subjectId: number
  ): Promise<AIPredictionDashboardResponse> => {
    const subject = demoData.academics.subjects.find(s => s.id === subjectId);
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

  generateStudyPlan: async (request: any) => {
    return Promise.resolve({
      exam_date: request.exam_date,
      days_until_exam: Math.ceil((new Date(request.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      total_study_hours: request.available_hours_per_day * 30,
      weeks: [],
      completion_percentage: 0,
      milestone_dates: {},
    });
  },

  simulateWhatIfScenario: async (request: any) => {
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
  getUserPoints: async (userId: number, institutionId: number): Promise<UserPoints> => {
    return Promise.resolve(demoData.gamification.userPoints);
  },

  getPointHistory: async (
    userId: number,
    institutionId: number,
    limit = 50
  ): Promise<PointHistory[]> => {
    return Promise.resolve(demoData.gamification.pointHistory.slice(0, limit));
  },

  getUserBadges: async (userId: number, institutionId: number): Promise<UserBadge[]> => {
    return Promise.resolve(demoData.gamification.userBadges);
  },

  getBadges: async (institutionId: number): Promise<Badge[]> => {
    return Promise.resolve(demoData.gamification.badges);
  },

  getUserAchievements: async (userId: number, institutionId: number) => {
    return Promise.resolve([]);
  },

  getAchievements: async (institutionId: number) => {
    return Promise.resolve([]);
  },

  getLeaderboards: async (institutionId: number) => {
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
    institutionId: number,
    filter: any,
    currentUserId?: number,
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

  recordDailyLogin: async (userId: number, institutionId: number) => {
    return Promise.resolve({
      message: 'Daily login recorded',
      streak: demoData.gamification.userPoints.current_streak,
      points_earned: 10,
    });
  },

  getUserStats: async (userId: number, institutionId: number) => {
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

  getRewards: async (institutionId: number) => {
    return Promise.resolve([]);
  },

  getUserRedemptions: async (userId: number, institutionId: number) => {
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
    const goal = demoData.goals.find(g => g.id === id);
    return Promise.resolve(goal || demoData.goals[0]);
  },

  createGoal: async (data: any): Promise<Goal> => {
    return Promise.resolve({
      id: String(demoData.goals.length + 1),
      ...data,
      progress: 0,
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  updateGoal: async (id: string, data: any): Promise<Goal> => {
    const goal = demoData.goals.find(g => g.id === id);
    return Promise.resolve({
      ...(goal || demoData.goals[0]),
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  deleteGoal: async (id: string): Promise<void> => {
    return Promise.resolve();
  },

  updateMilestoneProgress: async (
    goalId: string,
    milestoneId: string,
    progress: number
  ): Promise<Goal> => {
    const goal = demoData.goals.find(g => g.id === goalId);
    return Promise.resolve(goal || demoData.goals[0]);
  },

  completeMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
    const goal = demoData.goals.find(g => g.id === goalId);
    return Promise.resolve(goal || demoData.goals[0]);
  },

  getAnalytics: async (): Promise<GoalAnalytics> => {
    const totalGoals = demoData.goals.length;
    const completedGoals = demoData.goals.filter(g => g.status === 'completed').length;
    const inProgressGoals = demoData.goals.filter(g => g.status === 'in_progress').length;
    
    return Promise.resolve({
      totalGoals,
      completedGoals,
      inProgressGoals,
      pendingGoals: totalGoals - completedGoals - inProgressGoals,
      averageProgress: demoData.goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals,
      goalsByType: {
        performance: demoData.goals.filter(g => g.type === 'performance').length,
        behavioral: demoData.goals.filter(g => g.type === 'behavioral').length,
        skill: demoData.goals.filter(g => g.type === 'skill').length,
      },
      completionRate: (completedGoals / totalGoals) * 100,
    });
  },
};

export const demoAnalyticsApi = {
  getDashboardStats: async (institutionId?: string) => {
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

  getFeatureAdoption: async (institutionId?: string, limit = 20) => {
    return Promise.resolve([]);
  },

  getUserFlow: async (institutionId?: string, limit = 10) => {
    return Promise.resolve({
      nodes: [],
      total_sessions: 0,
    });
  },

  getRetentionCohorts: async (institutionId?: string, cohortDays = 30) => {
    return Promise.resolve([]);
  },

  getTopEvents: async (institutionId?: string, limit = 20) => {
    return Promise.resolve([]);
  },

  getPerformanceStats: async (metricName?: string, days = 7) => {
    return Promise.resolve([]);
  },

  getClassPerformanceAnalytics: async (
    classId: number,
    periodStart?: string,
    periodEnd?: string
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
    periodStart?: string,
    periodEnd?: string
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
      overall_average: demoData.analytics.overall_average,
      attendance_rate: demoData.analytics.attendance_rate,
      assignment_completion_rate: demoData.analytics.assignment_completion_rate,
      rank_in_class: demoData.analytics.rank_in_class,
      total_students: demoData.analytics.total_students,
      subjects_performance: demoData.analytics.subjects_performance || [],
      recent_exams: demoData.academics.examResults.map(r => ({
        exam_name: `Exam ${r.exam_id}`,
        total_marks: r.total_max_marks,
        obtained_marks: r.total_marks_obtained,
        percentage: r.percentage,
        grade: r.grade,
        rank: r.section_rank,
      })),
      strength_areas: ['Mathematics', 'Physics'],
      improvement_areas: ['History'],
      trends: {
        performance_trend: 'improving',
        attendance_trend: 'stable',
        assignment_trend: 'improving',
      },
    });
  },

  generateCustomReport: async (filters: any) => {
    return Promise.resolve({
      report_id: '1',
      title: 'Custom Report',
      generated_at: new Date().toISOString(),
      filters,
      data: {},
    });
  },

  exportReportToPDF: async (reportData: any): Promise<Blob> => {
    return Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' }));
  },

  exportReportToExcel: async (reportData: any): Promise<Blob> => {
    return Promise.resolve(new Blob(['Excel content'], { type: 'application/vnd.ms-excel' }));
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
};
