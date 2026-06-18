# Specification: Supabase SaaS Migration

## Overview
Migrate the current self-hosted/local development environment to use the managed Supabase SaaS platform for database and storage services. The project will continue to use Prisma as the primary ORM, and we will be starting with a fresh database (no data migration required).

## Functional Requirements
- Update project environment variables to point to a new Supabase SaaS project.
- Configure Prisma to connect securely to the Supabase Postgres database (updating `DATABASE_URL` and `DIRECT_URL` as needed for connection pooling).
- Ensure Supabase Storage client initialization uses the new SaaS project URL and anon key.
- Verify that the application can successfully connect, create records, and upload files to the new SaaS environment.
- Run Prisma migrations against the new Supabase SaaS database to establish the schema.

## Non-Functional Requirements
- Ensure secure handling of the new SaaS API keys and connection strings (no hardcoded credentials).
- Maintain existing local development workflows where possible, or clearly document how to develop against the SaaS environment.

## Acceptance Criteria
- [ ] Application starts successfully with the new Supabase SaaS connection strings.
- [ ] Prisma schema is successfully deployed to the Supabase SaaS database.
- [ ] A test file upload successfully stores the file in the Supabase SaaS storage bucket.
- [ ] API endpoints interacting with the database continue to function as expected.

## Out of Scope
- Migrating existing data from the old environment to the new SaaS project.
- Replacing Prisma with the Supabase JS client for database interactions.
