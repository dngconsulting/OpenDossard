import * as path from 'node:path';
import { readFileSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const appVersion = process.env.VITE_APP_VERSION || packageJson.version;

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'logood.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'OpenDossard',
        short_name: 'OpenDossard',
        description: 'Gestion des courses cyclistes',
        theme_color: '#0f172a',
        background_color: '#1e2d4b',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        // Paths qui DOIVENT atteindre le réseau (backend NestJS via nginx) au
        // lieu d'être renvoyés vers `index.html` par le SW :
        //  - `/api/*`        : routes API (dont `/api/v2/helloasso/oauth/callback`)
        //  - `/app/*`        : deeplinks Universal Links (épreuve / classement / palmarès)
        //  - `/payment/*`    : retour HelloAsso post-paiement
        //  - `/.well-known/*`: AASA, assetlinks.json
        // Sans ça, le SW intercepte ces navigations et sert la SPA, qui
        // affiche un 404 stylisé (cf. bug observé sur le callback OAuth).
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/app\//,
          /^\/payment\//,
          /^\/\.well-known\//,
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
