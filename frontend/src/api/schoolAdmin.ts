import axios from '@/lib/axios';

// Certificate Types
export type CertificateType =
  | 'TC'
  | 'LC'
  | 'Bonafide'
  | 'Character'
  | 'Study'
  | 'Conduct'
  | 'Migration'
  | 'Fee'
  | 'No Dues'
  | 'Sports'
  | 'Merit'
  | 'Participation';

export interface Certificate {
  id: number;
  institution_id: number;
  student_id: number;
  student_name?: string;
  certificate_type: CertificateType;
  serial_number: string;
  issue_date: string;
  template_id?: number;
  remarks?: string;
  pdf_url?: string;
  issued_by_id: number;
  issued_by_name?: string;
  is_revoked: boolean;
  revoked_at?: string;
  revoked_by?: number;
  revoked_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface IssueCertificateRequest {
  student_id: number;
  certificate_type: CertificateType;
  template_id?: number;
  remarks?: string;
  issue_date?: string;
}

export interface CertificateListParams {
  skip?: number;
  limit?: number;
  certificate_type?: CertificateType;
  student_id?: number;
  from_date?: string;
  to_date?: string;
  is_revoked?: boolean;
  search?: string;
}

export interface CertificateListResponse {
  items: Certificate[];
  total: number;
  skip: number;
  limit: number;
}

export interface RevokeCertificateRequest {
  reason: string;
}

// ID Card Types
export interface IDCardTemplate {
  id: number;
  institution_id: number;
  name: string;
  orientation: 'portrait' | 'landscape';
  front_config: IDCardFaceConfig;
  back_config: IDCardFaceConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface IDCardFaceConfig {
  background_color?: string;
  header_color?: string;
  border_color?: string;
  logo_url?: string;
  show_photo?: boolean;
  show_name?: boolean;
  show_admission_number?: boolean;
  show_class?: boolean;
  show_dob?: boolean;
  show_blood_group?: boolean;
  show_address?: boolean;
  show_phone?: boolean;
  show_parent_phone?: boolean;
  show_emergency_contact?: boolean;
  custom_fields?: Array<{ label: string; value: string }>;
}

export interface IDCardTemplateCreate {
  name: string;
  orientation: 'portrait' | 'landscape';
  front_config: IDCardFaceConfig;
  back_config: IDCardFaceConfig;
  is_default?: boolean;
}

export interface IDCardTemplateUpdate {
  name?: string;
  orientation?: 'portrait' | 'landscape';
  front_config?: IDCardFaceConfig;
  back_config?: IDCardFaceConfig;
  is_default?: boolean;
}

export interface BulkIDCardGenerateRequest {
  grade_id?: number;
  section_id?: number;
  template_id?: number;
}

// Certificate Template Types
export interface CertificateTemplate {
  id: number;
  institution_id: number;
  name: string;
  certificate_type: CertificateType;
  template_config: CertificateTemplateConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateTemplateConfig {
  header?: string;
  logo_url?: string;
  signature_url?: string;
  watermark_url?: string;
  body_text?: string;
  footer_text?: string;
  custom_fields?: Array<{ key: string; label: string; placeholder?: string }>;
  styles?: {
    header_font?: string;
    body_font?: string;
    header_color?: string;
    body_color?: string;
    border_color?: string;
  };
}

export interface CertificateTemplateCreate {
  name: string;
  certificate_type: CertificateType;
  template_config: CertificateTemplateConfig;
  is_default?: boolean;
}

export interface CertificateTemplateUpdate {
  name?: string;
  certificate_type?: CertificateType;
  template_config?: CertificateTemplateConfig;
  is_default?: boolean;
}

// Staff Types
export interface Staff {
  id: number;
  institution_id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joining_date?: string;
  leaving_date?: string;
  salary?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;
  address?: string;
  emergency_contact?: string;
  qualification?: string;
  experience_years?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffCreate {
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joining_date?: string;
  salary?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;
  address?: string;
  emergency_contact?: string;
  qualification?: string;
  experience_years?: number;
  is_active?: boolean;
}

export interface StaffUpdate {
  employee_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joining_date?: string;
  leaving_date?: string;
  salary?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;
  address?: string;
  emergency_contact?: string;
  qualification?: string;
  experience_years?: number;
  is_active?: boolean;
}

export interface StaffListParams {
  skip?: number;
  limit?: number;
  department?: string;
  designation?: string;
  is_active?: boolean;
  search?: string;
}

export interface StaffListResponse {
  items: Staff[];
  total: number;
  skip: number;
  limit: number;
}

// Payroll Types
export interface PayrollRecord {
  id: number;
  institution_id: number;
  staff_id: number;
  staff_name?: string;
  employee_id?: string;
  department?: string;
  month: string;
  year: number;
  basic_salary: number;
  hra?: number;
  da?: number;
  allowances?: number;
  deductions?: number;
  gross_salary: number;
  net_salary: number;
  payment_date?: string;
  payment_status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PayrollRecordCreate {
  staff_id: number;
  month: string;
  year: number;
  basic_salary: number;
  hra?: number;
  da?: number;
  allowances?: number;
  deductions?: number;
  payment_date?: string;
}

export interface PayrollRecordUpdate {
  basic_salary?: number;
  hra?: number;
  da?: number;
  allowances?: number;
  deductions?: number;
  payment_date?: string;
  payment_status?: 'pending' | 'paid' | 'cancelled';
}

export interface PayrollListParams {
  skip?: number;
  limit?: number;
  staff_id?: number;
  month?: string;
  year?: number;
  payment_status?: 'pending' | 'paid' | 'cancelled';
}

export interface PayrollListResponse {
  items: PayrollRecord[];
  total: number;
  skip: number;
  limit: number;
}

export interface GeneratePayrollRequest {
  month: string;
  year: number;
  department?: string;
}

export interface PayrollSummary {
  total_staff: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  department_breakdown: Array<{
    department: string;
    staff_count: number;
    total_gross: number;
    total_net: number;
  }>;
}

export interface BulkPayrollUpdateRequest {
  payroll_ids: number[];
  payment_status?: 'pending' | 'paid' | 'cancelled';
  payment_date?: string;
}

// SMS Template Types
export interface SMSTemplate {
  id: number;
  institution_id: number;
  name: string;
  template_type: string;
  message_template: string;
  variables?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SMSTemplateCreate {
  name: string;
  template_type: string;
  message_template: string;
  variables?: string[];
  is_active?: boolean;
  [key: string]: unknown;
}

export interface SMSTemplateUpdate {
  name?: string;
  template_type?: string;
  message_template?: string;
  variables?: string[];
  is_active?: boolean;
}

export interface SendSMSRequest {
  template_id: number;
  recipient_ids: number[];
  recipient_type: 'student' | 'parent' | 'teacher' | 'staff';
  variables?: Record<string, string>;
}

// Enquiry Types
export interface Enquiry {
  id: number;
  institution_id: number;
  student_name: string;
  parent_name: string;
  parent_email?: string;
  parent_phone: string;
  enquiry_date: string;
  grade_interested?: string;
  status: 'new' | 'contacted' | 'visited' | 'follow_up' | 'converted' | 'closed';
  notes?: string;
  follow_up_date?: string | null;
  assigned_to_id?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

export interface EnquiryCreate {
  student_name: string;
  parent_name: string;
  parent_email?: string;
  parent_phone: string;
  enquiry_date?: string;
  grade_interested?: string;
  notes?: string;
  follow_up_date?: string;
  assigned_to_id?: number;
  [key: string]: unknown;
}

export interface EnquiryUpdate {
  student_name?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  grade_interested?: string;
  status?: 'new' | 'contacted' | 'visited' | 'follow_up' | 'converted' | 'closed';
  notes?: string;
  follow_up_date?: string | null;
  assigned_to_id?: number;
}

export interface EnquiryListParams {
  skip?: number;
  limit?: number;
  status?: 'new' | 'contacted' | 'visited' | 'follow_up' | 'converted' | 'closed';
  grade_interested?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface EnquiryListResponse {
  items: Enquiry[];
  total: number;
  skip: number;
  limit: number;
}

// API Object
const schoolAdminApi = {
  // Certificate APIs
  certificates: {
    list: async (params?: CertificateListParams): Promise<CertificateListResponse> => {
      const response = await axios.get('/api/v1/certificates/', { params });
      return response.data;
    },

    get: async (id: number): Promise<Certificate> => {
      const response = await axios.get(`/api/v1/certificates/${id}`);
      return response.data;
    },

    issue: async (data: IssueCertificateRequest): Promise<Certificate> => {
      const response = await axios.post('/api/v1/certificates/issue', data);
      return response.data;
    },

    download: async (id: number): Promise<Blob> => {
      const response = await axios.get(`/api/v1/certificates/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    },

    revoke: async (id: number, data: RevokeCertificateRequest): Promise<Certificate> => {
      const response = await axios.post(`/api/v1/certificates/${id}/revoke`, data);
      return response.data;
    },

    preview: async (data: IssueCertificateRequest): Promise<Blob> => {
      const response = await axios.post('/api/v1/certificates/preview', data, {
        responseType: 'blob',
      });
      return response.data;
    },
  },

  // Certificate Template APIs
  certificateTemplates: {
    list: async (certificateType?: CertificateType): Promise<CertificateTemplate[]> => {
      const response = await axios.get('/api/v1/certificate-templates/', {
        params: certificateType ? { certificate_type: certificateType } : undefined,
      });
      return response.data;
    },

    get: async (id: number): Promise<CertificateTemplate> => {
      const response = await axios.get(`/api/v1/certificate-templates/${id}`);
      return response.data;
    },

    create: async (data: CertificateTemplateCreate): Promise<CertificateTemplate> => {
      const response = await axios.post('/api/v1/certificate-templates/', data);
      return response.data;
    },

    update: async (id: number, data: CertificateTemplateUpdate): Promise<CertificateTemplate> => {
      const response = await axios.put(`/api/v1/certificate-templates/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await axios.delete(`/api/v1/certificate-templates/${id}`);
    },
  },

  // ID Card APIs
  idCards: {
    generate: async (studentId: number, templateId?: number): Promise<Blob> => {
      const response = await axios.post(
        `/api/v1/id-cards/generate`,
        { student_id: studentId, template_id: templateId },
        { responseType: 'blob' }
      );
      return response.data;
    },

    bulkGenerate: async (data: BulkIDCardGenerateRequest): Promise<Blob> => {
      const response = await axios.post('/api/v1/id-cards/bulk-generate', data, {
        responseType: 'blob',
      });
      return response.data;
    },
  },

  // ID Card Template APIs
  idCardTemplates: {
    list: async (): Promise<IDCardTemplate[]> => {
      const response = await axios.get('/api/v1/id-card-templates/');
      return response.data;
    },

    get: async (id: number): Promise<IDCardTemplate> => {
      const response = await axios.get(`/api/v1/id-card-templates/${id}`);
      return response.data;
    },

    create: async (data: IDCardTemplateCreate): Promise<IDCardTemplate> => {
      const response = await axios.post('/api/v1/id-card-templates/', data);
      return response.data;
    },

    update: async (id: number, data: IDCardTemplateUpdate): Promise<IDCardTemplate> => {
      const response = await axios.put(`/api/v1/id-card-templates/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await axios.delete(`/api/v1/id-card-templates/${id}`);
    },

    uploadLogo: async (id: number, file: File): Promise<{ logo_url: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`/api/v1/id-card-templates/${id}/upload-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  },

  // Staff APIs
  staff: {
    list: async (params?: StaffListParams): Promise<StaffListResponse> => {
      const response = await axios.get('/api/v1/staff/', { params });
      return response.data;
    },

    get: async (id: number): Promise<Staff> => {
      const response = await axios.get(`/api/v1/staff/${id}`);
      return response.data;
    },

    create: async (data: StaffCreate): Promise<Staff> => {
      const response = await axios.post('/api/v1/staff/', data);
      return response.data;
    },

    update: async (id: number, data: StaffUpdate): Promise<Staff> => {
      const response = await axios.put(`/api/v1/staff/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await axios.delete(`/api/v1/staff/${id}`);
    },

    bulkImport: async (
      file: File
    ): Promise<{ imported: number; failed: number; errors?: string[] }> => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/api/v1/staff/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    downloadTemplate: async (): Promise<Blob> => {
      const response = await axios.get('/api/v1/staff/import-template', {
        responseType: 'blob',
      });
      return response.data;
    },
  },

  // Payroll APIs
  payroll: {
    list: async (params?: PayrollListParams): Promise<PayrollListResponse> => {
      const response = await axios.get('/api/v1/payroll/', { params });
      return response.data;
    },

    get: async (id: number): Promise<PayrollRecord> => {
      const response = await axios.get(`/api/v1/payroll/${id}`);
      return response.data;
    },

    create: async (data: PayrollRecordCreate): Promise<PayrollRecord> => {
      const response = await axios.post('/api/v1/payroll/', data);
      return response.data;
    },

    update: async (id: number, data: PayrollRecordUpdate): Promise<PayrollRecord> => {
      const response = await axios.put(`/api/v1/payroll/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await axios.delete(`/api/v1/payroll/${id}`);
    },

    generatePayslip: async (id: number): Promise<Blob> => {
      const response = await axios.get(`/api/v1/payroll/${id}/payslip`, {
        responseType: 'blob',
      });
      return response.data;
    },

    generatePayroll: async (
      data: GeneratePayrollRequest
    ): Promise<{ created: number; message: string }> => {
      const response = await axios.post('/api/v1/payroll/generate', data);
      return response.data;
    },

    getSummary: async (month: string, year: number): Promise<PayrollSummary> => {
      const response = await axios.get('/api/v1/payroll/summary', {
        params: { month, year },
      });
      return response.data;
    },

    bulkUpdate: async (data: BulkPayrollUpdateRequest): Promise<{ updated: number }> => {
      const response = await axios.post('/api/v1/payroll/bulk-update', data);
      return response.data;
    },

    exportReport: async (month: string, year: number, format: 'excel' | 'pdf'): Promise<Blob> => {
      const response = await axios.get('/api/v1/payroll/export', {
        params: { month, year, format },
        responseType: 'blob',
      });
      return response.data;
    },
  },

  // SMS Template APIs
  smsTemplates: {
    list: async (): Promise<SMSTemplate[]> => {
      const response = await axios.get('/api/v1/sms-templates/');
      return response.data;
    },

    get: async (id: number): Promise<SMSTemplate> => {
      const response = await axios.get(`/api/v1/sms-templates/${id}`);
      return response.data;
    },

    create: async (data: SMSTemplateCreate): Promise<SMSTemplate> => {
      const response = await axios.post('/api/v1/sms-templates/', data);
      return response.data;
    },

    update: async (id: number, data: SMSTemplateUpdate): Promise<SMSTemplate> => {
      const response = await axios.put(`/api/v1/sms-templates/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await axios.delete(`/api/v1/sms-templates/${id}`);
    },

    sendSMS: async (data: SendSMSRequest): Promise<{ sent: number; failed: number }> => {
      const response = await axios.post('/api/v1/sms-templates/send', data);
      return response.data;
    },
  },

  // Enquiry APIs
  enquiries: {
    list: async (params?: EnquiryListParams): Promise<EnquiryListResponse> => {
      const response = await axios.get('/api/v1/enquiries/', { params });
      return response.data;
    },

    get: async (id: number): Promise<Enquiry> => {
      const response = await axios.get(`/api/v1/enquiries/${id}`);
      return response.data;
    },

    create: async (data: EnquiryCreate): Promise<Enquiry> => {
      const response = await axios.post('/api/v1/enquiries/', data);
      return response.data;
    },

    update: async (id: number, data: EnquiryUpdate): Promise<Enquiry> => {
      const response = await axios.put(`/api/v1/enquiries/${id}`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await axios.delete(`/api/v1/enquiries/${id}`);
    },
  },
};

export default schoolAdminApi;
