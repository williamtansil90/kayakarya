import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8701,
    host: true,
    allowedHosts: ['kayakarya.com', 'www.kayakarya.com', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:8702',
        changeOrigin: true,
      },
    },
  },
})
