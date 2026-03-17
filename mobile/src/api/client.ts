import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_URL } from '@env';
import { secureStorage } from '@utils/secureStorage';
import { STORAGE_KEYS, API_TIMEOUT } from '@constants';
import { ApiError, ApiResponse } from '@types';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
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
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

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

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors,
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
