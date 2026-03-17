import axios from '@/lib/axios';

export interface Subject {
  id: number;
  institution_id: number;
  name: string;
  code: string;
  description?: string;
  is_elective: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectCreate {
  institution_id: number;
  name: string;
  code: string;
  description?: string;
  is_elective?: boolean;
  is_active?: boolean;
}

export interface SubjectUpdate {
  name?: string;
  code?: string;
  description?: string;
  is_elective?: boolean;
  is_active?: boolean;
}

export interface SubjectListResponse {
  items: Subject[];
  total: number;
  skip: number;
  limit: number;
}

export interface SubjectTeacherClassAssignment {
  id: number;
  subject_id: number;
  teacher_id: number;
  class_id: number;
  teacher_name: string;
  class_name: string;
  section: string;
  is_active: boolean;
  created_at: string;
}

export interface SubjectTeacherClassAssignmentCreate {
  subject_id: number;
  teacher_id: number;
  class_id: number;
  institution_id: number;
  is_active?: boolean;
}

export interface AssignmentMatrixData {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  assignments: Array<{
    id: number;
    teacher_id: number;
    teacher_name: string;
    class_id: number;
    class_name: string;
    section: string;
    is_active: boolean;
  }>;
}

const subjectsApi = {
  listSubjects: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_elective?: boolean;
    is_active?: boolean;
  }): Promise<SubjectListResponse> => {
    const response = await axios.get<SubjectListResponse>('/api/v1/subjects/', {
      params,
    });
    return response.data;
  },

  getSubject: async (subjectId: number): Promise<Subject> => {
    const response = await axios.get<Subject>(`/api/v1/subjects/${subjectId}`);
    return response.data;
  },

  createSubject: async (data: SubjectCreate): Promise<Subject> => {
    const response = await axios.post<Subject>('/api/v1/subjects/', data);
    return response.data;
  },

  updateSubject: async (subjectId: number, data: SubjectUpdate): Promise<Subject> => {
    const response = await axios.put<Subject>(`/api/v1/subjects/${subjectId}`, data);
    return response.data;
  },

  deleteSubject: async (subjectId: number): Promise<void> => {
    await axios.delete(`/api/v1/subjects/${subjectId}`);
  },

  getSubjectAssignments: async (subjectId: number): Promise<SubjectTeacherClassAssignment[]> => {
    const response = await axios.get<SubjectTeacherClassAssignment[]>(
      `/api/v1/subjects/${subjectId}/assignments`
    );
    return response.data;
  },

  createAssignment: async (
    data: SubjectTeacherClassAssignmentCreate
  ): Promise<SubjectTeacherClassAssignment> => {
    const response = await axios.post<SubjectTeacherClassAssignment>(
      '/api/v1/subjects/assignments',
      data
    );
    return response.data;
  },

  deleteAssignment: async (assignmentId: number): Promise<void> => {
    await axios.delete(`/api/v1/subjects/assignments/${assignmentId}`);
  },

  getAssignmentMatrix: async (): Promise<AssignmentMatrixData[]> => {
    const response = await axios.get<AssignmentMatrixData[]>('/api/v1/subjects/assignment-matrix');
    return response.data;
  },
};

export default subjectsApi;
