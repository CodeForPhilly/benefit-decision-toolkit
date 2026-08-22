# Benefit Decision Toolkit

This is a monorepo for building and publishing benefit eligibility screeners. Keep this file small: use the nearest nested `AGENTS.md` for component-specific guidance and load a skill only when its description matches the task.

## Repository map

- `library-api/`: Java 17 / Quarkus / Kogito service that turns DMN files into REST endpoints. Read `library-api/AGENTS.md` before changing this subtree.
- `builder-api/`: Java 21 / Quarkus administration API backed by Firebase.
- `builder-frontend/`: Solid.js and Vite screener editor.
- `e2e/`: Playwright end-to-end tests.
- `docs/` and `website/`: Astro sites.

## Setup and common commands

- Preferred one-time setup: `bin/install-devbox && devbox run setup`
- Start the development stack: `devbox services up`
- All tests: `devbox run test` (wrapper: `bin/run-all-tests`; accepts `--fail-fast` and suite names `builder-api`, `library-api`, `e2e`)
- Backend tests: `(cd builder-api && mvn test)`
- Library tests: `(cd library-api && mvn test)`; DMN API tests require a running library service, then `(cd library-api/test/bdt && bru run)`
- Frontend build: `(cd builder-frontend && npm run build)`
- End-to-end tests: `bin/run-e2e-tests`
- Docs/website build: run `npm run build` in the relevant directory.

Run the narrowest checks that cover a change. Do not claim a check passed unless it was run; report environmental blockers separately from code failures.

## Working conventions

- Preserve unrelated work in the working tree and keep changes scoped to the request.
- Follow existing patterns in the component being edited; consult its README and build configuration rather than guessing versions or commands.
- Never edit generated output under `target/`, `dist/`, Playwright reports, emulator exports, logs, or dependency directories unless the user explicitly asks.
- Treat `.env` files, credentials, Firebase data, and production deployment commands as sensitive. Use checked-in examples for documentation and do not expose secrets.
- Do not deploy, publish, modify production Firebase state, or export emulator state without explicit authorization.

## On-demand workflows

Repository skills are stored in `.agents/skills/` using the portable Agent Skills format. Read a skill's `SKILL.md` only when the request matches its description:

- `new-dmn-benefit`: create a benefit DMN and its Bruno tests.
- `new-dmn-check`: create a reusable check DMN and its Bruno tests.

Claude compatibility is provided through the `.claude/skills` symlink to `.agents/skills`.
