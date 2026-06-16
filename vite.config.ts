import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Vite config for the React Conduit app.
// - Dev server is pinned to port 4200 to match the Playwright `baseURL`.
// - SVG media assets live in the `realworld` git submodule and are copied to
//   `/assets` (served in dev, emitted to `dist/assets` on build) so that paths
//   like `/assets/conduit-logo.svg` and `/assets/default-avatar.svg` resolve.
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{ src: 'realworld/assets/media/*.svg', dest: 'assets', rename: { stripBase: true } }],
    }),
  ],
  server: {
    port: 4200,
    strictPort: true,
  },
  preview: {
    port: 4200,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
