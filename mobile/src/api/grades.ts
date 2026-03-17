import { apiClient } from './client';

export interface ExamDetail {
  id: number;
  name: string;
  subject: string;
  subjectCode?: string;
  term: string;
  examType: 'midterm' | 'final' | 'quiz' | 'test' | 'assignment';
  totalMarks: number;
  passingMarks: number;
  scheduledDate: string;
  duration?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface GradeDetail {
  id: number;
  examId: number;
  examName: string;
  subject: string;
  subjectCode?: string;
  term: string;
  examType: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  classAverage?: number;
  highestMarks?: number;
  lowestMarks?: number;
  examDate: string;
  publishedDate?: string;
  remarks?: string;
  teacherComments?: string;
}

export interface SubjectGrades {
  subject: string;
  subjectCode?: string;
  grades: GradeDetail[];
  average: number;
  totalExams: number;
  currentGrade: string;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export interface PerformanceInsights {
  overallAverage: number;
  overallGrade: string;
  totalExams: number;
  improvement: number;
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  improvements: string[];
}

export interface GradesParams {
  term?: string;
  subject?: string;
  examType?: string;
  page?: number;
  limit?: number;
}

export interface ExamsParams {
  term?: string;
  subject?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
}

export const gradesApi = {
  getGrades: async (params?: GradesParams) => {
    const queryParams = new URLSearchParams();
    if (params?.term) queryParams.append('term', params.term);
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.examType) queryParams.append('exam_type', params.examType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/v1/grades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<GradeDetail[]>(url);
  },

  getExams: async (params?: ExamsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.term) queryParams.append('term', params.term);
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/api/v1/exams${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<ExamDetail[]>(url);
  },

  getGradeById: async (gradeId: number) => {
    return apiClient.get<GradeDetail>(`/api/v1/grades/${gradeId}`);
  },

  getSubjectGrades: async (subject: string, term?: string) => {
    const queryParams = new URLSearchParams({ subject });
    if (term) queryParams.append('term', term);

    return apiClient.get<SubjectGrades>(`/api/v1/grades/by-subject?${queryParams.toString()}`);
  },

  getGradeDistribution: async (term?: string) => {
    const queryParams = term ? `?term=${term}` : '';
    return apiClient.get<GradeDistribution[]>(`/api/v1/grades/distribution${queryParams}`);
  },

  getPerformanceInsights: async (term?: string) => {
    const queryParams = term ? `?term=${term}` : '';
    return apiClient.get<PerformanceInsights>(`/api/v1/grades/insights${queryParams}`);
  },
};
