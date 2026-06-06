/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true, // Docker コンテナ内でのファイル変更検知用
    },
    // ───────────────────────────────────────────────
    // 【先輩への受け渡しメモ】
    // バックエンド(FastAPI, :8000)への接続はここで proxy を張ると
    // CORS を避けられます。接続担当の方が必要に応じて有効化してください。
    proxy: {
      '/api': { target: 'http://backend:8000', changeOrigin: true },
    },
    // ───────────────────────────────────────────────
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
