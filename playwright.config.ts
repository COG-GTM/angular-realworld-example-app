import { defineConfig } from '@playwright/test';
import { baseConfig } from './e2e/playwright.base';

/**
 * React-specific Playwright configuration.
 * Extends the shared RealWorld base config with the Vite dev server.
 */
export default defineConfig({
  ...baseConfig,

  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:4200',
  },

  webServer: {
    command: 'npx vite',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
