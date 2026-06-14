# Domain: Authentication

This domain manages user identification, credentials verification, SSO session state, and local developer security overrides.

---

## 1. How It Works (Non-Technical Summary)
Users access the system by logging in with their organizational account (via Microsoft Entra ID). The application maintains active login sessions, ensuring that each user has access only to their authorized workspaces. In development environments, a specialized bypass button permits developers to sign in instantly as a pre-configured developer or administrative user, removing external authentication dependencies for local testing.

---

## 2. System Architecture & Workflows

```
   +-------------+       +---------------+       +------------------+
   |             |       |               |       |                  |
   | User Client | +---> |  NextAuth.js  | +---> | Azure AD SSO     |
   |             |       |               |       | (Microsoft Entra)|
   +-------------+       +-------+-------+       +------------------+
                                 |
                                 v
                         +---------------+
                         |               |
                         |  Prisma / DB  | (Creates or updates User)
                         |               |
                         +---------------+
```

### Developer Login Bypass Flow (Local Development Only)

```
   [Developer Sign-in Button]
              |
              v
     (NODE_ENV check)
     Is development? --(No)--> [Feature Hidden]
              |
            (Yes)
              v
   [CredentialsProvider] (email: "dev@example.com", isAdmin: "true")
              |
              v
   Prisma User Lookup
              |
   Does user exist?
      +----(No)----> [prisma.user.create] -> (Create user with isAdmin = true)
      |
     (Yes)
      +------------> [prisma.user.update] -> (Ensure isAdmin status is synchronized)
              |
              v
   [Establish NextAuth Session] -> Redirects to "/dashboard"
```

---

## 3. Technical Implementation & Business Rules

### Core Components
- **Auth Provider Configurations**: Defined in [auth.ts](file:///home/andres.julian/github/serve-it/src/lib/auth.ts) as `authOptions`.
- **Sign-In Controller UI**: Implemented in [page.tsx](file:///home/andres.julian/github/serve-it/src/app/auth/signin/page.tsx).

### Business Logic & Rules
1. **Azure Active Directory SSO**:
   - Authenticates users using Client ID (`AZURE_AD_CLIENT_ID`) and Secret (`AZURE_AD_CLIENT_SECRET`).
   - Maps successful SSO accounts to database `Account` and `User` records.
2. **Credentials Bypass (Development Only)**:
   - Configured only when `process.env.NODE_ENV === "development"`.
   - Directly maps credentials to local users.
   - Automatically provisions the database record if the `User` is missing.
   - Updates `isAdmin` property inline if the credential options deviate from the stored state.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `401 Unauthorized`       | Missing or expired session cookies/token. | Redirect browser to `/auth/signin`. |
| `Missing credentials`    | Developer credentials payload not received. | Confirm frontend sign-in submit values. |
| `PrismaClientKnownRequestError` | Database connectivity failure during auth lookup. | Ensure PostgreSQL container is running and healthy. |
