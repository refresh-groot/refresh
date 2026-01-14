import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        // 서버 주소로 변경
        target: 'http://223.130.157.123:8080', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})