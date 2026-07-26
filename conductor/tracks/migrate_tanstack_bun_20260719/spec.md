# Specification: Migrate Next.js Stack to TanStack & Bun

## Overview
This track defines the full migration of the **Serve-it** application from its current Next.js 16 + pnpm architecture to a high-performance web stack powered by **TanStack Start** (including TanStack Router & TanStack Query) and **Bun** (as package manager, compiler, runtime engine, and test runner). 

Work for this track will be isolated on a dedicated Git branch (`feature/migrate-tanstack-bun`).

## Objectives & Scope
- **Git Branching:** Create and operate on a new migration branch (`feature/migrate-tanstack-bun`) to protect `main`.
- **Framework & Components Migration:** Replace Next.js (App Router) with **TanStack Start** (TanStack Router + Query). Migrate all UI components, layouts, pages, and API handlers required for full application feature parity.
- **Bun Compiler & Package Manager:** Switch package management from `pnpm` to `bun`, leveraging `bun` as the primary compiler, bundler, runtime, and script runner.
- **Docker & GitHub Actions:** Update `Dockerfile` and GitHub Actions workflows (`.github/workflows/`) to build container images using the Bun compiler and run CI checks with Bun.
- **Testing Infrastructure:** Switch unit and integration test runner to `bun test`.

## Functional Requirements
1. **Branch Setup:**
   - Initialize and checkout branch `feature/migrate-tanstack-bun`.
2. **Routing & Application Components:**
   - Migrate all Next.js App Router routes (`src/app/`) to TanStack Start routes under `src/routes/`.
   - Preserve custom workspace URLs (`/s/$customerSlug/$fileSlug`), layouts, and multi-tenant file serving logic.
   - Migrate all React components to use TanStack primitives where applicable.
3. **Data Fetching & API Handlers:**
   - Implement TanStack Query (`@tanstack/react-query`) for state, caching, and server function data fetching.
   - Convert API route handlers and server actions to TanStack Start server functions.
4. **Authentication & Database:**
   - Maintain NextAuth / Auth.js with Prisma adapter working inside TanStack Start server context.
5. **Docker & GitHub Actions CI/CD:**
   - Update `Dockerfile` to use official Bun runtime/compiler image (`oven/bun:alpine` or `oven/bun:latest`).
   - Update `.github/workflows/` scripts to execute `bun install`, `bun test`, `bun run lint`, and Docker container build/push using Bun.

## Non-Functional Requirements
- **Build Performance:** Utilize Bun compiler for faster build execution times.
- **Type Safety:** Maintain strict TypeScript type checking across all TanStack router parameters and server functions.
- **CI/CD Reliability:** Ensure GitHub Actions docker build pipeline completes cleanly.

## Acceptance Criteria
- [ ] Dedicated Git branch `feature/migrate-tanstack-bun` created and active.
- [ ] Dependencies installed cleanly via `bun install` without legacy `pnpm-lock.yaml`.
- [ ] All application UI pages, components, and file-serving endpoints work under TanStack Start.
- [ ] `bun test` passes for unit/integration tests.
- [ ] Updated `Dockerfile` builds a working image using the Bun compiler.
- [ ] GitHub Actions workflows updated and validated for Bun build/test/docker steps.

## Out of Scope
- Modifying underlying PostgreSQL schema or Prisma model definitions.
- Adding unrelated product features outside of stack migration.
