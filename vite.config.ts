import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['front-matter', 'marked', 'dompurify', 'turndown']
  },
  assetsInclude: ['**/*.md'],
  server: {
    fs: {
      strict: false,
      allow: ['content']
    }
  }
});
