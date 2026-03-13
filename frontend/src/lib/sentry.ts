import * as Sentry from '@sentry/react';

interface CaptureMessageOptions {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  contexts?: Record<string, Record<string, unknown>>;
}

export const initSentry = (): void => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

  if (!dsn || dsn === 'your_sentry_dsn_here') {
    console.warn('Sentry is not configured');
    return;
  }

  const tracesSampleRate = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '1.0');
  const replaysSessionSampleRate = parseFloat(
    import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'
  );
  const replaysOnErrorSampleRate = parseFloat(
    import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'
  );

  Sentry.init({
    dsn,
    environment,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
  });
};

export const captureException = (error: Error, options?: CaptureMessageOptions): string => {
  return Sentry.captureException(error, {
    extra: options?.extra,
    tags: options?.tags,
    contexts: options?.contexts,
  });
};

export const captureMessage = (
  message: string,
  level?: Sentry.SeverityLevel,
  options?: CaptureMessageOptions
): string => {
  return Sentry.captureMessage(message, {
    level: level || 'info',
    extra: options?.extra,
    tags: options?.tags,
    contexts: options?.contexts,
  });
};

export const setUser = (user: Sentry.User | null): void => {
  Sentry.setUser(user);
};

export const setContext = (name: string, context: Record<string, unknown> | null): void => {
  Sentry.setContext(name, context);
};

export const setTag = (key: string, value: string): void => {
  Sentry.setTag(key, value);
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb): void => {
  Sentry.addBreadcrumb(breadcrumb);
};
