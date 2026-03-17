import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '../api/client';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private listeners: Array<(queue: QueuedRequest[]) => void> = [];

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
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state: any) => {
      if (state.isConnected && this.queue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    });
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

    const networkState = await NetInfo.fetch();
    if (networkState.isConnected && !this.isProcessing) {
      this.processQueue();
    }

    return queuedRequest.id;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        await this.executeRequest(request);
        this.queue.shift();
        await this.saveQueue();
      } catch (error) {
        console.error('Failed to execute queued request:', error);
        
        request.retryCount++;
        
        if (request.retryCount >= request.maxRetries) {
          console.error('Max retries reached for request:', request.id);
          this.queue.shift();
          await this.saveQueue();
        } else {
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  private async executeRequest(request: QueuedRequest): Promise<void> {
    const { method, url, data, headers } = request;

    switch (method) {
      case 'GET':
        await apiClient.get(url, { headers });
        break;
      case 'POST':
        await apiClient.post(url, data, { headers });
        break;
      case 'PUT':
        await apiClient.put(url, data, { headers });
        break;
      case 'PATCH':
        await apiClient.patch(url, data, { headers });
        break;
      case 'DELETE':
        await apiClient.delete(url, { headers });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  public getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  public getQueueCount(): number {
    return this.queue.length;
  }

  public async removeFromQueue(id: string): Promise<void> {
    this.queue = this.queue.filter(req => req.id !== id);
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
}

export const offlineQueueManager = new OfflineQueueManager();
