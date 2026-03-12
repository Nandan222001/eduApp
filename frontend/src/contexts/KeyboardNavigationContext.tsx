import { createContext, useContext, ReactNode } from 'react';
import { useKeyboardNavigation, KeyboardNavigationConfig } from '../hooks/useKeyboardNavigation';

interface KeyboardNavigationContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextValue | undefined>(
  undefined
);

interface KeyboardNavigationProviderProps {
  children: ReactNode;
  config?: KeyboardNavigationConfig;
}

export const KeyboardNavigationProvider = ({
  children,
  config = {},
}: KeyboardNavigationProviderProps) => {
  useKeyboardNavigation({ ...config, enabled: true });

  const value: KeyboardNavigationContextValue = {
    enabled: true,
    setEnabled: () => {},
  };

  return (
    <KeyboardNavigationContext.Provider value={value}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export const useKeyboardNavigationContext = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error(
      'useKeyboardNavigationContext must be used within a KeyboardNavigationProvider'
    );
  }
  return context;
};

export default KeyboardNavigationProvider;
