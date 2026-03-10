import axios from '@/lib/axios';

export interface Teacher {
  id: number;
  institution_id: number;
  user_id?: number;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  joining_date?: string;
  is_active: boolean;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  subjects?: Subject[];
  classes?: ClassAssignment[];
  performance_stats?: TeacherPerformanceStats;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  is_primary?: boolean;
}

export interface ClassAssignment {
  id: number;
  class_name: string;
  section: string;
  subject?: string;
  student_count: number;
}

export interface TeacherPerformanceStats {
  class_average: number;
  total_students: number;
  assignments_graded: number;
  attendance_rate: number;
  workload_hours: number;
}

export interface TeacherCreate {
  institution_id: number;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  joining_date?: string;
  is_active?: boolean;
  user_id?: number;
}

export interface TeacherUpdate {
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  joining_date?: string;
  is_active?: boolean;
}

export interface TeacherSubjectAssignment {
  teacher_id: number;
  subject_id: number;
  is_primary: boolean;
  institution_id: number;
}

export interface BulkImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    email?: string;
    error: string;
  }>;
}

export interface TeacherListResponse {
  items: Teacher[];
  total: number;
  skip: number;
  limit: number;
}

export interface TeacherDashboardData {
  teacher_id: number;
  teacher_name: string;
  total_classes: number;
  total_students: number;
  class_averages: Array<{
    class_name: string;
    section: string;
    subject: string;
    average_score: number;
    student_count: number;
  }>;
  workload_distribution: Array<{
    week: string;
    hours: number;
    assignments: number;
    classes: number;
  }>;
  subject_performance: Array<{
    subject: string;
    average_score: number;
    classes: number;
    students: number;
  }>;
  recent_activities: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

const teachersApi = {
  listTeachers: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<TeacherListResponse> => {
    const response = await axios.get<TeacherListResponse>('/api/v1/teachers/', {
      params,
    });
    return response.data;
  },

  getTeacher: async (teacherId: number): Promise<Teacher> => {
    const response = await axios.get<Teacher>(`/api/v1/teachers/${teacherId}`);
    return response.data;
  },

  createTeacher: async (data: TeacherCreate): Promise<Teacher> => {
    const response = await axios.post<Teacher>('/api/v1/teachers/', data);
    return response.data;
  },

  updateTeacher: async (teacherId: number, data: TeacherUpdate): Promise<Teacher> => {
    const response = await axios.put<Teacher>(`/api/v1/teachers/${teacherId}`, data);
    return response.data;
  },

  deleteTeacher: async (teacherId: number): Promise<void> => {
    await axios.delete(`/api/v1/teachers/${teacherId}`);
  },

  bulkImportTeachers: async (file: File): Promise<BulkImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<BulkImportResult>('/api/v1/teachers/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTeacherSubjects: async (teacherId: number): Promise<Subject[]> => {
    const response = await axios.get<Subject[]>(`/api/v1/teachers/${teacherId}/subjects`);
    return response.data;
  },

  assignSubject: async (data: TeacherSubjectAssignment): Promise<void> => {
    await axios.post('/api/v1/teachers/teacher-subjects', data);
  },

  removeSubject: async (teacherId: number, subjectId: number): Promise<void> => {
    await axios.delete(`/api/v1/teachers/teacher-subjects/${teacherId}/${subjectId}`);
  },

  uploadPhoto: async (teacherId: number, file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await axios.post<{ photo_url: string }>(
      `/api/v1/teachers/${teacherId}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getTeacherDashboard: async (teacherId: number): Promise<TeacherDashboardData> => {
    const response = await axios.get<TeacherDashboardData>(
      `/api/v1/teachers/${teacherId}/dashboard`
    );
    return response.data;
  },
};

export default teachersApi;
