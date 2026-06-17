# Implementation Plan: Fix Entra ID (Azure AD) Login Account Linkage Bug

## Phase 1: Schema Update & Migration [checkpoint: e831e74]
- [x] Task: Update prisma/schema.prisma (399079a)
    - Add `ext_expires_in Int?` to the `Account` model.
- [x] Task: Generate and Run Prisma Migration (399079a)
    - Run `npx prisma db push` to sync database with the schema.
- [x] Task: Run Existing Tests (399079a)
    - Ensure all existing tests pass with the new schema.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Schema Update & Migration' (Protocol in workflow.md) (e831e74)
