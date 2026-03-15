import axios from '@/lib/axios';
import { isDemoUser, demoDataApi } from '@/api/demoDataApi';
import type {
  Document,
  DocumentFolder,
  DocumentRequest,
  ShareRecipient,
  DocumentShare,
  AccessLog,
  ExpiryReminder,
  OCRSuggestion,
  DocumentUploadRequest,
  DocumentVerificationRequest,
  DocumentShareRequest,
  DocumentSearchFilters,
  DocumentVaultStats,
} from '@/types/documentVault';

export const documentVaultApi = {
  getVaultStats: async (): Promise<DocumentVaultStats> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getVaultStats();
    }
    const response = await axios.get<DocumentVaultStats>('/api/v1/document-vault/stats');
    return response.data;
  },

  getFolders: async (): Promise<DocumentFolder[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getFolders() as Promise<DocumentFolder[]>;
    }
    const response = await axios.get<DocumentFolder[]>('/api/v1/document-vault/folders');
    return response.data;
  },

  getDocuments: async (filters?: DocumentSearchFilters): Promise<Document[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getDocuments(filters) as Promise<Document[]>;
    }
    const response = await axios.get<Document[]>('/api/v1/document-vault/documents', {
      params: filters,
    });
    return response.data;
  },

  getDocument: async (documentId: number): Promise<Document> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getDocument(documentId) as Promise<Document>;
    }
    const response = await axios.get<Document>(`/api/v1/document-vault/documents/${documentId}`);
    return response.data;
  },

  uploadDocument: async (data: DocumentUploadRequest): Promise<Document> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.uploadDocument(data) as Promise<Document>;
    }
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('child_id', data.child_id.toString());
    formData.append('document_type', data.document_type);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.expiry_date) formData.append('expiry_date', data.expiry_date);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));

    const response = await axios.post<Document>('/api/v1/document-vault/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateDocument: async (
    documentId: number,
    data: Partial<DocumentUploadRequest>
  ): Promise<Document> => {
    const response = await axios.patch<Document>(
      `/api/v1/document-vault/documents/${documentId}`,
      data
    );
    return response.data;
  },

  deleteDocument: async (documentId: number): Promise<void> => {
    await axios.delete(`/api/v1/document-vault/documents/${documentId}`);
  },

  performOCR: async (file: File): Promise<OCRSuggestion> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.performOCR(file) as Promise<OCRSuggestion>;
    }
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<OCRSuggestion>(
      '/api/v1/document-vault/ocr-analyze',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  verifyDocument: async (
    documentId: number,
    data: DocumentVerificationRequest
  ): Promise<Document> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.verifyDocument(documentId, data) as Promise<Document>;
    }
    const response = await axios.post<Document>(
      `/api/v1/document-vault/documents/${documentId}/verify`,
      data
    );
    return response.data;
  },

  shareDocument: async (
    documentId: number,
    data: DocumentShareRequest
  ): Promise<DocumentShare[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.shareDocument(documentId, data) as Promise<DocumentShare[]>;
    }
    const response = await axios.post<DocumentShare[]>(
      `/api/v1/document-vault/documents/${documentId}/share`,
      data
    );
    return response.data;
  },

  getDocumentShares: async (documentId: number): Promise<DocumentShare[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getDocumentShares(documentId) as Promise<DocumentShare[]>;
    }
    const response = await axios.get<DocumentShare[]>(
      `/api/v1/document-vault/documents/${documentId}/shares`
    );
    return response.data;
  },

  revokeShare: async (shareId: number): Promise<void> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.revokeShare(shareId) as Promise<void>;
    }
    await axios.delete(`/api/v1/document-vault/shares/${shareId}`);
  },

  downloadDocument: async (documentId: number): Promise<Blob> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.downloadDocument(documentId) as Promise<Blob>;
    }
    const response = await axios.get(`/api/v1/document-vault/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getAccessLogs: async (documentId: number): Promise<AccessLog[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getAccessLogs(documentId) as Promise<AccessLog[]>;
    }
    const response = await axios.get<AccessLog[]>(
      `/api/v1/document-vault/documents/${documentId}/access-logs`
    );
    return response.data;
  },

  getDocumentRequests: async (): Promise<DocumentRequest[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getDocumentRequests() as Promise<DocumentRequest[]>;
    }
    const response = await axios.get<DocumentRequest[]>('/api/v1/document-vault/requests');
    return response.data;
  },

  createDocumentRequest: async (
    data: Omit<DocumentRequest, 'id' | 'requested_date' | 'status'>
  ): Promise<DocumentRequest> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.createDocumentRequest(data) as Promise<DocumentRequest>;
    }
    const response = await axios.post<DocumentRequest>('/api/v1/document-vault/requests', data);
    return response.data;
  },

  respondToRequest: async (
    requestId: number,
    documentId: number,
    notes?: string
  ): Promise<DocumentRequest> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.respondToRequest(
        requestId,
        documentId,
        notes
      ) as Promise<DocumentRequest>;
    }
    const response = await axios.post<DocumentRequest>(
      `/api/v1/document-vault/requests/${requestId}/respond`,
      { document_id: documentId, notes }
    );
    return response.data;
  },

  getExpiryReminders: async (): Promise<ExpiryReminder[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getExpiryReminders() as Promise<ExpiryReminder[]>;
    }
    const response = await axios.get<ExpiryReminder[]>('/api/v1/document-vault/expiry-reminders');
    return response.data;
  },

  getShareRecipients: async (): Promise<ShareRecipient[]> => {
    if (isDemoUser()) {
      return demoDataApi.documentVault.getShareRecipients() as Promise<ShareRecipient[]>;
    }
    const response = await axios.get<ShareRecipient[]>('/api/v1/document-vault/share-recipients');
    return response.data;
  },
};
