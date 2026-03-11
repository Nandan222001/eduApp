import axios from 'axios';

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return (
        error.response.data?.message ||
        error.response.data?.detail ||
        error.response.statusText ||
        'An error occurred while processing your request'
      );
    } else if (error.request) {
      return 'Network error. Please check your internet connection and try again.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

export const getValidationErrors = (error: unknown): Record<string, string[]> | null => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return null;
};

export const isNetworkError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return !error.response && Boolean(error.request);
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
};

export const isValidationError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 422 || error.response?.status === 400;
  }
  return false;
};

export const getHttpStatusMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'You need to log in to access this resource.',
    403: 'You do not have permission to access this resource.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. The resource already exists.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Internal server error. Please try again later.',
    502: 'Bad gateway. The server is temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. The server took too long to respond.',
  };

  return messages[status] || `Error ${status}: An error occurred`;
};

export default {
  getErrorMessage,
  getValidationErrors,
  isNetworkError,
  isAuthError,
  isValidationError,
  getHttpStatusMessage,
};
