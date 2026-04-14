import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: [fileURLToPath(new URL('./src/test-setup.ts', import.meta.url))],
    include: ['src/**/*.spec.ts'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  define: {
    ngDevMode: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
