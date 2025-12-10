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
        rewrite: (path) => path,
        secure: false,  // Ignora problemas de certificado SSL em dev
        ws: true,
        onProxyRes: (proxyRes, req, res) => {
          // Permite que cookies sejam setados pelo proxy
          if (proxyRes.headers['set-cookie']) {
            console.log('🍪 Cookie recebido do backend via proxy:', proxyRes.headers['set-cookie']);
          }
        },
        onProxyReq: (proxyReq, req, res) => {
          // Loga cookies sendo enviados
          if (req.headers.cookie) {
            console.log('📨 Cookie enviado ao backend via proxy:', req.headers.cookie);
          }
        },
      },
    },
  },
})
