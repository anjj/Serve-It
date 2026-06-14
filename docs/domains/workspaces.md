# Domain: Workspaces & Multi-Tenancy

This domain governs tenant separation, workspace isolation, customer workspace provisioning, and user-to-workspace membership controls.

---

## 1. How It Works (Non-Technical Summary)
The application acts as a multi-tenant platform where files are siloed inside isolated logical boundaries called **Workspaces** (modeled internally as `Customer`). Users can belong to one or more workspaces. Platform Administrators (`isAdmin`) can provision new workspaces, configure users to belong to workspaces, change roles, or revoke access. Standard users can only view or manage files inside workspaces they are members of.

---

## 2. Multi-Tenant Relationship & Access Flow

### Relationship Schema

```
   +------------------+         +------------------+         +------------------+
   |                  |         |   UserCustomer   |         |                  |
   |      User        | 1 <---> *  (Membership)    * <---> 1 |    Customer      |
   |                  |         |                  |         |  (Workspace)     |
   +------------------+         +------------------+         +--------+---------+
                                                                      |
                                                                      v
                                                             +--------+---------+
                                                             |                  |
                                                             |      File        |
                                                             | (Siloed in DB)   |
                                                             +------------------+
```

### Access Authorization Flow

```
   [User Requests Access to Workspace "foo"]
                   |
         Is session user Admin?
            +------(Yes)------> [Access Granted]
            |
           (No)
            v
   Find membership in UserCustomer for (userId, customerId)
            |
      Does membership exist?
            +------(Yes)------> [Access Granted]
            |
           (No)
            v
     [Access Denied (403)]
```

---

## 3. Technical Implementation & Business Rules

### Core Database Models (Prisma)
- **`Customer`**: Represents a workspace. Unique key is `slug` (used for routing `/dashboard/[customer_slug]`). Contains an `isActive` flag.
- **`UserCustomer`**: Association mapping resolving the many-to-many relationship between `User` and `Customer`. Enforces unique constraint `@@unique([userId, customerId])`.

### Controllers & Endpoints
- **Workspace Verification & Listing**: `/api/user/workspaces` ([Navbar.tsx](file:///home/andres.julian/github/serve-it/src/components/Navbar.tsx) reads this to populate selection list).
- **Workspace Administration**:
  - `POST /api/admin/customers`: Create a new workspace.
  - `POST /api/admin/users/assign`: Associate a user to a workspace.
  - `POST /api/admin/users/role`: Modify user platform roles (e.g. toggling `isAdmin`).
  - `POST /api/admin/users/revoke`: Remove a user's membership from a workspace.

### Core Security Check Logic
Any endpoint requesting workspace data MUST verify:
1. That the `Customer` workspace exists (`404 Not Found`).
2. That the authenticated user is a platform administrator OR has a corresponding `UserCustomer` record matching the customer workspace ID.

---

## 4. Diagnostics & Error Handling

| Technical Error / Status | Business Context / Meaning | Next Steps / Mitigation |
|--------------------------|----------------------------|-------------------------|
| `401 Unauthorized`       | User is not authenticated. | Re-direct to login. |
| `403 Access denied`      | User is authenticated but is not a member of the requested workspace. | Show access warning/workspace request page. |
| `404 Workspace not found`| The requested customer slug does not exist in the database. | Redirect to general dashboard or select page. |
| `500 Internal Error`     | Database unique constraint violation (e.g. user already assigned). | Display specific descriptive error to Admin. |
