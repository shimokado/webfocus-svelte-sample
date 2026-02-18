import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: './',
  plugins: [svelte()],
  server: {
    port: 5173,
    proxy: {
      '/ibi_apps': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
