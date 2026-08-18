import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const mediaDir = resolve(import.meta.dirname, '../realworld/assets/media');

/**
 * Serves and bundles the shared RealWorld media assets under /assets, mirroring
 * the asset mapping the Angular build performs in angular.json.
 */
function realworldAssets(): Plugin {
  return {
    name: 'realworld-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/assets\/([\w.-]+\.svg)(\?.*)?$/);
        if (!match) return next();
        const file = join(mediaDir, match[1]);
        if (!existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(readFileSync(file));
      });
    },
    closeBundle() {
      const out = resolve(import.meta.dirname, 'dist/assets');
      mkdirSync(out, { recursive: true });
      for (const file of readdirSync(mediaDir).filter(name => name.endsWith('.svg'))) {
        copyFileSync(join(mediaDir, file), join(out, file));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), realworldAssets()],
  server: {
    port: 5173,
    fs: { allow: [resolve(import.meta.dirname, '..')] },
  },
});
