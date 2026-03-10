import axios from '@/lib/axios';
import type { ExampleData } from '@/types/example';

export const exampleApi = {
  getAll: async (): Promise<ExampleData[]> => {
    const response = await axios.get<ExampleData[]>('/api/examples');
    return response.data;
  },

  getById: async (id: string): Promise<ExampleData> => {
    const response = await axios.get<ExampleData>(`/api/examples/${id}`);
    return response.data;
  },

  create: async (data: Omit<ExampleData, 'id'>): Promise<ExampleData> => {
    const response = await axios.post<ExampleData>('/api/examples', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ExampleData>): Promise<ExampleData> => {
    const response = await axios.put<ExampleData>(`/api/examples/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`/api/examples/${id}`);
  },
};
