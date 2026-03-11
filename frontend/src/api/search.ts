import axios from '@/lib/axios';

export interface SearchQuery {
  query: string;
  search_types?: string[];
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface StudentSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  admission_number?: string;
  roll_number?: string;
  section_name?: string;
  grade_name?: string;
  photo_url?: string;
  status: string;
}

export interface TeacherSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employee_id?: string;
  phone?: string;
  specialization?: string;
  is_active: boolean;
}

export interface AssignmentSearchResult {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  subject_name?: string;
  grade_name?: string;
  section_name?: string;
  teacher_name?: string;
  max_marks: number;
}

export interface PaperSearchResult {
  id: number;
  title: string;
  description?: string;
  board: string;
  year: number;
  exam_month?: string;
  subject_name?: string;
  grade_name?: string;
  total_marks?: number;
  tags?: string;
  view_count: number;
}

export interface AnnouncementSearchResult {
  id: number;
  title: string;
  content: string;
  priority: string;
  audience_type: string;
  is_published: boolean;
  published_at?: string;
  expires_at?: string;
  creator_name?: string;
}

export interface SearchResults {
  query: string;
  total_results: number;
  students: StudentSearchResult[];
  teachers: TeacherSearchResult[];
  assignments: AssignmentSearchResult[];
  papers: PaperSearchResult[];
  announcements: AnnouncementSearchResult[];
  search_time_ms: number;
}

export interface QuickSearchResult {
  type: string;
  id: number;
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
  url: string;
}

export interface QuickSearchResults {
  query: string;
  results: QuickSearchResult[];
  total: number;
  search_time_ms: number;
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  search_type?: string;
  results_count: number;
  created_at: string;
}

export interface SearchHistoryResponse {
  items: SearchHistoryItem[];
  total: number;
}

export interface SearchSuggestion {
  query: string;
  type: string;
  count?: number;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
  popular: SearchSuggestion[];
}

export interface SearchFilterOptions {
  grades: Array<{ id: number; name: string }>;
  subjects: Array<{ id: number; name: string }>;
  sections: Array<{ id: number; name: string; grade_id: number }>;
  statuses: string[];
  boards: string[];
  years: number[];
}

export const searchApi = {
  globalSearch: async (searchQuery: SearchQuery): Promise<SearchResults> => {
    const response = await axios.post('/api/v1/search', searchQuery);
    return response.data;
  },

  quickSearch: async (query: string, limit: number = 10): Promise<QuickSearchResults> => {
    const response = await axios.get('/api/v1/search/quick', {
      params: { q: query, limit },
    });
    return response.data;
  },

  getSearchHistory: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchHistoryResponse> => {
    const response = await axios.get('/api/v1/search/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  clearSearchHistory: async (): Promise<void> => {
    await axios.delete('/api/v1/search/history');
  },

  getSearchSuggestions: async (
    query: string,
    limit: number = 10
  ): Promise<SearchSuggestionsResponse> => {
    const response = await axios.get('/api/v1/search/suggestions', {
      params: { q: query, limit },
    });
    return response.data;
  },

  getFilterOptions: async (): Promise<SearchFilterOptions> => {
    const response = await axios.get('/api/v1/search/filters');
    return response.data;
  },
};
