import axios from '@/lib/axios';

export interface Class {
  id: number;
  institution_id: number;
  grade: number;
  section: string;
  class_teacher_id?: number;
  class_teacher_name?: string;
  student_capacity: number;
  current_students: number;
  room_number?: string;
  academic_year?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassCreate {
  institution_id: number;
  grade: number;
  section: string;
  class_teacher_id?: number;
  student_capacity: number;
  room_number?: string;
  academic_year?: string;
  is_active?: boolean;
}

export interface ClassUpdate {
  grade?: number;
  section?: string;
  class_teacher_id?: number;
  student_capacity?: number;
  room_number?: string;
  academic_year?: string;
  is_active?: boolean;
}

export interface ClassListResponse {
  items: Class[];
  total: number;
  skip: number;
  limit: number;
}

const classesApi = {
  listClasses: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    grade?: number;
    is_active?: boolean;
  }): Promise<ClassListResponse> => {
    const response = await axios.get<ClassListResponse>('/api/v1/classes/', {
      params,
    });
    return response.data;
  },

  getClass: async (classId: number): Promise<Class> => {
    const response = await axios.get<Class>(`/api/v1/classes/${classId}`);
    return response.data;
  },

  createClass: async (data: ClassCreate): Promise<Class> => {
    const response = await axios.post<Class>('/api/v1/classes/', data);
    return response.data;
  },

  updateClass: async (classId: number, data: ClassUpdate): Promise<Class> => {
    const response = await axios.put<Class>(`/api/v1/classes/${classId}`, data);
    return response.data;
  },

  deleteClass: async (classId: number): Promise<void> => {
    await axios.delete(`/api/v1/classes/${classId}`);
  },
};

export default classesApi;
