import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  // Add the following configuration to resolve the alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }
})