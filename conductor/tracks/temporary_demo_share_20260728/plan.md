# Execution Plan: Temporary Demo Share

## Phase 1: Database Migration
- Add `isDemo` to Customer model.
- Add `expiresAt` to File model.
- Add `DemoUploadLog` model for rate limiting.
- Run/generate Prisma migrations.

## Phase 2: Configuration & Helpers
- Define helper functions for checking rate limits, IPs, hashing, and token generation.

## Phase 3: Route Ingestion (POST /api/demo/files)
- Create anonymous file ingestion endpoint with size, file name, rate limiting, and global quota verification.

## Phase 4: Route Delivery (GET /s/demo/<token>)
- Update short URL serving routes to bypass authentication for demo workspace customers.
- Implement lazy deletion gates for expired links.

## Phase 5: Sweeper Background Cleanup
- Implement POST /api/demo/sweep and a scheduled cron GHA workflow.

## Phase 6: Frontend & Verification
- Add a secondary button to the landing page.
- Build /demo public upload/result views.
