import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PlagiarismCheckCreate {
  assignment_id: number;
  submission_id?: number;
  content_type: 'TEXT' | 'SOURCE_CODE' | 'MIXED';
  comparison_scope: 'WITHIN_BATCH' | 'CROSS_BATCH' | 'CROSS_INSTITUTION' | 'ALL';
  enable_cross_institution: boolean;
  anonymize_cross_institution: boolean;
  check_settings?: Record<string, unknown>;
}

export interface ReviewSubmission {
  review_decision:
    | 'CONFIRMED_PLAGIARISM'
    | 'FALSE_POSITIVE'
    | 'LEGITIMATE_CITATION'
    | 'NEEDS_INVESTIGATION'
    | 'DISMISSED';
  review_notes?: string;
  is_false_positive: boolean;
  false_positive_reason?: string;
}

export const plagiarismApi = {
  createCheck: async (data: PlagiarismCheckCreate) => {
    const response = await api.post('/plagiarism/checks', data);
    return response.data;
  },

  getCheck: async (checkId: number) => {
    const response = await api.get(`/plagiarism/checks/${checkId}`);
    return response.data;
  },

  listAssignmentChecks: async (assignmentId: number, skip = 0, limit = 100) => {
    const response = await api.get(`/plagiarism/checks/assignment/${assignmentId}`, {
      params: { skip, limit },
    });
    return response.data;
  },

  getCheckResults: async (checkId: number, minSimilarity?: number, skip = 0, limit = 100) => {
    const response = await api.get(`/plagiarism/results/check/${checkId}`, {
      params: { min_similarity: minSimilarity, skip, limit },
    });
    return response.data;
  },

  getResultDetails: async (resultId: number) => {
    const response = await api.get(`/plagiarism/results/${resultId}`);
    return response.data;
  },

  reviewResult: async (resultId: number, review: ReviewSubmission) => {
    const response = await api.post(`/plagiarism/results/${resultId}/review`, review);
    return response.data;
  },

  getVisualization: async (resultId: number) => {
    const response = await api.get(`/plagiarism/visualization/${resultId}`);
    return response.data;
  },

  getReport: async (assignmentId: number) => {
    const response = await api.get(`/plagiarism/report/assignment/${assignmentId}`);
    return response.data;
  },

  getSubmissionResults: async (submissionId: number, skip = 0, limit = 100) => {
    const response = await api.get(`/plagiarism/results/submission/${submissionId}`, {
      params: { skip, limit },
    });
    return response.data;
  },

  createPrivacyConsent: async (data: Record<string, unknown>) => {
    const response = await api.post('/plagiarism/privacy-consent', data);
    return response.data;
  },

  getPrivacyConsent: async () => {
    const response = await api.get('/plagiarism/privacy-consent');
    return response.data;
  },
};
