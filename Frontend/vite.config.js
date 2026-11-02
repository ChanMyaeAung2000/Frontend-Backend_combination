import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Backend ကို အခြား port တွင် ပြေးထားလိုပါက `VITE_API_TARGET` ဖြင့် ပြောင်းလဲနိုင်သည်။
// ဥထား: VITE_API_TARGET=http://localhost:5001 npm run dev
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:5000'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        // `/api` ကို `/reqapi` သို့ ပြောင်းသည်။
        // `/api/auth/*` (JWT routes) ကိုတော့ backend အတိုင်း ပို့စေသည်။
        rewrite: (path) => (path === '/api' ? '/reqapi' : path),
      },
    },
  },
})
