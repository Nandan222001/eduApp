import notificationReducer, {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setLoading,
} from '../../src/store/slices/notificationSlice';

const createMockNotification = (overrides = {}) => ({
  id: '1',
  title: 'Test Notification',
  message: 'Test message',
  type: 'info' as const,
  read: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('notificationSlice', () => {
  const initialState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = notificationReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    describe('setNotifications', () => {
      it('should set notifications list', () => {
        const notifications = [
          createMockNotification({ id: '1', read: false }),
          createMockNotification({ id: '2', read: true }),
          createMockNotification({ id: '3', read: false }),
        ];
        const state = notificationReducer(initialState, setNotifications(notifications));
        expect(state.notifications).toEqual(notifications);
        expect(state.unreadCount).toBe(2);
      });

      it('should replace existing notifications', () => {
        const oldNotifications = [createMockNotification({ id: '1' })];
        const newNotifications = [createMockNotification({ id: '2' })];
        const stateWithNotifications = {
          ...initialState,
          notifications: oldNotifications,
          unreadCount: 1,
        };
        const state = notificationReducer(
          stateWithNotifications,
          setNotifications(newNotifications)
        );
        expect(state.notifications).toEqual(newNotifications);
        expect(state.notifications.length).toBe(1);
      });

      it('should calculate unread count correctly', () => {
        const notifications = [
          createMockNotification({ id: '1', read: true }),
          createMockNotification({ id: '2', read: true }),
          createMockNotification({ id: '3', read: true }),
        ];
        const state = notificationReducer(initialState, setNotifications(notifications));
        expect(state.unreadCount).toBe(0);
      });

      it('should handle empty array', () => {
        const state = notificationReducer(initialState, setNotifications([]));
        expect(state.notifications).toEqual([]);
        expect(state.unreadCount).toBe(0);
      });
    });

    describe('addNotification', () => {
      it('should add notification to the beginning', () => {
        const existingNotification = createMockNotification({ id: '1' });
        const newNotification = createMockNotification({ id: '2' });
        const stateWithNotifications = {
          ...initialState,
          notifications: [existingNotification],
          unreadCount: 1,
        };
        const state = notificationReducer(stateWithNotifications, addNotification(newNotification));
        expect(state.notifications[0]).toEqual(newNotification);
        expect(state.notifications.length).toBe(2);
      });

      it('should increment unread count for unread notification', () => {
        const notification = createMockNotification({ read: false });
        const state = notificationReducer(initialState, addNotification(notification));
        expect(state.unreadCount).toBe(1);
      });

      it('should not increment unread count for read notification', () => {
        const notification = createMockNotification({ read: true });
        const state = notificationReducer(initialState, addNotification(notification));
        expect(state.unreadCount).toBe(0);
      });

      it('should add notification with different types', () => {
        const types = ['info', 'success', 'warning', 'error'] as const;
        let state = initialState;

        types.forEach((type, index) => {
          const notification = createMockNotification({ id: `${index}`, type });
          state = notificationReducer(state, addNotification(notification));
        });

        expect(state.notifications.length).toBe(4);
        expect(state.notifications.map(n => n.type)).toEqual(types.reverse());
      });
    });

    describe('markAsRead', () => {
      it('should mark notification as read', () => {
        const notification = createMockNotification({ id: '1', read: false });
        const stateWithNotifications = {
          ...initialState,
          notifications: [notification],
          unreadCount: 1,
        };
        const state = notificationReducer(stateWithNotifications, markAsRead('1'));
        expect(state.notifications[0].read).toBe(true);
        expect(state.unreadCount).toBe(0);
      });

      it('should not change count if already read', () => {
        const notification = createMockNotification({ id: '1', read: true });
        const stateWithNotifications = {
          ...initialState,
          notifications: [notification],
          unreadCount: 0,
        };
        const state = notificationReducer(stateWithNotifications, markAsRead('1'));
        expect(state.notifications[0].read).toBe(true);
        expect(state.unreadCount).toBe(0);
      });

      it('should handle non-existent notification', () => {
        const notification = createMockNotification({ id: '1' });
        const stateWithNotifications = {
          ...initialState,
          notifications: [notification],
          unreadCount: 1,
        };
        const state = notificationReducer(stateWithNotifications, markAsRead('999'));
        expect(state.notifications[0].read).toBe(false);
        expect(state.unreadCount).toBe(1);
      });

      it('should only mark specific notification as read', () => {
        const notifications = [
          createMockNotification({ id: '1', read: false }),
          createMockNotification({ id: '2', read: false }),
          createMockNotification({ id: '3', read: false }),
        ];
        const stateWithNotifications = {
          ...initialState,
          notifications,
          unreadCount: 3,
        };
        const state = notificationReducer(stateWithNotifications, markAsRead('2'));
        expect(state.notifications[0].read).toBe(false);
        expect(state.notifications[1].read).toBe(true);
        expect(state.notifications[2].read).toBe(false);
        expect(state.unreadCount).toBe(2);
      });
    });

    describe('markAllAsRead', () => {
      it('should mark all notifications as read', () => {
        const notifications = [
          createMockNotification({ id: '1', read: false }),
          createMockNotification({ id: '2', read: false }),
          createMockNotification({ id: '3', read: true }),
        ];
        const stateWithNotifications = {
          ...initialState,
          notifications,
          unreadCount: 2,
        };
        const state = notificationReducer(stateWithNotifications, markAllAsRead());
        expect(state.notifications.every(n => n.read)).toBe(true);
        expect(state.unreadCount).toBe(0);
      });

      it('should handle empty notifications list', () => {
        const state = notificationReducer(initialState, markAllAsRead());
        expect(state.unreadCount).toBe(0);
        expect(state.notifications).toEqual([]);
      });

      it('should handle all already read', () => {
        const notifications = [
          createMockNotification({ id: '1', read: true }),
          createMockNotification({ id: '2', read: true }),
        ];
        const stateWithNotifications = {
          ...initialState,
          notifications,
          unreadCount: 0,
        };
        const state = notificationReducer(stateWithNotifications, markAllAsRead());
        expect(state.unreadCount).toBe(0);
      });
    });

    describe('removeNotification', () => {
      it('should remove notification by id', () => {
        const notifications = [
          createMockNotification({ id: '1' }),
          createMockNotification({ id: '2' }),
        ];
        const stateWithNotifications = {
          ...initialState,
          notifications,
          unreadCount: 2,
        };
        const state = notificationReducer(stateWithNotifications, removeNotification('1'));
        expect(state.notifications.length).toBe(1);
        expect(state.notifications[0].id).toBe('2');
      });

      it('should decrement unread count when removing unread notification', () => {
        const notifications = [
          createMockNotification({ id: '1', read: false }),
          createMockNotification({ id: '2', read: false }),
        ];
        const stateWithNotifications = {
          ...initialState,
          notifications,
          unreadCount: 2,
        };
        const state = notificationReducer(stateWithNotifications, removeNotification('1'));
        expect(state.unreadCount).toBe(1);
      });

      it('should not change count when removing read notification', () => {
        const notifications = [
          createMockNotification({ id: '1', read: true }),
          createMockNotification({ id: '2', read: false }),
        ];
        const stateWithNotifications = {
          ...initialState,
          notifications,
          unreadCount: 1,
        };
        const state = notificationReducer(stateWithNotifications, removeNotification('1'));
        expect(state.unreadCount).toBe(1);
      });

      it('should handle non-existent notification', () => {
        const notifications = [createMockNotification({ id: '1' })];
        const stateWithNotifications = {
          ...initialState,
          notifications,
          unreadCount: 1,
        };
        const state = notificationReducer(stateWithNotifications, removeNotification('999'));
        expect(state.notifications.length).toBe(1);
        expect(state.unreadCount).toBe(1);
      });
    });

    describe('setLoading', () => {
      it('should set loading to true', () => {
        const state = notificationReducer(initialState, setLoading(true));
        expect(state.isLoading).toBe(true);
      });

      it('should set loading to false', () => {
        const loadingState = { ...initialState, isLoading: true };
        const state = notificationReducer(loadingState, setLoading(false));
        expect(state.isLoading).toBe(false);
      });
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState };
      const notification = createMockNotification();
      notificationReducer(originalState, addNotification(notification));
      expect(originalState).toEqual(initialState);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple operations in sequence', () => {
      let state = initialState;

      // Add notifications
      state = notificationReducer(
        state,
        addNotification(createMockNotification({ id: '1', read: false }))
      );
      state = notificationReducer(
        state,
        addNotification(createMockNotification({ id: '2', read: false }))
      );
      state = notificationReducer(
        state,
        addNotification(createMockNotification({ id: '3', read: false }))
      );
      expect(state.unreadCount).toBe(3);

      // Mark one as read
      state = notificationReducer(state, markAsRead('2'));
      expect(state.unreadCount).toBe(2);

      // Remove one
      state = notificationReducer(state, removeNotification('3'));
      expect(state.unreadCount).toBe(1);
      expect(state.notifications.length).toBe(2);

      // Mark all as read
      state = notificationReducer(state, markAllAsRead());
      expect(state.unreadCount).toBe(0);
    });
  });
});
