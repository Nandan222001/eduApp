import * as Sentry from '@sentry/react';
import { env } from '@/config/env';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '1.0'
);
const SENTRY_REPLAYS_SESSION_SAMPLE_RATE = parseFloat(
  import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'
);
const SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = parseFloat(
  import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'
);

export const initSentry = (): void => {
  if (!SENTRY_DSN || SENTRY_ENVIRONMENT === 'development') {
    console.log('Sentry is disabled in development mode');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: env.appVersion,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    replaysSessionSampleRate: SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    replaysOnErrorSampleRate: SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          return null;
        }

        if (error.message.includes('ResizeObserver loop')) {
          return null;
        }
      }

      return event;
    },
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'Load failed',
    ],
  });
};

export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  if (SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development') {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Exception:', error, context);
  }
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): void => {
  if (SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development') {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[${level}] ${message}`, context);
  }
};

export const setUserContext = (user: { id: string; email?: string; username?: string }): void => {
  if (SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development') {
    Sentry.setUser(user);
  }
};

export const clearUserContext = (): void => {
  if (SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development') {
    Sentry.setUser(null);
  }
};

export const addBreadcrumb = (
  category: string,
  message: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): void => {
  if (SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development') {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data,
    });
  }
};

export const setTag = (key: string, value: string): void => {
  if (SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development') {
    Sentry.setTag(key, value);
  }
};

export const setContext = (name: string, context: Record<string, unknown>): void => {
  if (SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development') {
    Sentry.setContext(name, context);
  }
};

export { Sentry };
