import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { Buffer } from 'buffer'

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'buffer': 'buffer/',
    },
  },
  define: {
    'globalThis.Buffer': Buffer,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('wagmi') || id.includes('@wagmi') || id.includes('@rainbow-me/rainbowkit')) {
              return 'vendor-web3';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query';
            }
          }
        },
      },
    },
  },
}) 