import axios from '@/lib/axios';
import type {
  VolunteerActivity,
  VolunteerHoursSummary,
  VolunteerActivityForm,
  VerificationRequest,
  VolunteerLeaderboardEntry,
  GradeVolunteerStats,
  CommunityImpactStats,
  VolunteerCertificate,
  VolunteerAnalytics,
} from '@/types/volunteer';

export const volunteerApi = {
  getMyActivities: async (): Promise<VolunteerActivity[]> => {
    const response = await axios.get<VolunteerActivity[]>('/api/v1/volunteer/activities');
    return response.data;
  },

  getMySummary: async (): Promise<VolunteerHoursSummary> => {
    const response = await axios.get<VolunteerHoursSummary>('/api/v1/volunteer/summary');
    return response.data;
  },

  logActivity: async (activity: VolunteerActivityForm): Promise<VolunteerActivity> => {
    const response = await axios.post<VolunteerActivity>('/api/v1/volunteer/activities', activity);
    return response.data;
  },

  updateActivity: async (
    activityId: number,
    activity: Partial<VolunteerActivityForm>
  ): Promise<VolunteerActivity> => {
    const response = await axios.put<VolunteerActivity>(
      `/api/v1/volunteer/activities/${activityId}`,
      activity
    );
    return response.data;
  },

  deleteActivity: async (activityId: number): Promise<void> => {
    await axios.delete(`/api/v1/volunteer/activities/${activityId}`);
  },

  getPendingVerifications: async (): Promise<VolunteerActivity[]> => {
    const response = await axios.get<VolunteerActivity[]>(
      '/api/v1/volunteer/teacher/pending-verifications'
    );
    return response.data;
  },

  verifyActivity: async (verification: VerificationRequest): Promise<VolunteerActivity> => {
    const response = await axios.post<VolunteerActivity>(
      '/api/v1/volunteer/teacher/verify',
      verification
    );
    return response.data;
  },

  getLeaderboard: async (limit = 50): Promise<VolunteerLeaderboardEntry[]> => {
    const response = await axios.get<VolunteerLeaderboardEntry[]>(
      `/api/v1/volunteer/leaderboard?limit=${limit}`
    );
    return response.data;
  },

  getGradeStats: async (): Promise<GradeVolunteerStats[]> => {
    const response = await axios.get<GradeVolunteerStats[]>('/api/v1/volunteer/grade-stats');
    return response.data;
  },

  getCommunityImpact: async (): Promise<CommunityImpactStats> => {
    const response = await axios.get<CommunityImpactStats>('/api/v1/volunteer/community-impact');
    return response.data;
  },

  downloadCertificate: async (academicYear?: string): Promise<Blob> => {
    const params = academicYear ? `?academic_year=${academicYear}` : '';
    const response = await axios.get(`/api/v1/volunteer/certificate${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getCertificateData: async (academicYear?: string): Promise<VolunteerCertificate> => {
    const params = academicYear ? `?academic_year=${academicYear}` : '';
    const response = await axios.get<VolunteerCertificate>(
      `/api/v1/volunteer/certificate/data${params}`
    );
    return response.data;
  },

  getAnalytics: async (startDate?: string, endDate?: string): Promise<VolunteerAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await axios.get<VolunteerAnalytics>(
      `/api/v1/volunteer/analytics?${params.toString()}`
    );
    return response.data;
  },

  updateAnonymousSetting: async (isAnonymous: boolean): Promise<void> => {
    await axios.put('/api/v1/volunteer/settings/anonymous', { is_anonymous: isAnonymous });
  },
};
