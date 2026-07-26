# Specification: Align Conductor Documentation with Bun & TanStack Stack

## Overview
This track aligns the Conductor definition, configuration, and developer guidelines with the actual codebase implementation. The codebase has migrated from Next.js (with NextAuth & pnpm) to a modern stack using TanStack Start, Vite, Vitest, Bun, and Better Auth. This track updates the project guidelines, product descriptions, tech stack, workflow definitions, and coding styleguides to accurately reflect the actual environment and tooling.

## Objectives & Scope
- Update `tech-stack.md` to document the current stack: TanStack Start, Vite, Vitest, Better Auth, Prisma, and Bun.
- Update `workflow.md` to specify development commands using Bun package manager (`bun install`, `bun run dev`, `bun run check`) and Vitest runner (`vitest`, `vitest run`).
- Update `product.md` to correct details on multi-tenancy URL routing structure (moving references from Next.js App Router to TanStack Router) and switch NextAuth references to Better Auth.
- Update `code_styleguides/` (specifically `general.md`, `typescript.md`, `javascript.md`) to align with TypeScript/ESNext under Bun, Vite, and TanStack.
- Mark the legacy migration track `Migrate Next.js Stack to TanStack & Bun` as completed in `tracks.md`.

## Functional Requirements
1. **Core Tech Stack Documentation Alignment:**
   - Update `conductor/tech-stack.md` to replace Next.js 16 + React 19 App Router references with TanStack Start, Vite, and Bun.
   - Replace NextAuth references with Better Auth (`better-auth`).
   - Reflect Tailwind CSS v4 integration with Vite (`@tailwindcss/vite`).
2. **Workflow Commands Alignment:**
   - Modify `conductor/workflow.md` developer commands section (Setup, Daily Development, Before Committing).
   - Change references from `npm` / `pnpm` to `bun` (e.g. `bun install`, `bun run dev`, `bun run lint`).
   - Replace test runner references with Vitest (`vitest run`, etc.) and clarify that code coverage targets (>80%) apply to Vitest coverage.
3. **Product Context Alignment:**
   - Modify `conductor/product.md` references of routes mapping from `src/app/` to `src/routes/`.
   - Update authentication references from NextAuth / OAuth to Better Auth.
4. **Code Styleguides Alignment:**
   - Align `conductor/code_styleguides/typescript.md` and others with TypeScript configuration under Vite and TanStack Router's route generation (`tsr`).
5. **Tracks Registry Update:**
   - Update the tracks list (`conductor/tracks.md`) to mark the migration track `Migrate Next.js Stack to TanStack & Bun` as completed (`[x]`).

## Acceptance Criteria
- [ ] `conductor/tech-stack.md` updated with accurate technology definitions.
- [ ] `conductor/workflow.md` updated with correct Bun-based commands and Vitest configurations.
- [ ] `conductor/product.md` updated with accurate path structures and authentication mechanisms.
- [ ] Style guides in `conductor/code_styleguides/` updated to match the project conventions.
- [ ] `conductor/tracks.md` tracks list updated, marking the previous migration track as complete.

## Out of Scope
- Making active code modifications or refactoring features in the application itself.
- Upgrading third-party dependencies.
