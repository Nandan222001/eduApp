import axios from '@/lib/axios';

export interface DocumentFolder {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_folder_id?: number;
  institution_id: number;
  parent_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyDocument {
  id: number;
  title: string;
  description?: string;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  mime_type?: string;
  encrypted_file_url: string;
  file_url?: string;
  ocr_text?: string;
  extracted_metadata?: Record<string, unknown>;
  tags?: string[];
  status: string;
  is_verified: boolean;
  issue_date?: string;
  expiry_date?: string;
  upload_date?: string;
  created_at: string;
  updated_at: string;
  folder_id?: number;
  student_id?: number;
  child_id?: number;
  child_name?: string;
  verified_by?: string;
  verified_date?: string;
  rejection_reason?: string;
  access_log_count?: number;
}

export interface DocumentShare {
  id: number;
  document_id: number;
  shared_with_user_id: number;
  shared_by_id: number;
  permission: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentAccessLog {
  id: number;
  document_id: number;
  user_id: number;
  action: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  accessed_by?: string;
  accessed_by_role?: string;
  access_type?: 'view' | 'download' | 'share';
  accessed_date?: string;
}

export interface DocumentStatistics {
  total_documents: number;
  documents_by_type: Record<string, number>;
  total_storage_mb: number;
  documents_by_status: Record<string, number>;
  recent_uploads: number;
  expiring_soon: number;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_folder_id?: number;
}

export interface UploadDocumentRequest {
  title: string;
  description?: string;
  document_type: string;
  student_id?: number;
  folder_id?: number;
  tags?: string[];
  issue_date?: string;
  expiry_date?: string;
}

export interface ShareDocumentRequest {
  document_id: number;
  shared_with_user_id: number;
  permission: string;
  expires_at?: string;
}

export const documentVaultApi = {
  // Folders
  listFolders: async (parentFolderId?: number): Promise<DocumentFolder[]> => {
    const params = parentFolderId ? `?parent_folder_id=${parentFolderId}` : '';
    const response = await axios.get<DocumentFolder[]>(`/api/v1/document-vault/folders${params}`);
    return response.data;
  },

  createFolder: async (data: CreateFolderRequest): Promise<DocumentFolder> => {
    const response = await axios.post<DocumentFolder>('/api/v1/document-vault/folders', data);
    return response.data;
  },

  updateFolder: async (
    folderId: number,
    data: Partial<CreateFolderRequest>
  ): Promise<DocumentFolder> => {
    const response = await axios.patch<DocumentFolder>(
      `/api/v1/document-vault/folders/${folderId}`,
      data
    );
    return response.data;
  },

  deleteFolder: async (folderId: number): Promise<void> => {
    await axios.delete(`/api/v1/document-vault/folders/${folderId}`);
  },

  // Documents
  listDocuments: async (params?: {
    folder_id?: number;
    document_type?: string;
    student_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<FamilyDocument[]> => {
    const response = await axios.get<FamilyDocument[]>('/api/v1/document-vault/documents', {
      params,
    });
    return response.data;
  },

  getDocument: async (documentId: number): Promise<FamilyDocument> => {
    const response = await axios.get<FamilyDocument>(
      `/api/v1/document-vault/documents/${documentId}`
    );
    return response.data;
  },

  uploadDocument: async (
    file: File,
    data: UploadDocumentRequest
  ): Promise<{ document_id: number; upload_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    queryParams.append('title', data.title);
    queryParams.append('document_type', data.document_type);
    if (data.description) queryParams.append('description', data.description);
    if (data.student_id) queryParams.append('student_id', data.student_id.toString());
    if (data.folder_id) queryParams.append('folder_id', data.folder_id.toString());
    if (data.issue_date) queryParams.append('issue_date', data.issue_date);
    if (data.expiry_date) queryParams.append('expiry_date', data.expiry_date);

    const response = await axios.post(
      `/api/v1/document-vault/upload?${queryParams.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  updateDocument: async (
    documentId: number,
    data: Partial<UploadDocumentRequest>
  ): Promise<FamilyDocument> => {
    const response = await axios.patch<FamilyDocument>(
      `/api/v1/document-vault/documents/${documentId}`,
      data
    );
    return response.data;
  },

  deleteDocument: async (documentId: number): Promise<void> => {
    await axios.delete(`/api/v1/document-vault/documents/${documentId}`);
  },

  downloadDocument: async (documentId: number): Promise<Blob> => {
    const response = await axios.get(`/api/v1/document-vault/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Sharing
  shareDocument: async (
    documentIdOrData: number | ShareDocumentRequest,
    data?: {
      recipient_ids: number[];
      expiry_date?: string;
      message?: string;
    }
  ): Promise<DocumentShare | void> => {
    if (typeof documentIdOrData === 'number' && data) {
      await axios.post(`/api/v1/document-vault/documents/${documentIdOrData}/share`, data);
    } else if (typeof documentIdOrData === 'object') {
      const response = await axios.post<DocumentShare>(
        `/api/v1/document-vault/documents/${documentIdOrData.document_id}/share`,
        documentIdOrData
      );
      return response.data;
    }
  },

  listShares: async (documentId: number): Promise<DocumentShare[]> => {
    const response = await axios.get<DocumentShare[]>(
      `/api/v1/document-vault/documents/${documentId}/shares`
    );
    return response.data;
  },

  revokeShare: async (shareId: number): Promise<void> => {
    await axios.delete(`/api/v1/document-vault/shares/${shareId}`);
  },

  // Access Logs
  getAccessLogs: async (documentId: number): Promise<DocumentAccessLog[]> => {
    const response = await axios.get<DocumentAccessLog[]>(
      `/api/v1/document-vault/documents/${documentId}/access-logs`
    );
    return response.data;
  },

  // Statistics
  getStatistics: async (): Promise<DocumentStatistics> => {
    const response = await axios.get<DocumentStatistics>('/api/v1/document-vault/statistics');
    return response.data;
  },

  // Verification
  verifyDocument: async (
    documentId: number,
    data: { status: string; rejection_reason?: string }
  ): Promise<FamilyDocument> => {
    const response = await axios.post<FamilyDocument>(
      `/api/v1/document-vault/documents/${documentId}/verify`,
      data
    );
    return response.data;
  },

  // OCR
  performOCR: async (file: File): Promise<{ document_type?: string; confidence?: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<{ document_type?: string; confidence?: number }>(
      '/api/v1/document-vault/ocr',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Share Recipients
  getShareRecipients: async (): Promise<
    Array<{
      id: number;
      name: string;
      role: string;
      email: string;
      department?: string;
    }>
  > => {
    const response = await axios.get('/api/v1/document-vault/share-recipients');
    return response.data;
  },

  // Document Shares
  getDocumentShares: async (
    documentId: number
  ): Promise<
    Array<{
      id: number;
      document_id: number;
      recipient_id: number;
      recipient_name: string;
      recipient_role: string;
      shared_by: string;
      shared_date: string;
      expiry_date?: string;
      access_count: number;
      last_accessed?: string;
      message?: string;
    }>
  > => {
    const response = await axios.get(`/api/v1/document-vault/documents/${documentId}/shares`);
    return response.data;
  },

  // Vault Stats
  getVaultStats: async (): Promise<{
    total_documents: number;
    pending_verification: number;
    expiring_soon: number;
    pending_requests: number;
    total_children: number;
    storage_used_mb: number;
  }> => {
    const response = await axios.get('/api/v1/document-vault/stats');
    return response.data;
  },

  // Get Documents (alias for listDocuments)
  getDocuments: async (params?: {
    folder_id?: number;
    document_type?: string;
    student_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<FamilyDocument[]> => {
    const response = await axios.get<FamilyDocument[]>('/api/v1/document-vault/documents', {
      params,
    });
    return response.data;
  },
};
