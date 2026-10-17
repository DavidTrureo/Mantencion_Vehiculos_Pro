import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/vehiculos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass: (req) => {
          const isHtml = req.headers.accept && req.headers.accept.includes('html');
          const isDoc = req.headers['sec-fetch-dest'] === 'document';
          const isPageNav = !req.headers.authorization && req.method === 'GET' && !req.url.includes('/makes') && !req.url.includes('/models');
          if (isHtml || isDoc || isPageNav) {
            return '/index.html';
          }
        }
      },
      '/mantenimientos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass: (req) => {
          const isHtml = req.headers.accept && req.headers.accept.includes('html');
          const isDoc = req.headers['sec-fetch-dest'] === 'document';
          const isPageNav = !req.headers.authorization && req.method === 'GET';
          if (isHtml || isDoc || isPageNav) {
            return '/index.html';
          }
        }
      },
      '/recomendaciones': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        bypass: (req) => {
          const isHtml = req.headers.accept && req.headers.accept.includes('html');
          const isDoc = req.headers['sec-fetch-dest'] === 'document';
          const isPageNav = !req.headers.authorization && req.method === 'GET';
          if (isHtml || isDoc || isPageNav) {
            return '/index.html';
          }
        }
      }
    }
  }
})
