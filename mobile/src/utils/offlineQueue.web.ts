import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

export enum QueuedRequestType {
  ASSIGNMENT_SUBMISSION = 'ASSIGNMENT_SUBMISSION',
  DOUBT_POST = 'DOUBT_POST',
  DOUBT_ANSWER = 'DOUBT_ANSWER',
  ATTENDANCE_MARKING = 'ATTENDANCE_MARKING',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
}

export interface QueuedRequest {
  id: string;
  type: QueuedRequestType;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export interface OfflineQueueState {
  totalCount: number;
  pendingCount: number;
  failedCount: number;
}

const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private listeners: Array<(queue: QueuedRequest[]) => void> = [];
  private isOnline = true;

  constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  private async loadQueue() {
    try {
      const storedQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[Web] Failed to load offline queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('[Web] Failed to save offline queue:', error);
    }
  }

  private setupNetworkListener() {
    // Use browser's online/offline events
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        console.log('[Web] Browser is online');
        this.isOnline = true;
        if (this.queue.length > 0 && !this.isProcessing) {
          this.processQueue();
        }
      });

      window.addEventListener('offline', () => {
        console.log('[Web] Browser is offline');
        this.isOnline = false;
      });
    }
  }

  public async addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine && !this.isProcessing) {
      this.processQueue();
    }

    return queuedRequest.id;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[Web] Browser is offline, skipping queue processing');
      return;
    }

    this.isProcessing = true;

    const successfulRequests: string[] = [];

    for (const request of this.queue) {
      try {
        console.log('[Web] Processing queued request:', request.id);

        await apiClient.request({
          url: request.url,
          method: request.method,
          data: request.data,
          headers: request.headers,
        });

        successfulRequests.push(request.id);
        console.log('[Web] Successfully processed queued request:', request.id);
      } catch (error) {
        console.error('[Web] Failed to process queued request:', request.id, error);

        request.retryCount++;

        if (request.retryCount >= request.maxRetries) {
          console.error('[Web] Max retries reached for request:', request.id);
          successfulRequests.push(request.id);
        }
      }
    }

    this.queue = this.queue.filter(req => !successfulRequests.includes(req.id));
    await this.saveQueue();

    this.isProcessing = false;

    console.log('[Web] Queue processing complete. Remaining items:', this.queue.length);
  }

  public getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  public getQueueCount(): number {
    return this.queue.length;
  }

  public getQueueState(): OfflineQueueState {
    const failed = this.queue.filter(req => req.retryCount >= req.maxRetries);
    const pending = this.queue.filter(req => req.retryCount < req.maxRetries);

    return {
      totalCount: this.queue.length,
      pendingCount: pending.length,
      failedCount: failed.length,
    };
  }

  public async removeFromQueue(id: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(req => req.id !== id);

    if (this.queue.length < initialLength) {
      await this.saveQueue();
      return true;
    }

    return false;
  }

  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  public async clearFailedRequests(): Promise<void> {
    this.queue = this.queue.filter(req => req.retryCount < req.maxRetries);
    await this.saveQueue();
  }

  public subscribe(listener: (queue: QueuedRequest[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.queue]));
  }

  public async retryRequest(id: string): Promise<boolean> {
    const request = this.queue.find(req => req.id === id);
    if (!request) {
      return false;
    }

    request.retryCount = 0;
    await this.saveQueue();

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine && !this.isProcessing) {
      this.processQueue();
    }

    return true;
  }

  public async retryAllFailed(): Promise<void> {
    this.queue.forEach(req => {
      if (req.retryCount >= req.maxRetries) {
        req.retryCount = 0;
      }
    });

    await this.saveQueue();

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine && !this.isProcessing) {
      this.processQueue();
    }
  }
}

export const offlineQueueManager = new OfflineQueueManager();
