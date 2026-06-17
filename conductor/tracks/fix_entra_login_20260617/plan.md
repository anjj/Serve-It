# Implementation Plan: Fix Entra ID (Azure AD) Login Account Linkage Bug

## Phase 1: Schema Update & Migration
- [ ] Task: Update prisma/schema.prisma
    - Add `ext_expires_in Int?` to the `Account` model.
- [ ] Task: Generate and Run Prisma Migration
    - Run `npx prisma migrate dev --name add_ext_expires_in` to generate and apply the migration.
- [ ] Task: Run Existing Tests
    - Ensure all existing tests pass with the new schema.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Schema Update & Migration' (Protocol in workflow.md)
