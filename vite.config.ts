import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // SỬA LỖI: Trỏ đúng vào thư mục services/electron
        entry: 'services/electron/main.ts',
      },
      preload: {
        // SỬA LỖI: Trỏ đúng vào thư mục services/electron
        input: 'services/electron/preload.ts',
      },
      // Polyfill cho Electron và Node.js trong Renderer process
      renderer: {},
    }),
  ],
})