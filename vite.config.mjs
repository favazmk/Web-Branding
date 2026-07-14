import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'web-development-services': resolve(__dirname, 'web-development-services.html'),
        marketing: resolve(__dirname, 'digital-marketing.html'),
        wip: resolve(__dirname, 'work-in-progress.html'),
        campaign: resolve(__dirname, 'campaign.html'),
      },
    },
  },
})
