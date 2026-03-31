# BDT Docs

How to contribute to the docs

## Setup

`cd docs/`

`npm install`

`npm run dev`

## Docs Pages

Each page in the docs is a markdown file located at content/docs/...

To edit a docs page, simply edit the markdown file.

To add a docs page, add a markdown file in the appropriate directory (`user/` for user-facing pages or `dev/` for developer-facing pages). The file must include [frontmatter](https://www.markdownlang.com/advanced/frontmatter.html) with `title` and `description` fields. In `astro.config.mjs`, add an item to the sidebar in the appropriate location to add your page to the sidebar.
