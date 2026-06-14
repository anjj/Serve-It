# Specification: Programmatic API File Updates (PATCH /api/v1/files)

## 1. Goal
Implement a `PATCH` method on the programmatic files API route (`/api/v1/files`) to allow authorized API clients to update an existing file's metadata (title, tags, custom metadata) and/or replace its HTML content.

## 2. Requirements & User Stories
- **Auth and Validation**:
  - The endpoint must require Bearer API key authentication.
  - The target workspace is identified via the API key.
- **Identification & Modification**:
  - The file to be updated is identified by its unique `slug` passed in the `multipart/form-data` request payload.
  - Slug modification itself is out of scope (the URL slug remains immutable).
- **Field Updates**:
  - `title` (optional): Updates the document title.
  - `tags` (optional): JSON array or comma-separated list of tags to update.
  - `metadata` (optional): JSON string of custom metadata to update.
  - `file` (optional): HTML file to replace the existing file content. Overwrites the file at the existing storage path in Supabase.
- **Error Handling**:
  - Return `400 Bad Request` if `slug` is missing or no fields to update are provided.
  - Return `401 Unauthorized` for missing/invalid authorization header.
  - Return `403 Forbidden` for invalid API key or inactive customer workspace.
  - Return `404 Not Found` if the file with the specified slug does not exist in the workspace.

## 3. Technical Design
### 3.1 Route Handler Update
- Extend `src/app/api/v1/files/route.ts` to support the `PATCH` HTTP method.
- Use `req.formData()` to parse inputs.
- Query database for the existing file record by `customerId` and `slug`.
- If a new `file` is provided:
  - Call `uploadHtmlFile(customerId, slug, newContent)` to overwrite the existing file in Supabase storage using `upsert: true`.
- Update the database record using Prisma:
  - If a new `file` is provided, update `updatedAt` (and metadata fields if present).
  - Save the updated attributes into the `File` model.

## 4. Out of Scope
- Frontend UI dashboard modifications or updates to the workspace-specific files API (`/api/workspace/[customer_slug]/files`).
- Updating/modifying the file's `slug` itself.

## 5. Acceptance Criteria
- Valid `PATCH` request with correct API key and `slug` updates metadata and/or file contents successfully.
- Correct error codes returned for missing slug, unauthorized access, invalid keys, or non-existent files.
- Automated unit tests covering all success/failure scenarios.
