import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/accord-api': {
        target: 'https://buddhistfuturetech.in/accord-api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/accord-api/, ''),
      },
    },
  },
});