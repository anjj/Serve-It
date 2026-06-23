## 2026-06-22 - [Sentinel] Prevent Error Message Information Leakage
**Vulnerability:** API routes were returning raw `error.message` strings in 500 HTTP responses, leaking internal database or system error details to clients.
**Learning:** Returning raw internal error messages in catch blocks is a significant information disclosure vulnerability that can give attackers insight into the backend systems.
**Prevention:** Always log the raw error internally using `console.error` and return a generic `Internal server error` message to the client.
