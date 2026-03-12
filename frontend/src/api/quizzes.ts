import axios from 'axios';
import {
  Quiz,
  QuizCreateInput,
  QuizQuestion,
  QuestionCreateInput,
  QuizAttempt,
  QuizSubmissionInput,
  QuizLeaderboardEntry,
  QuizDetailedAnalytics,
} from '../types/quiz';

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

export const quizApi = {
  // Quiz operations
  listQuizzes: async (params?: {
    skip?: number;
    limit?: number;
    institution_id?: number;
    creator_id?: number;
    grade_id?: number;
    subject_id?: number;
    quiz_type?: string;
    status?: string;
    search?: string;
  }) => {
    const response = await api.get('/quizzes', { params });
    return response.data;
  },

  getQuiz: async (quizId: number): Promise<Quiz> => {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  },

  getQuizForStudent: async (quizId: number): Promise<Quiz> => {
    const response = await api.get(`/quizzes/${quizId}/student`);
    return response.data;
  },

  createQuiz: async (quiz: QuizCreateInput) => {
    const response = await api.post('/quizzes', quiz);
    return response.data;
  },

  createQuizWithQuestions: async (data: {
    quiz: QuizCreateInput;
    questions: Omit<QuestionCreateInput, 'quiz_id'>[];
  }) => {
    const response = await api.post('/quizzes/bulk', data);
    return response.data;
  },

  updateQuiz: async (quizId: number, updates: Partial<QuizCreateInput>) => {
    const response = await api.put(`/quizzes/${quizId}`, updates);
    return response.data;
  },

  deleteQuiz: async (quizId: number) => {
    await api.delete(`/quizzes/${quizId}`);
  },

  publishQuiz: async (quizId: number) => {
    const response = await api.post(`/quizzes/${quizId}/publish`);
    return response.data;
  },

  // Question operations
  listQuestions: async (quizId: number): Promise<QuizQuestion[]> => {
    const response = await api.get(`/quizzes/${quizId}/questions`);
    return response.data;
  },

  createQuestion: async (quizId: number, question: Omit<QuestionCreateInput, 'quiz_id'>) => {
    const response = await api.post(`/quizzes/${quizId}/questions`, {
      ...question,
      quiz_id: quizId,
    });
    return response.data;
  },

  updateQuestion: async (questionId: number, updates: Partial<QuestionCreateInput>) => {
    const response = await api.put(`/quizzes/questions/${questionId}`, updates);
    return response.data;
  },

  deleteQuestion: async (questionId: number) => {
    await api.delete(`/quizzes/questions/${questionId}`);
  },

  // Attempt operations
  startAttempt: async (quizId: number, userId: number): Promise<QuizAttempt> => {
    const response = await api.post('/quizzes/attempts', {
      quiz_id: quizId,
      user_id: userId,
    });
    return response.data;
  },

  getAttempt: async (attemptId: number): Promise<QuizAttempt> => {
    const response = await api.get(`/quizzes/attempts/${attemptId}`);
    return response.data;
  },

  submitQuiz: async (submission: QuizSubmissionInput): Promise<QuizAttempt> => {
    const response = await api.post(
      `/quizzes/attempts/${submission.attempt_id}/submit`,
      submission
    );
    return response.data;
  },

  getAttemptResponses: async (attemptId: number) => {
    const response = await api.get(`/quizzes/attempts/${attemptId}/responses`);
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (quizId: number, limit: number = 100): Promise<QuizLeaderboardEntry[]> => {
    const response = await api.get(`/quizzes/${quizId}/leaderboard`, {
      params: { limit },
    });
    return response.data;
  },

  // Analytics
  getAnalytics: async (quizId: number): Promise<QuizDetailedAnalytics> => {
    const response = await api.get(`/quizzes/${quizId}/analytics`);
    return response.data;
  },
};
