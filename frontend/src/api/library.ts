import axios from 'axios';
import { Book, BookCategory, BookIssue, LibrarySettings } from '../types/library';

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

export const libraryApi = {
  listBooks: async (params?: Record<string, unknown>) => {
    const response = await api.get('/library/books', { params });
    return response.data;
  },

  getBook: async (id: number) => {
    const response = await api.get(`/library/books/${id}`);
    return response.data;
  },

  createBook: async (data: Partial<Book>) => {
    const response = await api.post('/library/books', data);
    return response.data;
  },

  updateBook: async (id: number, data: Partial<Book>) => {
    const response = await api.put(`/library/books/${id}`, data);
    return response.data;
  },

  deleteBook: async (id: number) => {
    await api.delete(`/library/books/${id}`);
  },

  listCategories: async () => {
    const response = await api.get('/library/categories');
    return response.data;
  },

  createCategory: async (data: Partial<BookCategory>) => {
    const response = await api.post('/library/categories', data);
    return response.data;
  },

  listIssues: async (params?: Record<string, unknown>) => {
    const response = await api.get('/library/issues', { params });
    return response.data;
  },

  getIssue: async (id: number) => {
    const response = await api.get(`/library/issues/${id}`);
    return response.data;
  },

  issueBook: async (data: Partial<BookIssue>) => {
    const response = await api.post('/library/issues', data);
    return response.data;
  },

  returnBook: async (id: number, data?: Partial<BookIssue>) => {
    const response = await api.post(`/library/issues/${id}/return`, data);
    return response.data;
  },

  renewBook: async (id: number) => {
    const response = await api.post(`/library/issues/${id}/renew`);
    return response.data;
  },

  getOverdueBooks: async () => {
    const response = await api.get('/library/overdue');
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/library/settings');
    return response.data;
  },

  updateSettings: async (data: Partial<LibrarySettings>) => {
    const response = await api.put('/library/settings', data);
    return response.data;
  },
};
