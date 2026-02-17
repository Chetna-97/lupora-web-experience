import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lupora-web-experience/',
  plugins: [react()],
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
