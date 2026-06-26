## 2026-06-22 - [Sentinel] Prevent Error Message Information Leakage
**Vulnerability:** API routes were returning raw `error.message` strings in 500 HTTP responses, leaking internal database or system error details to clients.
**Learning:** Returning raw internal error messages in catch blocks is a significant information disclosure vulnerability that can give attackers insight into the backend systems.
**Prevention:** Always log the raw error internally using `console.error` and return a generic `Internal server error` message to the client.

## 2026-06-26 - [Sentinel] Prevent Path Traversal in File Uploads
**Vulnerability:** User-provided `slug` parameters in file upload/download operations (e.g., `/api/v1/files`, `/api/workspace/[customer_slug]/files`) were not strictly validated, leading to potential path traversal and arbitrary file overwrites when the file path is constructed.
**Learning:** Always sanitize and validate user input used to construct file paths, even when relying on a database or other internal storage systems.
**Prevention:** Use a strict regex validation `^[a-zA-Z0-9_-]+$` to ensure `slug` contains only allowed characters before passing it to path-constructing functions like `uploadHtmlFile`.
