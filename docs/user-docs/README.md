# BDT User Docs

Documentation for the Benefit Decision Toolkit is built with [MkDocs](https://www.mkdocs.org/) using the [Material theme](https://squidfunk.github.io/mkdocs-material/).

The live site is published at [https://bdt-docs.web.app](https://bdt-docs.web.app).

## Editing the Docs

All documentation is written in Markdown. The source files are in the `docs/` directory:

```
docs/user-docs/
├── docs/
│   ├── index.md          # Introduction
│   ├── user-guide.md     # Building a Screener
│   └── custom-checks.md  # Custom Eligibility Checks
└── mkdocs.yml            # Site configuration and navigation
```

To add or update content, edit the relevant `.md` file directly. To add a new page, create a new `.md` file in the `docs/` directory and add an entry for it in `mkdocs.yml` under `nav`.

For a reference on Markdown syntax, see the [Markdown Guide](https://www.markdownguide.org/basic-syntax/).

## Running Locally

To preview the site while editing, you can run MkDocs locally.

**1. Install dependencies**

Requires Python 3. From the `docs/user-docs/` directory:

```bash
pip install -r requirements.txt
```

**2. Start the local dev server**

```bash
mkdocs serve
```

The site will be available at `http://127.0.0.1:8000`. The server watches for file changes and reloads automatically, so edits to any `.md` file are reflected immediately in the browser.

## Deployment

The docs are deployed automatically. When a pull request is merged into `main` with changes to files under `docs/user-docs/`, a GitHub Actions workflow builds the MkDocs site and deploys it to Firebase Hosting. No manual deployment steps are needed.
