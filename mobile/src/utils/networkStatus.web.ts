// Web implementation for network status monitoring
class NetworkStatusManager {
  private isConnected: boolean = true;
  private listeners: Array<(isConnected: boolean) => void> = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Use browser's navigator.onLine
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isConnected = navigator.onLine;

      window.addEventListener('online', () => {
        console.log('[Web] Browser is online');
        this.isConnected = true;
        this.notifyListeners();
      });

      window.addEventListener('offline', () => {
        console.log('[Web] Browser is offline');
        this.isConnected = false;
        this.notifyListeners();
      });
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public subscribe(listener: (isConnected: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isConnected));
  }

  public async checkConnection(): Promise<boolean> {
    if (typeof navigator !== 'undefined') {
      this.isConnected = navigator.onLine;
    }
    return this.isConnected;
  }
}

export const networkStatusManager = new NetworkStatusManager();
