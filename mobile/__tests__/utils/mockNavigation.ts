import { NavigationContainerRef } from '@react-navigation/native';

export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    routes: [],
    index: 0,
    key: 'test-key',
  })),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
});

export const createMockRoute = (params = {}) => ({
  key: 'test-route-key',
  name: 'TestScreen',
  params,
});

export const mockNavigationContainerRef = {
  current: null as NavigationContainerRef<any> | null,
};

export const resetNavigationMocks = () => {
  jest.clearAllMocks();
};
