import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  server: {
    port: process.env.DEV_SERVER_PORT || 5173
  }
});
