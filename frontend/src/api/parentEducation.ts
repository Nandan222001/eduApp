import axios from 'axios';
import type {
  Course,
  CourseDetail,
  Enrollment,
  EnrollmentDetail,
  Lesson,
  CourseMaterial,
  QuizQuestion,
  QuizAttempt,
  LessonProgress,
  Note,
  DiscussionThread,
  DiscussionReply,
  Certificate,
} from '@/types/parentEducation';

const BASE_URL = '/api/v1/parent-education';

export const parentEducationApi = {
  // Course catalog
  getCourses: async (params?: {
    category_id?: number;
    level?: string;
    search?: string;
  }): Promise<Course[]> => {
    const response = await axios.get<Course[]>(`${BASE_URL}/courses`, { params });
    return response.data;
  },

  getCourseDetail: async (courseId: number): Promise<CourseDetail> => {
    const response = await axios.get<CourseDetail>(`${BASE_URL}/courses/${courseId}`);
    return response.data;
  },

  // Enrollment
  enrollCourse: async (courseId: number): Promise<Enrollment> => {
    const response = await axios.post<Enrollment>(`${BASE_URL}/courses/${courseId}/enroll`);
    return response.data;
  },

  getMyEnrollments: async (): Promise<Enrollment[]> => {
    const response = await axios.get<Enrollment[]>(`${BASE_URL}/my-enrollments`);
    return response.data;
  },

  getEnrollmentDetail: async (enrollmentId: number): Promise<EnrollmentDetail> => {
    const response = await axios.get<EnrollmentDetail>(`${BASE_URL}/enrollments/${enrollmentId}`);
    return response.data;
  },

  // Lessons
  getLesson: async (lessonId: number): Promise<Lesson> => {
    const response = await axios.get<Lesson>(`${BASE_URL}/lessons/${lessonId}`);
    return response.data;
  },

  getLessonMaterials: async (lessonId: number): Promise<CourseMaterial[]> => {
    const response = await axios.get<CourseMaterial[]>(`${BASE_URL}/lessons/${lessonId}/materials`);
    return response.data;
  },

  // Progress tracking
  updateLessonProgress: async (
    enrollmentId: number,
    lessonId: number,
    data: {
      is_completed?: boolean;
      time_spent_seconds?: number;
      last_position_seconds?: number;
    }
  ): Promise<LessonProgress> => {
    const response = await axios.post<LessonProgress>(
      `${BASE_URL}/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      data
    );
    return response.data;
  },

  markLessonComplete: async (enrollmentId: number, lessonId: number): Promise<void> => {
    await axios.post(`${BASE_URL}/enrollments/${enrollmentId}/lessons/${lessonId}/complete`);
  },

  // Notes
  getNotes: async (enrollmentId: number, lessonId?: number): Promise<Note[]> => {
    const params = lessonId ? { lesson_id: lessonId } : {};
    const response = await axios.get<Note[]>(`${BASE_URL}/enrollments/${enrollmentId}/notes`, {
      params,
    });
    return response.data;
  },

  createNote: async (
    enrollmentId: number,
    data: {
      lesson_id: number;
      content: string;
      timestamp_seconds?: number;
    }
  ): Promise<Note> => {
    const response = await axios.post<Note>(`${BASE_URL}/enrollments/${enrollmentId}/notes`, data);
    return response.data;
  },

  updateNote: async (noteId: number, content: string): Promise<Note> => {
    const response = await axios.patch<Note>(`${BASE_URL}/notes/${noteId}`, { content });
    return response.data;
  },

  deleteNote: async (noteId: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/notes/${noteId}`);
  },

  // Quiz
  getQuizQuestions: async (lessonId: number): Promise<QuizQuestion[]> => {
    const response = await axios.get<QuizQuestion[]>(`${BASE_URL}/lessons/${lessonId}/quiz`);
    return response.data;
  },

  submitQuiz: async (lessonId: number, answers: Record<number, string>): Promise<QuizAttempt> => {
    const response = await axios.post<QuizAttempt>(`${BASE_URL}/lessons/${lessonId}/quiz/submit`, {
      answers,
    });
    return response.data;
  },

  // Discussion forums
  getDiscussionThreads: async (
    courseId: number,
    lessonId?: number
  ): Promise<DiscussionThread[]> => {
    const params = lessonId ? { lesson_id: lessonId } : {};
    const response = await axios.get<DiscussionThread[]>(
      `${BASE_URL}/courses/${courseId}/discussions`,
      { params }
    );
    return response.data;
  },

  getDiscussionThread: async (threadId: number): Promise<DiscussionThread> => {
    const response = await axios.get<DiscussionThread>(
      `${BASE_URL}/discussions/threads/${threadId}`
    );
    return response.data;
  },

  createDiscussionThread: async (
    courseId: number,
    data: {
      lesson_id?: number;
      title: string;
      content: string;
    }
  ): Promise<DiscussionThread> => {
    const response = await axios.post<DiscussionThread>(
      `${BASE_URL}/courses/${courseId}/discussions`,
      data
    );
    return response.data;
  },

  getThreadReplies: async (threadId: number): Promise<DiscussionReply[]> => {
    const response = await axios.get<DiscussionReply[]>(
      `${BASE_URL}/discussions/threads/${threadId}/replies`
    );
    return response.data;
  },

  createThreadReply: async (
    threadId: number,
    data: {
      content: string;
      parent_id?: number;
    }
  ): Promise<DiscussionReply> => {
    const response = await axios.post<DiscussionReply>(
      `${BASE_URL}/discussions/threads/${threadId}/replies`,
      data
    );
    return response.data;
  },

  // Certificates
  getCertificate: async (enrollmentId: number): Promise<Certificate> => {
    const response = await axios.get<Certificate>(
      `${BASE_URL}/enrollments/${enrollmentId}/certificate`
    );
    return response.data;
  },

  downloadCertificate: async (enrollmentId: number): Promise<Blob> => {
    const response = await axios.get(
      `${BASE_URL}/enrollments/${enrollmentId}/certificate/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
