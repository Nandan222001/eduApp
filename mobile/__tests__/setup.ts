import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  usePathname: jest.fn(),
  useSegments: jest.fn(),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(),
  },
  Redirect: ({ href }: { href: string }) => null,
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
  ),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock expo-background-fetch
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(() => Promise.resolve()),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
  getStatusAsync: jest.fn(() => Promise.resolve(1)),
  setMinimumIntervalAsync: jest.fn(() => Promise.resolve()),
  BackgroundFetchResult: {
    NewData: 'newData',
    NoData: 'noData',
    Failed: 'failed',
  },
  BackgroundFetchStatus: {
    Available: 1,
    Denied: 2,
    Restricted: 3,
  },
}));

// Mock expo-task-manager
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  getRegisteredTasksAsync: jest.fn(() => Promise.resolve([])),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Setup global test timeout
jest.setTimeout(10000);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
