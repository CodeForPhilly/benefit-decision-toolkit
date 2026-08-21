// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  site: "https://bdtoolkit.org",
  integrations: [svelte()],
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Lato",
      cssVariable: "--font-lato",
    },
    {
      provider: fontProviders.fontsource(),
      name: "Crete Round",
      cssVariable: "--font-crete-round",
    },
  ],
});
