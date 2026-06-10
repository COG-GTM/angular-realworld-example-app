import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200,
    // The Conduit theme stylesheet lives in the `realworld` git submodule, one
    // level above this app. Allow Vite to read from the parent directory so we
    // can import the shared theme without duplicating it.
    fs: {
      allow: ['..'],
    },
  },
  preview: {
    port: 4200,
  },
  build: {
    outDir: 'dist',
  },
});
