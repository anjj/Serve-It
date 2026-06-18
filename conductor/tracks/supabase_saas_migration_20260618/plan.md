# Implementation Plan: Supabase SaaS Migration

## Phase 1: Environment and Prisma Configuration [checkpoint: 74cd6f1]
- [x] Task: Update environment variables 399720f
    - [ ] Add `DATABASE_URL` for connection pooling (port 6543, pgbouncer=true) to `.env` or `.env.local`
    - [ ] Add `DIRECT_URL` for direct connection (port 5432) to `.env` or `.env.local`
    - [ ] Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to new SaaS project values
- [x] Task: Update Prisma schema configuration f951064
    - [ ] Ensure `prisma/schema.prisma` uses `directUrl` pointing to `env("DIRECT_URL")`
    - [ ] Ensure `prisma/schema.prisma` datasource url points to `env("DATABASE_URL")`
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment and Prisma Configuration' (Protocol in workflow.md) 74cd6f1

## Phase 2: Database Migration & Verification
- [x] Task: Apply Prisma migrations to Supabase SaaS
    - [ ] Run `npx prisma db push` or `prisma migrate dev` to establish the schema in the new environment
- [ ] Task: Verify database connections and application startup
    - [ ] Write integration test or verify existing tests pass with the new database connection
    - [ ] Start the application locally and ensure it connects to the new database without errors
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Database Migration & Verification' (Protocol in workflow.md)
