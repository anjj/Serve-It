# Specification: Multipart File Ingestion and Complex HTML Uploads

## 1. Goal
Refactor file ingestion routes (`/api/v1/files` and `/api/workspace/[customer_slug]/files`) to accept `multipart/form-data` instead of JSON payloads. This enables native binary file uploads (including complex, large HTML presentations like `golive_ai_framework_presentation.html` with inline scripts and assets) directly from API clients and the dashboard UI, reducing encoding overhead and enhancing reliability.

## 2. Requirements & User Stories
- **Multipart/Form-Data Support:**
  - Both the programmatic v1 endpoint (`POST /api/v1/files`) and workspace files endpoint (`POST /api/workspace/[customer_slug]/files`) must parse requests as multipart forms using `req.formData()`.
  - Accept form parameters:
    - `file`: The raw HTML file (validated to end with `.html` or have `text/html` mime type).
    - `title`: The document title string.
    - `slug`: The document unique URL slug.
    - `tags` (optional): Comma-separated list or JSON array string of tags.
    - `metadata` (optional): JSON string of custom metadata.
- **Frontend Refactoring:**
  - Update `UploadModal` to compile the form parameters into a `FormData` object and post it with appropriate content-type headers (letting the browser set the boundary).
- **Complex HTML Serving:**
  - Ensure large, complex HTML presentations containing inline styling, svg, CSS, or scripts (like `golive_ai_framework_presentation.html`) can be successfully uploaded, stored in Supabase, and rendered accurately by the short URL serving path (`/s/[customer_slug]/[file_slug]`).
- **Backward Compatibility & Validation:**
  - Validate required fields (`title`, `slug`, `file`). Return standard error responses (`400 Bad Request`, `409 Conflict`, etc.).

## 3. Technical Design
### 3.1 Backend Changes
- Modify `POST` handler in `src/app/api/workspace/[customer_slug]/files/route.ts` and `src/app/api/v1/files/route.ts`:
  - Call `await req.formData()`.
  - Extract the `file` field as a `File` object.
  - Read file text: `await file.text()`.
  - Parse `tags` (supporting JSON parsing or comma-splitting) and `metadata` (parsing as JSON).
  - Perform the existing validation, Supabase upload, and Prisma DB entry creation.
  
### 3.2 Frontend Changes
- Update `src/components/UploadModal.tsx`:
  - Instead of reading the file using `FileReader` on the client and JSON-serializing it, append the actual `File` object from the file input directly to a `FormData` instance:
    ```typescript
    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("file", file); // actual File object
    formData.append("tags", tags); // comma-separated string
    ```
  - Send `formData` in the `body` of the fetch request (do not set `Content-Type` header, as the browser will automatically set it to `multipart/form-data` with the correct boundary).

### 3.3 Testing Strategy
- Update backend API tests in `src/test/api/workspace/[customer_slug]/files/route.test.ts` to mock and invoke route handlers with FormData requests.
- Update frontend component tests in `src/test/components/UploadModal.test.tsx` to assert that FormData is compiled and submitted.
