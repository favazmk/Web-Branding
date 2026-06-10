import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        campaign: resolve(__dirname, 'campaign.html'),
        marketing: resolve(__dirname, 'digital-marketing.html'),
      },
    },
  },
})
