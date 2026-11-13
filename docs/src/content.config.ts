import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

import { snapshotLoader } from "./library/snapshot-loader.mjs";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  // Benefit and eligibility check references, from the library-api OpenAPI snapshot.
  library: defineCollection({
    loader: snapshotLoader(),
  }),
};
