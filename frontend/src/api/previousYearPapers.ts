import axios from 'axios';
import {
  PreviousYearPaper,
  PreviousYearPaperCreate,
  QuestionBank,
  QuestionBankCreate,
  QuestionBookmark,
  QuestionBookmarkCreate,
  QuestionTagSuggestion,
  PaperFilters,
  QuestionFilters,
  PaperStatistics,
  QuestionStatistics,
} from '@/types/previousYearPapers';

const API_BASE_URL = '/api/v1';

export const previousYearPapersAPI = {
  // Papers
  listPapers: async (params: PaperFilters & { skip?: number; limit?: number }) => {
    const response = await axios.get(`${API_BASE_URL}/previous-year-papers/`, { params });
    return response.data;
  },

  getPaper: async (paperId: number) => {
    const response = await axios.get<PreviousYearPaper>(
      `${API_BASE_URL}/previous-year-papers/${paperId}`
    );
    return response.data;
  },

  getPaperWithOCR: async (paperId: number) => {
    const response = await axios.get<PreviousYearPaper>(
      `${API_BASE_URL}/previous-year-papers/${paperId}/with-ocr`
    );
    return response.data;
  },

  createPaper: async (data: PreviousYearPaperCreate) => {
    const response = await axios.post<PreviousYearPaper>(
      `${API_BASE_URL}/previous-year-papers/`,
      data
    );
    return response.data;
  },

  updatePaper: async (paperId: number, data: Partial<PreviousYearPaperCreate>) => {
    const response = await axios.put<PreviousYearPaper>(
      `${API_BASE_URL}/previous-year-papers/${paperId}`,
      data
    );
    return response.data;
  },

  deletePaper: async (paperId: number) => {
    await axios.delete(`${API_BASE_URL}/previous-year-papers/${paperId}`);
  },

  uploadPDF: async (paperId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<PreviousYearPaper>(
      `${API_BASE_URL}/previous-year-papers/${paperId}/upload-pdf`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  processOCR: async (paperId: number, ocrText: string) => {
    const response = await axios.post<PreviousYearPaper>(
      `${API_BASE_URL}/previous-year-papers/${paperId}/process-ocr`,
      { paper_id: paperId, ocr_text: ocrText }
    );
    return response.data;
  },

  incrementViewCount: async (paperId: number) => {
    await axios.post(`${API_BASE_URL}/previous-year-papers/${paperId}/view`);
  },

  incrementDownloadCount: async (paperId: number) => {
    await axios.post(`${API_BASE_URL}/previous-year-papers/${paperId}/download`);
  },

  getPaperStatistics: async () => {
    const response = await axios.get<PaperStatistics>(
      `${API_BASE_URL}/previous-year-papers/statistics`
    );
    return response.data;
  },

  getPaperFacets: async () => {
    const response = await axios.get(`${API_BASE_URL}/previous-year-papers/facets`);
    return response.data;
  },

  // Questions
  listQuestions: async (params: QuestionFilters & { skip?: number; limit?: number }) => {
    const response = await axios.get(`${API_BASE_URL}/question-bank/`, { params });
    return response.data;
  },

  getQuestion: async (questionId: number) => {
    const response = await axios.get<QuestionBank>(`${API_BASE_URL}/question-bank/${questionId}`);
    return response.data;
  },

  createQuestion: async (data: QuestionBankCreate) => {
    const response = await axios.post<QuestionBank>(`${API_BASE_URL}/question-bank/`, data);
    return response.data;
  },

  updateQuestion: async (questionId: number, data: Partial<QuestionBankCreate>) => {
    const response = await axios.put<QuestionBank>(
      `${API_BASE_URL}/question-bank/${questionId}`,
      data
    );
    return response.data;
  },

  deleteQuestion: async (questionId: number) => {
    await axios.delete(`${API_BASE_URL}/question-bank/${questionId}`);
  },

  verifyQuestion: async (questionId: number, isVerified: boolean, verifiedBy: number) => {
    const response = await axios.post<QuestionBank>(
      `${API_BASE_URL}/question-bank/${questionId}/verify`,
      { is_verified: isVerified, verified_by: verifiedBy }
    );
    return response.data;
  },

  uploadQuestionImage: async (questionId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<QuestionBank>(
      `${API_BASE_URL}/question-bank/${questionId}/upload-image`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  getQuestionsByPaper: async (paperId: number, skip = 0, limit = 100) => {
    const response = await axios.get(`${API_BASE_URL}/question-bank/paper/${paperId}`, {
      params: { skip, limit },
    });
    return response.data;
  },

  getQuestionStatistics: async () => {
    const response = await axios.get<QuestionStatistics>(
      `${API_BASE_URL}/question-bank/statistics`
    );
    return response.data;
  },

  getQuestionFacets: async () => {
    const response = await axios.get(`${API_BASE_URL}/question-bank/facets`);
    return response.data;
  },

  suggestTags: async (questionId: number) => {
    const response = await axios.post<QuestionTagSuggestion>(
      `${API_BASE_URL}/question-bank/${questionId}/suggest-tags`
    );
    return response.data;
  },

  // Bookmarks
  listBookmarks: async (skip = 0, limit = 100) => {
    const response = await axios.get(`${API_BASE_URL}/question-bookmarks/`, {
      params: { skip, limit },
    });
    return response.data;
  },

  createBookmark: async (data: QuestionBookmarkCreate) => {
    const response = await axios.post<QuestionBookmark>(
      `${API_BASE_URL}/question-bookmarks/`,
      data
    );
    return response.data;
  },

  updateBookmark: async (bookmarkId: number, data: Partial<QuestionBookmarkCreate>) => {
    const response = await axios.put<QuestionBookmark>(
      `${API_BASE_URL}/question-bookmarks/${bookmarkId}`,
      data
    );
    return response.data;
  },

  deleteBookmark: async (bookmarkId: number) => {
    await axios.delete(`${API_BASE_URL}/question-bookmarks/${bookmarkId}`);
  },

  checkBookmark: async (questionId: number) => {
    const response = await axios.get<{ is_bookmarked: boolean; bookmark: QuestionBookmark | null }>(
      `${API_BASE_URL}/question-bookmarks/check/${questionId}`
    );
    return response.data;
  },
};
