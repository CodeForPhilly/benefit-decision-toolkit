import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [solid(), tsconfigPaths()],
  server: {
    port: process.env.DEV_SERVER_PORT || 5173,
    proxy: {
      '/identitytoolkit.googleapis.com': {
        target: 'http://localhost:9099',
      },
      '/securetoken.googleapis.com': {
        target: 'http://localhost:9099',
      },
      '/emulator': {
        target: 'http://localhost:9099',
      },
      '/__/auth': {
        target: 'http://localhost:9099',
      },
      '/api': {
        target: 'http://localhost:8081',
      },
    },
  }
});
