import axios from '@/lib/axios';
import {
  ExportConfig,
  ExportPreview,
  ScheduledExportConfig,
  ImportConfig,
  ImportValidationResult,
  ImportResult,
  ImportHistory,
  EntityMetadata,
} from '@/types/dataManagement';

const dataManagementApi = {
  async getEntityMetadata(entity?: string): Promise<EntityMetadata[]> {
    const response = await axios.get('/api/v1/data-management/entities', {
      params: entity ? { entity } : {},
    });
    return response.data;
  },

  async getExportPreview(config: ExportConfig): Promise<ExportPreview> {
    const response = await axios.post('/api/v1/data-management/export/preview', config);
    return response.data;
  },

  async exportData(config: ExportConfig): Promise<Blob> {
    const response = await axios.post('/api/v1/data-management/export', config, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getScheduledExports(): Promise<ScheduledExportConfig[]> {
    const response = await axios.get('/api/v1/data-management/scheduled-exports');
    return response.data;
  },

  async createScheduledExport(config: ScheduledExportConfig): Promise<ScheduledExportConfig> {
    const response = await axios.post('/api/v1/data-management/scheduled-exports', config);
    return response.data;
  },

  async deleteScheduledExport(id: string): Promise<void> {
    await axios.delete(`/api/v1/data-management/scheduled-exports/${id}`);
  },

  async detectColumns(file: File): Promise<string[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/api/v1/data-management/import/detect-columns', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.columns;
  },

  async validateImport(config: ImportConfig): Promise<ImportValidationResult> {
    const formData = new FormData();
    formData.append('file', config.file);
    formData.append('entity', config.entity);
    formData.append('column_mappings', JSON.stringify(config.columnMappings));
    formData.append('skip_first_row', String(config.skipFirstRow));

    const response = await axios.post('/api/v1/data-management/import/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async importData(config: ImportConfig): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', config.file);
    formData.append('entity', config.entity);
    formData.append('column_mappings', JSON.stringify(config.columnMappings));
    formData.append('skip_first_row', String(config.skipFirstRow));

    const response = await axios.post('/api/v1/data-management/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getImportHistory(limit = 50): Promise<ImportHistory[]> {
    const response = await axios.get('/api/v1/data-management/import/history', {
      params: { limit },
    });
    return response.data;
  },

  async rollbackImport(importId: string): Promise<void> {
    await axios.post(`/api/v1/data-management/import/${importId}/rollback`);
  },

  async downloadImportErrors(importId: string): Promise<Blob> {
    const response = await axios.get(`/api/v1/data-management/import/${importId}/errors`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default dataManagementApi;
