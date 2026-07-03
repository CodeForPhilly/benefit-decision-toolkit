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
      link: z.nullable(z.string()),
      photo: image(),
      photoAlt: z.string(),
    }),
});

const roles = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/assets/text/volunteer-roles",
  }),
  schema: z.object({
    title: z.string(),
    brief: z.string(),
  }),
});

export const collections = { projects, team, roles };
