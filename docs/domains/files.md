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
- **Storage Wrapper**: [storage.ts](file:///home/andres.julian/github/serve-it/src/lib/storage.ts) (Wraps Supabase SDK calls `uploadHtmlFile`, `downloadFile`, and `deleteFile`).
- **Upload Component**: [UploadModal.tsx](file:///home/andres.julian/github/serve-it/src/components/UploadModal.tsx).
- **Workspace Dashboard**: [page.tsx](file:///home/andres.julian/github/serve-it/src/app/dashboard/[customer_slug]/page.tsx).

### Validation and Constraints
1. **File Type Restraint**: Only `.html` (or `text/html`) file types are accepted. The upload modal validates this extension locally, and the storage layer enforces `contentType: 'text/html'`.
2. **Slug Uniqueness**: A file's slug must be unique *per customer workspace*. This is checked in the backend via a unique index lookup on `customerId_slug`.
3. **Database-Storage Alignment**: Deleting a file must succeed in both Supabase Storage and Prisma Database. If the storage deletion fails, the handler errors out early to prevent orphaned files in bucket storage.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `400 Missing required fields` | Required parameters (title, slug, or file content) are empty. | Complete all fields in the Upload UI form. |
| `400 Missing fileId`     | The delete request payload did not include the targeted database ID. | Verify request payload structure. |
| `409 Slug already exists` | A file with this exact URL slug exists in the customer workspace. | Select a different slug for the document. |
| `404 File not found`     | The file to be deleted does not exist or belongs to another tenant. | Verify access rights and database ID mapping. |
