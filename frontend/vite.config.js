import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyDirBeforeBuild: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-state': ['zustand'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/intelligence': 'http://localhost:3001',
      '/projects': 'http://localhost:3001',
      '/chat': 'http://localhost:3001',
      '/impact': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
      '/code': 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
