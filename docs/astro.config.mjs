// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "BDT Docs",
      description:
        "User guide for the Benefit Decision Toolkit screener builder app",
      sidebar: [
        { label: "Introduction", slug: "intro" },
        { label: "User Guide", slug: "user-guide" },
        { label: "Custom Checks", slug: "custom-checks" },
      ],
    }),
  ],
});
