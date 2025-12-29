import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lupora-web-experience/',
  plugins: [react()],
  optimizeDeps: {
    include: [
      'three', 
      '@react-three/fiber', 
      '@react-three/drei', 
      'use-sync-external-store/shim/with-selector'
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})