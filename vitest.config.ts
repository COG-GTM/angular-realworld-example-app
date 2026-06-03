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
      reporter: ['text', 'json', 'json-summary', 'html'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/test-setup.ts',
        'src/testing/**',
        'src/main.ts',
        'src/**/*.model.ts',
        'src/**/*.routes.ts',
        'src/app/app.config.ts',
      ],
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
