import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '#app': resolve(__dirname, './node_modules/nuxt/dist/app'),
    },
  },
})
