import { defineConfig, loadEnv } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load variables from .env before vite.config.js finishes running
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [solid(), tsconfigPaths()],
    server: {
      port: env.DEV_SERVER_PORT || 5173,
      // Proxy to connect to backend
      // https://vite.dev/config/server-options#server-proxy
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:8081",
        },
      },
    },
  };
});
