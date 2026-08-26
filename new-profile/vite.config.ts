import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Project Pages URL is https://a-m-i-t.github.io/profile/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/profile/' : '/',
  plugins: [react(), tailwindcss()],
})
