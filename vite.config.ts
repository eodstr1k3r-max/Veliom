import { defineConfig } from 'vite';
import { resolve } from 'path';

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
      },
    },
  },
});
