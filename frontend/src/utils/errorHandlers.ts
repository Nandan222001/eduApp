import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.status === 401) {
      return 'Invalid credentials. Please try again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const getFieldErrors = (error: unknown): Record<string, string[]> => {
  if (error instanceof AxiosError && error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return {};
};

export const handleAuthError = (error: unknown): { message: string; shouldRedirect: boolean } => {
  const message = getErrorMessage(error);

  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return { message, shouldRedirect: true };
    }
  }

  return { message, shouldRedirect: false };
};
