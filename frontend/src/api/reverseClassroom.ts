import axios from '@/lib/axios';
import {
  Subject,
  TeachingSession,
  ConceptAnalysis,
  TopicProgress,
  TeachingBadge,
  TeachingAnalyticsResponse,
  DifficultyLevel,
} from '@/types/reverseClassroom';

const reverseClassroomApi = {
  getSyllabusTopics: async (studentId: number): Promise<Subject[]> => {
    const response = await axios.get<Subject[]>(`/api/v1/reverse-classroom/syllabus/${studentId}`);
    return response.data;
  },

  startTeachingSession: async (
    studentId: number,
    topicId: number,
    difficultyLevel?: DifficultyLevel
  ): Promise<TeachingSession> => {
    const response = await axios.post<TeachingSession>('/api/v1/reverse-classroom/sessions/start', {
      student_id: studentId,
      topic_id: topicId,
      difficulty_level: difficultyLevel,
    });
    return response.data;
  },

  sendMessage: async (
    sessionId: string,
    message: string,
    isVoice: boolean = false
  ): Promise<{ ai_response: string; confusion_detected?: string[] }> => {
    const response = await axios.post(`/api/v1/reverse-classroom/sessions/${sessionId}/message`, {
      message,
      is_voice: isVoice,
    });
    return response.data;
  },

  endSession: async (sessionId: string): Promise<TeachingAnalyticsResponse> => {
    const response = await axios.post<TeachingAnalyticsResponse>(
      `/api/v1/reverse-classroom/sessions/${sessionId}/end`
    );
    return response.data;
  },

  analyzeExplanation: async (sessionId: string, explanation: string): Promise<ConceptAnalysis> => {
    const response = await axios.post<ConceptAnalysis>(
      `/api/v1/reverse-classroom/sessions/${sessionId}/analyze`,
      {
        explanation,
      }
    );
    return response.data;
  },

  getTopicProgress: async (studentId: number): Promise<TopicProgress[]> => {
    const response = await axios.get<TopicProgress[]>(
      `/api/v1/reverse-classroom/progress/${studentId}`
    );
    return response.data;
  },

  getTeachingBadges: async (studentId: number): Promise<TeachingBadge[]> => {
    const response = await axios.get<TeachingBadge[]>(
      `/api/v1/reverse-classroom/badges/${studentId}`
    );
    return response.data;
  },

  getSessionHistory: async (studentId: number, limit: number = 10): Promise<TeachingSession[]> => {
    const response = await axios.get<TeachingSession[]>(
      `/api/v1/reverse-classroom/sessions/${studentId}`,
      {
        params: { limit },
      }
    );
    return response.data;
  },

  transcribeAudio: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await axios.post<{ transcript: string }>(
      '/api/v1/reverse-classroom/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.transcript;
  },
};

export default reverseClassroomApi;
