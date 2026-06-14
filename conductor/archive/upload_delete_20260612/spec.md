# Specification: Implement File Upload and Deletion in the Workspace Dashboard

## 1. Goal
Provide users with a web UI inside the customer workspace dashboard to upload HTML files and delete existing files, reducing reliance on the programmatic API key for routine management.

## 2. Requirements & User Stories
- **Manual File Upload:**
  - Users can select a file from their local machine or drag-and-drop a file to upload it.
  - The upload UI validates that the file is an HTML file (as our storage and serving layers are optimized for `.html` documents).
  - Users specify a Title and a custom Slug for the file. The slug must be unique within the customer workspace.
  - Optional tags can be added to the file.
  - Once uploaded successfully, the file appears immediately in the dashboard file list, and the user receives a success notification.
- **Manual File Deletion:**
  - Users can delete files by clicking a delete button next to any listed file.
  - A confirmation modal is shown before deletion to prevent accidental loss.
  - Deleting a file removes the database record and removes the actual file from Supabase storage.
- **Authorization & Isolation:**
  - Users must have access to the customer workspace to upload or delete files (matching existing GET permission logic).
  - Admins can perform these actions for any workspace.

## 3. Technical Design
### 3.1 Backend Changes
Update `src/app/api/workspace/[customer_slug]/files/route.ts` to include:
- **`POST` Handler:**
  - Verify user session and customer workspace membership (or admin status).
  - Parse request JSON body containing: `{ title, slug, fileContent, tags, metadata }`.
  - Validate parameters (required: title, slug, fileContent).
  - Check if a file with the same slug already exists for the customer workspace.
  - Call `uploadHtmlFile(customerId, slug, fileContent)` to upload the file to Supabase.
  - Call `prisma.file.create` to store the file metadata.
  - Return `{ success: true, file }`.
- **`DELETE` Handler:**
  - Verify user session and customer workspace membership (or admin status).
  - Parse request JSON containing `{ fileId }` or retrieve `fileId` via query parameters.
  - Fetch the file and ensure it belongs to the customer workspace.
  - Call `deleteFile(file.storagePath)` to delete the file from Supabase storage.
  - Call `prisma.file.delete` to remove the database record.
  - Return `{ success: true }`.

### 3.2 Frontend Changes
Update `src/app/dashboard/[customer_slug]/page.tsx`:
- **Upload Section:**
  - Add a collapse-expandable upload panel or modal.
  - Inputs: File selector (restricts to `.html`), Title text input, Slug text input, Tags input.
  - Implement form validation and display loading spinner during upload.
- **Delete Trigger:**
  - Add a Lucide Trash icon next to the "View Document" button on each file card.
  - On click, show a browser `confirm` modal or custom Tailwind modal: "Are you sure you want to delete this file?"
  - If confirmed, send a `DELETE` request, and trigger list refresh upon success.

### 3.3 Test Strategy
- **Testing Runner:** Install Vitest and set up unit tests.
- **Backend Tests:** Write unit tests for the workspace files API `POST` and `DELETE` handlers.
- **Frontend Tests:** Write unit/integration tests for the upload form submission and delete button triggers.
