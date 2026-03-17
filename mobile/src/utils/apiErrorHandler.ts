import { ApiError } from '@types';

export const getErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.status === 0) {
    return 'Network error. Please check your connection.';
  }

  if (error?.status === 401) {
    return 'Your session has expired. Please login again.';
  }

  if (error?.status === 403) {
    return 'You do not have permission to access this resource.';
  }

  if (error?.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error?.status === 422) {
    return 'Invalid data provided. Please check your input.';
  }

  if (error?.status === 500) {
    return 'Server error. Please try again later.';
  }

  if (error?.status >= 500 && error?.status < 600) {
    return 'Server error. Please try again later.';
  }

  return 'An unexpected error occurred. Please try again.';
};

export const isNetworkError = (error: any): boolean => {
  return error?.status === 0 || error?.message?.includes('Network');
};

export const isAuthError = (error: any): boolean => {
  return error?.status === 401 || error?.status === 403;
};

export const shouldRetry = (error: any, attemptNumber: number, maxRetries: number = 3): boolean => {
  if (attemptNumber >= maxRetries) {
    return false;
  }

  if (isAuthError(error)) {
    return false;
  }

  if (error?.status === 422) {
    return false;
  }

  if (isNetworkError(error)) {
    return true;
  }

  if (error?.status >= 500 && error?.status < 600) {
    return true;
  }

  return false;
};

export const getRetryDelay = (attemptIndex: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * 2 ** attemptIndex, 30000);
};

export const formatApiError = (error: any): ApiError => {
  return {
    message: getErrorMessage(error),
    errors: error?.response?.data?.errors || error?.errors,
    status: error?.status || error?.response?.status,
  };
};
