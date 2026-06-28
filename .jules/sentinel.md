## 2026-06-22 - [Sentinel] Prevent Error Message Information Leakage
**Vulnerability:** API routes were returning raw `error.message` strings in 500 HTTP responses, leaking internal database or system error details to clients.
**Learning:** Returning raw internal error messages in catch blocks is a significant information disclosure vulnerability that can give attackers insight into the backend systems.
**Prevention:** Always log the raw error internally using `console.error` and return a generic `Internal server error` message to the client.
## 2026-06-22 - [Sentinel] Prevent Path Traversal in File Uploads
**Vulnerability:** File upload endpoints (`/api/v1/files`, `/api/workspace/[customer_slug]/files`) were directly using the unsanitized `slug` parameter from the multipart form payload to form file storage paths.
**Learning:** Directly appending user-provided parameters to file paths can lead to path traversal vulnerabilities and allow attackers to overwrite arbitrary files or create files in unintended locations within the bucket.
**Prevention:** Always strictly validate user-provided parameters used in file paths (e.g., using regex `/^[a-zA-Z0-9_-]+$/` for slugs) before using them in file operations.
