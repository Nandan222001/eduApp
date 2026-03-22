import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { secureStorage } from '../utils/secureStorage';
import { offlineQueueManager, QueuedRequestType } from '../utils/offlineQueue';
import { networkStatusManager } from '../utils/networkStatus';
import { STORAGE_KEYS } from '../constants';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const API_VERSION = process.env.API_VERSION || 'v1';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Skip actual network call for demo users
          if (token.startsWith('demo_student_access_token_') || token.startsWith('demo_parent_access_token_')) {
            // For demo users, we should not make actual API calls
            // The individual API methods should handle demo data
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.handleTokenRefresh();
            if (newAccessToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client.request(originalRequest);
            }
          } catch (refreshError) {
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        if (!networkStatusManager.getIsConnected() && this.shouldQueueRequest(originalRequest)) {
          await this.queueFailedRequest(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldQueueRequest(config: AxiosRequestConfig): boolean {
    const method = config.method?.toUpperCase();
    return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  }

  private async queueFailedRequest(config: AxiosRequestConfig) {
    const method = config.method?.toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    const url = config.url || '';
    const data = config.data;
    const headers = config.headers as Record<string, string>;

    await offlineQueueManager.addToQueue({
      type: QueuedRequestType.PROFILE_UPDATE,
      url,
      method,
      data,
      headers,
    });
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/${API_VERSION}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data;
        await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

        return access_token;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  private async clearTokens() {
    await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
