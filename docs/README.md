# BDT Docs

The documentation site is built with Astro and Starlight.

## Setup

```bash
cd docs
npm ci
npm run dev
```

Before opening a pull request, build the site locally:

```bash
npm run build
```

## Docs Pages

Each page in the docs is a Markdown file under `src/content/docs/`.

To edit a docs page, simply edit the markdown file.

To add a page, put it in the appropriate directory (`user/` for user-facing
pages or `dev/` for developer-facing pages). The file must include
[frontmatter](https://docs.astro.build/en/guides/markdown-content/#frontmatter-layout)
with `title` and `description` fields. Add the page to the sidebar in
`astro.config.mjs`.

## Documentation audit checklist

Use this checklist for a periodic AI-assisted audit and when a pull request
changes user-visible behavior:

1. Inventory `README.md` files and pages under `docs/src/content/docs/`.
2. Compare UI labels and workflows with `builder-frontend/src/` and its tests.
3. Compare commands, ports, versions, and API examples with build files,
   configuration, scripts, and CI workflows.
4. Check internal links and confirm that screenshots still show the workflow
   described by the surrounding text.
5. For every proposed correction, cite the documentation location and the
   source or test that proves it is stale. Do not change claims that cannot be
   verified.
6. Apply high-confidence corrections directly. Record uncertain or larger
   follow-up work as issues rather than guessing.
7. Run `npm run build` from `docs/` and report any checks that could not run.

A useful AI prompt is: “Audit the maintained documentation in this repository
against the current implementation and tests. Report only evidence-backed
discrepancies with file locations, then propose scoped corrections. Treat the
application source, tests, build configuration, and CI workflows as the source
of truth.” Human review remains required, especially for product language and
screenshots.

### Refreshing UI screenshots

Start the local development stack, then run:

```bash
cd e2e
npm ci
npm run capture-docs-screenshots
```

The script creates a fresh account directly in the local Firebase Auth emulator,
without importing the bundled example. It seeds a Philadelphia Homeowner Support
screener with two illustrative programs, a two-question form, a second draft
screener, and custom-check drafts with meaningful parameter definitions. It only
uses localhost services and the `demo-bdt-dev` emulator project; it does not reset
other accounts or export emulator data.

All guide screenshots are captured from these examples, including benefit
configuration, form editing and validation, preview results, publishing, and custom
checks. Screens use compact viewports, 2× pixel density, and focused panel captures.
The script waits for visible questions and successful eligibility results before
saving the public form. It prints the new local account's email; its local-only
password is `local-docs-screenshot-account`. The account remains in the running
emulator for inspection.

Review every generated image before committing it, then build and view the docs
homepage and guide. Keep the homepage screenshot at its native aspect ratio: a
square hero crop can remove the form content. The custom checks are unpublished
drafts demonstrating parameter configuration, not completed eligibility rules.
