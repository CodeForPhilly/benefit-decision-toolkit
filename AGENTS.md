# Benefit Decision Toolkit

This is a monorepo for building and publishing benefit eligibility screeners. Keep this file small: use the nearest nested `AGENTS.md` for component-specific guidance and load a skill only when its description matches the task.

## Repository map

- `library-api/`: Java 21 / Quarkus / Kogito service that turns DMN files into REST endpoints. Read `library-api/AGENTS.md` before changing this subtree.
- `builder-api/`: Java 21 / Quarkus administration API backed by Firebase.
- `builder-frontend/`: Solid.js and Vite screener editor. Read `builder-frontend/README.md` before changing its form-js extensions or tests that render a form.
- `e2e/`: Playwright end-to-end tests.
- `docs/` and `website/`: Astro sites.

## Setup and common commands

- Preferred one-time setup: `bin/install-devbox && devbox run setup`
- In worktrees, agents may create the ignored root `.env` from `.env.example` when needed to run Devbox commands. The preferred setup command above does this automatically.
- Start the development stack: `devbox services up`
- All tests: `devbox run test` (wrapper: `bin/run-all-tests`; accepts `--fail-fast` and suite names, e.g. `devbox run test -- builder-frontend`; suites are `builder-frontend`, `builder-api`, `library-api`, `examples`, `e2e`)

Project tools (`mvn`, `npm`, `bru`) come from Devbox and are not on `PATH`. Run the commands below inside `devbox shell`, or wrap one as `devbox run -- bash -c "<command>"`; `devbox run` starts at the repository root.

- Backend tests: `(cd builder-api && mvn test)`
- Library tests: `(cd library-api && mvn test)`; DMN API tests require a running library service, then `(cd library-api/test/bdt && bru run)`. To run one folder, pass `-r` (`bru run checks/age -r`); without it, Bruno skips nested folders and still reports success.
- Frontend tests: `(cd builder-frontend && npm test)`; frontend build: `(cd builder-frontend && npm run build)`
- End-to-end tests: `bin/run-e2e-tests [spec ...]`, e.g. `bin/run-e2e-tests tests/screener.spec.ts` (paths relative to `e2e/`). It boots the whole local stack and refuses to start while its ports are in use.
- Docs/website build: run `npm run build` in the relevant directory.

Run the narrowest checks that cover a change. Do not claim a check passed unless it was run; report environmental blockers separately from code failures.

## Working conventions

- Java APIs share Maven `groupId` `org.codeforphilly.bdt`, with artifact IDs `bdt-builder-api` and `bdt-library-api`. Use lowercase Java packages under `org.codeforphilly.bdt.builder` and `org.codeforphilly.bdt.library`, respectively; source and test directories must match their package names.
- Never edit generated output under `target/`, `dist/`, Playwright reports, emulator exports, logs, or dependency directories unless the user explicitly asks.
- Treat `.env` files, credentials, Firebase data, and production deployment commands as sensitive. Use checked-in examples for documentation and do not expose secrets.
- Do not deploy, publish, modify production Firebase state, or export emulator state without explicit authorization.

## On-demand workflows

Repository skills are stored in `.agents/skills/` using the portable Agent Skills format. Read a skill's `SKILL.md` only when the request matches its description:

- `new-dmn-benefit`: create a benefit DMN and its Bruno tests.
- `new-dmn-check`: create a reusable check DMN and its Bruno tests.

Claude compatibility is provided through the `.claude/skills` symlink to `.agents/skills`.

## Agent skills

### Issue tracker

Track issues and specs in GitHub Issues. Read `docs/agents/issue-tracker.md` before tracker operations.

### Triage labels

Use the five default triage labels. Read `docs/agents/triage-labels.md` when assigning triage roles.

### Domain docs

Use a single-context layout. Read `docs/agents/domain.md` before exploring domain concepts or architectural decisions.
