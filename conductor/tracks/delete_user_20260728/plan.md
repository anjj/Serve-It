# Implementation Plan: Permanent User Deletion and Data Purge

## Phase 1: Backend API Implementation
- [x] Task: Create `src/routes/api/admin/users/delete.tsx`
  - Implement POST handler wrapped with `withAdmin`.
  - Validate JSON payload, target user existence, confirmEmail match, self-deletion guard, and last-admin guard.
  - Delete User record via Prisma, invoking Cascade deletes for Session, Account, ApiKey, and UserCustomer.

## Phase 2: Frontend Implementation
- [x] Task: Update `src/routes/admin/users.tsx`
  - Add destructive Delete button.
  - Disable on logged-in admin's own row.
  - Add inline confirmation requesting email input to match target user's email.
  - Hook up TanStack Query mutation to call `POST /api/admin/users/delete`.

## Phase 3: Testing & Documentation
- [x] Task: Add unit and integration test suite under `src/test/api/admin/users/delete/route.test.ts`.
- [x] Task: Document endpoint and policies in `docs/domains/auth.md`.
