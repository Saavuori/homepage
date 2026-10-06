import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Go backend serves this build plus /api/status (the live app checks),
// /api/version and /api/health; in dev, Vite proxies /api to it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
})
