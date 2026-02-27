import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@videosdk.live/react-sdk': fileURLToPath(
        new URL('./node_modules/@videosdk.live/react-sdk/dist/index.js', import.meta.url)
      ),
      events: fileURLToPath(new URL('./node_modules/events/events.js', import.meta.url)),
      'events/events': fileURLToPath(new URL('./node_modules/events/events.js', import.meta.url)),
      'events/events.js': fileURLToPath(new URL('./node_modules/events/events.js', import.meta.url)),
    },
  },
})
