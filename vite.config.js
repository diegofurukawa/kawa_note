import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import fs from 'fs'

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