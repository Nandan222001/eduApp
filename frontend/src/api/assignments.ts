import axios from 'axios';
import {
  AssignmentCreateInput,
  AssignmentListParams,
  SubmissionListParams,
  SubmissionGradeInput,
  RubricCriteria,
} from '../types/assignment';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
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

export const assignmentApi = {
  list: async (params?: AssignmentListParams) => {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  getWithRubric: async (id: number) => {
    const response = await api.get(`/assignments/${id}/with-rubric`);
    return response.data;
  },

  create: async (data: AssignmentCreateInput) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  update: async (id: number, data: Partial<AssignmentCreateInput>) => {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/assignments/${id}`);
  },

  uploadFile: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/assignments/${id}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFile: async (assignmentId: number, fileId: number) => {
    await api.delete(`/assignments/${assignmentId}/files/${fileId}`);
  },

  listSubmissions: async (assignmentId: number, params?: SubmissionListParams) => {
    const response = await api.get(`/assignments/${assignmentId}/submissions`, {
      params,
    });
    return response.data;
  },

  getStatistics: async (assignmentId: number) => {
    const response = await api.get(`/assignments/${assignmentId}/statistics`);
    return response.data;
  },

  getAnalytics: async (assignmentId: number) => {
    const response = await api.get(`/assignments/${assignmentId}/analytics`);
    return response.data;
  },

  createRubricCriteria: async (assignmentId: number, data: RubricCriteria) => {
    const response = await api.post(`/assignments/${assignmentId}/rubric`, data);
    return response.data;
  },

  updateRubricCriteria: async (
    assignmentId: number,
    criteriaId: number,
    data: Partial<RubricCriteria>
  ) => {
    const response = await api.put(`/assignments/${assignmentId}/rubric/${criteriaId}`, data);
    return response.data;
  },

  deleteRubricCriteria: async (assignmentId: number, criteriaId: number) => {
    await api.delete(`/assignments/${assignmentId}/rubric/${criteriaId}`);
  },

  bulkDownloadSubmissions: async (assignmentId: number) => {
    const response = await api.get(`/assignments/${assignmentId}/submissions/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const submissionApi = {
  get: async (id: number) => {
    const response = await api.get(`/assignments/submissions/${id}/with-grades`);
    return response.data;
  },

  grade: async (id: number, data: SubmissionGradeInput) => {
    const response = await api.post(`/assignments/submissions/${id}/grade-with-rubric`, data);
    return response.data;
  },
};
