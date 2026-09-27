import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    // Keeps the browser same-origin in dev: /api/* goes to the Express server,
    // everything else to Vite. Only /api is forwarded — not the whole origin.
    proxy: {
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: false,
      },
    },
  },
})
