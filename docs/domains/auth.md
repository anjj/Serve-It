# Domain: Authentication

This domain manages user identification, credentials verification, session state, the
Customer Portal shared-password login, and local developer overrides. It also documents
the database-level posture (Row Level Security) that every table in `public` relies on.

---

## 1. How It Works (Non-Technical Summary)
Employees sign in with Google or Microsoft (Azure AD / Entra ID) SSO. The application
maintains active login sessions, ensuring each user has access only to their authorized
workspaces. Separately, a workspace can also be entered directly with a shared
slug + password (the "Customer Portal") without any employee account — this is an
intentional second, independent way in, not a bug. In development, a bypass button lets
developers sign in instantly as a pre-configured user.

---

## 2. System Architecture & Workflows

```
   +-------------+       +---------------+       +------------------+
   |             |       |               |       |                  |
   | User Client | +---> |  better-auth  | +---> | Google / Azure AD|
   |             |       |               |       | (Microsoft Entra)|
   +-------------+       +-------+-------+       +------------------+
                                 |
                                 v
                         +---------------+
                         |               |
                         |  Prisma / DB  | (user / session / account / verification)
                         |               |
                         +---------------+
```

### Customer Portal Login (independent second grant path)

```
   [Client Authentication form: slug + password]
              |
              v
   POST /api/auth/customer-portal
              |
   Look up Customer by slug, bcrypt.compare(password, passwordHash)
              |
       Valid? --(No)--> [401 Invalid credentials]
              |
            (Yes)
              v
   Sign a small HMAC-signed cookie: { customerId, slug, exp }
   (NOT a better-auth session -- no User/UserCustomer row involved)
              |
              v
   Redirect to /documents/[slug]
```

### Developer Login Bypass Flow (Local Development Only)

```
   [Developer Sign-in Button]
              |
              v
     (NODE_ENV check)
     Is development? --(No)--> [Feature Hidden / 404]
              |
            (Yes)
              v
   POST /api/auth/dev-bypass
              |
   Prisma User Lookup by email
              |
   Does user exist?
      +----(No)----> better-auth signUpEmail (creates User + password Account)
      |
     (Yes)
      +------------> sync isAdmin if it differs
              |
              v
   better-auth signInEmail -> real DB-backed session, Set-Cookie forwarded
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **better-auth server config**: `src/lib/auth.ts` (`betterAuth(...)`), backed by the
  Prisma adapter against the `user` / `session` / `account` / `verification` tables.
- **Catch-all route**: `src/routes/api/auth/$.tsx` (`auth.handler(request)`)
  handles all better-auth endpoints (OAuth callbacks, session, sign-out, ...).
- **Client hooks**: `src/lib/auth-client.ts` wraps `better-auth/react`'s `useSession()`
  to also expose a `status` field (`"loading" | "authenticated" | "unauthenticated"`)
  for components that branch on it.
- **Customer Portal**: `src/lib/customer-portal-auth.ts` (sign/verify) and
  `src/routes/api/auth/customer-portal.tsx` (login / logout / status).
- **Unified request-time resolution**: `src/lib/auth-utils.ts` exports `resolveActor()`,
  `withAuth()`, `withAdmin()`. Every authenticated route resolves to exactly one
  `Actor`: `{ kind: "user", userId, isAdmin, ... }` or
  `{ kind: "customer", customerId, customerSlug }`. Nothing else grants access.

### Business Logic & Rules
1. **Google / Microsoft (Azure AD) SSO**: configured as better-auth `socialProviders`.
   Successful sign-in creates/links `user` + `account` rows. Azure AD / Entra ID is
   exposed via better-auth's `microsoft` provider (`AZURE_AD_TENANT_ID` supported).
2. **Customer Portal (shared workspace password)**: deliberately **not** part of the
   User/UserCustomer tenancy model (see `workspaces.md`). It is its own signed cookie,
   independently verified, scoped to exactly one `Customer` by slug. A Customer Portal
   session can never become `isAdmin` and can only read files for its own workspace
   (`src/routes/api/workspace/$customer_slug/files.tsx` GET, and the serving route);
   it cannot upload or delete files.
3. **Developer Bypass (Development Only)**: only registered when
   `process.env.NODE_ENV === "development"` (`emailAndPassword.enabled` in
   `src/lib/auth.ts` is gated the same way, so it doesn't exist as an attack surface in
   production at all).
4. **Admin User Deletion**: platform administrators (`isAdmin`) can permanently and irreversibly delete a user account (`POST /api/admin/users/delete`). Deletion cascades via Postgres foreign key constraints, safely purging the User row itself, along with all matching `Session`, `Account`, `ApiKey`, and `UserCustomer` workspace membership rows. The following checks are strictly enforced server-side:
   - Self-deletion is denied (cannot delete own active user account).
   - If the target user is an administrator, the platform must have at least one other administrator remaining (cannot delete the last remaining admin).
   - The admin must type and confirm the target's email address exactly to execute the delete payload.

### Row Level Security posture (deliberate, not an oversight)
All nine tables in `public` (`user`, `session`, `account`, `verification`, `Customer`,
`ApiKey`, `UserCustomer`, `File`, `_prisma_migrations`) have RLS **enabled with zero
policies**. This is the correct end state, not a gap to "fix" by adding permissive
policies:
- The application talks to Postgres exclusively through Prisma's `DATABASE_URL`, which
  connects as the table-owning role. **Table owners bypass RLS** in Postgres, so the
  app is unaffected.
- Nothing in this codebase uses `supabase-js`/PostgREST against these tables (only
  Supabase **Storage** is used via `supabase-js`, which is a separate authorization
  surface — see `files.md`).
- RLS-enabled-with-no-policy therefore means: **deny-all for `anon`/`authenticated`**
  (the roles PostgREST would use), while the app itself is untouched. If a future
  contributor finds this and is tempted to add a policy "to fix the lint," don't — the
  Supabase security advisor's `rls_enabled_no_policy` INFO lint for these tables is the
  intended state. A permissive policy would be the actual regression, since
  `account`, `ApiKey`, and `Customer.passwordHash` hold credential material.
- As defense in depth beyond RLS, `account`, `ApiKey`, and `Customer.passwordHash` also
  have their `anon`/`authenticated` table/column grants revoked outright (see
  `apikeys.md` and the `isolate_credential_tables` migration) so a stray permissive
  policy alone isn't enough to expose them.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `401 Unauthorized`       | Missing or expired session cookies/token, for either grant path. | Redirect browser to `/auth/signin`. |
| `401 Invalid credentials`| Customer Portal slug/password did not match. | Verify the workspace slug and shared password. |
| `PrismaClientKnownRequestError` | Database connectivity failure during auth lookup. | Ensure Postgres is reachable and `DATABASE_URL`/`DIRECT_URL` are correct. |
