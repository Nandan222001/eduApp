import axios from '@/lib/axios';
import {
  MoodEntry,
  WeeklySurveyResponse,
  AnonymousReport,
  WellbeingAlert,
  Intervention,
  ParentNotification,
  MentalHealthResource,
  Referral,
  StudentWellbeingProfile,
  CounselorDashboardStats,
  AlertNote,
  StudentBasicInfo,
} from '@/types/wellbeing';

export const wellbeingApi = {
  // Mood Tracker
  submitMoodEntry: (institutionId: number, data: Omit<MoodEntry, 'id' | 'created_at'>) =>
    axios.post(`/wellbeing/mood-entries?institution_id=${institutionId}`, data),

  getMoodEntries: (institutionId: number, studentId: number, days = 30) =>
    axios.get<MoodEntry[]>(
      `/wellbeing/mood-entries?institution_id=${institutionId}&student_id=${studentId}&days=${days}`
    ),

  // Weekly Surveys
  submitSurvey: (institutionId: number, data: Omit<WeeklySurveyResponse, 'id' | 'completed_at'>) =>
    axios.post(`/wellbeing/surveys?institution_id=${institutionId}`, data),

  getSurveys: (institutionId: number, studentId: number, surveyType?: string) =>
    axios.get<WeeklySurveyResponse[]>(
      `/wellbeing/surveys?institution_id=${institutionId}&student_id=${studentId}${surveyType ? `&survey_type=${surveyType}` : ''}`
    ),

  getLatestSurvey: (institutionId: number, studentId: number, surveyType: string) =>
    axios.get<WeeklySurveyResponse>(
      `/wellbeing/surveys/latest?institution_id=${institutionId}&student_id=${studentId}&survey_type=${surveyType}`
    ),

  // Anonymous Reports
  submitAnonymousReport: (
    institutionId: number,
    data: Omit<AnonymousReport, 'id' | 'created_at' | 'updated_at'>
  ) => axios.post(`/wellbeing/anonymous-reports?institution_id=${institutionId}`, data),

  getAnonymousReports: (institutionId: number, status?: string) =>
    axios.get<AnonymousReport[]>(
      `/wellbeing/anonymous-reports?institution_id=${institutionId}${status ? `&status=${status}` : ''}`
    ),

  updateReportStatus: (institutionId: number, reportId: number, status: string) =>
    axios.patch(`/wellbeing/anonymous-reports/${reportId}?institution_id=${institutionId}`, {
      status,
    }),

  // Wellbeing Alerts
  getAlerts: (
    institutionId: number,
    params?: {
      student_id?: number;
      status?: string;
      severity?: string;
      assigned_counselor_id?: number;
      limit?: number;
      offset?: number;
    }
  ) => {
    const queryParams = new URLSearchParams({ institution_id: institutionId.toString() });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return axios.get<WellbeingAlert[]>(`/wellbeing/alerts?${queryParams.toString()}`);
  },

  getAlert: (institutionId: number, alertId: number, currentUserId: number) =>
    axios.get<WellbeingAlert>(
      `/wellbeing/alerts/${alertId}?institution_id=${institutionId}&current_user_id=${currentUserId}`
    ),

  updateAlert: (
    institutionId: number,
    alertId: number,
    currentUserId: number,
    data: {
      status?: string;
      assigned_counselor_id?: number;
      resolution_notes?: string;
      parent_notified?: boolean;
    }
  ) =>
    axios.patch(
      `/wellbeing/alerts/${alertId}?institution_id=${institutionId}&current_user_id=${currentUserId}`,
      data
    ),

  addAlertNote: (
    institutionId: number,
    alertId: number,
    currentUserId: number,
    content: string,
    isConfidential = true
  ) =>
    axios.post<AlertNote>(
      `/wellbeing/alerts/${alertId}/notes?institution_id=${institutionId}&current_user_id=${currentUserId}`,
      { alert_id: alertId, content, is_confidential: isConfidential }
    ),

  getAlertNotes: (institutionId: number, alertId: number) =>
    axios.get<AlertNote[]>(`/wellbeing/alerts/${alertId}/notes?institution_id=${institutionId}`),

  // Interventions
  createIntervention: (data: Omit<Intervention, 'id' | 'created_at' | 'updated_at'>) =>
    axios.post<Intervention>('/wellbeing/interventions', data),

  updateIntervention: (
    institutionId: number,
    interventionId: number,
    data: {
      completed_at?: string;
      outcome?: string;
      follow_up_required?: boolean;
      follow_up_date?: string;
    }
  ) =>
    axios.patch<Intervention>(
      `/wellbeing/interventions/${interventionId}?institution_id=${institutionId}`,
      data
    ),

  getInterventions: (
    institutionId: number,
    params?: {
      student_id?: number;
      counselor_id?: number;
      completed?: boolean;
      limit?: number;
      offset?: number;
    }
  ) => {
    const queryParams = new URLSearchParams({ institution_id: institutionId.toString() });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return axios.get<Intervention[]>(`/wellbeing/interventions?${queryParams.toString()}`);
  },

  // Parent Notifications
  sendParentNotification: (
    data: Omit<ParentNotification, 'id' | 'sent_at' | 'acknowledged' | 'acknowledged_at'>
  ) => axios.post<ParentNotification>('/wellbeing/parent-notifications', data),

  getParentNotifications: (studentId?: number, alertId?: number) => {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId.toString());
    if (alertId) params.append('alert_id', alertId.toString());
    return axios.get<ParentNotification[]>(`/wellbeing/parent-notifications?${params.toString()}`);
  },

  acknowledgeNotification: (notificationId: number) =>
    axios.patch(`/wellbeing/parent-notifications/${notificationId}/acknowledge`, {}),

  // Mental Health Resources
  getResources: (institutionId: number, type?: string) =>
    axios.get<MentalHealthResource[]>(
      `/wellbeing/resources?institution_id=${institutionId}${type ? `&type=${type}` : ''}`
    ),

  createResource: (institutionId: number, data: Omit<MentalHealthResource, 'id'>) =>
    axios.post<MentalHealthResource>(`/wellbeing/resources?institution_id=${institutionId}`, data),

  updateResource: (
    institutionId: number,
    resourceId: number,
    data: Partial<MentalHealthResource>
  ) =>
    axios.patch<MentalHealthResource>(
      `/wellbeing/resources/${resourceId}?institution_id=${institutionId}`,
      data
    ),

  deleteResource: (institutionId: number, resourceId: number) =>
    axios.delete(`/wellbeing/resources/${resourceId}?institution_id=${institutionId}`),

  // Referrals
  createReferral: (data: Omit<Referral, 'id' | 'created_at' | 'updated_at'>) =>
    axios.post<Referral>('/wellbeing/referrals', data),

  updateReferral: (
    referralId: number,
    data: {
      status?: string;
      appointment_date?: string;
      outcome?: string;
      completed_at?: string;
    }
  ) => axios.patch<Referral>(`/wellbeing/referrals/${referralId}`, data),

  getReferrals: (institutionId: number, studentId?: number, status?: string) => {
    const params = new URLSearchParams({ institution_id: institutionId.toString() });
    if (studentId) params.append('student_id', studentId.toString());
    if (status) params.append('status', status);
    return axios.get<Referral[]>(`/wellbeing/referrals?${params.toString()}`);
  },

  // Student Wellbeing Profile
  getStudentProfile: (institutionId: number, studentId: number, currentUserId: number) =>
    axios.get<StudentWellbeingProfile>(
      `/wellbeing/students/${studentId}/profile?institution_id=${institutionId}&current_user_id=${currentUserId}`
    ),

  // Counselor Dashboard
  getCounselorDashboard: (institutionId: number, counselorId?: number) => {
    const params = new URLSearchParams({ institution_id: institutionId.toString() });
    if (counselorId) params.append('counselor_id', counselorId.toString());
    return axios.get<{
      stats: CounselorDashboardStats;
      high_priority_students: StudentBasicInfo[];
      recent_alerts: WellbeingAlert[];
      pending_interventions: Intervention[];
    }>(`/wellbeing/dashboard/counselor?${params.toString()}`);
  },
};
