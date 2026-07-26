# Domain: Authentication

This domain manages user identification, credentials verification, SSO session state, and local developer security overrides.

---

## 1. How It Works (Non-Technical Summary)
Users access the system by logging in with their organizational account (via Microsoft Entra ID or Google), or as a Customer Portal client with a slug + password. The application maintains active login sessions, ensuring that each user has access only to their authorized workspaces. In development environments, a specialized bypass button permits developers to sign in instantly as a pre-configured developer or administrative user, removing external authentication dependencies for local testing.

---

## 2. System Architecture & Workflows

```
   +-------------+       +---------------+       +------------------+
   |             |       |               |       |                  |
   | User Client | +---> |  better-auth  | +---> | Google / Microsoft|
   |             |       |               |       | Entra ID SSO      |
   +-------------+       +-------+-------+       +------------------+
                                 |
                                 v
                         +---------------+
                         |               |
                         |  Prisma / DB  | (Creates or updates `user`)
                         |               |
                         +---------------+
```

### Customer Portal Flow

The Customer Portal (slug + password) is a separate credential flow layered on top of better-auth's email/password pipeline. Each `Customer` with a configured password is mirrored into a `user` row (a synthetic, never-emailed address of the form `<slug>@customers.internal`, `role: "CUSTOMER"`, `customerSlug` set) with a matching credential `account`, kept in sync with `Customer.passwordHash` on every sign-in attempt. `Customer.passwordHash` remains the source of truth; the mirror exists purely so the login can reuse better-auth's tested session/cookie machinery.

```
   [Customer Portal form: slug + password]
              |
              v
   POST /api/auth/customer-sign-in
              |
   Look up Customer by slug, check isActive
              |
   Ensure mirrored `user` + credential `account` exist,
   with account.password synced from Customer.passwordHash
              |
   auth.api.signInEmail({ email: "<slug>@customers.internal", password })
              |
   [Session cookie set] -> Redirect to "/documents/<slug>"
```

### Developer Login Bypass Flow (Local Development Only)

```
   [Developer Sign-in Button]
              |
              v
     (NODE_ENV check)
     Is development? --(No)--> [403, endpoint disabled]
              |
            (Yes)
              v
   POST /api/auth/sign-in/dev-bypass (email: "dev@example.com", isAdmin: true)
              |
              v
   Prisma User Lookup
              |
   Does user exist?
      +----(No)----> [internalAdapter.createUser] -> (Create user with isAdmin = true)
      |
     (Yes)
      +------------> [internalAdapter.updateUser] -> (Ensure isAdmin status is synchronized)
              |
              v
   [Session cookie set] -> Redirects to "/dashboard"
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **Auth Server Config**: [auth.ts](../../src/lib/auth.ts) — better-auth instance (Prisma adapter, Google + Microsoft social providers, bcrypt-backed email/password).
- **Dev Bypass Plugin**: [auth-dev-bypass-plugin.ts](../../src/lib/auth-dev-bypass-plugin.ts) — custom better-auth endpoint, development-only.
- **Customer Portal Helper**: [customer-auth.ts](../../src/lib/customer-auth.ts) — mirrors Customers into `user` rows and signs in via `auth.api.signInEmail`.
- **Server Guards**: [auth-utils.ts](../../src/lib/auth-utils.ts) — `withAuth`/`withAdmin` wrappers for server routes, backed by `auth.api.getSession`.
- **Auth Handler Mount**: [$.tsx](../../src/routes/api/auth/$.tsx) — catch-all server route delegating to `auth.handler`.
- **Sign-In UI**: [signin.tsx](../../src/routes/auth/signin.tsx).
- **Client Session**: [auth-client.ts](../../src/lib/auth-client.ts) — `better-auth/react` client, used via `useSession()`/`signOut()`.

### Business Logic & Rules
1. **Google / Microsoft Entra SSO**:
   - Authenticates users via `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and `AZURE_AD_CLIENT_ID`/`AZURE_AD_CLIENT_SECRET`/`AZURE_AD_TENANT_ID`.
   - Maps successful SSO accounts to database `account` and `user` records; new users default to `role: "FULL"`, `isAdmin: false`.
2. **Credentials Bypass (Development Only)**:
   - Configured only when `process.env.NODE_ENV === "development"`; the endpoint throws `FORBIDDEN` otherwise.
   - Directly maps credentials to local users.
   - Automatically provisions the database record if the `user` is missing.
   - Updates `isAdmin` property inline if the credential options deviate from the stored state.
3. **Customer Portal**:
   - Only active Customers (`isActive: true`) with a configured `passwordHash` can sign in.
   - Session carries `role: "CUSTOMER"` and `customerSlug`, used to scope workspace access.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `401 Unauthorized`       | Missing or expired session cookies/token. | Redirect browser to `/auth/signin`. |
| `401 Invalid credentials` (Customer Portal) | Slug/password mismatch, inactive customer, or missing password hash. | Verify slug and password; check `Customer.isActive`. |
| `403 FORBIDDEN` (dev bypass) | Dev bypass endpoint called outside `NODE_ENV=development`. | Only available in local development. |
| `PrismaClientKnownRequestError` | Database connectivity failure during auth lookup. | Ensure PostgreSQL container/connection is healthy. |
