import axios from 'axios';
import {
  DoubtPost,
  DoubtAnswer,
  DoubtComment,
  DoubtVote,
  DoubtBookmark,
  DoubtSearchFilters,
  DoubtStats,
  VoteType,
} from '../types/doubt';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const doubtsApi = {
  createDoubt: async (data: FormData): Promise<DoubtPost> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/doubts`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  searchDoubts: async (
    filters: DoubtSearchFilters
  ): Promise<{
    doubts: DoubtPost[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });
    const response = await axios.get(`${API_BASE_URL}/api/v1/doubts/search?${params}`);
    return response.data;
  },

  getDoubt: async (doubtId: number): Promise<DoubtPost> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/doubts/${doubtId}`);
    return response.data;
  },

  updateDoubt: async (doubtId: number, data: Partial<DoubtPost>): Promise<DoubtPost> => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/doubts/${doubtId}`, data);
    return response.data;
  },

  deleteDoubt: async (doubtId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/doubts/${doubtId}`);
  },

  getAnswers: async (doubtId: number): Promise<DoubtAnswer[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/doubts/${doubtId}/answers`);
    return response.data;
  },

  createAnswer: async (doubtId: number, data: FormData): Promise<DoubtAnswer> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/doubts/${doubtId}/answers`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateAnswer: async (answerId: number, data: Partial<DoubtAnswer>): Promise<DoubtAnswer> => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/doubts/answers/${answerId}`, data);
    return response.data;
  },

  deleteAnswer: async (answerId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/doubts/answers/${answerId}`);
  },

  acceptAnswer: async (answerId: number): Promise<DoubtAnswer> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/doubts/answers/${answerId}/accept`);
    return response.data;
  },

  voteDoubt: async (doubtId: number, voteType: VoteType): Promise<DoubtVote> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/doubts/${doubtId}/vote`, {
      vote_type: voteType,
    });
    return response.data;
  },

  removeDoubtVote: async (doubtId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/doubts/${doubtId}/vote`);
  },

  voteAnswer: async (answerId: number, voteType: VoteType): Promise<DoubtVote> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/doubts/answers/${answerId}/vote`, {
      vote_type: voteType,
    });
    return response.data;
  },

  removeAnswerVote: async (answerId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/doubts/answers/${answerId}/vote`);
  },

  bookmarkDoubt: async (doubtId: number, notes?: string): Promise<DoubtBookmark> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/doubts/${doubtId}/bookmark`, {
      notes,
    });
    return response.data;
  },

  removeBookmark: async (doubtId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/doubts/${doubtId}/bookmark`);
  },

  getMyBookmarks: async (): Promise<DoubtBookmark[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/doubts/bookmarks/my`);
    return response.data;
  },

  getComments: async (doubtId: number, answerId?: number): Promise<DoubtComment[]> => {
    const url = answerId
      ? `${API_BASE_URL}/api/v1/doubts/answers/${answerId}/comments`
      : `${API_BASE_URL}/api/v1/doubts/${doubtId}/comments`;
    const response = await axios.get(url);
    return response.data;
  },

  createComment: async (
    doubtId: number,
    answerId: number | undefined,
    content: string
  ): Promise<DoubtComment> => {
    const url = answerId
      ? `${API_BASE_URL}/api/v1/doubts/answers/${answerId}/comments`
      : `${API_BASE_URL}/api/v1/doubts/${doubtId}/comments`;
    const response = await axios.post(url, { content });
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/doubts/comments/${commentId}`);
  },

  getStats: async (): Promise<DoubtStats> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/doubts/stats`);
    return response.data;
  },

  getTags: async (): Promise<string[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/doubts/tags`);
    return response.data;
  },

  getSimilarDoubts: async (doubtId: number): Promise<DoubtPost[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/doubts/${doubtId}/similar`);
    return response.data;
  },
};

export default doubtsApi;
