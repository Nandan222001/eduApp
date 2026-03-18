import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { API_URL } from '@env';
import { secureStorage } from '@utils/secureStorage';
import { STORAGE_KEYS, API_TIMEOUT } from '@constants';
import { ApiError, ApiResponse } from '@types';
import { analyticsService } from '@services/analytics';
import { Sentry } from '@config/sentry';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

export interface RequestConfig extends AxiosRequestConfig {
  retry?: RetryConfig;
  timeout?: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

class ApiClient {
  private instance: AxiosInstance;
  private defaultRetryConfig: RetryConfig;

  constructor() {
    this.defaultRetryConfig = DEFAULT_RETRY_CONFIG;
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        (config as any).requestId = requestId;
        
        const endpoint = config.url || '';
        const method = config.method?.toUpperCase() || 'GET';
        analyticsService.startApiRequest(requestId, endpoint, method);

        Sentry.addBreadcrumb({
          category: 'http',
          data: {
            url: config.url,
            method: config.method,
          },
          level: 'info',
        });

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      response => {
        const requestId = (response.config as any).requestId;
        const endpoint = response.config.url || '';
        const method = response.config.method?.toUpperCase() || 'GET';
        
        if (requestId) {
          analyticsService.endApiRequest(
            requestId,
            endpoint,
            method,
            response.status,
            true
          );
        }

        return response;
      },
      async error => {
        const originalRequest = error.config;
        
        const requestId = (originalRequest as any)?.requestId;
        if (requestId) {
          const endpoint = originalRequest.url || '';
          const method = originalRequest.method?.toUpperCase() || 'GET';
          const statusCode = error.response?.status || 0;
          
          analyticsService.endApiRequest(
            requestId,
            endpoint,
            method,
            statusCode,
            false
          );
        }

        if (error.response) {
          Sentry.captureException(error, {
            contexts: {
              response: {
                status: error.response.status,
                data: error.response.data,
              },
            },
          });
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise(resolve => {
              subscribeTokenRefresh((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.instance.post('/auth/refresh', {
              refresh_token: refreshToken,
            });

            const { access_token, refresh_token: newRefreshToken } = response.data.data;

            await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            if (newRefreshToken) {
              await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }

            isRefreshing = false;
            onTokenRefreshed(access_token);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return this.instance(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            refreshSubscribers = [];

            await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);

            return Promise.reject(refreshError);
          }
        }

        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private shouldRetry(error: AxiosError, config: any): boolean {
    if (
      !config ||
      config._retryCount >= (config.retry?.maxRetries || this.defaultRetryConfig.maxRetries!)
    ) {
      return false;
    }

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      return true;
    }

    if (!error.response) {
      return true;
    }

    const retryableStatuses =
      config.retry?.retryableStatuses || this.defaultRetryConfig.retryableStatuses!;
    return retryableStatuses.includes(error.response.status);
  }

  private async retryRequest(config: any): Promise<any> {
    config._retryCount = config._retryCount || 0;
    config._retryCount += 1;

    const retryDelay = config.retry?.retryDelay || this.defaultRetryConfig.retryDelay!;
    const delay = retryDelay * Math.pow(2, config._retryCount - 1);

    await new Promise(resolve => setTimeout(resolve, delay));

    return this.instance(config);
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          message: error.response.data?.message || 'An error occurred',
          errors: error.response.data?.errors,
          status: error.response.status,
        };
      } else if (error.request) {
        if (error.code === 'ECONNABORTED') {
          return {
            message: 'Request timeout. Please try again.',
            status: 408,
          };
        }
        if (error.code === 'ERR_NETWORK') {
          return {
            message: 'Network error. Please check your connection.',
            status: 0,
          };
        }
        return {
          message: 'Network error. Please check your connection.',
          status: 0,
        };
      }
    }

    return {
      message: error.message || 'An unexpected error occurred',
    };
  }

  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url, config);
    return response.data;
  }

  setDefaultRetryConfig(config: Partial<RetryConfig>) {
    this.defaultRetryConfig = { ...this.defaultRetryConfig, ...config };
  }
}

export const apiClient = new ApiClient();
