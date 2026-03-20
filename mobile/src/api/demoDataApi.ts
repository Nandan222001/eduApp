import { useAuthStore } from '../store/authStore';
import { dummyData } from '../data/dummyData';
import {
  StudentStats,
  Assignment,
  AIPrediction,
  WeakArea,
  Subject,
  Achievement,
} from '../types/student';
import {
  AttendanceSummary,
} from '../types/attendance';
import {
  Child,
  ChildStats,
  TodayAttendance,
  Grade,
  Assignment as ParentAssignment,
  FeePayment,
  TeacherMessage,
  Announcement,
  AttendanceCalendar,
  SubjectAttendance as ParentSubjectAttendance,
  ExamResult as ParentExamResult,
  SubjectPerformance,
} from '../types/parent';
import { Badge } from '../types/gamification';
import { studentApi } from './student';
import { parentApi } from './parent';

const DEMO_EMAILS = ['demo@example.com', 'parent@demo.com'];

export const isDemoUser = (): boolean => {
  const user = useAuthStore.getState().user;
  return user ? DEMO_EMAILS.includes(user.email) : false;
};

export const demoDataApi = {
  student: {
    getDashboard: async () => {
      if (isDemoUser()) {
        return Promise.resolve({
          attendance: dummyData.students.demo.attendance.summary,
          upcomingAssignments: dummyData.students.demo.assignments.filter(a => a.status === 'pending').slice(0, 3),
          recentGrades: dummyData.students.demo.exams.results.slice(0, 5),
          aiPredictions: dummyData.students.demo.ai.predictions[0],
          weakAreas: dummyData.students.demo.ai.weakAreas,
          gamification: dummyData.students.demo.gamification.stats,
        });
      }
      return studentApi.getDashboard();
    },

    getProfile: async () => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.profile);
      }
      return studentApi.getProfile();
    },

    getStats: async (): Promise<StudentStats> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.stats);
      }
      return studentApi.getGrades();
    },

    getAttendance: async (): Promise<AttendanceSummary> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.attendance.summary);
      }
      return studentApi.getAttendanceSummary();
    },

    getAssignments: async (): Promise<Assignment[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.assignments);
      }
      return studentApi.getAssignments();
    },

    getGrades: async () => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.exams.results);
      }
      return studentApi.getGrades();
    },

    getAIPredictions: async (): Promise<AIPrediction[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.ai.predictions);
      }
      return studentApi.getAIPredictionDashboard();
    },

    getWeakAreas: async (): Promise<WeakArea[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.ai.weakAreas);
      }
      return studentApi.getWeakAreas();
    },

    getSubjects: async (): Promise<Subject[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.subjects);
      }
      return studentApi.getAssignments().then(() => dummyData.students.demo.subjects);
    },

    getStudyMaterials: async () => {
      if (isDemoUser()) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    },

    getBadges: async (): Promise<Badge[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.gamification.badges);
      }
      return studentApi.getGamificationDetails().then(data => data.badges || []);
    },

    getAchievements: async (): Promise<Achievement[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.students.demo.gamification.achievements);
      }
      return studentApi.getGamificationDetails().then(data => data.recentAchievements || []);
    },
  },

  parent: {
    getChildren: async (): Promise<Child[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.children);
      }
      return parentApi.getChildren();
    },

    getChildStats: async (childId: number): Promise<ChildStats> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.childrenStats[childId] || {
          attendance_percentage: 0,
          rank: 0,
          average_score: 0,
          total_subjects: 0,
        });
      }
      return parentApi.getChildStats(childId);
    },

    getTodayAttendance: async (childId: number): Promise<TodayAttendance> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.todayAttendance[childId] || {
          child_id: childId,
          date: new Date().toISOString().split('T')[0],
          status: 'not_marked' as const,
          marked_at: new Date().toISOString(),
          marked_by: 'System',
        });
      }
      return parentApi.getTodayAttendance(childId);
    },

    getRecentGrades: async (childId: number, limit: number = 5): Promise<Grade[]> => {
      if (isDemoUser()) {
        const grades = dummyData.parents.demo.grades[childId] || [];
        return Promise.resolve(grades.slice(0, limit));
      }
      return parentApi.getRecentGrades(childId, limit);
    },

    getPendingAssignments: async (childId: number): Promise<ParentAssignment[]> => {
      if (isDemoUser()) {
        const assignments = dummyData.parents.demo.assignments[childId] || [];
        return Promise.resolve(assignments.filter(a => a.status === 'pending'));
      }
      return parentApi.getPendingAssignments(childId);
    },

    getFeePayments: async (childId: number): Promise<FeePayment[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.feePayments[childId] || []);
      }
      return parentApi.getFeePayments(childId);
    },

    getMessages: async (): Promise<TeacherMessage[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.messages);
      }
      return parentApi.getMessages();
    },

    getAnnouncements: async (): Promise<Announcement[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.announcements);
      }
      return parentApi.getAnnouncements();
    },

    getAttendanceCalendar: async (
      childId: number,
      year: number,
      month: number
    ): Promise<AttendanceCalendar> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.attendanceCalendar[childId] || {});
      }
      return parentApi.getAttendanceCalendar(childId, year, month);
    },

    getSubjectAttendance: async (childId: number): Promise<ParentSubjectAttendance[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.subjectAttendance[childId] || []);
      }
      return parentApi.getSubjectAttendance(childId);
    },

    getExamResults: async (childId: number, term?: string): Promise<ParentExamResult[]> => {
      if (isDemoUser()) {
        const results = dummyData.parents.demo.examResults[childId] || [];
        return Promise.resolve(term ? results.filter(r => r.term === term) : results);
      }
      return parentApi.getExamResults(childId, term);
    },

    getSubjectPerformance: async (childId: number): Promise<SubjectPerformance[]> => {
      if (isDemoUser()) {
        return Promise.resolve(dummyData.parents.demo.subjectPerformance[childId] || []);
      }
      return parentApi.getSubjectPerformance(childId);
    },
  },
};
