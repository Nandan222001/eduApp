import axios from '@/lib/axios';

export interface Student {
  id: number;
  institution_id: number;
  user_id?: number;
  section_id?: number;
  admission_number?: string;
  roll_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  admission_date?: string;
  photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  previous_school?: string;
  medical_conditions?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  category?: string;
  aadhar_number?: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  section?: SectionInfo;
  parents_info?: ParentInfo[];
}

export interface ParentInfo {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  relation_type?: string;
  is_primary_contact: boolean;
}

export interface Parent {
  id: number;
  institution_id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  occupation?: string;
  address?: string;
  photo_url?: string;
  relation_type?: string;
  is_primary_contact: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentCreate {
  institution_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  occupation?: string;
  address?: string;
  relation_type?: string;
  is_primary_contact?: boolean;
}

export interface LinkParentRequest {
  parent_id: number;
  relation_type: string;
  is_primary_contact?: boolean;
}

export interface SectionInfo {
  id: number;
  name: string;
  grade_id: number;
  grade?: GradeInfo;
}

export interface GradeInfo {
  id: number;
  name: string;
}

export interface StudentProfile extends Student {
  attendance_summary?: AttendanceSummary;
  recent_performance?: PerformanceSummary[];
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  attendance_percentage: number;
}

export interface PerformanceSummary {
  exam_name: string;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade?: string;
  rank?: number;
}

export interface StudentCreate {
  institution_id: number;
  section_id?: number;
  user_id?: number;
  admission_number?: string;
  roll_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  admission_date?: string;
  photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  previous_school?: string;
  medical_conditions?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  category?: string;
  aadhar_number?: string;
  status?: string;
  is_active?: boolean;
  parent_ids?: number[];
}

export interface StudentUpdate {
  admission_number?: string;
  roll_number?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  admission_date?: string;
  section_id?: number;
  photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  previous_school?: string;
  medical_conditions?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  category?: string;
  aadhar_number?: string;
  status?: string;
  is_active?: boolean;
}

export interface BulkImportPreviewRow {
  row_number: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
  is_valid: boolean;
}

export interface BulkImportPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  preview: BulkImportPreviewRow[];
}

export interface BulkImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    email?: string;
    admission_number?: string;
    error: string;
  }>;
}

export interface StudentPromotionRequest {
  student_ids: number[];
  target_grade_id: number;
  target_section_id?: number;
  effective_date?: string;
}

export interface StudentTransferRequest {
  student_id: number;
  target_section_id: number;
  effective_date?: string;
  reason?: string;
}

export interface IDCardData {
  student_id: number;
  student_name: string;
  admission_number: string;
  class_section: string;
  photo_url?: string;
  institution_name: string;
  institution_logo?: string;
  valid_until: string;
  date_of_birth?: string;
  blood_group?: string;
}

export interface StudentStatistics {
  total_students: number;
  active_students: number;
  inactive_students: number;
  male_students: number;
  female_students: number;
  students_by_grade: Record<string, number>;
  students_by_status: Record<string, number>;
}

export interface StudentListResponse {
  items: Student[];
  total: number;
  skip: number;
  limit: number;
}

export interface StudentListParams {
  skip?: number;
  limit?: number;
  grade_id?: number;
  section_id?: number;
  search?: string;
  is_active?: boolean;
  status?: string;
  gender?: string;
}

export interface StudentDashboardData {
  student_id: number;
  student_name: string;
  photo_url?: string;
  section?: string;
  grade?: string;
  todays_attendance: {
    status: string;
    date: string;
  };
  attendance_summary: {
    total_days: number;
    present_days: number;
    absent_days: number;
    attendance_percentage: number;
  };
  upcoming_assignments: Array<{
    id: number;
    title: string;
    subject?: string;
    due_date: string;
    days_until_due: number;
    total_marks: number;
    submission_status: string;
    is_submitted: boolean;
  }>;
  pending_homework: Array<{
    id: number;
    title: string;
    subject?: string;
    due_date: string;
    is_completed: boolean;
  }>;
  recent_grades: Array<{
    exam_name: string;
    subject?: string;
    marks_obtained: number;
    max_marks: number;
    percentage: number;
    grade?: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  ai_prediction?: {
    predicted_percentage: number;
    confidence: number;
    confidence_lower?: number;
    confidence_upper?: number;
    predicted_at?: string;
  };
  weak_areas: Array<{
    id: number;
    topic: string;
    subject?: string;
    weakness_score: number;
    recommendations: string[];
  }>;
  study_streak: {
    current_streak: number;
    longest_streak: number;
    last_activity?: string;
  };
  points_and_rank: {
    total_points: number;
    level: number;
    rank?: number;
  };
  badges: Array<{
    id: number;
    name: string;
    description?: string;
    icon_url?: string;
    badge_type: string;
    rarity: string;
    earned_at?: string;
  }>;
  todays_tasks: Array<{
    id: number;
    title: string;
    subject?: string;
    priority: string;
    status: string;
    estimated_duration?: number;
  }>;
  quick_links: Array<{
    title: string;
    path: string;
    icon: string;
  }>;
}

const studentsApi = {
  listStudents: async (params: StudentListParams): Promise<StudentListResponse> => {
    const response = await axios.get('/api/v1/students/', { params });
    return response.data;
  },

  getStatistics: async (): Promise<StudentStatistics> => {
    const response = await axios.get('/api/v1/students/statistics');
    return response.data;
  },

  getStudent: async (id: number): Promise<Student> => {
    const response = await axios.get(`/api/v1/students/${id}`);
    return response.data;
  },

  getStudentProfile: async (id: number): Promise<StudentProfile> => {
    const response = await axios.get(`/api/v1/students/${id}/profile`);
    return response.data;
  },

  createStudent: async (data: StudentCreate): Promise<Student> => {
    const response = await axios.post('/api/v1/students/', data);
    return response.data;
  },

  updateStudent: async (id: number, data: StudentUpdate): Promise<Student> => {
    const response = await axios.put(`/api/v1/students/${id}`, data);
    return response.data;
  },

  deleteStudent: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/students/${id}`);
  },

  uploadPhoto: async (id: number, file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`/api/v1/students/${id}/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  previewBulkImport: async (file: File): Promise<BulkImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/api/v1/students/bulk-import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  bulkImport: async (file: File): Promise<BulkImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/api/v1/students/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  promoteStudents: async (
    data: StudentPromotionRequest
  ): Promise<{ promoted: number; failed: number; errors: unknown[] }> => {
    const response = await axios.post('/api/v1/students/promote', data);
    return response.data;
  },

  transferStudent: async (data: StudentTransferRequest): Promise<Student> => {
    const response = await axios.post('/api/v1/students/transfer', data);
    return response.data;
  },

  getIDCardData: async (id: number): Promise<IDCardData> => {
    const response = await axios.get(`/api/v1/students/${id}/id-card`);
    return response.data;
  },

  downloadIDCard: async (id: number): Promise<Blob> => {
    const response = await axios.get(`/api/v1/students/${id}/id-card/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  createParent: async (data: ParentCreate): Promise<Parent> => {
    const response = await axios.post('/api/v1/students/parents', data);
    return response.data;
  },

  linkParentToStudent: async (studentId: number, data: LinkParentRequest): Promise<void> => {
    await axios.post(`/api/v1/students/${studentId}/parents/link`, data);
  },

  unlinkParentFromStudent: async (studentId: number, parentId: number): Promise<void> => {
    await axios.delete(`/api/v1/students/${studentId}/parents/${parentId}`);
  },

  getStudentDashboard: async (id: number): Promise<StudentDashboardData> => {
    const response = await axios.get(`/api/v1/students/${id}/dashboard`);
    return response.data;
  },
};

export default studentsApi;
