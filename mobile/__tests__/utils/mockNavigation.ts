import { NavigationProp, ParamListBase } from '@react-navigation/native';

export const createMockNavigation = (overrides: Partial<NavigationProp<ParamListBase>> = {}) => {
  const navigation: any = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(() => ({
      routes: [],
      index: 0,
      key: 'mock-state',
    })),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    ...overrides,
  };

  return navigation as NavigationProp<ParamListBase>;
};
