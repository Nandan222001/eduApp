import axios from '@/lib/axios';
import {
  College,
  CollegeVisit,
  CollegeApplication,
  CollegeSearchFilters,
  FinancialAidEstimate,
  CounselorFeedback,
  StudentCollegeList,
  CollegeVisitSchedule,
  ApplicationStatistics,
  ApplicationChecklistItem,
  ApplicationEssay,
  RecommendationRequest,
  EssayRevision,
} from '@/types/college';

const collegeApi = {
  searchColleges: async (filters: CollegeSearchFilters): Promise<College[]> => {
    const response = await axios.post('/colleges/search', filters);
    return response.data;
  },

  getCollege: async (id: number): Promise<College> => {
    const response = await axios.get(`/colleges/${id}`);
    return response.data;
  },

  getVisits: async (studentId: number): Promise<CollegeVisit[]> => {
    const response = await axios.get(`/students/${studentId}/college-visits`);
    return response.data;
  },

  createVisit: async (studentId: number, data: Partial<CollegeVisit>): Promise<CollegeVisit> => {
    const response = await axios.post(`/students/${studentId}/college-visits`, data);
    return response.data;
  },

  updateVisit: async (visitId: number, data: Partial<CollegeVisit>): Promise<CollegeVisit> => {
    const response = await axios.put(`/college-visits/${visitId}`, data);
    return response.data;
  },

  deleteVisit: async (visitId: number): Promise<void> => {
    await axios.delete(`/college-visits/${visitId}`);
  },

  uploadVisitPhoto: async (visitId: number, photo: File): Promise<void> => {
    const formData = new FormData();
    formData.append('photo', photo);
    await axios.post(`/college-visits/${visitId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getApplications: async (studentId: number): Promise<CollegeApplication[]> => {
    const response = await axios.get(`/students/${studentId}/college-applications`);
    return response.data;
  },

  createApplication: async (
    studentId: number,
    data: Partial<CollegeApplication>
  ): Promise<CollegeApplication> => {
    const response = await axios.post(`/students/${studentId}/college-applications`, data);
    return response.data;
  },

  updateApplication: async (
    applicationId: number,
    data: Partial<CollegeApplication>
  ): Promise<CollegeApplication> => {
    const response = await axios.put(`/college-applications/${applicationId}`, data);
    return response.data;
  },

  deleteApplication: async (applicationId: number): Promise<void> => {
    await axios.delete(`/college-applications/${applicationId}`);
  },

  getApplicationStatistics: async (studentId: number): Promise<ApplicationStatistics> => {
    const response = await axios.get(`/students/${studentId}/college-applications/statistics`);
    return response.data;
  },

  updateChecklistItem: async (
    itemId: number,
    data: Partial<ApplicationChecklistItem>
  ): Promise<ApplicationChecklistItem> => {
    const response = await axios.put(`/application-checklist-items/${itemId}`, data);
    return response.data;
  },

  createChecklistItem: async (
    applicationId: number,
    data: Partial<ApplicationChecklistItem>
  ): Promise<ApplicationChecklistItem> => {
    const response = await axios.post(
      `/college-applications/${applicationId}/checklist-items`,
      data
    );
    return response.data;
  },

  getEssays: async (applicationId: number): Promise<ApplicationEssay[]> => {
    const response = await axios.get(`/college-applications/${applicationId}/essays`);
    return response.data;
  },

  updateEssay: async (
    essayId: number,
    data: Partial<ApplicationEssay>
  ): Promise<ApplicationEssay> => {
    const response = await axios.put(`/application-essays/${essayId}`, data);
    return response.data;
  },

  saveEssayRevision: async (essayId: number, content: string): Promise<EssayRevision> => {
    const response = await axios.post(`/application-essays/${essayId}/revisions`, { content });
    return response.data;
  },

  getRecommendations: async (applicationId: number): Promise<RecommendationRequest[]> => {
    const response = await axios.get(`/college-applications/${applicationId}/recommendations`);
    return response.data;
  },

  createRecommendation: async (
    applicationId: number,
    data: Partial<RecommendationRequest>
  ): Promise<RecommendationRequest> => {
    const response = await axios.post(
      `/college-applications/${applicationId}/recommendations`,
      data
    );
    return response.data;
  },

  updateRecommendation: async (
    recommendationId: number,
    data: Partial<RecommendationRequest>
  ): Promise<RecommendationRequest> => {
    const response = await axios.put(`/recommendation-requests/${recommendationId}`, data);
    return response.data;
  },

  sendRecommendationReminder: async (recommendationId: number): Promise<void> => {
    await axios.post(`/recommendation-requests/${recommendationId}/reminder`);
  },

  getFinancialAidEstimates: async (studentId: number): Promise<FinancialAidEstimate[]> => {
    const response = await axios.get(`/students/${studentId}/financial-aid-estimates`);
    return response.data;
  },

  createFinancialAidEstimate: async (
    studentId: number,
    data: Partial<FinancialAidEstimate>
  ): Promise<FinancialAidEstimate> => {
    const response = await axios.post(`/students/${studentId}/financial-aid-estimates`, data);
    return response.data;
  },

  updateFinancialAidEstimate: async (
    estimateId: number,
    data: Partial<FinancialAidEstimate>
  ): Promise<FinancialAidEstimate> => {
    const response = await axios.put(`/financial-aid-estimates/${estimateId}`, data);
    return response.data;
  },

  getCounselorFeedback: async (studentId: number): Promise<CounselorFeedback[]> => {
    const response = await axios.get(`/students/${studentId}/counselor-feedback`);
    return response.data;
  },

  markFeedbackAsRead: async (feedbackId: number): Promise<void> => {
    await axios.put(`/counselor-feedback/${feedbackId}/read`);
  },

  getCollegeList: async (studentId: number): Promise<StudentCollegeList> => {
    const response = await axios.get(`/students/${studentId}/college-list`);
    return response.data;
  },

  shareCollegeListWithCounselor: async (studentId: number): Promise<void> => {
    await axios.post(`/students/${studentId}/college-list/share`);
  },

  getVisitSchedule: async (studentId: number): Promise<CollegeVisitSchedule[]> => {
    const response = await axios.get(`/students/${studentId}/visit-schedule`);
    return response.data;
  },

  createVisitSchedule: async (
    studentId: number,
    data: Partial<CollegeVisitSchedule>
  ): Promise<CollegeVisitSchedule> => {
    const response = await axios.post(`/students/${studentId}/visit-schedule`, data);
    return response.data;
  },

  updateVisitSchedule: async (
    scheduleId: number,
    data: Partial<CollegeVisitSchedule>
  ): Promise<CollegeVisitSchedule> => {
    const response = await axios.put(`/visit-schedule/${scheduleId}`, data);
    return response.data;
  },

  deleteVisitSchedule: async (scheduleId: number): Promise<void> => {
    await axios.delete(`/visit-schedule/${scheduleId}`);
  },
};

export default collegeApi;
