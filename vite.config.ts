
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [react()],
    base: command === 'serve' ? '/' : './', // Absolute path for dev, relative for build
    server: {
        host: '0.0.0.0',
        port: 5175,
        strictPort: true,
        cors: true,
        // Removed restrictive origin to allow Electron to connect freely
        watch: {
            ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
        }
    }
}))
