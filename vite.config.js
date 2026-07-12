import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import devApiPlugin from './vite-plugin-dev-api.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devApiPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split vendor libs into their own cacheable chunks — these change
        // far less often than app code, so browsers can keep them cached
        // across deploys instead of re-downloading on every app update.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
})
