import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React + TypeScript port of the Angular RealWorld (Conduit) app.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4300,
  },
});
