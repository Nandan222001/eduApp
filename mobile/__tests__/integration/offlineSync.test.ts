import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useOfflineSync } from '../../src/hooks/useOfflineSync';
import { offlineQueueManager } from '../../src/utils/offlineQueue';
import { backgroundSyncService } from '../../src/utils/backgroundSync';

jest.mock('../../src/utils/offlineQueue');
jest.mock('../../src/utils/backgroundSync');

describe('Offline Sync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with queue state', () => {
    const mockQueueState = {
      pending: [],
      failed: [],
      totalPending: 0,
      totalFailed: 0,
    };

    (offlineQueueManager.getQueueState as jest.Mock).mockReturnValue(mockQueueState);
    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(true);
    (offlineQueueManager.subscribe as jest.Mock).mockReturnValue(jest.fn());

    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.queueState).toEqual(mockQueueState);
    expect(result.current.isOnline).toBe(true);
  });

  it('should trigger manual sync', async () => {
    const mockSyncResult = {
      success: true,
      synced: 5,
      failed: 0,
      timestamp: Date.now(),
    };

    (offlineQueueManager.getQueueState as jest.Mock).mockReturnValue({
      pending: [],
      failed: [],
      totalPending: 0,
      totalFailed: 0,
    });
    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(true);
    (offlineQueueManager.subscribe as jest.Mock).mockReturnValue(jest.fn());
    (backgroundSyncService.triggerManualSync as jest.Mock).mockResolvedValue(mockSyncResult);
    (backgroundSyncService.getLastSyncResult as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      const syncResult = await result.current.triggerManualSync();
      expect(syncResult).toEqual(mockSyncResult);
    });

    expect(backgroundSyncService.triggerManualSync).toHaveBeenCalled();
  });

  it('should handle sync failure', async () => {
    (offlineQueueManager.getQueueState as jest.Mock).mockReturnValue({
      pending: [],
      failed: [],
      totalPending: 0,
      totalFailed: 0,
    });
    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(true);
    (offlineQueueManager.subscribe as jest.Mock).mockReturnValue(jest.fn());
    (backgroundSyncService.triggerManualSync as jest.Mock).mockRejectedValue(
      new Error('Sync failed')
    );
    (backgroundSyncService.getLastSyncResult as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineSync());

    await expect(
      act(async () => {
        await result.current.triggerManualSync();
      })
    ).rejects.toThrow('Sync failed');
  });

  it('should clear queue', async () => {
    (offlineQueueManager.getQueueState as jest.Mock).mockReturnValue({
      pending: [],
      failed: [],
      totalPending: 0,
      totalFailed: 0,
    });
    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(true);
    (offlineQueueManager.subscribe as jest.Mock).mockReturnValue(jest.fn());
    (offlineQueueManager.clearQueue as jest.Mock).mockResolvedValue(undefined);
    (backgroundSyncService.getLastSyncResult as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.clearQueue();
    });

    expect(offlineQueueManager.clearQueue).toHaveBeenCalled();
  });

  it('should retry failed requests', async () => {
    (offlineQueueManager.getQueueState as jest.Mock).mockReturnValue({
      pending: [],
      failed: [{ id: '1', type: 'assignment_submission' }],
      totalPending: 0,
      totalFailed: 1,
    });
    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(true);
    (offlineQueueManager.subscribe as jest.Mock).mockReturnValue(jest.fn());
    (offlineQueueManager.retryFailedRequests as jest.Mock).mockResolvedValue(undefined);
    (backgroundSyncService.getLastSyncResult as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.retryFailedRequests();
    });

    expect(offlineQueueManager.retryFailedRequests).toHaveBeenCalled();
  });

  it('should get requests by type', () => {
    const mockRequests = [
      { id: '1', type: 'assignment_submission', data: {} },
      { id: '2', type: 'assignment_submission', data: {} },
    ];

    (offlineQueueManager.getQueueState as jest.Mock).mockReturnValue({
      pending: [],
      failed: [],
      totalPending: 0,
      totalFailed: 0,
    });
    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(true);
    (offlineQueueManager.subscribe as jest.Mock).mockReturnValue(jest.fn());
    (offlineQueueManager.getRequestsByType as jest.Mock).mockReturnValue(mockRequests);
    (backgroundSyncService.getLastSyncResult as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineSync());

    const requests = result.current.getRequestsByType('assignment_submission');
    expect(requests).toEqual(mockRequests);
  });

  it('should handle online/offline state changes', async () => {
    let subscribeCallback: any;
    (offlineQueueManager.getQueueState as jest.Mock).mockReturnValue({
      pending: [],
      failed: [],
      totalPending: 0,
      totalFailed: 0,
    });
    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(true);
    (offlineQueueManager.subscribe as jest.Mock).mockImplementation((callback: any) => {
      subscribeCallback = callback;
      return jest.fn();
    });
    (backgroundSyncService.getLastSyncResult as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.isOnline).toBe(true);

    (offlineQueueManager.isConnected as jest.Mock).mockReturnValue(false);

    act(() => {
      subscribeCallback({
        pending: [],
        failed: [],
        totalPending: 0,
        totalFailed: 0,
      });
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });
});
