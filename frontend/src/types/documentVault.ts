export enum DocumentType {
  IMMUNIZATION_RECORD = 'immunization_record',
  MEDICAL_RECORD = 'medical_record',
  BIRTH_CERTIFICATE = 'birth_certificate',
  ID_CARD = 'id_card',
  PERMISSION_SLIP = 'permission_slip',
  EMERGENCY_CONTACT = 'emergency_contact',
  INSURANCE_CARD = 'insurance_card',
  REPORT_CARD = 'report_card',
  IEP_DOCUMENT = 'iep_document',
  ATTENDANCE_EXCUSE = 'attendance_excuse',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum RequestStatus {
  REQUESTED = 'requested',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum RecipientRole {
  TEACHER = 'teacher',
  COUNSELOR = 'counselor',
  NURSE = 'nurse',
  ADMIN = 'admin',
}

export interface Document {
  id: number;
  child_id: number;
  child_name: string;
  document_type: DocumentType;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  upload_date: string;
  expiry_date?: string;
  verified_by?: string;
  verified_date?: string;
  rejection_reason?: string;
  ocr_text?: string;
  tags: string[];
  access_log_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentFolder {
  child_id: number;
  child_name: string;
  document_types: {
    type: DocumentType;
    count: number;
    last_updated?: string;
  }[];
  total_documents: number;
}

export interface DocumentRequest {
  id: number;
  child_id: number;
  child_name: string;
  document_type: DocumentType;
  title: string;
  description: string;
  requested_by: string;
  requested_by_role: RecipientRole;
  requested_date: string;
  due_date?: string;
  status: RequestStatus;
  uploaded_document_id?: number;
  response_date?: string;
  notes?: string;
}

export interface ShareRecipient {
  id: number;
  name: string;
  role: RecipientRole;
  email: string;
  department?: string;
}

export interface DocumentShare {
  id: number;
  document_id: number;
  recipient_id: number;
  recipient_name: string;
  recipient_role: RecipientRole;
  shared_by: string;
  shared_date: string;
  expiry_date?: string;
  access_count: number;
  last_accessed?: string;
  message?: string;
}

export interface AccessLog {
  id: number;
  document_id: number;
  accessed_by: string;
  accessed_by_role: RecipientRole;
  access_type: 'view' | 'download' | 'share';
  accessed_date: string;
  ip_address?: string;
}

export interface ExpiryReminder {
  id: number;
  document_id: number;
  document_title: string;
  document_type: DocumentType;
  child_name: string;
  expiry_date: string;
  days_until_expiry: number;
  reminded_date?: string;
}

export interface OCRSuggestion {
  document_type: DocumentType;
  confidence: number;
  detected_text: string;
  detected_dates?: string[];
  detected_names?: string[];
}

export interface DocumentUploadRequest {
  child_id: number;
  document_type: DocumentType;
  title: string;
  description?: string;
  expiry_date?: string;
  tags?: string[];
  file: File;
}

export interface DocumentVerificationRequest {
  status: DocumentStatus;
  rejection_reason?: string;
}

export interface DocumentShareRequest {
  recipient_ids: number[];
  expiry_date?: string;
  message?: string;
}

export interface DocumentSearchFilters {
  child_id?: number;
  document_type?: DocumentType;
  status?: DocumentStatus;
  search_query?: string;
  expiring_within_days?: number;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface DocumentVaultStats {
  total_documents: number;
  pending_verification: number;
  expiring_soon: number;
  pending_requests: number;
  total_children: number;
  storage_used_mb: number;
}
