import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative paths so the build works under andrewmacheret.com/projects/cube/
  base: './',
  build: {
    // three.js on its own is about 600 kB, so the default 500 kB limit always warns
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // keep libraries in their own files so app changes don't bust their cache
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ }
          ]
        }
      }
    }
  }
});
