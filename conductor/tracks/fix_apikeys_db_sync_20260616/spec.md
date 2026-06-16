# Specification: Fix API Keys Feature DB Sync & Tests

## Overview
The API Keys feature has been failing with a 500 error on `POST /api/admin/apikeys`. The root cause is suspected to be the database not being fully synchronized with the Prisma schema (specifically, the `ApiKey` table structure). This track addresses the database synchronization and introduces comprehensive unit tests for the administrative API Keys creation endpoint to prevent future regressions.

## Functional Requirements
1. **Database Synchronization:**
   - Ensure the PostgreSQL database contains the latest `ApiKey` model schema as defined in `prisma/schema.prisma`.
2. **API Keys Administration Endpoint (`POST /api/admin/apikeys`):**
   - **Authentication:** Restrict access to authenticated users with admin status (`isAdmin` flag in the session). Unauthorized requests must return `401 Unauthorized`.
   - **Input Validation:** Request payload must contain `name` and either `customerId` or `userId`. Missing fields must return `400 Bad Request`.
   - **Key Generation:** Generate a secure random 32-byte API key with prefix `sk_live_serve-it_`.
   - **Database Insertion:** Save the SHA-256 hash of the generated API key to the database under the `ApiKey` model, associating it with the specified customer and/or user.
   - **Response:** Return the raw API key *only once* in the JSON response, along with the created database record and `success: true`.
   - **Error Handling:** Any internal server errors during creation must return `500 Internal Server Error` with the error message.

## Acceptance Criteria
- Running `npx prisma db push` confirms the schema is in sync with the database.
- A new Vitest suite is created at `src/test/api/admin/apikeys/route.test.ts`.
- The tests achieve >80% coverage on `src/app/api/admin/apikeys/route.ts` and cover:
  - Unauthorized access (no session or user is not admin).
  - Validation failures (missing name, missing both customerId and userId).
  - Successful key generation, hashing, and database creation.
  - Correct formatting of the generated key with prefix `sk_live_serve-it_`.
  - Database persistence failure returning 500.
- All tests in the test suite pass.
