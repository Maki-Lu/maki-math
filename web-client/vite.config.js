import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 只要前端请求以 /api 开头，就转发到你的 .NET 后端
      '/api': {
        target: 'http://localhost:5204',
        changeOrigin: true,
        secure: false
      }
    }
  }
})