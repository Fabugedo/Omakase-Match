import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When running behind the NGINX proxy in Docker Compose, the HMR websocket must
// be told the externally reachable port (8080). Plain `npm run dev` leaves this
// unset and uses Vite's defaults.
const hmrClientPort = process.env.VITE_HMR_CLIENT_PORT
  ? Number(process.env.VITE_HMR_CLIENT_PORT)
  : undefined;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
  },
});
