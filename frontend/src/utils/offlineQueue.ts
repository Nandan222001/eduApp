interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  type: 'attendance' | 'assignment' | 'other';
  metadata?: Record<string, unknown>;
}

interface QueuedRequestWithId extends QueuedRequest {
  id: number;
}

const DB_NAME = 'offline-queue-db';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

class OfflineQueueManager {
  private db: IDBDatabase | null = null;
  private listeners: Set<(queue: QueuedRequestWithId[]) => void> = new Set();

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async addToQueue(request: QueuedRequest): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const addRequest = objectStore.add(request);

      addRequest.onsuccess = () => {
        console.log('[OfflineQueue] Request added to queue:', request);
        this.notifyListeners();
        resolve(addRequest.result as number);
      };
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  async getQueue(): Promise<QueuedRequestWithId[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const getRequest = objectStore.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getQueueByType(type: QueuedRequest['type']): Promise<QueuedRequestWithId[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('type');
      const getRequest = index.getAll(type);

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeFromQueue(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const deleteRequest = objectStore.delete(id);

      deleteRequest.onsuccess = () => {
        console.log('[OfflineQueue] Request removed from queue:', id);
        this.notifyListeners();
        resolve();
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  async clearQueue(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const clearRequest = objectStore.clear();

      clearRequest.onsuccess = () => {
        console.log('[OfflineQueue] Queue cleared');
        this.notifyListeners();
        resolve();
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async processQueue(): Promise<void> {
    const queue = await this.getQueue();
    console.log(`[OfflineQueue] Processing ${queue.length} queued requests`);

    for (const request of queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });

        if (response.ok) {
          await this.removeFromQueue(request.id);
          console.log('[OfflineQueue] Successfully processed request:', request.id);
        } else {
          console.error('[OfflineQueue] Failed to process request:', response.status);
        }
      } catch (error) {
        console.error('[OfflineQueue] Error processing request:', error);
      }
    }

    this.notifyListeners();
  }

  subscribe(callback: (queue: QueuedRequestWithId[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private async notifyListeners(): Promise<void> {
    const queue = await this.getQueue();
    this.listeners.forEach((callback) => callback(queue));
  }
}

export const offlineQueue = new OfflineQueueManager();

export const queueAttendanceRequest = async (data: Record<string, unknown>): Promise<void> => {
  const token = localStorage.getItem('access_token');

  await offlineQueue.addToQueue({
    url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/attendance/bulk`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    timestamp: Date.now(),
    type: 'attendance',
    metadata: {
      date: data.date,
      section_id: data.section_id,
      count: data.attendances?.length || 0,
    },
  });
};

export const queueAssignmentSubmission = async (
  assignmentId: number,
  data: Record<string, unknown>
): Promise<void> => {
  const token = localStorage.getItem('access_token');

  await offlineQueue.addToQueue({
    url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/assignments/${assignmentId}/submissions`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    timestamp: Date.now(),
    type: 'assignment',
    metadata: {
      assignmentId,
      studentId: data.student_id,
    },
  });
};

export const setupOfflineSync = () => {
  window.addEventListener('online', async () => {
    console.log('[OfflineQueue] Back online, processing queue...');
    try {
      await offlineQueue.processQueue();
    } catch (error) {
      console.error('[OfflineQueue] Error processing queue:', error);
    }
  });

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_SUCCESS') {
        console.log('[OfflineQueue] Sync success notification received');
      }
    });
  }
};

export type { QueuedRequest, QueuedRequestWithId };
