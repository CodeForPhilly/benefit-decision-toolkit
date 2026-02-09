import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), solid(), tsconfigPaths()],
  server: {
    port: process.env.DEV_SERVER_PORT || 5173,
  },
});
