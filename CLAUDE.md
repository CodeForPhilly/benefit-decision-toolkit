# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Benefit Decision Toolkit (BDT) is a platform for creating benefit eligibility screeners using Decision Model and Notation (DMN) and Form-JS. The project consists of four main applications:

- **library-api**: Standalone Quarkus API that generates REST endpoints from DMN files (Kogito-based)
- **builder-api + builder-frontend**: Web application for creating and managing screeners (admin tool)
- **screener-api + screener-frontend**: Public-facing screener evaluation interface (end-user tool)

The core concept: Subject matter experts can define eligibility rules using visual DMN decision tables, which automatically become REST APIs and interactive screeners without traditional software development.

## Common Commands

### Development Setup

```bash
# One-time setup with Devbox (recommended)
bin/install-devbox && devbox run setup

# Or without Devbox (requires manual dependency installation)
bin/setup
```

### Running Services

```bash
# Start all services in development mode (uses process-compose)
devbox services up

# Or manually with process-compose (if not using devbox)
process-compose

# Run library-api standalone
cd library-api && quarkus dev
# Serves at http://localhost:8083, Swagger UI at /q/swagger-ui

# Run builder services (requires Firebase emulators)
# Terminal 1: Start Firebase emulators
firebase emulators:start --project demo-bdt-dev --only auth,firestore,storage

# Terminal 2: Start builder-api
cd builder-api && quarkus dev
# Debug port: 5005

# Terminal 3: Start builder-frontend
cd builder-frontend && npm run dev
```

### Building

```bash
# Build specific API
cd builder-api && mvn clean package
cd screener-api && mvn clean package
cd library-api && mvn clean package

# Build frontend
cd builder-frontend && npm run build
cd screener-frontend && npm run build

# Clean rebuild (useful when DMN files change)
mvn clean compile
```

### Testing

```bash
# Run Java tests for an API
cd builder-api && mvn test
cd screener-api && mvn test

# Run library-api tests with Bruno (API testing tool)
cd library-api/test/bdt && bru run

# Frontend doesn't have test suites currently
```

## High-Level Architecture

### Multi-Application Structure

This is a monorepo containing four distinct applications that work together:

1. **library-api** (Kogito-based DMN → REST API generator)
   - Standalone Quarkus app using Kogito for automatic API generation
   - DMN files in `src/main/resources/` become REST endpoints
   - See `library-api/CLAUDE.md` for detailed documentation

2. **builder-api** (Quarkus REST API, ~3,300 LOC)
   - Admin backend for screener creation and management
   - Integrates Firebase (Auth, Firestore, Cloud Storage)
   - Uses KIE DMN (not Kogito) for manual DMN compilation and evaluation
   - Main packages: `controller`, `service`, `persistence`, `model`

3. **builder-frontend** (Solid.js, Form-JS Editor, DMN-JS)
   - Visual editor for creating benefit screeners
   - Features: Form editor, DMN decision editor, benefit configuration, preview, publish
   - Routes: `/` (home), `/project/:id` (editor), `/check/:id` (DMN editor)

4. **screener-api** (Lightweight Quarkus REST API, ~750 LOC)
   - Read-only runtime for serving published screeners
   - Executes pre-compiled DMN decisions against user input
   - Two endpoints: GET screener schema, POST evaluate decisions

5. **screener-frontend** (Solid.js, Form-JS Viewer)
   - Public-facing screener with real-time eligibility evaluation
   - Debounced auto-submission as user fills form
   - Displays nested results (benefits → eligibility checks)

### Data Flow Architecture

```
Builder Flow:
Admin → builder-frontend → builder-api → Firebase (Firestore + Storage)
                                      ↓
                            Compile DMN → Store compiled JAR
                                      ↓
                                Publish screener

Screener Flow:
User → screener-frontend → screener-api → Firestore (read metadata)
                                       → Cloud Storage (read form schema + DMN JAR)
                                       → KIE Runtime (evaluate DMN)
                                       → Return results
```

### Key Architectural Patterns

**Separation of Concerns**:
- **Eligibility Checks**: Reusable DMN models (independent decision logic)
- **Benefits**: Configurations that reference one or more eligibility checks
- **Forms**: Separate schemas defining user input fields
- **Screeners**: Containers that combine forms + benefits + checks

**DMN Processing Differences**:
- **library-api**: Uses Kogito (automatic code generation at build time)
- **builder-api**: Uses KIE DMN directly (runtime compilation from XML)
- **screener-api**: Uses KIE DMN (loads pre-compiled JAR artifacts)

**Storage Strategy**:
- **Metadata** (relationships, configs): Firestore NoSQL collections
- **Large artifacts** (DMN files, form schemas, compiled JARs): Google Cloud Storage
- **Reference data** (location lookups): Embedded SQLite databases

**Authentication**:
- **builder-api/builder-frontend**: Firebase Auth required (user ownership model)
- **screener-api/screener-frontend**: Public/anonymous access
- **library-api**: No authentication (standalone utility)

### Technology Stack

**Backend (All APIs)**:
- **builder-api**: Quarkus 3.23.0, Java 21, KIE DMN 10.0.0
- **screener-api**: Quarkus 3.23.0, Java 21, KIE DMN 10.0.0
- **library-api**: Quarkus 2.16.10, Java 17, Kogito 1.44.1

**Frontend**:
- **Framework**: Solid.js (reactive JavaScript framework)
- **Form Builder/Renderer**: Form-JS (BPMN.io)
- **DMN Editor**: DMN-JS + Kogito Tooling
- **Styling**: Tailwind CSS

**Infrastructure**:
- **Dev Environment**: Devbox (Nix-based) or Devcontainer
- **Process Management**: process-compose
- **Cloud Services**: Firebase (Auth, Firestore, Cloud Storage)
- **Database**: SQLite (embedded for reference data)

## Development Workflow

### Working with DMN Files

**In library-api** (Kogito):
1. Add/edit DMN file in `library-api/src/main/resources/`
2. Run `quarkus dev` - Kogito auto-generates REST endpoints
3. Check `/q/swagger-ui` for new endpoints
4. Test with Bruno: `cd library-api/test/bdt && bru run`

**In builder-api** (Manual):
1. Create eligibility check via builder-frontend UI
2. Upload DMN file through UI (stores in Cloud Storage)
3. builder-api compiles DMN on-demand during evaluation
4. Publish screener to create pre-compiled artifact

**DMN Editing**:
- Use VS Code extension: [DMN Editor](https://marketplace.visualstudio.com/items?itemName=kie-group.dmn-vscode-extension)
- Learn DMN basics: https://learn-dmn-in-15-minutes.com/
- Access raw XML: Right-click → "Reopen with Text Editor"

### Firebase Emulators

The project uses Firebase emulators for local development:

```bash
# Start emulators (automatically imports data from ./emulator-data)
firebase emulators:start --project demo-bdt-dev --only auth,firestore,storage

# Export current state
firebase emulators:export ./emulator-data

# Access UIs:
# - Auth UI: http://localhost:4000/auth
# - Firestore UI: http://localhost:4000/firestore
# - Storage UI: http://localhost:4000/storage
```

### Environment Configuration

The project uses `.env` files for configuration:

```bash
# Root .env (loaded by devbox)
# See .env.example for template

# Service-specific .env files
builder-api/.env
builder-frontend/.env
screener-api/.env
screener-frontend/.env

# Setup script copies .env.example → .env
bin/setup
```

### Working with Individual Services

**builder-api**:
- Port: Configured via `QUARKUS_HTTP_PORT` env var
- Debug port: 5005
- Main classes: `ScreenerResource`, `DecisionResource`, `KieDmnService`
- Tests: `mvn test` (some tests may be skipped in CI)

**builder-frontend**:
- Dev server: `npm run dev`
- Key components: `ProjectEditor`, `KogitoDmnEditorView`, `FormEditor`
- API client: `src/api/` (uses `authFetch` wrapper)

**screener-api**:
- Port: Configured via `QUARKUS_HTTP_PORT` env var
- Debug: Disabled by default in process-compose
- Main classes: `ScreenerResource`, `DecisionResource`
- Lightweight (minimal business logic)

**screener-frontend**:
- Dev server: `npm run dev`
- Main component: `Screener.tsx` (form + results)
- No authentication required

### Common Development Scenarios

**Add a new benefit to library-api**:
1. Create DMN file in `library-api/src/main/resources/benefits/`
2. Import BDT.dmn for shared types and utilities
3. Define Decision Service in DMN
4. Run `quarkus dev` - endpoint auto-generated
5. Test with Bruno or Swagger UI

**Create a custom screener**:
1. Start all services: `devbox services up`
2. Open builder-frontend (typically http://localhost:5173)
3. Create project → Edit form → Add/configure benefits → Preview → Publish
4. Access published screener via screener-frontend

**Debug DMN evaluation issues**:
1. Check DMN syntax in VS Code with DMN extension
2. Review Swagger UI for expected input/output schemas
3. Use Quarkus dev mode logs (shows DMN evaluation details)
4. Test individual decisions via Swagger UI before integrating

**Modify an existing DMN in library-api**:
1. Edit DMN file (XML or via VS Code extension)
2. Save file - Quarkus dev mode auto-reloads
3. Re-run Bruno tests to verify changes
4. No manual compilation needed (Kogito handles it)

## Deployment

### library-api Deployment to Google Cloud Run

library-api uses a semantic versioning workflow that keeps git tags, pom.xml version, Docker image tags, and Cloud Run revision names synchronized.

**Deployment Workflow**:
```bash
# 1. Create a release (updates pom.xml + creates git tag atomically)
cd library-api
./bin/tag-release 0.2.0

# 2. Review the changes
git show

# 3. Push the commit and tag
git push origin <branch-name>
git push origin library-api-v0.2.0
```

When you push a tag matching `library-api-v*`, GitHub Actions automatically:
1. Extracts version from pom.xml using Maven
2. Validates the git tag matches the pom.xml version
3. Builds the Quarkus application
4. Builds and pushes Docker images with both `:v0.2.0` and `:latest` tags
5. Deploys to Cloud Run with revision name `library-api-v0-2-0`

**Version Management**:
- **Source of truth**: `pom.xml` version field
- **Git tags**: `library-api-v{version}` (e.g., `library-api-v0.2.0`)
- **Docker tags**: `:v{version}` and `:latest` (e.g., `:v0.2.0`, `:latest`)
- **Cloud Run revisions**: `library-api-v{version-with-dashes}` (e.g., `library-api-v0-2-0`)

**Helper Scripts**:
- `library-api/bin/tag-release <version>`: Creates release atomically (updates pom.xml, commits, and tags)
- `bin/validate-library-api-version`: Validates that git tag exists for current pom.xml version

**Validation**:
The deployment has three layers of validation to ensure version sync:
1. **Primary**: `tag-release` script updates pom.xml and creates matching git tag atomically
2. **Secondary**: Git pre-push hook validates version before allowing tag push (optional, see setup below)
3. **Tertiary**: GitHub Actions workflow validates and fails if versions don't match

### Setting Up Git Pre-Push Hook (Optional)

To prevent accidental version mismatches locally, you can install a pre-push hook:

```bash
# Create the pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/usr/bin/env bash

# Validate library-api version before pushing tags
bin/validate-library-api-version --pre-push-hook

exit $?
EOF

# Make it executable
chmod +x .git/hooks/pre-push
```

This hook will:
- Intercept pushes of `library-api-v*` tags
- Validate that the tag version matches pom.xml version
- Block the push if versions don't match
- Provide helpful error messages with fix instructions

**Note**: Pre-push hooks are not committed to the repository. Each developer must set up their own hook.

### Deployment Infrastructure

**Google Cloud Project**: `benefit-decision-toolkit-play`
- **Region**: `us-central1`
- **Service Account**: `library-api-service-account@benefit-decision-toolkit-play.iam.gserviceaccount.com`
- **Container Registry**: `us-central1-docker.pkg.dev/benefit-decision-toolkit-play/benefit-decision-toolkit-play/library-api`
- **Max Instances**: 2
- **Authentication**: Unauthenticated (public API)

**Dockerfile**: `library-api/src/main/docker/Dockerfile.jvm`
- Uses Kogito builder and runtime images (version 1.44.1)
- Multi-stage build with optimized layers
- Java 17 runtime

## Important Constraints

**DMN Import Rules**:
- Imported decision services cannot have the same name, even if in different models
- Always namespace-qualify decision references when importing
- Check `library-api/CLAUDE.md` for detailed DMN import hierarchy

**Firebase Dependency**:
- builder-api and screener-api require Firebase configuration
- Use emulators for local dev (no real Firebase project needed)
- Production requires actual Firebase project setup

**Process Compose Dependencies**:
- Services start in order: firebase → APIs → frontends
- Check `process-compose.yml` for dependency chain
- APIs wait for "All emulators ready!" log message

**Devbox vs. Native**:
- Devbox ensures consistent dependency versions
- Native setup requires manual installation (see `devbox.json` for versions)
- direnv integration recommended for automatic environment loading
