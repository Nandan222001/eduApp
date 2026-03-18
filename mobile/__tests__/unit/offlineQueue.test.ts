import { offlineQueueManager } from '../../src/utils/offlineQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('offlineQueueManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize queue state', () => {
    const state = offlineQueueManager.getQueueState();
    expect(state).toBeDefined();
  });

  it('should check connection status', () => {
    const isConnected = offlineQueueManager.isConnected();
    expect(typeof isConnected).toBe('boolean');
  });

  it('should allow subscribing to state changes', () => {
    const callback = jest.fn();
    const unsubscribe = offlineQueueManager.subscribe(callback);
    
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should handle queue operations', async () => {
    await offlineQueueManager.clearQueue();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
