import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

import { buildCatalog, SNAPSHOT_PATH } from "./library/catalog.mjs";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  // Benefit and eligibility check references, from the library-api OpenAPI snapshot.
  library: defineCollection({
    loader: {
      name: "library-openapi-snapshot",
      load: async ({ store, parseData, watcher }) => {
        store.clear();
        for (const entry of buildCatalog()) {
          store.set({ id: entry.id, data: await parseData({ id: entry.id, data: entry }) });
        }
        watcher?.add(SNAPSHOT_PATH);
      },
    },
  }),
};
