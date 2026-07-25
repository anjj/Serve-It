# Domain: File Storage & Management

This domain handles the ingestion, metadata cataloging, storage persistence, and deletion of HTML files within workspaces.

---

## 1. How It Works (Non-Technical Summary)
Workspace members can upload documents directly from their dashboards. The system processes these documents, validates that they are in HTML format, checks that the chosen URL slug is unique, and uploads the file to the cloud-native storage container (Supabase). The file's title, tags, and custom slug are stored in the database. Deleting a file cleans up both the metadata in the database and the physical file in storage.

---

## 2. Ingestion & Deletion Workflows

### File Ingestion (Upload) Flow

```
   [User Dashboard UI]
            |
      (File Chosen)
            |
   Validate: Extension = .html
            |
   Read contents as text (FileReader)
            |
   POST /api/workspace/[customer_slug]/files
            |
   Is Slug Unique in Workspace? --(No)--> [409 Conflict Error]
            |
          (Yes)
            v
   [Supabase Storage Service] -> Upload content to "tenants/[customerId]/files/[fileId].html"
            |
   Prisma: Create [File] Record in database
            |
   Refresh Dashboard File List
```

### File Deletion Flow

```
   [Click Delete File Button]
            |
   [Window Confirm Prompt] --(Cancel)--> [Abort]
            |
          (Yes)
            v
   DELETE /api/workspace/[customer_slug]/files { fileId }
            |
   Find database record
            v
   [Supabase Storage Service] -> Delete physical file via storage path
            |
   Prisma: Delete [File] Record from database
            |
   Refresh Dashboard File List
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **API Router**: `/api/workspace/[customer_slug]/files/route.ts` (Handles `GET`, `POST`, and `DELETE` requests).
- **Programmatic API Router**: `/api/v1/files/route.ts` (Handles `POST` uploads and `PATCH` updates).
- **Storage Wrapper**: [storage.ts](file:///home/andres.julian/github/serve-it/src/lib/storage.ts) (Wraps Supabase SDK calls `uploadHtmlFile`, `downloadFile`, and `deleteFile`).
- **Upload Component**: [UploadModal.tsx](file:///home/andres.julian/github/serve-it/src/components/UploadModal.tsx).
- **Workspace Dashboard**: [page.tsx](file:///home/andres.julian/github/serve-it/src/app/dashboard/[customer_slug]/page.tsx).

### Validation and Constraints
1. **File Type Restraint**: Only `.html` (or `text/html`) file types are accepted. The upload modal validates this extension locally, and the storage layer enforces `contentType: 'text/html'`.
2. **Slug Uniqueness**: A file's slug must be unique *per customer workspace*. This is checked in the backend via a unique index lookup on `customerId_slug`.
3. **Database-Storage Alignment**: Deleting a file must succeed in both Supabase Storage and Prisma Database. If the storage deletion fails, the handler errors out early to prevent orphaned files in bucket storage.

---

## 4. Storage Bucket Tenant Isolation (WI-6 audit, 2026-07-25)

The `serve-it` Supabase Storage bucket was audited directly against the live project:

- **Bucket is private** (`public: false`). There is no anonymous read path.
- **Zero `storage.objects` policies exist.** Combined with the private bucket, this is a
  deny-all for the `anon`/`authenticated` PostgREST-facing roles, mirroring the database
  RLS posture in `auth.md`.
- **The application talks to Storage exclusively via `SUPABASE_SERVICE_ROLE_KEY`**
  (`src/lib/supabase.ts`), which — like the Prisma table-owner role for Postgres —
  bypasses Storage's RLS entirely. This is the actual enforcement mechanism: only
  server-side code holding the service-role key can read or write objects.
- **Tenant isolation is by object-path convention, not by policy**: uploads always go
  to `tenants/<customerId>/files/<fileId>.html` (`uploadHtmlFile` in `storage.ts`), and
  every read goes through the workspace/serving routes, which already authorize the
  caller against that same `customerId` before calling `downloadFile`. Because there is
  no client-side/PostgREST access path at all (no policy would matter even if one
  existed), this is an accepted tradeoff rather than a gap: the path convention only
  needs to be trusted by the server code that already enforces workspace membership.
- **`getSignedUrl` (60s default TTL) exists but is dead code** — nothing in the app
  currently generates a signed URL; files are streamed through the Next.js server via
  `downloadFile()` instead. If a signed-URL flow is added later, keep the TTL short and
  bounded (it already is, by default) rather than introducing a long-lived link.

**Conclusion:** the tenant-isolation guarantee for stored files holds today, but it
rests on (a) the bucket being private, (b) zero permissive policies, and (c) every
caller reaching Storage through server code that has already checked workspace
membership. Any future feature that hands out `SUPABASE_SERVICE_ROLE_KEY`-backed access
to a less-trusted context, or adds a public/permissive policy, would need to re-derive
tenant isolation some other way (e.g. real per-path `storage.objects` policies).

---

## 5. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `400 Missing required fields` | Required parameters (title, slug, or file content) are empty. | Complete all fields in the Upload UI form. |
| `400 Missing fileId`     | The delete request payload did not include the targeted database ID. | Verify request payload structure. |
| `409 Slug already exists` | A file with this exact URL slug exists in the customer workspace. | Select a different slug for the document. |
| `404 File not found`     | The file to be deleted does not exist or belongs to another tenant. | Verify access rights and database ID mapping. |
