import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://multialmeida-pdvsaas-backend-production.up.railway.app',
        changeOrigin: true,
        secure: false,
        ws: true,
        cookieDomainRewrite: '', // Remove o domínio para cookies funcionarem em localhost
        cookiePathRewrite: '/', // Garante que o path seja /
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.headers['set-cookie']) {
              // Remove domínio para cookies funcionarem em localhost
              const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                return cookie.replace(/Domain=[^;]+;?\s*/gi, '');
              });
              proxyRes.headers['set-cookie'] = cookies;
            }
          });
        },
      },
    },
  },
})
