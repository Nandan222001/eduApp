import axios from '@/lib/axios';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';
import type {
  ParentDashboard,
  ChildOverview,
  TodayAttendance,
  RecentGrade,
  PendingAssignment,
  WeeklyProgress,
  PerformanceComparison,
  GoalProgress,
  FamilyOverviewMetrics,
  FamilyCalendarEvent,
  ComparativePerformanceData,
  FamilyNotificationDigest,
  BulkFeePaymentRequest,
  BulkFeePaymentResponse,
  BulkEventRSVPRequest,
  SharedFamilyInfo,
  SiblingLinkRequest,
  PrivacySettings,
} from '@/types/parent';

export const parentsApi = {
  getDashboard: async (childId?: number): Promise<ParentDashboard> => {
    const params = childId ? `?child_id=${childId}` : '';
    const response = await axios.get<ParentDashboard>(`/api/v1/parents/dashboard${params}`);
    return response.data;
  },

  getChildren: async (): Promise<ChildOverview[]> => {
    const response = await axios.get<ChildOverview[]>('/api/v1/parents/children');
    return response.data;
  },

  getChildOverview: async (childId: number): Promise<ChildOverview> => {
    const response = await axios.get<ChildOverview>(`/api/v1/parents/children/${childId}/overview`);
    return response.data;
  },

  getTodayAttendance: async (childId: number): Promise<TodayAttendance> => {
    const response = await axios.get<TodayAttendance>(
      `/api/v1/parents/children/${childId}/attendance/today`
    );
    return response.data;
  },

  getRecentGrades: async (childId: number, limit = 10): Promise<RecentGrade[]> => {
    const response = await axios.get<RecentGrade[]>(
      `/api/v1/parents/children/${childId}/grades/recent?limit=${limit}`
    );
    return response.data;
  },

  getPendingAssignments: async (childId: number): Promise<PendingAssignment[]> => {
    const response = await axios.get<PendingAssignment[]>(
      `/api/v1/parents/children/${childId}/assignments/pending`
    );
    return response.data;
  },

  getWeeklyProgress: async (childId: number): Promise<WeeklyProgress> => {
    const response = await axios.get<WeeklyProgress>(
      `/api/v1/parents/children/${childId}/progress/weekly`
    );
    return response.data;
  },

  getPerformanceComparison: async (childId: number): Promise<PerformanceComparison> => {
    const response = await axios.get<PerformanceComparison>(
      `/api/v1/parents/children/${childId}/performance/comparison`
    );
    return response.data;
  },

  getChildGoals: async (
    childId: number
  ): Promise<{ goals: GoalProgress[]; total: number; active: number; completed: number }> => {
    const response = await axios.get(`/api/v1/parents/children/${childId}/goals`);
    return response.data;
  },

  getFamilyOverviewMetrics: async (): Promise<FamilyOverviewMetrics> => {
    if (isDemoUser()) {
      return demoDataApi.parents.getFamilyOverviewMetrics();
    }
    const response = await axios.get<FamilyOverviewMetrics>('/api/v1/parents/family/overview');
    return response.data;
  },

  getFamilyCalendarEvents: async (
    startDate: string,
    endDate: string,
    childIds?: number[]
  ): Promise<FamilyCalendarEvent[]> => {
    if (isDemoUser()) {
      return demoDataApi.parents.getFamilyCalendarEvents(startDate, endDate, childIds);
    }
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (childIds && childIds.length > 0) {
      childIds.forEach((id) => params.append('child_ids', id.toString()));
    }
    const response = await axios.get<FamilyCalendarEvent[]>(
      `/api/v1/parents/family/calendar?${params.toString()}`
    );
    return response.data;
  },

  getComparativePerformance: async (): Promise<ComparativePerformanceData[]> => {
    if (isDemoUser()) {
      return demoDataApi.parents.getComparativePerformance();
    }
    const response = await axios.get<ComparativePerformanceData[]>(
      '/api/v1/parents/family/comparative-performance'
    );
    return response.data;
  },

  getFamilyNotificationDigest: async (
    startDate?: string,
    endDate?: string
  ): Promise<FamilyNotificationDigest> => {
    if (isDemoUser()) {
      return demoDataApi.parents.getFamilyNotificationDigest();
    }
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await axios.get<FamilyNotificationDigest>(
      `/api/v1/parents/family/notifications/digest?${params.toString()}`
    );
    return response.data;
  },

  bulkPayFees: async (request: BulkFeePaymentRequest): Promise<BulkFeePaymentResponse> => {
    if (isDemoUser()) {
      return demoDataApi.parents.bulkPayFees(request);
    }
    const response = await axios.post<BulkFeePaymentResponse>(
      '/api/v1/parents/family/fees/bulk-pay',
      request
    );
    return response.data;
  },

  bulkDownloadReportCards: async (studentIds: number[], academicYearId?: number): Promise<Blob> => {
    if (isDemoUser()) {
      return demoDataApi.parents.bulkDownloadReportCards(studentIds);
    }
    const params = new URLSearchParams();
    studentIds.forEach((id) => params.append('student_ids', id.toString()));
    if (academicYearId) params.append('academic_year_id', academicYearId.toString());

    const response = await axios.get('/api/v1/parents/family/report-cards/bulk-download', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  bulkRSVPEvents: async (request: BulkEventRSVPRequest): Promise<void> => {
    if (isDemoUser()) {
      return demoDataApi.parents.bulkRSVPEvents(request);
    }
    await axios.post('/api/v1/parents/family/events/bulk-rsvp', request);
  },

  updateSharedFamilyInfo: async (info: SharedFamilyInfo): Promise<SharedFamilyInfo> => {
    if (isDemoUser()) {
      return demoDataApi.parents.updateSharedFamilyInfo(info);
    }
    const response = await axios.put<SharedFamilyInfo>('/api/v1/parents/family/shared-info', info);
    return response.data;
  },

  getSharedFamilyInfo: async (): Promise<SharedFamilyInfo> => {
    if (isDemoUser()) {
      return demoDataApi.parents.getSharedFamilyInfo();
    }
    const response = await axios.get<SharedFamilyInfo>('/api/v1/parents/family/shared-info');
    return response.data;
  },

  linkSiblings: async (request: SiblingLinkRequest): Promise<void> => {
    if (isDemoUser()) {
      return demoDataApi.parents.linkSiblings(request);
    }
    await axios.post('/api/v1/parents/family/link-siblings', request);
  },

  getPrivacySettings: async (): Promise<PrivacySettings> => {
    if (isDemoUser()) {
      return demoDataApi.parents.getPrivacySettings();
    }
    const response = await axios.get<PrivacySettings>('/api/v1/parents/family/privacy-settings');
    return response.data;
  },

  updatePrivacySettings: async (settings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    if (isDemoUser()) {
      return demoDataApi.parents.updatePrivacySettings(settings);
    }
    const response = await axios.put<PrivacySettings>(
      '/api/v1/parents/family/privacy-settings',
      settings
    );
    return {
      id: response.data.id,
      parent_id: response.data.parent_id,
      disable_sibling_comparisons: response.data.disable_sibling_comparisons ?? false,
      hide_performance_rankings: response.data.hide_performance_rankings ?? false,
      hide_attendance_from_siblings: response.data.hide_attendance_from_siblings ?? false,
      allow_data_sharing: response.data.allow_data_sharing ?? false,
      updated_at: response.data.updated_at,
    };
  },
};
