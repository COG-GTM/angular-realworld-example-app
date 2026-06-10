import { defineConfig } from '@playwright/test';
import { baseConfig } from './e2e/playwright.base';

/**
 * Playwright configuration for the migrated React + Vite app.
 * Extends the shared RealWorld base config with the React dev server.
 */
export default defineConfig({
  ...baseConfig,

  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:4200',
  },

  webServer: {
    command: 'bun run dev',
    cwd: 'react-app',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
