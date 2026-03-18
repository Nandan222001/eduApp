import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { SENTRY_DSN, APP_ENV } from '@env';

const isProduction = APP_ENV === 'production';
const isStaging = APP_ENV === 'staging';

export const initializeSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV || 'development',
    debug: !isProduction && !isStaging,
    enableInExpoDevelopment: false,
    tracesSampleRate: isProduction ? 0.2 : 1.0,
    attachScreenshot: true,
    attachViewHierarchy: true,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    integrations: [
      new Sentry.ReactNativeTracing({
        tracingOrigins: ['localhost', /^\//],
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      }),
    ],
    beforeSend(event: Sentry.Event) {
      if (!isProduction && !isStaging) {
        console.log('Sentry Event:', event);
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
      if (breadcrumb.category === 'console' && !isProduction) {
        return null;
      }
      return breadcrumb;
    },
  });

  Sentry.setTag('app_version', Constants.expoConfig?.version || '1.0.0');
  Sentry.setTag(
    'build_number',
    Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1'
  );
  Sentry.setTag('expo_version', Constants.expoVersion || 'unknown');
};

export const setSentryUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

export const clearSentryUser = () => {
  Sentry.setUser(null);
};

export { Sentry };
