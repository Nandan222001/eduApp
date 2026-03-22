import { secureStorage } from '../utils/secureStorage';
import { dummyData } from '../data/dummyData';
import {
  StudentStats,
  Assignment,
  Grade,
  AttendanceStatus,
  AIPrediction,
  WeakArea,
  StudyMaterial,
  Subject,
  GamificationBadge,
  Achievement,
} from '../types/student';
import {
  Child,
  ChildStats,
  TodayAttendance,
  Grade as ParentGrade,
  Assignment as ParentAssignment,
  FeePayment,
  TeacherMessage,
  Announcement,
  AttendanceCalendar,
  SubjectAttendance as ParentSubjectAttendance,
  ExamResult as ParentExamResult,
  SubjectPerformance,
} from '../types/parent';
import {
  AttendanceSummary,
  AttendanceHistory,
} from '../types/attendance';
import {
  ExamResult as StudentExamResult,
  Exam,
} from '../types/examinations';
import {
  Points,
  Badge,
  Leaderboard,
  Streak,
  GamificationStats,
} from '../types/gamification';

export const isDemoUser = async (): Promise<boolean> => {
  return await secureStorage.getIsDemoUser();
};

const studentDemoData = dummyData.students.demo;
const parentDemoData = dummyData.parents.demo;

export const demoDataApi = {
  student: {
    getProfile: async () => {
      return Promise.resolve(studentDemoData.profile);
    },

    getDashboard: async () => {
      const summary = studentDemoData.attendance.summary;
      const attendance = {
        todayStatus: summary.todayStatus,
        monthlyPercentage: summary.monthlyPercentage,
        totalClasses: summary.totalClasses,
        attendedClasses: summary.attendedClasses,
        absentClasses: summary.absentClasses,
        lateClasses: summary.lateClasses,
      };

      const upcomingAssignments = studentDemoData.assignments
        .filter(a => a.status === 'pending')
        .slice(0, 3);

      const recentGrades = studentDemoData.exams.results
        .map(result => ({
          id: result.id,
          subject: result.subjectName,
          examName: result.examName,
          obtainedMarks: result.obtainedMarks,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          examDate: result.examDate,
          grade: result.grade,
        }))
        .slice(0, 5);

      const aiPredictions = studentDemoData.ai.predictions[0] || {
        subject: 'Overall',
        predicted_grade: 85,
        predictedPercentage: 85,
        confidence: 0.8,
        trend: 'stable',
      };

      const weakAreas = studentDemoData.ai.weakAreas;

      const gamification = {
        totalPoints: studentDemoData.gamification.points.total,
        rank: studentDemoData.gamification.leaderboard.userRank,
        badges: studentDemoData.gamification.badges.map(badge => ({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          earnedAt: badge.earnedAt,
        })),
        activeGoalsCount: studentDemoData.goals.filter(g => g.status === 'in_progress' || g.status === 'active').length,
        streak: studentDemoData.gamification.streaks[0] || {
          type: 'attendance',
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date().toISOString(),
        },
      };

      return Promise.resolve({
        attendance,
        upcomingAssignments,
        recentGrades,
        aiPredictions,
        weakAreas,
        gamification,
      });
    },

    getGoals: async () => {
      return Promise.resolve({ data: studentDemoData.goals });
    },

    getStats: async (): Promise<StudentStats> => {
      return Promise.resolve(studentDemoData.stats);
    },

    getAttendance: async (): Promise<AttendanceStatus> => {
      const summary = studentDemoData.attendance.summary;
      return Promise.resolve({
        today_status: summary.todayStatus,
        current_week_percentage: summary.monthlyPercentage,
        total_days: summary.totalClasses,
        present_days: summary.attendedClasses,
        absent_days: summary.absentClasses,
        late_days: summary.lateClasses,
      });
    },

    getAssignments: async (status?: 'pending' | 'submitted' | 'graded'): Promise<Assignment[]> => {
      let assignments = studentDemoData.assignments;
      if (status) {
        assignments = assignments.filter(a => a.status === status);
      }
      return Promise.resolve(assignments);
    },

    getAssignmentById: async (id: number): Promise<Assignment> => {
      const assignment = studentDemoData.assignments.find(a => a.id === id);
      if (!assignment) {
        throw new Error(`Assignment with id ${id} not found`);
      }
      return Promise.resolve(assignment);
    },

    submitAssignment: async (_submission: unknown): Promise<unknown> => {
      return Promise.resolve({
        success: true,
        message: 'Assignment submitted successfully (demo mode)',
        submissionId: Math.floor(Math.random() * 10000),
      });
    },

    getGrades: async (limit?: number): Promise<Grade[]> => {
      const grades = studentDemoData.exams.results.map(result => ({
        id: result.id,
        subject: result.subjectName,
        examName: result.examName,
        obtainedMarks: result.obtainedMarks,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        examDate: result.examDate,
        grade: result.grade,
      }));
      
      if (limit) {
        return Promise.resolve(grades.slice(0, limit));
      }
      return Promise.resolve(grades);
    },

    getAIPredictions: async (): Promise<AIPrediction[]> => {
      return Promise.resolve(studentDemoData.ai.predictions);
    },

    getWeakAreas: async (): Promise<WeakArea[]> => {
      return Promise.resolve(studentDemoData.ai.weakAreas);
    },

    getSubjects: async (): Promise<Subject[]> => {
      return Promise.resolve(studentDemoData.subjects);
    },

    getStudyMaterials: async (_subjectId?: number): Promise<StudyMaterial[]> => {
      return Promise.resolve([]);
    },

    getMaterialById: async (_id: number): Promise<StudyMaterial> => {
      throw new Error('No study materials available in demo mode');
    },

    getBadges: async (): Promise<GamificationBadge[]> => {
      return Promise.resolve(
        studentDemoData.gamification.badges.map(badge => ({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          earned_date: badge.earnedAt,
          is_earned: badge.isEarned,
        }))
      );
    },

    getAchievements: async (limit?: number): Promise<Achievement[]> => {
      const achievements = studentDemoData.gamification.achievements.map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        points: achievement.pointsEarned,
        date: achievement.achievedAt,
      }));

      if (limit) {
        return Promise.resolve(achievements.slice(0, limit));
      }
      return Promise.resolve(achievements);
    },

    getAttendanceSummary: async (): Promise<AttendanceSummary> => {
      return Promise.resolve(studentDemoData.attendance.summary);
    },

    getAttendanceHistory: async (): Promise<AttendanceHistory[]> => {
      return Promise.resolve(studentDemoData.attendance.history);
    },

    getExamResults: async (): Promise<StudentExamResult[]> => {
      return Promise.resolve(studentDemoData.exams.results);
    },

    getUpcomingExams: async (): Promise<Exam[]> => {
      return Promise.resolve(studentDemoData.exams.upcoming);
    },

    getGamificationPoints: async (): Promise<Points> => {
      return Promise.resolve(studentDemoData.gamification.points);
    },

    getGamificationBadges: async (): Promise<Badge[]> => {
      return Promise.resolve(studentDemoData.gamification.badges);
    },

    getLeaderboard: async (): Promise<Leaderboard> => {
      return Promise.resolve(studentDemoData.gamification.leaderboard);
    },

    getStreaks: async (): Promise<Streak[]> => {
      return Promise.resolve(studentDemoData.gamification.streaks);
    },

    getGamificationStats: async (): Promise<GamificationStats> => {
      return Promise.resolve(studentDemoData.gamification.stats);
    },
  },

  parent: {
    getChildren: async (): Promise<Child[]> => {
      return Promise.resolve(parentDemoData.children);
    },

    getChildStats: async (childId: number): Promise<ChildStats> => {
      const stats = parentDemoData.childrenStats[childId];
      if (!stats) {
        throw new Error(`Stats for child ${childId} not found`);
      }
      return Promise.resolve(stats);
    },

    getTodayAttendance: async (childId: number): Promise<TodayAttendance> => {
      const attendance = parentDemoData.todayAttendance[childId];
      if (!attendance) {
        throw new Error(`Attendance for child ${childId} not found`);
      }
      return Promise.resolve(attendance);
    },

    getRecentGrades: async (childId: number, limit: number = 5): Promise<ParentGrade[]> => {
      const grades = parentDemoData.grades[childId] || [];
      return Promise.resolve(grades.slice(0, limit));
    },

    getPendingAssignments: async (childId: number): Promise<ParentAssignment[]> => {
      const assignments = parentDemoData.assignments[childId] || [];
      return Promise.resolve(assignments.filter(a => a.status === 'pending'));
    },

    getFeePayments: async (childId: number): Promise<FeePayment[]> => {
      const payments = parentDemoData.feePayments[childId] || [];
      return Promise.resolve(payments);
    },

    getMessages: async (): Promise<TeacherMessage[]> => {
      return Promise.resolve(parentDemoData.messages);
    },

    getAnnouncements: async (): Promise<Announcement[]> => {
      return Promise.resolve(parentDemoData.announcements);
    },

    markMessageAsRead: async (messageId: number): Promise<void> => {
      const message = parentDemoData.messages.find(m => m.id === messageId);
      if (message) {
        message.read = true;
      }
      return Promise.resolve();
    },

    sendMessage: async (_recipientId: number, _subject: string, _message: string): Promise<void> => {
      return Promise.resolve();
    },

    getAttendanceCalendar: async (
      childId: number,
      _year: number,
      _month: number
    ): Promise<AttendanceCalendar> => {
      const calendar = parentDemoData.attendanceCalendar[childId];
      if (!calendar) {
        throw new Error(`Attendance calendar for child ${childId} not found`);
      }
      return Promise.resolve(calendar);
    },

    getSubjectAttendance: async (childId: number): Promise<ParentSubjectAttendance[]> => {
      const attendance = parentDemoData.subjectAttendance[childId] || [];
      return Promise.resolve(attendance);
    },

    getExamResults: async (childId: number, term?: string): Promise<ParentExamResult[]> => {
      const results = parentDemoData.examResults[childId] || [];
      if (term) {
        return Promise.resolve(results.filter(r => r.term === term));
      }
      return Promise.resolve(results);
    },

    getSubjectPerformance: async (childId: number): Promise<SubjectPerformance[]> => {
      const performance = parentDemoData.subjectPerformance[childId] || [];
      return Promise.resolve(performance);
    },
  },
};
