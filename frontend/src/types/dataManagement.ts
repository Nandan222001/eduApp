export type ExportFormat = 'csv' | 'excel' | 'pdf';

export type TableEntity =
  | 'students'
  | 'teachers'
  | 'attendance'
  | 'examinations'
  | 'assignments'
  | 'grades'
  | 'subjects'
  | 'classes';

export interface ColumnDefinition {
  id: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required?: boolean;
  defaultValue?: string;
}

export interface ExportConfig {
  entity: TableEntity;
  format: ExportFormat;
  columns: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: Record<string, unknown>;
}

export interface ScheduledExportConfig {
  name: string;
  entity: TableEntity;
  format: ExportFormat;
  columns: string[];
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string;
  email: string;
  filters?: Record<string, unknown>;
}

export interface ExportPreview {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
}

export interface ImportValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  preview: Record<string, unknown>[];
}

export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'date';
}

export interface ImportConfig {
  entity: TableEntity;
  file: File;
  columnMappings: ColumnMapping[];
  skipFirstRow: boolean;
  validateOnly?: boolean;
}

export interface ImportResult {
  success: boolean;
  importedRows: number;
  failedRows: number;
  errors: ImportValidationError[];
  importId: string;
}

export interface ImportHistory {
  id: string;
  entity: TableEntity;
  filename: string;
  importedBy: string;
  importedAt: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: 'completed' | 'failed' | 'rolled_back';
  canRollback: boolean;
}

export interface EntityMetadata {
  entity: TableEntity;
  displayName: string;
  description: string;
  columns: ColumnDefinition[];
  sampleData?: Record<string, unknown>[];
}
