import axios from 'axios';
import { isDemoUser, demoDataApi } from './demoDataApi';
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
    if (isDemoUser()) {
      return demoDataApi.quizzes.listQuizzes(params);
    }
    const response = await api.get('/quizzes', { params });
    return response.data;
  },

  getQuiz: async (quizId: number): Promise<Quiz> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.getQuiz(quizId);
    }
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  },

  getQuizForStudent: async (quizId: number): Promise<Quiz> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.getQuizForStudent(quizId);
    }
    const response = await api.get(`/quizzes/${quizId}/student`);
    return response.data;
  },

  createQuiz: async (quiz: QuizCreateInput) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.createQuiz(quiz);
    }
    const response = await api.post('/quizzes', quiz);
    return response.data;
  },

  createQuizWithQuestions: async (data: {
    quiz: QuizCreateInput;
    questions: Omit<QuestionCreateInput, 'quiz_id'>[];
  }) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.createQuizWithQuestions(data);
    }
    const response = await api.post('/quizzes/bulk', data);
    return response.data;
  },

  updateQuiz: async (quizId: number, updates: Partial<QuizCreateInput>) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.updateQuiz(quizId, updates);
    }
    const response = await api.put(`/quizzes/${quizId}`, updates);
    return response.data;
  },

  deleteQuiz: async (quizId: number) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.deleteQuiz(quizId);
    }
    await api.delete(`/quizzes/${quizId}`);
  },

  publishQuiz: async (quizId: number) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.publishQuiz(quizId);
    }
    const response = await api.post(`/quizzes/${quizId}/publish`);
    return response.data;
  },

  // Question operations
  listQuestions: async (quizId: number): Promise<QuizQuestion[]> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.listQuestions(quizId);
    }
    const response = await api.get(`/quizzes/${quizId}/questions`);
    return response.data;
  },

  createQuestion: async (quizId: number, question: Omit<QuestionCreateInput, 'quiz_id'>) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.createQuestion(quizId, question);
    }
    const response = await api.post(`/quizzes/${quizId}/questions`, {
      ...question,
      quiz_id: quizId,
    });
    return response.data;
  },

  updateQuestion: async (questionId: number, updates: Partial<QuestionCreateInput>) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.updateQuestion(questionId, updates);
    }
    const response = await api.put(`/quizzes/questions/${questionId}`, updates);
    return response.data;
  },

  deleteQuestion: async (questionId: number) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.deleteQuestion(questionId);
    }
    await api.delete(`/quizzes/questions/${questionId}`);
  },

  // Attempt operations
  startAttempt: async (quizId: number, userId: number): Promise<QuizAttempt> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.startAttempt(quizId, userId);
    }
    const response = await api.post('/quizzes/attempts', {
      quiz_id: quizId,
      user_id: userId,
    });
    return response.data;
  },

  getAttempt: async (attemptId: number): Promise<QuizAttempt> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.getAttempt(attemptId);
    }
    const response = await api.get(`/quizzes/attempts/${attemptId}`);
    return response.data;
  },

  submitQuiz: async (submission: QuizSubmissionInput): Promise<QuizAttempt> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.submitQuiz(submission);
    }
    const response = await api.post(
      `/quizzes/attempts/${submission.attempt_id}/submit`,
      submission
    );
    return response.data;
  },

  getAttemptResponses: async (attemptId: number) => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.getAttemptResponses(attemptId);
    }
    const response = await api.get(`/quizzes/attempts/${attemptId}/responses`);
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (quizId: number, limit: number = 100): Promise<QuizLeaderboardEntry[]> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.getLeaderboard(quizId, limit);
    }
    const response = await api.get(`/quizzes/${quizId}/leaderboard`, {
      params: { limit },
    });
    return response.data;
  },

  // Analytics
  getAnalytics: async (quizId: number): Promise<QuizDetailedAnalytics> => {
    if (isDemoUser()) {
      return demoDataApi.quizzes.getAnalytics(quizId);
    }
    const response = await api.get(`/quizzes/${quizId}/analytics`);
    return response.data;
  },
};
