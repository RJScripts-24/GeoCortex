
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network addresses
    port: 5173,      // Ensure this matches the port you usually use
    hmr: {
      clientPort: 443, // Force the client to connect via the proxy's HTTPS port
    },
    // Allow connections from the cloud workstation's proxy
    allowedHosts: true,
  },
})
