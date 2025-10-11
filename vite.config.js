import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteBasicSslPlugin from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/hualien-bees/' : '/',
  plugins: [vue()],
  // plugins: [vue(), viteBasicSslPlugin()],

  server: {
    // https: true,
    // proxy: {
    //   '/api': {
    //     target: 'https://uat-api.gf250923.org',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // }
  }
})
