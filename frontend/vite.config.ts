import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      sentryVitePlugin({
        org: 'your-sentry-org',
        project: 'your-sentry-project',
        authToken: env.VITE_SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: './dist/**',
        },
        release: {
          name: env.VITE_APP_VERSION || '0.0.0',
          uploadLegacySourcemaps: './dist',
        },
        disable: mode === 'development',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
