import axios from 'axios';
import { FeeStructure, FeePayment, FeeWaiver } from '../types/fee';

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

export const feeApi = {
  // Fee Structures
  listStructures: async (params?: Record<string, unknown>) => {
    const response = await api.get('/fees/structures', { params });
    return response.data;
  },

  getStructure: async (id: number) => {
    const response = await api.get(`/fees/structures/${id}`);
    return response.data;
  },

  createStructure: async (data: Partial<FeeStructure>) => {
    const response = await api.post('/fees/structures', data);
    return response.data;
  },

  updateStructure: async (id: number, data: Partial<FeeStructure>) => {
    const response = await api.put(`/fees/structures/${id}`, data);
    return response.data;
  },

  deleteStructure: async (id: number) => {
    await api.delete(`/fees/structures/${id}`);
  },

  // Payments
  listPayments: async (params?: Record<string, unknown>) => {
    const response = await api.get('/fees/payments', { params });
    return response.data;
  },

  getPayment: async (id: number) => {
    const response = await api.get(`/fees/payments/${id}`);
    return response.data;
  },

  recordPayment: async (data: Partial<FeePayment>) => {
    const response = await api.post('/fees/payments', data);
    return response.data;
  },

  getReceipt: async (receiptNumber: string) => {
    const response = await api.get(`/fees/receipts/${receiptNumber}`);
    return response.data;
  },

  // Outstanding Dues
  getOutstandingDues: async (gradeId?: number) => {
    const response = await api.get('/fees/outstanding-dues', {
      params: { grade_id: gradeId },
    });
    return response.data;
  },

  // Waivers
  listWaivers: async (params?: Record<string, unknown>) => {
    const response = await api.get('/fees/waivers', { params });
    return response.data;
  },

  createWaiver: async (data: Partial<FeeWaiver>) => {
    const response = await api.post('/fees/waivers', data);
    return response.data;
  },
};
