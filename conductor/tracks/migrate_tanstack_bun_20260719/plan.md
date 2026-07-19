# Implementation Plan: Migrate Next.js Stack to TanStack & Bun

## Phase 1: Environment & Branch Initialization
- [ ] Task: Create and checkout migration git branch
    - [ ] Create and switch to branch `feature/migrate-tanstack-bun`
    - [ ] Verify clean git status before starting migration changes
- [ ] Task: Initialize Bun package manager and lockfile
    - [ ] Run `bun install` to generate `bun.lock`
    - [ ] Remove `pnpm-lock.yaml` and update package manager scripts in `package.json`
- [ ] Task: Configure Bun test runner
    - [ ] Configure `bun test` runner scripts and setup files
    - [ ] Verify existing test compatibility with `bun test`
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Environment & Branch Initialization' (Protocol in workflow.md)

## Phase 2: Framework & Tooling Setup
- [ ] Task: Update project dependencies for TanStack Start
    - [ ] Add `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`, and `vinxi`
    - [ ] Remove `next` and Next.js specific plugins from `package.json`
- [ ] Task: Configure Vinxi / TanStack Start compiler and bundler
    - [ ] Create `app.config.ts` (or `vite.config.ts`) for Vinxi / TanStack Start
    - [ ] Update `tsconfig.json` for TanStack Router file-based route generation and Bun types
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Framework & Tooling Setup' (Protocol in workflow.md)

## Phase 3: Route & Component Migration
- [ ] Task: Create root route and layout shell
    - [ ] Create `src/routes/__root.tsx` with layout, meta tags, and global styles
    - [ ] Wrap application with TanStack Query Client Provider and Auth provider
- [ ] Task: Migrate core pages and route hierarchy
    - [ ] Convert Next.js App Router pages (`src/app/`) to TanStack Start routes (`src/routes/`)
    - [ ] Update navigation links to use `Link` from `@tanstack/react-router`
- [ ] Task: Migrate public file-serving route
    - [ ] Convert public file handler `/s/[customer_slug]/[file_slug]` to TanStack Start route loader / server handler
    - [ ] Verify file stream response and short slug resolution
- [ ] Task: Migrate API routes and server functions
    - [ ] Convert API endpoints to TanStack Start server functions using `createServerFn`
    - [ ] Wire up TanStack Query hooks for data fetching and mutations
- [ ] Task: Migrate Auth.js / NextAuth authentication integration
    - [ ] Adapt authentication handler and session resolution for TanStack Start request context
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Route & Component Migration' (Protocol in workflow.md)

## Phase 4: Docker & GitHub Actions CI/CD Migration
- [ ] Task: Update Dockerfile for Bun compiler & runtime
    - [ ] Refactor `Dockerfile` multi-stage build using `oven/bun:alpine`
    - [ ] Configure build step using Bun compiler and runtime entrypoint
- [ ] Task: Update GitHub Actions workflows
    - [ ] Update `.github/workflows/` to set up Bun toolchain (`oven-sh/setup-bun`)
    - [ ] Update CI test, lint, and Docker build pipeline steps
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Docker & GitHub Actions CI/CD Migration' (Protocol in workflow.md)

## Phase 5: Verification & Quality Assurance
- [ ] Task: Execute test suite and verify quality gates
    - [ ] Run full test suite via `bun test`
    - [ ] Run type checking (`bun run check` / `tsc --noEmit`) and linting (`bun run lint`)
- [ ] Task: End-to-end functionality verification
    - [ ] Verify workspace navigation, API key management, file upload, and short URL serving
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Verification & Quality Assurance' (Protocol in workflow.md)
