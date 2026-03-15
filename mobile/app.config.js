export default ({ config }) => {
  const appEnv = process.env.APP_ENV || 'development';
  
  return {
    ...config,
    extra: {
      ...config.extra,
      appEnv,
    },
  };
};
