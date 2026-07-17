import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'TinyWins',
        short_name: 'TinyWins',
        description: 'Grow quietly, consistently, and kindly — with grace.',
        theme_color: '#ff7a60',
        background_color: '#fcfaf2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Do NOT cache any Supabase auth or REST data requests (always go to Network)
            urlPattern: ({ url }) => url.href.includes('supabase.co'),
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ]
})
