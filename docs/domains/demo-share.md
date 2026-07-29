# Domain: Temporary Demo Share (Anonymous 1-Hour Public Artifacts)

This domain covers the anonymous, unauthenticated flow for prospective users to try out Serve-it's static document serving without having to create or sign in to a workspace account.

---

## 1. How It Works (Non-Technical Summary)
An anonymous visitor can access the `/demo` landing page. They upload a single HTML file without logging in or being provisioned with a workspace. The system validates the file size and type, rate limits requests, and saves the file in the public "demo" workspace. The visitor is then shown a live, shareable URL *exactly once* alongside a live countdown timer. The uploaded document is hard-deleted from both the database and cloud storage exactly 1 hour after creation.

---

## 2. Ingestion & Expiry Flow Diagram

```
   [Anonymous Visitor on /demo]
                |
          (HTML Selected)
                |
       POST /api/demo/files
                |
        Check Size Limit (< 2MB) -------(No)------> [413 Payload Too Large]
                | (Yes)
       Check Ext (.html/.htm) ----------(No)------> [400 Bad Request]
                | (Yes)
     Check IP Rate Limit (< 5/hr) ------(No)------> [429 Too Many Requests]
                | (Yes)
    Check Global Active Limit (< 500) --(No)------> [503 Service Unavailable]
                | (Yes)
    Upload to Tenants/demo/files/
                |
    Prisma: Create file with expiresAt = now + 1hr
                |
    Return 21-char base64url slug with 201 Created and live URL
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **Public Upload Route**: `src/routes/api/demo/files.tsx` (Handles `POST` uploads).
- **Public Upload UI**: `src/routes/demo.tsx` (Provides file input, single-view URL card, and countdown timer).
- **Background Cleanup Route**: `src/routes/api/demo/sweep.tsx` (Handles background purging of expired records and files).
- **Scheduled Sweeper**: `.github/workflows/demo-sweep.yml` (Runs sweep via cron scheduler every 10 minutes).

### Rate Limiting and Quota Details
- **IP Rate Limit**: Checked by hashing the client's IP address (derived from `x-forwarded-for` or `x-real-ip`) using HMAC-SHA256 with `BETTER_AUTH_SECRET`. Limits to 5 uploads per hour.
- **Global Active Quota**: Checked against the active count of unexpired files in the "demo" workspace to limit the maximum storage footprint to 500 files.

### Deletion and Cleanup
- **Lazy Deletion**: When an expired file URL is requested via `/s/demo/<token>`, the server automatically catches the expiration, triggers a best-effort delete from Supabase storage and the database, and returns a `410 Gone` HTML page.
- **Sweeper Deletion**: The scheduled GHA workflow periodically triggers a POST request to `/api/demo/sweep` (authenticated via bearer token `DEMO_SWEEP_SECRET`) to delete up to 200 expired files per batch.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `413 Payload Too Large`  | Uploaded file exceeds the 2 MB maximum size constraint. | Choose a smaller, lightweight static HTML file. |
| `400 Bad Request`        | Uploaded file does not have `.html` or `.htm` extension, or is empty. | Choose a valid static HTML document. |
| `429 Too Many Requests`  | This IP address has exceeded the hourly limit (5 uploads). | Wait for the `Retry-After` window to reset. |
| `503 Service Unavailable`| The global active files quota has been reached (500 files). | Try again shortly once existing demo links expire. |
| `410 Gone`               | The requested demo link has expired past its 1-hour lifecycle. | Re-upload the file on `/demo` to get a new link. |
