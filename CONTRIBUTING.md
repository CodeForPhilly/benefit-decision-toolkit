# Contributing to Benefit Decision Toolkit

Thank you for your interest in contributing! BDT is a volunteer-driven open source project run by [Code for Philly](https://codeforphilly.org/projects/dmn_benefit_toolbox-including_the_philly_property_tax_relief_screener). We welcome contributions of all kinds — code, documentation, bug reports, design feedback, and DMN eligibility rules.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Project Structure](#project-structure)
- [Development Environment Setup](#development-environment-setup)
- [Running the Project](#running-the-project)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Working with DMN Files](#working-with-dmn-files)
- [Deployment (Maintainers)](#deployment-maintainers)
- [Getting Help](#getting-help)

---

## Ways to Contribute

- **Bug reports**: Open a GitHub issue with steps to reproduce
- **Feature requests**: Open a GitHub issue describing the use case
- **Code**: Fix bugs, implement features, improve tests
- **Documentation**: Improve guides, fix typos, add examples
- **DMN rules**: Add or improve eligibility rules in `library-api`
- **Testing PRs**: Review and test open pull requests — see the [Codespaces Testing Guide](docs/testing-prs-with-codespaces.md) (no local setup needed!)

---

## Project Structure

This is a monorepo with four distinct applications:

```
benefit-decision-toolkit/
├── library-api/          # Quarkus + Kogito: DMN files → REST APIs (Java 17)
├── builder-api/          # Quarkus: Admin backend, Firebase integration (Java 21)
├── builder-frontend/     # Solid.js: Admin UI + public screener interface
├── website/              # Public project website
├── docs/                 # User and developer documentation
├── e2e/                  # Playwright end-to-end tests
├── bin/                  # Developer helper scripts
├── .github/              # GitHub Actions workflows
├── devbox.json           # Development environment declaration (Nix)
└── process-compose.yml   # Multi-service orchestration for local dev
```

**Important**: `library-api` targets **Java 17 bytecode + Quarkus 2.16.10** (required for Kogito), while `builder-api` uses **Java 21 + Quarkus 3.23.0**. Devbox provides JDK 21 for both — Maven compiles `library-api` with `--release 17` automatically.

---

## Development Environment Setup

See the [README](README.md#development-setup) for full setup instructions covering Codespaces, Devbox, Devcontainer, and DIY options.

---

## Running the Project

### Start All Services

```bash
# Starts all 5 services in the correct dependency order
devbox services up
```

This orchestrates (in order):
1. **Firebase Emulators** — Auth (9099), Firestore (8080), Storage (9199), UI (4000)
2. **library-api** — REST API from DMN files at http://localhost:8083
3. **sync-library-metadata** — Syncs library check metadata to Firebase emulators
4. **builder-api** — Admin API (port configured via `QUARKUS_HTTP_PORT`)
5. **builder-frontend** — Vite dev server at http://localhost:5173

> **Do not start services out of order.** `builder-api` depends on Firebase emulators being fully ready, and the metadata sync step must complete before `builder-api` starts.

### Running Individual Services

If you're only working on one part of the stack:

```bash
# library-api only (no Firebase dependency)
cd library-api && quarkus dev
# Swagger UI: http://localhost:8083/q/swagger-ui

# Firebase emulators (required before builder-api)
firebase emulators:start --project demo-bdt-dev --only auth,firestore,storage

# builder-api (after emulators are running)
cd builder-api && quarkus dev

# builder-frontend (after builder-api is running)
cd builder-frontend && npm run dev
```

### Service URLs

| Service | URL |
|---|---|
| builder-frontend | http://localhost:5173 |
| builder-api | http://localhost:8081 |
| library-api | http://localhost:8083 |
| library-api Swagger UI | http://localhost:8083/q/swagger-ui |
| Firebase Emulator UI | http://localhost:4000 |

---

## Making Changes

### Branching

Create a feature branch from `main`:

```bash
git checkout main
git pull
git checkout -b your-feature-name
```

Use descriptive branch names, e.g. `fix-dmn-evaluation-edge-case` or `add-snap-eligibility-check`.

### Commits

Write clear, descriptive commit messages. Focus on *what* changed and *why*:

```
# Good
fix: handle null income value in eligibility check

# Good
feat: add SNAP benefit eligibility check for Philadelphia

# Avoid
fix stuff
update
```

### Syncing Library Metadata After library-api Changes

If you modify DMN files in `library-api`, re-sync metadata so `builder-api` picks up the changes:

```bash
# Re-sync metadata
./bin/library/sync-metadata

# Then restart builder-api (in the process-compose UI, restart the process)
```

---

## Testing

### Java Unit Tests

```bash
# builder-api
cd builder-api && mvn test

# library-api
cd library-api && mvn test
```

These run automatically in CI on every push and pull request that touches `builder-api/` or `library-api/`.

### Bruno API Tests (library-api)

[Bruno](https://www.usebruno.com/) is used to test the DMN-generated REST endpoints in `library-api`. The test suite lives in `library-api/test/bdt/` and mirrors the DMN file structure.

```bash
# Run all Bruno tests
cd library-api/test/bdt && bru run
```

**When adding a new benefit or check to `library-api`, add Bruno tests first** (test-driven development). Bruno tests validate DMN logic, while Java tests validate internal application behavior.

### End-to-End Tests (Playwright)

```bash
# Run e2e tests (requires all services to be running)
cd e2e && npx playwright test
```

E2E tests run automatically in CI. They start all services via `devbox services up` and run against them.

### Before Submitting a PR

- [ ] Run Java unit tests for any service you modified
- [ ] Run Bruno tests if you modified `library-api` DMN files
- [ ] Verify your changes work end-to-end with all services running
- [ ] Run Prettier on changed frontend files (see [Code Style](#code-style))

---

## Code Style

### JavaScript / TypeScript (builder-frontend)

The project uses [Prettier](https://prettier.io/) for formatting. Configuration is in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "tabWidth": 2
}
```

Format changed files before committing:

```bash
# Format a specific file
npx prettier --write path/to/file.tsx

# Format all frontend files
cd builder-frontend && npx prettier --write "src/**/*.{ts,tsx,js,jsx}"
```

### Java (builder-api, library-api)

Follow standard Java conventions. There is no automated style enforcement beyond what Maven provides, so match the style of the surrounding code.

### DMN Files

- File names: `kebab-case.dmn`
- Decision Service names: `{ModelName}Service` (e.g., a file named `snap-benefit.dmn` → Decision Service named `SnapBenefitService`)
- Model names must be **globally unique** across the entire `library-api` — check existing names before adding a new DMN file
- Imported decision services cannot share names even if in different models

---

## Submitting a Pull Request

1. Push your branch and open a PR against `main`
2. Write a clear PR description: what changed, why, and how to test it
3. All PRs require review from at least one maintainer (@Michael-Dratch or @prestoncabe — see [CODEOWNERS](.github/CODEOWNERS))
4. CI runs API unit tests and E2E tests automatically — check that they pass
5. For changes to `library-api` DMN files, include Bruno test results or a description of manual testing

**For non-technical contributors** testing a PR: follow the [Codespaces Testing Guide](docs/testing-prs-with-codespaces.md) — no local setup needed.

---

## Working with DMN Files

DMN (Decision Model and Notation) is the core of this project. If you're new to DMN, start here:
- [Learn DMN in 15 minutes](https://learn-dmn-in-15-minutes.com/)
- [DMN Editor for VS Code](https://marketplace.visualstudio.com/items?itemName=kie-group.dmn-vscode-extension) (strongly recommended)

### Adding a Benefit to library-api

Benefits represent specific programs (e.g., SNAP, property tax relief). They define eligibility logic using DMN and automatically become REST endpoints.

1. **Write Bruno tests first** in `library-api/test/bdt/benefits/{jurisdiction}/{benefit-name}/`
2. Create a DMN file: `library-api/src/main/resources/benefits/{jurisdiction}/{benefit-name}.dmn`
3. Define a Decision Service named `{BenefitName}Service`
4. Include a `checks` context and an `isEligible` boolean decision
5. Save — Quarkus dev mode hot-reloads and the endpoint appears at `POST /api/v1/benefits/{jurisdiction}/{benefit-name}`
6. Verify in Swagger UI: http://localhost:8083/q/swagger-ui
7. Run your Bruno tests: `cd library-api/test/bdt && bru run`

### Adding a Reusable Check

Checks are reusable decision logic that can be shared across multiple benefits.

1. Create a DMN file: `library-api/src/main/resources/checks/{category}/{check-name}.dmn`
2. Define a Decision Service named `{CheckName}Service`
3. Standard inputs: `situation` (tSituation type), `parameters` (check-specific context)
4. Standard output: `result` (boolean)
5. Endpoint: `POST /api/v1/checks/{category}/{check-name}`

### Key DMN Constraints

- **Decision Service name must be `{ModelName}Service`** — this is required for automatic endpoint generation
- **Model names are globally unique** — if two DMN files have the same model name, things break
- Imported decision services cannot share names even across different files
- Import `BDT.dmn` for shared types like `tSituation`

### Editing DMN Files

- Use the VS Code DMN Editor extension for visual editing
- To see raw XML: right-click the file → "Reopen with Text Editor"
- Changes are hot-reloaded in `quarkus dev` mode — no restart needed

---

## Deployment (Maintainers)

### library-api

Deployments are triggered by pushing a git tag matching `library-api-v*`. Use the provided script to create a release atomically:

```bash
cd library-api

# Update pom.xml version and create git tag in one step
./bin/tag-release 0.3.0

# Review the changes
git show

# Push the commit and the tag (triggers GitHub Actions deployment)
git push origin <your-branch>
git push origin library-api-v0.3.0
```

The GitHub Actions workflow validates that the tag version matches `pom.xml`, builds the Docker image, pushes to Google Artifact Registry, deploys to Cloud Run, and syncs library metadata automatically.

**Version source of truth**: `pom.xml`. The git tag, Docker image tag, and Cloud Run revision name all derive from it.

### builder-api

Deploys automatically to Cloud Run on every push to `main` that touches `builder-api/` files. No manual versioning needed.

### builder-frontend and docs

Deploy automatically to Firebase Hosting on push to `main`.

### Production Library Metadata Sync (Manual)

If you need to sync library metadata to production outside of a `library-api` deployment:

```bash
export LIBRARY_API_BASE_URL=https://library-api-1034049717668.us-central1.run.app
unset FIRESTORE_EMULATOR_HOST
unset GCS_BUCKET_NAME
unset QUARKUS_GOOGLE_CLOUD_STORAGE_HOST_OVERRIDE
gcloud auth application-default login
./bin/library/sync-metadata
```

---

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Code for Philly**: Join [codeforphilly.org](https://codeforphilly.org) to connect with the team
- **Project maintainers**: @Michael-Dratch and @prestoncabe

If you're stuck on setup, open an issue — improving the onboarding experience is itself a valuable contribution.
