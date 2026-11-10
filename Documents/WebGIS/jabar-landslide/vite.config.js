import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' → hasil build bisa di-host di subfolder (mis. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
})
