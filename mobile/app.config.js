export default ({ config }) => {
  const appEnv = process.env.APP_ENV || 'development';
  const sentryDsn = process.env.SENTRY_DSN || '';
  
  return {
    ...config,
    hooks: {
      postPublish: [
        {
          file: 'sentry-expo/upload-sourcemaps',
          config: {
            organization: 'your-sentry-org',
            project: 'edu-mobile',
            authToken: process.env.SENTRY_AUTH_TOKEN,
          },
        },
      ],
    },
    extra: {
      ...config.extra,
      appEnv,
      sentryDsn,
      eas: {
        projectId: config.extra?.eas?.projectId || 'your-project-id',
      },
    },
  };
};
