import axios from '@/lib/axios';
import type {
  Grade,
  GradeCreate,
  GradeUpdate,
  Section,
  SectionCreate,
  SectionUpdate,
  Subject,
  SubjectCreate,
  SubjectUpdate,
  SubjectAssignment,
  SubjectAssignmentCreate,
  SubjectAssignmentUpdate,
  Chapter,
  ChapterCreate,
  ChapterUpdate,
  Topic,
  TopicCreate,
  TopicUpdate,
  Syllabus,
  SyllabusCreate,
  SyllabusUpdate,
  ClassTeacherAssignment,
} from '@/types/academic';

export const academicApi = {
  // Grades
  getGrades: async (isActive?: boolean): Promise<Grade[]> => {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await axios.get<Grade[]>('/api/v1/academic/grades', { params });
    return response.data;
  },

  getGrade: async (id: number): Promise<Grade> => {
    const response = await axios.get<Grade>(`/api/v1/academic/grades/${id}`);
    return response.data;
  },

  createGrade: async (data: GradeCreate): Promise<Grade> => {
    const response = await axios.post<Grade>('/api/v1/academic/grades', data);
    return response.data;
  },

  updateGrade: async (id: number, data: GradeUpdate): Promise<Grade> => {
    const response = await axios.put<Grade>(`/api/v1/academic/grades/${id}`, data);
    return response.data;
  },

  deleteGrade: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/academic/grades/${id}`);
  },

  // Sections
  getSections: async (gradeId?: number, isActive?: boolean): Promise<Section[]> => {
    const params: Record<string, unknown> = {};
    if (gradeId !== undefined) params.grade_id = gradeId;
    if (isActive !== undefined) params.is_active = isActive;
    const response = await axios.get<Section[]>('/api/v1/academic/sections', { params });
    return response.data;
  },

  getSection: async (id: number): Promise<Section> => {
    const response = await axios.get<Section>(`/api/v1/academic/sections/${id}`);
    return response.data;
  },

  createSection: async (data: SectionCreate): Promise<Section> => {
    const response = await axios.post<Section>('/api/v1/academic/sections', data);
    return response.data;
  },

  updateSection: async (id: number, data: SectionUpdate): Promise<Section> => {
    const response = await axios.put<Section>(`/api/v1/academic/sections/${id}`, data);
    return response.data;
  },

  deleteSection: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/academic/sections/${id}`);
  },

  assignClassTeacher: async (data: ClassTeacherAssignment): Promise<Section> => {
    const response = await axios.post<Section>(
      `/api/v1/academic/sections/${data.section_id}/assign-teacher`,
      { teacher_id: data.teacher_id }
    );
    return response.data;
  },

  // Subjects
  getSubjects: async (isActive?: boolean): Promise<Subject[]> => {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await axios.get<Subject[]>('/api/v1/academic/subjects', { params });
    return response.data;
  },

  getSubject: async (id: number): Promise<Subject> => {
    const response = await axios.get<Subject>(`/api/v1/academic/subjects/${id}`);
    return response.data;
  },

  createSubject: async (data: SubjectCreate): Promise<Subject> => {
    const response = await axios.post<Subject>('/api/v1/academic/subjects', data);
    return response.data;
  },

  updateSubject: async (id: number, data: SubjectUpdate): Promise<Subject> => {
    const response = await axios.put<Subject>(`/api/v1/academic/subjects/${id}`, data);
    return response.data;
  },

  deleteSubject: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/academic/subjects/${id}`);
  },

  // Subject Assignments
  getSubjectAssignments: async (
    gradeId?: number,
    subjectId?: number,
    teacherId?: number
  ): Promise<SubjectAssignment[]> => {
    const params: Record<string, unknown> = {};
    if (gradeId !== undefined) params.grade_id = gradeId;
    if (subjectId !== undefined) params.subject_id = subjectId;
    if (teacherId !== undefined) params.teacher_id = teacherId;
    const response = await axios.get<SubjectAssignment[]>('/api/v1/academic/subject-assignments', {
      params,
    });
    return response.data;
  },

  createSubjectAssignment: async (data: SubjectAssignmentCreate): Promise<SubjectAssignment> => {
    const response = await axios.post<SubjectAssignment>(
      '/api/v1/academic/subject-assignments',
      data
    );
    return response.data;
  },

  updateSubjectAssignment: async (
    id: number,
    data: SubjectAssignmentUpdate
  ): Promise<SubjectAssignment> => {
    const response = await axios.put<SubjectAssignment>(
      `/api/v1/academic/subject-assignments/${id}`,
      data
    );
    return response.data;
  },

  deleteSubjectAssignment: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/academic/subject-assignments/${id}`);
  },

  // Chapters
  getChapters: async (subjectId?: number): Promise<Chapter[]> => {
    const params = subjectId !== undefined ? { subject_id: subjectId } : {};
    const response = await axios.get<Chapter[]>('/api/v1/academic/chapters', { params });
    return response.data;
  },

  getChapter: async (id: number): Promise<Chapter> => {
    const response = await axios.get<Chapter>(`/api/v1/academic/chapters/${id}`);
    return response.data;
  },

  createChapter: async (data: ChapterCreate): Promise<Chapter> => {
    const response = await axios.post<Chapter>('/api/v1/academic/chapters', data);
    return response.data;
  },

  updateChapter: async (id: number, data: ChapterUpdate): Promise<Chapter> => {
    const response = await axios.put<Chapter>(`/api/v1/academic/chapters/${id}`, data);
    return response.data;
  },

  deleteChapter: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/academic/chapters/${id}`);
  },

  // Topics
  getTopics: async (chapterId?: number): Promise<Topic[]> => {
    const params = chapterId !== undefined ? { chapter_id: chapterId } : {};
    const response = await axios.get<Topic[]>('/api/v1/academic/topics', { params });
    return response.data;
  },

  getTopic: async (id: number): Promise<Topic> => {
    const response = await axios.get<Topic>(`/api/v1/academic/topics/${id}`);
    return response.data;
  },

  createTopic: async (data: TopicCreate): Promise<Topic> => {
    const response = await axios.post<Topic>('/api/v1/academic/topics', data);
    return response.data;
  },

  updateTopic: async (id: number, data: TopicUpdate): Promise<Topic> => {
    const response = await axios.put<Topic>(`/api/v1/academic/topics/${id}`, data);
    return response.data;
  },

  deleteTopic: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/academic/topics/${id}`);
  },

  // Syllabus
  getSyllabi: async (subjectId?: number, gradeId?: number): Promise<Syllabus[]> => {
    const params: Record<string, unknown> = {};
    if (subjectId !== undefined) params.subject_id = subjectId;
    if (gradeId !== undefined) params.grade_id = gradeId;
    const response = await axios.get<Syllabus[]>('/api/v1/academic/syllabus', { params });
    return response.data;
  },

  getSyllabus: async (id: number): Promise<Syllabus> => {
    const response = await axios.get<Syllabus>(`/api/v1/academic/syllabus/${id}`);
    return response.data;
  },

  createSyllabus: async (data: SyllabusCreate): Promise<Syllabus> => {
    const response = await axios.post<Syllabus>('/api/v1/academic/syllabus', data);
    return response.data;
  },

  updateSyllabus: async (id: number, data: SyllabusUpdate): Promise<Syllabus> => {
    const response = await axios.put<Syllabus>(`/api/v1/academic/syllabus/${id}`, data);
    return response.data;
  },

  deleteSyllabus: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/academic/syllabus/${id}`);
  },

  uploadSyllabusFile: async (id: number, file: File): Promise<Syllabus> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<Syllabus>(
      `/api/v1/academic/syllabus/${id}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  downloadSyllabusFile: async (id: number): Promise<Blob> => {
    const response = await axios.get(`/api/v1/academic/syllabus/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
