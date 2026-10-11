import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '리프레쉬 (Refresh)',
        short_name: 'Refresh',
        description: 'AI 기반 맞춤형 식물 진단 및 모듈형 자동 급수 시스템',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://223.130.157.123:8080',
        changeOrigin: true,
        headers: {
          Origin: 'http://localhost:5173'
        }
      },
      '/uploads': {
        target: 'http://223.130.157.123:8080',
        changeOrigin: true,
      }
    }
  }
})