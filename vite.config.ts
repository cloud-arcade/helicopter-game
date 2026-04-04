import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  
  // Base path: empty for dev, repository name for production builds (GitHub Pages)
  base: command === 'serve' ? '/' : '/helicopter-game/',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate clean, cache-friendly filenames
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Inline small assets (< 4KB)
    assetsInlineLimit: 4096,
    
    // Enable minification for production
    minify: 'terser',
    
    // Generate sourcemaps for debugging
    sourcemap: false,
  },

  server: {
    // Local development port
    port: 3000,
    open: true,
  },

  preview: {
    port: 4173,
  },
}));
