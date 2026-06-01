import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/assets/text/projects",
  }),
});

const team = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/assets/text/team-info",
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      link: z.string(),
      photo: image(),
      photoAlt: z.string(),
    }),
});

export const collections = { projects, team };
