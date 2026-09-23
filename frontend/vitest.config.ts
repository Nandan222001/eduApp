/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.ts', './tests/setup.ts'],
    // tests/e2e/** are Playwright specs (run via `npx playwright test`, using
    // the root playwright.config.ts) that need a live browser + dev server --
    // exclude them so Vitest's default *.spec.ts glob doesn't try to collect
    // them as unit tests.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    server: {
      deps: {
        // @mui/x-date-pickers' ESM build does bare directory imports like
        // '@mui/material/useMediaQuery' (no explicit /index.js), which Node's
        // native ESM resolver rejects (ERR_UNSUPPORTED_DIR_IMPORT). Inlining
        // routes it through Vite's more lenient transform pipeline instead.
        inline: ['@mui/x-date-pickers'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/types',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
