# Domain: MCP Integration

This domain covers the Model Context Protocol (MCP) integration layer, enabling AI assistants and automated agents to interact with Serve-it workspaces programmatically through standardized MCP tool interfaces.

---

## 1. How It Works (Non-Technical Summary)

Serve-it exposes its file management capabilities as MCP-compatible tools, allowing AI assistants (such as ChatGPT, Claude, or Cursor) to upload and update files within a customer workspace on behalf of the user. Authentication is handled through the existing API Key system — the administrator provides their `sk_serve_` API key as a Bearer token during MCP client configuration, and the AI assistant uses this token for all subsequent operations. Each tool call is automatically scoped to the workspace associated with the API key.

---

## 2. MCP Architecture & Tool Exposure

### Integration Flow

```
   [AI Assistant / MCP Client]
            |
   Configured with:
     - MCP Server URL (Serve-it endpoint)
     - Bearer Token (sk_serve_... API Key)
            |
   [MCP Tool Call] ──────────────────────────────────┐
     e.g., upload_file(title, slug, file, tags)      |
            |                                        |
   [Serve-it MCP Server]                             |
     Receives tool call via MCP SDK                  |
            |                                        |
   [API Key Validation]                              |
     Authorization: Bearer <sk_serve_...>            |
     Hash key → lookup in ApiKey table               |
            |                                        |
      Key valid?                                     |
        +──(No)──> [Error: Invalid API Key]          |
        |                                            |
      (Yes)                                          |
        v                                            |
   Resolve Customer Workspace ───────────────────────┘
        |
   Execute File Operation
     - POST: Upload new file to Supabase storage
     - PATCH: Update existing file content/metadata
        |
   Return result to AI assistant
     - File record + public URL
```

### Exposed MCP Tools

| Tool Name     | HTTP Method | Description                                             |
|---------------|-------------|---------------------------------------------------------|
| `upload_file` | `POST`      | Upload a new HTML file to the workspace with title, slug, tags, and optional metadata. |
| `update_file` | `PATCH`     | Update an existing file's content, title, tags, or metadata by slug. |

---

## 3. Technical Implementation & Business Rules

### Core Components
- **MCP SDK:** `@modelcontextprotocol/sdk` (v1.29.0+) provides the server-side protocol handling for tool registration and request/response marshalling.
- **File Operations Endpoint:** `src/app/api/v1/files/route.ts` — handles both `POST` (upload) and `PATCH` (update) operations.
- **Storage Layer:** `src/lib/storage.ts` — manages file persistence to Supabase object storage under tenant-isolated paths (`tenants/<customerId>/files/<slug>.html`).

### Authentication & Workspace Scoping
1. **Bearer Token Authentication:** All MCP tool calls authenticate via the `Authorization: Bearer sk_serve_...` header. The token is hashed with SHA-256 and matched against the `ApiKey` table.
2. **Workspace Isolation:** The API key resolves to a specific `Customer` record. All file operations are scoped to that customer's workspace — files are stored in tenant-specific Supabase paths and linked via `customerId` foreign keys.
3. **Active Workspace Requirement:** The resolved customer workspace must have `isActive: true`. Inactive workspaces reject all operations with a `403` status.

### File Upload Tool (`upload_file`)
- **Required Fields:** `title` (string), `slug` (string), `file` (HTML content as string or File object).
- **Optional Fields:** `tags` (JSON array or comma-separated string), `metadata` (JSON object).
- **Unique Constraint:** The `slug` must be unique within the customer workspace (`customerId + slug` composite unique key).
- **Storage Path:** Files are persisted to `tenants/<customerId>/files/<slug>.html` in Supabase storage.
- **Response:** Returns the created file record and its public URL (`/s/<customer_slug>/<file_slug>`).

### File Update Tool (`update_file`)
- **Required Fields:** `slug` (string) — identifies the file to update.
- **Optional Fields:** `title`, `file` (new content), `tags`, `metadata` — at least one must be provided.
- **Behavior:** Only the provided fields are updated; omitted fields remain unchanged.
- **Response:** Returns the updated file record and its public URL.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `401 Unauthorized`       | Missing or malformed `Authorization: Bearer ...` header in MCP client configuration. | Verify the API key is correctly set as the Bearer token in the MCP client settings. |
| `403 Invalid API Key`    | The provided API key does not match any stored hash. The key may be expired, revoked, or mistyped. | Generate a new API key from the admin panel and reconfigure the MCP client. |
| `403 API Key not associated with a customer` | The API key exists but is not linked to any customer workspace. | Associate the API key with a customer workspace via the admin panel. |
| `403 Customer workspace is inactive` | The workspace bound to this API key has been deactivated by an administrator. | Re-enable the customer workspace from the admin panel. |
| `400 Missing required fields` | The MCP tool call is missing one or more required parameters (`title`, `slug`, or `file` for uploads). | Ensure the AI assistant is providing all required fields in the tool call. |
| `404 File not found`     | The `slug` provided for an update does not match any existing file in the workspace. | Verify the slug value matches an existing file. |
| `409 Slug already exists` | A file with the requested slug already exists in this workspace (upload only). | Choose a different slug or use the update tool instead. |
| `500 Internal server error` | An unexpected server-side failure occurred during file processing or storage. | Check server logs for the detailed error message. Retry the operation. |
