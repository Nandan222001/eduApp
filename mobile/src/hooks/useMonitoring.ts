import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import crashReporting from '../services/crashReporting';
import analyticsService from '../services/analytics';

/**
 * Hook to track screen views automatically
 */
export function useScreenTracking(screenName: string, params?: Record<string, any>) {
  useEffect(() => {
    // Track screen view
    analyticsService.trackScreenView(screenName, screenName);

    // Set context for crash reporting
    crashReporting.setCurrentRoute(screenName, params);
    crashReporting.addBreadcrumb(`Viewed ${screenName}`, 'navigation', params);
  }, [screenName, params]);
}

/**
 * Hook to track errors in a component
 */
export function useErrorTracking(componentName: string) {
  const trackError = (error: Error, context?: Record<string, any>) => {
    console.error(`[${componentName}] Error:`, error);

    crashReporting.captureError(error, {
      component: componentName,
      ...context,
    });

    analyticsService.trackError(error, {
      component: componentName,
      ...context,
    });
  };

  return { trackError };
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const trackInteraction = (
    action: string,
    category: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    analyticsService.trackEvent('user_interaction', {
      action,
      category,
      label,
      value,
      ...metadata,
    });

    crashReporting.addBreadcrumb(`User interaction: ${action}`, 'user', {
      category,
      label,
      value,
      ...metadata,
    });
  };

  const trackButtonPress = (buttonName: string, screen: string, metadata?: Record<string, any>) => {
    trackInteraction('button_press', 'button', buttonName, undefined, {
      screen,
      ...metadata,
    });
  };

  const trackFormSubmit = (formName: string, success: boolean, metadata?: Record<string, any>) => {
    trackInteraction('form_submit', 'form', formName, success ? 1 : 0, metadata);
  };

  return {
    trackInteraction,
    trackButtonPress,
    trackFormSubmit,
  };
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceTracking(screenName: string) {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;

      analyticsService.trackEvent('screen_duration', {
        screen_name: screenName,
        duration_ms: duration,
      });

      if (duration > 10000) {
        // Track unusually long screen time
        crashReporting.addBreadcrumb(
          `Long screen time: ${screenName}`,
          'performance',
          { duration_ms: duration },
          'warning'
        );
      }
    };
  }, [screenName]);
}

/**
 * Hook for navigation tracking
 */
export function useNavigationTracking() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const currentRoute = navigation.getCurrentRoute();

      if (currentRoute) {
        analyticsService.trackScreenView(currentRoute.name, currentRoute.name);
        crashReporting.setCurrentRoute(currentRoute.name, currentRoute.params);
      }
    });

    return unsubscribe;
  }, [navigation]);
}

export default {
  useScreenTracking,
  useErrorTracking,
  useInteractionTracking,
  usePerformanceTracking,
  useNavigationTracking,
};
