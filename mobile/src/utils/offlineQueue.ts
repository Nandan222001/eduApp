import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { assignmentsApi, SubmitAssignmentData } from '@api/assignments';
import { apiClient } from '@api/client';

export enum QueuedOperationType {
  ASSIGNMENT_SUBMISSION = 'ASSIGNMENT_SUBMISSION',
  ATTENDANCE_CHECK_IN = 'ATTENDANCE_CHECK_IN',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
}

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
}

interface AttendanceCheckInData {
  classId: number;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ProfileUpdateData {
  phone?: string;
  dateOfBirth?: string;
  profilePhoto?: string;
}

const OFFLINE_QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: QueuedOperation[] = [];
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Set<(queue: QueuedOperation[]) => void> = new Set();

  constructor() {
    this.initializeQueue();
    this.setupNetworkListener();
  }

  private async initializeQueue(): Promise<void> {
    try {
      const storedQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true && state.isInternetReachable === true;

      if (!wasOnline && this.isOnline) {
        this.syncQueue();
      }
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      this.isOnline = state.isConnected === true && state.isInternetReachable === true;
    });
  }

  public subscribe(listener: (queue: QueuedOperation[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.queue]));
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  public async addToQueue(
    type: QueuedOperationType,
    data: any,
    maxRetries: number = MAX_RETRIES
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    this.queue.push(operation);
    await this.saveQueue();

    if (this.isOnline) {
      this.syncQueue();
    }

    return operation.id;
  }

  public async removeFromQueue(operationId: string): Promise<void> {
    this.queue = this.queue.filter(op => op.id !== operationId);
    await this.saveQueue();
  }

  public getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public isConnected(): boolean {
    return this.isOnline;
  }

  public async syncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    const operationsToSync = [...this.queue];

    for (const operation of operationsToSync) {
      try {
        await this.executeOperation(operation);
        await this.removeFromQueue(operation.id);
      } catch (error) {
        operation.retryCount++;
        operation.error = error instanceof Error ? error.message : 'Unknown error';

        if (operation.retryCount >= operation.maxRetries) {
          console.error(
            `Operation ${operation.id} failed after ${operation.maxRetries} retries:`,
            error
          );
          await this.removeFromQueue(operation.id);
        } else {
          const index = this.queue.findIndex(op => op.id === operation.id);
          if (index !== -1) {
            this.queue[index] = operation;
            await this.saveQueue();
          }
        }
      }
    }

    this.syncInProgress = false;
  }

  private async executeOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case QueuedOperationType.ASSIGNMENT_SUBMISSION:
        await this.executeAssignmentSubmission(operation.data);
        break;
      case QueuedOperationType.ATTENDANCE_CHECK_IN:
        await this.executeAttendanceCheckIn(operation.data);
        break;
      case QueuedOperationType.PROFILE_UPDATE:
        await this.executeProfileUpdate(operation.data);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async executeAssignmentSubmission(data: SubmitAssignmentData): Promise<void> {
    await assignmentsApi.submitAssignment(data);
  }

  private async executeAttendanceCheckIn(data: AttendanceCheckInData): Promise<void> {
    await apiClient.post('/api/v1/attendance/check-in', data);
  }

  private async executeProfileUpdate(data: ProfileUpdateData): Promise<void> {
    await apiClient.put('/api/v1/profile', data);
  }

  public async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.notifyListeners();
  }

  public async manualSync(): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
  }> {
    const initialQueueSize = this.queue.length;
    await this.syncQueue();
    const finalQueueSize = this.queue.length;
    const syncedCount = initialQueueSize - finalQueueSize;
    const failedCount = finalQueueSize;

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
    };
  }
}

export const offlineQueueManager = new OfflineQueueManager();
