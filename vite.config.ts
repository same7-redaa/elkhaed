import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'logo_icon.png', 'logo_full.png'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'ELKHALED',
        short_name: 'ELKHALED',
        description: 'ELKHALED POS System',
        theme_color: '#3054ff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'landscape',
        icons: [
          {
            src: 'logo_icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
