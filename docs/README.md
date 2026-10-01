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

The script signs up a fresh account in the local Firebase Auth emulator and
imports the bundled example screener through the same account hook the app runs
at sign-up. Every screenshot shows that example, so the guides match what new
users see in their own accounts. The script only uses localhost services and
the `demo-bdt-dev` emulator project; it does not reset other accounts or export
emulator data.

To refresh one guide's screenshots, name it:
`npm run capture-docs-screenshots -- screeners` or
`npm run capture-docs-screenshots -- custom-checks`. Each guide's flow lives in
`e2e/docs-screenshots/`, with the shared account, sign-in, and saving in
`session.mjs`.

The screener guide flow answers the example's "Only Philly Cash passes"
scenario in Preview and on the published screener, and waits for the expected
results before saving. The custom checks flow walks through the example's
Household income limit check: its parameter, DMN model, test results, and
published version. It shows the Create New Check dialog without creating a
check. Screens use compact viewports, 2× pixel density, and focused panel
captures. The script prints the new local account's email; its local-only
password is `local-docs-screenshot-account`. The account remains in the running
emulator for inspection.

The flows find elements by the example's names and question labels. After
changing the example screener (see the developer guide on editing it), update
the names at the top of each flow file, recapture, and update any guide text
that describes the example.

Review every generated image before committing it, then build and view the docs
homepage and guides. Keep the homepage screenshot at its native aspect ratio: a
square hero crop can remove the form content.
