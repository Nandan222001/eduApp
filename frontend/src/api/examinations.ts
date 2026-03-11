import axios from '@/lib/axios';
import {
  Exam,
  ExamCreateInput,
  ExamSubject,
  ExamSubjectCreateInput,
  ExamSchedule,
  ExamScheduleCreateInput,
  ExamMarks,
  BulkMarksEntryInput,
  ExamResult,
  GradeConfiguration,
  ExamPerformanceAnalytics,
  PerformanceComparison,
  ExamStatus,
  ExamType,
} from '@/types/examination';

export interface ExamListParams {
  institution_id?: number;
  academic_year_id?: number;
  grade_id?: number;
  exam_type?: ExamType;
  status?: ExamStatus;
  skip?: number;
  limit?: number;
}

export interface ExamListResponse {
  items: Exam[];
  total: number;
  skip: number;
  limit: number;
}

export interface BulkMarksResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    student_id: number;
    error: string;
  }>;
}

const examinationsApi = {
  createExam: async (data: ExamCreateInput): Promise<Exam> => {
    const response = await axios.post<Exam>('/api/v1/exams', data);
    return response.data;
  },

  listExams: async (params: ExamListParams): Promise<ExamListResponse> => {
    const response = await axios.get<ExamListResponse>('/api/v1/exams', { params });
    return response.data;
  },

  getExam: async (examId: number, institutionId: number): Promise<Exam> => {
    const response = await axios.get<Exam>(`/api/v1/exams/${examId}`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  updateExam: async (
    examId: number,
    data: Partial<ExamCreateInput> & { institution_id: number }
  ): Promise<Exam> => {
    const response = await axios.put<Exam>(`/api/v1/exams/${examId}`, data);
    return response.data;
  },

  deleteExam: async (examId: number, institutionId: number): Promise<void> => {
    await axios.delete(`/api/v1/exams/${examId}`, {
      params: { institution_id: institutionId },
    });
  },

  addSubject: async (examId: number, data: ExamSubjectCreateInput): Promise<ExamSubject> => {
    const response = await axios.post<ExamSubject>(`/api/v1/exams/${examId}/subjects`, data);
    return response.data;
  },

  listExamSubjects: async (examId: number, institutionId: number): Promise<ExamSubject[]> => {
    const response = await axios.get<ExamSubject[]>(`/api/v1/exams/${examId}/subjects`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  updateExamSubject: async (
    examSubjectId: number,
    data: Partial<ExamSubjectCreateInput> & { institution_id: number }
  ): Promise<ExamSubject> => {
    const response = await axios.put<ExamSubject>(`/api/v1/exams/subjects/${examSubjectId}`, data);
    return response.data;
  },

  uploadQuestionPaper: async (
    examSubjectId: number,
    file: File,
    institutionId: number
  ): Promise<ExamSubject> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<ExamSubject>(
      `/api/v1/exams/subjects/${examSubjectId}/question-paper`,
      formData,
      {
        params: { institution_id: institutionId },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  createSchedule: async (examId: number, data: ExamScheduleCreateInput): Promise<ExamSchedule> => {
    const response = await axios.post<ExamSchedule>(`/api/v1/exams/${examId}/schedules`, data);
    return response.data;
  },

  listSchedules: async (examId: number, institutionId: number): Promise<ExamSchedule[]> => {
    const response = await axios.get<ExamSchedule[]>(`/api/v1/exams/${examId}/schedules`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  updateSchedule: async (
    scheduleId: number,
    data: Partial<ExamScheduleCreateInput> & { institution_id: number }
  ): Promise<ExamSchedule> => {
    const response = await axios.put<ExamSchedule>(`/api/v1/exams/schedules/${scheduleId}`, data);
    return response.data;
  },

  deleteSchedule: async (scheduleId: number, institutionId: number): Promise<void> => {
    await axios.delete(`/api/v1/exams/schedules/${scheduleId}`, {
      params: { institution_id: institutionId },
    });
  },

  bulkEnterMarks: async (
    data: BulkMarksEntryInput,
    institutionId: number,
    enteredBy: number
  ): Promise<BulkMarksResult> => {
    const response = await axios.post<BulkMarksResult>('/api/v1/exams/marks/bulk', data, {
      params: { institution_id: institutionId, entered_by: enteredBy },
    });
    return response.data;
  },

  getSubjectMarks: async (examSubjectId: number, institutionId: number): Promise<ExamMarks[]> => {
    const response = await axios.get<ExamMarks[]>(`/api/v1/exams/subjects/${examSubjectId}/marks`, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  generateResults: async (examId: number, institutionId: number): Promise<void> => {
    await axios.post(`/api/v1/exams/${examId}/results/generate`, null, {
      params: { institution_id: institutionId },
    });
  },

  listResults: async (
    examId: number,
    institutionId: number,
    sectionId?: number
  ): Promise<ExamResult[]> => {
    const response = await axios.get<ExamResult[]>(`/api/v1/exams/${examId}/results`, {
      params: { institution_id: institutionId, section_id: sectionId },
    });
    return response.data;
  },

  getStudentResult: async (
    examId: number,
    studentId: number,
    institutionId: number
  ): Promise<ExamResult> => {
    const response = await axios.get<ExamResult>(
      `/api/v1/exams/${examId}/results/student/${studentId}`,
      {
        params: { institution_id: institutionId },
      }
    );
    return response.data;
  },

  publishResults: async (examId: number, institutionId: number): Promise<Exam> => {
    const response = await axios.post<Exam>(`/api/v1/exams/${examId}/results/publish`, null, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  unpublishResults: async (examId: number, institutionId: number): Promise<Exam> => {
    const response = await axios.post<Exam>(`/api/v1/exams/${examId}/results/unpublish`, null, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  generateAnalytics: async (
    examId: number,
    institutionId: number,
    sectionId?: number,
    subjectId?: number
  ): Promise<ExamPerformanceAnalytics> => {
    const response = await axios.post<ExamPerformanceAnalytics>(
      `/api/v1/exams/${examId}/analytics/generate`,
      null,
      {
        params: {
          institution_id: institutionId,
          section_id: sectionId,
          subject_id: subjectId,
        },
      }
    );
    return response.data;
  },

  getAnalytics: async (
    examId: number,
    institutionId: number,
    sectionId?: number,
    subjectId?: number
  ): Promise<ExamPerformanceAnalytics[]> => {
    const response = await axios.get<ExamPerformanceAnalytics[]>(
      `/api/v1/exams/${examId}/analytics`,
      {
        params: {
          institution_id: institutionId,
          section_id: sectionId,
          subject_id: subjectId,
        },
      }
    );
    return response.data;
  },

  comparePerformance: async (
    data: PerformanceComparison,
    institutionId: number
  ): Promise<unknown> => {
    const response = await axios.post('/api/v1/exams/analytics/compare', data, {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  listGradeConfigurations: async (institutionId: number): Promise<GradeConfiguration[]> => {
    const response = await axios.get<GradeConfiguration[]>('/api/v1/exams/grade-configurations', {
      params: { institution_id: institutionId },
    });
    return response.data;
  },

  createGradeConfiguration: async (
    data: Omit<GradeConfiguration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<GradeConfiguration> => {
    const response = await axios.post<GradeConfiguration>(
      '/api/v1/exams/grade-configurations',
      data
    );
    return response.data;
  },

  updateGradeConfiguration: async (
    configId: number,
    data: Partial<Omit<GradeConfiguration, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<GradeConfiguration> => {
    const response = await axios.put<GradeConfiguration>(
      `/api/v1/exams/grade-configurations/${configId}`,
      data
    );
    return response.data;
  },

  deleteGradeConfiguration: async (configId: number, institutionId: number): Promise<void> => {
    await axios.delete(`/api/v1/exams/grade-configurations/${configId}`, {
      params: { institution_id: institutionId },
    });
  },
};

export default examinationsApi;
