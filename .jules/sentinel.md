## 2026-06-22 - [Sentinel] Prevent Error Message Information Leakage
**Vulnerability:** API routes were returning raw `error.message` strings in 500 HTTP responses, leaking internal database or system error details to clients.
**Learning:** Returning raw internal error messages in catch blocks is a significant information disclosure vulnerability that can give attackers insight into the backend systems.
**Prevention:** Always log the raw error internally using `console.error` and return a generic `Internal server error` message to the client.

## 2025-06-25 - Prevent Path Traversal in File Upload Slugs
**Vulnerability:** The application was not validating the `slug` parameter in file upload routes (`/api/workspace/[customer_slug]/files` and `/api/v1/files`). This could allow a malicious user to supply path traversal sequences like `../../` in the `slug` parameter, which would then be passed to the storage layer, potentially overwriting arbitrary objects in the Supabase Storage bucket outside of their intended directory.
**Learning:** Even when inputs are not used directly as file paths in the local filesystem, they can still be vulnerable to path traversal if they are used as keys or paths in object storage systems (like Supabase Storage or AWS S3).
**Prevention:** Always validate and sanitize user inputs that are used to construct storage paths or keys. Enforce strict regex validation (e.g., `/^[a-zA-Z0-9_-]+$/`) on parameters like `slug` to ensure they only contain safe characters and cannot be used to traverse directories.
