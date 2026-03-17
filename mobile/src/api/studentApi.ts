import { apiClient } from './client';
import {
  StudentStats,
  Assignment,
  Grade,
  AttendanceStatus,
  AIPrediction,
  WeakArea,
  StudyMaterial,
  Subject,
  AssignmentSubmission,
  GamificationBadge,
  Achievement,
} from '../types/student';

export const studentApi = {
  getStats: async (): Promise<StudentStats> => {
    return apiClient.get('/student/stats');
  },

  getAttendance: async (): Promise<AttendanceStatus> => {
    return apiClient.get('/student/attendance');
  },

  getAssignments: async (status?: 'pending' | 'submitted' | 'graded'): Promise<Assignment[]> => {
    const params = status ? { status } : {};
    return apiClient.get('/student/assignments', { params });
  },

  getAssignmentById: async (id: number): Promise<Assignment> => {
    return apiClient.get(`/student/assignments/${id}`);
  },

  submitAssignment: async (submission: AssignmentSubmission): Promise<any> => {
    const formData = new FormData();
    
    submission.files.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    if (submission.comments) {
      formData.append('comments', submission.comments);
    }

    return apiClient.post(`/student/assignments/${submission.assignment_id}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getGrades: async (limit?: number): Promise<Grade[]> => {
    const params = limit ? { limit } : {};
    return apiClient.get('/student/grades', { params });
  },

  getAIPredictions: async (): Promise<AIPrediction[]> => {
    return apiClient.get('/student/predictions');
  },

  getWeakAreas: async (): Promise<WeakArea[]> => {
    return apiClient.get('/student/weak-areas');
  },

  getSubjects: async (): Promise<Subject[]> => {
    return apiClient.get('/student/subjects');
  },

  getStudyMaterials: async (subjectId?: number): Promise<StudyMaterial[]> => {
    const params = subjectId ? { subject_id: subjectId } : {};
    return apiClient.get('/student/materials', { params });
  },

  getMaterialById: async (id: number): Promise<StudyMaterial> => {
    return apiClient.get(`/student/materials/${id}`);
  },

  getBadges: async (): Promise<GamificationBadge[]> => {
    return apiClient.get('/student/gamification/badges');
  },

  getAchievements: async (limit?: number): Promise<Achievement[]> => {
    const params = limit ? { limit } : {};
    return apiClient.get('/student/gamification/achievements', { params });
  },
};
