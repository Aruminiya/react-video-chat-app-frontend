import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: true,
    host: '0.0.0.0',
    port: 5200,
  },
  plugins: [mkcert()]
})