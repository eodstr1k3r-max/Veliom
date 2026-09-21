import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'examples',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: '../dist/examples',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'examples/index.html'),
        advanced: resolve(__dirname, 'examples/advanced.html'),
        api: resolve(__dirname, 'examples/api-example.html'),
        features: resolve(__dirname, 'examples/features.html'),
        lazy: resolve(__dirname, 'examples/lazy-demo.html'),
        router: resolve(__dirname, 'examples/router-demo.html'),
      },
    },
  },
});
