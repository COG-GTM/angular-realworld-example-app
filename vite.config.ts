import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

function copyRealworldAssets() {
  return {
    name: 'copy-realworld-assets',
    buildStart() {
      const destDir = join(__dirname, 'public', 'assets');
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      const mediaDir = join(__dirname, 'realworld', 'assets', 'media');
      if (existsSync(mediaDir)) {
        for (const file of readdirSync(mediaDir)) {
          if (file.endsWith('.svg')) {
            copyFileSync(join(mediaDir, file), join(destDir, file));
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyRealworldAssets()],
  server: {
    port: 4200,
  },
});
