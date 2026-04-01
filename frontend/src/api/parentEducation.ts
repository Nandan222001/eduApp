import axios from '@/lib/axios';

export interface CourseMaterial {
  id: number;
  lesson_id: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export interface Note {
  id: number;
  enrollment_id: number;
  lesson_id: number;
  content: string;
  timestamp_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface ParentCourse {
  id: number;
  title: string;
  description: string;
  short_description: string;
  category: string;
  level: string;
  thumbnail_url?: string;
  duration_hours: number;
  learning_objectives: string[];
  prerequisites: string[];
  is_free: boolean;
  price?: number;
  certificate_enabled: boolean;
  passing_score: number;
  status: string;
  total_enrollments: number;
  total_completions: number;
  average_rating?: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: number;
  module_id: number;
  title: string;
  description?: string;
  order_index: number;
  content_type: string;
  video_url?: string;
  video_duration_seconds?: number;
  article_content?: string;
  pdf_url?: string;
  attachments?: Array<{ name: string; url: string }>;
  external_links?: Array<{ title: string; url: string }>;
  is_preview: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  type: string;
  video_url?: string;
  transcript?: string;
  content?: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  criteria: string;
  awarded_at: string;
}

export interface CourseEnrollment {
  id: number;
  course_id: number;
  parent_id: number;
  status: string;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  completed_at?: string;
  certificate_url?: string;
  final_score?: number;
  last_accessed_at?: string;
  total_time_spent_minutes: number;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
  current_lesson?: {
    id: number;
    title: string;
    description?: string;
    type: string;
    video_url?: string;
    transcript?: string;
    content?: string;
  };
  course?: {
    id: number;
    title: string;
    thumbnail_url?: string;
    lessons?: Lesson[];
  };
  lesson_progress?: LessonProgress[];
  badges?: Badge[];
}

export interface LessonProgress {
  id: number;
  enrollment_id: number;
  lesson_id: number;
  is_completed: boolean;
  completed_at?: string;
  video_progress_seconds: number;
  video_watched_percentage: number;
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface LessonQuiz {
  id: number;
  lesson_id: number;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: string;
  order_index: number;
  options?: Array<{ id: string; text: string }>;
  correct_answer: unknown;
  explanation?: string;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  enrollment_id: number;
  status: string;
  score?: number;
  total_points?: number;
  earned_points?: number;
  started_at?: string;
  completed_at?: string;
  time_spent_minutes: number;
  is_passed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseReview {
  id: number;
  course_id: number;
  parent_id: number;
  rating: number;
  review_text?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: number;
  forum_id: number;
  parent_id: number;
  parent_post_id?: number;
  title?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseStatistics {
  total_courses: number;
  published_courses: number;
  total_enrollments: number;
  completion_rate: number;
  average_rating: number;
  popular_categories: Record<string, number>;
}

export interface CourseCatalogFilter {
  category?: string;
  level?: string;
  is_free?: boolean;
  min_rating?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export const parentEducationApi = {
  // Courses
  listCourses: async (filters?: CourseCatalogFilter): Promise<ParentCourse[]> => {
    const response = await axios.get<ParentCourse[]>('/api/v1/parent-education/courses', {
      params: filters,
    });
    return response.data;
  },

  getCourse: async (courseId: number): Promise<ParentCourse> => {
    const response = await axios.get<ParentCourse>(`/api/v1/parent-education/courses/${courseId}`);
    return response.data;
  },

  createCourse: async (data: Partial<ParentCourse>): Promise<ParentCourse> => {
    const response = await axios.post<ParentCourse>('/api/v1/parent-education/courses', data);
    return response.data;
  },

  updateCourse: async (courseId: number, data: Partial<ParentCourse>): Promise<ParentCourse> => {
    const response = await axios.patch<ParentCourse>(
      `/api/v1/parent-education/courses/${courseId}`,
      data
    );
    return response.data;
  },

  // Enrollments
  enrollInCourse: async (courseId: number): Promise<CourseEnrollment> => {
    const response = await axios.post<CourseEnrollment>('/api/v1/parent-education/enrollments', {
      course_id: courseId,
    });
    return response.data;
  },

  listEnrollments: async (status?: string): Promise<CourseEnrollment[]> => {
    const params = status ? { status } : {};
    const response = await axios.get<CourseEnrollment[]>('/api/v1/parent-education/enrollments', {
      params,
    });
    return response.data;
  },

  getEnrollment: async (enrollmentId: number): Promise<CourseEnrollment> => {
    const response = await axios.get<CourseEnrollment>(
      `/api/v1/parent-education/enrollments/${enrollmentId}`
    );
    return response.data;
  },

  // Progress
  updateLessonProgress: async (data: {
    lesson_id: number;
    is_completed?: boolean;
    video_progress_seconds?: number;
    video_watched_percentage?: number;
    time_spent_minutes?: number;
  }): Promise<LessonProgress> => {
    const response = await axios.post<LessonProgress>('/api/v1/parent-education/progress', data);
    return response.data;
  },

  getLessonProgress: async (enrollmentId: number, lessonId: number): Promise<LessonProgress> => {
    const response = await axios.get<LessonProgress>(
      `/api/v1/parent-education/enrollments/${enrollmentId}/lessons/${lessonId}/progress`
    );
    return response.data;
  },

  // Quizzes
  startQuizAttempt: async (quizId: number): Promise<QuizAttempt> => {
    const response = await axios.post<QuizAttempt>('/api/v1/parent-education/quizzes/attempts', {
      quiz_id: quizId,
    });
    return response.data;
  },

  submitQuizAttempt: async (attemptId: number): Promise<QuizAttempt> => {
    const response = await axios.post<QuizAttempt>(
      `/api/v1/parent-education/quizzes/attempts/${attemptId}/submit`
    );
    return response.data;
  },

  submitQuizResponse: async (
    attemptId: number,
    questionId: number,
    answer: unknown
  ): Promise<void> => {
    await axios.post('/api/v1/parent-education/quizzes/responses', {
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: answer,
    });
  },

  getQuizAttempt: async (attemptId: number): Promise<QuizAttempt> => {
    const response = await axios.get<QuizAttempt>(
      `/api/v1/parent-education/quizzes/attempts/${attemptId}`
    );
    return response.data;
  },

  // Reviews
  createReview: async (
    courseId: number,
    rating: number,
    reviewText?: string
  ): Promise<CourseReview> => {
    const response = await axios.post<CourseReview>('/api/v1/parent-education/reviews', {
      course_id: courseId,
      rating,
      review_text: reviewText,
    });
    return response.data;
  },

  listReviews: async (courseId: number): Promise<CourseReview[]> => {
    const response = await axios.get<CourseReview[]>(
      `/api/v1/parent-education/courses/${courseId}/reviews`
    );
    return response.data;
  },

  // Discussion Forums
  createForumPost: async (
    forumId: number,
    title: string,
    content: string,
    parentPostId?: number
  ): Promise<ForumPost> => {
    const response = await axios.post<ForumPost>(
      `/api/v1/parent-education/forums/${forumId}/posts`,
      {
        title,
        content,
        parent_post_id: parentPostId,
      }
    );
    return response.data;
  },

  listForumPosts: async (forumId: number, skip = 0, limit = 50): Promise<ForumPost[]> => {
    const response = await axios.get<ForumPost[]>(
      `/api/v1/parent-education/forums/${forumId}/posts`,
      {
        params: { skip, limit },
      }
    );
    return response.data;
  },

  voteForumPost: async (postId: number, vote: 'up' | 'down'): Promise<void> => {
    await axios.post(`/api/v1/parent-education/forums/posts/${postId}/vote`, { vote });
  },

  // Statistics
  getStatistics: async (): Promise<CourseStatistics> => {
    const response = await axios.get<CourseStatistics>('/api/v1/parent-education/statistics');
    return response.data;
  },

  // Additional methods for parent course pages
  getMyEnrollments: async (): Promise<CourseEnrollment[]> => {
    const response = await axios.get<CourseEnrollment[]>('/api/v1/parent-education/my-enrollments');
    return response.data;
  },

  getEnrollmentDetail: async (enrollmentId: number): Promise<CourseEnrollment> => {
    const response = await axios.get<CourseEnrollment>(
      `/api/v1/parent-education/enrollments/${enrollmentId}/details`
    );
    return response.data;
  },

  getLesson: async (lessonId: number): Promise<Lesson> => {
    const response = await axios.get<Lesson>(`/api/v1/parent-education/lessons/${lessonId}`);
    return response.data;
  },

  getLessonMaterials: async (lessonId: number): Promise<CourseMaterial[]> => {
    const response = await axios.get<CourseMaterial[]>(
      `/api/v1/parent-education/lessons/${lessonId}/materials`
    );
    return response.data;
  },

  getNotes: async (enrollmentId: number, lessonId?: number): Promise<Note[]> => {
    const params = lessonId ? { lesson_id: lessonId } : {};
    const response = await axios.get(`/api/v1/parent-education/enrollments/${enrollmentId}/notes`, {
      params,
    });
    return response.data;
  },

  createNote: async (
    enrollmentId: number,
    data: { lesson_id?: number; content: string; timestamp_seconds?: number }
  ): Promise<unknown> => {
    const response = await axios.post(
      `/api/v1/parent-education/enrollments/${enrollmentId}/notes`,
      data
    );
    return response.data;
  },

  updateNote: async (noteId: number, content: string): Promise<unknown> => {
    const response = await axios.put(`/api/v1/parent-education/notes/${noteId}`, { content });
    return response.data;
  },

  deleteNote: async (noteId: number): Promise<void> => {
    await axios.delete(`/api/v1/parent-education/notes/${noteId}`);
  },

  getQuizQuestions: async (lessonId: number): Promise<QuizQuestion[]> => {
    const response = await axios.get<QuizQuestion[]>(
      `/api/v1/parent-education/lessons/${lessonId}/quiz`
    );
    return response.data;
  },

  submitQuiz: async (lessonId: number, answers: Record<number, unknown>): Promise<QuizAttempt> => {
    const response = await axios.post<QuizAttempt>(
      `/api/v1/parent-education/lessons/${lessonId}/quiz/submit`,
      {
        answers,
      }
    );
    return response.data;
  },

  markLessonComplete: async (enrollmentId: number, lessonId: number): Promise<unknown> => {
    const response = await axios.post(
      `/api/v1/parent-education/enrollments/${enrollmentId}/lessons/${lessonId}/complete`
    );
    return response.data;
  },

  getDiscussionThreads: async (courseId: number) => {
    const response = await axios.get(`/api/v1/parent-education/courses/${courseId}/discussions`);
    return response.data as Array<{
      id: number;
      title: string;
      content: string;
      is_pinned: boolean;
      is_locked?: boolean;
      parent_name?: string;
      parent_photo_url?: string;
      view_count?: number;
      created_at: string;
      reply_count?: number;
    }>;
  },

  createDiscussionThread: async (
    courseId: number,
    data: { title: string; content: string }
  ): Promise<unknown> => {
    const response = await axios.post(
      `/api/v1/parent-education/courses/${courseId}/discussions`,
      data
    );
    return response.data;
  },

  getThreadReplies: async (threadId: number) => {
    const response = await axios.get(`/api/v1/parent-education/discussions/${threadId}/replies`);
    return response.data as Array<{
      id: number;
      content: string;
      parent_name?: string;
      user_name?: string;
      user_photo_url?: string;
      user_role?: string;
      is_answer?: boolean;
      created_at: string;
    }>;
  },

  createThreadReply: async (threadId: number, data: { content: string }): Promise<unknown> => {
    const response = await axios.post(
      `/api/v1/parent-education/discussions/${threadId}/replies`,
      data
    );
    return response.data;
  },

  getCertificate: async (enrollmentId: number): Promise<unknown> => {
    const response = await axios.get(
      `/api/v1/parent-education/enrollments/${enrollmentId}/certificate`
    );
    return response.data;
  },

  downloadCertificate: async (enrollmentId: number): Promise<Blob> => {
    const response = await axios.get(
      `/api/v1/parent-education/enrollments/${enrollmentId}/certificate/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
