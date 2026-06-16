/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Mirror the old angular.json asset rule: copy RealWorld media SVGs to /assets.
    // Filenames are kept unhashed so e.g. `/assets/default-avatar.svg` resolves verbatim
    // (the e2e suite asserts the literal `default-avatar.svg` substring in image `src`).
    viteStaticCopy({
      targets: [{ src: 'realworld/assets/media/*.svg', dest: 'assets' }],
    }),
  ],
  server: { port: 4200, strictPort: true },
  preview: { port: 4200, strictPort: true },
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
