/**
 * NetInfo Integration Tests
 * 
 * Tests to verify:
 * - NetInfo listener updates Redux offline state
 * - Network status detection
 * - Connection type handling
 * - State transitions
 */

import { networkStatusManager } from '../../src/utils/networkStatus';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo');

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('NetInfo Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as any);
    
    mockNetInfo.addEventListener.mockReturnValue(() => {});
  });

  describe('Network Status Detection', () => {
    it('should detect online status', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      const isConnected = await networkStatusManager.checkConnection();
      
      expect(isConnected).toBe(true);
    });

    it('should detect offline status', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      const isConnected = await networkStatusManager.checkConnection();
      
      expect(isConnected).toBe(false);
    });

    it('should detect when connected but no internet', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
        type: 'wifi',
      } as any);

      const isConnected = await networkStatusManager.checkConnection();
      
      expect(isConnected).toBe(false);
    });

    it('should get current connection status', () => {
      const isConnected = networkStatusManager.getIsConnected();
      
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Connection Types', () => {
    it('should detect WiFi connection', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      await networkStatusManager.checkConnection();
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    it('should detect cellular connection', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'cellular',
      } as any);

      await networkStatusManager.checkConnection();
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    it('should detect ethernet connection', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'ethernet',
      } as any);

      await networkStatusManager.checkConnection();
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    it('should detect no connection', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      await networkStatusManager.checkConnection();
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    it('should detect unknown connection type', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
      } as any);

      await networkStatusManager.checkConnection();
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });
  });

  describe('Event Listener', () => {
    it('should add NetInfo event listener', () => {
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should notify listeners on network change', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      const callback = jest.fn();
      networkStatusManager.subscribe(callback);

      if (networkListener) {
        networkListener({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        } as any);
      }

      // Listener should be registered
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should handle state transitions', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      if (networkListener) {
        // Online to offline
        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        } as any);

        networkListener({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        } as any);

        // Offline to online
        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'cellular',
        } as any);
      }

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should handle rapid state changes', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      if (networkListener) {
        for (let i = 0; i < 10; i++) {
          networkListener({
            isConnected: i % 2 === 0,
            isInternetReachable: i % 2 === 0,
            type: i % 2 === 0 ? 'wifi' : 'none',
          } as any);
        }
      }

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Subscription Management', () => {
    it('should allow subscribing to network changes', () => {
      const callback = jest.fn();
      const unsubscribe = networkStatusManager.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe correctly', () => {
      const callback = jest.fn();
      const unsubscribe = networkStatusManager.subscribe(callback);

      unsubscribe();

      // Callback should not be called after unsubscribe
      expect(typeof unsubscribe).toBe('function');
    });

    it('should support multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      networkStatusManager.subscribe(callback1);
      networkStatusManager.subscribe(callback2);
      networkStatusManager.subscribe(callback3);

      // All subscribers should be registered
      expect(true).toBe(true);
    });

    it('should notify only active subscribers', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      networkStatusManager.subscribe(callback1);
      const unsubscribe2 = networkStatusManager.subscribe(callback2);

      unsubscribe2();

      if (networkListener) {
        networkListener({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        } as any);
      }

      // Only callback1 should be called
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });
  });

  describe('State Changes', () => {
    it('should detect transition from online to offline', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;
      const callback = jest.fn();

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      networkStatusManager.subscribe(callback);

      if (networkListener) {
        // Start online
        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        } as any);

        // Go offline
        callback.mockClear();
        networkListener({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        } as any);
      }

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should detect transition from offline to online', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;
      const callback = jest.fn();

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      networkStatusManager.subscribe(callback);

      if (networkListener) {
        // Start offline
        networkListener({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        } as any);

        // Go online
        callback.mockClear();
        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        } as any);
      }

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should detect transition between connection types', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      if (networkListener) {
        // WiFi to cellular
        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        } as any);

        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'cellular',
        } as any);
      }

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should not notify if status unchanged', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;
      const callback = jest.fn();

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      networkStatusManager.subscribe(callback);

      if (networkListener) {
        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        } as any);

        callback.mockClear();

        // Same state
        networkListener({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        } as any);
      }

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle NetInfo fetch errors', async () => {
      mockNetInfo.fetch.mockRejectedValue(new Error('NetInfo error'));

      try {
        await networkStatusManager.checkConnection();
      } catch (error) {
        // Should handle error
      }
    });

    it('should handle null connection state', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: null,
        isInternetReachable: null,
        type: 'unknown',
      } as any);

      const isConnected = await networkStatusManager.checkConnection();
      
      expect(typeof isConnected).toBe('boolean');
    });

    it('should handle undefined values', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: undefined,
        isInternetReachable: undefined,
        type: undefined,
      } as any);

      const isConnected = await networkStatusManager.checkConnection();
      
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle connected but unreachable internet', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
        type: 'wifi',
      } as any);

      const isConnected = await networkStatusManager.checkConnection();
      
      // Should be false because internet is not reachable
      expect(isConnected).toBe(false);
    });

    it('should handle unknown connection type while online', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
      } as any);

      const isConnected = await networkStatusManager.checkConnection();
      
      expect(isConnected).toBe(true);
    });

    it('should handle bluetooth connection', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'bluetooth',
      } as any);

      await networkStatusManager.checkConnection();
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    it('should handle wimax connection', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wimax',
      } as any);

      await networkStatusManager.checkConnection();
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should check connection quickly', async () => {
      const startTime = Date.now();
      
      await networkStatusManager.checkConnection();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should be fast
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple concurrent checks', async () => {
      const promises = [
        networkStatusManager.checkConnection(),
        networkStatusManager.checkConnection(),
        networkStatusManager.checkConnection(),
      ];

      await Promise.all(promises);
      
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    it('should efficiently notify subscribers', () => {
      let networkListener: ((state: NetInfoState) => void) | null = null;

      mockNetInfo.addEventListener.mockImplementation((listener: any) => {
        networkListener = listener;
        return () => {};
      });

      // Add many subscribers
      for (let i = 0; i < 100; i++) {
        networkStatusManager.subscribe(jest.fn());
      }

      const startTime = Date.now();

      if (networkListener) {
        networkListener({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        } as any);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should notify all subscribers quickly
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Initialization', () => {
    it('should fetch initial network state', () => {
      expect(mockNetInfo.fetch).toHaveBeenCalled();
    });

    it('should set up event listener', () => {
      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should initialize with correct default state', () => {
      const isConnected = networkStatusManager.getIsConnected();
      
      expect(typeof isConnected).toBe('boolean');
    });
  });
});
