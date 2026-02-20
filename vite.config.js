import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import fs from 'fs'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load .env from root directory (one level up)
  const rootEnvPath = path.resolve(__dirname, '../.env')
  let rootEnv = {}
  
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && key.startsWith('VITE_')) {
        rootEnv[key] = valueParts.join('=').trim()
      }
    })
  }

  return {
    logLevel: 'error', // Suppress warnings, only show errors
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Kawa Note',
          short_name: 'Kawa',
          description: 'Secure note-taking application with end-to-end encryption',
          theme_color: '#0f766e',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-540.png',
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow'
            },
            {
              src: '/screenshot-1280.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          globIgnores: ['**/node_modules/**/*', './**/*.map'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /^\/api\/.*/,
              handler: 'NetworkOnly',
              options: {
                cacheName: 'api-cache'
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify(rootEnv.VITE_APP_NAME || 'KawaMyCenter'),
      'import.meta.env.VITE_KAWA_APP_ID': JSON.stringify(rootEnv.VITE_KAWA_APP_ID || 'test-app'),
      'import.meta.env.VITE_KAWA_FUNCTIONS_VERSION': JSON.stringify(rootEnv.VITE_KAWA_FUNCTIONS_VERSION || 'v1'),
      'import.meta.env.VITE_KAWA_APP_BASE_URL': JSON.stringify(rootEnv.VITE_KAWA_APP_BASE_URL || 'http://localhost:3116'),
    },
    server: {
      port: 3116,
      proxy: {
        '/api': {
          target: 'http://localhost:3115',
          changeOrigin: true,
        },
      },
    },
  };
});