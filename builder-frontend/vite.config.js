import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [solid(), tsconfigPaths()],
  server: {
    port: process.env.DEV_SERVER_PORT || 5173
  },
  optimizeDeps: {
    // Ensure Preact is not pre-bundled separately, avoiding duplicate instances
    include: ['preact', 'preact/hooks', 'preact/compat']
  },
  resolve: {
    dedupe: ['preact', 'preact/hooks', 'preact/compat']
  }
});
