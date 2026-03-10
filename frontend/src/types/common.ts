export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
