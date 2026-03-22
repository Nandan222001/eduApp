import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

class NetworkStatusManager {
  private isConnected: boolean = true;
  private listeners: Array<(isConnected: boolean) => void> = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    NetInfo.fetch().then((state: NetInfoState) => {
      this.isConnected = state.isConnected === true && state.isInternetReachable !== false;
    });

    NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected === true && state.isInternetReachable !== false;

      if (wasConnected !== this.isConnected) {
        this.notifyListeners();
      }
    });
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
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected === true && state.isInternetReachable !== false;
    return this.isConnected;
  }
}

export const networkStatusManager = new NetworkStatusManager();
