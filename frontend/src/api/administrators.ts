import axios from '@/lib/axios';

export interface Administrator {
  id: number;
  institution_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'institution_admin';
  department?: string;
  designation?: string;
  is_active: boolean;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AdministratorCreate {
  institution_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'institution_admin';
  department?: string;
  designation?: string;
  is_active?: boolean;
}

export interface AdministratorUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'institution_admin';
  department?: string;
  designation?: string;
  is_active?: boolean;
}

export interface AdministratorListResponse {
  items: Administrator[];
  total: number;
  skip: number;
  limit: number;
}

const administratorsApi = {
  listAdministrators: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    role?: 'admin' | 'institution_admin';
  }): Promise<AdministratorListResponse> => {
    const response = await axios.get<AdministratorListResponse>('/api/v1/administrators/', {
      params,
    });
    return response.data;
  },

  getAdministrator: async (adminId: number): Promise<Administrator> => {
    const response = await axios.get<Administrator>(`/api/v1/administrators/${adminId}`);
    return response.data;
  },

  createAdministrator: async (data: AdministratorCreate): Promise<Administrator> => {
    const response = await axios.post<Administrator>('/api/v1/administrators/', data);
    return response.data;
  },

  updateAdministrator: async (
    adminId: number,
    data: AdministratorUpdate
  ): Promise<Administrator> => {
    const response = await axios.put<Administrator>(`/api/v1/administrators/${adminId}`, data);
    return response.data;
  },

  deleteAdministrator: async (adminId: number): Promise<void> => {
    await axios.delete(`/api/v1/administrators/${adminId}`);
  },

  uploadPhoto: async (adminId: number, file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await axios.post<{ photo_url: string }>(
      `/api/v1/administrators/${adminId}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export default administratorsApi;
