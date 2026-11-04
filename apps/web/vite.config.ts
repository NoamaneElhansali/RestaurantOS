import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
      },
      '/sanctum': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Node-native health tests run with npm run test:offline, not jsdom/Vitest.
    include: ['src/tests/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
  },
});
