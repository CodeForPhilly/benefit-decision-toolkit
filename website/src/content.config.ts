import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/projects",
  }),
  schema: ({ image }) =>
    z.object({
      index: z.number(),
      image: image(),
      imageAlt: z.string(),
    }),
});

const members = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/members",
  }),
  schema: ({ image }) =>
    z.object({
      index: z.number(),
      image: image(),
      imageAlt: z.string(),
    }),
});

export const collections = { projects, members };
