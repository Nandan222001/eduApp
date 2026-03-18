import React, { useRef } from 'react';
import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import { analyticsService } from '@services/analytics';
import { Sentry } from '@config/sentry';

interface Props {
  children: React.ReactNode;
}

export const NavigationContainer: React.FC<Props> = ({ children }) => {
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string>();

  return (
    <RNNavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          analyticsService.trackScreenView(currentRouteName, previousRouteName);

          Sentry.addBreadcrumb({
            category: 'navigation',
            message: `Navigated to ${currentRouteName}`,
            level: 'info',
            data: {
              from: previousRouteName,
              to: currentRouteName,
            },
          });
        }

        routeNameRef.current = currentRouteName;
      }}
    >
      {children}
    </RNNavigationContainer>
  );
};
