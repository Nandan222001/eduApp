import { apiClient } from './client';

export interface Child {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  profilePhoto?: string;
  grade?: string;
  section?: string;
}

export interface ParentDashboard {
  children: Child[];
}

export interface ChildOverview {
  id: number;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  studentId: string;
  attendancePercentage: number;
  rank: number;
  totalStudents: number;
  averageScore: number;
  grade?: string;
  section?: string;
}

export interface TodayAttendance {
  date: string;
  status: 'present' | 'absent' | 'late' | 'not_marked';
  markedAt?: string;
  remarks?: string;
}

export interface RecentGrade {
  id: number;
  examName: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  examDate: string;
  remarks?: string;
}

export interface PendingAssignment {
  id: number;
  title: string;
  subject: string;
  subjectCode?: string;
  dueDate: string;
  teacherName?: string;
  description?: string;
  totalMarks?: number;
  status: 'pending' | 'overdue';
}

export interface FeePaymentStatus {
  totalOutstanding: number;
  dueDate?: string;
  currency: string;
  fees: {
    id: number;
    description: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'overdue' | 'paid';
  }[];
}

export interface MessagePreview {
  id: number;
  subject: string;
  senderName: string;
  senderType: 'teacher' | 'admin' | 'school';
  preview: string;
  sentAt: string;
  isRead: boolean;
}

export const parentsApi = {
  getDashboard: async () => {
    return apiClient.get<ParentDashboard>('/api/v1/parents/dashboard');
  },

  getChildOverview: async (childId: number) => {
    return apiClient.get<ChildOverview>(`/api/v1/parents/children/${childId}/overview`);
  },

  getTodayAttendance: async (childId: number) => {
    return apiClient.get<TodayAttendance>(`/api/v1/parents/children/${childId}/attendance/today`);
  },

  getRecentGrades: async (childId: number) => {
    return apiClient.get<RecentGrade[]>(`/api/v1/parents/children/${childId}/grades/recent`);
  },

  getPendingAssignments: async (childId: number) => {
    return apiClient.get<PendingAssignment[]>(
      `/api/v1/parents/children/${childId}/assignments/pending`
    );
  },

  getOutstandingFees: async () => {
    return apiClient.get<FeePaymentStatus>('/api/v1/fees/outstanding');
  },

  getMessages: async () => {
    return apiClient.get<MessagePreview[]>('/api/v1/messages');
  },
};
