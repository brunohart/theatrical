import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_THEATRICAL_MOCK': JSON.stringify(process.env.VITE_THEATRICAL_MOCK ?? 'true'),
  },
});
