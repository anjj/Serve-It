# Domain: API Keys & Ingestion

This domain governs automated, programmatic interactions with the workspace, enabling external systems (like Model Context Protocol servers or pipelines) to publish documents using secure API keys.

---

## 1. How It Works (Non-Technical Summary)
Developers can request API keys for their workspaces or for individual users. The system generates a cryptographically secure key prefixed with `sk_live_serve-it_` and shows it **once** to the developer. The database only retains a secure SHA-256 hash of the key. External systems can send programmatic `POST` requests to upload HTML files, or `PATCH` requests to update existing files and metadata, by passing their API key as a Bearer Token.

---

## 2. Security & Programmatic Ingestion Flows

### Secure Hashing & Verification Architecture

```
   [Generate Key Action]
             |
   rawKey = crypto.randomBytes(32)
   fullKey = "sk_live_serve-it_" + rawKey
             |
   keyHash = sha256(fullKey)
             |
   Store keyHash in DB <-----------------+
             |                           |
   Return fullKey to Admin ONLY ONCE     |
                                         |
                                         |
   [Incoming API Request]                |
   Header: Authorization: Bearer <key>   |
             |                           |
   Hash the provided token --------------+ (Lookup matching keyHash in DB)
             |
       Is hash found?
             +------(No)------> [403 Invalid API Key]
             |
           (Yes)
             v
      Retrieve Tenant Workspace
             v
      Complete File Ingestion
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **API Key Generation Router**: `/api/admin/apikeys/route.ts` (Handles `POST`).
- **Programmatic Ingestion Router**: `/api/v1/files/route.ts` (Handles `POST` uploads and `PATCH` updates).

### API Key Constraints & Hashing Scheme
1. **Uniqueness & Entropy**: API keys are built using 32 bytes of secure random bytes, formatted as hex (`64` characters).
2. **One-Time Exposure**: The raw key (`sk_live_serve-it_...`) is returned in the HTTP response body exactly once upon creation. It is never displayed or retrievable again.
3. **Database Security**: The database only stores `keyHash` (computed using standard SHA-256 hashing in hex format).
4. **Token Authentication Validation**: Programmatic requests MUST pass the key via `Authorization: Bearer sk_live_serve-it_...`. The backend extracts this token, hashes it, and queries the `ApiKey` table.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `401 Unauthorized`       | Missing or invalid `Authorization: Bearer ...` header. | Supply the API key in headers. |
| `403 Invalid API Key`    | The hashed key does not match any stored records. | Confirm the API key token value. |
| `403 Customer workspace is inactive` | The tenant workspace bound to this key has been deactivated. | Re-enable the customer workspace. |
| `409 Slug already exists`| A file with the requested slug already exists in this workspace. | Use a different slug parameter. |
