# Implementation Plan - Programmatic API File Updates (PATCH /api/v1/files)

## Phase 1: Test-Driven Development (TDD) - Red Phase

- [x] Task: Define and write failing unit tests for the PATCH endpoint (6c7193d)
    - [x] Add failing unit tests to src/test/api/v1/files/route.test.ts for 401 Unauthorized (missing/invalid Bearer token)
    - [x] Add failing unit tests for 403 Forbidden (invalid API key or inactive customer workspace)
    - [x] Add failing unit tests for 400 Bad Request (missing slug parameter in payload)
    - [x] Add failing unit tests for 400 Bad Request (no fields to update provided)
    - [x] Add failing unit tests for 404 Not Found (file with specified slug does not exist in workspace)
    - [x] Add failing unit tests for 200 OK (successful update of metadata only: title, tags, and/or custom metadata)
    - [x] Add failing unit tests for 200 OK (successful update of file content only: overwriting in Supabase storage)
    - [x] Add failing unit tests for 200 OK (successful update of both metadata and file content)
    - [x] Run vitest to confirm all new test cases fail (Red Phase)
- [~] Task: Conductor - User Manual Verification 'Phase 1: Test-Driven Development (TDD) - Red Phase' (Protocol in workflow.md)

## Phase 2: Endpoint Implementation & Verification - Green Phase

- [ ] Task: Implement the PATCH request handler for programmatic API
    - [ ] Add PATCH method export in src/app/api/v1/files/route.ts
    - [ ] Authenticate request using Bearer API Key and verify customer workspace is active
    - [ ] Parse request body as multipart/form-data using req.formData()
    - [ ] Extract slug and find the existing file in the database; return 404 if not found
    - [ ] Extract title, tags, metadata, and file; validate that at least one update field is present
    - [ ] Handle file content upload/overwrite in Supabase using uploadHtmlFile (upsert)
    - [ ] Update file record metadata and updatedAt in Prisma database
    - [ ] Return 200 OK with success indicator, updated file, and public URL
- [ ] Task: Verify functionality and run checks
    - [ ] Run test suite to verify that all new and existing tests pass (Green Phase)
    - [ ] Run ESLint to verify no code quality violations
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Endpoint Implementation & Verification - Green Phase' (Protocol in workflow.md)
