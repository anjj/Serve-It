# Domain: API Keys & Ingestion

This domain governs automated, programmatic interactions with the workspace, enabling external systems (like Model Context Protocol servers or pipelines) to publish documents using secure API keys.

---

## 1. How It Works (Non-Technical Summary)
Admins can generate an API key for any user. The system generates a cryptographically secure key prefixed with `sk_live_serve-it_` and shows it **once** to the admin. The database only retains a secure SHA-256 hash of the key. An API key belongs to exactly one user (D4) and grants programmatic access to every workspace that user is a member of (or, if the user is a platform admin, every active workspace) — it is not pinned to a single workspace at creation time. External systems send programmatic `POST` requests to upload HTML files, or `PATCH` requests to update existing files and metadata, passing their API key as a Bearer Token **and** naming the target workspace on every call via `customer_slug`.

---

## 2. Security & Programmatic Ingestion Flows

### Secure Hashing & Verification Architecture

```
   [Generate Key Action] (admin picks a user)
             |
   rawKey = crypto.randomBytes(32)
   fullKey = "sk_live_serve-it_" + rawKey
             |
   keyHash = sha256(fullKey)
             |
   Store keyHash + userId in DB <-------+
             |                          |
   Return fullKey to Admin ONLY ONCE    |
                                        |
                                        |
   [Incoming API Request]               |
   Header: Authorization: Bearer <key>  |
   Body field: customer_slug            |
             |                          |
   Hash the provided token -------------+ (Lookup matching keyHash -> ApiKey.userId)
             |
       Is hash found?
             +------(No)------> [403 Invalid API Key]
             |
           (Yes)
             v
   Resolve Customer by customer_slug
             v
   Does ApiKey.user have UserCustomer membership there (or isAdmin)?
             +------(No)------> [403 User is not a member of this workspace]
             |
           (Yes)
             v
      Complete File Ingestion
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **API Key Generation Router**: `src/routes/api/admin/apikeys.tsx` (Handles `POST`; requires `{ name, userId }`).
- **Programmatic Ingestion Router**: `src/routes/api/v1/files.tsx` (Handles `POST` uploads and `PATCH` updates; requires a `customer_slug` form field on every call).

### API Key Constraints & Hashing Scheme
1. **Uniqueness & Entropy**: API keys are built using 32 bytes of secure random bytes, formatted as hex (`64` characters).
2. **One-Time Exposure**: The raw key (`sk_live_serve-it_...`) is returned in the HTTP response body exactly once upon creation. It is never displayed or retrievable again.
3. **Database Security**: The database only stores `keyHash` (SHA-256, hex) and `userId`. There is no `customerId` column on `ApiKey` — see D4 below.
4. **Ownership (D4)**: `ApiKey.userId` is required (`NOT NULL`); a key always belongs to exactly one `User`. The old, nullable `customerId` column has been dropped. Workspace scope is resolved **per request** against that user's `UserCustomer` memberships (or `isAdmin`), not fixed at key-creation time — this lets one key (e.g. for an MCP sidecar) act across every workspace its owning user can already reach, without minting a separate key per workspace.
5. **Token Authentication Validation**: Programmatic requests MUST pass the key via `Authorization: Bearer sk_live_serve-it_...` **and** a `customer_slug` field identifying the target workspace. The backend hashes the token, looks up the owning user, and checks that user's access to `customer_slug` before touching any file.
6. **Isolation from the API layer**: as defense in depth, `ApiKey` (and `account`, and `Customer.passwordHash`) have their PostgREST `anon`/`authenticated` grants revoked outright — see `auth.md`'s RLS section. Only the Prisma-owning role can read these tables.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `401 Unauthorized`       | Missing or invalid `Authorization: Bearer ...` header. | Supply the API key in headers. |
| `403 Invalid API Key`    | The hashed key does not match any stored records. | Confirm the API key token value. |
| `400 Missing required field: customer_slug` | The request didn't name a target workspace. | Include `customer_slug` in the form data. |
| `404 Workspace not found` | No `Customer` exists with that slug. | Check the slug spelling. |
| `403 Customer workspace is inactive` | The tenant workspace named by `customer_slug` has been deactivated. | Re-enable the customer workspace. |
| `403 User is not a member of this workspace` | The key's owning user has no `UserCustomer` membership there and isn't an admin. | Assign the user to that workspace, or use a key owned by a member/admin. |
| `409 Slug already exists`| A file with the requested slug already exists in this workspace. | Use a different slug parameter. |
