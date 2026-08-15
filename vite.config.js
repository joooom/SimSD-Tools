import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4173,
    proxy: {
      '/api': 'http://127.0.0.1:4174',
      '/auth': 'http://127.0.0.1:4174',
      '/ws': { target: 'ws://127.0.0.1:4174', ws: true },
    },
  },
  preview: { port: 4173 },
});
