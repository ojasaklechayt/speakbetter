import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'index.html'),
        micPermission: resolve(__dirname, 'mic-permission.html'),
        background: resolve(__dirname, 'src/background/url-worker.ts'),
        meetObserver: resolve(__dirname, 'src/content/meet-observer.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') {
            return 'background.js'
          }

          if (chunk.name === 'meetObserver') {
            return 'meet-observer.js'
          }

          if (chunk.name === 'micPermission') {
            return 'mic-permission.js'
          }

          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
