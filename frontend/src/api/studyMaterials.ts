import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface StudyMaterial {
  id: number;
  institution_id: number;
  subject_id?: number;
  chapter_id?: number;
  topic_id?: number;
  grade_id?: number;
  uploaded_by?: number;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  material_type: MaterialType;
  mime_type?: string;
  thumbnail_path?: string;
  preview_path?: string;
  view_count: number;
  download_count: number;
  tags?: string[];
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  uploader_name?: string;
  subject_name?: string;
  chapter_name?: string;
  topic_name?: string;
  grade_name?: string;
  is_bookmarked?: boolean;
  is_favorite?: boolean;
}

export enum MaterialType {
  PDF = 'pdf',
  VIDEO = 'video',
  AUDIO = 'audio',
  IMAGE = 'image',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation',
  SPREADSHEET = 'spreadsheet',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

export interface MaterialBookmark {
  id: number;
  institution_id: number;
  material_id: number;
  user_id: number;
  notes?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  material?: StudyMaterial;
}

export interface MaterialShare {
  id: number;
  institution_id: number;
  material_id: number;
  shared_by: number;
  shared_with?: number;
  share_token: string;
  message?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  material?: StudyMaterial;
}

export interface MaterialTag {
  id: number;
  institution_id: number;
  name: string;
  description?: string;
  color?: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialSearchFilters {
  query?: string;
  material_type?: MaterialType;
  subject_id?: number;
  chapter_id?: number;
  topic_id?: number;
  grade_id?: number;
  tags?: string[];
  uploaded_by?: number;
  is_public?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}

export interface MaterialHierarchyNode {
  id: number;
  name: string;
  type: 'subject' | 'chapter' | 'topic';
  material_count: number;
  children?: MaterialHierarchyNode[];
}

export interface MaterialStats {
  total_materials: number;
  total_views: number;
  total_downloads: number;
  materials_by_type: Record<string, number>;
  recent_uploads: StudyMaterial[];
  popular_materials: StudyMaterial[];
  bookmarked_count: number;
}

export interface AutocompleteResponse {
  suggestions: string[];
  tags: string[];
  subjects: { id: number; name: string }[];
}

const studyMaterialsApi = {
  uploadMaterial: async (
    formData: FormData
  ): Promise<{ material: StudyMaterial; message: string }> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/study-materials/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  searchMaterials: async (
    filters: MaterialSearchFilters
  ): Promise<{
    materials: StudyMaterial[];
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

    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/search?${params}`);
    return response.data;
  },

  getMaterial: async (materialId: number): Promise<StudyMaterial> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/${materialId}`);
    return response.data;
  },

  updateMaterial: async (
    materialId: number,
    data: Partial<StudyMaterial>
  ): Promise<StudyMaterial> => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/study-materials/${materialId}`, data);
    return response.data;
  },

  deleteMaterial: async (materialId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/study-materials/${materialId}`);
  },

  viewMaterial: async (materialId: number): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/study-materials/${materialId}/view`);
  },

  downloadMaterial: async (
    materialId: number
  ): Promise<{ download_url: string; file_name: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-materials/${materialId}/download`
    );
    return response.data;
  },

  createBookmark: async (data: {
    material_id: number;
    notes?: string;
    is_favorite: boolean;
  }): Promise<MaterialBookmark> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/study-materials/bookmarks`, data);
    return response.data;
  },

  updateBookmark: async (
    materialId: number,
    data: { notes?: string; is_favorite?: boolean }
  ): Promise<MaterialBookmark> => {
    const response = await axios.put(
      `${API_BASE_URL}/api/v1/study-materials/bookmarks/${materialId}`,
      data
    );
    return response.data;
  },

  deleteBookmark: async (materialId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/study-materials/bookmarks/${materialId}`);
  },

  getMyBookmarks: async (favoritesOnly: boolean = false): Promise<MaterialBookmark[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/bookmarks/my/list`, {
      params: { favorites_only: favoritesOnly },
    });
    return response.data;
  },

  shareMaterial: async (data: {
    material_id: number;
    shared_with?: number;
    message?: string;
    expires_at?: string;
  }): Promise<MaterialShare> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/study-materials/share`, data);
    return response.data;
  },

  getSharedMaterial: async (token: string): Promise<MaterialShare> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/share/${token}`);
    return response.data;
  },

  getHierarchy: async (gradeId?: number): Promise<MaterialHierarchyNode[]> => {
    const params = gradeId ? { grade_id: gradeId } : {};
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/hierarchy/tree`, {
      params,
    });
    return response.data;
  },

  getAutocomplete: async (query: string): Promise<AutocompleteResponse> => {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/study-materials/autocomplete/suggestions`,
      { params: { q: query } }
    );
    return response.data;
  },

  getStats: async (): Promise<MaterialStats> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/stats/overview`);
    return response.data;
  },

  getRecentlyAccessed: async (limit: number = 10): Promise<StudyMaterial[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/recent/accessed`, {
      params: { limit },
    });
    return response.data;
  },

  createTag: async (data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<MaterialTag> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/study-materials/tags`, data);
    return response.data;
  },

  getTags: async (): Promise<MaterialTag[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-materials/tags/list`);
    return response.data;
  },
};

export default studyMaterialsApi;
